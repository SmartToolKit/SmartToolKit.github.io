import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { JsonViewerComponent } from './modules/json-viewer/json-viewer.component';
import { GuidGeneratorComponent } from './modules/guid-generator/guid-generator.component';
import { JwtViewerComponent } from './modules/jwt-viewer/jwt-viewer.component';
import { ConvertToBase64Component } from './modules/convert-to-base64/convert-to-base64.component';
import { ImageResizerComponent } from './modules/image-resizer/image-resizer.component';
import { RegexTesterComponent } from './modules/regex-tester/regex-tester.component';
import { RsaKeyGeneratorComponent } from './modules/rsa-key-generator/rsa-key-generator.component';
import { CodeSnapshotComponent } from './modules/code-snapshot/code-snapshot.component';
import { JavaScriptMinifierComponent } from './modules/java-script-minifier/java-script-minifier.component';

const routes: Routes = [{
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
      path: 'jwt-viewer',
      component: JwtViewerComponent
    },
    {
      path: 'json-viewer',
      component: JsonViewerComponent
    },
    {
      path: 'guid-generator',
      component: GuidGeneratorComponent
    },
    {
      path: 'convert-to-base64',
      component: ConvertToBase64Component
    },
    {
      path: 'image-resizer',
      component: ImageResizerComponent
    },
    {
      path: 'regex-tester',
      component: RegexTesterComponent
    },
    {
      path: 'rsa-key-generator',
      component: RsaKeyGeneratorComponent
    },
    {
      path: 'code-snapshot',
      component: CodeSnapshotComponent
    },
    {
      path: 'java-script-minifier',
      component: JavaScriptMinifierComponent
    }
  ]
}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
