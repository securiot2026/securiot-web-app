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

// camelCase exactly as Cloud returns it from GET /devices/:id/setup-payload,
// unlike the Edge snake_case proxies above. deviceKey is a secret: keep it
// in memory only, never log it or persist it.
export interface DeviceSetupPayload {
  edgeApiUrl: string;
  deviceKey: string;
  deviceId: string;
  zoneId: string;
}

export interface DeviceCreated extends Device {
  apiKey: string;
}

export interface CreateDeviceRequest {
  name: string;
  zoneId: string;
}

export type RuleConditionType = 'object_class' | 'weapon' | 'fire' | 'occupancy' | 'sensor_threshold';
export type RuleOperator = '>' | '<' | '==';
export type RuleActionType = 'door_lock' | 'light' | 'buzzer' | 'alert';
export type RuleAction = { type: RuleActionType | string; [key: string]: unknown };

// Snake_case matches Cloud's proxy response verbatim (mirrored from the
// edge-api's JSON body) — no mapping layer, this phase does not need one.
export interface Rule {
  id: number;
  device_id: string | null;
  name: string;
  condition_type: RuleConditionType;
  operator: RuleOperator | null;
  sensor_type: string | null;
  match_value: string | null;
  actions: RuleAction[];
  enabled: boolean;
  priority: number;
  cooldown_seconds: number;
  last_triggered_at: string | null;
}

export interface RuleFormValue {
  name: string;
  condition_type: RuleConditionType;
  operator?: RuleOperator | null;
  sensor_type?: string | null;
  match_value?: string | null;
  actions: RuleAction[];
  enabled?: boolean;
  priority?: number;
  cooldown_seconds?: number;
}

export interface RuleDryRunResult {
  rule: Rule;
  result: {
    door_action: string | null;
    rule_command: { actuator: string; action: Record<string, unknown>; rule: string } | null;
  };
  dry_run?: boolean;
  device_id?: string;
  zone_id?: string;
  executed?: boolean;
  queued?: string[];
}

export interface LatestFrame {
  device_id: string;
  captured_at: string;
  frame: string;
}

// Snake_case matches Cloud's proxy response verbatim (mirrored from the
// edge-api's JSON body) — no mapping layer, this phase does not need one.
export interface Occupancy {
  device_id: string;
  count: number;
  date: string;
}
