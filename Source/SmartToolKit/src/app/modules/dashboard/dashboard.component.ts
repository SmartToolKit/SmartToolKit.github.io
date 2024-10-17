import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  constructor(public router: Router, private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit")
  }
tools = [
    {
      title: "JSON Viewer",
      description: "Easily view and format JSON data, making it more readable and easier to work with.",
      icon: "./assets/images/json-viewer.svg",
      url: "json-viewer"
    },
    {
      title: "JWT Viewer",
      description: "Decode and verify JWT tokens with this easy-to-use tool.",
      icon: "./assets/images/jwt-viewer.svg",
      url: "jwt-viewer"
    },
    {
      title: "GUID Generator",
      description: "Generate unique GUIDs for use in your applications and databases.",
      icon: "./assets/images/guid-generator.svg",
      url: "guid-generator"
    },
    {
      title: "Rsa Key Generator",
      description: "Generate RSA keys for cryptographic purposes.",
      icon: "./assets/images/rsa-key-generator.svg",
      url: "rsa-key-generator"
    },
    {
      title: "Regex Tester",
      description: "Test and validate regular expressions.",
      icon: "./assets/images/regex-tester.svg",
      url: "regex-tester"
    },
    {
      title: "Convert To Base64",
      description: "Convert your files or text into Base64 format.",
      icon: "./assets/images/convert-to-base64.svg",
      url: "convert-to-base64"
    },
    {
      title: "Image Resizer",
      description: "Resize images to desired dimensions.",
      icon: "./assets/images/image-resizer.svg",
      url: "image-resizer"
    },
    {
      title: "JavaScript Minifier",
      description: "Minify your JavaScript code for better performance.",
      icon: "./assets/images/java-script-minifier.svg",
      url: "java-script-minifier"
    },
    {
      title: "Css Minifier",
      description: "Minify your CSS files to reduce file size.",
      icon: "./assets/images/css-minifier.svg",
      url: "css-minifier"
    },
    {
      title: "Svg Editor",
      description: "Edit and optimize your SVG files.",
      icon: "./assets/images/svg-editor.svg",
      url: "svg-editor"
    },
    {
      title: "QR Code Generator",
      description: "",
      icon: "./assets/images/qrcode-generator.svg",
      url: "qrcode-generator"
    }
];

  goto(item: any) {
    this.router.navigate([item.url])
  }
}
