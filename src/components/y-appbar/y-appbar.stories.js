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

const navItemsWithHrefs = JSON.stringify([
    { text: "Dashboard", icon: "home", href: "/dashboard", selected: true },
    { text: "Projects", icon: "folder", href: "/projects" },
    { text: "Reports", icon: "chart", href: "/reports" },
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

export const NavigateEvent = {
    name: "Navigate Event (SPA)",
    render: () => {
        const container = document.createElement("div");
        container.style.cssText = "height:400px;display:flex;gap:16px;align-items:flex-start";

        const log = document.createElement("div");
        log.id = "nav-log";
        log.style.cssText = "padding:12px;font-family:monospace;font-size:0.8em;background:#1a1a1a;color:#ccc;border-radius:4px;min-width:220px;flex-shrink:0";
        log.textContent = "Click a nav item…";

        container.innerHTML = `
            <y-appbar
                id="spa-appbar"
                orientation="vertical"
                items='${navItemsWithHrefs}'
            >
                <y-icon slot="logo" name="bolt" size="medium"></y-icon>
                <span slot="title">MyApp</span>
            </y-appbar>
        `;
        container.appendChild(log);

        container.querySelector("#spa-appbar").addEventListener("navigate", (e) => {
            e.preventDefault();
            log.innerHTML = `<b>navigate</b> intercepted<br>href: ${e.detail.href}<br><br><em>Navigation was cancelled via e.preventDefault()</em>`;
        });

        return container;
    },
};

export const NavSlot = {
    name: "Custom Nav Links (slot)",
    render: () => `
        <div style="height:400px;display:flex">
            <y-appbar orientation="vertical">
                <y-icon slot="logo" name="bolt" size="medium"></y-icon>
                <span slot="title">MyApp</span>
                <a slot="nav" href="/dashboard" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:inherit;text-decoration:none">
                    <y-icon name="home" size="medium"></y-icon>
                    Dashboard
                </a>
                <a slot="nav" href="/projects" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:inherit;text-decoration:none">
                    <y-icon name="folder" size="medium"></y-icon>
                    Projects
                </a>
                <a slot="nav" href="/reports" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:inherit;text-decoration:none">
                    <y-icon name="chart" size="medium"></y-icon>
                    Reports
                </a>
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
