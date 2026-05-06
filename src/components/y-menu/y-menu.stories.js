import "./y-menu.js";
import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const defaultItems = JSON.stringify([
    { text: "Edit" },
    { text: "Duplicate" },
    { text: "Delete" },
]);

// Force iframe rendering so position:fixed anchors to the story viewport, not the docs page.
const docsParams = { docs: { story: { inline: false, height: "200px" } } };

export default {
    title: "Navigation/Menu",
    tags: ["autodocs"],
    parameters: docsParams,
    argTypes: {
        items: {
            control: "text",
            description:
                "JSON array of `{ text, value?, href?, icon?, slot?, selected?, children? }` objects. (`url` is accepted as a deprecated alias for `href`.)",
        },
        direction: {
            control: "select",
            options: ["down", "up", "left", "right"],
            description: "Direction the menu opens relative to its anchor.",
            table: { defaultValue: { summary: "down" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Menu item size.",
            table: { defaultValue: { summary: "medium" } },
        },
        visible: {
            control: "boolean",
            description:
                "Whether the menu is open. Set to true to preview direction and size changes in real time.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        items: defaultItems,
        direction: "down",
        size: "medium",
        visible: false,
    },
    render: ({ items, direction, size, visible }) => `
        <div style="padding:16px">
            <y-button id="menu-anchor" color="primary">Open Menu</y-button>
            <y-menu anchor="menu-anchor" items='${items}' direction="${direction}" size="${size}" ${visible ? "visible" : ""}></y-menu>
        </div>
    `,
};

export const Default = {};

export const WithSelected = {
    render: () => `
        <div style="padding:16px">
            <y-button id="menu-selected-anchor" color="primary">View</y-button>
            <y-menu
                anchor="menu-selected-anchor"
                items='${JSON.stringify([
                    { text: "List view" },
                    { text: "Grid view", selected: true },
                    { text: "Table view" },
                ])}'
            ></y-menu>
        </div>
    `,
};

export const WithSubmenus = {
    render: () => `
        <div style="padding:16px">
            <y-button id="menu-sub-anchor" color="primary">File</y-button>
            <y-menu
                anchor="menu-sub-anchor"
                items='${JSON.stringify([
                    { text: "New" },
                    {
                        text: "Open Recent",
                        children: [
                            { text: "project-a.json" },
                            { text: "project-b.json" },
                            { text: "project-c.json" },
                        ],
                    },
                    { text: "Save" },
                    { text: "Export" },
                ])}'
            ></y-menu>
        </div>
    `,
    parameters: { docs: { story: { inline: false, height: "220px" } } },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;gap:16px;padding:16px">
            <y-button id="menu-sm" color="base">Small</y-button>
            <y-menu anchor="menu-sm" size="small" items='${defaultItems}'></y-menu>

            <y-button id="menu-md" color="base">Medium</y-button>
            <y-menu anchor="menu-md" size="medium" items='${defaultItems}'></y-menu>

            <y-button id="menu-lg" color="base">Large</y-button>
            <y-menu anchor="menu-lg" size="large" items='${defaultItems}'></y-menu>
        </div>
    `,
};

export const WithIcons = {
    render: () => `
        <div style="padding:16px">
            <y-button id="menu-icons-anchor" color="primary">Actions</y-button>
            <y-menu
                anchor="menu-icons-anchor"
                items='${JSON.stringify([
                    { text: "Edit", value: "edit", icon: "pencil" },
                    { text: "Copy", value: "copy", icon: "copy" },
                    { text: "Delete", value: "delete", icon: "trash" },
                ])}'
            ></y-menu>
        </div>
        <script type="module">
            document.querySelector("y-menu").addEventListener("select", (e) => {
                console.log("selected:", e.detail.value);
            });
        </script>
    `,
};

export const WithSlottedChildren = {
    render: () => `
        <div style="padding:16px">
            <y-button id="menu-slotted-anchor" color="primary">Links</y-button>
            <y-menu anchor="menu-slotted-anchor">
                <a href="/docs" data-value="docs" style="display:block;color:inherit;text-decoration:none">Docs</a>
                <a href="/faq" data-value="faq" style="display:block;color:inherit;text-decoration:none">FAQ</a>
                <a href="/support" data-value="support" style="display:block;color:inherit;text-decoration:none">Support</a>
            </y-menu>
        </div>
    `,
};

export const WithCustomSlotPerItem = {
    render: () => `
        <div style="padding:16px">
            <y-button id="menu-custom-anchor" color="primary">Account</y-button>
            <y-menu
                anchor="menu-custom-anchor"
                items='${JSON.stringify([
                    { text: "Signed in as Alex", slot: "user-banner" },
                    { text: "Profile", value: "profile" },
                    { text: "Sign out", value: "signout" },
                ])}'
            >
                <strong slot="user-banner" style="color:#a78bfa">â˜… Signed in as Alex</strong>
            </y-menu>
        </div>
    `,
};
