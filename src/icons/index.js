/* ================================================================== */
/*  Centralized SVG icon strings for the YumeKit component library.   */
/*                                                                     */
/*  Each static icon also lives in its own .svg file in this directory */
/*  so it can be used standalone (e.g. <img src="…">, CSS background, */
/*  design tools, etc.).  The strings below mirror those files — keep  */
/*  them in sync when editing an icon.                                 */
/* ================================================================== */

/* ── Chevrons ─────────────────────────────────────────────────────── */

export const chevronRight = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

export const chevronDown = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

export const chevronDownLg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 7 L10 12 L15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" /></svg>`;

/* ── Double chevrons (collapse / expand) ──────────────────────────── */

export const collapseLeft = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>`;

export const expandRight = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>`;

/* ── Checkbox marks ───────────────────────────────────────────────── */

export const checkmark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="5 13 10 17 19 6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;

export const indeterminate = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="2" rx="1" ry="1" fill="currentColor"/></svg>`;

/* ── Menu (hamburger) ────────────────────────────────────────────── */

export const menu = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`;

/* ── Close / remove ───────────────────────────────────────────────── */

export const close = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"><line x1="6" y1="6" x2="14" y2="14" /><line x1="14" y1="6" x2="6" y2="14" /></svg>`;

/* ── Dynamic icons (parameterised — kept as functions) ────────────── */

/**
 * 3-dot grip handle for drawers.
 * @param {boolean} horizontal – true for left/right drawers, false for top/bottom.
 */
export function gripDots(horizontal) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${horizontal ? 4 : 20}" height="${horizontal ? 20 : 4}" viewBox="0 0 ${horizontal ? 4 : 20} ${horizontal ? 20 : 4}" fill="currentColor">
            ${
                horizontal
                    ? `<circle cx="2" cy="4"  r="1.5"/>
                   <circle cx="2" cy="10" r="1.5"/>
                   <circle cx="2" cy="16" r="1.5"/>`
                    : `<circle cx="4"  cy="2" r="1.5"/>
                   <circle cx="10" cy="2" r="1.5"/>
                   <circle cx="16" cy="2" r="1.5"/>`
            }
        </svg>`;
}

/**
 * Dual-arrow sort indicator for table headers.
 * @param {string} topColor  – fill for the up-arrow triangle.
 * @param {string} bottomColor – fill for the down-arrow triangle.
 */
export function sortArrows(topColor, bottomColor) {
    return `<svg class="sort-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" aria-hidden="true">
            <path d="M6 1 L11 7 L1 7 Z" fill="${topColor}"/>
            <path d="M6 15 L11 9 L1 9 Z" fill="${bottomColor}"/>
        </svg>`;
}
