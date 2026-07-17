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
