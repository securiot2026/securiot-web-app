import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('shows a native forgot-password link between the password field and the submit button', () => {
    const root = fixture.nativeElement as HTMLElement;
    const link = Array.from(root.querySelectorAll<HTMLAnchorElement>('a')).find((a) =>
      (a.textContent ?? '').includes('login.forgotPassword')
    );

    expect(link).toBeTruthy();
    expect(link!.tagName).toBe('A');
    expect(link!.getAttribute('href')).toMatch(/\/forgot-password$/);

    const password = root.querySelector('#login-password')!;
    const submit = root.querySelector('button[type="submit"]')!;
    expect(password.compareDocumentPosition(link!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(link!.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
