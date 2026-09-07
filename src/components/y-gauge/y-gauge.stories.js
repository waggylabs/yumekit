import "./y-gauge.js";

const TACH_RANGES = [{ from: 6000, to: 8000, color: "var(--error-content)" }];

const LEVEL_RANGES = [
    { from: 0, to: 30, color: "var(--error-content)" },
    { from: 30, to: 70, color: "var(--warning-content)" },
    { from: 70, to: 100, color: "var(--success-content)" },
];

export default {
    title: "Data/Gauge",
    tags: ["autodocs"],
    parameters: {
        docs: {
            source: {
                // `ranges` is a property, so it never appears in the element's
                // outerHTML — rebuild the snippet with the script that sets it.
                transform: (code, ctx) => {
                    const base = code.split("\n\n<script>")[0];
                    if (!ctx.args.ranges) return base;
                    return [
                        base,
                        "",
                        "<script>",
                        '    const gauge = document.querySelector("y-gauge");',
                        `    gauge.ranges = ${JSON.stringify(ctx.args.ranges)};`,
                        "</script>",
                    ].join("\n");
                },
            },
        },
    },
    argTypes: {
        value: {
            // A plain number input, not a range — the slider's max can't follow a
            // per-story `max` (an RPM gauge goes to 8000, not 100).
            control: "number",
            description: "Current value.",
        },
        min: { control: "number", description: "Domain minimum." },
        max: { control: "number", description: "Domain maximum." },
        thickness: {
            control: { type: "range", min: 0.04, max: 0.4, step: 0.02 },
            description: "Ring thickness as a fraction of the radius.",
            table: { defaultValue: { summary: "0.16" } },
        },
        progress: {
            control: "boolean",
            description: "Fill the arc from the minimum to the value.",
            table: { defaultValue: { summary: "true" } },
        },
        needle: {
            control: "boolean",
            description: "Draw a needle pointing at the value (instrument style).",
        },
        target: {
            control: "number",
            description: "Optional target value; renders a caret marker.",
        },
        ticks: {
            control: { type: "range", min: 0, max: 12, step: 1 },
            description: "Number of major tick intervals.",
        },
        minorTicks: {
            control: { type: "range", min: 0, max: 5, step: 1 },
            description: "Minor subdivisions between major ticks.",
        },
        tickLabels: {
            control: "boolean",
            description: "Label the major ticks with their values.",
        },
        showValue: {
            control: "boolean",
            description: "Show the center value.",
            table: { defaultValue: { summary: "true" } },
        },
        unit: { control: "text", description: "Unit appended to the value." },
        label: { control: "text", description: "Caption under the value." },
        decimals: {
            control: { type: "range", min: 0, max: 3, step: 1 },
            description: "Fractional digits in the center value.",
        },
        color: {
            control: "color",
            description: "Accent color. Defaults to the theme primary.",
        },
        startAngle: { control: "number", description: "Arc start (0° = top, cw)." },
        endAngle: { control: "number", description: "Arc end (0° = top, cw)." },
        size: {
            control: { type: "range", min: 120, max: 360, step: 10 },
            description:
                "Demo width, applied as a CSS width. A gauge has no size attribute — it fills its container.",
        },
    },
};

function render(args) {
    const el = document.createElement("y-gauge");

    if (args.value != null) el.setAttribute("value", String(args.value));
    if (args.min != null) el.setAttribute("min", String(args.min));
    if (args.max != null) el.setAttribute("max", String(args.max));
    if (args.thickness != null)
        el.setAttribute("thickness", String(args.thickness));
    if (args.progress === false) el.setAttribute("progress", "false");
    if (args.needle) el.setAttribute("needle", "");
    if (args.target != null) el.setAttribute("target", String(args.target));
    if (args.ticks) el.setAttribute("ticks", String(args.ticks));
    if (args.minorTicks) el.setAttribute("minor-ticks", String(args.minorTicks));
    if (args.tickLabels) el.setAttribute("tick-labels", "");
    if (args.showValue === false) el.setAttribute("show-value", "false");
    if (args.unit) el.setAttribute("unit", args.unit);
    if (args.label) el.setAttribute("label", args.label);
    if (args.decimals) el.setAttribute("decimals", String(args.decimals));
    if (args.color) el.setAttribute("color", args.color);
    if (args.loading) el.setAttribute("loading", "");
    if (args.startAngle != null)
        el.setAttribute("start-angle", String(args.startAngle));
    if (args.endAngle != null)
        el.setAttribute("end-angle", String(args.endAngle));

    if (args.ranges) el.ranges = args.ranges;

    // Width follows the container: demos give the host a CSS width to size it.
    el.style.width = `${args.size || 220}px`;

    return el;
}

// The default: a clean KPI dial — neutral track, accent fill, big number.
export const Default = {
    render,
    args: { value: 68, unit: "%", label: "Utilization" },
};

export const AgainstATarget = {
    render,
    args: { value: 72, target: 90, unit: "%", label: "Quota" },
};

export const Thresholds = {
    render,
    args: {
        value: 84,
        unit: "%",
        label: "Health",
        ranges: LEVEL_RANGES,
    },
};

// Instrument style: colored zones, a needle, and a labeled scale.
export const Speedometer = {
    render,
    args: {
        value: 55,
        min: 0,
        max: 120,
        unit: " mph",
        needle: true,
        progress: false,
        ticks: 12,
        minorTicks: 1,
        tickLabels: true,
        size: 300,
    },
};

export const Tachometer = {
    render,
    args: {
        value: 3200,
        min: 0,
        max: 8000,
        unit: " rpm",
        label: "Engine",
        needle: true,
        progress: false,
        ticks: 8,
        minorTicks: 1,
        tickLabels: true,
        ranges: TACH_RANGES,
        size: 300,
    },
};

// A 180° sweep: start at 9 o'clock (270°), end at 3 o'clock (450°).
export const Semicircle = {
    render,
    args: {
        value: 42,
        unit: "%",
        label: "Battery",
        startAngle: 270,
        endAngle: 450,
    },
};

/**
 * A closed ring: a 360° span from `start-angle` to `end-angle` leaves no gap, so the
 * progress arc fills the whole circumference. Good for a completion figure, where "all
 * the way round" reads as done more directly than a arc that stops short of its end.
 */
export const FullCircle = {
    render,
    args: {
        value: 72,
        unit: "%",
        label: "Storage used",
        startAngle: 0,
        endAngle: 360,
    },
    parameters: {
        docs: {
            description: {
                story: "Any 360° span closes the ring — `0`/`360` starts the fill at twelve o'clock. Because the two ends meet, a closed dial has no distinct minimum and maximum position: at `value = max` a needle points exactly where it does at `value = min`, so reserve `needle` for open sweeps.",
            },
        },
    },
};

/** A closed ring with a tick scale, like a clock face or a compass rose. */
export const FullCircleTicks = {
    render,
    args: {
        value: 135,
        min: 0,
        max: 360,
        unit: "°",
        label: "Heading",
        startAngle: 0,
        endAngle: 360,
        ticks: 8,
        minorTicks: 2,
        tickLabels: true,
        size: 240,
    },
    parameters: {
        docs: {
            description: {
                story: "The scale drops the mark at `max`, since on a closed dial it would sit exactly on top of the one at `min`.",
            },
        },
    },
};

export const Needle = {
    render,
    args: { value: 68, unit: "%", needle: true, label: "Load" },
};

export const CustomColor = {
    render,
    args: { value: 61, unit: "%", color: "#7c3aed", label: "Progress" },
};

export const NoValueText = {
    render,
    args: { value: 40, showValue: false, ranges: LEVEL_RANGES },
};

export const Loading = {
    render,
    args: { loading: true, label: "CPU load" },
};

// A row of KPI dials — the dashboard use case the default is tuned for.
export const Dashboard = {
    render: () => {
        const row = document.createElement("div");
        row.style.cssText = "display:flex;gap:1rem;flex-wrap:wrap;";

        const tiles = [
            { value: 68, unit: "%", label: "CPU", color: "" },
            { value: 41, unit: "%", label: "Memory", color: "" },
            { value: 92, unit: "%", label: "Disk", color: "var(--error-content)" },
        ];

        for (const t of tiles) {
            const g = render({ ...t, size: 150, target: 80 });
            row.appendChild(g);
        }

        return row;
    },
};
