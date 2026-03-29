import "./y-badge.js";

export default {
    title: "Components/Badge",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description: "Text displayed inside the badge.",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the badge.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Badge size.",
            table: { defaultValue: { summary: "small" } },
        },
        position: {
            control: "select",
            options: ["top", "bottom"],
            description: "Vertical position when overlaying a target.",
            table: { defaultValue: { summary: "top" } },
        },
        alignment: {
            control: "select",
            options: ["left", "right"],
            description: "Horizontal alignment when overlaying a target.",
            table: { defaultValue: { summary: "right" } },
        },
    },
    args: {
        value: "5",
        color: "primary",
        size: "small",
        position: "top",
        alignment: "right",
    },
    render: ({ value, color, size, position, alignment }) => `
        <y-badge
            value="${value}"
            color="${color}"
            size="${size}"
            position="${position}"
            alignment="${alignment}"
        >
            <y-avatar alt="JD"></y-avatar>
        </y-badge>
    `,
};

export const Default = {};

export const Standalone = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <y-badge value="1"></y-badge>
            <y-badge value="99"></y-badge>
            <y-badge value="New"></y-badge>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center">
            <y-badge value="1" color="base"><y-avatar alt="BA"></y-avatar></y-badge>
            <y-badge value="2" color="primary"><y-avatar alt="PR"></y-avatar></y-badge>
            <y-badge value="3" color="secondary"><y-avatar alt="SE"></y-avatar></y-badge>
            <y-badge value="4" color="success"><y-avatar alt="SU"></y-avatar></y-badge>
            <y-badge value="5" color="warning"><y-avatar alt="WA"></y-avatar></y-badge>
            <y-badge value="6" color="error"><y-avatar alt="ER"></y-avatar></y-badge>
            <y-badge value="7" color="help"><y-avatar alt="HE"></y-avatar></y-badge>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center">
            <y-badge value="5" size="small"><y-avatar alt="SM"></y-avatar></y-badge>
            <y-badge value="5" size="medium"><y-avatar alt="MD"></y-avatar></y-badge>
            <y-badge value="5" size="large"><y-avatar alt="LG"></y-avatar></y-badge>
        </div>
    `,
};

export const Positions = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center">
            <y-badge value="5" position="top" alignment="right"><y-avatar alt="TR"></y-avatar></y-badge>
            <y-badge value="5" position="top" alignment="left"><y-avatar alt="TL"></y-avatar></y-badge>
            <y-badge value="5" position="bottom" alignment="right"><y-avatar alt="BR"></y-avatar></y-badge>
            <y-badge value="5" position="bottom" alignment="left"><y-avatar alt="BL"></y-avatar></y-badge>
        </div>
    `,
};
