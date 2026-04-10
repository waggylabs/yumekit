// =============================================================================
// Color utilities
// =============================================================================

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
    // Custom CSS color (hex, rgb/rgba, hsl/hsla) — use raw value with auto-contrasted text
    if (
        color &&
        (color.startsWith("#") ||
            color.startsWith("rgb") ||
            color.startsWith("hsl"))
    ) {
        return [color, contrastTextColor(color)];
    }
    if (fallbackColor === null) return [color, "var(--base-content-inverse)"];
    return map[fallbackColor] || map.base;
}

// =============================================================================
// Clamping
// =============================================================================

/**
 * Clamp a number between a min and max value.
 * @param {number} v
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

// =============================================================================
// HSV / HSL / RGB conversion utilities
// =============================================================================

/** Convert HSV (h 0-360, s 0-100, v 0-100) to RGB [0-255, 0-255, 0-255]. */
export function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    v /= 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
}

/** Convert RGB (0-255 each) to HSV [h 0-360, s 0-100, v 0-100]. */
export function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
    }
    const s = max === 0 ? 0 : (d / max) * 100;
    const v = max * 100;
    return [Math.round(h), Math.round(s), Math.round(v)];
}

/** Convert HSV (h 0-360, s 0-100, v 0-100) to HSL [h, s 0-100, l 0-100]. */
export function hsvToHsl(h, s, v) {
    s /= 100;
    v /= 100;
    const l = v * (1 - s / 2);
    const sl = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
    return [Math.round(h), Math.round(sl * 100), Math.round(l * 100)];
}

/** Convert HSL (h 0-360, s 0-100, l 0-100) to HSV [h, s 0-100, v 0-100]. */
export function hslToHsv(h, s, l) {
    s /= 100;
    l /= 100;
    const v = l + s * Math.min(l, 1 - l);
    const sv = v === 0 ? 0 : 2 * (1 - l / v);
    return [Math.round(h), Math.round(sv * 100), Math.round(v * 100)];
}

/** Convert RGB (0-255 each) to a hex string like "#ff0000". */
export function rgbToHex(r, g, b) {
    return (
        "#" +
        [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
    );
}

/** Convert RGBA to a hex8 string like "#ff000080". */
export function rgbaToHex(r, g, b, a) {
    const alpha = Math.round(a * 255);
    return rgbToHex(r, g, b) + alpha.toString(16).padStart(2, "0");
}

/**
 * Parse a hex color string to {r, g, b, a}. Supports #RGB, #RGBA, #RRGGBB, #RRGGBBAA.
 * @returns {{r:number, g:number, b:number, a:number}|null}
 */
export function parseHexColor(hex) {
    hex = hex.replace(/^#/, "");
    let r,
        g,
        b,
        a = 1;
    if (hex.length === 3 || hex.length === 4) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
        if (hex.length === 4) a = parseInt(hex[3] + hex[3], 16) / 255;
    } else if (hex.length === 6 || hex.length === 8) {
        r = parseInt(hex.slice(0, 2), 16);
        g = parseInt(hex.slice(2, 4), 16);
        b = parseInt(hex.slice(4, 6), 16);
        if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
    } else {
        return null;
    }
    if ([r, g, b].some(isNaN)) return null;
    return { r, g, b, a: isNaN(a) ? 1 : a };
}

/**
 * Parse any supported CSS color string to {r, g, b, a}.
 * Supports: #hex, rgb(), rgba(), hsl(), hsla(), hsv(), hsva().
 * @param {string} str
 * @returns {{r:number, g:number, b:number, a:number}|null}
 */
export function parseColorString(str) {
    if (!str || typeof str !== "string") return null;
    str = str.trim();

    if (str.startsWith("#")) {
        return parseHexColor(str);
    }

    const rgbMatch = str.match(
        /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/i,
    );
    if (rgbMatch) {
        return {
            r: clamp(parseInt(rgbMatch[1], 10), 0, 255),
            g: clamp(parseInt(rgbMatch[2], 10), 0, 255),
            b: clamp(parseInt(rgbMatch[3], 10), 0, 255),
            a:
                rgbMatch[4] !== undefined
                    ? clamp(parseFloat(rgbMatch[4]), 0, 1)
                    : 1,
        };
    }

    const hslMatch = str.match(
        /^hsla?\(\s*(\d+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*([\d.]+))?\s*\)$/i,
    );
    if (hslMatch) {
        const h = clamp(parseInt(hslMatch[1], 10), 0, 360);
        const s = clamp(parseFloat(hslMatch[2]), 0, 100);
        const l = clamp(parseFloat(hslMatch[3]), 0, 100);
        const a =
            hslMatch[4] !== undefined
                ? clamp(parseFloat(hslMatch[4]), 0, 1)
                : 1;
        const [hv, sv, vv] = hslToHsv(h, s, l);
        const [r, g, b] = hsvToRgb(hv, sv, vv);
        return { r, g, b, a };
    }

    const hsvMatch = str.match(
        /^hsva?\(\s*(\d+)\s*,\s*([\d.]+)%?\s*,\s*([\d.]+)%?\s*(?:,\s*([\d.]+))?\s*\)$/i,
    );
    if (hsvMatch) {
        const h = clamp(parseInt(hsvMatch[1], 10), 0, 360);
        const s = clamp(parseFloat(hsvMatch[2]), 0, 100);
        const v = clamp(parseFloat(hsvMatch[3]), 0, 100);
        const a =
            hsvMatch[4] !== undefined
                ? clamp(parseFloat(hsvMatch[4]), 0, 1)
                : 1;
        const [r, g, b] = hsvToRgb(h, s, v);
        return { r, g, b, a };
    }

    return null;
}

// =============================================================================
// DOM utilities
// =============================================================================

/**
 * Watch a label slot inside a wrapper element and toggle the wrapper's
 * visibility based on whether the slot has meaningful content.
 * CSS should default the wrapper to `display: none`.
 * @param {HTMLElement} labelWrapper — the wrapper element containing the slot
 */
export function manageLabelVisibility(labelWrapper) {
    if (!labelWrapper) return;
    const slot = labelWrapper.querySelector("slot[name='label']");
    if (!slot) return;

    slot.addEventListener("slotchange", () => {
        const hasContent = slot
            .assignedNodes({ flatten: true })
            .some(
                (n) =>
                    !(
                        n.nodeType === Node.TEXT_NODE &&
                        n.textContent.trim() === ""
                    ),
            );
        labelWrapper.style.display = hasContent ? "flex" : "";
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

// =============================================================================
// Slot utilities
// =============================================================================

/**
 * Show or hide wrapper elements based on whether their associated slots have
 * any assigned (non-whitespace) content.
 * @param {ShadowRoot} shadowRoot
 * @param {Object} slotsConfig — map of slot name → container selector.
 *   Use an empty string as the slot name to target the default (unnamed) slot.
 */
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
