import "./y-avatar.js";

export default {
    title: "Data/Avatar",
    tags: ["autodocs"],
    argTypes: {
        alt: {
            control: "text",
            description: "Initials or full name used as fallback text. Two initials are derived from two words.",
            table: { defaultValue: { summary: "AN" } },
        },
        src: {
            control: "text",
            description: "Image URL. When set, renders an image instead of initials.",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Background color for the initials avatar.",
            table: { defaultValue: { summary: "primary" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Avatar size.",
            table: { defaultValue: { summary: "medium" } },
        },
        shape: {
            control: "select",
            options: ["circle", "square", "rounded"],
            description: "Border radius shape.",
            table: { defaultValue: { summary: "circle" } },
        },
        loading: {
            control: "boolean",
            description: "Renders a skeleton placeholder (sized to `size`, shaped by `shape`) in place of the image/initials.",
            table: { defaultValue: { summary: "false" } },
        },
    },
    args: {
        alt: "Jane Doe",
        src: "",
        color: "primary",
        size: "medium",
        shape: "circle",
        loading: false,
    },
    render: ({ alt, src, color, size, shape, loading }) => `
        <y-avatar
            alt="${alt}"
            ${src ? `src="${src}"` : ""}
            color="${color}"
            size="${size}"
            shape="${shape}"
            ${loading ? "loading" : ""}
        ></y-avatar>
    `,
};

export const Default = {};

export const WithImage = {
    args: {
        src: "https://i.pravatar.cc/150?img=47",
        alt: "Jane Doe",
    },
};

export const Initials = {
    args: { alt: "Jane Doe", src: "" },
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <y-avatar alt="BA" color="base"></y-avatar>
            <y-avatar alt="PR" color="primary"></y-avatar>
            <y-avatar alt="SE" color="secondary"></y-avatar>
            <y-avatar alt="SU" color="success"></y-avatar>
            <y-avatar alt="WA" color="warning"></y-avatar>
            <y-avatar alt="ER" color="error"></y-avatar>
            <y-avatar alt="HE" color="help"></y-avatar>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <y-avatar alt="SM" size="small"></y-avatar>
            <y-avatar alt="MD" size="medium"></y-avatar>
            <y-avatar alt="LG" size="large"></y-avatar>
        </div>
    `,
};

export const Shapes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <y-avatar alt="CI" shape="circle"></y-avatar>
            <y-avatar alt="RO" shape="rounded"></y-avatar>
            <y-avatar alt="SQ" shape="square"></y-avatar>
        </div>
    `,
};

export const Loading = {
    args: { loading: true, size: "large" },
    parameters: {
        docs: {
            description: {
                story: "With `loading` set, the avatar renders a `y-skeleton` placeholder sized to `size` and shaped by `shape` (circle here). `loading` takes precedence over `src` and initials.",
            },
        },
    },
};

export const LoadingShapes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center">
            <y-avatar loading shape="circle" size="large"></y-avatar>
            <y-avatar loading shape="rounded" size="large"></y-avatar>
            <y-avatar loading shape="square" size="large"></y-avatar>
        </div>
    `,
    parameters: {
        docs: {
            description: {
                story: "The placeholder takes its radius from the avatar's shape, so rounded and square avatars produce correctly-shaped skeletons.",
            },
        },
    },
};

export const BrokenImageFallback = {
    args: {
        src: "https://example.invalid/missing-avatar.png",
        alt: "Jane Doe",
    },
    parameters: {
        docs: {
            description: {
                story: "When the image at `src` fails to load, the avatar falls back to rendering the initials derived from `alt` instead of showing the browser's broken-image graphic.",
            },
        },
    },
};
