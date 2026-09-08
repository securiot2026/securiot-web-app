# Design

## Direction contract

**THESIS**: An Operate-mode security dashboard where status is legible before it is beautiful — Material Design's own component vocabulary carries the app so a security administrator never has to learn a bespoke affordance to check a zone, a device, or an alert.

**OWN-WORLD**: Angular Material 3 (M3), theme-type light, density scale 0, Roboto throughout (one family, per Operate guidance). Colors and type scale are pinned to the shared `UI-SPEC.md` contract (phase 03) so this dashboard and the Landing Page read as the same product: 60% `#F5F7FA` (dominant surface), 30% `#101B33` navy (toolbar/sidenav), 10% `#0E7C86` teal (primary CTAs, active nav, focus, links), `#B3261E` destructive/error. Type scale: body 16px/400, label 14px/400, heading 20px/600, display 28px/600. Spacing on an 8pt scale (4/8/16/24/32/48/64). Semantic status colors from the same contract: online `#1E7B34`, offline `#5F6368`, alert low `#1A56B3`, medium `#B36A00`, high/critical `#B3261E` — every status chip pairs that color with an icon and a text label, never color alone.

**STORY**: The administrator lands on Zones (the top-level "where"), can jump to that zone's Devices, and separately reviews Alerts filtered by zone/device/status. Every list explains itself before any data loads (skeleton/spinner), explains itself when data fails (retry action), and explains itself when there's nothing to show (empty state copy naming what will appear there).

**FIRST VIEWPORT**: Persistent top toolbar (brand + language switcher + logout) above a fixed side nav (Zones / Devices / Alerts) and a content area capped at 1200px so dense tables stay readable. Login is a single centered card on a neutral ground, no sidebar, with the language switcher available before authentication.

**FORM**: Standard Material list-and-detail dashboard shell, chosen directly (code-led, no concept-seed roll) because Angular Material is a rubric-mandated, already-decided design system for this Operate surface — running the full new-world concept tournament against a fixed component library would have manufactured a choice that was not actually open. This is a disclosed deviation from `new-work.md`'s direction-roll step.

**FINISH**: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. No raster assets ship in this surface (icons are Material Icons font glyphs, not produced images), so the asset-provenance clause has nothing to discharge.

## Tokens

Sourced from `.planning/phases/03-web-dashboard-landing-page/UI-SPEC.md`, shared with the Landing Page surface, applied as CSS custom properties in `src/styles.scss` (`--brand-*`, `--status-*`, `--space-*`, `--type-*`) that override Angular Material's M3 component tokens (`--mdc-filled-button-container-color`, `--mat-toolbar-container-background-color`, `--mat-sidenav-container-background-color`, `--mdc-outlined-text-field-focus-outline-color`, etc.) rather than fighting M3's tonal-palette generation for exact brand hex values:
- Color: `#F5F7FA` / `#101B33` / `#0E7C86` / `#B3261E`, plus the five semantic status colors — see Color section above.
- Type: Roboto, 4 sizes / 2 weights (16/400, 14/400, 20/600, 28/600).
- Spacing: 8pt scale (4/8/16/24/32/48/64).
- Components: Angular Material only — `mat-table`, `mat-form-field`/`mat-select` for filters, `mat-sidenav`/`mat-toolbar`/`mat-nav-list` for the shell, `mat-card` for login, `mat-button-toggle-group` for the language switcher (per UI-SPEC's i18n contract — visible EN/ES labels, group `aria-label` = the translated "Language selector" string). No custom-built form controls, dropdowns, or modals.

## Patterns

- **Status chip**: icon + label + tinted background, used for device online/offline and alert severity/status. Never color alone (A11Y.md Perceivable rule).
- **List page skeleton**: every list (`zones`, `devices`, `alerts`) follows loading → error-with-retry → empty → data, with an `aria-live="polite"` visually-hidden result-count announcement and a native `<table>` with `scope="col"` headers.
- **Skip link**: visible-on-focus skip-to-content link in the dashboard shell, ahead of the toolbar in DOM order.
- **Page titles**: `PageTitleService` sets a translated, unique `<title>` per route and re-applies it on language change.
