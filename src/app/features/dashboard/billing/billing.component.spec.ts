import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { BillingComponent } from './billing.component';

const plansBody = {
  currency: 'PEN',
  igvRate: 0.18,
  plans: [
    { id: 'basic', name: 'Basic', monthlyPerCamera: 39, installFeePerCamera: 350, features: ['A'] },
    { id: 'standard', name: 'Standard', monthlyPerCamera: 49, installFeePerCamera: 350, features: ['B'] },
    { id: 'plus', name: 'Plus', monthlyPerCamera: 69, installFeePerCamera: 350, features: ['C'] }
  ]
};

describe('BillingComponent', () => {
  let fixture: ComponentFixture<BillingComponent>;
  let component: BillingComponent;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent, TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BillingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  const flushPlans = () => http.expectOne((r) => r.url.endsWith('/billing/plans')).flush(plansBody);
  const flushSub = (body: object) => http.expectOne((r) => r.url.endsWith('/billing/subscription')).flush(body);
  const el = () => fixture.nativeElement as HTMLElement;

  it('shows the non dismissable simulation notice with the test cards', () => {
    flushPlans();
    flushSub({ subscription: null, payments: [] });
    fixture.detectChanges();
    const notice = el().querySelector('.sim-banner')!;
    expect(notice.textContent).toContain('billing.simulation.title');
    expect(notice.querySelectorAll('tbody tr').length).toBe(4);
    expect(notice.querySelector('button')).toBeNull();
    expect(notice.querySelector('th[scope="col"]')).not.toBeNull();
  });

  it('renders three plans, marks Standard recommended and updates totals with cameras', () => {
    flushPlans();
    flushSub({ subscription: null, payments: [] });
    fixture.detectChanges();
    expect(el().querySelectorAll('.plan-card').length).toBe(3);
    expect(el().querySelectorAll('.badge').length).toBe(1);
    expect(component.planTotals()['basic'].total).toBe(459.02);
    component.setCameras(3);
    fixture.detectChanges();
    expect(component.planTotals()['basic'].subtotal).toBe(1167);
    expect(el().textContent).toContain('S/ 1,167.00');
    expect(el().querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
  });

  it('shows friendly error states when the API is not deployed', () => {
    http.expectOne((r) => r.url.endsWith('/billing/plans')).flush('x', { status: 404, statusText: 'Not Found' });
    http.expectOne((r) => r.url.endsWith('/billing/subscription')).flush('x', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(el().querySelectorAll('[role="alert"]').length).toBe(2);
    expect(component.plansError()).toBeTrue();
  });

  it('shows the active subscription, history and hides plan cards', () => {
    flushPlans();
    flushSub({
      subscription: { id: 's1', planId: 'plus', cameras: 2, status: 'active', monthlyPerCamera: 69, currentPeriodEnd: '2026-12-13T00:00:00Z', createdAt: '2026-11-13T00:00:00Z' },
      payments: [{ id: 'pay_9', status: 'approved', subtotal: 1, igv: 0.18, total: 1.18, currency: 'PEN', cardBrand: 'visa', last4: '4242', createdAt: '2026-11-13T00:00:00Z' }]
    });
    fixture.detectChanges();
    expect(el().querySelectorAll('.plan-card').length).toBe(0);
    expect(el().textContent).toContain('Plus');
    expect(el().textContent).toContain('pay_9');
    expect(el().textContent).toContain('billing.subscription.cancel');
  });
});
