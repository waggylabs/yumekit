import { resolveGapToken } from "../../modules/helpers.js";

const ALIGN_MAP = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
    baseline: "baseline",
};

const JUSTIFY_ITEMS_MAP = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
};

const CONTENT_MAP = {
    start: "start",
    end: "end",
    center: "center",
    stretch: "stretch",
    between: "space-between",
    around: "space-around",
    evenly: "space-evenly",
};

export class YumeGrid extends HTMLElement {
    static get observedAttributes() {
        return [
            "columns",
            "rows",
            "auto-flow",
            "auto-rows",
            "auto-columns",
            "gap",
            "row-gap",
            "column-gap",
            "align",
            "justify",
            "align-content",
            "justify-content",
            "min-item-width",
            "responsive",
            "dense",
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

    /**
     * Column count or template. Integer → `repeat(N, 1fr)`; `"auto"` →
     * `repeat(auto-fit, minmax(min-item-width, 1fr))`; any other string is
     * passed through as a raw `grid-template-columns` value.
     */
    get columns() {
        return this.getAttribute("columns") || "3";
    }
    set columns(val) {
        this.setAttribute("columns", String(val));
    }

    /** Row count or raw `grid-template-rows` value. */
    get rows() {
        return this.getAttribute("rows") || "";
    }
    set rows(val) {
        this.setAttribute("rows", String(val));
    }

    /** Maps to `grid-auto-flow`. */
    get autoFlow() {
        return this.getAttribute("auto-flow") || "row";
    }
    set autoFlow(val) {
        this.setAttribute("auto-flow", val);
    }

    /** Maps to `grid-auto-rows`. */
    get autoRows() {
        return this.getAttribute("auto-rows") || "";
    }
    set autoRows(val) {
        this.setAttribute("auto-rows", val);
    }

    /** Maps to `grid-auto-columns`. */
    get autoColumns() {
        return this.getAttribute("auto-columns") || "";
    }
    set autoColumns(val) {
        this.setAttribute("auto-columns", val);
    }

    /** Gap between items, maps to --spacing-* tokens. */
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

    /** Maps to `align-items`. */
    get align() {
        return this.getAttribute("align") || "stretch";
    }
    set align(val) {
        this.setAttribute("align", val);
    }

    /** Maps to `justify-items`. */
    get justify() {
        return this.getAttribute("justify") || "stretch";
    }
    set justify(val) {
        this.setAttribute("justify", val);
    }

    /** Maps to `align-content`. */
    get alignContent() {
        return this.getAttribute("align-content") || "stretch";
    }
    set alignContent(val) {
        this.setAttribute("align-content", val);
    }

    /** Maps to `justify-content`. */
    get justifyContent() {
        return this.getAttribute("justify-content") || "start";
    }
    set justifyContent(val) {
        this.setAttribute("justify-content", val);
    }

    /** Minimum item width for `columns="auto"` and responsive collapse. */
    get minItemWidth() {
        return this.getAttribute("min-item-width") || "240px";
    }
    set minItemWidth(val) {
        this.setAttribute("min-item-width", val);
    }

    /**
     * Auto-reduce columns at narrow container widths via `auto-fit` /
     * `minmax`. Defaults to `true`; set `responsive="false"` to disable.
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

    /** Shortcut for `auto-flow="row dense"`. */
    get dense() {
        return this.hasAttribute("dense");
    }
    set dense(val) {
        if (val) this.setAttribute("dense", "");
        else this.removeAttribute("dense");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this.shadowRoot.innerHTML = `<div class="container" part="container"><slot></slot></div>`;
        this._container = this.shadowRoot.querySelector(".container");
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyStyles() {
        if (!this._container) return;
        const sheet = this._buildStyleSheet();
        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    _buildAutoFlow() {
        if (this.dense && !this.hasAttribute("auto-flow")) return "row dense";
        return this.autoFlow;
    }

    _buildColumnsTemplate() {
        const raw = this.columns;
        const minWidth = `var(--component-grid-min-item-width, ${this.minItemWidth})`;
        const intCols = parseInt(raw, 10);
        const isInteger = String(intCols) === String(raw).trim();

        if (raw === "auto") {
            return `repeat(auto-fit, minmax(${minWidth}, 1fr))`;
        }
        if (isInteger && intCols > 0) {
            if (this.responsive) {
                return this._buildResponsiveColumnsTemplate(intCols, minWidth);
            }
            return `repeat(${intCols}, 1fr)`;
        }
        return raw;
    }

    _buildResponsiveColumnsTemplate(cols, minWidth) {
        // Match the gap actually applied along the inline axis so the
        // container width at which auto-fit drops a column stays accurate
        // when column-gap diverges from the unified gap.
        const columnGap = resolveGapToken(this, "column-gap");
        const evenShare = `calc((100% - ${cols - 1} * ${columnGap}) / ${cols})`;
        const itemMin = `min(100%, max(${minWidth}, ${evenShare}))`;
        return `repeat(auto-fit, minmax(${itemMin}, 1fr))`;
    }

    _buildRowsTemplate() {
        const raw = this.rows;
        if (!raw) return "";
        const intRows = parseInt(raw, 10);
        const isInteger = String(intRows) === String(raw).trim();
        if (isInteger && intRows > 0) return `repeat(${intRows}, auto)`;
        return raw;
    }

    _buildStyleSheet() {
        const gapValue = `var(--component-grid-gap, ${resolveGapToken(this, "gap")})`;
        const rowGapValue = `var(--component-grid-row-gap, ${resolveGapToken(this, "row-gap")})`;
        const columnGapValue = `var(--component-grid-column-gap, ${resolveGapToken(this, "column-gap")})`;

        const columnsTemplate = `var(--component-grid-columns, ${this._buildColumnsTemplate()})`;
        const rowsTemplateRaw = this._buildRowsTemplate();
        const rowsTemplate = rowsTemplateRaw
            ? `var(--component-grid-rows, ${rowsTemplateRaw})`
            : `var(--component-grid-rows, auto)`;
        const autoRowsRaw = this.autoRows;
        const autoColumnsRaw = this.autoColumns;
        const autoRows = autoRowsRaw
            ? `grid-auto-rows: var(--component-grid-auto-rows, ${autoRowsRaw});`
            : "";
        const autoColumns = autoColumnsRaw
            ? `grid-auto-columns: var(--component-grid-auto-columns, ${autoColumnsRaw});`
            : "";

        const alignItems = ALIGN_MAP[this.align] || "stretch";
        const justifyItems = JUSTIFY_ITEMS_MAP[this.justify] || "stretch";
        const alignContent = CONTENT_MAP[this.alignContent] || "stretch";
        const justifyContent = CONTENT_MAP[this.justifyContent] || "start";
        const autoFlow = this._buildAutoFlow();

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
            }
            .container {
                display: grid;
                grid-template-columns: ${columnsTemplate};
                grid-template-rows: ${rowsTemplate};
                grid-auto-flow: ${autoFlow};
                ${autoRows}
                ${autoColumns}
                gap: ${gapValue};
                row-gap: ${rowGapValue};
                column-gap: ${columnGapValue};
                align-items: ${alignItems};
                justify-items: ${justifyItems};
                align-content: ${alignContent};
                justify-content: ${justifyContent};
            }
        `);
        return sheet;
    }
}

if (!customElements.get("y-grid")) {
    customElements.define("y-grid", YumeGrid);
}
