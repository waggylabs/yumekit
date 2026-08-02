import "./y-input.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Input/Input",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description: "Current input value.",
        },
        type: {
            control: "select",
            options: [
                "text",
                "password",
                "email",
                "number",
                "search",
                "url",
                "tel",
            ],
            description: "Native input type.",
            table: { defaultValue: { summary: "text" } },
        },
        placeholder: {
            control: "text",
            description: "Hint text shown when the input is empty.",
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Input size.",
            table: { defaultValue: { summary: "medium" } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "bottom"],
            description: "Position of the label relative to the input.",
            table: { defaultValue: { summary: "top" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the input is disabled.",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            description: "Whether the input is in an invalid state.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: "",
        type: "text",
        placeholder: "",
        size: "medium",
        labelPosition: "top",
        disabled: false,
        invalid: false,
    },
    render: ({
        value,
        type,
        placeholder,
        size,
        labelPosition,
        disabled,
        invalid,
        label,
    }) => `
        <y-input
            type="${type}"
            size="${size}"
            label-position="${labelPosition}"
            ${value ? `value="${value}"` : ""}
            ${placeholder ? `placeholder="${placeholder}"` : ""}
            ${disabled ? "disabled" : ""}
            ${invalid ? "invalid" : ""}
            style="width:300px"
        >
            ${label ? `<span slot="label">${label}</span>` : ""}
        </y-input>
    `,
};

export const Default = {};

export const Underline = {
    name: "Underline variant",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;max-width:320px">
            <y-input variant="underline" label="Name" placeholder="Jane Doe"></y-input>
            <y-input variant="underline" label="Email" type="email" invalid value="bad"></y-input>
        </div>
    `,
};

export const WithValue = {
    args: { value: "Hello world" },
};

export const Password = {
    args: { type: "password", value: "secret" },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-input size="small">
                <span slot="label">Small</span>
            </y-input>
            <y-input size="medium">
                <span slot="label">Medium</span>
            </y-input>
            <y-input size="large">
                <span slot="label">Large</span>
            </y-input>
        </div>
    `,
};

export const WithIcons = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-input>
                <y-icon slot="left-icon" name="magnifying-glass" size="small"></y-icon>
                <span slot="label">Search</span>
            </y-input>
            <y-input>
                <span slot="label">Email</span>
                <y-icon slot="right-icon" name="mail" size="small"></y-icon>
            </y-input>
        </div>
    `,
};

export const LabelBottom = {
    args: { labelPosition: "bottom", value: "Some value" },
};

export const Invalid = {
    args: { invalid: true, value: "bad input" },
};

export const Disabled = {
    args: { disabled: true, value: "Disabled value" },
};
