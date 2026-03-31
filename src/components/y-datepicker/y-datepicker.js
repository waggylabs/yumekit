import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-select/y-select.js";

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
            "show-time",
            "show-minutes",
            "show-seconds",
            "show-years",
            "show-months",
            "show-days",
            "format",
            "color",
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
    }

    connectedCallback() {
        this._parseValue();
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "value") {
            this._parseValue();
        }
        if (this.shadowRoot.innerHTML) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {string} "single" | "range" (default "single") */
    get mode() {
        return this.getAttribute("mode") || "single";
    }
    set mode(v) {
        this.setAttribute("mode", v);
    }

    /** @type {string} ISO date string, or "ISO,ISO" for range */
    get value() {
        return this.getAttribute("value") || "";
    }
    set value(v) {
        this.setAttribute("value", v);
    }

    /** @type {string} Minimum selectable date (ISO string) */
    get min() {
        return this.getAttribute("min") || "";
    }
    set min(v) {
        this.setAttribute("min", v);
    }

    /** @type {string} Maximum selectable date (ISO string) */
    get max() {
        return this.getAttribute("max") || "";
    }
    set max(v) {
        this.setAttribute("max", v);
    }

    /** @type {boolean} Show hour time picker */
    get showTime() {
        return this.hasAttribute("show-time");
    }
    set showTime(v) {
        v
            ? this.setAttribute("show-time", "")
            : this.removeAttribute("show-time");
    }

    /** @type {boolean} Show minute column in time picker (implies show-time) */
    get showMinutes() {
        return this.hasAttribute("show-minutes");
    }
    set showMinutes(v) {
        v
            ? this.setAttribute("show-minutes", "")
            : this.removeAttribute("show-minutes");
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

    /** @type {boolean} Show month select in header (default true) */
    get showMonths() {
        return this.getAttribute("show-months") !== "false";
    }
    set showMonths(v) {
        this.setAttribute("show-months", v ? "true" : "false");
    }

    /** @type {boolean} Show day grid (default true) */
    get showDays() {
        return this.getAttribute("show-days") !== "false";
    }
    set showDays(v) {
        this.setAttribute("show-days", v ? "true" : "false");
    }

    /** @type {string} Date format string (default "MM/DD/YYYY") */
    get format() {
        return this.getAttribute("format") || "MM/DD/YYYY";
    }
    set format(v) {
        this.setAttribute("format", v);
    }

    /** @type {string} Color theme (default "primary") */
    get color() {
        return this.getAttribute("color") || "primary";
    }
    set color(v) {
        this.setAttribute("color", v);
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

    render() {
        const showTimeCols =
            this.showTime || this.showMinutes || this.showSeconds;
        const isRange = this.mode === "range";

        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles()}</style>
            <div class="datepicker${isRange ? " range" : ""}">
                ${this._buildPanel("left", showTimeCols)}
                ${isRange ? this._buildPanel("right", showTimeCols) : ""}
            </div>
        `;

        this._bindListeners();
        if (showTimeCols) this._scrollToSelectedTime();
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
                this._viewDate.setMonth(parseInt(sel.value));
                this.render();
            });
        });

        root.querySelectorAll(".year-sel").forEach((sel) => {
            sel.addEventListener("change", () => {
                this._viewDate.setFullYear(parseInt(sel.value));
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

        root.querySelectorAll(".month-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                this._viewDate.setMonth(parseInt(btn.dataset.month));
                this.render();
            });
        });

        root.querySelectorAll(".year-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                this._viewDate.setFullYear(parseInt(btn.dataset.year));
                this.render();
            });
        });

        root.querySelectorAll("[data-hour]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const side = btn.dataset.side;
                const h = parseInt(btn.dataset.hour);
                if (side === "right") this._endTime.h = h;
                else this._startTime.h = h;
                this._applyTimesToDates();
                this._emitChange();
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
                this._emitChange();
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
                this._emitChange();
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

            let styleType = "flat";
            let color = "base";

            if (isEdge || isSelected) {
                styleType = "filled";
                color = this.color;
            } else if (inRange) {
                styleType = "flat";
                color = this.color;
            }

            return `<y-button
                class="day-btn"
                style-type="${styleType}"
                color="${color}"
                size="medium"
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
        const showPrev = !isRange || side === "left";
        const showNext = !isRange || side === "right";

        const minYear = this._minDate()?.getFullYear() ?? year - 50;
        const maxYear = this._maxDate()?.getFullYear() ?? year + 50;

        const yearOptions = JSON.stringify(
            Array.from({ length: maxYear - minYear + 1 }, (_, i) => ({
                value: String(minYear + i),
                label: String(minYear + i),
            })),
        );
        const monthOptions = JSON.stringify(
            MONTHS.map((m, i) => ({ value: String(i), label: m })),
        );

        return `
            <div class="cal-header">
                <div class="nav-start">
                    ${showPrev ? `<y-button class="nav-btn" data-action="prev-year" data-side="${side}" style-type="flat" size="small" aria-label="Previous year"><y-icon name="expand-left" size="small"></y-icon></y-button>` : ""}
                    ${showPrev ? `<y-button class="nav-btn" data-action="prev-month" data-side="${side}" style-type="flat" size="small" aria-label="Previous month"><y-icon name="chevron-left" size="small"></y-icon></y-button>` : ""}
                </div>
                <div class="header-selects">
                    ${this.showMonths ? `<y-select class="month-sel" data-side="${side}" size="small" value="${month}" options='${monthOptions}'></y-select>` : ""}
                    ${this.showYears ? `<y-select class="year-sel" data-side="${side}" size="small" value="${year}" options='${yearOptions}'></y-select>` : ""}
                </div>
                <div class="nav-end">
                    ${showNext ? `<y-button class="nav-btn" data-action="next-month" data-side="${side}" style-type="flat" size="small" aria-label="Next month"><y-icon name="chevron-right" size="small"></y-icon></y-button>` : ""}
                    ${showNext ? `<y-button class="nav-btn" data-action="next-year" data-side="${side}" style-type="flat" size="small" aria-label="Next year"><y-icon name="expand-right" size="small"></y-icon></y-button>` : ""}
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
                        style-type="${isSelected ? "filled" : "flat"}"
                        color="${isSelected ? this.color : "base"}"
                        size="small"
                        data-month="${i}"
                        data-side="${side}"
                        ${disabled ? "disabled" : ""}
                    >${name.slice(0, 3)}</y-button>`;
                }).join("")}
            </div>
        `;
    }

    _buildPanel(side, showTime) {
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
                ${showTime ? this._buildTimeColumn(side) : ""}
            </div>
        `;
    }

    _buildStyles() {
        return `
            :host {
                display: inline-block;
                font-family: var(--font-family-body, sans-serif);
                font-size: var(--font-size-label, 0.875rem);
            }

            .datepicker {
                display: inline-flex;
                gap: 0;
                background: var(--component-datepicker-background);
                border: var(--component-datepicker-border-width) solid var(--component-datepicker-border-color);
                border-radius: var(--component-datepicker-border-radius);
                overflow: hidden;
            }

            .datepicker.range {
                display: inline-flex;
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

        const hoursBtns = Array.from({ length: 24 }, (_, h) => {
            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
            const ampm = h < 12 ? "AM" : "PM";
            const sel = time.h === h;
            return `<y-button
                class="time-btn${sel ? " selected" : ""}"
                style-type="${sel ? "filled" : "flat"}"
                color="${sel ? this.color : "base"}"
                size="small"
                data-hour="${h}"
                data-side="${side}"
            >${h12}:00 ${ampm}</y-button>`;
        }).join("");

        const minutesBtns = this.showMinutes
            ? `
            <div class="time-col-wrap">
                <span class="time-col-hdr">Min</span>
                <div class="time-col" data-col="minutes">
                    ${Array.from({ length: 12 }, (_, i) => i * 5)
                        .map((m) => {
                            const sel = Math.floor(time.m / 5) * 5 === m;
                            return `<y-button
                            class="time-btn${sel ? " selected" : ""}"
                            style-type="${sel ? "filled" : "flat"}"
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
                    ${Array.from({ length: 12 }, (_, i) => i * 5)
                        .map((s) => {
                            const sel = Math.floor(time.s / 5) * 5 === s;
                            return `<y-button
                            class="time-btn${sel ? " selected" : ""}"
                            style-type="${sel ? "filled" : "flat"}"
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
        const selected = this._startDate?.getFullYear();
        const minY = this._minDate()?.getFullYear() ?? vd.getFullYear() - 10;
        const maxY = this._maxDate()?.getFullYear() ?? vd.getFullYear() + 10;
        const years = Array.from(
            { length: maxY - minY + 1 },
            (_, i) => minY + i,
        );
        return `
            <div class="year-grid">
                ${years
                    .map(
                        (y) => `<y-button
                    class="year-btn"
                    style-type="${y === selected ? "filled" : "flat"}"
                    color="${y === selected ? this.color : "base"}"
                    size="small"
                    data-year="${y}"
                >${y}</y-button>`,
                    )
                    .join("")}
            </div>
        `;
    }

    _emitChange() {
        const value = this._buildValueString();
        if (value !== this.getAttribute("value")) {
            this.setAttribute("value", value);
        }
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value,
                    startDate: this._startDate
                        ? new Date(this._startDate)
                        : null,
                    endDate: this._endDate ? new Date(this._endDate) : null,
                    formatted:
                        this.mode === "range"
                            ? `${this._formatDate(this._startDate)}${this._endDate ? " – " + this._formatDate(this._endDate) : ""}`
                            : this._formatDate(this._startDate),
                },
            }),
        );
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
        this._emitChange();
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

        if (this._startDate && !isNaN(this._startDate)) {
            this._startTime = {
                h: this._startDate.getHours(),
                m: this._startDate.getMinutes(),
                s: this._startDate.getSeconds(),
            };
            const v = new Date(this._startDate);
            v.setDate(1);
            v.setHours(0, 0, 0, 0);
            this._viewDate = v;
        }
        if (this._endDate && !isNaN(this._endDate)) {
            this._endTime = {
                h: this._endDate.getHours(),
                m: this._endDate.getMinutes(),
                s: this._endDate.getSeconds(),
            };
        }
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
