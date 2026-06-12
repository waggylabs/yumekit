import "./y-droplist.js";
import "../y-card/y-card.js";
import "../y-tag/y-tag.js";

const listWidth = "width:360px";
// y-card brings its own background, border, and padding — let it own the box
// styling and zero out the droplist's per-item padding.
const noItemPadding = "--component-droplist-item-padding:0";

export default {
    title: "Layout/Droplist",
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

export const AutoScroll = {
    render: () => `
        <p style="margin:0 0 12px;font-size:0.85em">
            Drag an item and move toward the top or bottom edge of the container — it scrolls automatically.
            Uses the default <code>scroll-sensitivity="30"</code> and <code>scroll-speed="10"</code>.
        </p>
        <div
            id="scroll-container"
            style="height:260px;overflow:auto;border:1px solid var(--base-border);border-radius:4px;padding:4px;${listWidth}"
        >
            <y-droplist id="auto-scroll-list" style="display:block;${noItemPadding}">
                <y-card data-id="i1" raised>Item 1</y-card>
                <y-card data-id="i2" raised>Item 2</y-card>
                <y-card data-id="i3" raised>Item 3</y-card>
                <y-card data-id="i4" raised>Item 4</y-card>
                <y-card data-id="i5" raised>Item 5</y-card>
                <y-card data-id="i6" raised>Item 6</y-card>
                <y-card data-id="i7" raised>Item 7</y-card>
                <y-card data-id="i8" raised>Item 8</y-card>
                <y-card data-id="i9" raised>Item 9</y-card>
                <y-card data-id="i10" raised>Item 10</y-card>
            </y-droplist>
        </div>
    `,
};

export const AutoScrollDisabled = {
    render: () => `
        <p style="margin:0 0 12px;font-size:0.85em">
            Auto-scroll is disabled with <code>scroll="false"</code> — the container does not scroll when
            the cursor reaches the edge.
        </p>
        <div
            style="height:260px;overflow:auto;border:1px solid var(--base-border);border-radius:4px;padding:4px;${listWidth}"
        >
            <y-droplist scroll="false" style="display:block;${noItemPadding}">
                <y-card data-id="i1" raised>Item 1</y-card>
                <y-card data-id="i2" raised>Item 2</y-card>
                <y-card data-id="i3" raised>Item 3</y-card>
                <y-card data-id="i4" raised>Item 4</y-card>
                <y-card data-id="i5" raised>Item 5</y-card>
                <y-card data-id="i6" raised>Item 6</y-card>
                <y-card data-id="i7" raised>Item 7</y-card>
                <y-card data-id="i8" raised>Item 8</y-card>
            </y-droplist>
        </div>
    `,
};

export const RevertOnCancel = {
    render: () => `
        <p style="margin:0 0 12px;font-size:0.85em">
            Drag an item and drop it outside the list (e.g., onto this paragraph) — the displaced items
            animate back to their original positions. Uses <code>revert</code>.
        </p>
        <y-droplist revert style="display:block;${listWidth};${noItemPadding}">
            <y-card data-id="alpha" raised>Alpha</y-card>
            <y-card data-id="bravo" raised>Bravo</y-card>
            <y-card data-id="charlie" raised>Charlie</y-card>
            <y-card data-id="delta" raised>Delta</y-card>
        </y-droplist>
    `,
};

export const ForceFloat = {
    render: () => `
        <style>
            .ff-modal-backdrop {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.4);
                display: flex; align-items: center; justify-content: center;
                z-index: 100;
            }
            .ff-modal {
                background: var(--base-background-component);
                border: 1px solid var(--base-border);
                border-radius: 8px;
                padding: 24px;
                width: 380px;
                /* overflow:hidden clips a normal ghost but force-float escapes it */
                overflow: hidden;
            }
            .ff-modal h3 { margin: 0 0 12px; font-size: 1rem; }
        </style>
        <p style="margin:0 0 12px;font-size:0.85em">
            The droplist is inside an <code>overflow:hidden</code> modal. With <code>force-float</code>, the
            ghost placeholder is appended to <code>document.body</code> with <code>position:fixed</code> and
            remains visible above the clipping boundary.
        </p>
        <div class="ff-modal-backdrop">
            <div class="ff-modal">
                <h3>Reorder tasks</h3>
                <y-droplist force-float style="display:block;${noItemPadding}">
                    <y-card data-id="task-a" raised>Design</y-card>
                    <y-card data-id="task-b" raised>Implement</y-card>
                    <y-card data-id="task-c" raised>Review</y-card>
                    <y-card data-id="task-d" raised>Deploy</y-card>
                </y-droplist>
            </div>
        </div>
    `,
};

export const TouchDelay = {
    name: "Touch / Delay",
    parameters: {
        docs: {
            description: {
                story: "A drag delay of 300 ms gives the user time to scroll before a drag begins. The `touch-start-threshold` ensures small taps do not accidentally start a drag. Try on a touch device or DevTools touch simulation.",
            },
        },
    },
    render: () => /* html */ `
        <style>
            .touch-demo y-droplist { display: block; max-width: 320px; }
            .touch-demo .hint { font-size: 0.85rem; color: var(--base-content-light, #666); margin-bottom: 0.5rem; }
        </style>
        <div class="touch-demo">
            <p class="hint">delay="300" delay-on-touch-only touch-start-threshold="8"</p>
            <y-droplist delay="300" delay-on-touch-only touch-start-threshold="8" animation="200">
                <div>Item 1</div>
                <div>Item 2</div>
                <div>Item 3</div>
                <div>Item 4</div>
                <div>Item 5</div>
            </y-droplist>
        </div>
    `,
};

export const ProgrammaticSort = {
    name: "Programmatic sort()",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;max-width:300px">
            <div style="display:flex;gap:8px">
                <button onclick="document.getElementById('sort-list').sort()">
                    Sort A→Z (data-id)
                </button>
                <button onclick="document.getElementById('sort-list').sort((a,b)=>b.dataset.id.localeCompare(a.dataset.id))">
                    Sort Z→A
                </button>
            </div>
            <y-droplist id="sort-list" animation="200">
                <div data-id="delta">Delta</div>
                <div data-id="alpha">Alpha</div>
                <div data-id="gamma">Gamma</div>
                <div data-id="beta">Beta</div>
            </y-droplist>
        </div>
    `,
};

export const DragDropEvent = {
    name: "drag:drop pre-mutation hook",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:12px;max-width:300px">
            <p style="margin:0;font-size:0.85rem;color:var(--base-content-light, #666)">
                The <code>drag:drop</code> event fires <em>before</em> the DOM is mutated.
                The log below captures the projected drop index.
            </p>
            <y-droplist id="event-list" animation="200">
                <div data-id="one">One</div>
                <div data-id="two">Two</div>
                <div data-id="three">Three</div>
                <div data-id="four">Four</div>
            </y-droplist>
            <pre id="event-log" style="margin:0;padding:8px;background:var(--base-background-component, #1a1a1c);border-radius:4px;font-size:0.8rem;min-height:40px"></pre>
            <script>
                document.getElementById('event-list').addEventListener('drag:drop', (e) => {
                    const log = document.getElementById('event-log');
                    log.textContent = 'drag:drop — item: ' + e.detail.item.dataset.id + ', index: ' + e.detail.index;
                });
            <\/script>
        </div>
    `,
};
export const DragPreview = {
    render: () => `
        <p style="margin:0 0 12px;font-size:0.85em">
            Drag an item — a cursor-following clone of the dragged card follows
            the mouse. The in-list ghost (dashed outline) is unchanged.
        </p>
        <y-droplist drag-preview style="display:block;${listWidth};${noItemPadding}">
            <y-card data-id="alpha" raised>Alpha</y-card>
            <y-card data-id="bravo" raised>Bravo</y-card>
            <y-card data-id="charlie" raised>Charlie</y-card>
            <y-card data-id="delta" raised>Delta</y-card>
        </y-droplist>
    `,
};

export const DragPreviewCustomSlot = {
    render: () => `
        <style>
            .badge-preview {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px 16px;
                background: var(--primary-background-active, #4c8bf5);
                color: var(--primary-content-inverse, #fff);
                border-radius: 20px;
                font-size: 0.9rem;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        </style>
        <p style="margin:0 0 12px;font-size:0.85em">
            A custom <code>slot="drag-preview"</code> element is used instead of
            cloning the dragged card. The badge below is the slotted node —
            it is hidden during the drag and restored on drop.
        </p>
        <y-droplist drag-preview style="display:block;${listWidth};${noItemPadding}">
            <y-card data-id="alpha" raised>Alpha</y-card>
            <y-card data-id="bravo" raised>Bravo</y-card>
            <y-card data-id="charlie" raised>Charlie</y-card>
            <div slot="drag-preview" class="badge-preview">Dragging…</div>
        </y-droplist>
    `,
};

export const DragPreviewTilted = {
    render: () => `
        <p style="margin:0 0 12px;font-size:0.85em">
            The preview is scaled to 92 % and tilted 3° using
            <code>--component-droplist-drag-preview-rotate</code> and
            <code>--component-droplist-drag-preview-scale</code> (via
            <code>drag-preview-scale</code> attribute). Mimics a Trello-style
            card drag.
        </p>
        <y-droplist
            drag-preview
            drag-preview-scale="0.92"
            style="display:block;${listWidth};${noItemPadding};--component-droplist-drag-preview-rotate:3deg"
        >
            <y-card data-id="alpha" raised>Alpha</y-card>
            <y-card data-id="bravo" raised>Bravo</y-card>
            <y-card data-id="charlie" raised>Charlie</y-card>
            <y-card data-id="delta" raised>Delta</y-card>
        </y-droplist>
    `,
};
