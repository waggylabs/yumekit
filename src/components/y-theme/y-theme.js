import variablesCSS from "../../../styles/variables.css";
import blueLightCSS from "../../../styles/blue-light.css";
import blueDarkCSS from "../../../styles/blue-dark.css";
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
import brownLightCSS from "../../../styles/brown-light.css";
import brownDarkCSS from "../../../styles/brown-dark.css";
import oliveLightCSS from "../../../styles/olive-light.css";
import oliveDarkCSS from "../../../styles/olive-dark.css";

const THEMES = {
    "blue-light": blueLightCSS,
    "blue-dark": blueDarkCSS,
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
    "brown-light": brownLightCSS,
    "brown-dark": brownDarkCSS,
    "olive-light": oliveLightCSS,
    "olive-dark": oliveDarkCSS,
};

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
        const themeCSS = await this._resolveThemeCSS();
        this._buildShadowDOM(themeCSS);
        this._applyVariablesToHost(variablesCSS + themeCSS);
    }

    /**
     * Parses CSS custom properties from the given text and sets them on the host element.
     * @param {string} cssText - Raw CSS containing custom property declarations.
     */
    _applyVariablesToHost(cssText) {
        const regex = /--([\w-]+):\s*([^;]+);/g;
        let match;
        this._themeProps = [];

        while ((match = regex.exec(cssText)) !== null) {
            const prop = `--${match[1]}`;
            let value = match[2].trim();
            // Strip url() values that could trigger unwanted network requests
            value = value.replace(/url\s*\([^)]*\)/gi, "none");
            this.style.setProperty(prop, value);
            this._themeProps.push(prop);
        }
    }

    /** Rebuilds the shadow DOM with base variables, optional theme styles, and a slot. */
    _buildShadowDOM(themeCSS) {
        this.shadowRoot.innerHTML = "";

        const baseStyle = document.createElement("style");
        baseStyle.textContent = `${variablesCSS}
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

        if (!this.hasAttribute("no-default-font")) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href =
                "https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap";
            link.setAttribute("data-yumekit-font", "");
            document.head.appendChild(link);
        }

        const style = document.createElement("style");
        style.setAttribute("data-yumekit-page-styles", "");
        document.head.appendChild(style);
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
