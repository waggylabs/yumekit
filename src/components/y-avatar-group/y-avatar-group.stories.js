import "./y-avatar-group.js";
import "../y-avatar/y-avatar.js";

const sampleAvatars = [
    { alt: "Jane Doe", color: "primary" },
    { alt: "John Smith", color: "secondary" },
    { alt: "Pat Lee", color: "success" },
    { alt: "Sam Ko", color: "warning" },
    { alt: "Alex Yu", color: "error" },
];

export default {
    title: "Data/AvatarGroup",
    tags: ["autodocs"],
    argTypes: {
        orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
            description: "Layout direction.",
            table: { defaultValue: { summary: "horizontal" } },
        },
        overlap: {
            control: { type: "number", min: 0, max: 40, step: 1 },
            description: "Overlap offset in pixels between adjacent avatars.",
            table: { defaultValue: { summary: "2" } },
        },
        "stack-order": {
            control: "select",
            options: ["last", "first"],
            description:
                "Which end sits on top. `last` raises the final avatar; `first` raises the leading one.",
            table: { defaultValue: { summary: "last" } },
        },
        max: {
            control: { type: "number", min: 0, max: 10, step: 1 },
            description:
                "Maximum visible avatars. `0` means unlimited; otherwise a `+N` indicator covers the remainder.",
            table: { defaultValue: { summary: "0" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Size for JSON-rendered avatars.",
            table: { defaultValue: { summary: "medium" } },
        },
    },
    args: {
        orientation: "horizontal",
        overlap: 2,
        "stack-order": "last",
        max: 0,
        size: "medium",
    },
    render: ({
        orientation,
        overlap,
        "stack-order": stackOrder,
        max,
        size,
    }) => `
        <y-avatar-group
            orientation="${orientation}"
            overlap="${overlap}"
            stack-order="${stackOrder}"
            max="${max}"
            size="${size}"
            aria-label="Project members"
        >
            <y-avatar alt="Jane Doe" color="primary" size="${size}"></y-avatar>
            <y-avatar alt="John Smith" color="secondary" size="${size}"></y-avatar>
            <y-avatar alt="Pat Lee" color="success" size="${size}"></y-avatar>
            <y-avatar alt="Sam Ko" color="warning" size="${size}"></y-avatar>
            <y-avatar alt="Alex Yu" color="error" size="${size}"></y-avatar>
        </y-avatar-group>
    `,
};

export const Default = {};

export const Vertical = {
    args: { orientation: "vertical" },
};

export const FirstOnTop = {
    args: { "stack-order": "first" },
};

export const TightOverlap = {
    args: { overlap: 18 },
};

export const NoOverlap = {
    args: { overlap: 0 },
};

export const WithMax = {
    args: { max: 3 },
};

export const FromJson = {
    name: "From JSON",
    args: { max: 0, size: "medium" },
    render: ({ size, max }) => `
        <y-avatar-group
            avatars='${JSON.stringify(sampleAvatars)}'
            size="${size}"
            max="${max}"
            aria-label="Project members"
        ></y-avatar-group>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <y-avatar-group size="small" aria-label="Small group">
                <y-avatar alt="Jane Doe" size="small" color="primary"></y-avatar>
                <y-avatar alt="John Smith" size="small" color="secondary"></y-avatar>
                <y-avatar alt="Pat Lee" size="small" color="success"></y-avatar>
            </y-avatar-group>
            <y-avatar-group size="medium" aria-label="Medium group">
                <y-avatar alt="Jane Doe" color="primary"></y-avatar>
                <y-avatar alt="John Smith" color="secondary"></y-avatar>
                <y-avatar alt="Pat Lee" color="success"></y-avatar>
            </y-avatar-group>
            <y-avatar-group size="large" aria-label="Large group">
                <y-avatar alt="Jane Doe" size="large" color="primary"></y-avatar>
                <y-avatar alt="John Smith" size="large" color="secondary"></y-avatar>
                <y-avatar alt="Pat Lee" size="large" color="success"></y-avatar>
            </y-avatar-group>
        </div>
    `,
};

export const OverflowClickable = {
    name: "Overflow click handler",
    render: () => `
        <y-avatar-group max="3" aria-label="Project members" id="clickable-group">
            <y-avatar alt="Jane Doe" color="primary"></y-avatar>
            <y-avatar alt="John Smith" color="secondary"></y-avatar>
            <y-avatar alt="Pat Lee" color="success"></y-avatar>
            <y-avatar alt="Sam Ko" color="warning"></y-avatar>
            <y-avatar alt="Alex Yu" color="error"></y-avatar>
            <y-avatar alt="Mei Tan" color="help"></y-avatar>
        </y-avatar-group>
        <p id="clickable-group-out" style="margin-top:12px;font-family:sans-serif">
            Click the +N indicator.
        </p>
        <script>
            (function () {
                const g = document.getElementById("clickable-group");
                const out = document.getElementById("clickable-group-out");
                g.addEventListener("y-overflow-click", (e) => {
                    out.textContent = "Overflow clicked: " + e.detail.count + " hidden";
                });
            })();
        </script>
    `,
};
