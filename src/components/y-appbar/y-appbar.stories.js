import "./y-appbar.js";
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

// Force iframe rendering so y-menu's position:fixed popouts anchor to the
// story viewport, not the docs page.
const docsParams = { docs: { story: { inline: false, height: "300px" } } };

export default {
    title: "Components/AppBar",
    tags: ["autodocs"],
    parameters: docsParams,
    argTypes: {
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Size variant.",
            table: { defaultValue: { summary: "medium" } },
        },
    },
    args: {
        orientation: "vertical",
        size: "medium",
    },
    render: ({ size }) => `
        <y-appbar
            size="${size}"
            items='${navItems}'
        >
            <span slot="logo">
                <y-icon name="bolt" size="medium"></y-icon>
            </span>
            <span slot="title">MyApp</span>
        </y-appbar>
    `,
};

export const Default = {};

export const WithFooter = {
    render: () => `
        <y-appbar items='${navItems}'>
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
            <y-appbar size="small" items='${navItems}'>
                <span slot="title">Small</span>
            </y-appbar>
            <y-appbar size="medium" items='${navItems}'>
                <span slot="title">Medium</span>
            </y-appbar>
            <y-appbar size="large" items='${navItems}'>
                <span slot="title">Large</span>
            </y-appbar>
        </div>
    `,
    parameters: { docs: { story: { inline: false, height: "440px" } } },
};

export const NavigateEvent = {
    name: "Navigate Event (SPA)",
    render: () => {
        const container = document.createElement("div");
        container.style.cssText = "display:flex;flex-direction:column;gap:16px";

        const log = document.createElement("div");
        log.id = "nav-log";
        log.style.cssText =
            "padding:12px;font-family:monospace;font-size:0.8em;background:#1a1a1a;color:#ccc;border-radius:4px";
        log.textContent = "Click a nav item…";

        container.innerHTML = `
            <y-appbar
                id="spa-appbar"
                items='${navItemsWithHrefs}'
            >
                <y-icon slot="logo" name="bolt" size="medium"></y-icon>
                <span slot="title">MyApp</span>
            </y-appbar>
        `;
        container.appendChild(log);

        container
            .querySelector("#spa-appbar")
            .addEventListener("navigate", (e) => {
                e.preventDefault();
                log.innerHTML = `<b>navigate</b> intercepted<br>href: ${e.detail.href}<br><br><em>Navigation was cancelled via e.preventDefault()</em>`;
            });

        return container;
    },
};

export const CustomNavLinks = {
    name: "Custom Nav Links (default slot)",
    render: () => `
        <y-appbar>
            <y-icon slot="logo" name="bolt" size="medium"></y-icon>
            <span slot="title">MyApp</span>
            <a href="/dashboard" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;color:inherit;text-decoration:none">
                <y-icon name="home" size="medium"></y-icon>
                Dashboard
            </a>
            <a href="/projects" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;color:inherit;text-decoration:none">
                <y-icon name="folder" size="medium"></y-icon>
                Projects
            </a>
            <a href="/reports" style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;color:inherit;text-decoration:none">
                <y-icon name="waveform" size="medium"></y-icon>
                Reports
            </a>
        </y-appbar>
    `,
};
