import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class FileHelperService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  download(data: string, filename: string): boolean {
    if (!this.isBrowser) {
      return false;
    }

    let url: string | null = null;
    try {
      url = URL.createObjectURL(new Blob([data], { type: 'text/plain;charset=utf-8' }));
      const element = document.createElement('a');
      element.href = url;
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      element.remove();
      window.setTimeout(() => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }, 1000);
      return true;
    } catch {
      if (url) {
        URL.revokeObjectURL(url);
      }
      void swal.fire({
        title: 'Download Error',
        text: 'Failed to download. Please try again.',
        icon: 'error'
      });
      return false;
    }
  }

  downloadUrl(url: string, filename: string): boolean {
    if (!this.isBrowser) {
      return false;
    }

    try {
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      return true;
    } catch {
      void swal.fire({
        title: 'Download Error',
        text: 'Failed to download. Please try again.',
        icon: 'error'
      });
      return false;
    }
  }

  openFile(accept: string, maxBytes?: number): Promise<string> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('File access is not available on the server.'));
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) {
        input.accept = accept;
      }
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          void swal.fire({
            title: 'No File Selected',
            text: 'Please select a file to continue.',
            icon: 'warning'
          });
          reject(new Error('No file selected'));
          return;
        }
        if (maxBytes !== undefined && file.size > maxBytes) {
          reject(new Error('The selected file is too large.'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => {
          void swal.fire({
            title: 'File Read Error',
            text: 'There was an error reading the file. Please try again.',
            icon: 'error'
          });
          reject(reader.error ?? new Error('File read failed'));
        };
        reader.readAsText(file);
      };
      input.oncancel = () => reject(new Error('File selection cancelled'));
      input.click();
    });
  }

  openMultipleFile(accept: string): Promise<File[]> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('File access is not available on the server.'));
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) {
        input.accept = accept;
      }
      input.multiple = true;
      input.onchange = () => {
        const files = input.files;
        if (files && files.length > 0) {
          resolve(Array.from(files));
        } else {
          void swal.fire({
            title: 'No File Selected',
            text: 'Please select one or more files to continue.',
            icon: 'warning'
          });
          reject(new Error('No files selected'));
        }
      };
      input.oncancel = () => reject(new Error('File selection cancelled'));
      input.click();
    });
  }

  openOneFile(accept: string): Promise<File> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('File access is not available on the server.'));
    }

    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept) {
        input.accept = accept;
      }
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          resolve(file);
        } else {
          void swal.fire({
            title: 'No File Selected',
            text: 'Please select one file to continue.',
            icon: 'warning'
          });
          reject(new Error('No files selected'));
        }
      };
      input.oncancel = () => reject(new Error('File selection cancelled'));
      input.click();
    });
  }

  convertFileToBase64(file: File): Promise<string> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('File access is not available on the server.'));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => {
        void swal.fire({
          title: 'Conversion Error',
          text: 'An error occurred while converting the file to Base64.',
          icon: 'error'
        });
        reject(reader.error ?? new Error('File read failed'));
      };
      reader.readAsDataURL(file);
    });
  }
}
