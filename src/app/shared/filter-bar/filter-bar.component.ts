import { Component, input, model, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

/**
 * Search box, projected filter controls (chips or selects), a live result
 * count and a clear button. Filtering itself stays in the host page.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  template: `
    <div class="filter-bar" role="search" [attr.aria-label]="searchLabel()">
      <mat-form-field appearance="outline" class="filter-bar__search" subscriptSizing="dynamic">
        <mat-label>{{ searchLabel() }}</mat-label>
        <mat-icon matIconPrefix aria-hidden="true">search</mat-icon>
        <input
          matInput
          type="search"
          autocomplete="off"
          spellcheck="false"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </mat-form-field>

      <div class="filter-bar__controls"><ng-content></ng-content></div>

      @if (showClear()) {
        <button mat-stroked-button type="button" class="filter-bar__clear" (click)="clear.emit()">
          <mat-icon aria-hidden="true">filter_alt_off</mat-icon>
          {{ clearLabel() }}
        </button>
      }
    </div>
    <p class="filter-bar__count" role="status" aria-live="polite">{{ resultText() }}</p>
  `,
  styleUrl: './filter-bar.component.scss'
})
export class FilterBarComponent {
  readonly searchLabel = input.required<string>();
  readonly clearLabel = input<string>('');
  /** Already translated text such as "Mostrando 3 de 12". Empty while loading. */
  readonly resultText = input<string>('');
  readonly showClear = input<boolean>(false);
  readonly query = model<string>('');
  readonly clear = output<void>();
}
