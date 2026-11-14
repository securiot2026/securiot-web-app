import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type EmptyStateVariant = 'empty' | 'filtered' | 'error' | 'loading';

/**
 * One component for the three async states of a list: loading (polite
 * status), error (alert, retry goes in the content slot) and empty.
 * State is always icon plus text, never color alone.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="empty-state" [class.empty-state--error]="variant() === 'error'" [attr.role]="role()">
      @if (variant() === 'loading') {
        <mat-progress-spinner diameter="32" mode="indeterminate" aria-hidden="true"></mat-progress-spinner>
      } @else {
        <mat-icon aria-hidden="true">{{ resolvedIcon() }}</mat-icon>
      }
      @if (title()) {
        <h2 class="empty-state__title">{{ title() }}</h2>
      }
      @if (body()) {
        <p class="empty-state__body">{{ body() }}</p>
      }
      <div class="empty-state__actions"><ng-content></ng-content></div>
    </section>
  `,
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  readonly variant = input<EmptyStateVariant>('empty');
  readonly icon = input<string>('');
  /** Already translated text. */
  readonly title = input<string>('');
  readonly body = input<string>('');

  readonly role = computed(() => {
    switch (this.variant()) {
      case 'error':
        return 'alert';
      case 'loading':
        return 'status';
      default:
        return null;
    }
  });

  readonly resolvedIcon = computed(() => {
    if (this.icon()) {
      return this.icon();
    }
    switch (this.variant()) {
      case 'error':
        return 'error_outline';
      case 'filtered':
        return 'search_off';
      default:
        return 'inbox';
    }
  });
}
