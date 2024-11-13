import { Component } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

@Component({
  selector: 'app-json-xml-converter',
  templateUrl: './json-xml-converter.component.html',
  styleUrl: './json-xml-converter.component.scss'
})
export class JsonXmlConverterComponent {
  jsonData = {
    content: '',
    success: true,
    type: 'json'
  }
  xmlData = {
    content: '',
    success: true,
    type: 'xml'
  }
  private xmlParser: XMLParser;
  private xmlBuilder: XMLBuilder;

  constructor(
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - JSON/XML Converter");
    this.xmlParser = new XMLParser({ ignoreAttributes: false, trimValues: true });
    this.xmlBuilder = new XMLBuilder({ ignoreAttributes: false, format: true, indentBy: "  " });

  }

  jsonUpdated() {
    try {
      const json = JSON.parse(this.jsonData.content);
      this.jsonData.content = JSON.stringify(json, null, 4);
      this.xmlData.content = this.xmlBuilder.build(json);
      this.jsonData.success = true;
    } catch (error) {
      console.error(error);
      this.jsonData.success = false;
    }
  }

  xmlUpdated() {
    try {
      const jsonResult = this.xmlParser.parse(this.xmlData.content);
      this.jsonData.content = JSON.stringify(jsonResult, null, 4);
      this.xmlData.success = true;
    } catch (error) {
      console.error(error);
      this.xmlData.success = false;
    }
  }

  download(obj: any) {
    if (!obj.content) return
    const filename = `JsonXmlConverter-${new Date().getTime()}.${obj.type}`;

    if (this.fileHelper.download(obj.content, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your ${this.getTypeUpperCase(obj)} downloaded as ${filename}.`,
        icon: 'success'
      });
    }

  }
  async paste(obj: any) {
    obj.content = await this.actionHelper.paste();
    this.update(obj)
  }

  copy(obj: any) {
    this.actionHelper.copy(obj.content);
  }

  readAsUrl(obj: any) {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: `Your ${this.getTypeUpperCase(obj)} file URL`,
      inputPlaceholder: 'https://example.com/example.' + obj.type,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'You need to enter a URL!';
        } else if (!this.validationHelper.isValidUrl(value)) {
          return 'Please enter a valid URL!';
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.get(result.value).subscribe(
          (response) => {
            obj.content = response;
            this.update(obj)
            swal.fire('Success', `${this.getTypeUpperCase(obj)} loaded from URL successfully!`, 'success');
          },
          (error) => {
            swal.fire('Error', `Failed to load ${this.getTypeUpperCase(obj)} from URL!`, 'error');
          }
        );
      }
    });

  }
  openFile(obj: any) {
    this.fileHelper.openFile('.' + obj.type).then(content => {
      obj.content = content
      this.update(obj)
    }).catch(error => {
      console.error('Error:', error);
    });
  }
  update(obj: any) {
    if (obj.type == 'xml')
      this.xmlUpdated();
    else
      this.jsonUpdated();
  }
  getTypeUpperCase(obj: any) {
    return (obj.type + '').toUpperCase()
  }
}
