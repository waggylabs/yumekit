import "./y-stack.js";
import "../y-card/y-card.js";
import "../y-button/y-button.js";
import "../y-input/y-input.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Components/Stack",
    tags: ["autodocs"],
    argTypes: {
        mode: {
            control: "select",
            options: ["flex", "grid", "masonry"],
            description: "Layout algorithm.",
            table: { defaultValue: { summary: "flex" } },
        },
        direction: {
            control: "select",
            options: ["row", "column"],
            description: "Main axis direction (flex mode only).",
            table: { defaultValue: { summary: "row" } },
        },
        gap: {
            control: "select",
            options: ["none", "x-small", "small", "medium", "large", "x-large", "2x-large", "4x-large"],
            description: "Gap between items, maps to --spacing-* tokens.",
            table: { defaultValue: { summary: "medium" } },
        },
        columns: {
            control: { type: "number", min: 1, max: 12 },
            description: "Number of columns (grid and masonry modes).",
            table: { defaultValue: { summary: 3 } },
        },
        wrap: {
            control: "boolean",
            description: "Allow items to wrap (flex mode only).",
            table: { defaultValue: { summary: false } },
        },
        align: {
            control: "select",
            options: ["start", "center", "end", "stretch", "baseline"],
            description: "Cross-axis alignment.",
            table: { defaultValue: { summary: "stretch" } },
        },
        justify: {
            control: "select",
            options: ["start", "center", "end", "between", "around", "evenly"],
            description: "Main-axis distribution (flex mode only).",
            table: { defaultValue: { summary: "start" } },
        },
        responsive: {
            control: "boolean",
            description: "Auto-reduce columns at narrow viewports.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        mode: "flex",
        direction: "row",
        gap: "medium",
        columns: 3,
        wrap: false,
        align: "stretch",
        justify: "start",
        responsive: false,
    },
    render: ({ mode, direction, gap, columns, wrap, align, justify, responsive }) => `
        <y-stack
            mode="${mode}"
            direction="${direction}"
            gap="${gap}"
            columns="${columns}"
            align="${align}"
            justify="${justify}"
            ${wrap ? "wrap" : ""}
            ${responsive ? "responsive" : ""}
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
        <y-stack direction="row" gap="medium">
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

export const RowWithJustify = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            <div>
                <p style="margin:0 0 8px"><strong>justify="start"</strong></p>
                <y-stack direction="row" justify="start" gap="medium">
                    <y-button color="primary">A</y-button>
                    <y-button color="primary">B</y-button>
                    <y-button color="primary">C</y-button>
                </y-stack>
            </div>
            <div>
                <p style="margin:0 0 8px"><strong>justify="center"</strong></p>
                <y-stack direction="row" justify="center" gap="medium">
                    <y-button color="primary">A</y-button>
                    <y-button color="primary">B</y-button>
                    <y-button color="primary">C</y-button>
                </y-stack>
            </div>
            <div>
                <p style="margin:0 0 8px"><strong>justify="end"</strong></p>
                <y-stack direction="row" justify="end" gap="medium">
                    <y-button color="primary">A</y-button>
                    <y-button color="primary">B</y-button>
                    <y-button color="primary">C</y-button>
                </y-stack>
            </div>
            <div>
                <p style="margin:0 0 8px"><strong>justify="between"</strong></p>
                <y-stack direction="row" justify="between" gap="medium">
                    <y-button color="primary">A</y-button>
                    <y-button color="primary">B</y-button>
                    <y-button color="primary">C</y-button>
                </y-stack>
            </div>
        </div>
    `,
};

export const GapSizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            ${["none", "x-small", "small", "medium", "large", "x-large", "2x-large", "4x-large"].map((g) => `
                <div>
                    <p style="margin:0 0 8px"><strong>gap="${g}"</strong></p>
                    <y-stack direction="row" gap="${g}">
                        <y-button color="primary" size="small">A</y-button>
                        <y-button color="primary" size="small">B</y-button>
                        <y-button color="primary" size="small">C</y-button>
                    </y-stack>
                </div>
            `).join("")}
        </div>
    `,
};

export const Grid = {
    render: () => `
        <y-stack mode="grid" columns="3" gap="large">
            <y-card><div slot="header"><strong>Card 1</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 2</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 3</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 4</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 5</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 6</strong></div><p>Content</p></y-card>
        </y-stack>
    `,
};

export const GridResponsive = {
    name: "Grid (Responsive)",
    render: () => `
        <p style="margin:0 0 8px;color:#666">Resize the browser to see columns collapse.</p>
        <y-stack mode="grid" columns="4" gap="large" responsive>
            <y-card><div slot="header"><strong>Card 1</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 2</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 3</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 4</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 5</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 6</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 7</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 8</strong></div><p>Content</p></y-card>
        </y-stack>
    `,
};

export const Masonry = {
    render: () => `
        <y-stack mode="masonry" columns="3" gap="large">
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief content.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>This card has more content to make it taller than the others, demonstrating masonry layout.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>Some content here.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Another tall card with extra content to show the shortest-column-first packing behavior of masonry layout.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>Moderate content.</p></y-card>
        </y-stack>
    `,
};

export const WrapMode = {
    name: "Flex Wrap",
    render: () => `
        <y-stack direction="row" gap="medium" wrap style="width:400px">
            <y-button color="primary">One</y-button>
            <y-button color="secondary">Two</y-button>
            <y-button color="success">Three</y-button>
            <y-button color="warning">Four</y-button>
            <y-button color="error">Five</y-button>
            <y-button color="help">Six</y-button>
            <y-button color="primary">Seven</y-button>
            <y-button color="secondary">Eight</y-button>
        </y-stack>
    `,
};

export const AlignCenter = {
    render: () => `
        <y-stack direction="row" align="center" gap="large">
            <y-button color="primary" size="small">Small</y-button>
            <y-button color="primary" size="medium">Medium</y-button>
            <y-button color="primary" size="large">Large</y-button>
        </y-stack>
    `,
};
