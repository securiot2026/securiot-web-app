import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppDatePipe } from '../../../../shared/pipes/app-date.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription, catchError, forkJoin, interval, of, startWith, switchMap } from 'rxjs';
import { DevicesService } from '../../../../core/services/devices.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { DeviceStatus, LatestFrame, Occupancy } from '../../../../core/models/device.model';

const POLL_INTERVAL_MS = 5000;

@Component({
  selector: 'app-device-live-feed',
  standalone: true,
  imports: [CommonModule, AppDatePipe, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  templateUrl: './device-live-feed.component.html',
  styleUrl: './device-live-feed.component.scss'
})
export class DeviceLiveFeedComponent implements OnInit, OnDestroy {
  private readonly deviceId: string;
  private pollSubscription: Subscription | null = null;

  readonly device = signal<DeviceStatus | null>(null);
  readonly frame = signal<LatestFrame | null>(null);
  readonly occupancy = signal<Occupancy | null>(null);
  readonly loading = signal(true);
  readonly errorKey = signal<string | null>(null);
  readonly edgeUrlMissing = computed(() => this.device() !== null && !this.device()?.edgeUrl);
  readonly frameSrc = computed(() => {
    const current = this.frame();
    return current ? `data:image/jpeg;base64,${current.frame}` : null;
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly devicesService: DevicesService,
    private readonly pageTitle: PageTitleService
  ) {
    this.deviceId = this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.pageTitle.set('liveFeed.title');

    this.devicesService.get(this.deviceId).subscribe((device) => {
      this.device.set(device);
      if (device.edgeUrl) {
        this.startPolling();
      } else {
        this.loading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  private startPolling(): void {
    this.pollSubscription = interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() =>
          forkJoin({
            frame: this.devicesService.getLatestFrame(this.deviceId).pipe(catchError(() => of(null))),
            // Occupancy (EXTR-02) polls alongside the frame rather than on its own
            // timer — one shared 5s cadence is enough for a "casi en tiempo real"
            // counter and avoids a second independent subscription/interval.
            occupancy: this.devicesService.getOccupancy(this.deviceId).pipe(catchError(() => of(null)))
          })
        )
      )
      .subscribe(({ frame, occupancy }) => {
        this.loading.set(false);
        if (frame) {
          this.frame.set(frame);
          this.errorKey.set(null);
        } else {
          this.errorKey.set('liveFeed.loadError');
        }
        if (occupancy) {
          this.occupancy.set(occupancy);
        }
      });
  }
}
