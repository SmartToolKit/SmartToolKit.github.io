import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { LayoutComponent } from './core/layout/layout.component';
import { CodeSnapshotComponent } from './modules/code-snapshot/code-snapshot.component';

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
      }
    ]
  }

];
