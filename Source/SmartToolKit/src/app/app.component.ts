import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'SmartToolKit';
  constructor(private swUpdate: SwUpdate) {
    if (this.swUpdate.isEnabled) {
      alert("A new version of the application is available. Please refresh to get the latest updates.")
      // swal.fire({
      //   position: 'center',
      //   icon: 'success',
      //   title: 'Update Available!',
      //   text: 'A new version of the application is available. Please refresh to get the latest updates.',
      //   showConfirmButton: true,
      //   confirmButtonText: 'Refresh Now',
      // }).then(function () {
      //   window.location.reload();
      // })

    }
  }

}
