import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { JsonViewerComponent } from './modules/json-viewer/json-viewer.component';

const routes: Routes = [  {
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
    // {
    //   path: 'code-snapshot',
    //   component: CodeSnapshotComponent
    // },
    {
      path: 'json-viewer',
      component: JsonViewerComponent
    }
  ]
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
