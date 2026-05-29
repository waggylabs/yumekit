import "./y-help.js";
import "../y-button/y-button.js";

// y-help resolves targets via document.getElementById / document.querySelector,
// which is a global lookup. In Storybook autodocs every story renders on the
// same page, so each story uses a unique ID prefix (default-, multi-, etc.)
// to avoid clashing with siblings.
//
// Interaction wiring follows the project convention used by y-animate / other
// stories: inline `onclick=` on a <y-button>. Storybook's `@storybook/html-vite`
// renderer inserts story output via innerHTML, which preserves inline event
// attributes but does NOT execute <script> tags — so play() / inline <script>
// patterns don't work here. Steps are passed via the y-help `steps` JSON
// attribute, with apostrophes HTML-escaped so the JSON can live inside a
// single-quoted attribute.

function demoLayout(prefix) {
    return `
        <div style="display:flex;flex-direction:column;gap:16px;max-width:640px;padding:24px;font-family:var(--font-family-body);color:var(--base-content--)">
            <h2 id="${prefix}-title" style="margin:0;font-size:1.25rem">Yume Dashboard</h2>
            <p id="${prefix}-description" style="margin:0;color:var(--base-content-light)">
                Click the button below to launch this story&apos;s guided tour.
            </p>
            <div style="display:flex;gap:8px">
                <y-button id="${prefix}-create" color="primary" style-type="filled">+ New agent</y-button>
                <y-button id="${prefix}-filter" style-type="outlined">Filter</y-button>
                <y-button id="${prefix}-settings" style-type="outlined">Settings</y-button>
            </div>
            <div id="${prefix}-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
                <div id="${prefix}-card-1" style="padding:16px;border:1px solid var(--base-border);border-radius:8px;background:var(--base-background-component)">Research Assistant</div>
                <div id="${prefix}-card-2" style="padding:16px;border:1px solid var(--base-border);border-radius:8px;background:var(--base-background-component)">Code Reviewer</div>
                <div id="${prefix}-card-3" style="padding:16px;border:1px solid var(--base-border);border-radius:8px;background:var(--base-background-component)">Email Triager</div>
            </div>
        </div>
    `;
}

// Serialize a steps array into a value safe to drop into a single-quoted
// HTML attribute. JSON.stringify already escapes `"`; we only need to encode
// `'` so it doesn't terminate the attribute.
function stepsAttr(steps) {
    return JSON.stringify(steps).replace(/'/g, "&#39;");
}

function tourRender({ prefix, attrs = "", steps }) {
    return `
        ${demoLayout(prefix)}
        <div style="padding:0 24px 24px">
            <y-button
                color="primary"
                style-type="filled"
                onclick="document.getElementById('${prefix}-help').start()"
            >Launch tour</y-button>
        </div>
        <y-help
            id="${prefix}-help"
            ${attrs}
            steps='${stepsAttr(steps)}'
        ></y-help>
    `;
}

export default {
    title: "Overlay/Help",
    tags: ["autodocs"],
};

export const Default = {
    render: () =>
        tourRender({
            prefix: "default",
            steps: [
                { target: "default-title", title: "Welcome", content: "This is your dashboard." },
                { target: "default-create", title: "Create agents", content: "Tap here to spin up a new agent." },
                { target: "default-filter", title: "Filter your view", content: "Narrow the list by status or capability." },
                { target: "default-grid", title: "Your agents", content: "Each card represents a configured agent." },
                { title: "All set", content: "You can re-open this tour any time from Settings." },
            ],
        }),
};

export const MultiTarget = {
    render: () =>
        tourRender({
            prefix: "multi",
            steps: [
                {
                    target: ["multi-create", "multi-filter", "multi-settings"],
                    anchor: "first",
                    title: "Toolbar",
                    content: "All your top-level actions live up here.",
                },
                {
                    target: ["multi-card-1", "multi-card-2", "multi-card-3"],
                    anchor: "bounds",
                    position: "bottom",
                    title: "Agent grid",
                    content: "Every agent gets its own card with stats and a quick-action menu.",
                },
            ],
        }),
};

export const UntargetedCenterStep = {
    render: () =>
        tourRender({
            prefix: "center",
            steps: [
                { title: "Welcome to Yume", content: "Walk through a few highlights." },
                { target: "center-create", title: "Create", content: "Spin up new agents from here." },
                { title: "Tour complete", content: "You are ready to explore." },
            ],
        }),
};

export const NoOverlayArrows = {
    render: () =>
        tourRender({
            prefix: "noarrows",
            attrs: `show-arrows="false"`,
            steps: [
                { target: "noarrows-title", title: "Title", content: "Tooltip-only navigation." },
                { target: "noarrows-create", title: "Create", content: "No giant overlay arrows in this variant." },
            ],
        }),
};

export const CloseOnOverlayClick = {
    render: () =>
        tourRender({
            prefix: "overlay",
            attrs: "close-on-overlay-click",
            steps: [
                { target: "overlay-title", content: "Click anywhere in the dim area to dismiss the tour." },
            ],
        }),
};

export const Looping = {
    render: () =>
        tourRender({
            prefix: "loop",
            attrs: "loop",
            steps: [
                { target: "loop-card-1", content: "First card." },
                { target: "loop-card-2", content: "Second card." },
                { target: "loop-card-3", content: "Third card — Next wraps to the first." },
            ],
        }),
};
