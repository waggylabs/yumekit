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
| `inset`       | `none` (default) \| `sm` \| `md` \| `lg` — outer end padding                                |

**Slots:** default — content rendered in the center; takes precedence over `label` / `icon`.

**CSS Parts:** `line`, `line-start`, `line-end`, `content`

**CSS Custom Properties:** `--component-break-line-color`, `--component-break-line-thickness`, `--component-break-line-style` (override the `variant`), `--component-break-gap`, `--component-break-content-color`, `--component-break-content-font-size`, `--component-break-content-font-weight`, `--component-break-inset`, `--component-break-min-length`

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
| `disabled`   | boolean                                                                                |
| `type`       | `button` (default) \| `submit` \| `reset` — ignored when `href` is set                 |
| `href`       | URL — switches internal element to `<a>`; disabled removes href + sets `aria-disabled` |
| `target`     | e.g. `"_blank"` — only applies when `href` is set                                      |
| `rel`        | e.g. `"noopener noreferrer"` — only applies when `href` is set                         |

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
| `disabled`       | boolean                                                                   |
| `readonly`       | boolean                                                                   |
| `required`       | boolean                                                                   |
| `invalid`        | boolean — applies error state                                             |
| `max-length`     | number string                                                             |
| `min-length`     | number string                                                             |
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
| `disabled`     | boolean                                         |
| `required`     | boolean                                         |
| `multiple`     | boolean                                         |
| `display-mode` | `dropdown` (default) \| `inline`                |

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

---

## y-radio

Form-associated. Group by giving the same `name`.

| Attribute        | Values / Notes                 |
| ---------------- | ------------------------------ |
| `name`, `value`  |                                |
| `checked`        | boolean                        |
| `disabled`       | boolean                        |
| `required`       | boolean                        |
| `size`           | `small` \| `medium` \| `large` |
| `label`          |                                |
| `label-position` | `right` (default) \| `left`    |

Events: `change`

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
| `label`          |                                |
| `label-position` | `right` \| `left`              |

Events: `change`

---

## y-slider

Form-associated.

| Attribute                             | Values / Notes                   |
| ------------------------------------- | -------------------------------- |
| `name`, `value`, `min`, `max`, `step` |                                  |
| `disabled`                            | boolean                          |
| `required`                            | boolean                          |
| `size`                                | `small` \| `medium` \| `large`   |
| `show-value`                          | boolean — displays current value |

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

| Attribute  | Values / Notes                                                         |
| ---------- | ---------------------------------------------------------------------- |
| `color`    | color scheme name                                                      |
| `position` | `top-right` (default) \| `top-left` \| `bottom-right` \| `bottom-left` |
| `size`     | `small` \| `medium` \| `large`                                         |

Slots: default (badge label text), `anchor` (element being badged)

```html
<y-badge color="error" position="top-right"
    >5
    <y-button slot="anchor" left-icon="bell">Notifications</y-button>
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

| Attribute       | Values / Notes                 |
| --------------- | ------------------------------ |
| `value`         | number 0–100                   |
| `max`           | number (default: 100)          |
| `indeterminate` | boolean — animated loading bar |
| `color`         | color scheme name              |
| `size`          | `small` \| `medium` \| `large` |

```html
<y-progress value="65" color="primary"></y-progress>
<y-progress indeterminate color="secondary"></y-progress>
```

---

## y-tooltip

| Attribute  | Values / Notes                                   |
| ---------- | ------------------------------------------------ |
| `text`     | tooltip content (required)                       |
| `position` | `top` (default) \| `bottom` \| `left` \| `right` |
| `trigger`  | `hover` (default) \| `click` \| `focus`          |

Slot: default (trigger element)

```html
<y-tooltip text="Remove this item" position="top">
    <y-button color="error" style-type="flat"
        ><y-icon name="trash"></y-icon
    ></y-button>
</y-tooltip>
```

---

## y-card

| Attribute | Values / Notes    |
| --------- | ----------------- |
| `color`   | color scheme name |

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
| `orientation`       | `vertical` (default) \| `horizontal`                                                          |
| `collapsed`         | boolean — collapses vertical sidebar to icon-only mode                                        |
| `items`             | JSON: `[{"text":"Home","icon":"home","href":"/","children":[...]}]`                           |
| `size`              | `small` \| `medium` (default) \| `large`                                                      |
| `menu-direction`    | `right` \| `down` \| `""` (auto: vertical→right, horizontal→down)                             |
| `sticky`            | `start` \| `end` — sticks to top/left (start) or bottom/right (end)                           |
| `mobile-breakpoint` | px width below which horizontal bar collapses to a hamburger menu (default: `768`)            |
| `history`           | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href` |

Item object fields: `text`, `icon` (icon name or inline SVG), `href`, `selected`, `slot`, `children`

Events: `navigate` — cancelable; `event.detail.href`. Fires before navigation when an item with `href` is clicked.

Slots: `logo`, `title`, `header`, `footer`

```html
<!-- Basic vertical sidebar -->
<y-appbar
    orientation="vertical"
    sticky="start"
    items='[{"text":"Home","icon":"home","href":"/"},{"text":"Settings","icon":"settings","href":"/settings"}]'
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

## y-drawer

| Attribute    | Values / Notes                                   |
| ------------ | ------------------------------------------------ |
| `open`       | boolean                                          |
| `position`   | `left` (default) \| `right` \| `top` \| `bottom` |
| `modal`      | boolean — shows backdrop                         |
| `persistent` | boolean — backdrop click does not close          |

Events: `open`, `close`
Methods: `.show()`, `.hide()`

Slot: default (drawer content)

```html
<y-drawer id="nav-drawer" position="left" modal>
    <nav>
        <y-button style-type="flat">Dashboard</y-button>
        <y-button style-type="flat">Settings</y-button>
    </nav>
</y-drawer>

<script type="module">
    document.getElementById("nav-drawer").show();
</script>
```

---

## y-droplist

Drag-and-drop reorderable list. Supports within-list reordering, cross-list groups, clone/pull/put policies, drag handles, and swap mode.

| Attribute             | Values / Notes                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`            | boolean — disables drag and keyboard reorder                                                                                                |
| `vertical`            | default vertical; set `vertical="false"` to reorder horizontally                                                                            |
| `animation`           | settle-animation duration in ms (default `150`); `0` disables                                                                               |
| `group`               | string — name of the cross-list drag group; lists sharing a name can exchange items                                                         |
| `clone`               | boolean — drops insert a copy at the destination; the original stays at its source index                                                    |
| `pull`                | `"true"` (default) \| `"clone"` \| `"false"` — controls whether items can be dragged out; `"clone"` leaves a copy, `"false"` blocks pulling |
| `put`                 | `"true"` (default) \| `"false"` \| comma-separated group names — controls which sources this list accepts; `"false"` rejects all incoming   |
| `handle`              | CSS selector — restricts drag initiation to matching child elements; invalid selectors warn and fall back to whole-item drag                |
| `prevent-on-filter`   | boolean (default `true`) — when `handle` is set, calls `preventDefault()` on non-handle `pointerdown` to suppress text selection            |
| `swap`                | boolean — dropping over an item swaps the two in place instead of inserting between them; same-list only                                    |
| `swap-class`          | CSS class on the active swap target (default `y-droplist__swap-target`)                                                                     |
| `invert-swap-element` | boolean (default `true`) — `true`: swap target is the item under the cursor; `false`: item whose midpoint the cursor has crossed            |
| `ghost-class`         | CSS class on the drop placeholder (default `y-droplist__ghost`)                                                                             |
| `drag-class`          | CSS class on the dragged item (default `y-droplist__dragging`)                                                                              |

**Events:**

| Event        | Detail                                      | Notes                                                                         |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------------------- |
| `drag:start` | `{ originalEvent, item, list }`             | Fired on the source list when a drag begins                                   |
| `drag:end`   | `{ originalEvent, item, list }`             | Fired on the source list when a drag ends (drop or cancel)                    |
| `drag:enter` | `{ originalEvent, item, list, from }`       | Fired on a target list when the drag enters it (cross-list only)              |
| `drag:leave` | `{ originalEvent, item, list, to }`         | Fired on a list when the drag leaves it (cross-list only)                     |
| `reorder`    | `{ oldIndex, newIndex, item, list, from? }` | Fired on the destination list after a successful drop or keyboard move        |
| `update`     | `{ item, oldIndex, newIndex, list, from? }` | Fired on both source (cross-list) and destination after every successful drop |

For cross-list drops: the source `update` fires first with `newIndex: -1`; the destination `reorder` and `update` fire second with `from` set to the source list. For clone drops `oldIndex` is `-1`.

**Methods:** `toArray()` — returns each direct child's `data-id` in current DOM order. `hasItem(item)` — strict direct-child check (excludes ghost). `destroy()` — removes all listeners and observers.

**Slots:** default — give each item a unique `data-id` so `toArray()` is meaningful.

**Keyboard:** focus an item, press `ArrowUp`/`ArrowDown` (or `ArrowLeft`/`ArrowRight` when horizontal). When `handle` is set, focus lands on the handle element. A polite `aria-live` region announces moves and swaps.

**CSS Parts:** `list` (shadow-DOM flex wrapper around the slot).

**Styling items:** items are slotted light-DOM children — use descendant selectors (`y-droplist > *`, `.y-droplist__dragging`, etc.). `::part()` does not reach light DOM.

**Styling the ghost:** target `[data-y-droplist-ghost]`, the `ghost-class` value (default `.y-droplist__ghost`), or the `--component-droplist-ghost-*` custom properties.

**CSS Custom Properties:**

- `--component-droplist-ghost-opacity`, `--component-droplist-ghost-background`, `--component-droplist-ghost-border-color`
- `--component-droplist-swap-indicator-background`
- `--component-droplist-item-padding`, `--component-droplist-item-margin`
- `--component-droplist-transition-duration`, `--component-droplist-transition-easing`

> Touch dragging is not supported. Auto-scroll is not implemented.

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

| Attribute    | Values / Notes                          |
| ------------ | --------------------------------------- |
| `open`       | boolean                                 |
| `persistent` | boolean — backdrop click does not close |

Events: `open`, `close`
Methods: `.show()`, `.hide()`

Slots: `header`, `footer`, default (body)

```html
<y-dialog id="confirm-dialog">
    <span slot="header">Confirm Delete</span>
    <p>This action cannot be undone.</p>
    <y-button slot="footer" style-type="outlined">Cancel</y-button>
    <y-button slot="footer" color="error">Delete</y-button>
</y-dialog>

<script type="module">
    document.getElementById("confirm-dialog").show();
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

**Events:** `navigate` (cancelable, `detail: { href }`)

**Slots:** default (direct child elements as dock items), `{item.slot}` (per-item custom template)

**CSS Parts:** `bar`, `item`

**CSS Custom Properties:**

- `--component-dock-height` — overall dock bar height (overrides size-based default)
- `--component-dock-background` — dock bar background color
- `--component-dock-border-color` — border color on the edge facing the content
- `--component-dock-border-width` — border width
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
| `anchor`    | CSS selector or element ID of the trigger element                                                  |
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
<y-button id="opts-btn" right-icon="chevron-down">Options</y-button>
<y-menu
    id="opts-menu"
    anchor="#opts-btn"
    items='[{"text":"Edit","value":"edit","icon":"edit"},{"text":"Delete","value":"delete","icon":"trash"}]'
></y-menu>

<script type="module">
    document.getElementById("opts-btn").addEventListener("click", () => {
        document.getElementById("opts-menu").visible = true;
    });
    document.getElementById("opts-menu").addEventListener("select", (e) => {
        console.log("selected:", e.detail.value);
    });
</script>
```

---

## y-toast

| Attribute  | Values / Notes                                                                                            |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| `position` | `top-right` (default) \| `top-left` \| `top-center` \| `bottom-right` \| `bottom-left` \| `bottom-center` |
| `duration` | number (ms); `0` for persistent                                                                           |
| `color`    | color scheme name                                                                                         |

Methods: `.show(message, options?)`, `.hide()`

```html
<y-toast id="toast" position="bottom-right"></y-toast>

<script type="module">
    const toast = document.getElementById("toast");
    toast.show("Saved successfully!", { color: "success", duration: 3000 });
    toast.show("Something went wrong.", { color: "error", duration: 0 }); // persistent
</script>
```

---

## y-tabs

| Attribute  | Values / Notes                                   |
| ---------- | ------------------------------------------------ |
| `options`  | JSON array of tab objects (see shape below)      |
| `position` | `top` (default) \| `bottom` \| `left` \| `right` |
| `size`     | `small` \| `medium` \| `large`                   |

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

| Attribute     | Values / Notes                                                        |
| ------------- | --------------------------------------------------------------------- |
| `items`       | JSON array of `{ label, slot, description?, icon?, status? }` objects |
| `current`     | number — zero-based active step index (default: `0`)                  |
| `orientation` | `horizontal` (default) \| `vertical`                                  |
| `position`    | `start` (default) \| `end` — indicators before or after the content   |
| `size`        | `small` \| `medium` (default) \| `large`                              |
| `linear`      | boolean — restricts free navigation; must use `next()` / `complete()` |
| `editable`    | boolean — allows clicking completed steps to return to them           |

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
| `rows`    | JSON: `[{"name":"Alice","email":"a@b.com"}, ...]` |
| `striped` | boolean                                           |
| `size`    | `small` \| `medium` \| `large`                    |

```html
<y-table
    columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"},{"key":"role","label":"Role"}]'
    rows='[{"name":"Alice","email":"alice@example.com","role":"Admin"},{"name":"Bob","email":"bob@example.com","role":"User"}]'
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
