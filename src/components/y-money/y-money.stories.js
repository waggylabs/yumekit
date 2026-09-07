import "./y-money.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Input/Money",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description:
                "Canonical decimal string — always `.` and no grouping, whatever the locale.",
        },
        currency: {
            control: "select",
            options: ["USD", "EUR", "GBP", "JPY", "KWD", "BRL"],
            description:
                "ISO 4217 code. Drives the symbol and the default precision.",
            table: { defaultValue: { summary: "USD" } },
        },
        locale: {
            control: "select",
            options: ["en-US", "de-DE", "fr-FR", "ja-JP", "pt-BR"],
            description: "BCP 47 tag controlling separators and placement.",
        },
        display: {
            control: "select",
            options: ["symbol", "code", "name", "none"],
            description: "How the currency reads in the idle display.",
            table: { defaultValue: { summary: "symbol" } },
        },
        step: {
            control: "text",
            description: "Arrow-key increment as a decimal string.",
            table: { defaultValue: { summary: "1" } },
        },
        allowNegative: {
            control: "boolean",
            description: "Whether a leading minus is accepted.",
            table: { defaultValue: { summary: false } },
        },
        negativeStyle: {
            control: "select",
            options: ["minus", "parentheses"],
            description: "Idle rendering of negative amounts.",
            table: { defaultValue: { summary: "minus" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Field size.",
            table: { defaultValue: { summary: "medium" } },
        },
        disabled: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        value: "1234.56",
        currency: "USD",
        locale: "en-US",
        display: "symbol",
        step: "1",
        allowNegative: false,
        negativeStyle: "minus",
        size: "medium",
        disabled: false,
        invalid: false,
    },
    render: ({
        value,
        currency,
        locale,
        display,
        step,
        allowNegative,
        negativeStyle,
        size,
        disabled,
        invalid,
        label,
    }) => `
        <y-money
            currency="${currency}"
            locale="${locale}"
            display="${display}"
            step="${step}"
            size="${size}"
            negative-style="${negativeStyle}"
            ${value ? `value="${value}"` : ""}
            ${allowNegative ? "allow-negative" : ""}
            ${disabled ? "disabled" : ""}
            ${invalid ? "invalid" : ""}
            style="width:300px"
        >
            ${label ? `<span slot="label">${label}</span>` : ""}
        </y-money>
    `,
};

export const Default = {};

export const WithLabel = {
    args: { label: "Price" },
};

export const FocusToEdit = {
    name: "Focus to edit",
    parameters: {
        docs: {
            description: {
                story: "Idle the field shows the formatted amount. Focus it and the value swaps to a plain number so editing never has to fight a moving caret; blur reformats.",
            },
        },
    },
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-money value="1234.56" locale="en-US">
                <span slot="label">Click into me</span>
            </y-money>
        </div>
    `,
};

export const Currencies = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:320px">
            <y-money value="1234.56" currency="USD" locale="en-US">
                <span slot="label">USD — 2 decimals</span>
            </y-money>
            <y-money value="1234.56" currency="EUR" locale="de-DE">
                <span slot="label">EUR / de-DE — comma decimal</span>
            </y-money>
            <y-money value="1234" currency="JPY" locale="ja-JP">
                <span slot="label">JPY — no decimals</span>
            </y-money>
            <y-money value="1.234" currency="KWD" locale="en-US">
                <span slot="label">KWD — 3 decimals</span>
            </y-money>
        </div>
    `,
};

export const DisplayModes = {
    name: "Display modes",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:320px">
            <y-money value="1234.56" display="symbol" locale="en-US">
                <span slot="label">symbol</span>
            </y-money>
            <y-money value="1234.56" display="code" locale="en-US">
                <span slot="label">code</span>
            </y-money>
            <y-money value="1234.56" display="name" locale="en-US">
                <span slot="label">name</span>
            </y-money>
            <y-money value="1234.56" display="none" locale="en-US">
                <span slot="label">none</span>
            </y-money>
        </div>
    `,
};

export const Negatives = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:320px">
            <y-money value="-250" allow-negative locale="en-US">
                <span slot="label">Minus sign</span>
            </y-money>
            <y-money
                value="-250"
                allow-negative
                negative-style="parentheses"
                locale="en-US"
            >
                <span slot="label">Accounting style</span>
            </y-money>
        </div>
    `,
};

export const Stepping = {
    parameters: {
        docs: {
            description: {
                story: "Up and Down arrows step by `step`, clamped to `min` and `max`.",
            },
        },
    },
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:320px">
            <y-money value="10" step="1" locale="en-US">
                <span slot="label">Step 1 (default)</span>
            </y-money>
            <y-money value="10" step="0.25" min="0" max="20" locale="en-US">
                <span slot="label">Step 0.25, clamped 0–20</span>
            </y-money>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-money size="small" value="1234.56" locale="en-US">
                <span slot="label">Small</span>
            </y-money>
            <y-money size="medium" value="1234.56" locale="en-US">
                <span slot="label">Medium</span>
            </y-money>
            <y-money size="large" value="1234.56" locale="en-US">
                <span slot="label">Large</span>
            </y-money>
        </div>
    `,
};

export const Underline = {
    name: "Underline variant",
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-money variant="underline" value="1234.56" locale="en-US">
                <span slot="label">Amount</span>
            </y-money>
        </div>
    `,
};

export const WithIcon = {
    name: "With icon",
    render: () => `
        <y-money value="1234.56" locale="en-US" style="width:300px">
            <span slot="label">Budget</span>
            <y-icon slot="right-icon" name="wallet" size="small"></y-icon>
        </y-money>
    `,
};

export const RangeValidation = {
    name: "Range validation",
    parameters: {
        docs: {
            description: {
                story: "A value outside `min`/`max` is flagged but left as typed — the entry is never silently rewritten.",
            },
        },
    },
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:320px">
            <y-money value="3" min="5" error-text="Minimum order is $5.00" locale="en-US">
                <span slot="label">Below minimum</span>
            </y-money>
        </div>
    `,
};

export const Invalid = {
    args: { invalid: true, label: "Price" },
};

export const Disabled = {
    args: { disabled: true, label: "Price" },
};
