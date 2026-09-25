import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, PLATFORM_ID, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Title } from '@angular/platform-browser';

type SliceLineType = 'vertical' | 'horizontal';
type SliceOutputFormat = 'png' | 'jpeg' | 'webp';
type StatusType = 'info' | 'success' | 'error';

interface SliceLine {
  type: SliceLineType;
  position: number;
}

interface CroppedImage {
  name: string;
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-image-slicer',
  templateUrl: './image-slicer.component.html',
  styleUrls: ['./image-slicer.component.scss']
})
export class ImageSlicerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorCanvas')
  set editorCanvasRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.editorCanvas = ref;
    if (!ref) {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      return;
    }
    this.observeCanvas();
    this.scheduleCanvasSetup();
  }

  readonly maxLines = 100;
  readonly maxPieces = 1000;
  readonly maxFileSize = 50 * 1024 * 1024;
  readonly maxImagePixels = 40_000_000;
  readonly maxCanvasDimension = 16_384;
  readonly maxWorkingPixels = 16_000_000;
  readonly maxOutputBytes = 100 * 1024 * 1024;

  imageFileName = '';
  imageDimensions = '';
  lines: SliceLine[] = [];
  croppedImages: CroppedImage[] = [];
  outputFormat: SliceOutputFormat = 'png';
  isDragOver = false;
  isLoading = false;
  isDragging = false;
  selectedLineIndex = -1;
  statusType: StatusType = 'info';
  statusMessage = '';
  statusVisible = false;
  loadingMessage = '';

  private editorCanvas?: ElementRef<HTMLCanvasElement>;
  private originalImage: HTMLImageElement | null = null;
  private imageUrl: string | null = null;
  private pendingImageUrl: string | null = null;
  private dragIndex = -1;
  private dragOffset = 0;
  private activePointerId: number | null = null;
  private operationId = 0;
  private canvasSetupTimer: number | null = null;
  private drawFrame: number | null = null;
  private drawFrameUsesAnimation = false;
  private resizeObserver: ResizeObserver | null = null;
  private imageLayer: HTMLCanvasElement | null = null;
  private destroyed = false;
  private readonly isBrowser: boolean;

  constructor(
    private titleService: Title,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle('Smart ToolKit - Image Slicer');
  }

  get imageLoaded(): boolean {
    return this.originalImage !== null;
  }

  get estimatedPieceCount(): number {
    if (!this.originalImage) {
      return 0;
    }

    const xPoints = this.createSlicePoints(
      this.lines.filter(line => line.type === 'vertical').map(line => line.position),
      this.sourceWidth
    );
    const yPoints = this.createSlicePoints(
      this.lines.filter(line => line.type === 'horizontal').map(line => line.position),
      this.sourceHeight
    );

    return (xPoints.length - 1) * (yPoints.length - 1);
  }

  get hasCrops(): boolean {
    return this.croppedImages.length > 0;
  }

  get sourceWidth(): number {
    return this.originalImage?.naturalWidth ?? 0;
  }

  get sourceHeight(): number {
    return this.originalImage?.naturalHeight ?? 0;
  }

  ngAfterViewInit(): void {
    this.observeCanvas();
  }

  onUploadClick(input: HTMLInputElement): void {
    if (!this.isLoading) {
      input.click();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && !this.isLoading) {
      void this.loadImage(file);
    }

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.isLoading) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    const currentTarget = event.currentTarget as HTMLElement | null;
    const relatedTarget = event.relatedTarget as Node | null;
    if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
      return;
    }
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    if (this.isLoading) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    if (files.length > 1) {
      this.setStatus('error', 'Drop one image at a time.');
      return;
    }

    void this.loadImage(files[0]);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.originalImage || this.isLoading || this.isDragging || (event.pointerType === 'mouse' && event.button !== 0)) {
      return;
    }

    const canvas = this.editorCanvas?.nativeElement;
    const lineIndex = canvas ? this.findNearestLine(event.clientX, event.clientY) : -1;
    if (!canvas || lineIndex < 0) {
      return;
    }

    event.preventDefault();
    const line = this.lines[lineIndex];
    const point = this.getCanvasPoint(event.clientX, event.clientY);

    this.isDragging = true;
    this.dragIndex = lineIndex;
    this.selectedLineIndex = lineIndex;
    this.dragOffset = (line.type === 'vertical' ? point.x : point.y) - line.position;
    this.activePointerId = event.pointerId;
    this.requestDraw();
    canvas.focus();
    canvas.style.cursor = 'grabbing';

    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      this.cancelDrag();
    }
  }

  onPointerMove(event: PointerEvent): void {
    const canvas = this.editorCanvas?.nativeElement;
    if (!canvas || !this.originalImage || this.isLoading) {
      return;
    }

    if (this.isDragging && this.dragIndex >= 0) {
      if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
        return;
      }
      event.preventDefault();
      const point = this.getCanvasPoint(event.clientX, event.clientY);
      const line = this.lines[this.dragIndex];
      if (!line) {
        return;
      }

      const nextPosition = this.clampLinePosition(line.type, (line.type === 'vertical' ? point.x : point.y) - this.dragOffset);
      if (nextPosition !== line.position) {
        line.position = nextPosition;
        this.invalidateCrops();
        this.requestDraw();
      }
      return;
    }

    canvas.style.cursor = this.findNearestLine(event.clientX, event.clientY) >= 0 ? 'grab' : 'default';
  }

  onPointerUp(event?: PointerEvent): void {
    if (event && this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }
    this.cancelDrag();
  }

  onCanvasKeydown(event: KeyboardEvent): void {
    if (this.isLoading) {
      return;
    }

    const line = this.lines[this.selectedLineIndex];
    if (!line) {
      return;
    }

    const step = event.shiftKey ? 10 : 1;
    let nextPosition: number | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextPosition = line.position - step;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextPosition = line.position + step;
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.removeLine(this.selectedLineIndex);
      return;
    }

    if (nextPosition !== null) {
      event.preventDefault();
      const clampedPosition = this.clampLinePosition(line.type, nextPosition);
      if (clampedPosition !== line.position) {
        line.position = clampedPosition;
        this.invalidateCrops();
        this.requestDraw();
      }
    }
  }

  selectLine(index: number): void {
    if (this.isLoading || !this.lines[index]) {
      return;
    }

    this.selectedLineIndex = index;
    this.editorCanvas?.nativeElement.focus();
    this.requestDraw();
  }

  updateLinePosition(index: number, event: Event): void {
    const line = this.lines[index];
    const input = event.target as HTMLInputElement;
    const position = Number(input.value);
    if (!line || this.isLoading || input.value.trim() === '' || !Number.isFinite(position)) {
      return;
    }

    const clampedPosition = this.clampLinePosition(line.type, position);
    if (clampedPosition === line.position) {
      return;
    }
    line.position = clampedPosition;
    this.invalidateCrops();
    this.requestDraw();
  }

  commitLinePosition(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const line = this.lines[index];
    if (line && !this.isLoading) {
      input.value = String(line.position);
    }
  }

  removeLine(index: number, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    if (this.isLoading || !this.lines[index]) {
      return;
    }

    this.lines.splice(index, 1);
    if (this.selectedLineIndex >= this.lines.length) {
      this.selectedLineIndex = this.lines.length - 1;
    } else if (index < this.selectedLineIndex) {
      this.selectedLineIndex--;
    }
    this.invalidateCrops();
    this.requestDraw();
    this.setStatus('info', 'Cut line removed.');
  }

  addLine(type: SliceLineType): void {
    if (!this.originalImage) {
      this.setStatus('error', 'Choose an image before adding cut lines.');
      return;
    }

    if (this.isLoading) {
      return;
    }

    if (this.lines.length >= this.maxLines) {
      this.setStatus('error', `The editor supports up to ${this.maxLines.toLocaleString('en-US')} cut lines.`);
      return;
    }

    const size = type === 'vertical' ? this.sourceWidth : this.sourceHeight;
    if (size < 3) {
      this.setStatus('error', 'The image is too small to add a cut line.');
      return;
    }

    const position = this.findAvailablePosition(type, size);
    if (position === null) {
      this.setStatus('error', 'There is no available space for another cut line.');
      return;
    }

    this.lines.push({ type, position });
    this.selectedLineIndex = this.lines.length - 1;
    this.invalidateCrops();
    this.requestDraw();
    this.setStatus('info', `${this.lineTypeLabel(type)} cut line added.`);
  }

  clearLines(): void {
    if (this.isLoading || this.lines.length === 0) {
      return;
    }

    this.lines = [];
    this.selectedLineIndex = -1;
    this.invalidateCrops();
    this.requestDraw();
    this.setStatus('info', 'All cut lines removed.');
  }

  removeImage(): void {
    if (this.isLoading) {
      return;
    }

    this.operationId++;
    this.revokePendingImage();
    this.invalidateCrops();
    this.releaseImage();
    this.imageFileName = '';
    this.imageDimensions = '';
    this.lines = [];
    this.selectedLineIndex = -1;
    this.cancelDrag();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.imageLayer = null;
    this.originalImage = null;
    this.clearCanvas();
    this.setStatus('info', 'Image removed. Choose another image to continue.');
  }

  cancelProcessing(): void {
    if (!this.isLoading) {
      return;
    }

    this.operationId++;
    this.cancelDrag();
    this.isLoading = false;
    this.revokePendingImage();
    this.setStatus('info', 'Processing cancelled.');
  }

  async splitImage(): Promise<void> {
    const image = this.originalImage;
    if (!image || this.isLoading) {
      this.setStatus('error', 'Choose an image before slicing.');
      return;
    }

    this.normalizeLines();
    if (this.lines.length === 0) {
      this.setStatus('error', 'Add at least one cut line.');
      return;
    }

    const xPoints = this.createSlicePoints(
      this.lines.filter(line => line.type === 'vertical').map(line => line.position),
      this.sourceWidth
    );
    const yPoints = this.createSlicePoints(
      this.lines.filter(line => line.type === 'horizontal').map(line => line.position),
      this.sourceHeight
    );
    const totalPieces = (xPoints.length - 1) * (yPoints.length - 1);

    if (totalPieces > this.maxPieces) {
      this.setStatus('error', `This layout creates ${totalPieces.toLocaleString('en-US')} pieces. The limit is ${this.maxPieces.toLocaleString('en-US')}.`);
      return;
    }

    const operationId = this.startOperation(`Creating 1 of ${totalPieces.toLocaleString('en-US')} pieces…`);
    const outputFormat = this.outputFormat;
    const newImages: CroppedImage[] = [];
    let index = 1;
    let totalBytes = 0;

    try {
      for (let yIndex = 0; yIndex < yPoints.length - 1; yIndex++) {
        for (let xIndex = 0; xIndex < xPoints.length - 1; xIndex++) {
          if (!this.isCurrentOperation(operationId)) {
            this.discardImages(newImages);
            return;
          }

          const x = Math.round(xPoints[xIndex]);
          const y = Math.round(yPoints[yIndex]);
          const nextX = Math.round(xPoints[xIndex + 1]);
          const nextY = Math.round(yPoints[yIndex + 1]);
          const width = nextX - x;
          const height = nextY - y;

          if (width < 1 || height < 1) {
            continue;
          }
          if (width > this.maxCanvasDimension || height > this.maxCanvasDimension || width * height > this.maxWorkingPixels) {
            throw new Error('A piece exceeds the browser working-memory limit.');
          }

          const blob = await this.createCropBlob(image, x, y, width, height, outputFormat);
          totalBytes += blob.size;
          if (totalBytes > this.maxOutputBytes) {
            throw new Error('The generated output exceeds the browser memory limit.');
          }
          const extension = this.getExtensionForMime(blob.type, outputFormat);
          const previewUrl = URL.createObjectURL(blob);
          newImages.push({
            name: `piece_${String(index).padStart(3, '0')}.${extension}`,
            blob,
            previewUrl,
            width,
            height
          });
          index++;
          this.loadingMessage = `Creating ${Math.min(index, totalPieces).toLocaleString('en-US')} of ${totalPieces.toLocaleString('en-US')} pieces…`;
          await this.yieldToBrowser();
        }
      }

      if (!this.isCurrentOperation(operationId)) {
        this.discardImages(newImages);
        return;
      }

      if (newImages.length === 0) {
        throw new Error('No valid image pieces were created.');
      }

      this.invalidateCrops();
      this.croppedImages = newImages;
      this.setStatus('success', `${newImages.length.toLocaleString('en-US')} pieces created successfully.`);
    } catch (error: unknown) {
      this.discardImages(newImages);
      if (this.isCurrentOperation(operationId)) {
        const message = error instanceof Error && error.message.includes('limit')
          ? 'The image pieces are too large for this browser. Add more cut lines or use a smaller image.'
          : 'Could not create the image pieces. Check the image and cut lines.';
        this.setStatus('error', message);
      }
    } finally {
      if (this.isCurrentOperation(operationId)) {
        this.isLoading = false;
      }
    }
  }

  async downloadZip(): Promise<void> {
    if (this.croppedImages.length === 0 || this.isLoading) {
      this.setStatus('error', 'Slice the image before downloading a ZIP file.');
      return;
    }

    const images = [...this.croppedImages];
    const fileName = `${this.getSafeBaseName()}_sliced.zip`;
    const operationId = this.startOperation('Building ZIP archive…');

    try {
      const JSZipConstructor = (await import('jszip')).default;
      const zip = new JSZipConstructor();
      const folder = zip.folder('sliced_images');
      if (!folder) {
        throw new Error('Could not create ZIP folder.');
      }

      images.forEach(image => folder.file(image.name, image.blob));
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'STORE'
      });

      if (!this.isCurrentOperation(operationId)) {
        return;
      }

      this.downloadBlob(blob, fileName);
      this.setStatus('success', `ZIP archive with ${images.length.toLocaleString('en-US')} pieces downloaded.`);
    } catch {
      if (this.isCurrentOperation(operationId)) {
        this.setStatus('error', 'Could not create the ZIP archive.');
      }
    } finally {
      if (this.isCurrentOperation(operationId)) {
        this.isLoading = false;
      }
    }
  }

  downloadPiece(piece: CroppedImage): void {
    if (this.isLoading) {
      return;
    }

    this.downloadBlob(piece.blob, `${this.getSafeBaseName()}_${piece.name}`);
    this.setStatus('success', `${piece.name} downloaded.`);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isBrowser && this.originalImage) {
      this.scheduleCanvasSetup();
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.operationId++;
    this.isLoading = false;
    this.cancelDrag();
    this.cancelScheduledDraw();
    this.cancelCanvasSetup();
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.revokePendingImage();
    this.invalidateCrops();
    this.releaseImage();
    this.originalImage = null;
    this.imageLayer = null;
  }

  onOutputFormatChange(format: SliceOutputFormat): void {
    if (format === this.outputFormat || this.isLoading) {
      return;
    }

    this.outputFormat = format;
    this.invalidateCrops();
    this.setStatus('info', 'Output format changed. Slice the image again to apply it.');
  }

  lineTypeLabel(type: SliceLineType): string {
    return type === 'vertical' ? 'Vertical' : 'Horizontal';
  }

  lineMax(type: SliceLineType): number {
    return type === 'vertical' ? Math.max(0, this.sourceWidth - 1) : Math.max(0, this.sourceHeight - 1);
  }

  private async loadImage(file: File): Promise<void> {
    if (!this.isSupportedImage(file)) {
      this.setStatus('error', 'Choose a PNG, JPG, WEBP, AVIF, GIF, or BMP image.');
      return;
    }

    if (file.size > this.maxFileSize) {
      this.setStatus('error', 'The image is larger than the 50 MB limit.');
      return;
    }

    const operationId = this.startOperation('Loading image…');
    let objectUrl: string | null = null;

    try {
      objectUrl = URL.createObjectURL(file);
      this.pendingImageUrl = objectUrl;
      const image = await this.loadImageElement(objectUrl);

      if (!this.isCurrentOperation(operationId)) {
        this.revokeUrl(objectUrl);
        return;
      }

      const pixels = image.naturalWidth * image.naturalHeight;
      if (image.naturalWidth < 1 || image.naturalHeight < 1 || pixels > this.maxImagePixels) {
        throw new Error('Image dimensions are not supported.');
      }

      this.invalidateCrops();
      this.releaseImage();
      this.originalImage = image;
      this.imageUrl = objectUrl;
      this.pendingImageUrl = null;
      this.imageFileName = file.name;
      this.imageDimensions = `${image.naturalWidth.toLocaleString('en-US')} × ${image.naturalHeight.toLocaleString('en-US')}`;
      this.lines = [];
      this.selectedLineIndex = -1;
      this.scheduleCanvasSetup();
      this.setStatus('success', `Image “${file.name}” loaded. Add cut lines to continue.`);
    } catch {
      if (objectUrl && objectUrl !== this.imageUrl) {
        this.revokeUrl(objectUrl);
      }
      if (this.pendingImageUrl === objectUrl) {
        this.pendingImageUrl = null;
      }
      if (this.isCurrentOperation(operationId)) {
        this.setStatus('error', 'The selected image could not be read.');
      }
    } finally {
      if (this.isCurrentOperation(operationId)) {
        this.isLoading = false;
      }
    }
  }

  private isSupportedImage(file: File): boolean {
    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif', 'image/gif', 'image/bmp']);
    const allowedExtensions = new Set(['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp']);
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return allowedTypes.has(file.type.toLowerCase()) || allowedExtensions.has(extension);
  }

  private loadImageElement(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = url;
    });
  }

  private setupCanvas(): void {
    if (this.destroyed) {
      return;
    }
    const canvas = this.editorCanvas?.nativeElement;
    const image = this.originalImage;
    if (!canvas || !image || !this.isBrowser) {
      return;
    }

    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const parent = canvas.parentElement;
    const availableWidth = Math.max(parent?.clientWidth ?? canvas.clientWidth ?? 1, 1);
    const viewportHeight = Math.max(window.innerHeight * 0.65, 240);
    const displayScale = Math.min(1, availableWidth / sourceWidth, viewportHeight / sourceHeight);
    const cssWidth = Math.max(1, Math.floor(sourceWidth * displayScale));
    const cssHeight = Math.max(1, Math.floor(sourceHeight * displayScale));
    const deviceScale = Math.min(window.devicePixelRatio || 1, 1.5);
    const maxBackingPixels = 4_000_000;
    const requestedBackingPixels = cssWidth * cssHeight * deviceScale * deviceScale;
    const backingScale = requestedBackingPixels > maxBackingPixels
      ? deviceScale * Math.sqrt(maxBackingPixels / requestedBackingPixels)
      : deviceScale;

    canvas.width = Math.max(1, Math.ceil(cssWidth * backingScale));
    canvas.height = Math.max(1, Math.ceil(cssHeight * backingScale));
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    this.requestDraw();
  }

  private drawCanvas(): void {
    const canvas = this.editorCanvas?.nativeElement;
    const context = canvas?.getContext('2d');
    const image = this.originalImage;
    if (!canvas || !context || !image) {
      return;
    }

    const scaleX = canvas.width / image.naturalWidth;
    const scaleY = canvas.height / image.naturalHeight;
    const minScale = Math.min(scaleX, scaleY);

    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!this.imageLayer || this.imageLayer.width !== canvas.width || this.imageLayer.height !== canvas.height) {
      const layer = document.createElement('canvas');
      layer.width = canvas.width;
      layer.height = canvas.height;
      const layerContext = layer.getContext('2d');
      if (layerContext) {
        layerContext.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas.width, canvas.height);
        this.imageLayer = layer;
      }
    }
    if (this.imageLayer) {
      context.drawImage(this.imageLayer, 0, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, canvas.width, canvas.height);
    }
    context.save();
    context.lineWidth = Math.max(2, 3 * minScale);
    context.setLineDash([8 * minScale, 6 * minScale]);
    context.font = `700 ${Math.max(12, 14 * minScale)}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    this.lines.forEach((line, index) => {
      const isSelected = index === this.selectedLineIndex;
      context.strokeStyle = isSelected ? '#ffc107' : '#ff3b5c';
      context.fillStyle = '#ffffff';
      context.lineWidth = isSelected ? Math.max(3, 4 * minScale) : Math.max(2, 3 * minScale);
      context.beginPath();
      if (line.type === 'vertical') {
        const x = line.position * scaleX;
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
      } else {
        const y = line.position * scaleY;
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
      }
      context.stroke();

      const label = (index + 1).toLocaleString('en-US');
      const labelOffset = Math.max(12 * minScale, 12);
      if (line.type === 'vertical') {
        const x = Math.max(labelOffset, Math.min(line.position * scaleX, canvas.width - labelOffset));
        context.fillText(label, x, labelOffset);
      } else {
        const y = Math.max(labelOffset, Math.min(line.position * scaleY, canvas.height - labelOffset));
        context.fillText(label, labelOffset, y);
      }
    });

    context.restore();
  }

  private requestDraw(): void {
    if (this.destroyed || this.drawFrame !== null) {
      return;
    }

    const draw = (): void => {
      this.drawFrame = null;
      this.drawCanvas();
    };

    if (typeof requestAnimationFrame === 'function') {
      this.drawFrameUsesAnimation = true;
      this.drawFrame = requestAnimationFrame(draw);
    } else if (this.isBrowser) {
      this.drawFrameUsesAnimation = false;
      this.drawFrame = window.setTimeout(draw, 16);
    }
  }

  private cancelScheduledDraw(): void {
    if (this.drawFrame === null) {
      return;
    }

    if (this.drawFrameUsesAnimation && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.drawFrame);
    } else if (this.isBrowser) {
      window.clearTimeout(this.drawFrame);
    }
    this.drawFrame = null;
  }

  private scheduleCanvasSetup(): void {
    if (this.destroyed || !this.isBrowser || !this.originalImage) {
      return;
    }

    if (this.canvasSetupTimer !== null) {
      window.clearTimeout(this.canvasSetupTimer);
    }
    this.canvasSetupTimer = window.setTimeout(() => {
      this.canvasSetupTimer = null;
      this.setupCanvas();
    }, 0);
  }

  private cancelCanvasSetup(): void {
    if (this.canvasSetupTimer !== null && this.isBrowser) {
      window.clearTimeout(this.canvasSetupTimer);
      this.canvasSetupTimer = null;
    }
  }

  private observeCanvas(): void {
    if (!this.isBrowser) {
      return;
    }

    const parent = this.editorCanvas?.nativeElement.parentElement;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    if (!parent || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => this.scheduleCanvasSetup());
    this.resizeObserver.observe(parent);
  }

  private getCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    const canvas = this.editorCanvas?.nativeElement;
    if (!canvas || !this.originalImage) {
      return { x: 0, y: 0 };
    }

    const bounds = canvas.getBoundingClientRect();
    return {
      x: this.clamp((clientX - bounds.left) * (this.sourceWidth / Math.max(bounds.width, 1)), 0, this.sourceWidth),
      y: this.clamp((clientY - bounds.top) * (this.sourceHeight / Math.max(bounds.height, 1)), 0, this.sourceHeight)
    };
  }

  private findNearestLine(clientX: number, clientY: number): number {
    const canvas = this.editorCanvas?.nativeElement;
    if (!canvas || !this.originalImage) {
      return -1;
    }

    const point = this.getCanvasPoint(clientX, clientY);
    const bounds = canvas.getBoundingClientRect();
    const sourceScaleX = this.sourceWidth / Math.max(bounds.width, 1);
    const sourceScaleY = this.sourceHeight / Math.max(bounds.height, 1);
    let nearestIndex = -1;
    let nearestDistance = 22;

    this.lines.forEach((line, index) => {
      const distance = line.type === 'vertical'
        ? Math.abs(point.x - line.position) / sourceScaleX
        : Math.abs(point.y - line.position) / sourceScaleY;
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });

    return nearestIndex;
  }

  private findAvailablePosition(type: SliceLineType, size: number): number | null {
    const existing = this.lines
      .filter(line => line.type === type)
      .map(line => line.position)
      .sort((first, second) => first - second);
    const gaps: Array<{ start: number; end: number }> = [];
    let previous = 0;

    existing.forEach(position => {
      if (position - previous > 1) {
        gaps.push({ start: previous, end: position });
      }
      previous = position;
    });
    if (size - previous > 1) {
      gaps.push({ start: previous, end: size });
    }

    const gap = gaps.sort((first, second) => (second.end - second.start) - (first.end - first.start))[0];
    return gap ? Math.floor((gap.start + gap.end) / 2) : null;
  }

  private clampLinePosition(type: SliceLineType, position: number): number {
    const size = type === 'vertical' ? this.sourceWidth : this.sourceHeight;
    return Math.round(this.clamp(position, 1, Math.max(1, size - 1)));
  }

  private normalizeLines(): void {
    const normalizedLines = this.lines
      .map(line => ({
        type: line.type,
        position: this.clampLinePosition(line.type, line.position)
      }))
      .sort((first, second) => first.type === second.type
        ? first.position - second.position
        : first.type === 'vertical' ? -1 : 1);
    this.lines = normalizedLines.filter((line, index, lines) =>
      index === 0 || line.type !== lines[index - 1].type || line.position !== lines[index - 1].position
    );
    this.selectedLineIndex = -1;
    this.invalidateCrops();
  }

  private createSlicePoints(positions: number[], size: number): number[] {
    if (size < 1) {
      return [0, size];
    }

    const validPositions = positions
      .filter(position => Number.isFinite(position) && position > 0 && position < size)
      .map(position => Math.round(position))
      .filter(position => position > 0 && position < size)
      .sort((first, second) => first - second)
      .filter((position, index, values) => index === 0 || position !== values[index - 1]);

    return [0, ...validPositions, size];
  }

  private cancelDrag(): void {
    const canvas = this.editorCanvas?.nativeElement;
    const pointerId = this.activePointerId;
    this.isDragging = false;
    this.dragIndex = -1;
    this.dragOffset = 0;
    this.activePointerId = null;

    if (canvas && pointerId !== null && typeof canvas.hasPointerCapture === 'function' &&
      canvas.hasPointerCapture(pointerId) && typeof canvas.releasePointerCapture === 'function') {
      try {
        canvas.releasePointerCapture(pointerId);
      } catch {
        canvas.style.cursor = 'default';
      }
    }
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  private startOperation(message: string): number {
    this.cancelDrag();
    this.operationId++;
    this.isLoading = true;
    this.statusVisible = false;
    this.loadingMessage = message;
    return this.operationId;
  }

  private isCurrentOperation(operationId: number): boolean {
    return !this.destroyed && operationId === this.operationId;
  }

  private async createCropBlob(
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    format: SliceOutputFormat
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is not supported.');
    }

    canvas.width = width;
    canvas.height = height;
    if (format === 'jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, x, y, width, height, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create image blob.'));
        }
      }, this.getMimeForFormat(format), format === 'jpeg' ? 0.92 : undefined);
    });
  }

  private getMimeForFormat(format: SliceOutputFormat): string {
    if (format === 'jpeg') {
      return 'image/jpeg';
    }
    if (format === 'webp') {
      return 'image/webp';
    }
    return 'image/png';
  }

  private getExtensionForMime(mime: string, fallback: SliceOutputFormat): string {
    if (mime === 'image/jpeg') {
      return 'jpg';
    }
    if (mime === 'image/webp') {
      return 'webp';
    }
    if (mime === 'image/png') {
      return 'png';
    }
    return fallback === 'jpeg' ? 'jpg' : fallback;
  }

  private invalidateCrops(): void {
    if (this.croppedImages.length === 0) {
      return;
    }

    this.croppedImages.forEach(image => this.revokeUrl(image.previewUrl));
    this.croppedImages = [];
  }

  private discardImages(images: CroppedImage[]): void {
    images.forEach(image => this.revokeUrl(image.previewUrl));
  }

  private releaseImage(): void {
    this.revokeUrl(this.imageUrl);
    this.imageUrl = null;
    this.imageLayer = null;
  }

  private revokePendingImage(): void {
    this.revokeUrl(this.pendingImageUrl);
    this.pendingImageUrl = null;
  }

  private revokeUrl(url: string | null): void {
    if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      URL.revokeObjectURL(url);
    }
  }

  private getSafeBaseName(): string {
    const fileName = this.imageFileName.trim();
    const nameWithoutExtension = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
    return nameWithoutExtension.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_') || 'image';
  }

  private clearCanvas(): void {
    const canvas = this.editorCanvas?.nativeElement;
    if (canvas) {
      canvas.width = 1;
      canvas.height = 1;
      canvas.style.width = '1px';
      canvas.style.height = '1px';
    }
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    if (!this.isBrowser) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => this.revokeUrl(url), 1000);
  }

  private async yieldToBrowser(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    await new Promise<void>(resolve => window.setTimeout(resolve, 0));
  }

  private clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(maximum, Math.max(minimum, value));
  }

  private setStatus(type: StatusType, message: string): void {
    this.statusType = type;
    this.statusMessage = message;
    this.statusVisible = true;
  }
}
