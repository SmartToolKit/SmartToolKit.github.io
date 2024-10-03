import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-json-viewer',
  templateUrl: './json-viewer.component.html',
  styleUrl: './json-viewer.component.scss'
})
export class JsonViewerComponent {

  page = "Format";
  ngAfterViewInit(): void {
    this.page = localStorage.getItem("json-viewer-page") ?? "Format";
    this.jsonContent = localStorage.getItem("json-viewer-jsonContent") ?? "{}";

    if (this.page == "Format" || this.page == "Remove white space") {
      this.jsonFormatter(this.page)
    } else {
      this.jsonViewer();
    }
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
    // const dialogRef = this.dialog.open(ModalComponent, {
    //   width: '400px',
    // });


  }
}
