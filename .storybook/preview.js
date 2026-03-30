// Import base tokens and all theme files as raw strings so we can inject/swap them at runtime.
// Using ?inline bypasses the css-string plugin so Vite returns the CSS as a plain string.
import variablesCSS from "../styles/variables.css?inline";
import blueDarkCSS from "../styles/blue-dark.css?inline";
import blueLightCSS from "../styles/blue-light.css?inline";
import orangeDarkCSS from "../styles/orange-dark.css?inline";
import orangeLightCSS from "../styles/orange-light.css?inline";

// Inject base tokens once — these never change between themes
const varStyle = document.createElement("style");
varStyle.id = "yumekit-storybook-variables";
varStyle.textContent = variablesCSS;
document.head.appendChild(varStyle);

// Apply theme content color to the body so elements with `color: inherit`
// (e.g. y-icon without an explicit color) are visible on dark backgrounds.
const bodyStyle = document.createElement("style");
bodyStyle.id = "yumekit-storybook-body";
bodyStyle.textContent = "body { color: var(--base-content--); font-family: var(--font-family-body, 'Lexend', sans-serif); }";
document.head.appendChild(bodyStyle);

// Load the Lexend font used by --font-family-body / --font-family-header.
// y-theme normally does this, but stories that don't use y-theme need it too.
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap";
document.head.appendChild(fontLink);

const THEME_STYLE_ID = "yumekit-storybook-theme";

const THEME_MAP = {
    "blue-dark":    blueDarkCSS,
    "blue-light":   blueLightCSS,
    "orange-dark":  orangeDarkCSS,
    "orange-light": orangeLightCSS,
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
                "blue-dark":    { name: "Blue Dark",    value: "#1a1a1a" },
                "blue-light":   { name: "Blue Light",   value: "#f0f0f2" },
                "orange-dark":  { name: "Orange Dark",  value: "#1a1a1a" },
                "orange-light": { name: "Orange Light", value: "#f0f0f2" },
            },
        },
        docs: {
            toc: true,
        },
    },

    initialGlobals: {
        backgrounds: {
            value: "blue-dark",
        },
    },
};
