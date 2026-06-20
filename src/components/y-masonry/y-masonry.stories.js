import "./y-masonry.js";
import "../y-card/y-card.js";

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
    title: "Layout/Masonry",
    tags: ["autodocs"],
    argTypes: {
        columns: {
            control: { type: "number", min: 1, max: 6 },
            description: "Column count (default 3).",
            table: { defaultValue: { summary: "3" } },
        },
        gap: {
            control: "select",
            options: GAP_OPTIONS,
            description: "Gap between items, maps to --spacing-* tokens.",
            table: { defaultValue: { summary: "medium" } },
        },
        responsive: {
            control: "boolean",
            description:
                "Auto-reduce columns at narrow container widths via mobile/tablet breakpoint tokens.",
            table: { defaultValue: { summary: true } },
        },
    },
    args: {
        columns: 3,
        gap: "medium",
        responsive: true,
    },
    render: ({ columns, gap, responsive }) => `
        <y-masonry
            columns="${columns}"
            gap="${gap}"
            ${responsive ? "responsive" : 'responsive="false"'}
        >
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Carries extra content so the masonry layout has uneven column heights to demonstrate its shortest-column packing behavior.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>A moderate amount of content.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Another taller card so the layout shows visible variation across columns.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>More moderate content here.</p></y-card>
        </y-masonry>
    `,
};

export const Default = {};

export const TwoColumns = {
    render: () => `
        <y-masonry columns="2" gap="large">
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Extra content makes this one taller than the others so the masonry packing is visible.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>Moderate content.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Another taller card with extra content.</p></y-card>
        </y-masonry>
    `,
};

export const SplitGap = {
    name: "Split Row / Column Gap",
    render: () => `
        <y-masonry columns="3" row-gap="4x-large" column-gap="x-small" responsive="false">
            <y-card><p>Card 1</p></y-card>
            <y-card><p>Card 2 — extra content for height variation.</p></y-card>
            <y-card><p>Card 3</p></y-card>
            <y-card><p>Card 4 — also taller for visual interest.</p></y-card>
            <y-card><p>Card 5</p></y-card>
            <y-card><p>Card 6</p></y-card>
        </y-masonry>
    `,
};

export const Responsive = {
    render: () => `
        <p style="margin:0 0 8px;color:#666">
            Resize the browser to see columns drop at the tablet (≤768px) and
            mobile (≤576px) breakpoints.
        </p>
        <y-masonry columns="4" gap="large" responsive>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Carries extra content so masonry has uneven column heights.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>Moderate content.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Tall</strong></div><p>Another taller card.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
            <y-card><div slot="header"><strong>Medium</strong></div><p>More moderate content.</p></y-card>
            <y-card><div slot="header"><strong>Short</strong></div><p>Brief.</p></y-card>
        </y-masonry>
    `,
};
