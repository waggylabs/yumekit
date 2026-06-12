import "./y-color.js";

export default {
    title: "Input/Color",
    tags: ["autodocs"],
    decorators: [
        (story) =>
            `<div style="min-height: 380px; padding: 16px;">${story()}</div>`,
    ],
    argTypes: {
        value: {
            control: "color",
            description: "Current color value.",
        },
        format: {
            control: "select",
            options: ["hex", "rgb", "hsl", "hsv"],
            description: "Active color format.",
            table: { defaultValue: { summary: "hex" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Trigger and picker size.",
            table: { defaultValue: { summary: "medium" } },
        },
        placeholder: {
            control: "text",
            description: "Placeholder text when no color is selected.",
            table: { defaultValue: { summary: "Select color" } },
        },
        showAlpha: {
            control: "boolean",
            description: "Enable the alpha channel slider and input.",
            table: { defaultValue: { summary: "false" } },
        },
        clearable: {
            control: "boolean",
            description: "Show a clear button when a value is set.",
            table: { defaultValue: { summary: "false" } },
        },
        disabled: {
            control: "boolean",
            description: "Disable the field.",
            table: { defaultValue: { summary: "false" } },
        },
        invalid: {
            control: "boolean",
            description: "Mark the field as invalid.",
            table: { defaultValue: { summary: "false" } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "bottom"],
            description: "Position of the label relative to the trigger.",
            table: { defaultValue: { summary: "top" } },
        },
    },
};

export const Default = {
    render: () => `
        <y-color value="#e74c3c">
            <span slot="label">Pick a color</span>
        </y-color>
    `,
};

export const Underline = {
    name: "Underline variant",
    render: () => `
        <y-color variant="underline" value="#2196f3" style="max-width:320px">
            <span slot="label">Brand color</span>
        </y-color>
    `,
};

export const WithAlpha = {
    render: () => `
        <y-color value="#9b59b680" show-alpha>
            <span slot="label">Color with alpha</span>
        </y-color>
    `,
};

export const Formats = {
    render: () => `
        <div style="display: flex; gap: 24px; flex-wrap: wrap;">
            <y-color value="#3498db" format="hex">
                <span slot="label">Hex</span>
            </y-color>
            <y-color value="#2ecc71" format="rgb">
                <span slot="label">RGB</span>
            </y-color>
            <y-color value="#e67e22" format="hsl">
                <span slot="label">HSL</span>
            </y-color>
            <y-color value="#8e44ad" format="hsv">
                <span slot="label">HSV</span>
            </y-color>
        </div>
    `,
};

export const Clearable = {
    render: () => `
        <y-color value="#1abc9c" clearable>
            <span slot="label">Clearable color</span>
        </y-color>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;">
            <y-color value="#e74c3c" size="small">
                <span slot="label">Small</span>
            </y-color>
            <y-color value="#e74c3c" size="medium">
                <span slot="label">Medium</span>
            </y-color>
            <y-color value="#e74c3c" size="large">
                <span slot="label">Large</span>
            </y-color>
        </div>
    `,
};

export const Disabled = {
    render: () => `
        <y-color value="#95a5a6" disabled>
            <span slot="label">Disabled</span>
        </y-color>
    `,
};

export const Invalid = {
    render: () => `
        <y-color value="#e74c3c" invalid>
            <span slot="label">Invalid state</span>
        </y-color>
    `,
};

export const LabelBottom = {
    render: () => `
        <y-color value="#3498db" label-position="bottom">
            <span slot="label">Label below trigger</span>
        </y-color>
    `,
};
