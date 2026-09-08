# SecurIoT Web App

Security administrator dashboard for SecurIoT (Centinela Labs): login, zones, devices (online/offline + last reading) and alerts (filterable by zone/device/status). Angular 18 + Angular Material, i18n (en-US / es-419), and full keyboard/ARIA accessibility per [A11Y.md](https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md).

## Configuration

There is no `.env` file for this Angular app — API configuration lives in `src/environments/environment.ts` (dev) and `src/environments/environment.prod.ts` (prod build):

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1'
};
```

Point `apiBaseUrl` at wherever `securiot-cloud-api` is running (default `http://localhost:3000/api/v1`, matching that repo's own default `PORT`).

## Development server

```bash
npm install
npm start   # ng serve, http://localhost:4200
```

The Cloud API (`repos/securiot-cloud-api`) must be running and seeded (`npm run seed` there) for login/zones/devices/alerts to return real data.

## Build

```bash
npm run build
```

## Tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

## Architecture

- `src/app/core` — models, HTTP services (`AuthService`, `ZonesService`, `DevicesService`, `AlertsService`), the JWT auth interceptor + 401 interceptor, the `authGuard` route guard, `LanguageService` (i18n persistence) and `PageTitleService`.
- `src/app/features/auth/login` — login screen.
- `src/app/features/dashboard/shell` — authenticated app shell (toolbar, side nav, skip link).
- `src/app/features/dashboard/{zones,devices,alerts}` — the three list screens.
- `src/app/shared/language-switcher` — the en-US / es-419 switcher used on both the login screen and the dashboard shell.
- `public/assets/i18n/{en-US,es-419}.json` — translation catalogs (ngx-translate).

## Accessibility notes

- Full keyboard operability; no mouse-only affordance.
- `aria-live="polite"` result-count announcements on every filtered/loaded list.
- Status (online/offline, alert severity/status) is never color-only — every status chip pairs an icon, a label and a color.
- Skip-to-content link, visible on focus, ahead of the toolbar.
- Native `<table>` markup with `scope="col"` headers on every data table.
- Per-route, translated, unique `<title>` via `PageTitleService`.
- `prefers-reduced-motion` respected globally.
