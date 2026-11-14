import { Component, ElementRef, Inject, ViewChild, computed, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AppDatePipe } from '../../../shared/pipes/app-date.pipe';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { BillingService } from '../../../core/services/billing.service';
import {
  BillingPlan,
  BillingTotals,
  CheckoutResponse,
  DeclinedResponse,
  Payment,
  Subscription
} from '../../../core/models/billing.model';

export interface CheckoutDialogData {
  plan: BillingPlan;
  cameras: number;
  totals: BillingTotals;
  currency: string;
}

export type CheckoutStep = 'form' | 'processing' | 'approved' | 'declined' | 'error';

function expiryValidator(control: FormControl<string>): ValidationErrors | null {
  const value = control.value ?? '';
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) {
    return value ? { expiryFormat: true } : null;
  }
  const month = Number(match[1]);
  return month >= 1 && month <= 12 ? null : { expiryFormat: true };
}

@Component({
  selector: 'app-checkout-dialog',
  standalone: true,
  imports: [
    CurrencyPipe,
    AppDatePipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './checkout-dialog.component.html',
  styleUrl: './checkout-dialog.component.scss'
})
export class CheckoutDialogComponent {
  @ViewChild('resultHeading') private resultHeading?: ElementRef<HTMLElement>;

  readonly step = signal<CheckoutStep>('form');
  readonly payment = signal<Payment | null>(null);
  readonly subscription = signal<Subscription | null>(null);
  readonly failureKey = signal<string>('billing.errors.generic');

  /** Plan, payment and receipt, with the state of each derived from the checkout step. */
  readonly stepItems = computed(() => {
    const step = this.step();
    type State = 'done' | 'current' | 'pending' | 'failed';
    const payment: State = step === 'approved' ? 'done' : step === 'declined' || step === 'error' ? 'failed' : 'current';
    const receipt: State = step === 'approved' ? 'current' : 'pending';
    return [
      { key: 'plan', state: 'done' as State },
      { key: 'payment', state: payment },
      { key: 'receipt', state: receipt }
    ];
  });

  readonly summaryState = computed(() => {
    switch (this.step()) {
      case 'processing':
        return { key: 'billing.summary.processing', icon: 'hourglass_top', tone: 'busy' };
      case 'approved':
        return { key: 'billing.summary.paid', icon: 'check_circle', tone: 'ok' };
      case 'declined':
        return { key: 'billing.summary.declined', icon: 'cancel', tone: 'fail' };
      case 'error':
        return { key: 'billing.summary.failed', icon: 'error_outline', tone: 'fail' };
      default:
        return { key: 'billing.summary.pending', icon: 'schedule', tone: 'idle' };
    }
  });

  readonly form = new FormGroup({
    number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}( \d{4}){3}$|^\d{13,19}$/)]
    }),
    holder: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(80)] }),
    expiry: new FormControl('', { nonNullable: true, validators: [Validators.required, expiryValidator] }),
    cvc: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{3,4}$/)] })
  });

  constructor(
    private readonly billing: BillingService,
    private readonly dialogRef: MatDialogRef<CheckoutDialogComponent, 'approved' | undefined>,
    @Inject(MAT_DIALOG_DATA) readonly data: CheckoutDialogData
  ) {}

  onNumberInput(): void {
    const digits = this.form.controls.number.value.replace(/\D/g, '').slice(0, 19);
    this.form.controls.number.setValue(digits.replace(/(.{4})/g, '$1 ').trim(), { emitEvent: false });
  }

  onExpiryInput(): void {
    const digits = this.form.controls.expiry.value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.form.controls.expiry.setValue(formatted, { emitEvent: false });
  }

  onCvcInput(): void {
    this.form.controls.cvc.setValue(this.form.controls.cvc.value.replace(/\D/g, '').slice(0, 4), { emitEvent: false });
  }

  submit(): void {
    if (this.step() !== 'form') {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const [month, year] = raw.expiry.split('/');
    const request = {
      planId: this.data.plan.id,
      cameras: this.data.cameras,
      card: {
        number: raw.number.replace(/\s/g, ''),
        holder: raw.holder.trim(),
        expMonth: Number(month),
        expYear: 2000 + Number(year),
        cvc: raw.cvc
      }
    };

    // Card data never outlives the submit: the form is wiped before the request resolves.
    this.form.reset({ number: '', holder: '', expiry: '', cvc: '' });
    this.step.set('processing');
    this.dialogRef.disableClose = true;

    this.billing.checkout(request).subscribe({
      next: (response: CheckoutResponse) => {
        this.payment.set(response.payment);
        this.subscription.set(response.subscription);
        this.finish('approved');
      },
      error: (error: HttpErrorResponse) => this.handleError(error)
    });
  }

  retry(): void {
    this.payment.set(null);
    this.step.set('form');
  }

  close(): void {
    this.dialogRef.close(this.step() === 'approved' ? 'approved' : undefined);
  }

  private handleError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      // unauthorizedInterceptor already logged out and redirected.
      this.dialogRef.close();
      return;
    }
    if (error.status === 402) {
      const body = error.error as DeclinedResponse | null;
      this.payment.set(body?.payment ?? null);
      this.failureKey.set(`billing.reasons.${body?.payment?.reason ?? 'unknown'}`);
      this.finish('declined');
      return;
    }
    if (error.status === 409) {
      this.failureKey.set('billing.errors.conflict');
    } else if (error.status === 400) {
      this.failureKey.set('billing.errors.validation');
    } else {
      this.failureKey.set('billing.errors.generic');
    }
    this.finish('error');
  }

  private finish(step: CheckoutStep): void {
    this.dialogRef.disableClose = false;
    this.step.set(step);
    setTimeout(() => this.resultHeading?.nativeElement.focus());
  }
}
