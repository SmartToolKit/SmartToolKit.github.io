import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss']
})
export class ColorPickerComponent {

  constructor(private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit - Color Picker")
  }

  selectedColor: string = '#e3096f';

  get rgbColor(): string {
    const r = parseInt(this.selectedColor.slice(1, 3), 16);
    const g = parseInt(this.selectedColor.slice(3, 5), 16);
    const b = parseInt(this.selectedColor.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  get hslColor(): string {
    const r = parseInt(this.selectedColor.slice(1, 3), 16) / 255;
    const g = parseInt(this.selectedColor.slice(3, 5), 16) / 255;
    const b = parseInt(this.selectedColor.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number = 0, s: number = 0, l: number = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6; // Normalize to [0, 1]
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  get hsvColor(): string {
    const r = parseInt(this.selectedColor.slice(1, 3), 16) / 255;
    const g = parseInt(this.selectedColor.slice(3, 5), 16) / 255;
    const b = parseInt(this.selectedColor.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h: number = 0, s: number = 0, v: number = max;

    if (max !== 0) {
      s = d / max; // s = Δ / C
    }

    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6; // Normalize to [0, 1]
    }

    return `hsv(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(v * 100)}%)`;
  }

  get cmykColor(): string {
    const r = parseInt(this.selectedColor.slice(1, 3), 16) / 255;
    const g = parseInt(this.selectedColor.slice(3, 5), 16) / 255;
    const b = parseInt(this.selectedColor.slice(5, 7), 16) / 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;

    return `cmyk(${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%)`;
  }
}
