import "./y-code.js";

const SAMPLE_JS = `function greet(name) {
    if (!name) return "Hello!";
    return \`Hello, \${name}!\`;
}

greet("world");`;

const SAMPLE_LONG = Array.from({ length: 18 }, (_, i) =>
    `console.log("line ${i + 1}");`,
).join("\n");

const SAMPLE_HIGHLIGHTED_HTML = `<span class="token keyword">const</span> <span class="token function">add</span> <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token variable">a</span><span class="token punctuation">,</span> <span class="token variable">b</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token variable">a</span> <span class="token operator">+</span> <span class="token variable">b</span><span class="token punctuation">;</span>
<span class="token comment">// usage</span>
<span class="token function">add</span><span class="token punctuation">(</span><span class="token number">1</span><span class="token punctuation">,</span> <span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span>`;

export default {
    title: "Display/Code",
    tags: ["autodocs"],
    argTypes: {
        language: { control: "text" },
        "line-numbers": { control: "boolean" },
        filename: { control: "text" },
        wrap: { control: "boolean" },
        "max-lines": { control: "number" },
        copyable: { control: "boolean" },
        disabled: { control: "boolean" },
    },
    args: {
        language: "javascript",
        "line-numbers": false,
        filename: "",
        wrap: false,
        "max-lines": null,
        copyable: true,
        disabled: false,
    },
    render: (args) => {
        const a = [];
        a.push(`language="${args.language}"`);
        if (args["line-numbers"]) a.push(`line-numbers`);
        if (args.filename) a.push(`filename="${args.filename}"`);
        if (args.wrap) a.push(`wrap`);
        if (args["max-lines"]) a.push(`max-lines="${args["max-lines"]}"`);
        if (args.copyable === false) a.push(`copyable="false"`);
        if (args.disabled) a.push(`disabled`);
        return `<y-code ${a.join(" ")}>${SAMPLE_JS.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</y-code>`;
    },
};

export const Default = {};

export const WithLineNumbers = {
    args: { "line-numbers": true },
};

export const WithFilename = {
    args: { filename: "greet.js", "line-numbers": true },
};

export const WrappedLines = {
    args: { wrap: true, filename: "wide.js" },
    render: () =>
        `<y-code wrap filename="wide.js">${
            'const veryLongVariableName = "this is a deliberately long string of text that demonstrates the wrap attribute and how lines flow across the available width when wrap is enabled instead of horizontal scrolling";'
        }</y-code>`,
};

export const Collapsed = {
    args: { "max-lines": 6, "line-numbers": true },
    render: () =>
        `<y-code max-lines="6" line-numbers language="javascript">${SAMPLE_LONG}</y-code>`,
};

export const PreHighlighted = {
    render: () => `
        <y-code language="javascript" filename="add.js" line-numbers>
            <div slot="highlighted">${SAMPLE_HIGHLIGHTED_HTML}</div>
        </y-code>
    `,
};

export const NoCopyButton = {
    args: { copyable: false, filename: "read-only.txt" },
};

export const Disabled = {
    args: { disabled: true, "line-numbers": true },
};

export const HeaderSlot = {
    render: () => `
        <y-code filename="config.json" language="json">
            <span slot="header" style="font-size:0.75em;opacity:0.6">edited 2m ago</span>
            ${'{\n  "name": "yumekit",\n  "version": "0.5.1"\n}'}
        </y-code>
    `,
};
