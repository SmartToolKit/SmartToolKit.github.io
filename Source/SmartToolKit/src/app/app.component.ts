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
    if (swUpdate.isEnabled) {

      swUpdate.activateUpdate().then(() => {
        window.location.reload();
      });
    }
  }
}
