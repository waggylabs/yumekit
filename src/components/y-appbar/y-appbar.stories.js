import "./y-appbar.js";
import "../../icons/all.js";
import "../y-icon/y-icon.js";
import "../y-button/y-button.js";

const navItems = JSON.stringify([
    { text: "Dashboard", icon: "home", selected: true },
    { text: "Projects", icon: "folder" },
    { text: "Reports", icon: "chart" },
    {
        text: "Settings",
        icon: "settings",
        children: [
            { text: "Profile" },
            { text: "Preferences" },
            { text: "Security" },
        ],
    },
]);

export default {
    title: "Components/AppBar",
    tags: ["autodocs"],
    argTypes: {
        orientation: {
            control: "select",
            options: ["vertical", "horizontal"],
            description: "Layout orientation.",
            table: { defaultValue: { summary: "vertical" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Size variant.",
            table: { defaultValue: { summary: "medium" } },
        },
        collapsed: {
            control: "boolean",
            description: "Whether the vertical sidebar is collapsed to icon-only mode.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        orientation: "vertical",
        size: "medium",
        collapsed: false,
    },
    render: ({ orientation, size, collapsed }) => `
        <div style="height:400px;display:flex">
            <y-appbar
                orientation="${orientation}"
                size="${size}"
                items='${navItems}'
                ${collapsed ? "collapsed" : ""}
            >
                <span slot="logo">
                    <y-icon name="bolt" size="medium"></y-icon>
                </span>
                <span slot="title">MyApp</span>
            </y-appbar>
        </div>
    `,
};

export const Default = {};

export const Collapsed = {
    args: { collapsed: true },
};

export const Horizontal = {
    args: { orientation: "horizontal" },
    render: () => `
        <y-appbar
            orientation="horizontal"
            items='${navItems}'
        >
            <span slot="logo">
                <y-icon name="bolt" size="medium"></y-icon>
            </span>
            <span slot="title">MyApp</span>
            <div slot="footer">
                <y-button color="base" style-type="flat" size="small">Sign Out</y-button>
            </div>
        </y-appbar>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-appbar orientation="horizontal" size="small" items='${navItems}'>
                <span slot="title">Small</span>
            </y-appbar>
            <y-appbar orientation="horizontal" size="medium" items='${navItems}'>
                <span slot="title">Medium</span>
            </y-appbar>
            <y-appbar orientation="horizontal" size="large" items='${navItems}'>
                <span slot="title">Large</span>
            </y-appbar>
        </div>
    `,
};

export const WithFooter = {
    render: () => `
        <div style="height:400px;display:flex">
            <y-appbar
                orientation="vertical"
                items='${navItems}'
            >
                <span slot="logo">
                    <y-icon name="bolt" size="medium"></y-icon>
                </span>
                <span slot="title">MyApp</span>
                <div slot="footer">
                    <y-button color="base" style-type="flat">
                        <y-icon slot="left-icon" name="user" size="medium"></y-icon>
                        Profile
                    </y-button>
                </div>
            </y-appbar>
        </div>
    `,
};
