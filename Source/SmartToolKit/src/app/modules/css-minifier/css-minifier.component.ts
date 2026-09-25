import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ActionHelperService } from '../../core/services/action-helper.service';

@Component({
  selector: 'app-css-minifier',
  templateUrl: './css-minifier.component.html',
  styleUrls: ['./css-minifier.component.scss']
})
export class CssMinifierComponent {
  formattedCode = '';
  minifiedCode = '';
  private readonly isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService,
    @Inject(PLATFORM_ID) platformId: object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.titleService.setTitle("Smart ToolKit - CSS Minifier");
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      try {
        this.formattedCode = localStorage.getItem('css-minifier-page') ?? '';
      } catch {
        this.formattedCode = '';
      }
    }
    this.minifyCode();
  }
  openFile(): void {
    this.fileHelper.openFile('.css').then(content => {
      this.formattedCode = content
      this.minifyCode()
    }).catch(error => {
      console.error('Error:', error);
    });
  }

  readAsUrl() {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: 'Your CSS file URL',
      inputPlaceholder: 'https://example.com/example.css',
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
        this.http.get(result.value).subscribe((response) => {
          this.formattedCode = response as string;
          this.minifyCode();
          swal.fire({
            title: 'Success',
            text: 'The CSS code has been fetched and minified successfully.',
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

  async paste(): Promise<void> {
    const content = await this.actionHelper.paste();
    if (content) {
      this.formattedCode = content;
      this.minifyCode();
    }
  }

  download() {
    if (!this.minifiedCode) return

    const filename = `CSSMinifier-${new Date().getTime()}.css`;
    if (this.fileHelper.download(this.minifiedCode, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your minified code has been downloaded as ${filename}.`,
        icon: 'success'
      });
    }
  }

  copy() {
    this.actionHelper.copy(this.minifiedCode);
  }

  save(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem('css-minifier-page', this.formattedCode);
      void swal.fire('Success', 'CSS code saved successfully!', 'success');
    } catch {
      void swal.fire('Error', 'CSS code could not be saved.', 'error');
    }
  }

  minifyCode(): void {
    this.minifiedCode = '';
    if (!this.formattedCode.trim()) {
      return;
    }

    let minified = this.formattedCode.replace(/\/\*[\s\S]*?\*\//g, '');
    minified = minified.replace(/\s+/g, ' ').trim();
    minified = minified.replace(/\s*{\s*/g, '{').replace(/\s*}\s*/g, '}').replace(/\s*;\s*/g, ';').replace(/\s*:\s*/g, ':');
    minified = minified.replace(/\s*,\s*/g, ',').replace(/\s*>\s*/g, '>').replace(/\s*~\s*/g, '~').replace(/\s*\+\s*/g, '+');

    this.minifiedCode = minified;
  }
}
