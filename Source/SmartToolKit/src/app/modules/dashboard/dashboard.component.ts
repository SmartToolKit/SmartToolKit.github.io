import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  tools = [
    { title: "JSON Viewer", description: "Easily view and format JSON data, making it more readable and easier to work with.", url: "json-viewer" },
    { title: "JWT Viewer", description: "Decode and verify JWT tokens with this easy-to-use tool.", url: "jwt-viewer" },
    { title: "GUID Generator", description: "Generate unique GUIDs for use in your applications and databases.", url: "guid-generator" },
    { title: "Rsa Key Generator", description: "Generate RSA keys for cryptographic purposes.", url: "rsa-key-generator" },
    { title: "Regex Tester", description: "Test and validate regular expressions.", url: "regex-tester" },
    { title: "Convert To Base64", description: "Convert your files or text into Base64 format.", url: "convert-to-base64" },
    { title: "Image Resizer", description: "Resize images to desired dimensions.", url: "image-resizer" },
    { title: "JavaScript Minifier", description: "Minify your JavaScript code for better performance.", url: "java-script-minifier" },
    { title: "Css Minifier", description: "Minify your CSS files to reduce file size.", url: "css-minifier" },
    { title: "Svg Editor", description: "Edit and optimize your SVG files.", url: "svg-editor" },
    { title: "QR Code Generator", description: "Generate QR codes quickly and easily for URLs, text, or other data.", url: "qrcode-generator" },
    { title: "BarCode Generator", description: "Create barcodes for various formats, ideal for product labeling and inventory management.", url: "barcode-generator" },
    { title: "Code Snapshot", description: "Capture and save code snippets with syntax highlighting for sharing or documentation.", url: "code-snapshot" },
    { title: "Color Picker", description: "Select and customize colors easily with this intuitive color picker tool.", url: "color-picker" }
  ];
  search = '';
  filteredTools = this.tools;
  bookmarks: string[] = [];

  constructor(public router: Router, private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit");
    this.loadBookmarks();
    this.sortTools();
  }

  onSearchChange(): void {
    this.filterTools();
  }
  showDescription(event: MouseEvent, tool: any): void {
    event.preventDefault();
    event.stopPropagation();
    swal.fire({
      title: tool.title,
      text: tool.description,
      icon: 'info',
      confirmButtonText: 'Close',
    });
  }
  filterTools(): void {
    this.filteredTools = this.tools.filter(tool =>
      tool.title.toLowerCase().includes(this.search.toLowerCase()) ||
      tool.description.toLowerCase().includes(this.search.toLowerCase())
    );
    this.sortTools();
  }

  onBookmarkClick(event: MouseEvent, tool: any): void {
    event.preventDefault();
    event.stopPropagation();

    this.bookmarks = this.bookmarks.includes(tool.url)
      ? this.bookmarks.filter(url => url !== tool.url)
      : [...this.bookmarks, tool.url];

    this.updateLocalStorage();
    this.sortTools();
  }

  updateLocalStorage(): void {
    localStorage.setItem("dashboard-bookmark", JSON.stringify(this.bookmarks));
  }

  loadBookmarks(): void {
    const savedBookmarks = localStorage.getItem("dashboard-bookmark");
    if (savedBookmarks) {
      this.bookmarks = JSON.parse(savedBookmarks);
    }
  }

  sortTools(): void {
    this.filteredTools.sort((a, b) =>
      Number(this.bookmarks.includes(b.url)) - Number(this.bookmarks.includes(a.url)) ||
      this.bookmarks.indexOf(a.url) - this.bookmarks.indexOf(b.url)
    );
  }

  isBookmarked(toolUrl: string): boolean {
    return this.bookmarks.includes(toolUrl);
  }

  goto(tool: any): void {
    this.router.navigate([tool.url]);
  }
}
