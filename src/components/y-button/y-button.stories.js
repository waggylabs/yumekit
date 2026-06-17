import "./y-button.js";
import "../y-icon/y-icon.js";
import "../y-theme/y-theme.js";
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
            options: [
                "base",
                "primary",
                "secondary",
                "success",
                "warning",
                "error",
                "help",
            ],
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
        paddingMode: {
            control: "select",
            options: ["auto", "square", "wide"],
            description:
                "Whether inline padding collapses to the block value: auto (icon-only buttons), square (always), wide (never).",
            table: { defaultValue: { summary: "auto" } },
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
        paddingMode: "auto",
        disabled: false,
        type: "button",
    },
    render: ({
        label,
        color,
        styleType,
        size,
        paddingMode,
        disabled,
        type,
    }) => `
        <y-button
            color="${color}"
            style-type="${styleType}"
            size="${size}"
            padding-mode="${paddingMode}"
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

export const CustomColors = {
    name: "Custom Colors",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <y-button color="#7c3aed" style-type="outlined">Outlined #7c3aed</y-button>
                <y-button color="#7c3aed" style-type="filled">Filled #7c3aed</y-button>
                <y-button color="#7c3aed" style-type="flat">Flat #7c3aed</y-button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <y-button color="rgb(13 148 136)" style-type="outlined">Outlined rgb()</y-button>
                <y-button color="rgb(13 148 136)" style-type="filled">Filled rgb()</y-button>
                <y-button color="rgb(13 148 136)" style-type="flat">Flat rgb()</y-button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <y-button color="oklch(0.7 0.18 25)" style-type="outlined">Outlined oklch()</y-button>
                <y-button color="oklch(0.7 0.18 25)" style-type="filled">Filled oklch()</y-button>
                <y-button color="oklch(0.7 0.18 25)" style-type="flat">Flat oklch()</y-button>
            </div>
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

export const PaddingMode = {
    name: "Padding Mode",
    // Shown in a Material theme, where labeled buttons get wide inline padding,
    // so the square/wide distinction is visible.
    render: () => `
        <y-theme theme="material-blue-light" style="display:block">
            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;padding:12px">
                <y-button color="primary" style-type="filled">Auto (label)</y-button>
                <y-button color="primary" style-type="filled">
                    <y-icon slot="left-icon" name="check" size="small"></y-icon>
                </y-button>
                <y-button color="primary" style-type="filled" padding-mode="square">5</y-button>
                <y-button color="primary" style-type="filled" padding-mode="wide">
                    <y-icon slot="left-icon" name="check" size="small"></y-icon>
                    Wide icon
                </y-button>
            </div>
        </y-theme>
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
