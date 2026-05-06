import { createElement as _el } from "../../modules/helpers.js";
import { getSanitizedIcon } from "../../modules/svg-sanitizer.js";

export class YumeIcon extends HTMLElement {
    static get observedAttributes() {
        return ["name", "size", "color", "label", "weight"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme: "base" | "primary" | "secondary" | "success" | "warning" | "error" | "help". */
    get color() {
        return this.getAttribute("color") || "";
    }
    set color(val) {
        if (val) this.setAttribute("color", val);
        else this.removeAttribute("color");
    }

    /** Accessible label for the icon. When set, the icon gets role="img". */
    get label() {
        return this.getAttribute("label") || "";
    }
    set label(val) {
        if (val) this.setAttribute("label", val);
        else this.removeAttribute("label");
    }

    /** The registered icon name to display. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** Icon size: "x-small" | "small" | "medium" | "large" | "x-large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Stroke weight: "thin" | "regular" | "thick". */
    get weight() {
        return this.getAttribute("weight") || "regular";
    }
    set weight(val) {
        if (val) this.setAttribute("weight", val);
        else this.removeAttribute("weight");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const svg = getSanitizedIcon(this.name);
        const sizeVal = this._getSize(this.size);
        const colorVal = this.color ? this._getColor(this.color) : "inherit";
        const weightVal = this._getWeight(this.weight);

        this._updateAria();

        const wrapper = _el("span", { class: "icon-wrapper", part: "icon" });
        wrapper.innerHTML = svg;

        this.shadowRoot.adoptedStyleSheets = [
            this._buildStyleSheet(sizeVal, colorVal, weightVal),
        ];
        this.shadowRoot.replaceChildren(wrapper);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildStyleSheet(sizeVal, colorVal, weightVal) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
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
            ${this._getWeightCSS(weightVal)}
        `);
        return sheet;
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
        if (map[color]) return map[color];
        if (
            color &&
            (color.startsWith("#") ||
                color.startsWith("rgb") ||
                color.startsWith("hsl"))
        ) {
            return color;
        }
        return map.base;
    }

    _getSize(size) {
        const map = {
            "x-small": "var(--component-icon-size-x-small, 10px)",
            small: "var(--component-icon-size-small, 14px)",
            medium: "var(--component-icon-size-medium, 18px)",
            large: "var(--component-icon-size-large, 22px)",
            "x-large": "var(--component-icon-size-x-large, 28px)",
        };
        return map[size] || map.medium;
    }

    _getWeight(weight) {
        const map = {
            "x-thin": "1",
            thin: "1.5",
            regular: "2",
            thick: "2.5",
            "x-thick": "3",
        };
        return map[weight] || "";
    }

    _getWeightCSS(weightVal) {
        if (!weightVal) return "";
        return `.icon-wrapper svg,
                .icon-wrapper svg * { stroke-width: ${weightVal} !important; }`;
    }

    _updateAria() {
        if (this.label) {
            this.setAttribute("role", "img");
            this.setAttribute("aria-label", this.label);
            this.removeAttribute("aria-hidden");
        } else {
            this.setAttribute("aria-hidden", "true");
            this.removeAttribute("role");
            this.removeAttribute("aria-label");
        }
    }
}

if (!customElements.get("y-icon")) {
    customElements.define("y-icon", YumeIcon);
}
