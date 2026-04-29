import { createElement as _el, clamp } from "../../modules/helpers.js";
import "../y-tooltip/y-tooltip.js";

const VALID_SIZES = new Set(["small", "medium", "large"]);
const VALID_ORIENTATIONS = new Set(["horizontal", "vertical"]);
const VALID_SHOW_VALUE = new Set(["none", "always", "dragging"]);
const VALID_VALUE_POSITIONS = new Set(["start", "end"]);

const COLOR_VAR_MAP = {
    primary: "var(--primary-content--)",
    secondary: "var(--secondary-content--)",
    base: "var(--base-content--)",
    success: "var(--success-content--)",
    warning: "var(--warning-content--)",
    error: "var(--error-content--)",
    help: "var(--help-content--)",
};

function resolveColor(color) {
    return COLOR_VAR_MAP[color] || color || COLOR_VAR_MAP.primary;
}

export class YumeSlider extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "value",
            "value-min",
            "value-max",
            "min",
            "max",
            "step",
            "size",
            "color",
            "disabled",
            "name",
            "orientation",
            "range",
            "min-gap",
            "aria-label-min",
            "aria-label-max",
            "ticks",
            "tick-labels",
            "snap-to-ticks",
            "show-value",
            "value-position",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this._dragging = false;
        this._activeThumb = "single";
        this._focusedThumb = null;
        this._onPointerMove = this._onPointerMove.bind(this);
        this._onPointerUp = this._onPointerUp.bind(this);
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("min")) this.setAttribute("min", "0");
        if (!this.hasAttribute("max")) this.setAttribute("max", "100");
        if (!this.range && !this.hasAttribute("value")) {
            this.setAttribute("value", "50");
        }

        this._syncFormValue();
        this.render();
    }

    disconnectedCallback() {
        document.removeEventListener("pointermove", this._onPointerMove);
        document.removeEventListener("pointerup", this._onPointerUp);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        const isValueAttr =
            name === "value" || name === "value-min" || name === "value-max";

        if (isValueAttr || name === "name" || name === "range") {
            this._syncFormValue();
        }

        if (isValueAttr && this._track) {
            this._updateVisuals();
            return;
        }

        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme. Drives both the filled track and the thumb. */
    get color() {
        return this.getAttribute("color") || "primary";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** Whether the slider is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Maximum allowed value (default 100). */
    get max() {
        const v = parseFloat(this.getAttribute("max"));
        return Number.isFinite(v) ? v : 100;
    }
    set max(val) {
        this.setAttribute("max", String(val));
    }

    /** Minimum allowed value (default 0). */
    get min() {
        const v = parseFloat(this.getAttribute("min"));
        return Number.isFinite(v) ? v : 0;
    }
    set min(val) {
        this.setAttribute("min", String(val));
    }

    /** Minimum distance enforced between thumbs in range mode. */
    get minGap() {
        const v = parseFloat(this.getAttribute("min-gap"));
        if (Number.isFinite(v) && v >= 0) return v;
        return this.step ?? 1;
    }
    set minGap(val) {
        if (val === null || val === undefined) this.removeAttribute("min-gap");
        else this.setAttribute("min-gap", String(val));
    }

    /** Slider orientation: "horizontal" | "vertical". */
    get orientation() {
        const v = this.getAttribute("orientation");
        return VALID_ORIENTATIONS.has(v) ? v : "horizontal";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** Single-mode value as a percentage of the [min, max] range. */
    get percentage() {
        return this._toPercentage(this.value);
    }

    /** Upper-thumb value as a percentage of the [min, max] range. */
    get percentageMax() {
        return this._toPercentage(this.valueMax);
    }

    /** Lower-thumb value as a percentage of the [min, max] range. */
    get percentageMin() {
        return this._toPercentage(this.valueMin);
    }

    /** Range mode flag — when true, two thumbs select [valueMin, valueMax]. */
    get range() {
        return this.hasAttribute("range");
    }
    set range(val) {
        if (val) this.setAttribute("range", "");
        else this.removeAttribute("range");
    }

    /** Tooltip visibility: "none" (default) | "always" | "dragging". */
    get showValue() {
        const v = this.getAttribute("show-value");
        return VALID_SHOW_VALUE.has(v) ? v : "none";
    }
    set showValue(val) {
        if (val == null || val === "none") this.removeAttribute("show-value");
        else this.setAttribute("show-value", val);
    }

    /** Thumb / track size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        const v = this.getAttribute("size");
        return VALID_SIZES.has(v) ? v : "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** When true, drag and keyboard movement snap to the nearest tick instead of step. */
    get snapToTicks() {
        return this.hasAttribute("snap-to-ticks");
    }
    set snapToTicks(val) {
        if (val) this.setAttribute("snap-to-ticks", "");
        else this.removeAttribute("snap-to-ticks");
    }

    /** Step increment, or null for continuous. */
    get step() {
        const s = parseFloat(this.getAttribute("step"));
        return Number.isNaN(s) || s <= 0 ? null : s;
    }
    set step(val) {
        if (val === null || val === undefined) this.removeAttribute("step");
        else this.setAttribute("step", String(val));
    }

    /** When true, render labels under each tick (uses tick.label, falling back to value). */
    get tickLabels() {
        return this.hasAttribute("tick-labels");
    }
    set tickLabels(val) {
        if (val) this.setAttribute("tick-labels", "");
        else this.removeAttribute("tick-labels");
    }

    /**
     * Resolved tick array, normalized to `{value, label?}` entries.
     * Source attribute accepts:
     *   - `true` — derive from `step`, or 10 evenly spaced if no step
     *   - integer N — N evenly spaced ticks
     *   - JSON array of values `[0, 25, 50]` or objects `[{value, label?}]`
     */
    get ticks() {
        return this._resolveTicks();
    }
    set ticks(val) {
        if (val === null || val === undefined || val === false) {
            this.removeAttribute("ticks");
        } else if (val === true) {
            this.setAttribute("ticks", "true");
        } else if (typeof val === "number") {
            this.setAttribute("ticks", String(val));
        } else {
            this.setAttribute("ticks", JSON.stringify(val));
        }
    }

    /** Single-mode current value, clamped between min and max and snapped to step (or tick). */
    get value() {
        const v = parseFloat(this.getAttribute("value"));
        return Number.isNaN(v) ? 0 : v;
    }
    set value(val) {
        this.setAttribute(
            "value",
            String(this._finalize(val, this.min, this.max)),
        );
    }

    /** Upper-thumb value in range mode. Defaults to `max` when unset. */
    get valueMax() {
        const v = parseFloat(this.getAttribute("value-max"));
        return Number.isFinite(v) ? v : this.max;
    }
    set valueMax(val) {
        const lo = this.valueMin + this.minGap;
        this.setAttribute(
            "value-max",
            String(this._finalize(val, lo, this.max)),
        );
    }

    /** Lower-thumb value in range mode. Defaults to `min` when unset. */
    get valueMin() {
        const v = parseFloat(this.getAttribute("value-min"));
        return Number.isFinite(v) ? v : this.min;
    }
    set valueMin(val) {
        const hi = this.valueMax - this.minGap;
        this.setAttribute(
            "value-min",
            String(this._finalize(val, this.min, hi)),
        );
    }

    /**
     * Tooltip side relative to the thumb, in flow-relative terms:
     *   "start" — top (horizontal) or left (vertical)
     *   "end"   — bottom (horizontal) or right (vertical)
     * Defaults to "start" for horizontal and "end" for vertical.
     */
    get valuePosition() {
        const v = this.getAttribute("value-position");
        if (v == null) {
            return this.orientation === "vertical" ? "end" : "start";
        }
        if (VALID_VALUE_POSITIONS.has(v)) return v;
        // eslint-disable-next-line no-console
        console.warn(
            `y-slider: value-position "${v}" is invalid; expected "start" or "end". Falling back to default.`,
        );
        return this.orientation === "vertical" ? "end" : "start";
    }
    set valuePosition(val) {
        if (val == null) this.removeAttribute("value-position");
        else this.setAttribute("value-position", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        if (!this.shadowRoot) return;
        this.shadowRoot.adoptedStyleSheets = [YumeSlider._stylesheet()];

        this._applyHostVariables();

        const track = this._buildTrack();
        const prefixSlot = _el("slot", {
            name: "value-prefix",
            class: "slot-hidden",
        });
        const suffixSlot = _el("slot", {
            name: "value-suffix",
            class: "slot-hidden",
        });
        const wrapper = _el("div", { class: "wrapper" }, [
            track,
            prefixSlot,
            suffixSlot,
        ]);

        this.shadowRoot.replaceChildren(wrapper);
        this._track = track;
        this._fill = track.querySelector(".fill");
        this._thumb = track.querySelector(
            ".thumb:not(.thumb-min):not(.thumb-max)",
        );
        this._thumbMin = track.querySelector(".thumb-min");
        this._thumbMax = track.querySelector(".thumb-max");
        this._prefixSlot = prefixSlot;
        this._suffixSlot = suffixSlot;
        this._tooltipSingle = track.querySelector(
            ".tooltip:not(.tooltip-min):not(.tooltip-max)",
        );
        this._tooltipMin = track.querySelector(".tooltip-min");
        this._tooltipMax = track.querySelector(".tooltip-max");

        prefixSlot.addEventListener("slotchange", () =>
            this._refreshTooltipText(),
        );
        suffixSlot.addEventListener("slotchange", () =>
            this._refreshTooltipText(),
        );
        this._refreshTooltipText();

        this._bindEvents();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyAriaValueText(el, value) {
        if (!el || this.showValue === "none") {
            el?.removeAttribute("aria-valuetext");
            return;
        }
        const formatted = this._formatValue(value);
        if (formatted === String(value)) {
            el.removeAttribute("aria-valuetext");
        } else {
            el.setAttribute("aria-valuetext", formatted);
        }
    }

    _applyHostVariables() {
        const fillColor = resolveColor(this.color);
        const thumbSize = `var(--component-slider-thumb-size-${this.size})`;
        const trackThickness = `var(--component-slider-track-thickness-${this.size})`;

        this.style.setProperty("--_fill-color", fillColor);
        this.style.setProperty("--_thumb-size", thumbSize);
        this.style.setProperty("--_track-thickness", trackThickness);

        if (this.range) {
            this.style.setProperty("--_pct-min", `${this.percentageMin}%`);
            this.style.setProperty("--_pct-max", `${this.percentageMax}%`);
            this.style.removeProperty("--_pct");
        } else {
            this.style.setProperty("--_pct", `${this.percentage}%`);
            this.style.removeProperty("--_pct-min");
            this.style.removeProperty("--_pct-max");
        }
    }

    _bindEvents() {
        if (!this._track) return;

        this._track.addEventListener("pointerdown", (e) =>
            this._onPointerDown(e),
        );

        if (this.range) {
            for (const thumb of [this._thumbMin, this._thumbMax]) {
                if (!thumb) continue;
                const kind = thumb.dataset.thumb;
                thumb.addEventListener("keydown", (e) => this._onKeyDown(e));
                thumb.addEventListener("focus", () => {
                    this._focusedThumb = kind;
                    this._refreshTooltipOpen();
                });
                thumb.addEventListener("blur", () => {
                    if (this._focusedThumb === kind) this._focusedThumb = null;
                    this._refreshTooltipOpen();
                });
            }
        } else {
            this._track.addEventListener("keydown", (e) => this._onKeyDown(e));
            this._track.addEventListener("focus", () => {
                this._focusedThumb = "single";
                this._refreshTooltipOpen();
            });
            this._track.addEventListener("blur", () => {
                if (this._focusedThumb === "single") this._focusedThumb = null;
                this._refreshTooltipOpen();
            });
        }

        this._refreshTooltipOpen();
    }

    _buildTooltip(thumb, kind) {
        const klass = kind === "single" ? "tooltip" : `tooltip tooltip-${kind}`;
        const partName =
            kind === "single" ? "tooltip" : `tooltip tooltip-${kind}`;
        const value = this._readValueFor(kind === "single" ? "single" : kind);
        const tooltip = _el("y-tooltip", {
            class: klass,
            part: partName,
            position: this._resolveTooltipPosition(),
            delay: "0",
            text: this._formatValue(value),
            open: this.showValue === "always" ? "" : null,
        });
        tooltip.appendChild(thumb);
        return tooltip;
    }

    _buildThumb(kind) {
        const isDisabled = this.disabled;
        let thumb;
        if (kind === "single") {
            thumb = _el("div", { class: "thumb", part: "thumb" });
        } else {
            const isMin = kind === "min";
            const value = isMin ? this.valueMin : this.valueMax;
            const ariaMin = isMin ? this.min : this.valueMin + this.minGap;
            const ariaMax = isMin ? this.valueMax - this.minGap : this.max;
            const labelAttr = isMin ? "aria-label-min" : "aria-label-max";
            const fallbackLabel = isMin ? "Minimum" : "Maximum";
            thumb = _el("div", {
                class: `thumb thumb-${kind}`,
                part: `thumb thumb-${kind}`,
                role: "slider",
                tabindex: isDisabled ? "-1" : "0",
                "aria-label": this.getAttribute(labelAttr) || fallbackLabel,
                "aria-valuenow": String(value),
                "aria-valuemin": String(ariaMin),
                "aria-valuemax": String(ariaMax),
                "aria-orientation": this.orientation,
                "aria-disabled": isDisabled ? "true" : null,
                "data-thumb": kind,
            });
            this._applyAriaValueText(thumb, value);
        }

        if (this.showValue === "none") return thumb;
        return this._buildTooltip(thumb, kind);
    }

    _buildTicks() {
        const ticks = this._resolveTicks();

        if (ticks.length === 0) return [];

        const showLabels = this.tickLabels;
        const out = [];

        for (const tick of ticks) {
            const pct = this._toPercentage(tick.value);
            out.push(
                _el("div", {
                    class: "tick",
                    part: "tick",
                    style: `--_tick-pct: ${pct}%`,
                }),
            );
            if (showLabels) {
                const text =
                    tick.label != null
                        ? String(tick.label)
                        : String(tick.value);
                out.push(
                    _el(
                        "div",
                        {
                            class: "tick-label",
                            part: "tick-label",
                            style: `--_tick-pct: ${pct}%`,
                        },
                        [text],
                    ),
                );
            }
        }

        return out;
    }

    _buildTrack() {
        const isDisabled = this.disabled;
        const tickEls = this._buildTicks();

        if (this.range) {
            const track = _el("div", {
                class: `track track--${this.orientation} track--range`,
                part: "track",
                role: "group",
                "aria-label": this.getAttribute("aria-label") || "Range slider",
                "aria-orientation": this.orientation,
                "aria-disabled": isDisabled ? "true" : null,
            });
            track.appendChild(
                _el("div", { class: "fill", part: "track-fill" }),
            );
            for (const t of tickEls) track.appendChild(t);
            track.appendChild(this._buildThumb("min"));
            track.appendChild(this._buildThumb("max"));
            return track;
        }

        const track = _el("div", {
            class: `track track--${this.orientation}`,
            part: "track",
            role: "slider",
            tabindex: isDisabled ? "-1" : "0",
            "aria-valuenow": String(this.value),
            "aria-valuemin": String(this.min),
            "aria-valuemax": String(this.max),
            "aria-valuestep": this.step != null ? String(this.step) : null,
            "aria-orientation": this.orientation,
            "aria-disabled": isDisabled ? "true" : null,
        });
        track.appendChild(_el("div", { class: "fill", part: "track-fill" }));
        for (const t of tickEls) track.appendChild(t);
        track.appendChild(this._buildThumb("single"));
        this._applyAriaValueText(track, this.value);

        return track;
    }

    _computeFromPointer(e) {
        const rect = this._track.getBoundingClientRect();
        let ratio;
        if (this.orientation === "vertical") {
            ratio = 1 - clamp((e.clientY - rect.top) / rect.height, 0, 1);
        } else {
            ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
        }
        return this.min + ratio * (this.max - this.min);
    }

    _dispatchValueEvent(type) {
        const detail = this.range
            ? {
                  valueMin: this.valueMin,
                  valueMax: this.valueMax,
                  thumb: this._activeThumb === "max" ? "max" : "min",
              }
            : { value: this.value };
        this.dispatchEvent(
            new CustomEvent(type, {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
    }

    /** Clamp into [lo, hi] then snap to either ticks or step. */
    _finalize(val, lo, hi) {
        const n = Number(val);
        if (!Number.isFinite(n)) return lo;

        const clamped = clamp(n, lo, hi);
        if (this.snapToTicks) return this._snapToTicks(clamped, lo, hi);

        const stepped = this._snapToStep(clamped);
        return clamp(stepped, lo, hi);
    }

    _formatFormValue() {
        return this.range
            ? `${this.valueMin},${this.valueMax}`
            : String(this.value);
    }

    _formatValue(value) {
        const prefix = this._slotText(this._prefixSlot);
        const suffix = this._slotText(this._suffixSlot);
        return `${prefix}${value}${suffix}`;
    }

    _nearestThumbToValue(target) {
        const dMin = Math.abs(target - this.valueMin);
        const dMax = Math.abs(target - this.valueMax);

        return dMin <= dMax ? "min" : "max";
    }

    _onKeyDown(e) {
        if (this.disabled) return;
        const s = this.step || 1;
        const which = this.range
            ? e.currentTarget?.dataset?.thumb || this._activeThumb
            : "single";
        const current = this._readValueFor(which);
        let next = current;
        let handled = true;
        switch (e.key) {
            case "ArrowRight":
            case "ArrowUp":
                next = current + s;
                break;
            case "ArrowLeft":
            case "ArrowDown":
                next = current - s;
                break;
            case "Home":
                next =
                    this.range && which === "max"
                        ? this.valueMin + this.minGap
                        : this.min;
                break;
            case "End":
                next =
                    this.range && which === "min"
                        ? this.valueMax - this.minGap
                        : this.max;
                break;
            default:
                handled = false;
        }

        if (!handled) return;

        e.preventDefault();
        this._activeThumb = which;
        this._writeValueFor(which, next);
        this._dispatchValueEvent("input");
        this._dispatchValueEvent("change");
    }

    _onPointerDown(e) {
        if (this.disabled) return;
        e.preventDefault();
        this._dragging = true;

        if (this.range) {
            const thumbEl = e.target.closest("[data-thumb]");
            if (thumbEl) {
                this._activeThumb = thumbEl.dataset.thumb;
            } else {
                const target = this._computeFromPointer(e);
                this._activeThumb = this._nearestThumbToValue(target);
            }
            const focusEl =
                this._activeThumb === "max" ? this._thumbMax : this._thumbMin;
            focusEl?.focus({ preventScroll: true });
        } else {
            this._activeThumb = "single";
            this._track.focus({ preventScroll: true });
        }

        this._refreshTooltipOpen();
        this._updateFromPointer(e);
        document.addEventListener("pointermove", this._onPointerMove);
        document.addEventListener("pointerup", this._onPointerUp);
    }

    _onPointerMove(e) {
        if (!this._dragging) return;
        this._updateFromPointer(e);
    }

    _onPointerUp() {
        if (!this._dragging) return;
        this._dragging = false;
        document.removeEventListener("pointermove", this._onPointerMove);
        document.removeEventListener("pointerup", this._onPointerUp);
        this._refreshTooltipOpen();
        this._dispatchValueEvent("change");
    }

    _readValueFor(which) {
        if (which === "min") return this.valueMin;
        if (which === "max") return this.valueMax;
        return this.value;
    }

    /**
     * Toggle each tooltip's `open` attribute based on drag/focus state.
     * Only relevant in show-value="dragging" mode; in "always" mode the
     * tooltip is opened at render time, in "none" mode there's no tooltip.
     */
    _refreshTooltipOpen() {
        if (this.showValue !== "dragging") return;
        if (this.range) {
            const minActive =
                (this._dragging && this._activeThumb === "min") ||
                this._focusedThumb === "min";
            const maxActive =
                (this._dragging && this._activeThumb === "max") ||
                this._focusedThumb === "max";
            this._setTooltipOpen(this._tooltipMin, minActive);
            this._setTooltipOpen(this._tooltipMax, maxActive);
        } else {
            const active = this._dragging || this._focusedThumb === "single";
            this._setTooltipOpen(this._tooltipSingle, active);
        }
    }

    _refreshTooltipText() {
        if (this.showValue === "none") return;
        if (this.range) {
            if (this._tooltipMin) {
                this._tooltipMin.setAttribute(
                    "text",
                    this._formatValue(this.valueMin),
                );
            }
            if (this._tooltipMax) {
                this._tooltipMax.setAttribute(
                    "text",
                    this._formatValue(this.valueMax),
                );
            }
            this._applyAriaValueText(this._thumbMin, this.valueMin);
            this._applyAriaValueText(this._thumbMax, this.valueMax);
        } else {
            if (this._tooltipSingle) {
                this._tooltipSingle.setAttribute(
                    "text",
                    this._formatValue(this.value),
                );
            }
            this._applyAriaValueText(this._track, this.value);
        }
    }

    _resolveTicks() {
        const raw = this.getAttribute("ticks");
        if (raw === null) return [];

        const stride = (s) => {
            if (!Number.isFinite(s) || s <= 0) return [];
            const out = [];
            for (let v = this.min; v <= this.max + 1e-9; v += s) {
                out.push({ value: Math.min(v, this.max) });
            }
            return out;
        };

        if (raw === "" || raw === "true") {
            const range = this.max - this.min;
            return stride(this.step ?? range / 10);
        }

        const asInt = Number(raw);
        if (Number.isInteger(asInt) && String(asInt) === raw.trim()) {
            if (asInt < 2) return [];
            return stride((this.max - this.min) / (asInt - 1));
        }

        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            const out = [];
            for (const entry of parsed) {
                const tick =
                    typeof entry === "number" ? { value: entry } : entry;
                if (
                    !tick ||
                    !Number.isFinite(tick.value) ||
                    tick.value < this.min ||
                    tick.value > this.max
                ) {
                    if (tick && Number.isFinite(tick.value)) {
                        // eslint-disable-next-line no-console
                        console.warn(
                            `y-slider: tick value ${tick.value} is outside [${this.min}, ${this.max}], skipping`,
                        );
                    }
                    continue;
                }
                out.push(
                    tick.label != null
                        ? { value: tick.value, label: tick.label }
                        : { value: tick.value },
                );
            }
            return out;
        } catch {
            return [];
        }
    }

    /** Map "start"/"end" + orientation to a cardinal position for y-tooltip. */
    _resolveTooltipPosition() {
        const pos = this.valuePosition;
        if (this.orientation === "vertical") {
            return pos === "start" ? "left" : "right";
        }
        return pos === "start" ? "top" : "bottom";
    }

    _setTooltipOpen(tooltip, open) {
        if (!tooltip) return;
        if (open) {
            if (!tooltip.hasAttribute("open")) tooltip.setAttribute("open", "");
        } else if (tooltip.hasAttribute("open")) {
            tooltip.removeAttribute("open");
        }
    }

    _snapToStep(val) {
        if (!this.step) return val;
        const steps = Math.round((val - this.min) / this.step);
        return clamp(this.min + steps * this.step, this.min, this.max);
    }

    _snapToTicks(val, lo = this.min, hi = this.max) {
        const ticks = this._resolveTicks().filter(
            (t) => t.value >= lo && t.value <= hi,
        );
        if (ticks.length === 0) return clamp(val, lo, hi);
        let nearest = ticks[0].value;
        let dMin = Math.abs(val - nearest);
        for (let i = 1; i < ticks.length; i++) {
            const d = Math.abs(val - ticks[i].value);
            if (d < dMin) {
                dMin = d;
                nearest = ticks[i].value;
            }
        }
        return nearest;
    }

    _slotText(slot) {
        if (!slot) return "";

        const nodes = slot.assignedNodes({ flatten: true });
        let out = "";

        for (const node of nodes) {
            const text = node.textContent;
            if (text) out += text;
        }

        return out.trim();
    }

    _syncFormValue() {
        this._internals.setFormValue(
            this._formatFormValue(),
            this.getAttribute("name"),
        );
    }

    _toPercentage(val) {
        const range = this.max - this.min;
        if (range <= 0) return 0;
        return clamp(((val - this.min) / range) * 100, 0, 100);
    }

    _updateFromPointer(e) {
        const raw = this._computeFromPointer(e);
        this._writeValueFor(this._activeThumb, raw);
        this._dispatchValueEvent("input");
    }

    /** Fast path: only the things that change on every drag tick. */
    _updateVisuals() {
        if (this.range) {
            this.style.setProperty("--_pct-min", `${this.percentageMin}%`);
            this.style.setProperty("--_pct-max", `${this.percentageMax}%`);
            if (this._thumbMin) {
                this._thumbMin.setAttribute(
                    "aria-valuenow",
                    String(this.valueMin),
                );
                this._thumbMin.setAttribute(
                    "aria-valuemax",
                    String(this.valueMax - this.minGap),
                );
            }
            if (this._thumbMax) {
                this._thumbMax.setAttribute(
                    "aria-valuenow",
                    String(this.valueMax),
                );
                this._thumbMax.setAttribute(
                    "aria-valuemin",
                    String(this.valueMin + this.minGap),
                );
            }
        } else {
            this.style.setProperty("--_pct", `${this.percentage}%`);
            if (this._track) {
                this._track.setAttribute("aria-valuenow", String(this.value));
            }
        }
        this._refreshTooltipText();
    }

    _writeValueFor(which, raw) {
        if (which === "min") this.valueMin = raw;
        else if (which === "max") this.valueMax = raw;
        else this.value = raw;
    }

    static _stylesheet() {
        if (YumeSlider.__sheet) return YumeSlider.__sheet;
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: inline-block;
                font-family: var(--font-family-body);
                color: var(--base-content--);
                min-width: 100px;
                box-sizing: border-box;
            }

            :host([orientation="vertical"]) {
                display: inline-flex;
                min-width: 0;
                min-height: 100px;
                height: 100%;
                vertical-align: top;
            }

            :host([disabled]) {
                opacity: 0.5;
                pointer-events: none;
            }

            .wrapper {
                display: flex;
                width: 100%;
                height: 100%;
            }

            .track {
                position: relative;
                box-sizing: content-box;
                background: var(--component-slider-track-color, var(--base-background-active));
                border: var(--component-slider-border-width) solid var(--base-border);
                border-radius: var(--radii-full);
                padding: var(--component-slider-padding);
                outline: none;
                touch-action: none;
                cursor: pointer;
            }

            .track--horizontal {
                width: 100%;
                height: var(--_track-thickness);
                margin: calc(var(--_thumb-size) / 2) 0;
            }

            .track--vertical {
                width: var(--_track-thickness);
                height: 100%;
                margin: 0 calc(var(--_thumb-size) / 2);
            }

            .fill {
                position: absolute;
                background: var(--component-slider-fill-color, var(--_fill-color));
                border-radius: inherit;
                pointer-events: none;
            }

            .track--horizontal .fill {
                top: 0;
                left: 0;
                height: 100%;
                width: var(--_pct);
            }

            .track--vertical .fill {
                left: 0;
                bottom: 0;
                width: 100%;
                height: var(--_pct);
            }

            .track--horizontal.track--range .fill {
                left: var(--_pct-min);
                width: calc(var(--_pct-max) - var(--_pct-min));
            }

            .track--vertical.track--range .fill {
                bottom: var(--_pct-min);
                height: calc(var(--_pct-max) - var(--_pct-min));
            }

            .thumb {
                box-sizing: border-box;
                width: var(--_thumb-size);
                height: var(--_thumb-size);
                background: var(--component-slider-fill-color, var(--_fill-color));
                border: var(--component-slider-thumb-border-width) solid var(--base-background-component);
                border-radius: var(--radii-full);
                box-shadow: var(--component-slider-thumb-shadow, var(--base-shadow));
                cursor: grab;
                touch-action: none;
                outline: none;
                display: block;
            }

            .thumb:active {
                cursor: grabbing;
            }

            /* Unwrapped thumb (show-value="none") — direct child of track. */
            .track > .thumb {
                position: absolute;
                z-index: 1;
            }

            .track--horizontal > .thumb {
                top: 50%;
                left: var(--_pct);
                transform: translate(-50%, -50%);
            }

            .track--vertical > .thumb {
                left: 50%;
                bottom: var(--_pct);
                transform: translate(-50%, 50%);
            }

            .track--horizontal > .thumb-min { left: var(--_pct-min); }
            .track--horizontal > .thumb-max { left: var(--_pct-max); z-index: 2; }
            .track--vertical > .thumb-min { bottom: var(--_pct-min); }
            .track--vertical > .thumb-max { bottom: var(--_pct-max); z-index: 2; }

            /* Wrapped thumb — y-tooltip is the positioned element. */
            .tooltip {
                position: absolute;
                display: inline-block;
                z-index: 1;
                line-height: 0;
            }

            .track--horizontal > .tooltip {
                top: 50%;
                left: var(--_pct);
                transform: translate(-50%, -50%);
            }

            .track--vertical > .tooltip {
                left: 50%;
                bottom: var(--_pct);
                transform: translate(-50%, 50%);
            }

            .track--horizontal > .tooltip-min { left: var(--_pct-min); }
            .track--horizontal > .tooltip-max { left: var(--_pct-max); z-index: 2; }
            .track--vertical > .tooltip-min { bottom: var(--_pct-min); }
            .track--vertical > .tooltip-max { bottom: var(--_pct-max); z-index: 2; }

            .slot-hidden {
                display: none;
            }

            .tick {
                position: absolute;
                width: var(--component-slider-tick-size);
                height: var(--component-slider-tick-size);
                background: var(--component-slider-tick-color, var(--base-border));
                border-radius: var(--radii-full);
                pointer-events: none;
            }

            .track--horizontal > .tick {
                top: 50%;
                left: var(--_tick-pct);
                transform: translate(-50%, -50%);
            }

            .track--vertical > .tick {
                left: 50%;
                bottom: var(--_tick-pct);
                transform: translate(-50%, 50%);
            }

            .tick-label {
                position: absolute;
                font-size: var(--component-slider-tick-label-size);
                color: var(--base-content--);
                white-space: nowrap;
                pointer-events: none;
            }

            .track--horizontal > .tick-label {
                top: 100%;
                left: var(--_tick-pct);
                transform: translateX(-50%);
                margin-top: calc(var(--_thumb-size) / 2 + var(--component-slider-tick-label-gap));
            }

            .track--vertical > .tick-label {
                left: 100%;
                bottom: var(--_tick-pct);
                transform: translateY(50%);
                margin-left: calc(var(--_thumb-size) / 2 + var(--component-slider-tick-label-gap));
            }

            .track:focus-visible .thumb,
            .thumb:focus-visible {
                outline: var(--component-slider-thumb-border-width) solid var(--_fill-color);
                outline-offset: 2px;
            }
        `);
        YumeSlider.__sheet = sheet;
        return sheet;
    }
}

if (!customElements.get("y-slider")) {
    customElements.define("y-slider", YumeSlider);
}
