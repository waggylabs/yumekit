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
        variant: {
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
        variant: "outlined",
        size: "medium",
        paddingMode: "auto",
        disabled: false,
        type: "button",
    },
    render: ({
        label,
        color,
        variant,
        size,
        paddingMode,
        disabled,
        type,
    }) => `
        <y-button
            color="${color}"
            variant="${variant}"
            size="${size}"
            padding-mode="${paddingMode}"
            type="${type}"
            ${disabled ? "disabled" : ""}
        >${label}</y-button>
    `,
};

export const Default = {};

export const Variants = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-button color="primary" variant="outlined">Outlined</y-button>
            <y-button color="primary" variant="filled">Filled</y-button>
            <y-button color="primary" variant="flat">Flat</y-button>
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
                <y-button color="#7c3aed" variant="outlined">Outlined #7c3aed</y-button>
                <y-button color="#7c3aed" variant="filled">Filled #7c3aed</y-button>
                <y-button color="#7c3aed" variant="flat">Flat #7c3aed</y-button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <y-button color="rgb(13 148 136)" variant="outlined">Outlined rgb()</y-button>
                <y-button color="rgb(13 148 136)" variant="filled">Filled rgb()</y-button>
                <y-button color="rgb(13 148 136)" variant="flat">Flat rgb()</y-button>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <y-button color="oklch(0.7 0.18 25)" variant="outlined">Outlined oklch()</y-button>
                <y-button color="oklch(0.7 0.18 25)" variant="filled">Filled oklch()</y-button>
                <y-button color="oklch(0.7 0.18 25)" variant="flat">Flat oklch()</y-button>
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
                <y-button color="primary" variant="filled">Auto (label)</y-button>
                <y-button color="primary" variant="filled">
                    <y-icon slot="left-icon" name="check" size="small"></y-icon>
                </y-button>
                <y-button color="primary" variant="filled" padding-mode="square">5</y-button>
                <y-button color="primary" variant="filled" padding-mode="wide">
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
            <y-button href="/docs" color="primary" variant="outlined">Internal Link</y-button>
            <y-button href="/docs" color="primary" variant="filled">Filled Link</y-button>
            <y-button href="/docs" color="primary" variant="flat">Flat Link</y-button>
            <y-button href="https://example.com" target="_blank" rel="noopener noreferrer" color="base" variant="outlined">
                External
                <y-icon slot="right-icon" name="arrow-right" size="small"></y-icon>
            </y-button>
            <y-button href="/restricted" color="primary" disabled>Disabled Link</y-button>
        </div>
    `,
};
