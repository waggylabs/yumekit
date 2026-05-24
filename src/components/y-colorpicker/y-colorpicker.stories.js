import "./y-colorpicker.js";

export default {
    title: "Data/Colorpicker",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "color",
            description: "Initial color value.",
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
            description: "Component size.",
            table: { defaultValue: { summary: "medium" } },
        },
        showAlpha: {
            control: "boolean",
            description: "Enable the alpha channel slider.",
            table: { defaultValue: { summary: "false" } },
        },
    },
};

export const Default = {
    render: () => `<y-colorpicker value="#e74c3c"></y-colorpicker>`,
};

export const WithAlpha = {
    render: () => `<y-colorpicker value="#9b59b6" show-alpha></y-colorpicker>`,
};

export const RGBFormat = {
    render: () =>
        `<y-colorpicker value="#3498db" format="rgb"></y-colorpicker>`,
};

export const HSLFormat = {
    render: () =>
        `<y-colorpicker value="#2ecc71" format="hsl"></y-colorpicker>`,
};

export const HSVFormat = {
    render: () =>
        `<y-colorpicker value="#e67e22" format="hsv"></y-colorpicker>`,
};

export const Sizes = {
    render: () => `
        <div style="display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;">
            <y-colorpicker value="#e67e22" size="small"></y-colorpicker>
            <y-colorpicker value="#e67e22" size="medium"></y-colorpicker>
            <y-colorpicker value="#e67e22" size="large"></y-colorpicker>
        </div>
    `,
};

export const LimitedFormats = {
    render: () =>
        `<y-colorpicker value="#1abc9c" formats='["hex","rgb"]'></y-colorpicker>`,
};

export const WithAlphaAllFormats = {
    render: () =>
        `<y-colorpicker value="#8e44ad" show-alpha formats='["hex","rgb","hsl","hsv"]'></y-colorpicker>`,
};
