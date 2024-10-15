import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router'; // افزودن NavigationEnd
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  headerTitle = "Smart ToolKit"

  constructor(private titleService: Title, private router: Router) {
    this.router.events.subscribe(() => {
      this.headerTitle = this.titleService.getTitle().replace("Smart ToolKit - ", "").trim()
    });

  }

  menu = [
    {
      title: "Home",
      url: "/",
      active: true,
      external: false // Internal route
    },
    {
      title: "Github",
      url: "https://github.com/SmartToolKit",
      active: false,
      external: true // External link
    },
    {
      title: "Source",
      url: "https://github.com/SmartToolKit/SmartToolKit.github.io",
      active: false,
      external: true // External link
    }
  ];
  menuclass = ''

  toggleMenu() {
    this.menuclass == '' ? this.menuclass = 'd-block' : this.menuclass = ''
  }
}
