import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', redirectTo: 'zones', pathMatch: 'full' },
      { path: 'zones', loadComponent: () => import('./features/dashboard/zones/zones-list.component').then((m) => m.ZonesListComponent) },
      { path: 'devices', loadComponent: () => import('./features/dashboard/devices/devices-list.component').then((m) => m.DevicesListComponent) },
      { path: 'alerts', loadComponent: () => import('./features/dashboard/alerts/alerts-list.component').then((m) => m.AlertsListComponent) }
    ]
  },
  { path: '**', redirectTo: 'zones' }
];
