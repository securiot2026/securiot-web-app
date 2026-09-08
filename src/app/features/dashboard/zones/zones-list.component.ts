import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
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
    TranslateModule
  ],
  templateUrl: './zones-list.component.html',
  styleUrl: './zones-list.component.scss'
})
export class ZonesListComponent implements OnInit {
  readonly zones = signal<Zone[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly displayedColumns = ['name', 'location', 'createdAt', 'actions'];

  constructor(
    private readonly zonesService: ZonesService,
    private readonly pageTitle: PageTitleService
  ) {}

  ngOnInit(): void {
    this.pageTitle.set('zones.title');
    this.load();
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
