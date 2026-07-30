// =============================================================================
// Floating-element positioning
// =============================================================================
//
// Shared utility used by anchored, floating components (y-popover, y-help,
// future datepicker/menu/combobox dropdowns) so each consumer does not
// re-implement collision detection and cross-axis shifting from scratch.
//
// `computePosition` returns viewport coordinates for the floating element
// plus the side it actually landed on and the resolved alignment, so a
// caller (e.g. a pointer/arrow renderer) can react to flip/shift decisions.
//
// Strategy: try the requested side first; if it collides with the viewport,
// flip to the opposite side, then try the two perpendicular sides. If none
// fit, return the candidate that covers the largest visible area and let
// the caller (which knows about the pointer) decide whether to hide it.

export const MAIN_SIDES = ["top", "bottom", "left", "right"];

const ALIGN_OPPOSITE = { start: "end", end: "start", center: "center" };

const OPPOSITE_SIDE = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
};

const PERPENDICULAR_SIDES = {
    top: ["right", "left"],
    bottom: ["right", "left"],
    left: ["bottom", "top"],
    right: ["bottom", "top"],
};

// Default fallback order for `position: "auto"` — bottom first because that
// is the most common reading-flow placement, then top, then horizontal sides.
const AUTO_FALLBACK_ORDER = ["bottom", "top", "right", "left"];

/**
 * Parse a position string into a main side and cross-axis alignment.
 * Accepts the 4 main sides, the 8 aligned variants (`top-start`,
 * `top-end`, `bottom-start`, …), and `"auto"`. Unknown inputs collapse
 * to the supplied default.
 *
 * @param {string} position
 * @param {{ side: string, align: "start" | "center" | "end" }} fallback
 * @returns {{ side: string, align: "start" | "center" | "end", auto: boolean }}
 */
export function parsePosition(position, fallback = { side: "bottom", align: "center" }) {
    if (position === "auto") {
        return { side: fallback.side, align: fallback.align, auto: true };
    }
    if (!position || typeof position !== "string") {
        return { ...fallback, auto: false };
    }
    const [side, align = "center"] = position.split("-");
    if (!MAIN_SIDES.includes(side)) return { ...fallback, auto: false };
    if (!["start", "center", "end"].includes(align)) {
        return { side, align: "center", auto: false };
    }

    return { side, align, auto: false };
}

/**
 * Compute the floating element's viewport coordinates for the requested
 * placement against the anchor rect.
 *
 * @param {DOMRect} anchorRect — anchor's bounding client rect
 * @param {{ width: number, height: number }} floatingSize — floating element's measured size
 * @param {Object} [options]
 * @param {string}  [options.position="bottom"] — main side or aligned variant
 * @param {number}  [options.offset=8]           — gap between anchor edge and floating edge
 * @param {number}  [options.viewportPadding=8]  — minimum gap from viewport edges
 * @param {{ width: number, height: number }} [options.viewport] — defaults to `window.innerWidth/innerHeight`
 * @returns {{ top: number, left: number, side: string, align: string, fits: boolean }}
 */
export function computePosition(anchorRect, floatingSize, options = {}) {
    const {
        position = "bottom",
        offset = 8,
        viewportPadding = 8,
        viewport,
    } = options;

    const vw = viewport ? viewport.width : window.innerWidth;
    const vh = viewport ? viewport.height : window.innerHeight;

    const { side: requestedSide, align, auto } = parsePosition(position);
    const candidates = candidateSides(requestedSide, auto);

    let best = null;
    let bestScore = -Infinity;

    for (const candidate of candidates) {
        const placed = placementFor(
            candidate,
            align,
            anchorRect,
            floatingSize,
            offset,
        );
        const shifted = shiftInBounds(
            placed,
            candidate,
            floatingSize,
            vw,
            vh,
            viewportPadding,
            anchorRect,
        );
        const fits = fitsInViewport(
            shifted,
            floatingSize,
            vw,
            vh,
            viewportPadding,
        );
        if (fits) {
            return {
                top: shifted.top,
                left: shifted.left,
                side: candidate,
                align,
                fits: true,
            };
        }
        // Score = visible area inside the viewport. Lets us fall back to the
        // best-fit candidate when no side fully fits.
        const score = visibleArea(shifted, floatingSize, vw, vh);
        if (score > bestScore) {
            bestScore = score;
            best = {
                top: shifted.top,
                left: shifted.left,
                side: candidate,
                align,
                fits: false,
            };
        }
    }

    return best;
}

/**
 * Build the ordered list of sides to try when resolving placement.
 * `auto` walks the global fallback order; an explicit side flips to its
 * opposite first (so `"top"` tries `top → bottom → right → left`) and then
 * to the two perpendicular sides.
 *
 * @param {string} requestedSide
 * @param {boolean} auto
 * @returns {string[]}
 */
export function candidateSides(requestedSide, auto) {
    if (auto) return AUTO_FALLBACK_ORDER.slice();

    const order = [requestedSide];
    const opposite = OPPOSITE_SIDE[requestedSide];
    if (opposite && !order.includes(opposite)) order.push(opposite);
    for (const p of PERPENDICULAR_SIDES[requestedSide] || []) {
        if (!order.includes(p)) order.push(p);
    }

    return order;
}

/**
 * Anchor-relative coordinate for the pointer along the popover's edge so it
 * stays centered on the anchor's midpoint, capped at the popover's edges so
 * the pointer never juts past the surface.
 *
 * @param {string} side — `"top" | "bottom" | "left" | "right"`
 * @param {DOMRect} anchorRect
 * @param {{ top: number, left: number }} placement — final popover coordinates
 * @param {{ width: number, height: number }} floatingSize
 * @param {number} pointerSize — pointer (rotated-square) edge length in px
 * @returns {{ axis: "x" | "y", offset: number }}
 */
export function pointerOffsetFor(side, anchorRect, placement, floatingSize, pointerSize) {
    const half = pointerSize / 2;

    if (side === "top" || side === "bottom") {
        const anchorCenter = anchorRect.left + anchorRect.width / 2;
        const raw = anchorCenter - placement.left - half;
        const max = floatingSize.width - pointerSize - half;
        return { axis: "x", offset: Math.max(half, Math.min(max, raw)) };
    }

    const anchorCenter = anchorRect.top + anchorRect.height / 2;
    const raw = anchorCenter - placement.top - half;
    const max = floatingSize.height - pointerSize - half;
    return { axis: "y", offset: Math.max(half, Math.min(max, raw)) };
}

// -----------------------------------------------------------------------------
// Internal helpers
// -----------------------------------------------------------------------------

function placementFor(side, align, anchor, size, offset) {
    const crossX = crossAxisStart(align, anchor.left, anchor.width, size.width);
    const crossY = crossAxisStart(align, anchor.top, anchor.height, size.height);

    switch (side) {
        case "top":
            return { top: anchor.top - size.height - offset, left: crossX };
        case "left":
            return { top: crossY, left: anchor.left - size.width - offset };
        case "right":
            return { top: crossY, left: anchor.right + offset };
        case "bottom":
        default:
            return { top: anchor.bottom + offset, left: crossX };
    }
}

function crossAxisStart(align, anchorStart, anchorSize, floatingSize) {
    if (align === "start") return anchorStart;
    if (align === "end") return anchorStart + anchorSize - floatingSize;

    return anchorStart + anchorSize / 2 - floatingSize / 2;
}

function shiftInBounds(placement, side, size, vw, vh, pad, anchorRect) {
    // Skip shift when the anchor itself sits fully outside the viewport.
    // Otherwise the cross-axis clamp would pin the popover to a visible
    // edge that is nowhere near the (off-screen) anchor — e.g. an anchor
    // 3000px down a scrollable docs page would leave the popover stuck at
    // viewport edge, far above where the user expects it.
    if (anchorRect) {
        const anchorVisible =
            anchorRect.bottom > 0 &&
            anchorRect.top < vh &&
            anchorRect.right > 0 &&
            anchorRect.left < vw;
        if (!anchorVisible) return placement;
    }

    // Only shift along the cross axis — moving along the main axis would
    // detach the popover from its anchor and the caller would need to know
    // about it. Flip-on-collision is the right tool for main-axis overflow.
    if (side === "top" || side === "bottom") {
        const maxLeft = vw - size.width - pad;
        const left = Math.max(pad, Math.min(maxLeft, placement.left));
        return { top: placement.top, left };
    }

    const maxTop = vh - size.height - pad;
    const top = Math.max(pad, Math.min(maxTop, placement.top));
    return { top, left: placement.left };
}

function fitsInViewport(placement, size, vw, vh, pad) {
    return (
        placement.top >= pad &&
        placement.left >= pad &&
        placement.top + size.height <= vh - pad &&
        placement.left + size.width <= vw - pad
    );
}

function visibleArea(placement, size, vw, vh) {
    const left = Math.max(0, placement.left);
    const top = Math.max(0, placement.top);
    const right = Math.min(vw, placement.left + size.width);
    const bottom = Math.min(vh, placement.top + size.height);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
}

/**
 * Viewport offset of the nearest ancestor that establishes a containing block
 * for `position: fixed`, so a caller can subtract it from computed viewport
 * coordinates before writing them to `top` / `left`.
 *
 * Per the CSS Transforms spec, `transform`, `perspective`, `filter`,
 * `backdrop-filter`, `will-change` on any of those, and the paint/layout
 * `contain` values all make an element the containing block for its fixed
 * descendants — at which point `top: 0` means the ancestor's corner, not the
 * viewport's. Storybook's docs preview wraps every story in such a div (with an
 * *identity* transform, which still counts), so a floating surface anchored
 * there lands offset by the wrapper's position unless this is compensated for.
 *
 * The walk crosses shadow boundaries via `getRootNode().host`. `parentElement`
 * alone returns null at a shadow root, so a component floating from inside its
 * own shadow tree would never see the transformed ancestor in the light DOM and
 * would silently mis-place the surface.
 *
 * @param {Element} el — the element whose ancestry to search (exclusive)
 * @returns {{x: number, y: number}} — viewport top-left, or (0, 0) if none
 */
export function containingBlockOffset(el) {
    let node = flatParent(el);

    while (node) {
        if (node.nodeType === Node.ELEMENT_NODE && establishesContainingBlock(node)) {
            const rect = node.getBoundingClientRect();
            return { x: rect.left, y: rect.top };
        }
        node = flatParent(node);
    }

    return { x: 0, y: 0 };
}

/** Next node up the flattened tree, stepping out of shadow roots at their host. */
function flatParent(node) {
    if (!node) return null;
    const parent = node.parentNode;
    if (!parent) {
        // A shadow root reached as a node rather than through parentNode.
        const root = node.getRootNode?.();
        return root instanceof ShadowRoot ? root.host : null;
    }
    if (parent instanceof ShadowRoot) return parent.host;
    if (parent.nodeType === Node.DOCUMENT_NODE) return null;
    return parent;
}

function establishesContainingBlock(el) {
    const cs = getComputedStyle(el);
    const willChange = cs.willChange || "";
    const contain = cs.contain || "";

    return (
        cs.transform !== "none" ||
        cs.perspective !== "none" ||
        cs.filter !== "none" ||
        cs.backdropFilter !== "none" ||
        willChange.includes("transform") ||
        willChange.includes("filter") ||
        willChange.includes("perspective") ||
        contain.includes("paint") ||
        contain.includes("layout") ||
        contain.includes("strict") ||
        contain.includes("content")
    );
}

// Re-export for callers that want to introspect the alignment options.
export const ALIGN_VALUES = ["start", "center", "end"];
// Kept private but exported for tests / internal access.
export const _internal = {
    placementFor,
    crossAxisStart,
    shiftInBounds,
    fitsInViewport,
    visibleArea,
    ALIGN_OPPOSITE,
    OPPOSITE_SIDE,
    PERPENDICULAR_SIDES,
    AUTO_FALLBACK_ORDER,
};
