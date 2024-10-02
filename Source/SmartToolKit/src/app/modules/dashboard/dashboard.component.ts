import { NgFor } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { url } from 'inspector';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  tools = [
    {
      title: "Code Snapshot",
      description: "Turn your code snippets into visually stunning images, perfect for sharing or documentation.",
      url: "code-snapshot"
    },
    {
      title: "JSON Viewer",
      description: "Easily view and format JSON data, making it more readable and easier to work with.",
      url: "json-viewer"
    },
    {
      title: "GUID Generator",
      description: "Generate unique GUIDs for use in your applications and databases.",
      url: "guid-generator"
    },
    {
      title: "JWT Viewer",
      description: "Decode and verify JWT tokens with this easy-to-use tool.",
      url: "jwt-viewer"
    }
  ];
  navigateTo(url: string) {
    alert(url)
  }
}
