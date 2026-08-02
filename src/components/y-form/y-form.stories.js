import "./y-form.js";
import "../../icons/all.js";

const DEMO_FIELDS = [
    {
        type: "input",
        name: "username",
        label: "Username",
        placeholder: "Your username",
        required: true,
        help: "Letters and numbers only.",
    },
    {
        type: "input",
        name: "email",
        label: "Email",
        inputType: "email",
        placeholder: "you@example.com",
        required: true,
    },
    {
        type: "select",
        name: "role",
        label: "Role",
        placeholder: "Pick a role",
        options: [
            { value: "admin", label: "Admin" },
            { value: "editor", label: "Editor" },
            { value: "viewer", label: "Viewer" },
        ],
    },
    { type: "switch", name: "newsletter", label: "Newsletter" },
];

export default {
    title: "Input/Form",
    tags: ["autodocs"],
    argTypes: {
        layout: {
            control: "select",
            options: ["vertical", "horizontal", "inline"],
            description: "Field stacking direction.",
            table: { defaultValue: { summary: "vertical" } },
        },
        labelPosition: {
            control: "select",
            options: ["top", "left"],
            description: "Label placement relative to each control.",
            table: { defaultValue: { summary: "top" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Size propagated to controls and buttons.",
            table: { defaultValue: { summary: "medium" } },
        },
        submitText: {
            control: "text",
            description: "Submit button label.",
            table: { defaultValue: { summary: "Submit" } },
        },
        resetText: {
            control: "text",
            description: "Reset button label.",
            table: { defaultValue: { summary: "Reset" } },
        },
        noReset: {
            control: "boolean",
            description: "Hide the reset button.",
            table: { defaultValue: { summary: false } },
        },
        disabled: {
            control: "boolean",
            description: "Disable all controls and buttons.",
            table: { defaultValue: { summary: false } },
        },
        loading: {
            control: "boolean",
            description:
                "Submitting state — disables the buttons and shows a busy indicator.",
            table: { defaultValue: { summary: false } },
        },
        loadingMode: {
            control: "select",
            options: ["ring", "skeleton"],
            description:
                "Busy indicator while loading: a progress ring in the action row, or skeleton placeholders over the fields.",
            table: { defaultValue: { summary: "ring" } },
        },
        novalidate: {
            control: "boolean",
            description: "Skip built-in validation on submit.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        layout: "vertical",
        labelPosition: "top",
        size: "medium",
        submitText: "Submit",
        resetText: "Reset",
        noReset: false,
        disabled: false,
        loading: false,
        loadingMode: "ring",
        novalidate: false,
    },
    render: (args) => {
        const form = document.createElement("y-form");
        form.fields = DEMO_FIELDS;
        form.setAttribute("layout", args.layout);
        form.setAttribute("label-position", args.labelPosition);
        form.setAttribute("size", args.size);
        form.setAttribute("submit-text", args.submitText);
        form.setAttribute("reset-text", args.resetText);
        if (args.noReset) form.setAttribute("no-reset", "");
        if (args.disabled) form.setAttribute("disabled", "");
        if (args.loading) form.setAttribute("loading", "");
        form.setAttribute("loading-mode", args.loadingMode);
        if (args.novalidate) form.setAttribute("novalidate", "");
        form.addEventListener("y-submit", (e) => {
            e.preventDefault();
            console.log("y-submit", e.detail.values);
        });
        return form;
    },
};

export const Default = {};

export const LeftLabels = {
    args: { labelPosition: "left" },
};

export const Inline = {
    render: () => {
        const form = document.createElement("y-form");
        form.setAttribute("layout", "inline");
        form.setAttribute("no-reset", "");
        form.setAttribute("submit-text", "Search");
        form.fields = [
            { type: "input", name: "query", placeholder: "Search..." },
            {
                type: "select",
                name: "scope",
                placeholder: "Scope",
                options: [
                    { value: "all", label: "All" },
                    { value: "mine", label: "Mine" },
                ],
            },
        ];
        form.addEventListener("y-submit", (e) => e.preventDefault());
        return form;
    },
};

export const AllFieldTypes = {
    render: () => {
        const form = document.createElement("y-form");
        form.fields = [
            { type: "input", name: "text", label: "Text" },
            { type: "textarea", name: "bio", label: "Bio" },
            {
                type: "select",
                name: "select",
                label: "Select",
                options: [
                    { value: "a", label: "Option A" },
                    { value: "b", label: "Option B" },
                ],
            },
            { type: "checkbox", name: "checkbox", label: "Checkbox" },
            {
                type: "radio",
                name: "radio",
                label: "Radio",
                options: [
                    { value: "one", label: "One" },
                    { value: "two", label: "Two" },
                ],
            },
            { type: "switch", name: "switch", label: "Switch" },
            {
                type: "slider",
                name: "slider",
                label: "Slider",
                min: 0,
                max: 100,
                value: 40,
            },
            { type: "date", name: "date", label: "Date" },
            { type: "color", name: "color", label: "Color", value: "#7048e8" },
            { type: "rating", name: "rating", label: "Rating", value: 3 },
        ];
        form.addEventListener("y-submit", (e) => e.preventDefault());
        return form;
    },
};

export const SlottedFields = {
    render: () => {
        const form = document.createElement("y-form");
        form.fields = [
            { type: "input", name: "title", label: "Title" },
            { slot: "attachments" },
            { type: "textarea", name: "notes", label: "Notes" },
        ];

        const custom = document.createElement("div");
        custom.setAttribute("slot", "attachments");
        custom.innerHTML = `
            <y-input name="attachment" placeholder="Attachment URL">
                <span slot="label">Attachment (slotted child)</span>
            </y-input>
        `;
        form.appendChild(custom);

        const header = document.createElement("h3");
        header.setAttribute("slot", "header");
        header.textContent = "New document";
        form.appendChild(header);

        form.addEventListener("y-submit", (e) => {
            e.preventDefault();
            console.log("y-submit", e.detail.values);
        });
        return form;
    },
};

export const ValidationAndEvents = {
    render: () => {
        const wrapper = document.createElement("div");
        const form = document.createElement("y-form");
        form.fields = [
            { type: "input", name: "username", label: "Username", required: true },
            {
                type: "input",
                name: "email",
                label: "Email",
                inputType: "email",
                required: true,
            },
        ];

        const log = document.createElement("pre");
        log.style.cssText = "font-size:12px;opacity:0.7";
        form.addEventListener("y-submit", (e) => {
            e.preventDefault();
            log.textContent = `y-submit: ${JSON.stringify(e.detail.values)}`;
        });
        form.addEventListener("y-invalid", (e) => {
            log.textContent = `y-invalid: ${JSON.stringify(e.detail.invalid)}`;
        });
        form.addEventListener("y-change", (e) => {
            log.textContent = `y-change: ${e.detail.name} = ${JSON.stringify(e.detail.value)}`;
        });

        wrapper.append(form, log);
        return wrapper;
    },
};

export const Loading = {
    args: { loading: true },
};

export const LoadingSkeleton = {
    args: { loading: true, loadingMode: "skeleton" },
};

export const Disabled = {
    args: { disabled: true },
};

export const CustomValidationMessages = {
    render: () => {
        const wrapper = document.createElement("div");
        const form = document.createElement("y-form");
        form.submitText = "Create account";
        form.fields = [
            {
                type: "input",
                name: "username",
                label: "Username",
                required: true,
                errorText: "Pick a username — this is how others find you.",
            },
            // A bare native input type is sugar for {type: "input", inputType}.
            {
                type: "email",
                name: "email",
                label: "Email",
                required: true,
                autocomplete: "email",
            },
            {
                type: "password",
                name: "password",
                label: "Password",
                required: true,
                autocomplete: "new-password",
            },
            {
                type: "password",
                name: "confirm",
                label: "Confirm password",
                required: true,
                autocomplete: "new-password",
                validate: (value, values) =>
                    value === values.password ? null : "Passwords must match",
            },
        ];

        wrapper.appendChild(form);
        return wrapper;
    },
};

export const LoadingPreservesFocus = {
    render: () => {
        const wrapper = document.createElement("div");
        const form = document.createElement("y-form");
        form.fields = [
            { type: "input", name: "name", label: "Name", value: "Jeff" },
            { type: "textarea", name: "bio", label: "Bio" },
        ];

        // Focus and caret position survive the loading/disabled toggle because
        // state-only attributes no longer rebuild the controls.
        form.addEventListener("y-submit", (e) => {
            e.preventDefault();
            form.loading = true;
            form.disabled = true;
            setTimeout(() => {
                form.loading = false;
                form.disabled = false;
            }, 1500);
        });

        wrapper.appendChild(form);
        return wrapper;
    },
};
