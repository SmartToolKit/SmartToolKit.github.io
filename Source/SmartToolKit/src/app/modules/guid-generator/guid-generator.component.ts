import { Component } from '@angular/core';

@Component({
  selector: 'app-guid-generator',
  templateUrl: './guid-generator.component.html',
  styleUrl: './guid-generator.component.scss'
})
export class GuidGeneratorComponent {
  result: string = ''
  count: number = 5
  hyphens: boolean = true
  braces: boolean = false
  uppercase: boolean = false


  constructor() {
    this.count = Number(localStorage.getItem("guid-generator-count") ?? "5")

    var hyphens = localStorage.getItem("guid-generator-hyphens")
    if (hyphens)
      this.hyphens = hyphens == 'true'

    var braces = localStorage.getItem("guid-generator-braces")
    if (braces)
      this.braces = braces == 'true'

    var uppercase = localStorage.getItem("guid-generator-uppercase")
    if (uppercase)
      this.uppercase = uppercase == 'true'
  }

  generate() {
    localStorage.setItem("guid-generator-count", String(this.count))
    localStorage.setItem("guid-generator-hyphens", String(this.hyphens))
    localStorage.setItem("guid-generator-braces", String(this.braces))
    localStorage.setItem("guid-generator-uppercase", String(this.uppercase))

    this.result = ''
    for (let index = 0; index < this.count; index++) {

      var result = this.generateGUID();
      if (!this.hyphens)
        result = result.replaceAll("-", "")

      if (this.uppercase)
        result = result.toUpperCase()

      if (this.braces)
        result = '{ ' + result + ' }'

      this.result += result + "\n"
    }


  }

  generateGUID(): string {
    const S4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
  }

  copy() {
    const textarea = document.createElement('textarea');
    textarea.value = this.result;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  download() {

    var filename = `GuidGenerator-${new Date().getTime()}.txt`

    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(this.result));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element)
  }

}
