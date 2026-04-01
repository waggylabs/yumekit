import "./y-select.js";
import "../y-tag/y-tag.js";

const defaultOptions = JSON.stringify([
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
    { value: "date", label: "Date" },
    { value: "elderberry", label: "Elderberry" },
]);

export default {
    title: "Components/Select",
    tags: ["autodocs"],
    decorators: [
        (story) =>
            `<div style="min-height: 260px; padding: 16px;">${story()}</div>`,
    ],
    argTypes: {
        options: {
            control: "text",
            description: "JSON array of `{ value, label, color? }` objects.",
        },
        value: {
            control: "text",
            description: "Selected value (comma-separated for multiple).",
        },
        placeholder: {
            control: "text",
            description: "Placeholder text shown when nothing is selected.",
            table: { defaultValue: { summary: "Select..." } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Select size.",
            table: { defaultValue: { summary: "medium" } },
        },
        multiple: {
            control: "boolean",
            description: "Whether multiple values can be selected.",
            table: { defaultValue: { summary: false } },
        },
        searchable: {
            control: "boolean",
            description: "Whether the dropdown options are filterable.",
            table: { defaultValue: { summary: false } },
        },
        clearable: {
            control: "boolean",
            description:
                "Whether a clear button is shown when a value is selected.",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the select is disabled.",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            description: "Whether the select is in an invalid state.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        options: defaultOptions,
        value: "",
        placeholder: "Select an option",
        size: "medium",
        multiple: false,
        searchable: false,
        clearable: false,
        disabled: false,
        invalid: false,
    },
    render: ({
        options,
        value,
        placeholder,
        size,
        multiple,
        searchable,
        clearable,
        disabled,
        invalid,
    }) => `
        <y-select
            options='${options}'
            ${value ? `value="${value}"` : ""}
            placeholder="${placeholder}"
            size="${size}"
            ${multiple ? "multiple" : ""}
            ${searchable ? "searchable" : ""}
            ${clearable ? "clearable" : ""}
            ${disabled ? "disabled" : ""}
            ${invalid ? "invalid" : ""}
            style="width:300px"
        >
            <span slot="label">Label</span>
        </y-select>
    `,
};

export const Default = {};

export const WithValue = {
    args: { value: "banana" },
};

export const Searchable = {
    args: { searchable: true },
};

export const Clearable = {
    args: { clearable: true, value: "cherry" },
};

export const Multiple = {
    args: { multiple: true, value: "apple,cherry" },
};

export const MultipleWithTags = {
    render: () => `
        <y-select
            options='${defaultOptions}'
            value="apple,cherry,date"
            multiple
            display-mode="tag"
            style="width:300px"
        >
            <span slot="label">Multi-select with tags</span>
        </y-select>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-select options='${defaultOptions}' size="small" placeholder="Small">
                <span slot="label">Small</span>
            </y-select>
            <y-select options='${defaultOptions}' size="medium" placeholder="Medium">
                <span slot="label">Medium</span>
            </y-select>
            <y-select options='${defaultOptions}' size="large" placeholder="Large">
                <span slot="label">Large</span>
            </y-select>
        </div>
    `,
};

export const ColoredOptions = {
    render: () => `
        <y-select
            options='${JSON.stringify([
                { value: "ok", label: "Success", color: "success" },
                { value: "warn", label: "Warning", color: "warning" },
                { value: "err", label: "Error", color: "error" },
                { value: "info", label: "Primary", color: "primary" },
                { value: "help", label: "Help", color: "help" },
            ])}'
            value="ok"
            style="width:300px"
        >
            <span slot="label">Semantic colors</span>
        </y-select>
    `,
};

export const Invalid = {
    args: { invalid: true },
};

export const Disabled = {
    args: { disabled: true, value: "banana" },
};
