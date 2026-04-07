export class YumeButtonGroup extends HTMLElement {
    static get observedAttributes() {
        return ["orientation"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this._render();
        this._updateChildren();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._applyStyles();
            this._updateChildren();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Layout direction: "horizontal" | "vertical" (default "horizontal"). */
    get orientation() { return this.getAttribute("orientation") || "horizontal"; }
    set orientation(val) { this.setAttribute("orientation", val); }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyStyles() {
        if (!this._styleEl) {
            this._styleEl = document.createElement("style");
            this.shadowRoot.appendChild(this._styleEl);
        }
        const isVertical = this.orientation === "vertical";
        this._styleEl.textContent = `
            :host {
                display: inline-flex;
                flex-direction: ${isVertical ? "column" : "row"};
                align-items: stretch;
            }
            ::slotted(*) {
                flex-shrink: 0;
                position: relative;
            }
        `;
    }

    _getRadius() {
        const val = getComputedStyle(this).getPropertyValue("--component-button-border-radius-outer").trim();
        return val || "4px";
    }

    _render() {
        this._applyStyles();
        if (!this.shadowRoot.querySelector("slot")) {
            const slot = document.createElement("slot");
            slot.addEventListener("slotchange", () => this._updateChildren());
            this.shadowRoot.appendChild(slot);
        }
    }

    _updateChildren() {
        const slot = this.shadowRoot.querySelector("slot");
        if (!slot) return;

        const children = slot.assignedElements({ flatten: true });
        const isVertical = this.orientation === "vertical";
        const radius = this._getRadius();
        const total = children.length;

        children.forEach((child, index) => {
            const isFirst = index === 0;
            const isLast = index === total - 1;

            // Collapse the shared border between adjacent items
            if (isVertical) {
                child.style.marginLeft = "";
                child.style.marginTop = isFirst ? "" : "-1px";
            } else {
                child.style.marginTop = "";
                child.style.marginLeft = isFirst ? "" : "-1px";
            }

            // Override border-radius on all child types via their respective CSS custom properties
            if (total === 1) {
                child.style.removeProperty("--component-button-border-radius-outer");
                child.style.removeProperty("--component-inputs-border-radius-outer");
            } else if (isFirst) {
                const value = isVertical ? `${radius} ${radius} 0 0` : `${radius} 0 0 ${radius}`;
                child.style.setProperty("--component-button-border-radius-outer", value);
                child.style.setProperty("--component-inputs-border-radius-outer", value);
            } else if (isLast) {
                const value = isVertical ? `0 0 ${radius} ${radius}` : `0 ${radius} ${radius} 0`;
                child.style.setProperty("--component-button-border-radius-outer", value);
                child.style.setProperty("--component-inputs-border-radius-outer", value);
            } else {
                child.style.setProperty("--component-button-border-radius-outer", "0");
                child.style.setProperty("--component-inputs-border-radius-outer", "0");
            }
        });
    }
}

if (!customElements.get("y-button-group")) {
    customElements.define("y-button-group", YumeButtonGroup);
}
