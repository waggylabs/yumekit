import "./y-textarea.js";

export default {
    title: "Input/Textarea",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description: "Current textarea value.",
        },
        placeholder: {
            control: "text",
            description: "Hint text shown when the textarea is empty.",
        },
        rows: {
            control: "number",
            description: "Number of visible text rows.",
            table: { defaultValue: { summary: "3" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Textarea size.",
            table: { defaultValue: { summary: "medium" } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "bottom"],
            description: "Position of the label relative to the textarea.",
            table: { defaultValue: { summary: "top" } },
        },
        disabled: {
            control: "boolean",
            description: "Whether the textarea is disabled.",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            description: "Whether the textarea is in an invalid state.",
            table: { defaultValue: { summary: false } },
        },
        triggers: {
            control: "text",
            description:
                "JSON array of mention triggers — `{ trigger, type?, minChars?, maxChars?, allowSpaces?, insert? }`. Empty disables mentions.",
        },
        mentionQueryDelay: {
            control: "number",
            description: "Debounce in ms before mention-query fires.",
            table: { defaultValue: { summary: "150" } },
        },
    },
    args: {
        value: "",
        placeholder: "",
        rows: 3,
        size: "medium",
        labelPosition: "top",
        disabled: false,
        invalid: false,
        triggers: "",
        mentionQueryDelay: 150,
    },
    render: ({
        value,
        placeholder,
        rows,
        size,
        labelPosition,
        disabled,
        invalid,
        triggers,
        mentionQueryDelay,
    }) => `
        <y-textarea
            size="${size}"
            rows="${rows}"
            label-position="${labelPosition}"
            ${value ? `value="${value}"` : ""}
            ${placeholder ? `placeholder="${placeholder}"` : ""}
            ${disabled ? "disabled" : ""}
            ${invalid ? "invalid" : ""}
            ${triggers ? `triggers='${triggers}'` : ""}
            ${mentionQueryDelay !== 150 ? `mention-query-delay="${mentionQueryDelay}"` : ""}
            style="width:300px"
        >
            <span slot="label">Label</span>
        </y-textarea>
    `,
};

export const Default = {};

export const Underline = {
    name: "Underline variant",
    render: () =>
        `<y-textarea variant="underline" label="Message" rows="3" style="max-width:320px"></y-textarea>`,
};

export const WithValue = {
    args: { value: "This is some textarea content." },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;width:300px">
            <y-textarea size="small">
                <span slot="label">Small</span>
            </y-textarea>
            <y-textarea size="medium">
                <span slot="label">Medium</span>
            </y-textarea>
            <y-textarea size="large">
                <span slot="label">Large</span>
            </y-textarea>
        </div>
    `,
};

export const TallRows = {
    args: { rows: 8, value: "More rows for longer content." },
};

export const LabelBottom = {
    args: { labelPosition: "bottom", value: "Some value" },
};

export const Invalid = {
    args: { invalid: true, value: "invalid content" },
};

export const Disabled = {
    args: { disabled: true, value: "Disabled content" },
};

// ── Mentions ──────────────────────────────────────────────────
// Same API as y-editor, minus atomic insertion: a textarea value stays an
// unstructured string, so mentions are inserted as plain text.

const PEOPLE = [
    { value: "ada", label: "Ada Lovelace", description: "Engineering" },
    { value: "grace", label: "Grace Hopper", description: "Compilers" },
    { value: "alan", label: "Alan Turing", description: "Research" },
    { value: "katherine", label: "Katherine Johnson", description: "Trajectories" },
];

const TOPICS = [
    { value: "accessibility", icon: "accessibility" },
    { value: "design", icon: "palette" },
    { value: "performance", icon: "bolt" },
    { value: "testing", icon: "check" },
];

const matches = (list, query) =>
    list.filter((entry) =>
        (entry.label ?? entry.value)
            .toLowerCase()
            .includes(query.toLowerCase()),
    );

/**
 * Reserve room below the field for the open popup.
 *
 * The popup is `position: fixed`, so it is clipped by any ancestor that both
 * scrolls and establishes a containing block for fixed descendants — which is
 * exactly Storybook's docs preview (a transformed wrapper inside an
 * `overflow: auto` story box). Padding the story out means the candidate list
 * has somewhere to land in the docs view as well as the canvas.
 */
const withRoom = (markup) =>
    `<div style="padding-bottom:17rem">${markup}</div>`;

/** Answer `mention-query` from a local catalog once the markup has landed. */
function wireMentions(id, catalogs, { delay = 0 } = {}) {
    setTimeout(() => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener("mention-query", (e) => {
            const { type, query, id: queryId } = e.detail;
            const catalog = catalogs[type] ?? [];

            if (!delay) {
                el.setMentionCandidates(queryId, matches(catalog, query));
                return;
            }

            el.mentionLoading = true;
            setTimeout(
                () => el.setMentionCandidates(queryId, matches(catalog, query)),
                delay,
            );
        });
    });
}

export const PeopleMentions = {
    name: "Mentions — @ people",
    render: () => {
        const id = `textarea-mention-${Math.random().toString(36).slice(2, 8)}`;
        wireMentions(id, { user: PEOPLE });
        return withRoom(`
            <y-textarea
                id="${id}"
                rows="5"
                style="max-width:420px"
                triggers='[{"trigger":"@","type":"user"}]'
                placeholder="Type @ to mention a teammate…"
            >
                <span slot="label">Message</span>
            </y-textarea>
        `);
    },
};

export const MultipleTriggers = {
    name: "Mentions — @ and # together",
    render: () => {
        const id = `textarea-both-${Math.random().toString(36).slice(2, 8)}`;
        wireMentions(id, { user: PEOPLE, topic: TOPICS });
        return withRoom(`
            <y-textarea
                id="${id}"
                rows="5"
                style="max-width:420px"
                triggers='[{"trigger":"@","type":"user"},{"trigger":"#","type":"topic"}]'
                placeholder="Mention people with @ and topics with #…"
            >
                <span slot="label">Update</span>
            </y-textarea>
        `);
    },
};

export const AsyncCandidates = {
    name: "Mentions — async candidates",
    render: () => {
        const id = `textarea-async-${Math.random().toString(36).slice(2, 8)}`;
        wireMentions(id, { user: PEOPLE }, { delay: 700 });
        return withRoom(`
            <y-textarea
                id="${id}"
                rows="5"
                style="max-width:420px"
                triggers='[{"trigger":"@","type":"user","minChars":1,"allowSpaces":true}]'
                mention-query-delay="250"
                placeholder="Type @ then a letter — a full name matches too…"
            >
                <span slot="label">Reviewers</span>
                <span slot="mention-loading">Searching the directory…</span>
                <span slot="mention-empty">Nobody by that name</span>
            </y-textarea>
        `);
    },
};
