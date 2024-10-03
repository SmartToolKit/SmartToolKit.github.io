import { Component } from '@angular/core';

@Component({
  selector: 'app-jwt-viewer',
  templateUrl: './jwt-viewer.component.html',
  styleUrl: './jwt-viewer.component.scss'
})
export class JwtViewerComponent {
  jwt: string = ''

  payload: any = {}
  header: any = {}

  constructor() {
    debugger
    var jwt = localStorage.getItem("jwt-viewer-jwt")
      ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNtYXJ0IFRvb2xLaXQiLCJpYXQiOjE1MTYyMzkwMjJ9.EAozr0kOfrEbAUuP5tRGzVe--yyHd8v5ComXsYq5U7A"

    this.jwt = jwt

    this.show();
  }
  clear() {
    this.jwt = ''
    localStorage.removeItem("jwt-viewer-jwt")
    this.show()
  }
  save() {
    localStorage.setItem("jwt-viewer-jwt", this.jwt)
  }
  show() {
    this.header = {}
    this.payload = {}
    this.jwt = this.jwt.trim()
    try {
      const [header, payload] = this.decodeJwt(this.jwt)
      this.header = header
      this.payload = payload
    } catch (error) {
      this.header = {}
      this.payload = {}
    }
  }

  decodeJwt(token: string): [any, any] {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));

    return [header, payload];
  }

}
