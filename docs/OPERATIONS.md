# Operations: deploy, CI/CD, device setup

## Environments

The app is built into an nginx image by Dokploy from the `develop` branch and
served at the production hostname. A hard reload (Cmd+Shift+R) is needed after a
deploy because the bundle name changes.

## GitFlow

`main` is released code, `develop` is the integration branch and deploys on
push. Branch from `develop` with `feat/`, `fix/`, `docs/` or `chore/`, open a
pull request, wait for `build-and-test`, merge, then release with a pull request
from `develop` into `main`.

## CI and CD

- `.github/workflows/ci.yml`: install, production build, and
  `ng test --watch=false --browsers=ChromeHeadless`.
- `.github/workflows/cd.yml`: on push to `develop`, posts to the Dokploy webhook
  in the secret `DOKPLOY_DEPLOY_HOOK` with the header `X-GitHub-Event: push`
  (Dokploy ignores the call without it).

## Pairing a board with the Setup QR

1. Sign in, open Devices, choose the device, open Setup.
2. Check the Edge URL. The Cloud API calls it for the live feed, so it must be a
   public address (tunnel hostname), see the Cloud API `docs/OPERATIONS.md`.
3. Join the `SecurIoT-Setup-XXXX` WiFi on the board, scan the QR, and type the
   WiFi password yourself on the board portal. The QR carries the Edge URL,
   device key, device id and zone id, never the WiFi password.

## Live feed

`/devices/:id/live-feed` polls the Cloud API, which asks the Edge for the latest
frame. A 403 with an empty body means Cloudflare is challenging the VPS, a 502
means the admin keys differ, and "offline" means the Edge heartbeat is failing.
See the Edge repo `docs/LOCAL_DEPLOYMENT.md`.
