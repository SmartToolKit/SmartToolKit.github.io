import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FileHelperService } from '../../core/services/file-helper.service';
import swal from 'sweetalert2';
import { ActionHelperService } from '../../core/services/action-helper.service';

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


  constructor(
    private titleService: Title,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - Guid Generator")
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
    this.actionHelper.copy(this.result);
  }
  download() {
    if (!this.result) return

    var filename = `GuidGenerator-${new Date().getTime()}.txt`

    if (this.fileHelper.download(this.result, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your Guid content downloaded as ${filename}.`,
        icon: 'success'
      });

    }
  }

}
