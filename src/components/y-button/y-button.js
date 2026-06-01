import { contrastTextColor, isSafeCssColor } from "../../modules/helpers.js";

export class YumeButton extends HTMLElement {
    static get observedAttributes() {
        return [
            "left-icon", "right-icon", "color", "size", "style-type", "type",
            "disabled", "name", "value", "autofocus", "form", "formaction",
            "formenctype", "formmethod", "formnovalidate", "formtarget",
            "aria-label", "aria-pressed", "aria-hidden",
            "aria-haspopup", "aria-expanded", "aria-controls",
            "href", "target", "rel",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.selectedValues = new Set();
        this._init();
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        this._init();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const attributes = YumeButton.observedAttributes;

        if (oldValue !== newValue && attributes.includes(name)) {
            if (newValue === null) {
                this.button.removeAttribute(name);
            } else {
                this.button.setAttribute(name, newValue);
            }
        }

        this._init();

        if (["color", "size", "style-type", "disabled"].includes(name)) {
            this._updateStyles();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** URL to navigate to. When set, the internal element renders as an <a> instead of <button>. */
    get href() { return this.getAttribute("href"); }
    set href(val) {
        if (val != null) this.setAttribute("href", val);
        else this.removeAttribute("href");
    }

    /** Anchor target (e.g. "_blank"). Only applies when href is set. */
    get target() { return this.getAttribute("target"); }
    set target(val) {
        if (val != null) this.setAttribute("target", val);
        else this.removeAttribute("target");
    }

    /** Anchor rel attribute (e.g. "noopener noreferrer"). Only applies when href is set. */
    get rel() { return this.getAttribute("rel"); }
    set rel(val) {
        if (val != null) this.setAttribute("rel", val);
        else this.removeAttribute("rel");
    }

    /** Color theme for the button (default "base"). */
    get color() { return this.getAttribute("color") || "base"; }
    set color(val) { this.setAttribute("color", val); }

    /** Whether the button is disabled. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** The form name of the button. */
    get name() { return this.getAttribute("name") || ""; }
    set name(val) { this.setAttribute("name", val); }

    /** Size: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** Visual style: "filled" | "outlined" | "flat" (default "outlined"). */
    get styleType() { return this.getAttribute("style-type") || "outlined"; }
    set styleType(val) { this.setAttribute("style-type", val); }

    /** Button type: "button" | "submit" | "reset" (default "button"). */
    get type() { return this.getAttribute("type") || "button"; }
    set type(val) { this.setAttribute("type", val); }

    /** The current selected value(s), comma-separated when 'multiple' is set. */
    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        } else {
            return this.selectedValues.size ? Array.from(this.selectedValues)[0] : "";
        }
    }
    set value(newVal) {
        if (this.hasAttribute("multiple")) {
            if (typeof newVal === "string") {
                this.selectedValues = new Set(newVal.split(",").map((s) => s.trim()));
            } else if (Array.isArray(newVal)) {
                this.selectedValues = new Set(newVal);
            }
        } else {
            if (typeof newVal === "string") {
                this.selectedValues = new Set([newVal.trim()]);
            } else {
                this.selectedValues = new Set();
            }
        }
        this.setAttribute("value", newVal);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _addEventListeners() {
        this.button.addEventListener("focus", () => {
            this.dispatchEvent(new CustomEvent("focus", { bubbles: true, composed: true }));
        });

        this.button.addEventListener("blur", () => {
            this.dispatchEvent(new CustomEvent("blur", { bubbles: true, composed: true }));
        });

        this.button.addEventListener("keydown", (event) => {
            this.dispatchEvent(new CustomEvent("keydown", {
                detail: { key: event.key, code: event.code },
                bubbles: true,
                composed: true,
            }));
        });

        this.button.addEventListener("keyup", (event) => {
            this.dispatchEvent(new CustomEvent("keyup", {
                detail: { key: event.key, code: event.code },
                bubbles: true,
                composed: true,
            }));
        });

        this.button.addEventListener("click", (event) => {
            this._handleClick();

            if (this.getAttribute("type") === "submit") {
                const form = this.closest("form");
                if (form) {
                    event.preventDefault();
                    form.requestSubmit();
                }
            }
        });
    }

    _applyCustomColorStyles(color, styleType, size) {
        const text = contrastTextColor(color);
        const hover = `color-mix(in srgb, ${color} 85%, black)`;
        const active = `color-mix(in srgb, ${color} 70%, black)`;
        const subtle = `color-mix(in srgb, ${color} 15%, transparent)`;

        const styles = {
            filled: {
                "--background-color": color,
                "--border-color": color,
                "--text-color": text,
                "--hover-background-color": hover,
                "--hover-border-color": hover,
                "--hover-text-color": text,
                "--focus-background-color": active,
                "--focus-border-color": active,
                "--focus-text-color": text,
                "--active-background-color": active,
                "--active-border-color": active,
                "--active-text-color": text,
            },
            outlined: {
                "--background-color": "transparent",
                "--border-color": color,
                "--text-color": color,
                "--hover-background-color": subtle,
                "--hover-border-color": color,
                "--hover-text-color": color,
                "--focus-background-color": subtle,
                "--focus-border-color": color,
                "--focus-text-color": color,
                "--active-background-color": color,
                "--active-border-color": color,
                "--active-text-color": text,
            },
            flat: {
                "--background-color": "transparent",
                "--border-color": "transparent",
                "--text-color": color,
                "--hover-background-color": subtle,
                "--hover-border-color": subtle,
                "--hover-text-color": color,
                "--focus-background-color": subtle,
                "--focus-border-color": subtle,
                "--focus-text-color": color,
                "--active-background-color": color,
                "--active-border-color": color,
                "--active-text-color": text,
            },
        };

        Object.entries(styles[styleType] || styles.outlined).forEach(
            ([key, val]) => this.button.style.setProperty(key, val),
        );

        this._applySizeStyles(size);
    }

    _applyFilledInteractionStyles(vars) {
        this.button.style.setProperty("--hover-background-color", `var(${vars[1]}, #292a2b)`);
        this.button.style.setProperty("--hover-text-color", `var(${vars[6]}, #0c0c0d)`);
        this.button.style.setProperty("--hover-border-color", `var(${vars[1]}, #292a2b)`);
        this.button.style.setProperty("--focus-background-color", `var(${vars[2]}, #46474a)`);
        this.button.style.setProperty("--focus-text-color", `var(${vars[6]}, #0c0c0d)`);
        this.button.style.setProperty("--focus-border-color", `var(${vars[2]}, #46474a)`);
        this.button.style.setProperty("--active-background-color", `var(${vars[3]}, #0c0c0d)`);
        this.button.style.setProperty("--active-text-color", `var(${vars[0]}, #f7f7fa)`);
        this.button.style.setProperty("--active-border-color", `var(${vars[3]}, #0c0c0d)`);
    }

    _applyInteractionStyles(vars, styleType) {
        if (styleType === "filled") {
            this._applyFilledInteractionStyles(vars);
        } else {
            this._applyUnfilledInteractionStyles(vars, styleType);
        }
    }

    _applySizeStyles(size) {
        const sizeVars = {
            small: "--component-button-padding-small",
            medium: "--component-button-padding-medium",
            large: "--component-button-padding-large",
        };
        const pad = sizeVars[size] || sizeVars.medium;
        this.button.style.setProperty("--button-padding", `var(${pad}, var(--component-button-padding-medium))`);
        this.button.style.setProperty("--button-gap", `var(${pad}, var(--component-button-padding-medium))`);

        const minSizeMapping = {
            small: "var(--sizing-small, 32px)",
            medium: "var(--sizing-medium, 40px)",
            large: "var(--sizing-large, 56px)",
        };
        this.button.style.setProperty("--button-min-height", minSizeMapping[size] || "40px");
        this.button.style.setProperty("--button-min-width", minSizeMapping[size] || "40px");
    }

    _applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                display: inline-block;
            }

            @font-face {
                font-family: "Lexend";
                font-display: swap;
            }

            .button {
                box-sizing: border-box;
                display: inline-flex;
                width: 100%;
                min-height: var(--button-min-height, var(--sizing-medium, 40px));
                min-width: var(--button-min-width, var(--sizing-medium, 40px));
                padding: var(--button-padding, var(--component-button-padding-medium));
                gap: var(--button-gap, var(--component-button-padding-medium));
                justify-content: center;
                align-items: center;
                position: relative;
                overflow: hidden;
                border-radius: var(--component-button-border-radius-outer, 4px);
                border: var(--component-button-border-width, 1px) solid var(--border-color, var(--base-content--, #f7f7fa));
                background: var(--background-color, #0c0c0d);
                transition: background-color 0.1s, color 0.1s, border-color 0.1s;
                cursor: pointer;
                color: var(--text-color);
                font-family: var(--font-family-body, Lexend, sans-serif);
                font-size: var(--font-size-button, 1em);
                line-height: 1;
            }

            .button {
                text-decoration: none;
            }

            .button:disabled,
            .button[aria-disabled="true"] {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }

            .button:hover:not(:disabled),
            .button:hover:not(:disabled) .button-content {
                background: var(--hover-background-color);
                color: var(--hover-text-color);
                border-color: var(--hover-border-color);
            }
            .button:focus:not(:disabled),
            .button:focus:not(:disabled) .button-content {
                background: var(--focus-background-color);
                color: var(--focus-text-color);
                border-color: var(--focus-border-color);
            }
            .button:active:not(:disabled),
            .button:active:not(:disabled) .button-content {
                background: var(--active-background-color);
                color: var(--active-text-color);
                border-color: var(--active-border-color);
            }
            .icon {
                display: flex;
                min-width: 16px;
                min-height: 1em;
                justify-content: center;
                align-items: center;
            }
            .label {
                line-height: inherit;
                min-height: 1em;
                align-items: center;
            }
        `;
        this.shadowRoot.appendChild(style);
    }

    _applyUnfilledInteractionStyles(vars, styleType) {
        const borderColor = `var(${vars[0]}, #f7f7fa)`;

        this.button.style.setProperty("--hover-background-color", `var(${vars[4]}, #292a2b)`);
        this.button.style.setProperty("--hover-text-color", `var(${vars[0]}, #f7f7fa)`);
        this.button.style.setProperty("--focus-background-color", `var(${vars[5]}, #46474a)`);
        this.button.style.setProperty("--focus-text-color", `var(${vars[0]}, #f7f7fa)`);
        this.button.style.setProperty("--active-background-color", `var(${vars[0]}, #f7f7fa)`);
        this.button.style.setProperty("--active-text-color", `var(${vars[6]}, #0c0c0d)`);

        if (styleType === "outlined") {
            // Outlined buttons keep their border color across all states
            this.button.style.setProperty("--hover-border-color", borderColor);
            this.button.style.setProperty("--focus-border-color", borderColor);
            this.button.style.setProperty("--active-border-color", borderColor);
        } else {
            // Flat buttons match border to background
            this.button.style.setProperty("--hover-border-color", `var(${vars[4]}, #292a2b)`);
            this.button.style.setProperty("--focus-border-color", `var(${vars[5]}, #46474a)`);
            this.button.style.setProperty("--active-border-color", `var(${vars[0]}, #f7f7fa)`);
        }
    }

    _getColorVarsMap() {
        return {
            primary: ["--primary-content--", "--primary-content-hover", "--primary-content-active", "--primary-background-component", "--primary-background-hover", "--primary-background-active", "--primary-content-inverse"],
            secondary: ["--secondary-content--", "--secondary-content-hover", "--secondary-content-active", "--secondary-background-component", "--secondary-background-hover", "--secondary-background-active", "--secondary-content-inverse"],
            base: ["--base-content--", "--base-content-lighter", "--base-content-lightest", "--base-background-component", "--base-background-hover", "--base-background-active", "--base-content-inverse"],
            success: ["--success-content--", "--success-content-hover", "--success-content-active", "--success-background-component", "--success-background-hover", "--success-background-active", "--success-content-inverse"],
            error: ["--error-content--", "--error-content-hover", "--error-content-active", "--error-background-component", "--error-background-hover", "--error-background-active", "--error-content-inverse"],
            warning: ["--warning-content--", "--warning-content-hover", "--warning-content-active", "--warning-background-component", "--warning-background-hover", "--warning-background-active", "--warning-content-inverse"],
            help: ["--help-content--", "--help-content-hover", "--help-content-active", "--help-background-component", "--help-background-hover", "--help-background-active", "--help-content-inverse"],
        };
    }

    _handleClick() {
        const detail = {};
        const eventType = this.getAttribute("data-event");

        if (this.hasAttribute("disabled") || !eventType) return;

        Array.from(this.attributes)
            .filter((attr) => attr.name.startsWith("data-detail-"))
            .forEach((attr) => {
                const key = attr.name.replace("data-detail-", "");
                detail[key] = attr.value;
            });

        this.dispatchEvent(new CustomEvent(eventType, {
            detail,
            bubbles: true,
            composed: true,
        }));
    }

    _init() {
        this._applyStyles();
        this._render();
        this._proxyNativeOnClick();
        this._addEventListeners();
    }

    _manageSlotVisibility(slotName, selector) {
        const slot = slotName
            ? this.shadowRoot.querySelector(`slot[name="${slotName}"]`)
            : this.shadowRoot.querySelector("slot:not([name])");
        const container = this.shadowRoot.querySelector(selector);

        const updateVisibility = () => {
            const hasContent = slot
                .assignedNodes({ flatten: true })
                .some((n) => !(n.nodeType === Node.TEXT_NODE && n.textContent.trim() === ""));
            container.style.display = hasContent ? "inline-flex" : "none";
        };

        updateVisibility();
        slot.addEventListener("slotchange", updateVisibility);
    }

    _proxyNativeOnClick() {
        try {
            Object.defineProperty(this, "onclick", {
                get: () => this.button.onclick,
                set: (value) => { this.button.onclick = value; },
                configurable: true,
                enumerable: true,
            });
        } catch (e) {
            console.warn("Could not redefine onclick:", e);
        }
    }

    _render() {
        const needsAnchor = this.hasAttribute("href");
        const isAnchor = this.button?.tagName === "A";

        if (this.button && needsAnchor !== isAnchor) {
            this.button.remove();
            this.button = null;
        }

        if (!this.button) {
            this.button = needsAnchor
                ? document.createElement("a")
                : document.createElement("button");
            this.button.classList.add("button");
            this.button.setAttribute("part", "button");
            if (!needsAnchor) {
                this.button.setAttribute("role", "button");
                this.button.setAttribute("tabindex", "0");
            }
            this.shadowRoot.appendChild(this.button);
        }

        this._updateButtonAttributes();

        const disabled = this.hasAttribute("disabled");
        if (needsAnchor) {
            // <a> has no native disabled — manage via aria and href removal
            if (disabled) {
                this.button.removeAttribute("href");
                this.button.setAttribute("aria-disabled", "true");
                this.button.setAttribute("tabindex", "-1");
            } else {
                this.button.setAttribute("href", this.getAttribute("href"));
                this.button.setAttribute("aria-disabled", "false");
                this.button.removeAttribute("tabindex");
            }
        } else {
            if (disabled) {
                this.button.setAttribute("disabled", "");
                this.button.setAttribute("aria-disabled", "true");
            } else {
                this.button.removeAttribute("disabled");
                this.button.setAttribute("aria-disabled", "false");
            }
        }

        this.button.innerHTML = `
            <span class="icon left-icon" part="left-icon"><slot name="left-icon"></slot></span>
            <span class="label" part="label"><slot></slot></span>
            <span class="icon right-icon" part="right-icon"><slot name="right-icon"></slot></span>
        `;

        this._manageSlotVisibility("left-icon", ".left-icon");
        this._manageSlotVisibility("right-icon", ".right-icon");
        this._manageSlotVisibility("", ".label");
    }

    _updateButtonAttributes() {
        const isAnchor = this.button?.tagName === "A";
        // These are only meaningful on <button>
        const buttonOnlyAttrs = new Set(["type", "disabled", "name", "value", "autofocus", "form", "formaction", "formenctype", "formmethod", "formnovalidate", "formtarget"]);
        // These are only meaningful on <a>; href is managed separately in _render
        const anchorOnlyAttrs = new Set(["href", "target", "rel"]);

        YumeButton.observedAttributes.forEach((attr) => {
            if (isAnchor && buttonOnlyAttrs.has(attr)) return;
            if (isAnchor && attr === "href") return; // handled in _render (disabled-aware)
            if (!isAnchor && anchorOnlyAttrs.has(attr)) return;

            if (this.hasAttribute(attr)) {
                this.button.setAttribute(attr, this.getAttribute(attr));
            } else {
                this.button.removeAttribute(attr);
            }
        });
    }

    _updateStyles() {
        const { color, size, styleType } = this;
        const colorVars = this._getColorVarsMap();

        if (!colorVars[color] && isSafeCssColor(color)) {
            this._applyCustomColorStyles(color, styleType, size);
            return;
        }

        const vars = colorVars[color] || colorVars.base;

        const styleVars = {
            outlined: {
                "--background-color": `var(${vars[3]}, #0c0c0d)`,
                "--border-color": `var(${vars[0]}, #f7f7fa)`,
                "--text-color": `var(${vars[0]}, #f7f7fa)`,
            },
            filled: {
                "--background-color": `var(${vars[0]}, #f7f7fa)`,
                "--border-color": `var(${vars[0]}, #f7f7fa)`,
                "--text-color": `var(${vars[6]}, #0c0c0d)`,
            },
            flat: {
                "--background-color": `var(${vars[3]},#0c0c0d)`,
                "--border-color": `var(${vars[3]},#0c0c0d)`,
                "--text-color": `var(${vars[0]},#f7f7fa)`,
            },
        };

        const currentStyle = styleVars[styleType] || styleVars.outlined;
        Object.entries(currentStyle).forEach(([key, value]) => {
            this.button.style.setProperty(key, value);
        });

        this._applyInteractionStyles(vars, styleType);
        this._applySizeStyles(size);
    }
}

if (!customElements.get("y-button")) {
    customElements.define("y-button", YumeButton);
}
