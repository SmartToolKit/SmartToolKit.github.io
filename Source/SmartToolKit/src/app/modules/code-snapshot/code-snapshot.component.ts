import { Component } from '@angular/core';

@Component({
  selector: 'app-code-snapshot',
  templateUrl: './code-snapshot.component.html',
  styleUrls: ['./code-snapshot.component.scss'] // Fix: changed 'styleUrl' to 'styleUrls'
})
export class CodeSnapshotComponent {
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

  context = {
    selectedTemplate: '',
    minWidth:300,
    model: [] as ContentModel[]
  };

  constructor() {
    this.context.selectedTemplate = this.templates[1].id;

    this.context.model.push({ type: 'text', html: 'We will write a simple program C# that displays Hello, World! on the screen.' });
    this.context.model.push({ type: 'code', html: this.simpleCode});
    this.context.model.push({ type: 'text', html: 'Output' });
    this.context.model.push({ type: 'text', html: 'Hello World!' });

  }
  log() {

    console.log(this.context);
  }
  addCode() {
    this.context.model.push({ type: 'code', html: this.simpleCode });
  }
  onContentChange(event: any, item: any): void {
    item.html = event.target.innerHTML;
  }
  remove() {
    this.context.model.pop()
  }
  addText() {
    this.context.model.push({ type: 'text', html: 'My text' });
  }

  simpleCode = `public class Program
{
    public static void Main(string[] args)
    {
        System.Console.WriteLine("Hello, World!");
    }
}`;
}


interface ContentModel {
  type: 'text' | 'code'; // Either 'text' or 'code'
  html: string; // Represents the HTML content as a string
}
