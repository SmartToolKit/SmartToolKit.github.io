import { Component, ViewChild, ElementRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FileHelperService } from '../../core/services/file-helper.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-barcode-generator',
  templateUrl: './barcode-generator.component.html',
  styleUrl: './barcode-generator.component.scss'
})
export class BarcodeGeneratorComponent {
  @ViewChild('barcodeElement', { static: false }) barcodeElement!: ElementRef;

  constructor(private titleService: Title, public fileHelper: FileHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - Barcode Generator")
  }
  model: any = {
    value: 'Smart ToolKit',
    selectedFormat: 'CODE128',
    width: 2,
    height: 100,
    displayValue: true,
    lineColor: '#000000',
    bgColor: '#37393c'
  }

  formats: string[] = ['CODE128', 'CODE39', 'EAN13', 'UPC', 'ITF', 'MSI'];


  // Download the barcode as a PNG image
  downloadQRCodeAsPng() {
    const svgElement = this.barcodeElement.nativeElement.querySelector('svg');
    const canvas = document.createElement('canvas');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = svgElement.width.baseVal.value;
      canvas.height = svgElement.height.baseVal.value;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Download PNG
      var filename = `BarcodeGenerator-${new Date().getTime()}.png`

      const imgURL = canvas.toDataURL('image/png');
      if (this.fileHelper.downloadUrl(imgURL, filename)) {
        swal.fire({
          title: 'Download Ready',
          text: `Your barcode has been downloaded as ${filename}.`,
          icon: 'success'
        });
      }
    };


    img.src = url;
  }

  // Download the barcode as an SVG file
  downloadQRCodeAsSvg() {
    var filename = `BarcodeGenerator-${new Date().getTime()}.svg`

    const svgElement = this.barcodeElement.nativeElement.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    if (this.fileHelper.downloadUrl(url, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your barcode has been downloaded as ${filename}.`,
        icon: 'success'
      });
    }
  }

  importOptions() {
    this.fileHelper.openFile('.stkbarcode').then(content => {
      this.model = JSON.parse(content)
    }).catch(error => {
      console.error('Error:', error);
    });
  }
  exportOptions() {

    const filename = `BarcodeGenerator-${new Date().getTime()}.stkbarcode`;

    if (this.fileHelper.download(JSON.stringify(this.model), filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your Barcode Settings downloaded as ${filename}.`,
        icon: 'success'
      });
    }

  }

}

