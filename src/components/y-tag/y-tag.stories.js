import "./y-tag.js";

export default {
    title: "Data/Tag",
    tags: ["autodocs"],
    argTypes: {
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the tag.",
            table: { defaultValue: { summary: "base" } },
        },
        styleType: {
            control: "select",
            options: ["filled", "outlined", "flat"],
            description: "Visual style variant.",
            table: { defaultValue: { summary: "filled" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Size of the tag.",
            table: { defaultValue: { summary: "medium" } },
        },
        shape: {
            control: "select",
            options: ["square", "round"],
            description: "Border radius shape.",
            table: { defaultValue: { summary: "square" } },
        },
        removable: {
            control: "boolean",
            description: "Whether to show a remove button.",
            table: { defaultValue: { summary: false } },
        },
        label: {
            control: "text",
            description: "Tag label text.",
        },
    },
    args: {
        color: "primary",
        styleType: "filled",
        size: "medium",
        shape: "square",
        removable: false,
        label: "Tag",
    },
    render: ({ color, styleType, size, shape, removable, label }) => `
        <y-tag
            color="${color}"
            style-type="${styleType}"
            size="${size}"
            shape="${shape}"
            ${removable ? "removable" : ""}
        >${label}</y-tag>
    `,
};

export const Default = {};

export const Removable = {
    args: { removable: true, label: "Removable" },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-tag color="base">Base</y-tag>
            <y-tag color="primary">Primary</y-tag>
            <y-tag color="secondary">Secondary</y-tag>
            <y-tag color="success">Success</y-tag>
            <y-tag color="warning">Warning</y-tag>
            <y-tag color="error">Error</y-tag>
            <y-tag color="help">Help</y-tag>
        </div>
    `,
};

export const StyleTypes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
                <y-tag color="primary" style-type="filled">Filled</y-tag>
                <y-tag color="primary" style-type="outlined">Outlined</y-tag>
                <y-tag color="primary" style-type="flat">Flat</y-tag>
            </div>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-tag color="primary" size="small">Small</y-tag>
            <y-tag color="primary" size="medium">Medium</y-tag>
            <y-tag color="primary" size="large">Large</y-tag>
        </div>
    `,
};

export const Shapes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
            <y-tag color="primary" shape="square">Square</y-tag>
            <y-tag color="primary" shape="round">Round</y-tag>
        </div>
    `,
};
