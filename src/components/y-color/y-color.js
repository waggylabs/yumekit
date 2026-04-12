import "../y-colorpicker/y-colorpicker.js";
import "../y-icon/y-icon.js";
import "../y-input/y-input.js";
import { manageLabelVisibility } from "../../modules/helpers.js";

export class YumeColor extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "value",
            "format",
            "formats",
            "show-alpha",
            "placeholder",
            "name",
            "disabled",
            "invalid",
            "clearable",
            "size",
            "label-position",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this._onDocumentClick = this._onDocumentClick.bind(this);
        this._clickInsidePopup = false;
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        this.render();
        // Mark clicks inside this element before DOM mutations can invalidate composedPath
        this.addEventListener("pointerdown", () => {
            this._clickInsidePopup = true;
        });
        document.addEventListener("click", this._onDocumentClick);
    }

    disconnectedCallback() {
        document.removeEventListener("click", this._onDocumentClick);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "value") {
            this._internals.setFormValue(newVal || "", this.name);
            this._updateDisplay();
            this._syncPickerValue();
            return;
        }
        if (name === "name") {
            this._internals.setFormValue(this.value, newVal);
            return;
        }
        if (name === "format") {
            const picker = this.shadowRoot.querySelector("y-colorpicker");
            if (picker) picker.setAttribute("format", newVal);
            return;
        }
        if (name === "invalid") {
            this._updateValidationState();
            return;
        }
        if (this.shadowRoot.innerHTML) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    get clearable() {
        return this.hasAttribute("clearable");
    }
    set clearable(v) {
        v
            ? this.setAttribute("clearable", "")
            : this.removeAttribute("clearable");
    }

    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(v) {
        v
            ? this.setAttribute("disabled", "")
            : this.removeAttribute("disabled");
    }

    get format() {
        return this.getAttribute("format") || "hex";
    }
    set format(v) {
        this.setAttribute("format", v);
    }

    get formats() {
        try {
            return JSON.parse(
                this.getAttribute("formats") || '["hex","rgb","hsl","hsv"]',
            );
        } catch {
            return ["hex", "rgb", "hsl", "hsv"];
        }
    }
    set formats(v) {
        this.setAttribute("formats", JSON.stringify(v));
    }

    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(v) {
        v ? this.setAttribute("invalid", "") : this.removeAttribute("invalid");
    }

    get labelPosition() {
        return this.getAttribute("label-position") || "top";
    }
    set labelPosition(v) {
        this.setAttribute("label-position", v);
    }

    get name() {
        return this.getAttribute("name") || "";
    }
    set name(v) {
        this.setAttribute("name", v);
    }

    get placeholder() {
        return this.getAttribute("placeholder") || "Select color";
    }
    set placeholder(v) {
        this.setAttribute("placeholder", v);
    }

    get showAlpha() {
        return this.hasAttribute("show-alpha");
    }
    set showAlpha(v) {
        v
            ? this.setAttribute("show-alpha", "")
            : this.removeAttribute("show-alpha");
    }

    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(v) {
        this.setAttribute("size", v);
    }

    get value() {
        return this.getAttribute("value") || "";
    }
    set value(v) {
        this.setAttribute("value", v);
        this._internals.setFormValue(v, this.name);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    clear() {
        this.value = "";
        this._internals.setFormValue("", this.name);
        this._updateDisplay();
        const picker = this.shadowRoot.querySelector("y-colorpicker");
        if (picker) picker.setColor("");
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: "",
                    hex: "",
                    rgb: "",
                    hsl: "",
                    hsv: "",
                    alpha: 1,
                },
            }),
        );
    }

    close() {
        this._setOpen(false);
    }

    open() {
        if (!this.disabled) this._setOpen(true);
    }

    render() {
        const isDisabled = this.disabled;
        const isLabelTop = this.labelPosition === "top";
        const size = this.size;
        const labelSlot = `<div class="label-wrapper" part="label-wrapper"><slot name="label"></slot></div>`;

        const pickerAttrs = [
            this.value ? `value="${this.value}"` : "",
            `format="${this.format}"`,
            `formats='${JSON.stringify(this.formats)}'`,
            this.showAlpha ? "show-alpha" : "",
            `size="${size}"`,
        ]
            .filter(Boolean)
            .join(" ");

        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles(isDisabled)}</style>
            <div class="color" part="color">
                <div class="wrapper" part="wrapper">
                    ${isLabelTop ? labelSlot : ""}
                    <div
                        class="trigger${this.invalid ? " is-invalid" : ""}"
                        part="trigger"
                        role="combobox"
                        aria-haspopup="true"
                        aria-expanded="false"
                        tabindex="${isDisabled ? "-1" : "0"}"
                        ${isDisabled ? 'aria-disabled="true"' : ""}
                    >
                        <div class="swatch${this.showAlpha ? " has-alpha" : ""}" part="swatch"
                            aria-hidden="true"
                            ${this.value ? `style="--_swatch-color: ${this.value}"` : ""}
                        ></div>
                        <span class="display" part="display">${this.value || this.placeholder}</span>
                        ${
                            this.clearable && this.value
                                ? `<button class="clear-btn" part="clear-btn" aria-label="Clear color" tabindex="-1" type="button">
                                    <y-icon name="close" size="small"></y-icon>
                                </button>`
                                : ""
                        }
                    </div>
                    <div class="popup" part="popup" role="dialog" aria-label="Color picker" hidden>
                        <y-colorpicker ${pickerAttrs}></y-colorpicker>
                    </div>
                    ${!isLabelTop ? labelSlot : ""}
                </div>
            </div>
        `;

        manageLabelVisibility(this.shadowRoot.querySelector(".label-wrapper"));
        if (!isDisabled) this._bindListeners();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindListeners() {
        const trigger = this.shadowRoot.querySelector(".trigger");
        const popup = this.shadowRoot.querySelector(".popup");
        const picker = this.shadowRoot.querySelector("y-colorpicker");
        const clearBtn = this.shadowRoot.querySelector(".clear-btn");

        trigger.addEventListener("click", (e) => {
            if (
                clearBtn &&
                (e.target === clearBtn || clearBtn.contains(e.target))
            )
                return;
            this._setOpen(popup.hidden);
        });

        trigger.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this._setOpen(popup.hidden);
            }
            if (e.key === "Escape") {
                this._setOpen(false);
            }
        });

        clearBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clear();
        });

        // Listen for color changes from the picker
        picker.addEventListener("change", (e) => {
            if (e.composedPath()[0] !== picker) return;
            const detail = e.detail;
            this.setAttribute("value", detail.value);
            this._internals.setFormValue(detail.value, this.name);
            this._updateDisplay();
            this.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail,
                }),
            );
        });

        // Listen for format changes
        picker.addEventListener("format-change", (e) => {
            const newFmt = e.detail?.format;
            if (newFmt) {
                this.setAttribute("format", newFmt);
                this._updateDisplay();
            }
        });
    }

    _buildStyles(isDisabled) {
        const size = this.size;
        const heightMap = {
            small: "var(--sizing-small, 32px)",
            medium: "var(--sizing-medium, 40px)",
            large: "var(--sizing-large, 56px)",
        };
        const swatchMap = {
            small: "var(--component-color-swatch-size-small, var(--sizing-small, 32px))",
            medium: "var(--component-color-swatch-size-medium, var(--sizing-medium, 40px))",
            large: "var(--component-color-swatch-size-large, var(--sizing-large, 56px))",
        };
        const paddingMap = {
            small: "var(--component-inputs-padding-small)",
            medium: "var(--component-inputs-padding-medium)",
            large: "var(--component-inputs-padding-large)",
        };
        const minHeight = heightMap[size] || heightMap.medium;
        const swatchSize = swatchMap[size] || swatchMap.medium;
        const padding = paddingMap[size] || paddingMap.medium;

        return `
            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-input-color);
                opacity: ${isDisabled ? "0.75" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .color {
                display: flex;
                flex-direction: column;
            }

            .wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .label-wrapper {
                display: none;
            }

            .trigger {
                all: unset;
                display: flex;
                align-items: center;
                gap: var(--component-color-trigger-gap, var(--spacing-x-small));
                background: var(--component-input-background);
                border: var(--component-inputs-border-width) solid var(--component-input-border-color);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: ${padding};
                min-height: ${minHeight};
                box-sizing: border-box;
                cursor: pointer;
                user-select: none;
                transition: border-color 0.2s ease-in-out;
            }

            .trigger:hover {
                border-color: var(--component-input-color);
            }

            .trigger:focus-visible {
                border-color: var(--component-input-accent);
                outline: 2px solid var(--component-input-accent);
                outline-offset: -2px;
            }

            .trigger.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            /* ── Swatch ── */
            .swatch {
                flex-shrink: 0;
                width: calc(${swatchSize} - ${padding} - ${padding});
                height: calc(${swatchSize} - ${padding} - ${padding});
                border-radius: var(--component-color-swatch-border-radius, var(--radii-small));
                border: 1px solid var(--base-border, #ccc);
                background-color: var(--_swatch-color, transparent);
            }

            .swatch.has-alpha {
                background-image:
                    linear-gradient(var(--_swatch-color, transparent), var(--_swatch-color, transparent)),
                    linear-gradient(45deg,
                        var(--base-content-lightest, #ccc) 25%, transparent 25%,
                        transparent 75%, var(--base-content-lightest, #ccc) 75%),
                    linear-gradient(45deg,
                        var(--base-content-lightest, #ccc) 25%, transparent 25%,
                        transparent 75%, var(--base-content-lightest, #ccc) 75%);
                background-size: 100% 100%, 8px 8px, 8px 8px;
                background-position: 0 0, 0 0, 4px 4px;
                background-color: transparent;
            }

            /* ── Display ── */
            .display {
                flex: 1;
                min-width: 0;
                font-family: inherit;
                font-size: 1em;
                color: inherit;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            .display.is-placeholder {
                color: var(--base-content-light);
            }

            /* ── Clear button ── */
            .clear-btn {
                all: unset;
                display: flex;
                align-items: center;
                cursor: pointer;
                flex-shrink: 0;
                color: var(--component-input-icon-color);
                opacity: 0.7;
                border-radius: 50%;
                padding: 2px;
            }

            .clear-btn:hover {
                opacity: 1;
                background: var(--base-background-component);
            }

            /* ── Label ── */
            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-input-label-color);
            }

            .label-wrapper.is-invalid ::slotted([slot="label"]) {
                color: var(--component-input-error-color);
            }

            /* ── Popup ── */
            .popup {
                position: absolute;
                top: calc(100% + var(--component-color-popup-offset, 4px));
                left: 0;
                z-index: var(--component-color-z-index, 200);
                background: var(--base-background-app);
                border: var(--component-inputs-border-width) solid var(--base-border);
                border-radius: var(--component-colorpicker-border-radius, var(--radii-x-small));
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: var(--spacing-small, 8px);
            }
        `;
    }

    _onDocumentClick() {
        if (this._clickInsidePopup) {
            this._clickInsidePopup = false;
            return;
        }
        this._setOpen(false);
    }

    _positionPopup(popup, trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        const gap = parseInt(
            getComputedStyle(this).getPropertyValue(
                "--component-color-popup-offset",
            ) || "4",
            10,
        );
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const spaceBelow = vh - triggerRect.bottom - gap;
        const spaceAbove = triggerRect.top - gap;
        if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
            popup.style.top = `calc(100% + ${gap}px)`;
            popup.style.bottom = "auto";
        } else {
            popup.style.top = "auto";
            popup.style.bottom = `calc(100% + ${gap}px)`;
        }

        const spaceRight = vw - triggerRect.left;
        if (spaceRight >= popupWidth) {
            popup.style.left = "0";
            popup.style.right = "auto";
        } else {
            popup.style.left = "auto";
            popup.style.right = "0";
        }
    }

    _setOpen(open) {
        const popup = this.shadowRoot.querySelector(".popup");
        const trigger = this.shadowRoot.querySelector(".trigger");
        if (!popup || !trigger) return;
        const wasOpen = !popup.hidden;
        popup.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
        if (open) {
            this._positionPopup(popup, trigger);
        } else if (wasOpen) {
            trigger.focus({ preventScroll: true });
        }
    }

    _syncPickerValue() {
        const picker = this.shadowRoot.querySelector("y-colorpicker");
        if (picker && this.value) picker.setColor(this.value);
    }

    _updateClearBtn() {
        if (!this.clearable) return;
        const trigger = this.shadowRoot.querySelector(".trigger");
        if (!trigger) return;

        const existing = trigger.querySelector(".clear-btn");
        const display = trigger.querySelector(".display");

        if (this.value && !existing) {
            const btn = document.createElement("button");
            btn.className = "clear-btn";
            btn.setAttribute("part", "clear-btn");
            btn.setAttribute("aria-label", "Clear color");
            btn.setAttribute("tabindex", "-1");
            btn.setAttribute("type", "button");
            btn.innerHTML = `<y-icon name="close" size="small"></y-icon>`;
            display.insertAdjacentElement("afterend", btn);
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.clear();
            });
        } else if (!this.value && existing) {
            existing.remove();
        }
    }

    _updateDisplay() {
        const display = this.shadowRoot.querySelector(".display");
        const swatch = this.shadowRoot.querySelector(".swatch");
        if (display) {
            display.textContent = this.value || this.placeholder;
            display.classList.toggle("is-placeholder", !this.value);
        }
        if (swatch) {
            if (this.value) {
                swatch.style.setProperty("--_swatch-color", this.value);
            } else {
                swatch.style.removeProperty("--_swatch-color");
            }
        }
        this._updateClearBtn();
    }

    _updateValidationState() {
        const trigger = this.shadowRoot.querySelector(".trigger");
        const label = this.shadowRoot.querySelector(".label-wrapper");
        trigger?.classList.toggle("is-invalid", this.invalid);
        label?.classList.toggle("is-invalid", this.invalid);
    }
}

if (!customElements.get("y-color")) {
    customElements.define("y-color", YumeColor);
}
