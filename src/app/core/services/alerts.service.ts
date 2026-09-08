import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alert, AlertFilters } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly baseUrl = `${environment.apiBaseUrl}/alerts`;

  constructor(private readonly http: HttpClient) {}

  list(filters: AlertFilters): Observable<Alert[]> {
    let params = new HttpParams();
    if (filters.zone_id) {
      params = params.set('zone_id', filters.zone_id);
    }
    if (filters.device_id) {
      params = params.set('device_id', filters.device_id);
    }
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    return this.http.get<Alert[]>(this.baseUrl, { params });
  }
}
