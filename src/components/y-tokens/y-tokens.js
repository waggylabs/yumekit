import "../y-icon/y-icon.js";
import "../y-progress/y-progress.js";
import "../y-tag/y-tag.js";
import {
    applyControlError,
    coerceRichData,
    createElement as _el,
    forwardControlAttributes,
    getColorVarPair,
    isSafeCssColor,
    manageLabelVisibility,
    resolveThemeMountPoint,
    upgradeProperties,
} from "../../modules/helpers.js";

/**
 * Host attributes forwarded to the combobox input. `required` is excluded: the
 * input holds pending text rather than the control's value, so a native
 * `required` there would fight the token list. The input takes `aria-required`.
 */
const TOKENS_FORWARDED_ATTRIBUTES = ["aria-label", "aria-labelledby"];

const DEFAULT_SEPARATORS = ",";

/** Chip color for a token that carries none — matches `y-select`'s tag mode. */
const DEFAULT_TOKEN_COLOR = "primary";

const DUPLICATE_POLICIES = new Set(["ignore", "allow", "error"]);

const FILTER_MODES = new Set(["contains", "starts-with", "none"]);

const LABEL_POSITIONS = new Set(["top", "left", "hidden"]);

const SEMANTIC_COLORS = new Set([
    "base",
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "help",
]);

const SIZES = new Set(["small", "medium", "large"]);

const TOKEN_SHAPES = new Set(["square", "round"]);

const TOKEN_VARIANTS = new Set(["filled", "outlined", "flat"]);

/** Tokens render one step down from the control size. */
const TOKEN_SIZE_FOR = { small: "small", medium: "small", large: "medium" };

/** Attributes that change the shape of the shadow tree, not just its content. */
const STRUCTURAL_ATTRIBUTES = new Set([
    "clearable",
    "disabled",
    "label-position",
    "placeholder",
    "placeholder-persist",
    "readonly",
    "required",
    "size",
    "token-shape",
    "token-variant",
    "variant",
]);

export class YumeTokens extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "allow-custom",
            "aria-label",
            "aria-labelledby",
            "async",
            "clearable",
            "disabled",
            "duplicates",
            "error-text",
            "filter",
            "invalid",
            "label-position",
            "loading",
            "max",
            "name",
            "options",
            "placeholder",
            "placeholder-persist",
            "portal",
            "query-delay",
            "readonly",
            "required",
            "separators",
            "size",
            "token-shape",
            "token-variant",
            "value",
            "variant",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();

        this._tokens = [];
        this._options = [];
        this._initialTokens = [];
        this._filtered = [];
        this._text = "";
        this._open = false;
        this._highlight = -1;
        this._activeToken = -1;
        this._transientError = "";
        this._announcedCount = null;
        this._queryId = 0;
        this._queryTimer = null;
        this._pulseTimer = null;
        this._portalContainer = null;
        this._onScrollOrResize = null;

        this._onDocumentClick = this._onDocumentClick.bind(this);
        this._onViewportChange = this._onViewportChange.bind(this);

        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position")) {
            this.setAttribute("label-position", "top");
        }

        this._initialTokens = this._tokens.map((token) => ({ ...token }));
        this._syncFormValue();
        this._updateValidity();
    }

    disconnectedCallback() {
        this._setOpen(false);
        this._deactivatePortal();
        clearTimeout(this._queryTimer);
        clearTimeout(this._pulseTimer);
        document.removeEventListener("click", this._onDocumentClick, true);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            this._applyTokens(this._coerceTokens(newValue));
            return;
        }

        if (name === "options") {
            this._setOptions(coerceRichData(newValue));
            return;
        }

        if (name === "name") {
            this._syncFormValue();
            return;
        }

        if (name === "loading") {
            this._renderPopupState();
            return;
        }

        if (name === "invalid" || name === "error-text") {
            this._updateErrorText();
            return;
        }

        if (name === "max") {
            this._updateValidity();
            return;
        }

        if (name === "aria-label" || name === "aria-labelledby") {
            forwardControlAttributes(
                this,
                this._input,
                TOKENS_FORWARDED_ATTRIBUTES,
            );
            return;
        }

        if (STRUCTURAL_ATTRIBUTES.has(name)) {
            this.render();
            return;
        }

        this._renderOptions();
    }

    formDisabledCallback(disabled) {
        if (disabled) this._setOpen(false);
    }

    formResetCallback() {
        this._transientError = "";
        this._setText("");
        this._applyTokens(this._initialTokens.map((token) => ({ ...token })));
    }

    formStateRestoreCallback(state) {
        if (state == null) return;

        const name = this.getAttribute("name");
        let values = [];
        if (typeof state === "string") values = this._splitText(state);
        else if (name && typeof state.getAll === "function") {
            values = state.getAll(name);
        }

        this._applyTokens(this._normalizeTokens(values));
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether text matching no option may become a token. */
    get allowCustom() {
        return this.hasAttribute("allow-custom");
    }
    set allowCustom(val) {
        if (val) this.setAttribute("allow-custom", "");
        else this.removeAttribute("allow-custom");
    }

    /**
     * @type {boolean} Whether typing emits `query` instead of filtering
     * `options` locally. The component never fetches — it only asks.
     */
    get async() {
        return this.hasAttribute("async");
    }
    set async(val) {
        if (val) this.setAttribute("async", "");
        else this.removeAttribute("async");
    }

    /** @type {boolean} Whether a control that removes every token is shown. */
    get clearable() {
        return this.hasAttribute("clearable");
    }
    set clearable(val) {
        if (val) this.setAttribute("clearable", "");
        else this.removeAttribute("clearable");
    }

    /** @type {boolean} Whether the control is non-interactive and unsubmitted. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /**
     * @type {"ignore"|"allow"|"error"} What happens when a repeat of an existing
     * token is committed. Comparison is on `value`, case-insensitive.
     */
    get duplicates() {
        const val = this.getAttribute("duplicates");
        return DUPLICATE_POLICIES.has(val) ? val : "ignore";
    }
    set duplicates(val) {
        this.setAttribute("duplicates", val);
    }

    /**
     * @type {string} Validation message shown under the control. A non-empty
     * value also puts the control in the error state and becomes the combobox's
     * accessible description.
     */
    get errorText() {
        return this.getAttribute("error-text") || "";
    }
    set errorText(val) {
        if (val == null || val === "") this.removeAttribute("error-text");
        else this.setAttribute("error-text", val);
    }

    /**
     * @type {"contains"|"starts-with"|"none"} How `options` are matched against
     * the pending text. `"none"` means the app has already filtered.
     */
    get filter() {
        const val = this.getAttribute("filter");
        return FILTER_MODES.has(val) ? val : "contains";
    }
    set filter(val) {
        this.setAttribute("filter", val);
    }

    /** @type {boolean} Whether the error state is forced on. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {"top"|"left"|"hidden"} Where the label slot renders. */
    get labelPosition() {
        const val = this.getAttribute("label-position");
        return LABEL_POSITIONS.has(val) ? val : "top";
    }
    set labelPosition(val) {
        this.setAttribute("label-position", val);
    }

    /**
     * @type {boolean} Whether the popup shows its busy state. Set automatically
     * between `query` and the next `options` assignment; the app may also set it.
     */
    get loading() {
        return this.hasAttribute("loading");
    }
    set loading(val) {
        if (val) this.setAttribute("loading", "");
        else this.removeAttribute("loading");
    }

    /** @type {number|null} Maximum token count; `null` when unset. */
    get max() {
        const raw = this.getAttribute("max");
        if (raw == null || raw === "") return null;
        const num = Number(raw);
        return Number.isFinite(num) && num >= 0 ? num : null;
    }
    set max(val) {
        if (val == null || val === "") this.removeAttribute("max");
        else this.setAttribute("max", String(val));
    }

    /** @type {string} Form field name. One entry per token is submitted under it. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /**
     * @type {Array<{value: string, label?: string, icon?: string, color?: string,
     * invalid?: boolean, disabled?: boolean}>} The suggestion list. Rich data
     * held as a property; the `options` attribute seeds an initial value and is
     * not kept in sync after an imperative set.
     */
    get options() {
        return this._options.map((option) => ({ ...option }));
    }
    set options(val) {
        this._setOptions(coerceRichData(val));
    }

    /** @type {string} Hint shown while the field is empty. */
    get placeholder() {
        return this.getAttribute("placeholder") || "";
    }
    set placeholder(val) {
        if (val == null || val === "") this.removeAttribute("placeholder");
        else this.setAttribute("placeholder", val);
    }

    /** @type {boolean} Whether the placeholder stays visible while tokens exist. */
    get placeholderPersist() {
        return this.hasAttribute("placeholder-persist");
    }
    set placeholderPersist(val) {
        if (val) this.setAttribute("placeholder-persist", "");
        else this.removeAttribute("placeholder-persist");
    }

    /**
     * @type {boolean} Whether the popup renders into the nearest `y-theme` mount
     * point so it escapes clipping and stacking ancestors, matching `y-select`.
     */
    get portal() {
        return this.hasAttribute("portal");
    }
    set portal(val) {
        if (val) this.setAttribute("portal", "");
        else this.removeAttribute("portal");
    }

    /** @type {number} Debounce in ms before `query` is emitted; `0` disables it. */
    get queryDelay() {
        const raw = this.getAttribute("query-delay");
        if (raw == null || raw === "") return 200;
        const num = Number(raw);
        return Number.isFinite(num) && num >= 0 ? num : 200;
    }
    set queryDelay(val) {
        if (val == null || val === "") this.removeAttribute("query-delay");
        else this.setAttribute("query-delay", String(val));
    }

    /** @type {boolean} Whether tokens are visible and focusable but not editable. */
    get readonly() {
        return this.hasAttribute("readonly");
    }
    set readonly(val) {
        if (val) this.setAttribute("readonly", "");
        else this.removeAttribute("readonly");
    }

    /** @type {boolean} Whether at least one token is required. */
    get required() {
        return this.hasAttribute("required");
    }
    set required(val) {
        if (val) this.setAttribute("required", "");
        else this.removeAttribute("required");
    }

    /**
     * @type {string} Characters that commit the pending text, in addition to
     * Enter. Every character in the string is its own separator.
     */
    get separators() {
        const val = this.getAttribute("separators");
        return val == null ? DEFAULT_SEPARATORS : val;
    }
    set separators(val) {
        if (val == null) this.removeAttribute("separators");
        else this.setAttribute("separators", val);
    }

    /** @type {"small"|"medium"|"large"} Control size (default "medium"). */
    get size() {
        const val = this.getAttribute("size");
        return SIZES.has(val) ? val : "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** @type {"square"|"round"} Shape forwarded to each token's `y-tag`. */
    get tokenShape() {
        const val = this.getAttribute("token-shape");
        return TOKEN_SHAPES.has(val) ? val : "square";
    }
    set tokenShape(val) {
        this.setAttribute("token-shape", val);
    }

    /** @type {"filled"|"outlined"|"flat"} Variant forwarded to each `y-tag`. */
    get tokenVariant() {
        const val = this.getAttribute("token-variant");
        return TOKEN_VARIANTS.has(val) ? val : "filled";
    }
    set tokenVariant(val) {
        this.setAttribute("token-variant", val);
    }

    /** @type {string} The current constraint-validation message. */
    get validationMessage() {
        return this._internals.validationMessage;
    }

    /** @type {ValidityState} The control's validity state. */
    get validity() {
        return this._internals.validity;
    }

    /**
     * @type {Array<{value: string, label?: string, icon?: string, color?: string,
     * invalid?: boolean}>} The committed tokens. Rich data held as a property;
     * the `value` attribute seeds an initial value (a JSON array or a
     * separator-delimited string) and is not kept in sync after a set.
     */
    get value() {
        return this._tokens.map((token) => ({ ...token }));
    }
    set value(val) {
        this._applyTokens(this._coerceTokens(val));
    }

    /**
     * @type {"default"|"underline"} Field chrome. `"default"` is a full border;
     * `"underline"` shows only a bottom border with square bottom corners.
     */
    get variant() {
        return this.getAttribute("variant") === "underline"
            ? "underline"
            : "default";
    }
    set variant(val) {
        this.setAttribute(
            "variant",
            val === "underline" ? "underline" : "default",
        );
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Append a token programmatically. Honors `max` and the `duplicates` policy,
     * and fires a cancelable `token-add` with `source: "api"`.
     * @param {string|{value: string}} token
     * @returns {boolean} whether the token was added
     */
    addToken(token) {
        return this._commitValues([token], "api").added.length > 0;
    }

    /**
     * @returns {boolean} whether the control satisfies its constraints; fires an
     * `invalid` event when it does not.
     */
    checkValidity() {
        return this._internals.checkValidity();
    }

    /** Remove every token, firing one cancelable `token-remove` per token. */
    clear() {
        const kept = [];
        let removed = 0;

        this._tokens.forEach((token, index) => {
            if (this._dispatchTokenRemove(token, index, "clear")) removed += 1;
            else kept.push(token);
        });

        if (!removed) return;

        this._applyTokens(kept);
        this._setActiveToken(-1, false);
        this._announce(`${removed} removed, ${kept.length} tokens.`);
        this._emitChange();
    }

    /** Close the suggestion popup. */
    closePopup() {
        this._setOpen(false);
    }

    /** Move focus to the control's single tab stop. */
    focus(options) {
        if (this._input) {
            this._input.focus(options);
            return;
        }
        this._tokenElements()[Math.max(this._activeToken, 0)]?.focus(options);
    }

    /** Open the suggestion popup. */
    openPopup() {
        this._setOpen(true);
    }

    /**
     * Remove the token at `index`, firing a cancelable `token-remove` first.
     * @param {number} index
     * @param {"click"|"backspace"|"clear"|"deselect"|"api"} [source="api"]
     * @returns {boolean} whether the token was removed
     */
    removeToken(index, source = "api") {
        const token = this._tokens[index];
        if (!token) return false;
        if (!this._dispatchTokenRemove(token, index, source)) return false;

        const next = this._tokens.filter((_, i) => i !== index);
        const label = token.label || token.value;

        this._applyTokens(next);
        this._setActiveToken(next.length ? Math.min(index, next.length - 1) : -1, false);
        this._announce(`${label} removed, ${next.length} tokens.`);
        this._emitChange();
        return true;
    }

    render() {
        this._setOpen(false);
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(this._buildTree());
        this._queryRefs();

        manageLabelVisibility(this._labelWrapper);
        forwardControlAttributes(this, this._input, TOKENS_FORWARDED_ATTRIBUTES);
        this._bindListeners();

        if (this._input) this._input.value = this._text;
        this._renderTokens();
        this._renderOptions();
        this._updatePlaceholder();
        this._updateErrorText();
    }

    /**
     * @returns {boolean} whether the control is valid, reporting the message to
     * the user when it is not.
     */
    reportValidity() {
        return this._internals.reportValidity();
    }

    /**
     * Assign the suggestion list, optionally rejecting a stale async response.
     * @param {Array} options
     * @param {number} [queryId] — the `id` from the `query` event being answered;
     *   the assignment is ignored once a newer query has gone out.
     * @returns {boolean} whether the options were applied
     */
    setOptions(options, queryId) {
        if (queryId != null && queryId !== this._queryId) return false;
        this._setOptions(coerceRichData(options));
        return true;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _activatePortal() {
        if (this._portalContainer || !this._popup) return;

        const portal = _el("div", { class: "y-tokens-portal" });
        const shadow = portal.attachShadow({ mode: "open" });
        shadow.adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets;
        shadow.appendChild(this._popup);

        resolveThemeMountPoint(this).appendChild(portal);
        this._portalContainer = portal;
    }

    _announce(message) {
        if (this._liveRegion) this._liveRegion.textContent = message;
        // Whatever we just said replaced the count, so the next filter should
        // report it again rather than assuming it is still on screen.
        this._announcedCount = null;
    }

    /** Summarize one commit batch for the live region. */
    _announceCommit(added, rejected) {
        const parts = added.map((token) => `${token.label || token.value} added`);

        for (const { raw, reason } of rejected) {
            const label = this._rawLabel(raw);
            if (reason === "duplicate") parts.push(`${label} is already added`);
            if (reason === "no-match") parts.push(`${label} is not an option`);
            if (reason === "max") {
                parts.push(`Maximum of ${this.max} tokens reached`);
            }
        }

        if (added.length) parts.push(`${this._tokens.length} tokens`);
        if (parts.length) this._announce(`${parts.join(", ")}.`);
    }

    /**
     * Report the suggestion count. Only the paths that actually re-filter call
     * this — a commit or a deselect also rebuilds the listbox, and announcing
     * the count there would bury the far more useful "X added" / "X is already
     * added" message under it.
     */
    _announceResultCount() {
        const count = this._filtered.length;
        if (this._announcedCount === count) return;

        this._announce(`${count} results available.`);
        this._announcedCount = count;
    }

    /** Replace the token list without emitting `change`. */
    _applyTokens(tokens) {
        this._tokens = tokens;
        if (this._activeToken >= tokens.length) {
            this._activeToken = tokens.length - 1;
        }

        this._renderTokens();
        this._syncFormValue();
        this._updateValidity();
        this._updateErrorText();
        this._updatePlaceholder();
    }

    _bindListeners() {
        this._popup?.addEventListener("mousedown", (e) => e.preventDefault());

        if (this.readonly) {
            this._tokenList?.addEventListener("keydown", (e) =>
                this._onTokenListKeydown(e),
            );
            return;
        }

        this._control?.addEventListener("mousedown", (e) => {
            if (e.target.closest(".token, .clear-button")) return;
            e.preventDefault();
            this._input?.focus();
        });

        this._clearButton?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.clear();
            this._input?.focus();
        });

        if (!this._input) return;

        this._input.addEventListener("blur", () => this._onBlur());
        this._input.addEventListener("focus", () => this._onFocus());
        this._input.addEventListener("input", () => this._onInput());
        this._input.addEventListener("keydown", (e) => this._onKeydown(e));
        this._input.addEventListener("paste", (e) => this._onPaste(e));
    }

    _buildClearButton() {
        return _el(
            "button",
            {
                class: "clear-button",
                part: "clear-button",
                type: "button",
                tabindex: "-1",
                "aria-label": "Remove all tokens",
                hidden: true,
            },
            [_el("y-icon", { name: "x", size: "small" })],
        );
    }

    _buildControl() {
        const children = [
            _el("slot", { name: "left-icon" }),
            _el("div", {
                class: "token-list",
                part: "token-list",
                id: "token-list",
                role: "list",
            }),
        ];

        if (!this.readonly) {
            children.push(this._buildInput());
            if (this.clearable) children.push(this._buildClearButton());
        }

        return _el(
            "div",
            {
                class: "control",
                part: "control",
                "aria-disabled": this.disabled ? "true" : null,
            },
            children,
        );
    }

    _buildInput() {
        return _el("input", {
            class: "input",
            part: "input",
            type: "text",
            role: "combobox",
            autocomplete: "off",
            autocapitalize: "off",
            autocorrect: "off",
            spellcheck: "false",
            "aria-autocomplete": "list",
            "aria-controls": "token-list listbox",
            "aria-expanded": "false",
            "aria-haspopup": "listbox",
            "aria-required": this.required ? "true" : null,
            disabled: this.disabled || null,
            tabindex: this.disabled ? "-1" : null,
        });
    }

    _buildOption(option, index) {
        const selected = this._indexOfValue(this._tokens, option.value) !== -1;
        const children = [];

        if (option.icon) {
            children.push(
                _el("span", { class: "option-icon", part: "option-icon" }, [
                    _el("y-icon", { name: option.icon, size: "small" }),
                ]),
            );
        }

        const label = _el("span", {
            class: "option-label",
            part: "option-label",
        });
        label.textContent = option.label || option.value;
        children.push(label);

        const node = _el(
            "div",
            {
                class: selected ? "option is-selected" : "option",
                part: "option",
                id: `option-${index}`,
                role: "option",
                "aria-selected": selected ? "true" : "false",
                "aria-disabled": option.disabled ? "true" : null,
            },
            children,
        );

        const pair = selected ? this._optionColorPair(option) : null;
        if (pair) {
            node.style.background = pair[0];
            node.style.color = pair[1];
        }

        if (!option.disabled) {
            node.addEventListener("click", () => this._selectOption(option));
        }

        return node;
    }

    _buildPopup() {
        const listbox = _el("div", {
            class: "listbox",
            id: "listbox",
            role: "listbox",
            "aria-multiselectable": "true",
        });

        const empty = _el("div", { class: "empty", part: "empty" }, [
            _el("slot", { name: "empty" }, ["No matches"]),
        ]);

        const loading = _el("div", { class: "loading", part: "loading" }, [
            _el("slot", { name: "loading" }, [
                _el("y-progress", {
                    mode: "ring",
                    indeterminate: true,
                    size: "18px",
                    thickness: "2px",
                    "label-display": "false",
                }),
                _el("span", null, ["Searching…"]),
            ]),
        ]);

        return _el("div", { class: "popup", part: "popup", hidden: true }, [
            listbox,
            empty,
            loading,
        ]);
    }

    _buildStyleSheet() {
        const size = this.size;
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-input-color);
            }

            :host([disabled]) {
                opacity: 0.75;
                pointer-events: none;
            }

            .wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
            }

            :host([label-position="left"]) .wrapper {
                flex-direction: row;
                align-items: flex-start;
                gap: var(--spacing-medium, 8px);
            }

            .label-wrapper {
                display: none;
                margin-bottom: var(--spacing-2x-small, 4px);
            }

            :host([label-position="left"]) .label-wrapper {
                margin-bottom: 0;
                padding-top: var(--spacing-x-small, 4px);
                flex-shrink: 0;
            }

            :host([label-position="hidden"]) .label-wrapper {
                position: absolute;
                width: 1px;
                height: 1px;
                overflow: hidden;
                clip: rect(0 0 0 0);
                white-space: nowrap;
            }

            .field {
                position: relative;
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }

            .control {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: var(--component-tokens-gap, 4px);
                background: var(--component-input-background);
                /* Style + color via the shorthand (fixed 1px width); real width
                   as a longhand so --component-inputs-border-width accepts a
                   1–4 value pattern for per-side widths. */
                border: 1px solid var(--component-input-border-color);
                border-width: var(--component-inputs-border-width, 1px);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: var(--component-tokens-padding-${size});
                min-height: var(--component-tokens-min-height-${size});
                max-height: var(--component-tokens-max-height, 120px);
                overflow-y: auto;
                box-sizing: border-box;
                cursor: text;
                transition: border-color 0.2s ease-in-out;
            }

            :host([readonly]) .control {
                cursor: default;
            }

            :host([disabled]) .control {
                background: var(--component-input-background-disabled);
            }

            /* Underline variant: bottom border only, square bottom corners. */
            :host([variant="underline"]) .control {
                border-style: none;
                border-bottom-style: solid;
                border-radius: var(--component-inputs-border-radius-outer) var(--component-inputs-border-radius-outer) 0 0;
            }

            .control:hover {
                border-color: var(--component-input-color);
            }

            .control:focus-within {
                border-color: var(--component-input-accent);
            }

            .control.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            .control.is-invalid:hover,
            .control.is-invalid:focus-within {
                border-color: var(--component-input-error-color);
            }

            /* A real box rather than display:contents, which can drop the list
               role from the accessibility tree. It sizes to its tokens so the
               input still flows onto the same row when there is space. */
            .token-list {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: var(--component-tokens-gap, 4px);
                min-width: 0;
            }

            .token-list:empty {
                display: none;
            }

            .token {
                cursor: default;
                border-radius: var(--component-tag-border-radius-square);
            }

            :host([token-shape="round"]) .token {
                border-radius: var(--component-tag-border-radius-circle);
            }

            .token:focus {
                outline: none;
            }

            .token.is-active {
                outline: 2px solid var(--component-input-accent);
                outline-offset: 1px;
            }

            .token.is-pulse {
                animation: token-pulse 0.6s ease-in-out;
            }

            @keyframes token-pulse {
                0%, 100% { transform: scale(1); }
                30% { transform: scale(1.12); }
                60% { transform: scale(0.98); }
            }

            @media (prefers-reduced-motion: reduce) {
                .token.is-pulse {
                    animation: none;
                    outline: 2px solid var(--component-input-accent);
                    outline-offset: 1px;
                }
            }

            .token-remove {
                all: unset;
                display: flex;
                align-items: center;
                cursor: pointer;
                opacity: 0.7;
            }

            .token-remove:hover {
                opacity: 1;
            }

            .input {
                all: unset;
                flex: 1 1 var(--component-tokens-input-min-width, 60px);
                min-width: var(--component-tokens-input-min-width, 60px);
                font-family: inherit;
                font-size: 1em;
                color: inherit;
                min-height: 20px;
            }

            .input::placeholder {
                color: var(--component-input-placeholder-color);
                opacity: 1;
            }

            .clear-button {
                all: unset;
                display: flex;
                align-items: center;
                margin-left: auto;
                flex-shrink: 0;
                cursor: pointer;
                color: var(--component-input-icon-color);
                opacity: 0.7;
            }

            .clear-button:hover {
                opacity: 1;
            }

            .clear-button[hidden] {
                display: none;
            }

            .popup {
                position: absolute;
                z-index: var(--component-select-z-index, 6000);
                left: 0;
                right: 0;
                box-sizing: border-box;
                background: var(--component-select-background);
                border: 1px solid var(--component-select-border-color);
                border-width: var(--component-inputs-border-width, 1px);
                border-radius: var(--component-inputs-border-radius-outer);
                box-shadow: var(--component-select-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
                max-height: var(--component-tokens-popup-max-height, 240px);
                overflow-y: auto;
            }

            .popup[hidden] {
                display: none;
            }

            .option {
                display: flex;
                align-items: center;
                gap: var(--spacing-x-small, 4px);
                padding: var(--spacing-small, 6px);
                cursor: pointer;
            }

            .option:hover,
            .option.is-highlighted {
                background: var(--component-select-hover-background);
            }

            /* Declared after the hover/highlight rules so a committed option
               keeps its accent fill, matching y-select. */
            .option.is-selected {
                background: var(--component-select-accent);
                color: var(--component-select-accent-contrast);
            }

            /* y-select has no keyboard highlight to preserve; this one drives
               aria-activedescendant, so on an already-accented row it reads as
               an inset ring instead of a background it could never win. */
            .option.is-selected.is-highlighted {
                box-shadow: inset 0 0 0 2px currentColor;
            }

            .option[aria-disabled="true"] {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .option-icon {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }

            .option-label {
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .empty,
            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-x-small, 4px);
                padding: var(--spacing-small, 6px);
                font-size: 0.875em;
                color: var(--component-select-label-color);
            }

            .empty[hidden],
            .loading[hidden],
            .listbox[hidden] {
                display: none;
            }

            .error-text {
                margin-top: var(--spacing-2x-small, 4px);
                font-size: 0.8em;
                color: var(--component-input-error-color);
            }

            .error-text[hidden] {
                display: none;
            }

            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-input-label-color);
            }

            .label-wrapper.is-invalid ::slotted([slot="label"]) {
                color: var(--component-input-error-color);
            }

            ::slotted([slot="left-icon"]) {
                display: flex;
                align-items: center;
                color: var(--component-input-icon-color);
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
        `);
        return sheet;
    }

    _buildToken(token, index) {
        const label = token.label || token.value;
        const children = [];

        if (token.icon) {
            children.push(_el("y-icon", { name: token.icon, size: "small" }));
        }
        children.push(document.createTextNode(label));

        if (!this.readonly && !this.disabled) {
            const remove = _el(
                "button",
                {
                    class: "token-remove",
                    part: "token-remove",
                    type: "button",
                    tabindex: "-1",
                    "aria-label": `Remove ${label}`,
                },
                [_el("y-icon", { name: "x", size: "small" })],
            );
            remove.addEventListener("click", (e) => {
                e.stopPropagation();
                this.removeToken(index, "click");
                this._input?.focus();
            });
            children.push(remove);
        }

        return _el(
            "y-tag",
            {
                class: "token",
                part: "token",
                id: `token-${index}`,
                role: "listitem",
                tabindex: "-1",
                variant: this.tokenVariant,
                shape: this.tokenShape,
                size: TOKEN_SIZE_FOR[this.size],
                color: this._tokenColor(token),
                "aria-invalid": token.invalid ? "true" : null,
            },
            children,
        );
    }

    _buildTree() {
        const label = _el("div", { class: "label-wrapper", part: "label" }, [
            _el("slot", { name: "label" }),
        ]);

        const error = _el("div", {
            class: "error-text",
            part: "error-text",
            id: "error-text",
            "aria-live": "polite",
            hidden: true,
        });

        const live = _el("div", {
            class: "sr-only",
            role: "status",
            "aria-live": "polite",
        });

        const field = _el("div", { class: "field" }, [
            this._buildControl(),
            this._buildPopup(),
            error,
        ]);

        return _el("div", { class: "wrapper", part: "wrapper" }, [
            label,
            field,
            live,
        ]);
    }

    /**
     * Parse the `value` attribute or property: an array, a JSON array string, or
     * a separator-delimited string.
     */
    _coerceTokens(val) {
        if (typeof val === "string") {
            const trimmed = val.trim();
            const source = trimmed.startsWith("[")
                ? coerceRichData(trimmed)
                : this._splitText(trimmed);
            return this._normalizeTokens(source);
        }
        return this._normalizeTokens(coerceRichData(val));
    }

    /** Commit whatever text is pending in the input. */
    _commitText(source) {
        const raw = this._input?.value ?? "";
        const parts = this._splitText(raw);
        if (!parts.length) {
            if (raw) this._setText("");
            return;
        }

        const { added, rejected } = this._commitValues(parts, source);

        // A single entry the user can still fix by editing — a prevented add, an
        // unmatched value under allow-custom="false", or a full field — keeps its
        // text. Everything else has been consumed.
        const recoverable = rejected.some(({ reason }) =>
            ["prevented", "no-match", "max"].includes(reason),
        );
        const keepText =
            !added.length &&
            parts.length === 1 &&
            source !== "paste" &&
            recoverable;

        if (!keepText) this._setText("");
        this._renderOptions();
    }

    /**
     * Commit a batch of raw entries, applying `max`, the `duplicates` policy, and
     * the cancelable `token-add` gate. Emits one `change` after the whole batch.
     * @param {Array<string|object>} values
     * @param {"enter"|"separator"|"paste"|"select"|"api"} source
     * @returns {{added: Array, rejected: Array<{raw: *, reason: string}>}}
     */
    _commitValues(values, source) {
        const next = this._tokens.slice();
        const added = [];
        const rejected = [];
        let duplicate = null;

        for (const raw of values) {
            const token = this._resolveToken(raw);
            if (!token) {
                rejected.push({ raw, reason: "no-match" });
                continue;
            }

            if (this.max != null && next.length >= this.max) {
                rejected.push({ raw, reason: "max" });
                continue;
            }

            const existing = this._indexOfValue(next, token.value);
            if (existing !== -1 && this.duplicates !== "allow") {
                if (this.duplicates === "error") duplicate = token;
                else this._pulseToken(existing);
                rejected.push({ raw, reason: "duplicate" });
                continue;
            }

            if (!this._dispatchTokenAdd(token, source)) {
                rejected.push({ raw, reason: "prevented" });
                continue;
            }

            next.push(token);
            added.push(token);
        }

        this._transientError = duplicate
            ? this.errorText ||
              `"${duplicate.label || duplicate.value}" has already been added.`
            : "";

        if (added.length) {
            this._applyTokens(next);
            this._emitChange();
        } else {
            this._updateValidity();
            this._updateErrorText();
        }

        this._announceCommit(added, rejected);
        return { added, rejected };
    }

    _deactivatePortal() {
        if (!this._portalContainer) return;

        const field = this.shadowRoot.querySelector(".field");
        if (field && this._popup && this._popup.parentNode !== field) {
            field.appendChild(this._popup);
        }
        this._portalContainer.remove();
        this._portalContainer = null;
    }

    _dispatchTokenAdd(token, source) {
        return this.dispatchEvent(
            new CustomEvent("token-add", {
                detail: { token: { ...token }, source },
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
    }

    _dispatchTokenRemove(token, index, source) {
        return this.dispatchEvent(
            new CustomEvent("token-remove", {
                detail: { token: { ...token }, index, source },
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
    }

    _emitChange() {
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            }),
        );
    }

    /** The options offered for the pending text, after local filtering. */
    _filterOptions() {
        const text = this._text.trim().toLowerCase();
        if (this.async || this.filter === "none" || !text) {
            return this._options.slice();
        }

        return this._options.filter((option) => {
            const haystack = `${option.label || option.value}`.toLowerCase();
            return this.filter === "starts-with"
                ? haystack.startsWith(text)
                : haystack.includes(text);
        });
    }

    _handleArrowHorizontal(e, key) {
        if (this._input?.value || !this._tokens.length) return;

        if (key === "ArrowLeft") {
            e.preventDefault();
            const from =
                this._activeToken === -1
                    ? this._tokens.length
                    : this._activeToken;
            this._setActiveToken(Math.max(0, from - 1));
            return;
        }

        if (this._activeToken === -1) return;
        e.preventDefault();
        this._setActiveToken(
            this._activeToken >= this._tokens.length - 1
                ? -1
                : this._activeToken + 1,
        );
    }

    /**
     * Backspace in an empty field highlights the last token; only a second,
     * separate press deletes it. Auto-repeat is swallowed, so a held key can
     * never eat the field.
     */
    _handleBackspace(e) {
        if (this._input?.value) return;

        e.preventDefault();
        if (e.repeat) return;

        if (this._activeToken >= 0) {
            this.removeToken(this._activeToken, "backspace");
            return;
        }
        if (this._tokens.length) this._setActiveToken(this._tokens.length - 1);
    }

    _handleHomeEnd(e, key) {
        if (this._activeToken === -1) return;
        e.preventDefault();
        this._setActiveToken(key === "Home" ? 0 : this._tokens.length - 1);
    }

    /** Case-insensitive lookup of a token value within a list. */
    _indexOfValue(tokens, value) {
        const needle = String(value).toLowerCase();
        return tokens.findIndex(
            (token) => String(token.value).toLowerCase() === needle,
        );
    }

    /** Move the suggestion highlight, wrapping and skipping disabled options. */
    _moveHighlight(delta) {
        const count = this._filtered.length;
        let index = this._highlight;
        this._highlight = -1;

        for (let step = 0; step < count; step++) {
            index =
                index === -1
                    ? delta > 0
                        ? 0
                        : count - 1
                    : (index + delta + count) % count;
            if (!this._filtered[index].disabled) {
                this._highlight = index;
                break;
            }
        }

        this._syncOptionState();
    }

    /** Normalize one raw entry into a token; returns null when it has no value. */
    _normalizeToken(entry) {
        const source =
            typeof entry === "string" || typeof entry === "number"
                ? { value: String(entry) }
                : entry;
        if (!source || typeof source !== "object") return null;

        const value = source.value == null ? "" : String(source.value).trim();
        if (!value) return null;

        const token = { value };
        if (source.label != null) token.label = String(source.label);
        if (source.icon != null) token.icon = String(source.icon);
        if (source.color != null) token.color = String(source.color);
        if (source.invalid) token.invalid = true;
        if (source.disabled) token.disabled = true;

        return token;
    }

    _normalizeTokens(entries) {
        if (!Array.isArray(entries)) return [];
        return entries
            .map((entry) => this._normalizeToken(entry))
            .filter(Boolean);
    }

    _onBlur() {
        this._setOpen(false);
        this._setActiveToken(-1, false);

        const text = this._input?.value ?? "";
        if (!text.trim()) {
            if (text) this._setText("");
            return;
        }

        if (this.allowCustom) {
            this._commitText("enter");
            return;
        }

        this._setText("");
        this._announce(`${text.trim()} discarded, it is not an option.`);
    }

    _onDocumentClick(e) {
        const path = e.composedPath();
        const insideHost = path.includes(this);
        const insidePortal =
            this._portalContainer && path.includes(this._portalContainer);

        if (!insideHost && !insidePortal) this._setOpen(false);
    }

    _onEnter() {
        const option =
            this._highlight >= 0 ? this._filtered[this._highlight] : null;
        if (option) {
            this._selectOption(option);
            return;
        }
        this._commitText("enter");
    }

    _onFocus() {
        if (this.disabled || this.readonly) return;
        this._renderOptions();
        if (this._filtered.length || this.loading) this._setOpen(true);
    }

    _onInput() {
        this._text = this._input.value;
        this._setActiveToken(-1, false);
        this._updatePlaceholder();

        if (this.async) this._scheduleQuery(this._text);
        this._setOpen(true);
        this._renderOptions();
        this._announceResultCount();

        this.dispatchEvent(
            new CustomEvent("input", {
                detail: { text: this._text },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _onKeydown(e) {
        const key = e.key;

        if (key === "ArrowDown" || key === "ArrowUp") {
            e.preventDefault();
            this._setActiveToken(-1, false);
            if (!this._open) this._setOpen(true);
            this._moveHighlight(key === "ArrowDown" ? 1 : -1);
            return;
        }

        if (key === "Enter") {
            // Swallowed only when there is something to commit, so an empty
            // field still submits the surrounding form.
            if (!this._open && !this._input.value) return;
            e.preventDefault();
            this._onEnter();
            return;
        }

        if (key === "Escape") {
            if (this._open) {
                e.stopPropagation();
                this._setOpen(false);
                return;
            }
            if (this._input.value) {
                e.stopPropagation();
                this._setText("");
            }
            return;
        }

        if (key === "Backspace") return this._handleBackspace(e);

        if (key === "Delete") {
            if (this._activeToken === -1) return;
            e.preventDefault();
            this.removeToken(this._activeToken, "backspace");
            return;
        }

        if (key === "ArrowLeft" || key === "ArrowRight") {
            return this._handleArrowHorizontal(e, key);
        }

        if (key === "Home" || key === "End") return this._handleHomeEnd(e, key);

        if (key.length === 1 && this.separators.includes(key)) {
            e.preventDefault();
            this._commitText("separator");
        }
    }

    _onPaste(e) {
        const text = e.clipboardData?.getData("text") ?? "";
        const parts = this._splitText(text);
        if (parts.length < 2) return;

        e.preventDefault();
        this._commitValues(parts, "paste");
        this._setText("");
        this._renderOptions();
    }

    _onTokenListKeydown(e) {
        const key = e.key;
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;

        const last = this._tokens.length - 1;
        if (last < 0) return;
        e.preventDefault();

        if (key === "Home") return this._setActiveToken(0);
        if (key === "End") return this._setActiveToken(last);

        const from = this._activeToken === -1 ? 0 : this._activeToken;
        const delta = key === "ArrowLeft" ? -1 : 1;
        this._setActiveToken(Math.min(last, Math.max(0, from + delta)));
    }

    _onViewportChange() {
        if (this.portal) {
            this._setOpen(false);
            return;
        }
        this._positionPopup();
    }

    /**
     * The [background, foreground] pair a committed option paints itself with,
     * or null to keep the stylesheet's accent default. Mirrors how `y-select`
     * colors a selected option: semantic names resolve to their content token
     * pair, a raw CSS color is gated by `isSafeCssColor` and auto-contrasted,
     * and anything else falls through.
     */
    _optionColorPair(option) {
        const color = option.color;
        if (!color) return null;
        if (!SEMANTIC_COLORS.has(color) && !isSafeCssColor(color)) return null;
        return getColorVarPair(color);
    }

    _positionPopup() {
        if (!this._popup || !this._control) return;

        const rect = this._control.getBoundingClientRect();
        const gap = 4;
        const height = this._popup.offsetHeight || 240;
        const spaceBelow = window.innerHeight - rect.bottom - gap;
        const below = spaceBelow >= height || spaceBelow >= rect.top;

        if (this.portal) {
            this._popup.style.position = "fixed";
            this._popup.style.left = `${rect.left}px`;
            this._popup.style.right = "auto";
            this._popup.style.width = `${rect.width}px`;
            this._popup.style.top = below ? `${rect.bottom + gap}px` : "auto";
            this._popup.style.bottom = below
                ? "auto"
                : `${window.innerHeight - rect.top + gap}px`;
            return;
        }

        const field = this._control.parentElement;
        this._popup.style.top = below
            ? `${this._control.offsetTop + this._control.offsetHeight + gap}px`
            : "auto";
        this._popup.style.bottom = below
            ? "auto"
            : `${field.offsetHeight - this._control.offsetTop + gap}px`;
    }

    /** Flash an existing token to show a repeat was folded into it. */
    _pulseToken(index) {
        const token = this._tokenElements()[index];
        if (!token) return;

        clearTimeout(this._pulseTimer);
        token.classList.remove("is-pulse");
        // Force a reflow so a repeat of the same token restarts the animation.
        void token.offsetWidth;
        token.classList.add("is-pulse");
        this._pulseTimer = setTimeout(
            () => token.classList.remove("is-pulse"),
            600,
        );
    }

    _queryRefs() {
        this._clearButton = this.shadowRoot.querySelector(".clear-button");
        this._control = this.shadowRoot.querySelector(".control");
        this._emptyElement = this.shadowRoot.querySelector(".empty");
        this._errorElement = this.shadowRoot.querySelector(".error-text");
        this._input = this.shadowRoot.querySelector(".input");
        this._labelWrapper = this.shadowRoot.querySelector(".label-wrapper");
        this._listbox = this.shadowRoot.querySelector(".listbox");
        this._liveRegion = this.shadowRoot.querySelector(".sr-only");
        this._loadingElement = this.shadowRoot.querySelector(".loading");
        this._popup = this.shadowRoot.querySelector(".popup");
        this._tokenList = this.shadowRoot.querySelector(".token-list");
    }

    _rawLabel(raw) {
        if (raw && typeof raw === "object") return raw.label || raw.value || "";
        return String(raw ?? "").trim();
    }

    /** Rebuild the listbox and announce the resulting suggestion count. */
    _renderOptions() {
        if (!this._listbox) return;

        this._filtered = this._filterOptions();
        this._highlight = -1;

        this._listbox.replaceChildren(
            ...this._filtered.map((option, index) =>
                this._buildOption(option, index),
            ),
        );

        this._renderPopupState();
    }

    /** Toggle the popup's empty / busy states against the current option set. */
    _renderPopupState() {
        if (!this._popup) return;

        const busy = this.loading;
        this._loadingElement.hidden = !busy;
        this._listbox.hidden = busy;
        this._emptyElement.hidden = busy || this._filtered.length > 0;
    }

    /** Rebuild the token strip from `_tokens`. */
    _renderTokens() {
        if (!this._tokenList) return;

        this._tokenList.replaceChildren(
            ...this._tokens.map((token, index) =>
                this._buildToken(token, index),
            ),
        );

        this._syncTokenState();
        this._updateClearButton();
    }

    /**
     * Resolve a raw entry against the option list, falling back to a custom
     * token only when `allow-custom` permits it.
     */
    _resolveToken(raw) {
        if (raw && typeof raw === "object") return this._normalizeToken(raw);

        const text = String(raw ?? "").trim();
        if (!text) return null;

        const needle = text.toLowerCase();
        const match = this._options.find(
            (option) =>
                !option.disabled &&
                (String(option.value).toLowerCase() === needle ||
                    String(option.label || "").toLowerCase() === needle),
        );
        if (match) return this._normalizeToken({ ...match, disabled: false });

        return this.allowCustom ? { value: text } : null;
    }

    /** Emit `query` after the configured debounce, marking the popup busy. */
    _scheduleQuery(text) {
        clearTimeout(this._queryTimer);

        const emit = () => {
            this._queryId += 1;
            this.loading = true;
            this.dispatchEvent(
                new CustomEvent("query", {
                    detail: { query: text, id: this._queryId },
                    bubbles: true,
                    composed: true,
                }),
            );
        };

        if (this.queryDelay === 0) {
            emit();
            return;
        }
        this._queryTimer = setTimeout(emit, this.queryDelay);
    }

    /**
     * Activate an option from the listbox. Because the listbox is
     * `aria-multiselectable`, activating an already-committed row toggles it
     * back off rather than re-running the `duplicates` policy — that policy
     * governs values arriving as *text* (typed, pasted, separator-committed),
     * where removing what the user just typed would be absurd. Under
     * `duplicates="allow"` there is no single token a toggle could mean, so the
     * option adds another copy instead.
     */
    _selectOption(option) {
        const existing = this._indexOfValue(this._tokens, option.value);

        if (existing !== -1 && this.duplicates !== "allow") {
            this.removeToken(existing, "deselect");
            this._setActiveToken(-1, false);
        } else {
            this._commitValues([{ ...option, disabled: false }], "select");
        }

        this._setText("");
        this._renderOptions();
        this._input?.focus();
    }

    /**
     * Move the token-strip highlight. DOM focus stays on the input so the
     * control keeps a single tab stop; `aria-activedescendant` and the live
     * region carry the position to assistive tech. In `readonly` there is no
     * input, so the token itself takes focus via a roving tabindex.
     */
    _setActiveToken(index, announce = true) {
        const last = this._tokens.length - 1;
        this._activeToken = index < 0 || last < 0 ? -1 : Math.min(index, last);
        this._syncTokenState();

        if (this._activeToken === -1) return;

        const token = this._tokens[this._activeToken];
        if (this.readonly) this._tokenElements()[this._activeToken]?.focus();
        if (announce) {
            this._announce(
                `${token.label || token.value}, ${this._activeToken + 1} of ${this._tokens.length}.`,
            );
        }
    }

    _setOpen(open) {
        const next = open && !this.disabled && !this.readonly;
        if (next === this._open) return;

        this._open = next;
        this._highlight = -1;

        if (this._popup) this._popup.hidden = !next;
        this._input?.setAttribute("aria-expanded", next ? "true" : "false");
        this._syncOptionState();

        if (!next) {
            this._deactivatePortal();
            document.removeEventListener("click", this._onDocumentClick, true);
            if (this._onScrollOrResize) {
                window.removeEventListener(
                    "scroll",
                    this._onScrollOrResize,
                    true,
                );
                window.removeEventListener("resize", this._onScrollOrResize);
                this._onScrollOrResize = null;
            }
            return;
        }

        if (this.portal) this._activatePortal();
        this._positionPopup();
        this._onScrollOrResize = this._onViewportChange;
        window.addEventListener("scroll", this._onScrollOrResize, true);
        window.addEventListener("resize", this._onScrollOrResize);
        document.addEventListener("click", this._onDocumentClick, true);
    }

    _setOptions(data) {
        this._options = this._normalizeTokens(data);
        clearTimeout(this._queryTimer);
        this.loading = false;
        this._renderOptions();
        if (this._open) this._announceResultCount();
    }

    /** Set the pending text without emitting `input`. */
    _setText(text) {
        this._text = text;
        if (this._input) this._input.value = text;
        this._updatePlaceholder();
    }

    /** Split raw text on the configured separators. */
    _splitText(text) {
        const raw = String(text ?? "");
        const separators = this.separators;
        if (!separators) return raw.trim() ? [raw.trim()] : [];

        const pattern = new RegExp(
            `[${separators.replace(/[\\\]^-]/g, "\\$&")}]`,
        );
        return raw
            .split(pattern)
            .map((part) => part.trim())
            .filter(Boolean);
    }

    _syncFormValue() {
        const name = this.getAttribute("name");
        if (!name) {
            this._internals.setFormValue(null);
            return;
        }

        const data = new FormData();
        for (const token of this._tokens) data.append(name, token.value);
        this._internals.setFormValue(data);
    }

    _syncOptionState() {
        if (!this._listbox) return;

        this._listbox.querySelectorAll(".option").forEach((node, index) => {
            node.classList.toggle("is-highlighted", index === this._highlight);
        });

        if (this._open && this._highlight >= 0) {
            const id = `option-${this._highlight}`;
            this._input?.setAttribute("aria-activedescendant", id);
            this._listbox
                .querySelector(`#${id}`)
                ?.scrollIntoView({ block: "nearest" });
            return;
        }

        if (this._activeToken === -1) {
            this._input?.removeAttribute("aria-activedescendant");
        }
    }

    _syncTokenState() {
        const elements = this._tokenElements();

        elements.forEach((element, index) => {
            element.classList.toggle("is-active", index === this._activeToken);
            if (!this.readonly) return;
            const roving =
                index === this._activeToken ||
                (this._activeToken === -1 && index === 0);
            element.setAttribute("tabindex", roving ? "0" : "-1");
        });

        if (this._activeToken >= 0) {
            this._input?.setAttribute(
                "aria-activedescendant",
                `token-${this._activeToken}`,
            );
            return;
        }

        if (this._highlight === -1) {
            this._input?.removeAttribute("aria-activedescendant");
        }
    }

    /**
     * Resolve a token's chip color. Semantic names pass through; a raw CSS color
     * is gated by `isSafeCssColor`; anything else falls back to the same default
     * a `y-select` tag uses, so the two controls read alike.
     */
    _tokenColor(token) {
        if (token.invalid) return "error";
        const color = token.color;
        if (!color) return DEFAULT_TOKEN_COLOR;
        if (SEMANTIC_COLORS.has(color)) return color;
        return isSafeCssColor(color) ? color : DEFAULT_TOKEN_COLOR;
    }

    _tokenElements() {
        return this._tokenList
            ? Array.from(this._tokenList.querySelectorAll(".token"))
            : [];
    }

    _updateClearButton() {
        if (!this._clearButton) return;
        this._clearButton.hidden = this._tokens.length === 0;
    }

    _updateErrorText() {
        const message = this._transientError || this.errorText;
        applyControlError(this._input, this._errorElement, message);

        const isInvalid = this.invalid || message !== "";
        this._control?.classList.toggle("is-invalid", isInvalid);
        this._labelWrapper?.classList.toggle("is-invalid", isInvalid);
    }

    _updatePlaceholder() {
        if (!this._input) return;

        const show =
            this.placeholder &&
            (this.placeholderPersist || this._tokens.length === 0);
        this._input.placeholder = show ? this.placeholder : "";
    }

    _updateValidity() {
        const anchor = this._input || this._control || undefined;

        if (this.required && !this._tokens.length) {
            this._internals.setValidity(
                { valueMissing: true },
                "Please add at least one entry.",
                anchor,
            );
            return;
        }

        if (this.max != null && this._tokens.length > this.max) {
            this._internals.setValidity(
                { rangeOverflow: true },
                `Please add no more than ${this.max} entries.`,
                anchor,
            );
            return;
        }

        if (this._transientError) {
            this._internals.setValidity(
                { customError: true },
                this._transientError,
                anchor,
            );
            return;
        }

        if (this._tokens.some((token) => token.invalid)) {
            this._internals.setValidity(
                { customError: true },
                this.errorText || "One or more entries are not valid.",
                anchor,
            );
            return;
        }

        this._internals.setValidity({});
    }
}

if (!customElements.get("y-tokens")) {
    customElements.define("y-tokens", YumeTokens);
}
