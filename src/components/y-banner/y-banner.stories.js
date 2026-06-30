import "./y-banner.js";
import "../y-icon/y-icon.js";
import "../y-button/y-button.js";
import "../../icons/all.js";

export default {
    title: "Feedback/Banner",
    tags: ["autodocs"],
    argTypes: {
        message: {
            control: "text",
            description: "Banner message text (default slot).",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Semantic color for the banner background.",
            table: { defaultValue: { summary: "base" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Controls padding, icon size, and font size.",
            table: { defaultValue: { summary: "medium" } },
        },
        position: {
            control: "select",
            options: ["push", "overlap"],
            description: "Whether the banner pushes content or overlaps it.",
            table: { defaultValue: { summary: "push" } },
        },
        icon: {
            control: "text",
            description: "Icon name passed to an internal y-icon.",
        },
        dismissable: {
            control: "boolean",
            description: "Whether a close button is shown.",
            table: { defaultValue: { summary: false } },
        },
        sticky: {
            control: "boolean",
            description: "Whether the banner sticks to the viewport (overlap only).",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        message: "This is an informational banner.",
        color: "primary",
        size: "medium",
        position: "push",
        icon: "",
        dismissable: false,
        sticky: false,
    },
    render: ({ message, color, size, position, icon, dismissable, sticky }) => `
        <y-banner
            color="${color}"
            size="${size}"
            position="${position}"
            ${icon ? `icon="${icon}"` : ""}
            ${dismissable ? "dismissable" : ""}
            ${sticky ? "sticky" : ""}
        >${message}</y-banner>
    `,
};

export const Default = {};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-banner color="base">Base — neutral informational banner.</y-banner>
            <y-banner color="primary">Primary — highlighted information.</y-banner>
            <y-banner color="secondary">Secondary — alternative highlight.</y-banner>
            <y-banner color="success">Success — operation completed successfully!</y-banner>
            <y-banner color="warning">Warning — please review before continuing.</y-banner>
            <y-banner color="error">Error — something went wrong.</y-banner>
            <y-banner color="help">Help — here is some guidance.</y-banner>
        </div>
    `,
};

export const WithIcon = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-banner color="success" icon="check">Your changes have been saved.</y-banner>
            <y-banner color="warning" icon="warning">Your session will expire in 5 minutes.</y-banner>
            <y-banner color="error" icon="circle-exclamation">Unable to connect to the server.</y-banner>
            <y-banner color="help" icon="circle-info">Need help? Check our documentation.</y-banner>
        </div>
    `,
};

export const Dismissable = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-banner color="primary" icon="circle-info" dismissable>
                This banner can be dismissed by clicking the close button.
            </y-banner>
            <y-banner color="warning" icon="warning" dismissable>
                Warning: this action cannot be undone.
            </y-banner>
        </div>
    `,
};

export const WithAction = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-banner color="primary" icon="circle-info" dismissable>
                A new version is available.
                <y-button slot="action" size="small" color="primary" variant="filled">Update now</y-button>
            </y-banner>
            <y-banner color="warning" icon="warning">
                Your trial expires in 3 days.
                <y-button slot="action" size="small" color="warning" variant="outlined">Upgrade</y-button>
            </y-banner>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:8px">
            <y-banner color="primary" icon="circle-info" size="small" dismissable>Small banner</y-banner>
            <y-banner color="primary" icon="circle-info" size="medium" dismissable>Medium banner (default)</y-banner>
            <y-banner color="primary" icon="circle-info" size="large" dismissable>Large banner</y-banner>
        </div>
    `,
};

export const SlottedIcon = {
    render: () => `
        <y-banner color="success" dismissable>
            <y-icon slot="icon" name="check" size="large" color="success"></y-icon>
            Custom slotted icon takes precedence over the icon attribute.
        </y-banner>
    `,
};
