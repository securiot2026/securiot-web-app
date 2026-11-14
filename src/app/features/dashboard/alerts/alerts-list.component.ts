import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { forkJoin } from 'rxjs';
import { AlertsService } from '../../../core/services/alerts.service';
import { ZonesService } from '../../../core/services/zones.service';
import { DevicesService } from '../../../core/services/devices.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { Alert } from '../../../core/models/alert.model';
import { Zone } from '../../../core/models/zone.model';
import { Device } from '../../../core/models/device.model';

@Component({
  selector: 'app-alerts-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    TranslateModule,
    EmptyStateComponent,
    FilterBarComponent,
    PageHeaderComponent
  ],
  templateUrl: './alerts-list.component.html',
  styleUrl: './alerts-list.component.scss'
})
export class AlertsListComponent implements OnInit {
  readonly alerts = signal<Alert[]>([]);
  readonly zones = signal<Zone[]>([]);
  readonly devices = signal<Device[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly zoneFilter = signal<string>('');
  readonly deviceFilter = signal<string>('');
  readonly statusFilter = signal<string>('');

  readonly query = signal('');
  readonly severityFilter = signal<'all' | 'low' | 'medium' | 'high'>('all');

  get hasActiveFilters(): boolean {
    return !!(this.zoneFilter() || this.deviceFilter() || this.statusFilter());
  }

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const severity = this.severityFilter();
    return this.alerts().filter((alert) => {
      if (severity === 'high' ? !['high', 'critical'].includes(alert.severity) : severity !== 'all' && alert.severity !== severity) {
        return false;
      }
      if (!q) return true;
      const haystack = `${alert.message} ${alert.ruleType} ${this.zoneName(alert.zoneId)} ${this.deviceName(alert.deviceId)}`;
      return haystack.toLowerCase().includes(q);
    });
  });

  readonly displayedColumns = ['createdAt', 'zone', 'device', 'rule', 'severity', 'status', 'message'];

  constructor(
    private readonly alertsService: AlertsService,
    private readonly zonesService: ZonesService,
    private readonly devicesService: DevicesService,
    private readonly pageTitle: PageTitleService
  ) {}

  ngOnInit(): void {
    this.pageTitle.set('alerts.title');
    forkJoin({
      zones: this.zonesService.list(),
      devices: this.devicesService.list()
    }).subscribe(({ zones, devices }) => {
      this.zones.set(zones);
      this.devices.set(devices);
    });

    this.load();
  }

  zoneName(zoneId: string): string {
    return this.zones().find((zone) => zone.id === zoneId)?.name ?? zoneId;
  }

  deviceName(deviceId: string): string {
    return this.devices().find((device) => device.id === deviceId)?.name ?? deviceId;
  }

  severityIcon(severity: string): string {
    switch (severity) {
      case 'low':
        return 'info_outline';
      case 'medium':
        return 'error_outline';
      case 'high':
      case 'critical':
        return 'warning_amber_rounded';
      default:
        return 'warning_amber_rounded';
    }
  }

  onFilterChange(kind: 'zone' | 'device' | 'status', value: string): void {
    if (kind === 'zone') {
      this.zoneFilter.set(value);
    } else if (kind === 'device') {
      this.deviceFilter.set(value);
    } else {
      this.statusFilter.set(value);
    }
    this.load();
  }

  setSeverity(value: 'all' | 'low' | 'medium' | 'high' | undefined): void {
    this.severityFilter.set(value ?? 'all');
  }

  clearFilters(): void {
    this.query.set('');
    this.severityFilter.set('all');
    this.zoneFilter.set('');
    this.deviceFilter.set('');
    this.statusFilter.set('');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);

    this.alertsService
      .list({
        zone_id: this.zoneFilter() || undefined,
        device_id: this.deviceFilter() || undefined,
        status: this.statusFilter() || undefined
      })
      .subscribe({
        next: (alerts) => {
          this.alerts.set(alerts);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        }
      });
  }
}
