import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { LanguageSwitcherComponent } from '../../../shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    TranslateModule,
    RouterLink,
    LanguageSwitcherComponent
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.scss', '../auth-extras.scss']
})
export class ForgotPasswordComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly pageTitle = inject(PageTitleService);

  @ViewChild('heading') private heading?: ElementRef<HTMLElement>;
  @ViewChild('confirmation') private confirmation?: ElementRef<HTMLElement>;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly submitting = signal(false);
  readonly errorKey = signal<string | null>(null);
  readonly done = signal(false);

  ngOnInit(): void {
    this.pageTitle.set('forgot.title');
  }

  ngAfterViewInit(): void {
    this.heading?.nativeElement.focus();
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorKey.set(null);
    this.submitting.set(true);

    const email = this.form.controls.email.value.trim();

    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset();
        this.done.set(true);
        setTimeout(() => this.confirmation?.nativeElement.focus());
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorKey.set(error?.status === 429 ? 'forgot.rateLimited' : 'forgot.genericError');
      }
    });
  }
}
