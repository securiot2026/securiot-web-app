import { Injectable } from '@angular/core';

// Thin wrapper so the QR library is lazy-loaded (kept out of the initial
// bundle) and component specs can replace it. Generation is 100% local.
@Injectable({ providedIn: 'root' })
export class QrCodeService {
  async toDataUrl(text: string): Promise<string> {
    const lib = await import('qrcode');
    // qrcode ships CommonJS: depending on interop the function sits on the
    // namespace or on its default export.
    const toDataURL = lib.toDataURL ?? lib.default.toDataURL;
    return toDataURL(text, { errorCorrectionLevel: 'M', margin: 2, width: 280 });
  }
}
