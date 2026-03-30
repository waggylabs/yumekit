import "./y-tabs.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const defaultOptions = JSON.stringify([
    { id: "tab1", label: "Overview", slot: "tab1" },
    { id: "tab2", label: "Details", slot: "tab2" },
    { id: "tab3", label: "Settings", slot: "tab3" },
]);

export default {
    title: "Components/Tabs",
    tags: ["autodocs"],
    argTypes: {
        options: {
            control: "text",
            description: 'JSON array of `{ id, label, slot, disabled? }` objects.',
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
    },
    args: {
        options: defaultOptions,
        size: "medium",
        position: "top",
    },
    render: ({ options, size, position }) => `
        <y-tabs options='${options}' size="${size}" position="${position}" style="width:400px">
            <div slot="tab1"><p>Overview content goes here.</p></div>
            <div slot="tab2"><p>Details content goes here.</p></div>
            <div slot="tab3"><p>Settings content goes here.</p></div>
        </y-tabs>
    `,
};

export const Default = {};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-tabs options='${defaultOptions}' size="small" style="width:400px">
                <div slot="tab1"><p>Small tabs — overview.</p></div>
                <div slot="tab2"><p>Small tabs — details.</p></div>
                <div slot="tab3"><p>Small tabs — settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' size="medium" style="width:400px">
                <div slot="tab1"><p>Medium tabs — overview.</p></div>
                <div slot="tab2"><p>Medium tabs — details.</p></div>
                <div slot="tab3"><p>Medium tabs — settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' size="large" style="width:400px">
                <div slot="tab1"><p>Large tabs — overview.</p></div>
                <div slot="tab2"><p>Large tabs — details.</p></div>
                <div slot="tab3"><p>Large tabs — settings.</p></div>
            </y-tabs>
        </div>
    `,
};

export const Positions = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-tabs options='${defaultOptions}' position="top" style="width:400px">
                <div slot="tab1"><p>Top position — overview.</p></div>
                <div slot="tab2"><p>Top position — details.</p></div>
                <div slot="tab3"><p>Top position — settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' position="bottom" style="width:400px">
                <div slot="tab1"><p>Bottom position — overview.</p></div>
                <div slot="tab2"><p>Bottom position — details.</p></div>
                <div slot="tab3"><p>Bottom position — settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' position="left" style="width:400px;height:120px">
                <div slot="tab1"><p>Left position — overview.</p></div>
                <div slot="tab2"><p>Left position — details.</p></div>
                <div slot="tab3"><p>Left position — settings.</p></div>
            </y-tabs>
            <y-tabs options='${defaultOptions}' position="right" style="width:400px;height:120px">
                <div slot="tab1"><p>Right position — overview.</p></div>
                <div slot="tab2"><p>Right position — details.</p></div>
                <div slot="tab3"><p>Right position — settings.</p></div>
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
                { id: "home", label: "Home", slot: "home" },
                { id: "user", label: "Profile", slot: "user" },
                { id: "settings", label: "Settings", slot: "settings" },
            ])}'
            style="width:400px"
        >
            <y-icon slot="left-icon-home" name="home" size="small"></y-icon>
            <y-icon slot="left-icon-user" name="user" size="small"></y-icon>
            <y-icon slot="left-icon-settings" name="settings" size="small"></y-icon>
            <div slot="home"><p>Home content.</p></div>
            <div slot="user"><p>Profile content.</p></div>
            <div slot="settings"><p>Settings content.</p></div>
        </y-tabs>
    `,
};
