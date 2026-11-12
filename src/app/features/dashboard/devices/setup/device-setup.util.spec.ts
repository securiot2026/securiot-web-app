import { PROVISIONING_PORTAL_URL, QR_VISIBLE_MS, buildPortalUrl } from './device-setup.util';

describe('buildPortalUrl', () => {
  const payload = {
    edgeApiUrl: 'http://192.168.1.50:5000',
    deviceKey: 'k&y=1 /?#',
    deviceId: '3f2b8c1e-5d4a-4e7b-9c1d-0a1b2c3d4e5f',
    zoneId: 'zone-01'
  };

  it('round-trips all four values, including hostile characters, in a fixed key order', () => {
    const link = buildPortalUrl(payload);

    expect(link.startsWith('http://4.3.2.1/provision-extra?')).toBeTrue();

    const parsed = new URL(link);
    expect(parsed.searchParams.get('edgeApiUrl')).toBe(payload.edgeApiUrl);
    expect(parsed.searchParams.get('deviceKey')).toBe(payload.deviceKey);
    expect(parsed.searchParams.get('deviceId')).toBe(payload.deviceId);
    expect(parsed.searchParams.get('zoneId')).toBe(payload.zoneId);
    expect(Array.from(parsed.searchParams.keys())).toEqual(['edgeApiUrl', 'deviceKey', 'deviceId', 'zoneId']);
  });

  it('uses a custom base when given and exposes the default constants', () => {
    expect(buildPortalUrl(payload, 'http://10.0.0.1/p').startsWith('http://10.0.0.1/p?')).toBeTrue();
    expect(PROVISIONING_PORTAL_URL).toBe('http://4.3.2.1/provision-extra');
    expect(QR_VISIBLE_MS).toBe(120000);
  });
});
