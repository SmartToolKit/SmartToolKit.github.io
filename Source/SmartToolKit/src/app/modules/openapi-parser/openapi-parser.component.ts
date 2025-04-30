import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import swal from 'sweetalert2';
import { ValidationHelperService } from '../../core/services/validation-helper.service';

@Component({
  selector: 'app-openapi-parser',
  templateUrl: './openapi-parser.component.html',
  styleUrl: './openapi-parser.component.scss'
})
export class OpenapiParserComponent {
  delDesc(item: any) {
    item.descriptions.pop()
  }
  addDesc(item: any) {
    item.descriptions.push("Write Description")
  }
  print() {
    window.print();
  }
  openApiContent: any;
  model: any[] = [];

  constructor(private http: HttpClient, private titleService: Title, private validationHelper: ValidationHelperService) {

    this.titleService.setTitle("Smart ToolKit - Openapi Parser")

    // this.generate("https://clean-architecture.koyeb.app/swagger/v1/swagger.json")
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
        this.generate(result.value);
      }
    });
  }


  generate(swaggerUrl: string): void {
    this.http.get(swaggerUrl).subscribe(
      (response: any) => {
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
              descriptions: []
            };

            this.model.push(endpoint);
          });
        });
      },
      () => {
        swal.fire('Error', 'Failed to load OpenApi from URL!', 'error');
      }
    );
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


}
