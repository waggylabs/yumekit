import "../modules/load-defaults.js";

/**
 * <y-theme> — optional wrapper that applies a theme-override stylesheet.
 *
 * Default CSS custom-properties (from styles/variables.css) are injected
 * globally by load-defaults.js when the library is imported, so components
 * work out-of-the-box without <y-theme>.  This element only needs to handle
 * the *override* theme file (e.g. styles/blue-dark.css).
 *
 * Usage:
 *   <y-theme theme-path="styles/blue-dark.css">…</y-theme>
 */
export class YumeTheme extends HTMLElement {
    static get observedAttributes() {
        return ["theme-path"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = "<slot></slot>";
    }

    connectedCallback() {
        const themePath = this.getAttribute("theme-path");
        if (themePath) {
            this.loadTheme(themePath);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "theme-path" && oldValue !== newValue) {
            this.loadTheme(newValue);
        }
    }

    async loadTheme(themePath) {
        let themeCSS = "";
        if (themePath) {
            try {
                const themeUrl = new URL(themePath, document.baseURI);
                const response = await fetch(themeUrl.href);
                themeCSS = await response.text();
            } catch (e) {
                console.error(`Failed to load theme from ${themePath}:`, e);
            }
        }

        // Apply overrides as inline styles on the host so they inherit
        // into child shadow DOMs, overriding the global :root defaults.
        this.clearThemeProperties();
        if (themeCSS) {
            this.applyVariablesToHost(themeCSS);
        }
    }

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

    clearThemeProperties() {
        if (this._themeProps) {
            for (const prop of this._themeProps) {
                this.style.removeProperty(prop);
            }
        }
        this._themeProps = [];
    }
}

if (!customElements.get("y-theme")) {
    customElements.define("y-theme", YumeTheme);
}
