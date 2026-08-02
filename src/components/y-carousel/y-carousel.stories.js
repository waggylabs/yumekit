import "./y-carousel.js";

const slide = (n, bg) => `
    <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 220px;
        font-size: 2rem;
        color: #fff;
        background: ${bg};
    ">Slide ${n}</div>
`;

const palette = ["#4f46e5", "#0891b2", "#059669", "#d97706", "#dc2626"];
const deck = (count = 5) =>
    palette
        .slice(0, count)
        .map((bg, i) => slide(i + 1, bg))
        .join("");

export default {
    title: "Layout/Carousel",
    tags: ["autodocs"],
    argTypes: {
        perView: {
            control: { type: "number", min: 1, step: 0.5 },
            description: "Slides visible at once (fractional peeks the next).",
            table: { defaultValue: { summary: "1" } },
        },
        gap: {
            control: "text",
            description: "CSS length between slides.",
            table: { defaultValue: { summary: "0" } },
        },
        orientation: {
            control: "inline-radio",
            options: ["horizontal", "vertical"],
            table: { defaultValue: { summary: "horizontal" } },
        },
        loop: { control: "boolean", table: { defaultValue: { summary: false } } },
        autoplay: {
            control: "boolean",
            table: { defaultValue: { summary: false } },
        },
        interval: {
            control: "number",
            table: { defaultValue: { summary: "5000" } },
        },
        arrows: {
            control: "inline-radio",
            options: ["true", "false", "hover"],
            table: { defaultValue: { summary: "true" } },
        },
        pagination: {
            control: "inline-radio",
            options: ["dots", "fraction", "none"],
            table: { defaultValue: { summary: "dots" } },
        },
        snap: {
            control: "inline-radio",
            options: ["start", "center"],
            table: { defaultValue: { summary: "start" } },
        },
        swipe: { control: "boolean", table: { defaultValue: { summary: true } } },
    },
    args: {
        perView: 1,
        gap: "0",
        orientation: "horizontal",
        loop: false,
        autoplay: false,
        interval: 5000,
        arrows: "true",
        pagination: "dots",
        snap: "start",
        swipe: true,
    },
    render: ({
        perView,
        gap,
        orientation,
        loop,
        autoplay,
        interval,
        arrows,
        pagination,
        snap,
        swipe,
    }) => `
        <y-theme theme="blue-light">
            <y-carousel
                per-view="${perView}"
                gap="${gap}"
                orientation="${orientation}"
                arrows="${arrows}"
                pagination="${pagination}"
                snap="${snap}"
                swipe="${swipe}"
                interval="${interval}"
                ${loop ? "loop" : ""}
                ${autoplay ? "autoplay" : ""}
                style="${orientation === "vertical" ? "height: 260px;" : ""}"
            >${deck(5)}</y-carousel>
        </y-theme>
    `,
};

export const Default = {};

export const MultiplePerView = {
    args: { perView: 2, gap: "16px" },
};

export const Peek = {
    args: { perView: 1.25, gap: "12px", snap: "center" },
};

export const Loop = {
    args: { loop: true },
};

export const Autoplay = {
    args: { autoplay: true, loop: true, interval: 2500 },
};

export const Fraction = {
    args: { pagination: "fraction" },
};

export const ArrowsOnHover = {
    args: { arrows: "hover" },
};

export const Vertical = {
    args: { orientation: "vertical" },
};
