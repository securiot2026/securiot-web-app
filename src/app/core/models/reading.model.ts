export interface Reading {
  id: string;
  readingId: string;
  deviceId: string;
  zoneId: string;
  sensorType: string;
  value: unknown;
  recordedAt: string;
  createdAt: string;
}
