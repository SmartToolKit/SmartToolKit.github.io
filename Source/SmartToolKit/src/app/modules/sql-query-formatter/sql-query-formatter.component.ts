import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID, afterNextRender } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { formatSql, minifySql } from './sql-query-formatter.utils';

type OutputMode = 'formatted' | 'minified';
type StatusType = 'info' | 'success' | 'error';

@Component({
  selector: 'app-sql-query-formatter',
  templateUrl: './sql-query-formatter.component.html',
  styleUrls: ['./sql-query-formatter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SqlQueryFormatterComponent implements OnInit, OnDestroy {
  readonly maxQueryLength = 1_000_000;
  readonly storageKey = 'sql-query-formatter-page';

  rawQuery = '';
  formattedQuery = '';
  minifiedQuery = '';
  outputMode: OutputMode = 'formatted';
  queryError = '';
  statusType: StatusType = 'info';
  statusMessage = '';
  statusVisible = false;
  isLoading = false;
  loadingMessage = '';

  private transformTimer: ReturnType<typeof setTimeout> | null = null;
  private urlSubscription: Subscription | null = null;
  private requestId = 0;
  private destroyed = false;
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private titleService: Title,
    private changeDetector: ChangeDetectorRef,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle('Smart ToolKit - SQL Query Formatter');
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.destroyed) {
          this.rawQuery = this.readSavedQuery();
          this.transformNow();
        }
      });
    }
  }

  get outputQuery(): string {
    return this.outputMode === 'formatted' ? this.formattedQuery : this.minifiedQuery;
  }

  get outputLabel(): string {
    return this.outputMode === 'formatted' ? 'Formatted SQL' : 'Minified SQL';
  }

  get inputCharacters(): number {
    return this.rawQuery.length;
  }

  get outputCharacters(): number {
    return this.outputQuery.length;
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.transformNow();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.requestId++;
    this.urlSubscription?.unsubscribe();
    this.urlSubscription = null;
    if (this.transformTimer !== null) {
      clearTimeout(this.transformTimer);
      this.transformTimer = null;
    }
  }

  onQueryChange(value: string): void {
    this.rawQuery = value;
    this.queryError = '';
    if (this.statusType === 'error') {
      this.statusVisible = false;
    }
    this.scheduleTransform();
  }

  switchOutputMode(mode: OutputMode): void {
    this.outputMode = mode;
    this.transformNow();
  }

  formatQuery(): void {
    this.outputMode = 'formatted';
    this.cancelScheduledTransform();
    this.transformNow();
  }

  minifyQuery(): void {
    this.outputMode = 'minified';
    this.cancelScheduledTransform();
    this.transformNow();
  }

  clearQuery(): void {
    this.cancelScheduledTransform();
    this.rawQuery = '';
    this.formattedQuery = '';
    this.minifiedQuery = '';
    this.queryError = '';
    this.setStatus('info', 'Query cleared.');
  }

  openFile(): void {
    if (!this.isBrowser || this.isLoading) {
      return;
    }

    this.fileHelper.openFile('.sql,.txt,text/plain', this.maxQueryLength * 4).then(content => {
      this.setQuery(content, 'SQL file loaded.');
    }).catch((error: unknown) => {
      if (!this.destroyed) {
        const cancelled = error instanceof Error && error.message === 'File selection cancelled';
        const tooLarge = error instanceof Error && error.message === 'The selected file is too large.';
        const message = cancelled
          ? 'File selection cancelled.'
          : tooLarge
            ? 'The selected file is too large to process safely.'
            : 'The selected file could not be read.';
        this.setStatus(cancelled ? 'info' : 'error', message);
      }
    });
  }

  readAsUrl(): void {
    if (!this.isBrowser || this.isLoading) {
      return;
    }

    void swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: 'Your SQL file URL',
      inputPlaceholder: 'https://example.com/query.sql',
      showCancelButton: true,
      inputValidator: (value: string) => {
        if (!value?.trim()) {
          return 'You need to enter a URL.';
        }
        return this.normalizeUrl(value) ? null : 'Enter a valid HTTP or HTTPS URL.';
      }
    }).then(result => {
      if (this.destroyed || !result.isConfirmed) {
        return;
      }

      const url = this.normalizeUrl(String(result.value ?? ''));
      if (url) {
        this.fetchUrl(url);
      }
    }).catch(() => undefined);
  }

  async paste(): Promise<void> {
    if (!this.isBrowser || this.isLoading) {
      return;
    }

    const content = await this.actionHelper.paste();
    if (!this.destroyed && content) {
      this.setQuery(content, 'Query pasted from the clipboard.');
    }
  }

  async copy(): Promise<void> {
    const content = this.outputQuery;
    if (!content) {
      this.setStatus('error', 'There is no formatted output to copy.');
      return;
    }

    const copied = await this.actionHelper.copy(content);
    this.setStatus(copied ? 'success' : 'error', copied
      ? `${this.outputLabel} copied to the clipboard.`
      : 'The output could not be copied.');
  }

  download(): void {
    const content = this.outputQuery;
    if (!content) {
      this.setStatus('error', 'There is no formatted output to download.');
      return;
    }

    const modeLabel = this.outputMode === 'formatted' ? 'formatted' : 'minified';
    const filename = `SQLQuery-${modeLabel}-${new Date().getTime()}.sql`;
    if (this.fileHelper.download(content, filename)) {
      this.setStatus('success', `${this.outputLabel} downloaded as ${filename}.`);
    }
  }

  save(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(this.storageKey, this.rawQuery);
      this.setStatus('success', 'SQL query saved in this browser.');
    } catch {
      this.setStatus('error', 'The query could not be saved. Browser storage may be unavailable or full.');
    }
  }

  cancelLoading(): void {
    if (!this.isLoading) {
      return;
    }

    this.requestId++;
    this.urlSubscription?.unsubscribe();
    this.urlSubscription = null;
    this.isLoading = false;
    this.setStatus('info', 'Request cancelled.');
  }

  private fetchUrl(url: string): void {
    if (this.destroyed) {
      return;
    }
    const requestId = ++this.requestId;
    this.urlSubscription?.unsubscribe();
    this.urlSubscription = null;
    this.isLoading = true;
    this.statusVisible = false;
    this.loadingMessage = 'Fetching SQL file…';
    this.changeDetector.markForCheck();

    this.urlSubscription = this.http.get(url, { responseType: 'text' }).subscribe({
      next: response => {
        if (!this.isCurrentRequest(requestId)) {
          return;
        }

        this.isLoading = false;
        this.urlSubscription = null;
        this.setQuery(String(response ?? ''), 'SQL file fetched successfully.');
      },
      error: () => {
        if (!this.isCurrentRequest(requestId)) {
          return;
        }

        this.isLoading = false;
        this.urlSubscription = null;
        this.setStatus('error', 'Could not fetch the SQL file. Check the URL, CORS policy, and try again.');
      }
    });
  }

  private setQuery(content: string, message: string): void {
    if (this.destroyed) {
      return;
    }
    if (content.length > this.maxQueryLength) {
      this.setStatus('error', `The query is larger than the ${this.maxQueryLength.toLocaleString('en-US')} character limit.`);
      return;
    }

    this.rawQuery = content;
    this.queryError = '';
    this.cancelScheduledTransform();
    this.transformNow();
    this.setStatus('success', message);
  }

  private scheduleTransform(): void {
    this.cancelScheduledTransform();
    this.transformTimer = setTimeout(() => {
      this.transformTimer = null;
      this.transformNow();
    }, 160);
  }

  private cancelScheduledTransform(): void {
    if (this.transformTimer !== null) {
      clearTimeout(this.transformTimer);
      this.transformTimer = null;
    }
  }

  private transformNow(): void {
    if (this.destroyed) {
      return;
    }
    this.changeDetector.markForCheck();
    if (this.rawQuery.length > this.maxQueryLength) {
      this.formattedQuery = '';
      this.minifiedQuery = '';
      this.queryError = `Input exceeds the ${this.maxQueryLength.toLocaleString('en-US')} character limit.`;
      return;
    }

    if (!this.rawQuery.trim()) {
      this.formattedQuery = '';
      this.minifiedQuery = '';
      this.queryError = '';
      return;
    }

    const result = this.outputMode === 'formatted' ? formatSql(this.rawQuery) : minifySql(this.rawQuery);
    if (this.outputMode === 'formatted') {
      this.formattedQuery = result.text;
      this.minifiedQuery = '';
    } else {
      this.minifiedQuery = result.text;
      this.formattedQuery = '';
    }
    this.queryError = result.error ?? '';
  }

  private readSavedQuery(): string {
    try {
      return localStorage.getItem(this.storageKey) ?? '';
    } catch {
      return '';
    }
  }

  private normalizeUrl(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }

  private isCurrentRequest(requestId: number): boolean {
    return !this.destroyed && requestId === this.requestId;
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
