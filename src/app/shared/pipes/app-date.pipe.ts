import { Pipe, PipeTransform, inject } from '@angular/core';
import { formatDate, registerLocaleData } from '@angular/common';
import localeEs419 from '@angular/common/locales/es-419';
import { TranslateService } from '@ngx-translate/core';

registerLocaleData(localeEs419, 'es-419');

export type AppDateFormat = 'short' | 'medium' | 'mediumDate' | 'shortTime';

const PATTERNS: Record<'es-419' | 'en-US', Record<AppDateFormat, string>> = {
  'es-419': {
    short: 'dd/MM/yy HH:mm',
    medium: "d MMM y, HH:mm",
    mediumDate: 'd MMM y',
    shortTime: 'HH:mm'
  },
  'en-US': {
    short: 'M/d/yy, h:mm a',
    medium: 'MMM d, y, h:mm a',
    mediumDate: 'MMM d, y',
    shortTime: 'h:mm a'
  }
};

/**
 * Formats dates in the active interface language. Angular's own date pipe
 * follows the build locale, which left Spanish screens with US dates and 12 hour times.
 */
@Pipe({ name: 'appDate', standalone: true, pure: false })
export class AppDatePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(value: string | number | Date | null | undefined, format: AppDateFormat = 'medium'): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    const lang = this.translate.currentLang === 'en-US' ? 'en-US' : 'es-419';
    try {
      return formatDate(value, PATTERNS[lang][format], lang);
    } catch {
      return '';
    }
  }
}
