import { Injectable } from '@angular/core';
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
  private readonly textStartX = 40;

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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'top';

    const lines = [
      ...this.createWrappedLines(ctx, naam || 'Onbekende naam', 'bold 46px Trebuchet MS, Arial, sans-serif', 2, 50, 'center'),
      ...this.createWrappedLines(ctx, adres || '-', '34px Trebuchet MS, Arial, sans-serif', 2, 38, 'left'),
      ...this.createWrappedLines(ctx, plaats || '-', '34px Trebuchet MS, Arial, sans-serif', 2, 38, 'left'),
    ];

    const totalHeight = this.getTotalHeight(lines);
    let y = Math.max(this.paddingY, Math.round((this.height - totalHeight) / 2));

    for (const line of lines) {
      ctx.font = line.font;
      ctx.textAlign = line.align as CanvasTextAlign;
      if (line.align === 'center') {
        ctx.fillText(line.text, this.width / 2, y);
      } else {
        ctx.fillText(line.text, this.textStartX, y);
      }
      y += line.lineHeight;
    }

    return canvas;
  }

  private createWrappedLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    font: string,
    maxLines: number,
    lineHeight: number,
    align: 'left' | 'center' | 'right' = 'left'
  ): Array<{ text: string; font: string; lineHeight: number; align: string }> {
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

    return lines.map((line) => ({ text: line, font, lineHeight, align }));
  }

  private getTotalHeight(lines: Array<{ text: string; font: string; lineHeight: number; align: string }>): number {
    return lines.reduce((total, line) => total + line.lineHeight, 0);
  }
}
