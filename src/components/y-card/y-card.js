import {
    hideEmptySlotContainers,
    upgradeProperties,
} from "../../modules/helpers.js";

const SLOT_CONTAINERS = {
    image: ".image",
    header: ".header",
    footer: ".footer",
};

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
        upgradeProperties(this);
        this._syncSlotVisibility();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this._syncSlotVisibility();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme for the card surface. */
    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** Whether the card uses a raised shadow instead of a border. */
    get raised() {
        return this.hasAttribute("raised");
    }
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

        this._syncSlotVisibility();
        this._bindSlotListeners();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindSlotListeners() {
        this.shadowRoot.querySelectorAll("slot").forEach((slot) => {
            slot.addEventListener("slotchange", () =>
                this._syncSlotVisibility(),
            );
        });
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }
            :host {
                --_card-content-color: var(--base-content--);
                --_card-background: var(--base-background-component);
                --_card-border-color: var(--base-border);
            }
            :host([color="primary"]) {
                --_card-background: var(--primary-background-component);
                --_card-border-color: var(--primary-border);
            }
            :host([color="secondary"]) {
                --_card-background: var(--secondary-background-component);
                --_card-border-color: var(--secondary-border);
            }
            :host([color="success"]) {
                --_card-background: var(--success-background-component);
                --_card-border-color: var(--success-border);
            }
            :host([color="error"]) {
                --_card-background: var(--error-background-component);
                --_card-border-color: var(--error-border);
            }
            :host([color="warning"]) {
                --_card-background: var(--warning-background-component);
                --_card-border-color: var(--warning-border);
            }

            :host {
                display: block;
                box-sizing: border-box;
                background: var(--card-background, var(--_card-background));
                border: var(--card-border-width, var(--component-card-border-width, 1px))
                    solid var(--card-border-color, var(--_card-border-color));
                border-radius: var(--component-card-border-radius-outer);
                font-family: var(--font-family-body);
                color: var(--card-content-color, var(--_card-content-color));
                box-shadow: var(--card-box-shadow, none);

                /* Tracks the border colour so slotted content can key off it,
                   and follows an ancestor's --card-border-color override. */
                --card-section-background: var(--card-border-color, var(--_card-border-color));
            }

            /* A raised card keeps its border box and hides the line, rather
               than zeroing the width - otherwise its contents sit 1px out of
               line with the unraised cards beside it. */
            :host([raised]) {
                border-color: transparent;
                box-shadow: var(--card-box-shadow, var(--base-shadow));
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

    _syncSlotVisibility() {
        hideEmptySlotContainers(this.shadowRoot, SLOT_CONTAINERS);
    }
}

if (!customElements.get("y-card")) {
    customElements.define("y-card", YumeCard);
}
