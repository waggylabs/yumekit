import variablesCSS from "../../../styles/variables.css";
import { upgradeProperties } from "../../modules/helpers.js";
import {
    getTheme,
    getThemeFont,
    getThemePolicy,
    hasTheme,
    isThemeAllowed,
} from "../../themes/registry.js";

// Theme CSS is not bundled with this component. Register the themes the app
// ships — `import "@waggylabs/yumekit/themes/all.js"` for all built-ins, or
// `registerTheme(name, css)` for a subset — and narrow further with
// `configureThemes()`. The umbrella entry registers everything, so apps that
// import "@waggylabs/yumekit" need no change.

const CUSTOM_PROP_RE = /--([\w-]+):\s*([^;]+);/g;

// A `theme` value carrying a path separator, a scheme, or a .css suffix was
// meant as a URL; anything else was meant as a theme name. Used only to pick
// the more useful rejection reason and console message.
const URL_LIKE_RE = /[/:]|\.css$/i;

// Fallback themes already reported as unregistered, so the error is logged once
// per name rather than on every theme application.
const warnedFallbacks = new Set();

// Returns every custom property declared by the base variables sheet. Derived
// from `variablesCSS` alone — not from what happens to be registered — so the
// reset union in `_applyVariablesToHost` stays constant no matter how many
// themes an app registers. A guard test asserts the base sheet is a superset of
// every bundled theme's declared properties.
let _allThemeProps = null;
function getAllThemeProps() {
    if (_allThemeProps) return _allThemeProps;

    const props = new Set();
    let match;

    CUSTOM_PROP_RE.lastIndex = 0;
    while ((match = CUSTOM_PROP_RE.exec(variablesCSS)) !== null) {
        props.add(`--${match[1]}`);
    }

    _allThemeProps = props;
    return props;
}

export class YumeTheme extends HTMLElement {
    static get observedAttributes() {
        return ["theme", "cross-origin", "no-default-font"];
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
        if (!this.isConnected) return;
        if (oldValue !== newValue) this._applyTheme();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /**
     * Whether cross-origin theme URLs are allowed for this element. Effective
     * only when the application has also opted in with
     * `configureThemes({ allowCrossOriginUrls: true })`.
     */
    get crossOrigin() {
        return this.hasAttribute("cross-origin");
    }
    set crossOrigin(val) {
        if (val) this.setAttribute("cross-origin", "");
        else this.removeAttribute("cross-origin");
    }

    /**
     * Whether to skip injecting the active theme's webfont link. Removing the
     * attribute at runtime injects the font; adding it does not remove an
     * already-injected link, which may be shared with other <y-theme> elements.
     */
    get noDefaultFont() {
        return this.hasAttribute("no-default-font");
    }
    set noDefaultFont(val) {
        if (val) this.setAttribute("no-default-font", "");
        else this.removeAttribute("no-default-font");
    }

    /** The requested theme name, or a URL when `allowUrls` is enabled. */
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

    /**
     * Resolves the requested theme, substituting the policy fallback when it is
     * refused, then paints the result and announces it.
     */
    async _applyTheme() {
        const requested = this.theme;
        const resolved = await this._resolveThemeCSS(requested);

        let name = requested;
        let css = resolved.css;

        if (resolved.reason) {
            name = getThemePolicy().fallback;
            css = getTheme(name);
            if (!css && !warnedFallbacks.has(name)) {
                warnedFallbacks.add(name);
                console.error(
                    `<y-theme> fallback theme "${name}" is not registered; ` +
                        `applying base variables only.`,
                );
            }
            this._emit("theme-reject", {
                theme: requested,
                reason: resolved.reason,
                fallback: name,
            });
        }

        this._injectThemeFont(name);
        this._buildShadowDOM(css);
        this._applyVariablesToHost(variablesCSS + css);
        this._emit("theme-change", { theme: name });
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

    /** Dispatches a non-cancelable, composed CustomEvent. */
    _emit(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, { bubbles: true, composed: true, detail }),
        );
    }

    /**
     * Fetches theme CSS from a URL, subject to the origin, Content-Type, and
     * cross-origin policy guards.
     * @param {string} path - The requested theme value, resolved against baseURI.
     * @param {object} policy - The current theme policy.
     * @returns {Promise<{css?: string, reason?: string}>}
     */
    async _fetchThemeCSS(path, policy) {
        let url;
        try {
            url = new URL(path, document.baseURI);
        } catch {
            console.error(`<y-theme> could not parse theme URL "${path}".`);
            return { reason: "fetch-failed" };
        }

        if (url.origin !== window.location.origin) {
            if (!policy.allowCrossOriginUrls) {
                console.error(
                    `Blocked cross-origin theme load from ${url.origin}. ` +
                        `Enable it with configureThemes({ allowCrossOriginUrls: true }).`,
                );
                return { reason: "cross-origin" };
            }
            if (!this.crossOrigin) {
                console.error(
                    `Blocked cross-origin theme load from ${url.origin}. ` +
                        `Add the "cross-origin" attribute to <y-theme> to allow this.`,
                );
                return { reason: "cross-origin" };
            }
        }

        try {
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
                return { reason: "content-type" };
            }
            const css = await response.text();
            return { css: this._stripImportRules(css) };
        } catch (e) {
            console.error(`Failed to load theme from ${path}:`, e);
            return { reason: "fetch-failed" };
        }
    }

    _injectPageStyles() {
        if (document.querySelector("[data-yumekit-page-styles]")) return;

        const style = document.createElement("style");
        style.setAttribute("data-yumekit-page-styles", "");
        document.head.appendChild(style);
    }

    /**
     * Injects the Google Fonts link for the applied theme, de-duped by family so
     * themes sharing a font load it once.
     * @param {string} name - The theme actually applied, not the requested one.
     */
    _injectThemeFont(name) {
        if (this.noDefaultFont) return;

        // A null entry means the theme ships a native system-font stack — no
        // webfont to fetch.
        const query = getThemeFont(name);
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
     * Resolves a theme name to CSS, or to the reason it was refused. A
     * registered, permitted name wins; otherwise the value is treated as a URL
     * only when the policy allows it.
     * @param {string} name - The requested theme name or URL.
     * @returns {Promise<{css?: string, reason?: string}>}
     */
    async _resolveThemeCSS(name) {
        const policy = getThemePolicy();

        if (hasTheme(name)) {
            if (isThemeAllowed(name)) return { css: getTheme(name) };
            console.error(
                `<y-theme> theme "${name}" is registered but not permitted. ` +
                    `Add it to configureThemes({ allow: [...] }) to use it.`,
            );
            return { reason: "not-allowed" };
        }

        if (!policy.allowUrls) {
            if (URL_LIKE_RE.test(name)) {
                console.error(
                    `Blocked theme load from "${name}": URL themes are disabled. ` +
                        `Enable them with configureThemes({ allowUrls: true }).`,
                );
                return { reason: "urls-disabled" };
            }
            console.error(
                `<y-theme> theme "${name}" is not registered. ` +
                    `Register it with registerTheme("${name}", css), or import ` +
                    `"@waggylabs/yumekit/themes/all.js" for the built-in themes.`,
            );
            return { reason: "unregistered" };
        }

        return this._fetchThemeCSS(name, policy);
    }

    /**
     * Strips @import rules from CSS to prevent bypassing cross-origin guards.
     * @param {string} css - Raw CSS text.
     * @returns {string} CSS with @import rules removed.
     */
    _stripImportRules(css) {
        return css.replace(/@import\s+[^;]+;/gi, "");
    }
}

if (!customElements.get("y-theme")) {
    customElements.define("y-theme", YumeTheme);
}
