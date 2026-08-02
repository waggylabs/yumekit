# YumeKit Patterns & Recipes

Common multi-component patterns. Adapt these for specific use cases.

---

## Full Page Shell — Horizontal Top Bar

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-appbar";
  import "@waggylabs/yumekit/components/y-icon";
  import "@waggylabs/yumekit/icons/all.js";
</script>

<y-theme theme="blue-light">
  <y-appbar
    orientation="horizontal"
    sticky="start"
    items='[{"text":"Dashboard","icon":"home","href":"/"},{"text":"Reports","icon":"diagram","href":"/reports"},{"text":"Settings","icon":"gear","href":"/settings"}]'
  >
    <y-icon slot="logo" name="bolt" size="medium"></y-icon>
    <span slot="title">MyApp</span>
    <y-avatar slot="footer" alt="JD" size="small" color="primary"></y-avatar>
  </y-appbar>

  <main style="padding: 1rem;">
    <!-- page content -->
  </main>
</y-theme>
```

---

## Full Page Shell — Vertical Sidebar

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-appbar";
  import "@waggylabs/yumekit/components/y-icon";
  import "@waggylabs/yumekit/icons/all.js";
</script>

<y-theme theme="blue-light">
  <div style="display: flex; height: 100vh;">
    <y-appbar
      orientation="vertical"
      sticky="start"
      items='[{"text":"Dashboard","icon":"home","href":"/"},{"text":"Reports","icon":"diagram","href":"/reports"},{"text":"Settings","icon":"gear","href":"/settings"}]'
    >
      <y-icon slot="logo" name="bolt" size="medium"></y-icon>
      <span slot="title">MyApp</span>
    </y-appbar>

    <main style="flex: 1; padding: 1rem; overflow-y: auto;">
      <!-- page content -->
    </main>
  </div>
</y-theme>
```

---

## Login Form

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-card";
  import "@waggylabs/yumekit/components/y-input";
  import "@waggylabs/yumekit/components/y-button";
  import "@waggylabs/yumekit/components/y-toast";
</script>

<y-theme theme="blue-light">
  <div style="display:flex; justify-content:center; align-items:center; min-height:100vh;">
    <y-card style="width:360px;">
      <span slot="header">Sign In</span>

      <form id="login-form" style="display:flex; flex-direction:column; gap:1rem;">
        <y-input type="email" name="email" label="Email" placeholder="you@example.com" required></y-input>
        <y-input type="password" name="password" label="Password" required></y-input>
        <y-button type="submit" color="primary">Sign In</y-button>
      </form>

      <y-button slot="footer" variant="flat">Forgot password?</y-button>
    </y-card>
  </div>

  <y-toast id="toast" position="bottom-right"></y-toast>
</y-theme>

<script type="module">
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    // handle login...
    document.getElementById("toast").show("Login successful!", { color: "success" });
  });
</script>
```

---

## Data Table with Actions

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-table";
  import "@waggylabs/yumekit/components/y-button";
  import "@waggylabs/yumekit/components/y-menu";
  import "@waggylabs/yumekit/components/y-dialog";
  import "@waggylabs/yumekit/components/y-toast";
  import "@waggylabs/yumekit/icons/all.js";
</script>

<y-theme theme="blue-light">
  <y-table
    id="users-table"
    columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"},{"key":"role","label":"Role"}]'
    rows='[{"name":"Alice","email":"alice@example.com","role":"Admin"},{"name":"Bob","email":"bob@example.com","role":"User"}]'
    striped
  ></y-table>

  <y-dialog id="delete-dialog" persistent>
    <span slot="header">Confirm Delete</span>
    <p>This action cannot be undone. Are you sure?</p>
    <y-button slot="footer" id="cancel-btn" variant="outlined">Cancel</y-button>
    <y-button slot="footer" id="confirm-btn" color="error">Delete</y-button>
  </y-dialog>

  <y-toast id="toast" position="bottom-right"></y-toast>
</y-theme>

<script type="module">
  const dialog = document.getElementById("delete-dialog");
  const toast = document.getElementById("toast");

  document.getElementById("cancel-btn").addEventListener("click", () => dialog.hide());
  document.getElementById("confirm-btn").addEventListener("click", () => {
    dialog.hide();
    toast.show("Record deleted.", { color: "error" });
  });
</script>
```

---

## Loading & Skeleton States

Data-driven components (`y-data-grid`, `y-table`, `y-avatar`) render shape-accurate
placeholders on first load — no spinner over an empty region. Set `loading` and,
for the grid, let `loading-mode="auto"` show a skeleton on first load and dim the
existing data on a refetch.

```html
<!-- Grid: skeleton on first load, overlay-on-refetch, automatically -->
<y-data-grid id="grid" columns="..." loading></y-data-grid>
<!-- Table: skeleton is the only loading presentation -->
<y-table columns="..." loading skeleton-rows="6"></y-table>
<!-- Avatar: circle/rounded/square placeholder matching size + shape -->
<y-avatar loading size="large"></y-avatar>

<script type="module">
  const grid = document.getElementById("grid");
  const rows = await fetchRows();        // grid shows placeholder rows meanwhile
  grid.data = rows;
  grid.removeAttribute("loading");       // placeholders swap to real rows, no layout shift
</script>
```

Containers without a fixed content shape (`y-card`, list rows) compose the Phase 1
`<y-skeleton>` primitive directly rather than exposing a `loading` attribute:

```html
<!-- Loading card: media block + title line + two body lines -->
<y-card>
  <y-skeleton variant="rect" height="160px" slot="image"></y-skeleton>
  <y-skeleton variant="text" width="60%"></y-skeleton>
  <y-skeleton variant="text" lines="2"></y-skeleton>
</y-card>

<!-- Loading list row: avatar beside stacked text lines -->
<y-stack direction="row" gap="medium" align="center">
  <y-skeleton variant="circle" width="40px" height="40px"></y-skeleton>
  <y-stack direction="column" gap="x-small" style="flex:1">
    <y-skeleton variant="text" width="40%"></y-skeleton>
    <y-skeleton variant="text" width="70%"></y-skeleton>
  </y-stack>
</y-stack>
```

`prefers-reduced-motion: reduce` renders every skeleton as a static block — verified
at the composed level where many placeholders animate at once.

---

## Settings Form with Sections

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-panelbar";
  import "@waggylabs/yumekit/components/y-panel";
  import "@waggylabs/yumekit/components/y-input";
  import "@waggylabs/yumekit/components/y-select";
  import "@waggylabs/yumekit/components/y-switch";
  import "@waggylabs/yumekit/components/y-button";
</script>

<y-theme theme="blue-light" style="display:block; max-width:640px; margin:2rem auto;">
  <form id="settings-form">
    <y-panelbar multi>
      <y-panel label="Profile" open>
        <div style="display:flex; flex-direction:column; gap:1rem; padding:1rem 0;">
          <y-input type="text" name="display_name" label="Display Name"></y-input>
          <y-input type="email" name="email" label="Email"></y-input>
        </div>
      </y-panel>

      <y-panel label="Preferences">
        <div style="display:flex; flex-direction:column; gap:1rem; padding:1rem 0;">
          <y-select
            name="language"
            label="Language"
            options='[{"value":"en","label":"English"},{"value":"es","label":"Spanish"},{"value":"fr","label":"French"}]'
          ></y-select>
          <y-switch name="notifications" label="Email notifications" checked></y-switch>
          <y-switch name="marketing" label="Marketing emails"></y-switch>
        </div>
      </y-panel>

      <y-panel label="Danger Zone">
        <div style="padding:1rem 0;">
          <y-button color="error" variant="outlined">Delete Account</y-button>
        </div>
      </y-panel>
    </y-panelbar>

    <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
      <y-button variant="outlined">Cancel</y-button>
      <y-button type="submit" color="primary">Save Changes</y-button>
    </div>
  </form>
</y-theme>
```

---

## Tabbed Dashboard

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-tabs";
  import "@waggylabs/yumekit/components/y-card";
  import "@waggylabs/yumekit/components/y-progress";
  import "@waggylabs/yumekit/components/y-badge";
  import "@waggylabs/yumekit/components/y-button";
  import "@waggylabs/yumekit/icons/all.js";
</script>

<y-theme theme="blue-light" style="display:block; padding:1rem;">
  <y-tabs
    options='[{"id":"overview","label":"Overview","slot":"overview"},{"id":"activity","label":"Activity","slot":"activity"},{"id":"settings","label":"Settings","slot":"settings"}]'
  >
    <div slot="overview" style="display:flex; gap:1rem; flex-wrap:wrap; padding:1rem 0;">
      <y-card style="flex:1; min-width:200px;">
        <span slot="header">Storage Used</span>
        <y-progress value="72" color="warning"></y-progress>
        <p>72% of 100GB</p>
      </y-card>
      <y-card style="flex:1; min-width:200px;">
        <span slot="header">Tasks Complete</span>
        <y-progress value="45" color="success"></y-progress>
        <p>45 of 100</p>
      </y-card>
    </div>

    <div slot="activity" style="padding:1rem 0;">
      <p>Recent activity will appear here.</p>
    </div>

    <div slot="settings" style="padding:1rem 0;">
      <p>Dashboard settings.</p>
    </div>
  </y-tabs>
</y-theme>
```

---

## Confirmation Dialog Pattern

```javascript
// Reusable confirm helper
function confirmAction(message) {
  return new Promise((resolve) => {
    const dialog = document.createElement("y-dialog");
    dialog.setAttribute("persistent", "");
    dialog.innerHTML = `
      <span slot="header">Confirm</span>
      <p>${message}</p>
      <y-button slot="footer" id="cancel" variant="outlined">Cancel</y-button>
      <y-button slot="footer" id="confirm" color="primary">Confirm</y-button>
    `;
    document.body.appendChild(dialog);
    dialog.show();

    dialog.querySelector("#cancel").addEventListener("click", () => {
      dialog.hide();
      dialog.remove();
      resolve(false);
    });
    dialog.querySelector("#confirm").addEventListener("click", () => {
      dialog.hide();
      dialog.remove();
      resolve(true);
    });
  });
}

// Usage
const confirmed = await confirmAction("Are you sure you want to proceed?");
if (confirmed) { /* ... */ }
```

---

## Notification Toast Helper

```javascript
// Setup once in your app
const toast = document.createElement("y-toast");
toast.setAttribute("position", "bottom-right");
document.body.appendChild(toast);

export const notify = {
  success: (msg) => toast.show(msg, { color: "success", duration: 3000 }),
  error:   (msg) => toast.show(msg, { color: "error",   duration: 0 }),
  warning: (msg) => toast.show(msg, { color: "warning", duration: 4000 }),
  info:    (msg) => toast.show(msg, { color: "base",    duration: 3000 }),
};

// Usage
notify.success("Profile saved.");
notify.error("Failed to connect. Please try again.");
```

---

## Dynamic Theme Switching

```html
<y-theme id="app-theme" theme="blue-light">
  <!-- app -->
</y-theme>

<y-button id="toggle-theme">Toggle Dark Mode</y-button>

<script type="module">
  const theme = document.getElementById("app-theme");
  document.getElementById("toggle-theme").addEventListener("click", () => {
    const current = theme.getAttribute("theme");
    theme.setAttribute("theme", current === "blue-light" ? "blue-dark" : "blue-light");
  });
</script>
```

---

## React Integration

```jsx
// main.jsx
import "@waggylabs/yumekit";
// types are auto-resolved from the react export condition

export function LoginPage() {
  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    // ...
  };

  return (
    <y-theme theme="blue-light">
      <y-card>
        <span slot="header">Sign In</span>
        <form onSubmit={handleSubmit}>
          <y-input type="email" name="email" label="Email" required />
          <y-input type="password" name="password" label="Password" required />
          <y-button type="submit" color="primary">Sign In</y-button>
        </form>
      </y-card>
    </y-theme>
  );
}
```

Note: For React event handling on custom elements, use `ref` and `addEventListener` for custom events (e.g., `change` on `y-select`):

```jsx
import { useRef, useEffect } from "react";

function MySelect() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const handler = (e) => console.log(e.detail);
    el.addEventListener("change", handler);
    return () => el.removeEventListener("change", handler);
  }, []);

  return (
    <y-select
      ref={ref}
      options='[{"value":"a","label":"A"}]'
    />
  );
}
```
