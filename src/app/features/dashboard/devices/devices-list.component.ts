import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppDatePipe } from '../../../shared/pipes/app-date.pipe';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatusTileComponent } from '../../../shared/status-tile/status-tile.component';
import { forkJoin } from 'rxjs';
import { DevicesService } from '../../../core/services/devices.service';
import { ZonesService } from '../../../core/services/zones.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { DeviceStatus } from '../../../core/models/device.model';
import { Zone } from '../../../core/models/zone.model';

@Component({
  selector: 'app-devices-list',
  standalone: true,
  imports: [
    CommonModule,
    AppDatePipe,
    MatMenuModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatChipsModule,
    TranslateModule,
    EmptyStateComponent,
    FilterBarComponent,
    PageHeaderComponent,
    StatusTileComponent
  ],
  templateUrl: './devices-list.component.html',
  styleUrl: './devices-list.component.scss'
})
export class DevicesListComponent implements OnInit {
  readonly devices = signal<DeviceStatus[]>([]);
  readonly zones = signal<Zone[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly selectedZoneId = signal<string>('');
  readonly query = signal('');
  readonly statusFilter = signal<'all' | 'online' | 'offline'>('all');

  readonly onlineCount = computed(() => this.devices().filter((d) => d.isOnline).length);
  readonly offlineCount = computed(() => this.devices().length - this.onlineCount());
  /** Device with the most recent reading, if any device has reported. */
  readonly latest = computed(() => {
    let best: DeviceStatus | null = null;
    for (const device of this.devices()) {
      if (device.lastReading && (!best || device.lastReading.recordedAt > best.lastReading!.recordedAt)) {
        best = device;
      }
    }
    return best;
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.statusFilter();
    return this.devices().filter((device) => {
      if (status === 'online' && !device.isOnline) return false;
      if (status === 'offline' && device.isOnline) return false;
      return !q || `${device.name} ${this.zoneName(device.zoneId)}`.toLowerCase().includes(q);
    });
  });

  readonly displayedColumns = ['name', 'zone', 'status', 'lastReading', 'actions'];

  constructor(
    private readonly devicesService: DevicesService,
    private readonly zonesService: ZonesService,
    private readonly route: ActivatedRoute,
    private readonly pageTitle: PageTitleService
  ) {}

  ngOnInit(): void {
    this.pageTitle.set('devices.title');
    const zoneFromQuery = this.route.snapshot.queryParamMap.get('zone');
    if (zoneFromQuery) {
      this.selectedZoneId.set(zoneFromQuery);
    }
    this.load();
  }

  setStatus(value: 'all' | 'online' | 'offline' | undefined): void {
    this.statusFilter.set(value ?? 'all');
  }

  readonly hasFilters = computed(() => this.query() !== '' || this.statusFilter() !== 'all' || this.selectedZoneId() !== '');

  clearFilters(): void {
    this.query.set('');
    this.statusFilter.set('all');
    if (this.selectedZoneId()) {
      this.onZoneFilterChange('');
    }
  }

  zoneName(zoneId: string): string {
    return this.zones().find((zone) => zone.id === zoneId)?.name ?? zoneId;
  }

  onZoneFilterChange(zoneId: string): void {
    this.selectedZoneId.set(zoneId);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    forkJoin({
      zones: this.zonesService.list(),
      devices: this.devicesService.list(this.selectedZoneId() || undefined)
    }).subscribe({
      next: ({ zones, devices }) => {
        this.zones.set(zones);
        this.loadStatuses(devices.map((device) => device.id));
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private loadStatuses(deviceIds: string[]): void {
    if (deviceIds.length === 0) {
      this.devices.set([]);
      this.loading.set(false);
      return;
    }

    forkJoin(deviceIds.map((id) => this.devicesService.get(id))).subscribe({
      next: (statuses) => {
        this.devices.set(statuses);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
