import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { BrandPanelComponent } from './brand-panel.component';

describe('BrandPanelComponent', () => {
  it('is decorative: hidden from assistive tech with an empty alt on the mark', async () => {
    await TestBed.configureTestingModule({ imports: [BrandPanelComponent, TranslateModule.forRoot()] }).compileComponents();
    const fixture = TestBed.createComponent(BrandPanelComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('aside')!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('img')!.getAttribute('alt')).toBe('');
  });
});
