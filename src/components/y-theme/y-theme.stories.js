import "./y-theme.js";
import "../y-button/y-button.js";
import "../y-card/y-card.js";
import "../y-badge/y-badge.js";
import "../y-input/y-input.js";

const ALL_THEMES = [
    "blue-dark",
    "blue-light",
    "orange-dark",
    "orange-light",
    "red-dark",
    "red-light",
    "green-dark",
    "green-light",
    "teal-dark",
    "teal-light",
    "yellow-dark",
    "yellow-light",
    "indigo-dark",
    "indigo-light",
    "purple-dark",
    "purple-light",
    "pink-dark",
    "pink-light",
    "brown-dark",
    "brown-light",
    "olive-dark",
    "olive-light",
];

function themePreview(theme) {
    return `
        <y-theme theme="${theme}" style="display:block;flex:1;min-width:260px">
            <y-card>
                <p style="margin:0 0 12px;font-size:0.8em;opacity:0.6">${theme}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                    <y-button color="primary">Primary</y-button>
                    <y-button color="success">Success</y-button>
                    <y-button color="error">Error</y-button>
                </div>
                <y-input><span slot="label">Input</span></y-input>
            </y-card>
        </y-theme>
    `;
}

export default {
    title: "Components/Theme",
    tags: ["autodocs"],
    argTypes: {
        theme: {
            control: "select",
            options: ALL_THEMES,
            description: "The active theme name.",
            table: { defaultValue: { summary: "blue-light" } },
        },
    },
    args: {
        theme: "blue-light",
    },
    render: ({ theme }) => `
        <y-theme theme="${theme}" style="display:block">
            <y-card style="max-width:400px">
                <div style="display:flex;flex-direction:column;gap:16px">
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
                            <y-badge color="primary" value="Active"></y-badge>
                        </div>
                    </y-card>
                </div>
            </y-card>
        </y-theme>
    `,
};

export const BlueDark = { args: { theme: "blue-dark" } };
export const BlueLight = { args: { theme: "blue-light" } };
export const OrangeDark = { args: { theme: "orange-dark" } };
export const OrangeLight = { args: { theme: "orange-light" } };
export const RedDark = { args: { theme: "red-dark" } };
export const RedLight = { args: { theme: "red-light" } };
export const GreenDark = { args: { theme: "green-dark" } };
export const GreenLight = { args: { theme: "green-light" } };
export const TealDark = { args: { theme: "teal-dark" } };
export const TealLight = { args: { theme: "teal-light" } };
export const YellowDark = { args: { theme: "yellow-dark" } };
export const YellowLight = { args: { theme: "yellow-light" } };
export const IndigoDark = { args: { theme: "indigo-dark" } };
export const IndigoLight = { args: { theme: "indigo-light" } };
export const PurpleDark = { args: { theme: "purple-dark" } };
export const PurpleLight = { args: { theme: "purple-light" } };
export const PinkDark = { args: { theme: "pink-dark" } };
export const PinkLight = { args: { theme: "pink-light" } };
export const BrownDark = { args: { theme: "brown-dark" } };
export const BrownLight = { args: { theme: "brown-light" } };
export const OliveDark = { args: { theme: "olive-dark" } };
export const OliveLight = { args: { theme: "olive-light" } };

export const AllThemes = {
    name: "All Themes",
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${ALL_THEMES.map(themePreview).join("")}
        </div>
    `,
};
