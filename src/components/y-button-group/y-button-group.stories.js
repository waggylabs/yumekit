import "./y-button-group.js";
import "../y-button/y-button.js";
import "../y-input/y-input.js";
import "../y-select/y-select.js";
import "../y-icon/y-icon.js";
import "../../icons/all.js";

export default {
    title: "Input/ButtonGroup",
    tags: ["autodocs"],
    argTypes: {
        orientation: {
            control: "select",
            options: ["horizontal", "vertical"],
            description: "Layout direction of the group.",
            table: { defaultValue: { summary: "horizontal" } },
        },
    },
    args: {
        orientation: "horizontal",
    },
    render: ({ orientation }) => `
        <y-button-group orientation="${orientation}">
            <y-button color="primary">One</y-button>
            <y-button color="primary">Two</y-button>
            <y-button color="primary">Three</y-button>
        </y-button-group>
    `,
};

export const Default = {};

export const StyleTypes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            <y-button-group>
                <y-button color="primary" variant="outlined">Outlined</y-button>
                <y-button color="primary" variant="outlined">Outlined</y-button>
                <y-button color="primary" variant="outlined">Outlined</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="primary" variant="filled">Filled</y-button>
                <y-button color="primary" variant="filled">Filled</y-button>
                <y-button color="primary" variant="filled">Filled</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="primary" variant="flat">Flat</y-button>
                <y-button color="primary" variant="flat">Flat</y-button>
                <y-button color="primary" variant="flat">Flat</y-button>
            </y-button-group>
        </div>
    `,
};

export const Colors = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            <y-button-group>
                <y-button color="base">Left</y-button>
                <y-button color="base">Center</y-button>
                <y-button color="base">Right</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="primary">Left</y-button>
                <y-button color="primary">Center</y-button>
                <y-button color="primary">Right</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="success">Left</y-button>
                <y-button color="success">Center</y-button>
                <y-button color="success">Right</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="error">Left</y-button>
                <y-button color="error">Center</y-button>
                <y-button color="error">Right</y-button>
            </y-button-group>
        </div>
    `,
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            <y-button-group>
                <y-button color="primary" size="small">Small</y-button>
                <y-button color="primary" size="small">Small</y-button>
                <y-button color="primary" size="small">Small</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="primary" size="medium">Medium</y-button>
                <y-button color="primary" size="medium">Medium</y-button>
                <y-button color="primary" size="medium">Medium</y-button>
            </y-button-group>
            <y-button-group>
                <y-button color="primary" size="large">Large</y-button>
                <y-button color="primary" size="large">Large</y-button>
                <y-button color="primary" size="large">Large</y-button>
            </y-button-group>
        </div>
    `,
};

export const Vertical = {
    render: () => `
        <y-button-group orientation="vertical">
            <y-button color="primary">Top</y-button>
            <y-button color="primary">Middle</y-button>
            <y-button color="primary">Bottom</y-button>
        </y-button-group>
    `,
};

export const WithIcons = {
    render: () => `
        <y-button-group>
            <y-button color="primary">
                <y-icon slot="left-icon" name="chevron-left" size="small"></y-icon>
                Prev
            </y-button>
            <y-button color="primary">Today</y-button>
            <y-button color="primary">
                Next
                <y-icon slot="right-icon" name="chevron-right" size="small"></y-icon>
            </y-button>
        </y-button-group>
    `,
};

export const SingleItem = {
    render: () => `
        <y-button-group>
            <y-button color="primary">Only</y-button>
        </y-button-group>
    `,
};

export const InputAndButton = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            <y-button-group>
                <y-input placeholder="Search…"></y-input>
                <y-button color="primary" variant="filled">
                    <y-icon slot="left-icon" name="magnifying-glass" size="small"></y-icon>
                    Search
                </y-button>
            </y-button-group>
            <y-button-group>
                <y-button variant="outlined" color="base">
                    <y-icon slot="left-icon" name="stack" size="small"></y-icon>
                </y-button>
                <y-input placeholder="Paste or type a URL" style="width:240px"></y-input>
                <y-button variant="filled" color="primary">Go</y-button>
            </y-button-group>
        </div>
    `,
};

export const MixedContent = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:16px">
            <y-button-group>
                <y-select
                    placeholder="Choose…"
                    options='[{"value":"opt1","label":"Option 1"},{"value":"opt2","label":"Option 2"},{"value":"opt3","label":"Option 3"}]'
                    style="width:180px"
                ></y-select>
                <y-button color="primary" variant="filled">Go</y-button>
            </y-button-group>
            <y-button-group>
                <y-button variant="outlined" color="base">All</y-button>
                <y-select
                    placeholder="Filter by status…"
                    options='[{"value":"active","label":"Active"},{"value":"inactive","label":"Inactive"},{"value":"pending","label":"Pending"}]'
                    style="width:200px"
                ></y-select>
                <y-button variant="filled" color="primary">
                    <y-icon slot="left-icon" name="funnel" size="small"></y-icon>
                    Apply
                </y-button>
            </y-button-group>
        </div>
    `,
};
