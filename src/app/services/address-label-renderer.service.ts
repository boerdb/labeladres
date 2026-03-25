import { Injectable } from '@angular/core';
import JsBarcode from 'jsbarcode';
import { Persoon } from './personen';

@Injectable({
  providedIn: 'root'
})
export class AddressLabelRendererService {
  private readonly dotsPerMm = 8;
  private readonly printableWidthMm = 43;
  private readonly labelHeightMm = 80;
  // Door de rotatie in PrinterService is het ontwerpcanvas liggend.
  private readonly width = this.labelHeightMm * this.dotsPerMm;
  private readonly height = this.printableWidthMm * this.dotsPerMm;
  private readonly paddingX = 28;
  private readonly paddingY = 22;
  private readonly barcodeHeight = 64;
  private readonly barcodeGap = 18;

  renderPersoon(persoon: Persoon): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context kon niet worden gemaakt.');
    }

    const naam = `${persoon.voornaam} ${persoon.achternaam}`.trim();
    const adres = `${persoon.straat} ${persoon.huisnummer}`.trim();
    const plaats = `${persoon.postcode} ${persoon.woonplaats}`.trim();
    const barcodeValue = this.createBarcodeValue(persoon);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    const lines = [
      ...this.createWrappedLines(ctx, naam || 'Onbekende naam', 'bold 46px Trebuchet MS, Arial, sans-serif', 2, 50),
      ...this.createWrappedLines(ctx, adres || '-', '34px Trebuchet MS, Arial, sans-serif', 2, 38),
      ...this.createWrappedLines(ctx, plaats || '-', '34px Trebuchet MS, Arial, sans-serif', 2, 38),
    ];

    const barcodeCanvas = this.renderBarcode(barcodeValue);
    const totalHeight = this.getTotalHeight(lines) + this.barcodeGap + barcodeCanvas.height;
    let y = Math.max(this.paddingY, Math.round((this.height - totalHeight) / 2));

    for (const line of lines) {
      ctx.font = line.font;
      const textWidth = ctx.measureText(line.text).width;
      const x = Math.max(this.paddingX, Math.round((this.width - textWidth) / 2));
      ctx.fillText(line.text, x, y);
      y += line.lineHeight;
    }

    y += this.barcodeGap;
    const barcodeX = Math.round((this.width - barcodeCanvas.width) / 2);
    ctx.drawImage(barcodeCanvas, barcodeX, y);

    return canvas;
  }

  private createBarcodeValue(persoon: Persoon): string {
    const postcode = persoon.postcode.replace(/\s+/g, '').toUpperCase();
    const huisnummer = persoon.huisnummer.replace(/\s+/g, '').toUpperCase();
    const woonplaats = persoon.woonplaats.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);

    return `${postcode}-${huisnummer}-${woonplaats || 'ADR'}`;
  }

  private renderBarcode(value: string): HTMLCanvasElement {
    const barcodeCanvas = document.createElement('canvas');

    JsBarcode(barcodeCanvas, value, {
      format: 'CODE128',
      width: 2,
      height: this.barcodeHeight,
      margin: 0,
      displayValue: false,
      background: '#ffffff',
      lineColor: '#000000',
    });

    return barcodeCanvas;
  }

  private createWrappedLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    font: string,
    maxLines: number,
    lineHeight: number,
  ): Array<{ text: string; font: string; lineHeight: number }> {
    ctx.font = font;

    const maxWidth = this.width - this.paddingX * 2;
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      currentLine = word;
      if (lines.length === maxLines - 1) {
        break;
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
      let lastLine = lines[maxLines - 1];
      while (ctx.measureText(`${lastLine}...`).width > maxWidth && lastLine.length > 0) {
        lastLine = lastLine.slice(0, -1);
      }
      lines[maxLines - 1] = `${lastLine}...`;
    }

    return lines.map((line) => ({ text: line, font, lineHeight }));
  }

  private getTotalHeight(lines: Array<{ text: string; font: string; lineHeight: number }>): number {
    return lines.reduce((total, line) => total + line.lineHeight, 0);
  }
}
