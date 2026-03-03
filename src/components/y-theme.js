<<<<<<< HEAD
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
=======
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

>>>>>>> main
export class YumeTheme extends HTMLElement {
    static get observedAttributes() {
        return ["theme", "mode", "theme-path"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.innerHTML = "<slot></slot>";
    }

    connectedCallback() {
<<<<<<< HEAD
        const themePath = this.getAttribute("theme-path");
        if (themePath) {
            this.loadTheme(themePath);
        }
=======
        this._applyTheme();
>>>>>>> main
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._applyTheme();
        }
    }

<<<<<<< HEAD
    async loadTheme(themePath) {
        let themeCSS = "";
=======
    async _applyTheme() {
        const themePath = this.getAttribute("theme-path");
        let themeCSS;

>>>>>>> main
        if (themePath) {
            try {
                const url = new URL(themePath, document.baseURI);
                const response = await fetch(url.href);
                themeCSS = await response.text();
            } catch (e) {
                console.error(`Failed to load theme from ${themePath}:`, e);
                themeCSS = "";
            }
        } else {
            const theme = this.getAttribute("theme") || "blue";
            const mode = this.getAttribute("mode") || "light";
            themeCSS = THEMES[`${theme}-${mode}`] || "";
        }

<<<<<<< HEAD
        // Apply overrides as inline styles on the host so they inherit
        // into child shadow DOMs, overriding the global :root defaults.
        this.clearThemeProperties();
        if (themeCSS) {
            this.applyVariablesToHost(themeCSS);
        }
=======
        this.shadowRoot.innerHTML = `
            <style>${variablesCSS}</style>
            ${themeCSS ? `<style>${themeCSS}</style>` : ""}
            <slot></slot>
        `;

        this.applyVariablesToHost(variablesCSS + themeCSS);
>>>>>>> main
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
