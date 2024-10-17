import { Title } from '@angular/platform-browser';
import { Component, OnInit, ElementRef, ViewChild, Renderer2 } from '@angular/core';
import QRCodeStyling from 'qr-code-styling';
import { FileHelperService } from '../../core/services/file-helper.service';
import swal from 'sweetalert2';

@Component({
  selector: 'app-qrcode-generator',
  templateUrl: './qrcode-generator.component.html',
  styleUrls: ['./qrcode-generator.component.scss']  // اصلاح نام این خاصیت
})
export class QrcodeGeneratorComponent implements OnInit {
  constructor(private titleService: Title, private renderer: Renderer2, public fileHelper: FileHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - QR Code Generator");
  }
  @ViewChild('canvas', { static: true }) canvas!: ElementRef;
  setPage(page: string) {
    this.page = this.page == page ? '' : page
    this.process();
  }
  page = "Main Options"
  deleteFile() {
    if (this.model.imageName) {
      this.model.image = null;
      this.model.imageName = null;
      this.process();
    }
  }
  loadFile() {
    if (!this.model.imageName) {
      this.model.image = null;
      this.model.imageName = null;
      this.fileHelper.openOneFile('image/*')  // Allow only images, modify as needed
        .then(file => {
          this.model.imageName = file.name;
          return this.fileHelper.convertFileToBase64(file);

        })
        .then(base64String => {
          this.model.image = base64String;
          this.process()

        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }

  model: any = {
    width: 300,
    height: 300,
    data: "Smart ToolKit",
    margin: 5,
    imageName: null,
    image: null,
    qrOptions: {
      typeNumber: "3",
      mode: "Byte",
      errorCorrectionLevel: "M"
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0
    },
    dotsOptions: {
      type: "square",
      color: "#0d6efd",
      colorType: "one",
      gradient: {
        type: "radial",
        rotation: 4,
        colorStops: [
          {
            offset: 0,
            color: "#000000"
          },
          {
            offset: 1,
            color: "#ff009d"
          }
        ]
      }
    },
    backgroundOptions: {
      color: "#ffffff",
      colorType: "transparent",
      gradient: {
        type: "radial",
        rotation: 4,
        colorStops: [
          {
            offset: 0,
            color: "#ffffff"
          },
          {
            offset: 1,
            color: "#80d2ff"
          }
        ]
      }

    },
    cornersSquareOptions: {
      type: "",
      color: "#0d6efd",
      colorType: "one",
      gradient: {
        type: "radial",
        rotation: 4,
        colorStops: [
          {
            offset: 0,
            color: "#000000"
          },
          {
            offset: 1,
            color: "#ff009d"
          }
        ]
      }

    },
    cornersDotOptions: {
      type: "",
      color: "#0d6efd",
      colorType: "one",
      gradient: {
        type: "radial",
        rotation: 4,
        colorStops: [
          {
            offset: 0,
            color: "#000000"
          },
          {
            offset: 1,
            color: "#ff009d"
          }
        ]
      }
    }
  }

  qrCode = new QRCodeStyling();

  boxHeight = '300px';

  ngOnInit(): void {
    this.process()
  }
  importOptions() {
    this.fileHelper.openFile('.stkqrcode').then(content => {
      this.model = JSON.parse(content)
      this.process();
    }).catch(error => {
      console.error('Error:', error);
    });
  }
  exportOptions() {

    const filename = `JsonViewer-${new Date().getTime()}.stkqrcode`;

    if (this.fileHelper.download(JSON.stringify(this.model), filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your JSON downloaded as ${filename}.`,
        icon: 'success'
      });
    }

  }
  downloadQRCodeAsSvg(): void {
    this.qrCode.download({ name: 'qr-code', extension: 'svg' });
  }
  downloadQRCodeAsPng(): void {
    this.qrCode.download({ name: 'qr-code', extension: 'png' });
  }

  process(): void {
    var options: any = {
      width: this.model.width,
      height: this.model.height,
      data: this.model.data,
      margin: this.model.margin,
      image: this.model.image,
      dotsOptions: {
        color: this.model.dotsOptions.color,
        type: this.model.dotsOptions.type,
        gradient: this.model.dotsOptions.gradient

      },
      cornersSquareOptions: {
        color: this.model.cornersSquareOptions.color,
        type: this.model.cornersSquareOptions.type,
        gradient: this.model.cornersSquareOptions.gradient

      },
      backgroundOptions: {
        color: this.model.backgroundOptions.color,
        type: this.model.backgroundOptions.type,
        gradient: this.model.backgroundOptions.gradient

      },
      cornersDotOptions: {
        color: this.model.cornersDotOptions.color,
        type: this.model.cornersDotOptions.type,
        gradient: this.model.cornersDotOptions.gradient
      },
      imageOptions: this.model.imageOptions,
      qrOptions: this.model.qrOptions
    }
    if (this.model.dotsOptions.colorType != 'gradient')
      options.dotsOptions.gradient = null

    if (this.model.cornersSquareOptions.colorType != 'gradient')
      options.cornersSquareOptions.gradient = null

    if (this.model.cornersDotOptions.colorType != 'gradient')
      options.cornersDotOptions.gradient = null


    if (this.model.backgroundOptions.colorType != 'gradient')
      options.backgroundOptions.gradient = null

    if (this.model.backgroundOptions.colorType != 'one')
      options.backgroundOptions.color = ""


    this.qrCode.update(options);

    this.qrCode.append(this.canvas.nativeElement);

    this.boxHeight = `${(document.getElementById('bodybox')?.offsetHeight || 300)}px`;

    console.log(this.boxHeight);

  }

  scale = 1

  zoom(event: WheelEvent) {
    event.preventDefault();

    const zoomStep = 0.1;
    if (event.deltaY < 0) {
      this.scale += zoomStep;
    } else {
      this.scale -= zoomStep;
      if (this.scale < 0.1) {
        this.scale = 0.1;
      }
    }

    this.renderer.setStyle(this.canvas.nativeElement, 'transform', `translate(-50%, -50%) scale(${this.scale})`);
  }
  addDotsOptionsGradient() {
    this.model.dotsOptions.gradient.colorStops.push({

      offset: 1,
      color: "#ff009d"
    })
    this.process();

  }
  deleteDotsOptionsGradient() {
    if (this.model.dotsOptions.gradient.colorStops.length > 2) {
      this.model.dotsOptions.gradient.colorStops.pop()
    }
    this.process();
  }
}
