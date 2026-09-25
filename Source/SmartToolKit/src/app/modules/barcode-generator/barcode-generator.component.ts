import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, PLATFORM_ID, ViewChild, afterNextRender } from '@angular/core';
import { Title } from '@angular/platform-browser';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import {
  BARCODE_FORMAT_OPTIONS,
  BarcodeFormat,
  BarcodeFormatOption,
  BarcodeModel,
  BarcodeTextAlign,
  BarcodeTextPosition,
  DEFAULT_BARCODE_MODEL,
  getBarcodeFormatOption,
  normalizeBarcodeModel,
  validateBarcodeValue
} from './barcode-generator.utils';

type StatusType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-barcode-generator',
  templateUrl: './barcode-generator.component.html',
  styleUrls: ['./barcode-generator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarcodeGeneratorComponent implements OnDestroy {
  @ViewChild('barcodeElement', { static: false }) barcodeElement!: ElementRef<HTMLDivElement>;

  readonly formats = BARCODE_FORMAT_OPTIONS;
  readonly textAlignOptions: BarcodeTextAlign[] = ['left', 'center', 'right'];
  readonly textPositionOptions: BarcodeTextPosition[] = ['top', 'bottom'];
  readonly maxValueLength = 256;
  readonly maxOptionsFileSize = 100 * 1024;
  model: BarcodeModel = { ...DEFAULT_BARCODE_MODEL };
  browserReady = false;
  previewScale = 1;
  statusType: StatusType = 'info';
  statusMessage = 'Enter a value to generate a barcode.';

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
    this.titleService.setTitle('Smart ToolKit - Barcode Generator');
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.destroyed) {
          this.browserReady = true;
          this.updateStatus();
        }
      });
    }
  }

  get selectedFormatOption(): BarcodeFormatOption {
    return getBarcodeFormatOption(this.model.selectedFormat);
  }

  get validation() {
    return validateBarcodeValue(this.model.selectedFormat, this.model.value);
  }

  get isValid(): boolean {
    return this.validation.valid;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  onModelChange(): void {
    this.updateStatus();
  }

  onFormatChange(format: BarcodeFormat): void {
    this.model.selectedFormat = format;
    this.updateStatus();
  }

  useExample(): void {
    this.model.value = this.selectedFormatOption.example;
    this.updateStatus();
  }

  reset(): void {
    this.model = { ...DEFAULT_BARCODE_MODEL };
    this.setStatus('info', 'Default settings restored.');
  }

  copyValue(): void {
    if (this.model.value.trim()) {
      void this.actionHelper.copy(this.model.value);
    }
  }

  setPreviewZoom(delta: number): void {
    this.previewScale = Math.min(2.5, Math.max(0.5, Number((this.previewScale + delta).toFixed(2))));
  }

  resetPreviewZoom(): void {
    this.previewScale = 1;
  }

  importOptions(): void {
    void this.fileHelper.openFile('.stkbarcode,application/json', this.maxOptionsFileSize).then(content => {
      const parsed: unknown = JSON.parse(content);
      this.model = normalizeBarcodeModel(parsed);
      this.setStatus(this.isValid ? 'success' : 'error', this.isValid ? 'Options imported successfully.' : this.validation.message);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        this.setStatus('error', error.message || 'Options could not be imported.');
      }
    });
  }

  exportOptions(): void {
    const filename = `BarcodeGenerator-${Date.now()}.stkbarcode`;
    if (this.fileHelper.download(JSON.stringify(this.model, null, 2), filename)) {
      this.setStatus('success', 'Barcode options exported.');
      void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
    }
  }

  downloadQRCodeAsSvg(): void {
    const svg = this.getSvgElement();
    if (!svg || !this.isBrowser) {
      this.setStatus('error', 'Generate a valid barcode before downloading.');
      return;
    }
    const filename = `BarcodeGenerator-${Date.now()}.svg`;
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
    if (this.fileHelper.downloadUrl(url, filename)) {
      this.setStatus('success', `${filename} was downloaded.`);
      void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  downloadQRCodeAsPng(): void {
    const svg = this.getSvgElement();
    if (!svg || !this.isBrowser) {
      this.setStatus('error', 'Generate a valid barcode before downloading.');
      return;
    }
    const size = this.getSvgSize(svg);
    const sourceUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(sourceUrl);
        this.setStatus('error', 'PNG export is not supported by this browser.');
        return;
      }
      context.fillStyle = this.model.bgColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(sourceUrl);
      canvas.toBlob(blob => {
        if (!blob) {
          this.setStatus('error', 'PNG export failed.');
          return;
        }
        const filename = `BarcodeGenerator-${Date.now()}.png`;
        const pngUrl = URL.createObjectURL(blob);
        if (this.fileHelper.downloadUrl(pngUrl, filename)) {
          this.setStatus('success', `${filename} was downloaded.`);
          void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
        }
        window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      this.setStatus('error', 'PNG export could not render this barcode.');
    };
    image.src = sourceUrl;
  }

  private updateStatus(): void {
    const result = this.validation;
    if (!result.valid) {
      this.setStatus('error', result.message);
    } else {
      this.setStatus('success', result.message);
    }
  }

  private setStatus(type: StatusType, message: string): void {
    this.statusType = type;
    this.statusMessage = message;
    if (!this.destroyed) {
      this.changeDetector.markForCheck();
    }
  }

  private getSvgElement(): SVGSVGElement | null {
    return this.barcodeElement?.nativeElement.querySelector('svg') ?? null;
  }

  private getSvgSize(svg: SVGSVGElement): { width: number; height: number } {
    const viewBox = svg.viewBox?.baseVal;
    const width = Number.parseFloat(svg.getAttribute('width') ?? '') || viewBox?.width || 800;
    const height = Number.parseFloat(svg.getAttribute('height') ?? '') || viewBox?.height || 300;
    const ratio = Math.min(1, 4096 / width, 4096 / height);
    return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
  }
}
