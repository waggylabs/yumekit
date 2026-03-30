import "./y-menu.js";
import "../y-button/y-button.js";

const defaultItems = JSON.stringify([
    { text: "Edit" },
    { text: "Duplicate" },
    { text: "Delete" },
]);

// Force iframe rendering so position:fixed anchors to the story viewport, not the docs page.
const docsParams = { docs: { story: { inline: false, height: "200px" } } };

export default {
    title: "Components/Menu",
    tags: ["autodocs"],
    parameters: docsParams,
    argTypes: {
        items: {
            control: "text",
            description: 'JSON array of `{ text, url?, selected?, children? }` objects.',
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
