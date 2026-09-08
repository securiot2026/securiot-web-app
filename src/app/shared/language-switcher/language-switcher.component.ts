import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService, SUPPORTED_LANGS, SupportedLang } from '../../core/services/language.service';

const LANG_LABELS: Record<SupportedLang, string> = {
  'en-US': 'English (US)',
  'es-419': 'Español (Latinoamérica)'
};

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatButtonModule, MatMenuModule, MatIconModule, TranslateModule],
  templateUrl: './language-switcher.component.html'
})
export class LanguageSwitcherComponent {
  readonly langs = SUPPORTED_LANGS;
  readonly labels = LANG_LABELS;

  constructor(readonly languageService: LanguageService) {}

  select(lang: SupportedLang): void {
    this.languageService.setLang(lang);
  }
}
