import "./y-radio.js";

const defaultOptions = JSON.stringify([
    { value: "option-1", label: "Option 1" },
    { value: "option-2", label: "Option 2" },
    { value: "option-3", label: "Option 3" },
]);

export default {
    title: "Components/Radio",
    tags: ["autodocs"],
    argTypes: {
        options: {
            control: "text",
            description: 'JSON array of `{ value, label }` objects.',
        },
        value: {
            control: "text",
            description: "The currently selected value.",
        },
        disabled: {
            control: "boolean",
            description: "Whether all radio options are disabled.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        options: defaultOptions,
        value: "option-1",
        disabled: false,
    },
    render: ({ options, value, disabled }) => `
        <y-radio
            options='${options}'
            value="${value}"
            ${disabled ? "disabled" : ""}
        ></y-radio>
    `,
};

export const Default = {};

export const NoSelection = {
    args: { value: "" },
};

export const Disabled = {
    args: { disabled: true, value: "option-1" },
};

export const ManyOptions = {
    render: () => `
        <y-radio
            options='${JSON.stringify([
                { value: "a", label: "Apple" },
                { value: "b", label: "Banana" },
                { value: "c", label: "Cherry" },
                { value: "d", label: "Date" },
                { value: "e", label: "Elderberry" },
            ])}'
            value="b"
        ></y-radio>
    `,
};
