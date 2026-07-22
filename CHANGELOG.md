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

## [0.5.4]

### Added

- `y-carousel` — a slideshow container that presents its slotted children as slides, one or more per view (`per-view`, including fractional peeks), with arrow/dot/fraction navigation, pointer and touch swipe, `loop`, and optional `autoplay`. Built on CSS scroll-snap so swipe and programmatic navigation share one path; autoplay pauses on hover, focus, off-screen, hidden tabs, and `prefers-reduced-motion`. New `--component-carousel-*` tokens across all 60 themes.

- `y-upload` — a form-associated file upload with a drag-and-drop dropzone, client-side validation (`accept`, `max-size`, `max-files`, `max-total-size`), and a managed file list with optional image previews and per-file progress/status. Selected files submit with the parent form via `FormData` under `name`; the app handles transport and reports back through `setProgress` / `setStatus`. New `--component-upload-*` tokens across all 60 themes.

- `y-skeleton` — a presentational placeholder primitive that mimics the shape of loading content to cut perceived latency and layout shift. Supports `text` (multi-line bars, last line shortened), `circle`, and `rect` variants; `pulse`, `wave`, and `none` animations (pure CSS keyframes, disabled under `prefers-reduced-motion`); explicit `width`/`height`; and optional slotted content that sizes the placeholder to the element it stands in for. New `--component-skeleton-*` tokens across all 60 themes.

- `y-editor` — a form-associated rich text (WYSIWYG) editor built on native `contenteditable` and the Selection/Range APIs. A new shared HTML sanitizer (`src/modules/html-sanitizer.js`, alongside `svg-sanitizer.js`) gates every path that can introduce markup — the `value` setter, the default slot, and paste — and ships with seven new formatting icons (`bold`, `italic`, `underline`, `strikethrough`, `heading`, `quote`, `list-ordered`) plus `--component-editor-*` tokens across all 60 themes.

- `y-input` and `y-textarea` support a `placeholder` attribute (and matching property), bringing them in line with `y-select`, `y-date`, and `y-color`. A new `--component-input-placeholder-color` token (defaulting to the `base.content.lightest` shade) styles the hint text across all 60 themes.

- `y-form` — a form container that renders and manages a group of YumeKit form controls from a JSON `fields` array, with configurable submit/reset buttons, built-in required/validity checking, and a single `{values, formData}` payload on submit. Field entries with a `slot` key render named-slot outlets, so custom children interleave with generated fields and still participate in value collection.

- Skeleton loading states for data-heavy components, built on `y-skeleton`. `y-data-grid` gains `loading-mode` (`auto` / `overlay` / `skeleton`) and `skeleton-rows`; `y-table` and `y-avatar` gain `loading` (plus `skeleton-rows` on the table). The grid and table expose a `skeleton` slot and `skeleton-body` / `skeleton-row` / `skeleton-cell` parts, and the avatar placeholder matches its size and shape. Placeholder rows reuse the real column widths so there is no layout shift when data arrives.

### Changed

- Placeholder text in `y-date` and `y-color` now uses the new `--component-input-placeholder-color` token instead of `--base-content-light`, so it reads as clearly muted against the field's value text and is consistent with `y-input` and `y-textarea`.

- `y-data-grid`'s new default `loading-mode="auto"` changes what an existing `<y-data-grid loading>` shows on a **first load**: a grid loading with no rows now renders shape-accurate placeholder rows instead of a spinner over an empty grid. This is a presentation change only — the `loading` attribute, the `loading` slot, and the overlay behave exactly as before once rows are present. Set `loading-mode="overlay"` to keep the spinner in every case.

- Rich-data properties (`items`, `options`, `columns`, `data`, `steps`, `avatars`, `aggregates`, `formats`, `page-size-options`, `values`, and similar) are now held on the element as properties and are no longer serialized back to their attribute. The attribute is still read as an initial value for declarative markup, so `<y-select options='[...]'>` and `el.options = [...]` both work, but after an imperative set the property keeps object identity, accepts non-serializable values, and the matching attribute is not updated. Polymorphic scalar-or-array attributes (`y-slider`'s `ticks`, `y-data-grid`'s `group-by`) are unchanged.

### Fixed

- Deep imports (`@waggylabs/yumekit/components/*.js`) are fixed and substantially slimmer. The per-component bundles emitted import paths that pointed outside the package, and each bundle inlined its own copy of every dependency, including a private icon registry, so `registerIcon()` had no effect on deep-imported components. Shared modules and sibling components are now resolved from `dist/modules/` and `dist/components/`, every bundle contains only its own code, and all bundles share the single icon registry.

- `y-data-grid`'s inline filter row (`filtering="inline"`) was effectively unusable: each keystroke lost focus and reset the typed value. The per-keystroke re-render discarded the focused filter input, and the native composed `input` event double-fired the grid's filter handler with an empty value. The grid now ignores the redundant native event and restores focus, caret position, and value across renders.

- `y-button-group` now collapses the shared border between adjacent items by each item's actual border width instead of a fixed 1px, so thick-bordered themes (e.g. the Waggy themes' 2px outlines) no longer render doubled-up borders along the inner seams.

- Properties assigned before a component upgrades (common in frameworks and with lazy-loaded bundles) are now reapplied through their accessors, so reflection and side effects run as expected. Components that set an explicit `:host` display also honor the `hidden` attribute again.

### Migration

- `y-avatar-group`'s `avatars`, and `y-data-grid`'s and `y-table`'s `columns` and `data`, previously returned the raw JSON **string** from their getters; they now return the parsed **array/object**. Drop any `JSON.parse(el.data)` (and similar) — read the value directly. (Object-array properties such as `items`, `options`, `steps`, and `formats` already returned parsed arrays and are unaffected.)

- Rich-data properties are no longer reflected to their attribute after an imperative set, so anything that reads the attribute rather than the property is affected: cloning a JS-configured element (`el.cloneNode(true)` copies attributes, not properties), serializing `outerHTML`, attribute CSS selectors like `y-select[options]`, and `MutationObserver`s watching these attributes. If you rely on any of these, set the attribute instead of the property, or re-hydrate the property on the target.

- Mutating a returned rich-data array in place (`el.items.push(...)`) now aliases the component's internal array but does not trigger a re-render. Reassign the property to apply changes: `el.items = [...el.items, next]`.

## [0.5.3] - 2026-07-07

### Changed

- `y-button` and `y-tag` rename the `style-type` attribute to `variant`.

### Deprecated

- `y-button`'s and `y-tag`'s `style-type` attribute is deprecated in favor of `variant`; it still works (with `variant` taking precedence) but will be removed in a future major version.

### Fixed

- `y-input`, `y-textarea`, and `y-checkbox` now respond to clicks across their full interactive area. Clicking anywhere in a `y-input`/`y-textarea` (padding and icon slots included) focuses the field, and clicking a `y-checkbox`'s label toggles it, matching the existing hover affordance and `y-radio`'s label behavior.

## [0.5.2] - 2026-06-27

### Added

- `y-tabs` gains an `overflow` attribute: `scroll` (default) keeps tabs on a single line and shows prev/next arrow buttons when the strip overflows its container, while `wrap` lets tabs flow onto multiple rows.

### Changed

- `y-code` now scrolls its content within a height-constrained container — set a CSS `height` or `max-height` and the code area scrolls, where previously vertical scrolling only kicked in with `max-lines`.

## [0.5.1] - 2026-06-20

### Added

- New `y-data-grid` component — interactive grid for large datasets with client- or server-side sorting, filtering, and pagination, row selection, inline cell editing, grouping with aggregates, multi-column header groups, virtual scrolling, a per-column header menu, and a sticky header.

- New `y-popover` component — anchored floating panel with slotted content, composable triggers (`click` / `hover` / `focus` / `context-menu` / `manual`), flip-on-collision positioning, optional modal mode with focus trap, and a `portal` mode that renders into the nearest enclosing `<y-theme>` (falling back to `<body>`).

- New `y-help` component — guided product-tour overlay with ordered steps, a dimmed SVG highlight, anchored tooltip, prev/next controls, and keyboard shortcuts.

- New `y-code` component — code block with line numbers, copy-to-clipboard (block and per-line), `max-lines` collapse, and an optional filename header. Built-in tokenizer covers JavaScript, TypeScript, JSON, CSS, Python, Bash, and HTML and emits Prism-compatible classes; an external highlighter can feed the sanitized `highlighted` slot.

- New `y-shape` component — clips slotted content into a geometric shape (rectangle, circle, ellipse, star, heart, chat-bubble, times, cross, or custom `polygon`) via CSS `clip-path`.

- Many new themes: `Slate`, `Rose`, `Catppuccin`, and `Nord`. We also added two `Waggy` themes, several themes based on other open source design systems (Material, Carbon, Ant, Shadcn, Primer, Bootstrap). We also added `Kepler` themes in a nod to Kepler UI, YumeKit's spiritual predecessor.

- Filled icon variants for `y-icon` via a new `weight="filled"` value, falling back to the line icon when no filled version is registered. 116 filled icons ship under `icons/all-filled.js` (also pulled in by `icons/all.js`).

- AI assistant docs now ship with the package, plus an `npx @waggylabs/yumekit init-ai` command that installs the YumeKit Claude Code skill (`.claude/skills/yumekit/`), `llm.txt`, and an `AGENTS.md` pointer. Opt-in and idempotent; skips existing files unless `--force` is passed.

- `y-checkbox` / `y-radio` — checked-state color hooks so themes can fill the control on selection: `--component-checkbox-checked-background` / `-checked-border-color` / `-checked-icon-color` and `--component-radio-background` / `-checked-background` / `-checked-border-color` / `-checked-dot-color`. Each falls back to its unchecked value. The design-system themes use them to fill checked controls with the primary color.

- `y-tabs` — new `variant="accent"` style: the active tab shows a primary-colored indicator on its content-facing edge. Adds `--component-tabs-accent-width` (indicator thickness) and normalizes the border-width token to `--component-tabs-border-width` (legacy `--component-tab-border-width` still honored).

- Form fields (`y-input`, `y-textarea`, `y-select`, `y-color`, `y-date`) — new `variant="underline"` style: a bottom-only border with square bottom corners. Hover/focus/invalid states still color the underline.

- `y-dock` — new `floating` attribute that detaches the dock into a bordered, rounded island inset from the viewport edges with a drop shadow. Tunable via `--component-dock-border-radius`, `--component-dock-floating-margin`, and `--component-dock-shadow`.

- New theming hooks: `--component-control-height-{size}` (shared min-height for `y-button` and `y-input`, falling back to `--sizing-{size}`) and `--component-checkbox-border-radius` (tighter checkbox radius). Outlined `y-button`s now source their border from the matching semantic border token per color, falling back to the text color; `--component-button-outline-border` / `--component-button-outline-border-color` remain as global overrides.

- `y-stepper` — new `responsive` and `responsive-breakpoint` attributes; auto-flips horizontal layouts to vertical below the breakpoint (600px default). Set `responsive="false"` to opt out.

### Changed

- **Breaking** `y-break` — `inset` values renamed from `"sm"` / `"md"` / `"lg"` to `"small"` / `"medium"` / `"large"` to match the size scale used elsewhere. Spacing is unchanged, so output is identical after the rename.

- Custom color support expanded to the browser-native color functions — `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, and `color()` — alongside `#hex`, `rgb()`/`rgba()`, and `hsl()`/`hsla()`. The `isSafeCssColor` gate also tightens its allowlist, rejecting semicolons, braces, angle brackets, and nested functions. Applies anywhere a `color` accepts a custom value.

- Every bordered component now applies its `--component-*-border-width` token as the `border-width` longhand, so each accepts a 1–4 value pattern for per-side borders. Covers surfaces (`y-card`, `y-menu`, `y-dialog`, `y-popover`, `y-datepicker`, `y-data-grid`, `y-appbar`, `y-sidebar`, `y-tabs`) and controls (`y-checkbox`, `y-radio`, `y-switch`, `y-slider`, `y-progress`). Default rendering is unchanged.

- `y-button` — `--component-button-border-width` is now applied as the `border-width` longhand, so it accepts a 1–4 value pattern for per-side widths (e.g. `0 0 2px 0`). The `--component-button-outline-border` override now controls border style and color only.

- Form fields (`y-input`, `y-textarea`, `y-select`, `y-color`, `y-date`) — `--component-inputs-border-width` is now applied as the `border-width` longhand on every field surface, including the `y-select` dropdown panel and the `y-color` picker popup, so it accepts a 1–4 value pattern for per-side borders.

- `y-button` — new `padding-mode` attribute (`auto` / `square` / `wide`): `auto` makes icon-only buttons square, `square`/`wide` force it. Padding can also be set per-axis via `--component-button-padding-block-{size}` / `--component-button-padding-inline-{size}`. `y-paginator` and `y-datepicker` day/month/year buttons use `padding-mode="square"`.

- `y-select` — new opt-in `portal` attribute renders the dropdown into the nearest enclosing `<y-theme>` (falling back to `<body>`) so it escapes scrollable or clipped ancestors while keeping the active theme.

- `y-switch` — the "on" state now tints the track and border with the switch color (derived from `on-color`); tint strength is themeable via `--component-switch-on-fill-opacity` (16% default).

- `y-break` — the divider line now uses the semantic border color (`base.border`), and the host applies default perpendicular spacing via the new `--component-break-spacing` token (defaults to `--spacing-medium`).

- `y-checkbox` — the default color themes now mark a checked box with a translucent primary fill, a primary border, and a primary-colored check (via the `--component-checkbox-checked-*` hooks).

- `y-radio` — the default color themes now color a selected radio's border with the primary color (via `--component-radio-checked-border-color`). Themes that already define their own checked styling are unchanged.

- `y-rating` — selected icons now swap in the registered `filled` weight variant, falling back to the thick stroke when none is available.

- `y-paginator` — the page-button list now auto-shrinks to fit the host width, growing back when space allows.

### Fixed

- `y-theme` — theme tokens no longer leak across nested `<y-theme>` boundaries.

- `y-theme` — switching themes now clears the previous theme's CSS custom properties from the host, so tokens defined only by the outgoing theme no longer linger inline until reload.

- Portaled overlays now inherit the active theme. `y-help`, `y-popover` (`portal` mode), and `y-select` (`portal` mode) rendered into `document.body`, escaping the `<y-theme>` subtree and falling back to the un-themed palette. They now mount into the nearest enclosing `<y-theme>`, walking up across shadow boundaries so it also works inside another component's shadow root, and fall back to `document.body` when there is no theme ancestor.

- `y-button` — no longer throws when `color` is set to an unrecognized value; it falls back to the `base` theme instead of crashing while reading the color-token map.

- `y-datepicker` — reworked the month and year pickers. The month picker (`show-days="false"`) now shows a selectable year dropdown in its header (toggled by `show-years`) above the twelve months; the year picker (`show-months="false"`) bounds its scrollable grid with start/end year inputs. Clicking a month or year selects it and fires `change`.

- `y-droplist` — touch drag now works on iOS Safari and Chrome Android. `touch-action: none` is applied to the press target at decoration time rather than from `pointerdown`, so mobile browsers no longer preempt the press as a scroll.

- `y-tabs` — the tab panel no longer creates a stacking context (`z-index: 0` removed), which had trapped `position: fixed` overlays from slotted components beneath the tab strip.

- `y-menu` — a menu taller than the viewport now caps its height and scrolls internally. Scrolling engages only on genuine overflow, so normal menus keep their CSS flyout submenus.

- `y-menu` — a menu anchored to a disabled trigger no longer opens on click. The anchor's disabled state (native `disabled`, reflected `disabled`, or `aria-disabled="true"`) is checked at click time.

- `y-menu` — selected items now use the primary-inverse content color, keeping labels readable against the selected background across themes.

- `y-sidebar` — nav/footer icons now stay aligned between expanded and collapsed states under themes whose borders use a multi-value width. The icon-column width is derived from the sidebar's resolved horizontal border instead of a `calc()` that mishandled the multi-value token.

- `y-appbar` — a stickied appbar now renders its content-facing border correctly under themes with per-side border widths. The sticky styles now use the `border-width` shorthand and zero only the screen-flush edges.

- `y-tabs` — unselected tabs now use a dedicated `--component-tabs-inactive-background` (falling back to `--component-tabs-border-color`), fixing unreadable labels in themes where the border and text colors match.

- Form fields now share one background (`base.background.component`), so a `y-select` matches sibling `y-input` / `y-textarea` / `y-color` / `y-date` fields and the select dropdown matches menus/popovers.

- `y-gallery` — the lightbox z-index was raised from 1000 to 9000 so it layers above fixed chrome like `y-dock`; override via `--component-gallery-expand-z-index`.

- React JSX types (`react.d.ts`) and the bundled AI docs (`llm.txt`, skill reference) were brought back in sync, adding missing attribute types and correcting several defaults. A new `npm run check:docs` gate cross-checks observed attributes against all three docs in `pretest` / `prepublishOnly`.

- `y-drawer` — corners closest to the screen edge are now squared in all themes.

- `y-avatar` — the three `shape` values are now visually distinct: added `--component-avatar-border-radius-rounded` (medium radius) and changed `square` to a zero radius; `circle` is unchanged.

- Corrected the arrow direction on the `left-from-bracket`, `right-from-bracket`, and `left-to-bracket` icons: `*-from-*` arrows now exit the bracket and `*-to-*` enters it.

- `y-tag` — increased inline padding across all sizes.

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
