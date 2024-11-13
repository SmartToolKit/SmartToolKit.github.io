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
import { CssMinifierComponent } from './modules/css-minifier/css-minifier.component';
import { SvgEditorComponent } from './modules/svg-editor/svg-editor.component';
import { QrcodeGeneratorComponent } from './modules/qrcode-generator/qrcode-generator.component';
import { BarcodeGeneratorComponent } from './modules/barcode-generator/barcode-generator.component';
import { ColorPickerComponent } from './modules/color-picker/color-picker.component';
import { JsonXmlConverterComponent } from './modules/json-xml-converter/json-xml-converter.component';

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
    },
    {
      path: 'css-minifier',
      component: CssMinifierComponent
    },
    {
      path: 'svg-editor',
      component: SvgEditorComponent
    },
    {
      path: 'qrcode-generator',
      component: QrcodeGeneratorComponent
    },
    {
      path: 'barcode-generator',
      component: BarcodeGeneratorComponent
    },    {
      path: 'json-xml-converter',
      component: JsonXmlConverterComponent
    },
    {
      path: 'color-picker',
      component: ColorPickerComponent
    }
  ]
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
