import { arrowUp, arrowDown } from "../../icons/index.js";
import { coerceRichData, upgradeProperties } from "../../modules/helpers.js";

export class YumeTable extends HTMLElement {
    static get observedAttributes() {
        return ["columns", "data", "striped", "size"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._sortField = null;
        this._sortDir = "none";
        this._parsedData = [];
        this._parsedColumns = [];
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "columns") this._parsedColumns = coerceRichData(newVal);
        if (name === "data") this._parsedData = coerceRichData(newVal);
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Column definitions as an array of { field, header?, sortable? } objects. Rich data held as a property (identity preserved, not serialized); the `columns` attribute seeds an initial value (JSON string) but is not kept in sync after an imperative set. */
    get columns() { return Array.isArray(this._parsedColumns) ? this._parsedColumns : []; }
    set columns(val) {
        this._parsedColumns = coerceRichData(val);
        this.render();
    }

    /** Row data as an array of objects keyed by column field names. Rich data held as a property (identity preserved, not serialized); the `data` attribute seeds an initial value (JSON string) but is not kept in sync after an imperative set. */
    get data() { return Array.isArray(this._parsedData) ? this._parsedData : []; }
    set data(val) {
        this._parsedData = coerceRichData(val);
        this.render();
    }

    /** Cell padding size: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** Whether to show alternating row backgrounds. */
    get striped() { return this.hasAttribute("striped"); }
    set striped(val) {
        if (val) this.setAttribute("striped", "");
        else this.removeAttribute("striped");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const columns = this.columns;
        const rows = this._getSortedData();

        this.shadowRoot.innerHTML = "";

        const style = document.createElement("style");
        style.textContent = this._buildStyles();
        this.shadowRoot.appendChild(style);

        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper";

        const table = document.createElement("table");
        table.setAttribute("role", "grid");
        table.setAttribute("part", "table");

        table.appendChild(this._buildHeader(columns));
        table.appendChild(this._buildBody(columns, rows));

        wrapper.appendChild(table);
        this.shadowRoot.appendChild(wrapper);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildBody(columns, rows) {
        const tbody = document.createElement("tbody");

        rows.forEach((row) => {
            const tr = document.createElement("tr");
            tr.setAttribute("part", "row");
            columns.forEach((col, colIdx) => {
                const td = document.createElement("td");
                td.setAttribute("part", "cell");
                if (col.rowHeader || colIdx === 0) {
                    td.classList.add("row-header");
                }
                td.textContent = row[col.field] ?? "";
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        return tbody;
    }

    _buildHeader(columns) {
        const thead = document.createElement("thead");
        thead.setAttribute("part", "header");
        const headerRow = document.createElement("tr");

        columns.forEach((col) => {
            const th = document.createElement("th");
            th.setAttribute("scope", "col");

            const sortable = col.sortable !== false;
            if (sortable) {
                th.classList.add("sortable");
                th.setAttribute(
                    "aria-sort",
                    this._sortField === col.field
                        ? this._sortDir === "asc"
                            ? "ascending"
                            : this._sortDir === "desc"
                                ? "descending"
                                : "none"
                        : "none",
                );
                th.addEventListener("click", () => this._onHeaderClick(col.field));
            }

            const inner = document.createElement("span");
            inner.className = "th-content";
            inner.textContent = col.header || col.field;

            if (sortable) {
                const icon = this._sortIcon(col.field);
                const iconSpan = document.createElement("span");
                iconSpan.className = "sort-icon";
                if (icon) {
                    iconSpan.innerHTML = icon;
                } else {
                    iconSpan.classList.add("sort-icon--placeholder");
                }
                inner.appendChild(iconSpan);
            }

            th.appendChild(inner);
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        return thead;
    }

    _buildStyles() {
        const paddingVar = `var(--component-table-padding-${this.size}, 8px)`;
        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                color: var(--component-table-color, #f7f7fa);
            }

            .table-wrapper {
                overflow-x: auto;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                table-layout: auto;
            }

            thead th {
                position: relative;
                padding: ${paddingVar};
                text-align: left;
                font-weight: 400;
                font-size: var(--font-size-paragraph, 1em);
                white-space: nowrap;
                background: transparent;
                border-bottom: var(--component-table-border-width-header, 2px) solid var(--component-table-border-color, #37383a);
                user-select: none;
            }

            thead th.sortable {
                cursor: pointer;
            }

            thead th.sortable:hover {
                background: var(--component-table-hover-background, #292a2b);
            }

            .th-content {
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .sort-icon {
                flex-shrink: 0;
                vertical-align: middle;
            }

            .sort-icon svg {
                width: 14px;
                height: 14px;
            }

            .sort-icon--placeholder {
                visibility: hidden;
                width: 14px;
                height: 14px;
                display: inline-block;
            }

            tbody td {
                padding: ${paddingVar};
                font-size: var(--font-size-paragraph, 1em);
                border-bottom: var(--component-table-border-width, 2px) solid var(--component-table-border-color, #37383a);
            }

            tbody tr:last-child td {
                border-bottom: none;
            }

            tbody td.row-header {
                font-weight: 400;
            }

            ${this.striped
                ? `tbody tr:nth-child(even) {
                background: var(--component-table-hover-background, #292a2b);
            }`
                : ""}

            tbody tr:hover {
                background: var(--component-table-active-background, #46474a);
            }
        `;
    }

    _getSortedData() {
        const data = [...this.data];
        if (!this._sortField || this._sortDir === "none") return data;

        const dir = this._sortDir === "asc" ? 1 : -1;
        const field = this._sortField;

        return data.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === "number" && typeof bVal === "number") {
                return (aVal - bVal) * dir;
            }

            return String(aVal).localeCompare(String(bVal)) * dir;
        });
    }

    _onHeaderClick(field) {
        if (this._sortField === field) {
            this._sortDir =
                this._sortDir === "asc"
                    ? "desc"
                    : this._sortDir === "desc"
                        ? "none"
                        : "asc";
            if (this._sortDir === "none") this._sortField = null;
        } else {
            this._sortField = field;
            this._sortDir = "asc";
        }

        this.dispatchEvent(new CustomEvent("sort", {
            detail: { field: this._sortField, direction: this._sortDir },
            bubbles: true,
            composed: true,
        }));

        this.render();
    }

    _sortIcon(field) {
        const active = this._sortField === field;
        const dir = active ? this._sortDir : "none";
        if (dir === "none") return "";
        return dir === "asc" ? arrowUp : arrowDown;
    }
}

if (!customElements.get("y-table")) {
    customElements.define("y-table", YumeTable);
}
