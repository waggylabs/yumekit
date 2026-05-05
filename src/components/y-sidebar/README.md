# y-sidebar

A collapsible vertical navigation sidebar. Renders a branded header, a scrollable body of nav items, and a footer with a collapse toggle. Items can also be supplied as slotted link elements (e.g. Vue Router's `<router-link>`, React Router's `<NavLink>`, plain `<a>`) for full framework router support.

## Usage

```html
<y-sidebar
    items='[
        {"text":"Dashboard","icon":"home","href":"/","selected":true},
        {"text":"Projects","icon":"folder","href":"/projects"},
        {"text":"Reports","icon":"waveform","href":"/reports"}
    ]'
    sticky="start"
>
    <img slot="logo" src="/logo.svg" alt="Logo" width="32" height="32" />
    <span slot="title">MyApp</span>
</y-sidebar>
```

### Mixed items + framework router links

```html
<y-sidebar items='[{"text":"Dashboard","icon":"home","href":"/"}]'>
    <router-link to="/projects">Projects</router-link>
    <router-link to="/settings">Settings</router-link>
</y-sidebar>
```

## Attributes

| Attribute        | Type    | Default    | Description                                                                     |
| ---------------- | ------- | ---------- | ------------------------------------------------------------------------------- |
| `collapsed`      | boolean | `false`    | Collapses the sidebar to icon-only width.                                       |
| `items`          | JSON    | `[]`       | Array of `{ text, icon?, href?, selected?, slot?, children? }` nav items.       |
| `size`           | string  | `"medium"` | `"small"` \| `"medium"` \| `"large"`                                            |
| `menu-direction` | string  | `"right"`  | Direction submenus pop out: `"right"` \| `"down"`                               |
| `sticky`         | string  | —          | `"start"` (left edge) \| `"end"` (right edge) — `position: sticky`              |
| `history`        | string  | —          | Omit for `pushState` SPA navigation; set to `"false"` for full-page navigation. |

### Item schema

| Field      | Type    | Description                                                                    |
| ---------- | ------- | ------------------------------------------------------------------------------ |
| `text`     | string  | Label text.                                                                    |
| `icon`     | string  | Registered `<y-icon>` name. Custom glyphs must be added via the icon registry. |
| `href`     | string  | Navigation target.                                                             |
| `selected` | boolean | Force active state. Auto-detected from `location.pathname` when `href` is set. |
| `slot`     | string  | Named slot in the sidebar's light DOM whose content replaces the button.       |
| `children` | array   | Sub-items rendered in a `y-menu` flyout.                                       |

## Methods

| Method     | Description                                                            |
| ---------- | ---------------------------------------------------------------------- |
| `toggle()` | Flips the collapsed state.                                             |
| `render()` | Re-renders the shadow DOM (called automatically on attribute changes). |

## Slots

| Slot     | Description                                                                                                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `logo`   | Logo image or icon aligned to the icon column.                                                                                             |
| `title`  | App/section title text, hidden when collapsed.                                                                                             |
| `header` | Additional header content below logo/title.                                                                                                |
| `footer` | Content placed above the collapse button in the footer.                                                                                    |
| default  | Slotted link elements (router links, `<a>` tags, custom nav items). Full-width when expanded; clipped to icon-column width when collapsed. |

## Events

| Event      | Cancelable | Detail     | Description                                         |
| ---------- | ---------- | ---------- | --------------------------------------------------- |
| `navigate` | Yes        | `{ href }` | Fired before navigation. Prevent default to cancel. |

## CSS Custom Properties

All `--component-sidebar-*` tokens fall back to `--component-appbar-*` equivalents so existing appbar theme tokens apply automatically.

| Property                                     | Default (fallback) | Description                           |
| -------------------------------------------- | ------------------ | ------------------------------------- |
| `--component-sidebar-width`                  | `240px`            | Expanded width.                       |
| `--component-sidebar-collapsed-width-small`  | `40px`             | Collapsed width at small size.        |
| `--component-sidebar-collapsed-width-medium` | `52px`             | Collapsed width at medium size.       |
| `--component-sidebar-collapsed-width-large`  | `64px`             | Collapsed width at large size.        |
| `--component-sidebar-background`             | `#0c0c0d`          | Background color.                     |
| `--component-sidebar-color`                  | `#f7f7fa`          | Foreground/text color.                |
| `--component-sidebar-border-width`           | `2px`              | Outer border width.                   |
| `--component-sidebar-border-color`           | `#37383a`          | Outer border color.                   |
| `--component-sidebar-border-radius`          | `4px`              | Corner radius (disabled when sticky). |
| `--component-sidebar-inner-border-width`     | `(border-width)`   | Header/footer separator width.        |
| `--component-sidebar-z-index`                | `100`              | z-index when sticky.                  |

### Host-exposed properties (for slotted items)

| Property                     | Values     | Description                                              |
| ---------------------------- | ---------- | -------------------------------------------------------- |
| `--y-sidebar-collapsed`      | `0` / `1`  | `1` when collapsed; `0` when expanded.                   |
| `--y-sidebar-icon-col-width` | CSS length | Width of the icon column. Use to align custom nav items. |

## CSS Parts

| Part     | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| `header` | The header section containing logo and title slots.                |
| `body`   | The scrollable body section.                                       |
| `footer` | The footer section containing the footer slot and collapse button. |
| `icon`   | Icons rendered inside nav item buttons.                            |

## Accessibility

- The `.sidebar` div carries `role="navigation"`.
- The active item is marked with `aria-current="page"` and receives the `"primary"` color; inactive items use `"base"`.
- Active state is auto-detected from `window.location` when `href` is set (checks `pathname + search + hash`), or set explicitly via `selected: true` on the item.
- The collapse button has a dynamic `aria-label`: `"Collapse sidebar"` / `"Expand sidebar"`.
- Submenu flyouts are rendered by `y-menu`, which applies `role="menu"` to its dropdown, `role="menuitem"` to each child, and sets `aria-haspopup="menu"` plus a live `aria-expanded` toggle on the resolved trigger element.
