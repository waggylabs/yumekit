# Changelog

All notable changes to YumeKit are documented here.

<!--
HOW TO ADD AN ENTRY
===================
Copy the release block template below and paste it above the previous release.
Fill in the version number, release date, and populate only the sections that apply.
Delete any empty sections before publishing.

─────────────────────────────────────────────────────────────────────────────

## [x.x.x] – YYYY-MM-DD

### Added
<!-- New components, icons, props, utilities, or features -->

<!-- ### Changed -->
<!-- Updates to existing behavior, APIs, styling, or defaults -->

<!-- ### Fixed -->
<!-- Bug fixes, accessibility corrections, rendering issues -->

<!-- ### Deprecated -->
<!-- Features or APIs that still work but will be removed in a future release -->

<!-- ### Removed -->
<!-- Features, props, or files that have been deleted -->

<!-- ### Security -->
<!-- Vulnerability patches or hardening changes -->

## [0.3.11] – 2026-03-25

### Added

- New `y-textarea` component — a form-associated multi-line text input. Supports `name`, `value`, `placeholder`, `label`, `label-position`, `rows`, `size`, `disabled`, `required`, and `invalid` attributes. Exposes `input` and `change` events.
- New `y-rating` component — a form-associated star/icon rating input. Supports `icon`, `color`, `max`, `value`, `size`, `disabled`, `readonly`, `required`, and `name` attributes. Click-to-clear on the active icon (unless `required`). Full ARIA support (`role="radiogroup"` / `role="img"` when readonly, per-icon `role="radio"` with labels).
- 12 new bundled icons: `heart`, `thumbs-up`, `thumbs-down`, `flask`, `briefcase`, `thumbtack`, `map-marker`, `pencil`, `code`, `circle-question`, `comp-textarea`, `comp-rating`.
- React TypeScript definitions (`react.d.ts`) for `y-textarea` and `y-rating`.

### Fixed

- `y-select`: corrected height to match other medium-size components (40 px). Removed a `min-height: 22px` on the inner `.value-display` that forced the container ~3px taller than buttons, inputs, and sliders. Tag mode still expands naturally.

## [0.3.10] – 2026-03-25

### Added

- `y-card`: added `image` slot that displays over the `header` slot if included.

## [0.3.9] – 2026-03-25

### Fixed

- `y-card`, `y-switch`, `y-slider`, `y-progress`: restored missing borders after theme variable rename in 0.3.8 changed `--{scheme}-background-border` to `--{scheme}-border` without updating component references.

## [0.3.8] – 2026-03-25

### Fixed

- `y-card`: header and footer slots now correctly show/hide when used in React (or any framework that appends children after element upgrade). Previously, `hideEmptySlotContainers` ran once in `render()` before children were available, causing header/footer to stay hidden unless a `color` or `raised` attribute was also present. Fixed by adding `slotchange` listeners so visibility is re-evaluated whenever slot content changes.

- `y-tag`: reverted earlier change adding variables to tag backgrounds. Defaults to -background-app variables

## [0.3.6] – 2026-03-23

### Added

- New icons: `trash`, `archive`, `share`, `link`, `tag`, `bookmark`, `expand-left`, `expand-up`, `expand-down`, `list-bullet`, `down-from-bracket`, `up-to-bracket`

- New variant for tag component: `flat`, using new per-color `--component-tag-flat-background-{color}` theme variables
- Selected state for menu items — set `selected: true` on any item to highlight it using new `--component-menu-selected-background` and `--component-menu-selected-color` theme variables

### Changed

- Renamed icons for consistency: `checkmark` → `check`, `indeterminate` → `minus`, `logo` → `stack`, `download` → `down-to-bracket`, `upload` → `up-from-bracket`
- Normalized arrow and shaft sizes across all directional icons (arrows, bracket icons, expand/collapse)

### Fixed

- Proper disabled styling for `y-switch` component

### Removed

- Removed `features` icon (duplicate of `sun`)

## [0.3.5] – 2026-03-20

### Fixed

- Patch for 0.3.3 with bug fixes

## [0.3.4] – 2026-03-20

### Fixed

- Patch for 0.3.3 with bug fixes

## [0.3.3] – 2026-03-20

### Fixed

- Several bug fixes and test updates

## [0.3.2] – 2026-03-18

### Added

- New icons: `paper-airplane`, `circle-info`, `circle-exclamation`, `monitor`, `smartphone`, `tablet`, `face-smile`, `face-neutral`, `face-frown`
