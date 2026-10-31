import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { routes } from '../../../app.routes';
import { ForgotPasswordComponent } from './forgot-password.component';

const EMAIL = 'operator.private@securiot.local';
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let httpMock: HttpTestingController;
  let consoleSpies: jasmine.Spy[];

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function emailInput(): HTMLInputElement {
    return root().querySelector<HTMLInputElement>('#forgot-email')!;
  }

  function submitButton(): HTMLButtonElement {
    return root().querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  function type(value: string): void {
    const input = emailInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function expectRequest(): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('auth/forgot-password'));
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    consoleSpies = CONSOLE_METHODS.map((m) => spyOn(console, m));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('wires the email field accessibly and focuses the h1', () => {
    const input = emailInput();
    expect(input.type).toBe('email');
    expect(input.getAttribute('autocomplete')).toBe('email');
    expect(input.required).toBe(true);

    const label = root().querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
    expect(label).toBeTruthy();

    expect(root().querySelectorAll('h1').length).toBe(1);
    expect(document.activeElement).toBe(root().querySelector('h1'));
  });

  it('does not send a request for an empty or malformed email', () => {
    submit();
    expect(root().textContent).toContain('forgot.emailRequired');
    expect(emailInput().getAttribute('aria-invalid')).toBe('true');

    type('not-an-email');
    submit();
    expect(root().textContent).toContain('forgot.emailInvalid');
    expect(emailInput().getAttribute('aria-invalid')).toBe('true');
    httpMock.expectNone((req) => req.url.endsWith('auth/forgot-password'));
  });

  it('posts the email once and shows a neutral confirmation with focus', async () => {
    type(`  ${EMAIL}  `);
    submit();

    const req = expectRequest();
    expect(req.request.body).toEqual({ email: EMAIL });
    expect(submitButton().disabled).toBe(true);

    req.flush({ message: 'x' }, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    await settle();

    expect(root().querySelector('form')).toBeNull();
    const status = root().querySelector<HTMLElement>('[role="status"]')!;
    expect(status.textContent).toContain('forgot.successTitle');
    expect(status.textContent).toContain('forgot.successBody');
    expect(document.activeElement).toBe(status);
    expect(root().textContent).not.toContain(EMAIL);
    expect(root().innerHTML).not.toContain(EMAIL);
    expect(root().querySelector('a[href$="/login"]')).toBeTruthy();
  });

  it('renders the identical confirmation whatever the 202 body is', () => {
    const render = (body: object): string => {
      const f = TestBed.createComponent(ForgotPasswordComponent);
      f.detectChanges();
      const el = f.nativeElement as HTMLElement;
      const input = el.querySelector<HTMLInputElement>('#forgot-email')!;
      input.value = EMAIL;
      input.dispatchEvent(new Event('input'));
      el.querySelector('form')!.dispatchEvent(new Event('submit'));
      httpMock
        .expectOne((req) => req.url.endsWith('auth/forgot-password'))
        .flush(body, { status: 202, statusText: 'Accepted' });
      f.detectChanges();
      return el.querySelector('[role="status"]')!.textContent!.replace(/\s+/g, ' ').trim();
    };

    expect(render({})).toEqual(render({ message: 'x' }));
  });

  it('shows the rate limit message and keeps the form on 429', () => {
    type(EMAIL);
    submit();
    expectRequest().flush({}, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();

    expect(root().querySelector('[role="alert"]')!.textContent).toContain('forgot.rateLimited');
    expect(root().querySelector('form')).toBeTruthy();
    expect(root().querySelector('[role="status"]')).toBeNull();
    expect(submitButton().disabled).toBe(false);
  });

  it('shows the generic error on 500 and on network failure', () => {
    type(EMAIL);
    submit();
    expectRequest().flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(root().querySelector('[role="alert"]')!.textContent).toContain('forgot.genericError');

    submit();
    expectRequest().error(new ProgressEvent('error'), { status: 0 });
    fixture.detectChanges();
    expect(root().querySelector('[role="alert"]')!.textContent).toContain('forgot.genericError');
    expect(root().querySelector('[role="status"]')).toBeNull();
  });

  it('registers a lazy forgot-password route outside the guard and before the wildcard', () => {
    const index = routes.findIndex((r) => r.path === 'forgot-password');
    const wildcard = routes.findIndex((r) => r.path === '**');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(wildcard);
    expect(routes[index].loadComponent).toBeDefined();
    expect(routes[index].canActivate).toBeUndefined();
  });
});
