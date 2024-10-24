import { Component } from '@angular/core';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-code-snapshot',
  templateUrl: './code-snapshot.component.html',
  styleUrls: ['./code-snapshot.component.scss'] // Fix: changed 'styleUrl' to 'styleUrls'
})
export class CodeSnapshotComponent {
  dirs = [
    "justifyLeft", "justifyCenter", "justifyRight"
  ]
  templates = [
    {
      text: "Night",
      id: "template-night",
    },
    {
      text: "Fantasy",
      id: "template-fantasy",
    }
  ];
  foreColorsEdit = false
  backColorsEdit = false
  context = {
    selectedTemplate: '',
    padding: 30,
    minWidth: 400,
    model: [] as ContentModel[],
    foreColors: ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
    backColors: ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
  };

  constructor() {
    this.context.selectedTemplate = this.templates[1].id;

    this.context.model.push({ type: 'text', html: 'We will write a simple program C# that displays Hello, World! on the screen.' });
    this.context.model.push({ type: 'code', header: "Program.cs", html: this.simpleCode });
    this.context.model.push({ type: 'text', html: 'Output' });
    this.context.model.push({ type: 'text', html: 'Hello World!' });

  }
  captureDiv() {
    const div = document.getElementById('captureDiv');  // Your div's id
    if (div) {
      html2canvas(div).then(canvas => {
        // Save the snapshot or display it
        const imgData = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = imgData;
        downloadLink.download = 'snapshot.png';
        downloadLink.click();
      });
    }
  }

  addCode() {
    this.context.model.push({ type: 'code', header: "Program.cs", html: this.simpleCode });
  }
  onContentChange(event: any, html: any): void {
    html = event.target.innerHTML;
  }
  remove() {
    this.context.model.pop()
  }
  addText() {
    this.context.model.push({ type: 'text', html: 'My text' });
  }

  execCommand(cmd: string) {
    document.execCommand(cmd);
  }

  execCommandColor(colorType: string, color: string) {
    document.execCommand(colorType, false, color);
  }


  updateForeColor(event: Event, index: number): void {
    const inputElement = event.target as HTMLInputElement;
    this.context.foreColors[index] = inputElement.value;  // به‌روزرسانی رنگ انتخابی در آرایه
  }

  updatebackColor(event: Event, index: number): void {
    const inputElement = event.target as HTMLInputElement;
    this.context.backColors[index] = inputElement.value;  // به‌روزرسانی رنگ انتخابی در آرایه
  }

  simpleCode = `<div>public class Program</div><div>{</div><div>&nbsp; &nbsp; public static void Main(string[] args)</div><div>&nbsp; &nbsp; {</div><div>&nbsp; &nbsp; &nbsp; &nbsp; System.Console.WriteLine("Hello, World!");</div><div>&nbsp; &nbsp; }</div><div>}</div>`;
}


interface ContentModel {
  type: 'text' | 'code'; // Either 'text' or 'code'
  html: string; // Represents the HTML content as a string
  header?: string; // Represents the HTML content as a string
}
