import { Component } from '@angular/core';

@Component({
  selector: 'app-image-resizer',
  templateUrl: './image-resizer.component.html',
  styleUrl: './image-resizer.component.scss'
})
export class ImageResizerComponent {

  result: any[] = []
  openFile(event: Event): void {

    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {

      for (let index = 0; index < fileInput.files.length; index++) {
        var file = fileInput.files[index]
        var t = window.URL || window.webkitURL;
        var objectUrl = t.createObjectURL(file);

        debugger
        var model = {
          id: 'id' + (new Date()).getTime() + "-" + index,
          file: file,
          name:file.name,
          image: objectUrl,
          size:Math.round(file.size/1000) +" kb"
        }
        this.result.push(model)
      }

    }
  }
  delete(id: number) {
    this.result = this.result.filter(p => p.id != id)
  }
  duplicate(id: number) {
    var model = this.result.filter(p => p.id == id)[0]

    this.result.push({
      id: 'id' + (new Date()).getTime() + "d",
      file: model.file,
      image: model.image
    })
  }
}
