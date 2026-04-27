import "./y-stack.js";
import "../y-button/y-button.js";
import "../y-input/y-input.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const GAP_OPTIONS = [
    "none",
    "x-small",
    "small",
    "medium",
    "large",
    "x-large",
    "2x-large",
    "4x-large",
];

export default {
    title: "Components/Stack",
    tags: ["autodocs"],
    argTypes: {
        direction: {
            control: "select",
            options: ["row", "row-reverse", "column", "column-reverse"],
            description: "Main axis direction; maps to `flex-direction`.",
            table: { defaultValue: { summary: "row" } },
        },
        wrap: {
            control: "select",
            options: ["nowrap", "wrap", "wrap-reverse"],
            description: "Maps to `flex-wrap`.",
            table: { defaultValue: { summary: "nowrap" } },
        },
        gap: {
            control: "select",
            options: GAP_OPTIONS,
            description: "Gap between items, maps to `--spacing-*` tokens.",
            table: { defaultValue: { summary: "medium" } },
        },
        rowGap: {
            name: "row-gap",
            control: "select",
            options: ["", ...GAP_OPTIONS],
            description: "Row gap override; falls back to `gap` when unset.",
        },
        columnGap: {
            name: "column-gap",
            control: "select",
            options: ["", ...GAP_OPTIONS],
            description: "Column gap override; falls back to `gap` when unset.",
        },
        align: {
            control: "select",
            options: ["start", "center", "end", "stretch", "baseline"],
            description: "Cross-axis alignment; maps to `align-items`.",
            table: { defaultValue: { summary: "stretch" } },
        },
        justify: {
            control: "select",
            options: ["start", "center", "end", "between", "around", "evenly"],
            description: "Main-axis distribution; maps to `justify-content`.",
            table: { defaultValue: { summary: "start" } },
        },
        alignContent: {
            name: "align-content",
            control: "select",
            options: [
                "start",
                "center",
                "end",
                "stretch",
                "between",
                "around",
                "evenly",
            ],
            description:
                "Cross-axis distribution between wrapped lines; maps to `align-content`.",
            table: { defaultValue: { summary: "stretch" } },
        },
        inline: {
            control: "boolean",
            description: "Use `display: inline-flex` instead of `flex`.",
            table: { defaultValue: { summary: false } },
        },
        responsive: {
            control: "boolean",
            description:
                'On `direction="row"`, auto-enable wrap and collapse to `column` below the mobile breakpoint.',
            table: { defaultValue: { summary: true } },
        },
    },
    args: {
        direction: "row",
        wrap: "nowrap",
        gap: "medium",
        rowGap: "",
        columnGap: "",
        align: "stretch",
        justify: "start",
        alignContent: "stretch",
        inline: false,
        responsive: true,
    },
    render: ({
        direction,
        wrap,
        gap,
        rowGap,
        columnGap,
        align,
        justify,
        alignContent,
        inline,
        responsive,
    }) => `
        <y-stack
            direction="${direction}"
            ${wrap !== "nowrap" ? `wrap="${wrap}"` : ""}
            gap="${gap}"
            ${rowGap ? `row-gap="${rowGap}"` : ""}
            ${columnGap ? `column-gap="${columnGap}"` : ""}
            align="${align}"
            justify="${justify}"
            align-content="${alignContent}"
            ${inline ? "inline" : ""}
            ${responsive ? "" : 'responsive="false"'}
        >
            <y-button color="primary">One</y-button>
            <y-button color="secondary">Two</y-button>
            <y-button color="success">Three</y-button>
            <y-button color="warning">Four</y-button>
        </y-stack>
    `,
};

export const Default = {};

export const Row = {
    render: () => `
        <y-stack direction="row" gap="medium" responsive="false">
            <y-button color="primary">Save</y-button>
            <y-button color="base">Cancel</y-button>
        </y-stack>
    `,
};

export const Column = {
    render: () => `
        <y-stack direction="column" gap="medium" style="width:300px">
            <y-input label="Name" placeholder="Enter your name"></y-input>
            <y-input label="Email" placeholder="Enter your email"></y-input>
            <y-button color="primary" style-type="filled">Submit</y-button>
        </y-stack>
    `,
};

export const RowReverse = {
    name: "Row Reverse",
    render: () => `
        <y-stack direction="row-reverse" gap="medium" responsive="false">
            <y-button color="primary">First in DOM</y-button>
            <y-button color="secondary">Second</y-button>
            <y-button color="success">Third</y-button>
        </y-stack>
    `,
};

export const Inline = {
    render: () => `
        <p style="margin:0">
            Stacked actions inline with text →
            <y-stack inline gap="x-small" align="center" responsive="false">
                <y-button color="primary" size="small">Approve</y-button>
                <y-button color="base" size="small">Skip</y-button>
            </y-stack>
            ← back to flowing text.
        </p>
    `,
};

export const RowWithJustify = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            ${["start", "center", "end", "between", "around", "evenly"]
                .map(
                    (j) => `
                <div>
                    <p style="margin:0 0 8px"><strong>justify="${j}"</strong></p>
                    <y-stack direction="row" justify="${j}" gap="medium" responsive="false">
                        <y-button color="primary">A</y-button>
                        <y-button color="primary">B</y-button>
                        <y-button color="primary">C</y-button>
                    </y-stack>
                </div>
            `,
                )
                .join("")}
        </div>
    `,
};

export const AlignmentVariants = {
    name: "Align Items",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            ${["start", "center", "end", "baseline", "stretch"]
                .map(
                    (a) => `
                <div>
                    <p style="margin:0 0 8px"><strong>align="${a}"</strong></p>
                    <y-stack direction="row" align="${a}" gap="medium" responsive="false" style="height:80px;background:#f5f5f5;padding:8px">
                        <y-button color="primary" size="small">Small</y-button>
                        <y-button color="primary" size="medium">Medium</y-button>
                        <y-button color="primary" size="large">Large</y-button>
                    </y-stack>
                </div>
            `,
                )
                .join("")}
        </div>
    `,
};

export const GapSizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            ${GAP_OPTIONS.map(
                (g) => `
                <div>
                    <p style="margin:0 0 8px"><strong>gap="${g}"</strong></p>
                    <y-stack direction="row" gap="${g}" responsive="false">
                        <y-button color="primary" size="small">A</y-button>
                        <y-button color="primary" size="small">B</y-button>
                        <y-button color="primary" size="small">C</y-button>
                    </y-stack>
                </div>
            `,
            ).join("")}
        </div>
    `,
};

export const SeparateRowAndColumnGaps = {
    name: "Row + Column Gap",
    render: () => `
        <y-stack direction="row" wrap row-gap="x-small" column-gap="2x-large" responsive="false"style="width:400px">
            <y-button color="primary">One</y-button>
            <y-button color="secondary">Two</y-button>
            <y-button color="success">Three</y-button>
            <y-button color="warning">Four</y-button>
            <y-button color="error">Five</y-button>
            <y-button color="help">Six</y-button>
        </y-stack>
    `,
};

export const WrapVariants = {
    name: "Wrap",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            ${["nowrap", "wrap", "wrap-reverse"]
                .map(
                    (w) => `
                <div>
                    <p style="margin:0 0 8px"><strong>wrap="${w}"</strong></p>
                    <y-stack direction="row" wrap="${w}" gap="medium" responsive="false" style="width:300px;background:#f5f5f5;padding:8px">
                        <y-button color="primary">One</y-button>
                        <y-button color="secondary">Two</y-button>
                        <y-button color="success">Three</y-button>
                        <y-button color="warning">Four</y-button>
                        <y-button color="error">Five</y-button>
                    </y-stack>
                </div>
            `,
                )
                .join("")}
        </div>
    `,
};

export const ResponsiveCollapse = {
    name: "Responsive (Row → Column)",
    render: () => `
        <p style="margin:0 0 8px;color:#666">
            Resize the stack's container — below the mobile breakpoint (576px by
            default) the row collapses to a column.
        </p>
        <y-stack direction="row" gap="medium" responsive style="resize:horizontal;overflow:auto;border:1px dashed #ccc;padding:8px;width:800px">
            <y-button color="primary">One</y-button>
            <y-button color="secondary">Two</y-button>
            <y-button color="success">Three</y-button>
        </y-stack>
    `,
};
