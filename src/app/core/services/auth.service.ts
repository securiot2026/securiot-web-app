import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ForgotPasswordRequest, LoginRequest, LoginResponse, MessageResponse, ResetPasswordRequest } from '../models/auth.model';

const TOKEN_KEY = 'securiot.access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  readonly isAuthenticated = signal<boolean>(!!this.tokenSignal());

  constructor(private readonly http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem(TOKEN_KEY, response.access_token);
          this.tokenSignal.set(response.access_token);
          this.isAuthenticated.set(true);
        })
      );
  }

  forgotPassword(email: string): Observable<MessageResponse> {
    const body: ForgotPasswordRequest = { email };
    return this.http.post<MessageResponse>(`${environment.apiBaseUrl}/auth/forgot-password`, body);
  }

  resetPassword(token: string, newPassword: string): Observable<MessageResponse> {
    const body: ResetPasswordRequest = { token, newPassword };
    return this.http.post<MessageResponse>(`${environment.apiBaseUrl}/auth/reset-password`, body);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.tokenSignal.set(null);
    this.isAuthenticated.set(false);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  private readStoredToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
}
