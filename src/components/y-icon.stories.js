import "./y-icon.js";
import "../icons/all.js";

export default {
    title: "Components/Icon",
    tags: ["autodocs"],
    argTypes: {
        name: {
            control: "select",
            options: [
                "accessibility", "ai", "archive", "arrow-down", "arrow-left",
                "arrow-right", "arrow-up", "bell", "bolt", "bookmark",
                "briefcase", "calendar", "campfire", "chart", "check",
                "chevron-down", "chevron-left", "chevron-right", "chevron-up",
                "circle-exclamation", "circle-info", "circle-question",
                "clock", "close", "cloud", "code", "comments", "compass",
                "diagram", "discord", "down-from-bracket", "down-to-bracket",
                "ellipsis-h", "ellipsis-v", "expand-down", "expand-left",
                "expand-right", "expand-up", "face-frown", "face-neutral",
                "face-smile", "figma", "filter", "flask", "folder", "github",
                "globe", "grid", "heart", "home", "image", "layout",
                "left-from-bracket", "left-to-bracket", "link", "list-bullet",
                "list-check", "lock", "mail", "map-marker", "menu", "minus",
                "monitor", "moon", "palette", "paper-airplane", "pencil",
                "plus", "puzzle", "right-from-bracket", "right-to-bracket",
                "save", "search", "settings", "share", "shield", "smartphone",
                "stack", "star", "sun", "swap", "tablet", "tag", "thumbs-down",
                "thumbs-up", "thumbtack", "trash", "up-from-bracket",
                "up-to-bracket", "user", "users", "warning",
            ],
            description: "The registered icon name to display.",
        },
        size: {
            control: "select",
            options: ["x-small", "small", "medium", "large", "x-large"],
            description: "Icon size.",
            table: { defaultValue: { summary: "medium" } },
        },
        color: {
            control: "select",
            options: ["", "base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme. Leave empty to inherit.",
            table: { defaultValue: { summary: "" } },
        },
        weight: {
            control: "select",
            options: ["x-thin", "thin", "regular", "thick", "x-thick"],
            description: "Stroke weight.",
            table: { defaultValue: { summary: "regular" } },
        },
        label: {
            control: "text",
            description: "Accessible label. When set, adds role='img'.",
        },
    },
    args: {
        name: "star",
        size: "medium",
        color: "",
        weight: "regular",
        label: "",
    },
    render: ({ name, size, color, weight, label }) => `
        <y-icon
            name="${name}"
            size="${size}"
            ${color ? `color="${color}"` : ""}
            ${weight !== "regular" ? `weight="${weight}"` : ""}
            ${label ? `label="${label}"` : ""}
        ></y-icon>
    `,
};

export const Default = {};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            <y-icon name="star" size="x-small"></y-icon>
            <y-icon name="star" size="small"></y-icon>
            <y-icon name="star" size="medium"></y-icon>
            <y-icon name="star" size="large"></y-icon>
            <y-icon name="star" size="x-large"></y-icon>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            <y-icon name="star" color="base"></y-icon>
            <y-icon name="star" color="primary"></y-icon>
            <y-icon name="star" color="secondary"></y-icon>
            <y-icon name="star" color="success"></y-icon>
            <y-icon name="star" color="warning"></y-icon>
            <y-icon name="star" color="error"></y-icon>
            <y-icon name="star" color="help"></y-icon>
        </div>
    `,
};

export const Weights = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            <y-icon name="star" size="large" weight="x-thin"></y-icon>
            <y-icon name="star" size="large" weight="thin"></y-icon>
            <y-icon name="star" size="large" weight="regular"></y-icon>
            <y-icon name="star" size="large" weight="thick"></y-icon>
            <y-icon name="star" size="large" weight="x-thick"></y-icon>
        </div>
    `,
};
