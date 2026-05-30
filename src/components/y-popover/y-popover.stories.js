import "./y-popover.js";
import "../y-button/y-button.js";

// Interaction wiring follows the project convention used by y-help / y-animate
// stories: inline `onclick=` on a <y-button>. Storybook's `@storybook/html-vite`
// renderer inserts story output via innerHTML, which preserves inline event
// attributes but does NOT execute <script> tags — so play() / inline <script>
// patterns don't work here. Stories that need imperative control wire the
// y-popover methods (show/hide/toggle) through onclick.

export default {
    title: "Feedback/Popover",
    tags: ["autodocs"],
    argTypes: {
        position: {
            control: "select",
            options: [
                "auto",
                "top",
                "bottom",
                "left",
                "right",
                "top-start",
                "top-end",
                "bottom-start",
                "bottom-end",
            ],
            description: "Placement relative to the anchor.",
            table: { defaultValue: { summary: "auto" } },
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
            description: "Color theme.",
            table: { defaultValue: { summary: "base" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            table: { defaultValue: { summary: "medium" } },
        },
        offset: {
            control: "number",
            table: { defaultValue: { summary: 8 } },
        },
        trigger: {
            control: "select",
            options: [
                "manual",
                "click",
                "hover",
                "focus",
                "click hover",
                "hover focus",
                "context-menu",
            ],
            description:
                "Space-separated activation modes. `manual` requires show()/hide().",
            table: { defaultValue: { summary: "manual" } },
        },
    },
    args: {
        position: "bottom",
        color: "base",
        size: "medium",
        offset: 8,
        trigger: "click",
    },
};

export const Playground = {
    render: ({ position, color, size, offset, trigger }) => `
        <div style="padding:80px;display:flex;justify-content:center">
            <y-button id="pop-playground-anchor" color="primary">
                ${trigger === "manual" ? "Toggle popover" : "Anchor"}
            </y-button>
            <y-popover
                id="pop-playground"
                anchor="pop-playground-anchor"
                position="${position}"
                color="${color}"
                size="${size}"
                offset="${offset}"
                trigger="${trigger}"
                text="Anchored popover content."
            ></y-popover>
        </div>
    `,
};

// Manual mode: the trigger element calls toggle()/show()/hide() directly so
// authors see how the public API drives the popover when no built-in trigger
// is wired.
export const Manual = {
    render: () => `
        <div style="padding:80px;display:flex;gap:24px;justify-content:center">
            <y-button
                id="pop-manual-anchor"
                color="primary"
                onclick="document.getElementById('pop-manual').toggle()"
            >Toggle (manual)</y-button>
            <y-popover
                id="pop-manual"
                anchor="pop-manual-anchor"
                position="bottom"
                text="Opened via popover.toggle() from the trigger's onclick."
            ></y-popover>
        </div>
    `,
};

export const ClickTrigger = {
    render: () => `
        <div style="padding:80px;display:flex;gap:24px;justify-content:center">
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <y-button id="pop-click-1">Click me</y-button>
                <small>default: outside-click closes</small>
            </div>
            <y-popover
                anchor="pop-click-1"
                trigger="click"
                text="Click outside or press Escape to close."
            ></y-popover>

            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <y-button id="pop-click-2" color="primary">Click toggles</y-button>
                <small>close-on-anchor-click on</small>
            </div>
            <y-popover
                anchor="pop-click-2"
                trigger="click"
                close-on-anchor-click
                text="Click the anchor again to toggle me closed."
            ></y-popover>
        </div>
    `,
};

export const HoverTrigger = {
    render: () => `
        <div style="padding:80px;display:flex;gap:24px;justify-content:center">
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <y-button id="pop-hover-1">Hover or focus me</y-button>
                <small>trigger="hover focus"</small>
            </div>
            <y-popover
                anchor="pop-hover-1"
                trigger="hover focus"
                text="Mouse-over or keyboard-focus shows me."
            ></y-popover>

            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <y-button id="pop-hover-2" color="secondary">Delayed</y-button>
                <small>delay-show=300, delay-hide=150</small>
            </div>
            <y-popover
                anchor="pop-hover-2"
                trigger="hover"
                delay-show="300"
                delay-hide="150"
                text="300ms before I appear, 150ms grace before I close."
            ></y-popover>
        </div>
    `,
};

export const ContextMenuTrigger = {
    render: () => `
        <div style="padding:80px;display:flex;justify-content:center">
            <y-button id="pop-context" style-type="outlined">Right-click me</y-button>
            <y-popover anchor="pop-context" trigger="context-menu" position="bottom-start">
                <strong slot="header">Actions</strong>
                <div style="display:grid;gap:4px">
                    <y-button size="small" style-type="flat">Edit</y-button>
                    <y-button size="small" style-type="flat">Duplicate</y-button>
                    <y-button size="small" style-type="flat" color="error">Delete</y-button>
                </div>
            </y-popover>
        </div>
    `,
};

export const HeaderAndFooter = {
    render: () => `
        <div style="padding:80px;display:flex;justify-content:center">
            <y-button
                id="pop-rich-anchor"
                color="primary"
                onclick="document.getElementById('pop-rich').toggle()"
            >Save layout</y-button>
            <y-popover
                id="pop-rich"
                anchor="pop-rich-anchor"
                position="bottom"
            >
                <strong slot="header">Confirm change</strong>
                <p style="margin:0">
                    Saving will overwrite the existing layout.
                </p>
                <div slot="footer">
                    <y-button
                        size="small"
                        style-type="outlined"
                        onclick="document.getElementById('pop-rich').hide('user')"
                    >Cancel</y-button>
                    <y-button
                        size="small"
                        color="primary"
                        onclick="document.getElementById('pop-rich').hide('user')"
                    >Save</y-button>
                </div>
            </y-popover>
        </div>
    `,
};

// Demonstrates flip-on-collision. Both anchors are pinned to viewport edges
// via position:fixed so the bottom/top placements genuinely can't fit and
// the popover falls through the candidate cascade. Look at the pointer:
// data-side reflects the side it actually landed on after flipping.
export const AutoFlip = {
    render: () => `
        <div style="min-height:600px;padding:80px">
            <p style="color:var(--base-content-light);margin-bottom:24px">
                Both anchors are pinned to a viewport edge so the requested
                side cannot fit — watch the pointer indicate which side the
                popover flipped to.
            </p>
            <y-button
                style="position:fixed;bottom:16px;left:48px"
                id="pop-flip-down"
                color="primary"
                onclick="document.getElementById('pop-flip-down-pop').toggle()"
            >Wants bottom</y-button>
            <y-popover
                id="pop-flip-down-pop"
                anchor="pop-flip-down"
                position="bottom"
                open
                text="Requested bottom → flipped to top."
            ></y-popover>

            <y-button
                style="position:fixed;top:16px;left:240px"
                id="pop-flip-up"
                color="primary"
                onclick="document.getElementById('pop-flip-up-pop').toggle()"
            >Wants top</y-button>
            <y-popover
                id="pop-flip-up-pop"
                anchor="pop-flip-up"
                position="top"
                open
                text="Requested top → flipped to bottom."
            ></y-popover>
        </div>
    `,
};

// `portal="true"` moves the popover surface (and backdrop) to a host
// element appended to <body>. Use it when an ancestor's stacking context,
// `clip-path`, or other containing-block hostiles would otherwise trap the
// popover inside its local rendering scope. Open the popover and inspect
// the DOM: the .surface lives inside `body > .y-popover-portal`, no longer
// inside the y-popover host's shadow root.
export const Portal = {
    render: () => `
        <div style="padding:80px;display:flex;gap:24px;justify-content:center">
            <y-button
                id="pop-portal-anchor"
                color="primary"
                onclick="document.getElementById('pop-portal').toggle()"
            >Open portaled popover</y-button>
            <y-popover
                id="pop-portal"
                anchor="pop-portal-anchor"
                position="bottom"
                portal
            >
                <strong slot="header">Portaled surface</strong>
                <p style="margin:0">
                    Inspect the DOM — this surface lives in
                    <code>body &gt; .y-popover-portal</code>, escaping any
                    ancestor stacking / clip-path / transform context the
                    anchor sits inside.
                </p>
            </y-popover>
        </div>
    `,
};

export const Modal = {
    render: () => `
        <div style="padding:80px;display:flex;gap:24px;justify-content:center">
            <y-button
                id="pop-modal-anchor"
                color="primary"
                onclick="document.getElementById('pop-modal').toggle()"
            >Confirm action</y-button>
            <y-popover id="pop-modal" anchor="pop-modal-anchor" modal>
                <strong slot="header">Delete this item?</strong>
                <p style="margin:0">
                    This action cannot be undone. Focus is trapped inside
                    the popover until you choose an action or press Escape.
                </p>
                <div slot="footer">
                    <y-button
                        size="small"
                        style-type="outlined"
                        onclick="document.getElementById('pop-modal').hide('user')"
                    >Cancel</y-button>
                    <y-button
                        size="small"
                        color="error"
                        onclick="document.getElementById('pop-modal').hide('user')"
                    >Delete</y-button>
                </div>
            </y-popover>
        </div>
    `,
};

export const NonModalBackdrop = {
    render: () => `
        <div style="padding:80px;display:flex;gap:24px;justify-content:center">
            <y-button
                id="pop-sb-anchor"
                onclick="document.getElementById('pop-sb').toggle()"
            >Open with backdrop</y-button>
            <y-popover
                id="pop-sb"
                anchor="pop-sb-anchor"
                show-backdrop
                text="Non-modal popover with a dimmed backdrop. Focus is not trapped, but the backdrop catches outside clicks."
            ></y-popover>
        </div>
    `,
};

export const Sides = {
    render: () => `
        <div style="padding:120px;display:grid;grid-template-columns:repeat(4,auto);gap:60px;justify-content:center;align-items:center">
            ${["top", "bottom", "left", "right"]
                .map(
                    (side) => `
                        <div style="display:flex;justify-content:center">
                            <y-button id="pop-side-${side}">${side}</y-button>
                            <y-popover
                                anchor="pop-side-${side}"
                                position="${side}"
                                open
                                text="Popover on ${side}"
                            ></y-popover>
                        </div>
                    `,
                )
                .join("")}
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="padding:80px;display:flex;flex-wrap:wrap;gap:48px;justify-content:center">
            ${["primary", "success", "warning", "error", "help"]
                .map(
                    (color) => `
                        <div style="display:flex;justify-content:center">
                            <y-button id="pop-color-${color}" color="${color}">${color}</y-button>
                            <y-popover
                                anchor="pop-color-${color}"
                                color="${color}"
                                position="bottom"
                                open
                                text="${color} popover"
                            ></y-popover>
                        </div>
                    `,
                )
                .join("")}
        </div>
    `,
};
