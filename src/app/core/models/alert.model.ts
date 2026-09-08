export interface Alert {
  id: string;
  zoneId: string;
  deviceId: string;
  readingId: string | null;
  ruleType: string;
  severity: string;
  status: string;
  message: string;
  createdAt: string;
}

export interface AlertFilters {
  zone_id?: string;
  device_id?: string;
  status?: string;
}
