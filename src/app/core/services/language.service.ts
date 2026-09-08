import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

const LANG_KEY = 'securiot.lang';
export const SUPPORTED_LANGS = ['en-US', 'es-419'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
const DEFAULT_LANG: SupportedLang = 'es-419';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private readonly translate: TranslateService) {
    this.translate.addLangs([...SUPPORTED_LANGS]);
    this.translate.setDefaultLang(DEFAULT_LANG);
    this.translate.onLangChange.subscribe(({ lang }) => {
      document.documentElement.lang = lang;
    });
  }

  init(): void {
    this.translate.use(this.getStoredLang());
  }

  getStoredLang(): SupportedLang {
    const stored = localStorage.getItem(LANG_KEY) as SupportedLang | null;
    return stored && SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
  }

  setLang(lang: SupportedLang): void {
    localStorage.setItem(LANG_KEY, lang);
    this.translate.use(lang);
  }

  currentLang(): SupportedLang {
    return (this.translate.currentLang as SupportedLang) || DEFAULT_LANG;
  }
}
