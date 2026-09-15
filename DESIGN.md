# Design

## Direction contract

**Superseded.** This replaces the near-white/navy/teal Material 3 direction below with the dark direction locked by Centinela Labs' `SecurIOT Visual Direction.pdf`. Page 4 of that PDF ("En pantalla — móvil") explicitly frames the Operate surfaces (this dashboard and the mobile app) as "pantallas flotando en marcos de dispositivo, mismo material de fondo, componentes de estado planos y sin grano" — dark ground, flat un-grained state components, same seven brand tokens as Landing. This file records the target; the app itself still ships the prior light theme (see "Known open item").

**THESIS**: An Operate-mode security dashboard where status is legible before it is beautiful — Material Design's own component vocabulary still carries the app (Angular Material stays, per rubric mandate), but retheme onto the SecurIoT brand's dark ground and functional-state palette instead of a generic light Material scheme.

**OWN-WORLD**: Angular Material 3 (M3), **theme-type dark**, density scale 0, type per brand (Sora / Schibsted Grotesk / Martian Mono — see Type below, replacing the previous single-family Roboto). Colors pinned to the seven-token brand system in `SecurIOT Visual Direction.pdf` (see Color below), not the old 60/30/10 UI-SPEC contract. Brand teal (`--marca #1FD3C4`) is reserved for logo, primary CTA, and the sidenav/toolbar accent — never repurposed as a status color, per the brief's explicit ban ("Profundidad usada como color de estado" is a listed anti-pattern).

**STORY**: Unchanged from the prior contract — administrator lands on Zones, drills into Devices, reviews Alerts filtered by zone/device/status. Every list still explains itself before data loads, on failure, and when empty.

**FIRST VIEWPORT**: Persistent top toolbar (brand + language switcher + logout) over a fixed side nav (Zones / Devices / Alerts), content capped at 1200px, now on `--noche` ground instead of `#F5F7FA`. Login is a single centered card, brand mark lockup above the form, same neutral-ground treatment as the rest of the shell (no bloom behind a form the user needs to read precisely — blooms are for marketing/hero moments, not task surfaces).

**FORM**: Same Material list-and-detail shell as before, retheme only. Angular Material's own dark M3 theming (`color-scheme: dark`, `matTheme` dark palette generation) does the mechanical work; brand tokens override the generated tonal palette for exact hex values, same pattern as the previous CSS-custom-property override approach.

**FINISH**: Unreviewed and undocumented is unfinished — unchanged principle. This retheme still owes a finish review once applied to code.

## Color

Seven tokens total (brand system, shared verbatim with Landing and Mobile — see those DESIGN.md files):

| Token | Value | Usage here |
|---|---|---|
| `--marca` | `#1FD3C4` | Primary buttons, active nav indicator, focus ring, links, brand mark — never a status |
| `--senal` | `#6C7CE8` | Status: validating (in-progress checks, pending device handshake) |
| `--verificado` | `#22DD66` | Status: authorized / device online |
| `--alerta` | `#FF5C6C` | Status: intrusion / alert of any severity |
| `--noche` | `#0B0E14` | Scaffold background (toolbar, sidenav, content ground) |
| `--texto` | `#EEF0F4` | Primary text — never `#FFFFFF` inside the product |
| `--texto-mute` | `#8B93A3` | Secondary text, captions, disabled states |

**Extending the brief for states it doesn't name** (disclosed, not silently invented): the brand system defines exactly three functional states — validando/autorizado/intrusión — but this dashboard also needs *offline* (a device simply not reporting, not itself an alert) and *alert severity tiers* (low/medium/high). Rather than inventing new hues, which the brief explicitly forbids ("son solo tres y nunca decoran nada más"):
- **Offline** uses `--texto-mute` + a distinct icon (`remove_circle_outline`), staying neutral rather than colored — offline is an absence of signal, not a state the brand palette models.
- **Alert severity** stays on the single `--alerta` red for color; severity is differentiated by icon (`info_outline` low / `error_outline` medium / `warning_amber_rounded` high) and by an explicit text label ("Alerta baja/media/alta"), never by a second red shade. This is a deliberate constraint, not a gap — it keeps the system at seven tokens.

Status chips: icon + label + tinted background always together, never color alone (A11Y.md Perceivable rule, unchanged).

## Type

Per brand, replacing Roboto:

| Role | Font | Size / Weight |
|---|---|---|
| Display / page headings | Sora | 700, 20–28px (Operate scale, smaller than marketing's 40–52px H1) |
| Body | Schibsted Grotesk | 400, 16px |
| Data / telemetry (timestamps, zone codes, device IDs, log rows) | Martian Mono | 400, 15px |

Angular Material's `mat.define-typography-config` remapped to these three families in place of Roboto; `mat-table` cell content that is data (not a label) uses the mono face — this is the dashboard's biggest legibility win from the brand system, since Operate-mode data currently has no typographic distinction from prose.

## Tokens

Implementation: replace `src/styles.scss`'s CSS custom properties (`--brand-*`, `--status-*`) with the seven brand tokens above, and flip Angular Material's theme mixin from light to dark palette generation. Spacing stays on the existing 8pt scale (4/8/16/24/32/48/64) — the brief doesn't specify spacing, so the prior system's spacing decision carries forward unchanged.

## Patterns

Unchanged from the prior contract except color/type sourcing:
- **Status chip**: icon + label + tinted background (online/offline, alert severity) — see Color above for the extended vocabulary.
- **List page skeleton**: loading → error-with-retry → empty → data, `aria-live="polite"` result-count announcement, native `<table>` with `scope="col"` headers.
- **Skip link**: visible-on-focus, ahead of toolbar in DOM order.
- **Page titles**: `PageTitleService`, translated and unique per route.
- **Live indicator**: the brief's one permitted loop animation — a pulsing dot next to "en vivo" zone status, gated behind `prefers-reduced-motion: no-preference`.

## Known open item

This file records the target dark/brand retheme; the app still ships the light navy/teal M3 theme from the original UI-SPEC. Applying this is a retheme (Material palette + typography swap), not a structural redesign, and is separate follow-up work — not done in this pass. Once applied, re-verify contrast computationally (not eyeballed) for `--texto`/`--texto-mute` against `--noche` and against each status tint, the same discipline the prior light-theme build used.
