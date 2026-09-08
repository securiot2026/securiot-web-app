import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        const hadSession = !!authService.getToken();
        authService.logout();
        router.navigate(['/login'], { queryParams: hadSession ? { sessionExpired: '1' } : {} });
      }
      return throwError(() => error);
    })
  );
};
