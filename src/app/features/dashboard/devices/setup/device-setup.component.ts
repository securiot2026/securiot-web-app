import { Component, ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DevicesService } from '../../../../core/services/devices.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { QrCodeService } from '../../../../core/services/qr-code.service';
import { DeviceStatus } from '../../../../core/models/device.model';
import { QR_VISIBLE_MS, buildPortalUrl } from './device-setup.util';

@Component({
  selector: 'app-device-setup',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './device-setup.component.html',
  styleUrl: './device-setup.component.scss'
})
export class DeviceSetupComponent implements OnInit, OnDestroy {
  readonly deviceId: string;
  private readonly route = inject(ActivatedRoute);
  private readonly devicesService = inject(DevicesService);
  private readonly pageTitle = inject(PageTitleService);
  private readonly qrCode = inject(QrCodeService);
  private readonly clipboard = inject(Clipboard);
  private hideTimer: number | null = null;

  @ViewChild('showButton', { read: ElementRef }) private showButton?: ElementRef<HTMLButtonElement>;

  readonly device = signal<DeviceStatus | null>(null);
  readonly loading = signal(false);
  // The secret lives only in these two signals. Never log, store or route them.
  readonly portalUrl = signal<string | null>(null);
  readonly qrDataUrl = signal<string | null>(null);
  readonly statusKey = signal<string | null>(null);
  readonly errorKey = signal<string | null>(null);
  readonly edgeUrlMissing = computed(() => this.device() !== null && !this.device()?.edgeUrl);

  constructor() {
    this.deviceId = this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.pageTitle.set('setup.title');
    this.devicesService.get(this.deviceId).subscribe({
      next: (device) => this.device.set(device),
      error: () => this.errorKey.set('common.loadError')
    });
  }

  ngOnDestroy(): void {
    this.clearTimer();
    this.portalUrl.set(null);
    this.qrDataUrl.set(null);
  }

  configure(): void {
    this.clearTimer();
    this.errorKey.set(null);
    this.statusKey.set(null);
    this.loading.set(true);

    this.devicesService.getSetupPayload(this.deviceId).subscribe({
      next: (payload) => {
        void this.reveal(buildPortalUrl(payload));
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorKey.set(this.errorKeyFor(err));
      }
    });
  }

  copyLink(): void {
    const url = this.portalUrl();
    if (!url) {
      return;
    }
    this.statusKey.set(this.clipboard.copy(url) ? 'setup.copied' : 'setup.copyFailed');
  }

  hide(messageKey: string = 'setup.hiddenMessage'): void {
    this.clearTimer();
    this.portalUrl.set(null);
    this.qrDataUrl.set(null);
    this.errorKey.set(null);
    this.statusKey.set(messageKey);
    this.showButton?.nativeElement.focus();
  }

  private async reveal(url: string): Promise<void> {
    // The link is shown even if drawing the QR fails, so the operator can still copy it.
    this.portalUrl.set(url);
    this.startTimer();
    try {
      this.qrDataUrl.set(await this.qrCode.toDataUrl(url));
    } catch {
      this.errorKey.set('setup.errorQr');
    } finally {
      this.loading.set(false);
    }
  }

  private startTimer(): void {
    this.clearTimer();
    this.hideTimer = window.setTimeout(() => this.hide('setup.expiredMessage'), QR_VISIBLE_MS);
  }

  private clearTimer(): void {
    if (this.hideTimer !== null) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private errorKeyFor(err: unknown): string {
    switch (err instanceof HttpErrorResponse ? err.status : 0) {
      case 400:
        return 'setup.needsEdgeUrl';
      case 404:
        return 'setup.errorNotFound';
      case 503:
        return 'setup.errorNotConfigured';
      default:
        return 'setup.errorGeneric';
    }
  }
}
