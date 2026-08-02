import "./y-tokens.js";
import "../y-button/y-button.js";
import "../y-icon/y-icon.js";

const facets = JSON.stringify([
    { value: "design", label: "Design", color: "primary" },
    { value: "research", label: "Research", color: "help" },
    { value: "engineering", label: "Engineering", color: "success" },
    { value: "marketing", label: "Marketing", color: "warning" },
    { value: "support", label: "Support" },
]);

export default {
    title: "Input/Tokens",
    tags: ["autodocs"],
    decorators: [
        (story) =>
            `<div style="min-height: 300px; padding: 16px; max-width: 480px;">${story()}</div>`,
    ],
    argTypes: {
        options: {
            control: "text",
            description:
                "JSON array of `{ value, label?, icon?, color?, disabled? }` suggestions.",
        },
        value: {
            control: "text",
            description:
                "Committed tokens — a JSON array or a separator-delimited string.",
        },
        placeholder: { control: "text" },
        allowCustom: {
            control: "boolean",
            description: "Whether text matching no option may become a token.",
            table: { defaultValue: { summary: false } },
        },
        duplicates: {
            control: "select",
            options: ["ignore", "allow", "error"],
            table: { defaultValue: { summary: "ignore" } },
        },
        filter: {
            control: "select",
            options: ["contains", "starts-with", "none"],
            table: { defaultValue: { summary: "contains" } },
        },
        max: { control: "number", description: "Maximum token count." },
        separators: {
            control: "text",
            description: "Characters that commit the pending text.",
            table: { defaultValue: { summary: "," } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            table: { defaultValue: { summary: "medium" } },
        },
        tokenVariant: {
            control: "select",
            options: ["filled", "outlined", "flat"],
            table: { defaultValue: { summary: "filled" } },
        },
        tokenShape: {
            control: "select",
            options: ["square", "round"],
            table: { defaultValue: { summary: "square" } },
        },
        variant: {
            control: "select",
            options: ["default", "underline"],
            table: { defaultValue: { summary: "default" } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "left", "hidden"],
            table: { defaultValue: { summary: "top" } },
        },
        clearable: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        placeholderPersist: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        readonly: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        required: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        errorText: { control: "text" },
    },
    args: {
        options: facets,
        value: '["design"]',
        placeholder: "Add a topic…",
        allowCustom: false,
        duplicates: "ignore",
        filter: "contains",
        max: undefined,
        separators: ",",
        size: "medium",
        tokenVariant: "filled",
        tokenShape: "square",
        variant: "default",
        labelPosition: "top",
        clearable: true,
        placeholderPersist: false,
        readonly: false,
        disabled: false,
        required: false,
        invalid: false,
        errorText: "",
    },
    render: ({
        options,
        value,
        placeholder,
        allowCustom,
        duplicates,
        filter,
        max,
        separators,
        size,
        tokenVariant,
        tokenShape,
        variant,
        labelPosition,
        clearable,
        placeholderPersist,
        readonly,
        disabled,
        required,
        invalid,
        errorText,
    }) => `
        <y-tokens
            options='${options}'
            value='${value}'
            placeholder="${placeholder}"
            duplicates="${duplicates}"
            filter="${filter}"
            separators="${separators}"
            size="${size}"
            token-variant="${tokenVariant}"
            token-shape="${tokenShape}"
            variant="${variant}"
            label-position="${labelPosition}"
            ${max != null ? `max="${max}"` : ""}
            ${allowCustom ? "allow-custom" : ""}
            ${clearable ? "clearable" : ""}
            ${placeholderPersist ? "placeholder-persist" : ""}
            ${readonly ? "readonly" : ""}
            ${disabled ? "disabled" : ""}
            ${required ? "required" : ""}
            ${invalid ? "invalid" : ""}
            ${errorText ? `error-text="${errorText}"` : ""}
            name="topics"
        >
            <span slot="label">Topics</span>
        </y-tokens>
    `,
};

export const Default = {};

export const FreeEntry = {
    name: "Free entry (allow-custom)",
    args: {
        allowCustom: true,
        options: "[]",
        value: '["roadmap","q3"]',
        placeholder: "Type and press Enter…",
    },
};

export const FacetChips = {
    name: "Facet chips (fixed option list)",
    args: {
        allowCustom: false,
        value: '["design","research"]',
        tokenShape: "round",
    },
};

export const WithIcons = {
    render: () => `
        <y-tokens
            options='${JSON.stringify([
                { value: "starred", label: "Starred", icon: "star", color: "warning" },
                { value: "urgent", label: "Urgent", icon: "bolt", color: "error" },
                { value: "team", label: "Team", icon: "users", color: "primary" },
            ])}'
            value='[{"value":"starred","label":"Starred","icon":"star","color":"warning"}]'
            placeholder="Add a label…"
        >
            <span slot="label">Labels</span>
            <y-icon slot="left-icon" name="tag" size="small"></y-icon>
        </y-tokens>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            ${["small", "medium", "large"]
                .map(
                    (size) => `
                <y-tokens size="${size}" options='${facets}' value='["design","research"]'>
                    <span slot="label">${size[0].toUpperCase() + size.slice(1)}</span>
                </y-tokens>`,
                )
                .join("")}
        </div>
    `,
};

export const Max = {
    name: "Capped at three",
    args: { max: 3, allowCustom: true, value: '["design","research"]' },
};

export const DuplicateError = {
    name: "Duplicates rejected",
    args: {
        duplicates: "error",
        allowCustom: true,
        value: '["design"]',
        placeholder: "Try adding Design again…",
    },
};

export const InvalidToken = {
    name: "Invalid token",
    render: () => `
        <y-tokens
            error-text="One address could not be verified."
            value='${JSON.stringify([
                { value: "ada@example.com", label: "ada@example.com" },
                { value: "not-an-address", label: "not-an-address", invalid: true },
            ])}'
            allow-custom
        >
            <span slot="label">Recipients</span>
        </y-tokens>
    `,
};

export const Readonly = {
    args: { readonly: true, value: '["design","research","engineering"]' },
};

export const AsyncSuggestions = {
    name: "Async suggestions",
    render: () => {
        const id = `tokens-async-${Math.random().toString(36).slice(2, 8)}`;
        // The component never fetches — it emits `query` and waits for the app
        // to assign `options`. `setOptions(list, id)` drops stale responses.
        setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) return;
            const catalog = [
                "Accessibility",
                "Analytics",
                "Animation",
                "Design systems",
                "Performance",
                "Prototyping",
            ];
            el.addEventListener("query", (e) => {
                const { query, id: queryId } = e.detail;
                setTimeout(() => {
                    el.setOptions(
                        catalog
                            .filter((entry) =>
                                entry.toLowerCase().includes(query.toLowerCase()),
                            )
                            .map((entry) => ({ value: entry })),
                        queryId,
                    );
                }, 600);
            });
        });

        return `
            <y-tokens id="${id}" async query-delay="250" placeholder="Search topics…">
                <span slot="label">Topics</span>
                <span slot="empty">Nothing found — keep typing</span>
            </y-tokens>
        `;
    },
};

export const InAForm = {
    name: "In a form",
    render: () => `
        <form id="tokens-form" style="display:flex;flex-direction:column;gap:12px;align-items:flex-start">
            <y-tokens name="topics" required allow-custom clearable value='["design"]'>
                <span slot="label">Topics (required)</span>
            </y-tokens>
            <y-button type="submit">Submit</y-button>
            <pre id="tokens-output" style="font-size:12px;margin:0"></pre>
        </form>
        <script type="module">
            const form = document.getElementById("tokens-form");
            form.addEventListener("submit", (e) => {
                e.preventDefault();
                const data = new FormData(form);
                document.getElementById("tokens-output").textContent =
                    "topics = " + JSON.stringify(data.getAll("topics"));
            });
        </script>
    `,
};
