import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import swal from 'sweetalert2';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';

@Component({
  selector: 'app-openapi-parser',
  templateUrl: './openapi-parser.component.html',
  styleUrl: './openapi-parser.component.scss'
})
export class OpenapiParserComponent {
  @ViewChild('overviewContentDiv') editableDivRef!: ElementRef<HTMLDivElement>;

  apiUrl = '';
  overviewContent: string = ``
  openApiContent: any;
  model: any[] = [];

  constructor(private http: HttpClient, private titleService: Title, private validationHelper: ValidationHelperService, private fileHelper: FileHelperService) {

    this.titleService.setTitle("Smart ToolKit - Openapi Parser")
    this.apiUrl = "https://clean-architecture.koyeb.app/swagger/v1/swagger.json"
    this.http.get(this.apiUrl).subscribe(
      (response: any) => {
        this.generate(response);
        this.initOverview()

      },
      () => {
        swal.fire('Error', 'Failed to load OpenApi from URL!', 'error');
      }
    );

  }
  saveDesc(event: FocusEvent, desc: any) {
    const content = (event.target as HTMLTableCellElement).innerHTML;
    desc.content = content
  }
  import() {
    this.fileHelper.openFile('.stkoap').then(content => {
      var data = JSON.parse(content)
      this.apiUrl = data.apiUrl;
      this.overviewContent = data.overviewContent
      this.model = data.model
    }).catch(error => {
      console.error('Error:', error);
    });

  }

  export() {
    const filename = `OpenapiParser-${new Date().getTime()}.stkoap`;
    const overviewContent = this.editableDivRef.nativeElement.innerHTML;

    var context = {
      apiUrl: this.apiUrl,
      overviewContent: overviewContent,
      openApiContent: this.openApiContent,
      model: this.model
    };
    if (this.fileHelper.download(JSON.stringify(context), filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your Openapi-Parser Settings downloaded as ${filename}.`,
        icon: 'success'
      });
    }
  }
  delDesc(item: any) {
    item.descriptions.pop()
  }
  addDesc(item: any) {
    item.descriptions.push({ content: "Write Somthing" })
  }
  print() {
    window.print();
  }
  readAsUrl() {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: 'Your Openapi URL',
      inputPlaceholder: 'https://example.com/swagger/v1/swagger.json',
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
        this.apiUrl = result.value

        this.http.get(this.apiUrl).subscribe(
          (response: any) => {
            this.generate(response);
            this.initOverview()
          },
          () => {
            swal.fire('Error', 'Failed to load OpenApi from URL!', 'error');
          }
        );

      }
    });
  }


  generate(response: any): void {
    this.openApiContent = response;
    this.model = [];

    const paths = this.openApiContent.paths || {};

    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries<any>(methods as any).forEach(([method, details]) => {
        const endpoint = {
          path,
          method: method.toUpperCase(),
          parameters: this.extractParameters(details),
          responses: this.extractResponses(details.responses),
          requestBody: this.extractRequestBody(details.requestBody),
          descriptions: []
        };

        this.model.push(endpoint);
      });
    });
  }
  private extractRequestBody(requestBody: any): any | null {
    if (!requestBody?.content) return null;

    const contentTypes = Object.keys(requestBody.content);
    let sample = null;

    for (const contentType of contentTypes) {
      const schema = requestBody.content[contentType]?.schema;
      if (schema) {
        sample = this.generateSample(schema);
        return {
          contentType,
          sample: JSON.stringify(sample, null, 2)
        };
      }
    }

    return null;
  }

  private extractParameters(details: any): any[] {
    const parameters = details.parameters || [];
    return parameters.map((param: any) => ({
      name: param.name,
      in: param.in,
      required: param.required ?? false,
      type: param.schema?.type ?? 'unknown',
      description: param.description ?? ''
    }));
  }

  private extractResponses(responses: any): any[] {
    const result: any[] = [];

    if (!responses) return result;

    Object.entries<any>(responses).forEach(([statusCode, responseDetail]) => {
      const contents = responseDetail.content || {};
      const contentTypes = Object.keys(contents);
      let sampleResponse = '';

      for (const contentType of contentTypes) {
        const schema = contents[contentType]?.schema;

        if (schema) {
          const sample = this.generateSample(schema);
          sampleResponse = JSON.stringify(sample, null, 2);
          break; // فقط اولین content-type برای نمایش کافی است
        }
      }

      result.push({
        status: statusCode,
        contentTypes,
        sampleResponse
      });
    });

    return result;
  }

  private generateSample(schema: any): any {
    if (schema["$ref"]) {
      return this.generateSampleFromRef(schema["$ref"]);
    }

    if (schema.type === 'object') {
      return this.generateSampleFromSchema(schema);
    }

    if (schema.type === 'array') {
      const items = schema.items || {};
      return [this.generateSample(items)];
    }

    return this.generatePrimitiveSample(schema.type);
  }

  private generateSampleFromRef(ref: string): any {
    const refName = this.extractRefName(ref);
    const schema = this.openApiContent?.components?.schemas?.[refName];

    if (!schema) return {};
    return this.generateSample(schema);
  }

  private generateSampleFromSchema(schema: any): any {
    const properties = schema.properties || {};
    const sample: any = {};

    for (const [key, value] of Object.entries<any>(properties)) {
      if (value["$ref"]) {
        sample[key] = this.generateSampleFromRef(value["$ref"]);
      } else if (value.enum) {
        sample[key] = value.enum[0];
      } else if (value.type === 'array') {
        const items = value.items || {};
        sample[key] = [this.generateSample(items)];
      } else if (value.type === 'object') {
        sample[key] = this.generateSampleFromSchema(value);
      } else {
        sample[key] = this.generatePrimitiveSample(value.type);
      }
    }

    return sample;
  }

  private generatePrimitiveSample(type: string): any {
    switch (type) {
      case 'string': return 'string';
      case 'integer':
      case 'number': return 0;
      case 'boolean': return true;
      default: return null;
    }
  }

  private extractRefName(ref: string): string {
    return ref.split('/').pop()!;
  }
  initOverview() {
    this.overviewContent = `<font color="#000000"><br /></font>
<h1 style="text-align: center">
  <font color="#000000"
    >${this.openApiContent.info.title}
    <span>(v${this.openApiContent.info.version})</span>
  </font>
</h1>

<font color="#000000"
  ><div style="text-align: center"><br /></div>
  <br />
</font>
<p>
  <font color="#000000">
    This API documentation provides comprehensive details about the
    functionalities and operations offered by the
    ${this.openApiContent.info.title} API. It includes information on available
    endpoints, request and response formats, as well as sample data to guide
    developers in integrating the API with their applications.
  </font>
</p>
<p>
  <font color="#000000">
    The API is designed to be flexible, allowing developers to interact with
    various services such as managing resources, retrieving data, and performing
    complex operations. It supports various request types (GET, POST, PUT,
    DELETE) and provides rich responses to assist in seamless integration.
  </font>
</p>
<p>
  <font color="#000000">
    Whether you're building a web application, mobile app, or integrating
    third-party services, this documentation will serve as a valuable resource
    for understanding and utilizing the API effectively.
  </font>
</p>
`;

  }


}
