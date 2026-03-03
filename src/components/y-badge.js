export class YumeBadge extends HTMLElement {
    static get observedAttributes() {
        return ["value", "position", "alignment", "color", "size"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get alignment() {
        return this.getAttribute("alignment") || "right";
    }

    get color() {
        return this.getAttribute("color") || "primary";
    }

    get position() {
        return this.getAttribute("position") || "top";
    }

    get size() {
        return this.getAttribute("size") || "small";
    }

    get value() {
        return this.getAttribute("value") || "";
    }

    getBadgeColors(color) {
        const colorMap = {
            primary: ["var(--primary-content--)", "var(--primary-content-inverse)"],
            secondary: ["var(--secondary-content--)", "var(--secondary-content-inverse)"],
            base: ["var(--base-content--)", "var(--base-content-inverse)"],
            success: ["var(--success-content--)", "var(--success-content-inverse)"],
            warning: ["var(--warning-content--)", "var(--warning-content-inverse)"],
            error: ["var(--error-content--)", "var(--error-content-inverse)"],
            help: ["var(--help-content--)", "var(--help-content-inverse)"],
        };
        return colorMap[color] || [color, "var(--neutral-white, #fff)"];
    }

    getBadgePosition(position, alignment) {
        const offset = "var(--spacing-small, 6px)";
        const vertical =
            position === "top"
                ? `top: calc(${offset} * -1);`
                : `bottom: calc(${offset} * -1);`;
        const horizontal =
            alignment === "right"
                ? `right: calc(${offset} * -1);`
                : `left: calc(${offset} * -1);`;
        return `${vertical} ${horizontal}`;
    }

    getSizeAttributes(size) {
        const sizeMap = {
            small: {
                fontSize: "var(--font-size-small, 0.8em)",
                padding: "var(--component-badge-padding-small)",
                minSize: "var(--component-badge-size-small)",
            },
            medium: {
                fontSize: "var(--font-size-label, 0.83em)",
                padding: "var(--component-badge-padding-medium)",
                minSize: "var(--component-badge-size-medium)",
            },
            large: {
                fontSize: "var(--font-size-paragraph, 1em)",
                padding: "var(--component-badge-padding-large)",
                minSize: "var(--component-badge-size-large)",
            },
        };
        return sizeMap[size] || sizeMap.small;
    }

    hasTargetContent() {
        return Array.from(this.childNodes).some((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) return true;
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim() !== "";
            }
            return false;
        });
    }

    render() {
        const [badgeColor, badgeTextColor] = this.getBadgeColors(this.color);
        const { fontSize, padding, minSize } = this.getSizeAttributes(
            this.size,
        );
        const positionStyles = this.getBadgePosition(
            this.position,
            this.alignment,
        );
        const hasTarget = this.hasTargetContent();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: ${hasTarget ? "relative" : "static"};
                    display: inline-flex;
                    align-items: center;
                }
                .badge {
                    position: ${hasTarget ? "absolute" : "static"};
                    ${hasTarget ? positionStyles : ""}
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
}

if (!customElements.get("y-badge")) {
    customElements.define("y-badge", YumeBadge);
}
