import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BillingPlansResponse,
  CheckoutRequest,
  CheckoutResponse,
  Subscription,
  SubscriptionResponse
} from '../models/billing.model';

// 401 responses are handled globally by unauthorizedInterceptor (logout + redirect to login).
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly baseUrl = `${environment.apiBaseUrl}/billing`;

  constructor(private readonly http: HttpClient) {}

  getPlans(): Observable<BillingPlansResponse> {
    return this.http.get<BillingPlansResponse>(`${this.baseUrl}/plans`);
  }

  checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/checkout`, request);
  }

  getSubscription(): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(`${this.baseUrl}/subscription`);
  }

  cancelSubscription(): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/subscription/cancel`, {});
  }
}
