import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { routes } from '../../../app.routes';
import { ResetPasswordComponent } from './reset-password.component';

const TOKEN = 'abc123';
const PASSWORD = 'correct horse battery';
const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let httpMock: HttpTestingController;
  let location: Location;
  let consoleSpies: jasmine.Spy[];

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function newPasswordInput(): HTMLInputElement {
    return root().querySelector<HTMLInputElement>('#reset-new-password')!;
  }

  function confirmInput(): HTMLInputElement {
    return root().querySelector<HTMLInputElement>('#reset-confirm-password')!;
  }

  function submitButton(): HTMLButtonElement {
    return root().querySelector<HTMLButtonElement>('button[type="submit"]')!;
  }

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    root().querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function fillValid(): void {
    type(newPasswordInput(), PASSWORD);
    type(confirmInput(), PASSWORD);
  }

  function expectRequest(): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('auth/reset-password'));
  }

  function expectNoRequest(): void {
    httpMock.expectNone((req) => req.url.endsWith('auth/reset-password'));
  }

  function alertText(): string {
    return root().querySelector('[role="alert"]')?.textContent ?? '';
  }

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }

  async function setup(query: Record<string, string>): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    location = TestBed.inject(Location);
    location.go('/reset-password', `token=${query['token'] ?? ''}`);
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  }

  beforeEach(() => {
    consoleSpies = CONSOLE_METHODS.map((m) => spyOn(console, m));
  });

  afterEach(() => {
    httpMock.verify();
    consoleSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
  });

  it('keeps the token in memory, scrubs the URL and never renders it', async () => {
    await setup({ token: TOKEN });

    expect(location.path()).not.toContain('token');
    expect(location.path()).not.toContain(TOKEN);
    expect(location.path()).toBe('/reset-password');
    expect(root().innerHTML).not.toContain(TOKEN);
    expect(document.title).not.toContain(TOKEN);
  });

  it('shows the invalid-link state for a blank token', async () => {
    await setup({ token: '   ' });

    const alert = root().querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain('reset.invalidLinkTitle');
    expect(alert.textContent).toContain('reset.invalidLinkBody');
    expect(root().querySelector('a[href$="/forgot-password"]')!.textContent).toContain('reset.requestNewLink');
    expect(root().querySelector('input')).toBeNull();
  });

  it('shows the invalid-link state when the token query param is absent', async () => {
    await setup({});
    expect(alertText()).toContain('reset.invalidLinkTitle');
    expect(root().querySelector('input')).toBeNull();
  });

  it('wires the password fields accessibly and allows paste', async () => {
    await setup({ token: TOKEN });

    [newPasswordInput(), confirmInput()].forEach((input) => {
      expect(input.type).toBe('password');
      expect(input.getAttribute('autocomplete')).toBe('new-password');
      expect(root().querySelector(`label[for="${input.id}"]`)).toBeTruthy();
    });

    const hintId = newPasswordInput().getAttribute('aria-describedby')!;
    const hint = root().querySelector<HTMLElement>(`#${hintId}`)!;
    expect(hint.textContent).toContain('reset.policyHint');

    const paste = new Event('paste', { cancelable: true, bubbles: true });
    newPasswordInput().dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(false);

    expect(root().querySelectorAll('h1').length).toBe(1);
    expect(document.activeElement).toBe(root().querySelector('h1'));
  });

  it('validates the password policy and the confirmation without sending requests', async () => {
    await setup({ token: TOKEN });

    submit();
    expect(root().textContent).toContain('reset.newPasswordRequired');
    expect(root().textContent).toContain('reset.confirmRequired');

    type(newPasswordInput(), '123456789');
    type(confirmInput(), '123456789');
    submit();
    expect(root().textContent).toContain('reset.newPasswordTooShort');

    type(newPasswordInput(), 'a'.repeat(73));
    type(confirmInput(), 'a'.repeat(73));
    submit();
    expect(root().textContent).toContain('reset.newPasswordTooLong');

    // 40 characters but 80 bytes: bcrypt would truncate it, so the byte limit applies.
    type(newPasswordInput(), 'é'.repeat(40));
    type(confirmInput(), 'é'.repeat(40));
    submit();
    expect(root().textContent).toContain('reset.newPasswordTooLong');

    type(newPasswordInput(), PASSWORD);
    type(confirmInput(), 'something else entirely');
    submit();
    expect(root().textContent).toContain('reset.confirmMismatch');
    expect(confirmInput().getAttribute('aria-invalid')).toBe('true');

    type(confirmInput(), PASSWORD);
    expect(root().textContent).not.toContain('reset.confirmMismatch');

    // Changing the first field re-validates the confirmation.
    type(newPasswordInput(), `${PASSWORD}!`);
    expect(root().textContent).toContain('reset.confirmMismatch');

    expectNoRequest();
  });

  it('toggles both inputs between password and text', async () => {
    await setup({ token: TOKEN });

    const checkbox = root().querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    expect(root().querySelector(`label[for="${checkbox.id}"]`)!.textContent).toContain('reset.showPasswords');

    checkbox.click();
    fixture.detectChanges();
    expect(newPasswordInput().type).toBe('text');
    expect(confirmInput().type).toBe('text');

    checkbox.click();
    fixture.detectChanges();
    expect(newPasswordInput().type).toBe('password');
    expect(confirmInput().type).toBe('password');
  });

  it('posts token and password once and shows a focused success state', async () => {
    await setup({ token: TOKEN });
    fillValid();
    submit();

    const req = expectRequest();
    expect(req.request.body).toEqual({ token: TOKEN, newPassword: PASSWORD });
    expect(submitButton().disabled).toBe(true);

    req.flush({ message: 'ok' });
    fixture.detectChanges();
    await settle();

    expect(root().querySelector('form')).toBeNull();
    const status = root().querySelector<HTMLElement>('[role="status"]')!;
    expect(status.textContent).toContain('reset.successTitle');
    expect(status.textContent).toContain('reset.successBody');
    expect(document.activeElement).toBe(status);
    expect(root().querySelector('a[href$="/login"]')).toBeTruthy();
    expect(root().innerHTML).not.toContain(PASSWORD);
    expect(root().innerHTML).not.toContain(TOKEN);
    expect(document.title).not.toContain(TOKEN);
  });

  it('switches to the invalid-link state on invalid_reset_token', async () => {
    await setup({ token: TOKEN });
    fillValid();
    submit();
    expectRequest().flush({ code: 'invalid_reset_token' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    await settle();

    expect(alertText()).toContain('reset.invalidLinkTitle');
    expect(root().querySelector('input')).toBeNull();
    expect(root().querySelector('a[href$="/forgot-password"]')).toBeTruthy();
  });

  it('keeps the form and values on a policy 400, 429, 500 and network failure', async () => {
    await setup({ token: TOKEN });
    fillValid();

    submit();
    expectRequest().flush({ message: ['newPassword too short'] }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(alertText()).toContain('reset.policyError');
    expect(newPasswordInput().value).toBe(PASSWORD);

    submit();
    expectRequest().flush({}, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();
    expect(alertText()).toContain('reset.rateLimited');

    submit();
    expectRequest().flush({}, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(alertText()).toContain('reset.genericError');

    submit();
    expectRequest().error(new ProgressEvent('error'), { status: 0 });
    fixture.detectChanges();
    expect(alertText()).toContain('reset.genericError');

    expect(root().querySelector('form')).toBeTruthy();
    expect(newPasswordInput().value).toBe(PASSWORD);
    expect(confirmInput().value).toBe(PASSWORD);
    expect(submitButton().disabled).toBe(false);
  });

  it('registers a lazy reset-password route outside the guard and before the wildcard', () => {
    const index = routes.findIndex((r) => r.path === 'reset-password');
    const wildcard = routes.findIndex((r) => r.path === '**');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(wildcard);
    expect(routes[index].loadComponent).toBeDefined();
    expect(routes[index].canActivate).toBeUndefined();
  });
});
