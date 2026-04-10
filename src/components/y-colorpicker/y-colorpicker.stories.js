import "./y-colorpicker.js";

export default {
    title: "Components/Colorpicker",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description: "Current color value in any supported format.",
        },
        format: {
            control: "select",
            options: ["hex", "rgb", "hsl", "hsv"],
            description: "Active color format for display and output.",
            table: { defaultValue: { summary: "hex" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Controls input/select sizes and picker proportions.",
            table: { defaultValue: { summary: "medium" } },
        },
        showAlpha: {
            control: "boolean",
            description: "Show the alpha slider and alpha channel inputs.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: "#0576ff",
        format: "hex",
        size: "medium",
        showAlpha: false,
    },
    render: ({ value, format, size, showAlpha }) => `
        <y-colorpicker
            value="${value}"
            format="${format}"
            size="${size}"
            ${showAlpha ? "show-alpha" : ""}
        ></y-colorpicker>
    `,
};

export const Default = {};

export const WithAlpha = {
    args: { showAlpha: true, value: "#0576ff80" },
};

export const RGBFormat = {
    args: { format: "rgb", value: "rgb(255, 87, 51)" },
};

export const HSLFormat = {
    args: { format: "hsl", value: "hsl(210, 100%, 50%)" },
};

export const HSVFormat = {
    args: { format: "hsv", value: "hsv(120, 80%, 90%)" },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
            <div>
                <p style="margin:0 0 8px;font-size:0.85em;opacity:0.7">Small</p>
                <y-colorpicker value="#ff5733" size="small"></y-colorpicker>
            </div>
            <div>
                <p style="margin:0 0 8px;font-size:0.85em;opacity:0.7">Medium</p>
                <y-colorpicker value="#33ff57" size="medium"></y-colorpicker>
            </div>
            <div>
                <p style="margin:0 0 8px;font-size:0.85em;opacity:0.7">Large</p>
                <y-colorpicker value="#3357ff" size="large"></y-colorpicker>
            </div>
        </div>
    `,
};

export const LimitedFormats = {
    render: () => `
        <y-colorpicker
            value="#e91e63"
            formats='["hex","rgb"]'
        ></y-colorpicker>
    `,
};

export const WithAlphaAllFormats = {
    render: () => `
        <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
            <div>
                <p style="margin:0 0 8px;font-size:0.85em;opacity:0.7">HEX + Alpha</p>
                <y-colorpicker value="#ff573380" format="hex" show-alpha></y-colorpicker>
            </div>
            <div>
                <p style="margin:0 0 8px;font-size:0.85em;opacity:0.7">RGB + Alpha</p>
                <y-colorpicker value="rgba(51, 255, 87, 0.75)" format="rgb" show-alpha></y-colorpicker>
            </div>
            <div>
                <p style="margin:0 0 8px;font-size:0.85em;opacity:0.7">HSL + Alpha</p>
                <y-colorpicker value="hsla(210, 100%, 50%, 0.6)" format="hsl" show-alpha></y-colorpicker>
            </div>
        </div>
    `,
};
