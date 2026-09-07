import "../y-skeleton/y-skeleton.js";

import {
    clamp,
    coerceRichData,
    createElement as _el,
    safeColor,
    upgradeProperties,
} from "../../modules/helpers.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// The gauge is drawn once in a fixed user-unit box and scaled to the host by the
// SVG viewBox, so every mark — including text — stays crisp at any size and no
// re-layout is needed on resize.
const VIEW = 200;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R = 74; // ring centerline radius

const DEFAULT_START = 225; // lower-left; 0° = top, degrees increase clockwise
const DEFAULT_END = 495; //   lower-right, a 270° sweep with the gap at the bottom

const NEEDLE_HUB = 5;
const TICK_MAJOR = 6;
const TICK_MINOR = 3;

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

function round(n) {
    return Math.round(n * 1000) / 1000;
}

/** Cartesian point on a circle, clock convention (0 = 12 o'clock). */
function polarPoint(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export class YumeGauge extends HTMLElement {
    static get observedAttributes() {
        return [
            "value",
            "min",
            "max",
            "start-angle",
            "end-angle",
            "thickness",
            "progress",
            "needle",
            "target",
            "ranges",
            "ticks",
            "minor-ticks",
            "tick-labels",
            "show-value",
            "label",
            "unit",
            "decimals",
            "color",
            "loading",
            "loading-text",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._ranges = [];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "ranges") this._ranges = coerceRichData(newValue, []);

        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Value/progress accent color. A safe CSS color, or unset to follow the range/theme. */
    get color() {
        return this.getAttribute("color") || "";
    }
    set color(val) {
        if (val == null) this.removeAttribute("color");
        else this.setAttribute("color", val);
    }

    /** Fractional digits shown in the center value (default 0). */
    get decimals() {
        const n = parseInt(this.getAttribute("decimals"), 10);
        return Number.isFinite(n) && n >= 0 ? clamp(n, 0, 6) : 0;
    }
    set decimals(val) {
        this.setAttribute("decimals", String(val));
    }

    /** Arc end, in degrees (0° = top, clockwise). Default 495 (a 270° sweep). */
    get endAngle() {
        const n = parseFloat(this.getAttribute("end-angle"));
        return Number.isFinite(n) ? n : DEFAULT_END;
    }
    set endAngle(val) {
        this.setAttribute("end-angle", String(val));
    }

    /** Caption under the value (e.g. "Speed"). */
    get label() {
        return this.getAttribute("label") || "";
    }
    set label(val) {
        this.setAttribute("label", val);
    }

    /** Whether to show a skeleton dial in place of the gauge while the value loads. */
    get loading() {
        return this.hasAttribute("loading");
    }
    set loading(val) {
        if (val) this.setAttribute("loading", "");
        else this.removeAttribute("loading");
    }

    /** Accessible label announced while `loading`. */
    get loadingText() {
        return this.getAttribute("loading-text") || "Loading gauge…";
    }
    set loadingText(val) {
        this.setAttribute("loading-text", val);
    }

    /** Domain maximum (default 100). */
    get max() {
        const n = parseFloat(this.getAttribute("max"));
        return Number.isFinite(n) ? n : 100;
    }
    set max(val) {
        this.setAttribute("max", String(val));
    }

    /** Domain minimum (default 0). */
    get min() {
        const n = parseFloat(this.getAttribute("min"));
        return Number.isFinite(n) ? n : 0;
    }
    set min(val) {
        this.setAttribute("min", String(val));
    }

    /** Minor tick subdivisions between each pair of major ticks (default 0). */
    get minorTicks() {
        const n = parseInt(this.getAttribute("minor-ticks"), 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }
    set minorTicks(val) {
        this.setAttribute("minor-ticks", String(val));
    }

    /** Whether to draw a needle pointing at the value (instrument style). */
    get needle() {
        return this.hasAttribute("needle");
    }
    set needle(val) {
        if (val) this.setAttribute("needle", "");
        else this.removeAttribute("needle");
    }

    /** Whether to fill the arc from the minimum to the value (default true). */
    get progress() {
        return this.getAttribute("progress") !== "false";
    }
    set progress(val) {
        this.setAttribute("progress", val ? "true" : "false");
    }

    /**
     * Colored zones as `[{from, to, color}]`, painted onto the track — redlines,
     * thresholds, or instrument bands. Set as a property or a JSON attribute.
     */
    get ranges() {
        return Array.isArray(this._ranges) ? this._ranges : [];
    }
    set ranges(val) {
        this._ranges = coerceRichData(val, []);
        this.render();
    }

    /** Whether the center value text is shown (default true). */
    get showValue() {
        return this.getAttribute("show-value") !== "false";
    }
    set showValue(val) {
        this.setAttribute("show-value", val ? "true" : "false");
    }

    /** Arc start, in degrees (0° = top, clockwise). Default 225 (a 270° sweep). */
    get startAngle() {
        const n = parseFloat(this.getAttribute("start-angle"));
        return Number.isFinite(n) ? n : DEFAULT_START;
    }
    set startAngle(val) {
        this.setAttribute("start-angle", String(val));
    }

    /** Optional target value; renders a caret marker on the arc. */
    get target() {
        const n = parseFloat(this.getAttribute("target"));
        return Number.isFinite(n) ? n : null;
    }
    set target(val) {
        if (val == null) this.removeAttribute("target");
        else this.setAttribute("target", String(val));
    }

    /** Ring thickness as a fraction of the radius (default 0.16). */
    get thickness() {
        const n = parseFloat(this.getAttribute("thickness"));
        return Number.isFinite(n) ? clamp(n, 0.04, 0.4) : 0.16;
    }
    set thickness(val) {
        this.setAttribute("thickness", String(val));
    }

    /** Whether major ticks are labeled with their values. */
    get tickLabels() {
        return this.hasAttribute("tick-labels");
    }
    set tickLabels(val) {
        if (val) this.setAttribute("tick-labels", "");
        else this.removeAttribute("tick-labels");
    }

    /** Number of major tick intervals around the arc (default 0 — none). */
    get ticks() {
        const n = parseInt(this.getAttribute("ticks"), 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }
    set ticks(val) {
        this.setAttribute("ticks", String(val));
    }

    /** Unit appended to the value (e.g. "%", "mph", " RPM"). */
    get unit() {
        return this.getAttribute("unit") || "";
    }
    set unit(val) {
        this.setAttribute("unit", val);
    }

    /** Current value. Defaults to the minimum. */
    get value() {
        const n = parseFloat(this.getAttribute("value"));
        return Number.isFinite(n) ? n : this.min;
    }
    set value(val) {
        this.setAttribute("value", String(val));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.adoptedStyleSheets = [this._stylesheet()];

        if (this.loading) {
            this.shadowRoot.replaceChildren(this._buildSkeleton());
            return;
        }

        const t = this.thickness * R;
        const layers = [
            ...this._buildTrack(t),
            ...this._buildProgress(t),
            ...this._buildTicks(t),
            ...this._buildTarget(t),
            ...this._buildNeedle(),
            ...this._buildValueText(),
        ];

        const clamped = clamp(this.value, this.min, this.max);
        const svg = _svg(
            "svg",
            {
                class: "gauge",
                part: "gauge",
                viewBox: `0 0 ${VIEW} ${VIEW}`,
                width: "100%",
                role: "meter",
                "aria-valuemin": this.min,
                "aria-valuemax": this.max,
                "aria-valuenow": clamped,
                "aria-valuetext": this._valueText(),
                "aria-label": this.label || "Gauge",
            },
            layers,
        );

        // An explicit or range-driven accent overrides the themed default for the
        // progress fill and the center number (the needle keeps its own color).
        const accent = this._accent();
        if (accent) svg.style.setProperty("--_gauge-accent", accent);

        this.shadowRoot.replaceChildren(svg);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /** Concrete accent color, or null to fall through to the themed default. */
    _accent() {
        const explicit = safeColor(this.getAttribute("color"));
        if (explicit) return explicit;

        return this._rangeColorAt(this.value) || null;
    }

    /** Angle (degrees) for `value`, clamped into the domain. */
    _angleFor(value) {
        const { min, max, startAngle, endAngle } = this;
        const span = max - min || 1;
        const f = clamp((value - min) / span, 0, 1);
        return startAngle + f * (endAngle - startAngle);
    }

    /** Open-arc `d` between two angles at `radius`. */
    _arc(radius, a1, a2) {
        const delta = a2 - a1;
        const dir = delta < 0 ? -1 : 1;
        const sweep = dir > 0 ? 1 : 0;
        const start = polarPoint(CX, CY, radius, a1);

        // A single elliptical-arc command whose endpoints coincide renders nothing at
        // all, so a full revolution has to be drawn as two half turns. Anything past
        // one turn is the same circle, so the sweep is capped there.
        if (Math.abs(delta) >= 360) {
            const half = polarPoint(CX, CY, radius, a1 + 180 * dir);
            return (
                `M ${round(start[0])} ${round(start[1])}` +
                ` A ${radius} ${radius} 0 0 ${sweep} ${round(half[0])} ${round(half[1])}` +
                ` A ${radius} ${radius} 0 0 ${sweep} ${round(start[0])} ${round(start[1])}`
            );
        }

        const end = polarPoint(CX, CY, radius, a2);
        const large = Math.abs(delta) > 180 ? 1 : 0;

        return `M ${round(start[0])} ${round(start[1])} A ${radius} ${radius} 0 ${large} ${sweep} ${round(end[0])} ${round(end[1])}`;
    }

    _buildNeedle() {
        if (!this.needle) return [];

        const angle = this._angleFor(this.value);
        const tipR = R - this.thickness * R - 4;

        // Drawn pointing up (angle 0), then rotated about the hub; the rotation is
        // a CSS transform so a value change eases into place.
        const needle = _svg("g", { class: "needle", part: "needle" }, [
            _svg("path", {
                class: "needle-pointer",
                part: "needle-pointer",
                d: `M ${CX} ${CY - tipR} L ${CX - 3.2} ${CY} L ${CX + 3.2} ${CY} Z`,
            }),
            _svg("circle", {
                class: "needle-hub",
                part: "needle-hub",
                cx: CX,
                cy: CY,
                r: NEEDLE_HUB,
            }),
        ]);
        needle.style.transform = `rotate(${round(angle)}deg)`;

        return [needle];
    }

    _buildProgress(t) {
        if (!this.progress) return [];

        // With zones on the ring, the fill is inset so both stay legible; on a bare
        // track it sits on the ring itself and reads as "filled to value".
        const hasZones = this.ranges.length > 0;
        const radius = hasZones ? R - t : R;
        const width = hasZones ? t * 0.55 : t;

        const span = this.max - this.min || 1;
        const f = clamp((this.value - this.min) / span, 0, 1);

        const path = _svg("path", {
            class: "progress",
            part: "progress",
            d: this._arc(radius, this.startAngle, this.endAngle),
            fill: "none",
            "stroke-width": round(width),
            pathLength: 1,
        });
        // pathLength=1 normalizes the sweep, so the offset is just (1 − fraction).
        path.style.strokeDashoffset = String(round(1 - f));

        return [path];
    }

    /**
     * A circular placeholder standing in for the dial while the value loads. The
     * skeleton is aria-hidden and the region is aria-busy, so a screen reader
     * hears "Loading gauge…" rather than reading an empty ring.
     */
    _buildSkeleton() {
        return _el(
            "div",
            {
                class: "skeleton",
                part: "skeleton",
                role: "img",
                "aria-busy": "true",
                "aria-label": this.loadingText,
            },
            [
                _el("y-skeleton", {
                    class: "skeleton-dial",
                    variant: "circle",
                    width: "100%",
                    "aria-hidden": "true",
                }),
            ],
        );
    }

    /** A small triangle pointing inward at `angle`, just outside the ring. */
    _buildTarget(t) {
        if (this.target == null) return [];

        const angle = this._angleFor(this.target);
        const outer = R + t / 2 + 2;
        const tip = polarPoint(CX, CY, outer, angle);
        const baseR = outer + 5;
        const a = polarPoint(CX, CY, baseR, angle - 3.2);
        const b = polarPoint(CX, CY, baseR, angle + 3.2);

        return [
            _svg("path", {
                class: "target",
                part: "target",
                d: `M ${round(tip[0])} ${round(tip[1])} L ${round(a[0])} ${round(a[1])} L ${round(b[0])} ${round(b[1])} Z`,
                role: "img",
                "aria-label": `Target ${this._display(this.target)}${this.unit}`,
            }),
        ];
    }

    _buildTicks(t) {
        if (this.ticks <= 0) return [];

        const marks = [];
        const outer = R + t / 2 + 2;
        const total = this.ticks * (this.minorTicks + 1);
        // On a closed dial the last tick lands exactly on the first, so it would stack a
        // second mark (and a second label) on top of it.
        const last = this._isFullCircle() ? total - 1 : total;

        for (let i = 0; i <= last; i++) {
            const isMajor = i % (this.minorTicks + 1) === 0;
            const value = this.min + (i / total) * (this.max - this.min);
            const angle = this._angleFor(value);
            const len = isMajor ? TICK_MAJOR : TICK_MINOR;

            const p1 = polarPoint(CX, CY, outer, angle);
            const p2 = polarPoint(CX, CY, outer + len, angle);

            marks.push(
                _svg("line", {
                    class: isMajor ? "tick" : "tick tick--minor",
                    part: isMajor ? "tick" : "tick-minor",
                    x1: round(p1[0]),
                    y1: round(p1[1]),
                    x2: round(p2[0]),
                    y2: round(p2[1]),
                }),
            );

            if (isMajor && this.tickLabels) {
                const lp = polarPoint(CX, CY, outer + len + 7, angle);
                marks.push(
                    _svg(
                        "text",
                        {
                            class: "tick-label",
                            part: "tick-label",
                            x: round(lp[0]),
                            y: round(lp[1]),
                            "text-anchor": "middle",
                            "dominant-baseline": "middle",
                        },
                        [document.createTextNode(this._display(value))],
                    ),
                );
            }
        }

        return marks;
    }

    _buildTrack(t) {
        const layers = [
            _svg("path", {
                class: "track",
                part: "track",
                d: this._arc(R, this.startAngle, this.endAngle),
                fill: "none",
                "stroke-width": round(t),
            }),
        ];

        // Zones paint over the neutral track; each is clamped into the domain.
        for (const range of this.ranges) {
            const from = clamp(
                Number(range?.from ?? range?.startValue),
                this.min,
                this.max,
            );
            const to = clamp(
                Number(range?.to ?? range?.endValue),
                this.min,
                this.max,
            );
            if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) {
                continue;
            }

            const stroke =
                safeColor(range?.color) || "var(--base-content-lighter)";

            layers.push(
                _svg("path", {
                    class: "zone",
                    part: "zone",
                    d: this._arc(R, this._angleFor(from), this._angleFor(to)),
                    fill: "none",
                    "stroke-width": round(t),
                    style: `stroke: ${stroke}`,
                }),
            );
        }

        return layers;
    }

    _buildValueText() {
        if (!this.showValue && !this.label) return [];

        // The needle pivots on the center hub, so centered text sits in the
        // pointer's path — the pointer literally crosses the number, and both
        // draw in content inks. With a needle the whole stack (value, then
        // label) drops below the tip's sweep, where the default arc's bottom
        // gap leaves it clear at any angle — the classic instrument-dial
        // readout. Without one it stays centered.
        const needleClear = this.needle
            ? CY + (R - this.thickness * R - 4) + 10
            : null;

        const children = [];

        if (this.showValue) {
            const value = _svg(
                "text",
                {
                    class: "value",
                    part: "value",
                    x: CX,
                    y: this.needle
                        ? round(needleClear)
                        : this.label
                          ? CY - 4
                          : CY,
                    "text-anchor": "middle",
                    "dominant-baseline": "middle",
                    "aria-hidden": "true",
                },
                [document.createTextNode(this._display(this.value))],
            );

            if (this.unit) {
                value.appendChild(
                    _svg("tspan", { class: "unit", part: "unit", dx: 2 }, [
                        document.createTextNode(this.unit),
                    ]),
                );
            }

            children.push(value);
        }

        if (this.label) {
            // The same 20-unit stack the centered layout uses; with the value
            // hidden the label takes the top slot alone.
            children.push(
                _svg(
                    "text",
                    {
                        class: "label",
                        part: "label",
                        x: CX,
                        y: this.needle
                            ? round(needleClear + (this.showValue ? 20 : 0))
                            : this.showValue
                              ? CY + 16
                              : CY,
                        "text-anchor": "middle",
                        "dominant-baseline": "middle",
                        "aria-hidden": "true",
                    },
                    [document.createTextNode(this.label)],
                ),
            );
        }

        return children;
    }

    /** Format a number with the configured decimals and grouped thousands. */
    _display(value) {
        if (!Number.isFinite(value)) return "";
        return value.toLocaleString(undefined, {
            minimumFractionDigits: this.decimals,
            maximumFractionDigits: this.decimals,
        });
    }

    /** Whether the dial closes on itself — start and end meet at the same point. */
    _isFullCircle() {
        return Math.abs(this.endAngle - this.startAngle) >= 360;
    }

    /** The color of the range containing `value`, or null. */
    _rangeColorAt(value) {
        for (const range of this.ranges) {
            const from = Number(range?.from ?? range?.startValue);
            const to = Number(range?.to ?? range?.endValue);
            const color = safeColor(range?.color);
            if (color && value >= from && value <= to) return color;
        }
        return null;
    }

    _stylesheet() {
        const ctor = this.constructor;
        if (ctor._sheet) return ctor._sheet;

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                color: var(--base-content);
                /* Resolves in the component's own theme scope, not the root's. */
                --_gauge-accent: var(--component-gauge-value-color, var(--primary-content));
            }

            .gauge {
                display: block;
                overflow: visible;
            }

            /* The base y-skeleton defaults to a fixed light gray; tint it to the
               theme. The dial fills the host width as the gauge SVG does. */
            .skeleton {
                display: flex;
                justify-content: center;
                --component-skeleton-bg: var(--component-gauge-skeleton-color, var(--base-background-hover));
            }

            .skeleton-dial {
                width: 100%;
            }

            .track {
                stroke: var(--component-gauge-track-color, var(--base-border));
                stroke-linecap: round;
            }

            .zone {
                stroke-linecap: butt;
            }

            .progress {
                stroke: var(--_gauge-accent);
                stroke-linecap: round;
                stroke-dasharray: 1;
                transition: stroke-dashoffset 0.4s ease;
            }

            .needle {
                transform-box: view-box;
                transform-origin: ${CX}px ${CY}px;
                transition: transform 0.4s ease;
            }

            .needle-pointer {
                fill: var(--component-gauge-needle-color, var(--base-content));
            }

            .needle-hub {
                fill: var(--component-gauge-needle-color, var(--base-content));
                stroke: var(--base-background-component);
                stroke-width: 1.5;
            }

            .tick {
                stroke: var(--component-gauge-tick-color, var(--base-content-light));
                stroke-width: 1.5;
            }

            .tick--minor {
                stroke: var(--component-gauge-tick-minor-color, var(--base-content-lighter));
                stroke-width: 1;
            }

            .tick-label {
                fill: var(--component-gauge-label-color, var(--base-content-light));
                font-family: var(--font-family-body);
                font-size: var(--component-gauge-tick-label-size, 9px);
            }

            .target {
                fill: var(--component-gauge-target-color, var(--base-content));
            }

            .value {
                fill: var(--_gauge-accent);
                font-family: var(--font-family-body);
                font-size: var(--component-gauge-value-size, 30px);
                font-weight: 600;
            }

            .unit {
                fill: var(--base-content-light);
                font-size: 0.5em;
                font-weight: 500;
            }

            .label {
                fill: var(--component-gauge-label-color, var(--base-content-light));
                font-family: var(--font-family-body);
                font-size: var(--component-gauge-label-size, 11px);
            }

            @media (prefers-reduced-motion: reduce) {
                .progress,
                .needle {
                    transition: none;
                }
            }
        `);

        ctor._sheet = sheet;
        return sheet;
    }

    /** Screen-reader value string: the formatted number plus any unit. */
    _valueText() {
        const unit = this.unit ? ` ${this.unit.trim()}` : "";
        return `${this._display(this.value)}${unit}`;
    }
}

if (!customElements.get("y-gauge")) {
    customElements.define("y-gauge", YumeGauge);
}
