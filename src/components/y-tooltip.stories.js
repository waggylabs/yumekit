import "./y-tooltip.js";
import "./y-button.js";

export default {
    title: "Components/Tooltip",
    tags: ["autodocs"],
    argTypes: {
        text: {
            control: "text",
            description: "The tooltip text content.",
        },
        position: {
            control: "select",
            options: ["top", "bottom", "left", "right"],
            description: "Placement relative to the trigger.",
            table: { defaultValue: { summary: "top" } },
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the tooltip.",
            table: { defaultValue: { summary: "base" } },
        },
        delay: {
            control: "number",
            description: "Delay in milliseconds before the tooltip appears.",
            table: { defaultValue: { summary: "200" } },
        },
    },
    args: {
        text: "Helpful tooltip text",
        position: "top",
        color: "base",
        delay: 200,
    },
    render: ({ text, position, color, delay }) => `
        <div style="display:flex;align-items:center;justify-content:center;padding:60px">
            <y-tooltip text="${text}" position="${position}" color="${color}" delay="${delay}">
                <y-button color="primary">Hover me</y-button>
            </y-tooltip>
        </div>
    `,
};

export const Default = {};

export const Positions = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:32px;align-items:center;justify-content:center;padding:60px">
            <y-tooltip text="Top tooltip" position="top">
                <y-button color="base">Top</y-button>
            </y-tooltip>
            <y-tooltip text="Bottom tooltip" position="bottom">
                <y-button color="base">Bottom</y-button>
            </y-tooltip>
            <y-tooltip text="Left tooltip" position="left">
                <y-button color="base">Left</y-button>
            </y-tooltip>
            <y-tooltip text="Right tooltip" position="right">
                <y-button color="base">Right</y-button>
            </y-tooltip>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:center;padding:60px">
            <y-tooltip text="Base" color="base" position="top">
                <y-button color="base">Base</y-button>
            </y-tooltip>
            <y-tooltip text="Primary" color="primary" position="top">
                <y-button color="primary">Primary</y-button>
            </y-tooltip>
            <y-tooltip text="Success" color="success" position="top">
                <y-button color="success">Success</y-button>
            </y-tooltip>
            <y-tooltip text="Warning" color="warning" position="top">
                <y-button color="warning">Warning</y-button>
            </y-tooltip>
            <y-tooltip text="Error" color="error" position="top">
                <y-button color="error">Error</y-button>
            </y-tooltip>
        </div>
    `,
};

export const OnText = {
    render: () => `
        <div style="padding:60px">
            <p>
                Hover over
                <y-tooltip text="This is the definition" position="top" color="primary">
                    <span style="text-decoration:underline;cursor:help">this word</span>
                </y-tooltip>
                to see a tooltip.
            </p>
        </div>
    `,
};
