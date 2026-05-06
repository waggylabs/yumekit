import "./y-toast.js";
import "../y-button/y-button.js";

// Helper: create a story that auto-fires .show() on render and includes a button to re-trigger.
function autoShow(opts, position = "bottom-right", duration = 3000) {
    return () => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "height:160px;display:flex;align-items:center;justify-content:center;gap:8px";

        const toast = document.createElement("y-toast");
        toast.setAttribute("position", position);
        toast.setAttribute("duration", String(duration));
        wrap.appendChild(toast);

        const fire = () => {
            if (Array.isArray(opts)) {
                opts.forEach((o) => toast.show(o));
            } else {
                toast.show(opts);
            }
        };

        const btn = document.createElement("y-button");
        btn.setAttribute("color", "base");
        btn.textContent = "Show again";
        btn.addEventListener("click", fire);
        wrap.appendChild(btn);

        requestAnimationFrame(fire);

        return wrap;
    };
}

export default {
    title: "Feedback/Toast",
    tags: ["autodocs"],
    argTypes: {
        position: {
            control: "select",
            options: [
                "top-right", "top-left", "top-center",
                "bottom-right", "bottom-left", "bottom-center",
            ],
            description: "Screen position for the toast stack.",
            table: { defaultValue: { summary: "bottom-right" } },
        },
        duration: {
            control: "number",
            description: "Auto-dismiss delay in milliseconds. Set to 0 to disable.",
            table: { defaultValue: { summary: "4000" } },
        },
        max: {
            control: "number",
            description: "Maximum number of toasts visible at once.",
            table: { defaultValue: { summary: "5" } },
        },
    },
    args: {
        position: "bottom-right",
        duration: 4000,
        max: 5,
    },
    render: ({ position, duration, max }) => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "height:160px;display:flex;align-items:center;justify-content:center;gap:8px";

        const toast = document.createElement("y-toast");
        toast.setAttribute("position", position);
        toast.setAttribute("duration", String(duration));
        toast.setAttribute("max", String(max));
        wrap.appendChild(toast);

        const btn = document.createElement("y-button");
        btn.setAttribute("color", "primary");
        btn.textContent = "Show Toast";
        btn.addEventListener("click", () => toast.show({ message: "This is a toast notification." }));
        wrap.appendChild(btn);

        return wrap;
    },
};

// Interactive story â€” click the button to trigger
export const Default = {};

export const Colors = {
    render: () => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "height:160px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap";

        const toast = document.createElement("y-toast");
        toast.setAttribute("position", "bottom-right");
        toast.setAttribute("duration", "3000");
        wrap.appendChild(toast);

        const colors = ["base", "primary", "success", "warning", "error", "help"];
        colors.forEach((color) => {
            const btn = document.createElement("y-button");
            btn.setAttribute("color", color);
            btn.textContent = color.charAt(0).toUpperCase() + color.slice(1);
            btn.addEventListener("click", () =>
                toast.show({ message: `${color.charAt(0).toUpperCase() + color.slice(1)} toast`, color }),
            );
            wrap.appendChild(btn);
        });

        return wrap;
    },
};

// Auto-show stories â€” no button needed, toast fires on render
export const WithIcons = {
    render: autoShow({ message: "File saved successfully.", color: "success", icon: "check" }),
};

export const Persistent = {
    render: autoShow({ message: "This toast won't auto-dismiss.", duration: 0 }),
};

export const NonDismissible = {
    render: autoShow({ message: "No close button.", dismissible: false, duration: 3000 }),
};

export const Stacked = {
    render: autoShow([
        { message: "First notification",  color: "primary" },
        { message: "Second notification", color: "success" },
        { message: "Third notification",  color: "warning" },
    ]),
};

export const Positions = {
    render: () => {
        const wrap = document.createElement("div");
        wrap.style.cssText = "height:160px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap";

        const positions = [
            { id: "tr", pos: "top-right",     label: "Top Right" },
            { id: "tl", pos: "top-left",      label: "Top Left" },
            { id: "tc", pos: "top-center",    label: "Top Center" },
            { id: "br", pos: "bottom-right",  label: "Bottom Right", primary: true },
            { id: "bl", pos: "bottom-left",   label: "Bottom Left" },
            { id: "bc", pos: "bottom-center", label: "Bottom Center" },
        ];

        positions.forEach(({ pos, label, primary }) => {
            const toast = document.createElement("y-toast");
            toast.setAttribute("position", pos);
            toast.setAttribute("duration", "2500");
            wrap.appendChild(toast);

            const btn = document.createElement("y-button");
            btn.setAttribute("color", primary ? "primary" : "base");
            btn.setAttribute("size", "small");
            btn.textContent = label;
            btn.addEventListener("click", () => toast.show({ message: `Position: ${label}` }));
            wrap.appendChild(btn);
        });

        return wrap;
    },
};
