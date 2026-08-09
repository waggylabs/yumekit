import "../y-button/y-button.js";
import "../y-button-group/y-button-group.js";
import "../y-icon/y-icon.js";
import "../y-input/y-input.js";
import "../y-popover/y-popover.js";
import {
    createElement as _el,
    manageLabelVisibility,
    upgradeProperties,
} from "../../modules/helpers.js";
import {
    isSafeUrl,
    sanitizeHtml,
    sanitizeHtmlToFragment,
    tagsForBlocks,
} from "../../modules/html-sanitizer.js";
import { MENTION_STYLES, MentionController } from "../../modules/mentions.js";

const DEFAULT_ALLOWED_BLOCKS = [
    "p",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "code",
];

const DEFAULT_TOOLBAR =
    "bold italic underline strike | heading blockquote code | ordered-list unordered-list | link image | undo redo";

/** Block id → the tag that represents it in the document. */
const BLOCK_TAG = {
    p: "p",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    blockquote: "blockquote",
    ul: "ul",
    ol: "ol",
    code: "pre",
};

/** Inverse of BLOCK_TAG, for reading a block id back off an element. */
const TAG_BLOCK = {
    p: "p",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    blockquote: "blockquote",
    ul: "ul",
    ol: "ol",
    pre: "code",
};

/**
 * Tags that occupy a line of their own. A block-like tag outside the permitted
 * set is rewritten to `<p>`; anything else at the top level is inline and gets
 * gathered into one.
 */
const BLOCK_LIKE = new Set([
    "address",
    "article",
    "aside",
    "blockquote",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "footer",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "main",
    "nav",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "tbody",
    "td",
    "tfoot",
    "th",
    "thead",
    "tr",
    "ul",
]);

/** Inline formatting tools: tool id → the tag it toggles. */
const INLINE_TOOLS = {
    bold: "strong",
    italic: "em",
    underline: "u",
    strike: "s",
    "inline-code": "code",
};

/** `selection` key → the tag that marks it. */
const SELECTION_TAGS = {
    bold: "strong",
    italic: "em",
    underline: "u",
    strike: "s",
    code: "code",
};

/**
 * Every tool the toolbar knows how to render. `blocks` marks a tool as
 * block-producing: those are dropped automatically when `allowed-blocks` does
 * not permit any of the blocks they make.
 */
const TOOLS = {
    bold: { icon: "bold", label: "Bold", shortcut: "Ctrl+B" },
    italic: { icon: "italic", label: "Italic", shortcut: "Ctrl+I" },
    underline: { icon: "underline", label: "Underline", shortcut: "Ctrl+U" },
    strike: {
        icon: "strikethrough",
        label: "Strikethrough",
        shortcut: "Ctrl+Shift+X",
    },
    "inline-code": { icon: "code", label: "Inline code", shortcut: "Ctrl+E" },
    heading: {
        icon: "heading",
        label: "Heading",
        shortcut: "Ctrl+Alt+1",
        blocks: ["h1", "h2", "h3"],
    },
    blockquote: {
        icon: "quote",
        label: "Blockquote",
        shortcut: "Ctrl+Shift+.",
        blocks: ["blockquote"],
    },
    code: { icon: "code", label: "Code block", blocks: ["code"] },
    "ordered-list": {
        icon: "list-ordered",
        label: "Ordered list",
        shortcut: "Ctrl+Shift+7",
        blocks: ["ol"],
    },
    "unordered-list": {
        icon: "list-bullet",
        label: "Unordered list",
        shortcut: "Ctrl+Shift+8",
        blocks: ["ul"],
    },
    link: { icon: "link", label: "Link", shortcut: "Ctrl+K" },
    image: { icon: "image", label: "Image" },
    undo: { icon: "undo", label: "Undo", shortcut: "Ctrl+Z" },
    redo: { icon: "redo", label: "Redo", shortcut: "Ctrl+Shift+Z" },
};

const SIZES = new Set(["small", "medium", "large"]);

/** Caret home for an otherwise-empty inline wrapper. */
const ZWSP = "\u200b";

const HISTORY_LIMIT = 100;

/** How long typing must pause before it becomes its own undo step. */
const HISTORY_DEBOUNCE_MS = 400;

let _instanceCount = 0;

export class YumeEditor extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "allowed-blocks",
            "disabled",
            "image-upload",
            "invalid",
            "max-length",
            "mention-loading",
            "mention-query-delay",
            "mode",
            "name",
            "placeholder",
            "readonly",
            "required",
            "rows",
            "show-count",
            "size",
            "toolbar",
            "triggers",
            "value",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });

        this._id = `y-editor-${++_instanceCount}`;
        this._history = [];
        this._historyIndex = -1;
        this._historyTimer = null;
        this._committedValue = "";
        this._initialValue = null;
        this._adoptedSlot = false;
        this._reflecting = false;
        this._plainPaste = false;
        this._selection = this._emptySelection();
        this._uploadSeq = 0;

        this._onSelectionChange = this._onSelectionChange.bind(this);
        this._mentions = new MentionController(this, this._mentionAdapter());

        this._sheet = new CSSStyleSheet();
        this.shadowRoot.adoptedStyleSheets = [this._sheet];
        this._buildTree();
        this._applyStyles();
        this._bindEvents();
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");

        document.addEventListener("selectionchange", this._onSelectionChange);

        if (this.hasAttribute("value")) {
            this.value = this.getAttribute("value");
        } else {
            this._normalizeDocument();
        }

        if (this._initialValue === null) this._initialValue = this.value;
        this._committedValue = this.value;
        this._resetHistory();
        this._applyEditableState();
        this._syncAria();
        this._updateCounter();
        this._updateValidity();
        this._internals.setFormValue(this.value, this.name || null);
    }

    disconnectedCallback() {
        document.removeEventListener(
            "selectionchange",
            this._onSelectionChange,
        );
        clearTimeout(this._historyTimer);
        this._mentions.close("blur");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case "value":
                if (!this._reflecting) {
                    this._setHtml(newValue);
                    this._reflect();
                }
                this._internals.setFormValue(this.value, this.name || null);
                this._updateValidity();
                break;
            case "name":
                this._internals.setFormValue(this.value, newValue || null);
                break;
            case "allowed-blocks":
                this._normalizeDocument();
                this._buildToolbar();
                break;
            case "toolbar":
                this._buildToolbar();
                break;
            case "disabled":
            case "readonly":
                this._applyEditableState();
                this._syncAria();
                if (this.disabled || this.readonly) {
                    this._mentions.close("blur");
                }
                break;
            case "triggers":
                this._mentions.triggers = newValue;
                break;
            case "mention-loading":
                this._mentions.loading = newValue !== null;
                break;
            case "mention-query-delay":
                this._mentions.queryDelay = newValue;
                break;
            case "placeholder":
                this._syncPlaceholder();
                break;
            case "max-length":
            case "show-count":
                this._updateCounter();
                this._updateValidity();
                break;
            case "required":
            case "invalid":
                this._syncAria();
                this._updateValidity();
                break;
            case "rows":
            case "size":
                this._applyStyles();
                break;
            default:
                break;
        }
    }

    formDisabledCallback(disabled) {
        this.disabled = disabled;
    }

    formResetCallback() {
        this.value = this._initialValue ?? "";
        this._committedValue = this.value;
        this._resetHistory();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /**
     * @type {string[]} Block types the editor may produce. Anything outside the
     * list is normalized to `p` on paste and on `value` set.
     */
    get allowedBlocks() {
        const raw = this.getAttribute("allowed-blocks");
        if (!raw) return [...DEFAULT_ALLOWED_BLOCKS];
        const blocks = raw
            .trim()
            .split(/\s+/)
            .filter((b) => BLOCK_TAG[b]);
        // `p` is the fallback block, so it is always permitted.
        return blocks.includes("p") ? blocks : ["p", ...blocks];
    }
    set allowedBlocks(val) {
        this.setAttribute(
            "allowed-blocks",
            Array.isArray(val) ? val.join(" ") : String(val ?? ""),
        );
    }

    /** @type {boolean} Non-editable, non-focusable, excluded from submission. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {boolean} Route image insertion through the `image-upload` event. */
    get imageUpload() {
        return this.hasAttribute("image-upload");
    }
    set imageUpload(val) {
        if (val) this.setAttribute("image-upload", "");
        else this.removeAttribute("image-upload");
    }

    /** @type {boolean} Whether the editor is in an error state. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {number|null} Maximum character count of the plain-text content. */
    get maxLength() {
        const raw = parseInt(this.getAttribute("max-length"), 10);
        return Number.isFinite(raw) && raw >= 0 ? raw : null;
    }
    set maxLength(val) {
        if (val == null) this.removeAttribute("max-length");
        else this.setAttribute("max-length", String(val));
    }

    /**
     * @type {Array<Object>} Candidates for the open mention popup. Assigning
     * opens or refreshes it; prefer `setMentionCandidates` so a stale response
     * cannot repopulate a popup the caret has already moved past.
     */
    get mentionCandidates() {
        return this._mentions.candidates;
    }
    set mentionCandidates(val) {
        this._mentions.candidates = val;
    }

    /** @type {boolean} Whether the mention popup shows its busy state. */
    get mentionLoading() {
        return this.hasAttribute("mention-loading");
    }
    set mentionLoading(val) {
        if (val) this.setAttribute("mention-loading", "");
        else this.removeAttribute("mention-loading");
    }

    /** @type {number} Debounce in ms before `mention-query` fires (default 150). */
    get mentionQueryDelay() {
        return this._mentions.queryDelay;
    }
    set mentionQueryDelay(val) {
        if (val == null) this.removeAttribute("mention-query-delay");
        else this.setAttribute("mention-query-delay", String(val));
    }

    /**
     * @type {"rich"} Authoring mode. Reserved — `rich` is the only supported
     * value; anything else falls back to it.
     */
    get mode() {
        return "rich";
    }
    set mode(val) {
        this.setAttribute("mode", String(val ?? "rich"));
    }

    /** @type {string} Form field name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {string} Hint shown when the editor is empty. */
    get placeholder() {
        return this.getAttribute("placeholder") || "";
    }
    set placeholder(val) {
        if (val == null || val === "") this.removeAttribute("placeholder");
        else this.setAttribute("placeholder", val);
    }

    /** @type {boolean} Non-editable but focusable and selectable. */
    get readonly() {
        return this.hasAttribute("readonly");
    }
    set readonly(val) {
        if (val) this.setAttribute("readonly", "");
        else this.removeAttribute("readonly");
    }

    /** @type {boolean} Invalid when the plain-text content is empty. */
    get required() {
        return this.hasAttribute("required");
    }
    set required(val) {
        if (val) this.setAttribute("required", "");
        else this.removeAttribute("required");
    }

    /** @type {number} Visible rows at the default font size (default 6). */
    get rows() {
        const raw = parseInt(this.getAttribute("rows"), 10);
        return Number.isFinite(raw) && raw > 0 ? raw : 6;
    }
    set rows(val) {
        this.setAttribute("rows", String(val));
    }

    /**
     * @type {{blockType: string, bold: boolean, italic: boolean,
     *   underline: boolean, strike: boolean, code: boolean, link: string|null}}
     * Formatting at the caret. Read-only.
     */
    get selection() {
        return { ...this._selection };
    }

    /** @type {boolean} Render a character counter in the footer. */
    get showCount() {
        return this.hasAttribute("show-count");
    }
    set showCount(val) {
        if (val) this.setAttribute("show-count", "");
        else this.removeAttribute("show-count");
    }

    /** @type {string} Size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        const val = this.getAttribute("size");
        return SIZES.has(val) ? val : "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /**
     * @type {string} Plain-text content of the document, as used by `required`
     * and `max-length`. Effectively read-only: this shadows
     * `Node.prototype.textContent` so callers read the plain text of the
     * *document*. Assignment is ignored rather than throwing — a getter-only
     * accessor makes `el.textContent = …` throw in strict mode, which breaks
     * frameworks and utilities that clear a node that way. Set `value` to
     * change the content.
     */
    get textContent() {
        return this._plainText();
    }
    set textContent(_value) {
        // No-op: content is set through `value`, not textContent.
    }

    /**
     * @type {string} Space-separated tool ids, `|` for a group separator.
     * `"false"` hides the toolbar entirely.
     */
    get toolbar() {
        const raw = this.getAttribute("toolbar");
        return raw === null ? DEFAULT_TOOLBAR : raw;
    }
    set toolbar(val) {
        this.setAttribute("toolbar", String(val ?? ""));
    }

    /**
     * @type {Array<Object>} Mention trigger definitions —
     * `{trigger, type, minChars, maxChars, allowSpaces, insert, atomic}`. Rich
     * data: not reflected to the attribute. An empty list disables the feature.
     */
    get triggers() {
        return this._mentions.triggers;
    }
    set triggers(val) {
        this._mentions.triggers = val;
    }

    /** @type {string} Current content as sanitized HTML. */
    get value() {
        return this._serialize();
    }
    set value(val) {
        this._setHtml(val == null ? "" : String(val));
        this._reflect();
        this._internals.setFormValue(this.value, this.name || null);
        this._updateValidity();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Whether the current value satisfies `required` and `max-length`.
     * @returns {boolean}
     */
    checkValidity() {
        return this._internals.checkValidity();
    }

    /** Dismiss the mention popup, leaving the typed text untouched. */
    closeMentions() {
        this._mentions.close("escape");
    }

    /** Move focus into the editing surface. */
    focus(options) {
        if (this.disabled) return;
        this._content.focus(options);
    }

    /**
     * Insert a mention at the caret, replacing the active trigger fragment when
     * there is one.
     * @param {{value: string, label?: string}} candidate
     * @param {string} [trigger] — trigger literal or type; defaults to the active one
     */
    insertMention(candidate, trigger) {
        this._mentions.insert(candidate, trigger);
    }

    /** Re-apply the most recently undone change. */
    redo() {
        if (this._historyIndex >= this._history.length - 1) return;
        this._flushHistory();
        this._historyIndex += 1;
        this._restoreHistory();
    }

    /**
     * Report validity to the user, firing `invalid` when the value is bad.
     * @returns {boolean}
     */
    reportValidity() {
        return this._internals.reportValidity();
    }

    /**
     * Supply results for a `mention-query`. A superseded or closed query id is
     * ignored.
     * @param {number} id — the `id` carried by the `mention-query` event
     * @param {Array<Object>} candidates
     */
    setMentionCandidates(id, candidates) {
        this._mentions.setCandidates(id, candidates);
    }

    /** Revert the most recent change. */
    undo() {
        this._flushHistory();
        if (this._historyIndex <= 0) return;
        this._historyIndex -= 1;
        this._restoreHistory();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /** Adopt the default slot's markup as the starting value, once. */
    _adoptSlot() {
        if (this._adoptedSlot || this.hasAttribute("value")) return;

        const nodes = this._defaultSlot.assignedNodes({ flatten: true });
        const html = nodes
            .map((n) =>
                n.nodeType === Node.ELEMENT_NODE ? n.outerHTML : n.textContent,
            )
            .join("");
        if (!html.trim()) return;

        this._adoptedSlot = true;
        this._setHtml(html);
        this._initialValue = this.value;
        this._committedValue = this.value;
        this._internals.setFormValue(this.value, this.name || null);
        this._resetHistory();
        this._updateValidity();
    }

    /** Shared tail for every content mutation the component itself performs. */
    _afterMutation() {
        this._normalizeDocument();
        this._emitInput();
        this._recordHistory(true);
        this._refreshSelection();
    }

    /** Tag names permitted anywhere in the document, given `allowed-blocks`. */
    _allowedTags() {
        return tagsForBlocks(this.allowedBlocks);
    }

    /** Push `contenteditable` and pointer state for disabled / readonly. */
    _applyEditableState() {
        const editable = !this.disabled && !this.readonly;
        if (editable) this._content.setAttribute("contenteditable", "true");
        else this._content.removeAttribute("contenteditable");

        if (this.disabled) this._content.removeAttribute("tabindex");
        else this._content.setAttribute("tabindex", "0");

        this._toolbarEl.hidden = this.disabled || this.readonly;
        this._internals.setFormValue(
            this.disabled ? null : this.value,
            this.name || null,
        );
    }

    /** Toggle an inline format across the current selection. */
    _applyInline(tag) {
        const range = this._currentRange();
        if (!range) return;

        if (range.collapsed) {
            this._toggleInlineAtCaret(range, tag);
            this._afterMutation();
            return;
        }

        this._splitBoundaries(range);
        const nodes = this._textNodesInRange(range);
        if (nodes.length === 0) return;

        const active = nodes.every((n) => this._closestInline(n, tag));
        for (const node of nodes) {
            const wrapper = this._closestInline(node, tag);
            if (active && wrapper) this._splitOut(node, wrapper);
            else if (!active && !wrapper) this._wrapNode(node, tag);
        }

        this._selectNodes(nodes);
        this._afterMutation();
    }

    _applyLink() {
        const url = String(this._linkInput.value ?? "").trim();
        if (!isSafeUrl(url)) {
            this._linkInput.invalid = true;
            return;
        }
        this._linkInput.invalid = false;

        if (this._linkTarget) {
            this._linkTarget.setAttribute("href", url);
        } else if (this._linkRange) {
            this._selectRange(this._linkRange);
            const range = this._currentRange();
            if (range && !range.collapsed) {
                this._splitBoundaries(range);
                for (const node of this._textNodesInRange(range)) {
                    if (this._closestInline(node, "a")) continue;
                    const a = this._wrapNode(node, "a");
                    a.setAttribute("href", url);
                }
            }
        }

        this._closeLinkPopover();
        this._afterMutation();
        this._commit();
    }

    /**
     * Write a mention into the document. The pending typing snapshot is flushed
     * first so the fragment the user typed becomes its own undo step and the
     * insertion becomes the next one — `Ctrl+Z` lands on `@joh`, not on `@jo`.
     */
    _applyMention({ config, candidate, text, fragment }) {
        const range = fragment
            ? this._mentionRange(fragment)
            : this._currentRange();
        if (!range) return;

        this._flushHistory();
        range.deleteContents();

        const body = text.replace(/\s+$/, "");
        const tail = text.slice(body.length) || " ";
        const nodes = config.atomic
            ? [
                  _el(
                      "span",
                      {
                          part: "mention-chip",
                          contenteditable: "false",
                          "data-mention-type": config.type,
                          "data-mention-value": String(candidate.value ?? ""),
                          "data-mention-label": String(
                              candidate.label ?? candidate.value ?? "",
                          ),
                      },
                      [body],
                  ),
                  document.createTextNode(tail),
              ]
            : [document.createTextNode(text)];

        const fragmentNode = document.createDocumentFragment();
        for (const node of nodes) fragmentNode.appendChild(node);
        const last = nodes[nodes.length - 1];
        range.insertNode(fragmentNode);

        // Deleting the fragment and inserting at a text-node boundary leaves
        // empty text stubs on either side. They are invisible but the browser
        // parks the caret in them, which would put a Backspace out of reach of
        // the chip it is meant to delete.
        for (const sibling of [...last.parentNode.childNodes]) {
            if (
                sibling.nodeType === Node.TEXT_NODE &&
                sibling.textContent === ""
            ) {
                sibling.remove();
            }
        }

        const after = document.createRange();
        after.setStartAfter(last);
        after.collapse(true);
        this._selectRange(after);

        this._afterMutation();
    }

    /** Regenerate the shadow stylesheet. Cheap enough to redo on size / rows. */
    _applyStyles() {
        this._sheet.replaceSync(this._css());
    }

    _bindEvents() {
        this._content.addEventListener("beforeinput", (e) =>
            this._onBeforeInput(e),
        );
        this._content.addEventListener("input", () => this._onInput());
        this._content.addEventListener("keydown", (e) => this._onKeyDown(e));
        this._content.addEventListener("paste", (e) => this._onPaste(e));
        this._content.addEventListener("blur", () => this._onBlur());
        this._content.addEventListener("click", (e) => this._onContentClick(e));
        this._content.addEventListener("compositionstart", () =>
            this._mentions.handleCompositionStart(),
        );
        this._content.addEventListener("compositionend", () =>
            this._mentions.handleCompositionEnd(),
        );
        this._content.addEventListener("dragover", (e) => {
            if (this.disabled || this.readonly) return;
            e.preventDefault();
        });
        this._content.addEventListener("drop", (e) => this._onDrop(e));

        // Keep the selection alive when a tool is pressed: focusing the button
        // would otherwise collapse it before the command runs.
        this._toolbarEl.addEventListener("mousedown", (e) => {
            if (e.target.closest("y-button")) e.preventDefault();
        });
        this._toolbarEl.addEventListener("click", (e) => {
            const btn = e.target.closest("y-button[data-tool]");
            if (btn) this._runTool(btn.dataset.tool);
        });
        this._toolbarEl.addEventListener("keydown", (e) =>
            this._onToolbarKeyDown(e),
        );

        this._fileInput.addEventListener("change", () => {
            const file = this._fileInput.files?.[0];
            if (file) this._handleImageFile(file);
            this._fileInput.value = "";
        });

        this._defaultSlot.addEventListener("slotchange", () =>
            this._adoptSlot(),
        );
    }

    /** Every top-level block the range touches; list items rather than lists. */
    _blocksInRange(range) {
        const blocks = [];
        for (const child of this._content.children) {
            if (!range.intersectsNode(child)) continue;
            const tag = child.tagName.toLowerCase();
            if (tag === "ul" || tag === "ol") {
                const items = [...child.children].filter((li) =>
                    range.intersectsNode(li),
                );
                blocks.push(...(items.length ? items : [...child.children]));
            } else {
                blocks.push(child);
            }
        }
        return blocks;
    }

    _blockTypeAt(node) {
        let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
        while (el && el !== this._content) {
            const tag = el.tagName?.toLowerCase();
            if (tag === "li") {
                const parent = el.parentNode?.tagName?.toLowerCase();
                if (parent === "ul" || parent === "ol") return parent;
            }
            if (TAG_BLOCK[tag] && el.parentNode === this._content) {
                return TAG_BLOCK[tag];
            }
            el = el.parentNode;
        }
        return "p";
    }

    _buildLinkPopover() {
        this._linkInput = _el("y-input", {
            type: "url",
            placeholder: "https://example.com",
            size: "small",
        });

        this._linkApply = _el(
            "y-button",
            { variant: "filled", size: "small", type: "button" },
            ["Apply"],
        );
        this._linkRemove = _el(
            "y-button",
            { variant: "flat", size: "small", type: "button" },
            ["Remove"],
        );

        this._linkApply.addEventListener("click", () => this._applyLink());
        this._linkRemove.addEventListener("click", () => this._removeLink());
        this._linkInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this._applyLink();
            }
        });

        const popover = _el(
            "y-popover",
            {
                part: "link-popover",
                trigger: "manual",
                position: "bottom-start",
                "close-on-escape": "",
            },
            [
                _el("div", { class: "link-editor" }, [
                    this._linkInput,
                    _el("div", { class: "link-actions" }, [
                        this._linkRemove,
                        this._linkApply,
                    ]),
                ]),
            ],
        );

        popover.addEventListener("popover-hide", () => {
            this._linkTarget = null;
        });

        return popover;
    }

    _buildToolbar() {
        const groups = this._toolbarGroups();
        const nodes = [_el("slot", { name: "toolbar-start" })];

        for (const group of groups) {
            const buttons = group.map((id) => this._buildToolButton(id));
            nodes.push(
                _el("y-button-group", { part: "toolbar-group" }, buttons),
            );
        }

        nodes.push(_el("slot", { name: "toolbar-end" }));
        this._toolbarEl.replaceChildren(...nodes);
        this._syncToolbarState();
    }

    _buildToolButton(id) {
        const tool = TOOLS[id];
        const title = tool.shortcut
            ? `${tool.label} (${tool.shortcut})`
            : tool.label;

        const btn = _el(
            "y-button",
            {
                part: "toolbar-button",
                "data-tool": id,
                variant: "flat",
                size: this.size === "large" ? "medium" : "small",
                type: "button",
                title,
                "aria-label": tool.label,
            },
            [
                _el("y-icon", {
                    slot: "left-icon",
                    name: tool.icon,
                    size: "small",
                }),
            ],
        );

        // Roving tabindex lives on the inner control: the toolbar is one tab
        // stop, and arrow keys move between tools.
        if (btn.button) btn.button.tabIndex = -1;
        return btn;
    }

    _buildTree() {
        this._content = _el("div", {
            class: "content",
            part: "content",
            id: `${this._id}-content`,
            role: "textbox",
            "aria-multiline": "true",
            tabindex: "0",
        });

        this._toolbarEl = _el("div", {
            class: "toolbar",
            part: "toolbar",
            role: "toolbar",
            "aria-label": "Formatting",
            "aria-controls": `${this._id}-content`,
        });

        this._counter = _el("span", {
            class: "counter",
            part: "counter",
            "aria-live": "polite",
        });
        this._counterText = _el("span", {
            class: "counter-text",
            "aria-hidden": "true",
        });
        this._counterLive = _el("span", { class: "sr-only" });
        this._counter.append(this._counterText, this._counterLive);

        this._footerSlot = _el("slot", { name: "footer" }, [this._counter]);
        this._labelWrapper = _el(
            "div",
            { class: "label-wrapper", part: "label" },
            [_el("slot", { name: "label" })],
        );

        this._fileInput = _el("input", {
            type: "file",
            accept: "image/*",
            class: "file-input",
        });

        this._defaultSlot = _el("slot", { class: "source" });

        this._linkPopover = this._buildLinkPopover();

        const wrapper = _el("div", { class: "wrapper", part: "wrapper" }, [
            this._labelWrapper,
            _el("div", { class: "editor", part: "editor" }, [
                this._toolbarEl,
                this._content,
            ]),
            _el("div", { class: "footer", part: "footer" }, [this._footerSlot]),
            this._fileInput,
            this._defaultSlot,
            this._linkPopover,
        ]);

        this.shadowRoot.replaceChildren(wrapper);
        manageLabelVisibility(this._labelWrapper);
        this._buildToolbar();
        this._syncPlaceholder();
        this._mentions.mount(wrapper);
    }

    /**
     * Snapshot the caret as both live node references and a positional path,
     * so `_restoreCaret` can put it back after the document is reshaped.
     * Returns null when the selection is not inside the editor, which is what
     * keeps normalization from stealing it.
     */
    _captureCaret() {
        const range = this._currentRange();
        if (!range) return null;

        return {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            path: this._selectionPath(),
        };
    }

    _closeLinkPopover() {
        this._linkPopover.open = false;
        this._linkTarget = null;
        this._content.focus();
        if (this._linkRange) this._selectRange(this._linkRange);
    }

    /** Nearest ancestor of `node` with `tag`, stopping at the editing surface. */
    _closestInline(node, tag) {
        let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentNode;
        while (el && el !== this._content) {
            if (el.tagName?.toLowerCase() === tag) return el;
            el = el.parentNode;
        }
        return null;
    }

    /** Commit the value: reflect, update the form, and fire `change`. */
    _commit() {
        const value = this.value;
        if (value === this._committedValue) return;
        this._committedValue = value;
        this._reflect();
        this._internals.setFormValue(value, this.name || null);
        this._emit("change", { value });
    }

    _computeSelection() {
        const range = this._currentRange();
        if (!range) return this._emptySelection();

        const node = range.startContainer;
        const state = this._emptySelection();

        for (const [key, tag] of Object.entries(SELECTION_TAGS)) {
            state[key] = !!this._closestInline(node, tag);
        }

        const link = this._closestInline(node, "a");
        state.link = link ? link.getAttribute("href") : null;
        state.blockType = this._blockTypeAt(node);
        return state;
    }

    _contentContains(node) {
        return (
            !!node && (node === this._content || this._content.contains(node))
        );
    }

    _css() {
        const rows = this.rows;
        const fontScale = { small: "0.875em", medium: "1em", large: "1.125em" };

        return `
            :host {
                display: block;
                font-family: var(--font-family-body);
                --component-editor-font-size: ${fontScale[this.size]};
            }

            :host([hidden]) {
                display: none;
            }

            :host([disabled]) {
                opacity: 0.75;
                pointer-events: none;
            }

            .wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .label-wrapper {
                display: none;
            }

            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-input-label-color);
            }

            .editor {
                display: flex;
                flex-direction: column;
                background: var(--component-editor-background);
                border: var(--component-editor-border-width, 1px) solid
                    var(--component-editor-border-color);
                border-radius: var(--component-editor-border-radius, 0.25em);
                overflow: hidden;
                transition: border-color 0.2s ease-in-out;
            }

            .editor:focus-within {
                border-color: var(--component-editor-border-color-focus);
            }

            :host([invalid]) .editor,
            :host(:state(invalid)) .editor {
                border-color: var(--component-editor-border-color-invalid);
            }

            .toolbar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: var(--component-editor-toolbar-gap, var(--spacing-x-small, 4px));
                padding: var(--spacing-2x-small, 4px);
                background: var(--component-editor-toolbar-background);
                border-bottom: var(--component-editor-border-width, 1px) solid
                    var(--component-editor-toolbar-border-color);
                flex: 0 0 auto;
            }

            .toolbar[hidden] {
                display: none;
            }

            /* An active tool is marked with aria-pressed, which on its own is
               invisible. The icon is slotted, so it sits in this tree and takes
               the colour directly; y-button writes its inner control's colour
               as an inline custom property, which nothing inherited can beat. */
            .toolbar y-button[aria-pressed="true"] y-icon {
                color: var(--component-editor-toolbar-active-color);
            }

            .content {
                flex: 1 1 auto;
                padding: var(--component-editor-padding, var(--spacing-medium, 8px));
                font-size: var(--component-editor-font-size);
                line-height: var(--component-editor-line-height, 1.6);
                color: var(--component-editor-color);
                /* The line-height fallback has to be repeated inside the calc:
                   an undefined var poisons the whole expression, which would
                   drop min-height entirely and collapse the surface. */
                min-height: var(
                    --component-editor-min-height,
                    calc(${rows} * var(--component-editor-line-height, 1.6) * 1em)
                );
                max-height: var(--component-editor-max-height, none);
                overflow-y: auto;
                outline: none;
                box-sizing: border-box;
                word-break: break-word;
            }

            /* The placeholder rides on the first block so it sits exactly where
               the caret does, rather than being positioned against the box. */
            .content[data-placeholder]:empty::before,
            .content[data-placeholder] > p:only-child:empty::before,
            .content[data-placeholder] > p:only-child > br:only-child::before {
                content: attr(data-placeholder);
                color: var(--component-editor-placeholder-color);
                pointer-events: none;
                display: inline-block;
            }

            .content > p:only-child > br:only-child::before {
                content: attr(data-placeholder);
            }

            .content :first-child { margin-top: 0; }
            .content :last-child { margin-bottom: 0; }

            .content h1 { font-size: 1.6em; }
            .content h2 { font-size: 1.35em; }
            .content h3 { font-size: 1.15em; }

            .content a {
                color: var(--component-editor-link-color);
                text-decoration: underline;
            }

            .content code {
                background: var(--component-editor-code-background);
                border-radius: var(--component-inputs-border-radius-inner, 2px);
                padding: 0.1em 0.3em;
                font-family: var(--font-family-mono, monospace);
                font-size: 0.9em;
            }

            .content pre {
                background: var(--component-editor-code-background);
                border-radius: var(--component-inputs-border-radius-inner, 2px);
                padding: var(--spacing-small, 6px);
                font-family: var(--font-family-mono, monospace);
                font-size: 0.9em;
                white-space: pre-wrap;
                overflow-x: auto;
            }

            .content blockquote {
                margin-left: 0;
                padding-left: var(--spacing-medium, 8px);
                border-left: 3px solid
                    var(--component-editor-blockquote-border-color);
            }

            .content img {
                max-width: 100%;
                height: auto;
            }

            .content img.uploading {
                opacity: 0.5;
                filter: grayscale(1);
            }

            .footer {
                display: flex;
                justify-content: flex-end;
            }

            .footer:empty {
                display: none;
            }

            .counter {
                font-size: 0.75em;
                color: var(--component-editor-counter-color);
            }

            .counter[hidden] {
                display: none;
            }

            .counter.is-over {
                color: var(--component-editor-counter-color-invalid);
            }

            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
                border: 0;
            }

            .file-input {
                display: none;
            }

            .source {
                display: none;
            }

            .link-editor {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-small, 6px);
                min-width: 16rem;
            }

            .link-actions {
                display: flex;
                justify-content: flex-end;
                gap: var(--spacing-x-small, 4px);
            }

            .content [data-mention-value] {
                background: var(--component-editor-mention-chip-background);
                color: var(--component-editor-mention-chip-color);
                border-radius: var(--component-inputs-border-radius-inner, 2px);
                padding: 0.05em 0.25em;
                white-space: nowrap;
                user-select: all;
            }

            ${MENTION_STYLES}
        `;
    }

    /** The Range currently inside the editing surface, or null. */
    _currentRange() {
        const root = this.shadowRoot;
        const selection = root.getSelection
            ? root.getSelection()
            : document.getSelection();
        if (!selection) return null;

        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            return this._contentContains(range.commonAncestorContainer)
                ? range
                : null;
        }

        // Safari exposes shadow-DOM selections only through composed ranges.
        if (typeof selection.getComposedRanges === "function") {
            const [staticRange] = selection.getComposedRanges({
                shadowRoots: [root],
            });
            if (!staticRange) return null;
            if (!this._contentContains(staticRange.startContainer)) return null;
            const range = document.createRange();
            range.setStart(staticRange.startContainer, staticRange.startOffset);
            range.setEnd(staticRange.endContainer, staticRange.endOffset);
            return range;
        }

        return null;
    }

    _cycleHeading() {
        const levels = this.allowedBlocks.filter((b) =>
            ["h1", "h2", "h3"].includes(b),
        );
        if (levels.length === 0) return;
        const current = this._selection.blockType;
        const index = levels.indexOf(current);
        const next = index === -1 ? levels[0] : (levels[index + 1] ?? "p");
        this._setBlockType(next);
    }

    /**
     * Move a caret position that landed on a `ul`/`ol` into the item it points
     * at. A list cannot hold a caret: the browser renders that position in the
     * gutter before the marker, and typing there drops the text outside the
     * item entirely. Positions elsewhere are returned untouched.
     * @returns {{node: Node, offset: number}}
     */
    _descendIntoList(node, offset) {
        const isList =
            node?.nodeType === Node.ELEMENT_NODE &&
            (node.tagName === "UL" || node.tagName === "OL");
        const items = isList ? node.children : null;
        if (!items || items.length === 0) return { node, offset };

        // Past the last item means the end of the list, which reads as the end
        // of its final item.
        if (offset >= items.length) {
            const last = items[items.length - 1];
            return { node: last, offset: this._maxOffset(last) };
        }
        return { node: items[offset], offset: 0 };
    }

    _emit(type, detail) {
        this.dispatchEvent(
            new CustomEvent(type, { detail, bubbles: true, composed: true }),
        );
    }

    _emitInput() {
        const value = this.value;
        this._internals.setFormValue(value, this.name || null);
        this._updateCounter();
        this._updateValidity();
        this._emit("input", { value });
    }

    _emptyBlock() {
        return _el("p", null, [_el("br")]);
    }

    _emptySelection() {
        return {
            blockType: "p",
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            code: false,
            link: null,
        };
    }

    _ensureFiller(block) {
        const tag = block.tagName.toLowerCase();
        if (tag === "ul" || tag === "ol") {
            for (const li of block.children) {
                if (!li.firstChild) li.appendChild(_el("br"));
            }
            return;
        }
        if (!block.firstChild) block.appendChild(_el("br"));
    }

    /** Collapse a pending debounced snapshot so undo lands on a real boundary. */
    _flushHistory() {
        if (!this._historyTimer) return;
        clearTimeout(this._historyTimer);
        this._historyTimer = null;
        this._recordHistory(true);
    }

    _focusTool(buttons, index) {
        buttons.forEach((b, i) => {
            if (b.button) b.button.tabIndex = i === index ? 0 : -1;
        });
        buttons[index]?.button?.focus();
    }

    /** Turn a File into an image in the document, honouring `image-upload`. */
    _handleImageFile(file) {
        if (!file || !file.type.startsWith("image/")) return;

        if (!this.imageUpload) {
            const reader = new FileReader();
            reader.onload = () => this._insertImage(String(reader.result));
            reader.readAsDataURL(file);
            return;
        }

        const id = `upload-${++this._uploadSeq}`;
        const placeholder = _el("img", {
            class: "uploading",
            "data-upload": id,
            alt: file.name || "Uploading",
            // 1x1 transparent GIF — a real src keeps the node from collapsing
            // while the consumer uploads.
            src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        });
        this._insertNode(placeholder);
        this._afterMutation();

        let settled = false;
        const finish = () => {
            if (settled) return true;
            settled = true;
            return false;
        };

        this._emit("image-upload", {
            file,
            insert: (url) => {
                if (finish()) return;
                const node = this._content.querySelector(
                    `img[data-upload="${id}"]`,
                );
                if (!node) return;
                if (!isSafeUrl(url, { allowDataImage: true })) {
                    node.remove();
                } else {
                    node.removeAttribute("data-upload");
                    node.classList.remove("uploading");
                    node.setAttribute("src", url);
                }
                this._afterMutation();
                this._commit();
            },
            reject: () => {
                if (finish()) return;
                this._content
                    .querySelector(`img[data-upload="${id}"]`)
                    ?.remove();
                this._afterMutation();
            },
        });
    }

    /** Nest a list item one level deeper, or lift it one level out. */
    _indentListItem(item, deeper) {
        const list = item.parentNode;
        if (!list) return;

        if (deeper) {
            const previous = item.previousElementSibling;
            if (!previous) return;
            let nested = previous.lastElementChild;
            if (!nested || !["UL", "OL"].includes(nested.tagName)) {
                nested = _el(list.tagName.toLowerCase());
                previous.appendChild(nested);
            }
            nested.appendChild(item);
        } else {
            const parentItem = list.parentNode;
            if (!parentItem || parentItem.tagName !== "LI") return;
            parentItem.parentNode.insertBefore(item, parentItem.nextSibling);
            if (!list.firstChild) list.remove();
        }

        this._afterMutation();
    }

    /** Replace the selection with `fragment`. */
    _insertFragment(fragment) {
        const range = this._currentRange();
        if (!range) {
            this._content.appendChild(fragment);
            return;
        }
        range.deleteContents();
        const last = fragment.lastChild;
        range.insertNode(fragment);
        if (last) {
            const after = document.createRange();
            after.setStartAfter(last);
            after.collapse(true);
            this._selectRange(after);
        }
    }

    _insertImage(url) {
        if (!isSafeUrl(url, { allowDataImage: true })) return;
        this._insertNode(_el("img", { src: url, alt: "" }));
        this._afterMutation();
        this._commit();
    }

    _insertNode(node) {
        const range = this._currentRange();
        if (!range) {
            (this._content.lastElementChild ?? this._content).appendChild(node);
            return;
        }
        range.deleteContents();
        range.insertNode(node);
        const after = document.createRange();
        after.setStartAfter(node);
        after.collapse(true);
        this._selectRange(after);
    }

    _insertText(text) {
        const range = this._currentRange();
        if (!range) return;
        range.deleteContents();
        const node = document.createTextNode(text);
        range.insertNode(node);
        const after = document.createRange();
        after.setStartAfter(node);
        after.collapse(true);
        this._selectRange(after);
    }

    /** Whether the document holds nothing a reader would see. */
    _isEmpty() {
        return (
            this._plainText().trim() === "" &&
            !this._content.querySelector("img")
        );
    }

    /** Whether `sel` carries no active block or inline formatting. */
    _isEmptySelection(sel) {
        const empty = this._emptySelection();
        return Object.keys(empty).every((key) => sel[key] === empty[key]);
    }

    _listItemAtCaret() {
        const range = this._currentRange();
        if (!range) return null;
        let el = range.startContainer;
        el = el.nodeType === Node.ELEMENT_NODE ? el : el.parentNode;
        while (el && el !== this._content) {
            if (el.tagName === "LI") return el;
            el = el.parentNode;
        }
        return null;
    }

    _maxOffset(node) {
        return node.nodeType === Node.TEXT_NODE
            ? node.textContent.length
            : node.childNodes.length;
    }

    /** Host hooks the shared mention controller drives the editor through. */
    _mentionAdapter() {
        const host = this;
        return {
            get surface() {
                return host._content;
            },
            defaultRole: "textbox",
            isInactive: () => this.disabled || this.readonly,
            getContext: () => this._mentionContext(),
            getCaretRect: (fragment) => this._mentionCaretRect(fragment),
            applyInsertion: (payload) => this._applyMention(payload),
        };
    }

    /** The top-level block (or list item) the caret sits in. */
    _mentionBlock(node) {
        let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentNode;
        while (el && el !== this._content) {
            if (el.tagName === "LI") return el;
            if (el.parentNode === this._content) return el;
            el = el.parentNode;
        }
        return this._content.firstElementChild ?? this._content;
    }

    _mentionCaretRect(fragment) {
        const end = fragment?.end ?? null;
        const range =
            end !== null && end > 0
                ? this._mentionRange({ start: end - 1, end })
                : this._currentRange();
        if (!range) return null;

        // A wrapped range reports one rect per line; the caret is on the last.
        const rects = range.getClientRects();
        const rect = rects[rects.length - 1] ?? range.getBoundingClientRect();
        if (!rect.height) return this._content.getBoundingClientRect();

        return new DOMRect(rect.right, rect.top, 1, rect.height);
    }

    /** The atomic mention chip containing `node`, if any. */
    _mentionChipAt(node) {
        let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentNode;
        while (el && el !== this._content) {
            if (el.hasAttribute?.("data-mention-value")) return el;
            el = el.parentNode;
        }
        return null;
    }

    /**
     * Text and caret offset for trigger detection. Scoped to the caret's own
     * block so a trigger at the start of a paragraph counts as a word boundary,
     * and refused inside an atomic mention so a chip's own text cannot reopen
     * the popup.
     */
    _mentionContext() {
        const range = this._currentRange();
        if (!range || !range.collapsed) return null;

        const block = this._mentionBlock(range.startContainer);
        if (!block) return null;
        if (this._mentionChipAt(range.startContainer)) return null;

        this._mentionBlockEl = block;
        return {
            text: block.textContent,
            caret: this._textOffsetIn(
                block,
                range.startContainer,
                range.startOffset,
            ),
        };
    }

    /**
     * DOM range covering a `{start, end}` pair of character offsets. The offsets
     * are relative to the block `_mentionContext` last measured, which is the
     * block the fragment was detected in — the controller always re-reads the
     * context before asking for a rect or an insertion.
     */
    _mentionRange({ start: from, end: to }) {
        const block = this._mentionBlockEl;
        if (!block || !block.isConnected) return null;

        const start = this._positionAt(block, from);
        const end = this._positionAt(block, to);
        const range = document.createRange();
        try {
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
        } catch {
            return null;
        }
        return range;
    }

    _nodeFromPath(entry) {
        let node = this._content;
        for (const index of entry.path) {
            if (!node.childNodes[index]) return null;
            node = node.childNodes[index];
        }
        return node;
    }

    /** @returns {boolean} Whether the list needed restructuring. */
    _normalizeBlock(el, tag) {
        if (tag !== "ul" && tag !== "ol") return false;

        let changed = false;
        let item = null;
        for (const child of [...el.childNodes]) {
            if (
                child.nodeType === Node.ELEMENT_NODE &&
                child.tagName === "LI"
            ) {
                item = null;
                continue;
            }
            if (!item) {
                item = _el("li");
                el.insertBefore(item, child);
            }
            item.appendChild(child);
            changed = true;
        }
        if (!el.firstChild) {
            el.appendChild(_el("li", null, [_el("br")]));
            changed = true;
        }
        return changed;
    }

    /**
     * Reshape the document into a flat run of permitted blocks, putting the
     * caret back where it was.
     *
     * Reshaping detaches whatever the caret happens to be sitting in, which
     * collapses the selection up to the content root. Browsers that leave a
     * bare `<div>` behind when Enter exits a list (Firefox) hit that on the way
     * out of every list, and from then on each keystroke lands as loose text at
     * the top level and gets wrapped into a paragraph of its own.
     */
    _normalizeDocument() {
        const caret = this._captureCaret();
        const changed = this._reshapeDocument();
        if (changed && caret) this._restoreCaret(caret);
    }

    /**
     * Re-apply the inertness an atomic mention needs. `part` and
     * `contenteditable` are stripped on serialization, so a chip arriving from
     * `value` or the default slot gets them back here.
     *
     * Chips are also flattened to text, matching what the sanitizer does on the
     * way out. A chip's inner text node is still a text node in the document, so
     * an inline format applied across a selection that spans one would wrap it —
     * leaving a chip that looks half-formatted until the next serialize.
     */
    _normalizeMentions() {
        for (const chip of this._content.querySelectorAll(
            "span[data-mention-value]",
        )) {
            chip.setAttribute("contenteditable", "false");
            chip.setAttribute("part", "mention-chip");

            if (chip.firstElementChild) {
                const text = chip.textContent;
                chip.replaceChildren();
                if (text) chip.appendChild(document.createTextNode(text));
            }
            if (!chip.firstChild) chip.remove();
        }
    }

    _onBeforeInput(e) {
        if (this.disabled || this.readonly) {
            e.preventDefault();
            return;
        }

        if (
            e.inputType === "deleteContentBackward" &&
            this._removeMentionBefore()
        ) {
            e.preventDefault();
            return;
        }

        const max = this.maxLength;
        if (max === null) return;
        if (!e.data) return;

        const range = this._currentRange();
        const selected = range ? this._plainTextOf(range.cloneContents()) : "";
        const next = this._plainText().length - selected.length + e.data.length;
        if (next > max) e.preventDefault();
    }

    _onBlur() {
        this._mentions.close("blur");
        this._commit();
    }

    _onContentClick(e) {
        const link = e
            .composedPath()
            .find((n) => n.nodeType === Node.ELEMENT_NODE && n.tagName === "A");
        if (!link || !this._contentContains(link)) return;

        const detail = {
            href: link.getAttribute("href") || "",
            text: link.textContent,
        };
        const event = new CustomEvent("link-click", {
            detail,
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        if (!this.dispatchEvent(event)) return;

        e.preventDefault();
        if (this.disabled || this.readonly) return;
        this._openLinkPopover(link);
    }

    _onDrop(e) {
        if (this.disabled || this.readonly) return;
        const file = [...(e.dataTransfer?.files ?? [])].find((f) =>
            f.type.startsWith("image/"),
        );
        if (!file) return;
        e.preventDefault();
        this._handleImageFile(file);
    }

    _onInput() {
        this._normalizeDocument();
        this._emitInput();
        this._recordHistory(false);
        this._refreshSelection();
        this._mentions.refresh();
    }

    _onKeyDown(e) {
        if (this._mentions.handleKeyDown(e)) return;

        if (e.key === "Escape" && this._linkPopover.open) {
            e.preventDefault();
            this._closeLinkPopover();
            return;
        }

        if (e.key === "Tab") {
            const block = this._listItemAtCaret();
            if (block) {
                e.preventDefault();
                this._indentListItem(block, !e.shiftKey);
                return;
            }
            // Otherwise let Tab move focus out — the editor is never a trap.
            return;
        }

        if (this.disabled || this.readonly) return;

        const mod = e.ctrlKey || e.metaKey;
        if (!mod) return;

        const key = e.key.toLowerCase();

        if (e.shiftKey && key === "v") {
            this._plainPaste = true;
            return;
        }

        const tool = this._shortcutTool(e, key, mod);
        if (!tool) return;
        e.preventDefault();
        this._runTool(tool);
    }

    _onPaste(e) {
        if (this.disabled || this.readonly) return;
        e.preventDefault();

        const data = e.clipboardData;
        if (!data) return;

        const file = [...(data.files ?? [])].find((f) =>
            f.type.startsWith("image/"),
        );
        if (file) {
            this._handleImageFile(file);
            return;
        }

        const plainOnly = this._plainPaste;
        this._plainPaste = false;

        const html = plainOnly ? "" : data.getData("text/html");
        if (html) {
            const fragment = sanitizeHtmlToFragment(html, {
                allowedTags: this._allowedTags(),
                allowMentions: true,
            });
            this._insertFragment(fragment);
        } else {
            const text = data.getData("text/plain");
            if (!text) return;
            this._insertText(this._truncateToMax(text));
        }

        this._afterMutation();
    }

    _onSelectionChange() {
        if (!this.isConnected) return;

        if (!this._currentRange() && this._isEmptySelection(this._selection)) {
            return;
        }
        this._refreshSelection();
        this._mentions.refresh();
    }

    _onToolbarKeyDown(e) {
        const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(e.key)) return;

        const buttons = [
            ...this._toolbarEl.querySelectorAll("y-button[data-tool]"),
        ];
        if (buttons.length === 0) return;

        const active = buttons.findIndex(
            (b) => b.button === b.shadowRoot?.activeElement,
        );
        const current = active === -1 ? 0 : active;

        let next;
        if (e.key === "ArrowLeft")
            next = (current - 1 + buttons.length) % buttons.length;
        else if (e.key === "ArrowRight") next = (current + 1) % buttons.length;
        else if (e.key === "Home") next = 0;
        else next = buttons.length - 1;

        e.preventDefault();
        this._focusTool(buttons, next);
    }

    /** Open the link editor against `link`, or against the current selection. */
    _openLinkPopover(link) {
        const range = this._currentRange();
        this._linkTarget = link ?? null;
        this._linkRange = link ? null : (range?.cloneRange() ?? null);

        if (!link && (!range || range.collapsed)) return;

        this._linkInput.value = link?.getAttribute("href") ?? "";
        this._linkRemove.hidden = !link;
        this._linkPopover.anchor = link ?? this._content;
        this._linkPopover.open = true;

        requestAnimationFrame(() => this._linkInput.focus?.());
    }

    _pathTo(node, offset) {
        const path = [];
        let current = node;
        while (current && current !== this._content) {
            const parent = current.parentNode;
            if (!parent) return null;
            path.unshift([...parent.childNodes].indexOf(current));
            current = parent;
        }
        return current === this._content ? { path, offset } : null;
    }

    _pickImage() {
        this._fileInput.click();
    }

    /** Plain text of the document, without the caret-parking zero-width spaces. */
    _plainText() {
        return this._plainTextOf(this._content);
    }

    _plainTextOf(node) {
        return (node?.textContent ?? "").split(ZWSP).join("");
    }

    /** Inverse of `_textOffsetIn`: a character offset back to a DOM position. */
    _positionAt(root, offset) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let seen = 0;

        while (walker.nextNode()) {
            const node = walker.currentNode;
            const length = node.textContent.length;
            if (seen + length >= offset) {
                return { node, offset: offset - seen };
            }
            seen += length;
        }

        return { node: root, offset: root.childNodes.length };
    }

    /**
     * Record a snapshot. Commands record immediately; typing coalesces into one
     * step per pause so undo does not walk back one character at a time.
     */
    _recordHistory(immediate) {
        clearTimeout(this._historyTimer);
        this._historyTimer = null;

        const push = () => {
            this._historyTimer = null;
            const snapshot = {
                html: this._content.innerHTML,
                selection: this._selectionPath(),
            };
            const current = this._history[this._historyIndex];
            if (current && current.html === snapshot.html) return;

            this._history.length = this._historyIndex + 1;
            this._history.push(snapshot);
            if (this._history.length > HISTORY_LIMIT) this._history.shift();
            this._historyIndex = this._history.length - 1;
        };

        if (immediate) push();
        else this._historyTimer = setTimeout(push, HISTORY_DEBOUNCE_MS);
    }

    /** Reflect `value` to the attribute without re-entering the setter. */
    _reflect() {
        this._reflecting = true;
        this.setAttribute("value", this.value);
        this._reflecting = false;
    }

    _refreshSelection() {
        const next = this._computeSelection();
        const previous = this._selection;
        const same =
            previous && Object.keys(next).every((k) => next[k] === previous[k]);
        this._selection = next;
        this._syncToolbarState();
        if (!same) this._emit("selection-change", { selection: { ...next } });
    }

    _removeLink() {
        const link = this._linkTarget;
        if (link) {
            const parent = link.parentNode;
            while (link.firstChild) parent.insertBefore(link.firstChild, link);
            link.remove();
        }
        this._closeLinkPopover();
        this._afterMutation();
        this._commit();
    }

    /**
     * Delete an atomic mention sitting immediately before a collapsed caret as
     * one unit. Browsers mostly do this for `contenteditable="false"` already,
     * but not consistently across engines.
     * @returns {boolean} whether a chip was removed.
     */
    _removeMentionBefore() {
        const range = this._currentRange();
        if (!range || !range.collapsed) return false;

        const { startContainer: node, startOffset: offset } = range;
        if (node.nodeType === Node.TEXT_NODE && offset > 0) return false;

        const previous =
            node.nodeType === Node.TEXT_NODE
                ? node.previousSibling
                : (node.childNodes[offset - 1] ?? null);

        if (!previous?.hasAttribute?.("data-mention-value")) return false;

        const after = document.createRange();
        after.setStartBefore(previous);
        after.collapse(true);
        previous.remove();
        this._selectRange(after);
        this._afterMutation();
        return true;
    }

    /** Rewrite each block to `tag`, lifting list items out of their list. */
    _replaceBlocks(blocks, tag) {
        for (const block of blocks) {
            const isItem = block.tagName === "LI";
            const target = isItem ? block.parentNode : block;
            const replacement = _el(tag);
            while (block.firstChild) replacement.appendChild(block.firstChild);

            if (!isItem) {
                block.replaceWith(replacement);
                continue;
            }

            target.parentNode.insertBefore(replacement, target);
            block.remove();
            if (!target.firstChild) target.remove();
        }
    }

    _resetHistory() {
        this._history = [{ html: this._content.innerHTML, selection: null }];
        this._historyIndex = 0;
    }

    /**
     * The reshaping half of `_normalizeDocument`.
     * @returns {boolean} Whether anything in the document actually moved. The
     *   caret is only worth restoring when it did, and a plain keystroke
     *   normally changes nothing.
     */
    _reshapeDocument() {
        const content = this._content;
        const allowed = new Set(
            this.allowedBlocks.map((b) => BLOCK_TAG[b]).filter(Boolean),
        );
        let changed = false;
        let run = null;

        for (const node of [...content.childNodes]) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();

                if (allowed.has(tag)) {
                    run = null;
                    if (this._normalizeBlock(node, tag)) changed = true;
                    continue;
                }

                if (BLOCK_LIKE.has(tag)) {
                    const p = _el("p");
                    while (node.firstChild) p.appendChild(node.firstChild);
                    node.replaceWith(p);
                    run = null;
                    changed = true;
                    continue;
                }
            }

            if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
                node.remove();
                changed = true;
                continue;
            }

            if (!run) {
                run = _el("p");
                content.insertBefore(run, node);
            }
            run.appendChild(node);
            changed = true;
        }

        if (!content.firstChild) {
            content.appendChild(this._emptyBlock());
            changed = true;
        }
        for (const block of content.children) this._ensureFiller(block);
        this._normalizeMentions();
        return changed;
    }

    /**
     * Put the caret back after reshaping. Nodes are moved rather than cloned,
     * so the saved references are usually still good; a container that was
     * replaced outright is gone, and the positional path covers that case.
     */
    _restoreCaret(saved) {
        const live =
            this._contentContains(saved.startContainer) &&
            this._contentContains(saved.endContainer);

        if (live) {
            const start = this._descendIntoList(
                saved.startContainer,
                Math.min(saved.startOffset, this._maxOffset(saved.startContainer)),
            );
            const end = this._descendIntoList(
                saved.endContainer,
                Math.min(saved.endOffset, this._maxOffset(saved.endContainer)),
            );

            const range = document.createRange();
            try {
                range.setStart(start.node, start.offset);
                range.setEnd(end.node, end.offset);
                this._selectRange(range);
                return;
            } catch {
                // Offsets went stale — fall through to the path.
            }
        }

        if (saved.path) this._restoreSelectionPath(saved.path);
    }

    _restoreHistory() {
        const snapshot = this._history[this._historyIndex];
        if (!snapshot) return;
        this._content.innerHTML = snapshot.html;
        this._normalizeDocument();
        if (snapshot.selection) this._restoreSelectionPath(snapshot.selection);
        this._emitInput();
        this._refreshSelection();
    }

    _restoreSelectionPath(saved) {
        const startNode = this._nodeFromPath(saved.start);
        const endNode = this._nodeFromPath(saved.end);
        if (!startNode || !endNode) return;

        // Wrapping blocks into a list adds an `li` level the saved path knows
        // nothing about, so the path lands on the list itself.
        const start = this._descendIntoList(
            startNode,
            Math.min(saved.start.offset, this._maxOffset(startNode)),
        );
        const end = this._descendIntoList(
            endNode,
            Math.min(saved.end.offset, this._maxOffset(endNode)),
        );

        const range = document.createRange();
        try {
            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
        } catch {
            return;
        }
        this._selectRange(range);
    }

    _runTool(id) {
        if (this.disabled || this.readonly) return;

        if (INLINE_TOOLS[id]) {
            this._applyInline(INLINE_TOOLS[id]);
            return;
        }

        // Ctrl/Cmd+Alt+1..3 name a heading level directly rather than cycling.
        if (id.startsWith("heading:")) {
            this._toggleBlock(`h${id.slice("heading:".length)}`);
            return;
        }

        switch (id) {
            case "heading":
                this._cycleHeading();
                break;
            case "blockquote":
                this._toggleBlock("blockquote");
                break;
            case "code":
                this._toggleBlock("code");
                break;
            case "ordered-list":
                this._toggleBlock("ol");
                break;
            case "unordered-list":
                this._toggleBlock("ul");
                break;
            case "link":
                this._openLinkPopover(
                    this._closestInline(
                        this._currentRange()?.startContainer ?? this._content,
                        "a",
                    ),
                );
                break;
            case "image":
                this._pickImage();
                break;
            case "undo":
                this.undo();
                break;
            case "redo":
                this.redo();
                break;
            default:
                break;
        }
    }

    _satisfiesConstraints() {
        if (this.required && this._plainText().trim() === "") return false;
        const max = this.maxLength;
        if (max !== null && this._plainText().length > max) return false;
        return true;
    }

    _selectionPath() {
        const range = this._currentRange();
        if (!range) return null;
        const start = this._pathTo(range.startContainer, range.startOffset);
        const end = this._pathTo(range.endContainer, range.endOffset);
        return start && end ? { start, end } : null;
    }

    _selectNodes(nodes) {
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!first || !last || !first.isConnected || !last.isConnected) return;
        const range = document.createRange();
        range.setStartBefore(first);
        range.setEndAfter(last);
        this._selectRange(range);
    }

    _selectRange(range) {
        const root = this.shadowRoot;
        const selection = root.getSelection
            ? root.getSelection()
            : document.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(range);
    }

    _serialize() {
        if (!this._content) return "";
        if (this._isEmpty()) return "";

        const clone = this._content.cloneNode(true);
        for (const pending of clone.querySelectorAll("img[data-upload]")) {
            pending.remove();
        }

        const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.textContent.includes(ZWSP)) {
                node.textContent = node.textContent.split(ZWSP).join("");
            }
        }

        return sanitizeHtml(clone.innerHTML, {
            allowedTags: this._allowedTags(),
            allowMentions: true,
        });
    }

    _setBlockType(type) {
        if (!this.allowedBlocks.includes(type) && type !== "p") return;

        const range = this._currentRange();
        if (!range) return;

        const blocks = this._blocksInRange(range);
        if (blocks.length === 0) return;

        // Wrapping moves the block's children rather than copying them, so the
        // node references survive and the caret keeps its exact offset; the
        // path is the fallback for an empty block, which is discarded whole.
        const saved = this._captureCaret();
        if (type === "ul" || type === "ol") this._wrapInList(blocks, type);
        else this._replaceBlocks(blocks, BLOCK_TAG[type]);

        this._normalizeDocument();
        if (saved) this._restoreCaret(saved);
        this._emitInput();
        this._recordHistory(true);
        this._refreshSelection();
    }

    /**
     * Replace the content wholesale from an untrusted HTML string. A wholesale
     * replacement is a new baseline rather than an undoable step, so the history
     * restarts here — undo after it returns to the value that was set, not to
     * whatever preceded it.
     */
    _setHtml(html) {
        const fragment = sanitizeHtmlToFragment(html ?? "", {
            allowedTags: this._allowedTags(),
            allowMentions: true,
        });
        this._content.replaceChildren(fragment);
        this._normalizeDocument();
        this._updateCounter();
        this._resetHistory();
    }

    /** Match a keydown against the shortcut table; returns a tool id or null. */
    _shortcutTool(e, key, mod) {
        if (!mod) return null;

        if (e.altKey && ["1", "2", "3"].includes(e.key)) {
            return `heading:${e.key}`;
        }

        if (e.shiftKey) {
            const map = {
                x: "strike",
                z: "redo",
                7: "ordered-list",
                8: "unordered-list",
                ".": "blockquote",
            };
            return map[key] ?? map[e.key] ?? null;
        }

        const map = {
            b: "bold",
            i: "italic",
            u: "underline",
            k: "link",
            e: "inline-code",
            z: "undo",
        };
        return map[key] ?? null;
    }

    /** Split partially-selected boundary text nodes so the range hits whole ones. */
    _splitBoundaries(range) {
        const { startContainer, startOffset, endContainer, endOffset } = range;

        if (
            endContainer.nodeType === Node.TEXT_NODE &&
            endOffset > 0 &&
            endOffset < endContainer.textContent.length
        ) {
            endContainer.splitText(endOffset);
        }

        if (
            startContainer.nodeType === Node.TEXT_NODE &&
            startOffset > 0 &&
            startOffset < startContainer.textContent.length
        ) {
            const tail = startContainer.splitText(startOffset);
            range.setStart(tail, 0);
        }
    }

    /**
     * Lift `node` out of `ancestor`, re-wrapping the parts of `ancestor` that
     * sit before and after it so their formatting survives.
     */
    _splitOut(node, ancestor) {
        const parent = ancestor.parentNode;
        if (!parent || !ancestor.firstChild) return;

        const pre = document.createRange();
        pre.setStartBefore(ancestor.firstChild);
        pre.setEndBefore(node);
        const preFrag = pre.extractContents();

        const post = document.createRange();
        post.setStartAfter(node);
        post.setEndAfter(ancestor.lastChild);
        const postFrag = post.extractContents();

        if (preFrag.textContent !== "") {
            const clone = ancestor.cloneNode(false);
            clone.appendChild(preFrag);
            parent.insertBefore(clone, ancestor);
        }

        // What is left of `ancestor` is the chain down to `node` — unwrap only
        // the ancestor itself so any inner formatting is preserved.
        const chain = document.createDocumentFragment();
        while (ancestor.firstChild) chain.appendChild(ancestor.firstChild);
        parent.insertBefore(chain, ancestor);

        if (postFrag.textContent !== "") {
            const clone = ancestor.cloneNode(false);
            clone.appendChild(postFrag);
            parent.insertBefore(clone, ancestor);
        }

        ancestor.remove();
    }

    _syncAria() {
        const content = this._content;
        const label = this.getAttribute("aria-label");
        const labelledby = this.getAttribute("aria-labelledby");

        if (labelledby) content.setAttribute("aria-labelledby", labelledby);
        else content.removeAttribute("aria-labelledby");

        const slotted = this._labelWrapper
            .querySelector("slot")
            ?.assignedNodes({ flatten: true })
            .map((n) => n.textContent.trim())
            .join(" ")
            .trim();

        const resolved = label || slotted;
        if (resolved && !labelledby)
            content.setAttribute("aria-label", resolved);
        else if (!resolved) content.removeAttribute("aria-label");

        content.setAttribute("aria-required", String(this.required));
        content.setAttribute("aria-readonly", String(this.readonly));
        content.setAttribute("aria-disabled", String(this.disabled));
        content.setAttribute(
            "aria-invalid",
            String(this.invalid || !this._satisfiesConstraints()),
        );
    }

    _syncPlaceholder() {
        const text = this.placeholder;
        if (text) this._content.setAttribute("data-placeholder", text);
        else this._content.removeAttribute("data-placeholder");
    }

    _syncToolbarState() {
        const state = this._selection;

        for (const btn of this._toolbarEl.querySelectorAll(
            "y-button[data-tool]",
        )) {
            const id = btn.dataset.tool;
            let pressed = null;
            let disabled = false;

            if (id === "bold") pressed = state.bold;
            else if (id === "italic") pressed = state.italic;
            else if (id === "underline") pressed = state.underline;
            else if (id === "strike") pressed = state.strike;
            else if (id === "inline-code") pressed = state.code;
            else if (id === "link") pressed = state.link !== null;
            else if (id === "heading")
                pressed = ["h1", "h2", "h3"].includes(state.blockType);
            else if (id === "blockquote")
                pressed = state.blockType === "blockquote";
            else if (id === "code") pressed = state.blockType === "code";
            else if (id === "ordered-list") pressed = state.blockType === "ol";
            else if (id === "unordered-list")
                pressed = state.blockType === "ul";
            else if (id === "undo") disabled = this._historyIndex <= 0;
            else if (id === "redo")
                disabled = this._historyIndex >= this._history.length - 1;

            if (pressed === null) btn.removeAttribute("aria-pressed");
            else btn.setAttribute("aria-pressed", String(pressed));

            btn.setAttribute("aria-disabled", String(disabled));
        }
    }

    /** Text nodes fully inside `range`, in document order. */
    _textNodesInRange(range) {
        const walker = document.createTreeWalker(
            this._content,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) =>
                    node.textContent.length > 0 && range.intersectsNode(node)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_REJECT,
            },
        );

        const nodes = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            // intersectsNode is true for boundary nodes that contribute nothing;
            // after _splitBoundaries those are the only partial ones left.
            if (node === range.endContainer && range.endOffset === 0) continue;
            if (
                node === range.startContainer &&
                range.startOffset === node.textContent.length
            ) {
                continue;
            }
            nodes.push(node);
        }
        return nodes;
    }

    /** Character offset of a DOM position within `root`, matching `textContent`. */
    _textOffsetIn(root, node, offset) {
        const range = document.createRange();
        range.selectNodeContents(root);
        try {
            range.setEnd(node, offset);
        } catch {
            return 0;
        }
        return range.toString().length;
    }

    _toggleBlock(type) {
        const next = this._selection.blockType === type ? "p" : type;
        this._setBlockType(next);
    }

    _toggleInlineAtCaret(range, tag) {
        const existing = this._closestInline(range.startContainer, tag);
        if (existing) {
            const after = document.createRange();
            after.setStartAfter(existing);
            after.collapse(true);
            this._selectRange(after);
            return;
        }

        const wrapper = _el(tag);
        wrapper.appendChild(document.createTextNode(ZWSP));
        range.insertNode(wrapper);

        const inside = document.createRange();
        inside.setStart(wrapper.firstChild, 1);
        inside.collapse(true);
        this._selectRange(inside);
    }

    _toolbarGroups() {
        const raw = this.toolbar;
        if (raw === "false") return [];

        const groups = [];
        let current = [];

        for (const token of raw.trim().split(/\s+/)) {
            if (token === "|") {
                if (current.length) groups.push(current);
                current = [];
                continue;
            }
            if (!TOOLS[token] || !this._toolEnabled(token)) continue;
            current.push(token);
        }

        if (current.length) groups.push(current);
        return groups;
    }

    /** A block-producing tool is offered only if `allowed-blocks` permits it. */
    _toolEnabled(id) {
        const blocks = TOOLS[id].blocks;
        if (!blocks) return true;
        const allowed = new Set(this.allowedBlocks);
        return blocks.some((b) => allowed.has(b));
    }

    _truncateToMax(text) {
        const max = this.maxLength;
        if (max === null) return text;
        const room = max - this._plainText().length;
        return room <= 0 ? "" : text.slice(0, room);
    }

    _updateCounter() {
        const max = this.maxLength;
        const count = this._plainText().length;
        const show = this.showCount;

        this._counter.hidden = !show;
        if (!show) return;

        this._counterText.textContent =
            max === null ? String(count) : `${count} / ${max}`;

        // Announce only at the edges — a live region that fires on every
        // keystroke is unusable with a screen reader.
        if (max === null) {
            this._counterLive.textContent = "";
            this._counter.classList.remove("is-over");
            return;
        }

        const over = count > max;
        const near = count >= max - Math.max(10, Math.floor(max * 0.1));
        this._counter.classList.toggle("is-over", over);

        const message = over
            ? `Over the limit by ${count - max} characters`
            : near
              ? `${max - count} characters remaining`
              : "";
        if (this._counterLive.textContent !== message) {
            this._counterLive.textContent = message;
        }
    }

    _updateValidity() {
        if (!this._internals) return;

        const max = this.maxLength;
        const text = this._plainText();

        if (this.required && text.trim() === "") {
            this._internals.setValidity(
                { valueMissing: true },
                "Please fill out this field.",
                this._content,
            );
        } else if (max !== null && text.length > max) {
            this._internals.setValidity(
                { tooLong: true },
                `Please shorten this text to ${max} characters or less (you are currently using ${text.length}).`,
                this._content,
            );
        } else {
            this._internals.setValidity({});
        }

        this._syncAria();
    }

    _wrapInList(blocks, tag) {
        const first = blocks[0];
        const anchor = first.tagName === "LI" ? first.parentNode : first;
        const list = _el(tag);
        anchor.parentNode.insertBefore(list, anchor);

        for (const block of blocks) {
            const item = _el("li");
            while (block.firstChild) item.appendChild(block.firstChild);
            list.appendChild(item);

            const parent = block.parentNode;
            block.remove();
            if (parent !== this._content && !parent.firstChild) parent.remove();
        }
    }

    /** Wrap a single node in `tag`, returning the new wrapper. */
    _wrapNode(node, tag) {
        const wrapper = _el(tag);
        node.parentNode.insertBefore(wrapper, node);
        wrapper.appendChild(node);
        return wrapper;
    }
}

if (!customElements.get("y-editor")) {
    customElements.define("y-editor", YumeEditor);
}
