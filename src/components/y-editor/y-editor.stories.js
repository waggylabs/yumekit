import "./y-editor.js";
import "../../icons/all.js";

export default {
    title: "Input/Editor",
    tags: ["autodocs"],
    argTypes: {
        value: {
            control: "text",
            description: "Current content as sanitized HTML.",
        },
        placeholder: {
            control: "text",
            description: "Shown when the editor is empty.",
        },
        toolbar: {
            control: "text",
            description:
                'Space-separated tool ids, "|" for a group separator. "false" hides the toolbar.',
        },
        allowedBlocks: {
            control: "text",
            description:
                "Space-separated block types offered and permitted. Anything else normalizes to p.",
            table: {
                defaultValue: { summary: "p h1 h2 h3 blockquote ul ol code" },
            },
        },
        rows: {
            control: "number",
            description: "Visible rows at the default font size.",
            table: { defaultValue: { summary: "6" } },
        },
        maxLength: {
            control: "number",
            description: "Maximum character count of the plain-text content.",
        },
        showCount: {
            control: "boolean",
            description: "Render a character counter in the footer.",
            table: { defaultValue: { summary: false } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            table: { defaultValue: { summary: "medium" } },
        },
        disabled: {
            control: "boolean",
            description:
                "Non-editable, non-focusable, excluded from submission.",
            table: { defaultValue: { summary: false } },
        },
        readonly: {
            control: "boolean",
            description: "Non-editable but focusable; toolbar hidden.",
            table: { defaultValue: { summary: false } },
        },
        required: {
            control: "boolean",
            description: "Invalid when the plain-text content is empty.",
            table: { defaultValue: { summary: false } },
        },
        invalid: {
            control: "boolean",
            description: "Applies the error state.",
            table: { defaultValue: { summary: false } },
        },
        imageUpload: {
            control: "boolean",
            description:
                "Route image insertion through the image-upload event.",
            table: { defaultValue: { summary: false } },
        },
        triggers: {
            control: "text",
            description:
                "JSON array of mention triggers — `{ trigger, type?, minChars?, maxChars?, allowSpaces?, insert?, atomic? }`. Empty disables mentions.",
        },
        mentionQueryDelay: {
            control: "number",
            description: "Debounce in ms before mention-query fires.",
            table: { defaultValue: { summary: "150" } },
        },
    },
    args: {
        value: "",
        placeholder: "Write something…",
        toolbar: "",
        allowedBlocks: "",
        rows: 6,
        maxLength: 0,
        showCount: false,
        size: "medium",
        disabled: false,
        readonly: false,
        required: false,
        invalid: false,
        imageUpload: false,
        triggers: "",
        mentionQueryDelay: 150,
    },
    render: ({
        value,
        placeholder,
        toolbar,
        allowedBlocks,
        rows,
        maxLength,
        showCount,
        size,
        disabled,
        readonly,
        required,
        invalid,
        imageUpload,
        triggers,
        mentionQueryDelay,
    }) => `
        <y-editor
            size="${size}"
            rows="${rows}"
            ${value ? `value="${value.replace(/"/g, "&quot;")}"` : ""}
            ${placeholder ? `placeholder="${placeholder}"` : ""}
            ${toolbar ? `toolbar="${toolbar}"` : ""}
            ${allowedBlocks ? `allowed-blocks="${allowedBlocks}"` : ""}
            ${maxLength ? `max-length="${maxLength}"` : ""}
            ${showCount ? "show-count" : ""}
            ${disabled ? "disabled" : ""}
            ${readonly ? "readonly" : ""}
            ${required ? "required" : ""}
            ${invalid ? "invalid" : ""}
            ${imageUpload ? "image-upload" : ""}
            ${triggers ? `triggers='${triggers}'` : ""}
            ${mentionQueryDelay !== 150 ? `mention-query-delay="${mentionQueryDelay}"` : ""}
            style="max-width:640px"
        >
            <span slot="label">Description</span>
        </y-editor>
    `,
};

export const Default = {};

export const WithContent = {
    name: "With content",
    args: {
        value: "<h2>Release notes</h2><p>This release adds the <strong>editor</strong> component.</p><ul><li>Rich text</li><li>Sanitized output</li></ul>",
    },
};

export const InitialContentFromSlot = {
    name: "Initial content from the default slot",
    render: () => `
        <y-editor style="max-width:640px">
            <span slot="label">Bio</span>
            <h3>About me</h3>
            <p>Slotted markup is parsed, sanitized, and adopted as the starting value.</p>
        </y-editor>
    `,
};

export const MinimalToolbar = {
    name: "Minimal toolbar",
    args: { toolbar: "bold italic | link" },
};

export const NoToolbar = {
    name: "No toolbar",
    args: {
        toolbar: "false",
        value: "<p>The toolbar is hidden; shortcuts still work.</p>",
    },
};

export const RestrictedBlocks = {
    name: "Restricted blocks",
    args: {
        allowedBlocks: "p ul ol",
        value: "<p>Only paragraphs and lists are permitted here.</p>",
    },
};

export const WithCounter = {
    name: "Character counter",
    args: {
        showCount: true,
        maxLength: 120,
        value: "<p>Counting the plain text.</p>",
    },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px;max-width:640px">
            <y-editor size="small" rows="3" value="<p>Small</p>"></y-editor>
            <y-editor size="medium" rows="3" value="<p>Medium</p>"></y-editor>
            <y-editor size="large" rows="3" value="<p>Large</p>"></y-editor>
        </div>
    `,
};

export const Readonly = {
    args: {
        readonly: true,
        value: "<p>Readonly keeps the text selectable and focusable, but hides the toolbar.</p>",
    },
};

export const Disabled = {
    args: { disabled: true, value: "<p>Disabled content.</p>" },
};

export const Invalid = {
    args: {
        invalid: true,
        value: "<p>Something is wrong with this content.</p>",
    },
};

export const Required = {
    name: "Required and empty",
    args: { required: true },
};

export const SanitizedInput = {
    name: "Sanitized input",
    render: () => {
        const hostile =
            "<h3>Pasted from elsewhere</h3>" +
            '<p onclick="alert(1)">Handlers are removed.</p>' +
            '<p><a href="javascript:alert(1)">Unsafe links keep their text only.</a></p>' +
            "<script>alert(1)</script>" +
            '<p><a href="https://example.com">Safe links survive.</a></p>';
        return `
            <y-editor style="max-width:640px" value="${hostile.replace(/"/g, "&quot;")}">
                <span slot="label">Sanitized</span>
            </y-editor>
        `;
    },
};

export const CustomToolbarSlots = {
    name: "Custom toolbar controls",
    render: () => `
        <y-editor style="max-width:640px" toolbar="bold italic">
            <span slot="label">With extra controls</span>
            <y-button slot="toolbar-end" variant="flat" size="small">Save draft</y-button>
        </y-editor>
    `,
};

export const InAForm = {
    name: "In a form",
    render: () => `
        <form style="max-width:640px;display:flex;flex-direction:column;gap:12px"
              onsubmit="event.preventDefault();
                        const d = new FormData(event.target);
                        this.querySelector('#out').textContent = d.get('body');">
            <y-editor name="body" required show-count max-length="200">
                <span slot="label">Comment</span>
            </y-editor>
            <div>
                <y-button type="submit" variant="filled">Submit</y-button>
                <y-button type="reset" variant="flat">Reset</y-button>
            </div>
            <pre id="out" style="white-space:pre-wrap"></pre>
        </form>
    `,
};

export const ImageUpload = {
    name: "Routed image upload",
    render: () => `
        <y-editor id="upload-demo" image-upload style="max-width:640px">
            <span slot="label">Drop or paste an image</span>
        </y-editor>
        <script>
            document.getElementById("upload-demo").addEventListener("image-upload", (e) => {
                // Stand-in for a real upload: resolve to a hosted URL after a beat.
                setTimeout(() => e.detail.insert("https://placehold.co/320x160/png"), 800);
            });
        </script>
    `,
};

// ── Mentions ──────────────────────────────────────────────────
// The editor never fetches. It detects the trigger at the caret, emits
// `mention-query`, and renders whatever the app hands back through
// `setMentionCandidates(id, list)`.

const PEOPLE = [
    {
        value: "ada",
        label: "Ada Lovelace",
        description: "Engineering",
        avatar: "https://i.pravatar.cc/64?img=47",
    },
    {
        value: "grace",
        label: "Grace Hopper",
        description: "Compilers",
        avatar: "https://i.pravatar.cc/64?img=45",
    },
    {
        value: "alan",
        label: "Alan Turing",
        description: "Research",
        avatar: "https://i.pravatar.cc/64?img=12",
    },
    {
        value: "katherine",
        label: "Katherine Johnson",
        description: "Trajectories",
        avatar: "https://i.pravatar.cc/64?img=32",
    },
    {
        value: "onleave",
        label: "Margaret Hamilton",
        description: "On leave — cannot be mentioned",
        disabled: true,
    },
];

const TOPICS = [
    { value: "accessibility", label: "accessibility", icon: "accessibility" },
    { value: "design", label: "design", icon: "palette" },
    { value: "performance", label: "performance", icon: "bolt" },
    { value: "testing", label: "testing", icon: "check" },
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

/**
 * Wire an editor's `mention-query` to a local catalog once the story's markup
 * has landed. `delay` stands in for a network round trip.
 */
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
        const id = `editor-mention-${Math.random().toString(36).slice(2, 8)}`;
        wireMentions(id, { user: PEOPLE });
        return withRoom(`
            <y-editor
                id="${id}"
                style="max-width:640px"
                triggers='[{"trigger":"@","type":"user"}]'
                placeholder="Type @ to mention a teammate…"
            >
                <span slot="label">Comment</span>
            </y-editor>
        `);
    },
};

export const TopicTags = {
    name: "Mentions — # topics",
    render: () => {
        const id = `editor-topic-${Math.random().toString(36).slice(2, 8)}`;
        wireMentions(id, { topic: TOPICS });
        return withRoom(`
            <y-editor
                id="${id}"
                style="max-width:640px"
                triggers='[{"trigger":"#","type":"topic","insert":"{trigger}{value} "}]'
                placeholder="Type # to tag a topic…"
            >
                <span slot="label">Post</span>
            </y-editor>
        `);
    },
};

export const MultipleTriggers = {
    name: "Mentions — @ and # together",
    render: () => {
        const id = `editor-both-${Math.random().toString(36).slice(2, 8)}`;
        wireMentions(id, { user: PEOPLE, topic: TOPICS });
        return withRoom(`
            <y-editor
                id="${id}"
                style="max-width:640px"
                triggers='[{"trigger":"@","type":"user"},{"trigger":"#","type":"topic","insert":"{trigger}{value} "}]'
                placeholder="Mention people with @ and topics with #…"
            >
                <span slot="label">Update</span>
            </y-editor>
        `);
    },
};

export const AsyncCandidates = {
    name: "Mentions — async candidates",
    render: () => {
        const id = `editor-async-${Math.random().toString(36).slice(2, 8)}`;
        // Each query carries a monotonic id; answering a superseded one is a
        // no-op, so slow responses cannot repopulate a moved-on popup.
        wireMentions(id, { user: PEOPLE }, { delay: 700 });
        return withRoom(`
            <y-editor
                id="${id}"
                style="max-width:640px"
                triggers='[{"trigger":"@","type":"user","minChars":1}]'
                mention-query-delay="250"
                placeholder="Type @ then a letter — results arrive after a beat…"
            >
                <span slot="label">Reviewers</span>
                <span slot="mention-loading">Searching the directory…</span>
                <span slot="mention-empty">Nobody by that name</span>
            </y-editor>
        `);
    },
};

export const AtomicMentions = {
    name: "Mentions — atomic chips",
    render: () => {
        const id = `editor-atomic-${Math.random().toString(36).slice(2, 8)}`;
        const outId = `${id}-out`;
        wireMentions(id, { user: PEOPLE });
        setTimeout(() => {
            const el = document.getElementById(id);
            const out = document.getElementById(outId);
            if (!el || !out) return;
            const show = () => {
                out.textContent = el.value;
            };
            el.addEventListener("input", show);
            show();
        });
        return withRoom(`
            <y-editor
                id="${id}"
                style="max-width:640px"
                triggers='[{"trigger":"@","type":"user","atomic":true}]'
                placeholder="Inserted mentions become one non-editable unit…"
                show-count
            >
                <span slot="label">Atomic mentions</span>
            </y-editor>
            <p style="margin:12px 0 4px;font-size:12px;opacity:0.7">
                Serialized value — the chip survives the round trip, and the
                character count sees it as its insert template:
            </p>
            <pre id="${outId}" style="max-width:640px;white-space:pre-wrap;font-size:12px;margin:0"></pre>
        `);
    },
};
