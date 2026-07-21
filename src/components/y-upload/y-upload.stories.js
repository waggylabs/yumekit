import "./y-upload.js";
import "../y-theme/y-theme.js";

export default {
    title: "Input/Upload",
    tags: ["autodocs"],
    argTypes: {
        variant: {
            control: "select",
            options: ["dropzone", "button"],
            description: "Full drop target or a compact browse button.",
            table: { defaultValue: { summary: "dropzone" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            table: { defaultValue: { summary: "medium" } },
        },
        accept: {
            control: "text",
            description: "Accepted extensions / MIME types (native syntax).",
        },
        multiple: {
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
        previews: {
            control: "boolean",
            description: "Show image thumbnails in the file list.",
            table: { defaultValue: { summary: false } },
        },
        showList: {
            control: "boolean",
            table: { defaultValue: { summary: true } },
        },
        maxSize: { control: "number", description: "Max bytes per file." },
        maxFiles: { control: "number", description: "Max number of files." },
    },
    args: {
        variant: "dropzone",
        size: "medium",
        accept: "",
        multiple: true,
        disabled: false,
        required: false,
        previews: false,
        showList: true,
        maxSize: undefined,
        maxFiles: undefined,
    },
    render: ({
        variant,
        size,
        accept,
        multiple,
        disabled,
        required,
        previews,
        showList,
        maxSize,
        maxFiles,
    }) => `
        <y-theme theme="blue-light">
            <y-upload
                variant="${variant}"
                size="${size}"
                ${accept ? `accept="${accept}"` : ""}
                ${multiple ? "multiple" : ""}
                ${disabled ? "disabled" : ""}
                ${required ? "required" : ""}
                ${previews ? "previews" : ""}
                show-list="${showList}"
                ${maxSize != null ? `max-size="${maxSize}"` : ""}
                ${maxFiles != null ? `max-files="${maxFiles}"` : ""}
                name="files"
            ></y-upload>
        </y-theme>
    `,
};

export const Default = {};

export const Button = {
    args: { variant: "button", multiple: false },
};

export const ImagePreviews = {
    args: { previews: true, accept: "image/*" },
};

export const Constrained = {
    args: { accept: ".pdf,.png,.jpg", maxSize: 1048576, maxFiles: 3 },
};

export const Disabled = {
    args: { disabled: true },
};

export const WithProgress = {
    render: () => `
        <y-theme theme="blue-light">
            <y-upload id="progress-demo" multiple name="files"></y-upload>
        </y-theme>
        <script type="module">
            const el = document.getElementById("progress-demo");
            const seed = (name, type) =>
                new File([new Blob(["demo"], { type })], name, { type });
            el.files = [
                seed("photo.png", "image/png"),
                seed("notes.txt", "text/plain"),
            ];
            const [a, b] = el.files;
            el.setStatus(a, "uploading");
            el.setProgress(a, 65);
            el.setStatus(b, "error", "Upload failed — try again");
        </script>
    `,
};
