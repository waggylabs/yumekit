import "../y-datepicker/y-datepicker.js";
import "../y-icon/y-icon.js";
import { manageLabelVisibility } from "../../modules/helpers.js";

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
            "show-hours",
            "show-minutes",
            "show-seconds",
            "hour-format",
            "minute-interval",
            "second-interval",
            "show-years",
            "show-months",
            "show-days",
            "mobile-breakpoint",
            "native-mobile",
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
        this._suppressBlurApply = false;
        this._selectedParts = new Set();
        this._mql = null;
        this._isMobile = false;
        this._onMediaChange = this._onMediaChange.bind(this);
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        this._setupMediaQuery();
        this.render();
        document.addEventListener("click", this._onDocumentClick);
    }

    disconnectedCallback() {
        document.removeEventListener("click", this._onDocumentClick);
        this._teardownMediaQuery();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "mobile-breakpoint") {
            this._setupMediaQuery();
        }
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

    /** @type {string} Date display format string. Defaults to "MM/DD/YYYY", or
     *  a time-aware variant when show-hours / show-minutes / show-seconds are set. */
    get format() {
        if (this.hasAttribute("format")) return this.getAttribute("format");
        if (this.showHours || this.showMinutes || this.showSeconds) {
            return this.showSeconds
                ? "MM/DD/YYYY hh:mm:ss A"
                : "MM/DD/YYYY hh:mm A";
        }
        return "MM/DD/YYYY";
    }
    set format(v) {
        this.setAttribute("format", v);
    }

    /** @type {string} Hour display format: "12" (default) or "24" */
    get hourFormat() {
        return this.getAttribute("hour-format") || "12";
    }
    set hourFormat(v) {
        this.setAttribute("hour-format", v);
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

    /** @type {number} Interval between minute options (default 5) */
    get minuteInterval() {
        return parseInt(this.getAttribute("minute-interval") || "5", 10);
    }
    set minuteInterval(v) {
        this.setAttribute("minute-interval", String(v));
    }

    /** @type {boolean} Whether the date input is currently rendering in mobile mode. */
    get mobile() {
        return this._isMobile;
    }

    /** @type {string} When true, renders native date inputs on mobile instead of the datepicker popup. */
    get nativeMobile() {
        return this.hasAttribute("native-mobile");
    }
    set nativeMobile(v) {
        v
            ? this.setAttribute("native-mobile", "")
            : this.removeAttribute("native-mobile");
    }

    /**
     * Override the mobile breakpoint (in pixels) for this instance.
     * Falls back to --component-datepicker-mobile-breakpoint (default 768).
     * @type {string}
     */
    get mobileBreakpoint() {
        return this.getAttribute("mobile-breakpoint") || "";
    }
    set mobileBreakpoint(v) {
        if (v) this.setAttribute("mobile-breakpoint", v);
        else this.removeAttribute("mobile-breakpoint");
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

    /** @type {number} Interval between second options (default 5) */
    get secondInterval() {
        return parseInt(this.getAttribute("second-interval") || "5", 10);
    }
    set secondInterval(v) {
        this.setAttribute("second-interval", String(v));
    }

    /** @type {boolean} Show day grid in datepicker (default true). */
    get showDays() {
        return this.getAttribute("show-days") !== "false";
    }
    set showDays(v) {
        this.setAttribute("show-days", v ? "true" : "false");
    }

    /** @type {boolean} Show hour time picker. */
    get showHours() {
        return this.hasAttribute("show-hours");
    }
    set showHours(v) {
        v
            ? this.setAttribute("show-hours", "")
            : this.removeAttribute("show-hours");
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

    /** @type {boolean} Show month select in datepicker header (default true). */
    get showMonths() {
        return this.getAttribute("show-months") !== "false";
    }
    set showMonths(v) {
        this.setAttribute("show-months", v ? "true" : "false");
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
        this._suppressBlurApply = true;
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
        if (this._isMobile && this.nativeMobile) {
            this._renderMobile();
            return;
        }
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
            this.hasAttribute("show-hours") ? "show-hours" : "",
            this.hasAttribute("show-minutes") ? "show-minutes" : "",
            this.hasAttribute("show-seconds") ? "show-seconds" : "",
            this.getAttribute("hour-format") === "24" ? `hour-format="24"` : "",
            this.hasAttribute("minute-interval")
                ? `minute-interval="${this.minuteInterval}"`
                : "",
            this.hasAttribute("second-interval")
                ? `second-interval="${this.secondInterval}"`
                : "",
            this.getAttribute("show-years") === "false"
                ? `show-years="false"`
                : "",
            this.getAttribute("show-months") === "false"
                ? `show-months="false"`
                : "",
            this.getAttribute("show-days") === "false"
                ? `show-days="false"`
                : "",
            this.mobileBreakpoint
                ? `mobile-breakpoint="${this.mobileBreakpoint}"`
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

        manageLabelVisibility(this.shadowRoot.querySelector(".label-wrapper"));
        if (!isDisabled) this._bindListeners();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

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

    /**
     * Apply a range value (start and optional end) to the component.
     * @param {Date} start
     * @param {Date|null} end
     */
    _applyRangeValue(start, end) {
        const isoStart = start.toISOString();
        const isoEnd = end ? end.toISOString() : "";
        const value = isoEnd ? `${isoStart},${isoEnd}` : isoStart;
        this.setAttribute("value", value);
        this._internals.setFormValue(value, this.name);
        this._syncPickerValue();
        this._updateClearBtn();
        const display = this.shadowRoot.querySelector(".display");
        if (display) display.value = this._getFormattedDisplay();
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value,
                    startDate: start,
                    endDate: end,
                    formatted: this._getFormattedDisplay(),
                },
            }),
        );
    }

    _bindListeners() {
        const trigger = this.shadowRoot.querySelector(".trigger");
        const popup = this.shadowRoot.querySelector(".popup");
        const picker = this.shadowRoot.querySelector("y-datepicker");
        const clearBtn = this.shadowRoot.querySelector(".clear-btn");
        const input = this.shadowRoot.querySelector(".display");

        // this._suppressBlurApply is set by clear() and picker change
        // to prevent the blur handler from re-applying a stale typed value

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

        // Trigger keyboard: Enter/Space toggles, Escape closes
        // (skipped when the event originates from the input itself)
        trigger.addEventListener("keydown", (e) => {
            if (e.target === input) return;
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

        // Input: opening the picker
        input?.addEventListener("focus", () => {
            this._setOpen(true);
            input.select();
        });

        // Input: live-update picker as user types (type-ahead)
        input?.addEventListener("input", () => {
            const text = input.value;
            if (this.mode === "range") {
                this._handleRangeTypeahead(text, picker);
                return;
            }
            // Full match → select the date in the picker
            const parsed = this._parseTypedDate(text);
            if (parsed) {
                picker.value = parsed.toISOString();
                return;
            }
            // Partial match → navigate the picker to the typed month/year
            const partial = this._parsePartialInput(text);
            if (!partial) return;
            const now = new Date();
            const year = partial.year ?? now.getFullYear();
            const month =
                partial.month !== undefined ? partial.month - 1 : undefined;
            if (partial.day && month !== undefined) {
                // Month + day available → construct a preview date and set as value
                // (this highlights the day in the calendar without dispatching events)
                const preview = new Date(year, month, partial.day);
                if (
                    preview.getMonth() === month &&
                    preview.getDate() === partial.day
                ) {
                    picker.value = preview.toISOString();
                    return;
                }
            }
            // Navigate to the month/year without selecting a day
            picker.navigateTo(year, month);
        });

        // Input: keyboard handling
        input?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                if (this.mode === "range") {
                    const result = this._parseRangeInput(input.value);
                    if (result) {
                        this._applyRangeValue(result.start, result.end);
                        this._setOpen(false);
                    }
                    return;
                }
                const parsed = this._parseTypedDate(input.value);
                if (parsed) {
                    this._applyParsedDate(parsed);
                    this._setOpen(false);
                    return;
                }
                // Accept partial type-ahead input by building a presumed date
                const presumed = this._buildPresumedDate(
                    this._parsePartialInput(input.value),
                );
                if (presumed) {
                    this._applyParsedDate(presumed);
                    this._setOpen(false);
                }
            } else if (e.key === "Escape") {
                e.stopPropagation();
                input.value = this._getFormattedDisplay();
                this._setOpen(false);
            }
        });

        // Input: apply valid typed date on blur, revert if invalid
        // Uses setTimeout(0) so picker clicks can fire and set this._suppressBlurApply first
        input?.addEventListener("blur", () => {
            const capturedText = input.value.trim();
            setTimeout(() => {
                if (this._suppressBlurApply) {
                    this._suppressBlurApply = false;
                    input.value = this._getFormattedDisplay();
                    return;
                }
                if (!capturedText) {
                    if (this.value) this.clear();
                    return;
                }
                if (this.mode === "range") {
                    const result = this._parseRangeInput(capturedText);
                    if (result) {
                        this._applyRangeValue(result.start, result.end);
                    } else {
                        input.value = this._getFormattedDisplay();
                        this._syncPickerValue();
                    }
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
        // Guard: ignore composed change events from child y-selects (month/year dropdowns)
        picker.addEventListener("change", (e) => {
            if (e.composedPath()[0] !== picker) return;
            this._suppressBlurApply = true;
            const { value, formatted } = e.detail;
            this.setAttribute("value", value);
            this._internals.setFormValue(value, this.name);

            if (input) input.value = formatted || "";

            this._updateClearBtn();

            // Auto-close once all available parts have been selected
            if (this.mode === "single" && value) {
                const src = e.detail.source;
                if (src) this._selectedParts.add(src);
                const required = ["day"];
                if (picker.showHours) required.push("hour");
                if (picker.showMinutes) required.push("minute");
                if (picker.showSeconds) required.push("second");
                if (required.every((p) => this._selectedParts.has(p))) {
                    this._setOpen(false);
                }
            }

            this.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: e.detail,
                }),
            );
        });
    }

    _bindMobileListeners() {
        const root = this.shadowRoot;
        const clearBtn = root.querySelector(".clear-btn");

        clearBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clear();
        });

        root.querySelectorAll(".native-date").forEach((input) => {
            input.addEventListener("change", () => {
                const isRange = this.mode === "range";

                if (isRange) {
                    const startInput = root.querySelector(
                        '[data-side="start"]',
                    );
                    const endInput = root.querySelector('[data-side="end"]');
                    const s = startInput?.value
                        ? new Date(startInput.value).toISOString()
                        : "";
                    const e = endInput?.value
                        ? new Date(endInput.value).toISOString()
                        : "";
                    const value = [s, e].filter(Boolean).join(",");
                    this.setAttribute("value", value);
                    this._internals.setFormValue(value, this.name);
                    this._updateClearBtn();
                    this.dispatchEvent(
                        new CustomEvent("change", {
                            bubbles: true,
                            composed: true,
                            detail: {
                                value,
                                startDate: s ? new Date(s) : null,
                                endDate: e ? new Date(e) : null,
                                formatted: this._getFormattedDisplay(),
                            },
                        }),
                    );
                } else {
                    const val = input.value;
                    if (!val) {
                        this.clear();
                        return;
                    }
                    const d = new Date(val);
                    if (!isNaN(d)) {
                        this._applyParsedDate(d);
                    }
                }
            });
        });
    }

    /**
     * Build a presumed Date from partial input parts, filling in defaults.
     * Returns null if the result is invalid.
     * @param {{ month?: number, day?: number, year?: number, hour?: number, minute?: number, second?: number } | null} partial
     * @returns {Date | null}
     */
    _buildPresumedDate(partial) {
        if (!partial) return null;
        const now = new Date();
        const year = partial.year ?? now.getFullYear();
        const month =
            partial.month !== undefined ? partial.month - 1 : now.getMonth();
        const day = partial.day ?? 1;
        const hour = partial.hour ?? 0;
        const minute = partial.minute ?? 0;
        const second = partial.second ?? 0;
        const d = new Date(year, month, day, hour, minute, second);
        if (isNaN(d) || d.getMonth() !== month || d.getDate() !== day)
            return null;
        return d;
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

            .label-wrapper {
                display: none;
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

            .native-date {
                flex: 1;
                min-width: 0;
                border: none;
                background: transparent;
                color: inherit;
                font-family: inherit;
                font-size: 1em;
                padding: 0;
                outline: none;
            }

            .native-sep {
                flex-shrink: 0;
                padding: 0 var(--spacing-x-small, 6px);
                color: var(--base-content-light);
            }
        `;
    }

    _getBreakpointPx() {
        const attr = this.mobileBreakpoint;
        if (attr) {
            const px = parseInt(attr, 10);
            if (!isNaN(px) && px > 0) return px;
        }
        const cssVal = getComputedStyle(document.documentElement)
            .getPropertyValue("--component-datepicker-mobile-breakpoint")
            .trim();
        if (cssVal) {
            const px = parseInt(cssVal, 10);
            if (!isNaN(px) && px > 0) return px;
        }
        return 768;
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
            return start && end ? `${start} - ${end}` : start;
        }
        return formatOne(value);
    }

    /**
     * Handle type-ahead input for range mode.
     * Parses partial range text and navigates/highlights in the picker.
     * @param {string} text
     * @param {HTMLElement} picker
     */
    _handleRangeTypeahead(text, picker) {
        const result = this._parseRangeInput(text);
        if (!result) return;

        // If we have both start and end, set the full range on the picker
        if (result.start && result.end) {
            picker.value = `${result.start.toISOString()},${result.end.toISOString()}`;
            return;
        }

        // Check if the user is typing the end date (text contains " - ")
        if (text.indexOf(" - ") >= 0) {
            const endText = text.slice(text.indexOf(" - ") + 3).trim();
            if (endText) {
                // Parse partial end date for navigation
                const partial = this._parsePartialInput(endText);
                if (partial) {
                    const now = new Date();
                    const year = partial.year ?? now.getFullYear();
                    const month =
                        partial.month !== undefined
                            ? partial.month - 1
                            : undefined;
                    if (partial.day && month !== undefined) {
                        const preview = new Date(year, month, partial.day);
                        if (
                            preview.getMonth() === month &&
                            preview.getDate() === partial.day
                        ) {
                            picker.value = `${result.start.toISOString()},${preview.toISOString()}`;
                            return;
                        }
                    }
                    picker.navigateTo(year, month);
                }
            }
            return;
        }

        // Only start date so far — navigate picker to it
        if (result.start) {
            picker.value = result.start.toISOString();
        }
    }

    _onDocumentClick(e) {
        if (!this.contains(e.target) && !this.shadowRoot.contains(e.target)) {
            this._setOpen(false);
        }
    }

    _onMediaChange(e) {
        this._isMobile = e.matches;
        this.render();
    }

    _positionPopup(popup, trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        const gap = 4;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Vertical: prefer below; flip above when not enough space below and more space above
        const spaceBelow = vh - triggerRect.bottom - gap;
        const spaceAbove = triggerRect.top - gap;
        if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
            popup.style.top = `calc(100% + ${gap}px)`;
            popup.style.bottom = "auto";
        } else {
            popup.style.top = "auto";
            popup.style.bottom = `calc(100% + ${gap}px)`;
        }

        // Horizontal: prefer left-aligned; flip to right-aligned when popup overflows viewport
        const spaceRight = vw - triggerRect.left;
        if (spaceRight >= popupWidth) {
            popup.style.left = "0";
            popup.style.right = "auto";
        } else {
            popup.style.left = "auto";
            popup.style.right = "0";
        }
    }

    /**
     * Parse partial user input and return an object with whatever date parts
     * could be extracted based on the format string.  Returns null if nothing
     * matches.
     *
     * For format "MM/DD/YYYY" and input "04"  → { month: 4 }
     * For format "MM/DD/YYYY" and input "04/15" → { month: 4, day: 15 }
     * For format "MM/DD/YYYY" and input "04/15/2026" → { month: 4, day: 15, year: 2026 }
     *
     * @param {string} text
     * @returns {{ month?: number, day?: number, year?: number, hour?: number, minute?: number, second?: number } | null}
     */
    _parsePartialInput(text) {
        if (!text) return null;
        const fmt = this.format;

        const tokenDefs = [
            { token: "YYYY", key: "year", re: "(\\d{1,4})" },
            { token: "MM", key: "month", re: "(\\d{1,2})" },
            { token: "DD", key: "day", re: "(\\d{1,2})" },
            { token: "HH", key: "hour", re: "(\\d{1,2})" },
            { token: "hh", key: "hour", re: "(\\d{1,2})" },
            { token: "mm", key: "minute", re: "(\\d{1,2})" },
            { token: "ss", key: "second", re: "(\\d{1,2})" },
            { token: "A", key: "ampm", re: "(AM|PM)" },
            { token: "a", key: "ampm", re: "(am|pm)" },
        ];

        // Parse format into ordered groups: [{ key, re, sep }, ...]
        // Each group is a token followed by the literal separator after it.
        const groups = [];
        let remaining = fmt;
        while (remaining.length > 0) {
            let matched = false;
            for (const td of tokenDefs) {
                if (remaining.startsWith(td.token)) {
                    groups.push({ key: td.key, re: td.re, sep: "" });
                    remaining = remaining.slice(td.token.length);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                // Literal character — attach to previous group's separator
                if (groups.length > 0) {
                    groups[groups.length - 1].sep += remaining[0];
                }
                remaining = remaining.slice(1);
            }
        }

        if (groups.length === 0) return null;

        // Build a progressive regex where each subsequent group is optional.
        // For "MM/DD/YYYY" this produces: ^(\d{1,2})(?:\/(\d{1,2})(?:\/(\d{1,4}))?)?$
        let reStr = "";
        for (let j = groups.length - 1; j >= 0; j--) {
            const g = groups[j];
            if (j === groups.length - 1) {
                reStr = g.re;
            } else {
                const sepEsc = g.sep.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&");
                reStr = g.re + "(?:" + sepEsc + reStr + ")?";
            }
        }

        const match = new RegExp("^" + reStr + "$", "i").exec(text.trim());
        if (!match) return null;

        const result = {};
        groups.forEach((g, i) => {
            const val = match[i + 1];
            if (val === undefined) return;
            if (g.key === "ampm") {
                result.ampm = val.toUpperCase();
            } else {
                result[g.key] = parseInt(val, 10);
            }
        });

        // Adjust 12-hour clock if ampm is present
        if (result.hour !== undefined && result.ampm) {
            result.hour = (result.hour % 12) + (result.ampm === "PM" ? 12 : 0);
        }

        // Basic range validation on whatever parts we have
        if (
            result.month !== undefined &&
            (result.month < 1 || result.month > 12)
        )
            return null;
        if (result.day !== undefined && (result.day < 1 || result.day > 31))
            return null;
        if (result.hour !== undefined && (result.hour < 0 || result.hour > 23))
            return null;
        if (
            result.minute !== undefined &&
            (result.minute < 0 || result.minute > 59)
        )
            return null;
        if (
            result.second !== undefined &&
            (result.second < 0 || result.second > 59)
        )
            return null;

        return Object.keys(result).length > 0 ? result : null;
    }

    /**
     * Parse range input text in the form "start - end" or just "start".
     * Each side can be a full or partial date string.
     * Returns { start: Date, end: Date|null } or null if unparseable.
     * @param {string} text
     * @returns {{ start: Date, end: Date|null } | null}
     */
    _parseRangeInput(text) {
        if (!text) return null;
        // Split on " - " (the range separator)
        const sepIdx = text.indexOf(" - ");
        let startText, endText;
        if (sepIdx >= 0) {
            startText = text.slice(0, sepIdx).trim();
            endText = text.slice(sepIdx + 3).trim();
        } else {
            startText = text.trim();
            endText = "";
        }

        const parseOne = (t) => {
            if (!t) return null;
            const full = this._parseTypedDate(t);
            if (full) return full;
            return this._buildPresumedDate(this._parsePartialInput(t));
        };

        const start = parseOne(startText);
        if (!start) return null;
        const end = endText ? parseOne(endText) : null;
        return { start, end };
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
            { token: "YYYY", key: "year", re: "(\\d{4})" },
            { token: "MM", key: "month", re: "(\\d{1,2})" },
            { token: "DD", key: "day", re: "(\\d{1,2})" },
            { token: "HH", key: "hour24", re: "(\\d{1,2})" },
            { token: "hh", key: "hour12", re: "(\\d{1,2})" },
            { token: "mm", key: "minute", re: "(\\d{1,2})" },
            { token: "ss", key: "second", re: "(\\d{1,2})" },
            { token: "A", key: "ampm", re: "(AM|PM)" },
            { token: "a", key: "ampm", re: "(am|pm)" },
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
        order.forEach((t, i) => {
            parts[t.key] = match[i + 1];
        });

        const year = parts.year
            ? parseInt(parts.year)
            : new Date().getFullYear();
        const month = parts.month ? parseInt(parts.month) - 1 : 0;
        const day = parts.day ? parseInt(parts.day) : 1;

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

    _renderMobile() {
        const isDisabled = this.disabled;
        const isLabelTop = this.labelPosition === "top";
        const labelSlot = `<div class="label-wrapper"><slot name="label"></slot></div>`;
        const hasTime = this.showHours || this.showMinutes || this.showSeconds;
        const inputType = hasTime ? "datetime-local" : "date";
        const isRange = this.mode === "range";

        const toNativeVal = (iso) => {
            if (!iso) return "";
            const d = new Date(iso);
            if (isNaN(d)) return "";
            const pad = (n) => String(n).padStart(2, "0");
            const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
            if (!hasTime) return datePart;
            return `${datePart}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        };

        let startVal = "";
        let endVal = "";
        if (isRange && this.value) {
            const [s, e] = this.value.split(",");
            startVal = toNativeVal(s);
            endVal = toNativeVal(e);
        } else {
            startVal = toNativeVal(this.value);
        }

        const minAttr = this.min ? ` min="${toNativeVal(this.min)}"` : "";
        const maxAttr = this.max ? ` max="${toNativeVal(this.max)}"` : "";

        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles(isDisabled)}</style>
            <div class="wrapper">
                ${isLabelTop ? labelSlot : ""}
                <div class="trigger${this.invalid ? " is-invalid" : ""}">
                    <slot name="left-icon"></slot>
                    ${
                        isRange
                            ? `
                        <input class="native-date" type="${inputType}" data-side="start"
                            value="${startVal}"${minAttr}${maxAttr}
                            ${isDisabled ? "disabled" : ""}>
                        <span class="native-sep">–</span>
                        <input class="native-date" type="${inputType}" data-side="end"
                            value="${endVal}"${minAttr}${maxAttr}
                            ${isDisabled ? "disabled" : ""}>
                    `
                            : `
                        <input class="native-date" type="${inputType}" data-side="start"
                            value="${startVal}"${minAttr}${maxAttr}
                            ${isDisabled ? "disabled" : ""}>
                    `
                    }
                    ${
                        this.clearable && this.value
                            ? `<button class="clear-btn" aria-label="Clear date" tabindex="-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>`
                            : ""
                    }
                </div>
                ${!isLabelTop ? labelSlot : ""}
            </div>
        `;

        if (!isDisabled) this._bindMobileListeners();
    }

    _setOpen(open) {
        const popup = this.shadowRoot.querySelector(".popup");
        const trigger = this.shadowRoot.querySelector(".trigger");
        if (!popup || !trigger) return;
        popup.hidden = !open;
        trigger.setAttribute("aria-expanded", String(open));
        if (open) {
            this._selectedParts.clear();
            this._positionPopup(popup, trigger);
        }
    }

    _setupMediaQuery() {
        this._teardownMediaQuery();
        const bp = this._getBreakpointPx();
        this._mql = window.matchMedia(`(max-width: ${bp}px)`);
        this._isMobile = this._mql.matches;
        this._mql.addEventListener("change", this._onMediaChange);
    }

    _syncPickerValue() {
        const picker = this.shadowRoot.querySelector("y-datepicker");
        if (picker) picker.value = this.value;
    }

    _teardownMediaQuery() {
        if (this._mql) {
            this._mql.removeEventListener("change", this._onMediaChange);
            this._mql = null;
        }
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
}

if (!customElements.get("y-date")) {
    customElements.define("y-date", YumeDate);
}
