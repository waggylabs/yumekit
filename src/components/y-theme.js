import variablesCSS from "../../styles/variables.css";
import blueLightCSS from "../../styles/blue-light.css";
import blueDarkCSS from "../../styles/blue-dark.css";
import orangeLightCSS from "../../styles/orange-light.css";
import orangeDarkCSS from "../../styles/orange-dark.css";

const THEMES = {
    "blue-light": blueLightCSS,
    "blue-dark": blueDarkCSS,
    "orange-light": orangeLightCSS,
    "orange-dark": orangeDarkCSS,
};

export class YumeTheme extends HTMLElement {
    static get observedAttributes() {
        return ["theme", "cross-origin"];
    }

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
        if (oldValue !== newValue) {
            this._applyTheme();
        }
    }

    /** Whether cross-origin theme-path URLs are allowed. */
    get crossOrigin() {
        return this.hasAttribute("cross-origin");
    }
    set crossOrigin(val) {
        if (val) this.setAttribute("cross-origin", "");
        else this.removeAttribute("cross-origin");
    }

    async _applyTheme() {
        const themeCSS = await this._resolveThemeCSS();
        this._buildShadowDOM(themeCSS);
        this.applyVariablesToHost(variablesCSS + themeCSS);
    }

    /** Resolves theme CSS from either a built-in theme name or a remote URL/path. */
    async _resolveThemeCSS() {
        const theme = this.getAttribute("theme") || "blue-light";

        if (THEMES[theme]) {
            return THEMES[theme];
        }

        try {
            const url = new URL(theme, document.baseURI);
            if (!this.crossOrigin && url.origin !== window.location.origin) {
                console.error(
                    `Blocked cross-origin theme load from ${url.origin}. ` +
                        `Add the "cross-origin" attribute to <y-theme> to allow this.`,
                );
                return "";
            }
            const response = await fetch(url.href);
            return await response.text();
        } catch (e) {
            console.error(`Failed to load theme from ${theme}:`, e);
            return "";
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
                    font-weight: 300;
                }`;
        this.shadowRoot.appendChild(baseStyle);

        if (themeCSS) {
            const themeStyle = document.createElement("style");
            themeStyle.textContent = themeCSS;
            this.shadowRoot.appendChild(themeStyle);
        }

        this.shadowRoot.appendChild(document.createElement("slot"));
    }

    /**
     * Parses CSS custom properties from the given text and sets them on the host element.
     * @param {string} cssText - Raw CSS containing custom property declarations.
     */
    applyVariablesToHost(cssText) {
        const regex = /--([\w-]+):\s*([^;]+);/g;
        let match;
        this._themeProps = [];

        while ((match = regex.exec(cssText)) !== null) {
            const prop = `--${match[1]}`;
            this.style.setProperty(prop, match[2].trim());
            this._themeProps.push(prop);
        }
    }

    /** Removes all theme custom properties previously applied to the host element. */
    clearThemeProperties() {
        if (this._themeProps) {
            for (const prop of this._themeProps) {
                this.style.removeProperty(prop);
            }
        }
        this._themeProps = [];
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
}

if (!customElements.get("y-theme")) {
    customElements.define("y-theme", YumeTheme);
}
