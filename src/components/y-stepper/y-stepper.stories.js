import "./y-stepper.js";
import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

const navButtons = (id, { first = false, last = false } = {}) => `
    <div style="display:flex;gap:8px;margin-top:16px">
        ${first ? "" : `<y-button onclick="document.getElementById('${id}').previous()">Previous</y-button>`}
        ${
            last
                ? `<y-button color="success" onclick="document.getElementById('${id}').next()">Finish</y-button>`
                : `<y-button onclick="document.getElementById('${id}').next()">Next</y-button>`
        }
    </div>
`;

const ITEMS_BASIC = JSON.stringify([
    { label: "Account", slot: "account" },
    { label: "Details", slot: "details" },
    { label: "Review", slot: "review" },
    { label: "Confirm", slot: "confirm" },
]);

const ITEMS_WITH_DESC = JSON.stringify([
    { label: "Account", slot: "account", description: "Create your account" },
    { label: "Details", slot: "details", description: "Personal information" },
    { label: "Review", slot: "review", description: "Check your info" },
    {
        label: "Confirm",
        slot: "confirm",
        description: "Submit your application",
    },
]);

const ITEMS_WITH_ICONS = JSON.stringify([
    { label: "Account", slot: "account", icon: "user" },
    { label: "Shipping", slot: "shipping", icon: "briefcase" },
    { label: "Payment", slot: "payment", icon: "bookmark" },
    { label: "Review", slot: "review", icon: "check" },
]);

const ITEMS_WITH_STATUS = JSON.stringify([
    { label: "Account", slot: "account", status: "complete" },
    { label: "Details", slot: "details", status: "complete" },
    { label: "Verification", slot: "verification", status: "error" },
    { label: "Confirm", slot: "confirm" },
]);

const panelStyle =
    "background: var(--base-background-component, #f7f7fa);padding: 24px; border: 1px solid var(--base-border, #e0e0e0); border-radius: 8px; margin-top: 8px;";

export default {
    title: "Navigation/Stepper",
    tags: ["autodocs"],
    argTypes: {
        orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
            description: "Layout direction of the step indicators.",
            table: { defaultValue: { summary: "horizontal" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Controls indicator size, font size, and spacing.",
            table: { defaultValue: { summary: "medium" } },
        },
        linear: {
            control: "boolean",
            description:
                "When set, users can only advance via next() or complete().",
            table: { defaultValue: { summary: false } },
        },
        position: {
            control: "select",
            options: ["start", "end"],
            description:
                "Whether indicators appear before (start) or after (end) the content.",
            table: { defaultValue: { summary: "start" } },
        },
        editable: {
            control: "boolean",
            description:
                "When set, completed steps can be clicked to return to them.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        orientation: "horizontal",
        position: "start",
        size: "medium",
        linear: false,
        editable: false,
    },
    render: ({ orientation, position, size, linear, editable }) => `
        <y-stepper
            id="default-stepper"
            items='${ITEMS_BASIC}'
            orientation="${orientation}"
            position="${position}"
            size="${size}"
            ${linear ? "linear" : ""}
            ${editable ? "editable" : ""}
        >
            <div slot="account" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Create Account</h3>
                <p style="margin:0">Enter your email and password to get started.</p>
                ${navButtons("default-stepper", { first: true })}
            </div>
            <div slot="details" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Personal Details</h3>
                <p style="margin:0">Tell us a bit about yourself.</p>
                ${navButtons("default-stepper")}
            </div>
            <div slot="review" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Review</h3>
                <p style="margin:0">Check that everything looks good.</p>
                ${navButtons("default-stepper")}
            </div>
            <div slot="confirm" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Confirmation</h3>
                <p style="margin:0">You're all set!</p>
                ${navButtons("default-stepper", { last: true })}
            </div>
        </y-stepper>
    `,
};

export const Default = {};

export const WithDescriptions = {
    render: () => `
        <y-stepper id="desc-stepper" items='${ITEMS_WITH_DESC}'>
            <div slot="account" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Create Account</h3>
                <p style="margin:0">Enter your email and password.</p>
                ${navButtons("desc-stepper", { first: true })}
            </div>
            <div slot="details" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Personal Details</h3>
                <p style="margin:0">Fill in your personal information.</p>
                ${navButtons("desc-stepper")}
            </div>
            <div slot="review" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Review</h3>
                <p style="margin:0">Check your details.</p>
                ${navButtons("desc-stepper")}
            </div>
            <div slot="confirm" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Confirmation</h3>
                <p style="margin:0">Submit your application.</p>
                ${navButtons("desc-stepper", { last: true })}
            </div>
        </y-stepper>
    `,
};

export const WithIcons = {
    render: () => `
        <y-stepper id="icon-stepper" items='${ITEMS_WITH_ICONS}'>
            <div slot="account" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Account Setup</h3>
                <p style="margin:0">Create your account credentials.</p>
                ${navButtons("icon-stepper", { first: true })}
            </div>
            <div slot="shipping" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Shipping Address</h3>
                <p style="margin:0">Where should we send your order?</p>
                ${navButtons("icon-stepper")}
            </div>
            <div slot="payment" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Payment Method</h3>
                <p style="margin:0">Add a payment method.</p>
                ${navButtons("icon-stepper")}
            </div>
            <div slot="review" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Order Review</h3>
                <p style="margin:0">Review your order before placing it.</p>
                ${navButtons("icon-stepper", { last: true })}
            </div>
        </y-stepper>
    `,
};

export const WithStatus = {
    render: () => `
        <y-stepper items='${ITEMS_WITH_STATUS}' current="2">
            <div slot="account" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Account</h3>
                <p style="margin:0">Account created successfully.</p>
            </div>
            <div slot="details" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Details</h3>
                <p style="margin:0">Details completed.</p>
            </div>
            <div slot="verification" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Verification Failed</h3>
                <p style="margin:0; color: var(--error-content--, red)">Please re-upload your identity document.</p>
            </div>
            <div slot="confirm" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Confirmation</h3>
                <p style="margin:0">Waiting for verification.</p>
            </div>
        </y-stepper>
    `,
};

export const Vertical = {
    render: () => `
        <y-stepper id="vert-stepper" items='${ITEMS_WITH_DESC}' orientation="vertical">
            <div slot="account" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Create Account</h3>
                <p style="margin:0">Enter your email and password.</p>
                ${navButtons("vert-stepper", { first: true })}
            </div>
            <div slot="details" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Personal Details</h3>
                <p style="margin:0">Fill in your personal information.</p>
                ${navButtons("vert-stepper")}
            </div>
            <div slot="review" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Review</h3>
                <p style="margin:0">Check your details.</p>
                ${navButtons("vert-stepper")}
            </div>
            <div slot="confirm" style="${panelStyle}">
                <h3 style="margin:0 0 8px">Confirmation</h3>
                <p style="margin:0">Submit your application.</p>
                ${navButtons("vert-stepper", { last: true })}
            </div>
        </y-stepper>
    `,
};

export const PositionEnd = {
    render: () => `
        <h3 style="margin:0 0 8px">Horizontal â€” indicators below content</h3>
        <y-stepper items='${ITEMS_BASIC}' position="end">
            <div slot="account" style="${panelStyle}"><p style="margin:0">Account step content.</p></div>
            <div slot="details" style="${panelStyle}"><p style="margin:0">Details step content.</p></div>
            <div slot="review" style="${panelStyle}"><p style="margin:0">Review step content.</p></div>
            <div slot="confirm" style="${panelStyle}"><p style="margin:0">Confirm step content.</p></div>
        </y-stepper>

        <h3 style="margin:24px 0 8px">Vertical â€” indicators to the right of content</h3>
        <y-stepper items='${ITEMS_WITH_DESC}' position="end" orientation="vertical">
            <div slot="account" style="${panelStyle}"><p style="margin:0">Account step content.</p></div>
            <div slot="details" style="${panelStyle}"><p style="margin:0">Details step content.</p></div>
            <div slot="review" style="${panelStyle}"><p style="margin:0">Review step content.</p></div>
            <div slot="confirm" style="${panelStyle}"><p style="margin:0">Confirm step content.</p></div>
        </y-stepper>
    `,
};

export const Sizes = {
    render: () => `
        <h3 style="margin:0 0 8px">Small</h3>
        <y-stepper items='${ITEMS_BASIC}' size="small">
            <div slot="account" style="${panelStyle}"><p style="margin:0">Account step content.</p></div>
            <div slot="details" style="${panelStyle}"><p style="margin:0">Details step content.</p></div>
            <div slot="review" style="${panelStyle}"><p style="margin:0">Review step content.</p></div>
            <div slot="confirm" style="${panelStyle}"><p style="margin:0">Confirm step content.</p></div>
        </y-stepper>

        <h3 style="margin:24px 0 8px">Medium (default)</h3>
        <y-stepper items='${ITEMS_BASIC}' size="medium">
            <div slot="account" style="${panelStyle}"><p style="margin:0">Account step content.</p></div>
            <div slot="details" style="${panelStyle}"><p style="margin:0">Details step content.</p></div>
            <div slot="review" style="${panelStyle}"><p style="margin:0">Review step content.</p></div>
            <div slot="confirm" style="${panelStyle}"><p style="margin:0">Confirm step content.</p></div>
        </y-stepper>

        <h3 style="margin:24px 0 8px">Large</h3>
        <y-stepper items='${ITEMS_BASIC}' size="large">
            <div slot="account" style="${panelStyle}"><p style="margin:0">Account step content.</p></div>
            <div slot="details" style="${panelStyle}"><p style="margin:0">Details step content.</p></div>
            <div slot="review" style="${panelStyle}"><p style="margin:0">Review step content.</p></div>
            <div slot="confirm" style="${panelStyle}"><p style="margin:0">Confirm step content.</p></div>
        </y-stepper>
    `,
};

export const Interactive = {
    render: () => {
        const items = JSON.stringify([
            { label: "Step 1", slot: "step1" },
            { label: "Step 2", slot: "step2" },
            { label: "Step 3", slot: "step3" },
        ]);

        return `
            <y-stepper id="interactive-stepper" items='${items}'>
                <div slot="step1" style="${panelStyle}">
                    <h3 style="margin:0 0 8px">Step 1</h3>
                    <p style="margin:0 0 16px">First step content.</p>
                    ${navButtons("interactive-stepper", { first: true })}
                </div>
                <div slot="step2" style="${panelStyle}">
                    <h3 style="margin:0 0 8px">Step 2</h3>
                    <p style="margin:0 0 16px">Second step content.</p>
                    ${navButtons("interactive-stepper")}
                </div>
                <div slot="step3" style="${panelStyle}">
                    <h3 style="margin:0 0 8px">Step 3</h3>
                    <p style="margin:0 0 16px">Final step content.</p>
                    ${navButtons("interactive-stepper", { last: true })}
                    <y-button onclick="document.getElementById('interactive-stepper').reset()" style="margin-top:8px">Reset</y-button>
                </div>
            </y-stepper>
        `;
    },
};

export const LinearMode = {
    render: () => {
        const items = JSON.stringify([
            { label: "Step 1", slot: "step1" },
            { label: "Step 2", slot: "step2" },
            { label: "Step 3", slot: "step3" },
        ]);

        return `
            <p style="margin:0 0 8px; font-size:0.85em; color:#666">Linear mode: clicking ahead is blocked. Use the Next button to advance.</p>
            <y-stepper id="linear-stepper" items='${items}' linear>
                <div slot="step1" style="${panelStyle}">
                    <h3 style="margin:0 0 8px">Step 1</h3>
                    <p style="margin:0 0 16px">Complete this before moving on.</p>
                    ${navButtons("linear-stepper", { first: true })}
                </div>
                <div slot="step2" style="${panelStyle}">
                    <h3 style="margin:0 0 8px">Step 2</h3>
                    <p style="margin:0 0 16px">Continue to the final step.</p>
                    ${navButtons("linear-stepper")}
                </div>
                <div slot="step3" style="${panelStyle}">
                    <h3 style="margin:0 0 8px">Step 3</h3>
                    <p style="margin:0 0 16px">All done!</p>
                    ${navButtons("linear-stepper", { last: true })}
                </div>
            </y-stepper>
        `;
    },
};
