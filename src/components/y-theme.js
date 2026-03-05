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
        return ["theme", "mode", "theme-path"];
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

    async _applyTheme() {
        const themePath = this.getAttribute("theme-path");
        let themeCSS;

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

        this.shadowRoot.innerHTML = `
            <style>
                ${variablesCSS}
                :host {
                    font-family: var(--font-family-body, sans-serif);
                }
            </style>
            ${themeCSS ? `<style>${themeCSS}</style>` : ""}
            <slot></slot>
        `;

        this.applyVariablesToHost(variablesCSS + themeCSS);
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

    _injectPageStyles() {
        if (document.querySelector("[data-yumekit-page-styles]")) return;
        const style = document.createElement("style");
        style.setAttribute("data-yumekit-page-styles", "");
        style.textContent = `
            html, body {
                margin: 0;
                padding: 0;
                font-family: var(--font-family-header, "Lexend", sans-serif);
                color: var(--base-content--, #000);
                font-weight: 300;
            }
        `;
        document.head.appendChild(style);
    }
}

if (!customElements.get("y-theme")) {
    customElements.define("y-theme", YumeTheme);
}
