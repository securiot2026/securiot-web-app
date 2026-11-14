import { Component, input } from '@angular/core';

/**
 * Page title block shared by every dashboard screen: one h1, optional
 * supporting line, optional count badge and a slot for page-level actions.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div class="page-header__text">
        <h1 class="page-header__title">
          {{ title() }}
          @if (countLabel()) {
            <span class="page-header__count">{{ countLabel() }}</span>
          }
        </h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions"><ng-content></ng-content></div>
    </header>
  `,
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  /** Already translated heading text. */
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  /** Already translated count text such as "12 dispositivos". */
  readonly countLabel = input<string>('');
}
