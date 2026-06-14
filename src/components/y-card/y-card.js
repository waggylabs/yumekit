import { hideEmptySlotContainers } from "../../modules/helpers.js";

export class YumeCard extends HTMLElement {
    static get observedAttributes() {
        return ["color", "raised"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        this._updateColorStyles();
        this._updateElevationStyles();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "color") this._updateColorStyles();
        if (name === "raised") this._updateElevationStyles();
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme for the card surface. */
    get color() { return this.getAttribute("color") || "base"; }
    set color(val) { this.setAttribute("color", val); }

    /** Whether the card uses a raised shadow instead of a border. */
    get raised() { return this.hasAttribute("raised"); }
    set raised(val) {
        if (val) this.setAttribute("raised", "");
        else this.removeAttribute("raised");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];

        this.shadowRoot.innerHTML = `
            <div class="image" part="image"><slot name="image"></slot></div>
            <div class="header" part="header"><slot name="header"></slot></div>
            <div class="body" part="body"><slot></slot></div>
            <div class="footer" part="footer"><slot name="footer"></slot></div>
        `;

        const slotsConfig = { image: ".image", header: ".header", footer: ".footer" };
        hideEmptySlotContainers(this.shadowRoot, slotsConfig);
        this._bindSlotListeners(slotsConfig);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindSlotListeners(slotsConfig) {
        this.shadowRoot.querySelectorAll("slot").forEach((slot) => {
            slot.addEventListener("slotchange", () =>
                hideEmptySlotContainers(this.shadowRoot, slotsConfig),
            );
        });
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
                background: var(--card-background, var(--base-background-component));
                border: 1px solid var(--card-border-color, var(--base-border));
                border-width: var(--card-border-width, var(--component-card-border-width, 1px));
                border-radius: var(--component-card-border-radius-outer);
                font-family: var(--font-family-body);
                color: var(--card-content-color, var(--base-content--));
                box-shadow: var(--card-box-shadow, none);
            }

            .image {
                overflow: hidden;
                border-radius: var(--component-card-border-radius-outer) var(--component-card-border-radius-outer) 0 0;
            }

            .header {
                padding: var(--component-card-padding-outer);
                border-bottom: var(--component-card-inner-border-width) solid var(--card-border-color, var(--base-border));
            }

            .body {
                padding: var(--component-card-padding-outer);
            }

            .footer {
                padding: var(--component-card-padding-inner) var(--component-card-padding-outer);
                border-top: var(--component-card-inner-border-width) solid var(--card-border-color, var(--base-border));
            }

            ::slotted(*) {
                margin: 0;
            }
        `);
        return sheet;
    }

    _updateColorStyles() {
        const colorVars = {
            primary: ["--base-content--", "--primary-background-component", "--primary-border"],
            secondary: ["--base-content--", "--secondary-background-component", "--secondary-border"],
            base: ["--base-content--", "--base-background-component", "--base-border"],
            success: ["--base-content--", "--success-background-component", "--success-border"],
            error: ["--base-content--", "--error-background-component", "--error-border"],
            warning: ["--base-content--", "--warning-background-component", "--warning-border"],
        };

        const [contentVar, bgVar, borderVar] = colorVars[this.color] || colorVars.base;
        this.style.setProperty("--card-content-color",    `var(${contentVar})`);
        this.style.setProperty("--card-background",       `var(${bgVar})`);
        this.style.setProperty("--card-border-color",     `var(${borderVar})`);
        this.style.setProperty("--card-section-background", `var(${borderVar})`);
    }

    _updateElevationStyles() {
        if (this.raised) {
            this.style.setProperty("--card-border-width", "0");
            this.style.setProperty("--card-box-shadow", "var(--base-shadow)");
        } else {
            this.style.setProperty("--card-border-width", "var(--component-card-border-width)");
            this.style.setProperty("--card-box-shadow", "none");
        }
    }
}

if (!customElements.get("y-card")) {
    customElements.define("y-card", YumeCard);
}
