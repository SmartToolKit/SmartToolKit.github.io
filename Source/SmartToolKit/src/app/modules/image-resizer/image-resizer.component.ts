import { Component } from '@angular/core';

@Component({
  selector: 'app-image-resizer',
  templateUrl: './image-resizer.component.html',
  styleUrls: ['./image-resizer.component.scss']
})
export class ImageResizerComponent {

  result: any[] = [];

  openFile(event: Event): void {
    const fileInput = event.target as HTMLInputElement;

    if (fileInput.files && fileInput.files.length > 0) {
      for (let index = 0; index < fileInput.files.length; index++) {
        const file = fileInput.files[index];
        const t = window.URL || window.webkitURL;
        const objectUrl = t.createObjectURL(file);

        const img = new Image();
        img.src = objectUrl;

        img.onload = () => {
          const model = {
            id: 'id' + (new Date()).getTime() + "-" + index,
            file: file,
            name: file.name,
            image: objectUrl,
            size: Math.round(file.size / 1000) + " kb",
            width: img.naturalWidth,  // Get image width
            height: img.naturalHeight, // Get image height
            orgWidth: img.naturalWidth,  // Get image width
            orgHeight: img.naturalHeight, // Get image height
            newName: '',
            type: file.name.split(".").pop(),
            aspectRatio: img.naturalWidth / img.naturalHeight, // Calculate aspect ratio
            download: false
          };

          model.newName = model.name.substring(0, file.name.lastIndexOf('.')) + `-${model.width}X${model.height}`;
          this.result.push(model);
        };
      }
    }
  }

  delete(id: number): void {
    this.result = this.result.filter(p => p.id != id);
  }

  duplicate(id: number): void {
    const model = this.result.find(p => p.id == id);
    if (model) {
      this.result.push({
        id: 'id' + (new Date()).getTime() + "d",
        file: model.file,
        name: model.name,
        image: model.image,
        size: model.size,
        orgWidth: model.orgWidth,
        orgHeight: model.orgHeight,
        width: model.width,
        height: model.height,
        newName: model.newName,
        type: model.type,
        aspectRatio: model.aspectRatio,
        download: model.download
      });
    }
  }

  updateSize(item: any, type: string): void {
    if (type === 'w') {
      // Update height based on new width while maintaining aspect ratio
      item.height = Math.round(item.width / item.aspectRatio);
    } else if (type === 'h') {
      // Update width based on new height while maintaining aspect ratio
      item.width = Math.round(item.height * item.aspectRatio);
    }
    item.download = false

    // Update the new name with the modified dimensions
    item.newName = item.name.substring(0, item.name.lastIndexOf('.')) + `-${item.width}X${item.height}`;
  }
  download(item: any): void {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (context) {
      // Set the canvas size to the new width and height
      canvas.width = item.width;
      canvas.height = item.height;

      // Create a new image element
      const img = new Image();
      img.src = item.image;

      img.onload = () => {
        // Draw the resized image onto the canvas
        context.drawImage(img, 0, 0, item.width, item.height);

        // Create a new anchor element for download
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png'); // You can also use 'image/jpeg' if needed
        link.download = `${item.newName}.${item.type}`; // Use the updated newName for download

        // Programmatically trigger the download
        link.click();
        item.download = true
      };
    }
  }
}
