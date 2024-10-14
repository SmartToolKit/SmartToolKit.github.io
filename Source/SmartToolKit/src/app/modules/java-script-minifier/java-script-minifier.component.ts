import { Component } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-java-script-minifier',
  templateUrl: './java-script-minifier.component.html',
  styleUrls: ['./java-script-minifier.component.scss']
})
export class JavaScriptMinifierComponent {
  formattedCode: string = '';  // Formatted code
  minifiedCode: string = '';   // Minified code

  constructor(private http: HttpClient, private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit - JavaScript Minifier");
  }

  ngAfterViewInit(): void {
    this.formattedCode = localStorage.getItem("java-script-minifier-page") ?? '';
    this.minifyCode();
  }

  openFile(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.formattedCode = e.target?.result as string;
        this.minifyCode();
        swal.fire({
          title: 'File Loaded',
          text: 'The JavaScript file has been successfully loaded and minified.',
          icon: 'success'
        });
      };

      reader.onerror = () => {
        swal.fire({
          title: 'Error',
          text: 'There was an error reading the file. Please try again.',
          icon: 'error'
        });
      };

      reader.readAsText(file);
    } else {
      swal.fire({
        title: 'No File Selected',
        text: 'Please select a JavaScript file to continue.',
        icon: 'warning'
      });
    }
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
        } else if (!this.isValidUrl(value)) {
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

  paste() {
    navigator.clipboard.readText().then((text) => {
      this.formattedCode = text;
      this.minifyCode();
      swal.fire({
        title: 'Pasted',
        text: 'The code from your clipboard has been pasted and minified.',
        icon: 'success'
      });
    }).catch(err => {
      swal.fire({
        title: 'Clipboard Error',
        text: 'Failed to read clipboard contents. Please try again.',
        icon: 'error'
      });
      console.error('Failed to read clipboard contents: ', err);
    });
  }

  download() {
    if (!this.minifiedCode) return

    const filename = `JavaScriptMinifier-${new Date().getTime()}.js`;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.minifiedCode));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    swal.fire({
      title: 'Download Ready',
      text: `Your minified code has been downloaded as ${filename}.`,
      icon: 'success'
    });
  }

  copy() {
    const textarea = document.createElement('textarea');
    textarea.value = this.minifiedCode;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    swal.fire({
      title: 'Copied',
      text: 'The minified code has been copied to your clipboard.',
      icon: 'success'
    });
  }

  // Helper function to validate URL
  isValidUrl(url: string): boolean {
    const pattern = new RegExp('^(https?:\\/\\/)?' + // Protocol
      '((([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // Domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR IP (v4) address
      '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // Port and path
      '(\\?[;&a-zA-Z\\d%_.~+=-]*)?' + // Query string
      '(\\#[-a-zA-Z\\d_]*)?$', 'i'); // Fragment locator
    return !!pattern.test(url);
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
