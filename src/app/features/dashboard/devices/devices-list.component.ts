import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
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
    DatePipe,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    TranslateModule
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
  readonly displayedColumns = ['name', 'zone', 'status', 'lastReading'];

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
