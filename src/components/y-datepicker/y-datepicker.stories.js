import "./y-datepicker.js";
import "../../icons/all.js";

export default {
    title: "Components/Datepicker",
    tags: ["autodocs"],
    argTypes: {
        mode: {
            control: "select",
            options: ["single", "range"],
            description: "Single date or date range selection.",
            table: { defaultValue: { summary: "single" } },
        },
        value: {
            control: "text",
            description: "ISO date string, or comma-separated pair for range mode.",
        },
        min: {
            control: "text",
            description: "Minimum selectable date (ISO string).",
        },
        max: {
            control: "text",
            description: "Maximum selectable date (ISO string).",
        },
        format: {
            control: "text",
            description: "Display format string. Tokens: YYYY MM DD HH hh mm ss A a",
            table: { defaultValue: { summary: "MM/DD/YYYY" } },
        },
        color: {
            control: "select",
            options: ["base", "primary", "secondary", "success", "warning", "error", "help"],
            description: "Color theme for selected dates.",
            table: { defaultValue: { summary: "primary" } },
        },
        showTime: {
            control: "boolean",
            description: "Show the hour time picker.",
            table: { defaultValue: { summary: "false" } },
        },
        showMinutes: {
            control: "boolean",
            description: "Show minutes column in the time picker.",
            table: { defaultValue: { summary: "false" } },
        },
        showSeconds: {
            control: "boolean",
            description: "Show seconds column in the time picker.",
            table: { defaultValue: { summary: "false" } },
        },
        showYears: {
            control: "boolean",
            description: "Show the year select in the header.",
            table: { defaultValue: { summary: "true" } },
        },
        showMonths: {
            control: "boolean",
            description: "Show the month select in the header.",
            table: { defaultValue: { summary: "true" } },
        },
        showDays: {
            control: "boolean",
            description: "Show the day grid.",
            table: { defaultValue: { summary: "true" } },
        },
    },
    args: {
        mode: "single",
        color: "primary",
        format: "MM/DD/YYYY",
        showTime: false,
        showMinutes: false,
        showSeconds: false,
        showYears: true,
        showMonths: true,
        showDays: true,
    },
    render: (args) => {
        const attrs = [
            `mode="${args.mode}"`,
            `color="${args.color}"`,
            `format="${args.format}"`,
            args.value ? `value="${args.value}"` : "",
            args.min ? `min="${args.min}"` : "",
            args.max ? `max="${args.max}"` : "",
            args.showTime ? "show-time" : "",
            args.showMinutes ? "show-minutes" : "",
            args.showSeconds ? "show-seconds" : "",
            args.showYears === false ? `show-years="false"` : "",
            args.showMonths === false ? `show-months="false"` : "",
            args.showDays === false ? `show-days="false"` : "",
        ].filter(Boolean).join(" ");
        return `<y-datepicker ${attrs}></y-datepicker>`;
    },
};

/** Default single-date picker. */
export const SingleDate = {};

/** Date range picker — shows two calendars side by side. */
export const DateRange = {
    args: { mode: "range" },
};

/** With preselected date. */
export const WithValue = {
    args: { value: "2026-03-15T12:00:00.000Z" },
};

/** Range with preselected start and end. */
export const RangeWithValue = {
    args: {
        mode: "range",
        value: "2026-03-10T12:00:00.000Z,2026-03-20T12:00:00.000Z",
    },
};

/** With hour-level time picker. */
export const WithTime = {
    args: { showTime: true },
};

/** Full time picker with hours, minutes, and seconds. */
export const WithFullTime = {
    args: { showTime: true, showMinutes: true, showSeconds: true },
};

/** Range picker with time. */
export const RangeWithTime = {
    args: { mode: "range", showTime: true },
};

/** Min and max date constraints. */
export const WithMinMax = {
    args: { min: "2026-03-01", max: "2026-03-31" },
};

/** Month-only picker — hides the day grid. */
export const MonthPicker = {
    args: { showDays: false },
};

/** Year-only picker. */
export const YearPicker = {
    args: { showDays: false, showMonths: false },
};

/** Custom color theme. */
export const SuccessColor = {
    args: { color: "success", value: "2026-03-15T12:00:00.000Z" },
};

/** Custom date format. */
export const CustomFormat = {
    args: { format: "DD/MM/YYYY", value: "2026-03-15T12:00:00.000Z" },
};

/** Interactive playground. */
export const Playground = {};
