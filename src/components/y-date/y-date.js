import "../y-datepicker/y-datepicker.js";
import "../y-icon/y-icon.js";

export class YumeDate extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "mode",
            "value",
            "min",
            "max",
            "format",
            "placeholder",
            "size",
            "disabled",
            "invalid",
            "name",
            "label-position",
            "color",
            "clearable",
            "show-time",
            "show-minutes",
            "show-seconds",
            "show-years",
            "show-months",
            "show-days",
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
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        this.render();
        document.addEventListener("click", this._onDocumentClick);
    }

    disconnectedCallback() {
        document.removeEventListener("click", this._onDocumentClick);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "value") {
            this._internals.setFormValue(newVal, this.getAttribute("name"));
            this._updateDisplay();
            this._syncPickerValue();
            return;
        }
        if (name === "name") {
            this._internals.setFormValue(this.value, newVal);
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

    /** @type {boolean} Whether to show a clear button when a value is set. */
    get clearable() {
        return this.hasAttribute("clearable");
    }
    set clearable(v) {
        v
            ? this.setAttribute("clearable", "")
            : this.removeAttribute("clearable");
    }

    /** @type {string} Color theme passed to the datepicker (default "primary"). */
    get color() {
        return this.getAttribute("color") || "primary";
    }
    set color(v) {
        this.setAttribute("color", v);
    }

    /** @type {boolean} Whether the field is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(v) {
        v
            ? this.setAttribute("disabled", "")
            : this.removeAttribute("disabled");
    }

    /** @type {string} Date display format string (default "MM/DD/YYYY"). */
    get format() {
        return this.getAttribute("format") || "MM/DD/YYYY";
    }
    set format(v) {
        this.setAttribute("format", v);
    }

    /** @type {boolean} Whether the field is in an invalid state. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(v) {
        v ? this.setAttribute("invalid", "") : this.removeAttribute("invalid");
    }

    /** @type {string} Label position: "top" | "bottom" (default "top"). */
    get labelPosition() {
        return this.getAttribute("label-position") || "top";
    }
    set labelPosition(v) {
        this.setAttribute("label-position", v);
    }

    /** @type {string} Maximum selectable date (ISO string). */
    get max() {
        return this.getAttribute("max") || "";
    }
    set max(v) {
        this.setAttribute("max", v);
    }

    /** @type {string} Minimum selectable date (ISO string). */
    get min() {
        return this.getAttribute("min") || "";
    }
    set min(v) {
        this.setAttribute("min", v);
    }

    /** @type {string} "single" | "range" (default "single"). */
    get mode() {
        return this.getAttribute("mode") || "single";
    }
    set mode(v) {
        this.setAttribute("mode", v);
    }

    /** @type {string} Form field name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(v) {
        this.setAttribute("name", v);
    }

    /** @type {string} Placeholder text. */
    get placeholder() {
        return (
            this.getAttribute("placeholder") ||
            (this.mode === "range" ? "Select date range" : "Select date")
        );
    }
    set placeholder(v) {
        this.setAttribute("placeholder", v);
    }

    /** @type {boolean} Show hour time picker. */
    get showTime() {
        return this.hasAttribute("show-time");
    }
    set showTime(v) {
        v
            ? this.setAttribute("show-time", "")
            : this.removeAttribute("show-time");
    }

    /** @type {boolean} Show minutes column in time picker. */
    get showMinutes() {
        return this.hasAttribute("show-minutes");
    }
    set showMinutes(v) {
        v
            ? this.setAttribute("show-minutes", "")
            : this.removeAttribute("show-minutes");
    }

    /** @type {boolean} Show seconds column in time picker. */
    get showSeconds() {
        return this.hasAttribute("show-seconds");
    }
    set showSeconds(v) {
        v
            ? this.setAttribute("show-seconds", "")
            : this.removeAttribute("show-seconds");
    }

    /** @type {boolean} Show year select in datepicker header (default true). */
    get showYears() {
        return this.getAttribute("show-years") !== "false";
    }
    set showYears(v) {
        this.setAttribute("show-years", v ? "true" : "false");
    }

    /** @type {boolean} Show month select in datepicker header (default true). */
    get showMonths() {
        return this.getAttribute("show-months") !== "false";
    }
    set showMonths(v) {
        this.setAttribute("show-months", v ? "true" : "false");
    }

    /** @type {boolean} Show day grid in datepicker (default true). */
    get showDays() {
        return this.getAttribute("show-days") !== "false";
    }
    set showDays(v) {
        this.setAttribute("show-days", v ? "true" : "false");
    }

    /** @type {string} Input size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(v) {
        this.setAttribute("size", v);
    }

    /** @type {string} The current value (ISO string, or "ISO,ISO" for range). */
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

    /** Clear the selected value. */
    clear() {
        this.value = "";
        this._internals.setFormValue("", this.name);
        this._updateDisplay();
        const picker = this.shadowRoot.querySelector("y-datepicker");
        if (picker) picker.clear();
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: "",
                    startDate: null,
                    endDate: null,
                    formatted: "",
                },
            }),
        );
    }

    /** Close the datepicker popup. */
    close() {
        this._setOpen(false);
    }

    /** Open the datepicker popup. */
    open() {
        this._setOpen(true);
    }

    render() {
        const isDisabled = this.disabled;
        const isLabelTop = this.labelPosition === "top";
        const labelSlot = `<div class="label-wrapper"><slot name="label"></slot></div>`;

        const pickerAttrs = [
            `mode="${this.mode}"`,
            `color="${this.color}"`,
            `format="${this.format}"`,
            this.value ? `value="${this.value}"` : "",
            this.min ? `min="${this.min}"` : "",
            this.max ? `max="${this.max}"` : "",
            this.hasAttribute("show-time") ? "show-time" : "",
            this.hasAttribute("show-minutes") ? "show-minutes" : "",
            this.hasAttribute("show-seconds") ? "show-seconds" : "",
            this.getAttribute("show-years") === "false"
                ? `show-years="false"`
                : "",
            this.getAttribute("show-months") === "false"
                ? `show-months="false"`
                : "",
            this.getAttribute("show-days") === "false"
                ? `show-days="false"`
                : "",
        ]
            .filter(Boolean)
            .join(" ");

        const displayText = this._getFormattedDisplay();

        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles(isDisabled)}</style>
            <div class="wrapper">
                ${isLabelTop ? labelSlot : ""}
                <div
                    class="trigger${this.invalid ? " is-invalid" : ""}"
                    role="combobox"
                    aria-expanded="false"
                    aria-haspopup="true"
                    tabindex="${isDisabled ? -1 : 0}"
                >
                    <slot name="left-icon"></slot>
                    <span class="display">${displayText || `<span class="placeholder">${this.placeholder}</span>`}</span>
                    ${
                        this.clearable && this.value
                            ? `<button class="clear-btn" aria-label="Clear date" tabindex="-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>`
                            : ""
                    }
                    <y-icon name="calendar" size="small" class="cal-icon"></y-icon>
                </div>
                <div class="popup" hidden>
                    <y-datepicker ${pickerAttrs}></y-datepicker>
                </div>
                ${!isLabelTop ? labelSlot : ""}
            </div>
        `;

        if (!isDisabled) this._bindListeners();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindListeners() {
        const trigger = this.shadowRoot.querySelector(".trigger");
        const popup = this.shadowRoot.querySelector(".popup");
        const picker = this.shadowRoot.querySelector("y-datepicker");
        const clearBtn = this.shadowRoot.querySelector(".clear-btn");

        trigger.addEventListener("click", (e) => {
            if (clearBtn && clearBtn.contains(e.target)) return;
            e.stopPropagation();
            this._setOpen(popup.hidden);
        });

        trigger.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                this._setOpen(popup.hidden);
            }
            if (e.key === "Escape") this._setOpen(false);
        });

        clearBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clear();
        });

        picker.addEventListener("change", (e) => {
            const { value, formatted } = e.detail;
            this.setAttribute("value", value);
            this._internals.setFormValue(value, this.name);

            const display = this.shadowRoot.querySelector(".display");
            if (display) {
                display.innerHTML = formatted
                    ? formatted
                    : `<span class="placeholder">${this.placeholder}</span>`;
            }

            this._updateClearBtn();

            if (this.mode === "single" && value) this._setOpen(false);

            this.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: e.detail,
                }),
            );
        });
    }

    _buildStyles(isDisabled) {
        const size = this.size;
        const heightMap = {
            small: "var(--sizing-small, 32px)",
            medium: "var(--sizing-medium, 40px)",
            large: "var(--sizing-large, 56px)",
        };
        const paddingMap = {
            small: "var(--component-inputs-padding-small)",
            medium: "var(--component-inputs-padding-medium)",
            large: "var(--component-inputs-padding-large)",
        };
        const minHeight = heightMap[size] || heightMap.medium;
        const padding = paddingMap[size] || paddingMap.medium;

        return `
            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-input-color);
                opacity: ${isDisabled ? "0.75" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .trigger {
                display: flex;
                align-items: center;
                gap: var(--spacing-x-small);
                background: var(--component-input-background);
                border: var(--component-inputs-border-width) solid var(--component-input-border-color);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: ${padding};
                min-height: ${minHeight};
                box-sizing: border-box;
                cursor: pointer;
                user-select: none;
                transition: border-color 0.2s ease-in-out;
                outline: none;
            }

            .trigger:hover {
                border-color: var(--component-input-color);
            }

            .trigger:focus {
                border-color: var(--component-input-accent);
            }

            .trigger.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            .display {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                font-size: 1em;
            }

            .placeholder {
                color: var(--base-content-light);
            }

            .cal-icon {
                display: flex;
                align-items: center;
                flex-shrink: 0;
                color: var(--component-input-icon-color);
            }

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

            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-input-label-color);
            }

            .label-wrapper.is-invalid ::slotted([slot="label"]) {
                color: var(--component-input-error-color);
            }

            ::slotted([slot="left-icon"]) {
                display: flex;
                align-items: center;
                color: var(--component-input-icon-color);
            }

            .popup {
                position: absolute;
                top: calc(100% + 4px);
                left: 0;
                z-index: var(--component-date-z-index);
                border-radius: var(--component-datepicker-border-radius);
                box-shadow: var(--component-datepicker-shadow);
            }
        `;
    }

    _getFormattedDisplay() {
        const value = this.value;
        if (!value) return "";
        const fmt = this.format;
        const formatOne = (iso) => {
            const d = new Date(iso);
            if (isNaN(d)) return "";
            const pad = (n) => String(n).padStart(2, "0");
            const h24 = d.getHours();
            const h12 = h24 % 12 || 12;
            return fmt
                .replace("YYYY", d.getFullYear())
                .replace("MM", pad(d.getMonth() + 1))
                .replace("DD", pad(d.getDate()))
                .replace("HH", pad(h24))
                .replace("hh", pad(h12))
                .replace("mm", pad(d.getMinutes()))
                .replace("ss", pad(d.getSeconds()))
                .replace("A", h24 >= 12 ? "PM" : "AM")
                .replace("a", h24 >= 12 ? "pm" : "am");
        };
        if (this.mode === "range") {
            const [s, e] = value.split(",");
            const start = s ? formatOne(s) : "";
            const end = e ? formatOne(e) : "";
            return start && end ? `${start} – ${end}` : start;
        }
        return formatOne(value);
    }

    _onDocumentClick(e) {
        if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
            this._setOpen(false);
        }
    }

    _setOpen(open) {
        const popup = this.shadowRoot.querySelector(".popup");
        const trigger = this.shadowRoot.querySelector(".trigger");
        if (!popup || !trigger) return;
        popup.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
    }

    _syncPickerValue() {
        const picker = this.shadowRoot.querySelector("y-datepicker");
        if (picker) picker.value = this.value;
    }

    _updateClearBtn() {
        if (!this.clearable) return;

        const trigger = this.shadowRoot.querySelector(".trigger");
        if (!trigger) return;

        const existing = trigger.querySelector(".clear-btn");
        const calIcon = trigger.querySelector(".cal-icon");

        if (this.value && !existing) {
            const btn = document.createElement("button");
            btn.className = "clear-btn";
            btn.setAttribute("aria-label", "Clear date");
            btn.setAttribute("tabindex", "-1");
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.clear();
            });
            trigger.insertBefore(btn, calIcon);
        } else if (!this.value && existing) {
            existing.remove();
        }
    }

    _updateDisplay() {
        const display = this.shadowRoot.querySelector(".display");
        if (!display) return;
        const text = this._getFormattedDisplay();
        display.innerHTML = text
            ? text
            : `<span class="placeholder">${this.placeholder}</span>`;
        this._updateClearBtn();
    }

    _updateValidationState() {
        const trigger = this.shadowRoot.querySelector(".trigger");
        const label = this.shadowRoot.querySelector(".label-wrapper");
        trigger?.classList.toggle("is-invalid", this.invalid);
        label?.classList.toggle("is-invalid", this.invalid);
    }
}

if (!customElements.get("y-date")) {
    customElements.define("y-date", YumeDate);
}
