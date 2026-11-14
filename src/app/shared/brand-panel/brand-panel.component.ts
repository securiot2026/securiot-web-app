import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Brand side of the login split: the SecurIoT mark on the night ground.
 * Purely decorative, hidden from assistive tech; the heading lives in the form pane.
 */
@Component({
  selector: 'app-brand-panel',
  standalone: true,
  imports: [TranslateModule],
  template: `
    <aside class="brand-panel" aria-hidden="true">
      <img class="brand-panel__mark" src="assets/brand/icono-2.svg" alt="" width="320" height="320" />
      <p class="brand-panel__tagline">{{ 'brand.tagline' | translate }}</p>
    </aside>
  `,
  styleUrl: './brand-panel.component.scss'
})
export class BrandPanelComponent {}
