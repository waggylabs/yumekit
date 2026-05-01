import "./y-sidebar.js";
import "../../icons/all.js";
import "../y-icon/y-icon.js";
import "../y-button/y-button.js";

const navItems = JSON.stringify([
    { text: "Dashboard", icon: "home", selected: true },
    { text: "Projects", icon: "folder" },
    { text: "Reports", icon: "waveform" },
    {
        text: "Settings",
        icon: "gear",
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
    { text: "Reports", icon: "waveform", href: "/reports" },
]);

export default {
    title: "Components/Sidebar",
    tags: ["autodocs"],
    argTypes: {
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Size variant.",
            table: { defaultValue: { summary: "medium" } },
        },
        collapsed: {
            control: "boolean",
            description: "Collapses the sidebar to icon-only mode.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        size: "medium",
        collapsed: false,
    },
    render: ({ size, collapsed }) => `
        <div style="height:400px;display:flex">
            <y-sidebar
                size="${size}"
                items='${navItems}'
                ${collapsed ? "collapsed" : ""}
            >
                <span slot="logo">
                    <y-icon name="bolt" size="medium"></y-icon>
                </span>
                <span slot="title">MyApp</span>
            </y-sidebar>
        </div>
    `,
};

export const Default = {};

export const Collapsed = {
    args: { collapsed: true },
};

export const WithFooter = {
    render: () => `
        <div style="height:400px;display:flex">
            <y-sidebar items='${navItems}'>
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
            </y-sidebar>
        </div>
    `,
};

export const Sticky = {
    name: "Sticky (start)",
    render: () => `
        <div style="height:400px;display:flex">
            <y-sidebar sticky="start" items='${navItems}'>
                <span slot="logo">
                    <y-icon name="bolt" size="medium"></y-icon>
                </span>
                <span slot="title">MyApp</span>
            </y-sidebar>
            <div style="flex:1;padding:16px;overflow:auto">
                <p>Page content. The sidebar is sticky to the left edge.</p>
            </div>
        </div>
    `,
};

export const NavigateEvent = {
    name: "Navigate Event (SPA)",
    render: () => {
        const container = document.createElement("div");
        container.style.cssText =
            "height:400px;display:flex;gap:16px;align-items:flex-start";

        const log = document.createElement("div");
        log.style.cssText =
            "padding:12px;font-family:monospace;font-size:0.8em;background:#1a1a1a;color:#ccc;border-radius:4px;min-width:220px;flex-shrink:0;margin-top:0";
        log.textContent = "Click a nav item…";

        container.innerHTML = `
            <y-sidebar id="spa-sidebar" items='${navItemsWithHrefs}'>
                <y-icon slot="logo" name="bolt" size="medium"></y-icon>
                <span slot="title">MyApp</span>
            </y-sidebar>
        `;
        container.appendChild(log);

        container
            .querySelector("#spa-sidebar")
            .addEventListener("navigate", (e) => {
                e.preventDefault();
                log.innerHTML = `<b>navigate</b> intercepted<br>href: ${e.detail.href}<br><br><em>Cancelled via e.preventDefault()</em>`;
            });

        return container;
    },
};

export const CustomNavLinks = {
    name: "Custom Nav Links (default slot)",
    render: () => `
        <div style="height:400px;display:flex">
            <y-sidebar>
                <y-icon slot="logo" name="bolt" size="medium"></y-icon>
                <span slot="title">MyApp</span>
                <a href="/dashboard" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:inherit;text-decoration:none;border-radius:4px">
                    <y-icon name="home" size="medium"></y-icon>
                    Dashboard
                </a>
                <a href="/projects" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:inherit;text-decoration:none;border-radius:4px">
                    <y-icon name="folder" size="medium"></y-icon>
                    Projects
                </a>
                <a href="/reports" style="display:flex;align-items:center;gap:8px;padding:8px 12px;color:inherit;text-decoration:none;border-radius:4px">
                    <y-icon name="waveform" size="medium"></y-icon>
                    Reports
                </a>
            </y-sidebar>
        </div>
    `,
};

export const CustomNavLinksCollapsible = {
    name: "Custom Nav Links — Collapse-Responsive",
    render: () => {
        // Demonstrates using --y-sidebar-collapsed and --y-sidebar-icon-col-width
        // on custom slotted elements to respond to collapse state.
        const container = document.createElement("div");
        container.style.cssText = "height:400px;display:flex";
        container.innerHTML = `
            <style>
                .demo-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    color: inherit;
                    text-decoration: none;
                    border-radius: 4px;
                    overflow: hidden;
                    /* Align icon to the sidebar's icon column width */
                    padding-left: 0;
                }
                .demo-link y-icon {
                    width: var(--y-sidebar-icon-col-width, 32px);
                    display: flex;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .demo-link .label {
                    white-space: nowrap;
                    /* Fade + collapse the label when sidebar is collapsed */
                    opacity: calc(1 - var(--y-sidebar-collapsed, 0));
                    max-width: calc((1 - var(--y-sidebar-collapsed, 0)) * 200px);
                    overflow: hidden;
                    transition: opacity 0.2s ease, max-width 0.2s ease;
                }
            </style>
            <y-sidebar id="resp-sidebar">
                <y-icon slot="logo" name="bolt" size="medium"></y-icon>
                <span slot="title">MyApp</span>
                <a class="demo-link" href="/dashboard">
                    <y-icon name="home" size="medium"></y-icon>
                    <span class="label">Dashboard</span>
                </a>
                <a class="demo-link" href="/projects">
                    <y-icon name="folder" size="medium"></y-icon>
                    <span class="label">Projects</span>
                </a>
                <a class="demo-link" href="/reports">
                    <y-icon name="waveform" size="medium"></y-icon>
                    <span class="label">Reports</span>
                </a>
            </y-sidebar>
        `;
        return container;
    },
};

export const Sizes = {
    render: () => `
        <div style="height:400px;display:flex;gap:24px">
            <y-sidebar size="small" items='${navItems}'>
                <span slot="title">Small</span>
            </y-sidebar>
            <y-sidebar size="medium" items='${navItems}'>
                <span slot="title">Medium</span>
            </y-sidebar>
            <y-sidebar size="large" items='${navItems}'>
                <span slot="title">Large</span>
            </y-sidebar>
        </div>
    `,
};
