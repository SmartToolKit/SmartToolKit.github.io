import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, PLATFORM_ID, afterNextRender } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import {
  JsonIndent,
  JsonSearchResult,
  JsonStats,
  formatJson as formatJsonSource,
  getJsonStats,
  minifyJson as minifyJsonSource,
  parseJson,
  searchJson
} from './json-viewer.utils';

type JsonStatusType = 'info' | 'success' | 'error';
type JsonViewMode = 'tree' | 'source';

@Component({
  selector: 'app-json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonViewerComponent implements OnDestroy {
  readonly maxInputSize = 5 * 1024 * 1024;
  readonly indentOptions: JsonIndent[] = [2, 4, 'tab'];
  jsonContent = '{}';
  jsonValue: unknown = {};
  page = 'Viewer';
  viewMode: JsonViewMode = 'tree';
  indent: JsonIndent = 2;
  sortKeys = false;
  expanded = true;
  depth = 3;
  searchQuery = '';
  stats: JsonStats = getJsonStats('{}', {});
  searchResults: JsonSearchResult[] = [];
  statusType: JsonStatusType = 'info';
  statusMessage = 'Enter valid JSON to begin.';
  browserReady = false;

  private requestSubscription: Subscription | null = null;
  private destroyed = false;
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private titleService: Title,
    private changeDetector: ChangeDetectorRef,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle('Smart ToolKit - JSON Viewer');
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.destroyed) {
          this.restoreState();
        }
      });
    }
  }

  get isValid(): boolean {
    return !parseJson(this.jsonContent).error;
  }

  get characterCount(): string {
    return this.jsonContent.length.toLocaleString('en-US');
  }

  get searchCount(): number {
    return this.searchResults.length;
  }

  get rowCount(): number {
    return Math.min(30, Math.max(10, this.jsonContent.split('\n').length));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.requestSubscription?.unsubscribe();
  }

  onSourceChange(value: string): void {
    this.jsonContent = value;
    if (value.length > this.maxInputSize) {
      this.setStatus('error', 'JSON is larger than the 5 MB limit.');
      return;
    }
    this.refreshDerived();
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.refreshDerived();
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  switchMode(mode: JsonViewMode): void {
    this.viewMode = mode;
    this.refreshDerived();
  }

  jsonViewer(): void {
    this.viewMode = 'tree';
    this.refreshDerived();
  }

  jsonFormatter(type: string): void {
    if (type === 'Format') {
      this.formatJson();
    } else if (type === 'Remove white space') {
      this.minifyJson();
    }
  }

  formatJson(): void {
    const result = formatJsonSource(this.jsonContent, this.indent, this.sortKeys);
    if (result.error || result.content === undefined) {
      this.showError(result.error ?? 'Invalid JSON.');
      return;
    }
    this.jsonContent = result.content;
    this.viewMode = 'source';
    this.refreshDerived('JSON formatted and sanitized.');
  }

  minifyJson(): void {
    const result = minifyJsonSource(this.jsonContent);
    if (result.error || result.content === undefined) {
      this.showError(result.error ?? 'Invalid JSON.');
      return;
    }
    this.jsonContent = result.content;
    this.viewMode = 'source';
    this.refreshDerived('Whitespace removed from JSON.');
  }

  setIndent(value: string): void {
    this.indent = value === 'tab' ? 'tab' : Number(value) === 4 ? 4 : 2;
  }

  toggleSort(): void {
    this.sortKeys = !this.sortKeys;
    if (this.viewMode === 'source') {
      this.formatJson();
    } else {
      this.refreshDerived();
    }
  }

  setDepth(value: string): void {
    this.depth = Math.min(10, Math.max(1, Number(value) || 1));
  }

  toggleExpanded(): void {
    this.expanded = !this.expanded;
  }

  clear(): void {
    this.jsonContent = '';
    this.jsonValue = {};
    this.searchQuery = '';
    this.refreshDerived();
  }

  realoadView(): void {
    this.refreshDerived();
  }

  getrow(): number {
    return this.rowCount;
  }

  copy(): void {
    if (this.jsonContent) {
      void this.actionHelper.copy(this.jsonContent);
    }
  }

  save(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem('json-viewer-page', this.page);
      localStorage.setItem('json-viewer-jsonContent', this.jsonContent);
      this.setStatus('success', 'JSON saved in this browser.');
      void swal.fire('Success', 'JSON content saved successfully!', 'success');
    } catch {
      this.showError('JSON could not be saved in this browser.');
    }
  }

  exportJson(): void {
    this.download();
  }

  download(): void {
    if (!this.jsonContent) {
      return;
    }
    const filename = `JsonViewer-${Date.now()}.json`;
    if (this.fileHelper.download(this.jsonContent, filename)) {
      void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
    }
  }

  openFile(): void {
    void this.fileHelper.openFile('.json,application/json', this.maxInputSize).then(content => {
      this.loadContent(content, 'JSON loaded from file.');
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        this.showError(error.message);
      }
    });
  }

  async paste(): Promise<void> {
    const content = await this.actionHelper.paste();
    if (content) {
      this.loadContent(content, 'JSON pasted from clipboard.');
    }
  }

  readAsUrl(): void {
    void swal.fire({
      title: 'Load JSON from URL',
      input: 'url',
      inputLabel: 'JSON URL',
      inputPlaceholder: 'https://example.com/data.json',
      showCancelButton: true,
      inputValidator: (value: string) => value && this.isAllowedUrl(value) ? null : 'Enter a valid HTTP or HTTPS URL.'
    }).then(result => {
      if (!result.isConfirmed) {
        return;
      }
      const url = String(result.value);
      this.requestSubscription?.unsubscribe();
      this.requestSubscription = this.http.get(url, { responseType: 'text' }).subscribe({
        next: response => {
          if (response.length > this.maxInputSize) {
            this.showError('The downloaded JSON is larger than the 5 MB limit.');
            return;
          }
          this.loadContent(response, 'JSON loaded from URL.');
        },
        error: () => this.showError('JSON could not be loaded from the URL.')
      });
    });
  }

  private restoreState(): void {
    try {
      this.jsonContent = localStorage.getItem('json-viewer-jsonContent') ?? '{}';
      this.page = localStorage.getItem('json-viewer-page') ?? 'Viewer';
    } catch {
      this.jsonContent = '{}';
    }
    this.browserReady = true;
    this.refreshDerived();
  }

  private loadContent(content: string, message: string): void {
    if (content.length > this.maxInputSize) {
      this.showError('JSON is larger than the 5 MB limit.');
      return;
    }
    this.jsonContent = content;
    this.refreshDerived(message);
  }

  private refreshDerived(message?: string): void {
    const parsed = parseJson(this.jsonContent);
    if (parsed.error || parsed.value === undefined) {
      this.setStatus('error', parsed.line ? `${parsed.error} (line ${parsed.line}, column ${parsed.column})` : parsed.error ?? 'Invalid JSON.');
      this.searchResults = [];
      return;
    }
    this.jsonValue = parsed.value;
    this.stats = getJsonStats(this.jsonContent, parsed.value);
    this.searchResults = searchJson(this.jsonContent, this.searchQuery);
    this.setStatus('success', message ?? 'Valid JSON loaded.');
  }

  private showError(message: string): void {
    this.setStatus('error', message);
  }

  private setStatus(type: JsonStatusType, message: string): void {
    this.statusType = type;
    this.statusMessage = message;
    if (!this.destroyed) {
      this.changeDetector.markForCheck();
    }
  }

  private isAllowedUrl(value: string): boolean {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
        return false;
      }
      return hostname !== 'localhost' && !hostname.endsWith('.localhost') && !hostname.endsWith('.local');
    } catch {
      return false;
    }
  }
}
