import { Component } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ActionHelperService } from '../../core/services/action-helper.service';

@Component({
  selector: 'app-java-script-minifier',
  templateUrl: './java-script-minifier.component.html',
  styleUrls: ['./java-script-minifier.component.scss']
})
export class JavaScriptMinifierComponent {
  formattedCode: string = '';  // Formatted code
  minifiedCode: string = '';   // Minified code

  constructor(
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - JavaScript Minifier");
  }

  ngAfterViewInit(): void {
    this.formattedCode = localStorage.getItem("java-script-minifier-page") ?? '';
    this.minifyCode();
  }

  openFile(): void {
    this.fileHelper.openFile('.js').then(content => {
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
      inputLabel: 'Your Js file URL',
      inputPlaceholder: 'https://example.com/example.js',
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
          this.formattedCode = response as string;
          this.minifyCode();
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
    this.formattedCode = await this.actionHelper.paste();
    this.minifyCode();
  }


  download() {
    if (!this.minifiedCode) return

    const filename = `JavaScriptMinifier-${new Date().getTime()}.js`;

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

  save() {
    localStorage.setItem("java-script-minifier-page", this.formattedCode);
    swal.fire('Success', 'JavaScript code saved successfully!', 'success');
  }

  minifyCode() {
    if (this.formattedCode.trim()) {
      // Remove comments
      const removeComments = this.formattedCode
        .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')
        .replace(/\n/g, ' ') // Replace new lines with space
        .replace(/\s{2,}/g, ' ') // Remove extra spaces
        .trim(); // Trim leading and trailing whitespace

      // Minify by removing extra spaces
      this.minifiedCode = removeComments
        .replace(/\s*([{}();,])/g, '$1') // Remove extra spaces around special characters
        .replace(/([{}();,])\s*/g, '$1') // Remove extra spaces after special characters
        .replace(/(\s*=>\s*)/g, '=>') // Optimize arrow function
        .replace(/\s*=\s*/g, '=') // Optimize assignment
        .replace(/\s*\+\s*/g, '+') // Optimize addition
        .replace(/\s*-\s*/g, '-') // Optimize subtraction
        .replace(/\s*\*\s*/g, '*') // Optimize multiplication
        .replace(/\s*\/\s*/g, '/') // Optimize division
        .replace(/\s*%\s*/g, '%'); // Optimize modulus
    }
  }

}
