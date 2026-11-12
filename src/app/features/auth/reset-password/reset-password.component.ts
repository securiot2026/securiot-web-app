import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { LanguageSwitcherComponent } from '../../../shared/language-switcher/language-switcher.component';

export const PASSWORD_MIN_LENGTH = 10;
/** bcrypt only reads the first 72 bytes, so the limit is measured in bytes, not characters. */
export const PASSWORD_MAX_BYTES = 72;

type ResetState = 'form' | 'invalid-link' | 'done';

function maxBytes(limit: number): ValidatorFn {
  const encoder = new TextEncoder();
  return (control: AbstractControl): ValidationErrors | null =>
    encoder.encode(String(control.value ?? '')).length > limit ? { maxbytes: true } : null;
}

const confirmMatches: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.parent?.get('newPassword')?.value ?? '';
  return control.value !== '' && control.value !== password ? { mismatch: true } : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslateModule,
    RouterLink,
    LanguageSwitcherComponent
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.scss', '../auth-extras.scss']
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly destroyRef = inject(DestroyRef);

  /** Bearer credential: kept only in memory, never bound to the template, title or console. */
  private token = '';

  @ViewChild('heading') private heading?: ElementRef<HTMLElement>;
  @ViewChild('success') private success?: ElementRef<HTMLElement>;
  @ViewChild('invalid') private invalid?: ElementRef<HTMLElement>;

  readonly minLength = PASSWORD_MIN_LENGTH;
  readonly maxPasswordBytes = PASSWORD_MAX_BYTES;

  readonly form = this.fb.nonNullable.group({
    newPassword: [
      '',
      [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), maxBytes(PASSWORD_MAX_BYTES)]
    ],
    confirmPassword: ['', [Validators.required, confirmMatches]]
  });

  readonly state = signal<ResetState>('form');
  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly showPasswords = signal(false);

  constructor() {
    this.form.controls.newPassword.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  ngOnInit(): void {
    this.pageTitle.set('reset.title');

    this.token = (this.route.snapshot.queryParamMap.get('token') ?? '').trim();

    // Remove the query string (and the token with it) from the address bar and history entry.
    this.location.replaceState(this.location.path().split('?')[0], '');

    if (!this.token) {
      this.state.set('invalid-link');
    }
  }

  ngAfterViewInit(): void {
    this.heading?.nativeElement.focus();
  }

  toggleShowPasswords(checked: boolean): void {
    this.showPasswords.set(checked);
  }

  submit(): void {
    if (this.submitting() || this.state() !== 'form') {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorKey.set(null);
    this.submitting.set(true);

    this.authService.resetPassword(this.token, this.form.controls.newPassword.value).subscribe({
      next: () => {
        this.submitting.set(false);
        this.token = '';
        this.form.reset();
        this.state.set('done');
        setTimeout(() => this.success?.nativeElement.focus());
      },
      error: (error) => {
        this.submitting.set(false);
        if (error?.status === 400 && error?.error?.code === 'invalid_reset_token') {
          this.token = '';
          this.form.reset();
          this.state.set('invalid-link');
          setTimeout(() => this.invalid?.nativeElement.focus());
        } else if (error?.status === 400) {
          this.errorKey.set('reset.policyError');
        } else if (error?.status === 429) {
          this.errorKey.set('reset.rateLimited');
        } else {
          this.errorKey.set('reset.genericError');
        }
      }
    });
  }
}
