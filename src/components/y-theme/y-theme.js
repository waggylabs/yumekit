import variablesCSS from "../../../styles/variables.css";
import blueLightCSS from "../../../styles/blue-light.css";
import blueDarkCSS from "../../../styles/blue-dark.css";
import slateLightCSS from "../../../styles/slate-light.css";
import slateDarkCSS from "../../../styles/slate-dark.css";
import monoLightCSS from "../../../styles/mono-light.css";
import monoDarkCSS from "../../../styles/mono-dark.css";
import orangeLightCSS from "../../../styles/orange-light.css";
import orangeDarkCSS from "../../../styles/orange-dark.css";
import greenLightCSS from "../../../styles/green-light.css";
import greenDarkCSS from "../../../styles/green-dark.css";
import redLightCSS from "../../../styles/red-light.css";
import redDarkCSS from "../../../styles/red-dark.css";
import tealLightCSS from "../../../styles/teal-light.css";
import tealDarkCSS from "../../../styles/teal-dark.css";
import yellowLightCSS from "../../../styles/yellow-light.css";
import yellowDarkCSS from "../../../styles/yellow-dark.css";
import indigoLightCSS from "../../../styles/indigo-light.css";
import indigoDarkCSS from "../../../styles/indigo-dark.css";
import purpleLightCSS from "../../../styles/purple-light.css";
import purpleDarkCSS from "../../../styles/purple-dark.css";
import pinkLightCSS from "../../../styles/pink-light.css";
import pinkDarkCSS from "../../../styles/pink-dark.css";
import roseLightCSS from "../../../styles/rose-light.css";
import roseDarkCSS from "../../../styles/rose-dark.css";
import brownLightCSS from "../../../styles/brown-light.css";
import brownDarkCSS from "../../../styles/brown-dark.css";
import oliveLightCSS from "../../../styles/olive-light.css";
import oliveDarkCSS from "../../../styles/olive-dark.css";
import materialBlueLightCSS from "../../../styles/material-blue-light.css";
import materialBlueDarkCSS from "../../../styles/material-blue-dark.css";
import materialPurpleLightCSS from "../../../styles/material-purple-light.css";
import materialPurpleDarkCSS from "../../../styles/material-purple-dark.css";
import carbonLightCSS from "../../../styles/carbon-light.css";
import carbonDarkCSS from "../../../styles/carbon-dark.css";
import antBlueLightCSS from "../../../styles/ant-blue-light.css";
import antBlueDarkCSS from "../../../styles/ant-blue-dark.css";
import antGreenLightCSS from "../../../styles/ant-green-light.css";
import antGreenDarkCSS from "../../../styles/ant-green-dark.css";
import shadcnLightCSS from "../../../styles/shadcn-light.css";
import shadcnDarkCSS from "../../../styles/shadcn-dark.css";
import shadcnBlueLightCSS from "../../../styles/shadcn-blue-light.css";
import shadcnBlueDarkCSS from "../../../styles/shadcn-blue-dark.css";
import primerLightCSS from "../../../styles/primer-light.css";
import primerDarkCSS from "../../../styles/primer-dark.css";
import primerDarkDimmedCSS from "../../../styles/primer-dark-dimmed.css";
import bootstrapLightCSS from "../../../styles/bootstrap-light.css";
import bootstrapDarkCSS from "../../../styles/bootstrap-dark.css";
import catppuccinLatteCSS from "../../../styles/catppuccin-latte.css";
import catppuccinFrappeCSS from "../../../styles/catppuccin-frappe.css";
import catppuccinMacchiatoCSS from "../../../styles/catppuccin-macchiato.css";
import catppuccinMochaCSS from "../../../styles/catppuccin-mocha.css";
import nordCSS from "../../../styles/nord.css";
import nordAuroraCSS from "../../../styles/nord-aurora.css";
import waggyCSS from "../../../styles/waggy.css";
import waggyDarkCSS from "../../../styles/waggy-dark.css";
import keplerLightCSS from "../../../styles/kepler-light.css";
import keplerDarkCSS from "../../../styles/kepler-dark.css";
import keplerAmberCSS from "../../../styles/kepler-amber.css";
import keplerGalaxyCSS from "../../../styles/kepler-galaxy.css";
import keplerMatrixCSS from "../../../styles/kepler-matrix.css";
import { upgradeProperties } from "../../modules/helpers.js";

const THEMES = {
    "blue-light": blueLightCSS,
    "blue-dark": blueDarkCSS,
    "slate-light": slateLightCSS,
    "slate-dark": slateDarkCSS,
    "mono-light": monoLightCSS,
    "mono-dark": monoDarkCSS,
    "orange-light": orangeLightCSS,
    "orange-dark": orangeDarkCSS,
    "green-light": greenLightCSS,
    "green-dark": greenDarkCSS,
    "red-light": redLightCSS,
    "red-dark": redDarkCSS,
    "teal-light": tealLightCSS,
    "teal-dark": tealDarkCSS,
    "yellow-light": yellowLightCSS,
    "yellow-dark": yellowDarkCSS,
    "indigo-light": indigoLightCSS,
    "indigo-dark": indigoDarkCSS,
    "purple-light": purpleLightCSS,
    "purple-dark": purpleDarkCSS,
    "pink-light": pinkLightCSS,
    "pink-dark": pinkDarkCSS,
    "rose-light": roseLightCSS,
    "rose-dark": roseDarkCSS,
    "brown-light": brownLightCSS,
    "brown-dark": brownDarkCSS,
    "olive-light": oliveLightCSS,
    "olive-dark": oliveDarkCSS,
    "material-blue-light": materialBlueLightCSS,
    "material-blue-dark": materialBlueDarkCSS,
    "material-purple-light": materialPurpleLightCSS,
    "material-purple-dark": materialPurpleDarkCSS,
    "carbon-light": carbonLightCSS,
    "carbon-dark": carbonDarkCSS,
    "ant-blue-light": antBlueLightCSS,
    "ant-blue-dark": antBlueDarkCSS,
    "ant-green-light": antGreenLightCSS,
    "ant-green-dark": antGreenDarkCSS,
    "shadcn-light": shadcnLightCSS,
    "shadcn-dark": shadcnDarkCSS,
    "shadcn-blue-light": shadcnBlueLightCSS,
    "shadcn-blue-dark": shadcnBlueDarkCSS,
    "primer-light": primerLightCSS,
    "primer-dark": primerDarkCSS,
    "primer-dark-dimmed": primerDarkDimmedCSS,
    "bootstrap-light": bootstrapLightCSS,
    "bootstrap-dark": bootstrapDarkCSS,
    "catppuccin-latte": catppuccinLatteCSS,
    "catppuccin-frappe": catppuccinFrappeCSS,
    "catppuccin-macchiato": catppuccinMacchiatoCSS,
    "catppuccin-mocha": catppuccinMochaCSS,
    "nord": nordCSS,
    "nord-aurora": nordAuroraCSS,
    "waggy": waggyCSS,
    "waggy-dark": waggyDarkCSS,
    "kepler-light": keplerLightCSS,
    "kepler-dark": keplerDarkCSS,
    "kepler-amber": keplerAmberCSS,
    "kepler-galaxy": keplerGalaxyCSS,
    "kepler-matrix": keplerMatrixCSS,
};

// Google Fonts `family=` query for each theme's typography. Themes not listed
// fall back to DEFAULT_FONT. The family name (before `:`) is used to de-dupe the
// injected <link>, so multiple themes requesting the same font load it once.
// A `null` value means the theme uses a native system-font stack and needs no
// webfont download.
const DEFAULT_FONT = "Lexend:wght@100..900";
const THEME_FONTS = {
    "material-blue-light": "Roboto:wght@300;400;500;700",
    "material-blue-dark": "Roboto:wght@300;400;500;700",
    "material-purple-light": "Roboto:wght@300;400;500;700",
    "material-purple-dark": "Roboto:wght@300;400;500;700",
    "carbon-light": "IBM+Plex+Sans:wght@400;500;600;700",
    "carbon-dark": "IBM+Plex+Sans:wght@400;500;600;700",
    "ant-blue-light": null,
    "ant-blue-dark": null,
    "ant-green-light": null,
    "ant-green-dark": null,
    "shadcn-light": "Inter:wght@400;500;600;700",
    "shadcn-dark": "Inter:wght@400;500;600;700",
    "shadcn-blue-light": "Inter:wght@400;500;600;700",
    "shadcn-blue-dark": "Inter:wght@400;500;600;700",
    "primer-light": null,
    "primer-dark": null,
    "primer-dark-dimmed": null,
    "bootstrap-light": null,
    "bootstrap-dark": null,
    "waggy": null,
    "waggy-dark": null,
    "kepler-light": "Tomorrow:wght@300;400;500;600;700",
    "kepler-dark": "Tomorrow:wght@300;400;500;600;700",
    "kepler-amber": "Tomorrow:wght@300;400;500;600;700",
    "kepler-galaxy": "Tomorrow:wght@300;400;500;600;700",
    "kepler-matrix": "Tomorrow:wght@300;400;500;600;700",
};

const CUSTOM_PROP_RE = /--([\w-]+):\s*([^;]+);/g;

// Returns the union of every custom property declared by the base variables
// sheet or any built-in theme. Computed once, lazily.
let _allThemeProps = null;
function getAllThemeProps() {
    if (_allThemeProps) return _allThemeProps;
    const props = new Set();
    for (const css of [variablesCSS, ...Object.values(THEMES)]) {
        let match;
        CUSTOM_PROP_RE.lastIndex = 0;
        while ((match = CUSTOM_PROP_RE.exec(css)) !== null) {
            props.add(`--${match[1]}`);
        }
    }
    _allThemeProps = props;
    return props;
}

export class YumeTheme extends HTMLElement {
    static get observedAttributes() {
        return ["theme", "cross-origin"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = "<slot></slot>";
    }

    connectedCallback() {
        upgradeProperties(this);
        this._injectPageStyles();
        this._applyTheme();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this._applyTheme();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Whether cross-origin theme-path URLs are allowed. */
    get crossOrigin() {
        return this.hasAttribute("cross-origin");
    }
    set crossOrigin(val) {
        if (val) this.setAttribute("cross-origin", "");
        else this.removeAttribute("cross-origin");
    }

    /** The active theme name or URL path. */
    get theme() {
        return this.getAttribute("theme") || "blue-light";
    }
    set theme(val) {
        this.setAttribute("theme", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Removes all theme custom properties previously applied to the host element. */
    clearThemeProperties() {
        if (this._themeProps) {
            for (const prop of this._themeProps) {
                this.style.removeProperty(prop);
            }
        }
        this._themeProps = [];
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    async _applyTheme() {
        this._injectThemeFont();
        const themeCSS = await this._resolveThemeCSS();
        this._buildShadowDOM(themeCSS);
        this._applyVariablesToHost(variablesCSS + themeCSS);
    }

    /**
     * Replaces the host's inline custom properties with those parsed from the
     * given CSS, then resets every other known theme token to `initial`.
     * Clearing first stops a token defined only by the outgoing theme from
     * sticking across a theme switch; resetting omitted tokens to `initial`
     * stops an ancestor <y-theme>'s value from inheriting into a nested theme's
     * scope, so the component's `var(token, fallback)` resolves to its own
     * fallback instead. url() values are neutralized to avoid unwanted network
     * requests from untrusted theme CSS.
     * @param {string} cssText - Raw CSS containing custom property declarations.
     */
    _applyVariablesToHost(cssText) {
        this.clearThemeProperties();
        const applied = new Set();
        let match;

        CUSTOM_PROP_RE.lastIndex = 0;
        while ((match = CUSTOM_PROP_RE.exec(cssText)) !== null) {
            const prop = `--${match[1]}`;
            let value = match[2].trim();
            value = value.replace(/url\s*\([^)]*\)/gi, "none");
            this.style.setProperty(prop, value);
            this._themeProps.push(prop);
            applied.add(prop);
        }

        for (const prop of getAllThemeProps()) {
            if (applied.has(prop)) continue;
            this.style.setProperty(prop, "initial");
            this._themeProps.push(prop);
        }
    }

    /** Rebuilds the shadow DOM with base variables, optional theme styles, and a slot. */
    _buildShadowDOM(themeCSS) {
        this.shadowRoot.innerHTML = "";

        const baseStyle = document.createElement("style");
        baseStyle.textContent = `${variablesCSS}
            :host([hidden]) {
                display: none;
            }

            :host {
                font-family: var(--font-family-body, sans-serif);
                color: var(--base-content--, inherit);
                font-weight: var(--font-weight-body, 400);
                background: var(--base-background-app, transparent);
            }`;
        this.shadowRoot.appendChild(baseStyle);

        if (themeCSS) {
            const themeStyle = document.createElement("style");
            themeStyle.textContent = themeCSS;
            this.shadowRoot.appendChild(themeStyle);
        }

        this.shadowRoot.appendChild(document.createElement("slot"));
    }

    _injectPageStyles() {
        if (document.querySelector("[data-yumekit-page-styles]")) return;

        const style = document.createElement("style");
        style.setAttribute("data-yumekit-page-styles", "");
        document.head.appendChild(style);
    }

    _injectThemeFont() {
        if (this.hasAttribute("no-default-font")) return;

        const query =
            this.theme in THEME_FONTS ? THEME_FONTS[this.theme] : DEFAULT_FONT;
        // A null entry means the theme ships a native system-font stack — no
        // webfont to fetch.
        if (!query) return;
        const family = query.split(":")[0];
        if (document.querySelector(`link[data-yumekit-font="${family}"]`))
            return;

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
        link.setAttribute("data-yumekit-font", family);
        document.head.appendChild(link);
    }

    /**
     * Strips @import rules from CSS to prevent bypassing cross-origin guards.
     * @param {string} css - Raw CSS text.
     * @returns {string} CSS with @import rules removed.
     */
    _stripImportRules(css) {
        return css.replace(/@import\s+[^;]+;/gi, "");
    }

    /** Resolves theme CSS from either a built-in theme name or a remote URL/path. */
    async _resolveThemeCSS() {
        if (THEMES[this.theme]) return THEMES[this.theme];

        try {
            const url = new URL(this.theme, document.baseURI);
            if (!this.crossOrigin && url.origin !== window.location.origin) {
                console.error(
                    `Blocked cross-origin theme load from ${url.origin}. ` +
                        `Add the "cross-origin" attribute to <y-theme> to allow this.`,
                );
                return "";
            }
            const response = await fetch(url.href);
            const contentType = response.headers.get("content-type") || "";
            if (
                contentType &&
                !contentType.includes("text/css") &&
                !contentType.includes("text/plain")
            ) {
                console.error(
                    `Blocked theme load from ${url.href}: unexpected Content-Type "${contentType}".`,
                );
                return "";
            }
            const css = await response.text();
            return this._stripImportRules(css);
        } catch (e) {
            console.error(`Failed to load theme from ${this.theme}:`, e);
            return "";
        }
    }
}

if (!customElements.get("y-theme")) {
    customElements.define("y-theme", YumeTheme);
}
