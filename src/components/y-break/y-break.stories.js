import "./y-break.js";
import "../y-icon/y-icon.js";
import "../y-tag/y-tag.js";

export default {
    title: "Layout/Break",
    tags: ["autodocs"],
    argTypes: {
        orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
            description: "Direction the line is drawn.",
            table: { defaultValue: { summary: "horizontal" } },
        },
        align: {
            control: "select",
            options: ["start", "center", "end"],
            description:
                "Position of the slotted break content along the line.",
            table: { defaultValue: { summary: "center" } },
        },
        variant: {
            control: "select",
            options: ["solid", "dashed", "dotted"],
            description: "Line style.",
            table: { defaultValue: { summary: "solid" } },
        },
        label: {
            control: "text",
            description: "Convenience text rendered in the center.",
        },
        icon: {
            control: "text",
            description: "Convenience icon name rendered in the center.",
        },
        inset: {
            control: "select",
            options: ["none", "small", "medium", "large"],
            description: "Padding applied to the outer ends of the line(s).",
            table: { defaultValue: { summary: "none" } },
        },
    },
    args: {
        orientation: "horizontal",
        align: "center",
        variant: "solid",
        label: "",
        icon: "",
        inset: "none",
    },
    render: ({ orientation, align, variant, label, icon, inset }) => `
        <div style="width:400px;${orientation === "vertical" ? "height:60px;display:flex;align-items:stretch" : ""}">
            <y-break
                orientation="${orientation}"
                align="${align}"
                variant="${variant}"
                inset="${inset}"
                ${label ? `label="${label}"` : ""}
                ${icon ? `icon="${icon}"` : ""}
            ></y-break>
        </div>
    `,
};

export const Default = {};

export const WithLabel = {
    args: { label: "OR" },
};

export const WithIcon = {
    args: { icon: "star" },
};

export const IconAndLabel = {
    args: { icon: "star", label: "Featured" },
};

export const Variants = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px;width:400px">
            <y-break variant="solid" label="Solid"></y-break>
            <y-break variant="dashed" label="Dashed"></y-break>
            <y-break variant="dotted" label="Dotted"></y-break>
        </div>
    `,
};

export const Alignments = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px;width:400px">
            <y-break align="start" label="Start"></y-break>
            <y-break align="center" label="Center"></y-break>
            <y-break align="end" label="End"></y-break>
        </div>
    `,
};

export const Insets = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px;width:400px;padding:8px">
            <y-break inset="none" label="None"></y-break>
            <y-break inset="small" label="Small"></y-break>
            <y-break inset="medium" label="Medium"></y-break>
            <y-break inset="large" label="Large"></y-break>
        </div>
    `,
};

export const Vertical = {
    render: () => `
        <div style="display:flex;align-items:stretch;height:80px;gap:16px">
            <span>Left</span>
            <y-break orientation="vertical"></y-break>
            <span>Middle</span>
            <y-break orientation="vertical" label="OR"></y-break>
            <span>Right</span>
        </div>
    `,
};

export const SlottedContent = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:24px;width:400px">
            <y-break>
                <y-tag color="primary" size="small">New section</y-tag>
            </y-break>
            <y-break>
                <strong>Custom HTML</strong>
            </y-break>
        </div>
    `,
};

export const Plain = {
    render: () => `
        <div style="width:400px">
            <y-break></y-break>
        </div>
    `,
};
