import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-input/y-input.js";
import "../y-select/y-select.js";
import { upgradeProperties } from "../../modules/helpers.js";

const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export class YumeDatepicker extends HTMLElement {
    static get observedAttributes() {
        return [
            "mode",
            "value",
            "min",
            "max",
            "show-hours",
            "show-minutes",
            "show-seconds",
            "show-years",
            "show-months",
            "show-days",
            "format",
            "hour-format",
            "minute-interval",
            "second-interval",
            "color",
            "mobile-breakpoint",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._viewDate = new Date();
        this._viewDate.setDate(1);
        this._viewDate.setHours(0, 0, 0, 0);
        this._startDate = null;
        this._endDate = null;
        this._hoverDate = null;
        this._awaitingEnd = false;
        this._startTime = { h: 0, m: 0, s: 0 };
        this._endTime = { h: 0, m: 0, s: 0 };
        this._yearRangeStart = null;
        this._yearRangeEnd = null;
        this._mql = null;
        this._isMobile = false;
        this._onMediaChange = this._onMediaChange.bind(this);
    }

    connectedCallback() {
        upgradeProperties(this);
        this._setupMediaQuery();
        this._parseValue();
        this.render();
    }

    disconnectedCallback() {
        this._teardownMediaQuery();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (this._suppressParse) return;
        if (name === "mobile-breakpoint") {
            this._setupMediaQuery();
        }
        if (name === "value") {
            this._parseValue();
        }
        if (this.shadowRoot.innerHTML) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {string} Color theme (default "primary") */
    get color() {
        return this.getAttribute("color") || "primary";
    }
    set color(v) {
        this.setAttribute("color", v);
    }

    /** @type {string} Date format string (default "MM/DD/YYYY") */
    get format() {
        return this.getAttribute("format") || "MM/DD/YYYY";
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

    /** @type {string} Maximum selectable date (ISO string) */
    get max() {
        return this.getAttribute("max") || "";
    }
    set max(v) {
        this.setAttribute("max", v);
    }

    /** @type {string} Minimum selectable date (ISO string) */
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

    /** @type {boolean} Whether the datepicker is currently rendering in mobile mode. */
    get mobile() {
        return this._isMobile;
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

    /** @type {string} "single" | "range" (default "single") */
    get mode() {
        return this.getAttribute("mode") || "single";
    }
    set mode(v) {
        this.setAttribute("mode", v);
    }

    /** @type {number} Interval between second options (default 5) */
    get secondInterval() {
        return parseInt(this.getAttribute("second-interval") || "5", 10);
    }
    set secondInterval(v) {
        this.setAttribute("second-interval", String(v));
    }

    /** @type {boolean} Show day grid (default true) */
    get showDays() {
        return this.getAttribute("show-days") !== "false";
    }
    set showDays(v) {
        this.setAttribute("show-days", v ? "true" : "false");
    }

    /** @type {boolean} Show hour time picker */
    get showHours() {
        return this.hasAttribute("show-hours");
    }
    set showHours(v) {
        v
            ? this.setAttribute("show-hours", "")
            : this.removeAttribute("show-hours");
    }

    /** @type {boolean} Show minute column in time picker (implies show-hours) */
    get showMinutes() {
        return this.hasAttribute("show-minutes");
    }
    set showMinutes(v) {
        v
            ? this.setAttribute("show-minutes", "")
            : this.removeAttribute("show-minutes");
    }

    /** @type {boolean} Show month select in header (default true) */
    get showMonths() {
        return this.getAttribute("show-months") !== "false";
    }
    set showMonths(v) {
        this.setAttribute("show-months", v ? "true" : "false");
    }

    /** @type {boolean} Show second column in time picker (implies show-minutes) */
    get showSeconds() {
        return this.hasAttribute("show-seconds");
    }
    set showSeconds(v) {
        v
            ? this.setAttribute("show-seconds", "")
            : this.removeAttribute("show-seconds");
    }

    /** @type {boolean} Show year select in header (default true) */
    get showYears() {
        return this.getAttribute("show-years") !== "false";
    }
    set showYears(v) {
        this.setAttribute("show-years", v ? "true" : "false");
    }

    /** @type {string} ISO date string, or "ISO,ISO" for range */
    get value() {
        return this.getAttribute("value") || "";
    }
    set value(v) {
        this.setAttribute("value", v);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Clear the selected date(s). */
    clear() {
        this._startDate = null;
        this._endDate = null;
        this._awaitingEnd = false;
        this._hoverDate = null;
        this.removeAttribute("value");
        this.render();
    }

    /**
     * Format a Date object using the component's format string.
     * @param {Date} date
     * @returns {string}
     */
    formatDate(date) {
        return this._formatDate(date);
    }

    /**
     * Navigate the calendar view to a given year/month without selecting a date.
     * @param {number} year  – full year (e.g. 2026)
     * @param {number} [month] – 0-based month (0 = Jan). If omitted the month stays unchanged.
     */
    navigateTo(year, month) {
        this._viewDate.setFullYear(year);
        if (month !== undefined) this._viewDate.setMonth(month);
        this._viewDate.setDate(1);
        this.render();
    }

    render() {
        const showHoursCols =
            this.showHours || this.showMinutes || this.showSeconds;
        const isRange = this.mode === "range";

        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles()}</style>
            <div class="datepicker${isRange ? " range" : ""}${this._isMobile && isRange ? " mobile" : ""}">
                ${this._buildPanel("left", showHoursCols)}
                ${isRange ? this._buildPanel("right", showHoursCols) : ""}
            </div>
        `;

        this._bindListeners();
        if (showHoursCols) this._scrollToSelectedTime();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyTimesToDates() {
        if (this._startDate) {
            this._startDate.setHours(
                this._startTime.h,
                this._startTime.m,
                this._startTime.s,
                0,
            );
        }
        if (this._endDate) {
            this._endDate.setHours(
                this._endTime.h,
                this._endTime.m,
                this._endTime.s,
                0,
            );
        }
    }

    _bindListeners() {
        const root = this.shadowRoot;

        root.querySelectorAll(".nav-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const action = btn.dataset.action;
                const delta = action.includes("year") ? 12 : 1;
                const sign = action.includes("prev") ? -1 : 1;
                this._navigate(sign * delta);
            });
        });

        root.querySelectorAll(".month-sel").forEach((sel) => {
            sel.addEventListener("change", () => {
                const targetMonth = parseInt(sel.value);
                if (sel.dataset.side === "right") {
                    // Right panel shows _viewDate + 1 month, so back-calculate
                    const d = new Date(this._viewDate);
                    d.setMonth(targetMonth - 1); // JS handles month=-1 as Dec of prev year
                    d.setDate(1);
                    this._viewDate = d;
                } else {
                    this._viewDate.setMonth(targetMonth);
                }
                this.render();
            });
        });

        root.querySelectorAll(".year-sel").forEach((sel) => {
            sel.addEventListener("change", () => {
                const targetYear = parseInt(sel.value);
                if (sel.dataset.side === "right") {
                    // Apply the year delta relative to what the right panel currently shows
                    const rightVd = this._viewDateForSide("right");
                    const yearDiff = targetYear - rightVd.getFullYear();
                    this._viewDate.setFullYear(
                        this._viewDate.getFullYear() + yearDiff,
                    );
                } else {
                    this._viewDate.setFullYear(targetYear);
                }
                this.render();
            });
        });

        root.querySelectorAll(".day-btn").forEach((btn) => {
            btn.addEventListener("click", () =>
                this._handleDayClick(new Date(btn.dataset.date)),
            );
            btn.addEventListener("mouseenter", () => {
                if (this._awaitingEnd) {
                    this._hoverDate = new Date(btn.dataset.date);
                    this.render();
                }
            });
        });

        root.querySelectorAll(".m-year-sel").forEach((sel) => {
            sel.addEventListener("change", () => {
                this._viewDate.setFullYear(parseInt(sel.value));
                this.render();
            });
        });

        root.querySelectorAll(".month-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const vd = this._viewDateForSide(btn.dataset.side);
                this._selectMonth(
                    vd.getFullYear(),
                    parseInt(btn.dataset.month),
                );
            });
        });

        root.querySelectorAll(".year-btn").forEach((btn) => {
            btn.addEventListener("click", () =>
                this._selectYear(parseInt(btn.dataset.year)),
            );
        });

        root.querySelectorAll(".year-range-input").forEach((input) => {
            input.addEventListener("input", () => {
                const val = parseInt(input.value, 10);
                if (isNaN(val)) return;
                if (input.dataset.bound === "start") this._yearRangeStart = val;
                else this._yearRangeEnd = val;
                this._refreshYearGrid();
            });
        });

        root.querySelectorAll("[data-hour]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const side = btn.dataset.side;
                const h = parseInt(btn.dataset.hour);
                if (side === "right") this._endTime.h = h;
                else this._startTime.h = h;
                this._applyTimesToDates();
                this._emitChange("hour");
                this.render();
            });
        });

        root.querySelectorAll("[data-minute]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const side = btn.dataset.side;
                const m = parseInt(btn.dataset.minute);
                if (side === "right") this._endTime.m = m;
                else this._startTime.m = m;
                this._applyTimesToDates();
                this._emitChange("minute");
                this.render();
            });
        });

        root.querySelectorAll("[data-second]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const side = btn.dataset.side;
                const s = parseInt(btn.dataset.second);
                if (side === "right") this._endTime.s = s;
                else this._startTime.s = s;
                this._applyTimesToDates();
                this._emitChange("second");
                this.render();
            });
        });
    }

    _buildDayGrid(vd) {
        const year = vd.getFullYear();
        const month = vd.getMonth();
        const firstDow = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const headers = DAYS_SHORT.map(
            (d) => `<span class="day-hdr">${d}</span>`,
        ).join("");
        const blanks = Array(firstDow).fill(`<span></span>`).join("");

        const cells = Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const date = new Date(year, month, d);
            const disabled = this._isDisabled(date);
            const isEdge = this._isRangeEdge(date);
            const isSelected = this._sameDay(date, this._startDate);
            const inRange = this._inRange(date);

            let variant = "flat";
            let color = "base";

            if (isEdge || isSelected) {
                variant = "filled";
                color = this.color;
            } else if (inRange) {
                variant = "flat";
                color = this.color;
            }

            return `<y-button
                class="day-btn"
                variant="${variant}"
                color="${color}"
                size="medium"
                padding-mode="square"
                data-date="${date.toISOString()}"
                ${disabled ? "disabled" : ""}
                aria-label="${date.toDateString()}"
                aria-pressed="${isEdge || isSelected}"
            >${d}</y-button>`;
        }).join("");

        return `
            <div class="day-grid">
                ${headers}
                ${blanks}
                ${cells}
            </div>
        `;
    }

    _buildHeader(vd, side, isRange) {
        const year = vd.getFullYear();
        const month = vd.getMonth();

        // Month picker: 12-month grid with an optional year dropdown.
        if (!this.showDays && this.showMonths) {
            return this._buildMonthPickerHeader(year);
        }

        // Year picker: start/end year inputs bounding the scrollable grid.
        if (!this.showDays && !this.showMonths) {
            return this._buildYearPickerHeader();
        }

        const showPrev = !isRange || side === "left";
        const showNext = !isRange || side === "right";

        const minYear = this._minDate()?.getFullYear() ?? year - 50;
        const maxYear = this._maxDate()?.getFullYear() ?? year + 50;

        const monthOptions = JSON.stringify(
            MONTHS.map((m, i) => ({ value: String(i), label: m })),
        );

        const yearOptions = JSON.stringify(
            Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
                value: String(minYear + i),
                label: String(minYear + i),
            })),
        );

        return `
            <div class="cal-header">
                <div class="nav-start">
                    ${showPrev ? `<y-button class="nav-btn" data-action="prev-year" padding-mode="square" data-side="${side}" variant="flat" size="small" aria-label="Previous year"><y-icon name="expand-left" size="small"></y-icon></y-button>` : ""}
                    ${showPrev ? `<y-button class="nav-btn" data-action="prev-month" padding-mode="square" data-side="${side}" variant="flat" size="small" aria-label="Previous month"><y-icon name="chevron-left" size="small"></y-icon></y-button>` : ""}
                </div>
                <div class="header-selects">
                    ${this.showMonths ? `<y-select class="month-sel" data-side="${side}" size="small" value="${month}" options='${monthOptions}'></y-select>` : ""}
                    ${this.showYears ? `<y-select class="year-sel" data-side="${side}" size="small" value="${year}" options='${yearOptions}'></y-select>` : ""}
                </div>
                <div class="nav-end">
                    ${showNext ? `<y-button class="nav-btn" data-action="next-month" padding-mode="square" data-side="${side}" variant="flat" size="small" aria-label="Next month"><y-icon name="chevron-right" size="small"></y-icon></y-button>` : ""}
                    ${showNext ? `<y-button class="nav-btn" data-action="next-year" padding-mode="square" data-side="${side}" variant="flat" size="small" aria-label="Next year"><y-icon name="expand-right" size="small"></y-icon></y-button>` : ""}
                </div>
            </div>
        `;
    }

    _buildMonthGrid(vd, side) {
        const year = vd.getFullYear();
        return `
            <div class="month-grid">
                ${MONTHS.map((name, i) => {
                    const disabled = this._isMonthDisabled(year, i);
                    const isSelected =
                        this._startDate &&
                        this._startDate.getFullYear() === year &&
                        this._startDate.getMonth() === i;
                    return `<y-button
                        class="month-btn"
                        variant="${isSelected ? "filled" : "flat"}"
                        color="${isSelected ? this.color : "base"}"
                        size="small"
                        padding-mode="square"
                        data-month="${i}"
                        data-side="${side}"
                        ${disabled ? "disabled" : ""}
                    >${name.slice(0, 3)}</y-button>`;
                }).join("")}
            </div>
        `;
    }

    _buildMonthPickerHeader(year) {
        if (!this.showYears) return "";

        const minYear = this._minDate()?.getFullYear() ?? year - 50;
        const maxYear = this._maxDate()?.getFullYear() ?? year + 50;
        const yearOptions = JSON.stringify(
            Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
                value: String(minYear + i),
                label: String(minYear + i),
            })),
        );

        return `
            <div class="cal-header">
                <div class="header-selects">
                    <y-select class="m-year-sel" size="small" value="${year}" options='${yearOptions}'></y-select>
                </div>
            </div>
        `;
    }

    _buildPanel(side, showHours) {
        const vd = this._viewDateForSide(side);
        const isRange = this.mode === "range";
        return `
            <div class="panel" data-side="${side}">
                <div class="panel-body">
                    ${this._buildHeader(vd, side, isRange)}
                    ${this.showDays ? this._buildDayGrid(vd) : ""}
                    ${!this.showDays && this.showMonths ? this._buildMonthGrid(vd, side) : ""}
                    ${!this.showDays && !this.showMonths ? this._buildYearGrid(vd) : ""}
                </div>
                ${showHours ? this._buildTimeColumn(side) : ""}
            </div>
        `;
    }

    _buildStyles() {
        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: inline-block;
                font-family: var(--font-family-body, sans-serif);
                font-size: var(--font-size-label, 0.875rem);
            }

            .datepicker {
                display: inline-flex;
                gap: 0;
                background: var(--component-datepicker-background);
                border: 1px solid var(--component-datepicker-border-color);
                border-width: var(--component-datepicker-border-width, 1px);
                border-radius: var(--component-datepicker-border-radius);
                overflow: hidden;
            }

            .datepicker.range {
                display: inline-flex;
            }

            .datepicker.range.mobile {
                flex-direction: column;
            }

            .datepicker.range.mobile .panel + .panel {
                border-left: none;
                border-top: var(--component-datepicker-border-width) solid var(--component-datepicker-border-color);
            }

            .panel {
                display: flex;
                align-items: stretch;
            }

            .panel + .panel {
                border-left: var(--component-datepicker-border-width) solid var(--component-datepicker-border-color);
            }

            .panel-body {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: var(--spacing-small, 8px);
                padding: var(--spacing-medium, 16px);
            }

            /* ---- Header ---- */

            .cal-header {
                display: flex;
                align-items: center;
                gap: var(--spacing-2x-small, 4px);
                width: 100%;
            }

            .nav-start, .nav-end {
                display: flex;
                gap: 2px;
                flex-shrink: 0;
            }

            .header-selects {
                display: flex;
                gap: var(--spacing-x-small, 6px);
                flex: 1;
                justify-content: center;
                align-items: center;
            }

            .month-sel { min-width: 120px; }
            .year-sel  { min-width: 80px;  }
            .m-year-sel { min-width: 90px; }

            /* ---- Year-picker range inputs ---- */

            .cal-header.year-range {
                justify-content: center;
                gap: var(--spacing-x-small, 6px);
            }

            .year-range-input { width: 5.5em; }

            .year-range-sep {
                color: var(--component-datepicker-header-color);
                flex-shrink: 0;
            }

            /* ---- Day grid ---- */

            .day-grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                column-gap: 2px;
                row-gap: 6px;
                width: 100%;
            }

            .day-hdr {
                text-align: center;
                font-size: var(--font-size-small, 0.75em);
                font-weight: 600;
                color: var(--component-datepicker-header-color);
                padding: 4px 0;
            }

            .day-btn {
                width: 100%;
                --component-button-border-radius: 50%;
            }

            /* ---- Month / Year grids ---- */

            .month-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--spacing-x-small, 6px);
                padding: var(--spacing-x-small, 6px) 0;
            }

            .year-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: var(--spacing-x-small, 6px);
                max-height: 220px;
                overflow-y: auto;
                padding: var(--spacing-x-small, 6px) 0;
                scrollbar-width: thin;
            }

            /* ---- Time column ---- */

            .time-column {
                display: flex;
                align-self: flex-start;
                border-left: var(--component-datepicker-border-width) solid var(--component-datepicker-border-color);
                overflow: hidden;
                margin: var(--spacing-medium, 16px) 0;
            }

            .time-col-wrap {
                display: flex;
                flex-direction: column;
            }

            .time-col-wrap + .time-col-wrap {
                border-left: var(--component-datepicker-border-width) solid var(--component-datepicker-border-color);
            }

            .time-col-hdr {
                text-align: center;
                font-size: var(--font-size-small, 0.75em);
                font-weight: 600;
                color: var(--component-datepicker-header-color);
                padding: 6px 0 2px;
                flex-shrink: 0;
            }

            .time-column.time-disabled {
                opacity: 0.4;
                pointer-events: none;
            }

            .time-col {
                display: flex;
                flex-direction: column;
                gap: 2px;
                overflow-y: auto;
                height: 280px;
                padding: var(--spacing-small, 8px) var(--spacing-x-small, 6px);
                scrollbar-width: thin;
            }

            .time-col::-webkit-scrollbar { width: 4px; }
            .time-col::-webkit-scrollbar-track { background: transparent; }
            .time-col::-webkit-scrollbar-thumb {
                background: var(--base-border);
                border-radius: 2px;
            }

            .time-btn { white-space: nowrap; }
        `;
    }

    _buildTimeColumn(side) {
        const time = side === "right" ? this._endTime : this._startTime;
        const disabled = side === "right" && !this._endDate;

        const use24 = this.hourFormat === "24";
        const hoursBtns = Array.from({ length: 24 }, (_, h) => {
            const label = use24
                ? `${String(h).padStart(2, "0")}:00`
                : `${h === 0 ? 12 : h > 12 ? h - 12 : h}:00 ${h < 12 ? "AM" : "PM"}`;
            const sel = time.h === h;
            return `<y-button
                class="time-btn${sel ? " selected" : ""}"
                variant="${sel ? "filled" : "flat"}"
                color="${sel ? this.color : "base"}"
                size="small"
                data-hour="${h}"
                data-side="${side}"
            >${label}</y-button>`;
        }).join("");

        const mInterval = this.minuteInterval;
        const sInterval = this.secondInterval;

        const minutesBtns = this.showMinutes
            ? `
            <div class="time-col-wrap">
                <span class="time-col-hdr">Min</span>
                <div class="time-col" data-col="minutes">
                    ${Array.from(
                        { length: Math.floor(60 / mInterval) },
                        (_, i) => i * mInterval,
                    )
                        .map((m) => {
                            const sel =
                                Math.floor(time.m / mInterval) * mInterval ===
                                m;
                            return `<y-button
                            class="time-btn${sel ? " selected" : ""}"
                            variant="${sel ? "filled" : "flat"}"
                            color="${sel ? this.color : "base"}"
                            size="small"
                            data-minute="${m}"
                            data-side="${side}"
                        >${String(m).padStart(2, "0")}</y-button>`;
                        })
                        .join("")}
                </div>
            </div>
        `
            : "";

        const secondsBtns = this.showSeconds
            ? `
            <div class="time-col-wrap">
                <span class="time-col-hdr">Sec</span>
                <div class="time-col" data-col="seconds">
                    ${Array.from(
                        { length: Math.floor(60 / sInterval) },
                        (_, i) => i * sInterval,
                    )
                        .map((s) => {
                            const sel =
                                Math.floor(time.s / sInterval) * sInterval ===
                                s;
                            return `<y-button
                            class="time-btn${sel ? " selected" : ""}"
                            variant="${sel ? "filled" : "flat"}"
                            color="${sel ? this.color : "base"}"
                            size="small"
                            data-second="${s}"
                            data-side="${side}"
                        >${String(s).padStart(2, "0")}</y-button>`;
                        })
                        .join("")}
                </div>
            </div>
        `
            : "";

        return `
            <div class="time-column${disabled ? " time-disabled" : ""}">
                <div class="time-col-wrap">
                    <span class="time-col-hdr">Hr</span>
                    <div class="time-col" data-col="hours">${hoursBtns}</div>
                </div>
                ${minutesBtns}
                ${secondsBtns}
            </div>
        `;
    }

    _buildValueString() {
        if (this.mode === "range") {
            const s = this._startDate ? this._startDate.toISOString() : "";
            const e = this._endDate ? this._endDate.toISOString() : "";
            return [s, e].filter(Boolean).join(",");
        }
        return this._startDate ? this._startDate.toISOString() : "";
    }

    _buildYearGrid(vd) {
        this._ensureYearRange(vd);
        const selected = this._startDate?.getFullYear();
        const lo = Math.min(this._yearRangeStart, this._yearRangeEnd);
        const hi = Math.max(this._yearRangeStart, this._yearRangeEnd);
        const years = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
        return `
            <div class="year-grid">
                ${years
                    .map((y) => {
                        const isSelected = y === selected;
                        const disabled = this._isYearDisabled(y);
                        return `<y-button
                    class="year-btn"
                    variant="${isSelected ? "filled" : "flat"}"
                    color="${isSelected ? this.color : "base"}"
                    size="small"
                    padding-mode="square"
                    data-year="${y}"
                    ${disabled ? "disabled" : ""}
                >${y}</y-button>`;
                    })
                    .join("")}
            </div>
        `;
    }

    _buildYearPickerHeader() {
        this._ensureYearRange(this._viewDate);
        return `
            <div class="cal-header year-range">
                <y-input
                    class="year-range-input"
                    data-bound="start"
                    type="number"
                    size="small"
                    value="${this._yearRangeStart}"
                    aria-label="Start year"
                ></y-input>
                <span class="year-range-sep">–</span>
                <y-input
                    class="year-range-input"
                    data-bound="end"
                    type="number"
                    size="small"
                    value="${this._yearRangeEnd}"
                    aria-label="End year"
                ></y-input>
            </div>
        `;
    }

    _emitChange(source) {
        this._suppressParse = true;
        const value = this._buildValueString();
        if (value !== this.getAttribute("value")) {
            this.setAttribute("value", value);
        }
        this._suppressParse = false;
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value,
                    source,
                    startDate: this._startDate
                        ? new Date(this._startDate)
                        : null,
                    endDate: this._endDate ? new Date(this._endDate) : null,
                    formatted:
                        this.mode === "range"
                            ? `${this._formatDate(this._startDate)}${this._endDate ? " - " + this._formatDate(this._endDate) : ""}`
                            : this._formatDate(this._startDate),
                },
            }),
        );
    }

    _ensureYearRange(vd) {
        if (this._yearRangeStart != null && this._yearRangeEnd != null) return;
        const base =
            this._startDate && !isNaN(this._startDate)
                ? this._startDate.getFullYear()
                : vd.getFullYear();
        this._yearRangeStart = this._minDate()?.getFullYear() ?? base - 10;
        this._yearRangeEnd = this._maxDate()?.getFullYear() ?? base + 10;
    }

    _formatDate(date) {
        if (!date || isNaN(date)) return "";
        const pad = (n) => String(n).padStart(2, "0");
        const h24 = date.getHours();
        const h12 = h24 % 12 || 12;
        return this.format
            .replace("YYYY", date.getFullYear())
            .replace("MM", pad(date.getMonth() + 1))
            .replace("DD", pad(date.getDate()))
            .replace("HH", pad(h24))
            .replace("hh", pad(h12))
            .replace("mm", pad(date.getMinutes()))
            .replace("ss", pad(date.getSeconds()))
            .replace("A", h24 >= 12 ? "PM" : "AM")
            .replace("a", h24 >= 12 ? "pm" : "am");
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

    _handleDayClick(date) {
        if (this.mode === "range") {
            if (!this._awaitingEnd) {
                this._startDate = date;
                this._endDate = null;
                this._awaitingEnd = true;
            } else {
                if (date < this._startDate) {
                    this._endDate = new Date(this._startDate);
                    this._startDate = date;
                } else {
                    this._endDate = date;
                }
                this._awaitingEnd = false;
                this._hoverDate = null;
            }
        } else {
            this._startDate = date;
        }
        this._applyTimesToDates();
        this._emitChange("day");
        this.render();
    }

    _inRange(date) {
        if (this.mode !== "range" || !this._startDate) return false;
        const end =
            this._endDate || (this._awaitingEnd ? this._hoverDate : null);
        if (!end) return false;
        const [lo, hi] =
            this._startDate <= end
                ? [this._startDate, end]
                : [end, this._startDate];
        return date > lo && date < hi;
    }

    _isDisabled(date) {
        const min = this._minDate();
        const max = this._maxDate();
        if (min && date < min) return true;
        if (max && date > max) return true;
        return false;
    }

    _isMonthDisabled(year, month) {
        const min = this._minDate();
        const max = this._maxDate();
        if (min && new Date(year, month + 1, 0) < min) return true;
        if (max && new Date(year, month, 1) > max) return true;
        return false;
    }

    _isRangeEdge(date) {
        return (
            this._sameDay(date, this._startDate) ||
            this._sameDay(date, this._endDate)
        );
    }

    _isYearDisabled(year) {
        const min = this._minDate();
        const max = this._maxDate();
        if (min && year < min.getFullYear()) return true;
        if (max && year > max.getFullYear()) return true;
        return false;
    }

    _maxDate() {
        return this.max ? new Date(this.max) : null;
    }

    _minDate() {
        return this.min ? new Date(this.min) : null;
    }

    _navigate(months) {
        this._viewDate.setMonth(this._viewDate.getMonth() + months);
        this.render();
    }

    _onMediaChange(e) {
        this._isMobile = e.matches;
        this.render();
    }

    _parseValue() {
        const val = this.value;
        if (!val) {
            this._startDate = null;
            this._endDate = null;
            return;
        }

        if (this.mode === "range") {
            const parts = val.split(",");
            this._startDate = parts[0] ? new Date(parts[0]) : null;
            this._endDate = parts[1] ? new Date(parts[1]) : null;
        } else {
            this._startDate = new Date(val);
        }

        const snapMin = (v) =>
            this.showMinutes
                ? Math.floor(v / this.minuteInterval) * this.minuteInterval
                : 0;
        const snapSec = (v) =>
            this.showSeconds
                ? Math.floor(v / this.secondInterval) * this.secondInterval
                : 0;

        if (this._startDate && !isNaN(this._startDate)) {
            this._startTime = {
                h: this._startDate.getHours(),
                m: snapMin(this._startDate.getMinutes()),
                s: snapSec(this._startDate.getSeconds()),
            };
            const v = new Date(this._startDate);
            v.setDate(1);
            v.setHours(0, 0, 0, 0);
            this._viewDate = v;
        }
        if (this._endDate && !isNaN(this._endDate)) {
            this._endTime = {
                h: this._endDate.getHours(),
                m: snapMin(this._endDate.getMinutes()),
                s: snapSec(this._endDate.getSeconds()),
            };
        }
    }

    _refreshYearGrid() {
        const grid = this.shadowRoot.querySelector(".year-grid");
        if (!grid) return;

        const lo = Math.min(this._yearRangeStart, this._yearRangeEnd);
        const hi = Math.max(this._yearRangeStart, this._yearRangeEnd);
        // Skip runaway ranges while the user is still typing a bound.
        if (hi - lo > 500) return;

        grid.outerHTML = this._buildYearGrid(this._viewDate);
        this.shadowRoot.querySelectorAll(".year-btn").forEach((btn) => {
            btn.addEventListener("click", () =>
                this._selectYear(parseInt(btn.dataset.year)),
            );
        });
    }

    _sameDay(a, b) {
        if (!a || !b) return false;
        return (
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate()
        );
    }

    _scrollToSelectedTime() {
        requestAnimationFrame(() => {
            this.shadowRoot.querySelectorAll(".time-col").forEach((col) => {
                const sel = col.querySelector(".selected");
                if (sel) sel.scrollIntoView({ block: "center" });
            });
        });
    }

    _selectMonth(year, month) {
        const src =
            this._startDate && !isNaN(this._startDate) ? this._startDate : null;
        const day = src ? src.getDate() : 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this._startDate = new Date(year, month, Math.min(day, daysInMonth));
        this._viewDate = new Date(year, month, 1);
        this._applyTimesToDates();
        this._emitChange("month");
        this.render();
    }

    _selectYear(year) {
        const src =
            this._startDate && !isNaN(this._startDate) ? this._startDate : null;
        const month = src ? src.getMonth() : 0;
        const day = src ? src.getDate() : 1;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this._startDate = new Date(year, month, Math.min(day, daysInMonth));
        this._viewDate = new Date(year, month, 1);
        this._applyTimesToDates();
        this._emitChange("year");
        this.render();
    }

    _setupMediaQuery() {
        this._teardownMediaQuery();
        const bp = this._getBreakpointPx();
        this._mql = window.matchMedia(`(max-width: ${bp}px)`);
        this._isMobile = this._mql.matches;
        this._mql.addEventListener("change", this._onMediaChange);
    }

    _teardownMediaQuery() {
        if (this._mql) {
            this._mql.removeEventListener("change", this._onMediaChange);
            this._mql = null;
        }
    }

    _viewDateForSide(side) {
        if (side === "right") {
            const d = new Date(this._viewDate);
            d.setMonth(d.getMonth() + 1);
            return d;
        }
        return this._viewDate;
    }
}

if (!customElements.get("y-datepicker")) {
    customElements.define("y-datepicker", YumeDatepicker);
}
