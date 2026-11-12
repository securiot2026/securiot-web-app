import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DevicesService } from '../../../../core/services/devices.service';
import { PageTitleService } from '../../../../core/services/page-title.service';
import { DeviceStatus, FaceEnrollmentResult } from '../../../../core/models/device.model';

@Component({
  selector: 'app-device-face-recognition',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './device-face-recognition.component.html',
  styleUrl: './device-face-recognition.component.scss'
})
export class DeviceFaceRecognitionComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deviceId: string;

  readonly device = signal<DeviceStatus | null>(null);
  readonly faceRecognitionEnabled = signal<boolean | null>(null);
  readonly toggleDisabled = computed(() => !this.device()?.edgeUrl);

  readonly edgeUrlForm = this.fb.nonNullable.group({
    edgeUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]]
  });
  readonly savingEdgeUrl = signal(false);
  readonly savedMessage = signal<string | null>(null);
  readonly edgeUrlErrorKey = signal<string | null>(null);

  readonly toggleErrorKey = signal<string | null>(null);

  readonly enrollForm = this.fb.nonNullable.group({
    name: ['', Validators.required]
  });
  readonly selectedFiles = signal<File[]>([]);
  readonly submitting = signal(false);
  readonly photosRequiredError = signal(false);
  readonly enrollErrorKey = signal<string | null>(null);
  readonly enrollResult = signal<FaceEnrollmentResult | null>(null);
  readonly enrollSkippedReasons = signal<string[]>([]);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly devicesService: DevicesService,
    private readonly pageTitle: PageTitleService
  ) {
    this.deviceId = this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit(): void {
    this.pageTitle.set('faceRecognition.title');

    this.devicesService.get(this.deviceId).subscribe((device) => {
      this.device.set(device);
      if (device.edgeUrl) {
        this.edgeUrlForm.patchValue({ edgeUrl: device.edgeUrl });
      }
    });

    this.devicesService.getFaceRecognitionStatus(this.deviceId).subscribe({
      next: (status) => this.faceRecognitionEnabled.set(status.face_recognition_enabled),
      error: () => this.faceRecognitionEnabled.set(null)
    });
  }

  saveEdgeUrl(): void {
    if (this.edgeUrlForm.invalid) {
      this.edgeUrlForm.markAllAsTouched();
      return;
    }

    this.savedMessage.set(null);
    this.edgeUrlErrorKey.set(null);
    this.savingEdgeUrl.set(true);

    this.devicesService.updateEdgeUrl(this.deviceId, this.edgeUrlForm.getRawValue().edgeUrl).subscribe({
      next: (device) => {
        this.savingEdgeUrl.set(false);
        this.device.set(device);
        this.savedMessage.set('faceRecognition.edgeUrlSaved');
      },
      error: () => {
        this.savingEdgeUrl.set(false);
        this.edgeUrlErrorKey.set('faceRecognition.edgeUrlSaveError');
      }
    });
  }

  toggleFaceRecognition(change: MatSlideToggleChange): void {
    this.toggleErrorKey.set(null);

    this.devicesService.setFaceRecognitionEnabled(this.deviceId, change.checked).subscribe({
      next: (status) => {
        this.faceRecognitionEnabled.set(status.face_recognition_enabled);
        change.source.checked = status.face_recognition_enabled;
      },
      error: () => {
        // The control flips on click; restore the last confirmed value.
        change.source.checked = this.faceRecognitionEnabled() === true;
        this.toggleErrorKey.set('faceRecognition.toggleError');
      }
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles.set(input.files ? Array.from(input.files) : []);
  }

  submitEnrollment(): void {
    if (this.enrollForm.invalid) {
      this.enrollForm.markAllAsTouched();
      return;
    }
    if (this.selectedFiles().length === 0) {
      this.photosRequiredError.set(true);
      return;
    }

    this.photosRequiredError.set(false);
    this.enrollErrorKey.set(null);
    this.enrollResult.set(null);
    this.enrollSkippedReasons.set([]);
    this.submitting.set(true);

    this.devicesService
      .enrollFace(this.deviceId, this.enrollForm.getRawValue().name, this.selectedFiles())
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.enrollSkippedReasons.set([]);
          this.enrollResult.set(result);
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.enrollSkippedReasons.set(this.extractSkippedReasons(error));
          this.enrollErrorKey.set('faceRecognition.enrollError');
        }
      });
  }

  private extractSkippedReasons(error: HttpErrorResponse): string[] {
    const body: unknown = error?.error;
    if (body === null || typeof body !== 'object') {
      return [];
    }
    const reasons = (body as { skipped_images?: unknown }).skipped_images;
    if (!Array.isArray(reasons)) {
      return [];
    }
    return reasons.filter((reason): reason is string => typeof reason === 'string');
  }
}
