# YumeKit Patterns & Recipes

Common multi-component patterns. Adapt these for specific use cases.

---

## Full Page Shell

```html
<script type="module">
  import "@waggylabs/yumekit/components/y-theme";
  import "@waggylabs/yumekit/components/y-appbar";
  import "@waggylabs/yumekit/components/y-drawer";
  import "@waggylabs/yumekit/components/y-button";
  import "@waggylabs/yumekit/components/y-icon";
  import "@waggylabs/yumekit/icons/all.js";
</script>

<y-theme theme="blue" mode="light">
  <y-appbar sticky color="primary">
    <span slot="brand">MyApp</span>
    <nav slot="nav">
      <y-button style-type="flat">Dashboard</y-button>
      <y-button style-type="flat">Reports</y-button>
    </nav>
    <div slot="actions">
      <y-button id="menu-toggle" style-type="flat"><y-icon name="menu"></y-icon></y-button>
    </div>
  </y-appbar>

  <y-drawer id="sidebar" position="left" modal>
    <y-button style-type="flat" left-icon="home">Home</y-button>
    <y-button style-type="flat" left-icon="settings">Settings</y-button>
  </y-drawer>

  <main style="padding: 1rem;">
    <!-- page content -->
  </main>
</y-theme>

<script type="module">
  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.getElementById("sidebar").show();
  });
</script>
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

<y-theme theme="blue" mode="light">
  <div style="display:flex; justify-content:center; align-items:center; min-height:100vh;">
    <y-card style="width:360px;">
      <span slot="header">Sign In</span>

      <form id="login-form" style="display:flex; flex-direction:column; gap:1rem;">
        <y-input type="email" name="email" label="Email" placeholder="you@example.com" required></y-input>
        <y-input type="password" name="password" label="Password" required></y-input>
        <y-button type="submit" color="primary">Sign In</y-button>
      </form>

      <y-button slot="footer" style-type="flat">Forgot password?</y-button>
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

<y-theme theme="blue" mode="light">
  <y-table
    id="users-table"
    columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"},{"key":"role","label":"Role"}]'
    rows='[{"name":"Alice","email":"alice@example.com","role":"Admin"},{"name":"Bob","email":"bob@example.com","role":"User"}]'
    striped
  ></y-table>

  <y-dialog id="delete-dialog" persistent>
    <span slot="header">Confirm Delete</span>
    <p>This action cannot be undone. Are you sure?</p>
    <y-button slot="footer" id="cancel-btn" style-type="outlined">Cancel</y-button>
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

<y-theme theme="blue" mode="light" style="display:block; max-width:640px; margin:2rem auto;">
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
          <y-button color="error" style-type="outlined">Delete Account</y-button>
        </div>
      </y-panel>
    </y-panelbar>

    <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
      <y-button style-type="outlined">Cancel</y-button>
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

<y-theme theme="blue" mode="light" style="display:block; padding:1rem;">
  <y-tabs
    options='[{"id":"overview","label":"Overview"},{"id":"activity","label":"Activity"},{"id":"settings","label":"Settings"}]'
    active="overview"
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
      <y-button slot="footer" id="cancel" style-type="outlined">Cancel</y-button>
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
<y-theme id="app-theme" theme="blue" mode="light">
  <!-- app -->
</y-theme>

<y-button id="toggle-theme">Toggle Dark Mode</y-button>

<script type="module">
  const theme = document.getElementById("app-theme");
  document.getElementById("toggle-theme").addEventListener("click", () => {
    theme.setAttribute("mode", theme.getAttribute("mode") === "light" ? "dark" : "light");
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
    <y-theme theme="blue" mode="light">
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
