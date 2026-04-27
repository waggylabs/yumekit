import "./y-droplist.js";
import "../y-card/y-card.js";
import "../y-tag/y-tag.js";

const listWidth = "width:360px";
// y-card brings its own background, border, and padding — let it own the box
// styling and zero out the droplist's per-item padding.
const noItemPadding = "--component-droplist-item-padding:0";

export default {
    title: "Components/Droplist",
    tags: ["autodocs"],
    argTypes: {
        disabled: {
            control: "boolean",
            description: "Disables drag-and-drop and keyboard reorder.",
            table: { defaultValue: { summary: false } },
        },
        vertical: {
            control: "select",
            options: ["true", "false"],
            description:
                "Reorder axis. Default is vertical; set to `false` for horizontal.",
            table: { defaultValue: { summary: "true" } },
        },
        animation: {
            control: { type: "number", min: 0, max: 1000, step: 50 },
            description: "Settle-animation duration (ms). 0 disables.",
            table: { defaultValue: { summary: "150" } },
        },
    },
    args: {
        disabled: false,
        vertical: "true",
        animation: 150,
    },
    render: ({ disabled, vertical, animation }) => `
        <y-droplist
            animation="${animation}"
            ${disabled ? "disabled" : ""}
            ${vertical === "false" ? `vertical="false"` : ""}
            style="display:block;${listWidth};${noItemPadding}"
        >
            <y-card data-id="alpha" raised>Alpha</y-card>
            <y-card data-id="bravo" raised>Bravo</y-card>
            <y-card data-id="charlie" raised>Charlie</y-card>
            <y-card data-id="delta" raised>Delta</y-card>
        </y-droplist>
    `,
};

export const Default = {};

export const Disabled = {
    args: { disabled: true },
};

export const Horizontal = {
    args: { vertical: "false" },
    render: ({ animation }) => `
        <y-droplist
            animation="${animation}"
            vertical="false"
            style="display:block;${noItemPadding}"
        >
            <y-card data-id="one" raised>One</y-card>
            <y-card data-id="two" raised>Two</y-card>
            <y-card data-id="three" raised>Three</y-card>
            <y-card data-id="four" raised>Four</y-card>
        </y-droplist>
    `,
};

export const NoAnimation = {
    args: { animation: 0 },
};

export const ReadCurrentOrder = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;${listWidth}">
            <y-droplist id="readme-list" style="display:block;${noItemPadding}">
                <y-card data-id="task-1" raised>Task 1</y-card>
                <y-card data-id="task-2" raised>Task 2</y-card>
                <y-card data-id="task-3" raised>Task 3</y-card>
            </y-droplist>
            <pre id="readme-out" style="margin:0;padding:8px;background:#f5f5f5;border-radius:4px;font-size:0.85em"></pre>
        </div>
        <script type="module">
            const list = document.getElementById("readme-list");
            const out = document.getElementById("readme-out");
            const dump = () => out.textContent = JSON.stringify(list.toArray());
            list.addEventListener("update", dump);
            dump();
        </script>
    `,
};

export const RichItems = {
    render: () => `
        <y-droplist style="display:block;${listWidth};${noItemPadding}">
            <y-card data-id="inbox" raised>
                <div slot="header"><strong>Inbox</strong></div>
                <p style="margin:0">12 unread messages</p>
                <y-tag slot="footer" color="primary" style-type="flat" size="small">Active</y-tag>
            </y-card>
            <y-card data-id="drafts" raised>
                <div slot="header"><strong>Drafts</strong></div>
                <p style="margin:0">3 in progress</p>
                <y-tag slot="footer" color="warning" style-type="flat" size="small">Pending</y-tag>
            </y-card>
            <y-card data-id="archive" raised>
                <div slot="header"><strong>Archive</strong></div>
                <p style="margin:0">2,341 messages</p>
                <y-tag slot="footer" color="base" style-type="flat" size="small">Read-only</y-tag>
            </y-card>
        </y-droplist>
    `,
};
