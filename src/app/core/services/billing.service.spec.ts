import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BillingService } from './billing.service';
import { calculateTotals } from './billing.util';
import { BillingPlan } from '../models/billing.model';

const plan: BillingPlan = { id: 'standard', name: 'Standard', monthlyPerCamera: 49, installFeePerCamera: 350, features: [] };

describe('BillingService', () => {
  let service: BillingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BillingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets the plans', () => {
    service.getPlans().subscribe((res) => expect(res.plans.length).toBe(0));
    const req = http.expectOne((r) => r.url.endsWith('/billing/plans'));
    expect(req.request.method).toBe('GET');
    req.flush({ currency: 'PEN', igvRate: 0.18, plans: [] });
  });

  it('posts the checkout body', () => {
    const body = { planId: 'basic', cameras: 2, card: { number: '4242424242424242', holder: 'A', expMonth: 12, expYear: 2030, cvc: '123' } };
    service.checkout(body).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/billing/checkout'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('gets the subscription and cancels it', () => {
    service.getSubscription().subscribe((res) => expect(res.subscription).toBeNull());
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/billing/subscription')).flush({ subscription: null, payments: [] });
    service.cancelSubscription().subscribe((res) => expect(res.status).toBe('canceled'));
    http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/billing/subscription/cancel')).flush({ status: 'canceled' });
  });
});

describe('calculateTotals', () => {
  it('adds install fee and IGV for the first charge', () => {
    expect(calculateTotals(plan, 2, 0.18)).toEqual({ subtotal: 798, igv: 143.64, total: 941.64 });
  });

  it('handles one camera', () => {
    expect(calculateTotals({ ...plan, monthlyPerCamera: 39 }, 1, 0.18)).toEqual({ subtotal: 389, igv: 70.02, total: 459.02 });
  });
});
