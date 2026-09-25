import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnDestroy {
  headerTitle = "Smart ToolKit"
  private navigationSubscription: Subscription;

  constructor(private titleService: Title, private router: Router) {
    this.updateHeaderTitle();
    this.navigationSubscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.updateHeaderTitle();
    });
  }

  private updateHeaderTitle(): void {
    const title = this.titleService.getTitle();
    if (title && title !== 'Smart ToolKit') {
      this.headerTitle = title.replace(/^Smart ToolKit\s*-\s*/, '').trim();
      return;
    }

    const segment = this.router.url.split('?')[0].split('/').filter(Boolean)[0];
    this.headerTitle = segment
      ? segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      : 'Smart ToolKit';
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
    },
    {
      title: "Issues",
      url: "https://github.com/SmartToolKit/SmartToolKit.github.io/issues",
      active: false,
      external: true // External link
    }
  ];
  menuclass = ''

  ngOnDestroy(): void {
    this.navigationSubscription.unsubscribe();
  }

  toggleMenu() {
    this.menuclass == '' ? this.menuclass = 'd-block' : this.menuclass = ''
  }
}
