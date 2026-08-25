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
 * Whether a string is a safe CSS color literal: a `#hex` value, or one of the
 * browser-native color functions — `rgb()`/`rgba()`, `hsl()`/`hsla()`, `hwb()`,
 * `lab()`, `lch()`, `oklab()`, `oklch()`, and `color()`. Used to gate
 * user-supplied colors before they reach a CSS context (style tag, inline style
 * attribute) so a hostile value cannot escape and inject markup or other
 * declarations.
 *
 * Safety comes from the argument allowlist: a function body may contain only
 * the characters these color functions legitimately use (digits, letters,
 * `.`, `%`, `,`, `/`, `+`, `-`, whitespace). Parentheses are disallowed, so no
 * nested `var()` / `calc()` / `url()`; and `<>{};:*"'\` are disallowed, so a
 * value cannot close the function to inject another declaration or break out of
 * a `<style>` element.
 *
 * Intentionally strict: rejects named colors, `currentColor`, and `var(...)`
 * so callers can fall back to a known semantic default.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isSafeCssColor(value) {
    if (typeof value !== "string") return false;
    return /^(?:#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([a-z0-9.,%/+\s-]*\))$/i.test(
        value,
    );
}

// A bare `var(--token)` reference, optionally with a fallback. Kept strict — no
// `;{}` — so a value bound for an inline style can never smuggle in a second
// declaration or close the rule.
const VAR_REFERENCE = /^var\(\s*--[\w-]+\s*(?:,[^;{}]*)?\)$/;

/**
 * A color string safe to paint from author input: a literal `isSafeCssColor`
 * accepts (`#hex`, `rgb()`/`hsl()`/`oklch()`/…) OR a `var(--token)` theme
 * reference, optionally with a fallback. Returns the trimmed color, or null.
 *
 * The looser sibling of `isSafeCssColor`, for the cases where naming a theme
 * token is the ordinary way to color something — a gauge zone, a chart series.
 * Only a bare custom-property reference is allowed through, never arbitrary CSS.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
export function safeColor(value) {
    if (isSafeCssColor(value)) return value;
    if (typeof value === "string" && VAR_REFERENCE.test(value.trim())) {
        return value.trim();
    }
    return null;
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
    // Custom CSS color literal — use raw value with auto-contrasted text.
    if (isSafeCssColor(color)) {
        return [color, contrastTextColor(color)];
    }
    if (fallbackColor === null) return [color, "var(--base-content-inverse)"];
    return map[fallbackColor] || map.base;
}

/**
 * Return a [background, foreground] pair for the soft treatment a colored item
 * uses while hovered or keyboard-highlighted: the color itself as the text over
 * a light wash of the same color. Deliberately weaker than the solid fill
 * `getColorVarPair` produces, so a hovered row never reads as a selected one.
 * @param {string} color — a semantic role name or a safe CSS color literal
 * @param {number} [amount=18] — wash strength, in percent, for color literals
 * @returns {[string, string] | null} — [bg, fg], or null when `color` is unusable
 */
export function getColorSoftPair(color, amount = 18) {
    const roles = [
        "base",
        "primary",
        "secondary",
        "success",
        "warning",
        "error",
        "help",
    ];

    if (roles.includes(color)) {
        return [`var(--${color}-background-hover)`, `var(--${color}-content)`];
    }
    if (isSafeCssColor(color)) {
        return [`color-mix(in srgb, ${color} ${amount}%, transparent)`, color];
    }

    return null;
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
 * Create a DOM element with attributes and children in a single call.
 * @param {string} tag — element tag name (e.g. "div", "button", "y-icon")
 * @param {Object} [attrs] — attribute key/value pairs; `null`, `undefined`,
 *   and `false` values are skipped; `true` sets a valueless attribute.
 * @param {Array<string|Node>} [children] — text strings or DOM nodes to append
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs, children) {
    const node = document.createElement(tag);

    if (attrs) {
        for (const [k, v] of Object.entries(attrs)) {
            if (v != null && v !== false)
                node.setAttribute(k, v === true ? "" : v);
        }
    }

    if (children) {
        for (const child of children) {
            if (typeof child === "string")
                node.appendChild(document.createTextNode(child));
            else if (child) node.appendChild(child);
        }
    }

    return node;
}

/**
 * Host attributes mirrored onto a component's inner form control.
 *
 * `aria-describedby` is deliberately absent: an IDREF cannot cross a shadow
 * boundary, so forwarding one from the host would always dangle. Components
 * describe their own control instead — see `applyControlError`.
 */
export const FORWARDED_CONTROL_ATTRIBUTES = [
    "aria-label",
    "aria-labelledby",
    "autocomplete",
    "required",
];

/**
 * Mirror accessibility and native-validation attributes from a component host
 * onto the focusable control inside its shadow root. Without this the host
 * carries the attributes but assistive technology reads the inner control,
 * leaving it unnamed. Safe to call on every render.
 * @param {HTMLElement} host — the custom element
 * @param {HTMLElement} control — the inner focusable control
 * @param {string[]} [attributes] — override the forwarded set; components whose
 *   control is not a native form field (or that own an attribute themselves)
 *   narrow this list.
 */
export function forwardControlAttributes(
    host,
    control,
    attributes = FORWARDED_CONTROL_ATTRIBUTES,
) {
    if (!control) return;

    for (const name of attributes) {
        const value = host.getAttribute(name);
        if (value == null) control.removeAttribute(name);
        else control.setAttribute(name, value);
    }
}

/**
 * Render a validation message into a component's own shadow root and point the
 * control's accessible description at it. Both elements share a root, so the
 * `aria-describedby` IDREF resolves.
 * @param {HTMLElement} control — the inner focusable control
 * @param {HTMLElement} errorEl — the message element; must carry an `id`
 * @param {string} message — the message, or empty to clear
 */
export function applyControlError(control, errorEl, message) {
    if (errorEl) {
        errorEl.textContent = message || "";
        errorEl.hidden = !message;
    }
    if (!control) return;

    if (message) {
        control.setAttribute("aria-invalid", "true");
        if (errorEl?.id) control.setAttribute("aria-describedby", errorEl.id);
    } else {
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
    }
}

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
 * Resolve an anchor element by id for a web component, tolerating DOM insertion
 * races. A synchronous lookup runs first; if it misses, one
 * `requestAnimationFrame` retry covers the common React portal commit-ordering
 * case, and a final `MutationObserver` fallback covers async / lazy mounts.
 *
 * The callback fires at most once. If the host disconnects before the anchor
 * appears, resolution is aborted. Callers must invoke the returned dispose
 * function on teardown (disconnectedCallback, attribute change, etc.) to
 * cancel any pending rAF or observer.
 *
 * @param {HTMLElement} host — component instance; resolution aborts if it disconnects.
 * @param {string} id — the anchor element's id.
 * @param {(el: HTMLElement) => void} onFound — invoked once when the anchor resolves.
 * @param {Document|ShadowRoot} [root=document] — root to search within.
 * @returns {() => void} — dispose function.
 */
export function resolveAnchor(host, id, onFound, root = document) {
    let disposed = false;
    let rafId = null;
    let observer = null;

    const dispose = () => {
        disposed = true;
        if (rafId != null) cancelAnimationFrame(rafId);
        if (observer) observer.disconnect();
        rafId = null;
        observer = null;
    };

    const find = () => {
        if (disposed) return true;
        const el = root.getElementById
            ? root.getElementById(id)
            : document.getElementById(id);
        if (el) {
            dispose();
            onFound(el);
            return true;
        }
        return false;
    };

    if (find()) return dispose;
    if (!host.isConnected) return dispose;

    rafId = requestAnimationFrame(() => {
        rafId = null;
        if (find()) return;
        const target = root === document ? document.body : root;
        if (!target) return;
        observer = new MutationObserver(find);
        observer.observe(target, { childList: true, subtree: true });
    });

    return dispose;
}

/**
 * Find the mount point for a portaled overlay so it inherits the active theme.
 *
 * YumeKit delivers a theme as CSS custom properties scoped to the <y-theme>
 * subtree, so a portaled surface must mount inside that subtree to stay themed.
 * Element.closest() stops at the shadow boundary, so a component portaling from
 * inside another component's shadow root (e.g. y-data-grid's header menus) would
 * never see a light-DOM <y-theme> and fall back to the un-themed defaults. Walk
 * up across shadow boundaries via getRootNode().host to find the nearest
 * enclosing <y-theme>; fall back to <body> when there is none.
 * @param {Element} el — the portaling element to resolve from
 * @returns {Element} — the nearest <y-theme> ancestor, or document.body
 */
export function resolveThemeMountPoint(el) {
    let node = el;
    while (node) {
        const theme = node.closest?.("y-theme");
        if (theme) return theme;
        const root = node.getRootNode();
        node = root instanceof ShadowRoot ? root.host : null;
    }
    return document.body;
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
// Nav utilities
// =============================================================================

/**
 * Build the icon node for a nav item. `iconValue` must be a registered icon
 * name; custom glyphs should be added via the `<y-icon>` registry rather
 * than inlined as markup, so this surface is not an XSS sink for callers
 * passing items as JSON.
 * @param {string} iconValue — registered icon name (e.g. `"home"`)
 * @param {string} iconSize — size variant passed to `<y-icon size>`
 * @returns {HTMLElement}
 */
export function buildNavItemIcon(iconValue, iconSize) {
    return createElement("y-icon", {
        slot: "left-icon",
        part: "icon",
        name: iconValue,
        size: iconSize,
    });
}

/**
 * Determine whether a nav item should render as active. Items may set
 * `selected: true` for explicit control; otherwise the `href` is matched
 * against the current `window.location` (path+search+hash, then full URL).
 * @param {{selected?: boolean, href?: string}} item
 * @returns {boolean}
 */
export function isNavItemActive(item) {
    if (item.selected) return true;
    if (!item.href) return false;
    const loc = window.location;
    const current = loc.pathname + loc.search + loc.hash;
    return item.href === current || item.href === loc.href;
}

/**
 * Dispatch a cancelable `navigate` event from `host`, then either
 * `pushState` (default) or assign `window.location.href` when the host's
 * `history` attribute is `"false"`. Bails out if a listener calls
 * `preventDefault()` on the event.
 * @param {HTMLElement} host
 * @param {string} href
 */
export function navigateFrom(host, href) {
    const event = new CustomEvent("navigate", {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { href },
    });
    if (!host.dispatchEvent(event)) return;

    if (host.getAttribute("history") === "false") {
        window.location.href = href;
    } else {
        history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    }
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

// =============================================================================
// Spacing / gap utilities
// =============================================================================

/**
 * Map of gap-token names to the CSS expression that resolves them, used by
 * layout components (`y-grid`, `y-masonry`, `y-stack`) to translate the
 * shared `gap` / `row-gap` / `column-gap` attribute scale to spacing tokens.
 */
export const GAP_TOKEN_MAP = {
    none: "var(--spacing-none, 0px)",
    "x-small": "var(--spacing-x-small, 4px)",
    small: "var(--spacing-small, 6px)",
    medium: "var(--spacing-medium, 8px)",
    large: "var(--spacing-large, 12px)",
    "x-large": "var(--spacing-x-large, 16px)",
    "2x-large": "var(--spacing-2x-large, 24px)",
    "4x-large": "var(--spacing-4x-large, 32px)",
};

/**
 * Resolve a gap-token attribute on a host element to its CSS expression.
 * Falls back to the unified `gap` attribute when the side override is unset
 * or unknown, and to `medium` when neither resolves.
 * @param {HTMLElement} host — the component element holding the attributes
 * @param {string} attrName — `"gap"`, `"row-gap"`, or `"column-gap"`
 * @returns {string} CSS expression, e.g. `var(--spacing-medium, 8px)`
 */
export function resolveGapToken(host, attrName) {
    const raw = host.getAttribute(attrName);
    if (raw && GAP_TOKEN_MAP[raw]) return GAP_TOKEN_MAP[raw];
    const fallback = host.getAttribute("gap");
    if (fallback && GAP_TOKEN_MAP[fallback]) return GAP_TOKEN_MAP[fallback];
    return GAP_TOKEN_MAP.medium;
}

/**
 * Measure a CSS length expression in pixels by appending a hidden probe
 * element to the given container. Useful when JS-positioned layout (e.g.
 * masonry) needs the resolved pixel value of a token-driven gap.
 * @param {HTMLElement} container — element to append the probe to
 * @param {string} cssLength — any valid `width` value (e.g. `var(--spacing-medium, 8px)`)
 * @returns {number} resolved pixel width
 */
export function measureCSSLength(container, cssLength) {
    const probe = createElement("div", {
        style: `position:absolute;visibility:hidden;width:${cssLength}`,
    });
    container.appendChild(probe);
    const px = probe.offsetWidth;
    probe.remove();
    return px;
}

/**
 * Reapply any accessor-backed properties that were assigned to `el` as plain
 * own-properties before the custom element definition upgraded it. Without
 * this, a value set via `el.foo = x` before upgrade shadows the class getter/
 * setter, so the setter (and its reflection side effects) never runs. Discovers
 * every property with a setter on the prototype chain up to HTMLElement, then
 * deletes and re-assigns any that were pre-upgrade shadowed. Call once at the
 * top of `connectedCallback`.
 * @param {HTMLElement} el — the custom element instance (pass `this`)
 */
export function upgradeProperties(el) {
    const setters = new Set();

    let proto = Object.getPrototypeOf(el);
    while (proto && proto !== HTMLElement.prototype) {
        for (const [name, desc] of Object.entries(
            Object.getOwnPropertyDescriptors(proto),
        )) {
            if (desc.set) setters.add(name);
        }
        proto = Object.getPrototypeOf(proto);
    }

    for (const name of setters) {
        if (!Object.prototype.hasOwnProperty.call(el, name)) continue;
        const value = el[name];
        delete el[name];
        el[name] = value;
    }
}

/**
 * Coerce a rich-data value (array/object) for a property whose matching
 * attribute may carry a JSON string. Non-null objects and arrays pass through
 * with their identity intact; a JSON string is parsed once and kept only if it
 * yields a non-null object/array. Everything else — nullish, a primitive, an
 * unparseable string, or a string that parses to a primitive (e.g. `"42"`,
 * `"null"`) — returns the fallback, so callers can safely assume the result is
 * a non-null object/array. Use in a property setter and in
 * `attributeChangedCallback` so both the imperative and declarative paths
 * converge on the same stored value. Rich data is intentionally not reflected
 * back to the attribute.
 * @param {*} val — an array/object, a JSON string, or nullish
 * @param {*} [fallback=[]] — value returned for anything that isn't a non-null object/array
 * @returns {*}
 */
export function coerceRichData(val, fallback = []) {
    if (typeof val === "string") {
        try {
            val = JSON.parse(val);
        } catch {
            return fallback;
        }
    }
    return val !== null && typeof val === "object" ? val : fallback;
}
