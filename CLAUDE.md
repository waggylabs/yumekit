# YumeKit — Claude Code Instructions

This file is automatically loaded by Claude Code. It contains project-specific conventions that apply to all AI-assisted work on this repository.

For full contributing guidelines see [CONTRIBUTING.md](CONTRIBUTING.md).

## Component Structure

Every `y-*` component class must have exactly four comment-delimited sections, in this order:

```
// Lifecycle
// Getters / Setters
// Public
// Private
```

No sub-sections. Methods within Public and Private must be **alphabetical**.

## Method Style

Follow a **define → compute → return/apply** flow where possible:

- Gather inputs and state at the top
- Do the work in the middle
- Produce output or apply side effects at the end

Keep methods small and focused. If a method grows long or does multiple distinct things, extract a named helper. Minimize nesting — prefer early returns over deep `if/else` trees. Separate distinct logical units with blank lines.

## DOM Helpers

Use `createElement` (imported as `_el`) from `src/modules/helpers.js` for all element creation inside components:

```js
import { createElement as _el } from "../../modules/helpers.js";

const btn = _el("button", { role: "tab", "aria-label": label }, [labelText]);
```

Do not use manual `document.createElement` + `setAttribute` chains.

## Icons

Always use `<y-icon name="...">`. Never inline SVG strings or constants. Import `y-icon.js` at the top of any component that needs icons:

```js
import "../y-icon/y-icon.js";
```

## Slot Patterns

Always render named slots unconditionally and place default/fallback content as children of the slot element. Never use `querySelector` to decide whether to create a slot — this breaks framework rendering where children arrive after upgrade.

```js
// Correct — slot always exists, fallback inside it
const slot = _el("slot", { name: "my-slot" });
slot.appendChild(defaultContent);

// Wrong — slot only created if content already exists at render time
if (this.querySelector('[slot="my-slot"]')) { ... }
```

## New Component Checklist

Every new component requires: `README.md`, `CHANGELOG.md`, `reference.md`, `SKILL.md`, `react.d.ts`, `variables.css`, `.figma/variables.json`, `llm.txt` entry, and a story in `y-*.stories.js`.

## Testing

- Tests live alongside the component source file.
- Use `sinon.createSandbox()` at the `describe` level with `afterEach(() => sandbox.restore())`. Never manually call `stub.restore()` — it leaks on assertion failure.
- Use `sandbox.stub(...)` not `sinon.stub(...)` directly.
