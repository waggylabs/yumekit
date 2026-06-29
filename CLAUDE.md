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

No sub-sections. Members within Getters / Setters, Public, and Private must be **alphabetical**. In Getters / Setters, keep each property's `get`/`set` pair (and its doc comment) together and order by property name.

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

## Untrusted Input

Two cases need extra care — `_el` alone doesn't cover them:

- **CSS color literals.** When painting a user-supplied color into any CSS context (inline `style`, `<style>` block, CSS variable), gate the value through `isSafeCssColor` from `src/modules/helpers.js` and fall back to a semantic theme default when it fails. The helper accepts `#hex` and the browser-native color functions (`rgb()`/`rgba()`, `hsl()`/`hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`). See `y-badge` and `y-select` (per-option `color`) for the pattern.
- **SVG markup.** Anything that ultimately came from `registerIcon(name, svg)` must go through the shared sanitizer in `src/modules/svg-sanitizer.js` before it touches `innerHTML`. Prefer `<y-icon name="…">`; if you need raw markup, call `getSanitizedIcon(name)`.

## New Component Checklist

Every new component requires: `README.md`, `CHANGELOG.md`, `reference.md`, `SKILL.md`, `react.d.ts`, token entries under `tokens/core/components.json` and each `tokens/themes/*.json` (run `npm run build:tokens` to regenerate `styles/`), `llm.txt` entry, and a story in `y-*.stories.js`.

## Design Tokens

Tokens under `tokens/` are the source of truth. `styles/*.css` is generated — never edit it directly. Run `npm run build:tokens` after any token change. `npm run build` chains the tokens build first.

## AI Documentation

`llm.txt` and the Claude skill (`.claude/skills/yumekit/` — `SKILL.md`, `reference.md`, `patterns.md`, `examples/`) are the AI-facing docs that ship with the package (bundled into `dist/ai/` at build time; installable into a consumer project via `npx @waggylabs/yumekit init-ai`). Keep them current:

- **Mechanical numbers are synced automatically.** Version, registered-component count, and theme count are stamped from source by `npm run sync:docs` (`scripts/sync-llm-docs.js`), which runs as part of `npm run build`. Don't hand-edit those numbers; if you restructure the surrounding prose, update the anchor patterns in that script. `npm run sync:docs -- --check` fails on drift.
- **API prose is hand-authored.** When you add or change a component's public API (attributes, slots, events, methods), update the component's entry in `llm.txt`, `.claude/skills/yumekit/reference.md`, and the JSX types in `src/react.d.ts` in the same change — the sync script does not touch these.
- **Attribute coverage is checked.** `npm run check:docs` (`scripts/check-docs.js`) cross-references every component's `observedAttributes` against `react.d.ts`, `llm.txt`, and `reference.md`, flagging attributes that aren't documented. It runs in `pretest` (and `prepublishOnly`) with `--check`, so adding an observed attribute without documenting it fails the build. It checks attribute *names* only — value enums, defaults, and prose are still on you to keep accurate.
- **Icon and component names are checked.** The same `check:docs` run also validates every icon referenced in the AI docs (`<y-icon name="…">`, `left-icon`/`right-icon`/`icon="…"`, JSON `"icon": "…"`) against the bundled `src/icons/*.svg` basenames, and every `<y-foo>` tag against the registered custom elements. Renaming an icon or component therefore fails the build until the docs (`llm.txt`, the skill's `reference.md`/`patterns.md`/`SKILL.md`, and `examples/`) are updated. Schema placeholders and planned-but-unregistered tags are allowlisted at the top of `check-docs.js`.

## Testing

- Tests live alongside the component source file.
- Use `sinon.createSandbox()` at the `describe` level with `afterEach(() => sandbox.restore())`. Never manually call `stub.restore()` — it leaks on assertion failure.
- Use `sandbox.stub(...)` not `sinon.stub(...)` directly.
