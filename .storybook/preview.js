import { addons } from "storybook/preview-api";

// Register the full icon pack globally so every story can render y-icon names
// (checkbox marks, select chevrons, etc.) without each story importing it.
// `all.js` also pulls in the filled variants.
import "../src/icons/all.js";

// `?inline` bypasses the css-string plugin so Vite returns each theme as a
// plain string we can swap into a <style> at runtime.
import variablesCSS from "../styles/variables.css?inline";
import blueDarkCSS from "../styles/blue-dark.css?inline";
import blueLightCSS from "../styles/blue-light.css?inline";
import monoDarkCSS from "../styles/mono-dark.css?inline";
import monoLightCSS from "../styles/mono-light.css?inline";
import orangeDarkCSS from "../styles/orange-dark.css?inline";
import orangeLightCSS from "../styles/orange-light.css?inline";
import greenDarkCSS from "../styles/green-dark.css?inline";
import greenLightCSS from "../styles/green-light.css?inline";
import indigoDarkCSS from "../styles/indigo-dark.css?inline";
import indigoLightCSS from "../styles/indigo-light.css?inline";
import redDarkCSS from "../styles/red-dark.css?inline";
import redLightCSS from "../styles/red-light.css?inline";
import tealDarkCSS from "../styles/teal-dark.css?inline";
import tealLightCSS from "../styles/teal-light.css?inline";
import yellowDarkCSS from "../styles/yellow-dark.css?inline";
import yellowLightCSS from "../styles/yellow-light.css?inline";
import purpleDarkCSS from "../styles/purple-dark.css?inline";
import purpleLightCSS from "../styles/purple-light.css?inline";
import pinkDarkCSS from "../styles/pink-dark.css?inline";
import pinkLightCSS from "../styles/pink-light.css?inline";
import roseDarkCSS from "../styles/rose-dark.css?inline";
import roseLightCSS from "../styles/rose-light.css?inline";
import brownDarkCSS from "../styles/brown-dark.css?inline";
import brownLightCSS from "../styles/brown-light.css?inline";
import oliveDarkCSS from "../styles/olive-dark.css?inline";
import oliveLightCSS from "../styles/olive-light.css?inline";
import materialBlueDarkCSS from "../styles/material-blue-dark.css?inline";
import materialBlueLightCSS from "../styles/material-blue-light.css?inline";
import materialPurpleDarkCSS from "../styles/material-purple-dark.css?inline";
import materialPurpleLightCSS from "../styles/material-purple-light.css?inline";
import carbonDarkCSS from "../styles/carbon-dark.css?inline";
import carbonLightCSS from "../styles/carbon-light.css?inline";
import antBlueDarkCSS from "../styles/ant-blue-dark.css?inline";
import antBlueLightCSS from "../styles/ant-blue-light.css?inline";
import antGreenDarkCSS from "../styles/ant-green-dark.css?inline";
import antGreenLightCSS from "../styles/ant-green-light.css?inline";
import shadcnDarkCSS from "../styles/shadcn-dark.css?inline";
import shadcnLightCSS from "../styles/shadcn-light.css?inline";
import shadcnBlueDarkCSS from "../styles/shadcn-blue-dark.css?inline";
import shadcnBlueLightCSS from "../styles/shadcn-blue-light.css?inline";
import primerLightCSS from "../styles/primer-light.css?inline";
import primerDarkCSS from "../styles/primer-dark.css?inline";
import primerDarkDimmedCSS from "../styles/primer-dark-dimmed.css?inline";
import bootstrapDarkCSS from "../styles/bootstrap-dark.css?inline";
import bootstrapLightCSS from "../styles/bootstrap-light.css?inline";
import catppuccinLatteCSS from "../styles/catppuccin-latte.css?inline";
import catppuccinFrappeCSS from "../styles/catppuccin-frappe.css?inline";
import catppuccinMacchiatoCSS from "../styles/catppuccin-macchiato.css?inline";
import catppuccinMochaCSS from "../styles/catppuccin-mocha.css?inline";
import nordCSS from "../styles/nord.css?inline";
import nordAuroraCSS from "../styles/nord-aurora.css?inline";

// =============================================================================
// Theme registry — single source of truth (toolbar order). Add a theme here and
// it flows to both the <style> swapper and the toolbar picker below.
// =============================================================================

const THEMES = [
    { key: "blue-dark", name: "Blue Dark", css: blueDarkCSS },
    { key: "blue-light", name: "Blue Light", css: blueLightCSS },
    { key: "mono-dark", name: "Mono Dark", css: monoDarkCSS },
    { key: "mono-light", name: "Mono Light", css: monoLightCSS },
    { key: "orange-dark", name: "Orange Dark", css: orangeDarkCSS },
    { key: "orange-light", name: "Orange Light", css: orangeLightCSS },
    { key: "green-dark", name: "Green Dark", css: greenDarkCSS },
    { key: "green-light", name: "Green Light", css: greenLightCSS },
    { key: "indigo-dark", name: "Indigo Dark", css: indigoDarkCSS },
    { key: "indigo-light", name: "Indigo Light", css: indigoLightCSS },
    { key: "red-dark", name: "Red Dark", css: redDarkCSS },
    { key: "red-light", name: "Red Light", css: redLightCSS },
    { key: "teal-dark", name: "Teal Dark", css: tealDarkCSS },
    { key: "teal-light", name: "Teal Light", css: tealLightCSS },
    { key: "yellow-dark", name: "Yellow Dark", css: yellowDarkCSS },
    { key: "yellow-light", name: "Yellow Light", css: yellowLightCSS },
    { key: "purple-dark", name: "Purple Dark", css: purpleDarkCSS },
    { key: "purple-light", name: "Purple Light", css: purpleLightCSS },
    { key: "pink-dark", name: "Pink Dark", css: pinkDarkCSS },
    { key: "pink-light", name: "Pink Light", css: pinkLightCSS },
    { key: "rose-dark", name: "Rose Dark", css: roseDarkCSS },
    { key: "rose-light", name: "Rose Light", css: roseLightCSS },
    { key: "brown-dark", name: "Brown Dark", css: brownDarkCSS },
    { key: "brown-light", name: "Brown Light", css: brownLightCSS },
    { key: "olive-dark", name: "Olive Dark", css: oliveDarkCSS },
    { key: "olive-light", name: "Olive Light", css: oliveLightCSS },
    { key: "material-blue-dark", name: "Material Blue Dark", css: materialBlueDarkCSS },
    { key: "material-blue-light", name: "Material Blue Light", css: materialBlueLightCSS },
    { key: "material-purple-dark", name: "Material Purple Dark", css: materialPurpleDarkCSS },
    { key: "material-purple-light", name: "Material Purple Light", css: materialPurpleLightCSS },
    { key: "carbon-dark", name: "Carbon Dark", css: carbonDarkCSS },
    { key: "carbon-light", name: "Carbon Light", css: carbonLightCSS },
    { key: "ant-blue-dark", name: "Ant Blue Dark", css: antBlueDarkCSS },
    { key: "ant-blue-light", name: "Ant Blue Light", css: antBlueLightCSS },
    { key: "ant-green-dark", name: "Ant Green Dark", css: antGreenDarkCSS },
    { key: "ant-green-light", name: "Ant Green Light", css: antGreenLightCSS },
    { key: "shadcn-dark", name: "Shadcn Dark", css: shadcnDarkCSS },
    { key: "shadcn-light", name: "Shadcn Light", css: shadcnLightCSS },
    { key: "shadcn-blue-dark", name: "Shadcn Blue Dark", css: shadcnBlueDarkCSS },
    { key: "shadcn-blue-light", name: "Shadcn Blue Light", css: shadcnBlueLightCSS },
    { key: "primer-light", name: "Primer Light", css: primerLightCSS },
    { key: "primer-dark", name: "Primer Dark", css: primerDarkCSS },
    { key: "primer-dark-dimmed", name: "Primer Dark Dimmed", css: primerDarkDimmedCSS },
    { key: "bootstrap-dark", name: "Bootstrap Dark", css: bootstrapDarkCSS },
    { key: "bootstrap-light", name: "Bootstrap Light", css: bootstrapLightCSS },
    { key: "catppuccin-latte", name: "Catppuccin Latte", css: catppuccinLatteCSS },
    { key: "catppuccin-frappe", name: "Catppuccin Frappe", css: catppuccinFrappeCSS },
    { key: "catppuccin-macchiato", name: "Catppuccin Macchiato", css: catppuccinMacchiatoCSS },
    { key: "catppuccin-mocha", name: "Catppuccin Mocha", css: catppuccinMochaCSS },
    { key: "nord", name: "Nord", css: nordCSS },
    { key: "nord-aurora", name: "Nord Aurora", css: nordAuroraCSS },
];

const THEME_MAP = Object.fromEntries(THEMES.map((t) => [t.key, t.css]));
const DEFAULT_THEME = "blue-dark";

const THEME_STYLE_ID = "yumekit-storybook-theme";
const THEME_SYNC_CHANNEL = "yumekit-storybook-theme-sync";
const THEME_STORAGE_KEY = "yumekit-storybook-theme";

// Toolbar swatch behind each option label — just a light/dark chip. Material
// themes use their real surface colors; everything else a generic light/dark.
const SWATCH = {
    "material-blue-dark": "#121212",
    "material-blue-light": "#fafafa",
    "material-purple-dark": "#121212",
    "material-purple-light": "#fafafa",
    "carbon-dark": "#161616",
    "carbon-light": "#f4f4f4",
    "ant-blue-dark": "#141414",
    "ant-blue-light": "#f5f5f5",
    "ant-green-dark": "#141414",
    "ant-green-light": "#f5f5f5",
    "shadcn-dark": "#020617",
    "shadcn-light": "#f8fafc",
    "shadcn-blue-dark": "#020617",
    "shadcn-blue-light": "#f8fafc",
    "primer-light": "#f6f8fa",
    "primer-dark": "#0d1117",
    "primer-dark-dimmed": "#22272e",
    "bootstrap-light": "#f8f9fa",
    "bootstrap-dark": "#212529",
    "catppuccin-latte": "#eff1f5",
    "catppuccin-frappe": "#303446",
    "catppuccin-macchiato": "#24273a",
    "catppuccin-mocha": "#1e1e2e",
    "nord": "#2e3440",
    "nord-aurora": "#2e3440",
};
const backdrop = (key) => SWATCH[key] ?? (key.endsWith("-dark") ? "#1a1a1a" : "#f0f0f2");

// =============================================================================
// Theme application & cross-document sync
//
// The theme must reach three kinds of documents: story canvases (the decorator
// covers these), the docs document of `inline: false` stories (no story renders
// in it, so no decorator runs), and the nested <iframe>s those stories create
// (which Storybook reloads with stale `initialGlobals`).
//
// On a switch, the reloading iframes echo their stale globals back through the
// manager as `globalsUpdated` events carrying the OLD theme, which would revert
// us. So we trust only `updateGlobals` (the toolbar's real change request),
// persist the choice to sessionStorage (shared across same-origin iframes; read
// synchronously on load so reloaded iframes paint correctly), and push live
// changes over a BroadcastChannel whose receivers apply but never re-broadcast.
// =============================================================================

let currentTheme = null;
const themeSync =
    typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel(THEME_SYNC_CHANNEL)
        : null;

// Swap this document's theme <style>. Idempotent; never broadcasts.
function applyTheme(name) {
    const css = THEME_MAP[name];
    if (!css || name === currentTheme) return;
    currentTheme = name;

    let el = document.getElementById(THEME_STYLE_ID);
    if (!el) {
        el = document.createElement("style");
        el.id = THEME_STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = css;
}

function persistTheme(name) {
    try {
        sessionStorage.setItem(THEME_STORAGE_KEY, name);
    } catch {
        /* sandboxed iframe — rely on the broadcast instead */
    }
}

function themeFromGlobals(payload) {
    const value = payload?.globals?.backgrounds?.value;
    return value && THEME_MAP[value] ? value : null;
}

// Authoritative: the toolbar's explicit change request. Persist + fan out.
function onUserThemeChange(payload) {
    const name = themeFromGlobals(payload);
    if (!name) return;
    persistTheme(name);
    applyTheme(name);
    if (themeSync) themeSync.postMessage(name);
}

// Seed the theme on a fresh load (e.g. a deep link with the theme in the URL,
// before sessionStorage exists). Only the first notification is trusted; later
// `globalsUpdated` echoes carry reloaded iframes' stale globals.
function onInitialGlobals(payload) {
    if (currentTheme !== null) return;
    const name = themeFromGlobals(payload);
    if (!name) return;
    persistTheme(name);
    applyTheme(name);
}

// =============================================================================
// One-time preview setup (runs on module eval)
// =============================================================================

function appendHeadStyle(id, css) {
    const el = document.createElement("style");
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
}

function injectHeadStyles() {
    appendHeadStyle("yumekit-storybook-variables", variablesCSS);
    // Body inherits theme content color + font so elements with `color: inherit`
    // (e.g. a bare y-icon) stay legible on dark backgrounds.
    appendHeadStyle(
        "yumekit-storybook-body",
        "body { color: var(--base-content--); font-family: var(--font-family-body, 'Lexend', sans-serif); }",
    );
    // Lexend (default) + Roboto (Material) + IBM Plex Sans (Carbon) + Inter
    // (Tailwind/shadcn). y-theme loads these itself, but stories that don't wrap
    // in y-theme need them. (Ant uses a system stack — nothing to load.)
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href =
        "https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Roboto:wght@300;400;500;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(font);
}

function wireThemeSync() {
    // Restore synchronously first so reloaded iframes paint with no flash.
    try {
        const saved = sessionStorage.getItem(THEME_STORAGE_KEY);
        if (saved) applyTheme(saved);
    } catch {
        /* sandboxed iframe — rely on broadcast/decorator */
    }

    if (themeSync) themeSync.onmessage = (e) => applyTheme(e.data);

    // preview-api singleton; the raw window channel can be swapped after eval.
    const channel = addons.getChannel();
    channel.on("updateGlobals", onUserThemeChange);
    channel.on("globalsUpdated", onInitialGlobals);
}

injectHeadStyles();
wireThemeSync();

// =============================================================================
// Storybook config
// =============================================================================

// Initial paint for canvases / inline docs. Guarded so it can't clobber a
// reloaded iframe's sessionStorage-restored theme with stale globals.
export const decorators = [
    (story, context) => {
        if (currentTheme === null) {
            const name = themeFromGlobals(context);
            if (name) applyTheme(name);
        }
        return story();
    },
];

export default {
    parameters: {
        // The backgrounds toolbar doubles as the theme picker.
        backgrounds: {
            options: Object.fromEntries(
                THEMES.map((t) => [t.key, { name: t.name, value: backdrop(t.key) }]),
            ),
        },
        docs: { toc: true },
        // 'todo' shows a11y violations in the test UI only ('error' fails CI).
        a11y: { test: "todo" },
    },

    initialGlobals: {
        backgrounds: { value: DEFAULT_THEME },
    },
};
