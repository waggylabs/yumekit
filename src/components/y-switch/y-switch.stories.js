import "./y-switch.js";

export default {
    title: "Input/Switch",
    tags: ["autodocs"],
    argTypes: {
        checked: {
            control: "boolean",
            description: "Whether the switch is on.",
            table: { defaultValue: { summary: false } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Switch size.",
            table: { defaultValue: { summary: "medium" } },
        },
        onColor: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the active (on) state.",
            table: { defaultValue: { summary: "primary" } },
        },
        toggleLabel: {
            control: "boolean",
            description: "Whether to show on/off labels inside the toggle.",
            table: { defaultValue: { summary: false } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "bottom", "left", "right"],
            description: "Position of the external label.",
            table: { defaultValue: { summary: "top" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the switch is disabled.",
            table: { defaultValue: { summary: false } },
        },
        animate: {
            control: "boolean",
            description: "Whether the toggle transition animation is enabled.",
            table: { defaultValue: { summary: true } },
        },
    },
    args: {
        checked: false,
        size: "medium",
        onColor: "primary",
        toggleLabel: false,
        labelPosition: "top",
        disabled: false,
        animate: true,
    },
    render: ({ checked, size, onColor, toggleLabel, labelPosition, disabled, animate }) => `
        <y-switch
            ${checked ? "checked" : ""}
            size="${size}"
            on-color="${onColor}"
            label-position="${labelPosition}"
            ${toggleLabel ? "toggle-label" : ""}
            ${disabled ? "disabled" : ""}
            animate="${animate}"
        >
            <span slot="label">Notifications</span>
        </y-switch>
    `,
};

export const Default = {};

export const Checked = {
    args: { checked: true },
};

export const WithToggleLabel = {
    args: { toggleLabel: true, checked: true },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            <y-switch size="small" checked></y-switch>
            <y-switch size="medium" checked></y-switch>
            <y-switch size="large" checked></y-switch>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            <y-switch checked on-color="primary"></y-switch>
            <y-switch checked on-color="secondary"></y-switch>
            <y-switch checked on-color="success"></y-switch>
            <y-switch checked on-color="warning"></y-switch>
            <y-switch checked on-color="error"></y-switch>
            <y-switch checked on-color="help"></y-switch>
        </div>
    `,
};

export const Disabled = {
    args: { disabled: true, checked: true },
};
