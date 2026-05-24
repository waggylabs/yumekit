import { getIcon } from "../icons/registry.js";

// Allowlist-based SVG sanitizer — only known-safe elements and attributes are
// kept. Used to gate any SVG markup that originates outside this package
// (registered via `registerIcon(name, svg)`) before it touches innerHTML.

const ALLOWED_ELEMENTS = new Set([
    "svg",
    "g",
    "path",
    "circle",
    "ellipse",
    "rect",
    "line",
    "polyline",
    "polygon",
    "text",
    "tspan",
    "defs",
    "clippath",
    "mask",
    "lineargradient",
    "radialgradient",
    "stop",
    "symbol",
    "title",
    "desc",
    "metadata",
]);

const ALLOWED_ATTRS = new Set([
    "viewbox",
    "xmlns",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "stroke-dashoffset",
    "stroke-miterlimit",
    "stroke-opacity",
    "fill-opacity",
    "fill-rule",
    "clip-rule",
    "opacity",
    "d",
    "cx",
    "cy",
    "r",
    "rx",
    "ry",
    "x",
    "x1",
    "x2",
    "y",
    "y1",
    "y2",
    "width",
    "height",
    "points",
    "transform",
    "id",
    "class",
    "clip-path",
    "mask",
    "offset",
    "stop-color",
    "stop-opacity",
    "gradient-units",
    "gradienttransform",
    "gradientunits",
    "spreadmethod",
    "patternunits",
    "patterntransform",
    "font-size",
    "font-family",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
    "alignment-baseline",
    "dx",
    "dy",
    "rotate",
    "textlength",
    "lengthadjust",
    "display",
    "visibility",
    "color",
    "vector-effect",
]);

/**
 * Strip every element and attribute not in the allowlist from an SVG string.
 * Returns an empty string for falsy input or markup with no `<svg>` root.
 *
 * @param {string} raw — raw SVG markup
 * @returns {string} — sanitized SVG markup
 */
export function sanitizeSvg(raw) {
    if (!raw) return "";
    const doc = new DOMParser().parseFromString(raw, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return "";

    const walk = (el) => {
        for (const child of [...el.children]) {
            if (!ALLOWED_ELEMENTS.has(child.tagName.toLowerCase())) {
                child.remove();
                continue;
            }
            for (const attr of [...child.attributes]) {
                if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
                    child.removeAttribute(attr.name);
                }
            }
            walk(child);
        }
    };

    for (const attr of [...svg.attributes]) {
        if (!ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
            svg.removeAttribute(attr.name);
        }
    }
    walk(svg);
    return svg.outerHTML;
}

// Per-name cache so each registered icon is parsed and sanitized at most once
// across all consumers (y-icon, y-rating, ...).
const sanitizedSvgCache = new Map();

/**
 * Look up a registered icon by name and return its sanitized SVG markup.
 * Result is memoized — repeated calls with the same name reuse the cached
 * sanitized string.
 *
 * @param {string} name — registered icon name
 * @returns {string} — sanitized SVG markup, or `""` if the name is unknown
 */
export function getSanitizedIcon(name) {
    if (sanitizedSvgCache.has(name)) return sanitizedSvgCache.get(name);
    const result = sanitizeSvg(getIcon(name));
    sanitizedSvgCache.set(name, result);
    return result;
}
