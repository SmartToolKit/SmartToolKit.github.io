import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { NationalCodeValidation, generateNationalCodes, getNextNationalCode, validateNationalCode } from './national-code.utils';

type StatusType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-national-code',
  templateUrl: './national-code.component.html',
  styleUrls: ['./national-code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NationalCodeComponent {
  readonly maxCount = 1000;
  inputCode = '';
  count = 5;
  generatedCodes: string[] = [];
  nextCode = '';
  validationResult: NationalCodeValidation = validateNationalCode('');
  statusType: StatusType = 'info';
  statusMessage = 'Enter a national code or generate test codes.';

  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document,
    private changeDetector: ChangeDetectorRef,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle('Smart ToolKit - Iranian National Code');
    const description = 'Validate Iranian national codes and generate valid test codes with checksum verification. Useful for software testing and sample data.';
    const keywords = 'Iranian national code, national code validator, national code generator, Iran national ID, test data';
    const canonicalUrl = 'https://smarttoolkit.github.io/national-code';
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'keywords', content: keywords });
    this.meta.updateTag({ property: 'og:title', content: 'Iranian National Code | Validate and Generate Test Codes' });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ name: 'twitter:title', content: 'Iranian National Code | Smart ToolKit' });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    const canonical = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      canonical.href = canonicalUrl;
    }
  }

  get isInputValid(): boolean {
    return this.validationResult.valid;
  }

  onInputChange(value: string): void {
    this.inputCode = value;
    this.validationResult = validateNationalCode(value);
    this.nextCode = '';
    this.setStatus(this.validationResult.valid ? 'success' : 'info', this.validationResult.message);
  }

  validateInput(): void {
    this.validationResult = validateNationalCode(this.inputCode);
    this.setStatus(this.validationResult.valid ? 'success' : 'error', this.validationResult.message);
  }

  generate(): void {
    const safeCount = Math.max(1, Math.min(this.maxCount, Math.floor(Number(this.count) || 1)));
    this.count = safeCount;
    this.generatedCodes = generateNationalCodes(safeCount, () => this.random());
    this.setStatus('success', `${safeCount.toLocaleString('en-US')} valid test national codes generated.`);
  }

  next(): void {
    const result = getNextNationalCode(this.inputCode);
    this.validationResult = result;
    this.nextCode = result.valid ? result.normalized : '';
    this.setStatus(result.valid ? 'success' : 'error', result.message);
  }

  copyGenerated(): void {
    if (this.generatedCodes.length) {
      void this.actionHelper.copy(this.generatedCodes.join('\n'));
    }
  }

  copyOne(code: string): void {
    void this.actionHelper.copy(code);
  }

  download(): void {
    if (!this.generatedCodes.length) {
      return;
    }
    const filename = `NationalCodes-${Date.now()}.txt`;
    if (this.fileHelper.download(this.generatedCodes.join('\n'), filename)) {
      this.setStatus('success', 'National codes downloaded.');
      void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
    }
  }

  clear(): void {
    this.inputCode = '';
    this.generatedCodes = [];
    this.nextCode = '';
    this.validationResult = validateNationalCode('');
    this.setStatus('info', 'Input and results cleared.');
  }

  private random(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      return values[0] / 4294967296;
    }
    return Math.random();
  }

  private setStatus(type: StatusType, message: string): void {
    this.statusType = type;
    this.statusMessage = message;
    this.changeDetector.markForCheck();
  }
}
