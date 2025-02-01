import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActionHelperService } from '../../core/services/action-helper.service';
import { FileHelperService } from '../../core/services/file-helper.service';
import { ValidationHelperService } from '../../core/services/validation-helper.service';

@Component({
  selector: 'app-github-stats-generator',
  templateUrl: './github-stats-generator.component.html',
  styleUrl: './github-stats-generator.component.scss'
})
export class GithubStatsGeneratorComponent {
  copyToClipboard(link: string) {
    this.actionHelper.copy(link)

  }
  constructor(
    private http: HttpClient,
    private titleService: Title,
    public validationHelper: ValidationHelperService,
    public fileHelper: FileHelperService,
    public actionHelper: ActionHelperService
  ) {
    this.titleService.setTitle("Smart ToolKit - GitHub Stats Generator");
  }


  model = {
    userName: "samanazadi1996",
    hideCardBorder: true,
    theme: "default",
    topLangLayout: "compact",
    countPrivateCommits: true,
    statsImg: "https://github-readme-stats.vercel.app/api?username=samanazadi1996&show_icons=true&theme=default&count_private=true&hide_border=true",
    langsImg: "https://github-readme-stats.vercel.app/api/top-langs/?username=samanazadi1996&theme=default&layout=compact&v=1&hide_border=true"
  }

  onChange() {
    this.model.statsImg = `https://github-readme-stats.vercel.app/api` +
      `?username=${this.model.userName}&show_icons=true&theme=${this.model.theme}&count_private=${this.model.countPrivateCommits}&hide_border=${this.model.hideCardBorder}`
    this.model.langsImg = `https://github-readme-stats.vercel.app/api/top-langs/?username=` +
      `samanazadi1996&theme=${this.model.theme}&layout=${this.model.topLangLayout}&v=1&hide_border=${this.model.hideCardBorder}`
  }
  topLangsLayout =
    [
      { value: "compact", text: "Compact" },
      { value: "pie", text: "Pie" },
      { value: "donut", text: "Donut" },
      { value: "donut-vertical", text: "Donut Vertical" },
    ]

  themes = [
    { value: "default", text: "Default" },
    { value: "transparent", text: "Transparent" },
    { value: "shadow_red", text: "Shadow Red" },
    { value: "shadow_green", text: "Shadow Green" },
    { value: "shadow_blue", text: "Shadow Blue" },
    { value: "dark", text: "Dark" },
    { value: "radical", text: "Radical" },
    { value: "merko", text: "Merko" },
    { value: "gruvbox", text: "Gruvbox" },
    { value: "gruvbox_light", text: "Gruvbox Light" },
    { value: "tokyonight", text: "Tokyo Night" },
    { value: "onedark", text: "One Dark" },
    { value: "cobalt", text: "Cobalt" },
    { value: "synthwave", text: "Synthwave" },
    { value: "highcontrast", text: "High Contrast" },
    { value: "dracula", text: "Dracula" },
    { value: "prussian", text: "Prussian" },
    { value: "monokai", text: "Monokai" },
    { value: "vue", text: "Vue" },
    { value: "vue-dark", text: "Vue Dark" },
    { value: "shades-of-purple", text: "Shades of Purple" },
    { value: "nightowl", text: "Nightowl" },
    { value: "buefy", text: "Buefy" },
    { value: "blue-green", text: "Blue-Green" },
    { value: "algolia", text: "Algolia" },
    { value: "great-gatsby", text: "Great Gatsby" },
    { value: "darcula", text: "Darcula" },
    { value: "bear", text: "Bear" },
    { value: "solarized-dark", text: "Solarized Dark" },
    { value: "solarized-light", text: "Solarized Light" },
    { value: "chartreuse-dark", text: "Chartreuse Dark" },
    { value: "nord", text: "Nord" },
    { value: "gotham", text: "Gotham" },
    { value: "material-palenight", text: "Material Palenight" },
    { value: "graywhite", text: "Graywhite" },
    { value: "vision-friendly-dark", text: "Vision Friendly Dark" },
    { value: "ayu-mirage", text: "Ayu Mirage" },
    { value: "midnight-purple", text: "Midnight Purple" },
    { value: "calm", text: "Calm" },
    { value: "flag-india", text: "Flag India" },
    { value: "omni", text: "Omni" },
    { value: "react", text: "React" },
    { value: "jolly", text: "Jolly" },
    { value: "maroongold", text: "Maroon Gold" },
    { value: "yeblu", text: "Yeblu" },
    { value: "blueberry", text: "Blueberry" },
    { value: "slateorange", text: "Slate Orange" },
    { value: "kacho_ga", text: "Kacho Ga" },
    { value: "outrun", text: "Outrun" },
    { value: "ocean_dark", text: "Ocean Dark" },
    { value: "city_lights", text: "City Lights" },
    { value: "github_dark", text: "GitHub Dark" },
    { value: "github_dark_dimmed", text: "GitHub Dark Dimmed" },
    { value: "discord_old_blurple", text: "Discord Old Blurple" },
    { value: "aura_dark", text: "Aura Dark" },
    { value: "panda", text: "Panda" },
    { value: "noctis_minimus", text: "Noctis Minimus" },
    { value: "cobalt2", text: "Cobalt2" },
    { value: "swift", text: "Swift" },
    { value: "aura", text: "Aura" },
    { value: "apprentice", text: "Apprentice" },
    { value: "moltack", text: "Moltack" },
    { value: "codeSTACKr", text: "CodeSTACKr" },
    { value: "rose_pine", text: "Rose Pine" },
    { value: "catppuccin_latte", text: "Catppuccin Latte" },
    { value: "catppuccin_mocha", text: "Catppuccin Mocha" },
    { value: "date_night", text: "Date Night" },
    { value: "one_dark_pro", text: "One Dark Pro" },
    { value: "rose", text: "Rose" },
    { value: "holi", text: "Holi" },
    { value: "neon", text: "Neon" },
    { value: "blue_navy", text: "Blue Navy" },
    { value: "calm_pink", text: "Calm Pink" },
    { value: "ambient_gradient", text: "Ambient Gradient" }
  ];

}
