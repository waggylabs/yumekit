import "./y-toggle.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const VIEW_OPTIONS = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
    { value: "table", label: "Table" },
];

const json = (value) => JSON.stringify(value).replace(/"/g, "&quot;");

export default {
    title: "Input/Toggle",
    tags: ["autodocs"],
    argTypes: {
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Segment padding, gap, and icon size.",
            table: { defaultValue: { summary: "medium" } },
        },
        variant: {
            control: "select",
            options: ["solid", "outline", "flat"],
            description:
                "Track and selection treatment, matching the y-button variant of the same name.",
            table: { defaultValue: { summary: "solid" } },
        },
        color: {
            control: "select",
            options: [
                "base",
                "primary",
                "secondary",
                "success",
                "warning",
                "error",
                "help",
            ],
            description: "Color role marking the selected segment.",
            table: { defaultValue: { summary: "primary" } },
        },
        orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
            description: "Axis the segments and thumb travel along.",
            table: { defaultValue: { summary: "horizontal" } },
        },
        value: {
            control: "text",
            description: "Selected option value.",
        },
        animate: {
            control: "boolean",
            description: "Slide the thumb between segments.",
            table: { defaultValue: { summary: "true" } },
        },
        fullWidth: {
            control: "boolean",
            description: "Fill the container with equal-width segments.",
        },
        disabled: {
            control: "boolean",
            description: "Disable the whole group.",
        },
    },
    args: {
        size: "medium",
        variant: "solid",
        color: "primary",
        orientation: "horizontal",
        value: "list",
        animate: true,
        fullWidth: false,
        disabled: false,
    },
    render: ({
        size,
        variant,
        color,
        orientation,
        value,
        animate,
        fullWidth,
        disabled,
    }) => `
        <y-toggle
            size="${size}"
            variant="${variant}"
            ${color ? `color="${color}"` : ""}
            orientation="${orientation}"
            value="${value}"
            animate="${animate}"
            ${fullWidth ? "full-width" : ""}
            ${disabled ? "disabled" : ""}
            aria-label="View mode"
            options="${json(VIEW_OPTIONS)}"
        ></y-toggle>
    `,
};

export const Default = {};

export const Variants = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <y-toggle variant="solid" aria-label="Solid" options="${json(VIEW_OPTIONS)}"></y-toggle>
            <y-toggle variant="outline" aria-label="Outline" options="${json(VIEW_OPTIONS)}"></y-toggle>
            <y-toggle variant="flat" aria-label="Flat" options="${json(VIEW_OPTIONS)}"></y-toggle>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <y-toggle size="small" aria-label="Small" options="${json(VIEW_OPTIONS)}"></y-toggle>
            <y-toggle size="medium" aria-label="Medium" options="${json(VIEW_OPTIONS)}"></y-toggle>
            <y-toggle size="large" aria-label="Large" options="${json(VIEW_OPTIONS)}"></y-toggle>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            ${["base", "primary", "secondary", "success", "warning", "error", "help"]
                .map(
                    (color) => `
            <y-toggle color="${color}" aria-label="${color}" options="${json(VIEW_OPTIONS)}"></y-toggle>`,
                )
                .join("")}
        </div>
    `,
};

export const PerOptionColors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <y-toggle
                aria-label="Status"
                options="${json([
                    { value: "todo", label: "To do", color: "base" },
                    { value: "active", label: "Active", color: "warning" },
                    { value: "blocked", label: "Blocked", color: "error" },
                    { value: "done", label: "Done", color: "success" },
                ])}"
            ></y-toggle>
            <y-toggle
                variant="outline"
                aria-label="Status, outlined"
                options="${json([
                    { value: "todo", label: "To do", color: "base" },
                    { value: "active", label: "Active", color: "warning" },
                    { value: "blocked", label: "Blocked", color: "error" },
                    { value: "done", label: "Done", color: "success" },
                ])}"
            ></y-toggle>
        </div>
    `,
};

export const WithIcons = {
    render: () => `
        <y-toggle
            aria-label="View mode"
            options="${json([
                { value: "list", label: "List", icon: "list-bullet" },
                { value: "grid", label: "Grid", icon: "grid" },
                { value: "table", label: "Table", icon: "table" },
            ])}"
        ></y-toggle>
    `,
};

export const IconOnly = {
    render: () => `
        <y-toggle
            aria-label="Alignment"
            options="${json([
                { value: "left", icon: "arrow-left", ariaLabel: "Align left" },
                { value: "center", icon: "swap", ariaLabel: "Align center" },
                { value: "right", icon: "arrow-right", ariaLabel: "Align right" },
            ])}"
        ></y-toggle>
    `,
};

export const Vertical = {
    render: () => `
        <y-toggle
            orientation="vertical"
            aria-label="View mode"
            options="${json(VIEW_OPTIONS)}"
        ></y-toggle>
    `,
};

export const FullWidth = {
    render: () => `
        <div style="width:420px">
            <y-toggle full-width aria-label="Billing period" options="${json([
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
            ])}"></y-toggle>
        </div>
    `,
};

export const DisabledOption = {
    render: () => `
        <y-toggle
            aria-label="Plan"
            options="${json([
                { value: "free", label: "Free" },
                { value: "pro", label: "Pro" },
                { value: "enterprise", label: "Enterprise", disabled: true },
            ])}"
        ></y-toggle>
    `,
};

export const NoAnimation = {
    render: () => `
        <y-toggle
            animate="false"
            aria-label="View mode"
            options="${json(VIEW_OPTIONS)}"
        ></y-toggle>
    `,
};

export const InAForm = {
    render: () => `
        <form id="toggle-form" style="display:flex;flex-direction:column;gap:16px;align-items:flex-start">
            <y-toggle
                name="view"
                value="grid"
                aria-label="View mode"
                options="${json(VIEW_OPTIONS)}"
            ></y-toggle>
            <output id="toggle-output" style="font-family:var(--font-family-body)"></output>
            <script>
                (() => {
                    const form = document.getElementById("toggle-form");
                    const out = document.getElementById("toggle-output");
                    const update = () => {
                        out.textContent =
                            "view = " + (new FormData(form).get("view") ?? "(unset)");
                    };
                    form.addEventListener("change", update);
                    update();
                })();
            </script>
        </form>
    `,
};
