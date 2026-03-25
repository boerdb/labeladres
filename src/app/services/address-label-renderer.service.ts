import { Injectable } from '@angular/core';
import { Persoon } from './personen';

@Injectable({
  providedIn: 'root'
})
export class AddressLabelRendererService {
  private readonly kixAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly dotsPerMm = 8;
  private readonly printableWidthMm = 43;
  private readonly labelHeightMm = 80;
  // Door de rotatie in PrinterService is het ontwerpcanvas liggend.
  private readonly width = this.labelHeightMm * this.dotsPerMm;
  private readonly height = this.printableWidthMm * this.dotsPerMm;
  private readonly paddingX = 28;
  private readonly paddingY = 22;
  private readonly barcodeHeight = 84;
  private readonly barcodeGap = 16;
  private readonly kixBarWidth = 6;
  private readonly kixBarGap = 3;
  private readonly kixTextGap = 8;

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
    const barcodeValue = this.createKixValue(persoon);

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

  private createKixValue(persoon: Persoon): string {
    const postcode = persoon.postcode.replace(/\s+/g, '').toUpperCase();
    const huisnummer = persoon.huisnummer.replace(/\s+/g, '').toUpperCase();
    const waarde = `${postcode}${huisnummer}`.replace(/[^A-Z0-9]/g, '');

    return waarde || 'POSTNL';
  }

  private renderBarcode(value: string): HTMLCanvasElement {
    const barcodeCanvas = document.createElement('canvas');
    const displayValue = `${value}${this.calculateChecksum(value)}`;
    const encoded = `S${displayValue}E`;
    const barCount = encoded.length * 4;
    const barcodeWidth = barCount * this.kixBarWidth + (barCount - 1) * this.kixBarGap;

    barcodeCanvas.width = barcodeWidth;
    barcodeCanvas.height = this.barcodeHeight + this.kixTextGap + 20;

    const ctx = barcodeCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Barcode canvas kon niet worden gemaakt.');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, barcodeCanvas.width, barcodeCanvas.height);
    ctx.fillStyle = '#000000';

    const states: string[] = [];
    for (const character of encoded.split('')) {
      states.push(...this.getKixPattern(character));
    }

    states.forEach((state: string, index: number) => {
      const x = index * (this.kixBarWidth + this.kixBarGap);
      const y = this.getBarY(state);
      const height = this.getBarHeight(state);
      ctx.fillRect(x, y, this.kixBarWidth, height);
    });

    ctx.font = 'bold 18px Trebuchet MS, Arial, sans-serif';
    ctx.textBaseline = 'top';
    const textWidth = ctx.measureText(displayValue).width;
    ctx.fillText(displayValue, Math.round((barcodeCanvas.width - textWidth) / 2), this.barcodeHeight + this.kixTextGap);

    return barcodeCanvas;
  }

  private getKixPattern(character: string): string[] {
    if (character === 'S') {
      return ['full', 'tracker', 'full', 'tracker'];
    }

    if (character === 'E') {
      return ['tracker', 'full', 'tracker', 'full'];
    }

    const normalized = character.toUpperCase();
    const index = this.kixAlphabet.indexOf(normalized);
    if (index === -1) {
      return ['tracker', 'tracker', 'tracker', 'tracker'];
    }

    return index
      .toString(4)
      .padStart(4, '0')
      .split('')
      .map((digit) => this.mapDigitToBarState(digit));
  }

  private mapDigitToBarState(digit: string): string {
    switch (digit) {
      case '0':
        return 'tracker';
      case '1':
        return 'ascender';
      case '2':
        return 'descender';
      default:
        return 'full';
    }
  }

  private calculateChecksum(value: string): string {
    const checksum = value
      .split('')
      .reduce((total, character) => {
        const index = this.kixAlphabet.indexOf(character);
        return total + Math.max(index, 0);
      }, 0) % this.kixAlphabet.length;

    return this.kixAlphabet[checksum];
  }

  private getBarY(state: string): number {
    switch (state) {
      case 'ascender':
        return 0;
      case 'descender':
        return Math.round(this.barcodeHeight * 0.42);
      case 'full':
        return 0;
      default:
        return Math.round(this.barcodeHeight * 0.22);
    }
  }

  private getBarHeight(state: string): number {
    switch (state) {
      case 'ascender':
        return Math.round(this.barcodeHeight * 0.58);
      case 'descender':
        return Math.round(this.barcodeHeight * 0.58);
      case 'full':
        return this.barcodeHeight;
      default:
        return Math.round(this.barcodeHeight * 0.36);
    }
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
