import "./y-card.js";
import "../y-skeleton/y-skeleton.js";

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
            <p>A card with only a body slot — no header or footer.</p>
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

export const LoadingRecipe = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">
            <!-- Loading card: media block + title line + two body lines -->
            <y-card style="width:300px">
                <y-skeleton slot="image" variant="rect" height="160px"></y-skeleton>
                <y-skeleton variant="text" width="60%"></y-skeleton>
                <y-skeleton variant="text" lines="2"></y-skeleton>
            </y-card>

            <!-- Loading list rows: circle beside stacked text lines -->
            <y-card style="width:300px">
                ${[0, 1, 2]
                    .map(
                        () => `
                    <div style="display:flex;gap:12px;align-items:center;padding:8px 0">
                        <y-skeleton variant="circle" width="40px" height="40px"></y-skeleton>
                        <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                            <y-skeleton variant="text" width="40%"></y-skeleton>
                            <y-skeleton variant="text" width="70%"></y-skeleton>
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </y-card>
        </div>
    `,
    parameters: {
        docs: {
            description: {
                story: "`y-card` has no built-in `loading` attribute — it's a slot-based container with no fixed content shape. Compose the `y-skeleton` primitive instead: a media block, a title line, and two body lines for a card; a circle beside stacked text lines for a list row.",
            },
        },
    },
};
