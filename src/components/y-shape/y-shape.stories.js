import "./y-shape.js";

const SHAPES = [
    "rectangle",
    "circle",
    "ellipse",
    "star",
    "heart",
    "chat-bubble",
    "times",
    "cross",
];

export default {
    title: "Layout/Shape",
    tags: ["autodocs"],
    argTypes: {
        type: {
            control: "select",
            options: [...SHAPES, "polygon"],
            description: "Geometric shape to apply.",
            table: { defaultValue: { summary: "rectangle" } },
        },
        size: {
            control: "select",
            options: ["sm", "md", "lg"],
            description: "Container size token.",
            table: { defaultValue: { summary: "md" } },
        },
        radius: {
            control: "text",
            description:
                "Shape radius for circle/ellipse, or corner radius for rectangle.",
        },
        fit: {
            control: "select",
            options: ["contain", "cover", "fill"],
            description: "Object-fit for slotted media.",
            table: { defaultValue: { summary: "contain" } },
        },
        "preserve-aspect": {
            control: "boolean",
            description: "Lock the container to a 1:1 aspect ratio.",
        },
        "polygon-points": {
            control: "text",
            description: 'Required when type="polygon".',
        },
    },
    args: {
        type: "star",
        size: "md",
        fit: "cover",
    },
    render: (args) => `
        <y-shape
            type="${args.type}"
            size="${args.size}"
            ${args.radius ? `radius="${args.radius}"` : ""}
            ${args.fit ? `fit="${args.fit}"` : ""}
            ${args["preserve-aspect"] ? "preserve-aspect" : ""}
            ${args["polygon-points"] ? `polygon-points="${args["polygon-points"]}"` : ""}
            style="background: var(--primary-content--); color: var(--primary-content-inverse);"
        >
            <img
                src="https://placehold.co/256x256/4f46e5/ffffff?text=Y"
                alt="Sample"
            />
        </y-shape>
    `,
};

export const Default = {};

export const AllShapes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            ${SHAPES.map(
                (s) => `
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;font-family:var(--font-family-body)">
                    <y-shape type="${s}" style="background: var(--primary-content--);">
                        <img src="https://placehold.co/256x256/4f46e5/ffffff?text=Y" alt="${s}" />
                    </y-shape>
                    <small>${s}</small>
                </div>`,
            ).join("")}
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center">
            <y-shape type="circle" size="sm" style="background: var(--primary-content--);"></y-shape>
            <y-shape type="circle" size="md" style="background: var(--primary-content--);"></y-shape>
            <y-shape type="circle" size="lg" style="background: var(--primary-content--);"></y-shape>
        </div>
    `,
};

export const RoundedRectangle = {
    render: () => `
        <y-shape type="rectangle" radius="20px" size="lg" style="background: var(--secondary-content--);">
            <img src="https://placehold.co/256x256/14b8a6/ffffff?text=YK" alt="" />
        </y-shape>
    `,
};

export const AvatarMask = {
    render: () => `
        <div style="display:flex;gap:16px;align-items:center">
            <y-shape type="circle" preserve-aspect>
                <img src="https://placehold.co/256x256/4f46e5/ffffff?text=JD" alt="Jane Doe" />
            </y-shape>
            <y-shape type="heart" preserve-aspect>
                <img src="https://placehold.co/256x256/e11d48/ffffff?text=%E2%99%A5" alt="" />
            </y-shape>
            <y-shape type="star" preserve-aspect>
                <img src="https://placehold.co/256x256/f59e0b/ffffff?text=%E2%98%85" alt="" />
            </y-shape>
        </div>
    `,
};

export const CustomPolygon = {
    args: {
        type: "polygon",
        "polygon-points": "50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%",
        size: "lg",
    },
    render: ({ type, size, "polygon-points": pts }) => `
        <y-shape
            type="${type}"
            size="${size}"
            polygon-points="${pts}"
            style="background: var(--success-content--);"
        ></y-shape>
    `,
};

export const TextContent = {
    render: () => `
        <y-shape type="chat-bubble" size="lg" style="background: var(--base-background-component); color: var(--base-content--); font-family: var(--font-family-body); padding: 12px; box-sizing: border-box;">
            <div style="text-align:center;padding:8px 12px;">Hello!</div>
        </y-shape>
    `,
};
