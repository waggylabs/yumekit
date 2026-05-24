import "./y-tree.js";
import "../y-tree-item/y-tree-item.js";
import "../y-icon/y-icon.js";
import "../y-badge/y-badge.js";
import "../../icons/all.js";

export default {
    title: "Navigation/Tree",
    tags: ["autodocs"],
    argTypes: {
        exclusive: {
            control: "boolean",
            description: "Expanding one branch collapses sibling branches at the same level.",
            table: { defaultValue: { summary: false } },
        },
        selection: {
            control: "select",
            options: ["single", "none"],
            description:
                "`single` (default) lets one item be selected at a time; `none` defers selection to the route.",
            table: { defaultValue: { summary: "single" } },
        },
        "route-match": {
            control: "select",
            options: ["exact", "prefix", "off"],
            description:
                "How `href` matches against `window.location.pathname`. `prefix` highlights ancestor items for descendant routes.",
            table: { defaultValue: { summary: "exact" } },
        },
    },
    args: {
        exclusive: false,
        selection: "single",
        "route-match": "exact",
    },
    render: ({ exclusive, selection, "route-match": routeMatch }) => `
        <y-tree
            ${exclusive ? "exclusive" : ""}
            selection="${selection}"
            route-match="${routeMatch}"
            style="width:280px"
        >
            <y-tree-item expanded>
                <span slot="label">Documents</span>
                <y-tree-item slot="children" selected>
                    <span slot="label">Report.pdf</span>
                </y-tree-item>
                <y-tree-item slot="children">
                    <span slot="label">Notes.txt</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item>
                <span slot="label">Images</span>
                <y-tree-item slot="children">
                    <span slot="label">photo.jpg</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item>
                <span slot="label">Archive (no children)</span>
            </y-tree-item>
        </y-tree>
    `,
};

export const Default = {};

export const Exclusive = {
    args: { exclusive: true },
    parameters: {
        docs: {
            description: {
                story: "With `exclusive`, expanding one branch collapses its siblings at the same level. Try opening a few branches.",
            },
        },
    },
    render: () => `
        <y-tree exclusive style="width:280px">
            <y-tree-item expanded>
                <span slot="label">Section A</span>
                <y-tree-item slot="children"><span slot="label">A.1</span></y-tree-item>
                <y-tree-item slot="children"><span slot="label">A.2</span></y-tree-item>
            </y-tree-item>
            <y-tree-item>
                <span slot="label">Section B</span>
                <y-tree-item slot="children"><span slot="label">B.1</span></y-tree-item>
                <y-tree-item slot="children"><span slot="label">B.2</span></y-tree-item>
            </y-tree-item>
            <y-tree-item>
                <span slot="label">Section C</span>
                <y-tree-item slot="children"><span slot="label">C.1</span></y-tree-item>
                <y-tree-item slot="children"><span slot="label">C.2</span></y-tree-item>
            </y-tree-item>
        </y-tree>
    `,
};

export const WithIcons = {
    render: () => `
        <y-tree style="width:300px">
            <y-tree-item expanded>
                <y-icon slot="icon" name="folder" size="small"></y-icon>
                <span slot="label">Documents</span>
                <y-badge slot="suffix" value="2"></y-badge>
                <y-tree-item slot="children" selected>
                    <y-icon slot="icon" name="bookmark" size="small"></y-icon>
                    <span slot="label">Report.pdf</span>
                </y-tree-item>
                <y-tree-item slot="children">
                    <y-icon slot="icon" name="bookmark" size="small"></y-icon>
                    <span slot="label">Notes.txt</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item>
                <y-icon slot="icon" name="image" size="small"></y-icon>
                <span slot="label">Images</span>
                <y-tree-item slot="children">
                    <y-icon slot="icon" name="bookmark" size="small"></y-icon>
                    <span slot="label">photo.jpg</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item>
                <y-icon slot="icon" name="archive" size="small"></y-icon>
                <span slot="label">Archive</span>
            </y-tree-item>
        </y-tree>
    `,
};

export const RouteMatching = {
    parameters: {
        docs: {
            description: {
                story:
                    "`route-match=\"prefix\"` highlights the deepest ancestor whose `href` is a path-segment prefix of the current location, useful for documentation sidebars where a section heading should stay highlighted while a nested page is open. The buttons below stay client-side only via `e.preventDefault()` on the `navigate` event.",
            },
        },
    },
    render: () => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:16px;align-items:flex-start";

        const log = document.createElement("div");
        log.style.cssText =
            "padding:12px;font-family:monospace;font-size:0.8em;background:#1a1a1a;color:#ccc;border-radius:4px;min-width:240px;flex-shrink:0";
        log.textContent = "Pick a route…";

        const tree = document.createElement("y-tree");
        tree.setAttribute("route-match", "prefix");
        tree.style.width = "280px";
        tree.innerHTML = `
            <y-tree-item href="/docs" expanded>
                <y-icon slot="icon" name="book" size="small"></y-icon>
                <span slot="label">Docs</span>
                <y-tree-item slot="children" href="/docs/install">
                    <span slot="label">Installation</span>
                </y-tree-item>
                <y-tree-item slot="children" href="/docs/quickstart">
                    <span slot="label">Quick Start</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item href="/api">
                <y-icon slot="icon" name="code" size="small"></y-icon>
                <span slot="label">API Reference</span>
            </y-tree-item>
        `;

        tree.addEventListener("navigate", (e) => {
            e.preventDefault();
            log.innerHTML = `<b>navigate</b> to <code>${e.detail.href}</code><br><em>(intercepted)</em>`;
        });
        tree.addEventListener("select", (e) => {
            const href = e.detail.href || "(no href)";
            log.innerHTML += `<br><b>select</b>: ${href}`;
        });

        wrap.appendChild(tree);
        wrap.appendChild(log);
        return wrap;
    },
};

export const Nested = {
    render: () => `
        <y-tree style="width:280px">
            <y-tree-item expanded>
                <span slot="label">Level 1</span>
                <y-tree-item slot="children" expanded>
                    <span slot="label">Level 2</span>
                    <y-tree-item slot="children" expanded>
                        <span slot="label">Level 3</span>
                        <y-tree-item slot="children">
                            <span slot="label">Level 4 leaf</span>
                        </y-tree-item>
                    </y-tree-item>
                </y-tree-item>
            </y-tree-item>
        </y-tree>
    `,
};

export const NavigateEvent = {
    name: "Navigate Event (SPA)",
    render: () => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:16px;align-items:flex-start";

        const log = document.createElement("div");
        log.style.cssText =
            "padding:12px;font-family:monospace;font-size:0.8em;background:#1a1a1a;color:#ccc;border-radius:4px;min-width:220px;flex-shrink:0";
        log.textContent = "Click a link item…";

        const tree = document.createElement("y-tree");
        tree.style.width = "280px";
        tree.innerHTML = `
            <y-tree-item expanded>
                <span slot="label">Docs</span>
                <y-tree-item slot="children" href="/docs/install">
                    <span slot="label">Installation</span>
                </y-tree-item>
                <y-tree-item slot="children" href="/docs/quickstart">
                    <span slot="label">Quick Start</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item href="/api">
                <span slot="label">API Reference</span>
            </y-tree-item>
        `;

        tree.addEventListener("navigate", (e) => {
            e.preventDefault();
            log.innerHTML =
                `<b>navigate</b> intercepted<br>href: ${e.detail.href}<br><br><em>Cancelled via e.preventDefault()</em>`;
        });

        wrap.appendChild(tree);
        wrap.appendChild(log);
        return wrap;
    },
};

export const Disabled = {
    render: () => `
        <y-tree style="width:280px">
            <y-tree-item expanded>
                <span slot="label">Available</span>
                <y-tree-item slot="children">
                    <span slot="label">Item A</span>
                </y-tree-item>
                <y-tree-item slot="children" disabled>
                    <span slot="label">Item B (disabled)</span>
                </y-tree-item>
                <y-tree-item slot="children">
                    <span slot="label">Item C</span>
                </y-tree-item>
            </y-tree-item>
            <y-tree-item disabled>
                <span slot="label">Locked branch</span>
                <y-tree-item slot="children">
                    <span slot="label">Hidden behind disabled parent</span>
                </y-tree-item>
            </y-tree-item>
        </y-tree>
    `,
};
