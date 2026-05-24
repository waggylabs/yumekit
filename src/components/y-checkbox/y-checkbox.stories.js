import "./y-checkbox.js";

export default {
    title: "Input/Checkbox",
    tags: ["autodocs"],
    argTypes: {
        label: {
            control: "text",
            description: "Label text (default slot).",
        },
        checked: {
            control: "boolean",
            description: "Whether the checkbox is checked.",
            table: { defaultValue: { summary: false } },
        },
        indeterminate: {
            control: "boolean",
            description: "Whether the checkbox is in an indeterminate state.",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the checkbox is disabled.",
            table: { defaultValue: { summary: false } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "bottom", "left", "right"],
            description: "Position of the label relative to the checkbox.",
            table: { defaultValue: { summary: "right" } },
        },
    },
    args: {
        label: "Checkbox label",
        checked: false,
        indeterminate: false,
        disabled: false,
        labelPosition: "right",
    },
    render: ({ label, checked, indeterminate, disabled, labelPosition }) => `
        <y-checkbox
            ${checked ? "checked" : ""}
            ${indeterminate ? "indeterminate" : ""}
            ${disabled ? "disabled" : ""}
            label-position="${labelPosition}"
        >${label}</y-checkbox>
    `,
};

export const Default = {};

export const Checked = {
    args: { checked: true },
};

export const Indeterminate = {
    args: { indeterminate: true },
};

export const Disabled = {
    args: { disabled: true },
};

export const DisabledChecked = {
    args: { disabled: true, checked: true },
};

export const LabelPositions = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            <y-checkbox label-position="right" checked>Label right (default)</y-checkbox>
            <y-checkbox label-position="left" checked>Label left</y-checkbox>
            <y-checkbox label-position="top" checked>Label top</y-checkbox>
            <y-checkbox label-position="bottom" checked>Label bottom</y-checkbox>
        </div>
    `,
};
