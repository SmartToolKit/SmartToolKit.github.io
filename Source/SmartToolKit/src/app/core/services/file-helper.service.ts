import { Injectable } from '@angular/core';
import swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class FileHelperService {

  constructor() { }

  download(data: string, filename: string): boolean {
    try {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data));
      element.setAttribute('download', filename);
      element.click();
      return true;
    } catch (error) {
      swal.fire({
        title: 'Download Error',
        text: 'Failed to download. Please try again.',
        icon: 'error'
      });
      return false;
    }
  }

  openFile(accept: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept)
        input.accept = accept;

      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);  // Resolve the promise with the file content
          };
          reader.onerror = () => {
            swal.fire({
              title: 'File Read Error',
              text: 'There was an error reading the file. Please try again.',
              icon: 'error'
            });
            reject(reader.error);  // Reject the promise in case of error
          };
          reader.readAsText(file);  // Read file as text
        } else {
          swal.fire({
            title: 'No File Selected',
            text: 'Please select a file to continue.',
            icon: 'warning'
          });
          reject('No file selected');
        }
      };

      input.click();  // Open file dialog
    });
  }

  openMultipleFile(accept: string): Promise<File[]> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept)
        input.accept = accept;
      input.multiple = true; // Allow multiple file selection

      input.onchange = () => {
        const files = input.files;
        if (files && files.length > 0) {
          resolve(Array.from(files)); // Convert FileList to array of File objects
        } else {
          swal.fire({
            title: 'No File Selected',
            text: 'Please select one or more files to continue.',
            icon: 'warning'
          });
          reject('No files selected');
        }
      };

      input.click(); // Open file dialog
    });
  }
  openOneFile(accept: string): Promise<File> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (accept)
        input.accept = accept;

      input.onchange = () => {
        const files = input.files;
        if (files && files.length > 0) {
          resolve(files[0]); // Convert FileList to array of File objects
        } else {
          swal.fire({
            title: 'No File Selected',
            text: 'Please select one file to continue.',
            icon: 'warning'
          });
          reject('No files selected');
        }
      };

      input.click(); // Open file dialog
    });
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);  // Resolve with Base64 string
      };
      
      reader.onerror = () => {
        swal.fire({
          title: 'Conversion Error',
          text: 'There was an error converting the file to Base64. Please try again.',
          icon: 'error'
        });
        reject(reader.error);  // Reject in case of error
      };
      
      reader.readAsDataURL(file);  // Read the file as a data URL (Base64 format)
    });
  }

}
