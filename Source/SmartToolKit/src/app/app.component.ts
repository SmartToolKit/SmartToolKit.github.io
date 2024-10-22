import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'SmartToolKit';
  constructor(private swUpdate: SwUpdate) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.checkForUpdate().then(isUpdateAvailable => {
        if (isUpdateAvailable) {
          this.swUpdate.activateUpdate().then(() => {
            swal.fire({
              position: 'center',
              icon: 'success',
              title: 'Update Available!',
              text: 'A new version of the application is available. Please refresh to get the latest updates.',
              showConfirmButton: true,
              confirmButtonText: 'Refresh Now',
            }).then(() => {
              window.location.reload();
            });
          });
        }
      }).catch(err => {
        console.error('Error checking for update', err);
      });
    }
  }
}
