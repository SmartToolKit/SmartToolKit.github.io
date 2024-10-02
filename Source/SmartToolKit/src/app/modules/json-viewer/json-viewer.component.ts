import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-viewer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './json-viewer.component.html',
  styleUrls: ['./json-viewer.component.scss']
})
export class JsonViewerComponent {

  jsonContent: string = "";

  jsonFormatter(type: number) {
    try {
debugger
      if (type == 1) {
        this.jsonContent = JSON.stringify(JSON.parse(this.jsonContent));

      } else {
        this.jsonContent = JSON.stringify(JSON.parse(this.jsonContent), null, "\t");
      }
      console.log('Formatted JSON:', this.jsonContent);
    } catch (error) {
      alert('Invalid JSON input!');
    }
  }

  jsonViewer() {
    try {
      alert('todo!');

    } catch (error) {
      alert('Invalid JSON input!');
    }
  }
}
