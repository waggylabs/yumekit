import {
    measureCSSLength,
    resolveGapToken,
} from "../../modules/helpers.js";

export class YumeMasonry extends HTMLElement {
    static get observedAttributes() {
        return [
            "columns",
            "gap",
            "row-gap",
            "column-gap",
            "min-item-width",
            "responsive",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._resizeObserver = null;
        this._layoutRAF = null;
        this._observedItems = null;
        this._lastLayoutSignature = null;
        this.render();
    }

    connectedCallback() {
        this._applyStyles();
        this._initObserver();
    }

    disconnectedCallback() {
        this._teardownObserver();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this._applyStyles();
        if (this.isConnected) this._scheduleLayout();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Column count (default `3`). */
    get columns() {
        return parseInt(this.getAttribute("columns"), 10) || 3;
    }
    set columns(val) {
        this.setAttribute("columns", String(val));
    }

    /** Unified gap; maps to a `--spacing-*` token. */
    get gap() {
        return this.getAttribute("gap") || "medium";
    }
    set gap(val) {
        this.setAttribute("gap", val);
    }

    /** Row-gap override; falls back to `gap` when unset. */
    get rowGap() {
        return this.getAttribute("row-gap") || "";
    }
    set rowGap(val) {
        this.setAttribute("row-gap", val);
    }

    /** Column-gap override; falls back to `gap` when unset. */
    get columnGap() {
        return this.getAttribute("column-gap") || "";
    }
    set columnGap(val) {
        this.setAttribute("column-gap", val);
    }

    /** Minimum item width for responsive collapse. */
    get minItemWidth() {
        return this.getAttribute("min-item-width") || "240px";
    }
    set minItemWidth(val) {
        this.setAttribute("min-item-width", val);
    }

    /**
     * Auto-reduce columns at narrow container widths via mobile/tablet
     * breakpoint tokens. Defaults to `true`; set `responsive="false"` to
     * disable.
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

    /**
     * Force an immediate relayout. Useful when item content changes height in
     * a way `ResizeObserver` won't catch synchronously (e.g. after an image
     * loads and updates its intrinsic size).
     */
    relayout() {
        this._scheduleLayout();
    }

    render() {
        this.shadowRoot.innerHTML = `<div class="container" part="container"><slot></slot></div>`;
        this._container = this.shadowRoot.querySelector(".container");
        this._slot = this.shadowRoot.querySelector("slot");
        this._slot.addEventListener("slotchange", () =>
            this._syncObserver(),
        );
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyStyles() {
        if (!this._container) return;
        const gapValue = `var(--component-masonry-gap, ${resolveGapToken(this, "gap")})`;
        const rowGapValue = `var(--component-masonry-row-gap, ${resolveGapToken(this, "row-gap")})`;
        const columnGapValue = `var(--component-masonry-column-gap, ${resolveGapToken(this, "column-gap")})`;

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
        this.shadowRoot.adoptedStyleSheets = [sheet];
    }

    _emitLayoutEvent(containerWidth, columnCount) {
        const height = this._container ? this._container.style.height : "";
        const signature = `${columnCount}|${containerWidth}|${height}`;
        if (signature === this._lastLayoutSignature) return;
        this._lastLayoutSignature = signature;

        this.dispatchEvent(
            new CustomEvent("y-masonry-layout", {
                bubbles: true,
                composed: true,
                detail: { columns: columnCount, containerWidth },
            }),
        );
    }

    _getBreakpointValue(prop, fallback) {
        const val = getComputedStyle(this).getPropertyValue(prop).trim();
        return val ? parseInt(val, 10) : fallback;
    }

    _getColumnCount() {
        const baseCols = this.columns;
        if (!this.responsive) return baseCols;

        const mobileBreakpoint = this._getBreakpointValue(
            "--component-masonry-mobile-breakpoint",
            576,
        );
        const tabletBreakpoint = this._getBreakpointValue(
            "--component-masonry-tablet-breakpoint",
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

    _initObserver() {
        this._teardownObserver();
        this._observedItems = new Set();
        this._resizeObserver = new ResizeObserver(() => this._scheduleLayout());
        this._resizeObserver.observe(this._container);
        this._syncObserver();
    }

    _layout() {
        const items = this._getSlottedElements();
        if (!this._container) return;

        const containerWidth = this._container.offsetWidth;
        const cols = this._getColumnCount();

        if (!items.length) {
            this._container.style.height = "";
            this._emitLayoutEvent(containerWidth, cols);
            return;
        }

        const colGapPx = measureCSSLength(
            this._container,
            resolveGapToken(this, "column-gap"),
        );
        const rowGapPx = measureCSSLength(
            this._container,
            resolveGapToken(this, "row-gap"),
        );
        const colWidth = (containerWidth - colGapPx * (cols - 1)) / cols;
        const colHeights = new Array(cols).fill(0);

        items.forEach((item) => {
            const shortest = colHeights.indexOf(Math.min(...colHeights));
            const x = shortest * (colWidth + colGapPx);
            const y = colHeights[shortest];

            item.style.position = "absolute";
            item.style.top = `${y}px`;
            item.style.left = `${x}px`;
            item.style.width = `${colWidth}px`;

            colHeights[shortest] += item.offsetHeight + rowGapPx;
        });

        this._container.style.height = `${Math.max(...colHeights) - rowGapPx}px`;
        this._emitLayoutEvent(containerWidth, cols);
    }

    _scheduleLayout() {
        if (this._layoutRAF) cancelAnimationFrame(this._layoutRAF);
        this._layoutRAF = requestAnimationFrame(() => {
            this._layoutRAF = null;
            this._layout();
        });
    }

    _syncObserver() {
        if (!this._resizeObserver) {
            this._initObserver();
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

        this._scheduleLayout();
    }

    _teardownObserver() {
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
            this._observedItems = null;
        }
        if (this._layoutRAF) {
            cancelAnimationFrame(this._layoutRAF);
            this._layoutRAF = null;
        }
        this._lastLayoutSignature = null;
    }
}

if (!customElements.get("y-masonry")) {
    customElements.define("y-masonry", YumeMasonry);
}
