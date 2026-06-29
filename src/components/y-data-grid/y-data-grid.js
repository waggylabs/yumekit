import "../y-icon/y-icon.js";
import "../y-input/y-input.js";
import "../y-checkbox/y-checkbox.js";
import "../y-select/y-select.js";
import "../y-date/y-date.js";
import "../y-paginator/y-paginator.js";
import "../y-popover/y-popover.js";
import "../y-button/y-button.js";
import "../y-progress/y-progress.js";
import { createElement as _el } from "../../modules/helpers.js";

const SORT_CYCLE = { none: "asc", asc: "desc", desc: "none" };
const EDIT_STATUS_RESET_MS = 1200;
// Smallest width (px) a column can be dragged to, unless the column overrides
// it with `minWidth`.
const MIN_COLUMN_WIDTH = 48;
// Pointer travel (px) before a header press is treated as a reorder drag rather
// than a sort click.
const COLUMN_DRAG_THRESHOLD = 4;

// The header-menu popovers are rendered with `portal`, which relocates their
// content into a `.y-popover-portal` element under `document.body`. Styles
// written inside the data-grid's own shadow root can't reach that, so the menu
// CSS is injected once into the global document and scoped to `.header-menu`.
const HEADER_MENU_STYLE_ID = "y-data-grid-header-menu-styles";
const HEADER_MENU_CSS = `
    .header-menu {
        display: flex;
        flex-direction: column;
        min-width: 240px;
        padding: 4px 0;
        font-family: var(--font-family-body, sans-serif);
        font-size: var(--font-size-paragraph, 1em);
        font-weight: var(--font-weight-body, 400);
        color: var(--base-content, inherit);
    }
    .header-menu .menu-section { display: flex; flex-direction: column; }
    .header-menu .menu-section + .menu-section {
        border-top: 1px solid var(--base-border, #37383a);
        margin-top: 4px;
        padding-top: 4px;
    }
    .header-menu .menu-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: transparent;
        color: inherit;
        border: none;
        text-align: left;
        cursor: pointer;
        font: inherit;
    }
    .header-menu .menu-item:hover:not([disabled]),
    .header-menu .menu-item:focus-visible {
        background: var(--base-background-hover, #292a2b);
        outline: none;
    }
    .header-menu .menu-item[disabled] { opacity: 0.5; cursor: not-allowed; }
    .header-menu .menu-item .menu-item-label { flex: 1 1 auto; }
    .header-menu .menu-item .submenu-chevron { margin-left: auto; opacity: 0.7; }
    .header-menu .filter-row-inputs {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 6px 12px;
    }
    .header-menu .filter-row-inputs y-select,
    .header-menu .filter-row-inputs y-input { display: block; width: 100%; }
    .header-menu .column-list {
        display: flex;
        flex-direction: column;
        max-height: 240px;
        overflow-y: auto;
    }
    .header-menu .column-item {
        width: 100%;
    }
    .header-menu .column-item .column-item-checkbox {
        pointer-events: none;
        flex-shrink: 0;
    }
    .header-menu .submenu-header {
        padding: 6px 12px;
        font-size: var(--font-size-small, 0.8em);
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }
    .header-menu.filter-popover {
        min-width: 260px;
    }
    .header-menu.filter-popover .filter-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 8px 12px 10px;
        border-top: 1px solid var(--base-border, #37383a);
        margin-top: 4px;
    }
`;

function ensureHeaderMenuStyles() {
    if (typeof document === "undefined") return;
    if (document.getElementById(HEADER_MENU_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = HEADER_MENU_STYLE_ID;
    style.textContent = HEADER_MENU_CSS;
    document.head.appendChild(style);
}

export class YumeDataGrid extends HTMLElement {
    static get observedAttributes() {
        return [
            "columns",
            "data",
            "mode",
            "page-size",
            "current-page",
            "total-rows",
            "loading",
            "striped",
            "hover",
            "fixed-header",
            "filtering",
            "show-item-count",
            "enable-sorting",
            "enable-pagination",
            "enable-selection",
            "enable-editing",
            "selection-mode",
            "edit-on",
            "row-key",
            "selected",
            "empty-message",
            "row-height",
            "global-search",
            "group-by",
            "aggregates",
            "virtual",
            "viewport-height",
            "buffer-size",
            "enable-header-menu",
            "enable-column-resize",
            "enable-column-reorder",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._parsedColumns = [];
        this._parsedColumnTree = [];
        this._workingTree = [];
        this._columnFilterOps = {};
        this._parsedData = [];
        this._sorts = [];
        this._columnFilters = {};
        this._globalQuery = "";
        this._pageSize = 20;
        this._currentPage = 1;
        this._selectedKeys = new Set();
        this._editing = null;
        this._editStatuses = new Map();
        this._collapsedGroups = new Set();
        this._pendingColumnHidden = new Map();
        this._scrollTop = 0;
        this._viewportHeight = 0;
        this._resizeObserver = null;
        this._resizeState = null;
        this._reorderState = null;
        this._suppressHeaderClick = false;
        this._onPaginatorChange = this._onPaginatorChange.bind(this);
        this._onPaginatorPageSize = this._onPaginatorPageSize.bind(this);
        this._onScroll = this._onScroll.bind(this);
        this._onColumnResizeMove = this._onColumnResizeMove.bind(this);
        this._onColumnResizeEnd = this._onColumnResizeEnd.bind(this);
        this._onColumnReorderMove = this._onColumnReorderMove.bind(this);
        this._onColumnReorderEnd = this._onColumnReorderEnd.bind(this);
    }

    connectedCallback() {
        this._parseAttributes();
        this._render();
    }

    disconnectedCallback() {
        this._teardownVirtualScroll();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;

        if (name === "current-page") {
            const next = Number(newVal);
            if (Number.isFinite(next) && next >= 1) this._currentPage = next;
        }
        if (name === "page-size") {
            const next = Number(newVal);
            if (Number.isFinite(next) && next >= 1) this._pageSize = next;
        }
        if (name === "global-search" && typeof newVal === "string") {
            this._globalQuery = newVal;
        }
        if (name === "selected") {
            try {
                const parsed = JSON.parse(newVal || "[]");
                if (Array.isArray(parsed)) {
                    this._selectedKeys = new Set(parsed.map(String));
                }
            } catch {
                this._selectedKeys = new Set();
            }
        }

        this._parseAttributes();
        if (this.isConnected) this._render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Per-column aggregate config — `{ columnKey: "sum" | "avg" | "min" | "max" | "count" }`. */
    get aggregates() {
        try {
            const parsed = JSON.parse(this.getAttribute("aggregates") || "{}");
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch {
            return {};
        }
    }
    set aggregates(obj) {
        this.setAttribute("aggregates", JSON.stringify(obj || {}));
    }

    /** Extra rows rendered above and below the viewport when virtualizing. */
    get bufferSize() {
        const v = Number(this.getAttribute("buffer-size"));
        return Number.isFinite(v) && v >= 0 ? v : 10;
    }
    set bufferSize(val) {
        this.setAttribute("buffer-size", String(val));
    }

    /** Column schema as JSON string or array of column definition objects. */
    get columns() {
        return this.getAttribute("columns");
    }
    set columns(val) {
        this.setAttribute(
            "columns",
            typeof val === "string" ? val : JSON.stringify(val),
        );
    }

    /** Current 1-based page index. */
    get currentPage() {
        return this._currentPage;
    }
    set currentPage(val) {
        this.setAttribute("current-page", String(val));
    }

    /** Row data as JSON string or array of objects keyed by column key. */
    get data() {
        return this.getAttribute("data");
    }
    set data(val) {
        this.setAttribute(
            "data",
            typeof val === "string" ? val : JSON.stringify(val),
        );
    }

    /** Edit trigger: "click" (single click on cell) or "focus" (default "click"). */
    get editOn() {
        return this.getAttribute("edit-on") || "click";
    }
    set editOn(val) {
        this.setAttribute("edit-on", val);
    }

    /** Empty-state message text. */
    get emptyMessage() {
        return this.getAttribute("empty-message") || "No data available";
    }
    set emptyMessage(val) {
        this.setAttribute("empty-message", val);
    }

    /** When set, leaf headers can be dragged to a new position to reorder columns. Opt out per column with `reorderable: false`. */
    get enableColumnReorder() {
        return this.hasAttribute("enable-column-reorder");
    }
    set enableColumnReorder(val) {
        if (val) this.setAttribute("enable-column-reorder", "");
        else this.removeAttribute("enable-column-reorder");
    }

    /** When set, leaf headers expose a drag handle on their inline (right) edge for resizing. Opt out per column with `resizable: false`. */
    get enableColumnResize() {
        return this.hasAttribute("enable-column-resize");
    }
    set enableColumnResize(val) {
        if (val) this.setAttribute("enable-column-resize", "");
        else this.removeAttribute("enable-column-resize");
    }

    /** Enables inline cell editing. */
    get enableEditing() {
        return this.hasAttribute("enable-editing");
    }
    set enableEditing(val) {
        if (val) this.setAttribute("enable-editing", "");
        else this.removeAttribute("enable-editing");
    }

    /** When set, leaf headers expose a kebab menu for filter / sort / column visibility / move actions. */
    get enableHeaderMenu() {
        return this.hasAttribute("enable-header-menu");
    }
    set enableHeaderMenu(val) {
        if (val) this.setAttribute("enable-header-menu", "");
        else this.removeAttribute("enable-header-menu");
    }

    /** Pagination controls. Defaults to true unless attribute set to "false". */
    get enablePagination() {
        return this.getAttribute("enable-pagination") !== "false";
    }
    set enablePagination(val) {
        this.setAttribute("enable-pagination", String(Boolean(val)));
    }

    /** Renders a checkbox column and enables row-selection interactions. */
    get enableSelection() {
        return this.hasAttribute("enable-selection");
    }
    set enableSelection(val) {
        if (val) this.setAttribute("enable-selection", "");
        else this.removeAttribute("enable-selection");
    }

    /** Sorting via header click. Defaults to true unless attribute set to "false". */
    get enableSorting() {
        return this.getAttribute("enable-sorting") !== "false";
    }
    set enableSorting(val) {
        this.setAttribute("enable-sorting", String(Boolean(val)));
    }

    /**
     * Filtering UI mode: `"inline"` renders the per-column filter row beneath
     * the header, `"advanced"` adds a funnel trigger to each leaf header that
     * opens a popover with operator + value + Clear/Apply. Defaults to no
     * filtering UI; column filters can still be set programmatically.
     */
    get filtering() {
        const v = this.getAttribute("filtering");
        if (v === "inline" || v === "advanced") return v;
        return null;
    }
    set filtering(val) {
        if (val === "inline" || val === "advanced")
            this.setAttribute("filtering", val);
        else this.removeAttribute("filtering");
    }

    /** Current column filters as a `{ [key]: value }` object. */
    get filters() {
        return { ...this._columnFilters };
    }
    set filters(obj) {
        this._columnFilters = obj && typeof obj === "object" ? { ...obj } : {};
        if (this.isConnected) this._render();
    }

    /** Sticky header during vertical scroll. Defaults to true unless attribute set to "false". */
    get fixedHeader() {
        return this.getAttribute("fixed-header") !== "false";
    }
    set fixedHeader(val) {
        this.setAttribute("fixed-header", String(Boolean(val)));
    }

    /** Current global search string. */
    get globalSearch() {
        return this._globalQuery;
    }
    set globalSearch(val) {
        this.setAttribute("global-search", String(val ?? ""));
    }

    /** Column keys to group rows by (nested when more than one). */
    get groupBy() {
        const raw = this.getAttribute("group-by");
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
            /* fall through */
        }
        return raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }
    set groupBy(val) {
        const next = Array.isArray(val)
            ? JSON.stringify(val)
            : String(val ?? "");
        this.setAttribute("group-by", next);
    }

    /** Row hover highlight. Defaults to true unless attribute set to "false". */
    get hover() {
        return this.getAttribute("hover") !== "false";
    }
    set hover(val) {
        this.setAttribute("hover", String(Boolean(val)));
    }

    /** When true, a loading overlay is shown. */
    get loading() {
        return this.hasAttribute("loading");
    }
    set loading(val) {
        if (val) this.setAttribute("loading", "");
        else this.removeAttribute("loading");
    }

    /** Operating mode: "client" performs sort/filter/page locally, "server" emits events. */
    get mode() {
        return this.getAttribute("mode") || "client";
    }
    set mode(val) {
        this.setAttribute("mode", val);
    }

    /** Rows per page. */
    get pageSize() {
        return this._pageSize;
    }
    set pageSize(val) {
        this.setAttribute("page-size", String(val));
    }

    /** Row height in pixels (used by virtual scrolling in a later phase). */
    get rowHeight() {
        const v = Number(this.getAttribute("row-height"));
        return Number.isFinite(v) && v > 0 ? v : 40;
    }
    set rowHeight(val) {
        this.setAttribute("row-height", String(val));
    }

    /** Column key used as a stable per-row identifier. Falls back to the row's array index. */
    get rowKey() {
        return this.getAttribute("row-key") || "";
    }
    set rowKey(val) {
        this.setAttribute("row-key", val);
    }

    /** Array of selected row keys. */
    get selectedKeys() {
        return [...this._selectedKeys];
    }
    set selectedKeys(arr) {
        this._selectedKeys = new Set(Array.isArray(arr) ? arr.map(String) : []);
        if (this.isConnected) this._render();
    }

    /** Array of selected row objects (resolved from current `_selectedKeys`). */
    get selectedRows() {
        return this._parsedData.filter((row, idx) =>
            this._selectedKeys.has(this._rowKeyFor(row, idx)),
        );
    }

    /** Selection mode: "single" or "multi" (default "multi"). */
    get selectionMode() {
        return this.getAttribute("selection-mode") || "multi";
    }
    set selectionMode(val) {
        this.setAttribute("selection-mode", val);
    }

    /** Show the item count in the footer's right side. Defaults to false; add the attribute (or `show-item-count="true"`) to enable. */
    get showItemCount() {
        const v = this.getAttribute("show-item-count");
        return v != null && v !== "false";
    }
    set showItemCount(val) {
        if (val) this.setAttribute("show-item-count", "");
        else this.removeAttribute("show-item-count");
    }

    /** Current sort stack as an array of `{ column, direction }`. */
    get sortState() {
        return this._sorts.map((s) => ({ ...s }));
    }
    set sortState(arr) {
        this._sorts = Array.isArray(arr)
            ? arr.filter(
                  (s) =>
                      s &&
                      s.column &&
                      (s.direction === "asc" || s.direction === "desc"),
              )
            : [];
        if (this.isConnected) this._render();
    }

    /** Alternating row backgrounds. Defaults to false; set the attribute (or `striped="true"`) to enable. */
    get striped() {
        const v = this.getAttribute("striped");
        return v != null && v !== "false";
    }
    set striped(val) {
        if (val) this.setAttribute("striped", "");
        else this.removeAttribute("striped");
    }

    /** Total row count, required for server-mode pagination. */
    get totalRows() {
        const v = Number(this.getAttribute("total-rows"));
        return Number.isFinite(v) ? v : 0;
    }
    set totalRows(val) {
        this.setAttribute("total-rows", String(val));
    }

    /** Scrollable viewport height in pixels — required for virtualization. */
    get viewportHeight() {
        const v = Number(this.getAttribute("viewport-height"));
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    set viewportHeight(val) {
        this.setAttribute("viewport-height", String(val));
    }

    /** Enable virtual scrolling (only render visible rows). */
    get virtual() {
        return this.hasAttribute("virtual");
    }
    set virtual(val) {
        if (val) this.setAttribute("virtual", "");
        else this.removeAttribute("virtual");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Cancel the active edit (if any) without committing. */
    cancelEdit() {
        if (this._editing) this._cancelActiveEditor();
    }
    /** Clear all per-column filters and the global search query. */
    clearFilters() {
        this._columnFilters = {};
        this._globalQuery = "";
        this._currentPage = 1;
        this._emitFilterChange();
        this._render();
    }

    /** Clear the current selection. */
    clearSelection() {
        if (this._selectedKeys.size === 0) return;
        this._selectedKeys = new Set();
        this._emitRowSelect(null);
        this._render();
    }

    /** Clear the sort stack. */
    clearSort() {
        this._sorts = [];
        this._emitSortChange(null, "none");
        this._render();
    }

    /** Collapse every group. */
    collapseAllGroups() {
        const entries = this._buildRowEntries({ respectCollapse: false });
        entries.forEach((e) => {
            if (e.kind === "group") {
                this._collapsedGroups.add(this._groupPathKey(e.path));
            }
        });
        this._render();
    }

    /** Collapse a group by its path (array of values). */
    collapseGroup(path) {
        const key = this._groupPathKey(path);
        if (this._collapsedGroups.has(key)) return;
        this._collapsedGroups.add(key);
        this._emitGroupToggle(path, false);
        this._render();
    }

    /** Commit the active edit (if any). */
    commitEdit() {
        if (this._editing) this._commitActiveEditor();
    }

    /** Expand every group. */
    expandAllGroups() {
        if (this._collapsedGroups.size === 0) return;
        this._collapsedGroups.clear();
        this._render();
    }

    /** Expand a group by its path (array of values). */
    expandGroup(path) {
        const key = this._groupPathKey(path);
        if (!this._collapsedGroups.has(key)) return;
        this._collapsedGroups.delete(key);
        this._emitGroupToggle(path, true);
        this._render();
    }

    /** Force a re-render. */
    refresh() {
        if (this.isConnected) this._render();
    }

    /** Replace the current selection. Passing an empty array clears selection. */
    selectRows(rows) {
        const list = Array.isArray(rows) ? rows : [];
        this._selectedKeys = new Set(
            list.map((row) =>
                this._rowKeyFor(row, this._parsedData.indexOf(row)),
            ),
        );
        this._emitRowSelect(null);
        this._render();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _absoluteRowIndex(displayIdx) {
        if (this.mode === "server" || !this.enablePagination) return displayIdx;
        return (this._currentPage - 1) * this._pageSize + displayIdx;
    }
    _applyClientFilters(rows) {
        const cols = this._parsedColumns;
        const query = (this._globalQuery || "").trim().toLowerCase();
        const colFilters = Object.entries(this._columnFilters).filter(
            ([, v]) => v != null && String(v) !== "",
        );

        if (!query && colFilters.length === 0) return rows;

        const colByKey = new Map(cols.map((c) => [c.key, c]));

        return rows.filter((row) => {
            if (query) {
                const haystack = cols
                    .map((c) => String(row[c.key] ?? "").toLowerCase())
                    .join(" ");
                if (!haystack.includes(query)) return false;
            }
            for (const [key, value] of colFilters) {
                const col = colByKey.get(key);
                const op =
                    this._columnFilterOps[key] || this._defaultOperatorFor(col);
                if (!this._matchesFilter(row[key], value, op, col))
                    return false;
            }
            return true;
        });
    }

    _applyClientSort(rows) {
        if (this._sorts.length === 0) return rows;
        const sorts = this._sorts;

        return [...rows].sort((a, b) => {
            for (const { column, direction } of sorts) {
                const dir = direction === "desc" ? -1 : 1;
                const av = a[column];
                const bv = b[column];

                if (av == null && bv == null) continue;
                if (av == null) return 1;
                if (bv == null) return -1;

                let cmp;
                if (typeof av === "number" && typeof bv === "number") {
                    cmp = av - bv;
                } else if (av instanceof Date && bv instanceof Date) {
                    cmp = av.getTime() - bv.getTime();
                } else {
                    cmp = String(av).localeCompare(String(bv));
                }
                if (cmp !== 0) return cmp * dir;
            }
            return 0;
        });
    }

    _applyColumnReorder(sourceKey, targetKey, placeAfter) {
        const ctx = this._findColumnContext(sourceKey);
        if (!ctx) {
            this._render();
            return;
        }
        const siblings = ctx.siblings;
        const from = ctx.index;
        let targetIdx = siblings.findIndex(
            (n) => !this._isColumnGroup(n) && n.key === targetKey,
        );
        if (targetIdx < 0) {
            // Drop target lives in another group — leave the order untouched.
            this._render();
            return;
        }

        const [moved] = siblings.splice(from, 1);
        if (targetIdx > from) targetIdx -= 1;
        const insertAt = placeAfter ? targetIdx + 1 : targetIdx;
        siblings.splice(insertAt, 0, moved);

        this._parsedColumns = this._flattenColumnTree(this._workingTree);
        this._emitColumnReorder(sourceKey, from, insertAt);
        this._render();
    }

    _applyPendingColumnVisibility() {
        if (this._pendingColumnHidden.size === 0) return;
        for (const [key, hidden] of this._pendingColumnHidden) {
            const ctx = this._findColumnContext(key);
            if (!ctx) continue;
            if (hidden) ctx.node.hidden = true;
            else delete ctx.node.hidden;
        }
        this._pendingColumnHidden.clear();
        this._parsedColumns = this._flattenColumnTree(this._workingTree);
        this._render();
    }

    _autoSizeColumn(col) {
        const node = this._findColumnContext(col.key)?.node || col;
        if (node.width == null) return;
        delete node.width;
        this._emitColumnResize(col.key, null);
        this._render();
    }

    _beginEdit(row, rowKey, col) {
        if (this._editing) {
            if (
                this._editing.rowKey === rowKey &&
                this._editing.columnKey === col.key
            ) {
                return;
            }
            this._commitActiveEditor();
        }
        const oldValue = row[col.key];
        this._editing = { rowKey, columnKey: col.key, oldValue, row, col };
        this.dispatchEvent(
            new CustomEvent("cell-edit-start", {
                detail: { row, column: col.key, value: oldValue },
                bubbles: true,
                composed: true,
            }),
        );
        this._render();
    }

    _buildBody(columns, entries, leadingSpacerPx, trailingSpacerPx) {
        const tbody = _el("tbody", { part: "body" });

        if (entries.length === 0) {
            tbody.appendChild(this._buildEmptyRow(columns));
            return tbody;
        }

        const totalCols = columns.length + (this.enableSelection ? 1 : 0);

        if (leadingSpacerPx > 0) {
            tbody.appendChild(this._buildSpacerRow(totalCols, leadingSpacerPx));
        }

        entries.forEach((entry, rowIdx) => {
            if (entry.kind === "group") {
                tbody.appendChild(this._buildGroupHeaderRow(columns, entry));
                return;
            }
            tbody.appendChild(this._buildDataRow(columns, entry, rowIdx));
        });

        if (trailingSpacerPx > 0) {
            tbody.appendChild(
                this._buildSpacerRow(totalCols, trailingSpacerPx),
            );
        }

        return tbody;
    }

    _buildCell(row, rowKey, col) {
        const cell = _el("td", { part: "cell", role: "gridcell" });
        if (col.align) cell.style.textAlign = col.align;

        const editable = this.enableEditing && col.editable !== false;
        if (editable) cell.classList.add("editable");

        const statusKey = `${rowKey}::${col.key}`;
        const status = this._editStatuses.get(statusKey);

        const isEditing =
            this._editing &&
            this._editing.rowKey === rowKey &&
            this._editing.columnKey === col.key;

        if (isEditing) {
            cell.classList.add("editing");
            // Ghost holds the pre-edit content so the cell's intrinsic width
            // doesn't change when the editor (which may have a different
            // min-width) takes over. The editor floats on top, sized to fill.
            const ghost = this._renderCellValue(col, row[col.key]);
            ghost.classList.add("cell-value-ghost");
            ghost.setAttribute("aria-hidden", "true");
            cell.appendChild(ghost);
            cell.appendChild(this._buildEditor(row, rowKey, col));
        } else {
            const value = row[col.key];
            cell.appendChild(this._renderCellValue(col, value));
            if (editable) {
                if (this.editOn === "click") {
                    cell.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this._beginEdit(row, rowKey, col);
                    });
                } else {
                    cell.setAttribute("tabindex", "0");
                    cell.addEventListener("focus", () => {
                        this._beginEdit(row, rowKey, col);
                    });
                }
            }
        }

        if (status) cell.appendChild(this._buildStatusIndicator(status));
        return cell;
    }

    _buildColgroup(columns) {
        // A <colgroup> is the single source of truth for column widths: the
        // selection column (when present) gets a placeholder <col> so the
        // data columns line up, and resizing mutates one <col> live instead of
        // every cell in the column.
        const group = _el("colgroup");
        if (this.enableSelection) {
            group.appendChild(_el("col", { class: "select-col" }));
        }
        columns.forEach((col) => {
            const colEl = _el("col", { "data-col-key": col.key });
            if (col.width != null && col.width !== "") {
                colEl.style.width =
                    typeof col.width === "number"
                        ? `${col.width}px`
                        : String(col.width);
            }
            group.appendChild(colEl);
        });
        return group;
    }

    _buildColumnResizeHandle(col) {
        const handle = _el("span", {
            class: "col-resize-handle",
            part: "column-resize-handle",
            "aria-hidden": "true",
            "data-col-key": col.key,
        });
        handle.addEventListener("pointerdown", (e) =>
            this._onColumnResizeStart(e, col, handle),
        );
        // Swallow the click/dblclick so they don't reach the header's sort
        // handler; double-click resets the column to auto width.
        handle.addEventListener("click", (e) => e.stopPropagation());
        handle.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            this._autoSizeColumn(col);
        });
        return handle;
    }

    _buildColumnsSubmenuItem() {
        const btn = _el("button", {
            type: "button",
            role: "menuitem",
            class: "menu-item menu-item--submenu",
            "aria-haspopup": "menu",
            "aria-expanded": "false",
        });
        btn.appendChild(_el("y-icon", { name: "grid", size: "small" }));
        btn.appendChild(_el("span", { class: "menu-item-label" }, ["Columns"]));
        btn.appendChild(
            _el("y-icon", {
                name: "chevron-right",
                size: "small",
                class: "submenu-chevron",
            }),
        );

        const toggle = () => {
            const sub = this._columnsSubmenuPopover;
            if (sub?.open) sub.hide("api");
            else this._openColumnsSubmenu(btn);
        };

        // Hover opens; re-click on the trigger toggles it closed.
        btn.addEventListener("mouseenter", () => {
            if (!this._columnsSubmenuPopover?.open)
                this._openColumnsSubmenu(btn);
        });
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            toggle();
        });
        return btn;
    }

    _buildColumnsSubmenuPopover() {
        ensureHeaderMenuStyles();
        const popover = _el("y-popover", {
            part: "header-menu-submenu",
            trigger: "manual",
            position: "right-start",
            portal: "",
            "close-on-outside-click": "true",
            "close-on-escape": "true",
        });
        popover.classList.add("header-menu-popover", "header-menu-submenu");
        return popover;
    }

    _buildDataRow(columns, entry, displayIdx) {
        const { row, absoluteIndex, depth } = entry;
        const key = this._rowKeyFor(row, absoluteIndex);
        const isSelected = this._selectedKeys.has(key);
        const tr = _el("tr", {
            part: "row",
            role: "row",
            "data-row-index": displayIdx,
            "data-row-key": key,
            "data-depth": depth ? String(depth) : null,
            "aria-selected": this.enableSelection ? String(isSelected) : null,
            class: isSelected ? "selected" : null,
        });
        if (this.virtual) tr.style.height = `${this.rowHeight}px`;
        tr.addEventListener("click", (e) => this._onRowClick(row, key, e));
        tr.addEventListener("dblclick", (e) => this._onRowDblClick(row, e));

        if (this.enableSelection) {
            tr.appendChild(this._buildSelectCell(row, key, isSelected));
        }

        columns.forEach((col, colIdx) => {
            const cell = this._buildCell(row, key, col);
            if (colIdx === 0 && depth) {
                cell.style.paddingLeft = `calc(var(--component-data-grid-group-indent, 16px) * ${depth + 1})`;
            }
            tr.appendChild(cell);
        });
        return tr;
    }

    _buildEditor(row, rowKey, col) {
        const value = row[col.key];
        const editorType = col.editor || col.type || "text";
        const validators = this._collectValidators(col);
        const commit = (raw) =>
            this._commitEdit(row, rowKey, col, raw, validators);
        const cancel = () => this._cancelEdit(row, rowKey, col);

        let editor;
        if (editorType === "select") {
            // y-select wants `[{value, label}]`; accept either that shape or a
            // plain string array in the column schema.
            const normalized = (col.options || []).map((o) =>
                typeof o === "object" && o !== null
                    ? {
                          value: String(o.value),
                          label: String(o.label ?? o.value),
                      }
                    : { value: String(o), label: String(o) },
            );
            editor = _el("y-select", {
                part: "cell-editor",
                size: "small",
                options: JSON.stringify(normalized),
                value: value == null ? "" : String(value),
                // Escape the grid-scroll's overflow:auto so the dropdown can
                // open beyond the visible viewport / past the grid edge.
                portal: "",
            });
            editor.addEventListener("change", (e) =>
                commit(e.detail?.value ?? editor.value),
            );
        } else if (editorType === "checkbox") {
            editor = _el("y-checkbox", {
                part: "cell-editor",
                "label-position": "right",
            });
            if (value) editor.setAttribute("checked", "");
            editor.addEventListener("change", () => commit(editor.checked));
        } else if (editorType === "date") {
            editor = _el("y-date", {
                part: "cell-editor",
                size: "small",
                value: value == null ? "" : String(value),
            });
            editor.addEventListener("change", (e) =>
                commit(e.detail?.value ?? ""),
            );
        } else {
            editor = _el("y-input", {
                part: "cell-editor",
                size: "small",
                type: editorType === "number" ? "number" : "text",
                value: value == null ? "" : String(value),
            });
            editor.addEventListener(
                "blur",
                () => {
                    if (this._editing)
                        commit(this._readEditorValue(editor, editorType));
                },
                true,
            );
        }

        editor.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                cancel();
            } else if (
                e.key === "Enter" &&
                editorType !== "select" &&
                editorType !== "checkbox"
            ) {
                e.stopPropagation();
                e.preventDefault();
                commit(this._readEditorValue(editor, editorType));
            }
        });

        queueMicrotask(() => {
            const native =
                editor.shadowRoot?.querySelector("input, [tabindex]");
            (native || editor).focus?.();
            if (native && "select" in native) native.select();
            // Auto-open the dropdown for select editors so the user can pick
            // a value in one click instead of two.
            if (
                editorType === "select" &&
                typeof editor.toggleDropdown === "function"
            ) {
                editor.toggleDropdown();
            }
        });

        return editor;
    }

    _buildEmptyRow(columns) {
        const tr = _el("tr", { part: "row", "data-empty": "" });
        const span =
            Math.max(1, columns.length) + (this.enableSelection ? 1 : 0);
        const td = _el("td", {
            part: "empty-state",
            colspan: String(span),
            class: "empty-cell",
            "aria-live": "polite",
        });
        const slot = _el("slot", { name: "empty" });
        slot.appendChild(document.createTextNode(this.emptyMessage));
        td.appendChild(slot);
        tr.appendChild(td);
        return tr;
    }

    _buildFilterPopover() {
        ensureHeaderMenuStyles();
        const popover = _el("y-popover", {
            part: "header-filter-popover",
            trigger: "manual",
            position: "bottom-end",
            portal: "",
            // Same reason as the header-menu popover: y-select / y-input
            // interactions inside the filter form shouldn't dismiss it.
            // `_openFilterPopover` installs a manual handler that treats any
            // portal surface (`.y-popover-portal`, `.y-select-portal`, …) as
            // "inside".
            "close-on-outside-click": "false",
            "close-on-escape": "true",
        });
        popover.classList.add("header-menu-popover", "filter-popover-host");
        return popover;
    }

    _buildFilterPopoverContent(col, close) {
        const root = _el("div", { class: "header-menu filter-popover" });

        const type =
            col.type === "number"
                ? "number"
                : col.type === "date"
                  ? "date"
                  : "text";
        const opOptions =
            type === "number"
                ? [
                      { value: "equals", label: "Equals" },
                      { value: "ne", label: "Does not equal" },
                      { value: "gt", label: "Greater than" },
                      { value: "gte", label: "Greater than or equal" },
                      { value: "lt", label: "Less than" },
                      { value: "lte", label: "Less than or equal" },
                  ]
                : type === "date"
                  ? [
                        { value: "equals", label: "On" },
                        { value: "before", label: "Before" },
                        { value: "after", label: "After" },
                    ]
                  : [
                        { value: "contains", label: "Contains" },
                        { value: "equals", label: "Equals" },
                        { value: "startsWith", label: "Starts with" },
                        { value: "endsWith", label: "Ends with" },
                    ];
        const currentOp = this._columnFilterOps[col.key] || opOptions[0].value;
        const currentVal = this._columnFilters[col.key] ?? "";

        const header = _el("div", { class: "submenu-header" }, [
            `Filter — ${col.label || col.key}`,
        ]);
        const inputs = _el("div", { class: "filter-row-inputs" });
        const opSelect = _el("y-select", {
            size: "small",
            "aria-label": "Filter operator",
            options: JSON.stringify(opOptions),
            value: currentOp,
            portal: "",
        });
        opSelect.style.setProperty(
            "--component-select-z-index",
            "calc(var(--component-popover-z-index, 7500) + 1)",
        );
        const valInput = _el("y-input", {
            size: "small",
            type,
            "aria-label": "Filter value",
            value: currentVal,
            placeholder: "Value",
        });
        inputs.appendChild(opSelect);
        inputs.appendChild(valInput);

        const actions = _el("div", { class: "filter-actions" });
        const clearBtn = _el("y-button", {
            "variant": "flat",
            size: "small",
            type: "button",
        });
        clearBtn.textContent = "Clear";
        const applyBtn = _el("y-button", {
            "variant": "filled",
            color: "primary",
            size: "small",
            type: "button",
        });
        applyBtn.textContent = "Apply";

        clearBtn.addEventListener("click", () => {
            delete this._columnFilterOps[col.key];
            this._setColumnFilter(col.key, "");
            close();
        });
        applyBtn.addEventListener("click", () => {
            const opVal = opSelect.value || currentOp;
            const rawVal = valInput.value ?? "";
            this._columnFilterOps[col.key] = opVal;
            // _setColumnFilter handles empty → removal, plus the re-render.
            this._setColumnFilter(col.key, rawVal);
            close();
        });

        actions.appendChild(clearBtn);
        actions.appendChild(applyBtn);

        root.appendChild(header);
        root.appendChild(inputs);
        root.appendChild(actions);
        return root;
    }

    _buildFilterRow(columns) {
        const tr = _el("tr", { part: "filter-row", class: "filter-row" });

        if (this.enableSelection) {
            tr.appendChild(_el("th", { scope: "col", class: "select-cell" }));
        }

        columns.forEach((col) => {
            const cell = _el("th", { scope: "col" });
            if (col.filterable === false) {
                tr.appendChild(cell);
                return;
            }

            const inputType =
                col.type === "number"
                    ? "number"
                    : col.type === "date"
                      ? "date"
                      : "text";
            const input = _el("y-input", {
                part: "filter-input",
                type: inputType,
                size: "small",
                "aria-label": `Filter ${col.label || col.key}`,
                placeholder: col.filterPlaceholder || "",
            });
            const existing = this._columnFilters[col.key];
            if (existing != null) input.setAttribute("value", String(existing));

            input.addEventListener("input", (e) => {
                this._setColumnFilter(col.key, e.detail?.value ?? "");
            });
            cell.appendChild(input);
            tr.appendChild(cell);
        });
        return tr;
    }

    _buildFooter(filteredCount, showPagination) {
        const total = this.mode === "server" ? this.totalRows : filteredCount;
        const totalPages = Math.max(1, Math.ceil(total / this._pageSize));
        const showCount = this.showItemCount;
        if (!showPagination && !showCount) return null;

        const wrap = _el("div", { part: "pagination", class: "grid-footer" });

        if (showPagination) {
            const slot = _el("slot", { name: "pagination" });
            const paginator = _el("y-paginator", {
                "current-page": String(this._currentPage),
                "total-pages": String(totalPages),
                variant: "default",
                size: "small",
            });
            paginator.addEventListener("page-change", this._onPaginatorChange);
            paginator.addEventListener(
                "page-size-change",
                this._onPaginatorPageSize,
            );
            slot.appendChild(paginator);
            wrap.appendChild(slot);
        }

        if (showCount) {
            wrap.appendChild(this._buildItemCount(total, showPagination));
        }
        return wrap;
    }

    _buildGroupHeaderCell(node, depth, maxDepth) {
        const span = this._leafCount(node);
        const th = _el("th", {
            part: "header-cell",
            scope: "colgroup",
            colspan: String(span),
            class: "group-column-header",
            "data-header-depth": String(depth),
        });
        if (node.align) th.style.textAlign = node.align;
        const inner = _el("span", { class: "th-content" });
        inner.appendChild(document.createTextNode(node.label || ""));
        th.appendChild(inner);
        // Quiet unused-arg lint complaint; maxDepth reserved for future styling.
        void maxDepth;
        return th;
    }

    _buildGroupHeaderRow(columns, entry) {
        const { path, depth, count, aggregates, collapsed, groupCol } = entry;
        const tr = _el("tr", {
            part: "group-header",
            class: "group-header",
            role: "row",
            "data-depth": String(depth),
            "data-group-path": this._groupPathKey(path),
            "aria-expanded": String(!collapsed),
        });

        if (this.enableSelection) {
            tr.appendChild(_el("td", { class: "select-cell", part: "cell" }));
        }

        const indent = `calc(var(--component-data-grid-group-indent, 16px) * ${depth})`;
        const totalCols = columns.length;
        const aggCols = new Set();
        if (aggregates) {
            for (const k of Object.keys(aggregates)) aggCols.add(k);
        }

        columns.forEach((col, idx) => {
            const cell = _el("td", { part: "cell", role: "gridcell" });
            if (idx === 0) {
                cell.classList.add("group-header-label");
                cell.style.paddingLeft = indent;
                cell.appendChild(this._buildGroupToggle(path, collapsed));
                const label = groupCol?.label || groupCol?.key || "";
                const valueText = path[path.length - 1];
                cell.appendChild(
                    _el("span", { class: "group-label" }, [
                        `${label ? label + ": " : ""}${valueText}`,
                    ]),
                );
                cell.appendChild(
                    _el("span", { class: "group-count" }, [` (${count})`]),
                );
                if (aggCols.size === 0 && totalCols > 1) {
                    cell.setAttribute("colspan", String(totalCols));
                }
            } else if (aggCols.size > 0) {
                if (aggregates[col.key] != null) {
                    const aggKind = this.aggregates[col.key];
                    cell.classList.add("group-header-agg");
                    cell.appendChild(
                        _el("span", { class: "group-agg-kind" }, [
                            `${aggKind}: `,
                        ]),
                    );
                    cell.appendChild(
                        document.createTextNode(
                            this._formatAggregate(aggregates[col.key]),
                        ),
                    );
                    if (col.align) cell.style.textAlign = col.align;
                }
            } else {
                return;
            }
            tr.appendChild(cell);
        });

        const toggle = () => this._toggleGroup(path);
        tr.addEventListener("click", (e) => {
            e.stopPropagation();
            toggle();
        });
        return tr;
    }

    _buildGroupToggle(path, collapsed) {
        const btn = _el("span", {
            class: "group-toggle",
            role: "button",
            "aria-label": collapsed ? "Expand group" : "Collapse group",
            tabindex: "0",
        });
        btn.appendChild(
            _el("y-icon", {
                name: collapsed ? "chevron-right" : "chevron-down",
                size: "small",
            }),
        );
        btn.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                this._toggleGroup(path);
            }
        });
        return btn;
    }

    _buildHeader(leafColumns) {
        const thead = _el("thead", { part: "header" });
        const { rows, maxDepth } = this._buildHeaderMatrix(this._workingTree);

        rows.forEach((nodes, depth) => {
            const headerRow = _el("tr", {
                part: "header-row",
                role: "row",
                "data-header-depth": String(depth),
            });

            if (this.enableSelection && depth === 0) {
                const selTh = this._buildSelectAllHeader();
                if (maxDepth > 1)
                    selTh.setAttribute("rowspan", String(maxDepth));
                headerRow.appendChild(selTh);
            }

            nodes.forEach((node) => {
                headerRow.appendChild(
                    this._isColumnGroup(node)
                        ? this._buildGroupHeaderCell(node, depth, maxDepth)
                        : this._buildLeafHeaderCell(node, depth, maxDepth),
                );
            });

            thead.appendChild(headerRow);
        });

        if (this.filtering === "inline")
            thead.appendChild(this._buildFilterRow(leafColumns));
        return thead;
    }

    _buildHeaderFilterTrigger(col) {
        const hasFilter =
            this._columnFilters[col.key] != null &&
            String(this._columnFilters[col.key]) !== "";
        const btn = _el("button", {
            type: "button",
            class: hasFilter
                ? "header-action-trigger header-filter-trigger is-active"
                : "header-action-trigger header-filter-trigger",
            part: "header-filter-trigger",
            "aria-label": `${col.label || col.key} filter`,
            "aria-haspopup": "dialog",
            "aria-expanded": "false",
        });
        btn.appendChild(_el("y-icon", { name: "funnel", size: "small" }));
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this._openFilterPopover(col, btn);
        });
        return btn;
    }

    _buildHeaderMatrix(tree) {
        const maxDepth = this._maxColumnDepth(tree);
        const rows = Array.from({ length: maxDepth }, () => []);
        const walk = (nodes, depth) => {
            nodes.forEach((node) => {
                if (!this._isVisibleNode(node)) return;
                rows[depth].push(node);
                if (this._isColumnGroup(node)) walk(node.children, depth + 1);
            });
        };
        walk(tree, 0);
        return { rows, maxDepth };
    }

    _buildHeaderMenuColumnList() {
        const list = _el("div", { class: "column-list", role: "group" });
        const allLeaves = this._flattenColumnTree(this._workingTree, {
            includeHidden: true,
        });

        // Pending changes win over the tree's `hidden` flag — they're committed
        // when the submenu closes.
        const effectiveHidden = (leaf) =>
            this._pendingColumnHidden.has(leaf.key)
                ? this._pendingColumnHidden.get(leaf.key)
                : !!leaf.hidden;

        allLeaves.forEach((leaf) => {
            const row = _el("button", {
                type: "button",
                role: "menuitemcheckbox",
                class: "menu-item column-item",
                "data-col-key": leaf.key,
                "aria-checked": String(!effectiveHidden(leaf)),
            });
            const cb = _el("y-checkbox", {
                class: "column-item-checkbox",
                "aria-hidden": "true",
                tabindex: "-1",
            });
            if (!effectiveHidden(leaf)) cb.setAttribute("checked", "");
            const label = _el("span", { class: "menu-item-label" }, [
                leaf.label || leaf.key,
            ]);
            row.appendChild(cb);
            row.appendChild(label);

            row.addEventListener("click", (e) => {
                e.stopPropagation();
                const currentlyHidden = effectiveHidden(leaf);
                const nextHidden = !currentlyHidden;

                // Block hiding the last visible column (count visible after this change).
                if (nextHidden) {
                    const futureVisible = allLeaves.filter((l) => {
                        if (l.key === leaf.key) return false;
                        return !(this._pendingColumnHidden.has(l.key)
                            ? this._pendingColumnHidden.get(l.key)
                            : l.hidden);
                    }).length;
                    if (futureVisible < 1) return;
                }

                // Stage; don't re-render the body yet.
                if (nextHidden === !!leaf.hidden)
                    this._pendingColumnHidden.delete(leaf.key);
                else this._pendingColumnHidden.set(leaf.key, nextHidden);

                row.setAttribute("aria-checked", String(!nextHidden));
                if (nextHidden) cb.removeAttribute("checked");
                else cb.setAttribute("checked", "");
            });
            list.appendChild(row);
        });
        return list;
    }

    _buildHeaderMenuContent(col, close) {
        const root = _el("div", { class: "header-menu", role: "menu" });

        // ---- Sort section ----
        const sortable = this.enableSorting && col.sortable !== false;
        if (sortable) {
            const sortSection = _el("div", { class: "menu-section" });
            const ascBtn = this._buildMenuItem({
                icon: "arrow-up",
                label: "Sort ascending",
                onSelect: () => {
                    this._setSortFromMenu(col.key, "asc");
                    close();
                },
            });
            const descBtn = this._buildMenuItem({
                icon: "arrow-down",
                label: "Sort descending",
                onSelect: () => {
                    this._setSortFromMenu(col.key, "desc");
                    close();
                },
            });
            sortSection.appendChild(ascBtn);
            sortSection.appendChild(descBtn);

            const currentSort = this._sorts.find((s) => s.column === col.key);
            if (currentSort) {
                sortSection.appendChild(
                    this._buildMenuItem({
                        icon: "x",
                        label: "Clear sort",
                        onSelect: () => {
                            this._clearSortFor(col.key);
                            close();
                        },
                    }),
                );
            }
            root.appendChild(sortSection);
        }

        // ---- Columns visibility (opens a nested popover submenu) ----
        const colsSection = _el("div", { class: "menu-section" });
        colsSection.appendChild(this._buildColumnsSubmenuItem());
        root.appendChild(colsSection);

        // ---- Move column section ----
        const ctx = this._findColumnContext(col.key);
        if (ctx) {
            const moveSection = _el("div", { class: "menu-section" });
            const visibleSiblings = ctx.siblings
                .map((node, idx) => ({ node, idx }))
                .filter(({ node }) => this._isVisibleNode(node));
            const positionAmongVisible = visibleSiblings.findIndex(
                (s) => s.node === ctx.node,
            );
            const canMovePrev = positionAmongVisible > 0;
            const canMoveNext =
                positionAmongVisible >= 0 &&
                positionAmongVisible < visibleSiblings.length - 1;

            moveSection.appendChild(
                this._buildMenuItem({
                    icon: "arrow-left",
                    label: "Move column previous",
                    disabled: !canMovePrev,
                    onSelect: () => {
                        this._moveColumn(col.key, -1);
                        close();
                    },
                }),
            );
            moveSection.appendChild(
                this._buildMenuItem({
                    icon: "arrow-right",
                    label: "Move column next",
                    disabled: !canMoveNext,
                    onSelect: () => {
                        this._moveColumn(col.key, 1);
                        close();
                    },
                }),
            );
            root.appendChild(moveSection);
        }

        return root;
    }

    _buildHeaderMenuPopover() {
        ensureHeaderMenuStyles();
        const popover = _el("y-popover", {
            part: "header-menu-popover",
            trigger: "manual",
            position: "bottom-end",
            portal: "",
            // Outside-click is managed by `_openHeaderMenu` so the submenu's
            // portal counts as "inside" — otherwise a click on a column
            // checkbox would close the main menu and prematurely commit edits.
            "close-on-outside-click": "false",
            "close-on-escape": "true",
        });
        popover.classList.add("header-menu-popover");
        return popover;
    }

    _buildHeaderMenuTrigger(col) {
        const btn = _el("button", {
            type: "button",
            class: "header-action-trigger header-menu-trigger",
            part: "header-menu-trigger",
            "aria-label": `${col.label || col.key} column menu`,
            "aria-haspopup": "menu",
            "aria-expanded": "false",
        });
        btn.appendChild(_el("y-icon", { name: "ellipsis-v", size: "small" }));
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this._openHeaderMenu(col, btn);
        });
        return btn;
    }

    _buildItemCount(total, paginated) {
        const span = _el("div", { part: "item-count", class: "item-count" });
        if (total === 0) {
            span.textContent = "0 items";
            return span;
        }
        if (!paginated) {
            span.textContent = `${total.toLocaleString()} ${total === 1 ? "item" : "items"}`;
            return span;
        }
        const start = (this._currentPage - 1) * this._pageSize + 1;
        const end = Math.min(this._currentPage * this._pageSize, total);
        span.textContent = `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()}`;
        return span;
    }

    _buildLeafHeaderCell(col, depth, maxDepth) {
        const isSortable = this.enableSorting && col.sortable !== false;
        const sortIdx = this._sorts.findIndex((s) => s.column === col.key);
        const direction =
            sortIdx >= 0 ? this._sorts[sortIdx].direction : "none";
        const ariaSort =
            direction === "asc"
                ? "ascending"
                : direction === "desc"
                  ? "descending"
                  : "none";

        const remainingRows = maxDepth - depth;
        const th = _el("th", {
            part: "header-cell",
            scope: "col",
            "data-col-key": col.key,
            "aria-sort": ariaSort,
            class: isSortable ? "sortable" : null,
            rowspan: remainingRows > 1 ? String(remainingRows) : null,
        });
        if (col.align) th.style.textAlign = col.align;

        const inner = _el("span", { class: "th-content" });
        inner.appendChild(document.createTextNode(col.label || col.key));

        if (isSortable) {
            const indicator = _el("span", {
                class: "sort-icon",
                "aria-hidden": "true",
            });
            if (direction === "asc") {
                indicator.appendChild(
                    _el("y-icon", { name: "arrow-up", size: "small" }),
                );
            } else if (direction === "desc") {
                indicator.appendChild(
                    _el("y-icon", { name: "arrow-down", size: "small" }),
                );
            } else {
                indicator.classList.add("sort-icon--placeholder");
            }
            if (sortIdx >= 0 && this._sorts.length > 1) {
                const badge = _el("span", { class: "sort-rank" }, [
                    String(sortIdx + 1),
                ]);
                inner.appendChild(badge);
            }
            inner.appendChild(indicator);
            th.addEventListener("click", (e) =>
                this._onHeaderClick(col.key, e),
            );
        }

        const showFilterTrigger = this.filtering === "advanced";
        const showMenuTrigger = this.enableHeaderMenu;
        if (showFilterTrigger || showMenuTrigger) {
            const actions = _el("span", { class: "th-actions" });
            if (showFilterTrigger)
                actions.appendChild(this._buildHeaderFilterTrigger(col));
            if (showMenuTrigger)
                actions.appendChild(this._buildHeaderMenuTrigger(col));
            inner.appendChild(actions);
        }

        th.appendChild(inner);

        if (this.enableColumnReorder && col.reorderable !== false) {
            th.classList.add("reorderable");
            th.addEventListener("pointerdown", (e) =>
                this._onColumnReorderStart(e, col, th),
            );
        }
        if (this.enableColumnResize && col.resizable !== false) {
            th.classList.add("resizable");
            th.appendChild(this._buildColumnResizeHandle(col));
        }

        return th;
    }

    _buildLoadingOverlay() {
        const overlay = _el("div", {
            part: "loading-overlay",
            class: "loading-overlay",
            role: "status",
        });
        const slot = _el("slot", { name: "loading" });
        slot.appendChild(
            _el("y-progress", {
                mode: "ring",
                indeterminate: true,
                size: "large",
                color: "primary",
                "label-display": "false",
                "aria-label": "Loading",
            }),
        );
        overlay.appendChild(slot);
        return overlay;
    }

    _buildMenuItem({ icon, label, onSelect, disabled = false }) {
        const btn = _el("button", {
            type: "button",
            role: "menuitem",
            class: "menu-item",
            disabled: disabled || null,
        });
        if (icon) btn.appendChild(_el("y-icon", { name: icon, size: "small" }));
        btn.appendChild(_el("span", {}, [label]));
        if (!disabled) btn.addEventListener("click", onSelect);
        return btn;
    }

    _buildRowEntries({ respectCollapse = true } = {}) {
        const dataRows = this._getDisplayDataRows();
        const groupKeys = this.groupBy;
        const cols = this._parsedColumns;
        const dataIndex = (row) => this._parsedData.indexOf(row);

        if (groupKeys.length === 0) {
            return dataRows.map((row) => ({
                kind: "data",
                row,
                depth: 0,
                absoluteIndex: dataIndex(row),
            }));
        }

        const out = [];
        const groupCols = groupKeys.map(
            (k) => cols.find((c) => c.key === k) || { key: k },
        );

        const walk = (rows, depth, parentPath) => {
            if (depth >= groupKeys.length) {
                rows.forEach((row) => {
                    out.push({
                        kind: "data",
                        row,
                        depth,
                        absoluteIndex: dataIndex(row),
                    });
                });
                return;
            }
            const key = groupKeys[depth];
            const buckets = new Map();
            const order = [];
            rows.forEach((row) => {
                const v = row[key];
                const sv = v == null ? "" : String(v);
                if (!buckets.has(sv)) {
                    buckets.set(sv, []);
                    order.push(sv);
                }
                buckets.get(sv).push(row);
            });

            order.forEach((value) => {
                const bucket = buckets.get(value);
                const path = [...parentPath, value];
                const pathKey = this._groupPathKey(path);
                const collapsed =
                    respectCollapse && this._collapsedGroups.has(pathKey);
                out.push({
                    kind: "group",
                    path,
                    depth,
                    count: bucket.length,
                    aggregates: this._computeAggregates(bucket),
                    collapsed,
                    groupCol: groupCols[depth],
                });
                if (!collapsed) walk(bucket, depth + 1, path);
            });
        };

        walk(dataRows, 0, []);
        return out;
    }

    _buildSelectAllHeader() {
        const visibleRows = this._getDisplayDataRows();
        const visibleKeys = visibleRows.map((row) =>
            this._rowKeyFor(row, this._parsedData.indexOf(row)),
        );
        const selectedCount = visibleKeys.filter((k) =>
            this._selectedKeys.has(k),
        ).length;
        const allChecked =
            visibleKeys.length > 0 && selectedCount === visibleKeys.length;
        const someChecked = selectedCount > 0 && !allChecked;

        const th = _el("th", {
            scope: "col",
            part: "header-cell",
            class: "select-cell",
        });

        if (this.selectionMode === "single") return th;

        const checkbox = _el("y-checkbox", {
            "aria-label": "Select all rows",
            "label-position": "right",
        });
        if (allChecked) checkbox.setAttribute("checked", "");
        if (someChecked) checkbox.setAttribute("indeterminate", "");

        checkbox.addEventListener("change", (e) => {
            e.stopPropagation();
            this._toggleAllVisible(!allChecked, visibleKeys, visibleRows);
        });
        th.appendChild(checkbox);
        return th;
    }

    _buildSelectCell(row, rowKey, isSelected) {
        const td = _el("td", {
            part: "cell",
            role: "gridcell",
            class: "select-cell",
        });
        const checkbox = _el("y-checkbox", {
            "aria-label": "Select row",
            "label-position": "right",
        });
        if (isSelected) checkbox.setAttribute("checked", "");

        checkbox.addEventListener("change", (e) => {
            e.stopPropagation();
            this._toggleRowSelection(row, rowKey, e);
        });
        checkbox.addEventListener("click", (e) => e.stopPropagation());
        td.appendChild(checkbox);
        return td;
    }

    _buildSpacerRow(colspan, height) {
        const tr = _el("tr", { class: "spacer-row", "aria-hidden": "true" });
        const td = _el("td", { colspan: String(Math.max(1, colspan)) });
        td.style.height = `${height}px`;
        td.style.padding = "0";
        td.style.border = "0";
        tr.appendChild(td);
        return tr;
    }

    _buildStatusIndicator(status) {
        const span = _el("span", {
            class: `edit-status edit-status--${status.kind}`,
        });
        const iconName =
            status.kind === "saving"
                ? "clock"
                : status.kind === "success"
                  ? "check"
                  : "x";
        span.appendChild(_el("y-icon", { name: iconName, size: "small" }));
        if (status.message) span.setAttribute("title", status.message);
        return span;
    }

    _buildStyles() {
        const fixed = this.fixedHeader ? "sticky" : "static";
        const stripedRule = this.striped
            ? `tbody tr:nth-child(even):not([data-empty]) { background: var(--component-data-grid-row-stripe-bg, var(--component-table-hover-background, #292a2b)); }`
            : "";
        const hoverRule = this.hover
            ? `tbody tr:not([data-empty]):hover { background: var(--component-data-grid-row-hover-bg, var(--component-table-active-background, #46474a)); cursor: default; }`
            : "";
        return `
            :host {
                display: flex;
                flex-direction: column;
                font-family: var(--font-family-body, sans-serif);
                color: var(--component-data-grid-text, var(--component-table-color, #f7f7fa));
                box-sizing: border-box;
                position: relative;
            }
            :host([loading]) .grid-body { opacity: 0.6; pointer-events: none; }

            .grid-container {
                display: flex;
                flex-direction: column;
                min-height: 0;
                border: 1px solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
                border-width: var(--component-data-grid-border-width, 1px);
                border-radius: var(--component-data-grid-border-radius, 4px);
                overflow: hidden;
                background: var(--component-data-grid-bg, transparent);
                position: relative;
            }

            .grid-scroll {
                overflow: auto;
                position: relative;
            }

            .header-toolbar { display: block; }
            .header-toolbar.has-content {
                border-bottom: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
            }

            table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                table-layout: auto;
            }

            thead {
                position: ${fixed};
                top: 0;
                z-index: 1;
                background: var(--component-data-grid-header-bg, var(--base-background-component, #1c1d1f));
            }

            thead th {
                position: relative;
                padding: var(--component-data-grid-padding-medium, 8px);
                text-align: left;
                font-weight: 500;
                font-size: var(--font-size-paragraph, 1em);
                color: var(--component-data-grid-header-text, var(--component-table-color, #f7f7fa));
                white-space: nowrap;
                user-select: none;
                border-right: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
                border-bottom: var(--component-data-grid-border-width-header, 2px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
            }
            thead th:last-child { border-right: none; }

            thead th.sortable { cursor: pointer; }
            thead th.sortable:hover {
                background: var(--component-data-grid-header-hover-bg, var(--component-table-hover-background, #292a2b));
            }

            thead th.group-column-header {
                text-align: center;
                border-bottom: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
            }

            .th-actions {
                margin-left: auto;
                display: inline-flex;
                align-items: center;
                gap: 2px;
                flex-shrink: 0;
            }
            .header-action-trigger {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                padding: 0;
                background: transparent;
                color: inherit;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                opacity: 0;
                transition: opacity 0.12s ease;
            }
            thead th:hover .header-action-trigger,
            thead th .header-action-trigger:focus-visible,
            thead th .header-action-trigger[aria-expanded="true"],
            thead th .header-action-trigger.is-active {
                opacity: 1;
            }
            .header-action-trigger:hover {
                background: var(--component-data-grid-header-hover-bg, var(--component-table-hover-background, #292a2b));
            }
            .header-action-trigger.is-active {
                color: var(--primary-content, currentColor);
            }

            /* Column resize handle — sits on the inline (right) edge of each
               leaf header and shows a thin accent line on hover / while active. */
            .col-resize-handle {
                position: absolute;
                top: 0;
                right: 0;
                width: 8px;
                height: 100%;
                cursor: col-resize;
                user-select: none;
                touch-action: none;
                z-index: 3;
            }
            .col-resize-handle::after {
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                width: 2px;
                height: 100%;
                background: transparent;
                transition: background 0.12s ease;
            }
            .col-resize-handle:hover::after,
            .col-resize-handle.is-active::after {
                background: var(--component-data-grid-resize-handle-color, var(--primary-content, #0f62fe));
            }

            /* Column reorder — grab affordance, dimmed source, and a drop line
               on the target header's leading/trailing edge. */
            thead th.reorderable { cursor: grab; }
            thead th.reorderable.is-dragging {
                opacity: 0.4;
                cursor: grabbing;
            }
            thead th.drop-before {
                box-shadow: inset 2px 0 0 0 var(--component-data-grid-drop-indicator-color, var(--primary-content, #0f62fe));
            }
            thead th.drop-after {
                box-shadow: inset -2px 0 0 0 var(--component-data-grid-drop-indicator-color, var(--primary-content, #0f62fe));
            }

            .grid-container.is-col-resizing,
            .grid-container.is-col-resizing * { cursor: col-resize !important; }
            .grid-container.is-col-resizing { user-select: none; }
            .grid-container.is-col-dragging,
            .grid-container.is-col-dragging * { cursor: grabbing !important; }
            .grid-container.is-col-dragging { user-select: none; }

            /*
             * Menu content (.header-menu and descendants) lives inside portaled
             * y-popover surfaces — see HEADER_MENU_CSS at the top of this file
             * for the rules; they are injected globally by
             * ensureHeaderMenuStyles().
             */

            .th-content {
                display: flex;
                align-items: center;
                gap: 6px;
                width: 100%;
            }

            .sort-icon {
                display: inline-flex;
                width: 14px;
                height: 14px;
                flex-shrink: 0;
            }
            .sort-icon--placeholder { visibility: hidden; }

            .sort-rank {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 16px;
                height: 16px;
                padding: 0 4px;
                font-size: 0.75em;
                font-weight: 600;
                border-radius: 8px;
                background: var(--primary-content, #0f62fe);
                color: var(--primary-content-inverse, #fff);
            }

            .filter-row th {
                padding: 4px var(--component-data-grid-padding-small, 6px);
                background: var(--component-data-grid-filter-bg, transparent);
                border-right: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
                border-bottom: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
            }
            .filter-row th:last-child { border-right: none; }
            .filter-row y-input { width: 100%; display: block; }

            .select-cell {
                width: 36px;
                text-align: center;
                padding: 0 var(--component-data-grid-padding-small, 6px) !important;
            }
            .select-cell y-checkbox {
                display: inline-flex;
                vertical-align: middle;
            }

            tbody tr.selected,
            tbody tr.selected:nth-child(even):not([data-empty]) {
                background: var(--component-data-grid-row-selected-bg, var(--primary-background-active, #d0e2ff)) !important;
                color: var(--component-data-grid-row-selected-text, var(--base-content, #161616));
            }

            /* Center boolean cell contents (both the displayed icon and the
               editor checkbox) and respect the cell's left padding. */
            .cell-value--boolean {
                display: inline-flex;
                align-items: center;
                line-height: 1;
            }
            td.editing y-checkbox[part="cell-editor"] {
                display: flex;
                align-items: center;
                padding-left: var(--component-data-grid-padding-medium, 8px);
            }

            td.editable { cursor: cell; }
            td.editing {
                position: relative;
                background: var(--component-data-grid-edit-bg, var(--base-background-app, transparent));
            }
            /* Ghost preserves the cell's intrinsic width so the column doesn't
               grow/shrink while editing. */
            td.editing .cell-value-ghost {
                visibility: hidden;
                pointer-events: none;
            }
            td.editing [part="cell-editor"] {
                position: absolute;
                inset: 0;
                display: block;
                width: 100%;
                min-width: 0;
                box-sizing: border-box;
            }

            .group-header {
                cursor: pointer;
                background: var(--component-data-grid-group-header-bg, var(--base-background-hover, #292a2b));
                font-weight: 500;
            }
            .group-header:hover {
                background: var(--component-data-grid-group-header-hover-bg, var(--base-background-active, #46474a));
            }
            .group-header td {
                padding: var(--component-data-grid-padding-small, 6px) var(--component-data-grid-padding-medium, 8px);
            }
            .group-toggle {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 18px;
                height: 18px;
                margin-right: 6px;
                cursor: pointer;
                vertical-align: middle;
            }
            .group-toggle:focus-visible {
                outline: 2px solid var(--primary-content, #0f62fe);
                outline-offset: 1px;
                border-radius: 2px;
            }
            .group-label { vertical-align: middle; }
            .group-count {
                vertical-align: middle;
                opacity: 0.7;
                font-weight: 400;
            }
            .group-agg-kind {
                opacity: 0.7;
                margin-right: 4px;
                font-weight: 400;
            }

            .spacer-row td {
                border: 0 !important;
                background: transparent !important;
            }

            /* Positioned absolutely so it never widens the cell's intrinsic
               content — the table-layout: auto column would otherwise grow to
               accommodate the icon when the status appears post-commit. */
            .edit-status {
                position: absolute;
                top: 50%;
                right: 4px;
                transform: translateY(-50%);
                display: inline-flex;
                align-items: center;
                pointer-events: none;
            }
            .edit-status--saving { color: var(--base-content-light, #888); }
            .edit-status--success { color: var(--success-content, #51cf66); }
            .edit-status--error { color: var(--error-content, #ff6b6b); }

            tbody td {
                position: relative;
                padding: var(--component-data-grid-padding-medium, 8px);
                font-size: var(--font-size-paragraph, 1em);
                font-weight: var(--font-weight-body, 400);
                border-right: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
                border-bottom: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
            }
            tbody td:last-child { border-right: none; }
            tbody tr:last-child td { border-bottom: none; }

            ${stripedRule}
            ${hoverRule}

            .empty-cell {
                text-align: center;
                padding: var(--component-data-grid-padding-large, 12px);
                color: var(--component-data-grid-empty-text, var(--component-table-color, #f7f7fa));
                opacity: 0.7;
            }

            .grid-footer {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: var(--component-data-grid-padding-small, 6px);
                background: var(--component-data-grid-pagination-bg, transparent);
                border-top: var(--component-data-grid-border-width, 1px) solid var(--component-data-grid-border, var(--component-table-border-color, #37383a));
            }
            .grid-footer .item-count {
                margin-left: auto;
                color: var(--component-data-grid-item-count-text, var(--base-content-light, currentColor));
                font-size: var(--font-size-small, 0.875em);
            }

            .loading-overlay {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--component-data-grid-loading-overlay-bg, rgba(0,0,0,0.25));
                z-index: 2;
                pointer-events: all;
            }

            .slot-row { display: contents; }
        `;
    }

    _cancelActiveEditor() {
        if (!this._editing) return;
        const { row, rowKey, col } = this._editing;
        this._cancelEdit(row, rowKey, col);
    }

    _cancelEdit(row, rowKey, col) {
        if (
            !this._editing ||
            this._editing.rowKey !== rowKey ||
            this._editing.columnKey !== col.key
        ) {
            return;
        }
        const oldValue = this._editing.oldValue;
        this._editing = null;
        this.dispatchEvent(
            new CustomEvent("cell-edit-cancel", {
                detail: { row, column: col.key, oldValue },
                bubbles: true,
                composed: true,
            }),
        );
        this._render();
    }

    _clearSortFor(key) {
        const before = this._sorts.length;
        this._sorts = this._sorts.filter((s) => s.column !== key);
        if (this._sorts.length === before) return;
        const top = this._sorts[0];
        this._emitSortChange(
            top ? top.column : null,
            top ? top.direction : "none",
        );
        this._render();
    }

    _cloneColumnTree(tree) {
        return tree.map((node) => {
            const copy = { ...node };
            if (this._isColumnGroup(node))
                copy.children = this._cloneColumnTree(node.children);
            return copy;
        });
    }

    _colElementFor(key) {
        const cols = this.shadowRoot.querySelectorAll(
            "colgroup col[data-col-key]",
        );
        for (const c of cols) {
            if (c.dataset.colKey === key) return c;
        }
        return null;
    }

    _collectValidators(col) {
        const list = [];
        if (col.required) {
            list.push((v) => {
                if (v == null || v === "") return "This field is required";
                return null;
            });
        }
        if (col.type === "number") {
            list.push((v) => {
                if (v === "" || v == null) return null;
                if (Number.isNaN(Number(v))) return "Must be a number";
                if (col.min != null && Number(v) < col.min)
                    return `Min ${col.min}`;
                if (col.max != null && Number(v) > col.max)
                    return `Max ${col.max}`;
                return null;
            });
        }
        if (col.pattern) {
            const re = new RegExp(col.pattern);
            list.push((v) =>
                re.test(String(v ?? "")) ? null : "Invalid format",
            );
        }
        if (typeof col.validate === "function") {
            list.push(col.validate);
        }
        return list;
    }

    _commitActiveEditor() {
        if (!this._editing) return;
        const { row, rowKey, col, oldValue } = this._editing;
        const editor = this.shadowRoot.querySelector(
            "td.editing [part='cell-editor']",
        );
        const value = editor
            ? this._readEditorValue(editor, col.editor || col.type || "text")
            : oldValue;
        this._commitEdit(row, rowKey, col, value, this._collectValidators(col));
    }

    _commitEdit(row, rowKey, col, value, validators) {
        if (
            !this._editing ||
            this._editing.rowKey !== rowKey ||
            this._editing.columnKey !== col.key
        ) {
            return;
        }
        const oldValue = this._editing.oldValue;
        const statusKey = `${rowKey}::${col.key}`;

        for (const fn of validators) {
            const msg = fn(value, row);
            if (msg) {
                this._editStatuses.set(statusKey, {
                    kind: "error",
                    message: msg,
                });
                this._render();
                return;
            }
        }

        const ev = new CustomEvent("cell-edit-end", {
            detail: { row, column: col.key, value, oldValue },
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        const accepted = this.dispatchEvent(ev);
        if (!accepted) {
            this._editStatuses.set(statusKey, {
                kind: "error",
                message: "Rejected",
            });
            this._editing = null;
            this._render();
            return;
        }

        if (this.mode === "client") {
            row[col.key] = value;
        }
        this._editing = null;
        this._editStatuses.set(statusKey, { kind: "success" });
        this._render();
        setTimeout(() => {
            if (this._editStatuses.get(statusKey)?.kind === "success") {
                this._editStatuses.delete(statusKey);
                if (this.isConnected) this._render();
            }
        }, EDIT_STATUS_RESET_MS);
    }

    _computeAggregates(rows) {
        const cfg = this.aggregates;
        if (!cfg || Object.keys(cfg).length === 0) return null;
        const out = {};
        for (const [key, kind] of Object.entries(cfg)) {
            const values = rows
                .map((r) => r[key])
                .filter((v) => v != null && v !== "");
            const numbers = values
                .map((v) => Number(v))
                .filter((n) => Number.isFinite(n));

            if (kind === "count") out[key] = rows.length;
            else if (kind === "sum")
                out[key] = numbers.reduce((a, b) => a + b, 0);
            else if (kind === "avg") {
                out[key] = numbers.length
                    ? numbers.reduce((a, b) => a + b, 0) / numbers.length
                    : 0;
            } else if (kind === "min")
                out[key] = numbers.length ? Math.min(...numbers) : null;
            else if (kind === "max")
                out[key] = numbers.length ? Math.max(...numbers) : null;
        }
        return out;
    }

    _defaultOperatorFor(col) {
        if (!col) return "contains";
        if (col.type === "number") return "equals";
        if (col.type === "date") return "equals";
        return "contains";
    }

    _emitColumnReorder(column, fromIndex, toIndex) {
        this.dispatchEvent(
            new CustomEvent("column-reorder", {
                detail: {
                    column,
                    fromIndex,
                    toIndex,
                    order: this._flattenColumnTree(this._workingTree, {
                        includeHidden: true,
                    }).map((c) => c.key),
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _emitColumnResize(column, width) {
        this.dispatchEvent(
            new CustomEvent("column-resize", {
                detail: { column, width },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _emitFilterChange() {
        const detail = {
            filters: { ...this._columnFilters },
            operators: { ...this._columnFilterOps },
            globalSearch: this._globalQuery,
        };
        const ev = new CustomEvent("filter-change", {
            detail,
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        return this.dispatchEvent(ev);
    }

    _emitGroupToggle(path, expanded) {
        this.dispatchEvent(
            new CustomEvent("group-toggle", {
                detail: { path, groupKey: path[path.length - 1], expanded },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _emitPageChange(page) {
        const ev = new CustomEvent("page-change", {
            detail: { page, pageSize: this._pageSize },
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        return this.dispatchEvent(ev);
    }

    _emitRowSelect(event) {
        const rows = this.selectedRows;
        const ev = new CustomEvent("row-select", {
            detail: { rows, keys: this.selectedKeys, event },
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        return this.dispatchEvent(ev);
    }

    _emitSortChange(column, direction) {
        const ev = new CustomEvent("sort-change", {
            detail: { column, direction, sorts: this.sortState },
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        return this.dispatchEvent(ev);
    }

    _findColumnContext(key, nodes = this._workingTree, parent = null) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (!this._isColumnGroup(node) && node.key === key) {
                return { node, parent, siblings: nodes, index: i };
            }
            if (this._isColumnGroup(node)) {
                const found = this._findColumnContext(key, node.children, node);
                if (found) return found;
            }
        }
        return null;
    }

    _flattenColumnTree(tree, { includeHidden = false } = {}) {
        const out = [];
        const walk = (nodes) => {
            nodes.forEach((node) => {
                if (this._isColumnGroup(node)) walk(node.children);
                else if (includeHidden || !node.hidden) out.push(node);
            });
        };
        walk(tree);
        return out;
    }

    _formatAggregate(value) {
        if (value == null) return "";
        if (typeof value === "number") {
            return Number.isInteger(value)
                ? value.toLocaleString()
                : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }
        return String(value);
    }

    _getDisplayDataRows() {
        if (this.mode === "server") return this._parsedData;
        const filtered = this._applyClientFilters(this._parsedData);
        const sorted = this._applyClientSort(filtered);
        if (!this.enablePagination || this.groupBy.length > 0) return sorted;
        const start = (this._currentPage - 1) * this._pageSize;
        return sorted.slice(start, start + this._pageSize);
    }

    _getFilteredCount() {
        if (this.mode === "server") return this.totalRows;
        return this._applyClientFilters(this._parsedData).length;
    }

    _groupPathKey(path) {
        // Escape backslashes and the delimiter so distinct paths can never
        // serialize to the same key (e.g. ["a","bc"] vs ["ab","c"]).
        return path
            .map((p) => String(p).replace(/\\/g, "\\\\").replace(/\//g, "\\/"))
            .join("/");
    }

    _isColumnGroup(node) {
        return node && Array.isArray(node.children) && node.children.length > 0;
    }

    _isVisibleNode(node) {
        if (!this._isColumnGroup(node)) return !node.hidden;
        return node.children.some((c) => this._isVisibleNode(c));
    }

    _leafCount(node) {
        if (!this._isColumnGroup(node)) return node.hidden ? 0 : 1;
        return node.children.reduce((sum, c) => sum + this._leafCount(c), 0);
    }

    _matchesFilter(cellValue, filterValue, op, col) {
        const type = col?.type;
        if (type === "number") {
            const a = Number(cellValue);
            const b = Number(filterValue);
            if (!Number.isFinite(b)) return true;
            if (!Number.isFinite(a)) return false;
            switch (op) {
                case "equals":
                    return a === b;
                case "ne":
                    return a !== b;
                case "gt":
                    return a > b;
                case "gte":
                    return a >= b;
                case "lt":
                    return a < b;
                case "lte":
                    return a <= b;
                default:
                    return a === b;
            }
        }
        if (type === "date") {
            const a = cellValue == null ? NaN : new Date(cellValue).getTime();
            const b = filterValue ? new Date(filterValue).getTime() : NaN;
            if (Number.isNaN(b)) return true;
            if (Number.isNaN(a)) return false;
            switch (op) {
                case "before":
                    return a < b;
                case "after":
                    return a > b;
                case "equals":
                default:
                    return a === b;
            }
        }
        const cell = String(cellValue ?? "").toLowerCase();
        const needle = String(filterValue).toLowerCase();
        switch (op) {
            case "equals":
                return cell === needle;
            case "startsWith":
                return cell.startsWith(needle);
            case "endsWith":
                return cell.endsWith(needle);
            case "contains":
            default:
                return cell.includes(needle);
        }
    }

    _maxColumnDepth(tree) {
        const visible = tree.filter((n) => this._isVisibleNode(n));
        if (visible.length === 0) return 1;
        const depth = (node, d) => {
            if (!this._isColumnGroup(node)) return d;
            const kids = node.children.filter((c) => this._isVisibleNode(c));
            if (kids.length === 0) return d;
            return Math.max(...kids.map((c) => depth(c, d + 1)));
        };
        return Math.max(...visible.map((n) => depth(n, 1)));
    }

    _minWidthFor(col) {
        const m = Number(col.minWidth);
        return Number.isFinite(m) && m > 0 ? m : MIN_COLUMN_WIDTH;
    }

    _moveColumn(key, direction) {
        const ctx = this._findColumnContext(key);
        if (!ctx) return;
        const siblings = ctx.siblings;
        const here = ctx.index;

        // Walk to the nearest visible sibling in the requested direction.
        let target = here + direction;
        while (
            target >= 0 &&
            target < siblings.length &&
            !this._isVisibleNode(siblings[target])
        ) {
            target += direction;
        }
        if (target < 0 || target >= siblings.length) return;

        const [moved] = siblings.splice(here, 1);
        siblings.splice(target, 0, moved);

        this._parsedColumns = this._flattenColumnTree(this._workingTree);
        this._render();
    }

    _onColumnReorderEnd() {
        const state = this._reorderState;
        if (!state) return;
        const { th } = state;
        th.removeEventListener("pointermove", this._onColumnReorderMove);
        th.removeEventListener("pointerup", this._onColumnReorderEnd);
        th.removeEventListener("pointercancel", this._onColumnReorderEnd);
        try {
            th.releasePointerCapture(state.pointerId);
        } catch {
            /* capture already gone */
        }
        this._reorderState = null;

        // Below the drag threshold this was really a click — let the sort
        // handler run as usual.
        if (!state.dragging) return;

        // A drag completed: swallow the trailing click, then rebuild on the
        // next frame so the still-mounted source header absorbs that click (a
        // synchronous re-render would detach it mid-event and re-target it).
        this._suppressHeaderClick = true;
        requestAnimationFrame(() => {
            if (state.targetKey && state.targetKey !== state.col.key) {
                this._applyColumnReorder(
                    state.col.key,
                    state.targetKey,
                    state.placeAfter,
                );
            } else {
                this._render();
            }
        });
    }

    _onColumnReorderMove(e) {
        const state = this._reorderState;
        if (!state) return;

        if (!state.dragging) {
            if (
                Math.abs(e.clientX - state.startX) < COLUMN_DRAG_THRESHOLD &&
                Math.abs(e.clientY - state.startY) < COLUMN_DRAG_THRESHOLD
            ) {
                return;
            }
            state.dragging = true;
            state.th.classList.add("is-dragging");
            this.shadowRoot
                .querySelector(".grid-container")
                ?.classList.add("is-col-dragging");
        }

        e.preventDefault();
        const target = this._reorderTargetAt(e.clientX, state.col.key);
        this._paintDropIndicator(target);
        state.targetKey = target?.key ?? null;
        state.placeAfter = target?.placeAfter ?? false;
    }

    _onColumnReorderStart(e, col, th) {
        if (e.button !== 0) return;
        // Ignore presses that begin on the resize handle or a header action
        // trigger — those own their own gestures.
        if (e.target.closest(".header-action-trigger, .col-resize-handle"))
            return;

        this._suppressHeaderClick = false;
        this._reorderState = {
            col,
            th,
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            dragging: false,
            targetKey: null,
            placeAfter: false,
        };
        // Capture so moves keep arriving as the pointer crosses sibling
        // headers; a tap without travel still emits its click for sorting.
        try {
            th.setPointerCapture(e.pointerId);
        } catch {
            /* non-capturable pointer */
        }
        th.addEventListener("pointermove", this._onColumnReorderMove);
        th.addEventListener("pointerup", this._onColumnReorderEnd);
        th.addEventListener("pointercancel", this._onColumnReorderEnd);
    }

    _onColumnResizeEnd() {
        const state = this._resizeState;
        if (!state) return;

        const { handle } = state;
        handle.removeEventListener("pointermove", this._onColumnResizeMove);
        handle.removeEventListener("pointerup", this._onColumnResizeEnd);
        handle.removeEventListener("pointercancel", this._onColumnResizeEnd);
        handle.classList.remove("is-active");

        try {
            handle.releasePointerCapture(state.pointerId);
        } catch {
            /* capture already gone */
        }

        this._resizeState = null;

        // A pure press with no travel is just a click on the handle — its own
        // stopPropagation keeps it off the sort handler, so don't commit/redraw.
        if (Math.round(state.width) === Math.round(state.startWidth)) return;

        // Committing re-renders synchronously; the pointer may have ended over
        // the header body (when shrinking), so swallow the trailing click that
        // would otherwise toggle the sort.
        this._suppressHeaderClick = true;
        this._setColumnWidth(state.col, state.width);
    }

    _onColumnResizeMove(e) {
        const state = this._resizeState;
        if (!state) return;

        const min = this._minWidthFor(state.col);
        const next = Math.max(
            min,
            Math.round(state.startWidth + (e.clientX - state.startX)),
        );
        state.width = next;
        if (state.colEl) state.colEl.style.width = `${next}px`;
    }

    _onColumnResizeStart(e, col, handle) {
        if (e.button !== 0) return;

        e.preventDefault();
        e.stopPropagation();
        const th = handle.closest("th");
        if (!th) return;

        this._suppressHeaderClick = false;
        const startWidth = th.getBoundingClientRect().width;
        this._resizeState = {
            col,
            handle,
            colEl: this._colElementFor(col.key),
            pointerId: e.pointerId,
            startX: e.clientX,
            startWidth,
            width: startWidth,
        };
        handle.classList.add("is-active");
        try {
            handle.setPointerCapture(e.pointerId);
        } catch {
            /* non-capturable pointer */
        }
        handle.addEventListener("pointermove", this._onColumnResizeMove);
        handle.addEventListener("pointerup", this._onColumnResizeEnd);
        handle.addEventListener("pointercancel", this._onColumnResizeEnd);
        this.shadowRoot
            .querySelector(".grid-container")
            ?.classList.add("is-col-resizing");
    }

    _onHeaderClick(key, event) {
        // A just-completed reorder drag emits a trailing click — swallow it so
        // the drop doesn't also toggle the sort.
        if (this._suppressHeaderClick) {
            this._suppressHeaderClick = false;
            return;
        }
        const multi = event.shiftKey;
        const existingIdx = this._sorts.findIndex((s) => s.column === key);

        if (multi) {
            if (existingIdx >= 0) {
                const next = SORT_CYCLE[this._sorts[existingIdx].direction];
                if (next === "none") this._sorts.splice(existingIdx, 1);
                else this._sorts[existingIdx].direction = next;
            } else {
                this._sorts.push({ column: key, direction: "asc" });
            }
        } else {
            if (existingIdx >= 0 && this._sorts.length === 1) {
                const next = SORT_CYCLE[this._sorts[0].direction];
                if (next === "none") this._sorts = [];
                else this._sorts[0].direction = next;
            } else {
                this._sorts = [{ column: key, direction: "asc" }];
            }
        }

        const top = this._sorts[0];
        const cancelled = !this._emitSortChange(
            top ? top.column : null,
            top ? top.direction : "none",
        );
        if (this.mode === "server" && cancelled) return;
        this._render();
    }

    _onPaginatorChange(e) {
        e.stopPropagation();
        const next = Number(e.detail?.page);
        if (!Number.isFinite(next) || next < 1) return;
        if (next === this._currentPage) return;

        const cancelled = !this._emitPageChange(next);
        if (this.mode === "server" && cancelled) return;
        this._currentPage = next;
        this._render();
    }

    _onPaginatorPageSize(e) {
        e.stopPropagation();
        const next = Number(e.detail?.pageSize ?? e.detail?.itemsPerPage);
        if (!Number.isFinite(next) || next < 1) return;
        if (next === this._pageSize) return;

        this._pageSize = next;
        this._currentPage = 1;
        this._emitPageChange(this._currentPage);
        this._render();
    }

    _onRowClick(row, rowKey, event) {
        if (this.enableSelection && (event.ctrlKey || event.metaKey)) {
            this._toggleRowSelection(row, rowKey, event);
            event.preventDefault();
        }
        this.dispatchEvent(
            new CustomEvent("row-click", {
                detail: { row, event },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _onRowDblClick(row, event) {
        this.dispatchEvent(
            new CustomEvent("row-dblclick", {
                detail: { row, event },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _onScroll(e) {
        const next = e.target.scrollTop;
        if (Math.abs(next - this._scrollTop) < this.rowHeight / 2) return;
        this._scrollTop = next;
        this._render();
    }

    _openColumnsSubmenu(triggerBtn) {
        const popover = this._columnsSubmenuPopover;
        if (!popover || popover.open) return;

        popover.innerHTML = "";
        const wrap = _el("div", {
            class: "header-menu header-submenu",
            role: "menu",
        });
        wrap.appendChild(this._buildHeaderMenuColumnList());
        popover.appendChild(wrap);

        popover.anchor = triggerBtn;
        triggerBtn.setAttribute("aria-expanded", "true");

        const onHide = () => {
            triggerBtn.setAttribute("aria-expanded", "false");
            popover.removeEventListener("popover-closed", onHide);
            this._applyPendingColumnVisibility();
        };
        popover.addEventListener("popover-closed", onHide);

        popover.show();
    }

    _openFilterPopover(col, triggerBtn) {
        if (!this._filterPopover) return;
        const popover = this._filterPopover;

        if (popover.open) {
            popover.hide("api");
            return;
        }

        popover.innerHTML = "";
        popover.appendChild(
            this._buildFilterPopoverContent(col, () => popover.hide("api")),
        );

        popover.anchor = triggerBtn;
        triggerBtn.setAttribute("aria-expanded", "true");

        const onDocClick = (e) => {
            const path = e.composedPath();
            const insidePortal = this._pathInsidePortal(path);
            const insideTrigger = path.includes(triggerBtn);
            if (!insidePortal && !insideTrigger) popover.hide("api");
        };
        document.addEventListener("click", onDocClick, true);

        const onHide = () => {
            triggerBtn.setAttribute("aria-expanded", "false");
            popover.removeEventListener("popover-closed", onHide);
            document.removeEventListener("click", onDocClick, true);
        };
        popover.addEventListener("popover-closed", onHide);

        popover.show();
    }

    _openHeaderMenu(col, triggerBtn) {
        if (!this._headerMenuPopover) return;
        const popover = this._headerMenuPopover;

        // Clicking the same trigger again toggles the menu closed.
        if (popover.open) {
            popover.hide("api");
            return;
        }

        // Reset & rebuild content for the targeted column.
        popover.innerHTML = "";
        popover.appendChild(
            this._buildHeaderMenuContent(col, () => popover.hide("api")),
        );

        popover.anchor = triggerBtn;
        triggerBtn.setAttribute("aria-expanded", "true");

        // Manual outside-click: clicks inside *any* portal surface (the menu
        // itself, a submenu, or a portaled y-select dropdown) and clicks on the
        // trigger itself count as "inside".
        const onDocClick = (e) => {
            const path = e.composedPath();
            const insidePortal = this._pathInsidePortal(path);
            const insideTrigger = path.includes(triggerBtn);
            if (!insidePortal && !insideTrigger) popover.hide("api");
        };
        document.addEventListener("click", onDocClick, true);

        const onHide = () => {
            triggerBtn.setAttribute("aria-expanded", "false");
            popover.removeEventListener("popover-closed", onHide);
            document.removeEventListener("click", onDocClick, true);
        };
        popover.addEventListener("popover-closed", onHide);

        popover.show();
    }

    _paintDropIndicator(target) {
        this.shadowRoot
            .querySelectorAll("thead th.drop-before, thead th.drop-after")
            .forEach((th) => th.classList.remove("drop-before", "drop-after"));
        if (!target) return;

        target.th.classList.add(
            target.placeAfter ? "drop-after" : "drop-before",
        );
    }

    _parseAttributes() {
        let tree;
        try {
            tree = JSON.parse(this.columns || "[]");
            if (!Array.isArray(tree)) tree = [];
        } catch {
            tree = [];
        }
        this._parsedColumnTree = tree;
        // Working tree preserves user-applied reorders + hides across re-renders;
        // rebuild it when the structural shape of `columns` changes.
        if (
            !this._workingTree.length ||
            !this._sameTreeShape(this._workingTree, tree)
        ) {
            this._workingTree = this._cloneColumnTree(tree);
        }
        this._parsedColumns = this._flattenColumnTree(this._workingTree);

        try {
            this._parsedData = JSON.parse(this.data || "[]");
            if (!Array.isArray(this._parsedData)) this._parsedData = [];
        } catch {
            this._parsedData = [];
        }
    }

    /**
     * True when an event path passes through any component's portal container.
     * Portaled surfaces (y-popover → `.y-popover-portal`, y-select →
     * `.y-select-portal`, etc.) live under `document.body` rather than inside
     * the grid, so a click in one must still count as "inside" for the manual
     * outside-click guards that keep the header/filter popovers open.
     */
    _pathInsidePortal(path) {
        return path.some((node) => {
            const classes = node?.classList;
            if (!classes) return false;
            for (const cls of classes) {
                if (cls.endsWith("-portal")) return true;
            }
            return false;
        });
    }

    _readEditorValue(editor, type) {
        if (type === "checkbox") return editor.checked;
        if (type === "number") {
            const n = Number(editor.value);
            return Number.isFinite(n) ? n : editor.value;
        }
        return editor.value;
    }

    _render() {
        const columns = this._parsedColumns;
        const filteredCount = this._getFilteredCount();
        const allEntries = this._buildRowEntries();
        const useVirtual = this._shouldVirtualize(allEntries);
        const { entries, leadingPx, trailingPx } = useVirtual
            ? this._windowEntries(allEntries)
            : { entries: allEntries, leadingPx: 0, trailingPx: 0 };

        this.setAttribute("role", "grid");
        this.setAttribute("aria-rowcount", String(filteredCount));
        this.setAttribute(
            "aria-colcount",
            String(columns.length + (this.enableSelection ? 1 : 0)),
        );
        if (this.loading) this.setAttribute("aria-busy", "true");
        else this.removeAttribute("aria-busy");

        this._teardownVirtualScroll();
        this.shadowRoot.innerHTML = "";

        const style = _el("style");
        style.textContent = this._buildStyles();
        this.shadowRoot.appendChild(style);

        const container = _el("div", {
            part: "grid-container",
            class: "grid-container",
        });

        const toolbarWrap = _el("div", {
            class: "header-toolbar",
            part: "header-toolbar",
        });
        const beforeSlot = _el("slot", { name: "header-before" });
        toolbarWrap.appendChild(beforeSlot);
        const syncToolbar = () => {
            const has = beforeSlot
                .assignedNodes({ flatten: true })
                .some(
                    (n) =>
                        !(
                            n.nodeType === Node.TEXT_NODE &&
                            n.textContent.trim() === ""
                        ),
                );
            toolbarWrap.classList.toggle("has-content", has);
        };
        beforeSlot.addEventListener("slotchange", syncToolbar);
        syncToolbar();
        container.appendChild(toolbarWrap);

        const afterHeaderSlot = _el("slot", { name: "header-after" });
        container.appendChild(afterHeaderSlot);

        const scroll = _el("div", { class: "grid-scroll" });
        if (this.virtual && this.viewportHeight > 0) {
            scroll.style.maxHeight = `${this.viewportHeight}px`;
        }
        const table = _el("table", { class: "grid-body" });
        table.appendChild(this._buildColgroup(columns));
        table.appendChild(this._buildHeader(columns));
        table.appendChild(
            this._buildBody(columns, entries, leadingPx, trailingPx),
        );

        scroll.appendChild(table);
        container.appendChild(scroll);

        const showPagination =
            this.enablePagination && this.groupBy.length === 0 && !useVirtual;
        const footerBefore = _el("slot", { name: "footer-before" });
        container.appendChild(footerBefore);

        const footer = this._buildFooter(filteredCount, showPagination);
        if (footer) container.appendChild(footer);

        const footerAfter = _el("slot", { name: "footer-after" });
        container.appendChild(footerAfter);

        if (this.loading) container.appendChild(this._buildLoadingOverlay());

        if (this.enableHeaderMenu) {
            this._headerMenuPopover = this._buildHeaderMenuPopover();
            this._columnsSubmenuPopover = this._buildColumnsSubmenuPopover();
            container.appendChild(this._headerMenuPopover);
            container.appendChild(this._columnsSubmenuPopover);

            // Closing the main menu also closes the submenu (which in turn
            // commits any staged column-visibility changes).
            this._headerMenuPopover.addEventListener("popover-closed", () => {
                this._columnsSubmenuPopover?.hide?.("api");
            });
        } else {
            this._headerMenuPopover = null;
            this._columnsSubmenuPopover = null;
        }

        if (this.filtering === "advanced") {
            this._filterPopover = this._buildFilterPopover();
            container.appendChild(this._filterPopover);
        } else {
            this._filterPopover = null;
        }

        this.shadowRoot.appendChild(container);

        if (useVirtual) this._setupVirtualScroll(scroll);
    }

    _renderCellValue(col, value) {
        const isBool = col.type === "checkbox" || typeof value === "boolean";
        const wrap = _el("span", {
            class: isBool ? "cell-value cell-value--boolean" : "cell-value",
        });
        if (isBool) {
            wrap.appendChild(
                _el("y-icon", {
                    name: value ? "check" : "x",
                    size: "small",
                    "aria-label": value ? "true" : "false",
                }),
            );
        } else {
            wrap.textContent = value == null ? "" : String(value);
        }
        return wrap;
    }

    _reorderTargetAt(clientX, sourceKey) {
        const ctx = this._findColumnContext(sourceKey);
        if (!ctx) return null;

        // Only leaf headers sharing the dragged column's parent group are valid
        // drop targets, and never the column itself.
        const targetKeys = new Set(
            ctx.siblings
                .filter((n) => !this._isColumnGroup(n) && n.key !== sourceKey)
                .map((n) => n.key),
        );
        const headers = [
            ...this.shadowRoot.querySelectorAll("thead th[data-col-key]"),
        ].filter((th) => targetKeys.has(th.dataset.colKey));

        for (const th of headers) {
            const rect = th.getBoundingClientRect();
            if (clientX < rect.left || clientX > rect.right) continue;
            return {
                key: th.dataset.colKey,
                th,
                placeAfter: clientX > rect.left + rect.width / 2,
            };
        }
        return null;
    }

    _rowKeyFor(row, idx) {
        const k = this.rowKey;
        if (k && row && row[k] != null) return String(row[k]);
        return `__idx:${idx}`;
    }

    _sameTreeShape(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            const x = a[i];
            const y = b[i];
            const xGroup = this._isColumnGroup(x);
            const yGroup = this._isColumnGroup(y);
            if (xGroup !== yGroup) return false;
            if (xGroup) {
                if (!this._sameTreeShape(x.children, y.children)) return false;
            } else if (x.key !== y.key) {
                return false;
            }
        }
        return true;
    }

    _setColumnFilter(key, value) {
        if (value == null || value === "") {
            delete this._columnFilters[key];
        } else {
            this._columnFilters[key] = value;
        }
        this._currentPage = 1;
        const cancelled = !this._emitFilterChange();
        if (this.mode === "server" && cancelled) return;
        this._render();
    }

    _setColumnWidth(col, width) {
        const node = this._findColumnContext(col.key)?.node || col;
        node.width = `${Math.round(width)}px`;
        this._emitColumnResize(col.key, Math.round(width));
        this._render();
    }

    _setSortFromMenu(key, direction) {
        const existingIdx = this._sorts.findIndex((s) => s.column === key);
        if (existingIdx >= 0) this._sorts[existingIdx].direction = direction;
        else this._sorts = [{ column: key, direction }];

        const cancelled = !this._emitSortChange(key, direction);
        if (this.mode === "server" && cancelled) return;
        this._render();
    }

    _setupVirtualScroll(scrollEl) {
        if (!scrollEl) return;
        this._scrollEl = scrollEl;
        scrollEl.scrollTop = this._scrollTop;
        scrollEl.addEventListener("scroll", this._onScroll, { passive: true });
        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver((entries) => {
                if (!this.isConnected) return;
                const entry = entries[0];
                const width = entry?.contentRect?.width ?? 0;
                const height = entry?.contentRect?.height ?? 0;
                if (
                    Math.abs(width - this._lastScrollWidth) < 1 &&
                    Math.abs(height - this._lastScrollHeight) < 1
                )
                    return;
                this._lastScrollWidth = width;
                this._lastScrollHeight = height;
                this._render();
            });
            this._lastScrollWidth = scrollEl.clientWidth;
            this._lastScrollHeight = scrollEl.clientHeight;
            this._resizeObserver.observe(scrollEl);
        }
    }

    _shouldVirtualize(entries) {
        if (!this.virtual) return false;
        if (this.viewportHeight <= 0) return false;
        if (this.groupBy.length > 0) return false;
        if (entries.length === 0) return false;
        return true;
    }

    _teardownVirtualScroll() {
        if (this._scrollEl) {
            this._scrollEl.removeEventListener("scroll", this._onScroll);
            this._scrollEl = null;
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }

    _toggleAllVisible(check, visibleKeys, visibleRows) {
        const previous = new Set(this._selectedKeys);
        if (check) visibleKeys.forEach((k) => this._selectedKeys.add(k));
        else visibleKeys.forEach((k) => this._selectedKeys.delete(k));

        if (!this._emitRowSelect({ rows: visibleRows, all: true })) {
            this._selectedKeys = previous;
            return;
        }
        this._render();
    }

    _toggleGroup(path) {
        const key = this._groupPathKey(path);
        const wasCollapsed = this._collapsedGroups.has(key);
        if (wasCollapsed) this._collapsedGroups.delete(key);
        else this._collapsedGroups.add(key);
        this._emitGroupToggle(path, wasCollapsed);
        this._render();
    }

    _toggleRowSelection(row, rowKey, event) {
        const previous = new Set(this._selectedKeys);

        if (this.selectionMode === "single") {
            if (this._selectedKeys.has(rowKey)) this._selectedKeys = new Set();
            else this._selectedKeys = new Set([rowKey]);
        } else {
            if (this._selectedKeys.has(rowKey))
                this._selectedKeys.delete(rowKey);
            else this._selectedKeys.add(rowKey);
        }

        if (!this._emitRowSelect(event)) {
            this._selectedKeys = previous;
            return;
        }
        this._render();
    }

    _windowEntries(entries) {
        const rowH = this.rowHeight;
        const viewport = this.viewportHeight;
        const buffer = this.bufferSize;
        const total = entries.length;
        const scrollTop = this._scrollTop;

        const firstVisible = Math.floor(scrollTop / rowH);
        const visibleCount = Math.ceil(viewport / rowH);
        const start = Math.max(0, firstVisible - buffer);
        const end = Math.min(total, firstVisible + visibleCount + buffer);

        return {
            entries: entries.slice(start, end),
            leadingPx: start * rowH,
            trailingPx: (total - end) * rowH,
        };
    }
}

if (!customElements.get("y-data-grid")) {
    customElements.define("y-data-grid", YumeDataGrid);
}
