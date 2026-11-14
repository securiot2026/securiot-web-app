import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AlertsListComponent } from './alerts-list.component';

describe('AlertsListComponent labels', () => {
  let component: AlertsListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsListComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
    }).compileComponents();
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es-419', { alerts: { rules: { door_contact: 'Puerta abierta' }, status: { active: 'Activa' } } });
    translate.use('es-419');
    component = TestBed.createComponent(AlertsListComponent).componentInstance;
  });

  afterEach(() => TestBed.inject(HttpTestingController).match(() => true));

  it('translates known rule types and makes unknown ones readable', () => {
    expect(component.ruleLabel('door_contact')).toBe('Puerta abierta');
    expect(component.ruleLabel('glass_break')).toBe('glass break');
  });

  it('never shows a raw key for an unknown status', () => {
    expect(component.statusLabel('active')).toBe('Activa');
    expect(component.statusLabel('acknowledged')).toBe('acknowledged');
  });

  it('keeps the active status neutral so it does not double the severity red', () => {
    expect(component.statusClass('active')).toBe('status-active');
    expect(component.statusClass('resolved')).toBe('resolved');
    expect(component.statusIcon('resolved')).toBe('check_circle');
  });
});
