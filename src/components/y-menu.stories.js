import "./y-menu.js";
import "./y-button.js";

const defaultItems = JSON.stringify([
    { text: "Edit" },
    { text: "Duplicate" },
    { text: "Delete" },
]);

export default {
    title: "Components/Menu",
    tags: ["autodocs"],
    argTypes: {
        items: {
            control: "text",
            description: 'JSON array of `{ text, url?, icon?, selected?, children? }` objects.',
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
    },
    args: {
        items: defaultItems,
        direction: "down",
        size: "medium",
    },
    render: ({ items, direction, size }) => `
        <div style="padding:16px">
            <y-button id="menu-anchor" color="primary">Open Menu</y-button>
            <y-menu anchor="menu-anchor" items='${items}' direction="${direction}" size="${size}"></y-menu>
        </div>
    `,
};

export const Default = {};

export const WithIcons = {
    render: () => `
        <div style="padding:16px">
            <y-button id="menu-icons-anchor" color="primary">Actions</y-button>
            <y-menu
                anchor="menu-icons-anchor"
                items='${JSON.stringify([
                    { text: "Edit", icon: "edit" },
                    { text: "Copy", icon: "copy" },
                    { text: "Delete", icon: "trash" },
                ])}'
            ></y-menu>
        </div>
    `,
};

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
};

export const Directions = {
    render: () => `
        <div style="display:flex;gap:16px;padding:80px;justify-content:center;flex-wrap:wrap">
            <y-button id="menu-down" color="base">Down</y-button>
            <y-menu anchor="menu-down" direction="down" items='${defaultItems}'></y-menu>

            <y-button id="menu-right" color="base">Right</y-button>
            <y-menu anchor="menu-right" direction="right" items='${defaultItems}'></y-menu>
        </div>
    `,
};
