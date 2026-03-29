import "./y-toast.js";
import "./y-button.js";

export default {
    title: "Components/Toast",
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
    render: ({ position, duration, max }) => `
        <div style="height:300px;display:flex;align-items:center;justify-content:center;gap:8px">
            <y-button id="toast-trigger" color="primary">Show Toast</y-button>
            <y-toast id="demo-toast" position="${position}" duration="${duration}" max="${max}"></y-toast>
        </div>
        <script>
            document.getElementById("toast-trigger").addEventListener("click", () => {
                document.getElementById("demo-toast").show({ message: "This is a toast notification." });
            });
        </script>
    `,
};

export const Default = {
    play: ({ canvasElement }) => {
        canvasElement.querySelector("y-toast").show({
            message: "This is a toast notification.",
        });
    },
};

export const Colors = {
    render: () => `
        <div style="height:300px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
            <y-button id="toast-base" color="base">Base</y-button>
            <y-button id="toast-primary" color="primary">Primary</y-button>
            <y-button id="toast-success" color="success">Success</y-button>
            <y-button id="toast-warning" color="warning">Warning</y-button>
            <y-button id="toast-error" color="error">Error</y-button>
            <y-button id="toast-help" color="help">Help</y-button>
            <y-toast id="colors-toast" position="bottom-right" duration="3000"></y-toast>
        </div>
        <script>
            (function() {
                const toast = document.getElementById("colors-toast");
                const colors = ["base", "primary", "success", "warning", "error", "help"];
                colors.forEach(color => {
                    document.getElementById("toast-" + color).addEventListener("click", () => {
                        toast.show({ message: color.charAt(0).toUpperCase() + color.slice(1) + " toast", color });
                    });
                });
            })();
        </script>
    `,
};

export const WithIcons = {
    play: ({ canvasElement }) => {
        const toast = canvasElement.querySelector("y-toast");
        toast.show({ message: "File saved successfully.", color: "success", icon: "check" });
    },
};

export const Persistent = {
    play: ({ canvasElement }) => {
        canvasElement.querySelector("y-toast").show({
            message: "This toast won't auto-dismiss.",
            duration: 0,
        });
    },
};

export const NonDismissible = {
    play: ({ canvasElement }) => {
        canvasElement.querySelector("y-toast").show({
            message: "This toast has no close button.",
            dismissible: false,
            duration: 3000,
        });
    },
};

export const Positions = {
    render: () => `
        <div style="height:300px;display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
            <y-button id="tp-tr" color="base" size="small">Top Right</y-button>
            <y-button id="tp-tl" color="base" size="small">Top Left</y-button>
            <y-button id="tp-tc" color="base" size="small">Top Center</y-button>
            <y-button id="tp-br" color="primary" size="small">Bottom Right</y-button>
            <y-button id="tp-bl" color="base" size="small">Bottom Left</y-button>
            <y-button id="tp-bc" color="base" size="small">Bottom Center</y-button>

            <y-toast id="pos-tr" position="top-right" duration="2500"></y-toast>
            <y-toast id="pos-tl" position="top-left" duration="2500"></y-toast>
            <y-toast id="pos-tc" position="top-center" duration="2500"></y-toast>
            <y-toast id="pos-br" position="bottom-right" duration="2500"></y-toast>
            <y-toast id="pos-bl" position="bottom-left" duration="2500"></y-toast>
            <y-toast id="pos-bc" position="bottom-center" duration="2500"></y-toast>
        </div>
        <script>
            (function() {
                const positions = ["tr","tl","tc","br","bl","bc"];
                positions.forEach(p => {
                    document.getElementById("tp-" + p).addEventListener("click", () => {
                        document.getElementById("pos-" + p).show({ message: "Position: " + p });
                    });
                });
            })();
        </script>
    `,
};

export const Stacked = {
    play: ({ canvasElement }) => {
        const toast = canvasElement.querySelector("y-toast");
        toast.show({ message: "First notification",  color: "primary" });
        toast.show({ message: "Second notification", color: "success" });
        toast.show({ message: "Third notification",  color: "warning" });
    },
};
