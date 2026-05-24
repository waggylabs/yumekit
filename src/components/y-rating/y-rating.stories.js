import "./y-rating.js";
import "../../icons/all.js";

export default {
    title: "Input/Rating",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: { type: "range", min: 0, max: 10, step: 1 },
            description: "Current rating value.",
            table: { defaultValue: { summary: "0" } },
        },
        max: {
            control: { type: "range", min: 1, max: 10, step: 1 },
            description: "Number of icons to display.",
            table: { defaultValue: { summary: "5" } },
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the filled icons.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Icon size.",
            table: { defaultValue: { summary: "medium" } },
        },
        icon: {
            control: "select",
            options: ["star", "heart", "bookmark", "bell", "check"],
            description: "Registered icon name used for the rating.",
            table: { defaultValue: { summary: "star" } },
        },
        readonly: {
            control: "boolean",
            description: "Disables interaction while still displaying the value.",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            description: "Reduces opacity and disables interaction.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: 3,
        max: 5,
        color: "primary",
        size: "medium",
        icon: "star",
        readonly: false,
        disabled: false,
    },
    render: ({ value, max, color, size, icon, readonly, disabled }) => `
        <y-rating
            value="${value}"
            max="${max}"
            color="${color}"
            size="${size}"
            icon="${icon}"
            ${readonly ? "readonly" : ""}
            ${disabled ? "disabled" : ""}
        ></y-rating>
    `,
};

export const Default = {};

export const Readonly = {
    args: { value: 4, readonly: true },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-rating value="3" color="primary"></y-rating>
            <y-rating value="3" color="secondary"></y-rating>
            <y-rating value="3" color="success"></y-rating>
            <y-rating value="3" color="warning"></y-rating>
            <y-rating value="3" color="error"></y-rating>
            <y-rating value="3" color="help"></y-rating>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-rating value="3" size="small"></y-rating>
            <y-rating value="3" size="medium"></y-rating>
            <y-rating value="3" size="large"></y-rating>
        </div>
    `,
};

export const CustomIcons = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-rating value="3" icon="star" color="warning"></y-rating>
            <y-rating value="3" icon="heart" color="error"></y-rating>
            <y-rating value="3" icon="bookmark" color="primary"></y-rating>
        </div>
    `,
};

export const Disabled = {
    args: { value: 2, disabled: true },
};
