import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, NgFor],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  menu = [
    {
      title: "Home",
      url: "./",
      active: true
    },
    {
      title: "Github",
      url: "https://github.com/SmartToolKit",
      active: false

    },
    {
      title: "Author",
      url: "https://github.com/samanazadi1996",
      active: false

    }
  ]
}
