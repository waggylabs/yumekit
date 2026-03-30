import "./y-drawer.js";
import "./y-button.js";

// Force iframe rendering so position:fixed drawer panels sit within the story
// viewport and anchor IDs don't collide across stories on the docs page.
const docsParams = { docs: { story: { inline: false, height: "320px" } } };

export default {
    title: "Components/Drawer",
    tags: ["autodocs"],
    parameters: docsParams,
    argTypes: {
        position: {
            control: "select",
            options: ["left", "right", "top", "bottom"],
            description: "Which edge the drawer slides in from.",
            table: { defaultValue: { summary: "left" } },
        },
        resizable: {
            control: "boolean",
            description: "Whether the drawer can be resized by dragging.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        position: "left",
        resizable: false,
    },
    render: ({ position, resizable }) => `
        <div style="padding:16px">
            <y-button id="drawer-anchor" color="primary">Open Drawer</y-button>
            <y-drawer
                anchor="drawer-anchor"
                position="${position}"
                ${resizable ? "resizable" : ""}
            >
                <div slot="header">Drawer Title</div>
                <div slot="body">
                    <p>Drawer body content goes here.</p>
                    <p>You can put navigation, forms, or any content inside.</p>
                </div>
                <div slot="footer">
                    <y-button id="drawer-close" color="base">Close</y-button>
                </div>
            </y-drawer>
        </div>
    `,
};

export const Default = {};

export const Resizable = {
    args: { resizable: true },
};

export const Positions = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:16px">
            <y-button id="drawer-left" color="base">Left</y-button>
            <y-drawer anchor="drawer-left" position="left">
                <div slot="header">Left Drawer</div>
                <div slot="body"><p>Slides in from the left.</p></div>
            </y-drawer>

            <y-button id="drawer-right" color="base">Right</y-button>
            <y-drawer anchor="drawer-right" position="right">
                <div slot="header">Right Drawer</div>
                <div slot="body"><p>Slides in from the right.</p></div>
            </y-drawer>

            <y-button id="drawer-top" color="base">Top</y-button>
            <y-drawer anchor="drawer-top" position="top">
                <div slot="header">Top Drawer</div>
                <div slot="body"><p>Slides in from the top.</p></div>
            </y-drawer>

            <y-button id="drawer-bottom" color="base">Bottom</y-button>
            <y-drawer anchor="drawer-bottom" position="bottom">
                <div slot="header">Bottom Drawer</div>
                <div slot="body"><p>Slides in from the bottom.</p></div>
            </y-drawer>
        </div>
    `,
};

export const WithNavigation = {
    render: () => `
        <div style="padding:16px">
            <y-button id="drawer-nav" color="primary">Open Nav</y-button>
            <y-drawer anchor="drawer-nav" position="left" resizable>
                <div slot="header">Navigation</div>
                <div slot="body">
                    <nav style="display:flex;flex-direction:column;gap:4px">
                        <y-button color="primary" style-type="flat">Dashboard</y-button>
                        <y-button color="base" style-type="flat">Projects</y-button>
                        <y-button color="base" style-type="flat">Settings</y-button>
                        <y-button color="base" style-type="flat">Help</y-button>
                    </nav>
                </div>
            </y-drawer>
        </div>
    `,
};
