import {
    contrastTextColor,
    createElement as _el,
    isSafeCssColor,
    upgradeProperties,
} from "../../modules/helpers.js";

// Per-token rendering, as [symbol, text, spoken] for Apple and non-Apple
// platforms. `mod` is the primary accelerator (Command on Apple, Control
// elsewhere); `cmd` is the literal Meta/Super key, which is a different key.
const KEY_TABLE = {
    mod: { mac: ["⌘", "Cmd", "Command"], other: ["Ctrl", "Ctrl", "Control"] },
    cmd: { mac: ["⌘", "Cmd", "Command"], other: ["Win", "Win", "Windows"] },
    ctrl: { mac: ["⌃", "Ctrl", "Control"], other: ["Ctrl", "Ctrl", "Control"] },
    alt: { mac: ["⌥", "Opt", "Option"], other: ["Alt", "Alt", "Alt"] },
    shift: { mac: ["⇧", "Shift", "Shift"], other: ["⇧", "Shift", "Shift"] },
    enter: {
        mac: ["⏎", "Return", "Return"],
        other: ["Enter", "Enter", "Enter"],
    },
    esc: { mac: ["⎋", "Esc", "Escape"], other: ["Esc", "Esc", "Escape"] },
    tab: { mac: ["⇥", "Tab", "Tab"], other: ["Tab", "Tab", "Tab"] },
    space: { mac: ["␣", "Space", "Space"], other: ["Space", "Space", "Space"] },
    backspace: {
        mac: ["⌫", "Delete", "Delete"],
        other: ["Backspace", "Backspace", "Backspace"],
    },
    delete: {
        mac: ["⌦", "Del", "Forward Delete"],
        other: ["Del", "Del", "Delete"],
    },
    up: { mac: ["↑", "↑", "Up Arrow"], other: ["↑", "↑", "Up Arrow"] },
    down: { mac: ["↓", "↓", "Down Arrow"], other: ["↓", "↓", "Down Arrow"] },
    left: { mac: ["←", "←", "Left Arrow"], other: ["←", "←", "Left Arrow"] },
    right: { mac: ["→", "→", "Right Arrow"], other: ["→", "→", "Right Arrow"] },
    plus: { mac: ["+", "+", "Plus"], other: ["+", "+", "Plus"] },
};

const ALIASES = {
    arrowdown: "down",
    arrowleft: "left",
    arrowright: "right",
    arrowup: "up",
    command: "cmd",
    control: "ctrl",
    del: "delete",
    escape: "esc",
    meta: "cmd",
    opt: "alt",
    option: "alt",
    return: "enter",
    super: "cmd",
    win: "cmd",
};

const COLOR_VARS = {
    base: [
        "--base-content--",
        "--base-content-inverse",
        "--base-background-app",
        "--base-border",
    ],
    primary: [
        "--primary-content--",
        "--primary-content-inverse",
        "--primary-background-app",
        "--primary-border",
    ],
    secondary: [
        "--secondary-content--",
        "--secondary-content-inverse",
        "--secondary-background-app",
        "--secondary-border",
    ],
    success: [
        "--success-content--",
        "--success-content-inverse",
        "--success-background-app",
        "--success-border",
    ],
    warning: [
        "--warning-content--",
        "--warning-content-inverse",
        "--warning-background-app",
        "--warning-border",
    ],
    error: [
        "--error-content--",
        "--error-content-inverse",
        "--error-background-app",
        "--error-border",
    ],
    help: [
        "--help-content--",
        "--help-content-inverse",
        "--help-background-app",
        "--help-border",
    ],
};

const SIZES = {
    small: {
        height: "var(--component-key-height-small, 18px)",
        padding:
            "var(--component-key-padding-small, var(--spacing-x-small, 4px))",
        fontSize: "var(--component-key-font-size-small, 0.7em)",
    },
    medium: {
        height: "var(--component-key-height-medium, 22px)",
        padding:
            "var(--component-key-padding-medium, var(--spacing-small, 6px))",
        fontSize: "var(--component-key-font-size-medium, 0.78em)",
    },
    large: {
        height: "var(--component-key-height-large, 28px)",
        padding:
            "var(--component-key-padding-large, var(--spacing-medium, 8px))",
        fontSize: "var(--component-key-font-size-large, 0.86em)",
    },
};

const APPLE_RE = /mac|iphone|ipad|ipod/i;

let detectedPlatform = null;

/**
 * Resolve the host platform once and memoize it, so every y-key on the page
 * shares one answer. With no `navigator` — SSR, a DOM-less test runner — it
 * resolves to "linux", i.e. the Ctrl/word rendering, and never throws.
 * @returns {"mac"|"windows"|"linux"}
 */
function detectPlatform() {
    if (detectedPlatform) return detectedPlatform;

    const nav = globalThis.navigator;
    const id = nav?.userAgentData?.platform || nav?.platform || "";

    detectedPlatform = APPLE_RE.test(id)
        ? "mac"
        : /win/i.test(id)
          ? "windows"
          : "linux";

    return detectedPlatform;
}

export class YumeKey extends HTMLElement {
    static get observedAttributes() {
        return [
            "color",
            "combined",
            "keys",
            "label",
            "notation",
            "platform",
            "pressed",
            "separator",
            "size",
            "variant",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._ownedAriaLabel = null;
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color scheme name, or a CSS color literal (default "base"). */
    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** Whether the whole chord is drawn inside a single cap. */
    get combined() {
        return this.hasAttribute("combined");
    }
    set combined(val) {
        if (val) this.setAttribute("combined", "");
        else this.removeAttribute("combined");
    }

    /** Chord string, e.g. "mod+shift+k". Empty renders the default slot. */
    get keys() {
        return this.getAttribute("keys") || "";
    }
    set keys(val) {
        this.setAttribute("keys", val);
    }

    /** Explicit accessible name, overriding the computed one. */
    get label() {
        return this.getAttribute("label") || "";
    }
    set label(val) {
        this.setAttribute("label", val);
    }

    /** Legend style: "auto" (default) | "symbol" | "text". */
    get notation() {
        return this.getAttribute("notation") || "auto";
    }
    set notation(val) {
        this.setAttribute("notation", val);
    }

    /** Platform: "auto" (default) | "mac" | "windows" | "linux". */
    get platform() {
        return this.getAttribute("platform") || "auto";
    }
    set platform(val) {
        this.setAttribute("platform", val);
    }

    /** Depressed visual state. Presentational only — sets no ARIA state. */
    get pressed() {
        return this.hasAttribute("pressed");
    }
    set pressed(val) {
        if (val) this.setAttribute("pressed", "");
        else this.removeAttribute("pressed");
    }

    /** Glyph drawn between caps, e.g. "+". Empty draws nothing. */
    get separator() {
        return this.getAttribute("separator") || "";
    }
    set separator(val) {
        this.setAttribute("separator", val);
    }

    /** Size: "small" | "medium" (default) | "large". */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Visual style: "outlined" (default) | "filled" | "flat". */
    get variant() {
        return this.getAttribute("variant") || "outlined";
    }
    set variant(val) {
        this.setAttribute("variant", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const chordMode = this.keys !== "";
        const parts = chordMode ? this._resolveChord() : [];

        this.shadowRoot.innerHTML = `<style>${this._getStyle()}</style>`;
        if (chordMode) this.shadowRoot.appendChild(this._buildChord(parts));
        this.shadowRoot.appendChild(this._buildSlotCap(chordMode));

        this._applyAccessibleName(parts.map((part) => part.spoken).join(" "));
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /**
     * Name the host with the spoken form of the chord, so "⌘⇧K" is announced
     * "Command Shift K" rather than "place of interest sign". An author-set
     * `aria-label` always wins, then `label`, then the computed name. The last
     * value written here is remembered so a re-render can tell its own name
     * from one the author supplied.
     * @param {string} spoken — the computed name; empty in slot mode
     */
    _applyAccessibleName(spoken) {
        const current = this.getAttribute("aria-label");
        if (current !== null && current !== this._ownedAriaLabel) return;

        const name = this.label || spoken;

        if (!name) {
            if (current !== null) this.removeAttribute("aria-label");
            this._ownedAriaLabel = null;
            return;
        }

        this._ownedAriaLabel = name;
        this.setAttribute("aria-label", name);
    }

    _buildChord(parts) {
        const { combined, separator } = this;
        const chord = _el("span", {
            class: "chord",
            part: "chord",
            "aria-hidden": "true",
        });

        if (combined) {
            const legend = parts.map((part) => part.display).join("");
            chord.appendChild(
                _el("kbd", { class: "key", part: "key" }, [legend]),
            );
            return chord;
        }

        parts.forEach((part, i) => {
            if (i && separator) {
                chord.appendChild(
                    _el("span", { class: "separator", part: "separator" }, [
                        separator,
                    ]),
                );
            }
            chord.appendChild(
                _el("kbd", { class: "key", part: "key" }, [part.display]),
            );
        });

        return chord;
    }

    /**
     * The cap that wraps the default slot. Always rendered — hidden rather than
     * omitted in chord mode — so slotted children survive a late upgrade, and
     * so `::part(key)` styles a slotted key exactly like a resolved one.
     * @param {boolean} hidden — true in chord mode
     * @returns {HTMLElement}
     */
    _buildSlotCap(hidden) {
        return _el("kbd", { class: "key", part: "key", hidden }, [
            _el("slot"),
        ]);
    }

    _getSkin(color, variant) {
        const role = COLOR_VARS[color];
        const custom = !role && isSafeCssColor(color) ? color : null;
        const [content, inverse, wash, border] = role || COLOR_VARS.base;

        const ink = custom || `var(${content})`;
        const edge = custom || `var(${border})`;
        const fillInk = custom ? contrastTextColor(custom) : `var(${inverse})`;
        const flat = custom
            ? `color-mix(in srgb, ${custom} 20%, transparent)`
            : `var(${wash})`;

        const skins = {
            outlined: `
                .key {
                    background: var(--base-background-component);
                    color: ${ink};
                    border-color: ${edge};
                    box-shadow: inset 0 calc(-1 * var(--component-key-edge-width, 2px)) 0 ${edge};
                }
            `,
            filled: `
                .key {
                    background: ${ink};
                    color: ${fillInk};
                    border-color: ${ink};
                    box-shadow: inset 0 calc(-1 * var(--component-key-edge-width, 2px)) 0 rgba(0, 0, 0, 0.28);
                }
            `,
            flat: `
                .key {
                    background: ${flat};
                    color: ${ink};
                    border-color: transparent;
                    box-shadow: none;
                }
            `,
        };

        return skins[variant] || skins.outlined;
    }

    _getStyle() {
        const { color, size, variant } = this;
        const cfg = SIZES[size] || SIZES.medium;

        const baseStyle = `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: inline-flex;
                vertical-align: middle;
                /* Body font first, then the symbol faces that actually carry
                   ⌘ ⌥ ⎋ ⇥ ⏎ — a mac chord is often read on a machine whose UI
                   font has no glyph for them. */
                font-family: var(--font-family-body, sans-serif), "Apple Symbols",
                    "Segoe UI Symbol", "Noto Sans Symbols 2", sans-serif;
                font-size: ${cfg.fontSize};
            }
            .chord {
                display: inline-flex;
                align-items: center;
                gap: var(--component-key-gap, var(--spacing-2x-small, 2px));
            }
            .key {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                height: ${cfg.height};
                min-width: ${cfg.height};
                padding: 0 ${cfg.padding};
                border-style: solid;
                border-width: var(--component-key-border-width, 1px);
                border-radius: var(--component-key-border-radius, 0.25em);
                font-family: inherit;
                font-size: inherit;
                font-weight: var(--font-weight-heading, 500);
                line-height: 1;
                white-space: nowrap;
                transition: background-color 0.15s, box-shadow 0.15s, transform 0.15s;
            }
            .key[hidden] {
                display: none;
            }
            .separator {
                color: var(--base-content-light);
            }
        `;

        const pressedStyle = `
            :host([pressed]) .key {
                box-shadow: none;
                transform: translateY(1px);
                background-image: linear-gradient(rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.08));
            }

            @media (prefers-reduced-motion: reduce) {
                .key {
                    transition: none;
                }
                :host([pressed]) .key {
                    transform: none;
                }
            }
        `;

        return baseStyle + this._getSkin(color, variant) + pressedStyle;
    }

    /**
     * Split `keys` into caps. Unknown tokens render and speak verbatim — a typo
     * in a docs page should look slightly wrong, not break the page.
     * @returns {Array<{display: string, spoken: string}>}
     */
    _resolveChord() {
        const isMac = this._resolvePlatform() === "mac";
        const notation = this.notation;
        const useSymbol =
            notation === "symbol" || (notation === "auto" && isMac);

        const tokens = this.keys
            .split("+")
            .map((token) => token.trim())
            .filter(Boolean);

        return tokens.map((raw) => {
            const name = raw.toLowerCase();
            const entry = KEY_TABLE[ALIASES[name] || name];

            if (!entry) {
                const legend = raw.length === 1 ? raw.toUpperCase() : raw;
                return { display: legend, spoken: legend };
            }

            const [symbol, text, spoken] = isMac ? entry.mac : entry.other;
            return { display: useSymbol ? symbol : text, spoken };
        });
    }

    _resolvePlatform() {
        const declared = this.platform;
        if (declared !== "auto") return declared;

        return detectPlatform();
    }
}

if (!customElements.get("y-key")) {
    customElements.define("y-key", YumeKey);
}
