import { getIcon } from "../icons/registry.js";

// Allowlist-based SVG sanitizer — only known-safe elements and attributes are kept.
const ALLOWED_ELEMENTS = new Set([
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "rect",
    "line",
    "polyline",
    "polygon",
    "text",
    "tspan",
    "defs",
    "clippath",
    "mask",
    "lineargradient",
    "radialgradient",
    "stop",
    "symbol",
    "title",
    "desc",
    "metadata",
]);

const ALLOWED_ATTRS = new Set([
    "viewbox",
    "xmlns",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-miterlimit",
    "stroke-opacity",
    "fill-opacity",
    "fill-rule",
    "clip-rule",
    "opacity",
    "d",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x",
    "x1",
    "x2",
    "y",
    "y1",
    "y2",
    "width",
    "height",
    "points",
    "transform",
    "id",
    "class",
    "clip-path",
    "mask",
    "offset",
    "stop-color",
    "stop-opacity",
    "gradient-units",
    "gradienttransform",
    "gradientunits",
    "spreadmethod",
    "patternunits",
    "patterntransform",
    "font-size",
    "font-family",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
    "alignment-baseline",
    "dx",
    "dy",
    "rotate",
    "textlength",
    "lengthadjust",
    "display",
    "visibility",
    "color",
    "vector-effect",
]);

function sanitizeSvg(raw) {
    if (!raw) return "";
    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return "";

    const walk = (el) => {
        for (const child of [...el.children]) {
            if (!ALLOWED_ELEMENTS.has(child.tagName.toLowerCase())) {
                child.remove();
                continue;
            }
            for (const attr of [...child.attributes]) {
                if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
                    child.removeAttribute(attr.name);
                }
            }
            walk(child);
        }
    };

    for (const attr of [...svg.attributes]) {
        if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
            svg.removeAttribute(attr.name);
        }
    }
    walk(svg);
    return svg.outerHTML;
}

// Cache sanitized SVG markup per icon name to avoid repeated DOMParser + DOM-walk
// on every render. The cache is naturally bounded by the number of registered icons.
const sanitizedSvgCache = new Map();

function getCachedSvg(name) {
    if (sanitizedSvgCache.has(name)) {
        return sanitizedSvgCache.get(name);
    }
    const result = sanitizeSvg(getIcon(name));
    sanitizedSvgCache.set(name, result);
    return result;
}

export class YumeIcon extends HTMLElement {
    static get observedAttributes() {
        return ["name", "size", "color", "label", "weight"];
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

    /** Stroke weight: "thin" | "regular" | "thick". */
    get weight() {
        return this.getAttribute("weight") || "regular";
    }
    set weight(val) {
        if (val) this.setAttribute("weight", val);
        else this.removeAttribute("weight");
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

    render() {
        const svg = getCachedSvg(this.name);
        const sizeVal = this._getSize(this.size);
        const colorVal = this.color ? this._getColor(this.color) : "inherit";
        const weightVal = this._getWeight(this.weight);
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

        const weightCSS = weightVal
            ? `.icon-wrapper svg,
                .icon-wrapper svg * { stroke-width: ${weightVal} !important; }`
            : "";

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
                ${weightCSS}
            </style>
            <span class="icon-wrapper" part="icon">${svg}</span>
        `;
    }
}

if (!customElements.get("y-icon")) {
    customElements.define("y-icon", YumeIcon);
}
