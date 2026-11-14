import { Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-cancel-subscription-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule],
  template: `
    <h2 mat-dialog-title id="cancel-sub-title">{{ 'billing.cancelDialog.title' | translate }}</h2>
    <mat-dialog-content>
      <p>{{ 'billing.cancelDialog.body' | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" [mat-dialog-close]="false" cdkFocusInitial>
        {{ 'billing.cancelDialog.keep' | translate }}
      </button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">
        {{ 'billing.cancelDialog.confirm' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class CancelSubscriptionDialogComponent {}
