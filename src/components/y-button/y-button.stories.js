import "./y-button.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Input/Button",
    tags: ["autodocs"],
    argTypes: {
        label: {
            control: "text",
            description: "Button label text (default slot).",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the button.",
            table: { defaultValue: { summary: "base" } },
        },
        styleType: {
            control: "select",
            options: ["outlined", "filled", "flat"],
            description: "Visual style variant.",
            table: { defaultValue: { summary: "outlined" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Button size.",
            table: { defaultValue: { summary: "medium" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the button is disabled.",
            table: { defaultValue: { summary: false } },
        },
        type: {
            control: "select",
            options: ["button", "submit", "reset"],
            description: "Native button type.",
            table: { defaultValue: { summary: "button" } },
        },
    },
    args: {
        label: "Button",
        color: "primary",
        styleType: "outlined",
        size: "medium",
        disabled: false,
        type: "button",
    },
    render: ({ label, color, styleType, size, disabled, type }) => `
        <y-button
            color="${color}"
            style-type="${styleType}"
            size="${size}"
            type="${type}"
            ${disabled ? "disabled" : ""}
        >${label}</y-button>
    `,
};

export const Default = {};

export const StyleTypes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-button color="primary" style-type="outlined">Outlined</y-button>
            <y-button color="primary" style-type="filled">Filled</y-button>
            <y-button color="primary" style-type="flat">Flat</y-button>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-button color="base">Base</y-button>
            <y-button color="primary">Primary</y-button>
            <y-button color="secondary">Secondary</y-button>
            <y-button color="success">Success</y-button>
            <y-button color="warning">Warning</y-button>
            <y-button color="error">Error</y-button>
            <y-button color="help">Help</y-button>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-button color="primary" size="small">Small</y-button>
            <y-button color="primary" size="medium">Medium</y-button>
            <y-button color="primary" size="large">Large</y-button>
        </div>
    `,
};

export const WithIcons = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-button color="primary">
                <y-icon slot="left-icon" name="star" size="small"></y-icon>
                Left Icon
            </y-button>
            <y-button color="primary">
                Right Icon
                <y-icon slot="right-icon" name="arrow-right" size="small"></y-icon>
            </y-button>
            <y-button color="primary">
                <y-icon slot="left-icon" name="check" size="small"></y-icon>
            </y-button>
        </div>
    `,
};

export const Disabled = {
    args: { disabled: true },
};

export const AsLink = {
    name: "As Link (href)",
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-button href="/docs" color="primary" style-type="outlined">Internal Link</y-button>
            <y-button href="/docs" color="primary" style-type="filled">Filled Link</y-button>
            <y-button href="/docs" color="primary" style-type="flat">Flat Link</y-button>
            <y-button href="https://example.com" target="_blank" rel="noopener noreferrer" color="base" style-type="outlined">
                External
                <y-icon slot="right-icon" name="arrow-right" size="small"></y-icon>
            </y-button>
            <y-button href="/restricted" color="primary" disabled>Disabled Link</y-button>
        </div>
    `,
};
