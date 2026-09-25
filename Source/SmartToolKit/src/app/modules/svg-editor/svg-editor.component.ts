import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  afterNextRender
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import {
  SvgLayer,
  ensureSvgElementIds,
  formatSvg,
  getSvgLayerList,
  minifySvg,
  parseAndSanitizeSvg,
  serializeSvgElement
} from './svg-editor.utils';

type ShapeType = 'rect' | 'circle' | 'line' | 'text';
type StatusType = 'info' | 'success' | 'warning' | 'error';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const DEFAULT_SVG = `<svg width="800" height="800" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill="blue" d="M13.5 3.5H14V3.29289L13.8536 3.14645L13.5 3.5ZM10.5 0.5L10.8536 0.146447L10.7071 0H10.5V0.5ZM2.5 6.5V6H2V6.5H2.5ZM2.5 8.5H2V9H2.5V8.5ZM4.5 8.5H5V8H4.5V8.5ZM4.5 10.5V11H5V10.5H4.5ZM6.5 9.5H6V9.70711L6.14645 9.85355L6.5 9.5ZM7.5 10.5L7.14645 10.8536L7.5 11.2071L7.85355 10.8536L7.5 10.5ZM8.5 9.5L8.85355 9.85355L9 9.70711V9.5H8.5ZM10.5 6.5V6H10V6.5H10.5ZM10.5 10.5H10V11H10.5V10.5ZM12.5 10.5V11H13V10.5H12.5ZM2 5V1.5H1V5H2ZM13 3.5V5H14V3.5H13ZM2.5 1H10.5V0H2.5V1ZM10.1464 0.853553L13.1464 3.85355L13.8536 3.14645L10.8536 0.146447L10.1464 0.853553ZM2 1.5C2 1.22386 2.22386 1 2.5 1V0C1.67157 0 1 0.671573 1 1.5H2ZM1 12V13.5H2V12H1ZM2.5 15H12.5V14H2.5V15ZM14 13.5V12H13V13.5H14ZM12.5 15C13.3284 15 14 14.3284 14 13.5H13C13 13.7761 12.7761 14 12.5 14V15ZM1 13.5C1 14.3284 1.67157 15 2.5 15V14C2.22386 15 2 14.7761 2 14.5H1ZM5 6H2.5V7H5V6ZM2 6.5V8.5H3V6.5H2ZM2.5 9H4.5V8H2.5V9ZM4 8.5V10.5H5V8.5H4ZM4.5 10H2V11H4.5V10ZM6 6V9.5H7V6H6ZM6.14645 9.85355L7.14645 10.8536L7.85355 10.1464L6.85355 9.14645L6.14645 9.85355ZM7.85355 10.8536L8.85355 9.85355L8.14645 10.8536L7.85355 10.8536ZM9 9.5V6H8V9.5H9ZM13 6H10.5V7H13V6ZM10 6.5V10.5H11V6.5H10ZM10.5 11H12.5V10H10.5V11ZM13 10.5V8.5H12V10.5H13Z" />
</svg>`;

@Component({
  selector: 'app-svg-editor',
  templateUrl: './svg-editor.component.html',
  styleUrls: ['./svg-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SvgEditorComponent implements OnDestroy {
  @ViewChild('svgContainer', { static: false }) svgContainer!: ElementRef<HTMLDivElement>;

  readonly storageKey = 'svg-editor-page';
  readonly maxFileSize = 2 * 1024 * 1024;
  readonly maxUrlSize = 5 * 1024 * 1024;
  readonly shapeTypes: ShapeType[] = ['rect', 'circle', 'line', 'text'];

  svgCode = DEFAULT_SVG;
  safeSvgCode = '';
  svgError = '';
  warnings: string[] = [];
  layers: SvgLayer[] = [];
  selectedId = '';
  selectedTag = '';
  selectedName = '';
  selectedFill = '#000000';
  selectedStroke = '';
  selectedStrokeWidth = '';
  selectedOpacity = 1;
  selectedX = '';
  selectedY = '';
  selectedWidth = '';
  selectedHeight = '';
  scale = 0.5;
  bgColor = '#ffffff';
  showGrid = true;
  transparentBackground = true;
  previewReady = false;
  statusType: StatusType = 'info';
  statusMessage = 'Enter valid SVG markup to begin.';

  private previewSvg: SVGSVGElement | null = null;
  private elementIds = new Map<string, SVGElement>();
  private readonly undoStack: string[] = [];
  private readonly redoStack: string[] = [];
  private sourceTimer: ReturnType<typeof setTimeout> | null = null;
  private requestSubscription: Subscription | null = null;
  private lastSavedCode = DEFAULT_SVG;
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
    this.titleService.setTitle('Smart ToolKit - SVG Editor');
    if (this.isBrowser) {
      afterNextRender(() => {
        if (!this.destroyed) {
          this.restoreState();
        }
      });
    }
  }

  get isDirty(): boolean {
    return this.svgCode !== this.lastSavedCode;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get hasSelection(): boolean {
    return !!this.selectedElement;
  }

  get selectedElement(): SVGElement | null {
    return this.elementIds.get(this.selectedId) ?? null;
  }

  get selectedFillForInput(): string {
    return this.toColorInput(this.selectedFill);
  }

  get zoomLabel(): string {
    return `${Math.round(this.scale * 100)}%`;
  }

  get sourceLengthLabel(): string {
    return `${this.svgCode.length.toLocaleString('en-US')} characters`;
  }

  get statusClass(): string {
    return `status-${this.statusType}`;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearSourceTimer();
    this.requestSubscription?.unsubscribe();
  }

  onSourceChange(source: string): void {
    this.svgCode = source;
    this.clearSourceTimer();
    if (source.length > this.maxUrlSize) {
      this.showError('SVG source is larger than the 5 MB limit.');
      return;
    }
    this.setStatus('info', 'Editing source…');
    this.sourceTimer = setTimeout(() => {
      this.processSource(source);
    }, 180);
  }

  process(): void {
    this.clearSourceTimer();
    this.processSource(this.svgCode);
  }

  formatCode(): void {
    const result = formatSvg(this.svgCode);
    if (result.error) {
      this.showError(result.error);
      return;
    }
    if (this.applySource(result.source)) {
      this.setStatus(result.warnings.length > 0 ? 'warning' : 'success', result.warnings.length > 0 ? 'SVG formatted with security warnings.' : 'SVG formatted and sanitized.');
    }
  }

  minifyCode(): void {
    const result = minifySvg(this.svgCode);
    if (result.error) {
      this.showError(result.error);
      return;
    }
    if (this.applySource(result.source)) {
      this.setStatus(result.warnings.length > 0 ? 'warning' : 'success', result.warnings.length > 0 ? 'SVG minified with security warnings.' : 'SVG minified and sanitized.');
    }
  }

  openFile(): void {
    void this.fileHelper.openFile('.svg,image/svg+xml', this.maxFileSize).then(content => {
      this.applySource(content);
    }).catch((error: unknown) => {
      if (error instanceof Error && error.message !== 'File selection cancelled') {
        this.showError(error.message);
      }
    });
  }

  readAsUrl(): void {
    void swal.fire({
      title: 'Load SVG from URL',
      input: 'url',
      inputLabel: 'SVG URL',
      inputPlaceholder: 'https://example.com/image.svg',
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
          if (response.length > this.maxUrlSize) {
            this.showError('The downloaded SVG is larger than the 5 MB limit.');
            return;
          }
          if (this.applySource(response)) {
            this.setStatus(this.warnings.length > 0 ? 'warning' : 'success', this.warnings.length > 0 ? 'SVG loaded from URL with security warnings.' : 'SVG loaded from URL.');
          }
        },
        error: () => this.showError('The SVG could not be loaded from the URL.')
      });
    });
  }

  async paste(): Promise<void> {
    const content = await this.actionHelper.paste();
    if (content) {
      this.applySource(content);
    }
  }

  copy(): void {
    if (!this.safeSvgCode) {
      this.showError('There is no validated SVG to copy.');
      return;
    }
    void this.actionHelper.copy(this.safeSvgCode);
  }

  downloadSvg(): void {
    if (!this.safeSvgCode || !this.isBrowser) {
      return;
    }
    const filename = `SVG-${Date.now()}.svg`;
    const url = URL.createObjectURL(new Blob([this.safeSvgCode], { type: 'image/svg+xml;charset=utf-8' }));
    if (this.fileHelper.downloadUrl(url, filename)) {
      void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  downloadPng(): void {
    if (!this.previewSvg || !this.isBrowser) {
      return;
    }
    const size = this.getSvgSize(this.previewSvg);
    const source = serializeSvgElement(this.previewSvg);
    const sourceUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(sourceUrl);
        this.showError('PNG export is not supported by this browser.');
        return;
      }
      if (!this.transparentBackground) {
        context.fillStyle = this.bgColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(sourceUrl);
      canvas.toBlob(blob => {
        if (!blob) {
          this.showError('PNG export failed.');
          return;
        }
        const filename = `SVG-${Date.now()}.png`;
        const pngUrl = URL.createObjectURL(blob);
        if (this.fileHelper.downloadUrl(pngUrl, filename)) {
          void swal.fire('Download Ready', `${filename} was downloaded.`, 'success');
        }
        window.setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
      }, 'image/png');
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      this.showError('PNG export could not render this SVG.');
    };
    image.src = sourceUrl;
  }

  save(): void {
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, this.svgCode);
      this.lastSavedCode = this.svgCode;
      this.setStatus('success', 'SVG saved in this browser.');
      void swal.fire('Success', 'SVG saved successfully!', 'success');
    } catch {
      this.showError('SVG could not be saved in this browser.');
    }
  }

  reset(): void {
    if (this.isDirty && !window.confirm('Discard the current unsaved changes?')) {
      return;
    }
    this.applySource(DEFAULT_SVG);
    this.setStatus('info', 'Default SVG restored.');
  }

  undo(): void {
    this.clearSourceTimer();
    const previous = this.undoStack.pop();
    if (previous === undefined) {
      return;
    }
    this.redoStack.push(this.svgCode);
    this.svgCode = previous;
    this.processSource(previous);
  }

  redo(): void {
    this.clearSourceTimer();
    const next = this.redoStack.pop();
    if (next === undefined) {
      return;
    }
    this.undoStack.push(this.svgCode);
    this.svgCode = next;
    this.processSource(next);
  }

  addShape(type: ShapeType): void {
    if (!this.previewSvg) {
      return;
    }
    const size = this.getSvgSize(this.previewSvg);
    const parent = this.selectedElement?.localName === 'g' ? this.selectedElement : this.previewSvg;
    const element = document.createElementNS(SVG_NAMESPACE, type);
    const id = this.createElementId(type);
    element.setAttribute('id', id);
    if (type === 'rect') {
      element.setAttribute('x', String(size.width * 0.2));
      element.setAttribute('y', String(size.height * 0.2));
      element.setAttribute('width', String(size.width * 0.35));
      element.setAttribute('height', String(size.height * 0.35));
      element.setAttribute('rx', '12');
      element.setAttribute('fill', '#6366f1');
    } else if (type === 'circle') {
      element.setAttribute('cx', String(size.width * 0.5));
      element.setAttribute('cy', String(size.height * 0.5));
      element.setAttribute('r', String(Math.min(size.width, size.height) * 0.25));
      element.setAttribute('fill', '#14b8a6');
    } else if (type === 'line') {
      element.setAttribute('x1', String(size.width * 0.2));
      element.setAttribute('y1', String(size.height * 0.8));
      element.setAttribute('x2', String(size.width * 0.8));
      element.setAttribute('y2', String(size.height * 0.2));
      element.setAttribute('stroke', '#f97316');
      element.setAttribute('stroke-width', '8');
    } else {
      element.setAttribute('x', String(size.width * 0.2));
      element.setAttribute('y', String(size.height * 0.5));
      element.setAttribute('fill', '#111827');
      element.setAttribute('font-size', String(Math.max(16, Math.min(size.width, size.height) * 0.12)));
      element.setAttribute('font-family', 'Arial, sans-serif');
      element.textContent = 'Text';
    }
    parent.appendChild(element);
    this.elementIds = ensureSvgElementIds(this.previewSvg);
    this.selectedId = id;
    this.commitDomChanges();
  }

  duplicateSelected(): void {
    const element = this.selectedElement;
    if (!element || !this.previewSvg || element === this.previewSvg || !element.parentNode) {
      return;
    }
    const clone = element.cloneNode(true) as SVGElement;
    clone.removeAttribute('id');
    element.parentNode.insertBefore(clone, element.nextSibling);
    this.elementIds = ensureSvgElementIds(this.previewSvg);
    this.selectedId = clone.id;
    this.commitDomChanges();
  }

  deleteSelected(): void {
    const element = this.selectedElement;
    if (!element || element === this.previewSvg) {
      return;
    }
    element.remove();
    this.selectedId = '';
    this.commitDomChanges();
  }

  moveSelected(deltaX: number, deltaY: number): void {
    const element = this.selectedElement;
    if (!element || element === this.previewSvg) {
      return;
    }
    const current = element.getAttribute('transform') ?? '';
    const match = current.match(/translate\(\s*([-+]?\d*\.?\d+)(?:[ ,]+)([-+]?\d*\.?\d+)\s*\)/);
    if (match) {
      const x = Number(match[1]) + deltaX;
      const y = Number(match[2]) + deltaY;
      element.setAttribute('transform', current.replace(match[0], `translate(${x} ${y})`));
    } else {
      element.setAttribute('transform', `translate(${deltaX} ${deltaY})${current ? ` ${current}` : ''}`);
    }
    this.commitDomChanges();
  }

  onPreviewKeydown(event: KeyboardEvent): void {
    if (!this.hasSelection) {
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.deleteSelected();
      return;
    }
    const step = event.shiftKey ? 10 : 1;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.moveSelected(-step, 0);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.moveSelected(step, 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveSelected(0, -step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveSelected(0, step);
    }
  }

  onPreviewClick(event: MouseEvent): void {
    if (!(event.target instanceof Element)) {
      return;
    }
    const target = event.target.closest('[data-svg-editor-id]');
    const id = target?.getAttribute('data-svg-editor-id');
    if (id) {
      this.selectId(id);
    }
  }

  selectLayer(layer: SvgLayer): void {
    this.selectId(layer.id);
  }

  toggleLayerVisibility(layer: SvgLayer): void {
    const element = this.elementIds.get(layer.id);
    if (!element || element === this.previewSvg) {
      return;
    }
    if (layer.visible) {
      element.setAttribute('display', 'none');
    } else {
      element.removeAttribute('display');
      element.removeAttribute('visibility');
    }
    this.commitDomChanges();
  }

  updateSelectedId(event: Event): void {
    const element = this.selectedElement;
    const value = (event.target as HTMLInputElement).value.trim();
    if (!element || !value || value === element.id) {
      return;
    }
    if (this.elementIds.has(value)) {
      this.showError('Layer IDs must be unique.');
      this.updateInspector();
      return;
    }
    const oldId = element.id;
    element.id = value;
    this.elementIds.delete(oldId);
    this.selectedId = value;
    this.commitDomChanges();
  }

  updateSelectedAttribute(attribute: string, event: Event): void {
    const element = this.selectedElement;
    if (!element) {
      return;
    }
    const value = (event.target as HTMLInputElement).value.trim();
    if (['x', 'y', 'width', 'height', 'opacity', 'stroke-width'].includes(attribute) && value !== '' && !Number.isFinite(Number(value))) {
      this.showError(`Enter a valid ${attribute} value.`);
      this.updateInspector();
      return;
    }
    if (value === '') {
      element.removeAttribute(attribute);
    } else {
      element.setAttribute(attribute, value);
    }
    this.commitDomChanges();
  }

  updateSelectedColor(attribute: 'fill' | 'stroke', event: Event): void {
    this.updateSelectedAttribute(attribute, event);
  }

  setZoom(delta: number): void {
    this.scale = Math.min(3, Math.max(0.1, Number((this.scale + delta).toFixed(2))));
  }

  resetZoom(): void {
    this.scale = 0.5;
  }

  onPreviewWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();
    this.setZoom(event.deltaY < 0 ? 0.1 : -0.1);
  }

  private restoreState(): void {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved?.trim()) {
        this.svgCode = saved;
      }
      this.lastSavedCode = this.svgCode;
    } catch {
      this.lastSavedCode = this.svgCode;
    }
    this.processSource(this.svgCode);
  }

  private processSource(source: string): boolean {
    if (source.length > this.maxUrlSize) {
      this.previewSvg = null;
      this.elementIds = new Map<string, SVGElement>();
      this.layers = [];
      this.selectedId = '';
      this.safeSvgCode = '';
      this.warnings = [];
      this.svgError = 'SVG source is larger than the 5 MB limit.';
      this.previewReady = false;
      this.svgContainer?.nativeElement.replaceChildren();
      this.showError(this.svgError);
      return false;
    }
    const result = parseAndSanitizeSvg(source);
    if (result.error || !result.svg) {
      this.previewSvg = null;
      this.elementIds = new Map<string, SVGElement>();
      this.layers = [];
      this.selectedId = '';
      this.safeSvgCode = '';
      this.warnings = [];
      this.svgError = result.error ?? 'Invalid SVG.';
      this.previewReady = false;
      this.svgContainer?.nativeElement.replaceChildren();
      this.showError(this.svgError);
      return false;
    }

    this.previewSvg = result.svg;
    this.elementIds = ensureSvgElementIds(result.svg);
    this.safeSvgCode = serializeSvgElement(result.svg);
    this.svgError = '';
    this.warnings = result.warnings;
    this.renderPreview();
    this.layers = getSvgLayerList(result.svg);
    if (!this.selectedId || !this.elementIds.has(this.selectedId)) {
      this.selectedId = this.layers[0]?.id ?? '';
    }
    this.updateInspector();
    this.setStatus(result.warnings.length > 0 ? 'warning' : 'success', result.warnings.length > 0 ? 'SVG loaded with security warnings.' : 'SVG is valid and sanitized.');
    return true;
  }

  private renderPreview(): void {
    const container = this.svgContainer?.nativeElement;
    if (!container || !this.previewSvg) {
      return;
    }
    const clone = this.previewSvg.cloneNode(true) as SVGSVGElement;
    for (const element of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
      if (element instanceof SVGElement && this.elementIds.has(element.id)) {
        element.setAttribute('data-svg-editor-id', element.id);
      }
    }
    container.replaceChildren(clone);
    this.previewReady = true;
  }

  private applySource(source: string): boolean {
    this.clearSourceTimer();
    if (source.length > this.maxUrlSize) {
      this.showError('SVG source is larger than the 5 MB limit.');
      return false;
    }
    if (source === this.svgCode) {
      return this.processSource(source);
    }
    this.pushHistory(this.svgCode);
    this.svgCode = source;
    return this.processSource(source);
  }

  private commitDomChanges(): void {
    if (!this.previewSvg) {
      return;
    }
    this.elementIds = ensureSvgElementIds(this.previewSvg);
    const next = serializeSvgElement(this.previewSvg);
    if (next !== this.svgCode) {
      this.pushHistory(this.svgCode);
      this.svgCode = next;
    }
    this.safeSvgCode = next;
    this.layers = getSvgLayerList(this.previewSvg);
    if (!this.elementIds.has(this.selectedId)) {
      this.selectedId = this.layers[0]?.id ?? '';
    }
    this.renderPreview();
    this.updateInspector();
    this.setStatus('success', 'SVG changes applied.');
  }

  private pushHistory(source: string): void {
    this.undoStack.push(source);
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }
    this.redoStack.length = 0;
  }

  private selectId(id: string): void {
    if (!this.elementIds.has(id)) {
      return;
    }
    this.selectedId = id;
    this.updateInspector();
  }

  private updateInspector(): void {
    const element = this.selectedElement;
    if (!element) {
      this.selectedTag = '';
      this.selectedName = '';
      this.selectedFill = '#000000';
      this.selectedStroke = '';
      this.selectedStrokeWidth = '';
      this.selectedOpacity = 1;
      this.selectedX = '';
      this.selectedY = '';
      this.selectedWidth = '';
      this.selectedHeight = '';
      return;
    }
    this.selectedTag = element.localName;
    this.selectedName = element.id;
    this.selectedFill = element.getAttribute('fill') || '#000000';
    this.selectedStroke = element.getAttribute('stroke') || '';
    this.selectedStrokeWidth = element.getAttribute('stroke-width') || '';
    const opacity = Number(element.getAttribute('opacity') ?? '1');
    this.selectedOpacity = Number.isFinite(opacity) ? Math.min(1, Math.max(0, opacity)) : 1;
    this.selectedX = element.getAttribute('x') ?? '';
    this.selectedY = element.getAttribute('y') ?? '';
    this.selectedWidth = element.getAttribute('width') ?? '';
    this.selectedHeight = element.getAttribute('height') ?? '';
  }

  private createElementId(type: string): string {
    let index = 1;
    let id = `${type}-${index}`;
    while (this.elementIds.has(id)) {
      index++;
      id = `${type}-${index}`;
    }
    return id;
  }

  private getSvgSize(svg: SVGSVGElement): { width: number; height: number } {
    const viewBox = svg.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);
    const widthAttribute = Number.parseFloat(svg.getAttribute('width') ?? '');
    const heightAttribute = Number.parseFloat(svg.getAttribute('height') ?? '');
    let width: number = Number.isFinite(widthAttribute) && widthAttribute > 0 ? widthAttribute : (viewBox?.[2] ?? Number.NaN);
    let height: number = Number.isFinite(heightAttribute) && heightAttribute > 0 ? heightAttribute : (viewBox?.[3] ?? Number.NaN);
    if (!Number.isFinite(width) || width <= 0) {
      width = 800;
    }
    if (!Number.isFinite(height) || height <= 0) {
      height = 800;
    }
    const ratio = Math.min(1, 4096 / width, 4096 / height);
    return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
  }

  private isAllowedUrl(value: string): boolean {
    try {
      const url = new URL(value);
      const hostname = url.hostname.toLowerCase();
      if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password || this.isLocalHostname(hostname)) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  private isLocalHostname(hostname: string): boolean {
    const normalized = hostname.replace(/^\[|\]$/g, '');
    if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local') || (normalized.includes(':') && (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')))) {
      return true;
    }
    const octets = normalized.split('.').map(Number);
    if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
      return false;
    }
    const [first, second] = octets;
    return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168) || (first === 100 && second >= 64 && second <= 127) || first >= 224;
  }

  private toColorInput(value: string): string {
    return /^#[0-9a-f]{6}$/i.test(value) || /^#[0-9a-f]{3}$/i.test(value) ? value : '#000000';
  }

  private clearSourceTimer(): void {
    if (this.sourceTimer !== null) {
      clearTimeout(this.sourceTimer);
      this.sourceTimer = null;
    }
  }

  private showError(message: string): void {
    this.setStatus('error', message);
  }

  private setStatus(type: StatusType, message: string): void {
    this.statusType = type;
    this.statusMessage = message;
    if (!this.destroyed) {
      this.changeDetector.markForCheck();
    }
  }
}
