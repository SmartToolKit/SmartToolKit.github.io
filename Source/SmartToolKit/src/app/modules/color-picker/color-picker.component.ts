import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, PLATFORM_ID, afterNextRender } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ColorEvent } from 'ngx-color';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import {
  ColorDrafts,
  ColorFormat,
  ColorFormats,
  RgbaValue,
  clamp,
  formatColorValue,
  getColorFormats,
  getColorName,
  getContrastLevel,
  getContrastRatio,
  getContrastText,
  normalizeRgba,
  parseColor,
  parseHexColor,
  rgbaToHex,
  rgbToCmyk,
  rgbToHsl,
  rgbToHsv
} from './color-picker.utils';

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(): Promise<EyeDropperResult>;
}

interface EyeDropperConstructor {
  new(): EyeDropperInstance;
}

type StatusType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPickerComponent implements OnDestroy {
  readonly defaultColor = '#e3096f';
  readonly storageKey = 'color-picker-recent-colors';
  readonly formats: ColorFormat[] = ['hex', 'rgba', 'hsla', 'hsva', 'cmyk'];
  readonly swatches = [
    { color: '#e3096f', name: 'Pink' },
    { color: '#7453fc', name: 'Purple' },
    { color: '#0dcaf0', name: 'Cyan' },
    { color: '#198754', name: 'Green' },
    { color: '#ffc107', name: 'Yellow' },
    { color: '#ff6b6b', name: 'Coral' },
    { color: '#20c997', name: 'Teal' },
    { color: '#ffffff', name: 'White' },
    { color: '#afafaf', name: 'Silver' },
    { color: '#404245', name: 'Charcoal' },
    { color: '#000000', name: 'Black' }
  ];

  selectedColor = this.defaultColor;
  private currentColor: RgbaValue = parseHexColor(this.defaultColor) ?? { r: 227, g: 9, b: 111, a: 1 };
  private contrastBackdrop: RgbaValue = { r: 40, g: 43, b: 47, a: 1 };
  drafts: ColorDrafts = this.createDrafts();
  recentColors: string[] = [];
  inputError = '';
  invalidFormat: ColorFormat | null = null;
  statusType: StatusType = 'info';
  statusMessage = '';
  statusVisible = false;

  private destroyed = false;
  private eyeDropperAvailable = false;
  private readonly isBrowser: boolean;

  constructor(
    private titleService: Title,
    private actionHelper: ActionHelperService,
    private fileHelper: FileHelperService,
    private changeDetector: ChangeDetectorRef,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle('Smart ToolKit - Color Picker');
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.destroyed) {
          this.restoreBrowserState();
        }
      });
    }
  }

  get pickerColor(): string {
    return rgbaToHex(this.currentColor, this.currentColor.a < 1);
  }

  get nativeHex(): string {
    return rgbaToHex(this.currentColor, false);
  }

  get rgbaValue(): string {
    return formatColorValue(this.currentColor, 'rgba');
  }

  get rgbColor(): string {
    return `rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})`;
  }

  get hslaValue(): string {
    return formatColorValue(this.currentColor, 'hsla');
  }

  get hslColor(): string {
    const hsl = rgbToHsl(this.currentColor);
    return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%)`;
  }

  get hsvaValue(): string {
    return formatColorValue(this.currentColor, 'hsva');
  }

  get hsvColor(): string {
    const hsv = rgbToHsv(this.currentColor);
    return `hsv(${Math.round(hsv.h)}, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%)`;
  }

  get cmykColor(): string {
    const cmyk = rgbToCmyk(this.currentColor);
    return `cmyk(${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(cmyk.y * 100)}%, ${Math.round(cmyk.k * 100)}%)`;
  }

  get alphaPercent(): number {
    return Math.round(this.currentColor.a * 100);
  }

  get contrastRatio(): number {
    return getContrastRatio(this.currentColor, this.contrastBackdrop);
  }

  get contrastText(): string {
    return getContrastText(this.currentColor, this.contrastBackdrop);
  }

  get contrastLevel(): string {
    return getContrastLevel(this.contrastRatio);
  }

  get colorName(): string {
    return getColorName(this.currentColor);
  }

  get canUseEyeDropper(): boolean {
    return this.eyeDropperAvailable;
  }

  get formatValues(): ColorFormats {
    return getColorFormats(this.currentColor);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  onPickerChange(event: ColorEvent): void {
    const rgb = event.color?.rgb;
    if (!rgb || ![rgb.r, rgb.g, rgb.b, rgb.a].every(Number.isFinite)) {
      return;
    }
    this.applyColor({ r: rgb.r, g: rgb.g, b: rgb.b, a: rgb.a }, false);
  }

  onPickerChangeComplete(): void {
    this.addRecentColor();
  }

  onNativeColorInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const color = parseHexColor(value);
    if (color) {
      this.applyColor(color, true);
    }
  }

  onFormatInput(format: ColorFormat, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.drafts[format] = input.value;
    this.inputError = '';
    this.invalidFormat = null;
    const color = parseColor(input.value, format);
    if (color) {
      this.applyColor(color, false, format);
    }
  }

  commitFormat(format: ColorFormat): void {
    const color = parseColor(this.drafts[format], format);
    if (!color) {
      this.invalidFormat = format;
      this.inputError = `${this.formatLabel(format)} value is invalid.`;
      this.changeDetector.markForCheck();
      return;
    }
    this.applyColor(color, true);
  }

  onFormatKeydown(format: ColorFormat, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitFormat(format);
    } else if (event.key === 'Escape') {
      this.syncDrafts();
      this.inputError = '';
    }
  }

  onAlphaInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isFinite(value)) {
      this.applyColor({ ...this.currentColor, a: clamp(value / 100, 0, 1) }, false);
    }
  }

  commitAlpha(): void {
    this.addRecentColor();
  }

  setSwatch(color: string): void {
    const parsed = parseHexColor(color);
    if (parsed) {
      this.applyColor(parsed, true);
      this.setStatus('success', `${color.toUpperCase()} selected.`);
    }
  }

  resetColor(): void {
    const color = parseHexColor(this.defaultColor);
    if (color) {
      this.applyColor(color, true);
      this.setStatus('info', 'Default color restored.');
    }
  }

  randomColor(): void {
    const bytes = new Uint8Array(3);
    if (this.isBrowser && window.crypto?.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      bytes.forEach((_, index) => bytes[index] = Math.floor(Math.random() * 256));
    }
    this.applyColor({ r: bytes[0], g: bytes[1], b: bytes[2], a: 1 }, true);
    this.setStatus('info', 'A random color was generated.');
  }

  async openEyeDropper(): Promise<void> {
    if (!this.isBrowser || !this.canUseEyeDropper) {
      this.setStatus('error', 'The EyeDropper API is not available in this browser.');
      return;
    }

    try {
      const browserWindow = window as unknown as Window & { EyeDropper: EyeDropperConstructor };
      const result = await new browserWindow.EyeDropper().open();
      const color = parseHexColor(result.sRGBHex);
      if (color) {
        this.applyColor(color, true);
        this.setStatus('success', 'Color picked from the screen.');
      }
    } catch (error: unknown) {
      const cancelled = error instanceof Error && error.name === 'AbortError';
      this.setStatus(cancelled ? 'info' : 'error', cancelled ? 'EyeDropper was cancelled.' : 'Screen color could not be selected.');
    }
  }

  async copyFormat(format: ColorFormat): Promise<void> {
    const color = parseColor(this.drafts[format], format);
    if (!color) {
      this.invalidFormat = format;
      this.inputError = `${this.formatLabel(format)} value is invalid.`;
      this.changeDetector.markForCheck();
      return;
    }

    this.applyColor(color, false);
    const copied = await this.actionHelper.copy(this.drafts[format]);
    this.setStatus(copied ? 'success' : 'error', copied
      ? `${this.formatLabel(format)} copied to the clipboard.`
      : `${this.formatLabel(format)} could not be copied.`);
  }

  async copyShareLink(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('color', this.selectedColor);
      window.history.replaceState({}, '', url);
      const copied = await this.actionHelper.copy(url.toString());
      this.setStatus(copied ? 'success' : 'error', copied ? 'Share link copied.' : 'Share link could not be copied.');
    } catch {
      this.setStatus('error', 'The share link could not be created.');
    }
  }

  downloadCssVariables(): void {
    const formats = this.formatValues;
    const content = [
      ':root {',
      `  --color-primary: ${formats.hex};`,
      `  --color-primary-rgb: ${formats.rgba};`,
      `  --color-primary-hsl: ${formats.hsla};`,
      `  --color-primary-cmyk: ${formats.cmyk};`,
      '}'
    ].join('\n');
    const fileName = `color-picker-${this.nativeHex.slice(1)}.css`;
    if (this.fileHelper.download(content, fileName)) {
      this.setStatus('success', 'CSS variables downloaded.');
    }
  }

  clearRecentColors(): void {
    this.recentColors = [];
    this.persistRecentColors();
    this.setStatus('info', 'Recent colors cleared.');
  }

  formatValue(format: ColorFormat): string {
    return this.drafts[format];
  }

  isFormatValid(format: ColorFormat): boolean {
    return !!parseColor(this.drafts[format], format);
  }

  formatLabel(format: ColorFormat): string {
    const labels: Record<ColorFormat, string> = {
      hex: 'HEX',
      rgba: 'RGBA',
      hsla: 'HSLA',
      hsva: 'HSVA',
      cmyk: 'CMYK'
    };
    return labels[format];
  }

  formatHint(format: ColorFormat): string {
    const hints: Record<ColorFormat, string> = {
      hex: '3, 4, 6 or 8 digits',
      rgba: 'rgb(r, g, b, a)',
      hsla: 'hsl(h, s%, l%, a)',
      hsva: 'hsv(h, s%, v%, a)',
      cmyk: 'cmyk(c%, m%, y%, k%)'
    };
    return hints[format];
  }

  private createDrafts(): ColorDrafts {
    const formats = getColorFormats(this.currentColor);
    return {
      hex: formats.hex,
      rgba: formats.rgba,
      hsla: formats.hsla,
      hsva: formats.hsva,
      cmyk: formats.cmyk
    };
  }

  private applyColor(value: RgbaValue, remember: boolean, preserveFormat?: ColorFormat): void {
    const preservedDraft = preserveFormat ? this.drafts[preserveFormat] : '';
    this.currentColor = normalizeRgba(value);
    this.selectedColor = formatColorValue(this.currentColor, 'hex');
    this.syncDrafts();
    if (preserveFormat) {
      this.drafts[preserveFormat] = preservedDraft;
    }
    if (remember) {
      this.addRecentColor();
    }
    this.changeDetector.markForCheck();
  }

  private syncDrafts(): void {
    this.drafts = this.createDrafts();
    this.inputError = '';
    this.invalidFormat = null;
  }

  private addRecentColor(): void {
    const color = formatColorValue(this.currentColor, 'hex');
    this.recentColors = [color, ...this.recentColors.filter(item => item !== color)].slice(0, 8);
    this.persistRecentColors();
  }

  private persistRecentColors(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recentColors));
    } catch {
      this.setStatus('error', 'Recent colors could not be saved in this browser.');
    }
  }

  private restoreBrowserState(): void {
    const browserWindow = window as Window & { EyeDropper?: EyeDropperConstructor };
    this.eyeDropperAvailable = typeof browserWindow.EyeDropper === 'function';
    const queryColor = new URLSearchParams(window.location.search).get('color');
    const parsedQueryColor = queryColor ? parseColor(queryColor, 'hex') : null;
    if (parsedQueryColor) {
      this.applyColor(parsedQueryColor, false);
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) {
        this.recentColors = parsed.filter((color): color is string => typeof color === 'string' && !!parseHexColor(color)).slice(0, 8);
      }
    } catch {
      this.recentColors = [];
    }
    this.changeDetector.markForCheck();
  }

  private setStatus(type: StatusType, message: string): void {
    if (this.destroyed) {
      return;
    }
    this.statusType = type;
    this.statusMessage = message;
    this.statusVisible = true;
    this.changeDetector.markForCheck();
  }
}
