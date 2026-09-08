// Production-optimized build (AOT, minified, hashed assets), but pointed at
// a local Cloud API instead of the real VPS. Used only for previewing the
// production build locally, via `ng build --configuration local-prod`.
// Never deployed anywhere, not what `environment.prod.ts` builds.
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:3000/api/v1'
};
