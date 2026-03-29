import { contrastTextColor } from "../modules/helpers.js";

export class YumeBadge extends HTMLElement {
    static get observedAttributes() {
        return ["value", "position", "alignment", "color", "size"];
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
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Horizontal alignment of the badge: "left" | "right" (default "right"). */
    get alignment() { return this.getAttribute("alignment") || "right"; }
    set alignment(val) { this.setAttribute("alignment", val); }

    /** Color theme: "primary" | "secondary" | "base" | "success" | "warning" | "error" | "help". */
    get color() { return this.getAttribute("color") || "primary"; }
    set color(val) { this.setAttribute("color", val); }

    /** Vertical position of the badge: "top" | "bottom" (default "top"). */
    get position() { return this.getAttribute("position") || "top"; }
    set position(val) { this.setAttribute("position", val); }

    /** Badge size: "small" | "medium" | "large" (default "small"). */
    get size() { return this.getAttribute("size") || "small"; }
    set size(val) { this.setAttribute("size", val); }

    /** The text content displayed inside the badge. */
    get value() { return this.getAttribute("value") || ""; }
    set value(val) { this.setAttribute("value", val); }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const [badgeColor, badgeTextColor] = this._getBadgeColors(this.color);
        const { fontSize, padding, minSize } = this._getSizeAttributes(this.size);
        const hasTarget = this._hasTargetContent();
        const positionCSS = hasTarget
            ? this._getBadgePosition(this.position, this.alignment)
            : "";

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: ${hasTarget ? "relative" : "static"};
                    display: inline-flex;
                    align-items: center;
                }
                .badge {
                    position: ${hasTarget ? "absolute" : "static"};
                    ${positionCSS}
                    background: ${badgeColor};
                    color: ${badgeTextColor};
                    font-size: ${fontSize};
                    font-weight: bold;
                    padding: ${padding};
                    border-radius: var(--component-badge-border-radius-circle, 9999px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-family-body, sans-serif);
                    min-width: ${minSize};
                    height: ${minSize};
                    z-index: 20;
                }
                ::slotted(*) {
                    position: relative;
                    display: inline-block;
                }
            </style>
            ${hasTarget ? "<slot></slot>" : ""}
            <div class="badge" part="badge">${this.value}</div>
        `;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _getBadgeColors(color) {
        const colorMap = {
            primary: ["var(--primary-content--)", "var(--primary-content-inverse)"],
            secondary: ["var(--secondary-content--)", "var(--secondary-content-inverse)"],
            base: ["var(--base-content--)", "var(--base-content-inverse)"],
            success: ["var(--success-content--)", "var(--success-content-inverse)"],
            warning: ["var(--warning-content--)", "var(--warning-content-inverse)"],
            error: ["var(--error-content--)", "var(--error-content-inverse)"],
            help: ["var(--help-content--)", "var(--help-content-inverse)"],
        };
        return colorMap[color] || [color, contrastTextColor(color)];
    }

    _getBadgePosition(position, alignment) {
        const offset = "var(--spacing-small, 6px)";
        const vertical = position === "top"
            ? `top: calc(${offset} * -1);`
            : `bottom: calc(${offset} * -1);`;
        const horizontal = alignment === "right"
            ? `right: calc(${offset} * -1);`
            : `left: calc(${offset} * -1);`;
        return `${vertical} ${horizontal}`;
    }

    _getSizeAttributes(size) {
        const sizeMap = {
            small: {
                fontSize: "var(--font-size-small, 0.8em)",
                padding:  "var(--component-badge-padding-small)",
                minSize:  "var(--component-badge-size-small)",
            },
            medium: {
                fontSize: "var(--font-size-label, 0.83em)",
                padding:  "var(--component-badge-padding-medium)",
                minSize:  "var(--component-badge-size-medium)",
            },
            large: {
                fontSize: "var(--font-size-paragraph, 1em)",
                padding:  "var(--component-badge-padding-large)",
                minSize:  "var(--component-badge-size-large)",
            },
        };
        return sizeMap[size] || sizeMap.small;
    }

    _hasTargetContent() {
        return Array.from(this.childNodes).some((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) return true;
            if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim() !== "";
            return false;
        });
    }
}

if (!customElements.get("y-badge")) {
    customElements.define("y-badge", YumeBadge);
}
