import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { CheckoutDialogComponent } from './checkout-dialog.component';

const data = {
  plan: { id: 'standard', name: 'Standard', monthlyPerCamera: 49, installFeePerCamera: 350, features: [] },
  cameras: 2,
  totals: { subtotal: 798, igv: 143.64, total: 941.64 },
  currency: 'PEN'
};

describe('CheckoutDialogComponent', () => {
  let fixture: ComponentFixture<CheckoutDialogComponent>;
  let component: CheckoutDialogComponent;
  let http: HttpTestingController;
  const dialogRef = { close: jasmine.createSpy('close'), disableClose: false };

  beforeEach(async () => {
    dialogRef.close.calls.reset();
    await TestBed.configureTestingModule({
      imports: [CheckoutDialogComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CheckoutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function fill(number = '4242424242424242'): void {
    component.form.patchValue({ number, holder: 'Ada Lovelace', expiry: '12/30', cvc: '123' });
  }

  it('has visible labels on every field and a polite live region', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('mat-label').length).toBe(4);
    el.querySelectorAll('input').forEach((input) => expect(input.hasAttribute('autocomplete')).toBeTrue());
    expect(el.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('formats the card number in groups of 4', () => {
    component.form.controls.number.setValue('4242424242424242');
    component.onNumberInput();
    expect(component.form.controls.number.value).toBe('4242 4242 4242 4242');
  });

  it('shows programmatic errors and does not call the API when invalid', () => {
    component.submit();
    fixture.detectChanges();
    expect(component.step()).toBe('form');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('mat-error').length).toBeGreaterThan(0);
    http.expectNone((r) => r.url.endsWith('/billing/checkout'));
  });

  it('sends the card, wipes the form and shows the receipt when approved', fakeAsync(() => {
    fill();
    component.submit();
    expect(component.step()).toBe('processing');
    expect(component.form.getRawValue()).toEqual({ number: '', holder: '', expiry: '', cvc: '' });
    const req = http.expectOne((r) => r.url.endsWith('/billing/checkout'));
    expect(req.request.body.card).toEqual({ number: '4242424242424242', holder: 'Ada Lovelace', expMonth: 12, expYear: 2030, cvc: '123' });
    req.flush({
      payment: { id: 'pay_1', status: 'approved', subtotal: 798, igv: 143.64, total: 941.64, currency: 'PEN', cardBrand: 'visa', last4: '4242', createdAt: '2026-11-13T10:00:00Z' },
      subscription: { id: 'sub_1', planId: 'standard', cameras: 2, status: 'active', monthlyPerCamera: 49, currentPeriodEnd: '2026-12-13T10:00:00Z', createdAt: '2026-11-13T10:00:00Z' }
    });
    tick();
    fixture.detectChanges();
    expect(component.step()).toBe('approved');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('pay_1');
    expect(text).toContain('4242');
    expect(text).toContain('S/ 941.64');
  }));

  it('shows the decline reason and lets the user retry', fakeAsync(() => {
    fill('4000000000009995');
    component.submit();
    http
      .expectOne((r) => r.url.endsWith('/billing/checkout'))
      .flush({ payment: { id: 'pay_2', status: 'declined', reason: 'insufficient_funds' } }, { status: 402, statusText: 'Payment Required' });
    tick();
    fixture.detectChanges();
    expect(component.step()).toBe('declined');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('billing.reasons.insufficient_funds');
    component.retry();
    expect(component.step()).toBe('form');
  }));

  it('maps 409 to the conflict message', fakeAsync(() => {
    fill();
    component.submit();
    http.expectOne((r) => r.url.endsWith('/billing/checkout')).flush({}, { status: 409, statusText: 'Conflict' });
    tick();
    expect(component.step()).toBe('error');
    expect(component.failureKey()).toBe('billing.errors.conflict');
  }));
});
