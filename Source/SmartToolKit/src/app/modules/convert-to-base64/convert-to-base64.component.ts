import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';

@Component({
  selector: 'app-convert-to-base64',
  templateUrl: './convert-to-base64.component.html',
  styleUrl: './convert-to-base64.component.scss'
})
export class ConvertToBase64Component {
  constructor(
    private titleService: Title,
    public actionHelper: ActionHelperService,
    public fileHelper: FileHelperService

  ) {
    this.titleService.setTitle("Smart ToolKit - Convert To Base64")
  }
  btnCaption = 'Select Files'
  result: any[] = []
  async openFiles() {
    var files = await this.fileHelper.openMultipleFile("");

    this.result = []
    this.btnCaption = 'Select Files'


    if (files && files.length > 0) {
      this.btnCaption += ` (${files.length})`

      for (let index = 0; index < files.length; index++) {

        this.addToResult(files[index])
      }

    }
  }

  addToResult(file: any) {

    var t = window.URL || window.webkitURL;
    var objectUrl = t.createObjectURL(file);
    (fetch(objectUrl)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )).then((dataUrl) => {
        var model = {
          name: file.name,
          data: dataUrl,
          image: file.type.includes('image') ? objectUrl : `./assets/images/types/${file.name.split('.').pop()?.toUpperCase()}.svg`
        }
        this.result.push(model)
      })

  }

  copy(item: any) {
    this.actionHelper.copy(item.data);
  }

}