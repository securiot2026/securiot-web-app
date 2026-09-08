# Design

## Direction contract

**THESIS**: An Operate-mode security dashboard where status is legible before it is beautiful — Material Design's own component vocabulary carries the app so a security administrator never has to learn a bespoke affordance to check a zone, a device, or an alert.

**OWN-WORLD**: Angular Material 3 (M3), theme-type light, primary `mat.$azure-palette`, tertiary `mat.$blue-palette`, density scale 0. Roboto throughout (one family, per Operate guidance). Restrained color strategy: neutral surfaces, primary blue reserved for the toolbar, primary actions and active nav state; semantic status chips (green/amber/red family generated from Material's own error/tertiary roles) pair color with an icon and a text label everywhere status is shown (online/offline, alert severity, alert status) — color is never the only signal.

**STORY**: The administrator lands on Zones (the top-level "where"), can jump to that zone's Devices, and separately reviews Alerts filtered by zone/device/status. Every list explains itself before any data loads (skeleton/spinner), explains itself when data fails (retry action), and explains itself when there's nothing to show (empty state copy naming what will appear there).

**FIRST VIEWPORT**: Persistent top toolbar (brand + language switcher + logout) above a fixed side nav (Zones / Devices / Alerts) and a content area capped at 1200px so dense tables stay readable. Login is a single centered card on a neutral ground, no sidebar, with the language switcher available before authentication.

**FORM**: Standard Material list-and-detail dashboard shell, chosen directly (code-led, no concept-seed roll) because Angular Material is a rubric-mandated, already-decided design system for this Operate surface — running the full new-world concept tournament against a fixed component library would have manufactured a choice that was not actually open. This is a disclosed deviation from `new-work.md`'s direction-roll step.

**FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. No raster assets ship in this surface (icons are Material Icons font glyphs, not produced images), so the asset-provenance clause has nothing to discharge.

## Tokens

- Color: Material M3 theme generated from `mat.$azure-palette` (primary) / `mat.$blue-palette` (tertiary), light theme-type, density 0. No hand-picked hex values outside the theme except the status-chip background tints in `src/styles.scss` (`.status-chip--*`), tuned to sit on Material's own success/warning/error roles at 4.5:1+ text contrast.
- Type: Roboto, Material's default type scale (no custom typography config — the commented-out `mat.typography-hierarchy` include was left off deliberately in favor of Material's per-component defaults).
- Spacing: Material component defaults; page content padding `clamp(1rem, 3vw, 2.5rem)`.
- Components: Angular Material only — `mat-table`, `mat-form-field`/`mat-select` for filters, `mat-sidenav`/`mat-toolbar`/`mat-nav-list` for the shell, `mat-card` for login. No custom-built form controls, dropdowns, or modals.

## Patterns

- **Status chip**: icon + label + tinted background, used for device online/offline and alert severity/status. Never color alone (A11Y.md Perceivable rule).
- **List page skeleton**: every list (`zones`, `devices`, `alerts`) follows loading → error-with-retry → empty → data, with an `aria-live="polite"` visually-hidden result-count announcement and a native `<table>` with `scope="col"` headers.
- **Skip link**: visible-on-focus skip-to-content link in the dashboard shell, ahead of the toolbar in DOM order.
- **Page titles**: `PageTitleService` sets a translated, unique `<title>` per route and re-applies it on language change.
