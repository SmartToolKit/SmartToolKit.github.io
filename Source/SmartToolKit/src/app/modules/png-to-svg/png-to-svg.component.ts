import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { FileHelperService } from '../../core/services/file-helper.service';

@Component({
  selector: 'app-png-to-svg',
  templateUrl: './png-to-svg.component.html',
  styleUrls: ['./png-to-svg.component.scss']
})
export class PngToSvgComponent {
  result: any[] = [];

  constructor(
    private titleService: Title,
    private fileHelper: FileHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - PNG to SVG Converter");
  }

  async openFiles() {
    var files = await this.fileHelper.openMultipleFile("image/png");

    if (files && files.length > 0) {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
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
            width: img.naturalWidth,
            height: img.naturalHeight,
            orgWidth: img.naturalWidth,
            orgHeight: img.naturalHeight,
            newName: file.name.replace('.png', '.svg'),
            type: 'svg',
            optimization: 'full',
            minify: true,
            svgContent: null,
            svgPreview: null,
            svgStats: null,
            converting: false,
            totalPixels: 0,
            svgElements: 0,
            svgSize: 0,
            compression: 0
          };
          this.updateName(model);
          this.result.push(model);
        };
        
        img.onerror = () => {
          console.error('Error loading image:', file.name);
          alert(`Error loading image ${file.name}`);
        };
      }
    }
  }

  updateName(model: any): void {
    model.newName = model.name.substring(0, model.name.lastIndexOf('.')) + '.svg';
  }

  delete(id: string): void {
    this.result = this.result.filter(p => p.id != id);
  }

  clearAll(): void {
    this.result = [];
  }

  duplicate(id: string): void {
    const model = this.result.find(p => p.id == id);
    if (model) {
      var clone = structuredClone(model);
      clone.id = 'id' + (new Date()).getTime() + "d";
      clone.svgContent = null;
      clone.svgPreview = null;
      clone.svgStats = null;
      clone.converting = false;
      this.result.push(clone);
    }
  }

  // Simple method: each pixel as a 1x1 rectangle
  convertSimple(imageData: ImageData, width: number, height: number): { svg: string, elements: number } {
    const data = imageData.data;
    let rects = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const a = data[idx + 3];
        if (a > 0) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`);
        }
      }
    }
    
    return { svg: rects.join(''), elements: rects.length };
  }

  // Horizontal method: group same-color pixels in each row
  convertHorizontal(imageData: ImageData, width: number, height: number): { svg: string, elements: number } {
    const data = imageData.data;
    let rects = [];
    
    for (let y = 0; y < height; y++) {
      let startX = null;
      let currentColor = null;
      
      for (let x = 0; x <= width; x++) {
        if (x < width) {
          const idx = (y * width + x) * 4;
          const a = data[idx + 3];
          
          if (a > 0) {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const color = `rgb(${r},${g},${b})`;
            
            if (startX === null) {
              startX = x;
              currentColor = color;
            } else if (color !== currentColor) {
              rects.push(`<rect x="${startX}" y="${y}" width="${x - startX}" height="1" fill="${currentColor}"/>`);
              startX = x;
              currentColor = color;
            }
            continue;
          }
        }
        
        if (startX !== null) {
          rects.push(`<rect x="${startX}" y="${y}" width="${x - startX}" height="1" fill="${currentColor}"/>`);
          startX = null;
          currentColor = null;
        }
      }
    }
    
    return { svg: rects.join(''), elements: rects.length };
  }

  // Full method: group in both directions (horizontal + vertical)
  convertFull(imageData: ImageData, width: number, height: number): { svg: string, elements: number } {
    const data = imageData.data;
    const rects = [];
    const used = new Uint8Array(width * height);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (used[idx]) continue;
        
        const pixelIdx = idx * 4;
        const a = data[pixelIdx + 3];
        if (a === 0) continue;
        
        const r = data[pixelIdx];
        const g = data[pixelIdx + 1];
        const b = data[pixelIdx + 2];
        const color = `rgb(${r},${g},${b})`;
        
        // Find width
        let w = 1;
        while (x + w < width) {
          const nextIdx = (y * width + (x + w)) * 4;
          if (data[nextIdx + 3] === 0) break;
          if (data[nextIdx] !== r || data[nextIdx+1] !== g || data[nextIdx+2] !== b) break;
          w++;
        }
        
        // Find height
        let h = 1;
        let canExtend = true;
        while (y + h < height && canExtend) {
          for (let i = 0; i < w; i++) {
            const checkIdx = ((y + h) * width + (x + i)) * 4;
            if (data[checkIdx + 3] === 0) { canExtend = false; break; }
            if (data[checkIdx] !== r || data[checkIdx+1] !== g || data[checkIdx+2] !== b) {
              canExtend = false;
              break;
            }
          }
          if (canExtend) h++;
          else break;
        }
        
        rects.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`);
        
        for (let i = 0; i < h; i++) {
          for (let j = 0; j < w; j++) {
            used[(y + i) * width + (x + j)] = 1;
          }
        }
      }
    }
    
    return { svg: rects.join(''), elements: rects.length };
  }

  async convertToSVG(item: any) {
    item.converting = true;
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = item.orgWidth;
      canvas.height = item.orgHeight;
      const ctx = canvas.getContext('2d');
      
      // Check if ctx is null
      if (!ctx) {
        console.error('Could not get canvas context');
        item.converting = false;
        alert('Error processing image');
        return;
      }
      
      const img = new Image();
      img.src = item.image;
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, item.orgWidth, item.orgHeight);
        
        // Select conversion method
        let result;
        switch (item.optimization) {
          case 'simple':
            result = this.convertSimple(imageData, item.orgWidth, item.orgHeight);
            break;
          case 'horizontal':
            result = this.convertHorizontal(imageData, item.orgWidth, item.orgHeight);
            break;
          default:
            result = this.convertFull(imageData, item.orgWidth, item.orgHeight);
        }
        
        // Build complete SVG
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${item.orgWidth}" height="${item.orgHeight}" shape-rendering="crispEdges">${result.svg}</svg>`;
        
        // Remove enters and spaces if needed
        if (item.minify) {
          svgContent = svgContent.replace(/\s+/g, ' ');
        }
        
        // Calculate statistics
        const totalPixels = item.orgWidth * item.orgHeight;
        const compression = ((totalPixels - result.elements) / totalPixels * 100).toFixed(1);
        const svgSize = (svgContent.length / 1024).toFixed(1);
        
        // Save to model
        item.svgContent = svgContent;
        item.svgPreview = svgContent;
        item.svgStats = true;
        item.totalPixels = totalPixels;
        item.svgElements = result.elements;
        item.svgSize = svgSize;
        item.compression = compression;
        item.converting = false;
        
        // Update file name
        const optName = item.optimization === 'simple' ? '' : `_${item.optimization}`;
        item.newName = item.name.substring(0, item.name.lastIndexOf('.')) + optName + '.svg';
      };
      
      img.onerror = () => {
        item.converting = false;
        alert('Error loading image');
      };
    }, 10);
  }

  downloadSVG(item: any) {
    if (item.svgContent) {
      const blob = new Blob([item.svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.newName;
      link.click();
      URL.revokeObjectURL(url);
    }
  }
}