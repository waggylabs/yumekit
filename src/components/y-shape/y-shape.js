import { createElement as _el } from "../../modules/helpers.js";

const PRESET_POLYGONS = {
    star:
        "50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%",
    heart:
        "50% 0%, 61% 0%, 75% 25%, 100% 50%, 50% 100%, 0% 50%, 25% 25%, 39% 0%",
    "chat-bubble":
        "0% 0%, 100% 0%, 100% 70%, 60% 70%, 60% 100%, 40% 70%, 0% 70%",
    times:
        "20% 0%, 0% 20%, 30% 50%, 0% 80%, 20% 100%, 50% 70%, 80% 100%, 100% 80%, 70% 50%, 100% 20%, 80% 0%, 50% 30%",
    cross:
        "40% 0%, 60% 0%, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0% 60%, 0% 40%, 40% 40%",
};

const VALID_TYPES = new Set([
    "rectangle",
    "circle",
    "ellipse",
    "polygon",
    ...Object.keys(PRESET_POLYGONS),
]);

const VALID_FITS = new Set(["contain", "cover", "fill"]);
const VALID_SIZES = new Set(["small", "medium", "large"]);

const SIZE_VAR = {
    small: "var(--component-shape-size-small, 64px)",
    medium: "var(--component-shape-size-medium, 128px)",
    large: "var(--component-shape-size-large, 192px)",
};

const SAFE_LENGTH_RE = /^-?\d+(\.\d+)?(%|px|em|rem|vh|vw)?$/;

export class YumeShape extends HTMLElement {
    static get observedAttributes() {
        return [
            "type",
            "polygon-points",
            "radius",
            "fit",
            "preserve-aspect",
            "size",
        ];
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

    /** Object-fit hint for slotted media: "contain" (default) | "cover" | "fill". */
    get fit() {
        const v = this.getAttribute("fit");
        return VALID_FITS.has(v) ? v : "contain";
    }
    set fit(val) {
        this.setAttribute("fit", val);
    }

    /** Custom polygon coordinates (required when `type="polygon"`). */
    get polygonPoints() {
        return this.getAttribute("polygon-points") || "";
    }
    set polygonPoints(val) {
        if (val) this.setAttribute("polygon-points", val);
        else this.removeAttribute("polygon-points");
    }

    /**
     * When set, only width is anchored to the size token and height is
     * derived from `aspect-ratio: 1 / 1`. This lets a consumer override
     * width (e.g. `width: 100%`) and get a square that scales with the
     * container. When unset, both dimensions are fixed to the size token.
     */
    get preserveAspect() {
        return this.hasAttribute("preserve-aspect");
    }
    set preserveAspect(val) {
        if (val) this.setAttribute("preserve-aspect", "");
        else this.removeAttribute("preserve-aspect");
    }

    /**
     * Shape-specific radius value.
     * - `circle` / `ellipse`: the shape radius (e.g. `"50%"`, `"40px"`).
     * - `rectangle`: corner radius applied via `inset(... round X)`.
     */
    get radius() {
        return this.getAttribute("radius") || "";
    }
    set radius(val) {
        if (val) this.setAttribute("radius", val);
        else this.removeAttribute("radius");
    }

    /** Container size token: "small" | "medium" (default) | "large". */
    get size() {
        const v = this.getAttribute("size");
        return VALID_SIZES.has(v) ? v : "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Shape type: rectangle, circle, ellipse, star, heart, chat-bubble, times, cross, polygon. */
    get type() {
        const v = this.getAttribute("type");
        return VALID_TYPES.has(v) ? v : "rectangle";
    }
    set type(val) {
        this.setAttribute("type", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const clipPath = this._computeClipPath();

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet(clipPath)];
        this.shadowRoot.replaceChildren(
            _el("div", { part: "host", class: "host" }, [
                _el("div", { part: "content", class: "content" }, [
                    _el("slot"),
                ]),
            ]),
        );

        this._emitReady(clipPath);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildStyleSheet(clipPath) {
        const sheet = new CSSStyleSheet();
        const sizeVar = SIZE_VAR[this.size];
        const fit = this.fit;

        // With preserve-aspect we deliberately leave height computed so a
        // consumer can override only width (e.g. `width: 100%`) and have the
        // shape stay square via aspect-ratio. Without it, both dimensions
        // are anchored to the size token so the shape is a fixed square.
        const sizingStyles = this.preserveAspect
            ? `width: var(--component-shape-size, ${sizeVar});
                height: auto;
                aspect-ratio: 1 / 1;`
            : `width: var(--component-shape-size, ${sizeVar});
                height: var(--component-shape-size, ${sizeVar});`;

        sheet.replaceSync(`
            :host {
                --component-shape-clip-path: ${clipPath};
                display: inline-block;
                box-sizing: border-box;
                ${sizingStyles}
                color: var(--component-shape-color, inherit);
                background: var(--component-shape-background, transparent);
                clip-path: var(--component-shape-clip-path);
                -webkit-clip-path: var(--component-shape-clip-path);
                overflow: hidden;
            }

            .host {
                width: 100%;
                height: 100%;
                box-sizing: border-box;
            }

            .content {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* object-fit only applies to replaced elements; <picture> is not
               one, so consumers who slot a <picture> should style its inner
               <img> directly. */
            ::slotted(img),
            ::slotted(video) {
                width: 100%;
                height: 100%;
                object-fit: ${fit === "fill" ? "fill" : fit};
                display: block;
            }
        `);
        return sheet;
    }

    _computeClipPath() {
        const type = this.type;
        const radius = this.radius;

        if (type === "polygon") {
            const pts = this._safePolygonPoints(this.polygonPoints);
            return pts ? `polygon(${pts})` : "inset(0)";
        }

        if (type === "circle") {
            const r = this._safeLength(radius) || "50%";
            return `circle(${r} at 50% 50%)`;
        }

        if (type === "ellipse") {
            const r = this._safeEllipseRadii(radius) || "50% 50%";
            return `ellipse(${r} at 50% 50%)`;
        }

        if (type === "rectangle") {
            const r = this._safeLength(radius);
            return r ? `inset(0 round ${r})` : "inset(0)";
        }

        return `polygon(${PRESET_POLYGONS[type]})`;
    }

    _emitReady(clipPath) {
        if (!this.isConnected) return;
        this.dispatchEvent(
            new CustomEvent("ready", {
                bubbles: true,
                composed: true,
                detail: { clipPath },
            }),
        );
    }

    _safeEllipseRadii(value) {
        // Ellipse takes radii as whitespace-separated lengths; commas are
        // not valid in the radii portion of `ellipse(rx ry at cx cy)`.
        if (value === "" || value == null) return "";
        const str = String(value).trim();
        if (!str || str.includes(",")) return "";

        const tokens = str.split(/\s+/);
        if (tokens.length !== 2) return "";

        for (const token of tokens) {
            if (!SAFE_LENGTH_RE.test(token)) return "";
        }

        return `${tokens[0]} ${tokens[1]}`;
    }

    _safeLength(value) {
        if (value === "" || value == null) return "";
        const str = String(value).trim();
        return SAFE_LENGTH_RE.test(str) ? str : "";
    }

    _safePolygonPoints(value) {
        // Each comma-separated point must be exactly two whitespace-separated
        // lengths. Empty segments (trailing/double commas) and stray tokens
        // are rejected outright rather than coerced into invalid CSS.
        if (value === "" || value == null) return "";
        const str = String(value).trim();
        if (!str) return "";

        const segments = str.split(",").map((s) => s.trim());
        if (segments.length < 3) return "";
        if (segments.some((s) => s === "")) return "";

        const safePoints = [];
        for (const segment of segments) {
            const tokens = segment.split(/\s+/);
            if (tokens.length !== 2) return "";
            if (!SAFE_LENGTH_RE.test(tokens[0])) return "";
            if (!SAFE_LENGTH_RE.test(tokens[1])) return "";
            safePoints.push(`${tokens[0]} ${tokens[1]}`);
        }

        return safePoints.join(", ");
    }
}

if (!customElements.get("y-shape")) {
    customElements.define("y-shape", YumeShape);
}
