import "./y-breadcrumbs.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const ITEMS_BASIC = JSON.stringify([
    { text: "Home", href: "/" },
    { text: "Products", href: "/products" },
    { text: "Electronics", href: "/products/electronics" },
    { text: "Smartphones" },
]);

const ITEMS_WITH_ICONS = JSON.stringify([
    { text: "Home", href: "/", icon: "home" },
    { text: "Products", href: "/products", icon: "briefcase" },
    { text: "Electronics", href: "/products/electronics" },
    { text: "Smartphones" },
]);

const ITEMS_LONG = JSON.stringify([
    { text: "Home", href: "/" },
    { text: "Products", href: "/products" },
    { text: "Electronics", href: "/products/electronics" },
    { text: "Phones", href: "/products/electronics/phones" },
    { text: "Android", href: "/products/electronics/phones/android" },
    { text: "Samsung", href: "/products/electronics/phones/android/samsung" },
    { text: "Galaxy S25" },
]);

export default {
    title: "Navigation/Breadcrumbs",
    tags: ["autodocs"],
    argTypes: {
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Controls font size and spacing.",
            table: { defaultValue: { summary: "medium" } },
        },
        separator: {
            control: "text",
            description: "Separator character between items. Defaults to a chevron-right icon when unset.",
            table: { defaultValue: { summary: "chevron-right icon" } },
        },
        maxItems: {
            control: "number",
            description:
                "Collapses middle items when count exceeds this value.",
            table: { defaultValue: { summary: "—" } },
        },
    },
    args: {
        size: "medium",
        separator: "",
        maxItems: undefined,
    },
    render: ({ size, separator, maxItems }) => `
        <y-breadcrumbs
            items='${ITEMS_BASIC}'
            size="${size}"
            ${separator ? `separator="${separator}"` : ""}
            ${maxItems ? `max-items="${maxItems}"` : ""}
        ></y-breadcrumbs>
    `,
};

export const Default = {};

export const WithIcons = {
    render: () => `
        <y-breadcrumbs items='${ITEMS_WITH_ICONS}'></y-breadcrumbs>
    `,
};

export const CustomSeparator = {
    render: () => `
        <h3 style="margin:0 0 8px">Text separator</h3>
        <y-breadcrumbs items='${ITEMS_BASIC}' separator=">"></y-breadcrumbs>

        <h3 style="margin:24px 0 8px">Icon separator (via slot)</h3>
        <y-breadcrumbs items='${ITEMS_BASIC}'>
            <y-icon slot="separator" name="chevron-right" size="x-small"></y-icon>
        </y-breadcrumbs>
    `,
};

export const Collapsed = {
    render: () => `
        <p style="margin:0 0 8px; font-size:0.85em; color:#666">7 items collapsed to max-items="3". Click the … button to expand.</p>
        <y-breadcrumbs
            items='${ITEMS_LONG}'
            max-items="3"
        ></y-breadcrumbs>
    `,
};

export const Sizes = {
    render: () => `
        <h3 style="margin:0 0 8px">Small</h3>
        <y-breadcrumbs items='${ITEMS_BASIC}' size="small"></y-breadcrumbs>

        <h3 style="margin:24px 0 8px">Medium (default)</h3>
        <y-breadcrumbs items='${ITEMS_BASIC}' size="medium"></y-breadcrumbs>

        <h3 style="margin:24px 0 8px">Large</h3>
        <y-breadcrumbs items='${ITEMS_BASIC}' size="large"></y-breadcrumbs>
    `,
};

export const SPANavigation = {
    render: () => {
        const container = document.createElement("div");

        container.innerHTML = `
            <p style="margin:0 0 8px; font-size:0.85em; color:#666">Navigate events are intercepted via e.preventDefault() for SPA routing.</p>
            <y-breadcrumbs id="spa-breadcrumbs" items='${ITEMS_BASIC}'></y-breadcrumbs>
            <pre id="spa-log" style="margin-top:12px; padding:12px; background:var(--base-background-component, #f5f5f5); border-radius:4px; font-size:0.85em; min-height:40px"></pre>
        `;

        const log = container.querySelector("#spa-log");
        container
            .querySelector("#spa-breadcrumbs")
            .addEventListener("navigate", (e) => {
                e.preventDefault();
                log.innerHTML = `<b>navigate</b> intercepted<br>href: ${e.detail.href}<br><br><em>Navigation was cancelled via e.preventDefault()</em>`;
            });

        return container;
    },
};

export const CustomIconSlots = {
    render: () => `
        <y-breadcrumbs items='${ITEMS_BASIC}'>
            <y-icon slot="0-icon" name="home" size="small"></y-icon>
            <y-icon slot="separator" name="chevron-right" size="x-small"></y-icon>
        </y-breadcrumbs>
    `,
};
