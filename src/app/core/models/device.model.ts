import { Reading } from './reading.model';

export interface Device {
  id: string;
  name: string;
  zoneId: string;
  createdAt: string;
}

export interface DeviceStatus extends Device {
  isOnline: boolean;
  lastReading: Reading | null;
}

export interface DeviceCreated extends Device {
  apiKey: string;
}

export interface CreateDeviceRequest {
  name: string;
  zoneId: string;
}
