import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";
import { isSupportedLanguage, tokenize } from "./tokenizer.js";

// Allowlist of class names we permit on slotted highlighted spans. Matches
// the common Prism / shiki / chroma token names so consumers can pipe their
// existing highlighter output through the `highlighted` slot unmodified.
const SYNTAX_CLASS_ALLOW = new Set([
    "token",
    "keyword",
    "string",
    "comment",
    "function",
    "number",
    "operator",
    "punctuation",
    "type",
    "builtin",
    "variable",
    "attr",
    "attr-name",
    "attr-value",
    "property",
    "tag",
    "selector",
    "regex",
    "boolean",
    "constant",
    "class-name",
    "namespace",
    "deleted",
    "inserted",
    "important",
    "italic",
    "bold",
]);

export class YumeCode extends HTMLElement {
    static get observedAttributes() {
        return [
            "language",
            "line-numbers",
            "max-lines",
            "copyable",
            "wrap",
            "filename",
            "disabled",
            "copy-label",
            "copied-label",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._copiedTimer = null;
        this._isExpanded = false;
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "figure");
        this._render();
    }

    disconnectedCallback() {
        if (this._copiedTimer) {
            clearTimeout(this._copiedTimer);
            this._copiedTimer = null;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (this.isConnected) this._render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Text shown on the copy button after a successful copy. */
    get copiedLabel() {
        return this.getAttribute("copied-label") || "Copied!";
    }
    set copiedLabel(val) {
        if (val == null) this.removeAttribute("copied-label");
        else this.setAttribute("copied-label", String(val));
    }

    /** Text shown on the copy button in its idle state. */
    get copyLabel() {
        return this.getAttribute("copy-label") || "Copy";
    }
    set copyLabel(val) {
        if (val == null) this.removeAttribute("copy-label");
        else this.setAttribute("copy-label", String(val));
    }

    /**
     * Whether the copy button is rendered. Defaults to `true`; set
     * `copyable="false"` to hide the button entirely.
     */
    get copyable() {
        const v = this.getAttribute("copyable");
        return v === null ? true : v !== "false";
    }
    set copyable(val) {
        if (val === false || val === "false") {
            this.setAttribute("copyable", "false");
        } else {
            this.removeAttribute("copyable");
        }
    }

    /** When set, suppresses interactive affordances (copy button, line clicks). */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Filename shown in the header bar. Empty string hides the header. */
    get filename() {
        return this.getAttribute("filename") || "";
    }
    set filename(val) {
        if (val) this.setAttribute("filename", val);
        else this.removeAttribute("filename");
    }

    /** Language label (text-only in v1; used for aria-label and a host class). */
    get language() {
        return (this.getAttribute("language") || "text").toLowerCase();
    }
    set language(val) {
        if (val) this.setAttribute("language", val);
        else this.removeAttribute("language");
    }

    /**
     * When set, line numbers are rendered and each line becomes a click /
     * keyboard target that copies that single line. Acts as the line-copy
     * affordance; no separate attribute.
     */
    get lineNumbers() {
        return this.hasAttribute("line-numbers");
    }
    set lineNumbers(val) {
        if (val) this.setAttribute("line-numbers", "");
        else this.removeAttribute("line-numbers");
    }

    /** Visible-line cap; if exceeded, the block collapses with an expand toggle. */
    get maxLines() {
        const v = parseInt(this.getAttribute("max-lines"), 10);
        return Number.isFinite(v) && v > 0 ? v : null;
    }
    set maxLines(val) {
        if (val == null) this.removeAttribute("max-lines");
        else this.setAttribute("max-lines", String(val));
    }

    /** When set, long lines wrap; otherwise the block scrolls horizontally. */
    get wrap() {
        return this.hasAttribute("wrap");
    }
    set wrap(val) {
        if (val) this.setAttribute("wrap", "");
        else this.removeAttribute("wrap");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Copies the full code block to the clipboard. */
    async copyBlock() {
        const text = this._collectRawText();
        await this._writeClipboard(text, { target: "block" });
    }

    /** Copies the line at `index` (0-based) to the clipboard. */
    async copyLine(index) {
        const lines = this._collectRawText().split("\n");
        if (index < 0 || index >= lines.length) return;
        await this._writeClipboard(lines[index], {
            target: "line",
            lineIndex: index,
        });
    }

    /** Re-renders with a new language label. Fires `language-change`. */
    setLanguage(lang) {
        this.language = lang;
        this.dispatchEvent(
            new CustomEvent("language-change", {
                bubbles: true,
                composed: true,
                detail: { language: this.language },
            }),
        );
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _announceCopy() {
        if (this._copiedTimer) clearTimeout(this._copiedTimer);

        const btnLabel = this.shadowRoot.querySelector(".copy-label");
        const icon = this.shadowRoot.querySelector(".copy-icon");

        if (btnLabel) btnLabel.textContent = this.copiedLabel;
        if (icon) icon.setAttribute("name", "check");

        this._copiedTimer = setTimeout(() => {
            this._copiedTimer = null;
            if (btnLabel) btnLabel.textContent = this.copyLabel;
            if (icon) icon.setAttribute("name", "copy");
        }, 1800);
    }

    _buildHeader() {
        const filename = this.filename;
        const showCopy = this.copyable && !this.disabled;
        if (!filename && !showCopy && !this._hasHeaderSlot()) return null;

        const header = _el("header", { class: "header", part: "header" });

        if (filename) {
            header.appendChild(
                _el("span", { class: "filename", part: "filename" }, [
                    filename,
                ]),
            );
        }

        const headerSlot = _el("slot", { name: "header" });
        const slotWrap = _el("span", { class: "header-slot" }, [headerSlot]);
        header.appendChild(slotWrap);

        if (showCopy) {
            const btn = _el(
                "button",
                {
                    type: "button",
                    class: "copy-btn",
                    part: "copy-button",
                    "aria-label": `Copy ${this.language} code to clipboard`,
                },
                [
                    _el("y-icon", {
                        class: "copy-icon",
                        name: "copy",
                        size: "small",
                        "aria-hidden": "true",
                    }),
                    _el(
                        "span",
                        {
                            class: "copy-label",
                            part: "copy-feedback",
                            "aria-live": "polite",
                        },
                        [this.copyLabel],
                    ),
                ],
            );
            btn.addEventListener("click", () => this.copyBlock());
            header.appendChild(btn);
        }

        return header;
    }

    _buildLineFromText(text, index, totalLines) {
        const lineEl = this._createLineElement(index, totalLines);
        const content = _el("span", { class: "line-content" }, [
            text === "" ? "​" : text,
        ]);
        lineEl.appendChild(content);
        return lineEl;
    }

    _buildLineFromTokens(tokens, index, totalLines) {
        const lineEl = this._createLineElement(index, totalLines);
        const content = _el("span", { class: "line-content" });

        if (tokens.length === 0) {
            content.appendChild(document.createTextNode("​"));
        } else {
            for (const token of tokens) {
                let leaf = document.createTextNode(token.text);
                for (let i = token.spans.length - 1; i >= 0; i--) {
                    const wrap = document.createElement("span");
                    wrap.className = token.spans[i];
                    wrap.appendChild(leaf);
                    leaf = wrap;
                }
                content.appendChild(leaf);
            }
        }

        lineEl.appendChild(content);
        return lineEl;
    }

    _buildStyles() {
        return `
            :host {
                display: block;
                font-family: var(--component-code-font-family, var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace));
                color: var(--component-code-text-color, var(--base-content--, #1a1a1a));
                background: var(--component-code-bg-color, var(--base-background-component, #f6f8fa));
                border-radius: var(--component-code-border-radius, var(--radii-medium, 8px));
                overflow: hidden;
                position: relative;
            }

            :host([hidden]) { display: none !important; }

            .header {
                display: flex;
                align-items: center;
                gap: var(--spacing-small, 8px);
                padding: var(--spacing-x-small, 6px) var(--spacing-small, 8px);
                background: var(--component-code-header-bg-color, var(--base-background-hover, rgba(0,0,0,0.04)));
                border-bottom: 1px solid var(--base-border, rgba(0,0,0,0.08));
                font-family: var(--font-family-body, sans-serif);
                font-size: var(--font-size-small, 0.85em);
            }

            .filename {
                font-weight: var(--font-weight-heading, 500);
                color: var(--component-code-text-color, var(--base-content--, #1a1a1a));
            }

            .header-slot { flex: 1; display: inline-flex; align-items: center; }

            .copy-btn {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                background: var(--component-code-copy-bg-color, transparent);
                color: var(--component-code-copy-text-color, var(--base-content--, #1a1a1a));
                border: 1px solid var(--base-border, rgba(0,0,0,0.12));
                border-radius: var(--radii-small, 4px);
                cursor: pointer;
                font: inherit;
                transition: background 0.15s ease;
            }
            .copy-btn:hover { background: var(--component-code-copy-hover-bg-color, var(--base-background-hover, rgba(0,0,0,0.06))); }
            .copy-btn:focus-visible { outline: 2px solid var(--primary-content--, #1976d2); outline-offset: 2px; }

            .pre-wrap {
                position: relative;
                overflow: hidden;
            }

            pre.code {
                margin: 0;
                padding: var(--spacing-small, 8px) 0;
                overflow-x: ${this.wrap ? "hidden" : "auto"};
                overflow-y: ${this.maxLines ? "auto" : "visible"};
                font-size: var(--component-code-font-size, 0.9em);
                line-height: var(--component-code-line-height, 1.55);
                tab-size: 4;
                color: inherit;
                background: transparent;
                scrollbar-color: var(--component-code-scrollbar-color, rgba(0,0,0,0.25)) var(--component-code-scrollbar-bg, transparent);
            }

            code.code-inner {
                display: block;
                width: max-content;
                min-width: 100%;
            }

            :host([wrap]) code.code-inner { width: auto; }

            .line {
                display: flex;
                align-items: flex-start;
                gap: var(--spacing-x-small, 6px);
                padding: 0 var(--spacing-small, 8px);
                white-space: ${this.wrap ? "pre-wrap" : "pre"};
                word-break: ${this.wrap ? "break-word" : "normal"};
            }

            .line-number {
                flex-shrink: 0;
                width: var(--component-code-line-number-width, 2.5em);
                text-align: right;
                color: var(--component-code-line-number-color, var(--base-content-light, rgba(0,0,0,0.45)));
                font-size: var(--component-code-line-number-font-size, 0.85em);
                user-select: none;
                position: sticky;
                left: 0;
                background: var(--component-code-bg-color, var(--base-background-component, #f6f8fa));
                padding-right: var(--spacing-x-small, 6px);
            }

            :host([line-numbers]) .line[role="button"] {
                cursor: pointer;
            }
            :host([line-numbers]) .line[role="button"]:hover {
                background: var(--component-code-line-hover-bg, rgba(0,0,0,0.04));
            }
            :host([line-numbers]) .line[role="button"]:focus-visible {
                outline: 2px solid var(--primary-content--, #1976d2);
                outline-offset: -2px;
            }
            .line.is-copied {
                background: var(--component-code-line-copied-bg, var(--success-content-light, rgba(46, 125, 50, 0.12)));
                transition: background 0.4s ease;
            }

            .line-content { flex: 1; min-width: 0; }

            /* Default syntax-color hooks. Apply when consumers pipe their
               highlighter output through <slot name="highlighted">. */
            .line-content .keyword,
            .line-content .token.keyword { color: var(--component-code-keyword-color, var(--primary-content--, #0033b3)); font-weight: var(--font-weight-heading, 500); }
            .line-content .string,
            .line-content .token.string,
            .line-content .attr-value { color: var(--component-code-string-color, var(--success-content--, #2e7d32)); }
            .line-content .comment,
            .line-content .token.comment { color: var(--component-code-comment-color, var(--base-content-light, rgba(0,0,0,0.5))); font-style: italic; }
            .line-content .function,
            .line-content .token.function { color: var(--component-code-function-color, var(--secondary-content--, #6a1b9a)); }
            .line-content .number,
            .line-content .token.number,
            .line-content .boolean { color: var(--component-code-number-color, var(--warning-content--, #ad6800)); }
            .line-content .operator,
            .line-content .token.operator,
            .line-content .punctuation { color: var(--component-code-operator-color, var(--base-content--, inherit)); }
            .line-content .tag,
            .line-content .selector { color: var(--component-code-keyword-color, var(--primary-content--, #0033b3)); }
            .line-content .attr-name,
            .line-content .attr,
            .line-content .property { color: var(--component-code-function-color, var(--secondary-content--, #6a1b9a)); }
            .line-content .class-name,
            .line-content .type { color: var(--component-code-function-color, var(--secondary-content--, #6a1b9a)); }
            .line-content .regex { color: var(--component-code-string-color, var(--success-content--, #2e7d32)); }

            .expand-toggle {
                display: block;
                width: 100%;
                padding: var(--spacing-x-small, 6px);
                background: var(--component-code-header-bg-color, var(--base-background-hover, rgba(0,0,0,0.04)));
                border: none;
                border-top: 1px solid var(--base-border, rgba(0,0,0,0.08));
                color: inherit;
                font: inherit;
                font-size: var(--font-size-small, 0.85em);
                cursor: pointer;
            }
            .expand-toggle:hover { background: var(--component-code-copy-hover-bg-color, var(--base-background-hover, rgba(0,0,0,0.08))); }
            .expand-toggle:focus-visible { outline: 2px solid var(--primary-content--, #1976d2); outline-offset: -2px; }

            /* Hidden slots — we read their light DOM children programmatically
               and build our own rendering. */
            .hidden-slot { display: none; }
        `;
    }

    _collectRawText() {
        const txt = this._readDefaultSlotText();
        return this._dedent(txt);
    }

    _createLineElement(index, totalLines) {
        const interactive = this.lineNumbers && !this.disabled;
        const attrs = {
            class: "line",
            part: "line",
            "data-line": String(index),
        };
        if (interactive) {
            attrs.role = "button";
            attrs.tabindex = "0";
            attrs["aria-label"] = `Copy line ${index + 1} of ${totalLines}`;
        }
        const el = _el("div", attrs);
        if (this.lineNumbers) {
            el.appendChild(
                _el(
                    "span",
                    {
                        class: "line-number",
                        part: "line-number",
                        "aria-hidden": "true",
                    },
                    [String(index + 1)],
                ),
            );
        }
        if (interactive) {
            el.addEventListener("click", () => this._onLineActivate(index));
            el.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this._onLineActivate(index);
                }
            });
        }
        return el;
    }

    _dedent(text) {
        const lines = text.split("\n");

        while (lines.length && lines[0].trim() === "") lines.shift();
        while (lines.length && lines[lines.length - 1].trim() === "")
            lines.pop();

        if (!lines.length) return "";

        let minIndent = Infinity;
        for (const line of lines) {
            if (line.trim() === "") continue;
            const m = line.match(/^[ \t]*/);
            if (m && m[0].length < minIndent) minIndent = m[0].length;
        }

        if (!Number.isFinite(minIndent) || minIndent === 0)
            return lines.join("\n");

        return lines.map((line) => line.slice(minIndent)).join("\n");
    }

    _flashLineCopied(index) {
        const line = this.shadowRoot.querySelector(
            `.line[data-line="${index}"]`,
        );
        if (!line) return;
        line.classList.add("is-copied");
        setTimeout(() => line.classList.remove("is-copied"), 600);
    }

    _hasHeaderSlot() {
        return !!this.querySelector(':scope > [slot="header"]');
    }

    _hasHighlightedSlot() {
        return !!this.querySelector(':scope > [slot="highlighted"]');
    }

    _onExpandClick() {
        this._isExpanded = !this._isExpanded;
        this._render();
    }

    _onLineActivate(index) {
        if (this.disabled) return;
        this.copyLine(index);
        this._flashLineCopied(index);
    }

    _readDefaultSlotText() {
        // If the consumer provides one or more <template> children, read raw
        // source from `.content.textContent`. The browser parses <template>
        // bodies but doesn't render or execute them, which lets HTML / XML /
        // SVG samples be authored without escaping `<`, `>`, or `&`.
        const templates = Array.from(this.children).filter(
            (child) =>
                child.tagName === "TEMPLATE" && !child.hasAttribute("slot"),
        );
        if (templates.length) {
            // `innerHTML` returns the serialized HTML of the template's
            // content fragment — i.e., the markup the author wrote, with
            // `<` / `&` / `"` re-escaped to entities. Using `textContent`
            // would drop the tag structure and only keep text node values.
            return templates.map((tpl) => tpl.innerHTML).join("");
        }

        // Fallback: concatenate text from non-slotted light-DOM children.
        // In this path, the consumer is responsible for HTML-escaping `<` and
        // `&` so the browser doesn't interpret them as markup.
        let text = "";
        for (const child of this.childNodes) {
            if (
                child.nodeType === Node.ELEMENT_NODE &&
                child.hasAttribute("slot")
            ) {
                continue;
            }
            text += child.textContent || "";
        }
        return text;
    }

    _render() {
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(_el("style", {}, [this._buildStyles()]));

        const hasHighlighted = this._hasHighlightedSlot();

        const header = this._buildHeader();
        if (header) this.shadowRoot.appendChild(header);

        const preWrap = _el("div", { class: "pre-wrap" });
        const pre = _el("pre", { class: "code", part: "pre" });
        const code = _el("code", { class: "code-inner", part: "code" });

        let lineEls;
        if (hasHighlighted) {
            const lines = this._sanitizedHighlightedLines();
            lineEls = lines.map((tokens, i) =>
                this._buildLineFromTokens(tokens, i, lines.length),
            );
        } else if (isSupportedLanguage(this.language)) {
            const lines = this._tokenizedLines(this._collectRawText());
            lineEls = lines.map((tokens, i) =>
                this._buildLineFromTokens(tokens, i, lines.length),
            );
        } else {
            const text = this._collectRawText();
            const lines = text === "" ? [""] : text.split("\n");
            lineEls = lines.map((line, i) =>
                this._buildLineFromText(line, i, lines.length),
            );
        }

        const max = this.maxLines;
        const collapse = max && !this._isExpanded && lineEls.length > max;
        const visible = collapse ? lineEls.slice(0, max) : lineEls;
        for (const el of visible) code.appendChild(el);

        pre.appendChild(code);
        pre.setAttribute("tabindex", "0");
        pre.setAttribute("role", "region");
        pre.setAttribute(
            "aria-label",
            `${this.language} code, ${lineEls.length} ${lineEls.length === 1 ? "line" : "lines"}`,
        );
        preWrap.appendChild(pre);

        this.shadowRoot.appendChild(preWrap);

        if (max && lineEls.length > max) {
            const remaining = lineEls.length - max;
            const toggle = _el(
                "button",
                {
                    type: "button",
                    class: "expand-toggle",
                    part: "expand-toggle",
                },
                [
                    this._isExpanded
                        ? "Show less"
                        : `Show ${remaining} more ${remaining === 1 ? "line" : "lines"}`,
                ],
            );
            toggle.addEventListener("click", () => this._onExpandClick());
            this.shadowRoot.appendChild(toggle);
        }

        // Hidden slots so consumer-supplied content stays in light DOM but
        // doesn't render directly. We read its content above.
        const hiddenSlots = _el(
            "div",
            { class: "hidden-slot", "aria-hidden": "true" },
            [_el("slot"), _el("slot", { name: "highlighted" })],
        );
        this.shadowRoot.appendChild(hiddenSlots);
    }

    _sanitizedHighlightedLines() {
        // Walk the slotted highlighted content, allowlisting <span class="...">
        // and splitting text content into lines at every \n. Returns an array
        // of lines; each line is an array of `{ spans: string[], text: string }`
        // tokens where `spans` is the outer-to-inner stack of allowed classes.
        const roots = Array.from(
            this.querySelectorAll(':scope > [slot="highlighted"]'),
        );
        const lines = [];
        let current = [];

        const visit = (node, ancestors) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const parts = String(node.nodeValue || "").split("\n");
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i] !== "") {
                        current.push({
                            spans: ancestors.slice(),
                            text: parts[i],
                        });
                    }
                    if (i < parts.length - 1) {
                        lines.push(current);
                        current = [];
                    }
                }
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (node.tagName.toLowerCase() !== "span") {
                for (const child of node.childNodes) visit(child, ancestors);
                return;
            }
            const safeClasses = String(node.className || "")
                .split(/\s+/)
                .filter((c) => c && SYNTAX_CLASS_ALLOW.has(c));
            const nextAncestors = safeClasses.length
                ? ancestors.concat(safeClasses.join(" "))
                : ancestors;
            for (const child of node.childNodes) visit(child, nextAncestors);
        };

        for (const root of roots) {
            for (const child of root.childNodes) visit(child, []);
        }
        lines.push(current);

        // Trim trailing fully-empty lines (common when the consumer's HTML
        // ends in \n inside a wrapper element).
        while (lines.length > 1 && lines[lines.length - 1].length === 0) {
            lines.pop();
        }
        return lines;
    }

    _tokenizedLines(source) {
        // Run the language tokenizer, then split the flat token stream into
        // per-line arrays of `{ spans, text }` so the existing line renderer
        // (`_buildLineFromTokens`) can consume the result. A token's text
        // may contain `\n`; we split on each newline, dropping zero-length
        // segments while still closing/opening line buckets.
        const tokens = tokenize(this.language, source) || [];
        const lines = [];
        let current = [];

        for (const tok of tokens) {
            const spans = tok.type ? [`token ${tok.type}`] : [];
            const parts = String(tok.text || "").split("\n");
            for (let p = 0; p < parts.length; p++) {
                if (parts[p] !== "") {
                    current.push({ spans, text: parts[p] });
                }
                if (p < parts.length - 1) {
                    lines.push(current);
                    current = [];
                }
            }
        }
        lines.push(current);

        // An empty source should still produce one empty line so the layout
        // matches the plain-text path.
        if (lines.length === 1 && lines[0].length === 0 && source === "") {
            return [[]];
        }
        return lines;
    }

    async _writeClipboard(text, info) {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers / non-secure contexts.
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.setAttribute("aria-hidden", "true");
                ta.style.position = "fixed";
                ta.style.top = "-1000px";
                document.body.appendChild(ta);
                ta.select();

                const ok = document.execCommand("copy");
                document.body.removeChild(ta);

                if (!ok) throw new Error("execCommand('copy') returned false");
            }
            this.dispatchEvent(
                new CustomEvent("copy", {
                    bubbles: true,
                    composed: true,
                    detail: { source: text, ...info },
                }),
            );

            if (info.target === "block") this._announceCopy();
        } catch (error) {
            this.dispatchEvent(
                new CustomEvent("copy-fail", {
                    bubbles: true,
                    composed: true,
                    detail: { error },
                }),
            );
        }
    }
}

if (!customElements.get("y-code")) {
    customElements.define("y-code", YumeCode);
}
