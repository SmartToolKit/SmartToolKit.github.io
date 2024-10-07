import { Component, Input } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrl: './json-viewer.component.scss'
})
export class JsonViewerComponent {
  constructor(private http: HttpClient, private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit - Json Viewer")
  }

  page = "Format";
  ngAfterViewInit(): void {
    this.page = localStorage.getItem("json-viewer-page") ?? "Format";
    this.jsonContent = localStorage.getItem("json-viewer-jsonContent") ?? "{}";
    this.realoadView();
  }
  getrow() {
    var lines = this.jsonContent.split('\n').length;
    return lines > 10 ? lines : 10;
  }
  save() {
    localStorage.setItem("json-viewer-page", this.page);
    localStorage.setItem("json-viewer-jsonContent", this.jsonContent);
  }

  jsonContent: string = "";

  jsonFormatter(type: string) {
    try {
      this.page = type;
      if (type == "Format") {
        this.jsonContent = JSON.stringify(JSON.parse(this.jsonContent), null, "\t");
      } else {
        this.jsonContent = JSON.stringify(JSON.parse(this.jsonContent));
      }
      console.log('Formatted JSON:', this.jsonContent);
    } catch (error) {
      alert('Invalid JSON input!');
    }
  }

  jsonObject: any = {};
  jsonViewer() {
    try {
      this.page = "Viewer";
      this.jsonObject = JSON.parse(this.jsonContent);

    } catch (error) {
      alert('Invalid JSON input!');
    }
  }
  download() {

    var filename = `JsonViewer-${new Date().getTime()}.json`

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(this.jsonContent));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element)
  }
  openFile(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        this.jsonContent = e.target?.result as string;
        this.jsonViewer(); // Reparse the content to show the JSON
      };

      reader.onerror = () => {
        alert('Error reading file!');
      };

      reader.readAsText(file);
    }
  }

  readAsUrl() {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: 'Your website URL',
      inputPlaceholder: 'https://example.com',
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
        this.http.get(result.value).subscribe((response) => {
          this.jsonContent = JSON.stringify(response)
          this.realoadView();
        });

      }
    });
  }
  paste() {
    navigator.clipboard.readText().then((text) => {
      this.jsonContent = text;
      this.realoadView();
    }).catch(err => {
      console.error('Failed to read clipboard contents: ', err);
    });
  }

  copy() {
    const textarea = document.createElement('textarea');
    textarea.value = this.jsonContent;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
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
  realoadView() {
    if (this.page == "Format" || this.page == "Remove white space") {
      this.jsonFormatter(this.page)
    } else {
      this.jsonViewer();
    }
  }
}
