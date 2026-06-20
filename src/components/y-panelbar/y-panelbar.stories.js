import "../y-panel/y-panel.js";
import "./y-panelbar.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Navigation/PanelBar",
    tags: ["autodocs"],
    argTypes: {
        exclusive: {
            control: "boolean",
            description: "When true, expanding one panel collapses all siblings.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        exclusive: false,
    },
    render: ({ exclusive }) => `
        <y-panelbar ${exclusive ? "exclusive" : ""} style="width:280px">
            <y-panel>
                <span slot="label">Panel One</span>
                <div slot="children">
                    <y-panel selected>
                        <span slot="label">Child Item A</span>
                    </y-panel>
                    <y-panel>
                        <span slot="label">Child Item B</span>
                    </y-panel>
                </div>
            </y-panel>
            <y-panel expanded>
                <span slot="label">Panel Two</span>
                <div slot="children">
                    <y-panel>
                        <span slot="label">Child Item C</span>
                    </y-panel>
                    <y-panel>
                        <span slot="label">Child Item D</span>
                    </y-panel>
                </div>
            </y-panel>
            <y-panel>
                <span slot="label">Panel Three (no children)</span>
            </y-panel>
        </y-panelbar>
    `,
};

export const Default = {};

export const Exclusive = {
    args: { exclusive: true },
};

export const WithIcons = {
    render: () => `
        <y-panelbar style="width:280px">
            <y-panel expanded>
                <y-icon slot="icon" name="folder" size="small"></y-icon>
                <span slot="label">Documents</span>
                <div slot="children">
                    <y-panel selected>
                        <y-icon slot="icon" name="bookmark" size="small"></y-icon>
                        <span slot="label">Report.pdf</span>
                    </y-panel>
                    <y-panel>
                        <y-icon slot="icon" name="bookmark" size="small"></y-icon>
                        <span slot="label">Notes.txt</span>
                    </y-panel>
                </div>
            </y-panel>
            <y-panel>
                <y-icon slot="icon" name="image" size="small"></y-icon>
                <span slot="label">Images</span>
                <div slot="children">
                    <y-panel>
                        <span slot="label">photo.jpg</span>
                    </y-panel>
                </div>
            </y-panel>
        </y-panelbar>
    `,
};

export const NavigateEvent = {
    name: "Navigate Event (SPA)",
    render: () => {
        const container = document.createElement("div");
        container.style.cssText = "display:flex;gap:16px;align-items:flex-start";

        const log = document.createElement("div");
        log.style.cssText = "padding:12px;font-family:monospace;font-size:0.8em;background:#1a1a1a;color:#ccc;border-radius:4px;min-width:220px;flex-shrink:0";
        log.textContent = "Click a link item…";

        const panelbar = document.createElement("y-panelbar");
        panelbar.id = "spa-panelbar";
        panelbar.style.width = "280px";
        panelbar.innerHTML = `
            <y-panel expanded>
                <span slot="label">Docs</span>
                <div slot="children">
                    <y-panel href="/docs/install">
                        <span slot="label">Installation</span>
                    </y-panel>
                    <y-panel href="/docs/quickstart">
                        <span slot="label">Quick Start</span>
                    </y-panel>
                </div>
            </y-panel>
            <y-panel href="/api">
                <span slot="label">API Reference</span>
            </y-panel>
        `;

        panelbar.addEventListener("navigate", (e) => {
            e.preventDefault();
            log.innerHTML = `<b>navigate</b> intercepted<br>href: ${e.detail.href}<br><br><em>Navigation was cancelled via e.preventDefault()</em>`;
        });

        container.appendChild(panelbar);
        container.appendChild(log);
        return container;
    },
};

export const Nested = {
    render: () => `
        <y-panelbar style="width:280px">
            <y-panel expanded>
                <span slot="label">Level 1</span>
                <div slot="children">
                    <y-panel expanded>
                        <span slot="label">Level 2</span>
                        <div slot="children">
                            <y-panel>
                                <span slot="label">Level 3 Item</span>
                            </y-panel>
                        </div>
                    </y-panel>
                </div>
            </y-panel>
        </y-panelbar>
    `,
};
