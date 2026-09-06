import "./y-icon.js";
import "../../icons/all.js";
import { getIconNames } from "../../icons/registry.js";

// Derived from the registry at load time so these lists never go stale.
// Filled variants are registered under `<name>-fill`; the base names are the
// selectable icons, and the `-fill` keys identify which have a filled version.
const ALL_REGISTERED = getIconNames().sort();
const ICON_NAMES = ALL_REGISTERED.filter((n) => !n.endsWith("-fill"));

export default {
    title: "Data/Icon",
    tags: ["autodocs"],
    argTypes: {
        name: {
            control: "select",
            options: ICON_NAMES,
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
            options: [
                "",
                "base",
                "primary",
                "secondary",
                "success",
                "warning",
                "error",
                "help",
            ],
            description: "Color theme. Leave empty to inherit.",
            table: { defaultValue: { summary: "" } },
        },
        weight: {
            control: "select",
            options: [
                "x-thin",
                "thin",
                "regular",
                "thick",
                "x-thick",
                "filled",
            ],
            description:
                'Stroke weight, or "filled" for the filled variant (falls back to line when none exists).',
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
            <y-icon name="star" size="large" weight="filled"></y-icon>
        </div>
    `,
};
