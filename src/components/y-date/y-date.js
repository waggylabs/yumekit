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
                    tabindex="-1"
                >
                    <slot name="left-icon"></slot>
                    <input
                        class="display"
                        type="text"
                        value="${displayText}"
                        placeholder="${this.placeholder}"
                        autocomplete="off"
                        spellcheck="false"
                        ${isDisabled ? "disabled" : ""}
                    >
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
        const input = this.shadowRoot.querySelector(".display");

        // Flag set by picker change to prevent blur from overriding a picker selection
        let suppressBlurApply = false;

        // Clicking the icon / trigger area (not the input itself) toggles the popup
        trigger.addEventListener("click", (e) => {
            if (clearBtn && clearBtn.contains(e.target)) return;
            if (input && (e.target === input || input.contains(e.target))) {
                this._setOpen(true);
                return;
            }
            this._setOpen(popup.hidden);
            if (!popup.hidden) {
                input?.focus();
                input?.select();
            }
        });

        clearBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clear();
        });

        // Input: opening the picker
        input?.addEventListener("focus", () => {
            this._setOpen(true);
            input.select();
        });

        // Input: live-update picker as user types
        input?.addEventListener("input", () => {
            const parsed = this._parseTypedDate(input.value);
            if (parsed) picker.value = parsed.toISOString();
        });

        // Input: keyboard handling
        input?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                const parsed = this._parseTypedDate(input.value);
                if (parsed) {
                    this._applyParsedDate(parsed);
                    this._setOpen(false);
                }
            } else if (e.key === "Escape") {
                e.stopPropagation();
                input.value = this._getFormattedDisplay();
                this._setOpen(false);
            }
        });

        // Input: apply valid typed date on blur, revert if invalid
        // Uses setTimeout(0) so picker clicks can fire and set suppressBlurApply first
        input?.addEventListener("blur", () => {
            const capturedText = input.value.trim();
            setTimeout(() => {
                if (suppressBlurApply) {
                    suppressBlurApply = false;
                    input.value = this._getFormattedDisplay();
                    return;
                }
                if (!capturedText) {
                    if (this.value) this.clear();
                    return;
                }
                const parsed = this._parseTypedDate(capturedText);
                if (parsed) {
                    this._applyParsedDate(parsed);
                } else {
                    input.value = this._getFormattedDisplay();
                    this._syncPickerValue(); // reset picker to last committed date
                }
            }, 0);
        });

        // Picker date selection
        picker.addEventListener("change", (e) => {
            suppressBlurApply = true;
            const { value, formatted } = e.detail;
            this.setAttribute("value", value);
            this._internals.setFormValue(value, this.name);

            if (input) input.value = formatted || "";

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
                cursor: text;
                user-select: none;
                transition: border-color 0.2s ease-in-out;
                outline: none;
            }

            .trigger:hover {
                border-color: var(--component-input-color);
            }

            .trigger:focus-within {
                border-color: var(--component-input-accent);
            }

            .trigger.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            .display {
                flex: 1;
                min-width: 0;
                border: none;
                background: transparent;
                color: inherit;
                font-family: inherit;
                font-size: 1em;
                padding: 0;
                outline: none;
                cursor: text;
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }

            .display::placeholder {
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
        display.value = this._getFormattedDisplay();
        this._updateClearBtn();
    }

    _updateValidationState() {
        const trigger = this.shadowRoot.querySelector(".trigger");
        const label = this.shadowRoot.querySelector(".label-wrapper");
        trigger?.classList.toggle("is-invalid", this.invalid);
        label?.classList.toggle("is-invalid", this.invalid);
    }

    /**
     * Parse a user-typed string into a Date using this component's format.
     * Returns null if the text doesn't match the format or produces an invalid date.
     * @param {string} text
     * @returns {Date|null}
     */
    _parseTypedDate(text) {
        if (!text) return null;
        const fmt = this.format;

        const tokens = [
            { token: "YYYY", key: "year",   re: "(\\d{4})" },
            { token: "MM",   key: "month",  re: "(\\d{1,2})" },
            { token: "DD",   key: "day",    re: "(\\d{1,2})" },
            { token: "HH",   key: "hour24", re: "(\\d{1,2})" },
            { token: "hh",   key: "hour12", re: "(\\d{1,2})" },
            { token: "mm",   key: "minute", re: "(\\d{1,2})" },
            { token: "ss",   key: "second", re: "(\\d{1,2})" },
            { token: "A",    key: "ampm",   re: "(AM|PM)" },
            { token: "a",    key: "ampm",   re: "(am|pm)" },
        ];

        // Replace each token with a placeholder, then escape literal chars,
        // then restore token capture groups
        const order = [];
        let reStr = fmt;
        for (const t of tokens) {
            if (reStr.includes(t.token)) {
                reStr = reStr.replace(t.token, `\x00${order.length}\x00`);
                order.push(t);
            }
        }
        reStr = reStr.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
        order.forEach((t, i) => {
            reStr = reStr.replace(`\x00${i}\x00`, t.re);
        });

        const match = new RegExp(`^${reStr}$`, "i").exec(text.trim());
        if (!match) return null;

        const parts = {};
        order.forEach((t, i) => { parts[t.key] = match[i + 1]; });

        const year   = parts.year   ? parseInt(parts.year)       : new Date().getFullYear();
        const month  = parts.month  ? parseInt(parts.month) - 1  : 0;
        const day    = parts.day    ? parseInt(parts.day)        : 1;

        let hour = 0;
        if (parts.hour24 !== undefined) {
            hour = parseInt(parts.hour24);
        } else if (parts.hour12 !== undefined) {
            hour = parseInt(parts.hour12) % 12;
            if ((parts.ampm || "").toUpperCase() === "PM") hour += 12;
        }
        const minute = parts.minute ? parseInt(parts.minute) : 0;
        const second = parts.second ? parseInt(parts.second) : 0;

        if (month < 0 || month > 11) return null;
        if (day < 1 || day > 31) return null;
        if (hour < 0 || hour > 23) return null;
        if (minute < 0 || minute > 59) return null;
        if (second < 0 || second > 59) return null;

        const d = new Date(year, month, day, hour, minute, second);
        // Catch overflow (e.g. Feb 30 → Mar 2)
        if (d.getMonth() !== month || d.getDate() !== day) return null;
        return d;
    }

    /**
     * Apply a parsed Date as the component's value and emit a change event.
     * @param {Date} date
     */
    _applyParsedDate(date) {
        const iso = date.toISOString();
        this.setAttribute("value", iso);
        this._internals.setFormValue(iso, this.name);
        this._syncPickerValue();
        this._updateClearBtn();
        const display = this.shadowRoot.querySelector(".display");
        if (display) display.value = this._getFormattedDisplay();
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: iso,
                    startDate: date,
                    endDate: null,
                    formatted: this._getFormattedDisplay(),
                },
            }),
        );
    }
}

if (!customElements.get("y-date")) {
    customElements.define("y-date", YumeDate);
}
