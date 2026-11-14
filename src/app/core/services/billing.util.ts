import { BillingPlan, BillingTotals } from '../models/billing.model';

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

/** First charge: (monthly + install fee) per camera, plus IGV on the subtotal. */
export function calculateTotals(plan: BillingPlan, cameras: number, igvRate: number): BillingTotals {
  const subtotal = round2((plan.monthlyPerCamera + plan.installFeePerCamera) * cameras);
  const igv = round2(subtotal * igvRate);
  return { subtotal, igv, total: round2(subtotal + igv) };
}
