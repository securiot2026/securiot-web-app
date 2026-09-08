import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Device, DeviceStatus } from '../models/device.model';

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
}
