import { Component } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, SUPPORTED_LANGS, SupportedLang } from '../../core/services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatButtonToggleModule, TranslateModule],
  templateUrl: './language-switcher.component.html'
})
export class LanguageSwitcherComponent {
  readonly langs = SUPPORTED_LANGS;

  constructor(readonly languageService: LanguageService) {}

  select(lang: SupportedLang): void {
    this.languageService.setLang(lang);
  }
}
