import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { json } from 'stream/consumers';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  constructor(public router: Router, private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit")
    this.loadBookmarks()
    this.sort();
  }
  tools = [
    {
      title: "JSON Viewer",
      description: "Easily view and format JSON data, making it more readable and easier to work with.",
      icon: "./assets/images/json-viewer.svg",
      url: "json-viewer",
      bookmark: false
    },
    {
      title: "JWT Viewer",
      description: "Decode and verify JWT tokens with this easy-to-use tool.",
      icon: "./assets/images/jwt-viewer.svg",
      url: "jwt-viewer",
      bookmark: false
    },
    {
      title: "GUID Generator",
      description: "Generate unique GUIDs for use in your applications and databases.",
      icon: "./assets/images/guid-generator.svg",
      url: "guid-generator",
      bookmark: false
    },
    {
      title: "Rsa Key Generator",
      description: "Generate RSA keys for cryptographic purposes.",
      icon: "./assets/images/rsa-key-generator.svg",
      url: "rsa-key-generator",
      bookmark: false
    },
    {
      title: "Regex Tester",
      description: "Test and validate regular expressions.",
      icon: "./assets/images/regex-tester.svg",
      url: "regex-tester",
      bookmark: false
    },
    {
      title: "Convert To Base64",
      description: "Convert your files or text into Base64 format.",
      icon: "./assets/images/convert-to-base64.svg",
      url: "convert-to-base64",
      bookmark: false
    },
    {
      title: "Image Resizer",
      description: "Resize images to desired dimensions.",
      icon: "./assets/images/image-resizer.svg",
      url: "image-resizer",
      bookmark: false
    },
    {
      title: "JavaScript Minifier",
      description: "Minify your JavaScript code for better performance.",
      icon: "./assets/images/java-script-minifier.svg",
      url: "java-script-minifier",
      bookmark: false
    },
    {
      title: "Css Minifier",
      description: "Minify your CSS files to reduce file size.",
      icon: "./assets/images/css-minifier.svg",
      url: "css-minifier",
      bookmark: false
    },
    {
      title: "Svg Editor",
      description: "Edit and optimize your SVG files.",
      icon: "./assets/images/svg-editor.svg",
      url: "svg-editor",
      bookmark: false
    },
    {
      title: "QR Code Generator",
      description: "Generate QR codes quickly and easily for URLs, text, or other data.",
      icon: "./assets/images/qrcode-generator.svg",
      url: "qrcode-generator",
      bookmark: false
    },
    {
      title: "BarCode Generator",
      description: "Create barcodes for various formats, ideal for product labeling and inventory management.",
      icon: "./assets/images/barcode-generator.svg",
      url: "barcode-generator",
      bookmark: false
    },
    {
      title: "Code Snapshot",
      description: "Capture and save code snippets with syntax highlighting for sharing or documentation.",
      icon: "./assets/images/code-snapshot.svg",
      url: "code-snapshot",
      bookmark: false
    }
  ];
  onBookmarkClick(event: MouseEvent, item: any): void {
    event.preventDefault();
    event.stopPropagation();
    item.bookmark = !item.bookmark
    this.sort();
    localStorage.setItem("dashboard-bookmark", JSON.stringify(this.tools.filter(p => p.bookmark).map(p => p.url)))
  }
  sort() {
    this.tools = this.tools.sort((a, b) => Number(b.bookmark) - Number(a.bookmark));
  }
  goto(item: any) {
    this.router.navigate([item.url])
  }
  loadBookmarks() {
    const bookmarkSaved = localStorage.getItem("dashboard-bookmark");
    if (!bookmarkSaved) return;

    const savedBookmarks = JSON.parse(bookmarkSaved) as string[];
    this.tools.forEach(tool => {
      tool.bookmark = savedBookmarks.includes(tool.url);
    });
  }

}
