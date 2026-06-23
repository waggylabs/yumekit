# YumeKit Component API Reference

## Installation & Imports

```bash
npm install @waggylabs/yumekit
```

```javascript
// Full bundle
import "@waggylabs/yumekit";

// Individual components (tree-shakeable, preferred)
import "@waggylabs/yumekit/components/y-theme";
import "@waggylabs/yumekit/components/y-button";

// Icon registry
import { registerIcon, registerIcons, getIcon } from "@waggylabs/yumekit";
import "@waggylabs/yumekit/icons/all.js"; // loads all 60+ pre-built icons

// Styles (if not using y-theme element)
import "@waggylabs/yumekit/styles/blue-light.css";
```

CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@waggylabs/yumekit/dist/yumekit.min.js"></script>
```

---

## Color values

Wherever a `color` attribute accepts a "CSS color value" (`y-button`, `y-badge`, `y-tag`, `y-icon`, `y-rating`, `y-select` per-option, `y-popover`, …), the value is gated through the shared `isSafeCssColor` check. Accepted forms: `#hex`, `rgb()`/`rgba()`, `hsl()`/`hsla()`, and the browser-native functions `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, and `color()`. The gate rejects semicolons, braces, angle brackets, and nested functions; values that fail fall back to a semantic theme default. Predefined scheme names (`base`, `primary`, `secondary`, `success`, `warning`, `error`, `help`) are always available alongside literals.

---

## y-theme

Injects design tokens as CSS custom properties. Wraps entire app.

| Attribute         | Values                                                                        | Notes                                             |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------- |
| `theme`           | `"blue-light"` \| `"blue-dark"` \| `"orange-light"` \| `"orange-dark"` \| URL | Built-in palette or path to custom CSS            |
| `cross-origin`    | boolean                                                                       | Allows loading theme from a different origin      |
| `no-default-font` | boolean                                                                       | Skips injecting the Lexend font from Google Fonts |

```html
<y-theme theme="blue-light">
    <!-- entire app -->
</y-theme>

<!-- custom theme file -->
<y-theme theme="/my-theme.css"></y-theme>

<!-- cross-origin custom theme -->
<y-theme theme="https://example.com/theme.css" cross-origin></y-theme>
```

---

## y-break

A divider that draws a line, optionally broken by centered content (text, icon, or any slotted element).

| Attribute     | Values / Notes                                                                              |
| ------------- | ------------------------------------------------------------------------------------------- |
| `orientation` | `horizontal` (default) \| `vertical` (host needs a height from its container when vertical) |
| `align`       | `start` \| `center` (default) \| `end` — position of centered content along the line        |
| `variant`     | `solid` (default) \| `dashed` \| `dotted` — line style                                      |
| `label`       | Convenience text rendered in the center                                                     |
| `icon`        | Convenience icon name rendered in the center (icon then label when both are set)            |
| `inset`       | `none` (default) \| `small` \| `medium` \| `large` — outer end padding                       |

**Slots:** default — content rendered in the center; takes precedence over `label` / `icon`.

**CSS Parts:** `line`, `line-start`, `line-end`, `content`

**CSS Custom Properties:** `--component-break-line-color` (defaults to `--base-border`), `--component-break-line-thickness`, `--component-break-line-style` (override the `variant`), `--component-break-spacing` (perpendicular padding around the line — block axis when horizontal, inline when vertical; defaults to `--spacing-medium`), `--component-break-gap`, `--component-break-content-color`, `--component-break-content-font-size`, `--component-break-content-font-weight`, `--component-break-inset`, `--component-break-min-length`

```html
<y-break></y-break>
<y-break label="OR"></y-break>
<y-break icon="star" variant="dashed"></y-break>
<y-break align="start"><y-tag color="primary">New section</y-tag></y-break>

<!-- vertical needs a height from the container -->
<div style="display:flex;align-items:stretch;height:40px">
    <span>Left</span>
    <y-break orientation="vertical"></y-break>
    <span>Right</span>
</div>
```

---

## y-breadcrumbs

Navigation breadcrumb trail with collapse/expand support and SPA-friendly navigation.

| Attribute   | Values / Notes                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `items`     | JSON array of `{ text, href?, icon? }` objects                                                              |
| `size`      | `small` \| `medium` (default) \| `large`                                                                    |
| `separator` | Separator character (default: chevron-right icon). Can also use `separator` slot for custom icon separators |
| `max-items` | Number — collapses middle items when count exceeds this value                                               |
| `history`   | Set to `"false"` for full-page navigation instead of `pushState`                                            |

**Events:** `navigate` (cancelable, `detail: { href }`), `expand`

**Slots:** `separator` (custom separator element), `{index}-item` (fully replaces a breadcrumb item's content — use for custom icons, badges, or markup beyond what the `icon` option provides)

**CSS Parts:** `breadcrumbs`, `list`, `item`, `item--current`, `link`, `separator`, `expand-btn`

**CSS Custom Properties:**

- `--component-breadcrumbs-font-size-{size}` — font size per size variant
- `--component-breadcrumbs-gap-{size}` — gap between items per size variant
- `--component-breadcrumbs-color` — link color
- `--component-breadcrumbs-color-hover` — link hover color
- `--component-breadcrumbs-color-current` — current (last) item color
- `--component-breadcrumbs-separator-color` — separator color

```html
<y-breadcrumbs
    items='[{"text":"Home","href":"/"},{"text":"Products","href":"/products"},{"text":"Widget"}]'
    max-items="3"
></y-breadcrumbs>
```

---

## y-button

When `href` is set, the internal element renders as `<a>` instead of `<button>` — all styles, sizes, and color variants apply identically.

| Attribute    | Values / Notes                                                                         |
| ------------ | -------------------------------------------------------------------------------------- |
| `color`      | `base` \| `primary` \| `secondary` \| `success` \| `warning` \| `error` \| `help`      |
| `size`       | `small` \| `medium` \| `large`                                                         |
| `style-type` | `outlined` (default) \| `filled` \| `flat`                                             |
| `padding-mode` | `auto` (default) \| `square` \| `wide` — `square` forces equal block/inline padding (e.g. paginator numbers), `wide` keeps inline padding even when icon-only, `auto` squares icon-only buttons |
| `disabled`   | boolean                                                                                |
| `type`       | `button` (default) \| `submit` \| `reset` — ignored when `href` is set                 |
| `href`       | URL — switches internal element to `<a>`; disabled removes href + sets `aria-disabled` |
| `target`     | e.g. `"_blank"` — only applies when `href` is set                                      |
| `rel`        | e.g. `"noopener noreferrer"` — only applies when `href` is set                         |
| form attrs   | `form`, `formaction`, `formmethod`, `formenctype`, `formnovalidate`, `formtarget`, `autofocus` are reflected to the underlying control |

Slots: default (label), `left-icon`, `right-icon`

```html
<!-- Standard button -->
<y-button color="primary" size="large">
    <y-icon slot="left-icon" name="check" size="small"></y-icon>
    Save
</y-button>

<!-- Link button — renders <a href="/docs"> internally -->
<y-button href="/docs" color="primary" style-type="outlined"
    >Documentation</y-button
>

<!-- External link -->
<y-button
    href="https://example.com"
    target="_blank"
    rel="noopener noreferrer"
    style-type="flat"
>
    External
    <y-icon slot="right-icon" name="arrow-right" size="small"></y-icon>
</y-button>

<!-- Disabled link — href removed, aria-disabled set, pointer-events blocked -->
<y-button href="/restricted" disabled>Unavailable</y-button>
```

CSS Custom Properties (per `small|medium|large`): `--component-button-padding-{size}` (all sides), and `--component-button-padding-block-{size}` / `--component-button-padding-inline-{size}` to override the vertical / horizontal axes independently (fall back to `--component-button-padding-{size}`). The `padding-mode` attribute governs whether the inline axis collapses to the block value (default `auto` = collapse for icon-only buttons). `--component-control-height-{size}` sets min-height (shared with `y-input`; falls back to `--sizing-{size}`). For `style-type="outlined"`: the border is sourced from the button's matching semantic border token (`--base-border`, `--error-border`, …) per `color`, falling back to the text color when that token is unset. `--component-button-border-width` (applied as the `border-width` longhand, default `1px`) accepts a 1–4 value pattern for per-side widths (e.g. `0 0 2px 0`). Optional global overrides: `--component-button-outline-border` (border style + color as a CSS `border` shorthand; its width is superseded by `--component-button-border-width`) and `--component-button-outline-border-color` (border color across all states) — set via CSS or a scoped `y-theme`.

---

## y-button-group

Groups buttons or other elements into a visually connected toolbar. Automatically removes border-radius on inner children and collapses shared borders.

| Attribute     | Values                               |
| ------------- | ------------------------------------ |
| `orientation` | `horizontal` (default) \| `vertical` |

Slot: default (accepts any child elements — typically `y-button`, `y-input`, or `y-select`)

```html
<!-- Basic horizontal group -->
<y-button-group>
    <y-button color="primary">Left</y-button>
    <y-button color="primary">Center</y-button>
    <y-button color="primary">Right</y-button>
</y-button-group>

<!-- Vertical group -->
<y-button-group orientation="vertical">
    <y-button color="base">Top</y-button>
    <y-button color="base">Bottom</y-button>
</y-button-group>

<!-- Mixed: input + button (search bar) -->
<y-button-group>
    <y-input placeholder="Search…"></y-input>
    <y-button style-type="filled" color="primary">
        <y-icon slot="left-icon" name="search" size="small"></y-icon>
    </y-button>
</y-button-group>
```

---

## y-input

Form-associated. Always set `name` inside a `<form>`.

| Attribute        | Values / Notes                                                            |
| ---------------- | ------------------------------------------------------------------------- |
| `type`           | `text` \| `email` \| `password` \| `number` \| `tel` \| `url` \| `search` |
| `name`           | form field name                                                           |
| `value`          | current value                                                             |
| `placeholder`    |                                                                           |
| `label`          | visible label text                                                        |
| `label-position` | `top` (default) \| `bottom` \| `left` \| `right`                          |
| `size`           | `small` \| `medium` \| `large`                                            |
| `variant`        | `default` (full border) \| `underline` (bottom border only, square bottom corners) |
| `disabled`       | boolean                                                                   |
| `readonly`       | boolean                                                                   |
| `required`       | boolean                                                                   |
| `invalid`        | boolean — applies error state                                             |
| `max-length`     | number string                                                             |
| `min-length`     | number string                                                             |
| `min`, `max`, `step` | numeric constraints applied when `type="number"`                      |
| `pattern`        | regex string                                                              |

Events: `change`, `input`

```html
<y-input
    type="email"
    name="email"
    label="Email"
    required
    placeholder="you@example.com"
></y-input>
<y-input type="password" name="password" label="Password" required></y-input>
```

---

## y-textarea

Form-associated. Multi-line text input. A distinct component from `y-input`.

| Attribute        | Values / Notes                                   |
| ---------------- | ------------------------------------------------ |
| `name`           | form field name                                  |
| `value`          | current value                                    |
| `placeholder`    |                                                  |
| `label`          | visible label text                               |
| `label-position` | `top` (default) \| `bottom` \| `left` \| `right` |
| `rows`           | number of visible rows (default: `3`)            |
| `size`           | `small` \| `medium` \| `large`                   |
| `variant`        | `default` \| `underline` (bottom border only, square bottom corners) |
| `disabled`       | boolean                                          |
| `required`       | boolean                                          |
| `invalid`        | boolean — applies error state                    |

Events: `change`, `input`

```html
<y-textarea
    name="message"
    label="Message"
    placeholder="Write something..."
    rows="4"
></y-textarea>
<y-textarea
    name="bio"
    label="Bio"
    disabled
    value="Cannot edit this."
></y-textarea>
```

---

## y-select

Form-associated.

| Attribute      | Values / Notes                                  |
| -------------- | ----------------------------------------------- |
| `options`      | JSON: `[{"value":"a","label":"Option A"}, ...]` |
| `value`        | selected value (or JSON array if `multiple`)    |
| `name`         | form field name                                 |
| `placeholder`  |                                                 |
| `size`         | `small` \| `medium` \| `large`                  |
| `variant`      | `default` \| `underline` (bottom border only on the trigger, square bottom corners) |
| `disabled`     | boolean                                         |
| `required`     | boolean                                         |
| `invalid`      | boolean — error state                           |
| `multiple`     | boolean                                         |
| `searchable`   | boolean — inline filter input (autocomplete)    |
| `clearable`    | boolean — shows a clear (×) button when a value is set |
| `display-mode` | `tag` — render selected items as removable tags (requires `multiple`) |
| `label-position` | `top` (default) \| `bottom`                   |
| `close-on-click-outside` | `"false"` keeps the dropdown open on outside click |
| `portal`       | boolean — render the dropdown into the nearest `<y-theme>` (or `<body>`) to escape clipped / low-stacking ancestors |

Events: `change`

```html
<y-select
    name="role"
    label="Role"
    options='[{"value":"admin","label":"Admin"},{"value":"user","label":"User"}]'
    placeholder="Select a role"
></y-select>
```

---

## y-checkbox

Form-associated.

| Attribute        | Values / Notes                 |
| ---------------- | ------------------------------ |
| `name`, `value`  |                                |
| `checked`        | boolean                        |
| `disabled`       | boolean                        |
| `required`       | boolean                        |
| `indeterminate`  | boolean                        |
| `size`           | `small` \| `medium` \| `large` |
| `label`          | visible label                  |
| `label-position` | `right` (default) \| `left`    |

Events: `change`
CSS Custom Properties: `--component-checkbox-size`, `--component-checkbox-icon-size`, `--component-checkbox-border-radius` (lets checkboxes use a tighter radius than text inputs), `--component-checkbox-border-color`, `--component-checkbox-background`, `--component-checkbox-color`, `--component-checkbox-accent`; checked/indeterminate overrides (fall back to the unchecked values) `--component-checkbox-checked-background`, `--component-checkbox-checked-border-color`, `--component-checkbox-checked-icon-color`

---

## y-radio

Form-associated. Group by giving the same `name`, or render a managed group from one element via `options`.

| Attribute        | Values / Notes                 |
| ---------------- | ------------------------------ |
| `name`, `value`  |                                |
| `checked`        | boolean                        |
| `disabled`       | boolean                        |
| `required`       | boolean                        |
| `options`        | JSON: `[{"value":"a","label":"Option A"}, ...]` — render a managed radio group |
| `size`           | `small` \| `medium` \| `large` |
| `label`          |                                |
| `label-position` | `right` (default) \| `left`    |

Events: `change`
CSS Custom Properties: `--component-radio-size`, `--component-radio-dot-size`, `--component-radio-background`, `--component-radio-color` (border), `--component-radio-accent` (dot); checked-state overrides (fall back to the unchecked values) `--component-radio-checked-background`, `--component-radio-checked-border-color`, `--component-radio-checked-dot-color`

---

## y-switch

Form-associated.

| Attribute        | Values / Notes                 |
| ---------------- | ------------------------------ |
| `name`, `value`  |                                |
| `checked`        | boolean                        |
| `disabled`       | boolean                        |
| `required`       | boolean                        |
| `size`           | `small` \| `medium` \| `large` |
| `on-color`       | scheme or CSS color for the track when checked (default `primary`) |
| `off-color`      | scheme or CSS color for the track when unchecked |
| `animate`        | `"false"` disables the slide transition |
| `toggle-label`   | boolean — inline on/off text inside the track (`on-label` / `off-label` slots) |
| `label`          |                                |
| `label-position` | `right` \| `left`              |

Events: `change`
Slots: `label`, `on-label`, `off-label`

---

## y-slider

Form-associated.

| Attribute                             | Values / Notes                   |
| ------------------------------------- | -------------------------------- |
| `name`, `value`, `min`, `max`, `step` | `value` reads/writes `"min,max"` in range mode |
| `disabled`                            | boolean                          |
| `required`                            | boolean                          |
| `size`                                | `small` \| `medium` \| `large`   |
| `color`                               | scheme or CSS color for the track fill and thumb (default `primary`) |
| `orientation`                         | `horizontal` (default) \| `vertical` |
| `range`                               | boolean — two-thumb range slider (uses `value-min` / `value-max`) |
| `value-min`, `value-max`              | the two thumb positions in range mode (default `min` / `max`) |
| `min-gap`                             | minimum gap between thumbs in range mode (default: `step`) |
| `ticks`                               | `"true"` (mark per step), a number `N` (N intervals), or JSON array of positions `"[0,25,50,100]"` |
| `tick-labels`                         | boolean — value labels beneath ticks |
| `snap-to-ticks`                       | boolean — snap to nearest tick instead of step |
| `show-value`                          | `none` (default) \| `always` \| `dragging` — value bubble |
| `value-position`                      | `start` \| `end` (default: `start` horizontal, `end` vertical) |
| `aria-label-min`, `aria-label-max`    | accessible labels for the lower / upper thumbs |

Events: `change`, `input`

---

## y-splitter

Two-pane container with a draggable resize handle. The first child becomes the resizable pane (`pane-1`); the second flexes to fill the remainder (`pane-2`). The component auto-assigns `slot="pane-1"` / `slot="pane-2"` to the first two non-handle children — extra children are ignored with a console warning. Host needs a sized container (it stretches to fill 100% width × 100% height).

| Attribute         | Values / Notes                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `orientation`     | `horizontal` (default, splits left/right) \| `vertical` (splits top/bottom)                     |
| `split`           | number `0.0`–`1.0`, ratio of the first pane (default `0.5`); reflects current value during drag |
| `min-ratio`       | minimum ratio for pane 1 (default `0.1`)                                                        |
| `max-ratio`       | maximum ratio for pane 1 (default `0.9`)                                                        |
| `disabled`        | boolean — disables drag and keyboard resizing                                                   |
| `handle-size`     | width (horizontal) / height (vertical) of the drag handle in pixels (default `10`)              |
| `handle-position` | `center` (default) \| `start` \| `end` — where the visible line/grip sits within the handle     |
| `aria-label`      | overrides the handle's default `"Resizable splitter"` label                                     |

**Events:** `split-changed` (`{ split, orientation, source }`), `split-start` (`{ x, y }`), `split-end` (`{ x, y }`)

**Slots:** default — first two non-handle children become pane 1 / pane 2 (slot attribute auto-assigned). `handle` — custom drag-handle content; defaults to a centered ellipsis grip icon.

**CSS Parts:** `container`, `pane-1`, `pane-2`, `handle`, `grip`

**CSS Custom Properties:** `--component-splitter-handle-size`, `--component-splitter-handle-background`, `--component-splitter-handle-hover-background`, `--component-splitter-handle-active-background`, `--component-splitter-handle-border-color`, `--component-splitter-handle-border-width`, `--component-splitter-handle-grip-color`, `--component-splitter-handle-active-grip-color`, `--component-splitter-grip-size`, `--component-splitter-cursor`

**Keyboard (handle focused):** Arrow Left / Down decreases by 1%, Arrow Right / Up increases by 1%, PageDown / PageUp adjust by 10%, Home / End jump to `min-ratio` / `max-ratio`. The handle has `role="slider"` with `aria-valuemin/max/now/text/orientation`. Pointer events cover both mouse and touch; updates are throttled with `requestAnimationFrame`.

```html
<div style="width:600px;height:300px">
    <y-splitter split="0.3" min-ratio="0.2" max-ratio="0.8">
        <nav>Sidebar</nav>
        <main>Content</main>
    </y-splitter>
</div>

<!-- Vertical split with a custom handle -->
<y-splitter orientation="vertical" handle-size="14">
    <section>Editor</section>
    <section>Console</section>
    <span slot="handle"><y-icon name="ellipsis-h"></y-icon></span>
</y-splitter>
```

---

## y-grid

CSS-Grid layout container. Pure CSS — no observer, no event. Use `y-masonry` for shortest-column packing, or `y-stack` for flex layouts.

| Attribute         | Values / Notes                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`         | integer (default `3`) → `repeat(N, 1fr)`; `"auto"` → `repeat(auto-fit, minmax(min-item-width, 1fr))`; raw template string passed through |
| `rows`            | integer or raw `grid-template-rows` value (default unset)                                                                                |
| `auto-flow`       | `row` (default) \| `column` \| `row dense` \| `column dense`                                                                             |
| `auto-rows`       | raw `grid-auto-rows` value (e.g. `"minmax(100px, auto)"`)                                                                                |
| `auto-columns`    | raw `grid-auto-columns` value                                                                                                            |
| `gap`             | `none` \| `x-small` \| `small` \| `medium` (default) \| `large` \| `x-large` \| `2x-large` \| `4x-large` — maps to `--spacing-*` tokens  |
| `row-gap`         | same scale as `gap`; overrides row gap independently                                                                                     |
| `column-gap`      | same scale as `gap`; overrides column gap independently                                                                                  |
| `align`           | `start` \| `center` \| `end` \| `stretch` (default) \| `baseline` — maps to `align-items`                                                |
| `justify`         | `start` \| `center` \| `end` \| `stretch` (default) — maps to `justify-items`                                                            |
| `align-content`   | `start` \| `center` \| `end` \| `stretch` (default) \| `between` \| `around` \| `evenly`                                                 |
| `justify-content` | same set as `align-content`, default `start`                                                                                             |
| `min-item-width`  | minimum item width for `columns="auto"` and responsive collapse (default `240px`)                                                        |
| `responsive`      | boolean (default `true`); set `responsive="false"` to opt out. Only applies when `columns` is an integer.                                |
| `dense`           | boolean shortcut for `auto-flow="row dense"`                                                                                             |

Slot: default (grid items). Children may use `style="grid-column: span 2"` or similar to span tracks.

Responsive behavior (integer `columns` only — raw template strings and `columns="auto"` opt out automatically): uses `repeat(auto-fit, minmax(...))` keyed off `min-item-width`. Items shrink toward `min-item-width` and the column count drops smoothly as the container narrows.

A11y: layout-only — no role or ARIA. Tab order follows DOM order; in `dense` mode the visual order may diverge from the focus order.

CSS Custom Properties: `--component-grid-columns`, `--component-grid-rows`, `--component-grid-gap`, `--component-grid-row-gap`, `--component-grid-column-gap`, `--component-grid-min-item-width` (default `240px`), `--component-grid-auto-rows`, `--component-grid-auto-columns`

CSS Parts: `container`

```html
<!-- Card grid, responsive -->
<y-grid columns="3" gap="large" responsive>
    <y-card>...</y-card>
    <y-card>...</y-card>
    <y-card>...</y-card>
</y-grid>

<!-- Auto-fit at min item width -->
<y-grid columns="auto" min-item-width="200px" gap="medium">
    <y-card>...</y-card>
</y-grid>

<!-- Item spans -->
<y-grid columns="4" gap="medium" responsive="false">
    <y-card style="grid-column: span 2">Wide</y-card>
    <y-card>1</y-card>
    <y-card>1</y-card>
</y-grid>
```

---

## y-masonry

Layout container that packs children of varying heights into the shortest column via JS positioning. Use `y-grid` for uniform CSS-Grid layouts.

| Attribute    | Values / Notes                                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `columns`    | integer column count (default `3`)                                                                                                      |
| `gap`        | `none` \| `x-small` \| `small` \| `medium` (default) \| `large` \| `x-large` \| `2x-large` \| `4x-large` — maps to `--spacing-*` tokens |
| `row-gap`    | same scale as `gap`; overrides row gap independently                                                                                    |
| `column-gap` | same scale as `gap`; overrides column gap independently                                                                                 |
| `responsive` | boolean (default `true`); set `responsive="false"` to opt out                                                                           |

Slot: default (masonry items). Child `grid-column` / `grid-row` styles are ignored — masonry is JS-positioned.

Events: `y-masonry-layout` — `{ columns, containerWidth }`, fires after each settle (deduped on no-change).

Methods: `relayout()` — force an immediate repack. Use after async height changes a `ResizeObserver` won't catch synchronously (e.g. an image loading and updating its intrinsic size).

Responsive behavior: drops to `1` column at or below `--component-masonry-mobile-breakpoint` (576px default) and `min(2, columns)` at or below `--component-masonry-tablet-breakpoint` (768px default), measured against container width.

A11y: layout-only — no role or ARIA. Tab order follows DOM order; visual order may diverge from focus order.

CSS Custom Properties: `--component-masonry-gap`, `--component-masonry-row-gap`, `--component-masonry-column-gap`, `--component-masonry-mobile-breakpoint` (default `576px`), `--component-masonry-tablet-breakpoint` (default `768px`)

CSS Parts: `container`

```html
<y-masonry columns="3" gap="large">
    <y-card>Short content</y-card>
    <y-card
        >Tall content with extra paragraphs to demonstrate the packing.</y-card
    >
    <y-card>Medium content here.</y-card>
</y-masonry>
```

---

## y-stack

Flexbox layout container for rows or columns. Purely structural — no visual styling. For CSS Grid layouts use [`y-grid`](#y-grid); for shortest-column packing use [`y-masonry`](#y-masonry).

| Attribute       | Values / Notes                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `direction`     | `row` (default) \| `row-reverse` \| `column` \| `column-reverse` — maps to `flex-direction`                                                                                                                                                                                                      |
| `wrap`          | `nowrap` (default) \| `wrap` \| `wrap-reverse`. Boolean presence (no value) resolves to `wrap` for back-compat.                                                                                                                                                                                  |
| `gap`           | `none` \| `x-small` \| `small` \| `medium` (default) \| `large` \| `x-large` \| `2x-large` \| `4x-large` — maps to `--spacing-*` tokens                                                                                                                                                          |
| `row-gap`       | same scale as `gap`; overrides row gap independently                                                                                                                                                                                                                                             |
| `column-gap`    | same scale as `gap`; overrides column gap independently                                                                                                                                                                                                                                          |
| `align`         | `start` \| `center` \| `end` \| `stretch` (default) \| `baseline` — maps to `align-items`                                                                                                                                                                                                        |
| `justify`       | `start` (default) \| `center` \| `end` \| `between` \| `around` \| `evenly` — maps to `justify-content`                                                                                                                                                                                          |
| `align-content` | `start` \| `center` \| `end` \| `stretch` (default) \| `between` \| `around` \| `evenly` — maps to `align-content` (only meaningful with wrap)                                                                                                                                                   |
| `inline`        | boolean — use `display: inline-flex` instead of `flex`                                                                                                                                                                                                                                           |
| `responsive`    | boolean (default `true`). On `direction="row"`/`row-reverse`, auto-enables `wrap` and collapses to `column` below the mobile breakpoint (measured against the stack's own container width). This collapse behavior does not apply when `inline` is present. Set `responsive="false"` to opt out. |

Slot: default (child elements to lay out)

CSS Custom Properties: `--component-stack-gap`, `--component-stack-row-gap`, `--component-stack-column-gap`, `--component-stack-mobile-breakpoint` (default `576px`)

CSS Parts: `container`

Migration: `<y-stack mode="grid" …>` → [`<y-grid …>`](#y-grid); `<y-stack mode="masonry" …>` → [`<y-masonry …>`](#y-masonry).

```html
<!-- Row of buttons -->
<y-stack direction="row" gap="small">
    <y-button>Save</y-button>
    <y-button>Cancel</y-button>
</y-stack>

<!-- Vertical form -->
<y-stack direction="column" gap="medium">
    <y-input label="Name"></y-input>
    <y-input label="Email"></y-input>
</y-stack>

<!-- Wrapping toolbar with separate row/column gaps -->
<y-stack direction="row" wrap row-gap="x-small" column-gap="large">
    <y-button>One</y-button>
    <y-button>Two</y-button>
    <y-button>Three</y-button>
</y-stack>

<!-- Inline-flex action group inside flowing text -->
<p>
    Confirm
    <y-stack inline gap="x-small">
        <y-button size="small" color="primary">Yes</y-button>
        <y-button size="small">No</y-button>
    </y-stack>
    to continue.
</p>
```

---

## y-icon

SVG icon renderer. Only use icon names from the registry.

| Attribute | Values / Notes                                                |
| --------- | ------------------------------------------------------------- |
| `name`    | registered icon name (required)                               |
| `size`    | `small` \| `medium` \| `large`                                |
| `color`   | color scheme name or CSS color value                          |
| `weight`  | `thin` \| `regular` (default) \| `thick`                      |
| `label`   | accessible label (sets aria-label); omit for decorative icons |

Pre-built icon names (loaded with `icons/all.js`): `accessible`, `eye`, `eye-off`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `check`, `close`, `copy`, `download`, `edit`, `trash`, `bell`, `chat`, `email`, `phone`, `camera`, `image`, `mic`, `play`, `pause`, `home`, `menu`, `search`, `settings`, `expand-left`, `expand-right`, `lock`, `star`, `heart`, `info`, `warning`, `error`, `campfire`, and more.

```html
<y-icon name="check" size="large" color="success" label="Confirmed"></y-icon>
<y-icon name="trash" color="error"></y-icon>
<!-- decorative, no label -->
```

---

## y-badge

Overlays a count/status on another element.

| Attribute   | Values / Notes                                  |
| ----------- | ----------------------------------------------- |
| `value`     | text displayed inside the badge                 |
| `color`     | color scheme name (default `primary`)           |
| `position`  | `top` (default) \| `bottom` — vertical          |
| `alignment` | `left` \| `right` (default) — horizontal        |
| `size`      | `small` (default) \| `medium` \| `large`        |

Slots: default (the element the badge overlays)

```html
<y-badge color="error" value="5" position="top" alignment="right">
    <y-button>Notifications</y-button>
</y-badge>
```

---

## y-avatar

| Attribute | Values / Notes                                     |
| --------- | -------------------------------------------------- |
| `src`     | image URL                                          |
| `alt`     | alt text; shown as initials when image unavailable |
| `shape`   | `circle` (default) \| `square` \| `rounded`        |
| `size`    | `small` \| `medium` \| `large`                     |
| `color`   | color scheme for initials background               |

```html
<y-avatar
    src="/avatar.jpg"
    alt="Jane Doe"
    shape="circle"
    size="large"
></y-avatar>
<y-avatar alt="JD" color="primary" size="medium"></y-avatar>
<!-- initials fallback -->
```

---

## y-tag

| Attribute    | Values / Notes                             |
| ------------ | ------------------------------------------ |
| `color`      | color scheme name                          |
| `size`       | `small` \| `medium` \| `large`             |
| `style-type` | `filled` (default) \| `outlined` \| `flat` |
| `shape`      | `square` (default) \| `round`              |
| `removable`  | boolean — shows close button               |

Events: `remove`

Slot: default (label text)

```html
<y-tag color="primary" removable>JavaScript</y-tag>
<y-tag color="success" style-type="outlined" shape="round">Active</y-tag>
<y-tag color="base" style-type="flat">Draft</y-tag>
```

---

## y-rating

Form-associated. Renders a row of icons; icons up to `value` are filled, the rest are muted.

| Attribute  | Values / Notes                                                |
| ---------- | ------------------------------------------------------------- |
| `icon`     | registered icon name (default: `star`)                        |
| `color`    | color scheme for filled icons (default: `primary`)            |
| `max`      | total number of icons (default: `5`)                          |
| `value`    | current rating 0–max (default: `0`)                           |
| `size`     | `small` \| `medium` (default) \| `large`                      |
| `name`     | form field name                                               |
| `disabled` | boolean                                                       |
| `readonly` | boolean — shows value, no interaction                         |
| `required` | boolean — prevents clearing to 0 by re-clicking current value |

Events: `change` — `event.detail.value`

```html
<y-rating name="score" value="3" icon="star" color="warning"></y-rating>
<y-rating value="4" icon="heart" color="error" readonly></y-rating>
<y-rating value="0" max="10" icon="star" color="primary"></y-rating>
```

---

## y-progress

| Attribute        | Values / Notes                 |
| ---------------- | ------------------------------ |
| `value`          | number `min`–`max`             |
| `values`         | JSON array of numbers — multiple segments/series |
| `min`, `max`     | numeric bounds (default `0` / `100`) |
| `step`           | numeric step                   |
| `mode`           | `bar` (default) \| `ring` \| `pie` |
| `indeterminate`  | boolean — animated loading state |
| `disabled`       | boolean                        |
| `color`          | color scheme name or CSS color |
| `track-color`    | scheme or CSS color for the unfilled track |
| `size`           | `small` \| `medium` \| `large` |
| `thickness`      | `small` \| `medium` (default) \| `large` — bar/ring thickness |
| `label-display`  | `"false"` hides the label (default shown) |
| `label-format`   | `percent` (default) \| `value` \| `fraction` |
| `segmented`      | boolean or number — split the bar into N segments |
| `segment-gap`    | gap between segments           |
| `start-angle`    | ring/pie start angle in degrees (default `0`) |
| `direction`      | `clockwise` (default) \| `counterclockwise` — ring/pie sweep |

```html
<y-progress value="65" color="primary"></y-progress>
<y-progress indeterminate color="secondary"></y-progress>
<y-progress mode="ring" value="70" thickness="large"></y-progress>
```

---

## y-tooltip

| Attribute  | Values / Notes                                   |
| ---------- | ------------------------------------------------ |
| `text`     | tooltip content (required)                       |
| `position` | `top` (default) \| `bottom` \| `left` \| `right` |
| `color`    | scheme or CSS color for the background; text auto-contrasted |
| `delay`    | show delay in ms (default `200`)                 |
| `open`     | boolean — force open programmatically (bypasses hover/focus) |

Slot: default (trigger element)

```html
<y-tooltip text="Remove this item" position="top">
    <y-button color="error" style-type="flat"
        ><y-icon name="trash"></y-icon
    ></y-button>
</y-tooltip>
```

---

## y-code

Lightweight, dependency-free code block. Renders slotted text with optional line numbers, copy button, filename header, and a `max-lines` collapse. A built-in tokenizer covers **JavaScript** (aliases: `js` / `jsx` / `mjs` / `cjs`), **TypeScript** (aliases: `ts` / `tsx` / `mts` / `cts`), **JSON**, **CSS**, **Python** (aliases: `py` / `python3`), **Bash** (aliases: `sh` / `shell` / `zsh`), and **HTML** (aliases: `htm` / `xml` / `svg`); other languages fall back to plain text. The HTML tokenizer treats `<style>` and `<script>` bodies as text rather than recursively tokenizing them. Consumers can also pipe an external highlighter's output (Prism, shiki, etc.) through the sanitized `highlighted` slot — that path takes precedence when present.

| Attribute       | Values / Notes                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `language`      | string — built-in tokenizers: `javascript` (`js` / `jsx` / `mjs` / `cjs`), `typescript` (`ts` / `tsx` / `mts` / `cts`), `json`, `css`, `python` (`py` / `python3`), `bash` (`sh` / `shell` / `zsh`), `html` (`htm` / `xml` / `svg`). Anything else renders as plain text. Also used in the `aria-label`. Default `"text"`. |
| `line-numbers`  | boolean — when set, line numbers render and each line becomes a click/keyboard target that copies it |
| `max-lines`     | number — caps visible lines; an expand toggle reveals the rest                                       |
| `wrap`          | boolean — wraps long lines (otherwise the block scrolls horizontally)                                |
| `filename`      | string — renders a header bar with the filename and copy button                                      |
| `copyable`      | defaults to `true` — copy button shown by default; `copyable="false"` to hide                        |
| `disabled`      | boolean — suppresses interactive affordances; source still renders                                   |
| `copy-label`    | string — idle copy-button text (default `"Copy"`)                                                    |
| `copied-label`  | string — post-copy feedback text (default `"Copied!"`)                                               |

Slots: (default) raw source code — plain text (escape `<` and `&`) **or** wrap the source in a `<template>` child so the browser preserves it verbatim without escaping (preferred for HTML / XML / SVG samples; if any `<template>` is present it becomes the source). `highlighted` — sanitized pre-highlighted markup (allowlist: `<span>` with class names from common highlighter tokens). `header` — extra header content.

Events (non-cancelable): `copy` (`{ source, target: "block" | "line", lineIndex? }`), `copy-fail` (`{ error }`), `language-change` (`{ language }`).

Methods: `copyBlock()`, `copyLine(index)`, `setLanguage(lang)`.

CSS Parts: `header`, `filename`, `copy-button`, `copy-feedback`, `pre`, `code`, `line`, `line-number`, `expand-toggle`.

**Security / trust model.** The default slot is safe with any input — text is read via `textContent` (or `template.innerHTML` for the `<template>` shortcut) and rendered into shadow DOM via `createTextNode`, so the source string is never re-parsed as HTML. The **`highlighted` slot requires markup from a trusted source**: the sanitizer protects what y-code renders into shadow DOM (allowlist of `<span>` + token class names), but the browser parses the slotted light-DOM children before this component upgrades, so any `<script>` tag inside the slot will execute regardless of our sanitizer. Pipe Prism / shiki output through it; never wire it directly to untrusted user input. The `<template>` shortcut is a DX convenience, not a security boundary.

```html
<y-code language="javascript" filename="hello.js" line-numbers>
function hello() {
    return "world";
}
</y-code>

<!-- Pre-highlighted via an external highlighter -->
<y-code language="javascript">
    <div slot="highlighted"><span class="token keyword">const</span> x = <span class="token number">1</span>;</div>
</y-code>
```

---

## y-card

| Attribute | Values / Notes               |
| --------- | ---------------------------- |
| `color`   | color scheme name            |
| `raised`  | boolean — elevated drop shadow |

Slots: `image` (flush, no padding, clips to card border radius), `header`, `footer`, default (body)

```html
<y-card>
    <span slot="header">Card Title</span>
    <p>Card body content here.</p>
    <y-button slot="footer" color="primary">Action</y-button>
</y-card>

<!-- Card with flush image -->
<y-card>
    <img
        slot="image"
        src="/photo.jpg"
        alt="..."
        style="width:100%;height:160px;object-fit:cover;display:block;"
    />
    <span slot="header">Image Card</span>
    <p>Body content.</p>
</y-card>
```

---

## y-appbar

| Attribute           | Values / Notes                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `items`             | JSON: `[{"text":"Home","icon":"home","href":"/","children":[...]}]`                           |
| `size`              | `small` \| `medium` (default) \| `large`                                                      |
| `menu-direction`    | `right` \| `down` (default)                                                                   |
| `sticky`            | `start` \| `end` — `start` sticks to the top edge; `end` sticks to the bottom edge            |
| `mobile-breakpoint` | px width below which bar collapses to a hamburger menu (default: `768`)                       |
| `history`           | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href` |

Item object fields: `text`, `icon` (icon name or inline SVG), `href`, `selected`, `slot`, `children`

Events: `navigate` — cancelable; `event.detail.href`. Fires before navigation when an item with `href` is clicked.

Slots: `logo`, `title`, `header`, `footer`, default (router links / custom nav elements shown in bar body and inside mobile hamburger panel)

```html
<!-- Basic horizontal appbar -->
<y-appbar
    sticky="start"
    items='[{"text":"Home","icon":"home","href":"/"},{"text":"Settings","icon":"gear","href":"/settings"}]'
>
    <y-icon slot="logo" name="bolt" size="medium"></y-icon>
    <span slot="title">MyApp</span>
</y-appbar>

<!-- React Router integration — intercept navigate event -->
<y-appbar id="appbar" items="[...]"></y-appbar>
<script type="module">
    document.getElementById("appbar").addEventListener("navigate", (e) => {
        e.preventDefault();
        // hand off to your SPA router, e.g. React Router's navigate()
        myRouter.navigate(e.detail.href);
    });
</script>

<!-- Full-page navigation (opt out of pushState) -->
<y-appbar history="false" items='[{"text":"Home","href":"/"}]'></y-appbar>
```

---

## y-sidebar

| Attribute        | Values / Notes                                                                                |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `collapsed`      | boolean — collapses sidebar to icon-only width                                                |
| `items`          | JSON: `[{"text":"Dashboard","icon":"home","href":"/","selected":true,"children":[...]}]`      |
| `size`           | `small` \| `medium` (default) \| `large`                                                      |
| `menu-direction` | `right` (default) \| `down` — direction submenus pop out                                      |
| `sticky`         | `start` \| `end` — sticks to left (start) or right (end) viewport edge                        |
| `history`        | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href` |

Item object fields: `text`, `icon` (icon name or inline SVG), `href`, `selected`, `slot`, `children`

Events: `navigate` — cancelable; `event.detail.href`. Fires before navigation when an item with `href` is clicked.

Methods: `.toggle()` — flip collapsed state

Slots: `logo`, `title`, `header`, `footer`, default (router links / custom nav elements)

Host-exposed CSS vars: `--y-sidebar-collapsed` (`0`/`1`), `--y-sidebar-icon-col-width` — slotted items can read these.

All `--component-sidebar-*` tokens fall back to `--component-appbar-*` so existing appbar theme tokens apply automatically.

```html
<!-- Basic sticky sidebar -->
<y-sidebar
    sticky="start"
    items='[{"text":"Dashboard","icon":"home","href":"/","selected":true},{"text":"Projects","icon":"folder","href":"/projects"}]'
>
    <img slot="logo" src="/logo.svg" alt="" width="32" />
    <span slot="title">MyApp</span>
</y-sidebar>

<!-- With framework router links in default slot -->
<y-sidebar items='[{"text":"Dashboard","icon":"home","href":"/"}]'>
    <router-link to="/projects">Projects</router-link>
    <router-link to="/settings">Settings</router-link>
</y-sidebar>

<!-- Custom slotted item that responds to collapse state -->
<style>
    .my-link {
        display: flex;
        align-items: center;
        width: 100%;
    }
    .my-link .label {
        opacity: calc(1 - var(--y-sidebar-collapsed, 0));
        max-width: calc((1 - var(--y-sidebar-collapsed, 0)) * 200px);
        overflow: hidden;
        white-space: nowrap;
        transition: opacity 0.2s ease, max-width 0.2s ease;
    }
</style>
<y-sidebar id="nav">
    <a class="my-link" href="/reports">
        <y-icon name="waveform"></y-icon>
        <span class="label">Reports</span>
    </a>
</y-sidebar>
```

---

## y-drawer

| Attribute   | Values / Notes                                                                       |
| ----------- | ------------------------------------------------------------------------------------ |
| `visible`   | boolean — toggle to open/close (also a property: `el.visible = true`)                |
| `anchor`    | element ID (no `#`) of a trigger element; clicking it toggles the drawer automatically |
| `position`  | `left` (default) \| `right` \| `top` \| `bottom`                                     |
| `resizable` | boolean — adds a drag handle for resizing                                            |

Events: `open`, `close`

Slots: `header`, `body`, `footer` — **named slots only**; content without a `slot` attribute is not rendered

```html
<y-drawer id="nav-drawer" position="left" anchor="open-nav-btn">
    <strong slot="header">Navigation</strong>
    <nav slot="body">
        <y-button style-type="flat">Dashboard</y-button>
        <y-button style-type="flat">Settings</y-button>
    </nav>
</y-drawer>

<script type="module">
    document.getElementById("nav-drawer").visible = true;
</script>
```

---

## y-droplist

Drag-and-drop reorderable list. Supports within-list reordering, cross-list groups, clone/pull/put policies, drag handles, and swap mode.

| Attribute             | Values / Notes                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`            | boolean — disables drag and keyboard reorder                                                                                                   |
| `vertical`            | default vertical; set `vertical="false"` to reorder horizontally                                                                               |
| `animation`           | settle-animation duration in ms (default `150`); `0` disables                                                                                  |
| `group`               | string — name of the cross-list drag group; lists sharing a name can exchange items                                                            |
| `clone`               | boolean — drops insert a copy at the destination; the original stays at its source index                                                       |
| `pull`                | `"true"` (default) \| `"clone"` \| `"false"` — controls whether items can be dragged out; `"clone"` leaves a copy, `"false"` blocks pulling    |
| `put`                 | `"true"` (default) \| `"false"` \| comma-separated group names — controls which sources this list accepts; `"false"` rejects all incoming      |
| `handle`              | CSS selector — restricts drag initiation to matching child elements; invalid selectors warn and fall back to whole-item drag                   |
| `prevent-on-filter`   | boolean (default `true`) — when `handle` is set, calls `preventDefault()` on non-handle `pointerdown` to suppress text selection               |
| `swap`                | boolean — dropping over an item swaps the two in place instead of inserting between them; same-list only                                       |
| `swap-class`          | CSS class on the active swap target (default `y-droplist__swap-target`)                                                                        |
| `invert-swap-element` | boolean (default `true`) — `true`: swap target is the item under the cursor; `false`: item whose midpoint the cursor has crossed               |
| `ghost-class`         | CSS class on the drop placeholder (default `y-droplist__ghost`)                                                                                |
| `drag-class`          | CSS class on the dragged item (default `y-droplist__dragging`)                                                                                 |
| `drag-preview`        | boolean — when present, a cursor-following clone of the dragged item is rendered during the drag (distinct from the in-list ghost placeholder) |
| `drag-preview-class`  | CSS class applied to the preview element (default `y-droplist__drag-preview`)                                                                  |
| `drag-preview-offset` | `"cursor"` (default) \| `"center"` \| `"top-left"` — where the preview anchors relative to the cursor; `"cursor"` preserves the grab offset    |
| `drag-preview-scale`  | number (default `1`) — scale factor applied via `transform: scale()` to the preview; use `< 1` for a shrunken card                             |

**Events:**

| Event          | Detail                                      | Cancelable | Notes                                                                                                       |
| -------------- | ------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `drag:start`   | `{ originalEvent, item, list }`             | no         | Fired on the source list when a drag begins                                                                 |
| `drag:end`     | `{ originalEvent, item, list }`             | no         | Fired on the source list when a drag ends (drop or cancel)                                                  |
| `drag:enter`   | `{ originalEvent, item, list, from }`       | no         | Fired on a target list when the drag enters it (cross-list only)                                            |
| `drag:leave`   | `{ originalEvent, item, list, to }`         | no         | Fired on a list when the drag leaves it (cross-list only)                                                   |
| `drag:preview` | `{ item, preview, list }`                   | **yes**    | Fired after the preview element is created but **before** it is appended to `document.body`; `preventDefault()` cancels it (no insertion)   |
| `reorder`      | `{ oldIndex, newIndex, item, list, from? }` | no         | Fired on the destination list after a successful drop or keyboard move                                      |
| `update`       | `{ item, oldIndex, newIndex, list, from? }` | no         | Fired on both source (cross-list) and destination after every successful drop                               |

For cross-list drops: the source `update` fires first with `newIndex: -1`; the destination `reorder` and `update` fire second with `from` set to the source list. For clone drops `oldIndex` is `-1`.

**Methods:** `toArray()` — returns each direct child's `data-id` in current DOM order. `hasItem(item)` — strict direct-child check (excludes ghost). `destroy()` — removes all listeners and observers.

**Slots:** default — give each item a unique `data-id` so `toArray()` is meaningful. `drag-preview` — optional; when present, the slotted element is deep-cloned and used as the preview content instead of cloning the dragged item. The original node is hidden (`display:none`) during the drag and restored on drop.

**Keyboard:** focus an item, press `ArrowUp`/`ArrowDown` (or `ArrowLeft`/`ArrowRight` when horizontal). When `handle` is set, focus lands on the handle element. A polite `aria-live` region announces moves and swaps.

**CSS Parts:** `list` (shadow-DOM flex wrapper around the slot). The drag preview element carries `part="drag-preview"` but is appended to `document.body` (outside the shadow root), so `::part(drag-preview)` cannot match it — see "Styling the drag preview" below for workable selectors.

**Styling items:** items are slotted light-DOM children — use descendant selectors (`y-droplist > *`, `.y-droplist__dragging`, etc.). `::part()` does not reach light DOM.

**Styling the ghost placeholder:** target `[data-y-droplist-ghost]`, the `ghost-class` value (default `.y-droplist__ghost`), or the `--component-droplist-ghost-*` custom properties. The ghost is the dashed in-list placeholder — distinct from the drag preview.

**Styling the drag preview:** target the class set by `drag-preview-class` (default `.y-droplist__drag-preview`), the `[part="drag-preview"]` attribute selector, or the `--component-droplist-drag-preview-*` custom properties. The preview lives in `document.body` with `position: fixed` and `pointer-events: none`. Note: `::part(drag-preview)` does **not** work — `::part()` only pierces a shadow tree, and the preview is rendered outside any shadow root.

**CSS Custom Properties:**

- `--component-droplist-ghost-opacity`, `--component-droplist-ghost-background`, `--component-droplist-ghost-border-color`
- `--component-droplist-swap-indicator-background`
- `--component-droplist-item-padding`, `--component-droplist-item-margin`
- `--component-droplist-transition-duration`, `--component-droplist-transition-easing`
- `--component-droplist-drag-preview-opacity` (default `0.85`)
- `--component-droplist-drag-preview-shadow` (defaults to the theme-wide `--base-shadow` when unset; if `--base-shadow` is also unset, falls back to the hard-coded `0 4px 12px rgba(0,0,0,0.15)`)
- `--component-droplist-drag-preview-rotate` (default `0deg`; set e.g. `2deg` for a Trello-style tilt)
- `--component-droplist-drag-preview-scale` — applied via `drag-preview-scale` attribute; set directly there rather than as a CSS var
- `--component-droplist-drag-preview-cursor-offset-x`, `--component-droplist-drag-preview-cursor-offset-y` (additive px offsets from the anchor point)
- `--component-droplist-drag-preview-z-index` (default `9999`)

> **Ghost vs. preview:** the ghost (`[data-y-droplist-ghost]`) is the in-list dashed placeholder that tracks where the item will land. The drag preview (`drag-preview` attribute) is the cursor-following visual clone. Both can be active simultaneously. Safari may show both the browser's native drag image and the custom preview because it ignores `setDragImage` — this is a known Safari limitation.

> Supports pointer/touch dragging and auto-scroll during drag interactions.

```html
<!-- Basic reorderable list -->
<y-droplist>
    <div data-id="alpha">Alpha</div>
    <div data-id="bravo">Bravo</div>
    <div data-id="charlie">Charlie</div>
</y-droplist>

<!-- Cross-list Kanban (move between columns) -->
<y-droplist id="todo" group="board" style="display:block"></y-droplist>
<y-droplist id="doing" group="board" style="display:block"></y-droplist>

<!-- Clone from palette into lane (original stays) -->
<y-droplist id="palette" group="board" clone put="false" style="display:block">
    <div data-id="bug">Bug report</div>
</y-droplist>
<y-droplist
    id="lane"
    group="board"
    style="display:block;min-height:64px"
></y-droplist>

<!-- Drag handle -->
<y-droplist handle=".grip" style="display:block">
    <div data-id="a"><span class="grip">⋮⋮</span> Alpha</div>
</y-droplist>

<!-- Swap mode -->
<y-droplist swap style="display:block">
    <div data-id="x">X</div>
    <div data-id="y">Y</div>
</y-droplist>

<!-- Cursor-following drag preview (default: clone of dragged item) -->
<y-droplist drag-preview style="display:block"></y-droplist>

<!-- Tilted preview using CSS token -->
<y-droplist
    drag-preview
    drag-preview-scale="0.92"
    style="--component-droplist-drag-preview-rotate:3deg"
></y-droplist>

<!-- Custom preview content via slot -->
<y-droplist drag-preview style="display:block">
    <div data-id="a">Alpha</div>
    <div slot="drag-preview" class="badge">Dragging…</div>
</y-droplist>
```

---

## y-gallery

Media gallery with lightbox. Accepts `<img>` or `<figure>` children.

| Attribute      | Values / Notes                                                              |
| -------------- | --------------------------------------------------------------------------- |
| `layout`       | `grid` (default) \| `row` \| `column` \| `masonry`                          |
| `columns`      | number (default `3`) — grid/masonry only                                    |
| `gap`          | `small` \| `medium` (default) \| `large` or any CSS length                  |
| `aspect-ratio` | thumbnail aspect ratio, e.g. `1/1` (default), `4/3`, `16/9` — grid/row only |
| `expandable`   | boolean (default `true`) — clicking opens lightbox                          |
| `loop`         | boolean — navigation wraps around                                           |
| `size`         | `small` \| `medium` (default) \| `large`                                    |

Children: `<img>` elements or `<figure>` + `<figcaption>` pairs. Images support `data-src` for full-size source.

Events: `expand` (cancelable, `{ index, src, element }`), `close` (`{ index }`), `navigate` (`{ index, previousIndex, direction }`)
Methods: `.open(index)`, `.close()`, `.next()`, `.previous()`

Slots: default, `expand-prev-icon`, `expand-next-icon`, `expand-close-icon`

CSS Custom Properties: `--component-gallery-gap-small/medium/large`, `--component-gallery-columns`, `--component-gallery-aspect-ratio`, `--component-gallery-thumbnail-radius`, `--component-gallery-thumbnail-overlay-color`, `--component-gallery-expand-background`, `--component-gallery-expand-z-index`, `--component-gallery-arrow-color`, `--component-gallery-arrow-background`

CSS Parts: `gallery`, `item`, `item-img`, `expand-overlay`, `expand-img`, `expand-caption`, `expand-prev`, `expand-next`, `expand-close`, `expand-counter`

```html
<y-gallery layout="masonry" columns="3" loop>
    <img src="thumb1.jpg" data-src="full1.jpg" alt="Mountain vista" />
    <figure>
        <img src="thumb2.jpg" data-src="full2.jpg" alt="Sunset" />
        <figcaption>Golden hour at the coast</figcaption>
    </figure>
</y-gallery>
```

---

## y-dialog

| Attribute       | Values / Notes                                                                        |
| --------------- | ------------------------------------------------------------------------------------- |
| `visible`       | boolean — toggle to open/close (also a property: `el.visible = true`)                 |
| `anchor`        | element ID (no `#`) of a trigger element; clicking it opens the dialog automatically  |
| `closable`      | controls the built-in close button                                                    |
| `show-backdrop` | controls the backdrop                                                                 |
| `animate`       | open/close animation                                                                  |
| `position`      | dialog placement                                                                      |

Events: `open`, `close`

Slots: `header`, `body`, `footer` — **named slots only**; content without a `slot` attribute is not rendered

```html
<y-dialog id="confirm-dialog">
    <span slot="header">Confirm Delete</span>
    <p slot="body">This action cannot be undone.</p>
    <y-button slot="footer" style-type="outlined">Cancel</y-button>
    <y-button slot="footer" color="error">Delete</y-button>
</y-dialog>

<script type="module">
    document.getElementById("confirm-dialog").visible = true;
</script>
```

---

## y-dock

Fixed navigation bar (dock) for primary app navigation. Displays icon+label items with optional per-item slot templates.

| Attribute    | Values / Notes                                                                                |
| ------------ | --------------------------------------------------------------------------------------------- |
| `items`      | JSON array of `{ name, icon, href?, selected?, slot? }` objects                               |
| `position`   | `bottom` (default) \| `top` — which edge of the viewport the dock anchors to                  |
| `breakpoint` | number (px) — when set, dock is only visible below this width; omit for always visible        |
| `size`       | `small` \| `medium` (default) \| `large`                                                      |
| `history`    | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href` |
| `floating`   | boolean — when present, renders the dock as a bordered, rounded island inset from the edges with a shadow (like a non-sticky `y-appbar`) |

**Events:** `navigate` (cancelable, `detail: { href }`)

**Slots:** default (direct child elements as dock items), `{item.slot}` (per-item custom template)

**CSS Parts:** `bar`, `item`

**CSS Custom Properties:**

- `--component-dock-height` — overall dock bar height (overrides size-based default)
- `--component-dock-background` — dock bar background color
- `--component-dock-border-color` — border color on the edge facing the content
- `--component-dock-border-width` — border width
- `--component-dock-border-radius` — corner radius when `floating`
- `--component-dock-floating-margin` — inset from the viewport edges when `floating` (default `16px`)
- `--component-dock-shadow` — drop shadow when `floating` (defaults to `--base-shadow`)
- `--component-dock-color` — default item text/icon color
- `--component-dock-color-active` — selected item text/icon color
- `--component-dock-z-index` — stacking order (default: `8000`)

```html
<!-- Basic bottom dock -->
<y-dock
    items='[{"name":"Home","icon":"home","href":"/","selected":true},{"name":"Search","icon":"search","href":"/search"},{"name":"Profile","icon":"settings","href":"/profile"}]'
></y-dock>

<!-- Per-item custom slot template -->
<y-dock
    items='[{"name":"Home","icon":"home","href":"/"},{"name":"Create","icon":"plus","slot":"create-action"},{"name":"Profile","icon":"settings","href":"/profile"}]'
>
    <y-button
        slot="create-action"
        color="primary"
        style-type="filled"
        size="small"
        left-icon="plus"
        >Create</y-button
    >
</y-dock>

<!-- Mobile-only dock (hidden above 768px) -->
<y-dock breakpoint="768" items="[...]"></y-dock>

<!-- React Router integration -->
<y-dock id="dock" items="[...]"></y-dock>
<script type="module">
    document.getElementById("dock").addEventListener("navigate", (e) => {
        e.preventDefault();
        myRouter.navigate(e.detail.href);
    });
</script>
```

---

## y-menu

Positioned relative to an `anchor` element. Items can be defined via the `items` JSON attribute or as light-DOM children.

| Attribute   | Values / Notes                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------- |
| `items`     | JSON: `[{"text":"Edit","value":"...","href":"...","icon":"...","selected":true,"children":[...]}]` |
| `anchor`    | element ID (no `#`) of the trigger element; clicking the anchor toggles the menu automatically     |
| `visible`   | boolean                                                                                            |
| `direction` | `down` (default) \| `up` \| `left` \| `right`                                                      |
| `size`      | `small` \| `medium` \| `large`                                                                     |
| `history`   | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href`      |

Item object fields: `text`, `value` (defaults to `text`), `href`, `icon` (icon name for `<y-icon>`), `slot` (named slot for custom item content), `selected`, `children`.

Deprecated item fields (still work, will be removed in a future release): `url` (use `href`), `icon-template` and `template` (use `icon` and `slot`).

Light-DOM children of `<y-menu>` are appended as additional menu items. Each child is given `role="menuitem"` and `tabindex="0"` automatically; on click the menu fires `select` with `detail.value` from `data-value` (or `textContent`) and closes.

Events:

- `open` — when the menu becomes visible.
- `close` — when the menu is dismissed.
- `select` — `detail: { value, item?, element? }`. Fires when a leaf item is activated. `item` is set for JSON-defined items; `element` is set for slotted children.
- `navigate` — cancelable; `detail.href`. Fires before navigation when an item with `href` is clicked. Cancel to handle navigation in app code.

```html
<y-button id="opts-btn">Options<y-icon slot="right-icon" name="chevron-down" size="small"></y-icon></y-button>
<!-- anchor is a plain element ID; the menu wires the anchor's click itself -->
<y-menu
    id="opts-menu"
    anchor="opts-btn"
    items='[{"text":"Edit","value":"edit","icon":"pencil"},{"text":"Delete","value":"delete","icon":"trash"}]'
></y-menu>

<script type="module">
    document.getElementById("opts-menu").addEventListener("select", (e) => {
        console.log("selected:", e.detail.value);
    });
</script>
```

---

## y-help

Guided product-tour / onboarding overlay. Given an ordered list of steps, dims the page, highlights one or more targets per step (single SVG mask for clean multi-target cutouts), and anchors a tooltip with helper text. Untargeted steps render a centered tooltip. The overlay and tooltip are portaled out of `<y-help>` to escape ancestor `overflow` / `transform` / `z-index` contexts — into the nearest enclosing `<y-theme>` (falling back to `document.body`). Keep `<y-help>` inside your `<y-theme>` so the portaled tour inherits the active theme; mounting on `document.body` would render with the default un-themed palette since theme variables are scoped to the `<y-theme>` subtree.

| Attribute                       | Values / Notes                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `steps`                         | `HelpStep[]` (property; JSON string via attribute). Each step `{ target?: string \| string[], title?, content, position?, anchor?, highlightPadding? }` |
| `open`                          | boolean — reflects whether the tour is active                                                                                                        |
| `index`                         | number — 0-based active step, reflected                                                                                                              |
| `default-position`              | `auto` (default) \| `top` \| `bottom` \| `left` \| `right` \| `center`                                                                                |
| `untargeted-position`           | `center` (default) \| other positions — fallback when no target resolves                                                                             |
| `default-anchor`                | `bounds` (default) \| `first` \| `last` \| numeric index — multi-target anchor                                                                       |
| `highlight-padding`             | number (px, default `8`) — pixel padding around each highlight                                                                                       |
| `show-progress`                 | defaults to `true` — show "N of M" in the tooltip                                                                                                    |
| `show-arrows`                   | defaults to `true` — large overlay-edge prev/next arrows                                                                                             |
| `close-on-escape`               | defaults to `true`                                                                                                                                   |
| `close-on-overlay-click`        | defaults to `false`                                                                                                                                  |
| `disable-target-interaction`    | defaults to `true` — when `false`, highlighted elements remain clickable                                                                             |
| `prev-label` / `next-label` / `finish-label` / `close-label` | button text; `finish-label` is shown on the next button on the last step (when `loop` is unset)                          |
| `loop`                          | boolean — when set, advancing past the last step returns to the first                                                                                |

Slots: none in v1. Step title/content come from each step's `title` / `content` fields, button text from the `prev-label` / `next-label` / `finish-label` / `close-label` attributes. Per-region slot overrides and declarative `<y-help-step>` children are planned for a future release; style the existing rendering via the documented CSS parts in the meantime.

Events (bubble + composed): `y-help-open` (cancelable, `{ index }`), `y-help-start` (`{ index, step }`), `y-help-step-change` (cancelable, `{ from, to, step, direction }`), `y-help-complete` (`{ totalSteps }`), `y-help-close` (cancelable, `{ index, reason }`).

Methods: `start(index = 0)`, `next()`, `prev()`, `goto(index)`, `close(reason = "api")`.

CSS Parts: `overlay`, `highlight`, `tooltip`, `tooltip-title`, `tooltip-content`, `tooltip-actions`, `prev-button`, `next-button`, `close-button`, `progress`, `arrow-prev`, `arrow-next`, `pointer`.

Accessibility: tooltip is `role="dialog"` `aria-modal="true"`, focus is trapped while open and restored on close, arrow keys + Enter advance, Escape closes (when on). Respects `prefers-reduced-motion`.

```html
<button id="launch">Take the tour</button>
<y-help id="tour"></y-help>

<script type="module">
    const help = document.getElementById("tour");
    help.steps = [
        { target: "btn-create", title: "Start here", content: "Spin up a new agent." },
        { target: ["card-1", "card-2"], anchor: "bounds", content: "Each agent gets a card." },
        { title: "All set!", content: "You can replay this any time." },
    ];
    document.getElementById("launch").addEventListener("click", () => help.start());
</script>
```

---

## y-toast

| Attribute  | Values / Notes                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `position` | `bottom-right` (default) \| `top-right` \| `top-left` \| `top-center` \| `bottom-left` \| `bottom-center` |
| `duration` | default ms per toast (default `4000`); `0` for persistent                                                 |
| `max`      | maximum simultaneous toasts (default `5`; oldest removed first)                                           |

Methods: `.show(opts)` — **single options object**: `{ message, color, duration, dismissible, icon }`. Returns the toast element.

```html
<y-toast id="toast" position="bottom-right"></y-toast>

<script type="module">
    const toast = document.getElementById("toast");
    toast.show({ message: "Saved successfully!", color: "success", duration: 3000 });
    toast.show({ message: "Something went wrong.", color: "error", duration: 0 }); // persistent
</script>
```

---

## y-tabs

| Attribute  | Values / Notes                                   |
| ---------- | ------------------------------------------------ |
| `options`  | JSON array of tab objects (see shape below)      |
| `position` | `top` (default) \| `bottom` \| `left` \| `right` |
| `size`     | `small` \| `medium` \| `large`                   |
| `variant`  | `default` (bordered boxes) \| `accent` (minimal tabs; active tab shows a primary indicator border on its content-facing edge, like Material/Carbon) |
| `overflow` | `scroll` (default; one line + prev/next arrows when the strip overflows) \| `wrap` (tabs flow onto multiple rows/columns) |

Options object shape: `{"id":"tab1","label":"Tab 1","slot":"tab1","disabled":false,"leftIcon":"home","rightIcon":"arrow-right"}` — `id`, `label`, and `slot` are required; `disabled`, `leftIcon`, `rightIcon` are optional.

- `leftIcon` / `rightIcon` — `y-icon` name; renders a `<y-icon>` inside the tab button

Methods: `activateTab(id)`

Slots:

- `{slot}` — tab panel content (one per tab, named by the `slot` field in options)
- `tab-content-{id}` — fully replaces the tab button's inner content; use for custom markup, badges, etc.

Deprecated slots (still functional, emit `console.warn`; use `leftIcon`/`rightIcon` instead):

- `left-icon-{id}`, `right-icon-{id}`

```html
<!-- Icons via options (preferred) -->
<y-tabs
    options='[{"id":"overview","label":"Overview","slot":"overview","leftIcon":"home"},{"id":"settings","label":"Settings","slot":"settings","leftIcon":"settings"}]'
>
    <div slot="overview">Overview content here.</div>
    <div slot="settings">Settings content here.</div>
</y-tabs>

<!-- Custom tab button content -->
<y-tabs options='[{"id":"overview","label":"Overview","slot":"overview"}]'>
    <span
        slot="tab-content-overview"
        style="display:inline-flex;align-items:center;gap:4px"
    >
        <y-icon name="home" size="small"></y-icon> Overview
    </span>
    <div slot="overview">Overview content here.</div>
</y-tabs>
```

---

## y-stepper

Multi-step wizard that guides users through a sequential flow. Step content is provided via named slots.

| Attribute               | Values / Notes                                                                                              |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `items`                 | JSON array of `{ label, slot, description?, icon?, status? }` objects                                       |
| `current`               | number — zero-based active step index (default: `0`)                                                        |
| `orientation`           | `horizontal` (default) \| `vertical`                                                                        |
| `position`              | `start` (default) \| `end` — indicators before or after the content                                         |
| `size`                  | `small` \| `medium` (default) \| `large`                                                                    |
| `linear`                | boolean — restricts free navigation; must use `next()` / `complete()`                                       |
| `editable`              | boolean — allows clicking completed steps to return to them                                                 |
| `responsive`            | defaults to `true` — auto-flips a declared horizontal layout to vertical below `responsive-breakpoint`. Pass `responsive="false"` to opt out. |
| `responsive-breakpoint` | number (px) — host-width threshold below which the responsive flip triggers (default `600`)                 |

Items shape: `{ label: string, slot: string, description?: string, icon?: string, status?: "complete" | "error" | "pending" }`

Slots: `{step.slot}` (content panel per step), `{step.slot}-icon` (custom icon for indicator)

Events: `change` (cancelable, `{ index, previousIndex, step }`), `complete` (`{ step, index }`), `finish`

Methods: `next()`, `previous()`, `goTo(index)`, `complete(index?)`, `reset()`

CSS Custom Properties: `--component-stepper-indicator-size-{small,medium,large}`, `--component-stepper-connector-color`, `--component-stepper-connector-color-complete`, `--component-stepper-color-{pending,active,complete,error}`, `--component-stepper-color-active-text`, `--component-stepper-color-complete-text`, `--component-stepper-color-error-text`, `--component-stepper-label-color`, `--component-stepper-gap-{small,medium,large}`

CSS Parts: `indicators`, `indicator`, `indicator--active`, `indicator--complete`, `indicator--error`, `indicator-icon`, `indicator-label`, `indicator-description`, `connector`, `panels`, `panel`

```html
<y-stepper
    items='[
  {"label":"Account","slot":"account","description":"Create your account"},
  {"label":"Details","slot":"details","icon":"user"},
  {"label":"Review","slot":"review"}
]'
>
    <div slot="account">Account form here...</div>
    <div slot="details">Details form here...</div>
    <div slot="review">Review content here...</div>
</y-stepper>

<!-- Vertical with linear progression -->
<y-stepper items="[...]" orientation="vertical" linear> ... </y-stepper>
```

---

## y-panelbar + y-panel

Accordion group. `y-panelbar` wraps one or more `y-panel` elements.

**y-panelbar attributes:**

- `exclusive` — boolean, expanding one panel collapses all siblings

**y-panel attributes:**

| Attribute  | Values / Notes                                                                                |
| ---------- | --------------------------------------------------------------------------------------------- |
| `selected` | boolean — active/highlighted state                                                            |
| `expanded` | boolean — children slot is visible                                                            |
| `href`     | URL string — clicking the panel header navigates to this URL                                  |
| `history`  | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href` |

Events: `expand`, `collapse`, `toggle`, `select`, `navigate` (when `href` is set — cancelable, `event.detail.href`)

Slots: `icon`, `label` (or default for label text), `children`

Methods: `expand()`, `collapse()`, `toggle()`

```html
<!-- Standard accordion -->
<y-panelbar exclusive style="width:280px">
    <y-panel expanded>
        <span slot="label">Getting Started</span>
        <div slot="children">
            <y-panel href="/docs/install">
                <span slot="label">Installation</span>
            </y-panel>
            <y-panel href="/docs/quickstart">
                <span slot="label">Quick Start</span>
            </y-panel>
        </div>
    </y-panel>
</y-panelbar>

<!-- React Router integration — intercept navigate event -->
<y-panelbar id="nav">...</y-panelbar>
<script type="module">
    document.getElementById("nav").addEventListener("navigate", (e) => {
        e.preventDefault();
        myRouter.navigate(e.detail.href);
    });
</script>

<!-- Full-page navigation (opt out of pushState) -->
<y-panel href="/page" history="false">
    <span slot="label">Page</span>
</y-panel>
```

---

## y-table

| Attribute | Values / Notes                                    |
| --------- | ------------------------------------------------- |
| `columns` | JSON: `[{"key":"name","label":"Name"}, ...]`      |
| `data`    | JSON: `[{"name":"Alice","email":"a@b.com"}, ...]` |
| `striped` | boolean                                           |
| `size`    | `small` \| `medium` \| `large`                    |

```html
<y-table
    columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"},{"key":"role","label":"Role"}]'
    data='[{"name":"Alice","email":"alice@example.com","role":"Admin"},{"name":"Bob","email":"bob@example.com","role":"User"}]'
    striped
></y-table>
```

---

## y-date

Form-associated date input with popup calendar. Handles single dates and ranges.

| Attribute           | Values / Notes                                                               |
| ------------------- | ---------------------------------------------------------------------------- |
| `mode`              | `single` (default) \| `range`                                                |
| `name`              | form field name                                                              |
| `value`             | ISO string, or `"ISO,ISO"` comma-pair for range                              |
| `min`, `max`        | ISO date constraints                                                         |
| `format`            | display format (default: `MM/DD/YYYY`). Tokens: `YYYY MM DD HH hh mm ss A a` |
| `placeholder`       | placeholder text                                                             |
| `color`             | datepicker color theme (default: `primary`)                                  |
| `size`              | `small` \| `medium` (default) \| `large`                                     |
| `label-position`    | `top` (default) \| `bottom`                                                  |
| `variant`           | `default` \| `underline` (bottom border only, square bottom corners)         |
| `clearable`         | boolean — shows × button when value is set                                   |
| `disabled`          | boolean                                                                      |
| `invalid`           | boolean — error state                                                        |
| `show-hours`        | boolean — show hour column in time picker                                    |
| `show-minutes`      | boolean — show minutes column                                                |
| `show-seconds`      | boolean — show seconds column                                                |
| `hour-format`       | `12` (default) \| `24`                                                       |
| `minute-interval`   | step between minute options (default: `5`)                                   |
| `second-interval`   | step between second options (default: `5`)                                   |
| `show-years`        | `"true"` (default) \| `"false"` — year select in header                      |
| `show-months`       | `"true"` (default) \| `"false"` — month select in header                     |
| `show-days`         | `"true"` (default) \| `"false"` — day grid; `"false"` = month/year picker    |
| `mobile-breakpoint` | px width below which mobile mode activates (default: `768`)                  |
| `native-mobile`     | boolean — use native date inputs on mobile instead of the popup (opt-in)     |

Events: `change` — `event.detail: { value, startDate, endDate, formatted }`
Methods: `open()`, `close()`, `clear()`
Slots: `label`, `left-icon`

```html
<y-date name="appt" format="MM/DD/YYYY" clearable>
    <span slot="label">Appointment</span>
</y-date>

<y-date name="trip" mode="range">
    <span slot="label">Travel Dates</span>
</y-date>

<y-date name="meeting" show-hours show-minutes format="MM/DD/YYYY hh:mm A">
    <span slot="label">Meeting Time</span>
</y-date>

<!-- Native inputs on mobile (opt-in) -->
<y-date name="dob" native-mobile clearable>
    <span slot="label">Date of Birth</span>
</y-date>
```

---

## y-datepicker

Standalone calendar widget. Used internally by `y-date`; also usable directly.

| Attribute           | Values / Notes                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| `mode`              | `single` (default) \| `range` — range shows two panels; stacks on mobile                                   |
| `value`             | ISO string, or `"ISO,ISO"` comma-pair for range                                                            |
| `min`, `max`        | ISO date constraints                                                                                       |
| `format`            | display format (default: `MM/DD/YYYY`)                                                                     |
| `color`             | color scheme (default: `primary`)                                                                          |
| `show-hours`        | boolean — show hour column                                                                                 |
| `show-minutes`      | boolean — show minutes column                                                                              |
| `show-seconds`      | boolean — show seconds column                                                                              |
| `hour-format`       | `12` (default) \| `24`                                                                                     |
| `minute-interval`   | step between minute options (default: `5`)                                                                 |
| `second-interval`   | step between second options (default: `5`)                                                                 |
| `show-years`        | `"true"` (default) \| `"false"`                                                                            |
| `show-months`       | `"true"` (default) \| `"false"`                                                                            |
| `show-days`         | `"true"` (default) \| `"false"` — `"false"` = month picker; also set `show-months="false"` for year picker |
| `mobile-breakpoint` | px width below which range panels stack vertically (default: `768`)                                        |

Events: `change` — `event.detail: { value, startDate, endDate, formatted }`
Methods: `clear()`, `formatDate(date)`

```html
<y-datepicker></y-datepicker>
<y-datepicker mode="range" show-hours show-minutes></y-datepicker>

<!-- Month picker -->
<y-datepicker show-days="false"></y-datepicker>

<!-- Year picker -->
<y-datepicker show-days="false" show-months="false"></y-datepicker>
```

---

## y-color

Form-associated color input with a trigger/popup pattern (like `y-date`). Shows a swatch and value string; opens a `y-colorpicker` popup on click.

| Attribute        | Values / Notes                                                          |
| ---------------- | ----------------------------------------------------------------------- |
| `value`          | color string in the active format                                       |
| `format`         | `hex` (default) \| `rgb` \| `hsl` \| `hsv`                              |
| `formats`        | JSON array of available formats (default: all four)                     |
| `show-alpha`     | boolean — enable alpha channel                                          |
| `placeholder`    | trigger placeholder (default: `"Select color"`)                         |
| `name`           | form field name                                                         |
| `disabled`, `invalid`, `clearable` | booleans                                              |
| `size`           | `small` \| `medium` \| `large`                                          |
| `label-position` | `top` (default) \| `bottom`                                             |
| `variant`        | `default` (full border) \| `underline` (bottom border, square corners)  |

Slot: `label`
Events: `change` — `event.detail: { value, hex, rgb, hsl, hsv, alpha }`
Methods: `open()`, `close()`, `clear()`
CSS Parts: `color`, `wrapper`, `label-wrapper`, `trigger`, `swatch`, `display`, `clear-btn`, `popup`

```html
<y-color name="brand" value="#e74c3c" clearable>
    <span slot="label">Brand color</span>
</y-color>
<y-color name="bg" format="rgb" show-alpha>
    <span slot="label">Background</span>
</y-color>
```

---

## y-colorpicker

Standalone color picker — 2D saturation/brightness canvas, hue slider, optional alpha slider, format selector, and channel inputs. Internal model is HSV.

| Attribute    | Values / Notes                                                                  |
| ------------ | ------------------------------------------------------------------------------- |
| `value`      | initial color (`#hex`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hsv()`, `hsva()`) |
| `format`     | `hex` (default) \| `rgb` \| `hsl` \| `hsv`                                       |
| `formats`    | JSON array of available formats                                                 |
| `show-alpha` | boolean — enable alpha slider and channel                                       |
| `size`       | `small` \| `medium` \| `large` (scales canvas and inputs)                       |

Events: `change` — `{ value, hex, rgb, hsl, hsv, alpha }`; `format-change` — `{ format }`
Methods: `setColor(value)`
CSS Parts: `colorpicker`, `canvas`, `canvas-handle`, `hue-slider`, `hue-thumb`, `alpha-slider`, `alpha-thumb`, `inputs-row`, `format-select`, `swatch-preview`

```html
<y-colorpicker value="#3498db"></y-colorpicker>
<y-colorpicker value="#9b59b6" show-alpha format="rgb"></y-colorpicker>
```

---

## y-paginator

Page navigation with a configurable button window, ellipsis collapsing, prev/next, an optional items-per-page select, and SPA-friendly cancelable events. Page buttons render as `y-button` (flat when inactive, filled primary for the active page).

| Attribute            | Values / Notes                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `current-page`       | active page, 1-indexed. Clamped to `[1, total-pages]`; reads `0` when `total-pages = 0`. Default `1`/`0`   |
| `total-pages`        | total pages. `0` = no data (page list omitted). Default `0`                                                |
| `page-count`         | max page buttons shown (excl. ellipses), default `5`. Auto-shrinks to fit host width, grows back up to max |
| `boundary-count`     | pages always shown at each end (default `1`)                                                                |
| `variant`            | `default` (page numbers + prev/next) \| `compact` (first/prev/status/next/last) \| `detailed` (+ text labels) |
| `size`               | `small` \| `medium` (default) \| `large` — forwarded to page buttons and the select                        |
| `disabled`           | boolean — disables every control                                                                           |
| `hide-on-single-page`| default `true` — hides when `total-pages <= 1` and no size select; `"false"` to always render              |
| `items-per-page`     | currently selected items-per-page value (number)                                                           |
| `page-size-options`  | JSON `[10,25,50]` or `[{value,label}]` — appends an items-per-page `y-select`                               |
| `page-size-label`    | label for the select (only visible in `variant="detailed"`, else used as `aria-label`)                     |

Events (cancelable): `page-change` — `{ page }`; `update:current-page` — `{ page }`; `page-size-change` — `{ pageSize, previous }`; `update:items-per-page` — `{ pageSize, previous }`
Methods: `goTo(page)`, `next()`, `previous()`, `setPageSize(value)`
Slots: `prev-label`, `next-label` (only in `variant="detailed"`), `ellipsis`
CSS Parts: `wrapper`, `nav-wrapper`, `list`, `button`, `button--active`, `button--disabled`, `nav-first`, `nav-prev`, `nav-next`, `nav-last`, `compact-status`, `ellipsis`, `page-size`, `page-size-label`, `page-size-select`
Keyboard: on a page button, `ArrowLeft`/`ArrowRight` move focus; `Home`/`End` jump to first/last.

```html
<y-paginator total-pages="50" current-page="5"></y-paginator>
<y-paginator
    total-pages="100" current-page="42" boundary-count="2"
    variant="detailed" items-per-page="25" page-size-options="[10, 25, 50, 100]"
></y-paginator>
```

---

## y-tree

Hierarchical navigation tree for sidebars, doc nav, and file/folder explorers. Use when leaf nodes are navigation targets (links); for collapsible content regions use `y-panelbar` / `y-panel`.

| Attribute     | Values / Notes                                                                              |
| ------------- | ------------------------------------------------------------------------------------------- |
| `exclusive`   | boolean — expanding one branch collapses siblings at the same level                         |
| `selection`   | `single` (default) \| `none` (route-driven only)                                            |
| `route-match` | `exact` (default) \| `prefix` (highlights ancestors of the active route) \| `off`           |
| `aria-label`  | defaults to `"Tree"`                                                                         |

Methods: `getAllItems()`, `getVisibleItems()`, `focusItem(item)`
Events (bubble from items): `navigate` (cancelable, `{ href, item }`), `select` (`{ item, href }`), `expand` (`{ item }`), `collapse` (`{ item }`), `toggle` (`{ item, expanded }`)
Slot: default — root-level `<y-tree-item>` elements
CSS Parts: `tree`

```html
<y-tree route-match="prefix" style="width:280px">
    <y-tree-item href="/docs" expanded>
        <y-icon slot="icon" name="book" size="small"></y-icon>
        <span slot="label">Docs</span>
        <y-tree-item slot="children" href="/docs/install">
            <span slot="label">Installation</span>
        </y-tree-item>
    </y-tree-item>
    <y-tree-item href="/api"><span slot="label">API Reference</span></y-tree-item>
</y-tree>
```

---

## y-tree-item

Individual node in a `y-tree`.

| Attribute  | Values / Notes                                                                  |
| ---------- | ------------------------------------------------------------------------------- |
| `href`     | navigation target; the item behaves as a link when set                          |
| `expanded` | boolean — children visible                                                       |
| `selected` | boolean — active/current; auto-managed by the tree when `route-match` is on      |
| `disabled` | boolean — non-interactive, skipped in keyboard nav                               |
| `history`  | `push` (default) \| `replace` \| `false` (full-page nav)                         |

Methods: `expand()`, `collapse()`, `toggle()`, `activate()`
Slots: `icon`, `label` (default slot also accepted), `suffix`, `children` (nested `<y-tree-item>`)
CSS Parts: `item`, `header`, `icon`, `label`, `suffix`, `arrow`, `children`
CSS Custom Properties: `--component-tree-background`, `--component-tree-item-color`, `--component-tree-item-hover-background`, `--component-tree-item-selected-color`, `--component-tree-item-selected-background`, `--component-tree-item-accent`, `--component-tree-item-active-border`, `--component-tree-border-width`, `--component-tree-padding`, `--component-tree-indent`, `--component-tree-icon-gap`
Keyboard: ArrowUp/Down move between visible items; ArrowRight expands/focuses first child; ArrowLeft collapses/focuses parent; Home/End jump; Enter activates; Space toggles; type-ahead; roving `tabindex`.

---

## y-data-grid

Interactive data grid for large datasets — client- or server-side sorting, filtering, and pagination on top of the `y-table` visual language, plus row selection, inline cell editing, grouping, multi-column header groups, and virtual scrolling. Use `y-table` for static reports; use `y-data-grid` for admin panels, CRMs, and any list users slice, page, select, or edit.

| Attribute             | Values / Notes                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `columns`             | JSON tree. Leaves: `{key, label, type, sortable, filterable, editable, editor, options, required, min, max, pattern, width, minWidth, resizable, reorderable, align}`. Groups: `{label, align, children:[...]}` (nest for multi-row headers). `type`: `text`/`number`/`date`/`checkbox`; `editor`: `text`/`number`/`date`/`select`/`checkbox` (`options` required for `select`) |
| `data`                | JSON array of row objects keyed by column `key`                                                        |
| `mode`                | `client` (default) — local sort/filter/page/edit; `server` — parent handles via events                 |
| `page-size`           | rows per page (default `20`)                                                                            |
| `current-page`        | 1-indexed (default `1`)                                                                                 |
| `total-rows`          | required in `server` mode for pagination math                                                          |
| `loading`             | boolean — loading overlay + `aria-busy`                                                                 |
| `striped`             | boolean (default false)                                                                                 |
| `hover`               | boolean (default true; `hover="false"` to disable)                                                     |
| `fixed-header`        | boolean (default true) — sticky header                                                                  |
| `filtering`           | `inline` (per-column input row) \| `advanced` (funnel popover per header) \| omitted (none)             |
| `enable-sorting`      | boolean (default true) — click cycles asc→desc→none; shift-click for multi-sort                         |
| `enable-pagination`   | boolean (default true)                                                                                  |
| `show-item-count`     | boolean (default false) — row count in footer                                                          |
| `enable-selection`    | boolean — checkbox column + row selection (Ctrl/Cmd+click)                                              |
| `enable-editing`      | boolean — inline cell editing                                                                           |
| `selection-mode`      | `multi` (default) \| `single`                                                                           |
| `edit-on`             | `click` (default) \| `focus`                                                                            |
| `row-key`             | column key used as the stable row id (falls back to array index)                                       |
| `selected`            | JSON array of row keys to mark selected (mirrors the `selectedKeys` property)                          |
| `empty-message`       | text when no rows visible (default `"No data available"`)                                               |
| `row-height`          | px per row (default `40`; required for `virtual`)                                                       |
| `global-search`       | search query across all column values                                                                  |
| `group-by`            | JSON array of column keys — collapsible group rows (nested when multiple). Hides pagination             |
| `aggregates`          | JSON map of key → `sum`/`avg`/`min`/`max`/`count`, rendered in group header cells                       |
| `virtual`             | boolean — render only the visible window (needs `viewport-height`). Hides pagination; not with `group-by` |
| `viewport-height`     | px of scrollable viewport (required for virtualization)                                                |
| `buffer-size`         | extra rows above/below the viewport (default `10`)                                                      |
| `enable-header-menu`  | boolean — kebab menu per header (sort, column visibility submenu, move column)                          |
| `enable-column-resize`| boolean — drag handle on each leaf header (double-click resets); emits `column-resize`. Opt out via `resizable:false` / clamp with `minWidth` |
| `enable-column-reorder`| boolean — drag a leaf header to reorder (within sibling group when nested); emits `column-reorder`. Opt out via `reorderable:false` |

Slots: `header-before`, `header-after`, `footer-before`, `footer-after`, `empty`, `loading`, `pagination`
Events: `page-change` (cancelable, `{page, pageSize}`), `sort-change` (`{column, direction, sorts}`), `filter-change` (`{filters, operators, globalSearch}`), `row-select` (`{rows, keys, event}`), `cell-edit-start` (`{row, column, value}`), `cell-edit-end` (cancelable, `{row, column, value, oldValue}`), `cell-edit-cancel`, `row-click`, `row-dblclick`, `group-toggle` (`{path, groupKey, expanded}`), `column-resize` (`{column, width}`), `column-reorder` (`{column, fromIndex, toIndex, order}`)
Properties / methods: `selectedRows`, `selectedKeys`, `filters`, `sortState`, `groupBy`, `aggregates`, `clearFilters()`, `clearSort()`, `clearSelection()`, `selectRows(rows)`, `commitEdit()`, `cancelEdit()`, `expandGroup(path)`, `collapseGroup(path)`, `expandAllGroups()`, `collapseAllGroups()`, `refresh()`
CSS Parts: `grid-container`, `header`, `header-row`, `header-cell`, `body`, `row`, `cell`, `pagination`, `loading-overlay`, `empty-state`, `filter-input`, `filter-row`, `cell-editor`, `group-header`, `header-menu-trigger`, `header-filter-trigger`, `header-menu-popover`, `header-menu-submenu`, `header-filter-popover`, `column-resize-handle`
CSS Custom Properties: `--component-data-grid-*` (border, border-radius, padding-{size}, row-height, row-stripe-bg, row-hover-bg, row-selected-bg, header-bg, header-text, filter-bg, edit-input-border, pagination-bg, loading-spinner-color, group-indent, resize-handle-color, drop-indicator-color, …)

```html
<y-data-grid
    columns='[{"key":"name","label":"Name"},{"key":"age","label":"Age","type":"number"}]'
    data='[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
    filtering="inline" page-size="10"
></y-data-grid>
```

---

## y-popover

Target-anchored, slot-based floating panel — the primitive bridging `y-tooltip` (hover/focus text) and `y-dialog` (centered modal) for rich positioned popovers: confirm prompts, action menus, comboboxes, inline help. Used internally by `y-help`.

| Attribute                | Values / Notes                                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `open`                   | reflects/toggles visibility                                                                           |
| `anchor`                 | element `id` (no `#`) or CSS selector (or an `Element` via property). Falls back to a `[slot="trigger"]` child |
| `position`               | `auto` (default) \| `top`/`bottom`/`left`/`right` + aligned variants (`top-start`, `bottom-end`, …)   |
| `offset`                 | px gap between anchor and popover (default `8`)                                                       |
| `pointer`                | render the arrow (default `true`; `pointer="false"` to hide)                                          |
| `trigger`                | space-separated subset of `click`/`hover`/`focus`/`context-menu`/`manual` (default `manual`)          |
| `delay-show`/`delay-hide`| ms before open/close on hover/focus (default `0`)                                                     |
| `modal`                  | `role="dialog"` + focus trap + Escape always closes                                                  |
| `show-backdrop`          | dim backdrop (implicitly true with `modal` unless `="false"`)                                         |
| `close-on-escape`        | default `true` (always on for modal)                                                                  |
| `close-on-outside-click` | default `true`                                                                                        |
| `close-on-anchor-click`  | default `false` — when true, re-clicking the anchor toggles closed                                    |
| `portal`                 | render into the nearest `<y-theme>` (fallback `document.body`) to escape stacking/transform/clip contexts while keeping the theme |
| `text`                   | simple text body (equivalent to a `<span>` in the default slot)                                       |
| `color`                  | `base` (default) \| `primary`/`secondary`/`success`/`warning`/`error`/`help`, or any safe CSS color   |
| `size`                   | `small` \| `medium` (default) \| `large`                                                              |
| `disabled`               | triggers inert; `show()` is a no-op; an open popover closes                                           |

Slots: default (body, falls back to `text`), `trigger` (becomes the anchor), `header`, `footer`, `pointer`
Events (bubble + composed): `popover-open` (cancelable, `{trigger}`), `popover-opened` (`{position}`), `popover-close` (cancelable, `{reason}`), `popover-closed` (`{reason}`), `popover-anchor-change` (`{from, to}`)
Methods: `show(detail?)` → `Promise<boolean>`, `hide(reason="api")`, `toggle()`, `updatePosition()`, `setAnchor(element|selector)`
CSS Parts: `surface`, `header`, `body`, `footer`, `pointer`, `backdrop`, `trigger`
CSS Custom Properties: `--component-popover-*` (background, color, border-color, border-width, border-radius, padding-{size}, font-size-{size}, max-width, min-width, shadow, offset, pointer-size, pointer-color, backdrop, backdrop-blur, z-index, header-divider-color, transition-duration)
Accessibility: non-modal uses `role="tooltip"`; modal uses `role="dialog"` + `aria-modal`. Header → `aria-labelledby`, body → `aria-describedby`. Modal traps and restores focus; respects `prefers-reduced-motion`.

```html
<button id="save-btn">Save layout</button>
<y-popover anchor="save-btn" trigger="click" position="bottom">
    <strong slot="header">Confirm change</strong>
    <p>Saving will overwrite the existing layout.</p>
    <div slot="footer">
        <y-button size="small" style-type="outlined">Cancel</y-button>
        <y-button size="small" color="primary">Save</y-button>
    </div>
</y-popover>

<y-popover trigger="hover focus" text="Helpful description" position="top">
    <y-button slot="trigger">Hover me</y-button>
</y-popover>
```

---

## y-shape

Presentational container that clips its slotted content into a geometric shape via CSS `clip-path`. Useful for avatar masks, decorative panels, and non-rectangular skeleton loaders.

| Attribute          | Values / Notes                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `type`             | `rectangle` (default) \| `circle` \| `ellipse` \| `star` \| `heart` \| `chat-bubble` \| `times` \| `cross` \| `polygon` |
| `polygon-points`   | required for `type="polygon"` — comma-separated coords (e.g. `"50% 0%, 100% 50%, 50% 100%, 0% 50%"`) |
| `radius`           | shape radius for `circle`/`ellipse`, or corner radius for `rectangle` (e.g. `"50%"`, `"12px"`)       |
| `fit`              | `contain` (default) \| `cover` \| `fill` — `object-fit` for slotted `<img>`/`<video>`                |
| `preserve-aspect`  | boolean — locks the container to 1:1                                                                  |
| `size`             | `small` \| `medium` (default) \| `large`                                                             |

Events: `ready` — `{ clipPath }`
Slot: default — content to clip (commonly an image)
CSS Parts: `host`, `content`
CSS Custom Properties: `--component-shape-clip-path` (computed), `--component-shape-size`, `--component-shape-background`, `--component-shape-color`

```html
<y-shape type="circle"><img src="avatar.jpg" alt="" /></y-shape>
<y-shape type="rectangle" radius="16px" size="large" style="background: var(--primary-content--);"></y-shape>
<y-shape type="polygon" polygon-points="50% 0%, 100% 50%, 50% 100%, 0% 50%"></y-shape>
```

---

## y-banner

Full-width inline alert / notification region with optional icon, action, and dismiss button.

| Attribute     | Values / Notes                                                                          |
| ------------- | --------------------------------------------------------------------------------------- |
| `color`       | `base` (default) \| `primary`/`secondary`/`success`/`error`/`warning`/`help`            |
| `icon`        | registered icon name shown before the content                                           |
| `position`    | `push` (default, in-flow) \| `overlap` (positioned over content)                        |
| `sticky`      | boolean — with `position="overlap"`, fixes the banner to the viewport top on scroll     |
| `dismissable` | boolean — shows a close button                                                          |
| `dismissed`   | boolean — reflects/sets the hidden state                                                |
| `size`        | `small` \| `medium` (default) \| `large`                                                |

Events: `dismiss` (cancelable) — fired before hiding; `preventDefault()` keeps it open
Methods: `dismiss()`, `show()`
Slots: default (message), `icon` (falls back to the `icon` attribute), `action`
CSS Parts: `banner`, `icon`, `content`, `action`, `close-btn`
CSS Custom Properties: `--component-banner-gap`, `--component-banner-padding-{small|medium|large}`, `--component-banner-icon-size-{small|medium|large}`, `--component-banner-border-radius`, `--component-banner-z-index`

```html
<y-banner color="success" icon="check" dismissable>
    Your changes have been saved.
    <y-button slot="action" size="small">Undo</y-button>
</y-banner>
```

---

## y-avatar-group

A group of overlapping avatars rendered horizontally or vertically.

| Attribute     | Values / Notes                                                                          |
| ------------- | --------------------------------------------------------------------------------------- |
| `avatars`     | JSON array `[{ alt, src, color, shape }]`; when set, slotted children are ignored       |
| `orientation` | `horizontal` (default) \| `vertical`                                                    |
| `overlap`     | px each avatar overlaps the previous (default `8`)                                      |
| `stack-order` | `last` (default; final on top) \| `first` (leading on top)                              |
| `max`         | max visible avatars; `0` (default) = unlimited. Excess collapses into a `+N` indicator  |
| `size`        | `small` \| `medium` \| `large` — applied to JSON-rendered avatars                       |

Events: `y-overflow-click` — fired when the `+N` indicator is clicked (`{ count }`)
CSS Parts: `overflow` (the `+N` button)

```html
<y-avatar-group max="3" aria-label="Project members">
    <y-avatar alt="Jane Doe" color="primary"></y-avatar>
    <y-avatar alt="John Smith" color="secondary"></y-avatar>
    <y-avatar alt="Pat Lee" color="success"></y-avatar>
    <y-avatar alt="Sam Ko" color="warning"></y-avatar>
</y-avatar-group>
```

---

## y-animate

Wrapper that applies a preset CSS-based entrance/exit animation to its children via the Web Animations API.

| Attribute       | Values / Notes                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| `animation`     | `fade` (default) \| `slide` \| `zoom-in` \| `zoom-out` \| `flip-horizontal` \| `flip-vertical` \| `rotate-in` \| `bounce` \| `shake` \| `scale` |
| `direction`     | `up` (default) \| `down` \| `left` \| `right` — used by `slide`/`bounce`/`shake`                      |
| `duration`      | ms (default `300`)                                                                                   |
| `delay`         | ms before start (default `0`)                                                                        |
| `easing`        | CSS easing keyword, `cubic-bezier(...)`, or `steps(...)` (default `"ease-out"`)                       |
| `trigger`       | `load` (default) \| `visible` (plays on scroll-in via `IntersectionObserver`) \| `manual`            |
| `once`          | `"true"` (default) \| `"false"` — when false, visibility triggers re-fire on each entry              |
| `reverse`       | boolean — plays in reverse                                                                           |
| `stagger`       | boolean — animates each child with a per-index delay                                                 |
| `stagger-delay` | per-child delay in ms when `stagger` is set (default `50`)                                            |
| `disabled`      | boolean — blocks playback                                                                            |
| `hidden`        | standard HTML attribute — cancels any in-flight animation and hides the host                         |

Events (bubble + composed): `animation-start`, `animation-end`, `animation-cancel` — each `{ animation, element }`
Methods: `play()` → `Promise<void>`, `reset()`, `abort()`, `setAnimation(name, duration?, easing?)`
Slot: default — children to animate
CSS Parts: `content`
CSS Custom Properties: `--component-animate-duration`, `--component-animate-stagger-delay`, `--component-animate-fade-opacity-start/-end`, `--component-animate-slide-distance`, `--component-animate-zoom-in-scale-start`, `--component-animate-zoom-out-scale-start`, `--component-animate-rotate-angle`, `--component-animate-bounce-height`, `--component-animate-shake-amplitude`, `--component-animate-scale-start/-end`
Accessibility: respects `prefers-reduced-motion: reduce` — animations are skipped, but `animation-start`/`animation-end` still fire.

```html
<y-animate animation="fade" duration="400">
    <y-card>Hello</y-card>
</y-animate>

<y-animate trigger="visible" animation="slide" direction="up" stagger stagger-delay="80">
    <y-card>One</y-card>
    <y-card>Two</y-card>
</y-animate>
```

---

## Icon Registry API

```javascript
import { registerIcon, registerIcons, getIcon } from "@waggylabs/yumekit";

// Single icon (raw SVG string)
registerIcon(
    "my-icon",
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="..."/></svg>`,
);

// Multiple icons
registerIcons([
    { name: "icon-a", svg: `<svg>...</svg>` },
    { name: "icon-b", svg: `<svg>...</svg>` },
]);

// Retrieve
const svg = getIcon("my-icon");
```

---

## Design Tokens

Available CSS custom properties (set by y-theme or a theme CSS file):

```
--{scheme}-background-app
--{scheme}-background-component
--{scheme}-background-hover
--{scheme}-background-active
--{scheme}-border
--{scheme}-content--
--{scheme}-content-inverse
--{scheme}-content-hover
--{scheme}-content-active
```

Where `{scheme}` is: `base`, `primary`, `secondary`, `success`, `warning`, `error`, `help`

Layout/typography tokens:

```
--spacing-x-small | --spacing-small | --spacing-medium | --spacing-large | --spacing-x-large
--font-size-small | --font-size-label | --font-size-paragraph
--radii-small | --radii-medium | --radii-large | --radii-full
--base-shadow
```

Custom theme: define these variables in CSS and point y-theme to the file:

```html
<y-theme theme="/my-theme.css"></y-theme>
```
