import "./y-panel.js";
import "./y-panelbar.js";
import "./y-icon.js";
import "../icons/all.js";

export default {
    title: "Components/PanelBar",
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
