import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  /** Already translated texts. */
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
}

/** Confirmation for destructive actions. Focus starts on the safe choice. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title id="confirm-dialog-title">{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.body }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" [mat-dialog-close]="false" cdkFocusInitial>{{ data.cancelLabel }}</button>
      <button mat-flat-button type="button" class="confirm-danger" [mat-dialog-close]="true">{{ data.confirmLabel }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
