# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Angular + Angular Material (rubric-mandated for this university course; confirmed, not delegated).

## Users

- **Primary user — Security administrator**: manages security for a medium-sized industrial/logistics company in Lima Metropolitana (or oversees several sites). Logs in, checks the status of zones and devices, reviews and filters alerts, and decides whether to escalate a detected intrusion. Uses the Web dashboard from an office or while supervising remotely.
- **Operational user — On-site guard**: the one who physically responds to an alert in the field. Primarily a mobile-app user (out of scope for this Web surface), but alert content/severity language must stay legible to this audience too since guards may view the same alert data relayed to them.
- **Secondary — Company manager/owner**: cares about aggregate reporting and subscription value more than day-to-day operation; not a primary design target for this surface.

[ASSUMED — no live interview channel in this session, inferred from securiot-report/README.md §1.1.1 and §1.2.2 and the phase brief] No further user research beyond the Lean UX documents was available to confirm interface-level preferences; this PRODUCT.md is built from that report plus the phase task brief.

## Product Purpose

SecurIoT (by Centinela Labs) is an industrial/perimeter security IoT platform: embedded devices at critical access points feed edge computing and a centralized cloud, identifying threats in real time, validating access to restricted zones, and triggering response protocols (alarms, notifications, traceable logging). This Web App is the security administrator's main tool for that platform — authenticate, see the real-time state of zones/devices, and see/filter alerts. Success for this surface specifically means the administrator can, within seconds of logging in, tell which zone or device needs attention and drill into why.

## Positioning

Where high-end corporate security systems price out small/medium industrial firms, SecurIoT gives a mid-market industrial or logistics company in Lima Metropolitana centralized, multi-site visibility and automatic alerting for a fraction of the cost — its mechanism is low-cost IoT + edge + cloud, not a manned command center.

## Operating Context

- The administrator works against a real, already-built NestJS Cloud API (JWT-guarded), documented in `.planning/phases/01.../01-01-SUMMARY.md` and `.planning/phases/02.../02-01,02-02,02-03-SUMMARY.md`:
  - `POST /api/v1/auth/login` — `{ email, password }` → `{ access_token }` (JWT, ~1h expiry).
  - Zones: `GET/POST /api/v1/zones`, `GET/PATCH/DELETE /api/v1/zones/:id` — `{ id, name, location?, ownerId, createdAt, updatedAt }`. Cross-owner access returns 404 (IDOR-safe), never 403.
  - Devices: `GET /api/v1/devices?zone_id=`, `POST /api/v1/devices` (`{ name, zoneId }`, returns `apiKey` only once on creation), `GET /api/v1/devices/:id` — includes `isOnline` (boolean) and `lastReading` (`Reading | null`) computed live against a device-online window.
  - Alerts: `GET /api/v1/alerts?zone_id=&device_id=&status=` — `{ id, zoneId, deviceId, readingId, ruleType, severity, status, message, createdAt }`. Currently one hardcoded rule (`door_contact` reading reporting "open" → medium-severity active alert).
  - All list/detail endpoints are scoped to the authenticated owner (JWT `sub`); nothing cross-tenant is ever visible.
- This is a university course deliverable (UPC, Ingeniería de Software, curso IoT) built with GitFlow: work happens on `feature/dashboard-auth-i18n-a11y`, branched from `develop`, never merged by the agent. Commits use Conventional Commits with no AI-authorship trailer (course policy set by Juan, overrides default tooling behavior).
- i18n (en_US / es_419, persisted) and accessibility (full A11Y.md compliance) are graded, non-negotiable requirements for this surface, not optional polish.

## Capabilities and Constraints

- Confirmed functionality for this Web App phase: login (JWT persisted across reloads while valid, guard redirects unauthenticated users), zones list/detail, devices list with online/offline + last reading, alerts list filterable by zone/device/status, language switcher.
- No zone/device/alert *creation* UI is explicitly required by the phase brief, but the API supports zone/device creation — [ASSUMED] treat create/edit as in-scope only if time allows once the required read-surfaces (list/detail/filter) are solid; the graded rubric items are the three listed screens plus i18n/a11y, not full CRUD UI.
- No design system or prior visual work exists in this repo yet (fresh Angular project, one init commit).
- Rule engine is currently a single hardcoded condition (`door_contact`/open) — the UI must not assume a rich taxonomy of alert types exists yet; severity/status/ruleType are free-form strings from the API today.

## Brand Commitments

- Product name: **SecurIoT**. Company: **Centinela Labs**. [ASSUMED] No logo, color palette, or typography has been established anywhere in the codebase or report — this surface is free to establish the first visual identity Centinela Labs will carry forward (subject to Operate-mode restraint: scanability over expression).

## Evidence on Hand

- `securiot-report/README.md` (Lean UX docs, problem statement, personas, hypotheses) — real product/business content, safe to summarize in copy, never to invent numbers beyond what it states (e.g. do not fabricate specific customer counts or dollar pricing).
- No screenshots, mockups, or existing DESIGN.md exist for any SecurIoT surface as of this session.
- No customer testimonials, logos, or case studies exist — none should be fabricated for this internal admin dashboard (Operate mode has no persuasion job to justify inventing them).

## Product Principles

1. **Status at a glance, detail on demand.** An administrator scanning zones/devices/alerts must identify a problem within seconds; drill-down is a click away, never required for the first read.
2. **Never hide who owns what.** Every screen reflects the API's owner-scoping guarantee — no ambiguity about whether data shown belongs to the logged-in administrator's own sites.
3. **Honest about MVP scope.** The alerting rule is currently singular and simple; the UI should present alerts plainly (severity/status/rule as given) rather than implying a sophistication the rule engine doesn't have.
4. **Multi-site by default.** Even with one seeded zone/device today, every list and filter is built assuming a security administrator eventually manages several sites from one account.

## Accessibility & Inclusion

Must strictly follow the A11Y.md accessibility rules (https://github.com/fecarrico/A11Y.md/blob/main/docs/en/A11Y.md) per Juan's global standing instruction: full keyboard operability and correct ARIA roles/labels are graded specifically on the login, dashboard, and alerts views.
