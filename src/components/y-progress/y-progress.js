import {
    createElement as _el,
    getColorVarPair,
    GAP_TOKEN_MAP,
    clamp,
} from "../../modules/helpers.js";

const SVG_NS = "http://www.w3.org/2000/svg";

const VALID_MODES = new Set(["bar", "ring", "pie"]);
const VALID_DIRECTIONS = new Set(["clockwise", "counterclockwise"]);
const VALID_SIZE_KEYS = new Set(["small", "medium", "large"]);
const VALID_THICKNESS_KEYS = VALID_SIZE_KEYS;

const DEFAULT_MAX = 100;
const DEFAULT_MIN = 0;
const DEFAULT_SEGMENT_COUNT = 10;
const MAX_SEGMENT_COUNT = 50;
const DEFAULT_RING_PX = 80;
const RING_INDETERMINATE_ARC = 0.25; // fraction of circumference

function _svg(tag, attrs, children) {
    const node = document.createElementNS(SVG_NS, tag);
    if (attrs) {
        for (const [k, v] of Object.entries(attrs)) {
            if (v == null || v === false) continue;
            node.setAttribute(k, v === true ? "" : String(v));
        }
    }
    if (children) {
        for (const child of children) {
            if (child) node.appendChild(child);
        }
    }
    return node;
}

function polarPoint(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function piePath(cx, cy, r, startAngle, endAngle) {
    if (Math.abs(endAngle - startAngle) >= 360 - 0.01) {
        // Full circle: SVG path can't draw a 360° arc in one segment, so
        // emit two 180° arcs back-to-back.
        const mid = startAngle + 180;
        const [mx, my] = polarPoint(cx, cy, r, mid);
        const [sx, sy] = polarPoint(cx, cy, r, startAngle);
        return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 0 1 ${mx} ${my} A ${r} ${r} 0 0 1 ${sx} ${sy} Z`;
    }
    const [x1, y1] = polarPoint(cx, cy, r, startAngle);
    const [x2, y2] = polarPoint(cx, cy, r, endAngle);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    const sweep = endAngle > startAngle ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2} Z`;
}

export class YumeProgress extends HTMLElement {
    static get observedAttributes() {
        return [
            "value",
            "values",
            "min",
            "max",
            "step",
            "size",
            "thickness",
            "color",
            "track-color",
            "label-display",
            "label-format",
            "indeterminate",
            "disabled",
            "mode",
            "segmented",
            "segment-gap",
            "start-angle",
            "direction",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("min")) this.setAttribute("min", "0");
        if (!this.hasAttribute("max")) this.setAttribute("max", "100");
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme. Used as the default per-entry color when entries omit `color`. */
    get color() {
        return this.getAttribute("color") || "primary";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** Sweep direction for `ring` and `pie`. Ignored in `bar`. */
    get direction() {
        const v = this.getAttribute("direction");
        return VALID_DIRECTIONS.has(v) ? v : "clockwise";
    }
    set direction(val) {
        this.setAttribute("direction", val);
    }

    /** Whether the progress is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Whether the progress shows an indeterminate animation. */
    get indeterminate() {
        return this.hasAttribute("indeterminate");
    }
    set indeterminate(val) {
        if (val) this.setAttribute("indeterminate", "");
        else this.removeAttribute("indeterminate");
    }

    /** Whether to show the value label (default true). */
    get labelDisplay() {
        return this.getAttribute("label-display") !== "false";
    }
    set labelDisplay(val) {
        this.setAttribute("label-display", val ? "true" : "false");
    }

    /** Label format: `"percent" | "value" | "fraction"`. */
    get labelFormat() {
        return this.getAttribute("label-format") || "percent";
    }
    set labelFormat(val) {
        this.setAttribute("label-format", val);
    }

    /** Maximum value (default 100). */
    get max() {
        return parseFloat(this.getAttribute("max")) || DEFAULT_MAX;
    }
    set max(val) {
        this.setAttribute("max", String(val));
    }

    /** Minimum value (default 0). */
    get min() {
        return parseFloat(this.getAttribute("min")) || DEFAULT_MIN;
    }
    set min(val) {
        this.setAttribute("min", String(val));
    }

    /** Presentation mode: `"bar"` (default) | `"ring"` | `"pie"`. */
    get mode() {
        const v = this.getAttribute("mode");
        return VALID_MODES.has(v) ? v : "bar";
    }
    set mode(val) {
        this.setAttribute("mode", val);
    }

    /**
     * Computed total fill percentage (0–100). For multi-value entries this is
     * the sum of each entry's percentage, capped at 100 — driving aria-valuenow.
     */
    get percentage() {
        const entries = this._entries();
        if (entries.length === 0) return 0;
        if (entries.length === 1) {
            return this._entryPercentage(entries[0].value);
        }
        const total = entries.reduce(
            (s, e) => s + this._entryPercentage(e.value),
            0,
        );
        return clamp(total, 0, 100);
    }

    /**
     * Segment count for `segmented` rendering. Returns:
     *   - `null` when the attribute is absent
     *   - integer (capped at MAX_SEGMENT_COUNT) when set explicitly
     *   - derived from `step` (or DEFAULT_SEGMENT_COUNT) when present without value
     */
    get segmented() {
        if (!this.hasAttribute("segmented")) return null;
        const raw = this.getAttribute("segmented");
        if (raw === "" || raw === "true") return this._defaultSegmentCount();
        const n = parseInt(raw, 10);
        if (Number.isNaN(n) || n < 1) return null;
        return Math.min(n, MAX_SEGMENT_COUNT);
    }
    set segmented(val) {
        if (val === false || val === null || val === undefined) {
            this.removeAttribute("segmented");
        } else if (val === true) {
            this.setAttribute("segmented", "");
        } else {
            this.setAttribute("segmented", String(val));
        }
    }

    /** Gap between segments — token key (`none`/`x-small`/...) or raw length. */
    get segmentGap() {
        return this.getAttribute("segment-gap") || "x-small";
    }
    set segmentGap(val) {
        this.setAttribute("segment-gap", val);
    }

    /** Bar thickness or ring/pie diameter — token key or raw length. */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Starting angle in degrees for `ring`/`pie` (default `-90` = 12 o'clock). */
    get startAngle() {
        const n = parseFloat(this.getAttribute("start-angle"));
        return Number.isFinite(n) ? n : -90;
    }
    set startAngle(val) {
        this.setAttribute("start-angle", String(val));
    }

    /** Step increment for snapping, or null. */
    get step() {
        const s = parseFloat(this.getAttribute("step"));
        return Number.isNaN(s) || s <= 0 ? null : s;
    }
    set step(val) {
        if (val === null || val === undefined) this.removeAttribute("step");
        else this.setAttribute("step", String(val));
    }

    /** Ring stroke width — token key or raw length. Ignored in `bar`/`pie`. */
    get thickness() {
        return this.getAttribute("thickness") || "medium";
    }
    set thickness(val) {
        this.setAttribute("thickness", val);
    }

    /** Track color override (raw CSS color or empty for theme default). */
    get trackColor() {
        return this.getAttribute("track-color") || "";
    }
    set trackColor(val) {
        this.setAttribute("track-color", val);
    }

    /**
     * Single value (legacy API). Use `values` for multi-value rendering.
     * `null` when unset.
     */
    get value() {
        const v = parseFloat(this.getAttribute("value"));
        return Number.isNaN(v) ? null : v;
    }
    set value(val) {
        if (val === null || val === undefined) this.removeAttribute("value");
        else this.setAttribute("value", String(val));
    }

    /**
     * Array of `{value, color?, label?}` entries. When set with 2+ entries,
     * `bar` stacks, `ring` shows concentric rings, `pie` shows multi-slice.
     * Returns `null` when the attribute is absent (back-compat: `value` wins).
     */
    get values() {
        const raw = this.getAttribute("values");
        if (raw == null) return null;
        try {
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return null;
            return parsed
                .map((e) => (typeof e === "number" ? { value: e } : e))
                .filter(
                    (e) => e && Number.isFinite(parseFloat(e.value)),
                );
        } catch {
            return null;
        }
    }
    set values(val) {
        if (val === null || val === undefined) this.removeAttribute("values");
        else this.setAttribute("values", JSON.stringify(val));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Decrement the progress value by `step` (or 1). Single-value only. */
    decrement() {
        if (this.value === null) return;
        this.value = Math.max(this.value - (this.step || 1), this.min);
    }

    /** Increment the progress value by `step` (or 1). Single-value only. */
    increment() {
        if (this.value === null) return;
        this.value = Math.min(this.value + (this.step || 1), this.max);
    }

    render() {
        if (!this.shadowRoot) return;
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];

        // Allow the `track-color` attribute to flow through to nested SVG /
        // segment styles via a single CSS variable on the host.
        if (this.trackColor) this.style.setProperty("--track-color", this.trackColor);
        else this.style.removeProperty("--track-color");

        const wrapper = _el("div", { class: "wrapper" }, [
            this._buildHeader(),
            this._buildShape(),
        ]);

        this.shadowRoot.replaceChildren(wrapper);
        this._wireHeaderVisibility();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _ariaValueNow() {
        if (this.indeterminate) return null;
        const entries = this._entries();
        if (entries.length === 0) return null;
        if (entries.length === 1) return entries[0].value;
        // Multi-value: sum capped at max so screen readers report a sensible
        // "how full overall" number.
        const sum = entries.reduce(
            (s, e) => s + (parseFloat(e.value) || 0),
            0,
        );
        return Math.min(this.max, sum);
    }

    _buildBar() {
        const entries = this._entries();
        const isMulti = entries.length > 1;
        const segments = !isMulti && !this.indeterminate ? this.segmented : null;

        const track = _el("div", {
            class: "track",
            part: "track",
            role: "progressbar",
            "aria-valuenow": this._ariaValueNowAttr(),
            "aria-valuemin": String(this.min),
            "aria-valuemax": String(this.max),
            "aria-busy": this.indeterminate ? "true" : null,
            "aria-disabled": this.disabled ? "true" : null,
            style: `--_size: ${this._resolveSizeCSSValue()};`,
        });

        if (this.indeterminate) {
            track.appendChild(
                _el("div", {
                    class: "bar bar--indeterminate",
                    part: "bar",
                    style: this._barColorStyle(this._defaultEntry()),
                }),
            );
            return track;
        }

        if (isMulti) {
            for (const entry of entries) {
                const pct = this._entryPercentage(entry.value);
                track.appendChild(
                    _el("div", {
                        class: "bar bar--stacked",
                        part: "bar",
                        title: entry.label || null,
                        style: `width: ${pct}%; ${this._barColorStyle(entry)}`,
                    }),
                );
            }
            return track;
        }

        if (segments) {
            track.classList.add("track--segmented");
            track.style.setProperty(
                "--_segment-gap",
                this._resolveSegmentGap(),
            );
            const totalPct = entries[0]
                ? this._entryPercentage(entries[0].value)
                : 0;
            const fillUpTo = (totalPct / 100) * segments;
            const entry = entries[0] || this._defaultEntry();
            for (let i = 0; i < segments; i++) {
                const filled = clamp(fillUpTo - i, 0, 1);
                const seg = _el("div", {
                    class: "segment" + (filled > 0 ? " segment--filled" : ""),
                    part: "segment",
                    style:
                        `--_fill: ${filled}; ` + this._barColorStyle(entry),
                });
                track.appendChild(seg);
            }
            return track;
        }

        const entry = entries[0] || null;
        const pct = entry ? this._entryPercentage(entry.value) : 0;
        const showLabel = this.labelDisplay && entry !== null;
        if (showLabel) {
            track.appendChild(
                _el(
                    "span",
                    {
                        class: "value-label value-label--track",
                        part: "value-label",
                    },
                    [this._getLabel()],
                ),
            );
        }
        const bar = _el("div", {
            class: "bar",
            part: "bar",
            style: `width: ${pct}%; ${this._barColorStyle(entry || this._defaultEntry())}`,
        });
        if (showLabel) {
            bar.appendChild(
                _el(
                    "span",
                    {
                        class: "value-label value-label--bar",
                        style: `width: calc(100% / (${pct || 1} / 100));`,
                    },
                    [this._getLabel()],
                ),
            );
        }
        track.appendChild(bar);
        return track;
    }

    _buildHeader() {
        return _el("div", { class: "header" }, [
            _el("span", { class: "header-label" }, [_el("slot")]),
        ]);
    }

    _buildPie() {
        const entries = this._entries();
        const isMulti = entries.length > 1;
        const diameter = this._resolveDiameter();
        const cx = diameter / 2;
        const cy = diameter / 2;
        const r = diameter / 2;
        const startAngle = this.startAngle;
        const sweep = this.direction === "counterclockwise" ? -1 : 1;

        const svgChildren = [];

        if (this.indeterminate) {
            // Pie indeterminate: rotating partial sweep (~25% of circle).
            svgChildren.push(this._pieTrackCircle(cx, cy, r));
            const arcDeg = 360 * RING_INDETERMINATE_ARC;
            svgChildren.push(
                _svg("path", {
                    d: piePath(
                        cx,
                        cy,
                        r,
                        startAngle,
                        startAngle + sweep * arcDeg,
                    ),
                    class: "pie-fill pie-fill--indeterminate",
                    part: "pie-fill",
                    fill: this._entryFill(this._defaultEntry()),
                    "transform-origin": `${cx} ${cy}`,
                }),
            );
        } else if (entries.length === 0) {
            svgChildren.push(this._pieTrackCircle(cx, cy, r));
        } else if (isMulti) {
            // Track behind so partial sums leave the rest empty.
            svgChildren.push(this._pieTrackCircle(cx, cy, r));
            let cursor = startAngle;
            for (const entry of entries) {
                const pct = this._entryPercentage(entry.value);
                if (pct <= 0) continue;
                const arcDeg = (pct / 100) * 360;
                const next = cursor + sweep * arcDeg;
                svgChildren.push(
                    _svg("path", {
                        d: piePath(cx, cy, r, cursor, next),
                        class: "pie-fill pie-fill--slice",
                        part: "pie-fill",
                        fill: this._entryFill(entry),
                        "aria-hidden": "true",
                    }),
                );
                cursor = next;
            }
        } else {
            const entry = entries[0];
            const pct = this._entryPercentage(entry.value);
            svgChildren.push(this._pieTrackCircle(cx, cy, r));
            if (pct > 0) {
                const arcDeg = (pct / 100) * 360;
                svgChildren.push(
                    _svg("path", {
                        d: piePath(
                            cx,
                            cy,
                            r,
                            startAngle,
                            startAngle + sweep * arcDeg,
                        ),
                        class: "pie-fill",
                        part: "pie-fill",
                        fill: this._entryFill(entry),
                        "aria-hidden": "true",
                    }),
                );
            }
        }

        const svg = _svg(
            "svg",
            {
                class: "pie",
                part: "pie",
                viewBox: `0 0 ${diameter} ${diameter}`,
                width: diameter,
                height: diameter,
                role: "progressbar",
                "aria-valuenow": this._ariaValueNowAttr(),
                "aria-valuemin": String(this.min),
                "aria-valuemax": String(this.max),
                "aria-busy": this.indeterminate ? "true" : null,
                "aria-disabled": this.disabled ? "true" : null,
            },
            svgChildren,
        );
        return this._wrapShape(svg, diameter);
    }

    _buildRing() {
        const entries = this._entries();
        const isMulti = entries.length > 1;
        const diameter = this._resolveDiameter();
        const baseThickness = this._resolveThicknessPx();
        const startAngle = this.startAngle;
        const sweep = this.direction === "counterclockwise" ? -1 : 1;

        const segments =
            !isMulti && !this.indeterminate ? this.segmented : null;

        const svgChildren = [];

        if (this.indeterminate) {
            svgChildren.push(
                this._ringTrackCircle(diameter, baseThickness, false),
            );
            svgChildren.push(
                this._ringFillCircle(
                    diameter,
                    baseThickness,
                    this._defaultEntry(),
                    RING_INDETERMINATE_ARC,
                    startAngle,
                    sweep,
                    "ring-fill ring-fill--indeterminate",
                ),
            );
        } else if (isMulti) {
            // Concentric: each entry on its own ring, outer to inner.
            const ringGap = Math.max(2, baseThickness * 0.4);
            let outerR = diameter / 2 - baseThickness / 2;
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                const pct = this._entryPercentage(entry.value);
                svgChildren.push(
                    this._ringTrackArcAtRadius(
                        diameter,
                        outerR,
                        baseThickness,
                    ),
                );
                if (pct > 0) {
                    svgChildren.push(
                        this._ringFillArcAtRadius(
                            diameter,
                            outerR,
                            baseThickness,
                            entry,
                            pct / 100,
                            startAngle,
                            sweep,
                        ),
                    );
                }
                outerR -= baseThickness + ringGap;
                if (outerR <= baseThickness) break;
            }
        } else if (segments) {
            svgChildren.push(
                this._ringTrackCircle(diameter, baseThickness, false),
            );
            const r = diameter / 2 - baseThickness / 2;
            const fullArcDeg = 360;
            const totalPct = entries[0]
                ? this._entryPercentage(entries[0].value)
                : 0;
            const fillUpTo = (totalPct / 100) * segments;
            const segArcDeg = fullArcDeg / segments;
            const gapDeg = segArcDeg * 0.12;
            const entry = entries[0] || this._defaultEntry();
            for (let i = 0; i < segments; i++) {
                const filled = clamp(fillUpTo - i, 0, 1);
                if (filled <= 0) continue;
                const start =
                    startAngle + sweep * (i * segArcDeg + gapDeg / 2);
                const end =
                    startAngle +
                    sweep * (i * segArcDeg + segArcDeg * filled - gapDeg / 2);
                svgChildren.push(
                    _svg("path", {
                        d: this._strokeArcPath(r, diameter / 2, start, end),
                        class: "ring-fill ring-fill--segment",
                        part: "ring-fill segment",
                        fill: "none",
                        stroke: this._entryFill(entry),
                        "stroke-width": baseThickness,
                        "stroke-linecap": "butt",
                        "aria-hidden": "true",
                    }),
                );
            }
        } else {
            svgChildren.push(
                this._ringTrackCircle(diameter, baseThickness, false),
            );
            const entry = entries[0] || null;
            const pct = entry ? this._entryPercentage(entry.value) : 0;
            if (pct > 0) {
                svgChildren.push(
                    this._ringFillCircle(
                        diameter,
                        baseThickness,
                        entry,
                        pct / 100,
                        startAngle,
                        sweep,
                        "ring-fill",
                    ),
                );
            }
        }

        const svg = _svg(
            "svg",
            {
                class: "ring",
                part: "ring",
                viewBox: `0 0 ${diameter} ${diameter}`,
                width: diameter,
                height: diameter,
                role: "progressbar",
                "aria-valuenow": this._ariaValueNowAttr(),
                "aria-valuemin": String(this.min),
                "aria-valuemax": String(this.max),
                "aria-busy": this.indeterminate ? "true" : null,
                "aria-disabled": this.disabled ? "true" : null,
            },
            svgChildren,
        );
        return this._wrapShape(svg, diameter);
    }

    _buildShape() {
        switch (this.mode) {
            case "ring":
                return this._buildRing();
            case "pie":
                return this._buildPie();
            case "bar":
            default:
                return this._buildBar();
        }
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--base-content--);
            }
            :host([disabled]) {
                opacity: 0.5;
                pointer-events: none;
            }

            .wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: var(--font-size-label, 0.83em);
            }

            .header-label {
                color: var(--base-content--);
            }

            .track {
                position: relative;
                width: 100%;
                height: var(--_size, var(--component-progress-size-medium));
                background: var(--component-progress-track-color, var(--track-color, var(--base-background-component)));
                border: var(--component-progress-border-width) solid var(--base-border);
                border-radius: var(--component-progress-border-radius-outer);
                overflow: hidden;
                box-sizing: border-box;
                padding: var(--component-progress-padding);
            }

            .track--segmented {
                display: flex;
                gap: var(--_segment-gap, var(--component-progress-segment-gap, var(--spacing-x-small)));
                padding: 0;
                border: none;
                background: transparent;
            }

            .segment {
                position: relative;
                flex: 1;
                background: var(--component-progress-track-color, var(--track-color, var(--base-background-component)));
                border-radius: var(--component-progress-border-radius-inner);
                overflow: hidden;
            }
            .segment--filled::after {
                content: "";
                position: absolute;
                inset: 0;
                background: var(--_bar-color);
                transform: scaleX(var(--_fill, 1));
                transform-origin: left center;
            }

            .bar {
                position: relative;
                height: 100%;
                background: var(--_bar-color);
                border-radius: var(--component-progress-border-radius-inner);
                overflow: hidden;
                transition: width 0.3s ease;
            }
            .bar--stacked {
                border-radius: 0;
                transition: width 0.3s ease;
            }
            .bar--stacked:first-child {
                border-top-left-radius: var(--component-progress-border-radius-inner);
                border-bottom-left-radius: var(--component-progress-border-radius-inner);
            }
            .bar--stacked:last-child {
                border-top-right-radius: var(--component-progress-border-radius-inner);
                border-bottom-right-radius: var(--component-progress-border-radius-inner);
            }
            .bar--indeterminate {
                width: 30%;
                animation: y-progress-bar-indeterminate 1.5s ease-in-out infinite;
            }

            .value-label {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--font-size-small, 0.75em);
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
                pointer-events: none;
                font-weight: 600;
            }
            .value-label--track { color: var(--_bar-color); }
            .value-label--bar { color: var(--_bar-text-color); }

            .shape {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .ring, .pie {
                display: block;
            }
            .ring-track, .pie-track {
                fill: none;
                stroke: var(--component-progress-track-color, var(--track-color, var(--base-background-component)));
            }
            .pie-track {
                fill: var(--component-progress-track-color, var(--track-color, var(--base-background-component)));
                stroke: none;
            }
            .ring-fill {
                fill: none;
                transition: stroke-dashoffset 0.3s ease;
            }
            .ring-fill--indeterminate,
            .pie-fill--indeterminate {
                animation: y-progress-circular-spin 1.4s linear infinite;
                transform-origin: center;
            }

            .center {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }
            .center .value-label {
                position: static;
                font-size: var(--component-progress-label-size, var(--font-size-label));
            }

            @keyframes y-progress-bar-indeterminate {
                0%   { transform: translateX(0%); }
                50%  { transform: translateX(233%); }
                100% { transform: translateX(0%); }
            }
            @keyframes y-progress-circular-spin {
                from { transform: rotate(0deg); }
                to   { transform: rotate(360deg); }
            }
        `);
        return sheet;
    }

    _barColorStyle(entry) {
        const [bg, fg] = getColorVarPair(
            (entry && entry.color) || this.color,
            null,
        );
        return `--_bar-color: ${bg}; --_bar-text-color: ${fg};`;
    }

    _defaultEntry() {
        return { value: 0, color: this.color };
    }

    _defaultSegmentCount() {
        const step = this.step;
        if (step) {
            const range = this.max - this.min;
            if (range > 0) {
                const n = Math.round(range / step);
                if (n >= 2) return Math.min(n, MAX_SEGMENT_COUNT);
            }
        }
        return DEFAULT_SEGMENT_COUNT;
    }

    _entries() {
        const valuesAttr = this.getAttribute("values");
        if (valuesAttr != null) {
            try {
                const parsed = JSON.parse(valuesAttr);
                if (Array.isArray(parsed)) {
                    return parsed
                        .map((e) =>
                            typeof e === "number" ? { value: e } : e,
                        )
                        .filter(
                            (e) =>
                                e &&
                                Number.isFinite(parseFloat(e.value)),
                        )
                        .map((e) => ({
                            ...e,
                            value: parseFloat(e.value),
                        }));
                }
            } catch {
                // fall through to legacy `value` attribute
            }
        }
        const v = this.value;
        return v === null ? [] : [{ value: v }];
    }

    _entryFill(entry) {
        const [bg] = getColorVarPair((entry && entry.color) || this.color, null);
        return bg;
    }

    _entryPercentage(value) {
        const range = this.max - this.min;
        if (range <= 0) return 0;
        let pct = ((value - this.min) / range) * 100;
        if (this.step) {
            const stepPct = (this.step / range) * 100;
            pct = Math.round(pct / stepPct) * stepPct;
        }
        return clamp(pct, 0, 100);
    }

    _ariaValueNowAttr() {
        const n = this._ariaValueNow();
        return n == null ? null : String(n);
    }

    _getLabel() {
        if (this.indeterminate) return "";
        const entries = this._entries();
        if (entries.length === 0) return "";
        if (entries.length > 1) return "";
        const value = entries[0].value;
        const pct = this._entryPercentage(value);
        switch (this.labelFormat) {
            case "value":
                return `${value} / ${this.max}`;
            case "fraction":
                return `${value - this.min} / ${this.max - this.min}`;
            case "percent":
            default:
                return `${Math.round(pct)}%`;
        }
    }

    _pieTrackCircle(cx, cy, r) {
        return _svg("circle", {
            class: "pie-track",
            part: "pie-track",
            cx,
            cy,
            r,
            "aria-hidden": "true",
        });
    }

    _resolveDiameter() {
        const raw = this.size;
        if (VALID_SIZE_KEYS.has(raw)) {
            // Read computed value of the matching token so we have an actual
            // pixel number for SVG geometry.
            const computed = getComputedStyle(this)
                .getPropertyValue(`--component-progress-size-${raw}`)
                .trim();
            const parsed = parseFloat(computed);
            return Number.isFinite(parsed) && parsed > 0
                ? parsed
                : DEFAULT_RING_PX;
        }
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RING_PX;
    }

    _resolveSegmentGap() {
        const raw = this.segmentGap;
        if (GAP_TOKEN_MAP[raw]) return GAP_TOKEN_MAP[raw];
        return raw;
    }

    _resolveSizeCSSValue() {
        const raw = this.size;
        if (VALID_SIZE_KEYS.has(raw)) {
            return `var(--component-progress-size-${raw})`;
        }
        return raw;
    }

    _resolveThicknessPx() {
        const raw = this.thickness;
        if (VALID_THICKNESS_KEYS.has(raw)) {
            const computed = getComputedStyle(this)
                .getPropertyValue(`--component-progress-thickness-${raw}`)
                .trim();
            const parsed = parseFloat(computed);
            if (Number.isFinite(parsed) && parsed > 0) return parsed;
            const fallback = { small: 4, medium: 8, large: 12 };
            return fallback[raw];
        }
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
    }

    _ringFillArcAtRadius(diameter, r, thickness, entry, fraction, startAngle, sweep) {
        const cx = diameter / 2;
        const cy = diameter / 2;
        const arcDeg = clamp(fraction, 0, 1) * 360;
        const endAngle = startAngle + sweep * arcDeg;
        return _svg("path", {
            d: this._strokeArcPath(r, cx, startAngle, endAngle),
            class: "ring-fill",
            part: "ring-fill",
            fill: "none",
            stroke: this._entryFill(entry),
            "stroke-width": thickness,
            "stroke-linecap": "butt",
            "aria-hidden": "true",
        });
    }

    _ringFillCircle(diameter, thickness, entry, fraction, startAngle, sweep, className) {
        const r = diameter / 2 - thickness / 2;
        const cx = diameter / 2;
        const cy = diameter / 2;
        const circumference = 2 * Math.PI * r;
        const dash = clamp(fraction, 0, 1) * circumference;
        const baseRotation = startAngle + 90; // dasharray starts at 3 o'clock
        const rotation =
            sweep === 1
                ? `rotate(${baseRotation} ${cx} ${cy})`
                : `rotate(${baseRotation} ${cx} ${cy}) scale(1, -1) translate(0, ${-2 * cy})`;
        return _svg("circle", {
            class: className,
            part: "ring-fill",
            cx,
            cy,
            r,
            fill: "none",
            stroke: this._entryFill(entry),
            "stroke-width": thickness,
            "stroke-linecap": "butt",
            "stroke-dasharray": `${dash} ${circumference}`,
            transform: rotation,
            "aria-hidden": "true",
        });
    }

    _ringTrackArcAtRadius(diameter, r, thickness) {
        return _svg("circle", {
            class: "ring-track",
            part: "ring-track",
            cx: diameter / 2,
            cy: diameter / 2,
            r,
            fill: "none",
            "stroke-width": thickness,
            "aria-hidden": "true",
        });
    }

    _ringTrackCircle(diameter, thickness) {
        const r = diameter / 2 - thickness / 2;
        return _svg("circle", {
            class: "ring-track",
            part: "ring-track",
            cx: diameter / 2,
            cy: diameter / 2,
            r,
            fill: "none",
            "stroke-width": thickness,
            "aria-hidden": "true",
        });
    }

    _strokeArcPath(r, cx, startAngle, endAngle) {
        const cy = cx;
        const [x1, y1] = polarPoint(cx, cy, r, startAngle);
        const [x2, y2] = polarPoint(cx, cy, r, endAngle);
        const delta = endAngle - startAngle;
        const largeArc = Math.abs(delta) > 180 ? 1 : 0;
        const sweep = delta > 0 ? 1 : 0;
        return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
    }

    _wireHeaderVisibility() {
        const header = this.shadowRoot.querySelector(".header");
        const slot = header && header.querySelector("slot");
        if (!header || !slot) return;
        const update = () => {
            const has = slot
                .assignedNodes({ flatten: true })
                .some(
                    (n) =>
                        !(
                            n.nodeType === Node.TEXT_NODE &&
                            n.textContent.trim() === ""
                        ),
                );
            header.style.display = has ? "" : "none";
        };
        slot.addEventListener("slotchange", update);
        update();
    }

    _wrapShape(svg, diameter) {
        const wrapper = _el(
            "div",
            {
                class: "shape",
                style: `--_size: ${diameter}px; --_bar-color: ${this._entryFill(this._defaultEntry())};`,
            },
            [svg],
        );
        const center = _el("div", { class: "center", part: "center" }, [
            _el("slot", { name: "center" }, [
                this.labelDisplay && !this.indeterminate
                    ? _el(
                          "span",
                          {
                              class: "value-label",
                              part: "value-label",
                          },
                          [this._getLabel()],
                      )
                    : null,
            ]),
        ]);
        wrapper.appendChild(center);
        if (VALID_SIZE_KEYS.has(this.size)) {
            wrapper.style.setProperty(
                "--_size",
                `var(--component-progress-size-${this.size})`,
            );
        }
        return wrapper;
    }
}

if (!customElements.get("y-progress")) {
    customElements.define("y-progress", YumeProgress);
}
