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
const VALID_SIZES = new Set(["sm", "md", "lg"]);

const SIZE_VAR = {
    sm: "var(--component-shape-size-sm, 64px)",
    md: "var(--component-shape-size-md, 128px)",
    lg: "var(--component-shape-size-lg, 192px)",
};

const SAFE_LENGTH_RE = /^-?\d+(\.\d+)?(%|px|em|rem|vh|vw)?$/;
const SAFE_POLYGON_RE = /^[\d\s.,%\-pxem]+$/i;

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

    /** If true, lock the container to a 1:1 aspect ratio. */
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

    /** Container size token: "sm" | "md" | "lg" (default "md"). */
    get size() {
        const v = this.getAttribute("size");
        return VALID_SIZES.has(v) ? v : "md";
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
        const aspect = this.preserveAspect ? "aspect-ratio: 1 / 1;" : "";

        sheet.replaceSync(`
            :host {
                --component-shape-clip-path: ${clipPath};
                display: inline-block;
                box-sizing: border-box;
                width: var(--component-shape-size, ${sizeVar});
                height: var(--component-shape-size, ${sizeVar});
                ${aspect}
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

            ::slotted(img),
            ::slotted(video),
            ::slotted(picture) {
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
            const pts = this.polygonPoints;
            if (pts && SAFE_POLYGON_RE.test(pts)) return `polygon(${pts})`;
            return "inset(0)";
        }

        if (type === "circle") {
            const r = this._safeLength(radius) || "50%";
            return `circle(${r} at 50% 50%)`;
        }

        if (type === "ellipse") {
            const r = radius && SAFE_POLYGON_RE.test(radius) ? radius : "50% 50%";
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

    _safeLength(value) {
        if (value === "" || value == null) return "";
        const str = String(value).trim();
        return SAFE_LENGTH_RE.test(str) ? str : "";
    }
}

if (!customElements.get("y-shape")) {
    customElements.define("y-shape", YumeShape);
}
