import { getIcon } from "../icons/registry.js";

function sanitizeSvg(raw) {
    if (!raw) return "";
    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return "";
    // Strip scripts and event handler attributes
    for (const el of svg.querySelectorAll("script")) el.remove();
    for (const el of svg.querySelectorAll("*")) {
        for (const attr of [...el.attributes]) {
            if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
        }
    }
    return svg.outerHTML;
}

export class YumeIcon extends HTMLElement {
    static get observedAttributes() {
        return ["name", "size", "color", "label"];
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

    get label() {
        return this.getAttribute("label") || "";
    }
    set label(val) {
        if (val) this.setAttribute("label", val);
        else this.removeAttribute("label");
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
        const svg = sanitizeSvg(getIcon(this.name));
        const sizeVal = this._getSize(this.size);
        const colorVal = this._getColor(this.color);
        const label = this.label;

        if (label) {
            this.setAttribute("role", "img");
            this.setAttribute("aria-label", label);
            this.removeAttribute("aria-hidden");
        } else {
            this.setAttribute("aria-hidden", "true");
            this.removeAttribute("role");
            this.removeAttribute("aria-label");
        }

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
