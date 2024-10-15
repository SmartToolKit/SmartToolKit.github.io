import { Component } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ActionHelperService } from '../../core/services/action-helper.service';

@Component({
  selector: 'app-json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss']
})
export class JsonViewerComponent {
  constructor(
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - Json Viewer");
  }

  page = "Format";
  jsonContent: string = "";

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
    swal.fire('Success', 'Json content saved successfully!', 'success');
  }

  jsonFormatter(type: string) {
    try {
      this.page = type;
      if (type === "Format") {
        this.jsonContent = JSON.stringify(JSON.parse(this.jsonContent), null, "\t");
      } else {
        this.jsonContent = JSON.stringify(JSON.parse(this.jsonContent));
      }
      console.log('Formatted JSON:', this.jsonContent);
    } catch (error) {
      swal.fire('Error', 'Invalid JSON input!', 'error');
    }
  }

  jsonObject: any = {};

  jsonViewer() {
    try {
      this.page = "Viewer";
      this.jsonObject = JSON.parse(this.jsonContent);
    } catch (error) {
      swal.fire('Error', 'Invalid JSON input!', 'error');
    }
  }

  download() {
    if (!this.jsonContent) return
    const filename = `JsonViewer-${new Date().getTime()}.json`;

    if (this.fileHelper.download(this.jsonContent, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your JSON downloaded as ${filename}.`,
        icon: 'success'
      });
    }
  }

  openFile(): void {
    this.fileHelper.openFile('.json').then(content => {
      this.jsonContent = content
      this.jsonViewer();
    }).catch(error => {
      console.error('Error:', error);
    });
  }

  readAsUrl() {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: 'Your Json file URL',
      inputPlaceholder: 'https://example.com/example.json',
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
        this.http.get(result.value).subscribe(
          (response) => {
            this.jsonContent = JSON.stringify(response);
            this.realoadView();
            swal.fire('Success', 'JSON loaded from URL successfully!', 'success');
          },
          (error) => {
            swal.fire('Error', 'Failed to load JSON from URL!', 'error');
          }
        );
      }
    });
  }
  async paste() {
    this.jsonContent = await this.actionHelper.paste();
    this.realoadView();
  }


  copy() {
    this.actionHelper.copy(this.jsonContent);
  }

  realoadView() {
    if (this.page === "Format" || this.page === "Remove white space") {
      this.jsonFormatter(this.page);
    } else {
      this.jsonViewer();
    }
  }
}
