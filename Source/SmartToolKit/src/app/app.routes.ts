import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { LayoutComponent } from './core/layout/layout.component';
import { CodeSnapshotComponent } from './modules/code-snapshot/code-snapshot.component';
import { JsonViewerComponent } from './modules/json-viewer/json-viewer.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        component: DashboardComponent
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'code-snapshot',
        component: CodeSnapshotComponent
      },
      {
        path: 'json-viewer',
        component: JsonViewerComponent
      }
    ]
  }
];
