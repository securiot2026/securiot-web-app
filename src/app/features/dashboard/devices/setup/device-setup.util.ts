import { DeviceSetupPayload } from '../../../../core/models/device.model';

// Fixed SoftAP gateway set by MycilaESPConnect (not 192.168.4.1). Mirrored by
// kApGatewayUrl in the firmware. Single constant: change it here only.
export const PROVISIONING_PORTAL_URL = 'http://4.3.2.1/provision-extra';

// How long the QR and link stay on screen before they hide themselves.
export const QR_VISIBLE_MS = 120000;

export function buildPortalUrl(payload: DeviceSetupPayload, base: string = PROVISIONING_PORTAL_URL): string {
  const query = new URLSearchParams();
  query.set('edgeApiUrl', payload.edgeApiUrl);
  query.set('deviceKey', payload.deviceKey);
  query.set('deviceId', payload.deviceId);
  query.set('zoneId', payload.zoneId);
  return `${base}?${query.toString()}`;
}
