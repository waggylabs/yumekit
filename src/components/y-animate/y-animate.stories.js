import "./y-animate.js";
import "../y-card/y-card.js";
import "../y-button/y-button.js";

const card = (label) => `
    <y-card raised style="padding:24px;text-align:center;min-width:140px">
        <strong>${label}</strong>
    </y-card>
`;

const uid = () => "animate-" + Math.random().toString(36).slice(2, 8);

// Wraps a story body in a flex column with a "Replay" button so the
// animation can be re-triggered in the docs frame (otherwise `trigger="load"`
// stories play once on mount and never run again).
const withReplay = (id, body) => `
    <div style="padding:32px;display:flex;flex-direction:column;align-items:center;gap:16px">
        ${body}
        <y-button onclick="
            const el = document.getElementById('${id}');
            if (!el) return;
            el.reset();
            el.play();
        ">Replay</y-button>
    </div>
`;

const ANIMATION_PRESETS = [
    "fade",
    "slide",
    "zoom-in",
    "zoom-out",
    "flip-horizontal",
    "flip-vertical",
    "rotate-in",
    "bounce",
    "shake",
    "scale",
];

export default {
    title: "Utility/Animate",
    tags: ["autodocs"],
    argTypes: {
        animation: {
            control: "select",
            options: ANIMATION_PRESETS,
            description: "Preset animation to apply.",
            table: { defaultValue: { summary: "fade" } },
        },
        direction: {
            control: "select",
            options: ["up", "down", "left", "right"],
            description:
                "Direction for slide / bounce / shake; ignored by other presets.",
            table: { defaultValue: { summary: "up" } },
        },
        duration: {
            control: { type: "number", min: 50, max: 3000, step: 50 },
            description: "Animation duration (ms).",
            table: { defaultValue: { summary: "300" } },
        },
        delay: {
            control: { type: "number", min: 0, max: 2000, step: 50 },
            description: "Delay before the animation starts (ms).",
            table: { defaultValue: { summary: "0" } },
        },
        easing: {
            control: "select",
            options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],
            description: "Easing function.",
            table: { defaultValue: { summary: "ease-out" } },
        },
        trigger: {
            control: "select",
            options: ["load", "visible", "manual"],
            description: "When the animation starts.",
            table: { defaultValue: { summary: "load" } },
        },
        reverse: {
            control: "boolean",
            description: "Plays the animation in reverse.",
        },
        disabled: {
            control: "boolean",
            description: "Disables animation playback.",
        },
    },
    args: {
        animation: "fade",
        direction: "up",
        duration: 600,
        delay: 0,
        easing: "ease-out",
        trigger: "load",
        reverse: false,
        disabled: false,
    },
    render: ({
        animation,
        direction,
        duration,
        delay,
        easing,
        trigger,
        reverse,
        disabled,
    }) => {
        const id = uid();
        return withReplay(
            id,
            `
                <y-animate
                    id="${id}"
                    animation="${animation}"
                    direction="${direction}"
                    duration="${duration}"
                    delay="${delay}"
                    easing="${easing}"
                    trigger="${trigger}"
                    ${reverse ? "reverse" : ""}
                    ${disabled ? "disabled" : ""}
                    once="false"
                >
                    ${card("Hello")}
                </y-animate>
            `,
        );
    },
};

export const Default = {};

export const Slide = {
    args: { animation: "slide", direction: "up", duration: 500 },
};

export const ZoomIn = {
    args: { animation: "zoom-in", duration: 500 },
};

export const ZoomOut = {
    args: { animation: "zoom-out", duration: 500 },
};

export const FlipHorizontal = {
    args: { animation: "flip-horizontal", duration: 600 },
};

export const RotateIn = {
    args: { animation: "rotate-in", duration: 600 },
};

export const Bounce = {
    args: { animation: "bounce", duration: 800 },
};

export const Shake = {
    args: { animation: "shake", duration: 600 },
};

export const Reverse = {
    args: { animation: "slide", reverse: true, duration: 600 },
    parameters: {
        docs: {
            description: {
                story: "Plays the animation in reverse â€” useful for exit transitions.",
            },
        },
    },
};

export const Stagger = {
    render: () => {
        const id = uid();
        return withReplay(
            id,
            `
                <y-animate
                    id="${id}"
                    animation="slide"
                    direction="up"
                    duration="500"
                    stagger
                    stagger-delay="80"
                    once="false"
                >
                    ${card("One")}
                    ${card("Two")}
                    ${card("Three")}
                    ${card("Four")}
                </y-animate>
            `,
        );
    },
    parameters: {
        docs: {
            description: {
                story: "Each direct child gets a per-index delay (`stagger-delay` ms apart).",
            },
        },
    },
};

export const ManualTrigger = {
    render: () => {
        const id = uid();
        return `
            <div style="padding:32px;display:flex;flex-direction:column;align-items:center;gap:16px">
                <y-animate
                    id="${id}"
                    trigger="manual"
                    animation="bounce"
                    direction="up"
                    duration="800"
                    once="false"
                >
                    ${card("Click play")}
                </y-animate>
                <y-button onclick="document.getElementById('${id}').play()">Play</y-button>
            </div>
        `;
    },
    parameters: {
        docs: {
            description: {
                story: "With `trigger=\"manual\"`, the animation only runs when `play()` is called.",
            },
        },
    },
};

export const VisibilityTrigger = {
    render: () => {
        const id = uid();
        return `
            <div style="padding:32px;display:flex;flex-direction:column;gap:600px">
                <p>Scroll down to trigger the animation when the card enters the viewportâ€¦</p>
                <y-animate
                    id="${id}"
                    trigger="visible"
                    animation="zoom-in"
                    duration="600"
                    once="false"
                >
                    ${card("Visible!")}
                </y-animate>
            </div>
        `;
    },
    parameters: {
        docs: {
            description: {
                story: "`trigger=\"visible\"` defers playback until the element scrolls into the viewport.",
            },
        },
    },
};
