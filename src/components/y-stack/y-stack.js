export class YumeStack extends HTMLElement {
    static get observedAttributes() {
        return [
            "direction",
            "mode",
            "columns",
            "gap",
            "wrap",
            "align",
            "justify",
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
        this._masonryRAF = null;
        this.render();
    }

    connectedCallback() {
        this._applyLayout();
        if (this.mode === "masonry") this._initMasonry();
        if (this.responsive) this._initResponsive();
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

        if (isMasonry && this.isConnected) this._initMasonry();
        if (name === "responsive" && this.responsive && this.isConnected)
            this._initResponsive();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Main axis direction (flex mode only). */
    get direction() {
        return this.getAttribute("direction") || "row";
    }
    set direction(val) {
        this.setAttribute("direction", val);
    }

    /** Layout algorithm: "flex" | "grid" | "masonry". */
    get mode() {
        return this.getAttribute("mode") || "flex";
    }
    set mode(val) {
        this.setAttribute("mode", val);
    }

    /** Number of columns (grid/masonry modes). */
    get columns() {
        return parseInt(this.getAttribute("columns"), 10) || 3;
    }
    set columns(val) {
        this.setAttribute("columns", String(val));
    }

    /** Gap between items, maps to --spacing-* tokens. */
    get gap() {
        return this.getAttribute("gap") || "medium";
    }
    set gap(val) {
        this.setAttribute("gap", val);
    }

    /** Allow items to wrap (flex mode only). */
    get wrap() {
        return this.hasAttribute("wrap");
    }
    set wrap(val) {
        if (val) this.setAttribute("wrap", "");
        else this.removeAttribute("wrap");
    }

    /** Cross-axis alignment. */
    get align() {
        return this.getAttribute("align") || "stretch";
    }
    set align(val) {
        this.setAttribute("align", val);
    }

    /** Main-axis distribution (flex mode only). */
    get justify() {
        return this.getAttribute("justify") || "start";
    }
    set justify(val) {
        this.setAttribute("justify", val);
    }

    /** Auto-reduce columns at narrow viewports. */
    get responsive() {
        return this.hasAttribute("responsive");
    }
    set responsive(val) {
        if (val) this.setAttribute("responsive", "");
        else this.removeAttribute("responsive");
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

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        const gapValue = this._resolveGap();
        const mode = this.mode;
        const cols = this.columns;
        const responsive = this.responsive;

        let containerCSS;
        let responsiveCSS = "";

        if (mode === "grid") {
            containerCSS = `
                .container {
                    display: grid;
                    grid-template-columns: repeat(var(--component-stack-columns, ${cols}), 1fr);
                    gap: ${gapValue};
                }
            `;
            if (responsive) {
                responsiveCSS = this._buildResponsiveGridCSS(cols);
            }
        } else if (mode === "masonry") {
            containerCSS = `
                .container {
                    position: relative;
                }
            `;
        } else {
            const dir = this.direction;
            const alignMap = {
                start: "flex-start",
                end: "flex-end",
                center: "center",
                stretch: "stretch",
                baseline: "baseline",
            };
            const justifyMap = {
                start: "flex-start",
                end: "flex-end",
                center: "center",
                between: "space-between",
                around: "space-around",
                evenly: "space-evenly",
            };

            containerCSS = `
                .container {
                    display: flex;
                    flex-direction: ${dir};
                    flex-wrap: ${this.wrap ? "wrap" : "nowrap"};
                    align-items: ${alignMap[this.align] || "stretch"};
                    justify-content: ${justifyMap[this.justify] || "flex-start"};
                    gap: ${gapValue};
                }
            `;
            if (responsive && dir === "row") {
                responsiveCSS = this._buildResponsiveFlexCSS();
            }
        }

        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
            }
            ${containerCSS}
            ${responsiveCSS}
        `);
        return sheet;
    }

    _buildResponsiveFlexCSS() {
        return `
            @media (max-width: var(--component-stack-mobile-breakpoint, 576px)) {
                .container {
                    flex-direction: column;
                }
            }
        `;
    }

    _buildResponsiveGridCSS(cols) {
        const tabletCols = Math.min(2, cols);
        return `
            @media (max-width: var(--component-stack-tablet-breakpoint, 768px)) {
                .container {
                    grid-template-columns: repeat(${tabletCols}, 1fr);
                }
            }
            @media (max-width: var(--component-stack-mobile-breakpoint, 576px)) {
                .container {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    _clearMasonryPositions() {
        const items = this._getSlottedElements();
        items.forEach((item) => {
            item.style.position = "";
            item.style.top = "";
            item.style.left = "";
            item.style.width = "";
        });
        if (this._container) {
            this._container.style.height = "";
        }
    }

    _getBreakpointValue(prop, fallback) {
        const val = getComputedStyle(this).getPropertyValue(prop).trim();
        return val ? parseInt(val, 10) : fallback;
    }

    _getResponsiveColumns() {
        const cols = this.columns;
        const mobileBreakpoint = this._getBreakpointValue(
            "--component-stack-mobile-breakpoint",
            576,
        );
        const tabletBreakpoint = this._getBreakpointValue(
            "--component-stack-tablet-breakpoint",
            768,
        );
        const width = this._container
            ? this._container.offsetWidth
            : window.innerWidth;

        if (width <= mobileBreakpoint) return 1;
        if (width <= tabletBreakpoint) return Math.min(2, cols);
        return cols;
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

    _initResponsive() {
        if (this.mode !== "masonry") return;
        if (!this._resizeObserver) this._initMasonry();
    }

    _layoutMasonry() {
        const items = this._getSlottedElements();
        if (!items.length || !this._container) return;

        const cols = this.responsive
            ? this._getResponsiveColumns()
            : this.columns;
        const gapPx = this._resolveGapPx();
        const containerWidth = this._container.offsetWidth;
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
    }

    _resolveGap() {
        const gapMap = {
            none: "var(--spacing-none)",
            "x-small": "var(--spacing-x-small)",
            small: "var(--spacing-small)",
            medium: "var(--spacing-medium)",
            large: "var(--spacing-large)",
            "x-large": "var(--spacing-x-large)",
            "2x-large": "var(--spacing-2x-large)",
            "4x-large": "var(--spacing-4x-large)",
        };
        return `var(--component-stack-gap, ${gapMap[this.gap] || gapMap.medium})`;
    }

    _resolveGapPx() {
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.width = this._resolveGap();
        this._container.appendChild(temp);
        const px = temp.offsetWidth;
        temp.remove();
        return px;
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

if (!customElements.get("y-stack")) {
    customElements.define("y-stack", YumeStack);
}
