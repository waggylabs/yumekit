# Contributing to Yumekit

Yumekit is an open-source project and contributions of all kinds are welcome, including bug reports, feature requests, documentation improvements, and code changes.

- All development happens on [GitHub](https://github.com/waggylabs/Yumekit).
- Before starting a large change, open an issue to discuss it so we can align on approach before you invest time.
- We follow a standard fork-and-pull-request workflow.

## Reporting Issues

Found a bug or unexpected behavior? Please open a GitHub issue.

- Search existing issues first to avoid duplicates.
- Include a minimal reproduction. A CodeSandbox or Stackblitz link is ideal.
- Describe what you expected vs. what actually happened.
- Include your browser, OS, and Yumekit version.

## Pull Requests

We welcome pull requests for bug fixes, improvements, and new features.

1. Fork the repository and create a new branch from `main`.
2. Make your changes with clear, focused commits.
3. Add or update tests to cover your change.
4. Ensure `npm run build` and `npm test` pass locally.
5. Open a pull request with a description of what changed and why.
6. A maintainer will review your PR and may request changes.

## Code Style

Yumekit is authored in plain JavaScript. Please follow the conventions already present in the codebase.

- The library is **plain JavaScript** with no TypeScript in the component source. Type declarations (`.d.ts` files) are maintained separately and ship alongside the JS build.
- Components are standard Custom Elements with no external framework dependencies.
- Use `kebab-case` for element names and attribute names.
- Keep components self-contained: styles live in the Shadow DOM, logic in the class, no shared global state.
- Run the linter before submitting: `npx eslint .` (configured in `eslint.config.mjs`).

## Component Authoring Guidelines

### Class structure

Every component class must have exactly four comment-delimited sections in this order — no more, no subdivisions:

```
// Lifecycle
// Getters / Setters
// Public
// Private
```

Methods within their subdivision must be listed alphabetically.

### Method style

Follow a **define → compute → return/apply** flow within each method where possible: gather inputs and state at the top, do the work in the middle, produce output at the end. Keep methods small and focused — if a method grows long or does multiple distinct things, extract a named helper. Minimize nesting by preferring early returns over deep `if/else` trees. Separate distinct logical units of work with blank lines. This ruleset allows humans and AI to have a predictable and human-readable code structure upon which to base future updates.

### DOM element creation

Use the `createElement` helper (imported as `_el`) from `src/modules/helpers.js` for all element creation inside components. Do not use manual `document.createElement` + `setAttribute` chains.

```js
import { createElement as _el } from "../../modules/helpers.js";

const btn = _el("button", { role: "tab", "aria-label": label }, [labelText]);
```

### Icons

Use `<y-icon name="...">` for all icons. Never inline SVG strings or constants. Import `y-icon.js` at the top of any component that renders icons.

### Slot patterns

Always render named slots unconditionally and place default/fallback content as **children of the slot element**. Never use `querySelector` to decide whether to create a slot. This breaks framework rendering (React, Vue, etc.) where children may arrive after the element upgrades.

```js
// Correct
const slot = _el("slot", { name: "icon" });
slot.appendChild(defaultIcon);
parent.appendChild(slot);

// Wrong — slot is conditional on a render-time DOM query
if (this.querySelector('[slot="icon"]')) { ... }
```

### Security — handling untrusted input

The DOM-element, icon, and slot rules above exist primarily to keep user-controlled values out of `innerHTML` template strings, where attribute interpolation can break out of the surrounding quote. Building the shadow tree with `_el` and writing values through `setAttribute` makes that breakout impossible — the entire string becomes a single attribute value, no matter what quotes or angle brackets it contains. Two shared helpers cover the cases where `_el` alone isn't enough:

- **CSS color literals (`isSafeCssColor` from `src/modules/helpers.js`).** When a component paints a user-supplied color into any CSS context — an inline `style` attribute, a `<style>` block built via `replaceSync`, or a CSS variable — gate the value through `isSafeCssColor` first. It accepts `#hex` and the browser-native color functions (`rgb()`/`rgba()`, `hsl()`/`hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`); the function body may contain only the characters those forms use, so named colors, `var(...)`, `currentColor`, nested functions, and anything with semicolons, braces, or angle brackets are rejected. Fall back to a semantic theme default when the check fails. `y-badge` and `y-select` (per-option `color`) follow this pattern.

- **SVG markup (`getSanitizedIcon` / `sanitizeSvg` from `src/modules/svg-sanitizer.js`).** Any time you would render an SVG that originated outside the bundled icon set — e.g. anything coming back from `getIcon(name)` where `name` could resolve to a `registerIcon` payload — run it through the shared sanitizer first. `<y-icon>` is the simplest path; if you need raw markup, call `getSanitizedIcon(name)` and inject the returned string. The sanitizer strips every element and attribute outside the SVG allowlist (no `<script>`, no `onload`, no `xlink:href`, …) and memoizes results per icon name.

### New component checklist

Every new component requires changes to the following: `README.md`, `CHANGELOG.md`, `reference.md`, `SKILL.md`, `react.d.ts`, its token sets under `tokens/` (see [Design Tokens](#design-tokens)), entry in `llm.txt`, and a `y-*.stories.js` stories file. See [AI Documentation](#ai-documentation) for the docs that are checked automatically.

### Testing

- Tests co-locate with the component source file.
- Use `sinon.createSandbox()` at the `describe` level with `afterEach(() => sandbox.restore())`. Never call `stub.restore()` manually — it leaks on assertion failure.
- Use `sandbox.stub(...)` rather than `sinon.stub(...)` directly.
- Run the suite with `npm test` (Web Test Runner with coverage).
- After a build, `npm run test:dist` validates the published output: it checks that every relative import emitted into `dist/` resolves on disk (`scripts/check-dist-imports.js`) and smoke-tests deep-imported component bundles in a real browser (`test/dist-smoke.test.js`). It also runs automatically on `prepublishOnly`.

## Design Tokens

Tokens are the source of truth for the visual design system. The JSON under `tokens/` drives the generated CSS under `styles/`.

### Layout

- `tokens/core/colors.json` — palette primitives (neutral, red, blue, etc.)
- `tokens/core/numerics.json` — border / spacing / radii / sizing / font-size primitives
- `tokens/core/components.json` — component dimensional tokens (widths, sizes, gaps)
- `tokens/themes/{name}.json` — per-theme semantic tokens and component color overrides
- `tokens/$themes.json` — Tokens Studio theme manifest
- `tokens/$metadata.json` — token-set order

### Building CSS

Run `npm run build:tokens` to regenerate all files under `styles/`. The full `npm run build` runs this first before bundling, and `prepublishOnly` invokes `build`, so published packages always reflect the current tokens.

Generated outputs:

- `styles/variables.css` — palette + numerics + component dims + the default theme (Blue Light)
- `styles/{slug}.css` — per-theme override files (one per Themes entry in the manifest)

### Figma sync

Use the [Tokens Studio for Figma](https://tokens.studio/) plugin pointed at this repo's `tokens/` directory to keep Figma Variables in sync with code.

## AI Documentation

Yumekit ships AI-facing docs alongside the package: `llm.txt` and the Claude skill under `.claude/skills/yumekit/` (`SKILL.md`, `reference.md`, `patterns.md`, `examples/`). These are bundled into `dist/ai/` at build time and can be installed into a consumer project with `npx @waggylabs/yumekit init-ai`.

Two scripts keep these docs honest, and both run automatically in `pretest` and `prepublishOnly`:

- **`npm run sync:docs`** stamps mechanical numbers (package version, registered-component count, theme count) into `llm.txt` and the skill docs from source. Don't hand-edit those numbers. Run with `-- --check` to fail on drift.
- **`npm run check:docs`** cross-references each component's `observedAttributes` against `react.d.ts`, `llm.txt`, and `reference.md`, flagging any observed attribute that isn't documented. It checks attribute *names* only — value enums, defaults, and prose are still up to you.

When you add or change a component's public API (attributes, slots, events, methods), update its entry in `llm.txt`, `.claude/skills/yumekit/reference.md`, and the JSX types in `src/react.d.ts` in the same change. The sync script does not author this prose for you.

## AI Assistance

AI tools can be helpful for brainstorming and prototyping, but they are not a substitute for human judgment and expertise.

- If you use AI tools to assist with code or documentation, please disclose that in your PR description for transparency.
- AI-generated content should be carefully reviewed and edited by a human before submission.
- We value the unique creativity and critical thinking that humans bring to the project, and AI should be viewed as a tool to augment that rather than replace it.

## Code of Conduct

We are committed to providing a welcoming, respectful community for everyone.

- Be kind and constructive in all interactions.
- Respect differing opinions and experience levels.
- Harassment or abusive behavior of any kind will not be tolerated and may result in removal from the project.
