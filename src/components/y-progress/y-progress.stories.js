import "./y-progress.js";

export default {
    title: "Components/Progress",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: { type: "range", min: 0, max: 100, step: 1 },
            description: "Current progress value.",
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
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the progress bar.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Bar thickness.",
            table: { defaultValue: { summary: "medium" } },
        },
        labelFormat: {
            control: "select",
            options: ["percent", "value", "fraction"],
            description: "Format of the value label shown on the bar.",
            table: { defaultValue: { summary: "percent" } },
        },
        labelDisplay: {
            control: "boolean",
            description: "Whether to show the value label on the bar.",
            table: { defaultValue: { summary: true } },
        },
        indeterminate: {
            control: "boolean",
            description: "Shows an animated indeterminate state.",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            description: "Reduces opacity and disables interaction.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: 60,
        min: 0,
        max: 100,
        color: "primary",
        size: "medium",
        labelFormat: "percent",
        labelDisplay: true,
        indeterminate: false,
        disabled: false,
    },
    render: ({ value, min, max, color, size, labelFormat, labelDisplay, indeterminate, disabled }) => `
        <y-progress
            value="${value}"
            min="${min}"
            max="${max}"
            color="${color}"
            size="${size}"
            label-format="${labelFormat}"
            label-display="${labelDisplay}"
            ${indeterminate ? "indeterminate" : ""}
            ${disabled ? "disabled" : ""}
        ></y-progress>
    `,
};

export const Default = {};

export const Indeterminate = {
    args: { indeterminate: true, value: 0 },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <y-progress value="60" color="primary"></y-progress>
            <y-progress value="60" color="secondary"></y-progress>
            <y-progress value="60" color="success"></y-progress>
            <y-progress value="60" color="warning"></y-progress>
            <y-progress value="60" color="error"></y-progress>
            <y-progress value="60" color="help"></y-progress>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <y-progress value="60" size="small"></y-progress>
            <y-progress value="60" size="medium"></y-progress>
            <y-progress value="60" size="large"></y-progress>
        </div>
    `,
};

export const LabelFormats = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <y-progress value="60" label-format="percent"></y-progress>
            <y-progress value="60" label-format="value"></y-progress>
            <y-progress value="60" label-format="fraction"></y-progress>
        </div>
    `,
};

export const WithLabel = {
    render: () => `
        <y-progress value="75" color="success">
            <span slot="">Upload progress</span>
        </y-progress>
    `,
};

export const Disabled = {
    args: { disabled: true, value: 40 },
};
