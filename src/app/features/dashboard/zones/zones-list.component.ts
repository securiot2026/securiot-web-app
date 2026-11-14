import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { FilterBarComponent } from '../../../shared/filter-bar/filter-bar.component';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { ZonesService } from '../../../core/services/zones.service';
import { PageTitleService } from '../../../core/services/page-title.service';
import { Zone } from '../../../core/models/zone.model';

@Component({
  selector: 'app-zones-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    EmptyStateComponent,
    FilterBarComponent,
    PageHeaderComponent
  ],
  templateUrl: './zones-list.component.html',
  styleUrl: './zones-list.component.scss'
})
export class ZonesListComponent implements OnInit {
  readonly zones = signal<Zone[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly query = signal('');
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return q
      ? this.zones().filter((zone) => `${zone.name} ${zone.location ?? ''}`.toLowerCase().includes(q))
      : this.zones();
  });
  readonly displayedColumns = ['name', 'location', 'createdAt', 'actions'];

  constructor(
    private readonly zonesService: ZonesService,
    private readonly pageTitle: PageTitleService
  ) {}

  ngOnInit(): void {
    this.pageTitle.set('zones.title');
    this.load();
  }

  clearFilters(): void {
    this.query.set('');
  }

  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.zonesService.list().subscribe({
      next: (zones) => {
        this.zones.set(zones);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }
}
