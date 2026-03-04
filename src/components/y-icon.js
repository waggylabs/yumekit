import { icons } from "../icons/registry.js";

export class YumeIcon extends HTMLElement {
    static get observedAttributes() {
        return ["name", "size", "color"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        this.render();
    }

    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    _getColor(color) {
        const map = {
            base: "var(--base-content--, #f7f7fa)",
            primary: "var(--primary-content--, #0576ff)",
            secondary: "var(--secondary-content--, #04b8b8)",
            success: "var(--success-content--, #2dba73)",
            warning: "var(--warning-content--, #d17f04)",
            error: "var(--error-content--, #b80421)",
            help: "var(--help-content--, #5405ff)",
        };
        return map[color] || map.base;
    }

    _getSize(size) {
        const map = {
            small: "var(--component-icon-size-small, 16px)",
            medium: "var(--component-icon-size-medium, 24px)",
            large: "var(--component-icon-size-large, 32px)",
        };
        return map[size] || map.medium;
    }

    render() {
        const svg = icons[this.name] || "";
        const sizeVal = this._getSize(this.size);
        const colorVal = this._getColor(this.color);

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: ${sizeVal};
                    height: ${sizeVal};
                    color: ${colorVal};
                    line-height: 0;
                }
                .icon-wrapper {
                    display: contents;
                }
                .icon-wrapper svg {
                    width: 100%;
                    height: 100%;
                }
            </style>
            <span class="icon-wrapper" part="icon">${svg}</span>
        `;
    }
}

if (!customElements.get("y-icon")) {
    customElements.define("y-icon", YumeIcon);
}
