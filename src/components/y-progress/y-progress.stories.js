import "./y-progress.js";

export default {
    title: "Feedback/Progress",
    tags: ["autodocs"],
    argTypes: {
        mode: {
            control: "select",
            options: ["bar", "ring", "pie"],
            description:
                "Presentation: horizontal bar, circular ring, or filled pie sector.",
            table: { defaultValue: { summary: "bar" } },
        },
        value: {
            control: { type: "range", min: 0, max: 100, step: 1 },
            description:
                "Current progress value (single-value API; ignored when `values` is set).",
        },
        min: {
            control: "number",
            description: "Minimum value.",
            table: { defaultValue: { summary: "0" } },
        },
        max: {
            control: "number",
            description: "Maximum value.",
            table: { defaultValue: { summary: "100" } },
        },
        color: {
            control: "select",
            options: [
                "base",
                "primary",
                "secondary",
                "success",
                "warning",
                "error",
                "help",
            ],
            description: "Default color scheme.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Bar thickness or ring/pie diameter.",
            table: { defaultValue: { summary: "medium" } },
        },
        thickness: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Ring stroke width (ignored in bar/pie).",
            table: { defaultValue: { summary: "medium" } },
        },
        labelFormat: {
            control: "select",
            options: ["percent", "value", "fraction"],
            description: "Format of the value label.",
            table: { defaultValue: { summary: "percent" } },
        },
        labelDisplay: {
            control: "boolean",
            description: "Whether to show the value label.",
            table: { defaultValue: { summary: true } },
        },
        indeterminate: {
            control: "boolean",
            description: "Animated indeterminate state.",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            description: "Reduces opacity and disables interaction.",
            table: { defaultValue: { summary: false } },
        },
        startAngle: {
            control: { type: "number", min: -360, max: 360, step: 1 },
            description:
                "Starting angle in degrees for ring/pie (also where the sweep ends, since it's a full circle). Clock convention: `0` = 12 o'clock, `90` = 3 o'clock. Ignored in bar.",
            table: { defaultValue: { summary: 0 } },
        },
        direction: {
            control: "select",
            options: ["clockwise", "counterclockwise"],
            description: "Sweep direction for ring/pie. Ignored in bar.",
            table: { defaultValue: { summary: "clockwise" } },
        },
    },
    args: {
        mode: "bar",
        value: 60,
        min: 0,
        max: 100,
        color: "primary",
        size: "medium",
        thickness: "medium",
        labelFormat: "percent",
        labelDisplay: true,
        indeterminate: false,
        disabled: false,
        startAngle: 0,
        direction: "clockwise",
    },
    render: ({
        mode,
        value,
        min,
        max,
        color,
        size,
        thickness,
        labelFormat,
        labelDisplay,
        indeterminate,
        disabled,
        startAngle,
        direction,
    }) => `
        <y-progress
            mode="${mode}"
            value="${value}"
            min="${min}"
            max="${max}"
            color="${color}"
            size="${size}"
            thickness="${thickness}"
            label-format="${labelFormat}"
            label-display="${labelDisplay}"
            start-angle="${startAngle}"
            direction="${direction}"
            ${indeterminate ? "indeterminate" : ""}
            ${disabled ? "disabled" : ""}
        ></y-progress>
    `,
};

export const Default = {};

export const Indeterminate = {
    args: { indeterminate: true, value: 0 },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <y-progress value="60" color="primary"></y-progress>
            <y-progress value="60" color="secondary"></y-progress>
            <y-progress value="60" color="success"></y-progress>
            <y-progress value="60" color="warning"></y-progress>
            <y-progress value="60" color="error"></y-progress>
            <y-progress value="60" color="help"></y-progress>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <y-progress value="60" size="small"></y-progress>
            <y-progress value="60" size="medium"></y-progress>
            <y-progress value="60" size="large"></y-progress>
        </div>
    `,
};

export const LabelFormats = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <y-progress value="60" label-format="percent"></y-progress>
            <y-progress value="60" label-format="value"></y-progress>
            <y-progress value="60" label-format="fraction"></y-progress>
        </div>
    `,
};

export const WithHeaderLabel = {
    render: () => `
        <y-progress value="75" color="success">Upload progress</y-progress>
    `,
};

export const Disabled = {
    args: { disabled: true, value: 40 },
};

// ── Stacked bar (multi-value) ─────────────────────────────
export const StackedBar = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px;width:480px">
            <span>Daily goals</span>
            <y-progress
                values='[
                    {"value":80,"color":"primary","label":"Steps"},
                    {"value":55,"color":"success","label":"Exercise"},
                    {"value":30,"color":"warning","label":"Stand"}
                ]'
                size="medium"
                label-display="false"
            ></y-progress>
        </div>
    `,
    parameters: {
        docs: {
            description: {
                story: "Pass a `values` array with 2+ entries and the bar stacks each entry as its own full-width row, separated by `segment-gap`. Outer rounding only applies to the top and bottom rows so the group reads as a single bordered group.",
            },
        },
    },
};

// ── Segmented bar ────────────────────────────────────────
export const SegmentedBar = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:480px">
            <y-progress value="40" segmented="30" label-display="false"></y-progress>
            <y-progress value="73" segmented="10" color="success" label-display="false"></y-progress>
            <y-progress value="40" step="20" segmented label-display="false"></y-progress>
        </div>
    `,
};

// ── Ring mode ────────────────────────────────────────────
export const Ring = {
    args: { mode: "ring", value: 65 },
};

export const RingThickness = {
    render: () => `
        <div style="display:flex;gap:24px;align-items:center">
            <y-progress mode="ring" value="65" thickness="small"></y-progress>
            <y-progress mode="ring" value="65" thickness="medium"></y-progress>
            <y-progress mode="ring" value="65" thickness="large"></y-progress>
        </div>
    `,
};

export const ConcentricRings = {
    render: () => `
        <y-progress
            mode="ring"
            size="160px"
            thickness="medium"
            values='[
                {"value":80,"color":"primary","label":"Steps"},
                {"value":55,"color":"success","label":"Exercise"},
                {"value":30,"color":"warning","label":"Stand"}
            ]'
        ></y-progress>
    `,
    parameters: {
        docs: {
            description: {
                story: 'When `mode="ring"` has 2+ values, each entry renders as a concentric arc — outermost first.',
            },
        },
    },
};

export const SegmentedRing = {
    args: { mode: "ring", value: 60 },
    render: ({ mode, value }) => `
        <y-progress mode="${mode}" value="${value}" segmented="12" size="120px"></y-progress>
    `,
};

export const RingCustomCenter = {
    render: () => `
        <y-progress mode="ring" value="78" color="success" size="140px">
            <span slot="center" style="text-align:center">
                <strong style="font-size:1.5em">78</strong>
                <div style="font-size:0.75em;opacity:0.7">of 100</div>
            </span>
        </y-progress>
    `,
};

export const RingIndeterminate = {
    args: { mode: "ring", indeterminate: true, value: 0 },
};

// ── Pie mode ─────────────────────────────────────────────
export const Pie = {
    args: { mode: "pie", value: 65 },
};

export const PieMultiSlice = {
    render: () => `
        <y-progress
            mode="pie"
            size="140px"
            values='[
                {"value":40,"color":"primary"},
                {"value":25,"color":"success"},
                {"value":15,"color":"warning"},
                {"value":10,"color":"error"}
            ]'
            label-display="false"
        ></y-progress>
    `,
    parameters: {
        docs: {
            description: {
                story: "Multi-value `pie` renders each entry as a slice swept back-to-back from `start-angle`.",
            },
        },
    },
};

export const PieIndeterminate = {
    args: { mode: "pie", indeterminate: true, value: 0 },
};
