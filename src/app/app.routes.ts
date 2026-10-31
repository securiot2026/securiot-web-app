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
      { path: 'devices/:id/face-recognition', loadComponent: () => import('./features/dashboard/devices/face-recognition/device-face-recognition.component').then((m) => m.DeviceFaceRecognitionComponent) },
      { path: 'devices/:id/rules', loadComponent: () => import('./features/dashboard/devices/rules/device-rules.component').then((m) => m.DeviceRulesComponent) },
      { path: 'devices/:id/live-feed', loadComponent: () => import('./features/dashboard/devices/live-feed/device-live-feed.component').then((m) => m.DeviceLiveFeedComponent) },
      { path: 'devices/:id/setup', loadComponent: () => import('./features/dashboard/devices/setup/device-setup.component').then((m) => m.DeviceSetupComponent) },
      { path: 'alerts', loadComponent: () => import('./features/dashboard/alerts/alerts-list.component').then((m) => m.AlertsListComponent) }
    ]
  },
  { path: '**', redirectTo: 'zones' }
];
