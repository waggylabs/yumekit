import {
    isSafeCssColor,
    manageLabelVisibility,
    upgradeProperties,
} from "../../modules/helpers.js";

class YumeSwitch extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "checked",
            "disabled",
            "animate",
            "toggle-label",
            "label-position",
            "size",
            "value",
            "on-color",
            "off-color",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        if (!this.hasAttribute("animate")) this.setAttribute("animate", "true");

        this.render();
        this._mirrorToggleLabels();
        this._bindSwitchListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this._update();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the switch transition animation is enabled. */
    get animate() {
        return this.getAttribute("animate") !== "false";
    }
    set animate(val) {
        this.setAttribute("animate", val ? "true" : "false");
    }

    /** @type {boolean} Whether the switch is on. */
    get checked() {
        return this.hasAttribute("checked");
    }
    set checked(val) {
        if (val) this.setAttribute("checked", "");
        else this.removeAttribute("checked");
        this._update();
    }

    /** @type {string} Color theme for the active (on) toggle. */
    get onColor() {
        return this.getAttribute("on-color") || "primary";
    }
    set onColor(val) {
        this.setAttribute("on-color", val);
    }

    /** @type {string} Color theme for the inactive (off) toggle. Defaults to base. */
    get offColor() {
        return this.getAttribute("off-color") || "";
    }
    set offColor(val) {
        if (val) this.setAttribute("off-color", val);
        else this.removeAttribute("off-color");
    }

    /** @type {boolean} Whether the switch is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {string} Label position: "top" | "bottom" | "left" | "right" (default "top"). */
    get labelPosition() {
        return this.getAttribute("label-position") || "top";
    }
    set labelPosition(val) {
        this.setAttribute("label-position", val);
    }

    /** @type {string} Switch size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** @type {boolean} Whether to show on/off labels inside the toggle. */
    get toggleLabel() {
        return (
            this.hasAttribute("toggle-label") &&
            this.getAttribute("toggle-label") !== "false"
        );
    }
    set toggleLabel(val) {
        if (val) this.setAttribute("toggle-label", "true");
        else this.removeAttribute("toggle-label");
    }

    /** @type {string} The form value submitted when checked. Defaults to "on". */
    get value() {
        return this.getAttribute("value") || "on";
    }
    set value(val) {
        this.setAttribute("value", val);
        this._update();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.innerHTML = `
            ${this._labelTag("top")}
            <div class="switch" part="switch" tabindex="0" role="switch" aria-checked="${this.checked}" aria-disabled="${this.disabled}">
                <div class="track">
                    <div class="label-content"><slot name="off-label">Off</slot></div>
                    <div class="label-content"><slot name="on-label">On</slot></div>
                </div>
                <div class="toggle" part="toggle">
                    <span class="off"></span>
                    <span class="on"></span>
                </div>
            </div>
            ${this._labelTag("bottom")}
        `;
        this._update();
        manageLabelVisibility(this.shadowRoot.querySelector(".label-wrapper"));
    }

    /** Toggles the checked state and dispatches a "change" event. */
    toggle() {
        if (this.disabled) return;
        this.checked = !this.checked;
        this.dispatchEvent(
            new Event("change", { bubbles: true, composed: true }),
        );
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindSwitchListeners() {
        const sw = this.shadowRoot.querySelector(".switch");
        sw.addEventListener("click", () => this.toggle());
        sw.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: inline-flex;
                flex-direction: var(--switch-dir, column);
                align-items: center;
                gap: var(--spacing-x-small);
                font-family: var(--font-family-body);
                --switch-padding: var(--component-switch-padding, 2px);
                --show-labels: flex;
                --show-toggle-label: none;
                --switch-width: max-content;
                --toggle-width: auto;
                --toggle-padding: 0 var(--spacing-small);
                --toggle-radius: var(--component-switch-border-radius);
            }

            .label-wrapper {
                display: none;
            }

            .label {
                font-size: var(--font-size-label);
                color: var(--base-content--);
            }

            .switch {
                position: relative;
                display: inline-flex;
                align-items: center;
                background: var(--base-background-component);
                border: 1px solid var(--base-border);
                border-width: var(--component-switch-border-width, 1px);
                border-radius: var(--component-switch-border-radius);
                cursor: pointer;
                height: var(--switch-height);
                font-size: var(--switch-font-size);
                box-sizing: border-box;
                padding: var(--switch-padding);
                width: var(--switch-width, max-content);
                transition: background 0.35s ease-in-out, border-color 0.35s ease-in-out;
            }

            :host([checked]) .switch {
                background: color-mix(in srgb, var(--switch-on-color, var(--primary-content--)) var(--component-switch-on-fill-opacity, 16%), transparent);
                border-color: var(--switch-on-color, var(--primary-content--));
            }

            .track {
                display: flex;
                align-items: center;
                height: 100%;
                position: relative;
                z-index: 0;
            }

            .label-content {
                flex: 0 0 auto;
                align-items: center;
                justify-content: center;
                padding: 0 var(--spacing-small);
                white-space: nowrap;
                position: relative;
                z-index: 0;
                color: var(--base-content-light);
                display: var(--show-labels, flex);
            }

            .toggle {
                position: absolute;
                top: var(--switch-padding);
                bottom: var(--switch-padding);
                left: var(--switch-padding);
                height: calc(100% - (var(--switch-padding) + var(--switch-padding)));
                width: var(--toggle-width, auto);
                background: var(--toggle-bg, var(--base-content-light));
                color: var(--base-background-component);
                border-radius: var(--toggle-radius, var(--component-switch-border-radius));
                display: flex;
                align-items: center;
                justify-content: center;
                padding: var(--toggle-padding, 0 var(--spacing-small));
                font-weight: 500;
                z-index: 1;
                white-space: nowrap;
                transform: translateX(var(--toggle-x, 0));
                transition: var(--toggle-transition, transform 0.25s ease, background 0.25s ease);
            }

            .toggle .on,
            .toggle .off {
                display: none;
            }

            :host([checked]) .toggle .on {
                display: var(--show-toggle-label, none);
            }

            :host(:not([checked])) .toggle .off {
                display: var(--show-toggle-label, none);
            }

            :host([animate="false"]) .toggle,
            :host([animate="false"]) .switch {
                transition: none !important;
            }

            :host([disabled]) {
                opacity: 0.5;
            }

            :host([disabled]) .switch {
                cursor: not-allowed;
            }
        `);
        return sheet;
    }

    _labelTag(pos) {
        const shouldRender =
            (pos === "top" &&
                (this.labelPosition === "top" ||
                    this.labelPosition === "left")) ||
            (pos === "bottom" &&
                (this.labelPosition === "bottom" ||
                    this.labelPosition === "right"));
        return shouldRender
            ? `<label class="label-wrapper"><slot name="label"></slot></label>`
            : "";
    }

    _mirrorToggleLabels() {
        requestAnimationFrame(() => {
            const toggle = this.shadowRoot?.querySelector(".toggle");
            if (!toggle) return;

            toggle.innerHTML = "";

            const offSlot = this.querySelector('[slot="off-label"]');
            const onSlot = this.querySelector('[slot="on-label"]');

            const offWrapper = document.createElement("span");
            offWrapper.className = "off";
            offWrapper.appendChild(
                offSlot?.cloneNode(true) || document.createTextNode("Off"),
            );

            const onWrapper = document.createElement("span");
            onWrapper.className = "on";
            onWrapper.appendChild(
                onSlot?.cloneNode(true) || document.createTextNode("On"),
            );

            toggle.appendChild(offWrapper);
            toggle.appendChild(onWrapper);
        });
    }

    _resolveColor(color, fallback) {
        const predefined = {
            primary: "var(--primary-content--)",
            secondary: "var(--secondary-content--)",
            base: "var(--base-content--)",
            success: "var(--success-content--)",
            warning: "var(--warning-content--)",
            error: "var(--error-content--)",
            help: "var(--help-content--)",
        };
        if (predefined[color]) return predefined[color];
        if (color && isSafeCssColor(color)) return color;

        return fallback;
    }

    _update() {
        this._updateSizeStyles();
        this._updateTogglePosition();
        this._updateToggleLabelDisplay();
        this._updateLabelDisplay();
        this._updateDirection();
        this._updateAria();
        this._updateFormValue();
        this._mirrorToggleLabels();
    }

    _updateAria() {
        const sw = this.shadowRoot?.querySelector(".switch");
        if (sw) {
            sw.setAttribute("aria-checked", this.checked);
            sw.setAttribute("aria-disabled", this.disabled ? "true" : "false");
        }
    }

    _updateDirection() {
        const directionMap = {
            top: "column",
            bottom: "column-reverse",
            left: "row-reverse",
            right: "row",
        };
        this.style.setProperty(
            "--switch-dir",
            directionMap[this.labelPosition] || "column",
        );
    }

    _updateFormValue() {
        this._internals.setFormValue(this.checked ? this.value : "");
    }

    _updateLabelDisplay() {
        this.style.setProperty(
            "--show-labels",
            this.toggleLabel ? "flex" : "none",
        );
    }

    _updateSizeStyles() {
        const heightMap = { small: "24px", medium: "32px", large: "40px" };
        const widthMap = { small: "44px", medium: "56px", large: "72px" };
        const fontMap = {
            small: "var(--font-size-small)",
            medium: "var(--font-size-label)",
            large: "var(--font-size-h4)",
        };
        this.style.setProperty("--switch-height", heightMap[this.size]);
        this.style.setProperty("--switch-width-fixed", widthMap[this.size]);
        this.style.setProperty(
            "--toggle-size",
            "calc(var(--switch-height) - (var(--switch-padding) * 2) - (var(--component-switch-border-width, 0px) * 2))",
        );
        this.style.setProperty("--switch-font-size", fontMap[this.size]);
    }

    _updateToggleLabelDisplay() {
        const show = this.toggleLabel;
        this.style.setProperty(
            "--show-toggle-label",
            show ? "inline-flex" : "none",
        );
        this.style.setProperty(
            "--switch-width",
            show ? "max-content" : "var(--switch-width-fixed)",
        );
        this.style.setProperty(
            "--toggle-width",
            show ? "auto" : "var(--toggle-size)",
        );
        this.style.setProperty(
            "--toggle-padding",
            show ? "0 var(--spacing-small)" : "0",
        );
        this.style.setProperty(
            "--toggle-radius",
            show ? "var(--component-switch-border-radius)" : "9999px",
        );
    }

    _updateTogglePosition() {
        this.style.setProperty(
            "--toggle-x",
            this.checked
                ? this.toggleLabel
                    ? "100%"
                    : "calc(var(--switch-width) - var(--toggle-size) - (var(--switch-padding) * 2) - (var(--component-switch-border-width, 0px) * 2))"
                : "0",
        );
        const onColor = this._resolveColor(
            this.onColor,
            "var(--primary-content--)",
        );
        this.style.setProperty("--switch-on-color", onColor);
        this.style.setProperty(
            "--toggle-bg",
            this.checked
                ? onColor
                : this._resolveColor(
                      this.offColor,
                      "var(--base-content-light)",
                  ),
        );
        this.style.setProperty(
            "--toggle-transition",
            this.animate
                ? "transform 0.25s ease, background 0.25s ease"
                : "none",
        );
    }
}

if (!customElements.get("y-switch")) {
    customElements.define("y-switch", YumeSwitch);
}
