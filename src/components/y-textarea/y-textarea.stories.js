import "./y-textarea.js";

export default {
    title: "Input/Textarea",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description: "Current textarea value.",
        },
        rows: {
            control: "number",
            description: "Number of visible text rows.",
            table: { defaultValue: { summary: "3" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Textarea size.",
            table: { defaultValue: { summary: "medium" } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "bottom"],
            description: "Position of the label relative to the textarea.",
            table: { defaultValue: { summary: "top" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the textarea is disabled.",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            description: "Whether the textarea is in an invalid state.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: "",
        rows: 3,
        size: "medium",
        labelPosition: "top",
        disabled: false,
        invalid: false,
    },
    render: ({ value, rows, size, labelPosition, disabled, invalid }) => `
        <y-textarea
            size="${size}"
            rows="${rows}"
            label-position="${labelPosition}"
            ${value ? `value="${value}"` : ""}
            ${disabled ? "disabled" : ""}
            ${invalid ? "invalid" : ""}
            style="width:300px"
        >
            <span slot="label">Label</span>
        </y-textarea>
    `,
};

export const Default = {};

export const Underline = {
    name: "Underline variant",
    render: () =>
        `<y-textarea variant="underline" label="Message" rows="3" style="max-width:320px"></y-textarea>`,
};

export const WithValue = {
    args: { value: "This is some textarea content." },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-textarea size="small">
                <span slot="label">Small</span>
            </y-textarea>
            <y-textarea size="medium">
                <span slot="label">Medium</span>
            </y-textarea>
            <y-textarea size="large">
                <span slot="label">Large</span>
            </y-textarea>
        </div>
    `,
};

export const TallRows = {
    args: { rows: 8, value: "More rows for longer content." },
};

export const LabelBottom = {
    args: { labelPosition: "bottom", value: "Some value" },
};

export const Invalid = {
    args: { invalid: true, value: "invalid content" },
};

export const Disabled = {
    args: { disabled: true, value: "Disabled content" },
};
