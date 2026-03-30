import "./y-slider.js";

export default {
    title: "Components/Slider",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: { type: "range", min: 0, max: 100, step: 1 },
            description: "Current slider value.",
            table: { defaultValue: { summary: "50" } },
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
        step: {
            control: "number",
            description: "Step increment. Leave empty for continuous.",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the track fill and thumb.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Track thickness.",
            table: { defaultValue: { summary: "medium" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the slider is disabled.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: 50,
        min: 0,
        max: 100,
        color: "primary",
        size: "medium",
        disabled: false,
    },
    render: ({ value, min, max, step, color, size, disabled }) => `
        <div style="width:300px">
            <y-slider
                value="${value}"
                min="${min}"
                max="${max}"
                ${step ? `step="${step}"` : ""}
                color="${color}"
                size="${size}"
                ${disabled ? "disabled" : ""}
            ></y-slider>
        </div>
    `,
};

export const Default = {};

export const WithStep = {
    args: { step: 10, value: 40 },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:300px">
            <y-slider value="60" color="primary"></y-slider>
            <y-slider value="60" color="secondary"></y-slider>
            <y-slider value="60" color="success"></y-slider>
            <y-slider value="60" color="warning"></y-slider>
            <y-slider value="60" color="error"></y-slider>
            <y-slider value="60" color="help"></y-slider>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;width:300px">
            <y-slider value="60" size="small"></y-slider>
            <y-slider value="60" size="medium"></y-slider>
            <y-slider value="60" size="large"></y-slider>
        </div>
    `,
};

export const Disabled = {
    args: { disabled: true, value: 40 },
};
