import "./y-card.js";

export default {
    title: "Layout/Card",
    tags: ["autodocs"],
    argTypes: {
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error"],
            description: "Color theme for the card surface.",
            table: { defaultValue: { summary: "base" } },
        },
        raised: {
            control: "boolean",
            description: "Whether the card uses a raised shadow instead of a border.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        color: "base",
        raised: false,
    },
    render: ({ color, raised }) => `
        <y-card color="${color}" ${raised ? "raised" : ""} style="width:300px">
            <div slot="header"><strong>Card Header</strong></div>
            <p>This is the main body content of the card.</p>
            <div slot="footer">Card Footer</div>
        </y-card>
    `,
};

export const Default = {};

export const Raised = {
    args: { raised: true },
};

export const WithImage = {
    render: () => `
        <y-card style="width:300px">
            <img slot="image" src="https://placehold.co/300x160" alt="Placeholder" style="width:100%;display:block" />
            <div slot="header"><strong>Card with Image</strong></div>
            <p>Body content below the image.</p>
        </y-card>
    `,
};

export const BodyOnly = {
    render: () => `
        <y-card style="width:300px">
            <p>A card with only a body slot â€” no header or footer.</p>
        </y-card>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px">
            <y-card color="base" style="width:200px">
                <div slot="header"><strong>Base</strong></div>
                <p>Base color card.</p>
            </y-card>
            <y-card color="primary" style="width:200px">
                <div slot="header"><strong>Primary</strong></div>
                <p>Primary color card.</p>
            </y-card>
            <y-card color="secondary" style="width:200px">
                <div slot="header"><strong>Secondary</strong></div>
                <p>Secondary color card.</p>
            </y-card>
            <y-card color="success" style="width:200px">
                <div slot="header"><strong>Success</strong></div>
                <p>Success color card.</p>
            </y-card>
            <y-card color="warning" style="width:200px">
                <div slot="header"><strong>Warning</strong></div>
                <p>Warning color card.</p>
            </y-card>
            <y-card color="error" style="width:200px">
                <div slot="header"><strong>Error</strong></div>
                <p>Error color card.</p>
            </y-card>
        </div>
    `,
};
