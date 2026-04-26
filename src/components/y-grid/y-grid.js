import { createElement as _el } from "../../modules/helpers.js";

const GAP_TOKEN_MAP = {
    none: "var(--spacing-none, 0px)",
    "x-small": "var(--spacing-x-small, 4px)",
    small: "var(--spacing-small, 6px)",
    medium: "var(--spacing-medium, 8px)",
    large: "var(--spacing-large, 12px)",
    "x-large": "var(--spacing-x-large, 16px)",
    "2x-large": "var(--spacing-2x-large, 24px)",
    "4x-large": "var(--spacing-4x-large, 32px)",
};

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
            "mode",
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
        this._resizeObserver = null;
        this._masonryRAF = null;
        this._observedItems = null;
        this.render();
    }

    connectedCallback() {
        this._applyLayout();
        if (this.mode === "masonry") this._initMasonry();
    }

    disconnectedCallback() {
        this._teardownMasonry();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        const wasMasonry = name === "mode" && oldValue === "masonry";
        const isMasonry = this.mode === "masonry";

        if (wasMasonry) this._teardownMasonry();

        this._applyLayout();

        if (isMasonry && this.isConnected && !this._resizeObserver) {
            this._initMasonry();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Layout algorithm: "grid" (default) | "masonry". */
    get mode() {
        return this.getAttribute("mode") || "grid";
    }
    set mode(val) {
        this.setAttribute("mode", val);
    }

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

    /** Maps to `grid-auto-flow`. Ignored in masonry mode. */
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
     * Auto-reduce columns at narrow container widths. Defaults to `true`;
     * set `responsive="false"` to disable.
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
        this._slot = this.shadowRoot.querySelector("slot");
        this._slot.addEventListener("slotchange", () => {
            if (this.mode === "masonry") this._syncMasonryObserver();
        });
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyLayout() {
        if (!this._container) return;
        const sheet = this._buildStyleSheet();
        this.shadowRoot.adoptedStyleSheets = [sheet];

        if (this.mode === "masonry") {
            this._layoutMasonry();
        } else {
            this._clearMasonryPositions();
        }
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

    _buildMasonryStyleSheet(gapValue, rowGapValue, columnGapValue) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
            }
            .container {
                position: relative;
                gap: ${gapValue};
                row-gap: ${rowGapValue};
                column-gap: ${columnGapValue};
            }
        `);
        return sheet;
    }

    _buildResponsiveColumnsTemplate(cols, minWidth) {
        const gapValue = this._resolveGap();
        const evenShare = `calc((100% - ${cols - 1} * ${gapValue}) / ${cols})`;
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
        const gapValue = `var(--component-grid-gap, ${this._resolveGap()})`;
        const rowGapValue = `var(--component-grid-row-gap, ${this._resolveSideGap("row-gap")})`;
        const columnGapValue = `var(--component-grid-column-gap, ${this._resolveSideGap("column-gap")})`;

        if (this.mode === "masonry") {
            return this._buildMasonryStyleSheet(gapValue, rowGapValue, columnGapValue);
        }

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

    _clearMasonryPositions() {
        const items = this._getSlottedElements();
        items.forEach((item) => {
            item.style.position = "";
            item.style.top = "";
            item.style.left = "";
            item.style.width = "";
        });
        if (this._container) this._container.style.height = "";
    }

    _emitLayoutEvent(containerWidth, columnCount) {
        this.dispatchEvent(
            new CustomEvent("y-grid-layout", {
                bubbles: true,
                composed: true,
                detail: {
                    mode: this.mode,
                    columns: columnCount,
                    containerWidth,
                },
            }),
        );
    }

    _getBreakpointValue(prop, fallback) {
        const val = getComputedStyle(this).getPropertyValue(prop).trim();
        return val ? parseInt(val, 10) : fallback;
    }

    _getMasonryColumnCount() {
        const raw = this.columns;
        const intCols = parseInt(raw, 10);
        const isInteger = String(intCols) === String(raw).trim();
        const baseCols = isInteger && intCols > 0 ? intCols : 3;

        if (!this.responsive) return baseCols;

        const mobileBreakpoint = this._getBreakpointValue(
            "--component-grid-mobile-breakpoint",
            576,
        );
        const tabletBreakpoint = this._getBreakpointValue(
            "--component-grid-tablet-breakpoint",
            768,
        );
        const width = this._container
            ? this._container.offsetWidth
            : window.innerWidth;

        if (width <= mobileBreakpoint) return 1;
        if (width <= tabletBreakpoint) return Math.min(2, baseCols);
        return baseCols;
    }

    _getSlottedElements() {
        if (!this._slot) return [];
        return this._slot.assignedElements({ flatten: true });
    }

    _initMasonry() {
        this._teardownMasonry();
        this._observedItems = new Set();
        this._resizeObserver = new ResizeObserver(() => {
            if (this._masonryRAF) cancelAnimationFrame(this._masonryRAF);
            this._masonryRAF = requestAnimationFrame(() =>
                this._layoutMasonry(),
            );
        });
        this._resizeObserver.observe(this._container);
        this._syncMasonryObserver();
    }

    _layoutMasonry() {
        const items = this._getSlottedElements();
        if (!this._container) return;

        const containerWidth = this._container.offsetWidth;
        const cols = this._getMasonryColumnCount();

        if (!items.length) {
            this._container.style.height = "";
            this._emitLayoutEvent(containerWidth, cols);
            return;
        }

        const gapPx = this._resolveGapPx();
        const colWidth = (containerWidth - gapPx * (cols - 1)) / cols;
        const colHeights = new Array(cols).fill(0);

        items.forEach((item) => {
            const shortest = colHeights.indexOf(Math.min(...colHeights));
            const x = shortest * (colWidth + gapPx);
            const y = colHeights[shortest];

            item.style.position = "absolute";
            item.style.top = `${y}px`;
            item.style.left = `${x}px`;
            item.style.width = `${colWidth}px`;

            colHeights[shortest] += item.offsetHeight + gapPx;
        });

        this._container.style.height = `${Math.max(...colHeights) - gapPx}px`;
        this._emitLayoutEvent(containerWidth, cols);
    }

    _resolveGap() {
        return GAP_TOKEN_MAP[this.gap] || GAP_TOKEN_MAP.medium;
    }

    _resolveGapPx() {
        const temp = _el("div", {
            style: `position:absolute;visibility:hidden;width:${this._resolveGap()}`,
        });
        this._container.appendChild(temp);
        const px = temp.offsetWidth;
        temp.remove();
        return px;
    }

    _resolveSideGap(attrName) {
        const raw = this.getAttribute(attrName);
        const key = raw && GAP_TOKEN_MAP[raw] ? raw : this.gap;
        return GAP_TOKEN_MAP[key] || GAP_TOKEN_MAP.medium;
    }

    _syncMasonryObserver() {
        if (!this._resizeObserver) {
            this._initMasonry();
            return;
        }

        const current = new Set(this._getSlottedElements());

        for (const item of this._observedItems) {
            if (!current.has(item)) {
                this._resizeObserver.unobserve(item);
                this._observedItems.delete(item);
            }
        }

        for (const item of current) {
            if (!this._observedItems.has(item)) {
                this._resizeObserver.observe(item);
                this._observedItems.add(item);
            }
        }

        this._layoutMasonry();
    }

    _teardownMasonry() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
            this._observedItems = null;
        }
        if (this._masonryRAF) {
            cancelAnimationFrame(this._masonryRAF);
            this._masonryRAF = null;
        }
    }
}

if (!customElements.get("y-grid")) {
    customElements.define("y-grid", YumeGrid);
}
