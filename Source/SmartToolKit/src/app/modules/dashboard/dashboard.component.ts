import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  constructor(public router: Router) {

  }
  tools = [
    // {
    //   title: "Code Snapshot",
    //   description: "Turn your code snippets into visually stunning images, perfect for sharing or documentation.",
    //   icon:"./assets/images/code-snapshot.svg",
    //   url: "code-snapshot"
    // },
    {
      title: "JSON Viewer",
      description: "Easily view and format JSON data, making it more readable and easier to work with.",
      icon: "./assets/images/json-viewer.svg",
      url: "json-viewer"
    },
    {
      title: "GUID Generator",
      description: "Generate unique GUIDs for use in your applications and databases.",
      icon: "./assets/images/guid-generator.svg",
      url: "guid-generator"
    },
    {
      title: "JWT Viewer",
      description: "Decode and verify JWT tokens with this easy-to-use tool.",
      icon: "./assets/images/jwt-viewer.svg",
      url: "jwt-viewer"
    },
    {
      title: "Convert To Base64",
      description: "",
      icon: "./assets/images/convert-to-base64.svg",
      url: "convert-to-base64"
    },
    {
      title: "Image Resizer",
      description: "",
      icon: "./assets/images/image-resizer.svg",
      url: "image-resizer"
    }
  ];
  goto(item: any) {
    this.router.navigate([item.url])
  }
}
