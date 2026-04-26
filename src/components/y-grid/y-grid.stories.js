import "./y-grid.js";
import "../y-card/y-card.js";
import "../y-button/y-button.js";

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
    title: "Components/Grid",
    tags: ["autodocs"],
    argTypes: {
        mode: {
            control: "select",
            options: ["grid", "masonry"],
            description: "Layout algorithm.",
            table: { defaultValue: { summary: "grid" } },
        },
        columns: {
            control: "text",
            description:
                'Column count, "auto", or a raw grid-template-columns value.',
            table: { defaultValue: { summary: "3" } },
        },
        gap: {
            control: "select",
            options: GAP_OPTIONS,
            description: "Gap between items, maps to --spacing-* tokens.",
            table: { defaultValue: { summary: "medium" } },
        },
        align: {
            control: "select",
            options: ["start", "center", "end", "stretch", "baseline"],
            description: "Maps to align-items.",
            table: { defaultValue: { summary: "stretch" } },
        },
        justify: {
            control: "select",
            options: ["start", "center", "end", "stretch"],
            description: "Maps to justify-items.",
            table: { defaultValue: { summary: "stretch" } },
        },
        responsive: {
            control: "boolean",
            description: "Auto-reduce columns at narrow container widths.",
            table: { defaultValue: { summary: true } },
        },
        dense: {
            control: "boolean",
            description:
                "Grid mode only. Shortcut for auto-flow=\"row dense\" — lets later items backfill earlier holes left by spanned items. Has no visible effect unless some items use grid-column: span. Ignored in masonry mode.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        mode: "grid",
        columns: "3",
        gap: "medium",
        align: "stretch",
        justify: "stretch",
        responsive: true,
        dense: false,
    },
    render: ({ mode, columns, gap, align, justify, responsive, dense }) => `
        <y-grid
            mode="${mode}"
            columns="${columns}"
            gap="${gap}"
            align="${align}"
            justify="${justify}"
            ${responsive ? "responsive" : 'responsive="false"'}
            ${dense ? "dense" : ""}
        >
            <y-card style="grid-column: span 2"><div slot="header"><strong>Wide</strong></div><p>Spans 2 columns — leaves a hole that <code>dense</code> can backfill in grid mode.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>This card carries extra content so masonry mode has uneven column heights to demonstrate its shortest-column packing.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>A moderate amount of content for variety.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Another taller card so the masonry layout has visible variation across columns.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
        </y-grid>
    `,
};

export const Default = {};

export const ThreeColumns = {
    render: () => `
        <y-grid columns="3" gap="large">
            <y-card><div slot="header"><strong>Card 1</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 2</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 3</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 4</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 5</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 6</strong></div><p>Content</p></y-card>
        </y-grid>
    `,
};

export const Responsive = {
    render: () => `
        <p style="margin:0 0 8px;color:#666">Resize the browser to see columns collapse.</p>
        <y-grid columns="4" gap="large" responsive>
            <y-card><div slot="header"><strong>Card 1</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 2</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 3</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 4</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 5</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 6</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 7</strong></div><p>Content</p></y-card>
            <y-card><div slot="header"><strong>Card 8</strong></div><p>Content</p></y-card>
        </y-grid>
    `,
};

export const AutoFit = {
    name: "Auto Fit (columns=\"auto\")",
    render: () => `
        <p style="margin:0 0 8px;color:#666">Items fill rows at min 200px each.</p>
        <y-grid columns="auto" min-item-width="200px" gap="medium">
            <y-card><p>One</p></y-card>
            <y-card><p>Two</p></y-card>
            <y-card><p>Three</p></y-card>
            <y-card><p>Four</p></y-card>
            <y-card><p>Five</p></y-card>
            <y-card><p>Six</p></y-card>
        </y-grid>
    `,
};

export const RawTemplate = {
    name: "Raw Template",
    render: () => `
        <y-grid columns="1fr 2fr 1fr" gap="medium">
            <y-card><p>1fr</p></y-card>
            <y-card><p>2fr</p></y-card>
            <y-card><p>1fr</p></y-card>
        </y-grid>
    `,
};

export const ItemSpans = {
    name: "Item Spans",
    render: () => `
        <y-grid columns="4" gap="medium" responsive="false">
            <y-card style="grid-column: span 2"><p>span 2</p></y-card>
            <y-card><p>1</p></y-card>
            <y-card><p>1</p></y-card>
            <y-card><p>1</p></y-card>
            <y-card style="grid-column: span 3"><p>span 3</p></y-card>
        </y-grid>
    `,
};

export const Dense = {
    render: () => `
        <p style="margin:0 0 8px;color:#666">Later items backfill earlier holes.</p>
        <y-grid columns="4" gap="medium" responsive="false" dense>
            <y-card style="grid-column: span 2"><p>span 2</p></y-card>
            <y-card><p>1</p></y-card>
            <y-card style="grid-column: span 2"><p>span 2</p></y-card>
            <y-card><p>1</p></y-card>
            <y-card><p>1</p></y-card>
            <y-card><p>1</p></y-card>
        </y-grid>
    `,
};

export const Masonry = {
    render: () => `
        <y-grid mode="masonry" columns="3" gap="large" responsive>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief content.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>This card has more content to make it taller than the others, demonstrating masonry layout.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>Some content here.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Another tall card with extra content to show the shortest-column-first packing behavior of masonry layout.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>Moderate content.</p></y-card>
        </y-grid>
    `,
};

export const GapSizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px">
            ${GAP_OPTIONS.map(
                (g) => `
                <div>
                    <p style="margin:0 0 8px"><strong>gap="${g}"</strong></p>
                    <y-grid columns="4" gap="${g}" responsive="false">
                        <y-button color="primary" size="small">A</y-button>
                        <y-button color="primary" size="small">B</y-button>
                        <y-button color="primary" size="small">C</y-button>
                        <y-button color="primary" size="small">D</y-button>
                    </y-grid>
                </div>
            `,
            ).join("")}
        </div>
    `,
};

export const SplitGap = {
    name: "Split Row / Column Gap",
    render: () => `
        <y-grid columns="3" row-gap="4x-large" column-gap="x-small" responsive="false">
            <y-card><p>Card 1</p></y-card>
            <y-card><p>Card 2</p></y-card>
            <y-card><p>Card 3</p></y-card>
            <y-card><p>Card 4</p></y-card>
            <y-card><p>Card 5</p></y-card>
            <y-card><p>Card 6</p></y-card>
        </y-grid>
    `,
};
