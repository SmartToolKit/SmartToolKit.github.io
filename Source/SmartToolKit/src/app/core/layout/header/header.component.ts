import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgFor,NgClass,NgIf],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
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
      title: "Author",
      url: "https://github.com/samanazadi1996",
      active: false,
      external: true // External link
    }
  ];
}
