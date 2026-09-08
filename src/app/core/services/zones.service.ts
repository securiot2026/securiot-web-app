import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateZoneRequest, Zone } from '../models/zone.model';

@Injectable({ providedIn: 'root' })
export class ZonesService {
  private readonly baseUrl = `${environment.apiBaseUrl}/zones`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<Zone[]> {
    return this.http.get<Zone[]>(this.baseUrl);
  }

  get(id: string): Observable<Zone> {
    return this.http.get<Zone>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateZoneRequest): Observable<Zone> {
    return this.http.post<Zone>(this.baseUrl, payload);
  }
}
