import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { BillingService } from '../../../core/services/billing.service';
import { calculateTotals } from '../../../core/services/billing.util';
import { PageTitleService } from '../../../core/services/page-title.service';
import { BillingPlan, BillingTotals, Payment, Subscription } from '../../../core/models/billing.model';
import { CheckoutDialogComponent, CheckoutDialogData } from './checkout-dialog.component';
import { CancelSubscriptionDialogComponent } from './cancel-subscription-dialog.component';

export const TEST_CARDS = [
  { number: '4242 4242 4242 4242', resultKey: 'billing.simulation.approved', icon: 'check_circle' },
  { number: '4000 0000 0000 0002', resultKey: 'billing.simulation.declined', icon: 'cancel' },
  { number: '4000 0000 0000 9995', resultKey: 'billing.simulation.insufficient', icon: 'cancel' },
  { number: '4000 0000 0000 0069', resultKey: 'billing.simulation.expired', icon: 'cancel' }
];

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    FormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss'
})
export class BillingComponent implements OnInit {
  readonly testCards = TEST_CARDS;
  readonly cameraOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  readonly plans = signal<BillingPlan[]>([]);
  readonly currency = signal('PEN');
  readonly igvRate = signal(0.18);
  readonly cameras = signal(1);
  readonly plansLoading = signal(true);
  readonly plansError = signal(false);

  readonly subscription = signal<Subscription | null>(null);
  readonly payments = signal<Payment[]>([]);
  readonly subLoading = signal(true);
  readonly subError = signal(false);
  readonly canceling = signal(false);
  readonly cancelError = signal(false);
  readonly statusMessage = signal('');

  readonly igvPercent = computed(() => Math.round(this.igvRate() * 100));
  readonly hasActiveSubscription = computed(() => this.subscription()?.status === 'active');
  readonly planTotals = computed<Record<string, BillingTotals>>(() => {
    const totals: Record<string, BillingTotals> = {};
    for (const plan of this.plans()) {
      totals[plan.id] = calculateTotals(plan, this.cameras(), this.igvRate());
    }
    return totals;
  });
  readonly currentPlanName = computed(() => {
    const sub = this.subscription();
    return sub ? (this.plans().find((p) => p.id === sub.planId)?.name ?? sub.planId) : '';
  });

  constructor(
    private readonly billing: BillingService,
    private readonly dialog: MatDialog,
    private readonly pageTitle: PageTitleService
  ) {}

  ngOnInit(): void {
    this.pageTitle.set('billing.title');
    this.load();
  }

  load(): void {
    this.loadPlans();
    this.loadSubscription();
  }

  loadPlans(): void {
    this.plansLoading.set(true);
    this.plansError.set(false);
    this.billing.getPlans().subscribe({
      next: (response) => {
        this.plans.set(response.plans);
        this.currency.set(response.currency);
        this.igvRate.set(response.igvRate);
        this.plansLoading.set(false);
      },
      error: () => {
        this.plansError.set(true);
        this.plansLoading.set(false);
      }
    });
  }

  loadSubscription(): void {
    this.subLoading.set(true);
    this.subError.set(false);
    this.billing.getSubscription().subscribe({
      next: (response) => {
        this.subscription.set(response.subscription);
        this.payments.set(response.payments);
        this.subLoading.set(false);
      },
      error: () => {
        this.subError.set(true);
        this.subLoading.set(false);
      }
    });
  }

  setCameras(value: number): void {
    this.cameras.set(value);
  }

  isRecommended(plan: BillingPlan): boolean {
    return plan.id === 'standard';
  }

  choose(plan: BillingPlan): void {
    const data: CheckoutDialogData = {
      plan,
      cameras: this.cameras(),
      totals: this.planTotals()[plan.id],
      currency: this.currency()
    };
    this.dialog
      .open<CheckoutDialogComponent, CheckoutDialogData, 'approved' | undefined>(CheckoutDialogComponent, {
        data,
        width: '32rem',
        maxWidth: '95vw',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabelledBy: 'checkout-title'
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'approved') {
          this.loadSubscription();
        }
      });
  }

  confirmCancel(): void {
    this.dialog
      .open<CancelSubscriptionDialogComponent, void, boolean>(CancelSubscriptionDialogComponent, {
        role: 'alertdialog',
        width: '28rem',
        maxWidth: '95vw',
        restoreFocus: true,
        ariaLabelledBy: 'cancel-sub-title'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.cancel();
        }
      });
  }

  private cancel(): void {
    this.canceling.set(true);
    this.cancelError.set(false);
    this.billing.cancelSubscription().subscribe({
      next: (canceled) => {
        this.subscription.set(canceled);
        this.canceling.set(false);
        this.statusMessage.set('billing.subscription.canceledAnnounce');
      },
      error: () => {
        this.canceling.set(false);
        this.cancelError.set(true);
      }
    });
  }
}
