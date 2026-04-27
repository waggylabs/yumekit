import {
    createElement as _el,
    resolveGapToken,
} from "../../modules/helpers.js";

const DIRECTION_VALUES = new Set([
    "row",
    "row-reverse",
    "column",
    "column-reverse",
]);

const WRAP_VALUES = new Set(["nowrap", "wrap", "wrap-reverse"]);

const ALIGN_MAP = {
    start: "flex-start",
    end: "flex-end",
    center: "center",
    stretch: "stretch",
    baseline: "baseline",
};

const JUSTIFY_MAP = {
    start: "flex-start",
    end: "flex-end",
    center: "center",
    between: "space-between",
    around: "space-around",
    evenly: "space-evenly",
};

const ALIGN_CONTENT_MAP = {
    ...JUSTIFY_MAP,
    stretch: "stretch",
};

export class YumeStack extends HTMLElement {
    static get observedAttributes() {
        return [
            "direction",
            "wrap",
            "align",
            "justify",
            "align-content",
            "gap",
            "row-gap",
            "column-gap",
            "inline",
            "responsive",
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
        this._applyStyles();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this._applyStyles();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Main axis direction; maps to `flex-direction`. */
    get direction() {
        const raw = this.getAttribute("direction");
        return DIRECTION_VALUES.has(raw) ? raw : "row";
    }
    set direction(val) {
        this.setAttribute("direction", val);
    }

    /**
     * `nowrap` (default) | `wrap` | `wrap-reverse`. Presence of the `wrap`
     * attribute without a value resolves to `wrap` for back-compat with the
     * earlier boolean form.
     */
    get wrap() {
        if (!this.hasAttribute("wrap")) return "nowrap";
        const raw = this.getAttribute("wrap");
        if (raw === "" || raw == null) return "wrap";
        return WRAP_VALUES.has(raw) ? raw : "wrap";
    }
    set wrap(val) {
        if (val === false || val === "nowrap") this.removeAttribute("wrap");
        else if (val === true || val === "" || val == null)
            this.setAttribute("wrap", "");
        else this.setAttribute("wrap", String(val));
    }

    /** Cross-axis alignment; maps to `align-items`. */
    get align() {
        return this.getAttribute("align") || "stretch";
    }
    set align(val) {
        this.setAttribute("align", val);
    }

    /** Main-axis distribution; maps to `justify-content`. */
    get justify() {
        return this.getAttribute("justify") || "start";
    }
    set justify(val) {
        this.setAttribute("justify", val);
    }

    /** Cross-axis distribution between wrapped lines; maps to `align-content`. */
    get alignContent() {
        return this.getAttribute("align-content") || "stretch";
    }
    set alignContent(val) {
        this.setAttribute("align-content", val);
    }

    /** Gap between items, maps to `--spacing-*` tokens. */
    get gap() {
        return this.getAttribute("gap") || "medium";
    }
    set gap(val) {
        this.setAttribute("gap", val);
    }

    /** Row gap override; falls back to `gap` when unset. */
    get rowGap() {
        return this.getAttribute("row-gap") || "";
    }
    set rowGap(val) {
        this.setAttribute("row-gap", val);
    }

    /** Column gap override; falls back to `gap` when unset. */
    get columnGap() {
        return this.getAttribute("column-gap") || "";
    }
    set columnGap(val) {
        this.setAttribute("column-gap", val);
    }

    /** Use `display: inline-flex` instead of `flex`. */
    get inline() {
        return this.hasAttribute("inline");
    }
    set inline(val) {
        if (val) this.setAttribute("inline", "");
        else this.removeAttribute("inline");
    }

    /**
     * On `direction="row"`, auto-enable wrap and collapse to `column` below the
     * mobile breakpoint (measured against the stack's own container width).
     * Defaults to `true`; set `responsive="false"` to disable.
     */
    get responsive() {
        return this.getAttribute("responsive") !== "false";
    }
    set responsive(val) {
        if (val === false || val === "false") {
            this.setAttribute("responsive", "false");
        } else {
            this.removeAttribute("responsive");
        }
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const slot = _el("slot");
        this._container = _el(
            "div",
            { class: "container", part: "container" },
            [slot],
        );
        this.shadowRoot.replaceChildren(this._container);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyStyles() {
        if (!this._container) return;
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
    }

    _buildCollapseRule(useContainerQuery) {
        if (!useContainerQuery) return "";
        const breakpoint = this._getMobileBreakpoint();
        return `
            @container (max-width: ${breakpoint}px) {
                .container {
                    flex-direction: column;
                }
            }
        `;
    }

    _buildStyleSheet() {
        const direction = this.direction;
        const isRow = direction === "row" || direction === "row-reverse";
        const wrapValue = this._resolveWrap(isRow);
        const alignItems = ALIGN_MAP[this.align] || "stretch";
        const justifyContent = JUSTIFY_MAP[this.justify] || "flex-start";
        const alignContent = ALIGN_CONTENT_MAP[this.alignContent] || "stretch";
        const inline = this.inline;
        const display = inline ? "inline-flex" : "flex";
        const hostDisplay = inline ? "inline-block" : "block";
        const gapValue = `var(--component-stack-gap, ${resolveGapToken(this, "gap")})`;
        const rowGapValue = `var(--component-stack-row-gap, ${resolveGapToken(this, "row-gap")})`;
        const columnGapValue = `var(--component-stack-column-gap, ${resolveGapToken(this, "column-gap")})`;

        // Container queries require `container-type: inline-size`, which also
        // applies inline-size containment — that breaks intrinsic sizing for
        // `inline-flex` hosts (they collapse to 0 width). Only opt in when the
        // responsive collapse rule actually needs the query.
        const useContainerQuery = this.responsive && isRow && !inline;
        const containerType = useContainerQuery
            ? "container-type: inline-size;"
            : "";
        const slottedRule =
            wrapValue !== "nowrap" ? "::slotted(*) { flex-shrink: 0; }" : "";
        const collapseRule = this._buildCollapseRule(useContainerQuery);

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: ${hostDisplay};
                box-sizing: border-box;
                ${containerType}
            }
            .container {
                display: ${display};
                flex-direction: ${direction};
                flex-wrap: ${wrapValue};
                align-items: ${alignItems};
                justify-content: ${justifyContent};
                align-content: ${alignContent};
                gap: ${gapValue};
                row-gap: ${rowGapValue};
                column-gap: ${columnGapValue};
            }
            ${slottedRule}
            ${collapseRule}
        `);
        return sheet;
    }

    _getMobileBreakpoint() {
        const raw = getComputedStyle(this)
            .getPropertyValue("--component-stack-mobile-breakpoint")
            .trim();
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) ? parsed : 576;
    }

    _resolveWrap(isRow) {
        if (this.hasAttribute("wrap")) return this.wrap;
        if (this.responsive && isRow) return "wrap";
        return "nowrap";
    }
}

if (!customElements.get("y-stack")) {
    customElements.define("y-stack", YumeStack);
}
