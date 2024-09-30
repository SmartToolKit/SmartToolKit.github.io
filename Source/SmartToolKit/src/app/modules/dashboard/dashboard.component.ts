import { NgFor } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor,RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements AfterViewInit {
  menu = [
    {
      title: "Code Snapshot",
      description: "An application that transforms code snippets into beautiful and artistic images with sleek and eye-catching designs, perfect for quick sharing and documentation.",
      link: "code-snapshot"
    },
    {
      title: "Single-origin coffee whatever 2",
      description: " Williamsburg tofu polaroid, 90's Bushwick irony locavore ethnic meh messenger bag Truffaut jean shorts."
    }

  ]
  directions: Record<number, string> = { 0: 'top', 1: 'right', 2: 'bottom', 3: 'left' };
  classNames: string[];

  constructor() {
    this.classNames = ['in', 'out']
      .map((p) => Object.values(this.directions).map((d) => `${p}-${d}`))
      .reduce((a, b) => a.concat(b));
  }

  ngAfterViewInit() {
    const nodes = Array.from(document.querySelectorAll('li'));
    nodes.forEach((node: Element) => this.addHoverEffects(node));
  }

  addHoverEffects(node: Element) {
    node.addEventListener('mouseover', ((ev: MouseEvent) => this.update(ev, node, 'in')) as EventListener);
    node.addEventListener('mouseout', ((ev: MouseEvent) => this.update(ev, node, 'out')) as EventListener);
  }

  update(ev: MouseEvent, node: Element, prefix: string) {
    node.classList.remove(...this.classNames);
    node.classList.add(`${prefix}-${this.directions[this.getDirectionKey(ev, node)]}`);
  }

  getDirectionKey(ev: MouseEvent, node: Element) {
    const { width, height, top, left } = node.getBoundingClientRect();
    const l = ev.pageX - (left + window.pageXOffset);
    const t = ev.pageY - (top + window.pageYOffset);
    const x = l - (width / 2) * (width > height ? height / width : 1);
    const y = t - (height / 2) * (height > width ? width / height : 1);
    return Math.round(Math.atan2(y, x) / 1.57079633 + 5) % 4;
  }




}
