export type PlanId = 'basic' | 'standard' | 'plus';

export interface BillingPlan {
  id: PlanId | string;
  name: string;
  monthlyPerCamera: number;
  installFeePerCamera: number;
  features: string[];
}

export interface BillingPlansResponse {
  currency: string;
  igvRate: number;
  plans: BillingPlan[];
}

export interface CardInput {
  number: string;
  holder: string;
  expMonth: number;
  expYear: number;
  cvc: string;
}

export interface CheckoutRequest {
  planId: string;
  cameras: number;
  card: CardInput;
}

export type PaymentStatus = 'approved' | 'declined';

export type DeclineReason = 'card_declined' | 'insufficient_funds' | 'expired_card' | 'unknown_test_card';

export interface Payment {
  id: string;
  status: PaymentStatus;
  subtotal: number;
  igv: number;
  total: number;
  currency: string;
  cardBrand?: string;
  last4?: string;
  reason?: DeclineReason | string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  planId: string;
  cameras: number;
  status: 'active' | 'canceled' | string;
  monthlyPerCamera: number;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface CheckoutResponse {
  payment: Payment;
  subscription: Subscription;
}

export interface SubscriptionResponse {
  subscription: Subscription | null;
  payments: Payment[];
}

export interface DeclinedResponse {
  payment: Payment;
}

export interface BillingTotals {
  subtotal: number;
  igv: number;
  total: number;
}
