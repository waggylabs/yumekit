import "./y-tabs.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const defaultOptions = JSON.stringify([
    { id: "tab1", label: "Overview", slot: "tab1" },
    { id: "tab2", label: "Details", slot: "tab2" },
    { id: "tab3", label: "Settings", slot: "tab3" },
]);

export default {
    title: "Navigation/Tabs",
    tags: ["autodocs"],
    argTypes: {
        options: {
            control: "text",
            description:
                "JSON array of `{ id, label, slot, disabled? }` objects.",
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Controls tab button padding and gap.",
            table: { defaultValue: { summary: "medium" } },
        },
        position: {
            control: "select",
            options: ["top", "bottom", "left", "right"],
            description: "Which edge the tab strip is placed on.",
            table: { defaultValue: { summary: "top" } },
        },
        variant: {
            control: "select",
            options: ["default", "accent"],
            description:
                "Visual style: 'default' (bordered boxes) or 'accent' (minimal tabs with a primary indicator on the active tab's content-facing edge).",
            table: { defaultValue: { summary: "default" } },
        },
    },
    args: {
        options: defaultOptions,
        size: "medium",
        position: "top",
        variant: "default",
    },
    render: ({ options, size, position, variant }) => `
        <y-tabs options='${options}' size="${size}" position="${position}" variant="${variant}" style="width:400px">
            <div slot="tab1"><p>Overview content goes here.</p></div>
            <div slot="tab2"><p>Details content goes here.</p></div>
            <div slot="tab3"><p>Settings content goes here.</p></div>
        </y-tabs>
    `,
};

export const Default = {};

export const Accent = {
    name: "Accent variant",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-tabs options='${defaultOptions}' variant="accent" style="width:400px">
                <div slot="tab1"><p>Accent tabs — overview.</p></div>
                <div slot="tab2"><p>Accent tabs — details.</p></div>
                <div slot="tab3"><p>Accent tabs — settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' variant="accent" position="left" style="width:400px">
                <div slot="tab1"><p>Left accent tabs — overview.</p></div>
                <div slot="tab2"><p>Left accent tabs — details.</p></div>
                <div slot="tab3"><p>Left accent tabs — settings.</p></div>
            </y-tabs>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-tabs options='${defaultOptions}' size="small" style="width:400px">
                <div slot="tab1"><p>Small tabs â€” overview.</p></div>
                <div slot="tab2"><p>Small tabs â€” details.</p></div>
                <div slot="tab3"><p>Small tabs â€” settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' size="medium" style="width:400px">
                <div slot="tab1"><p>Medium tabs â€” overview.</p></div>
                <div slot="tab2"><p>Medium tabs â€” details.</p></div>
                <div slot="tab3"><p>Medium tabs â€” settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' size="large" style="width:400px">
                <div slot="tab1"><p>Large tabs â€” overview.</p></div>
                <div slot="tab2"><p>Large tabs â€” details.</p></div>
                <div slot="tab3"><p>Large tabs â€” settings.</p></div>
            </y-tabs>
        </div>
    `,
};

export const Positions = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-tabs options='${defaultOptions}' position="top" style="width:400px">
                <div slot="tab1"><p>Top position â€” overview.</p></div>
                <div slot="tab2"><p>Top position â€” details.</p></div>
                <div slot="tab3"><p>Top position â€” settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' position="bottom" style="width:400px">
                <div slot="tab1"><p>Bottom position â€” overview.</p></div>
                <div slot="tab2"><p>Bottom position â€” details.</p></div>
                <div slot="tab3"><p>Bottom position â€” settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' position="left" style="width:400px;height:120px">
                <div slot="tab1"><p>Left position â€” overview.</p></div>
                <div slot="tab2"><p>Left position â€” details.</p></div>
                <div slot="tab3"><p>Left position â€” settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' position="right" style="width:400px;height:120px">
                <div slot="tab1"><p>Right position â€” overview.</p></div>
                <div slot="tab2"><p>Right position â€” details.</p></div>
                <div slot="tab3"><p>Right position â€” settings.</p></div>
            </y-tabs>
        </div>
    `,
};

export const WithDisabledTab = {
    render: () => `
        <y-tabs
            options='${JSON.stringify([
                { id: "tab1", label: "Active", slot: "tab1" },
                { id: "tab2", label: "Disabled", slot: "tab2", disabled: true },
                { id: "tab3", label: "Also Active", slot: "tab3" },
            ])}'
            style="width:400px"
        >
            <div slot="tab1"><p>First tab content.</p></div>
            <div slot="tab2"><p>This tab is disabled.</p></div>
            <div slot="tab3"><p>Third tab content.</p></div>
        </y-tabs>
    `,
};

export const WithIcons = {
    render: () => `
        <y-tabs
            options='${JSON.stringify([
                { id: "home", label: "Home", slot: "home", leftIcon: "home" },
                {
                    id: "user",
                    label: "Profile",
                    slot: "user",
                    leftIcon: "user",
                },
                {
                    id: "settings",
                    label: "Settings",
                    slot: "settings",
                    leftIcon: "gear",
                },
            ])}'
            style="width:400px"
        >
            <div slot="home"><p>Home content.</p></div>
            <div slot="user"><p>Profile content.</p></div>
            <div slot="settings"><p>Settings content.</p></div>
        </y-tabs>
    `,
};

export const WithTabContentSlot = {
    render: () => `
        <y-tabs
            options='${JSON.stringify([
                { id: "home", label: "Home", slot: "home" },
                { id: "user", label: "Profile", slot: "user" },
                { id: "settings", label: "Settings", slot: "settings" },
            ])}'
            style="width:400px"
        >
            <span slot="tab-content-home" style="display:inline-flex;align-items:center;gap:4px">
                <y-icon name="home" size="small"></y-icon> Home
            </span>
            <span slot="tab-content-user" style="display:inline-flex;align-items:center;gap:4px">
                <y-icon name="user" size="small"></y-icon> Profile
            </span>
            <span slot="tab-content-settings" style="display:inline-flex;align-items:center;gap:4px">
                <y-icon name="gear" size="small"></y-icon> Settings
            </span>
            <div slot="home"><p>Home content.</p></div>
            <div slot="user"><p>Profile content.</p></div>
            <div slot="settings"><p>Settings content.</p></div>
        </y-tabs>
    `,
};
