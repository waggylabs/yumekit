/**
 * Theme registry — a runtime map of theme names to CSS strings, plus the
 * application-level policy that decides which of them <y-theme> may apply.
 *
 * Register only the themes your app ships:
 *
 *   import { registerTheme } from "@waggylabs/yumekit";
 *   registerTheme("waggy", waggyCssString, { font: null });
 *
 * Or register all bundled themes at once (separate import):
 *
 *   import "@waggylabs/yumekit/themes/all.js";
 *
 * A theme that was never registered cannot be applied, because its CSS is not
 * present in the page. `configureThemes` narrows that further — restricting the
 * permitted names and deciding whether a `theme` value may be treated as a URL
 * at all:
 *
 *   configureThemes({ allow: ["waggy", "waggy-dark"], fallback: "waggy" });
 *
 * This is an application guardrail, not a security boundary. Anything reachable
 * from the page can be edited or monkey-patched by someone with devtools; the
 * policy exists to stop untrusted *input* — a `?theme=` query param, a CMS
 * field, a stored preference — from reaching the URL loader.
 */

/** Google Fonts `family=` query used by themes that don't name their own. */
export const DEFAULT_FONT = "Lexend:wght@100..900";

const themes = new Map();

const policy = {
    allow: null,
    fallback: "blue-light",
    allowUrls: false,
    allowCrossOriginUrls: false,
};

/**
 * Merges options over the current theme policy. Omitted keys are left
 * unchanged, so repeated calls accumulate rather than replace.
 * @param {object} [options] - Any subset of `allow`, `fallback`, `allowUrls`,
 *   `allowCrossOriginUrls`.
 */
export function configureThemes(options = {}) {
    for (const key of Object.keys(policy)) {
        if (key in options) policy[key] = options[key];
    }
    // Copy the allow list so a caller mutating the array it passed in cannot
    // widen the policy afterwards.
    if (Array.isArray(policy.allow)) policy.allow = [...policy.allow];
}

/** Registered CSS for a theme name, or `""` when it isn't registered. */
export function getTheme(name) {
    const entry = themes.get(name);
    return entry ? entry.css : "";
}

/**
 * Google Fonts `family=` query for a theme, or `null` when the theme ships a
 * native system-font stack. Unregistered names resolve to the default font.
 */
export function getThemeFont(name) {
    const entry = themes.get(name);
    return entry ? entry.font : DEFAULT_FONT;
}

/** Names of all currently-registered themes, in registration order. */
export function getThemeNames() {
    return [...themes.keys()];
}

/** A copy of the current theme policy. Mutating the result changes nothing. */
export function getThemePolicy() {
    return { ...policy, allow: policy.allow ? [...policy.allow] : policy.allow };
}

/** Whether a theme name has been registered. */
export function hasTheme(name) {
    return themes.has(name);
}

/**
 * Whether a theme name is registered and permitted by the current `allow` list.
 */
export function isThemeAllowed(name) {
    if (!themes.has(name)) return false;
    return policy.allow === null || policy.allow.includes(name);
}

/**
 * Registers one theme. Re-registering a name overwrites it.
 * @param {string} name - Theme name, as used by `<y-theme theme="...">`.
 * @param {string} css - The theme's CSS text.
 * @param {object} [options] - `font` is the Google Fonts `family=` query, or
 *   `null` for a native system-font stack. Omitted means the default font.
 */
export function registerTheme(name, css, options = {}) {
    const font = "font" in options ? options.font : DEFAULT_FONT;
    themes.set(name, { css, font });
}

/**
 * Bulk-registers themes.
 * @param {object} entries - `{ [name]: css }` or `{ [name]: { css, font } }`.
 */
export function registerThemes(entries) {
    for (const [name, entry] of Object.entries(entries)) {
        if (typeof entry === "string") registerTheme(name, entry);
        else registerTheme(name, entry.css, entry);
    }
}
