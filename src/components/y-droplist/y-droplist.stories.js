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
            <pre id="readme-out" style="margin:0;padding:8px;background:var(--base-background-component);border-radius:4px;font-size:0.85em"></pre>
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

export const Kanban = {
    render: () => `
        <style>
            .kanban-board { display: flex; gap: 16px; align-items: flex-start; }
            .kanban-column { display: flex; flex-direction: column; gap: 8px; width: 260px; }
            .kanban-column h3 { margin: 0 0 4px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; }
        </style>
        <div class="kanban-board">
            <div class="kanban-column">
                <h3>To Do</h3>
                <y-droplist id="todo" group="kanban" aria-label="To Do" style="display:block;${noItemPadding}">
                    <y-card data-id="task-1" raised>Design wireframes</y-card>
                    <y-card data-id="task-2" raised>Write tests</y-card>
                    <y-card data-id="task-3" raised>Update docs</y-card>
                </y-droplist>
            </div>
            <div class="kanban-column">
                <h3>In Progress</h3>
                <y-droplist id="doing" group="kanban" aria-label="In Progress" style="display:block;${noItemPadding}">
                    <y-card data-id="task-4" raised>Build component</y-card>
                    <y-card data-id="task-5" raised>Code review</y-card>
                </y-droplist>
            </div>
            <div class="kanban-column">
                <h3>Done</h3>
                <y-droplist id="done" group="kanban" aria-label="Done" style="display:block;${noItemPadding}">
                    <y-card data-id="task-6" raised>Set up repo</y-card>
                </y-droplist>
            </div>
        </div>
        <pre id="kanban-log" style="margin-top:16px;padding:8px;background:var(--base-background-component);border-radius:4px;font-size:0.8em;min-height:2.5em"></pre>
        <script type="module">
            const log = document.getElementById("kanban-log");
            document.querySelectorAll("[group='kanban']").forEach((list) => {
                list.addEventListener("update", (e) => {
                    const { item, oldIndex, newIndex, list: src, from } = e.detail;
                    const label = item.getAttribute("data-id");
                    if (newIndex === -1) {
                        log.textContent = \`"\${label}" left "\${src.getAttribute("aria-label")}"\`;
                    } else if (from) {
                        log.textContent = \`"\${label}" → "\${src.getAttribute("aria-label")}" at position \${newIndex + 1}\`;
                    } else {
                        log.textContent = \`"\${label}" reordered to position \${newIndex + 1} in "\${src.getAttribute("aria-label")}"\`;
                    }
                });
            });
        </script>
    `,
};

export const KanbanDropDisabled = {
    render: () => `
        <style>
            .kanban-board { display: flex; gap: 16px; align-items: flex-start; }
            .kanban-column { display: flex; flex-direction: column; gap: 8px; width: 260px; }
            .kanban-column h3 { margin: 0 0 4px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; }
        </style>
        <p style="margin:0 0 12px;font-size:0.85em">
            Drag from <strong>Templates</strong> into a lane — the original stays put (<code>pull="clone"</code>).
        </p>
        <div class="kanban-board">
            <div class="kanban-column">
                <h3>Templates</h3>
                <y-droplist id="templates" group="kanban" pull="clone" put="false" aria-label="Templates" style="display:block;${noItemPadding}">
                    <y-card data-id="tpl-bug" raised>Bug report</y-card>
                    <y-card data-id="tpl-feat" raised>Feature request</y-card>
                    <y-card data-id="tpl-chore" raised>Chore</y-card>
                </y-droplist>
            </div>
            <div class="kanban-column">
                <h3>Backlog</h3>
                <y-droplist id="backlog" group="kanban" aria-label="Backlog" style="display:block;${noItemPadding}">
                </y-droplist>
            </div>
            <div class="kanban-column">
                <h3>In Progress</h3>
                <y-droplist id="doing" group="kanban" aria-label="In Progress" style="display:block;${noItemPadding}">
                </y-droplist>
            </div>
        </div>
    `,
};

export const DragHandle = {
    render: () => `
        <style>
            .handle-row {
                display: flex; align-items: center; gap: 8px;
                padding: 8px 12px; background: var(--base-background-component);
                border: 1px solid var(--base-border); border-radius: 4px;
            }
            .handle-row .grip {
                cursor: grab;
                color: #888;
                font-size: 1.1em;
                user-select: none;
                padding: 2px 4px;
            }
            .handle-row .grip:active { cursor: grabbing; }
            .handle-row .grip:focus { outline: 2px solid #4c8bf5; outline-offset: 2px; border-radius: 2px; }
            .handle-row .body { flex: 1; }
        </style>
        <p style="margin:0 0 12px;font-size:0.85em">
            Drag is gated to the <strong>⋮⋮</strong> handle. Clicking elsewhere on the row does not start a drag.
        </p>
        <y-droplist handle=".grip" style="display:block;${listWidth};${noItemPadding}">
            <div data-id="alpha" class="handle-row">
                <span class="grip" aria-label="Reorder Alpha">⋮⋮</span>
                <span class="body">Alpha</span>
            </div>
            <div data-id="bravo" class="handle-row">
                <span class="grip" aria-label="Reorder Bravo">⋮⋮</span>
                <span class="body">Bravo</span>
            </div>
            <div data-id="charlie" class="handle-row">
                <span class="grip" aria-label="Reorder Charlie">⋮⋮</span>
                <span class="body">Charlie</span>
            </div>
        </y-droplist>
    `,
};

export const Swap = {
    render: () => `
        <style>
            .swap-tile {
                padding: 24px; text-align: center;
                background: var(--base-background-component); border: 1px solid var(--base-border); border-radius: 4px;
                font-weight: 600;
            }
            .y-droplist__swap-target {
                outline: 2px dashed #4c8bf5;
                outline-offset: -2px;
            }
        </style>
        <p style="margin:0 0 12px;font-size:0.85em">
            Drop one tile onto another — they swap positions instead of inserting between.
        </p>
        <y-droplist swap style="display:block;${listWidth};${noItemPadding}">
            <div data-id="one" class="swap-tile">One</div>
            <div data-id="two" class="swap-tile">Two</div>
            <div data-id="three" class="swap-tile">Three</div>
            <div data-id="four" class="swap-tile">Four</div>
        </y-droplist>
    `,
};

export const CloneToBucket = {
    render: () => `
        <style>
            .clone-board { display: flex; gap: 24px; align-items: flex-start; }
            .clone-board > div { display: flex; flex-direction: column; gap: 8px; width: 240px; }
            .clone-board h3 {
                margin: 0 0 4px; font-size: 0.85rem;
                text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.65;
            }
        </style>
        <p style="margin:0 0 12px;font-size:0.85em">
            Drag a template into the bucket — the original stays in the palette (<code>clone</code>).
        </p>
        <div class="clone-board">
            <div>
                <h3>Templates</h3>
                <y-droplist
                    id="palette"
                    group="bucket"
                    clone
                    put="false"
                    aria-label="Templates"
                    style="display:block;${noItemPadding}"
                >
                    <y-card data-id="bug" raised>Bug report</y-card>
                    <y-card data-id="feat" raised>Feature</y-card>
                    <y-card data-id="chore" raised>Chore</y-card>
                </y-droplist>
            </div>
            <div>
                <h3>Bucket</h3>
                <y-droplist
                    id="bucket"
                    group="bucket"
                    aria-label="Bucket"
                    style="display:block;min-height:64px;${noItemPadding}"
                >
                </y-droplist>
            </div>
        </div>
    `,
};
