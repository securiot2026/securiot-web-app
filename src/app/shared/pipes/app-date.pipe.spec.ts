import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppDatePipe } from './app-date.pipe';

describe('AppDatePipe', () => {
  let pipe: AppDatePipe;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TranslateModule.forRoot()], providers: [AppDatePipe] });
    pipe = TestBed.inject(AppDatePipe);
    translate = TestBed.inject(TranslateService);
  });

  it('formats in 24 hour Spanish by default', () => {
    translate.use('es-419');
    expect(pipe.transform(new Date(2026, 10, 14, 0, 27), 'short')).toBe('14/11/26 00:27');
    expect(pipe.transform(new Date(2026, 10, 14, 0, 27), 'shortTime')).toBe('00:27');
  });

  it('formats in 12 hour English', () => {
    translate.use('en-US');
    expect(pipe.transform(new Date(2026, 10, 14, 13, 5), 'shortTime')).toBe('1:05 PM');
  });

  it('returns an empty string for empty values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('')).toBe('');
  });
});
