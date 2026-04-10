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

## [Unreleased]

### Added

- New `y-colorpicker` component — a standalone color picker widget with a 2D saturation/brightness canvas, hue slider, optional alpha slider, format selector, and channel inputs. Supports `value` (any CSS color), `format` (`"hex"` | `"rgb"` | `"hsl"` | `"hsv"`), `formats` (JSON array of available formats), `show-alpha` (alpha channel), and `size` attributes. Public method: `setColor(value)`. Events: `change` (with `value`, `hex`, `rgb`, `hsl`, `hsv`, `alpha` in detail), `format-change`.

- New `y-banner` component — a full-width informational banner that renders in a semantic color with matching text. Supports `color` (`"base"` | `"primary"` | `"secondary"` | `"success"` | `"error"` | `"warning"` | `"help"`), `icon` attribute (or `icon` slot), `position` (`"push"` | `"overlap"`), `sticky` (fixed to viewport when overlapping), `dismissable` close button, `size` (`"small"` | `"medium"` | `"large"`), and an `action` slot for CTA elements. Public methods: `dismiss()`, `show()`. Fires a cancelable `dismiss` event.

- New `y-stack` component — a layout container for arranging child elements in rows, columns, grids, or masonry patterns. Supports `mode` (`"flex"` | `"grid"` | `"masonry"`), `direction`, `columns`, `gap` (maps to `--spacing-*` tokens), `wrap`, `align`, `justify`, and `responsive` attributes. Masonry mode uses JS absolute positioning with `ResizeObserver`. Responsive mode auto-collapses columns at configurable breakpoints.

## [0.4.2] - 2026-04-07

### Added

- New `y-button-group` component — wraps `y-button` (and other elements such as `y-input` or `y-select`) into a visually connected toolbar. Automatically removes inner border-radius on middle children and collapses shared borders to avoid double-border artifacts. Supports `orientation` attribute (`"horizontal"` (default) | `"vertical"`). Works with any slotted child that respects the `--component-button-border-radius-outer` CSS custom property.
- `href`, `target`, and `rel` attributes on `y-button`. When `href` is set the internal element switches from `<button>` to `<a>`, preserving all visual styles and size/color/style-type variants. Disabled state is handled via `aria-disabled` and `pointer-events: none` since `<a>` has no native disabled.
- `navigate` custom event on `y-appbar`, `y-panel`, and `y-menu`. Fires before any navigation when an item with an `href` / `url` is clicked. The event is cancelable (`e.preventDefault()`) and carries `event.detail.href` — React Router and other SPA routers can intercept it without any framework-specific glue.
- `history` attribute on `y-appbar` and `y-menu` (already present on `y-panel`). When omitted (default), navigation uses `history.pushState` + a synthetic `popstate` event so all `popstate`-based routers (React Router `BrowserRouter`, Vue Router, etc.) respond automatically. Set `history="false"` to opt back in to full-page `window.location.href` navigation.

### Changed

- Added responsive display to `y-date` and `y-datepicker` as well as the ability to set a `native-mobile` property to `y-date` which will allow the input to use the native mobile date and time picker instead of the `y-datepicker`.

## [0.4.1] - 2026-04-01

### Added

- New `y-date` component — a form-associated date (and optional time) input field. Displays a trigger button that opens a `y-datepicker` popup. Supports `name`, `value`, `label`, `label-position`, `placeholder`, `size`, `disabled`, `required`, `invalid`, `clearable`, `show-hours`, `min`, `max`, `format`, and `mode` attributes. Emits `change` and `input` events. Fully keyboard accessible with `aria-expanded` management.
- New `y-datepicker` component — a standalone calendar and optional time picker widget. Supports single date and date range selection via the `mode` attribute. Configurable with `value`, `min`, `max`, `show-hours`, `show-seconds`, `format`, `first-day-of-week`, `year-range`, and `panel-count` attributes. Emits a `change` event with the selected date value or `[start, end]` range array. Public API: `clear()`, `formatDate(date)`.
- 10 new bundled icons: `fan`, `thermometer-high`, `thermometer-low`, `ban`, `bluetooth`, `unlock`, `plug`, `gasoline`, `ev-charger`, `tools`.
- `comp-date` icon added to the bundled icon registry.
- Storybook integration — all 28 components now have Storybook stories. Includes a theme background selector that applies the correct design tokens for each active theme.
- 18 new built-in themes (9 color families × dark + light): `green`, `red`, `teal`, `yellow`, `indigo`, `purple`, `pink`, `brown`, `olive`. All are usable by name in the `theme` attribute of `<y-theme>`.

### Changed

- All component source files moved into per-component subdirectories under `src/components/` (e.g. `src/components/y-button/y-button.js`). Tests co-located alongside their component files.
- `--lime-*` color tokens in `variables.css` renamed to `--olive-*` to better reflect the adjusted core color (`#838807`).
- Core token values adjusted for WCAG 3:1 accessibility compliance against both black and white backgrounds: `--green--`, `--teal--`, `--indigo--`, and `--olive--` (formerly `--lime--`). Corresponding dark and light scale variants regenerated using linear RGB interpolation.

### Fixed

- `y-table` sort indicator no longer resizes columns when applied
- `y-icon` removed artifact from accessibility icon
- Dark theme files corrected: `--help-background-component` now uses `var(--indigo-dark-0)` instead of `var(--indigo-light-0)`.

## [0.4.0] - 2026-03-29

### Added

- New `y-textarea` component — a form-associated multi-line text input. Supports `name`, `value`, `placeholder`, `label`, `label-position`, `rows`, `size`, `disabled`, `required`, and `invalid` attributes. Exposes `input` and `change` events.
- New `y-rating` component — a form-associated star/icon rating input. Supports `icon`, `color`, `max`, `value`, `size`, `disabled`, `readonly`, `required`, and `name` attributes. Click-to-clear on the active icon (unless `required`). Full ARIA support (`role="radiogroup"` / `role="img"` when readonly, per-icon `role="radio"` with labels).
- 12 new bundled icons: `heart`, `thumbs-up`, `thumbs-down`, `flask`, `briefcase`, `thumbtack`, `map-marker`, `pencil`, `code`, `circle-question`, `comp-textarea`, `comp-rating`.
- Two new icons: `ellipsis-v` (three vertical dots) and `ellipsis-h` (three horizontal dots). Both are available in the icon registry via `all.js`.
- `y-select`: new `searchable` attribute — enables autocomplete-style inline filtering. In single mode the value display is replaced by a text input that clears on open (showing the current selection as a placeholder) and restores the selected label on close. In multi-tag mode the input appears after the last tag and the dropdown stays open after each selection.
- `y-select`: new `clearable` attribute — shows a clear button (using the `close` icon) when a value is selected.
- `y-select` tag display mode: per-option `color` field — each option object in the `options` array may now include a `color` key (predefined scheme or CSS color) to individually color its tag.
- `y-switch`: new `on-color` and `off-color` attributes for the toggle indicator when checked and unchecked respectively. Accepts predefined scheme names or custom CSS colors. Defaults to `"primary"` for on.
- Custom CSS color support (`#hex`, `rgb()`, `hsl()`) added to the `color` attribute of `y-avatar`, `y-button`, `y-icon`, `y-tag`, `y-toast`, and `y-tooltip`. Predefined scheme names continue to resolve through design tokens; custom values use WCAG-based luminance to auto-contrast the text color. `y-slider` already supported custom color passthrough.

### Changed

- `y-table` sort indicator: replaced the dual up/down arrow with a single directional arrow that matches the active sort direction. Unsorted columns show no icon.
- Theme semantic variables reordered for consistency: `--{scheme}-border` now always appears after `--{scheme}-background-active` and before `--{scheme}-content--` across all theme files and the default variables.
- `y-tag` flat background now resolves directly from `--{color}-background-app` rather than through an intermediate `--component-tag-flat-background-{color}` variable. Custom themes no longer need to define those per-component overrides.
- Icon system: `.svg` files are now the single source of truth. `src/icons/index.js` re-exports directly from the files rather than duplicating SVG markup as strings. Affected icons had their `stroke-width` and `width`/`height` attributes reconciled between files and component usage.
- `y-drawer` grip handle now uses static `ellipsisV`/`ellipsisH` icon imports instead of the `gripDots()` function.

### Fixed

- `y-select`: corrected height to match other medium-size components (40 px). Removed a `min-height: 22px` on the inner `.value-display` that forced the container ~3px taller than buttons, inputs, and sliders. Tag mode still expands naturally.

### Removed

- `--component-tag-flat-background-{color}` CSS variables removed from `variables.css` and all theme files. Use `--{color}-background-app` directly if overriding tag flat backgrounds in a custom theme.
- `gripDots(horizontal)` function removed from `src/icons/index.js`.
- Stale `--base-background-border` and `--error-background-border` variable references cleaned up across all theme files (renamed to `--base-border` / `--error-border` in 0.3.9).

## [0.3.10] - 2026-03-25

### Added

- `y-card`: added `image` slot that displays over the `header` slot if included.

## [0.3.9] - 2026-03-25

### Fixed

- `y-card`, `y-switch`, `y-slider`, `y-progress`: restored missing borders after theme variable rename in 0.3.8 changed `--{scheme}-background-border` to `--{scheme}-border` without updating component references.

## [0.3.8] - 2026-03-25

### Fixed

- `y-card`: header and footer slots now correctly show/hide when used in React (or any framework that appends children after element upgrade). Previously, `hideEmptySlotContainers` ran once in `render()` before children were available, causing header/footer to stay hidden unless a `color` or `raised` attribute was also present. Fixed by adding `slotchange` listeners so visibility is re-evaluated whenever slot content changes.

- `y-tag`: reverted earlier change adding variables to tag backgrounds. Defaults to -background-app variables

## [0.3.6] - 2026-03-23

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

## [0.3.5] - 2026-03-20

### Fixed

- Patch for 0.3.3 with bug fixes

## [0.3.4] - 2026-03-20

### Fixed

- Patch for 0.3.3 with bug fixes

## [0.3.3] - 2026-03-20

### Fixed

- Several bug fixes and test updates

## [0.3.2] - 2026-03-18

### Added

- New icons: `paper-airplane`, `circle-info`, `circle-exclamation`, `monitor`, `smartphone`, `tablet`, `face-smile`, `face-neutral`, `face-frown`
