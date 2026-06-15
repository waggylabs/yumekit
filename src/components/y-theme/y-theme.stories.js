import "./y-theme.js";
import "../y-button/y-button.js";
import "../y-card/y-card.js";
import "../y-tag/y-tag.js";
import "../y-badge/y-badge.js";
import "../y-input/y-input.js";
import "../y-checkbox/y-checkbox.js";
import "../y-select/y-select.js";
import "../y-switch/y-switch.js";

// Broad component sampling so a full theme (shape + typography + status palette,
// not just a primary hue) can actually be eyeballed/tested.
function showcase(theme, label) {
    return `
        <y-theme theme="${theme}" style="display:block;flex:1;min-width:340px;border-radius:12px;overflow:hidden;border:1px solid var(--base-border)">
            <div style="padding:20px;background:var(--base-background-app);color:var(--base-content);font-family:var(--font-family-body)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
                    <strong style="font-size:1.1em;font-weight:var(--font-weight-heading)">${label}</strong>
                    <y-tag color="primary">${theme}</y-tag>
                </div>
                <y-card style="margin-bottom:16px">
                    <div slot="header"><strong>Account settings</strong></div>
                    <div style="display:flex;flex-direction:column;gap:12px">
                        <y-input><span slot="label">Full name</span></y-input>
                        <y-input variant="underline"><span slot="label">Email (underline)</span></y-input>
                        <y-select placeholder="Choose a plan" options='[{"value":"free","label":"Free"},{"value":"pro","label":"Pro"},{"value":"team","label":"Team"}]'></y-select>
                        <div style="display:flex;gap:20px;align-items:center">
                            <y-checkbox checked>Email updates</y-checkbox>
                            <y-switch checked></y-switch>
                        </div>
                    </div>
                    <div slot="footer" style="display:flex;gap:8px">
                        <y-button color="primary" style-type="filled">Save</y-button>
                        <y-button color="primary" style-type="outlined">Cancel</y-button>
                    </div>
                </y-card>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                    <y-button color="primary" style-type="filled">Primary</y-button>
                    <y-button color="secondary" style-type="filled">Secondary</y-button>
                    <y-button color="base" style-type="filled">Base</y-button>
                    <y-button color="success" style-type="filled">Success</y-button>
                    <y-button color="warning" style-type="filled">Warning</y-button>
                    <y-button color="error" style-type="filled">Error</y-button>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <y-tag color="success">Active</y-tag>
                    <y-tag color="warning">Pending</y-tag>
                    <y-tag color="error">Failed</y-tag>
                    <y-tag color="secondary">Beta</y-tag>
                </div>
            </div>
        </y-theme>
    `;
}

// One page per theme family: the light and dark variants side by side.
function family(base, label) {
    return `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${showcase(`${base}-light`, `${label} Light`)}
            ${showcase(`${base}-dark`, `${label} Dark`)}
        </div>
    `;
}

export default {
    title: "Utility/Theme",
    tags: ["autodocs"],
};

export const Blue = { render: () => family("blue", "Blue") };
export const Slate = { render: () => family("slate", "Slate") };
export const Mono = { render: () => family("mono", "Mono") };
export const Orange = { render: () => family("orange", "Orange") };
export const Green = { render: () => family("green", "Green") };
export const Red = { render: () => family("red", "Red") };
export const Teal = { render: () => family("teal", "Teal") };
export const Yellow = { render: () => family("yellow", "Yellow") };
export const Indigo = { render: () => family("indigo", "Indigo") };
export const Purple = { render: () => family("purple", "Purple") };
export const Pink = { render: () => family("pink", "Pink") };
export const Rose = { render: () => family("rose", "Rose") };
export const Brown = { render: () => family("brown", "Brown") };
export const Olive = { render: () => family("olive", "Olive") };
export const MaterialBlue = {
    render: () => family("material-blue", "Material Blue"),
};
export const MaterialPurple = {
    render: () => family("material-purple", "Material Purple"),
};
export const Carbon = { render: () => family("carbon", "Carbon") };
export const AntBlue = { render: () => family("ant-blue", "Ant Blue") };
export const AntGreen = { render: () => family("ant-green", "Ant Green") };
export const Shadcn = { render: () => family("shadcn", "Shadcn") };
export const ShadcnBlue = {
    render: () => family("shadcn-blue", "Shadcn Blue"),
};

// Primer ships three variants — light, dark, and the softer dark-dimmed.
export const Primer = {
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${showcase("primer-light", "Primer Light")}
            ${showcase("primer-dark", "Primer Dark")}
            ${showcase("primer-dark-dimmed", "Primer Dark Dimmed")}
        </div>
    `,
};
export const Bootstrap = { render: () => family("bootstrap", "Bootstrap") };

// Catppuccin ships four flavors — Latte (light) + Frappe / Macchiato / Mocha.
export const Catppuccin = {
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${showcase("catppuccin-latte", "Catppuccin Latte")}
            ${showcase("catppuccin-frappe", "Catppuccin Frappe")}
            ${showcase("catppuccin-macchiato", "Catppuccin Macchiato")}
            ${showcase("catppuccin-mocha", "Catppuccin Mocha")}
        </div>
    `,
};

// Nord ships two dark flavors — cool Frost-led + warm Aurora-led.
export const Nord = {
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${showcase("nord", "Nord")}
            ${showcase("nord-aurora", "Nord Aurora")}
        </div>
    `,
};

// Neobrutalist — a single, deliberately loud theme: wild palette, sharp
// corners, thick black borders, hard offset shadows. Also a live demo of the
// per-side border-width feature (outlined buttons + every field carry an
// asymmetric, heavier bottom/right edge).
export const Neobrutalist = {
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${showcase("neobrutalist", "Neobrutalist Light")}
            ${showcase("neobrutalist-dark", "Neobrutalist Dark")}
        </div>
    `,
};

// Kepler — a retro terminal family ported from the original Kepler UI kit, all
// set in the Tomorrow typeface. Neutral light/dark plus three tinted dark
// flavors: Amber (orange-on-black), Galaxy (blue-tinted), Matrix (green-on-black).
export const Kepler = {
    render: () => `
        <div style="display:flex;gap:16px;flex-wrap:wrap">
            ${showcase("kepler-light", "Kepler Light")}
            ${showcase("kepler-dark", "Kepler Dark")}
            ${showcase("kepler-amber", "Kepler Amber")}
            ${showcase("kepler-galaxy", "Kepler Galaxy")}
            ${showcase("kepler-matrix", "Kepler Matrix")}
        </div>
    `,
};
