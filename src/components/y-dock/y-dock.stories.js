import "./y-dock.js";
import "../y-icon/y-icon.js";
import "../y-button/y-button.js";
import "../../icons/all.js";

const defaultItems = [
    { name: "Home", icon: "home", href: "/", selected: true },
    { name: "Search", icon: "magnifying-glass", href: "/search" },
    { name: "Chat", icon: "speech-bubble", href: "/chat" },
    { name: "Profile", icon: "gear", href: "/profile" },
];

export default {
    title: "Navigation/Dock",
    tags: ["autodocs"],
    argTypes: {
        position: {
            control: "select",
            options: ["bottom", "top"],
            description: "Which edge of the viewport the dock anchors to.",
            table: { defaultValue: { summary: "bottom" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description:
                "Controls icon size, label font size, and overall dock height.",
            table: { defaultValue: { summary: "medium" } },
        },
        floating: {
            control: "boolean",
            description:
                "Detaches the dock into a bordered, rounded island inset from the edges (like a non-sticky appbar).",
            table: { defaultValue: { summary: "false" } },
        },
    },
    args: {
        position: "bottom",
        size: "medium",
        floating: false,
    },
    render: ({ position, size, floating }) => `
        <y-dock
            position="${position}"
            size="${size}"
            ${floating ? "floating" : ""}
            items='${JSON.stringify(defaultItems)}'
            style="position:relative;"
        ></y-dock>
    `,
};

export const Default = {};

export const TopPosition = {
    args: { position: "top" },
    render: ({ position, size }) => `
        <y-dock
            position="${position}"
            size="${size}"
            items='${JSON.stringify(defaultItems)}'
            style="position:relative;"
        ></y-dock>
    `,
};

export const Floating = {
    args: { floating: true },
    render: ({ position, size }) => `
        <y-dock
            position="${position}"
            size="${size}"
            floating
            items='${JSON.stringify(defaultItems)}'
            style="position:relative;"
        ></y-dock>
    `,
};

export const WithDirectChildren = {
    render: () => `
        <y-dock style="position:relative;">
            <y-button style-type="flat" size="small" left-icon="home">Home</y-button>
            <y-button style-type="flat" size="small" left-icon="magnifying-glass">Search</y-button>
            <y-button style-type="flat" size="small" left-icon="gear">Settings</y-button>
        </y-dock>
    `,
};

export const WithSlotTemplate = {
    render: ({ position, size }) => {
        const items = [
            { name: "Home", icon: "home", href: "/" },
            { name: "Search", icon: "magnifying-glass", href: "/search" },
            { name: "Create", icon: "plus", slot: "create-action" },
            { name: "Profile", icon: "gear", href: "/profile" },
        ];

        return `
            <y-dock
                position="${position}"
                size="${size}"
                items='${JSON.stringify(items)}'
                style="position:relative;"
            >
                <y-button slot="create-action" color="primary" style-type="filled" size="small" left-icon="plus">
                    Create
                </y-button>
            </y-dock>
        `;
    },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:80px;padding:16px 16px 180px;">
            <div>
                <p><strong>Small</strong></p>
                <y-dock
                    size="small"
                    items='${JSON.stringify(defaultItems)}'
                    style="position:relative;"
                ></y-dock>
            </div>
            <div>
                <p><strong>Medium (default)</strong></p>
                <y-dock
                    size="medium"
                    items='${JSON.stringify(defaultItems)}'
                    style="position:relative;"
                ></y-dock>
            </div>
            <div>
                <p><strong>Large</strong></p>
                <y-dock
                    size="large"
                    items='${JSON.stringify(defaultItems)}'
                    style="position:relative;"
                ></y-dock>
            </div>
        </div>
    `,
};
