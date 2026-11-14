import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type StatusTileStatus = 'online' | 'offline' | 'alert' | 'validating' | 'neutral';

const DEFAULT_ICONS: Record<StatusTileStatus, string> = {
  online: 'check_circle',
  offline: 'remove_circle_outline',
  alert: 'warning_amber',
  validating: 'hourglass_top',
  neutral: 'schedule'
};

/**
 * Service-monitoring tile: label, big value, visible status text with an icon
 * and an optional sparkline. Color tints the tile but the state is always
 * carried by the icon and the status text as well.
 */
@Component({
  selector: 'app-status-tile',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <article class="tile" [class]="'tile tile--' + status()">
      <p class="tile__label">
        @if (!statusText()) {
          <mat-icon aria-hidden="true">{{ resolvedIcon() }}</mat-icon>
        }
        {{ label() }}
      </p>
      <p class="tile__value">{{ value() }}</p>
      @if (statusText()) {
        <p class="tile__status">
          <mat-icon aria-hidden="true">{{ resolvedIcon() }}</mat-icon>
          <span>{{ statusText() }}</span>
        </p>
      }
      @if (hint()) {
        <p class="tile__hint">{{ hint() }}</p>
      }
      @if (sparklinePoints(); as points) {
        <svg class="tile__spark" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" [attr.aria-label]="sparklineLabel() || null" [attr.aria-hidden]="sparklineLabel() ? null : 'true'">
          <polyline [attr.points]="points" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
        </svg>
      }
    </article>
  `,
  styleUrl: './status-tile.component.scss'
})
export class StatusTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  /** Optional status pill. Leave empty when the label already names the state. */
  readonly statusText = input<string>('');
  readonly status = input<StatusTileStatus>('neutral');
  readonly icon = input<string>('');
  readonly hint = input<string>('');
  readonly sparkline = input<number[] | null>(null);
  /** Text alternative for the sparkline; empty marks it decorative. */
  readonly sparklineLabel = input<string>('');

  readonly resolvedIcon = computed(() => this.icon() || DEFAULT_ICONS[this.status()]);

  readonly sparklinePoints = computed(() => {
    const data = this.sparkline();
    if (!data || data.length < 2) {
      return null;
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const step = 100 / (data.length - 1);
    return data
      .map((v, i) => `${(i * step).toFixed(2)},${(22 - ((v - min) / span) * 20).toFixed(2)}`)
      .join(' ');
  });
}
