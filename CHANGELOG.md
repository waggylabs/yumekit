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

## [0.5.1]

### Added

- Two new built-in themes, `material-blue-light` and `material-blue-dark`, applying Material Design 3 — a Material palette (Blue primary, Material status colors, grey surfaces), Roboto typography, and the M3 shape scale (4/8/12/28px radii, pill buttons, 28px dialogs, 4px text fields, 1px borders) applied across all components. `y-theme` now loads the Roboto webfont automatically when one of these themes is active.

- Two new built-in themes, `carbon-light` and `carbon-dark`, applying IBM Carbon — the Carbon palette (Interactive Blue `#0f62fe`, IBM gray surfaces, Carbon status colors), IBM Plex Sans typography, and Carbon's sharp shape language (0px radii, 1px borders). `y-theme` loads the IBM Plex Sans webfont automatically when one of these themes is active.

- `y-tabs` — new `variant="accent"` style: minimal tabs where the active tab shows a primary-colored indicator border on its content-facing edge (bottom for top tabs, etc.). The default bordered style is unchanged. Adds `--component-tabs-accent-width` (indicator thickness). The border-width token is normalized to `--component-tabs-border-width` (matching `--component-tabs-border-color`); the legacy `--component-tab-border-width` is still honored as a fallback.

- Form fields (`y-input`, `y-textarea`, `y-select`, `y-color`, `y-date`) — new `variant="underline"` style: a bottom-only border with square bottom corners (the Material/Carbon text-field look) instead of the full-border `"default"`. Hover/focus/invalid states still color the underline. Helps match design systems that use underlined fields.

- New `y-data-grid` component — interactive grid for large or dynamic datasets with client- or server-side sorting, filtering, and pagination, single/multi row selection, inline cell editing, nested row grouping with aggregates, multi-column header groups, virtual scrolling, an optional per-column header menu (filter, sort, visibility, reorder), and a sticky header.

- New `y-popover` component — target-anchored floating panel with rich slotted content, composable triggers (`click` / `hover` / `focus` / `context-menu` / `manual`), flip-on-collision positioning, optional modal mode with focus trap, and an opt-in `portal` mode that renders into `<body>` to escape ancestor stacking contexts.

- New `y-help` component — guided product-tour / onboarding overlay. Walks users through an ordered list of steps with a dimmed SVG highlight, anchored tooltip, prev/next controls, overlay-edge arrows, and keyboard shortcuts.

- New `y-code` component — code-block container with line numbers, copy-to-clipboard (block and per-line), `max-lines` collapse, and an optional filename header. Built-in tokenizer covers JavaScript, TypeScript, JSON, CSS, Python, Bash, and HTML; emits Prism-compatible classes so existing Prism stylesheets layer on cleanly, or pipe an external highlighter's output through the sanitized `highlighted` slot.

- New `y-shape` component — presentational container that clips its slotted content into a geometric shape (rectangle, circle, ellipse, star, heart, chat-bubble, times, cross, or a custom `polygon`) via CSS `clip-path`. Suitable for avatar masks, decorative panels, and non-rectangular skeletons.

- `y-stepper` — `responsive` and `responsive-breakpoint` attributes; auto-flips horizontal layouts to vertical below the breakpoint (600px default). Enabled by default; set `responsive="false"` to opt out.

- Filled icon variants for `y-icon` via a new `weight="filled"` value, with automatic fallback to the line icon when no filled version is registered. 116 filled icons ship under `icons/all-filled.js` (also pulled in by `icons/all.js`); the remaining component-illustration icons fall back to their line versions.

### Changed

- `y-button` — padding can now be set per-axis via `--component-button-padding-block-{size}` / `--component-button-padding-inline-{size}` (overriding, and falling back to, the all-sides `--component-button-padding-{size}`), plus a new `padding-mode` attribute (`auto` (default) / `square` / `wide`) controlling whether the inline axis collapses to the block value. `auto` makes icon-only buttons square automatically; `square`/`wide` force it. The Material themes use this for wide pill buttons that stay round when icon-only; `y-paginator` number buttons and `y-datepicker` day / month / year buttons set `padding-mode="square"` so they don't bloat under the wide Material padding.

- Custom color support expanded to the browser-native color functions — `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, and `color()` — in addition to `#hex`, `rgb()`/`rgba()`, and `hsl()`/`hsla()`. The shared `isSafeCssColor` gate now also tightens its argument allowlist (rejecting semicolons, braces, angle brackets, and nested functions). Applies anywhere a `color` accepts a custom value, including `y-badge`, `y-select`, `y-popover`, `y-button`, `y-tag`, `y-icon`, and `y-rating`.

- `y-rating` — selected icons now swap in the registered `filled` weight variant instead of just thickening the line stroke, falling back to the thick stroke when no filled variant is available.

- `y-paginator` — page-button list now auto-shrinks to fit the host width, growing back when space allows.

- `y-select` — new opt-in `portal` attribute renders the dropdown into `<body>` so it escapes scrollable or clipped ancestors (e.g. inside a data-grid cell editor).

- **Breaking** `y-break`: `inset` values renamed from `"sm"` / `"md"` / `"lg"` to `"small"` / `"medium"` / `"large"` to match the size scale used by every other component. Spacing mapping is unchanged (`small` → `--spacing-x-small`, `medium` → `--spacing-medium`, `large` → `--spacing-x-large`), so visual output is identical after the find-and-replace.

### Fixed

- Form field components now share one field background. `y-select` (trigger and dropdown) used `base.background.app` while `y-input` / `y-textarea` / `y-color` / `y-date` used `base.background.component`; `select.background` is now `base.background.component` across all themes, so fields match when placed together on a form (most visible in the Material and Carbon themes). The select dropdown panel now also matches menus/popovers.

- `y-avatar` — the three `shape` values are now visually distinct. Added a `--component-avatar-border-radius-rounded` token (medium radius) and changed `square` to a zero radius (sharp corners); `circle` is unchanged.

- `y-tag` — Increased the inline padding size for all sizes of `y-tag` component.

- `y-tabs` — the tab panel no longer creates a stacking context (`z-index: 0` removed), which was trapping `position: fixed` overlays rendered by slotted components (e.g. `y-gallery`'s lightbox) underneath the tab strip and surrounding page content.

- `y-gallery` — the lightbox overlay's default z-index was raised from 1000 to 9000 so it layers above fixed chrome like `y-dock` (8000); override via `--component-gallery-expand-z-index`.

- `y-menu` — selected items now use the primary inverse content color for their text, so the label stays readable against the primary-colored selected background across all themes.

- `y-button` — no longer throws when `color` is set to an unrecognized value that isn't a valid custom color; it now falls back to the `base` theme instead of crashing while reading the color-token map.

- `y-droplist` — touch drag now works reliably on iOS Safari and Chrome Android. `touch-action: none` is applied to the press target at decoration time instead of from inside `pointerdown`, so mobile browsers stop preempting the press as a scroll gesture.

- Corrected the arrow direction on the `left-from-bracket`, `right-from-bracket`, and `left-to-bracket` icons, which previously pointed the wrong way relative to their bracket (the `*-from-*` arrows now exit the bracket and the `*-to-*` arrow enters it).

## [0.5.0] - 2026-05-25

### Added

- New `y-tree` / `y-tree-item` components — hierarchical navigation tree for sidebars, doc nav, and file/folder explorers.

- New `y-avatar-group` component — displays a collection of overlapping avatars in a horizontal or vertical row.

- New `y-sidebar` component — collapsible vertical navigation sidebar, extracted from `y-appbar`'s vertical mode.

- New `y-splitter` component — two-pane container with a draggable handle that resizes the first pane.

- New `y-droplist` component — drag-and-drop reorderable list with keyboard reorder support.

- New `y-break` component — decorative horizontal or vertical divider, optionally broken by centered content.

- New `y-grid` component — CSS Grid layout container, extracted from `y-stack`.

- New `y-masonry` component — layout container that packs children of varying heights into the shortest column.

- New `y-paginator` component — page navigation control with a configurable button window.

- New `y-animate` component — a declarative wrapper that applies CSS-based entrance animations to its slotted children.

### Changed

- **Icon rename — `comp-*` prefix dropped.** All 26 component-illustrating icons renamed. Two resolved collisions: `comp-menu` → `droplist` and `comp-tag` → `chip`.

    | Old name        | New name   |
    | --------------- | ---------- |
    | `comp-appbar`   | `appbar`   |
    | `comp-avatar`   | `avatar`   |
    | `comp-badge`    | `badge`    |
    | `comp-button`   | `button`   |
    | `comp-card`     | `card`     |
    | `comp-checkbox` | `checkbox` |
    | `comp-date`     | `date`     |
    | `comp-dialog`   | `dialog`   |
    | `comp-drawer`   | `drawer`   |
    | `comp-icon`     | `icon`     |
    | `comp-input`    | `input`    |
    | `comp-menu`     | `droplist` |
    | `comp-panelbar` | `panelbar` |
    | `comp-progress` | `progress` |
    | `comp-radio`    | `radio`    |
    | `comp-rating`   | `rating`   |
    | `comp-select`   | `select`   |
    | `comp-slider`   | `slider`   |
    | `comp-switch`   | `switch`   |
    | `comp-table`    | `table`    |
    | `comp-tabs`     | `tabs`     |
    | `comp-tag`      | `chip`     |
    | `comp-textarea` | `textarea` |
    | `comp-theme`    | `theme`    |
    | `comp-toast`    | `toast`    |
    | `comp-tooltip`  | `tooltip`  |

- **Icon rename — usage names replaced with glyph-descriptive names.** 12 general-purpose icons renamed so the name describes what the icon depicts rather than how it is used.

    | Old name   | New name               | Glyph                      |
    | ---------- | ---------------------- | -------------------------- |
    | `ai`       | `robot`                | Robot Head                 |
    | `ban`      | `circle-slash`         | Circle with diagonal slash |
    | `chart`    | `waveform`             | ECG / pulse waveform       |
    | `close`    | `x`                    | × mark                     |
    | `comments` | `speech-bubble`        | Chat / speech bubble       |
    | `filter`   | `funnel`               | Funnel shape               |
    | `paste`    | `clipboard`            | Clipboard                  |
    | `save`     | `floppy-disk`          | Floppy disk                |
    | `search`   | `magnifying-glass`     | Magnifying glass           |
    | `settings` | `gear`                 | Gear / cog                 |
    | `tools`    | `wrench`               | Single wrench              |
    | `warning`  | `triangle-exclamation` | Triangle with !            |

- **Breaking** `y-slider`: visual redesign, range mode added, and refactor to current standards.

- `y-tooltip`: added `open` boolean attribute to force visibility independent of hover/focus.

- `y-progress`: expanded to a multi-mode indicator supporting `bar`, `ring`, and `pie` shapes plus multi-value rendering.

- `y-rating`: selected icons now render with the thickest stroke weight, making them easier to distinguish from the unselected outlines beyond color alone.

- **Breaking** `y-appbar`: vertical sidebar mode removed — migrate vertical navigation to the new `y-sidebar`. `sticky="start"` / `sticky="end"` now refer to the top / bottom edges, and `menu-direction` defaults to `"down"`.

- **Breaking** `y-stack`: refocused as a flexbox-only primitive. Migration: `<y-stack mode="grid" …>` → `<y-grid …>`; `<y-stack mode="masonry" …>` → `<y-masonry …>`. The `mode` and `columns` attributes and the related `--component-stack-*` variables are removed.

### Fixed

- Property setters that back a JSON attribute no longer double-encode a string value. Assigning a JSON string (e.g. `el.ticks = "[0,25,50]"`, as React 19 does for matching properties) previously ran it through `JSON.stringify` again, producing an unparseable attribute and a blank render. Setters now mirror string input directly, matching `y-progress`. Affects `y-slider` (`ticks`), `y-appbar`/`y-sidebar`/`y-dock`/`y-stepper`/`y-breadcrumbs` (`items`), `y-tabs` (`options`), `y-paginator` (`pageSizeOptions`), and `y-color`/`y-colorpicker` (`formats`).

- `y-avatar`: when the image at `src` fails to load, the component now falls back to the initials rendering rather than displaying the browser's broken-image graphic.

- Orphaned CSS custom properties across several components now resolve to real design tokens instead of only their inline fallbacks. `y-dialog`, `y-banner`, `y-droplist`, `y-gallery`, `y-breadcrumbs`, `y-dock`, `y-input`, `y-progress`, `y-slider`, `y-stepper`, and `y-table` referenced `--component-*` variables that were never defined in the token pipeline; these are now themeable. Also fixed `y-gallery`'s broken `--neutral-black-translucent` fallback and stale `--y-color-*` references in the `y-droplist` stories.

### Security

- **Breaking** `y-appbar` / `y-sidebar`: nav-item `icon` no longer accepts raw SVG markup — only registered icon names. Use `registerIcon` / `registerIcons` for custom glyphs.

- **XSS hardening across 11 components** (`y-avatar`, `y-input`, `y-textarea`, `y-tooltip`, `y-banner`, `y-badge`, `y-date`, `y-colorpicker`, `y-select`, `y-icon`, `y-rating`): shadow trees now build via `createElement` + `setAttribute` + `textContent` instead of `innerHTML` interpolation.

- New shared `isSafeCssColor` helper validates user-supplied CSS color literals; applied to `y-badge`'s `color` and `y-select`'s per-option `color`.

- New shared `svg-sanitizer` module (`src/modules/svg-sanitizer.js`) replaces the inlined sanitizer in `y-icon` and is now also applied on the `y-rating` render path.

## [0.4.4] - 2026-04-25

### Fixed

- `y-badge`: slotted children would disappear when the badge was upgraded before its children were parsed (e.g. when `y-badge.js` loaded before the tag appeared in the HTML stream). The shadow DOM now always includes a `<slot>` and toggles overlay vs. inline layout via a `slotchange`-driven class on an internal root element, so children projected in after upgrade are always picked up. Knock-on: text-only and comment-only children no longer trigger overlay mode (only element children do). This matches how the component is actually used in practice.

### Added

- New shared layout helpers in `src/modules/helpers.js`: `GAP_TOKEN_MAP`, `resolveGapToken(host, attrName)`, and `measureCSSLength(container, cssLength)` — used by `y-grid` and `y-masonry` to map the shared gap-token scale to CSS expressions and measure resolved pixel widths.

- `y-appbar`: the default (unnamed) slot now lets consumers supply their own link elements (e.g. Vue Router's `<router-link>`, React Router's `<NavLink>`, plain `<a>`) in place of — or in addition to — the auto-generated `y-button` items. Unslotted children render in the appbar body after any items from the `items` attribute, get full-width treatment in vertical mode, and are hidden-overflow when collapsed. In mobile (hamburger) mode the same slot is rendered inside the dropdown panel below the items, preserving the desktop priority order.

- `y-menu`: items now accept `href` for navigation, matching `y-appbar`, `y-dock`, and `y-breadcrumbs`. This fixes a bug where `y-appbar` submenu items (which use `href`) would not navigate when passed through to a nested `y-menu`.

- `y-menu`: new lifecycle and selection events. `open` and `close` fire on visibility transitions. `select` fires when a leaf item is activated, carrying `detail: { value, item?, element? }` so consumers can react without subscribing to `navigate`.

- `y-menu`: items support a new `value` field, used as `event.detail.value` on the `select` event. Defaults to `item.text` when omitted.

- `y-menu`: items support a new `icon` field (icon name passed to `<y-icon>`), bringing y-menu in line with `y-appbar`, `y-dock`, and other components that render named icons.

- `y-menu`: items support a new `slot` field that names a slot in the menu's light DOM whose content replaces that item's default content (matching the `y-appbar` per-item slot pattern).

- `y-menu`: light-DOM children placed directly inside `<y-menu>` (without a `slot` attribute) are now treated as additional menu items. Each child receives `role="menuitem"` and `tabindex="0"` automatically, and clicking fires the `select` event with `detail.value` derived from `data-value` or `textContent`.

### Changed

- `y-appbar`: mobile hamburger menu replaced its internal `y-menu` with a self-contained dropdown panel so it can host both auto-generated nav buttons and arbitrary slotted nav children. Behaviour is otherwise unchanged — items still drive the menu, the hamburger toggles open/closed, and clicks outside the appbar dismiss the panel.

### Deprecated

- `y-menu`: `item.url` is deprecated in favour of `item.href`. Existing code keeps working and emits a one-time console warning per page load; `url` will be removed in a future release.

- `y-menu`: `item.template` and `item['icon-template']` are deprecated in favour of `item.slot` (named slot for custom item content) and `item.icon` (icon name). Existing code keeps working and emits a one-time console warning per page load; the template fields will be removed in a future release.

## [0.4.3] - 2026-04-17

### Added

- New `y-dock` component — a fixed navigation bar (dock) that displays icon+label items for primary app navigation. Accepts items via a JSON `items` attribute, slotted templates, or direct child elements. Attributes: `items` (JSON array of `{ name, icon, href?, selected?, slot? }`), `position` (`"bottom"` | `"top"`), `breakpoint` (viewport width below which dock is visible — omit for always visible), `size` (`"small"` | `"medium"` | `"large"`), `history` (omit for `pushState` SPA navigation; set to `"false"` for full-page navigation). Events: cancelable `navigate` (`detail: { href }`). Full ARIA support with `role="navigation"`, `aria-current="page"`, and keyboard navigation (Arrow Left/Right, Enter/Space).

- New `y-stepper` component — a multi-step wizard that guides users through a sequential flow. Step content is provided via named slots defined in the `items` JSON array (`{ label, slot, description?, icon?, status? }`). Supports `current` (zero-based active step index), `orientation` (`"horizontal"` | `"vertical"`), `position` (`"start"` | `"end"` — controls whether indicators appear before or after the content), `size` (`"small"` | `"medium"` | `"large"`), `linear` (restricts free navigation), and `editable` (allows returning to completed steps). Methods: `next()`, `previous()`, `goTo(index)`, `complete(index?)`, `reset()`. Events: cancelable `change`, `complete`, `finish`. Full ARIA support with `role="list"`, `aria-current="step"`, `aria-controls`/`aria-labelledby` linkage, and keyboard navigation.

- New `y-breadcrumbs` component — a navigation breadcrumb trail. Accepts an `items` JSON array (`{ text, href?, icon? }`). Supports `separator` (custom separator character or slotted icon), `max-items` (collapses middle items with an expand button), `size` (`"small"` | `"medium"` | `"large"`), and `history` (set to `"false"` for full-page navigation instead of `pushState`). Fires cancelable `navigate` and `expand` events. Full ARIA with `<nav aria-label="Breadcrumb">`, `<ol>`, `aria-current="page"`, and `aria-hidden` separators.

- New `y-gallery` component — a media gallery that accepts `<img>` or `<figure>` children and arranges them in `grid`, `row`, `column`, or `masonry` layouts. Supports `columns`, `gap` (`"small"` | `"medium"` | `"large"` or any CSS length), `aspect-ratio`, `expandable` (lightbox with prev/next navigation), `loop`, and `size` attributes. The expanded view uses `<y-icon>` for nav arrows and supports `data-src` for full-resolution images, `<figcaption>` captions, and image counter. Icon slots (`expand-prev-icon`, `expand-next-icon`, `expand-close-icon`) allow custom icons. Fires `expand`, `close`, and `navigate` events.

- New `y-colorpicker` component — a standalone color picker widget with a 2D saturation/brightness canvas, hue slider, optional alpha slider, format selector, and channel inputs. Supports `value` (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hsv()`, `hsva()`), `format` (`"hex"` | `"rgb"` | `"hsl"` | `"hsv"`), `formats` (JSON array of available formats), `show-alpha` (alpha channel), and `size` attributes.

- New `y-color` component — a form-associated color input with a trigger/popup pattern (like `<y-date>`). Renders a color swatch preview and value string in the trigger; opens a `<y-colorpicker>` popup on click. Supports `value`, `format`, `formats`, `show-alpha`, `placeholder`, `name`, `disabled`, `invalid`, `clearable`, `size`, and `label-position` attributes. Uses `ElementInternals` for `FormData` participation.

- New `y-banner` component — a full-width informational banner that renders in a semantic color with matching text. Supports `color` (`"base"` | `"primary"` | `"secondary"` | `"success"` | `"error"` | `"warning"` | `"help"`), `icon` attribute (or `icon` slot), `position` (`"push"` | `"overlap"`), `sticky` (fixed to viewport when overlapping), `dismissable` close button, `size` (`"small"` | `"medium"` | `"large"`), and an `action` slot for CTA elements.

- New `y-stack` component — a layout container for arranging child elements in rows, columns, grids, or masonry patterns. Supports `mode` (`"flex"` | `"grid"` | `"masonry"`), `direction`, `columns`, `gap` (maps to `--spacing-*` tokens), `wrap`, `align`, `justify`, and `responsive` attributes. Masonry mode uses JS absolute positioning with `ResizeObserver`. Responsive mode auto-collapses columns at configurable breakpoints.

- `y-tabs`: `leftIcon` and `rightIcon` properties on option objects — set a `<y-icon>` name directly in the options JSON to render icons without requiring extra child elements or named slots.

- `y-tabs`: `tab-content-{id}` slot — place any content (icons, badges, custom markup) inside the tab button itself by targeting this slot. Takes full precedence over `leftIcon`/`rightIcon` and the default label rendering.

- 14 new bundled icons: `bug`, `copy`, `fast-back`, `fast-forward`, `flower`, `paste`, `pause`, `play`, `redo`, `scissors`, `skip-back`, `skip-forward`, `stop`, `undo`.

### Fixed

- `y-dialog`, `y-drawer`, `y-menu`: anchor lookup now tolerates DOM insertion races. Previously, setting the `anchor` attribute before the anchor element was in the DOM (common with React portals and async / lazy mounts) left the component without a click listener. Resolution now tries `getElementById` synchronously, retries once on the next animation frame, and falls back to a `MutationObserver` that fires when the anchor appears. `y-dialog` also now cleans up its anchor listener on disconnect.

### Deprecated

- `y-tabs`: `left-icon-{id}` and `right-icon-{id}` slots — these slots still function but emit a `console.warn` directing users to the `leftIcon`/`rightIcon` option properties or the `tab-content-{id}` slot. They will be removed before the release of version 1.0.

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
