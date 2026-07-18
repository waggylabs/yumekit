import { createElement as _el, clamp } from "./helpers.js";

// Shared skeleton-row generation for the table-shaped components (`y-table`,
// `y-data-grid`). Both render a `<tbody>` of placeholder rows built from
// `<y-skeleton variant="text">` cells while their data loads. Keeping the
// generation here means the two components stay visually consistent and the
// deterministic cell-width treatment lives in one place. The consuming
// component is responsible for importing `y-skeleton` so the element upgrades.

// Hard ceiling on generated rows so a large `pageSize` / `skeleton-rows` cannot
// paint hundreds of animated nodes.
export const MAX_SKELETON_ROWS = 50;

// Varied cell widths so a block of skeleton rows doesn't read as a uniform
// grid. Indexed deterministically by row/column position (never random) so the
// layout is stable across re-renders.
const CELL_WIDTHS = ["40%", "68%", "52%", "84%", "46%", "74%", "60%"];

/**
 * Clamp a requested skeleton-row count to a sane, positive range.
 * @param {number} requested
 * @param {number} [fallback=5] — used when `requested` isn't a finite number.
 * @returns {number}
 */
export function clampSkeletonRows(requested, fallback = 5) {
    const n = Number(requested);
    const base = Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
    return clamp(base, 1, MAX_SKELETON_ROWS);
}

/**
 * Deterministic placeholder width for the cell at `(rowIndex, colIndex)`.
 * @returns {string} a CSS percentage
 */
function cellWidth(rowIndex, colIndex) {
    const i = (rowIndex * 31 + colIndex * 17) % CELL_WIDTHS.length;
    return CELL_WIDTHS[i];
}

/**
 * Build a `<tbody part="skeleton-body">` of placeholder rows. The body is
 * marked `aria-hidden` so its contents are never announced as table data, and
 * wraps the generated rows in a `<slot name="skeleton">` so a consumer can
 * override the whole placeholder while keeping the generated rows as fallback.
 *
 * @param {Object} opts
 * @param {number} opts.columnCount — number of data columns (drives cells per row).
 * @param {number} opts.rows — placeholder row count (already clamped by the caller, but re-clamped defensively).
 * @param {boolean} [opts.leadingCell=false] — render an empty leading cell (e.g. a selection column) so cells line up.
 * @param {string|null} [opts.rowHeightCss=null] — CSS length applied as each row's height; omit to size from padding.
 * @returns {HTMLTableSectionElement}
 */
export function buildSkeletonBody({
    columnCount,
    rows,
    leadingCell = false,
    rowHeightCss = null,
}) {
    const count = clampSkeletonRows(rows);
    const cols = Math.max(1, Number(columnCount) || 1);

    const tbody = _el("tbody", {
        part: "skeleton-body",
        class: "skeleton-body",
        "aria-hidden": "true",
    });

    const slot = _el("slot", { name: "skeleton" });
    for (let r = 0; r < count; r++) {
        slot.appendChild(buildSkeletonRow(cols, r, leadingCell, rowHeightCss));
    }
    tbody.appendChild(slot);
    return tbody;
}

/**
 * Build a single placeholder `<tr>`.
 * @param {number} columnCount
 * @param {number} rowIndex
 * @param {boolean} leadingCell
 * @param {string|null} rowHeightCss
 * @returns {HTMLTableRowElement}
 */
function buildSkeletonRow(columnCount, rowIndex, leadingCell, rowHeightCss) {
    const tr = _el("tr", {
        part: "skeleton-row",
        class: "skeleton-row",
        "aria-hidden": "true",
    });
    if (rowHeightCss) tr.style.height = rowHeightCss;

    if (leadingCell) {
        tr.appendChild(
            _el("td", {
                part: "skeleton-cell",
                class: "skeleton-cell skeleton-cell--leading",
                "aria-hidden": "true",
            }),
        );
    }

    for (let c = 0; c < columnCount; c++) {
        const cell = _el("td", {
            part: "skeleton-cell",
            class: "skeleton-cell",
            "aria-hidden": "true",
        });
        cell.appendChild(
            _el("y-skeleton", {
                variant: "text",
                width: cellWidth(rowIndex, c),
            }),
        );
        tr.appendChild(cell);
    }
    return tr;
}
