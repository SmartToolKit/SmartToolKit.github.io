import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { FileHelperService } from '../../core/services/file-helper.service';
import swal from 'sweetalert2';
import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-svg-editor',
  templateUrl: './svg-editor.component.html',
  styleUrl: './svg-editor.component.scss'
})
export class SvgEditorComponent {
  svgCode: string = `<svg width="800px" height="800px" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill="blue" d="M13.5 3.5H14V3.29289L13.8536 3.14645L13.5 3.5ZM10.5 0.5L10.8536 0.146447L10.7071 0H10.5V0.5ZM2.5 6.5V6H2V6.5H2.5ZM2.5 8.5H2V9H2.5V8.5ZM4.5 8.5H5V8H4.5V8.5ZM4.5 10.5V11H5V10.5H4.5ZM6.5 9.5H6V9.70711L6.14645 9.85355L6.5 9.5ZM7.5 10.5L7.14645 10.8536L7.5 11.2071L7.85355 10.8536L7.5 10.5ZM8.5 9.5L8.85355 9.85355L9 9.70711V9.5H8.5ZM10.5 6.5V6H10V6.5H10.5ZM10.5 10.5H10V11H10.5V10.5ZM12.5 10.5V11H13V10.5H12.5ZM2 5V1.5H1V5H2ZM13 3.5V5H14V3.5H13ZM2.5 1H10.5V0H2.5V1ZM10.1464 0.853553L13.1464 3.85355L13.8536 3.14645L10.8536 0.146447L10.1464 0.853553ZM2 1.5C2 1.22386 2.22386 1 2.5 1V0C1.67157 0 1 0.671573 1 1.5H2ZM1 12V13.5H2V12H1ZM2.5 15H12.5V14H2.5V15ZM14 13.5V12H13V13.5H14ZM12.5 15C13.3284 15 14 14.3284 14 13.5H13C13 13.7761 12.7761 14 12.5 14V15ZM1 13.5C1 14.3284 1.67157 15 2.5 15V14C2.22386 14 2 13.7761 2 13.5H1ZM5 6H2.5V7H5V6ZM2 6.5V8.5H3V6.5H2ZM2.5 9H4.5V8H2.5V9ZM4 8.5V10.5H5V8.5H4ZM4.5 10H2V11H4.5V10ZM6 6V9.5H7V6H6ZM6.14645 9.85355L7.14645 10.8536L7.85355 10.1464L6.85355 9.14645L6.14645 9.85355ZM7.85355 10.8536L8.85355 9.85355L8.14645 9.14645L7.14645 10.1464L7.85355 10.8536ZM9 9.5V6H8V9.5H9ZM13 6H10.5V7H13V6ZM10 6.5V10.5H11V6.5H10ZM10.5 11H12.5V10H10.5V11ZM13 10.5V8.5H12V10.5H13Z" />
</svg>`;

  bgColor = "rgb(0,0,0,0)"
  @ViewChild('svgContainer', { static: false }) svgContainer!: ElementRef;

  constructor(private renderer: Renderer2,
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - Svg Editor");
  }

  ngAfterViewInit(): void {
    this.svgCode = localStorage.getItem("svg-editor-page") ?? this.svgCode;
    this.process();
  }

  openFile(): void {
    this.fileHelper.openFile('.svg').then(content => {
      this.svgCode = content
      this.process()
    }).catch(error => {
      console.error('Error:', error);
    });
  }

  readAsUrl() {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: 'Your Svg file URL',
      inputPlaceholder: 'https://example.com/example.svg',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a URL!';
        } else if (!this.validationHelper.isValidUrl(value)) {
          return 'Please enter a valid URL!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.get(result.value, { responseType: 'text' }).subscribe((response) => {
          this.svgCode = response as string;
          this.process();
          swal.fire({
            title: 'Success',
            text: 'The JavaScript code has been fetched and minified successfully.',
            icon: 'success'
          });
        }, error => {
          swal.fire({
            title: 'Error',
            text: 'Failed to fetch the code from the URL. Please check the URL and try again.',
            icon: 'error'
          });
        });
      }
    });
  }

  async paste() {
    this.svgCode = await this.actionHelper.paste();
    this.process();
  }


  download() {
    if (!this.svgCode) return

    const filename = `Svg-${new Date().getTime()}.svg`;

    if (this.fileHelper.download(this.svgCode, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your minified code has been downloaded as ${filename}.`,
        icon: 'success'
      });
    }
  }

  copy() {
    this.actionHelper.copy(this.svgCode);
  }

  save() {
    localStorage.setItem("svg-editor-page", this.svgCode);
    swal.fire('Success', 'Svg saved successfully!', 'success');
  }
  boxHeight = '300px'

  process() {
    if (this.svgCode.trim()) {
      this.renderer.setProperty(this.svgContainer.nativeElement, 'innerHTML', '');

      // Insert the new SVG content directly
      this.renderer.setProperty(this.svgContainer.nativeElement, 'innerHTML', this.svgCode);

      this.boxHeight = `${(document.querySelector('textarea')?.offsetHeight || 300)}px`;
    }
  }

  scale = 0.5
  zoomSVG(event: WheelEvent) {
    event.preventDefault(); // جلوگیری از اسکرول پیش‌فرض

    const zoomStep = 0.1; // میزان زوم در هر حرکت
    if (event.deltaY < 0) {
      this.scale += zoomStep; // زوم کردن
    } else {
      this.scale -= zoomStep; // زوم معکوس
      if (this.scale < 0.1) {
        this.scale = 0.1; // جلوگیری از زوم منفی
      }
    }

    // اعمال مقیاس بر روی محتوای SVG
    this.renderer.setStyle(this.svgContainer.nativeElement, 'transform', `translate(-50%, -50%) scale(${this.scale})`);
  }
}