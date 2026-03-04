/**
 * Icon registry — a runtime map of icon names to SVG markup strings.
 *
 * Consumers register only the icons they need for tree-shaking:
 *
 *   import { registerIcon } from "yumekit/icons/registry.js";
 *   import home from "yumekit/icons/home.svg";
 *   registerIcon("home", home);
 *
 * Or register all bundled icons at once:
 *
 *   import "yumekit/icons/all.js";
 */

const icons = {};

export function registerIcon(name, svg) {
    icons[name] = svg;
}

export function registerIcons(entries) {
    for (const [name, svg] of Object.entries(entries)) {
        icons[name] = svg;
    }
}

export function getIcon(name) {
    return icons[name] || "";
}

export { icons };
