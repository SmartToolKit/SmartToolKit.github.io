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
    success: true
  }
  xmlData = {
    content: '',
    success: false
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


}
