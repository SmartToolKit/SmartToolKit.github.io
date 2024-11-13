import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ColorChromeModule } from 'ngx-color/chrome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LayoutComponent } from './core/layout/layout.component';
import { HeaderComponent } from './core/layout/header/header.component';
import { FooterComponent } from './core/layout/footer/footer.component';
import { DashboardComponent } from './modules/dashboard/dashboard.component';
import { JsonViewerComponent } from './modules/json-viewer/json-viewer.component';
import { FormsModule } from '@angular/forms';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { ServiceWorkerModule } from '@angular/service-worker';
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
import { NgxBarcode6Module } from 'ngx-barcode6';
import { ColorPickerComponent } from './modules/color-picker/color-picker.component';
import { JsonXmlConverterComponent } from './modules/json-xml-converter/json-xml-converter.component';

@NgModule({
  declarations: [
    AppComponent,
    LayoutComponent,
    HeaderComponent,
    FooterComponent,
    DashboardComponent,
    JsonViewerComponent,
    GuidGeneratorComponent,
    JwtViewerComponent,
    ConvertToBase64Component,
    ImageResizerComponent,
    RegexTesterComponent,
    RsaKeyGeneratorComponent,
    CodeSnapshotComponent,
    JavaScriptMinifierComponent,
    CssMinifierComponent,
    SvgEditorComponent,
    QrcodeGeneratorComponent,
    BarcodeGeneratorComponent,
    ColorPickerComponent,
    JsonXmlConverterComponent
  ],
  imports: [
    HttpClientModule,
    NgxBarcode6Module,ColorChromeModule,
    NgxJsonViewerModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
