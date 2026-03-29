import { getColorVarPair } from "../modules/helpers.js";

export class YumeAvatar extends HTMLElement {
    static get observedAttributes() {
        return ["src", "alt", "size", "shape", "color"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Initials fallback text when no src is provided (default "AN"). */
    get alt() { return this.getAttribute("alt") || "AN"; }
    set alt(val) { this.setAttribute("alt", val); }

    /** Color theme for the initials avatar background. */
    get color() { return this.getAttribute("color") || "primary"; }
    set color(val) { this.setAttribute("color", val); }

    /** Shape of the avatar: "circle" | "square" | "rounded" (default "circle"). */
    get shape() { return this.getAttribute("shape") || "circle"; }
    set shape(val) { this.setAttribute("shape", val); }

    /** Avatar size: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** Image URL. When set, renders an <img> instead of initials. */
    get src() { return this.getAttribute("src"); }
    set src(val) {
        if (val) this.setAttribute("src", val);
        else this.removeAttribute("src");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const dimensions = this._getDimensions(this.size);
        const borderRadius = `var(--component-avatar-border-radius-${this.shape}, 9999px)`;
        const [bgColor, textColor] = getColorVarPair(this.color);

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet(dimensions, borderRadius, bgColor, textColor)];
        this.shadowRoot.innerHTML = this.src
            ? `<img src="${this.src}" alt="${this.alt}" part="avatar" />`
            : `<div class="avatar" part="avatar"><h5>${this._getInitials(this.alt)}</h5></div>`;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildStyleSheet(dimensions, borderRadius, bgColor, textColor) {
        const sheet = new CSSStyleSheet();
        const css = this.src
            ? `
              :host {
                display: inline-block;
                height: ${dimensions};
                min-width: ${dimensions};
              }
              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: ${borderRadius};
              }
            `
            : `
              :host {
                display: inline-block;
                width: ${dimensions};
                height: ${dimensions};
                min-width: ${dimensions};
                font-family: var(--font-family-header, "Lexend"), sans-serif;
                text-transform: uppercase;
              }
              .avatar {
                width: 100%;
                height: 100%;
                border-radius: ${borderRadius};
                background-color: ${bgColor};
                color: ${textColor};
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .avatar h5 {
                margin: 0;
                font-size: calc(${dimensions} * 0.5);
              }
            `;
        sheet.replaceSync(css);
        return sheet;
    }

    _getDimensions(size) {
        const map = {
            small: "var(--component-avatar-size-small, 27px)",
            medium: "var(--component-avatar-size-medium, 35px)",
            large: "var(--component-avatar-size-large, 51px)",
        };
        return map[size] || map.medium;
    }

    _getInitials(alt) {
        const words = alt.trim().split(/\s+/);
        return words.length >= 2
            ? words[0].charAt(0) + words[1].charAt(0)
            : alt.substring(0, 2);
    }
}

if (!customElements.get("y-avatar")) {
    customElements.define("y-avatar", YumeAvatar);
}
