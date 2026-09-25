import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, PLATFORM_ID, ViewChild, afterNextRender } from '@angular/core';
import { Title } from '@angular/platform-browser';
import QRCodeStyling from 'qr-code-styling';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { QrModel, QrSection, QrStyleOptions, DEFAULT_QR_MODEL, createGradient, normalizeQrModel, toQrCodeOptions } from './qrcode-generator.utils';

type StatusType = 'info' | 'success' | 'error';

interface QrPreset {
  id: string;
  label: string;
  dotType: string;
  dotColor: string;
  cornerColor: string;
  background: string;
  gradientStart: string;
  gradientEnd: string;
}

@Component({
  selector: 'app-qrcode-generator',
  templateUrl: './qrcode-generator.component.html',
  styleUrls: ['./qrcode-generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrcodeGeneratorComponent {
  @ViewChild('canvas', { static: false }) canvas?: ElementRef<HTMLDivElement>;

  readonly sections: QrSection[] = ['Main Options', 'QR Options', 'Dots Options', 'Corners Square Options', 'Corners Dot Options', 'Background Options', 'Logo Options'];
  readonly maxImageSize = 2 * 1024 * 1024;
  readonly maxDataLength = 4096;
  readonly presets: QrPreset[] = [
    { id: 'classic', label: 'Classic', dotType: 'square', dotColor: '#111827', cornerColor: '#111827', background: '#ffffff', gradientStart: '#111827', gradientEnd: '#111827' },
    { id: 'blueprint', label: 'Blueprint', dotType: 'rounded', dotColor: '#0d6efd', cornerColor: '#0d6efd', background: '#ffffff', gradientStart: '#0d6efd', gradientEnd: '#80d2ff' },
    { id: 'sunset', label: 'Sunset', dotType: 'extra-rounded', dotColor: '#ff009d', cornerColor: '#ff8a00', background: '#fff7ed', gradientStart: '#ff009d', gradientEnd: '#ff8a00' },
    { id: 'midnight', label: 'Midnight', dotType: 'classy-rounded', dotColor: '#c4b5fd', cornerColor: '#67e8f9', background: '#111827', gradientStart: '#8f8bff', gradientEnd: '#67e8f9' }
  ];
  model: QrModel = structuredCloneQrModel();
  page: QrSection = 'Main Options';
  scale = 1;
  browserReady = false;
  statusType: StatusType = 'info';
  statusMessage = 'Enter data to generate a QR code.';

  private qrCode: QRCodeStyling | null = null;
  private destroyed = false;
  private readonly isBrowser: boolean;

  constructor(
    private titleService: Title,
    private changeDetector: ChangeDetectorRef,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle('Smart ToolKit - QR Code Generator');
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.destroyed) {
          this.qrCode = new QRCodeStyling();
          this.restoreState();
          this.browserReady = true;
          this.process();
        }
      });
    }
  }

  get hasImage(): boolean {
    return !!this.model.image;
  }

  get canExport(): boolean {
    return this.isValidData && !!this.qrCode;
  }

  get isValidData(): boolean {
    return !!this.model.data.trim() && this.model.data.length <= this.maxDataLength;
  }

  get dataLengthLabel(): string {
    return `${this.model.data.length.toLocaleString('en-US')} / ${this.maxDataLength.toLocaleString('en-US')}`;
  }

  get zoomLabel(): string {
    return `${Math.round(this.scale * 100)}%`;
  }

  setPage(page: QrSection): void {
    this.page = page;
  }

  process(): void {
    if (!this.qrCode || !this.canvas?.nativeElement) {
      return;
    }
    if (!this.model.data.trim()) {
      this.setStatus('error', 'Enter data to generate a QR code.');
      return;
    }
    if (this.model.data.length > this.maxDataLength) {
      this.setStatus('error', `Data must be ${this.maxDataLength.toLocaleString('en-US')} characters or fewer.`);
      return;
    }
    try {
      this.qrCode.update(toQrCodeOptions(this.model));
      this.qrCode.append(this.canvas.nativeElement);
      this.setStatus('success', 'QR code updated successfully.');
    } catch (error) {
      this.setStatus('error', error instanceof Error ? error.message : 'The QR code could not be generated.');
    }
  }

  setZoom(delta: number): void {
    this.scale = Math.min(2, Math.max(0.5, Number((this.scale + delta).toFixed(2))));
  }

  resetZoom(): void {
    this.scale = 1;
  }

  useSample(): void {
    this.model.data = 'https://smarttoolkit.github.io/';
    this.process();
  }

  applyPreset(preset: QrPreset): void {
    this.model.dotsOptions = {
      ...this.model.dotsOptions,
      type: preset.dotType,
      color: preset.dotColor,
      colorType: 'one',
      gradient: createGradient(preset.gradientStart, preset.gradientEnd)
    };
    this.model.cornersSquareOptions = {
      ...this.model.cornersSquareOptions,
      color: preset.cornerColor,
      colorType: 'one',
      gradient: createGradient(preset.gradientStart, preset.gradientEnd)
    };
    this.model.cornersDotOptions = {
      ...this.model.cornersDotOptions,
      color: preset.cornerColor,
      colorType: 'one',
      gradient: createGradient(preset.gradientStart, preset.gradientEnd)
    };
    this.model.backgroundOptions = {
      ...this.model.backgroundOptions,
      color: preset.background,
      colorType: 'one',
      gradient: createGradient(preset.background, preset.gradientEnd)
    };
    this.process();
    this.setStatus('success', `${preset.label} style applied.`);
  }

  copyData(): void {
    if (this.model.data) {
      void this.actionHelper.copy(this.model.data);
    }
  }

  reset(): void {
    this.model = structuredCloneQrModel();
    this.page = 'Main Options';
    this.scale = 1;
    this.process();
    this.setStatus('info', 'Default QR settings restored.');
  }

  loadFile(): void {
    void this.fileHelper.openOneFile('image/*').then(file => {
      if (file.size > this.maxImageSize) {
        this.setStatus('error', 'Logo image must be 2 MB or smaller.');
        return;
      }
      this.model.imageName = file.name;
      return this.fileHelper.convertFileToBase64(file).then(data => {
        this.model.image = data;
        this.process();
      });
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        this.setStatus('error', error.message);
      }
    });
  }

  deleteFile(): void {
    this.model.image = '';
    this.model.imageName = '';
    this.process();
  }

  addGradientStop(style: QrStyleOptions): void {
    if (style.gradient.colorStops.length >= 4) {
      return;
    }
    const last = style.gradient.colorStops[style.gradient.colorStops.length - 1];
    style.gradient.colorStops.push({ offset: Math.min(1, (last.offset + 1) / 2), color: last.color });
    this.process();
  }

  removeGradientStop(style: QrStyleOptions): void {
    if (style.gradient.colorStops.length > 2) {
      style.gradient.colorStops.pop();
      this.process();
    }
  }

  addGradientStopAt(style: QrStyleOptions, index: number): void {
    if (style.gradient.colorStops.length >= 4) {
      return;
    }
    const current = style.gradient.colorStops[index];
    style.gradient.colorStops.splice(index + 1, 0, { offset: Math.min(1, current.offset + 0.1), color: current.color });
    this.process();
  }

  importOptions(): void {
    void this.fileHelper.openFile('.stkqrcode,application/json', 100 * 1024).then(content => {
      this.model = normalizeQrModel(JSON.parse(content) as unknown);
      this.process();
      this.setStatus('success', 'QR options imported.');
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        this.setStatus('error', error.message || 'QR options could not be imported.');
      }
    });
  }

  exportOptions(): void {
    const filename = `QrcodeGenerator-${Date.now()}.stkqrcode`;
    if (this.fileHelper.download(JSON.stringify(this.model, null, 2), filename)) {
      this.setStatus('success', 'QR options exported.');
      void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
    }
  }

  downloadQRCodeAsSvg(): void {
    if (this.qrCode && this.canExport) {
      void this.qrCode.download({ name: 'qr-code', extension: 'svg' });
    }
  }

  downloadQRCodeAsPng(): void {
    if (this.qrCode && this.canExport) {
      void this.qrCode.download({ name: 'qr-code', extension: 'png' });
    }
  }

  private restoreState(): void {
    try {
      const saved = localStorage.getItem('qrcode-generator-model');
      if (saved) {
        this.model = normalizeQrModel(JSON.parse(saved) as unknown);
      }
    } catch {
      this.model = structuredCloneQrModel();
    }
  }

  saveState(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem('qrcode-generator-model', JSON.stringify(this.model));
      this.setStatus('success', 'QR settings saved in this browser.');
    } catch {
      this.setStatus('error', 'QR settings could not be saved.');
    }
  }

  private setStatus(type: StatusType, message: string): void {
    this.statusType = type;
    this.statusMessage = message;
    if (!this.destroyed) {
      this.changeDetector.markForCheck();
    }
  }
}

function structuredCloneQrModel(): QrModel {
  return {
    ...DEFAULT_QR_MODEL,
    qrOptions: { ...DEFAULT_QR_MODEL.qrOptions },
    imageOptions: { ...DEFAULT_QR_MODEL.imageOptions },
    dotsOptions: cloneStyle(DEFAULT_QR_MODEL.dotsOptions),
    cornersSquareOptions: cloneStyle(DEFAULT_QR_MODEL.cornersSquareOptions),
    cornersDotOptions: cloneStyle(DEFAULT_QR_MODEL.cornersDotOptions),
    backgroundOptions: cloneStyle(DEFAULT_QR_MODEL.backgroundOptions)
  };
}

function cloneStyle(style: QrStyleOptions): QrStyleOptions {
  return {
    ...style,
    gradient: {
      ...style.gradient,
      colorStops: style.gradient.colorStops.map(stop => ({ ...stop }))
    }
  };
}
