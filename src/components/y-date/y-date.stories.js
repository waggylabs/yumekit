import "./y-date.js";
import "../../icons/all.js";

export default {
    title: "Components/Date",
    tags: ["autodocs"],
    decorators: [
        (story) => `<div style="min-height: 420px; padding: 16px;">${story()}</div>`,
    ],
    argTypes: {
        mode: {
            control: "select",
            options: ["single", "range"],
            description: "Single date or date range selection.",
            table: { defaultValue: { summary: "single" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Input size.",
            table: { defaultValue: { summary: "medium" } },
        },
        format: {
            control: "text",
            description: "Display format. Tokens: YYYY MM DD HH hh mm ss A a. Leave blank to use the automatic default (includes time tokens when show-time / show-minutes / show-seconds are set).",
            table: { defaultValue: { summary: "MM/DD/YYYY (time-aware when applicable)" } },
        },
        placeholder: {
            control: "text",
            description: "Placeholder text when no date is selected.",
        },
        value: {
            control: "text",
            description: "ISO date string (or comma-separated pair for range mode).",
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for the datepicker.",
            table: { defaultValue: { summary: "primary" } },
        },
        clearable: {
            control: "boolean",
            description: "Show a clear button when a value is set.",
            table: { defaultValue: { summary: "false" } },
        },
        disabled: {
            control: "boolean",
            description: "Disable the field.",
            table: { defaultValue: { summary: "false" } },
        },
        invalid: {
            control: "boolean",
            description: "Mark the field as invalid.",
            table: { defaultValue: { summary: "false" } },
        },
        showTime: {
            control: "boolean",
            description: "Show hour time picker.",
            table: { defaultValue: { summary: "false" } },
        },
        showMinutes: {
            control: "boolean",
            description: "Show minutes column.",
            table: { defaultValue: { summary: "false" } },
        },
    },
    args: {
        mode: "single",
        size: "medium",
        format: "",
        color: "primary",
        value: "",
        clearable: false,
        disabled: false,
        invalid: false,
        showTime: false,
        showMinutes: false,
    },
    render: (args) => {
        const attrs = [
            `mode="${args.mode}"`,
            `size="${args.size}"`,
            // Only pass format when explicitly set — the component derives a
            // time-aware default from show-time/show-minutes/show-seconds otherwise
            args.format ? `format="${args.format}"` : "",
            `color="${args.color}"`,
            args.value ? `value="${args.value}"` : "",
            args.placeholder ? `placeholder="${args.placeholder}"` : "",
            args.clearable ? "clearable" : "",
            args.disabled ? "disabled" : "",
            args.invalid ? "invalid" : "",
            args.showTime ? "show-time" : "",
            args.showMinutes ? "show-minutes" : "",
        ].filter(Boolean).join(" ");
        return `
            <div style="max-width: 340px;">
                <y-date ${attrs}>
                    <span slot="label">Select Date</span>
                </y-date>
            </div>
        `;
    },
};

/** Default single-date input. */
export const Default = {};

/** Date range input. */
export const DateRange = {
    args: { mode: "range" },
};

/** With a preselected value. */
export const WithValue = {
    args: { value: "2026-06-15T12:00:00.000Z" },
};

/** With time picker. */
export const WithTime = {
    decorators: [
        (story) => `<div style="min-height: 520px; padding: 16px;">${story()}</div>`,
    ],
    args: { showTime: true, value: "2026-06-15T14:30:00.000Z" },
};

/** Clearable — shows an ✕ button once a date is selected. */
export const Clearable = {
    args: { clearable: true, value: "2026-06-15T12:00:00.000Z" },
};

/** With min and max constraints. */
export const WithMinMax = {
    args: { min: "2026-03-01", max: "2026-12-31" },
};

/** Different sizes. */
export const Sizes = {
    render: () => `
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 300px;">
            <y-date size="small"><span slot="label">Small</span></y-date>
            <y-date size="medium"><span slot="label">Medium</span></y-date>
            <y-date size="large"><span slot="label">Large</span></y-date>
        </div>
    `,
};

/** Disabled state. */
export const Disabled = {
    args: { disabled: true, value: "2026-06-15T12:00:00.000Z" },
};

/** Invalid state. */
export const Invalid = {
    args: { invalid: true },
};

/** Interactive playground. */
export const Playground = {};
