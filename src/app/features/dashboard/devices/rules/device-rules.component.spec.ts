import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceRulesComponent } from './device-rules.component';

const SIMULATED_KEY = 'rules.dryRunSimulated';
const EXECUTED_KEY = 'rules.dryRunExecuted';

describe('DeviceRulesComponent dry-run execute checkbox', () => {
  let fixture: ComponentFixture<DeviceRulesComponent>;
  let httpMock: HttpTestingController;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function checkboxInput(): HTMLInputElement {
    return root().querySelector<HTMLInputElement>('mat-checkbox input[type=checkbox]')!;
  }

  function testNowButton(): HTMLButtonElement {
    const buttons = Array.from(root().querySelectorAll<HTMLButtonElement>('button'));
    return buttons.find((button) => (button.textContent ?? '').includes('rules.dryRunButton'))!;
  }

  function liveRegion(): HTMLElement {
    return root().querySelector<HTMLElement>('[aria-live="polite"]')!;
  }

  function resultKeys(): string[] {
    return Array.from(liveRegion().querySelectorAll<HTMLElement>('.rules-message span')).map((el) =>
      (el.textContent ?? '').trim()
    );
  }

  function dryRunRequest(): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/devices/dev-1/rules/1/dry-run'));
  }

  function tickAndRun(response: object): void {
    checkboxInput().click();
    fixture.detectChanges();
    testNowButton().click();
    dryRunRequest().flush(response);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceRulesComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'dev-1' } } } }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeviceRulesComponent);
    fixture.detectChanges();

    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1'))
      .flush({ id: 'dev-1', edgeUrl: 'http://edge.local:5000' });
    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1/rules'))
      .flush([
        {
          id: 1,
          name: 'Siren test',
          condition_type: 'object_class',
          actions: [{ type: 'light', color: 'red' }],
          priority: 100,
          cooldown_seconds: 30,
          last_triggered_at: null,
          device_id: 'dev-1',
          operator: null,
          sensor_type: null,
          match_value: 'person',
          enabled: true
        }
      ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends {execute:false} by default and says it was a simulation only', () => {
    testNowButton().click();
    const req = dryRunRequest();
    expect(req.request.body).toEqual({ execute: false });
    req.flush({ executed: false, queued: [], dry_run: true });
    fixture.detectChanges();

    const text = liveRegion().textContent ?? '';
    expect(text).toContain(SIMULATED_KEY);
    expect(text).not.toContain(EXECUTED_KEY);
  });

  it('sends {execute:true} after ticking the checkbox and says the action was sent', () => {
    checkboxInput().click();
    fixture.detectChanges();
    testNowButton().click();
    const req = dryRunRequest();
    expect(req.request.body).toEqual({ execute: true });
    req.flush({ executed: true, queued: ['light'], dry_run: true });
    fixture.detectChanges();

    expect(liveRegion().textContent ?? '').toContain(EXECUTED_KEY);
  });

  it('renders the checkbox unchecked by default for every rule row', () => {
    const inputs = root().querySelectorAll<HTMLInputElement>('mat-checkbox input[type=checkbox]');
    expect(inputs.length).toBe(1);
    inputs.forEach((input) => expect(input.checked).toBeFalse());
  });

  it('shows the no-action key when executed but nothing was queued', () => {
    tickAndRun({ executed: true, queued: [], dry_run: true });
    expect(resultKeys()).toEqual(['rules.dryRunExecutedNoAction']);
  });

  it('shows the not-confirmed key when execute was requested but the response says otherwise', () => {
    tickAndRun({ executed: false, queued: [], dry_run: true });
    expect(liveRegion().textContent ?? '').toContain('rules.dryRunNotConfirmed');
    expect(liveRegion().textContent ?? '').not.toContain(EXECUTED_KEY);
  });

  it('shows the not-confirmed key when the executed field is missing', () => {
    tickAndRun({ dry_run: true });
    const text = liveRegion().textContent ?? '';
    expect(text).toContain('rules.dryRunNotConfirmed');
    expect(text).not.toContain(EXECUTED_KEY);
  });

  it('renders the result inside the polite live region with an aria-hidden icon for each outcome', () => {
    const outcomes: object[] = [
      { executed: true, queued: ['light'] },
      { executed: true, queued: [] },
      { executed: false, queued: [] }
    ];
    for (const response of outcomes) {
      tickAndRun(response);
      const region = liveRegion();
      expect(region.getAttribute('aria-live')).toBe('polite');
      const icon = region.querySelector('mat-icon');
      expect(icon).not.toBeNull();
      expect(icon!.getAttribute('aria-hidden')).toBe('true');
      expect((region.textContent ?? '').trim().length).toBeGreaterThan(0);
      // untick so the next iteration starts from the same state
      checkboxInput().click();
      fixture.detectChanges();
    }
  });

  it('wires the accessible name and description to the inner native input', () => {
    const input = checkboxInput();
    expect(input.getAttribute('aria-label') ?? '').toMatch(/^rules\.executeLabel/);
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    const hint = document.getElementById(describedBy!) ?? root().querySelector(`#${describedBy}`);
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('rules.executeHint');
    expect(root().querySelector('mat-checkbox')!.textContent).toContain('rules.executeLabel');
  });

  it('clears a previous result when the checkbox is toggled', () => {
    testNowButton().click();
    dryRunRequest().flush({ executed: false, queued: [], dry_run: true });
    fixture.detectChanges();
    expect(liveRegion().textContent ?? '').toContain(SIMULATED_KEY);

    checkboxInput().click();
    fixture.detectChanges();
    expect(liveRegion().textContent ?? '').not.toContain(SIMULATED_KEY);
  });

  it('shows only the error key when the request fails', () => {
    testNowButton().click();
    dryRunRequest().flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    const text = liveRegion().textContent ?? '';
    expect(text).toContain('rules.dryRunError');
    expect(text).not.toContain(SIMULATED_KEY);
    expect(text).not.toContain(EXECUTED_KEY);
    expect(text).not.toContain('rules.dryRunNotConfirmed');
  });
});
