import "./y-skeleton.js";
import "../y-card/y-card.js";

export default {
    title: "Feedback/Skeleton",
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["text", "circle", "rect"],
            description: "Placeholder shape.",
            table: { defaultValue: { summary: "text" } },
        },
        animation: {
            control: "select",
            options: ["pulse", "wave", "none"],
            description: "Shimmer style.",
            table: { defaultValue: { summary: "pulse" } },
        },
        lines: {
            control: { type: "number", min: 1, max: 8 },
            description: "text variant only: number of line bars.",
            table: { defaultValue: { summary: "1" } },
        },
        width: {
            control: "text",
            description: "Explicit width (any CSS length).",
        },
        height: {
            control: "text",
            description: "Explicit height (any CSS length).",
        },
    },
    args: {
        variant: "text",
        animation: "pulse",
        lines: 3,
    },
    render: (args) => `
        <div style="max-width:320px">
            <y-skeleton
                variant="${args.variant}"
                animation="${args.animation}"
                ${args.variant === "text" ? `lines="${args.lines}"` : ""}
                ${args.width ? `width="${args.width}"` : ""}
                ${args.height ? `height="${args.height}"` : ""}
            ></y-skeleton>
        </div>
    `,
};

export const Text = {
    args: { variant: "text", lines: 3 },
    render: ({ animation, lines }) => `
        <div style="max-width:360px">
            <y-skeleton variant="text" lines="${lines}" animation="${animation}"></y-skeleton>
        </div>
    `,
};

export const Variants = {
    render: () => `
        <div style="display:flex;gap:24px;align-items:center;max-width:520px">
            <y-skeleton variant="circle" width="56px"></y-skeleton>
            <y-skeleton variant="rect" width="120px" height="80px"></y-skeleton>
            <div style="flex:1"><y-skeleton variant="text" lines="3"></y-skeleton></div>
        </div>
    `,
};

export const Animations = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:20px;max-width:360px;font-family:var(--font-family-body)">
            ${["pulse", "wave", "none"]
                .map(
                    (a) => `
                <div>
                    <small style="color:var(--base-content-light)">${a}</small>
                    <y-skeleton variant="rect" height="48px" animation="${a}"></y-skeleton>
                </div>`,
                )
                .join("")}
        </div>
    `,
};

export const SizedByContent = {
    name: "Sized by slotted content",
    render: () => `
        <div style="display:flex;gap:16px;align-items:center">
            <y-skeleton variant="rect">
                <img src="https://placehold.co/210x118" width="210" height="118" alt="" />
            </y-skeleton>
            <y-skeleton variant="circle">
                <img src="https://placehold.co/64x64" width="64" height="64" alt="" />
            </y-skeleton>
        </div>
    `,
};

export const UserRow = {
    name: "Composed: user row",
    render: () => `
        <div style="display:flex;gap:16px;align-items:center;max-width:360px">
            <y-skeleton variant="circle" width="48px"></y-skeleton>
            <div style="flex:1;display:flex;flex-direction:column;gap:8px">
                <y-skeleton variant="text" width="60%"></y-skeleton>
                <y-skeleton variant="text" width="90%"></y-skeleton>
            </div>
        </div>
    `,
};

export const Card = {
    name: "Composed: card placeholder",
    render: () => `
        <y-card style="max-width:300px" aria-busy="true">
            <y-skeleton variant="rect" height="160px"></y-skeleton>
            <div style="display:flex;flex-direction:column;gap:10px;padding:16px">
                <y-skeleton variant="text" width="70%" height="1.25em"></y-skeleton>
                <y-skeleton variant="text" lines="3"></y-skeleton>
            </div>
        </y-card>
    `,
};
