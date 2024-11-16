import { Component } from '@angular/core';
import swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { ValidationHelperService } from '../../core/services/validation-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ActionHelperService } from '../../core/services/action-helper.service';

@Component({
  selector: 'app-json-to-environment',
  templateUrl: './json-to-environment.component.html',
  styleUrl: './json-to-environment.component.scss'
})

export class JsonToEnvironmentComponent {
  converter = new JsonToEnvironmentConverter();

  jsonData = {
    content: '',
    success: true,
    type: 'json'
  }
  envData = {
    content: '',
    type: 'txt'
  }

  constructor(
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - Json To Environment");

  }

  jsonUpdated() {
    try {
      const json = JSON.parse(this.jsonData.content);
      this.jsonData.content = JSON.stringify(json, null, 4);
      this.envData.content = this.converter.convertJsonToEnvironmentString(json);

      this.jsonData.success = true;
    } catch (error) {
      console.error(error);
      this.jsonData.success = false;
    }
  }
  download() {
    if (!this.envData.content) return
    const filename = `JsonToEnvironment-${new Date().getTime()}.txt`;

    if (this.fileHelper.download(this.envData.content, filename)) {
      swal.fire({
        title: 'Download Ready',
        text: `Your Environment downloaded as ${filename}.`,
        icon: 'success'
      });
    }

  }
  async paste() {
    this.jsonData.content = await this.actionHelper.paste();
    this.jsonUpdated()
  }

  copy() {
    this.actionHelper.copy(this.envData.content);
  }

  readAsUrl() {
    swal.fire({
      title: 'Enter URL',
      input: 'url',
      inputLabel: `Your JSON file URL`,
      inputPlaceholder: 'https://example.com/example.json',
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
            this.jsonData.content = JSON.stringify(response);
            this.jsonUpdated()
            swal.fire('Success', `JSON loaded from URL successfully!`, 'success');
          },
          (error) => {
            swal.fire('Error', `Failed to load JSON from URL!`, 'error');
          }
        );
      }
    });

  }
  openFile() {
    this.fileHelper.openFile('.json').then(content => {
      this.jsonData.content = content
      this.jsonUpdated()
    }).catch(error => {
      console.error('Error:', error);
    });
  }

}


export class JsonToEnvironmentConverter {
  /**
   * تبدیل JSON به رشته متغیرهای محیطی با فرمت 'KEY__SUBKEY=VALUE'
   * @param json JSON ورودی
   * @param prefix پیش‌وند برای متغیرها (اختیاری)
   * @param separator جداکننده بین کلیدها (پیش‌فرض '__')
   * @returns رشته متغیرهای محیطی به فرمت 'KEY__SUBKEY=VALUE'
   */
  convertJsonToEnvironmentString(json: any, prefix: string = '', separator: string = '__'): string {
    let environmentString = '';

    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        const value = json[key];

        if (typeof value === 'object' && value !== null) {
          // اگر مقدار یک شیء باشد، آن را بازگشتی پردازش کن
          environmentString += this.convertJsonToEnvironmentString(value, `${prefix}${key}${separator}`, separator);
        } else {
          // مقدار کلید را اضافه کن
          environmentString += `${prefix}${key}=${value}\n`;
        }
      }
    }

    return environmentString;
  }
}
