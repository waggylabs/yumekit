// Import base tokens and all theme files as raw strings so we can inject/swap them at runtime.
// Using ?inline bypasses the css-string plugin so Vite returns the CSS as a plain string.
import variablesCSS from "../styles/variables.css?inline";
import blueDarkCSS from "../styles/blue-dark.css?inline";
import blueLightCSS from "../styles/blue-light.css?inline";
import orangeDarkCSS from "../styles/orange-dark.css?inline";
import orangeLightCSS from "../styles/orange-light.css?inline";
import greenDarkCSS from "../styles/green-dark.css?inline";
import greenLightCSS from "../styles/green-light.css?inline";
import indigoDarkCSS from "../styles/indigo-dark.css?inline";
import indigoLightCSS from "../styles/indigo-light.css?inline";
import redDarkCSS from "../styles/red-dark.css?inline";
import redLightCSS from "../styles/red-light.css?inline";
import tealDarkCSS from "../styles/teal-dark.css?inline";
import tealLightCSS from "../styles/teal-light.css?inline";
import yellowDarkCSS from "../styles/yellow-dark.css?inline";
import yellowLightCSS from "../styles/yellow-light.css?inline";
import purpleDarkCSS from "../styles/purple-dark.css?inline";
import purpleLightCSS from "../styles/purple-light.css?inline";
import pinkDarkCSS from "../styles/pink-dark.css?inline";
import pinkLightCSS from "../styles/pink-light.css?inline";
import brownDarkCSS from "../styles/brown-dark.css?inline";
import brownLightCSS from "../styles/brown-light.css?inline";
import oliveDarkCSS from "../styles/olive-dark.css?inline";
import oliveLightCSS from "../styles/olive-light.css?inline";

// Inject base tokens once — these never change between themes
const varStyle = document.createElement("style");
varStyle.id = "yumekit-storybook-variables";
varStyle.textContent = variablesCSS;
document.head.appendChild(varStyle);

// Apply theme content color to the body so elements with `color: inherit`
// (e.g. y-icon without an explicit color) are visible on dark backgrounds.
const bodyStyle = document.createElement("style");
bodyStyle.id = "yumekit-storybook-body";
bodyStyle.textContent =
    "body { color: var(--base-content--); font-family: var(--font-family-body, 'Lexend', sans-serif); }";
document.head.appendChild(bodyStyle);

// Load the Lexend font used by --font-family-body / --font-family-header.
// y-theme normally does this, but stories that don't use y-theme need it too.
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
    "https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap";
document.head.appendChild(fontLink);

const THEME_STYLE_ID = "yumekit-storybook-theme";

const THEME_MAP = {
    "blue-dark": blueDarkCSS,
    "blue-light": blueLightCSS,
    "orange-dark": orangeDarkCSS,
    "orange-light": orangeLightCSS,
    "green-dark": greenDarkCSS,
    "green-light": greenLightCSS,
    "indigo-dark": indigoDarkCSS,
    "indigo-light": indigoLightCSS,
    "red-dark": redDarkCSS,
    "red-light": redLightCSS,
    "teal-dark": tealDarkCSS,
    "teal-light": tealLightCSS,
    "yellow-dark": yellowDarkCSS,
    "yellow-light": yellowLightCSS,
    "purple-dark": purpleDarkCSS,
    "purple-light": purpleLightCSS,
    "pink-dark": pinkDarkCSS,
    "pink-light": pinkLightCSS,
    "brown-dark": brownDarkCSS,
    "brown-light": brownLightCSS,
    "olive-dark": oliveDarkCSS,
    "olive-light": oliveLightCSS,
};

function applyTheme(css) {
    let el = document.getElementById(THEME_STYLE_ID);
    if (!el) {
        el = document.createElement("style");
        el.id = THEME_STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = css;
}

// Decorator: swap theme whenever the Storybook background changes
export const decorators = [
    (story, context) => {
        const bg = context.globals?.backgrounds?.value;
        applyTheme(THEME_MAP[bg] ?? blueDarkCSS);
        return story();
    },
];

export default {
    parameters: {
        backgrounds: {
            options: {
                "blue-dark": { name: "Blue Dark", value: "#1a1a1a" },
                "blue-light": { name: "Blue Light", value: "#f0f0f2" },
                "orange-dark": { name: "Orange Dark", value: "#1a1a1a" },
                "orange-light": { name: "Orange Light", value: "#f0f0f2" },
                "green-dark": { name: "Green Dark", value: "#1a1a1a" },
                "green-light": { name: "Green Light", value: "#f0f0f2" },
                "indigo-dark": { name: "Indigo Dark", value: "#1a1a1a" },
                "indigo-light": { name: "Indigo Light", value: "#f0f0f2" },
                "red-dark": { name: "Red Dark", value: "#1a1a1a" },
                "red-light": { name: "Red Light", value: "#f0f0f2" },
                "teal-dark": { name: "Teal Dark", value: "#1a1a1a" },
                "teal-light": { name: "Teal Light", value: "#f0f0f2" },
                "yellow-dark": { name: "Yellow Dark", value: "#1a1a1a" },
                "yellow-light": { name: "Yellow Light", value: "#f0f0f2" },
                "purple-dark": { name: "Purple Dark", value: "#1a1a1a" },
                "purple-light": { name: "Purple Light", value: "#f0f0f2" },
                "pink-dark": { name: "Pink Dark", value: "#1a1a1a" },
                "pink-light": { name: "Pink Light", value: "#f0f0f2" },
                "brown-dark": { name: "Brown Dark", value: "#1a1a1a" },
                "brown-light": { name: "Brown Light", value: "#f0f0f2" },
                "olive-dark": { name: "Olive Dark", value: "#1a1a1a" },
                "olive-light": { name: "Olive Light", value: "#f0f0f2" },
            },
        },

        docs: {
            toc: true,
        },

        a11y: {
            // 'todo' - show a11y violations in the test UI only
            // 'error' - fail CI on a11y violations
            // 'off' - skip a11y checks entirely
            test: "todo"
        }
    },

    initialGlobals: {
        backgrounds: {
            value: "blue-dark",
        },
    },
};
