import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DeviceFaceRecognitionComponent } from './device-face-recognition.component';

const GENERIC_ERROR_KEY = 'faceRecognition.enrollError';
const SKIPPED_HEADING_KEY = 'faceRecognition.skippedPhotos';

describe('DeviceFaceRecognitionComponent enrollment failures', () => {
  let fixture: ComponentFixture<DeviceFaceRecognitionComponent>;
  let component: DeviceFaceRecognitionComponent;
  let httpMock: HttpTestingController;

  function enrollRequest(): TestRequest {
    return httpMock.expectOne((req) => req.method === 'POST' && req.url.endsWith('/devices/dev-1/faces'));
  }

  function enrollmentAlertRegion(): HTMLElement | null {
    const regions = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="alert"][aria-live="assertive"]')
    );
    return regions.find((region) => (region.textContent ?? '').includes(GENERIC_ERROR_KEY)) ?? null;
  }

  function submitWithFailure(status: number, statusText: string, body: string | object): void {
    component.submitEnrollment();
    enrollRequest().flush(body, { status, statusText });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceFaceRecognitionComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'dev-1' } } } }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeviceFaceRecognitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1'))
      .flush({ id: 'dev-1', edgeUrl: 'http://edge.local:5000' });
    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1/face-recognition'))
      .flush({ face_recognition_enabled: false });
    fixture.detectChanges();

    component.enrollForm.patchValue({ name: 'Ada Lovelace' });
    component.selectedFiles.set([new File(['x'], 'a.jpg', { type: 'image/jpeg' })]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists each per-photo reason under the assertive region when the error body carries them', () => {
    submitWithFailure(400, 'Bad Request', {
      error: 'Only 1 valid enrollment images were found; at least 3 are required.',
      skipped_images: ['a.jpg: Image is too blurry; hold still', 'b.jpg: No face detected']
    });

    const region = enrollmentAlertRegion();
    expect(region).not.toBeNull();
    expect(region!.textContent).toContain(GENERIC_ERROR_KEY);
    expect(region!.textContent).toContain(SKIPPED_HEADING_KEY);
    const items = Array.from(region!.querySelectorAll('li')).map((li) => li.textContent?.trim());
    expect(items).toEqual(['a.jpg: Image is too blurry; hold still', 'b.jpg: No face detected']);
  });

  it('shows only the generic message for a 502 with no skipped_images', () => {
    submitWithFailure(502, 'Bad Gateway', { error: 'Could not reach the device Edge API' });

    const region = enrollmentAlertRegion();
    expect(region).not.toBeNull();
    expect(region!.querySelectorAll('li').length).toBe(0);
    expect(region!.textContent).not.toContain(SKIPPED_HEADING_KEY);
  });

  it('shows only the generic message for a 400 body lacking skipped_images', () => {
    submitWithFailure(400, 'Bad Request', { error: 'invalid image data' });

    const region = enrollmentAlertRegion();
    expect(region).not.toBeNull();
    expect(region!.querySelectorAll('li').length).toBe(0);
  });

  it('shows only the generic message for non-JSON bodies and malformed skipped_images', () => {
    submitWithFailure(400, 'Bad Request', 'plain text body');
    expect(enrollmentAlertRegion()!.querySelectorAll('li').length).toBe(0);

    submitWithFailure(400, 'Bad Request', { error: 'x', skipped_images: 'not-an-array' });
    expect(enrollmentAlertRegion()!.querySelectorAll('li').length).toBe(0);

    submitWithFailure(400, 'Bad Request', { error: 'x', skipped_images: [1, null, { a: 1 }] });
    expect(enrollmentAlertRegion()!.querySelectorAll('li').length).toBe(0);
  });

  it('renders reason text as text, never as markup', () => {
    const hostile = '<img src=x onerror=alert(1)>.jpg: No face detected';
    submitWithFailure(400, 'Bad Request', { error: 'x', skipped_images: [hostile] });

    const region = enrollmentAlertRegion();
    expect(region).not.toBeNull();
    expect(region!.querySelector('img')).toBeNull();
    expect(region!.textContent).toContain(hostile);
  });

  it('clears previous reasons on a new submit and leaves no stale reasons after a success', () => {
    submitWithFailure(400, 'Bad Request', {
      error: 'x',
      skipped_images: ['a.jpg: Image is too blurry; hold still']
    });
    expect(enrollmentAlertRegion()!.querySelectorAll('li').length).toBe(1);

    component.submitEnrollment();
    fixture.detectChanges();
    expect(enrollmentAlertRegion()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[role="alert"] li').length).toBe(0);

    enrollRequest().flush(
      { identity_path: 'p', name: 'Ada Lovelace', accepted_images: 3, skipped_images: [] },
      { status: 201, statusText: 'Created' }
    );
    fixture.detectChanges();

    expect(enrollmentAlertRegion()).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('[role="alert"] li').length).toBe(0);
  });
});
