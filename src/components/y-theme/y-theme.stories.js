import "./y-theme.js";
import "../y-button/y-button.js";
import "../y-card/y-card.js";
import "../y-badge/y-badge.js";
import "../y-input/y-input.js";

export default {
    title: "Components/Theme",
    tags: ["autodocs"],
    argTypes: {
        theme: {
            control: "select",
            options: ["blue-dark", "blue-light", "orange-dark", "orange-light"],
            description: "The active theme name.",
            table: { defaultValue: { summary: "blue-light" } },
        },
    },
    args: {
        theme: "blue-light",
    },
    render: ({ theme }) => `
        <y-theme theme="${theme}" style="display:block;padding:24px">
            <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <y-button color="primary">Primary</y-button>
                    <y-button color="secondary">Secondary</y-button>
                    <y-button color="success">Success</y-button>
                    <y-button color="warning">Warning</y-button>
                    <y-button color="error">Error</y-button>
                </div>
                <y-input>
                    <span slot="label">Input field</span>
                </y-input>
                <y-card>
                    <div slot="header"><strong>Card in theme</strong></div>
                    <p>This content inherits the theme's CSS variables.</p>
                    <div slot="footer">
                        <y-badge color="primary">Active</y-badge>
                    </div>
                </y-card>
            </div>
        </y-theme>
    `,
};

export const BlueDark = {
    args: { theme: "blue-dark" },
};

export const BlueLight = {
    args: { theme: "blue-light" },
};

export const OrangeDark = {
    args: { theme: "orange-dark" },
};

export const OrangeLight = {
    args: { theme: "orange-light" },
};

export const SideBySide = {
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            <y-theme theme="blue-dark" style="display:block;padding:20px;flex:1;min-width:280px">
                <p style="margin:0 0 12px;font-size:0.8em;opacity:0.6">blue-dark</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                    <y-button color="primary">Primary</y-button>
                    <y-button color="success">Success</y-button>
                    <y-button color="error">Error</y-button>
                </div>
                <y-input>
                    <span slot="label">Input</span>
                </y-input>
            </y-theme>

            <y-theme theme="blue-light" style="display:block;padding:20px;flex:1;min-width:280px">
                <p style="margin:0 0 12px;font-size:0.8em;opacity:0.6">blue-light</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                    <y-button color="primary">Primary</y-button>
                    <y-button color="success">Success</y-button>
                    <y-button color="error">Error</y-button>
                </div>
                <y-input>
                    <span slot="label">Input</span>
                </y-input>
            </y-theme>

            <y-theme theme="orange-dark" style="display:block;padding:20px;flex:1;min-width:280px">
                <p style="margin:0 0 12px;font-size:0.8em;opacity:0.6">orange-dark</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                    <y-button color="primary">Primary</y-button>
                    <y-button color="success">Success</y-button>
                    <y-button color="error">Error</y-button>
                </div>
                <y-input>
                    <span slot="label">Input</span>
                </y-input>
            </y-theme>

            <y-theme theme="orange-light" style="display:block;padding:20px;flex:1;min-width:280px">
                <p style="margin:0 0 12px;font-size:0.8em;opacity:0.6">orange-light</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                    <y-button color="primary">Primary</y-button>
                    <y-button color="success">Success</y-button>
                    <y-button color="error">Error</y-button>
                </div>
                <y-input>
                    <span slot="label">Input</span>
                </y-input>
            </y-theme>
        </div>
    `,
};
