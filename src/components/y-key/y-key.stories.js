import "./y-key.js";

export default {
    title: "Data/Key",
    tags: ["autodocs"],
    argTypes: {
        keys: {
            control: "text",
            description:
                "`+`-joined chord string, e.g. `mod+shift+k`. When set, the default slot is hidden.",
        },
        platform: {
            control: "select",
            options: ["auto", "mac", "windows", "linux"],
            description:
                "Platform used to resolve `mod` and to drive `notation=\"auto\"`.",
            table: { defaultValue: { summary: "auto" } },
        },
        notation: {
            control: "select",
            options: ["auto", "symbol", "text"],
            description:
                "Legend style: symbols on macOS and words elsewhere when `auto`.",
            table: { defaultValue: { summary: "auto" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Cap height and font size.",
            table: { defaultValue: { summary: "medium" } },
        },
        variant: {
            control: "select",
            options: ["outlined", "filled", "flat"],
            description: "Visual style variant.",
            table: { defaultValue: { summary: "outlined" } },
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
            description: "Color theme for the caps.",
            table: { defaultValue: { summary: "base" } },
        },
        separator: {
            control: "text",
            description: "Glyph drawn between caps, e.g. `+`.",
            table: { defaultValue: { summary: "" } },
        },
        combined: {
            control: "boolean",
            description: "Draw the whole chord inside a single cap.",
            table: { defaultValue: { summary: false } },
        },
        pressed: {
            control: "boolean",
            description: "Depressed visual state. Presentational only.",
            table: { defaultValue: { summary: false } },
        },
        label: {
            control: "text",
            description: "Overrides the computed accessible name.",
        },
    },
    args: {
        keys: "mod+shift+k",
        platform: "auto",
        notation: "auto",
        size: "medium",
        variant: "outlined",
        color: "base",
        separator: "",
        combined: false,
        pressed: false,
        label: "",
    },
    render: ({
        keys,
        platform,
        notation,
        size,
        variant,
        color,
        separator,
        combined,
        pressed,
        label,
    }) => `
        <y-key
            keys="${keys}"
            platform="${platform}"
            notation="${notation}"
            size="${size}"
            variant="${variant}"
            color="${color}"
            separator="${separator}"
            ${combined ? "combined" : ""}
            ${pressed ? "pressed" : ""}
            ${label ? `label="${label}"` : ""}
        ></y-key>
    `,
};

export const Default = {};

export const Platforms = {
    render: () => `
        <div style="display:grid;grid-template-columns:auto auto;gap:10px 24px;align-items:center">
            <span>macOS</span>
            <span style="display:flex;gap:12px;align-items:center">
                <y-key platform="mac" keys="mod+k"></y-key>
                <y-key platform="mac" keys="mod+shift+z"></y-key>
                <y-key platform="mac" keys="alt+enter"></y-key>
                <y-key platform="mac" keys="esc"></y-key>
            </span>
            <span>Windows / Linux</span>
            <span style="display:flex;gap:12px;align-items:center">
                <y-key platform="windows" keys="mod+k"></y-key>
                <y-key platform="windows" keys="mod+shift+z"></y-key>
                <y-key platform="windows" keys="alt+enter"></y-key>
                <y-key platform="windows" keys="esc"></y-key>
            </span>
        </div>
    `,
};

export const Notation = {
    render: () => `
        <div style="display:grid;grid-template-columns:auto auto;gap:10px 24px;align-items:center">
            <code>notation="symbol"</code>
            <y-key platform="mac" notation="symbol" keys="mod+alt+delete"></y-key>
            <code>notation="text"</code>
            <y-key platform="mac" notation="text" keys="mod+alt+delete"></y-key>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;gap:16px;align-items:center">
            <y-key size="small" keys="mod+k"></y-key>
            <y-key size="medium" keys="mod+k"></y-key>
            <y-key size="large" keys="mod+k"></y-key>
        </div>
    `,
};

export const Variants = {
    render: () => `
        <div style="display:flex;gap:16px;align-items:center">
            <y-key variant="outlined" keys="mod+k"></y-key>
            <y-key variant="filled" keys="mod+k"></y-key>
            <y-key variant="flat" keys="mod+k"></y-key>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <y-key color="base" keys="mod+k"></y-key>
            <y-key color="primary" keys="mod+k"></y-key>
            <y-key color="secondary" keys="mod+k"></y-key>
            <y-key color="success" keys="mod+k"></y-key>
            <y-key color="warning" keys="mod+k"></y-key>
            <y-key color="error" keys="mod+k"></y-key>
            <y-key color="help" keys="mod+k"></y-key>
        </div>
    `,
};

export const Separator = {
    render: () => `
        <div style="display:flex;gap:20px;align-items:center">
            <y-key keys="mod+shift+v"></y-key>
            <y-key keys="mod+shift+v" separator="+"></y-key>
            <y-key keys="mod+shift+v" combined></y-key>
        </div>
    `,
};

export const Pressed = {
    render: () => `
        <div style="display:flex;gap:16px;align-items:center">
            <y-key keys="shift"></y-key>
            <y-key keys="shift" pressed></y-key>
            <y-key variant="filled" color="primary" keys="shift" pressed></y-key>
        </div>
    `,
};

export const SlotContent = {
    name: "Slot content",
    render: () => `
        <div style="display:flex;gap:16px;align-items:center">
            <y-key>F1</y-key>
            <y-key>Fn</y-key>
            <y-key size="large">Any key</y-key>
        </div>
    `,
};

export const InParagraph = {
    name: "Inline in text",
    render: () => `
        <p style="max-width:52ch;line-height:1.7">
            Press <y-key keys="mod+k"></y-key> to open search, then
            <y-key size="small" variant="flat" keys="up"></y-key>
            <y-key size="small" variant="flat" keys="down"></y-key>
            to move through results and
            <y-key size="small" variant="flat" keys="enter"></y-key>
            to open one. <y-key size="small" variant="flat" keys="esc"></y-key>
            closes the dialog.
        </p>
    `,
};

export const ShortcutTable = {
    name: "Shortcut table",
    render: () => `
        <table style="border-collapse:collapse;font-size:14px">
            <tbody>
                <tr>
                    <td style="padding:6px 24px 6px 0">Bold</td>
                    <td><y-key keys="mod+b" separator="+"></y-key></td>
                </tr>
                <tr>
                    <td style="padding:6px 24px 6px 0">Italic</td>
                    <td><y-key keys="mod+i" separator="+"></y-key></td>
                </tr>
                <tr>
                    <td style="padding:6px 24px 6px 0">Strikethrough</td>
                    <td><y-key keys="mod+shift+x" separator="+"></y-key></td>
                </tr>
                <tr>
                    <td style="padding:6px 24px 6px 0">Redo</td>
                    <td><y-key keys="mod+shift+z" separator="+"></y-key></td>
                </tr>
            </tbody>
        </table>
    `,
};
