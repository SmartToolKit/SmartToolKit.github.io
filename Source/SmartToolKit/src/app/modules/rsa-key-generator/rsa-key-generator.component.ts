import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import * as forge from 'node-forge';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-rsa-key-generator',
  templateUrl: './rsa-key-generator.component.html',
  styleUrl: './rsa-key-generator.component.scss'
})
export class RsaKeyGeneratorComponent {
  publicKey: string = '';
  privateKey: string = '';
  bitSizes: number[] = [256, 512, 1024, 2048, 4096];  // Available bit sizes
  selectedBitSize: number = 1024;  // Default value
  tempSelectedBitSize: number = 1024;  // Default value
  constructor(private titleService: Title) {
    this.titleService.setTitle("Smart ToolKit - RsaKey Generator");
  }

  generateRSAKeys(): void {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: this.selectedBitSize, e: 0x10001 });
    this.publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
    this.privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
    this.tempSelectedBitSize = this.selectedBitSize
  }
  validate(): boolean {
    try {
      // Generate a test message to encrypt and decrypt
      const testMessage = 'Test message';

      // Convert public and private keys from PEM format to forge key objects
      const publicKey = forge.pki.publicKeyFromPem(this.publicKey);
      const privateKey = forge.pki.privateKeyFromPem(this.privateKey);

      // Encrypt the test message using the public key
      const encryptedMessage = publicKey.encrypt(testMessage);

      // Decrypt the encrypted message using the private key
      const decryptedMessage = privateKey.decrypt(encryptedMessage);

      return decryptedMessage === testMessage;

    } catch (error) {
      return false;
    }
  }

  download() {
    if (!this.privateKey || !this.publicKey) {
      Swal.fire('Error', 'Please generate the RSA keys before downloading.', 'error');
      return;
    }

    if (!this.validate()) {
      Swal.fire('Error', 'Invalid key pair. Please regenerate the keys.', 'error');
      return;
    }
    // Download the public key
    this.downloadFile(this.publicKey, `public_key_${this.tempSelectedBitSize}.pem`);

    // Download the private key
    this.downloadFile(this.privateKey, `private_key_${this.tempSelectedBitSize}.pem`);
  }

  private downloadFile(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link); // Clean up after download
    URL.revokeObjectURL(url); // Free up memory
  }

  copy(str: string) {
    if (!this.privateKey || !this.publicKey) {
      Swal.fire('Error', 'Please generate the RSA keys before downloading.', 'error');
      return;
    }

    if (!this.validate()) {
      Swal.fire('Error', 'Invalid key pair. Please regenerate the keys.', 'error');
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = str;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

  }
}
