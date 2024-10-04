import { Component } from '@angular/core';

@Component({
  selector: 'app-convert-to-base64',
  templateUrl: './convert-to-base64.component.html',
  styleUrl: './convert-to-base64.component.scss'
})
export class ConvertToBase64Component {

  btnCaption = 'Select Files'
  result: any[] = []
  openFile(event: Event): void {

    this.result = []
    this.btnCaption = 'Select Files'

    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      this.btnCaption += ` (${fileInput.files.length})`

      for (let index = 0; index < fileInput.files.length; index++) {

        this.addToResult(fileInput.files[index])
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
    const textarea = document.createElement('textarea');
    textarea.value = item.data;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

}