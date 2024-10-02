import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss']
})
export class JsonViewerComponent implements AfterViewInit {

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

  jsonViewer() {
    try {
      this.page = "Viewer";

      alert('todo!');

    } catch (error) {
      alert('Invalid JSON input!');
    }
  }
  download() { }
}
