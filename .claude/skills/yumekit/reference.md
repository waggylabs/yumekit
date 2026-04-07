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

| Attribute       | Values                                                                 | Notes                                      |
|----------------|------------------------------------------------------------------------|--------------------------------------------|
| `theme`        | `"blue-light"` \| `"blue-dark"` \| `"orange-light"` \| `"orange-dark"` \| URL | Built-in palette or path to custom CSS |
| `cross-origin` | boolean                                                                | Allows loading theme from a different origin |
| `no-default-font` | boolean                                                             | Skips injecting the Lexend font from Google Fonts |

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

## y-button

When `href` is set, the internal element renders as `<a>` instead of `<button>` — all styles, sizes, and color variants apply identically.

| Attribute    | Values / Notes                                                                              |
|-------------|----------------------------------------------------------------------------------------------|
| `color`     | `base` \| `primary` \| `secondary` \| `success` \| `warning` \| `error` \| `help`          |
| `size`      | `small` \| `medium` \| `large`                                                              |
| `style-type`| `outlined` (default) \| `filled` \| `flat`                                                 |
| `disabled`  | boolean                                                                                      |
| `type`      | `button` (default) \| `submit` \| `reset` — ignored when `href` is set                     |
| `href`      | URL — switches internal element to `<a>`; disabled removes href + sets `aria-disabled`      |
| `target`    | e.g. `"_blank"` — only applies when `href` is set                                          |
| `rel`       | e.g. `"noopener noreferrer"` — only applies when `href` is set                             |

Slots: default (label), `left-icon`, `right-icon`

```html
<!-- Standard button -->
<y-button color="primary" size="large">
  <y-icon slot="left-icon" name="check" size="small"></y-icon>
  Save
</y-button>

<!-- Link button — renders <a href="/docs"> internally -->
<y-button href="/docs" color="primary" style-type="outlined">Documentation</y-button>

<!-- External link -->
<y-button href="https://example.com" target="_blank" rel="noopener noreferrer" style-type="flat">
  External
  <y-icon slot="right-icon" name="arrow-right" size="small"></y-icon>
</y-button>

<!-- Disabled link — href removed, aria-disabled set, pointer-events blocked -->
<y-button href="/restricted" disabled>Unavailable</y-button>
```

---

## y-button-group

Groups buttons or other elements into a visually connected toolbar. Automatically removes border-radius on inner children and collapses shared borders.

| Attribute     | Values                                    |
|--------------|-------------------------------------------|
| `orientation` | `horizontal` (default) \| `vertical`     |

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

| Attribute        | Values / Notes                                          |
|-----------------|----------------------------------------------------------|
| `type`          | `text` \| `email` \| `password` \| `number` \| `tel` \| `url` \| `search` |
| `name`          | form field name                                          |
| `value`         | current value                                            |
| `placeholder`   |                                                          |
| `label`         | visible label text                                       |
| `label-position`| `top` (default) \| `bottom` \| `left` \| `right`        |
| `size`          | `small` \| `medium` \| `large`                          |
| `disabled`      | boolean                                                  |
| `readonly`      | boolean                                                  |
| `required`      | boolean                                                  |
| `invalid`       | boolean — applies error state                            |
| `max-length`    | number string                                            |
| `min-length`    | number string                                            |
| `pattern`       | regex string                                             |

Events: `change`, `input`

```html
<y-input type="email" name="email" label="Email" required placeholder="you@example.com"></y-input>
<y-input type="password" name="password" label="Password" required></y-input>
```

---

## y-textarea

Form-associated. Multi-line text input. A distinct component from `y-input`.

| Attribute        | Values / Notes                                          |
|-----------------|----------------------------------------------------------|
| `name`          | form field name                                          |
| `value`         | current value                                            |
| `placeholder`   |                                                          |
| `label`         | visible label text                                       |
| `label-position`| `top` (default) \| `bottom` \| `left` \| `right`        |
| `rows`          | number of visible rows (default: `3`)                   |
| `size`          | `small` \| `medium` \| `large`                          |
| `disabled`      | boolean                                                  |
| `required`      | boolean                                                  |
| `invalid`       | boolean — applies error state                            |

Events: `change`, `input`

```html
<y-textarea name="message" label="Message" placeholder="Write something..." rows="4"></y-textarea>
<y-textarea name="bio" label="Bio" disabled value="Cannot edit this."></y-textarea>
```

---

## y-select

Form-associated.

| Attribute      | Values / Notes                                            |
|---------------|-----------------------------------------------------------|
| `options`     | JSON: `[{"value":"a","label":"Option A"}, ...]`           |
| `value`       | selected value (or JSON array if `multiple`)              |
| `name`        | form field name                                           |
| `placeholder` |                                                           |
| `size`        | `small` \| `medium` \| `large`                           |
| `disabled`    | boolean                                                   |
| `required`    | boolean                                                   |
| `multiple`    | boolean                                                   |
| `display-mode`| `dropdown` (default) \| `inline`                         |

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

| Attribute        | Values / Notes                                         |
|-----------------|--------------------------------------------------------|
| `name`, `value` |                                                        |
| `checked`       | boolean                                                |
| `disabled`      | boolean                                                |
| `required`      | boolean                                                |
| `indeterminate` | boolean                                                |
| `size`          | `small` \| `medium` \| `large`                        |
| `label`         | visible label                                          |
| `label-position`| `right` (default) \| `left`                           |

Events: `change`

---

## y-radio

Form-associated. Group by giving the same `name`.

| Attribute        | Values / Notes                         |
|-----------------|----------------------------------------|
| `name`, `value` |                                        |
| `checked`       | boolean                                |
| `disabled`      | boolean                                |
| `required`      | boolean                                |
| `size`          | `small` \| `medium` \| `large`        |
| `label`         |                                        |
| `label-position`| `right` (default) \| `left`           |

Events: `change`

---

## y-switch

Form-associated.

| Attribute        | Values / Notes                         |
|-----------------|----------------------------------------|
| `name`, `value` |                                        |
| `checked`       | boolean                                |
| `disabled`      | boolean                                |
| `required`      | boolean                                |
| `size`          | `small` \| `medium` \| `large`        |
| `label`         |                                        |
| `label-position`| `right` \| `left`                     |

Events: `change`

---

## y-slider

Form-associated.

| Attribute     | Values / Notes                         |
|--------------|----------------------------------------|
| `name`, `value`, `min`, `max`, `step` |                  |
| `disabled`   | boolean                                |
| `required`   | boolean                                |
| `size`       | `small` \| `medium` \| `large`        |
| `show-value` | boolean — displays current value       |

Events: `change`, `input`

---

## y-icon

SVG icon renderer. Only use icon names from the registry.

| Attribute | Values / Notes                                                  |
|----------|-----------------------------------------------------------------|
| `name`   | registered icon name (required)                                  |
| `size`   | `small` \| `medium` \| `large`                                  |
| `color`  | color scheme name or CSS color value                             |
| `weight` | `thin` \| `regular` (default) \| `thick`                        |
| `label`  | accessible label (sets aria-label); omit for decorative icons    |

Pre-built icon names (loaded with `icons/all.js`): `accessible`, `eye`, `eye-off`, `arrow-up`, `arrow-down`, `arrow-left`, `arrow-right`, `chevron-up`, `chevron-down`, `chevron-left`, `chevron-right`, `check`, `close`, `copy`, `download`, `edit`, `trash`, `bell`, `chat`, `email`, `phone`, `camera`, `image`, `mic`, `play`, `pause`, `home`, `menu`, `search`, `settings`, `expand-left`, `expand-right`, `lock`, `star`, `heart`, `info`, `warning`, `error`, `campfire`, and more.

```html
<y-icon name="check" size="large" color="success" label="Confirmed"></y-icon>
<y-icon name="trash" color="error"></y-icon> <!-- decorative, no label -->
```

---

## y-badge

Overlays a count/status on another element.

| Attribute  | Values / Notes                                               |
|-----------|--------------------------------------------------------------|
| `color`   | color scheme name                                             |
| `position`| `top-right` (default) \| `top-left` \| `bottom-right` \| `bottom-left` |
| `size`    | `small` \| `medium` \| `large`                              |

Slots: default (badge label text), `anchor` (element being badged)

```html
<y-badge color="error" position="top-right">5
  <y-button slot="anchor" left-icon="bell">Notifications</y-button>
</y-badge>
```

---

## y-avatar

| Attribute | Values / Notes                                     |
|----------|----------------------------------------------------|
| `src`    | image URL                                           |
| `alt`    | alt text; shown as initials when image unavailable  |
| `shape`  | `circle` (default) \| `square` \| `rounded`        |
| `size`   | `small` \| `medium` \| `large`                    |
| `color`  | color scheme for initials background                |

```html
<y-avatar src="/avatar.jpg" alt="Jane Doe" shape="circle" size="large"></y-avatar>
<y-avatar alt="JD" color="primary" size="medium"></y-avatar> <!-- initials fallback -->
```

---

## y-tag

| Attribute    | Values / Notes                                         |
|-------------|--------------------------------------------------------|
| `color`     | color scheme name                                       |
| `size`      | `small` \| `medium` \| `large`                        |
| `style-type`| `filled` (default) \| `outlined` \| `flat`            |
| `shape`     | `square` (default) \| `round`                          |
| `removable` | boolean — shows close button                           |

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

| Attribute  | Values / Notes                                                       |
|-----------|----------------------------------------------------------------------|
| `icon`    | registered icon name (default: `star`)                               |
| `color`   | color scheme for filled icons (default: `primary`)                   |
| `max`     | total number of icons (default: `5`)                                 |
| `value`   | current rating 0–max (default: `0`)                                  |
| `size`    | `small` \| `medium` (default) \| `large`                            |
| `name`    | form field name                                                       |
| `disabled`| boolean                                                               |
| `readonly`| boolean — shows value, no interaction                                |
| `required`| boolean — prevents clearing to 0 by re-clicking current value       |

Events: `change` — `event.detail.value`

```html
<y-rating name="score" value="3" icon="star" color="warning"></y-rating>
<y-rating value="4" icon="heart" color="error" readonly></y-rating>
<y-rating value="0" max="10" icon="star" color="primary"></y-rating>
```

---

## y-progress

| Attribute       | Values / Notes                         |
|----------------|----------------------------------------|
| `value`        | number 0–100                           |
| `max`          | number (default: 100)                  |
| `indeterminate`| boolean — animated loading bar        |
| `color`        | color scheme name                       |
| `size`         | `small` \| `medium` \| `large`        |

```html
<y-progress value="65" color="primary"></y-progress>
<y-progress indeterminate color="secondary"></y-progress>
```

---

## y-tooltip

| Attribute  | Values / Notes                                              |
|-----------|-------------------------------------------------------------|
| `text`    | tooltip content (required)                                   |
| `position`| `top` (default) \| `bottom` \| `left` \| `right`           |
| `trigger` | `hover` (default) \| `click` \| `focus`                    |

Slot: default (trigger element)

```html
<y-tooltip text="Remove this item" position="top">
  <y-button color="error" style-type="flat"><y-icon name="trash"></y-icon></y-button>
</y-tooltip>
```

---

## y-card

| Attribute | Values / Notes    |
|----------|-------------------|
| `color`  | color scheme name  |

Slots: `image` (flush, no padding, clips to card border radius), `header`, `footer`, default (body)

```html
<y-card>
  <span slot="header">Card Title</span>
  <p>Card body content here.</p>
  <y-button slot="footer" color="primary">Action</y-button>
</y-card>

<!-- Card with flush image -->
<y-card>
  <img slot="image" src="/photo.jpg" alt="..." style="width:100%;height:160px;object-fit:cover;display:block;" />
  <span slot="header">Image Card</span>
  <p>Body content.</p>
</y-card>
```

---

## y-appbar

| Attribute          | Values / Notes                                                                                   |
|-------------------|---------------------------------------------------------------------------------------------------|
| `orientation`     | `vertical` (default) \| `horizontal`                                                              |
| `collapsed`       | boolean — collapses vertical sidebar to icon-only mode                                            |
| `items`           | JSON: `[{"text":"Home","icon":"home","href":"/","children":[...]}]`                               |
| `size`            | `small` \| `medium` (default) \| `large`                                                          |
| `menu-direction`  | `right` \| `down` \| `""` (auto: vertical→right, horizontal→down)                                |
| `sticky`          | `start` \| `end` — sticks to top/left (start) or bottom/right (end)                              |
| `mobile-breakpoint`| px width below which horizontal bar collapses to a hamburger menu (default: `768`)              |
| `history`         | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href`    |

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
<y-appbar id="appbar" items='[...]'></y-appbar>
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

| Attribute    | Values / Notes                                            |
|-------------|-----------------------------------------------------------|
| `open`      | boolean                                                    |
| `position`  | `left` (default) \| `right` \| `top` \| `bottom`         |
| `modal`     | boolean — shows backdrop                                   |
| `persistent`| boolean — backdrop click does not close                   |

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

## y-dialog

| Attribute    | Values / Notes                                     |
|-------------|-----------------------------------------------------|
| `open`      | boolean                                              |
| `persistent`| boolean — backdrop click does not close             |

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

## y-menu

Positioned relative to an `anchor` element. Does NOT use slots for items.

| Attribute   | Values / Notes                                                                                 |
|------------|-----------------------------------------------------------------------------------------------|
| `items`    | JSON: `[{"text":"Edit","url":"...","selected":true,"children":[...]}]`                        |
| `anchor`   | CSS selector or element ID of the trigger element                                              |
| `visible`  | boolean                                                                                        |
| `direction`| `down` (default) \| `up` \| `left` \| `right`                                               |
| `size`     | `small` \| `medium` \| `large`                                                               |
| `history`  | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href` |

Item object fields: `text`, `url`, `selected`, `children`, `icon-template`, `template`

Events: `navigate` — cancelable; `event.detail.href`. Fires before navigation when an item with `url` is clicked.

Use `<template slot="name">` inside `<y-menu>` for custom icon/content templates.

```html
<y-button id="opts-btn" right-icon="chevron-down">Options</y-button>
<y-menu
  id="opts-menu"
  anchor="#opts-btn"
  items='[{"text":"Edit"},{"text":"Delete"}]'
></y-menu>

<script type="module">
  document.getElementById("opts-btn").addEventListener("click", () => {
    document.getElementById("opts-menu").visible = true;
  });
</script>
```

---

## y-toast

| Attribute  | Values / Notes                                                                             |
|-----------|--------------------------------------------------------------------------------------------|
| `position`| `top-right` (default) \| `top-left` \| `top-center` \| `bottom-right` \| `bottom-left` \| `bottom-center` |
| `duration` | number (ms); `0` for persistent                                                           |
| `color`   | color scheme name                                                                           |

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

| Attribute  | Values / Notes                                               |
|-----------|--------------------------------------------------------------|
| `options` | JSON: `[{"id":"tab1","label":"Tab 1"}, ...]`                 |
| `active`  | currently active tab id                                       |
| `position`| `top` (default) \| `bottom` \| `left` \| `right`            |
| `size`    | `small` \| `medium` \| `large`                              |

Events: `change` — `event.detail.id` is the selected tab id

Slots: one slot per tab, named by `id` from options

```html
<y-tabs
  options='[{"id":"overview","label":"Overview"},{"id":"settings","label":"Settings"}]'
  active="overview"
>
  <div slot="overview">Overview content here.</div>
  <div slot="settings">Settings content here.</div>
</y-tabs>
```

---

## y-panelbar + y-panel

Accordion group. `y-panelbar` wraps one or more `y-panel` elements.

**y-panelbar attributes:**
- `exclusive` — boolean, expanding one panel collapses all siblings

**y-panel attributes:**

| Attribute  | Values / Notes                                                                                   |
|-----------|---------------------------------------------------------------------------------------------------|
| `selected` | boolean — active/highlighted state                                                               |
| `expanded` | boolean — children slot is visible                                                               |
| `href`     | URL string — clicking the panel header navigates to this URL                                     |
| `history`  | omit (default) for `pushState` SPA navigation; `"false"` for full-page `window.location.href`   |

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

| Attribute  | Values / Notes                                                              |
|-----------|-----------------------------------------------------------------------------|
| `columns` | JSON: `[{"key":"name","label":"Name"}, ...]`                                |
| `rows`    | JSON: `[{"name":"Alice","email":"a@b.com"}, ...]`                           |
| `striped` | boolean                                                                      |
| `size`    | `small` \| `medium` \| `large`                                             |

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

| Attribute          | Values / Notes                                                                 |
|-------------------|---------------------------------------------------------------------------------|
| `mode`            | `single` (default) \| `range`                                                   |
| `name`            | form field name                                                                  |
| `value`           | ISO string, or `"ISO,ISO"` comma-pair for range                                 |
| `min`, `max`      | ISO date constraints                                                             |
| `format`          | display format (default: `MM/DD/YYYY`). Tokens: `YYYY MM DD HH hh mm ss A a`   |
| `placeholder`     | placeholder text                                                                 |
| `color`           | datepicker color theme (default: `primary`)                                     |
| `size`            | `small` \| `medium` (default) \| `large`                                        |
| `label-position`  | `top` (default) \| `bottom`                                                     |
| `clearable`       | boolean — shows × button when value is set                                      |
| `disabled`        | boolean                                                                          |
| `invalid`         | boolean — error state                                                            |
| `show-hours`      | boolean — show hour column in time picker                                        |
| `show-minutes`    | boolean — show minutes column                                                    |
| `show-seconds`    | boolean — show seconds column                                                    |
| `hour-format`     | `12` (default) \| `24`                                                          |
| `minute-interval` | step between minute options (default: `5`)                                      |
| `second-interval` | step between second options (default: `5`)                                      |
| `show-years`      | `"true"` (default) \| `"false"` — year select in header                        |
| `show-months`     | `"true"` (default) \| `"false"` — month select in header                       |
| `show-days`       | `"true"` (default) \| `"false"` — day grid; `"false"` = month/year picker      |
| `mobile-breakpoint` | px width below which mobile mode activates (default: `768`)                  |
| `native-mobile`   | boolean — use native date inputs on mobile instead of the popup (opt-in)        |

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

| Attribute          | Values / Notes                                                                  |
|-------------------|---------------------------------------------------------------------------------|
| `mode`            | `single` (default) \| `range` — range shows two panels; stacks on mobile        |
| `value`           | ISO string, or `"ISO,ISO"` comma-pair for range                                 |
| `min`, `max`      | ISO date constraints                                                             |
| `format`          | display format (default: `MM/DD/YYYY`)                                          |
| `color`           | color scheme (default: `primary`)                                               |
| `show-hours`      | boolean — show hour column                                                       |
| `show-minutes`    | boolean — show minutes column                                                    |
| `show-seconds`    | boolean — show seconds column                                                    |
| `hour-format`     | `12` (default) \| `24`                                                          |
| `minute-interval` | step between minute options (default: `5`)                                      |
| `second-interval` | step between second options (default: `5`)                                      |
| `show-years`      | `"true"` (default) \| `"false"`                                                 |
| `show-months`     | `"true"` (default) \| `"false"`                                                 |
| `show-days`       | `"true"` (default) \| `"false"` — `"false"` = month picker; also set `show-months="false"` for year picker |
| `mobile-breakpoint` | px width below which range panels stack vertically (default: `768`)          |

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
registerIcon("my-icon", `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="..."/></svg>`);

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
