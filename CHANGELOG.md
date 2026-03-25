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

## [0.3.8] – 2026-03-25

### Fixed

- `y-card`: header and footer slots now correctly show/hide when used in React (or any framework that appends children after element upgrade). Previously, `hideEmptySlotContainers` ran once in `render()` before children were available, causing header/footer to stay hidden unless a `color` or `raised` attribute was also present. Fixed by adding `slotchange` listeners so visibility is re-evaluated whenever slot content changes.

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

---

## [0.3.5] – 2026-03-20

### Fixed

- Patch for 0.3.3 with bug fixes

---

## [0.3.4] – 2026-03-20

### Fixed

- Patch for 0.3.3 with bug fixes

---

## [0.3.3] – 2026-03-20

### Fixed

- Several bug fixes and test updates

---

## [0.3.2] – 2026-03-18

### Added

- New icons: `paper-airplane`, `circle-info`, `circle-exclamation`, `monitor`, `smartphone`, `tablet`, `face-smile`, `face-neutral`, `face-frown`
