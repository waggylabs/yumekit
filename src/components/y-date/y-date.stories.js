import "./y-date.js";
import "../../icons/all.js";

export default {
    title: "Input/Date",
    tags: ["autodocs"],
    decorators: [
        (story) =>
            `<div style="min-height: 420px; padding: 16px;">${story()}</div>`,
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
            description:
                "Display format. Tokens: YYYY MM DD HH hh mm ss A a. Leave blank to use the automatic default (includes time tokens when show-hours / show-minutes / show-seconds are set).",
            table: {
                defaultValue: {
                    summary: "MM/DD/YYYY (time-aware when applicable)",
                },
            },
        },
        placeholder: {
            control: "text",
            description: "Placeholder text when no date is selected.",
        },
        value: {
            control: "text",
            description:
                "ISO date string (or comma-separated pair for range mode).",
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
            description: "Color theme for the datepicker.",
            table: { defaultValue: { summary: "primary" } },
        },
        clearable: {
            control: "boolean",
            description: "Show a clear button when a value is set.",
            table: { defaultValue: { summary: "false" } },
        },
        nativeMobile: {
            control: "boolean",
            description:
                "When true, renders native date inputs on mobile instead of the datepicker popup.",
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
        showHours: {
            control: "boolean",
            description: "Show hour time picker.",
            table: { defaultValue: { summary: "false" } },
        },
        showMinutes: {
            control: "boolean",
            description: "Show minutes column.",
            table: { defaultValue: { summary: "false" } },
        },
        showSeconds: {
            control: "boolean",
            description: "Show seconds column.",
            table: { defaultValue: { summary: "false" } },
        },
        hourFormat: {
            control: "select",
            options: ["12", "24"],
            description: "Hour display format.",
            table: { defaultValue: { summary: "12" } },
        },
        minuteInterval: {
            control: "number",
            description: "Step interval for the minutes column.",
            table: { defaultValue: { summary: "5" } },
        },
        secondInterval: {
            control: "number",
            description: "Step interval for the seconds column.",
            table: { defaultValue: { summary: "5" } },
        },
    },
    args: {
        mode: "single",
        size: "medium",
        format: "",
        color: "primary",
        value: "2026-06-15T12:00:00.000Z",
        clearable: false,
        nativeMobile: false,
        disabled: false,
        invalid: false,
        showHours: false,
        showMinutes: false,
        showSeconds: false,
        hourFormat: "12",
        minuteInterval: 5,
        secondInterval: 5,
    },
    render: (args) => {
        const attrs = [
            `mode="${args.mode}"`,
            `size="${args.size}"`,
            // Only pass format when explicitly set â€” the component derives a
            // time-aware default from show-hours/show-minutes/show-seconds otherwise
            args.format ? `format="${args.format}"` : "",
            `color="${args.color}"`,
            args.value ? `value="${args.value}"` : "",
            args.placeholder ? `placeholder="${args.placeholder}"` : "",
            args.clearable ? "clearable" : "",
            args.nativeMobile ? "native-mobile" : "",
            args.disabled ? "disabled" : "",
            args.invalid ? "invalid" : "",
            args.showHours ? "show-hours" : "",
            args.showMinutes ? "show-minutes" : "",
            args.showSeconds ? "show-seconds" : "",
            args.hourFormat === "24" ? `hour-format="24"` : "",
            args.minuteInterval !== 5
                ? `minute-interval="${args.minuteInterval}"`
                : "",
            args.secondInterval !== 5
                ? `second-interval="${args.secondInterval}"`
                : "",
        ]
            .filter(Boolean)
            .join(" ");
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
        (story) =>
            `<div style="min-height: 520px; padding: 16px;">${story()}</div>`,
    ],
    args: { showHours: true, value: "2026-06-15T14:30:00.000Z" },
};

/** Clearable â€” shows an âœ• button once a date is selected. */
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

/** Native mobile input â€” renders native date inputs below the mobile breakpoint instead of the datepicker popup. Resize the viewport below 768px to see the effect. */
export const NativeMobile = {
    args: {
        nativeMobile: true,
        clearable: true,
        value: "2026-06-15T12:00:00.000Z",
    },
};

/** Native mobile range â€” renders two native date inputs in range mode on mobile. */
export const NativeMobileRange = {
    args: { mode: "range", nativeMobile: true },
};
