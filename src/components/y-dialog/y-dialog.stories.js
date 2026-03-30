import "./y-dialog.js";
import "./y-button.js";

// Force iframe rendering so position:fixed dialogs sit within the story viewport
// and anchor IDs don't collide across stories on the docs page.
const docsParams = { docs: { story: { inline: false, height: "320px" } } };

export default {
    title: "Components/Dialog",
    tags: ["autodocs"],
    parameters: docsParams,
    argTypes: {
        closable: {
            control: "boolean",
            description: "Whether a close button is shown in the header.",
            table: { defaultValue: { summary: false } },
        },
        showBackdrop: {
            control: "boolean",
            description: "Whether to apply a dimmed backdrop behind the dialog.",
            table: { defaultValue: { summary: false } },
        },
        animate: {
            control: "boolean",
            description: "Whether the dialog uses an entrance animation.",
            table: { defaultValue: { summary: false } },
        },
        position: {
            control: "select",
            options: [
                "center",
                "top-left", "top-center", "top-right",
                "left", "right",
                "bottom-left", "bottom-center", "bottom-right",
            ],
            description: "Screen position of the dialog.",
            table: { defaultValue: { summary: "center" } },
        },
    },
    args: {
        closable: true,
        showBackdrop: true,
        animate: true,
        position: "center",
    },
    render: ({ closable, showBackdrop, animate, position }) => `
        <div style="padding:16px">
            <y-button id="dialog-anchor" color="primary">Open Dialog</y-button>
            <y-dialog
                anchor="dialog-anchor"
                position="${position}"
                ${closable ? "closable" : ""}
                ${showBackdrop ? "show-backdrop" : ""}
                ${animate ? "animate" : ""}
            >
                <div slot="header">Dialog Title</div>
                <div slot="body">
                    <p>This is the dialog body content. You can place any content here.</p>
                </div>
                <div slot="footer">
                    <y-button id="dialog-cancel" color="base">Cancel</y-button>
                    <y-button color="primary" style-type="filled">Confirm</y-button>
                </div>
            </y-dialog>
        </div>
    `,
};

export const Default = {};

export const NoBackdrop = {
    args: { showBackdrop: false },
};

export const WithoutCloseButton = {
    args: { closable: false, showBackdrop: true },
};

export const Animated = {
    args: { animate: true, showBackdrop: true },
};

export const Positions = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:8px;padding:16px">
            <y-button id="dlg-tl" color="base" size="small">Top Left</y-button>
            <y-dialog anchor="dlg-tl" position="top-left" closable show-backdrop animate>
                <div slot="header">Top Left</div>
                <div slot="body"><p>Positioned at the top-left.</p></div>
            </y-dialog>

            <y-button id="dlg-tc" color="base" size="small">Top Center</y-button>
            <y-dialog anchor="dlg-tc" position="top-center" closable show-backdrop animate>
                <div slot="header">Top Center</div>
                <div slot="body"><p>Positioned at the top-center.</p></div>
            </y-dialog>

            <y-button id="dlg-c" color="primary" size="small">Center</y-button>
            <y-dialog anchor="dlg-c" position="center" closable show-backdrop animate>
                <div slot="header">Center</div>
                <div slot="body"><p>Positioned at the center.</p></div>
            </y-dialog>

            <y-button id="dlg-br" color="base" size="small">Bottom Right</y-button>
            <y-dialog anchor="dlg-br" position="bottom-right" closable show-backdrop animate>
                <div slot="header">Bottom Right</div>
                <div slot="body"><p>Positioned at the bottom-right.</p></div>
            </y-dialog>
        </div>
    `,
};

export const BodyOnly = {
    render: () => `
        <div style="padding:16px">
            <y-button id="dlg-body-only" color="primary">Open</y-button>
            <y-dialog anchor="dlg-body-only" closable show-backdrop animate>
                <div slot="body">
                    <p>A dialog with only body content — no header title or footer buttons.</p>
                </div>
            </y-dialog>
        </div>
    `,
};
