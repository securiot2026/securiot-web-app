import { Reading } from './reading.model';

export interface Device {
  id: string;
  name: string;
  zoneId: string;
  createdAt: string;
  edgeUrl: string | null;
}

export interface DeviceStatus extends Device {
  isOnline: boolean;
  lastReading: Reading | null;
}

// Snake_case matches Cloud's proxy response verbatim (mirrored from the
// edge-api's JSON body) — no mapping layer, this phase does not need one.
export interface FaceRecognitionStatus {
  device_id: string;
  face_recognition_enabled: boolean;
}

// Snake_case matches Cloud's proxy response verbatim (mirrored from the
// edge-api's JSON body) — no mapping layer, this phase does not need one.
export interface FaceEnrollmentResult {
  identity_path: string;
  name: string;
  accepted_images: number;
  skipped_images: string[];
}

export interface DeviceCreated extends Device {
  apiKey: string;
}

export interface CreateDeviceRequest {
  name: string;
  zoneId: string;
}
