import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Device,
  DeviceSetupPayload,
  DeviceStatus,
  FaceEnrollmentResult,
  FaceRecognitionStatus,
  LatestFrame,
  Occupancy,
  Rule,
  RuleDryRunResult,
  RuleFormValue
} from '../models/device.model';

@Injectable({ providedIn: 'root' })
export class DevicesService {
  private readonly baseUrl = `${environment.apiBaseUrl}/devices`;

  constructor(private readonly http: HttpClient) {}

  list(zoneId?: string): Observable<Device[]> {
    let params = new HttpParams();
    if (zoneId) {
      params = params.set('zone_id', zoneId);
    }
    return this.http.get<Device[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<DeviceStatus> {
    return this.http.get<DeviceStatus>(`${this.baseUrl}/${id}`);
  }

  updateEdgeUrl(id: string, edgeUrl: string): Observable<DeviceStatus> {
    return this.http.patch<DeviceStatus>(`${this.baseUrl}/${id}`, { edgeUrl });
  }

  enrollFace(id: string, name: string, images: File[]): Observable<FaceEnrollmentResult> {
    const formData = new FormData();
    formData.append('name', name);
    for (const image of images) {
      formData.append('images', image, image.name);
    }
    return this.http.post<FaceEnrollmentResult>(`${this.baseUrl}/${id}/faces`, formData);
  }

  getFaceRecognitionStatus(id: string): Observable<FaceRecognitionStatus> {
    return this.http.get<FaceRecognitionStatus>(`${this.baseUrl}/${id}/face-recognition`);
  }

  setFaceRecognitionEnabled(id: string, enabled: boolean): Observable<FaceRecognitionStatus> {
    return this.http.patch<FaceRecognitionStatus>(`${this.baseUrl}/${id}/face-recognition`, { enabled });
  }

  listRules(id: string): Observable<Rule[]> {
    return this.http.get<Rule[]>(`${this.baseUrl}/${id}/rules`);
  }

  createRule(id: string, rule: RuleFormValue): Observable<Rule> {
    return this.http.post<Rule>(`${this.baseUrl}/${id}/rules`, rule);
  }

  updateRule(id: string, ruleId: number, rule: Partial<RuleFormValue>): Observable<Rule> {
    return this.http.patch<Rule>(`${this.baseUrl}/${id}/rules/${ruleId}`, rule);
  }

  deleteRule(id: string, ruleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/rules/${ruleId}`);
  }

  dryRunRule(id: string, ruleId: number, execute = false): Observable<RuleDryRunResult> {
    return this.http.post<RuleDryRunResult>(`${this.baseUrl}/${id}/rules/${ruleId}/dry-run`, { execute });
  }

  getLatestFrame(id: string): Observable<LatestFrame> {
    return this.http.get<LatestFrame>(`${this.baseUrl}/${id}/frame`);
  }

  getOccupancy(id: string): Observable<Occupancy> {
    return this.http.get<Occupancy>(`${this.baseUrl}/${id}/occupancy`);
  }

  getSetupPayload(id: string): Observable<DeviceSetupPayload> {
    return this.http.get<DeviceSetupPayload>(`${this.baseUrl}/${id}/setup-payload`);
  }
}
