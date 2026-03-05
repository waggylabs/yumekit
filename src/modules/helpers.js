/**
 * Return a [background, foreground] CSS variable pair for a color scheme.
 * Background is `--{color}-content--`, foreground is `--{color}-content-inverse`.
 * @param {string} color — one of base, primary, secondary, success, warning, error, help
 * @param {string} [fallbackColor="base"] — color to fall back to when `color` is unrecognised.
 *   Use `null` to pass the raw `color` string through as the background instead.
 * @returns {[string, string]} — [bg var, fg var]
 */
export function getColorVarPair(color, fallbackColor = "base") {
    const map = {
        base: ["var(--base-content--)", "var(--base-content-inverse)"],
        primary: ["var(--primary-content--)", "var(--primary-content-inverse)"],
        secondary: [
            "var(--secondary-content--)",
            "var(--secondary-content-inverse)",
        ],
        success: ["var(--success-content--)", "var(--success-content-inverse)"],
        warning: ["var(--warning-content--)", "var(--warning-content-inverse)"],
        error: ["var(--error-content--)", "var(--error-content-inverse)"],
        help: ["var(--help-content--)", "var(--help-content-inverse)"],
    };
    if (map[color]) return map[color];
    if (fallbackColor === null) return [color, "var(--base-content-inverse)"];
    return map[fallbackColor] || map.base;
}

// helpers/slot-utils.js
export function hideEmptySlotContainers(shadowRoot, slotsConfig = {}) {
    Object.entries(slotsConfig).forEach(([slotName, containerSelector]) => {
        const slot = shadowRoot.querySelector(
            `slot${slotName ? `[name="${slotName}"]` : ":not([name])"}`,
        );
        const container = shadowRoot.querySelector(containerSelector);

        if (slot && container) {
            const assigned = slot
                .assignedNodes({ flatten: true })
                .filter((n) => {
                    return !(
                        n.nodeType === Node.TEXT_NODE &&
                        n.textContent.trim() === ""
                    );
                });

            container.style.display = assigned.length > 0 ? "" : "none";
        }
    });
}

/**
 * Resolve a CSS custom-property value to a concrete color string.
 * Reads from the given element's computed style.
 * @param {string} varExpr — e.g. "var(--primary-content--)"
 * @param {HTMLElement} el — element to resolve against
 * @returns {string} — resolved color or fallback
 */
export function resolveCSSColor(varExpr, el) {
    const match = varExpr.match(/var\(\s*(--[^,)]+)/);
    if (!match) return varExpr;
    const val = getComputedStyle(el).getPropertyValue(match[1]).trim();
    return val || varExpr;
}

/**
 * Parse a CSS color string (#hex, rgb(), etc.) to {r, g, b}.
 * Returns null if it can't parse.
 */
export function parseColor(colorStr) {
    // #RGB, #RRGGBB, #RRGGBBAA
    const hexMatch = colorStr.match(
        /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
    );
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length <= 4) {
            hex = hex
                .split("")
                .map((c) => c + c)
                .join("");
        }
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
        };
    }
    // rgb(r, g, b) or rgba(r, g, b, a)
    const rgbMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbMatch) {
        return {
            r: parseInt(rgbMatch[1], 10),
            g: parseInt(rgbMatch[2], 10),
            b: parseInt(rgbMatch[3], 10),
        };
    }
    return null;
}

/**
 * Compute relative luminance of an {r,g,b} color (0-255 range).
 * Returns a value between 0 (black) and 1 (white).
 */
export function luminance({ r, g, b }) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Given a background color string, return a CSS value for best contrast text.
 * Uses WCAG relative luminance to pick dark or light, referencing theme tokens
 * (--neutral-black / --neutral-white) with hardcoded fallbacks.
 * @param {string} bgColor — any CSS color string (#hex, rgb(), etc.)
 * @returns {string} CSS var() expression for contrasting text color
 */
export function contrastTextColor(bgColor) {
    const parsed = parseColor(bgColor);
    if (!parsed) return "var(--neutral-white, #ffffff)";
    return luminance(parsed) > 0.179
        ? "var(--neutral-black, #000000)"
        : "var(--neutral-white, #ffffff)";
}
