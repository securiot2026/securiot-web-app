import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppDatePipe } from '../../../../shared/pipes/app-date.pipe';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DevicesService } from '../../../../core/services/devices.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import {
  DeviceStatus,
  Rule,
  RuleActionType,
  RuleConditionType,
  RuleDryRunResult,
  RuleFormValue
} from '../../../../core/models/device.model';

const CONDITION_TYPES: RuleConditionType[] = ['object_class', 'weapon', 'fire', 'occupancy', 'sensor_threshold'];
const ACTION_TYPES: RuleActionType[] = ['door_lock', 'light', 'buzzer', 'alert'];

/**
 * Resolves the translation key for a dry-run outcome. The response is the source of
 * truth: the UI never claims a device action ran unless the response says executed === true.
 */
export function resolveDryRunResultKey(requestedExecute: boolean, response: RuleDryRunResult | null | undefined): string {
  if (response?.executed === true) {
    return Array.isArray(response.queued) && response.queued.length === 0
      ? 'rules.dryRunExecutedNoAction'
      : 'rules.dryRunExecuted';
  }
  return requestedExecute ? 'rules.dryRunNotConfirmed' : 'rules.dryRunSimulated';
}

@Component({
  selector: 'app-device-rules',
  standalone: true,
  imports: [
    CommonModule,
    AppDatePipe,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSlideToggleModule,
    MatTableModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    TranslateModule
  ],
  templateUrl: './device-rules.component.html',
  styleUrl: './device-rules.component.scss'
})
export class DeviceRulesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deviceId: string;

  readonly conditionTypes = CONDITION_TYPES;
  readonly actionTypes = ACTION_TYPES;
  readonly displayedColumns = ['name', 'condition', 'actions', 'lastTriggered', 'enabled', 'ops'];

  readonly device = signal<DeviceStatus | null>(null);
  readonly rules = signal<Rule[]>([]);
  readonly loading = signal(true);
  readonly loadErrorKey = signal<string | null>(null);
  readonly edgeUrlMissing = computed(() => this.device() !== null && !this.device()?.edgeUrl);

  readonly editingId = signal<number | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly formErrorKey = signal<string | null>(null);

  readonly dryRunResultKey = signal<string | null>(null);
  readonly dryRunErrorKey = signal<string | null>(null);
  readonly dryRunningId = signal<number | null>(null);
  private readonly executeOnDevice = signal<Record<number, boolean>>({});
  readonly dryRunResultIcon = computed(() => {
    switch (this.dryRunResultKey()) {
      case null:
        return null;
      case 'rules.dryRunExecuted':
        return 'check_circle';
      case 'rules.dryRunNotConfirmed':
        return 'warning';
      default:
        return 'info';
    }
  });

  readonly deleteErrorKey = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    condition_type: ['object_class' as RuleConditionType, Validators.required],
    operator: [''],
    sensor_type: [''],
    match_value: [''],
    action_type: ['alert' as RuleActionType, Validators.required],
    action_severity: ['medium'],
    action_message: [''],
    action_color: [''],
    priority: [100, [Validators.required, Validators.min(0)]],
    cooldown_seconds: [30, [Validators.required, Validators.min(0)]],
    enabled: [true]
  });

  readonly showSensorFields = computed(() => this.formConditionType() === 'sensor_threshold');
  readonly showMatchValue = computed(() =>
    ['object_class', 'occupancy', 'sensor_threshold'].includes(this.formConditionType())
  );

  private formConditionType = signal<RuleConditionType>('object_class');
  private formActionType = signal<RuleActionType>('alert');
  readonly showActionSeverity = computed(() => this.formActionType() === 'alert');
  readonly showActionColor = computed(() => this.formActionType() === 'light');

  constructor(
    private readonly route: ActivatedRoute,
    private readonly devicesService: DevicesService,
    private readonly pageTitle: PageTitleService,
    private readonly dialog: MatDialog,
    private readonly translate: TranslateService
  ) {
    this.deviceId = this.route.snapshot.paramMap.get('id')!;
    this.form.controls.condition_type.valueChanges.subscribe((value) => this.formConditionType.set(value));
    this.form.controls.action_type.valueChanges.subscribe((value) => this.formActionType.set(value));
  }

  ngOnInit(): void {
    this.pageTitle.set('rules.title');
    this.devicesService.get(this.deviceId).subscribe((device) => this.device.set(device));
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadErrorKey.set(null);
    this.devicesService.listRules(this.deviceId).subscribe({
      next: (rules) => {
        this.rules.set(rules);
        this.loading.set(false);
      },
      error: () => {
        this.loadErrorKey.set('rules.loadError');
        this.loading.set(false);
      }
    });
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.formErrorKey.set(null);
    this.form.reset({
      name: '',
      condition_type: 'object_class',
      operator: '',
      sensor_type: '',
      match_value: '',
      action_type: 'alert',
      action_severity: 'medium',
      action_message: '',
      action_color: '',
      priority: 100,
      cooldown_seconds: 30,
      enabled: true
    });
    this.formConditionType.set('object_class');
    this.formActionType.set('alert');
    this.formOpen.set(true);
  }

  openEditForm(rule: Rule): void {
    this.editingId.set(rule.id);
    this.formErrorKey.set(null);
    const firstAction = rule.actions[0] ?? { type: 'alert' };
    this.form.reset({
      name: rule.name,
      condition_type: rule.condition_type,
      operator: rule.operator ?? '',
      sensor_type: rule.sensor_type ?? '',
      match_value: rule.match_value ?? '',
      action_type: (firstAction.type as RuleActionType) ?? 'alert',
      action_severity: (firstAction['severity'] as string) ?? 'medium',
      action_message: (firstAction['message'] as string) ?? '',
      action_color: (firstAction['color'] as string) ?? '',
      priority: rule.priority,
      cooldown_seconds: rule.cooldown_seconds,
      enabled: rule.enabled
    });
    this.formConditionType.set(rule.condition_type);
    this.formActionType.set((firstAction.type as RuleActionType) ?? 'alert');
    this.formOpen.set(true);
  }

  cancelForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const action: { type: RuleActionType; [key: string]: unknown } = { type: value.action_type };
    if (value.action_type === 'alert') {
      action['severity'] = value.action_severity;
      if (value.action_message) {
        action['message'] = value.action_message;
      }
    }
    if (value.action_type === 'light' && value.action_color) {
      action['color'] = value.action_color;
    }

    const payload: RuleFormValue = {
      name: value.name,
      condition_type: value.condition_type,
      operator: value.condition_type === 'sensor_threshold' ? (value.operator as RuleFormValue['operator']) || null : null,
      sensor_type: value.condition_type === 'sensor_threshold' ? (value.sensor_type || null) : null,
      match_value: this.showMatchValue() ? (value.match_value || null) : null,
      actions: [action],
      priority: value.priority,
      cooldown_seconds: value.cooldown_seconds,
      enabled: value.enabled
    };

    this.saving.set(true);
    this.formErrorKey.set(null);

    const editingId = this.editingId();
    const request = editingId
      ? this.devicesService.updateRule(this.deviceId, editingId, payload)
      : this.devicesService.createRule(this.deviceId, payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.formErrorKey.set('rules.saveError');
      }
    });
  }

  toggleEnabled(rule: Rule, enabled: boolean): void {
    this.devicesService.updateRule(this.deviceId, rule.id, { enabled }).subscribe({
      next: () => this.load(),
      error: () => this.loadErrorKey.set('rules.toggleError')
    });
  }

  deleteRule(rule: Rule): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        role: 'alertdialog',
        width: '28rem',
        maxWidth: '95vw',
        restoreFocus: true,
        ariaLabelledBy: 'confirm-dialog-title',
        data: {
          title: this.translate.instant('rules.deleteDialog.title', { name: rule.name }),
          body: this.translate.instant('rules.deleteDialog.body'),
          confirmLabel: this.translate.instant('rules.deleteButton'),
          cancelLabel: this.translate.instant('rules.deleteDialog.keep')
        }
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(rule);
        }
      });
  }

  private performDelete(rule: Rule): void {
    this.deleteErrorKey.set(null);
    this.devicesService.deleteRule(this.deviceId, rule.id).subscribe({
      next: () => this.load(),
      error: () => this.deleteErrorKey.set('rules.deleteError')
    });
  }

  isExecuteChecked(ruleId: number): boolean {
    return this.executeOnDevice()[ruleId] === true;
  }

  setExecute(ruleId: number, checked: boolean): void {
    this.executeOnDevice.update((state) => ({ ...state, [ruleId]: checked }));
    this.dryRunResultKey.set(null);
    this.dryRunErrorKey.set(null);
  }

  dryRun(rule: Rule): void {
    this.dryRunErrorKey.set(null);
    this.dryRunResultKey.set(null);
    this.dryRunningId.set(rule.id);
    const execute = this.isExecuteChecked(rule.id);

    this.devicesService.dryRunRule(this.deviceId, rule.id, execute).subscribe({
      next: (response) => {
        this.dryRunningId.set(null);
        this.dryRunResultKey.set(resolveDryRunResultKey(execute, response));
      },
      error: () => {
        this.dryRunningId.set(null);
        this.dryRunErrorKey.set('rules.dryRunError');
      }
    });
  }
}
