import { Injectable } from '@angular/core';
import swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ActionHelperService {

  constructor() { }

  // Helper function to show general SweetAlert notifications
  private showAlert(title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info') {
    swal.fire({ title, text, icon });
  }

  // Method to copy content to clipboard
  copy(content: string) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.showAlert('Success', 'Content has been copied successfully.', 'success');
    } catch (error) {
      console.error('Failed to copy content: ', error);
      this.showAlert('Error', 'An error occurred while copying content.', 'error');
    }
  }

  // Method to paste content from clipboard
  async paste(): Promise<string> {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.showAlert('Success', 'Content has been pasted successfully.', 'success');
        return text;
      } else {
        this.showAlert('Warning', 'Clipboard is empty.', 'warning');
        return '';
      }
    } catch (error) {
      console.error('Failed to read clipboard contents: ', error);
      this.showAlert('Error', 'An error occurred while reading from the clipboard.', 'error');
      return '';
    }
  }
}
