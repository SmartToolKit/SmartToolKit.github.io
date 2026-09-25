import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class ActionHelperService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  async copy(content: string): Promise<boolean> {
    if (!this.isBrowser || !content) {
      this.showAlert('Error', 'There is no content to copy.', 'error');
      return false;
    }

    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(content);
          this.showAlert('Success', 'Content has been copied successfully.', 'success');
          return true;
        } catch {
          if (this.copyWithFallback(content)) {
            this.showAlert('Success', 'Content has been copied successfully.', 'success');
            return true;
          }
        }
      } else if (this.copyWithFallback(content)) {
        this.showAlert('Success', 'Content has been copied successfully.', 'success');
        return true;
      }
    } catch {
      if (!this.copyWithFallback(content)) {
        this.showAlert('Error', 'An error occurred while copying content.', 'error');
        return false;
      }
      this.showAlert('Success', 'Content has been copied successfully.', 'success');
      return true;
    }

    this.showAlert('Error', 'An error occurred while copying content.', 'error');
    return false;
  }

  async paste(): Promise<string> {
    if (!this.isBrowser || !navigator.clipboard?.readText) {
      this.showAlert('Error', 'Clipboard access is not available in this browser.', 'error');
      return '';
    }

    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        this.showAlert('Success', 'Content has been pasted successfully.', 'success');
        return text;
      }
      this.showAlert('Warning', 'Clipboard is empty.', 'warning');
      return '';
    } catch {
      this.showAlert('Error', 'An error occurred while reading from the clipboard.', 'error');
      return '';
    }
  }

  private copyWithFallback(content: string): boolean {
    const textarea = document.createElement('textarea');
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    try {
      textarea.value = content;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
      previousFocus?.focus();
    }
  }

  private showAlert(title: string, text: string, icon: 'success' | 'error' | 'warning' | 'info'): void {
    if (this.isBrowser) {
      void swal.fire({ title, text, icon });
    }
  }
}
