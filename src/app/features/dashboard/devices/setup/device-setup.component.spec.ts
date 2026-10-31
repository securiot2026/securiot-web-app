import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { QrCodeService } from '../../../../core/services/qr-code.service';
import { DeviceSetupComponent } from './device-setup.component';
import { buildPortalUrl } from './device-setup.util';

const FAKE_DATA_URL = 'data:image/png;base64,AAAA';
const PAYLOAD = {
  edgeApiUrl: 'http://192.168.1.50:5000',
  deviceKey: 's3cret-key',
  deviceId: 'dev-1',
  zoneId: 'zone-01'
};

describe('DeviceSetupComponent', () => {
  let fixture: ComponentFixture<DeviceSetupComponent>;
  let httpMock: HttpTestingController;
  let toDataUrl: jasmine.Spy;
  let clipboardCopy: jasmine.Spy;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function buttonByKey(key: string): HTMLButtonElement | undefined {
    return Array.from(root().querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      (b.textContent ?? '').includes(key)
    );
  }

  function showButton(): HTMLButtonElement {
    return buttonByKey('setup.showButton')!;
  }

  function linkInput(): HTMLInputElement | null {
    return root().querySelector<HTMLInputElement>('input[readonly]');
  }

  function qrImage(): HTMLImageElement | null {
    return root().querySelector<HTMLImageElement>('figure img');
  }

  function politeRegion(): HTMLElement {
    return root().querySelector<HTMLElement>('[aria-live="polite"]')!;
  }

  function alertRegion(): HTMLElement {
    return root().querySelector<HTMLElement>('[role="alert"]')!;
  }

  function payloadRequest(): TestRequest {
    return httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1/setup-payload'));
  }

  async function createComponent(device: object = { id: 'dev-1', name: 'Cam 1', edgeUrl: 'http://edge.local:5000' }) {
    fixture = TestBed.createComponent(DeviceSetupComponent);
    fixture.detectChanges();
    httpMock.expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1')).flush(device);
    fixture.detectChanges();
  }

  async function reveal(): Promise<void> {
    showButton().click();
    payloadRequest().flush(PAYLOAD);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    toDataUrl = jasmine.createSpy('toDataUrl').and.resolveTo(FAKE_DATA_URL);
    clipboardCopy = jasmine.createSpy('copy').and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [DeviceSetupComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'dev-1' } } } },
        { provide: QrCodeService, useValue: { toDataUrl } },
        { provide: Clipboard, useValue: { copy: clipboardCopy } }
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests the payload once, draws the QR for the exact link and shows it as text (tracer)', async () => {
    await createComponent();

    expect(qrImage()).toBeNull();
    showButton().click();
    payloadRequest().flush(PAYLOAD);
    await fixture.whenStable();
    fixture.detectChanges();

    const expectedUrl = buildPortalUrl(PAYLOAD);
    expect(toDataUrl).toHaveBeenCalledOnceWith(expectedUrl);

    const img = qrImage()!;
    expect(img.getAttribute('src')).toBe(FAKE_DATA_URL);
    expect((img.getAttribute('alt') ?? '').length).toBeGreaterThan(0);
    expect(img.getAttribute('alt')).not.toContain('s3cret-key');

    expect(linkInput()!.value).toBe(expectedUrl);
    expect(linkInput()!.id).toBeTruthy();
    expect(root().querySelector(`label[for="${linkInput()!.id}"]`)).not.toBeNull();
    expect(root().querySelector('a[href^="http://4.3.2.1"]')).toBeNull();
  });

  it('renders the warning before any click and binds it to the show button', async () => {
    await createComponent();

    const warning = root().querySelector<HTMLElement>('#setup-warning')!;
    expect(warning).not.toBeNull();
    expect(warning.textContent).toContain('setup.warningTitle');
    expect(warning.textContent).toContain('setup.warningBody');
    expect(warning.querySelector('mat-icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(showButton().getAttribute('aria-describedby')).toBe('setup-warning');
    expect(qrImage()).toBeNull();
    expect(linkInput()).toBeNull();
  });

  it('copies the full link through the CDK clipboard and announces the result politely', async () => {
    await createComponent();
    expect(politeRegion()).not.toBeNull();
    expect(politeRegion().getAttribute('role')).toBe('status');

    await reveal();
    buttonByKey('setup.copyButton')!.click();
    fixture.detectChanges();

    expect(clipboardCopy).toHaveBeenCalledOnceWith(buildPortalUrl(PAYLOAD));
    expect(politeRegion().textContent).toContain('setup.copied');

    clipboardCopy.and.returnValue(false);
    buttonByKey('setup.copyButton')!.click();
    fixture.detectChanges();

    expect(politeRegion().textContent).toContain('setup.copyFailed');
    expect(politeRegion().textContent).not.toContain('setup.copied');
  });

  it('hides everything after exactly 2 minutes and returns focus to the show button', fakeAsync(() => {
    createComponent();
    flushMicrotasks();
    showButton().click();
    payloadRequest().flush(PAYLOAD);
    flushMicrotasks();
    fixture.detectChanges();

    buttonByKey('setup.copyButton')!.focus();
    expect(document.activeElement).toBe(buttonByKey('setup.copyButton')!);

    tick(119999);
    fixture.detectChanges();
    expect(qrImage()).not.toBeNull();
    expect(linkInput()).not.toBeNull();

    tick(1);
    fixture.detectChanges();
    expect(qrImage()).toBeNull();
    expect(linkInput()).toBeNull();
    expect(politeRegion().textContent).toContain('setup.expiredMessage');
    expect(fixture.componentInstance.portalUrl()).toBeNull();
    expect(fixture.componentInstance.qrDataUrl()).toBeNull();
    expect(document.activeElement).toBe(showButton());
  }));

  it('hides on demand, cancels the timer and restarts the countdown on a new reveal', fakeAsync(() => {
    createComponent();
    flushMicrotasks();
    showButton().click();
    payloadRequest().flush(PAYLOAD);
    flushMicrotasks();
    fixture.detectChanges();

    buttonByKey('setup.hideButton')!.click();
    fixture.detectChanges();
    expect(qrImage()).toBeNull();
    expect(linkInput()).toBeNull();
    expect(politeRegion().textContent).toContain('setup.hiddenMessage');
    // fakeAsync fails the test at the end if the timer were still pending.

    showButton().click();
    payloadRequest().flush(PAYLOAD);
    flushMicrotasks();
    fixture.detectChanges();
    tick(100000);

    showButton().click();
    payloadRequest().flush(PAYLOAD);
    flushMicrotasks();
    fixture.detectChanges();

    tick(100000);
    fixture.detectChanges();
    expect(qrImage()).not.toBeNull();

    tick(20000);
    fixture.detectChanges();
    expect(qrImage()).toBeNull();
  }));

  it('leaves no pending timer and clears the signals when destroyed with the QR visible', fakeAsync(() => {
    createComponent();
    flushMicrotasks();
    showButton().click();
    payloadRequest().flush(PAYLOAD);
    flushMicrotasks();
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.portalUrl()).not.toBeNull();

    fixture.destroy();

    expect(component.portalUrl()).toBeNull();
    expect(component.qrDataUrl()).toBeNull();
  }));

  [
    { status: 400, key: 'setup.needsEdgeUrl' },
    { status: 404, key: 'setup.errorNotFound' },
    { status: 503, key: 'setup.errorNotConfigured' },
    { status: 500, key: 'setup.errorGeneric' }
  ].forEach(({ status, key }) => {
    it(`maps HTTP ${status} to ${key} in the alert region without leaking a QR`, async () => {
      await createComponent();

      showButton().click();
      payloadRequest().flush({ message: 'x' }, { status, statusText: 'err' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(alertRegion().textContent).toContain(key);
      expect(qrImage()).toBeNull();
      expect(linkInput()).toBeNull();
    });
  });

  it('keeps the copyable link visible when drawing the QR fails', async () => {
    toDataUrl.and.rejectWith(new Error('draw failed'));
    await createComponent();

    await reveal();

    expect(qrImage()).toBeNull();
    expect(linkInput()!.value).toBe(buildPortalUrl(PAYLOAD));
    expect(alertRegion().textContent).toContain('setup.errorQr');
  });

  it('shows the Edge URL hint and blocks the request when the device has no edgeUrl', async () => {
    await createComponent({ id: 'dev-1', name: 'Cam 1', edgeUrl: null });

    expect(root().textContent).toContain('setup.needsEdgeUrl');
    expect(root().querySelector('a[href="/devices/dev-1/face-recognition"]')).not.toBeNull();
    expect(showButton().disabled).toBeTrue();

    showButton().click();
    httpMock.expectNone((req) => req.url.endsWith('/setup-payload'));
  });

  it('shows the generic load error when the device cannot be loaded', async () => {
    fixture = TestBed.createComponent(DeviceSetupComponent);
    fixture.detectChanges();
    httpMock
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/devices/dev-1'))
      .flush({}, { status: 500, statusText: 'err' });
    fixture.detectChanges();

    expect(alertRegion().textContent).toContain('common.loadError');
  });
});
