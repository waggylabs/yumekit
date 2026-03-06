/**
 * Icon registry — a runtime map of icon names to SVG markup strings.
 *
 * Register only the icons you need for tree-shaking:
 *
 *   import { registerIcon } from "@waggylabs/yumekit";
 *   registerIcon("home", homeSvgString);
 *
 * Or register all bundled icons at once (separate import):
 *
 *   import "@waggylabs/yumekit/icons/all.js";
 */

const icons = new Map();

export function registerIcon(name, svg) {
    icons.set(name, svg);
}

export function registerIcons(entries) {
    for (const [name, svg] of Object.entries(entries)) {
        icons.set(name, svg);
    }
}

export function getIcon(name) {
    return icons.get(name) || "";
}
