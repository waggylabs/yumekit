import {
    createElement as _el,
    upgradeProperties,
} from "../../modules/helpers.js";

const VALID_VARIANTS = new Set(["text", "circle", "rect"]);
const VALID_ANIMATIONS = new Set(["pulse", "wave", "none"]);

// Any CSS length or percentage. Gates width/height before they are painted into
// an inline custom property so a hostile value cannot close the declaration and
// inject markup or other rules.
const SAFE_LENGTH_RE =
    /^-?\d+(\.\d+)?(px|%|em|rem|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)?$/;

export class YumeSkeleton extends HTMLElement {
    static get observedAttributes() {
        return ["variant", "width", "height", "lines", "animation"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._onSlotChange = this._onSlotChange.bind(this);
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Shimmer style: "pulse" (default) | "wave" | "none". */
    get animation() {
        const v = this.getAttribute("animation");
        return VALID_ANIMATIONS.has(v) ? v : "pulse";
    }
    set animation(val) {
        this.setAttribute("animation", val);
    }

    /** Explicit height as any CSS length; default depends on the variant. */
    get height() {
        return this.getAttribute("height") || "";
    }
    set height(val) {
        if (val) this.setAttribute("height", val);
        else this.removeAttribute("height");
    }

    /** `text` variant only: number of line bars to render (default 1). */
    get lines() {
        const n = parseInt(this.getAttribute("lines"), 10);
        return Number.isFinite(n) && n > 0 ? n : 1;
    }
    set lines(val) {
        this.setAttribute("lines", val);
    }

    /** Placeholder shape: "text" (default) | "circle" | "rect". */
    get variant() {
        const v = this.getAttribute("variant");
        return VALID_VARIANTS.has(v) ? v : "text";
    }
    set variant(val) {
        this.setAttribute("variant", val);
    }

    /** Explicit width as any CSS length; default depends on the variant. */
    get width() {
        return this.getAttribute("width") || "";
    }
    set width(val) {
        if (val) this.setAttribute("width", val);
        else this.removeAttribute("width");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this._applyDimensions();

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(this._buildView());

        const slot = this.shadowRoot.querySelector("slot");
        slot.addEventListener("slotchange", this._onSlotChange);
        this._onSlotChange();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyDimensions() {
        const width = this._safeLength(this.width);
        if (width) this.style.setProperty("--_skeleton-w", width);
        else this.style.removeProperty("--_skeleton-w");

        const height = this._safeLength(this.height);
        if (height) this.style.setProperty("--_skeleton-h", height);
        else this.style.removeProperty("--_skeleton-h");
    }

    _buildBars() {
        const count = this.lines;
        const bars = [];
        for (let i = 0; i < count; i++) {
            const shortLast = count > 1 && i === count - 1;
            bars.push(
                _el("div", {
                    class: `shape bar${shortLast ? " bar--short" : ""}`,
                    part: "skeleton",
                }),
            );
        }
        return _el("div", { class: "lines" }, bars);
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(
            [
                this._baseCSS(),
                this._variantCSS(),
                this._animationCSS(),
                this._reducedMotionCSS(),
            ].join("\n"),
        );
        return sheet;
    }

    _buildView() {
        const view =
            this.variant === "text"
                ? this._buildBars()
                : _el("div", { class: "shape single", part: "skeleton" });

        return _el("div", { class: "root", "aria-hidden": "true" }, [
            _el("div", { class: "sizer" }, [_el("slot")]),
            view,
        ]);
    }

    _baseCSS() {
        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                box-sizing: border-box;
            }

            .root {
                position: relative;
                box-sizing: border-box;
            }

            /* No slotted content: the sizer reserves no space and the shape(s)
               define their own dimensions. */
            .sizer {
                display: none;
            }

            /* Slotted sizing content: the invisible content sizes the host and
               the shape overlays it. Explicit width/height still win. */
            .root.has-content {
                display: inline-block;
                width: var(--_skeleton-w, auto);
                height: var(--_skeleton-h, auto);
            }
            .root.has-content .sizer {
                display: block;
            }
            ::slotted(*) {
                visibility: hidden;
            }

            .shape {
                background-color: var(--component-skeleton-bg, #e4e6eb);
                box-sizing: border-box;
            }
        `;
    }

    _variantCSS() {
        if (this.variant === "circle") {
            return `
                .shape.single {
                    width: var(--_skeleton-w, 100%);
                    height: var(--_skeleton-h, auto);
                    aspect-ratio: 1 / 1;
                    border-radius: 50%;
                }
                .root.has-content .shape.single {
                    position: absolute;
                    inset: 0;
                }
            `;
        }

        if (this.variant === "rect") {
            return `
                .shape.single {
                    width: var(--_skeleton-w, 100%);
                    height: var(--_skeleton-h, 1.5em);
                    border-radius: var(--component-skeleton-radius, 4px);
                }
                .root.has-content .shape.single {
                    position: absolute;
                    inset: 0;
                }
            `;
        }

        return `
            .lines {
                display: flex;
                flex-direction: column;
                gap: var(--component-skeleton-text-gap, 0.5em);
                width: var(--_skeleton-w, 100%);
            }
            .bar {
                width: 100%;
                height: var(--_skeleton-h, 1em);
                border-radius: var(--component-skeleton-radius, 4px);
            }
            .bar--short {
                width: 60%;
            }
            .root.has-content .lines {
                position: absolute;
                inset: 0;
            }
        `;
    }

    _animationCSS() {
        const duration =
            "var(--component-skeleton-animation-duration, 1500ms)";

        if (this.animation === "pulse") {
            return `
                .shape {
                    animation: yk-skeleton-pulse ${duration} ease-in-out infinite;
                }
                @keyframes yk-skeleton-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `;
        }

        if (this.animation === "wave") {
            return `
                .shape {
                    position: relative;
                    overflow: hidden;
                }
                .shape::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background: linear-gradient(
                        90deg,
                        transparent,
                        var(--component-skeleton-highlight, rgba(255, 255, 255, 0.6)),
                        transparent
                    );
                    animation: yk-skeleton-wave ${duration} linear infinite;
                }
                @keyframes yk-skeleton-wave {
                    100% { transform: translateX(100%); }
                }
            `;
        }

        return "";
    }

    _reducedMotionCSS() {
        // Honour the OS "reduce motion" preference: fall back to a static block
        // equivalent to animation="none" regardless of the animation attribute.
        return `
            @media (prefers-reduced-motion: reduce) {
                .shape {
                    animation: none;
                }
                .shape::after {
                    content: none;
                    animation: none;
                }
            }
        `;
    }

    _onSlotChange() {
        const slot = this.shadowRoot.querySelector("slot");
        const root = this.shadowRoot.querySelector(".root");
        if (!slot || !root) return;
        const hasContent = slot
            .assignedNodes({ flatten: true })
            .some((n) => n.nodeType === Node.ELEMENT_NODE);
        root.classList.toggle("has-content", hasContent);
    }

    _safeLength(value) {
        if (!value) return "";
        const str = String(value).trim();
        return SAFE_LENGTH_RE.test(str) ? str : "";
    }
}

if (!customElements.get("y-skeleton")) {
    customElements.define("y-skeleton", YumeSkeleton);
}
