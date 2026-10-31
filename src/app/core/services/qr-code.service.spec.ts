import { TestBed } from '@angular/core/testing';
import { QrCodeService } from './qr-code.service';

describe('QrCodeService (real qrcode library)', () => {
  it('resolves a PNG data URL in the browser', async () => {
    const service = TestBed.inject(QrCodeService);

    const dataUrl = await service.toDataUrl('http://4.3.2.1/provision-extra?edgeApiUrl=x');

    expect(dataUrl.startsWith('data:image/png;base64,')).toBeTrue();
  });
});
