import "../y-button/y-button.js";
import "../y-checkbox/y-checkbox.js";
import "../y-color/y-color.js";
import "../y-date/y-date.js";
import "../y-input/y-input.js";
import "../y-progress/y-progress.js";
import "../y-radio/y-radio.js";
import "../y-rating/y-rating.js";
import "../y-select/y-select.js";
import "../y-skeleton/y-skeleton.js";
import "../y-slider/y-slider.js";
import "../y-switch/y-switch.js";
import "../y-textarea/y-textarea.js";
import {
    coerceRichData,
    createElement as _el,
    hideEmptySlotContainers,
    upgradeProperties,
} from "../../modules/helpers.js";

/** Field descriptor `type` → rendered element tag. */
const FIELD_TAGS = {
    input: "y-input",
    textarea: "y-textarea",
    select: "y-select",
    checkbox: "y-checkbox",
    radio: "y-radio",
    switch: "y-switch",
    slider: "y-slider",
    date: "y-date",
    color: "y-color",
    rating: "y-rating",
};

/** Tags whose value is a boolean `checked` state rather than `value`. */
const CHECKED_TAGS = new Set(["Y-CHECKBOX", "Y-SWITCH"]);

/** Field types that accept the propagated `size` attribute. */
const SIZED_TYPES = new Set([
    "input",
    "textarea",
    "select",
    "switch",
    "slider",
    "date",
    "color",
    "rating",
]);

/** Field types that accept a `placeholder` attribute. */
const PLACEHOLDER_TYPES = new Set([
    "input",
    "textarea",
    "select",
    "date",
    "color",
]);

/**
 * Native input types accepted as a flat `type` shorthand — `{type: "email"}` is
 * sugar for `{type: "input", inputType: "email"}`. Types that already have a
 * dedicated component (`date`, `color`) are deliberately absent; `FIELD_TAGS`
 * resolves those first.
 */
const INPUT_TYPE_SHORTHANDS = new Set([
    "text",
    "email",
    "url",
    "tel",
    "number",
    "password",
    "search",
    "time",
    "datetime-local",
    "month",
    "week",
]);

/** Default validation copy for input types the browser checks natively. */
const INVALID_MESSAGES = {
    email: "Enter a valid email address",
    url: "Enter a valid URL",
    tel: "Enter a valid phone number",
    number: "Enter a valid number",
};

/** Attributes that are purely `:host([...])` CSS hooks or read on demand. */
const INERT_ATTRIBUTES = new Set(["layout", "label-position", "novalidate"]);

/** Selector matching form controls inside slotted (projected) content. */
const CONTROL_SELECTOR = [
    ...Object.values(FIELD_TAGS),
    "y-editor",
    "input",
    "select",
    "textarea",
]
    .map((tag) => `${tag}[name]`)
    .join(", ");

/**
 * Shared stylesheet for every <y-form> instance. All state-dependent styling
 * is expressed through `:host([...])` attribute selectors, so the sheet is
 * fully static; it is built lazily on first construction and reused.
 */
let styleSheet = null;

function getStyleSheet() {
    if (styleSheet) return styleSheet;

    styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(`
        :host([hidden]) {
            display: none;
        }

        :host {
            display: block;
            font-family: var(--font-family-body);
            color: var(--component-input-color);
        }

        form {
            display: flex;
            flex-direction: column;
            gap: var(--component-form-gap, 16px);
        }

        :host([layout="inline"]) form {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-end;
        }

        .fields {
            display: flex;
            flex-direction: column;
            gap: var(--component-form-gap, 16px);
            min-width: 0;
        }

        :host([layout="horizontal"]) .fields,
        :host([layout="inline"]) .fields {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: flex-end;
        }

        :host([layout="horizontal"]) .field {
            flex: 1 1 220px;
            min-width: 0;
        }

        .field {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2x-small, 4px);
        }

        .field-body {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-2x-small, 4px);
            min-width: 0;
        }

        /* Inline-flex controls must not stretch across the field row,
           which would center their content instead of left-aligning it. */
        .field-body > y-switch,
        .field-body > y-checkbox,
        .field-body > y-rating {
            align-self: flex-start;
        }

        /* Skeletons are always in the tree and toggled via [hidden], so a
           loading change never rebuilds a control. */
        :host([loading][loading-mode="skeleton"]) .field-body > *:not(.field-skeleton) {
            display: none;
        }

        .field-label[hidden] {
            display: none;
        }

        :host([label-position="left"]) .field:not(.field--slot) {
            display: grid;
            grid-template-columns: var(--component-form-label-width, 160px) minmax(0, 1fr);
            column-gap: var(--spacing-medium, 8px);
            align-items: center;
        }

        :host([label-position="left"]) .field:not(.field--slot) .field-body {
            grid-column: 2;
        }

        .field-label {
            font-size: 0.875em;
            font-weight: 500;
            color: var(--component-input-label-color);
        }

        .required-mark {
            margin-inline-start: 0.15em;
            color: var(--component-input-error-color);
        }

        .field-help {
            font-size: 0.8em;
            color: var(--component-input-placeholder-color);
        }

        .field-error {
            font-size: 0.8em;
            color: var(--component-input-error-color);
        }

        .field-error[hidden] {
            display: none;
        }

        .actions {
            display: flex;
            align-items: center;
            gap: var(--component-form-actions-gap, 12px);
            justify-content: var(--component-form-actions-justify, flex-start);
        }

        slot[name="actions"] {
            display: contents;
        }

        .loading-ring {
            flex: 0 0 auto;
        }
    `);
    return styleSheet;
}

export class YumeForm extends HTMLElement {
    static get observedAttributes() {
        return [
            "fields",
            "submit-text",
            "reset-text",
            "no-reset",
            "layout",
            "label-position",
            "size",
            "disabled",
            "loading",
            "loading-mode",
            "novalidate",
            "action",
            "method",
            "name",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._fields = null;
        this._controls = [];
        this._fieldSlots = [];
        this._slottedCache = new Set();
        this._valueCache = {};
        this._form = null;
        this._actionsSlot = null;

        this.attachShadow({ mode: "open" });
        this.shadowRoot.adoptedStyleSheets = [getStyleSheet()];
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "fields") {
            this._fields = coerceRichData(newValue);
            this.render({ preserveValues: false });
            return;
        }

        if (INERT_ATTRIBUTES.has(name)) return;

        // Every remaining attribute is state, not structure. Re-rendering would
        // drop focus, selection, IME composition, and open dropdowns — which is
        // exactly what `loading`/`disabled` toggle during a submit.
        this._applyState();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {string|null} Native form action URL for progressive enhancement. */
    get action() {
        return this.getAttribute("action");
    }
    set action(val) {
        if (val == null || val === "") this.removeAttribute("action");
        else this.setAttribute("action", val);
    }

    /** @type {boolean} Whether all controls and buttons are disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {Array<Object>} Ordered field descriptors. Rich data held as a property (identity preserved, not serialized); the `fields` attribute seeds an initial value but is not kept in sync after an imperative set. */
    get fields() {
        return Array.isArray(this._fields) ? this._fields : [];
    }
    set fields(val) {
        this._fields = coerceRichData(val);
        this.render({ preserveValues: false });
    }

    /** @type {string} Label position: "top" | "left" (default "top"). */
    get labelPosition() {
        return this.getAttribute("label-position") === "left" ? "left" : "top";
    }
    set labelPosition(val) {
        this.setAttribute("label-position", val);
    }

    /** @type {string} Field stacking: "vertical" | "horizontal" | "inline" (default "vertical"). */
    get layout() {
        const val = this.getAttribute("layout");
        return ["vertical", "horizontal", "inline"].includes(val)
            ? val
            : "vertical";
    }
    set layout(val) {
        this.setAttribute("layout", val);
    }

    /** @type {boolean} Submitting state — blocks re-submission and shows a busy indicator. */
    get loading() {
        return this.hasAttribute("loading");
    }
    set loading(val) {
        if (val) this.setAttribute("loading", "");
        else this.removeAttribute("loading");
    }

    /** @type {string} Busy indicator while loading: "ring" (progress ring in the action row, default) | "skeleton" (skeleton placeholders over the fields). */
    get loadingMode() {
        return this.getAttribute("loading-mode") === "skeleton"
            ? "skeleton"
            : "ring";
    }
    set loadingMode(val) {
        this.setAttribute("loading-mode", val);
    }

    /** @type {string} Native form method when `action` is set: "get" | "post" (default "post"). */
    get method() {
        return this.getAttribute("method") === "get" ? "get" : "post";
    }
    set method(val) {
        this.setAttribute("method", val);
    }

    /** @type {string} The form name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {boolean} Whether the reset button is hidden. */
    get noReset() {
        return this.hasAttribute("no-reset");
    }
    set noReset(val) {
        if (val) this.setAttribute("no-reset", "");
        else this.removeAttribute("no-reset");
    }

    /** @type {boolean} Whether built-in validation is skipped on submit. */
    get novalidate() {
        return this.hasAttribute("novalidate");
    }
    set novalidate(val) {
        if (val) this.setAttribute("novalidate", "");
        else this.removeAttribute("novalidate");
    }

    /** @type {string} Label for the reset button (default "Reset"). */
    get resetText() {
        return this.getAttribute("reset-text") || "Reset";
    }
    set resetText(val) {
        this.setAttribute("reset-text", val);
    }

    /** @type {string} Size propagated to controls and buttons: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** @type {string} Label for the submit button (default "Submit"). */
    get submitText() {
        return this.getAttribute("submit-text") || "Submit";
    }
    set submitText(val) {
        this.setAttribute("submit-text", val);
    }

    /** @type {Object} Current field values keyed by name — the form's full state, including disabled fields, so a form that disables its controls while saving still reports what it holds. Native submission semantics (omitting disabled fields) apply to `formData`, not here. Setting merges by name into the rendered controls; unknown keys are ignored. */
    get values() {
        return this._collectValues({ includeDisabled: true });
    }
    set values(val) {
        const incoming = coerceRichData(val, {});
        this._refreshSlottedCache();

        for (const entry of this._controls) {
            const name = entry.field.name;
            if (!name || !(name in incoming)) continue;
            this._writeValue(entry.el, incoming[name]);
            this._valueCache[name] = this._readValue(entry.el);
        }

        for (const el of this._slottedControls()) {
            const name = el.getAttribute("name");
            if (!name || !(name in incoming)) continue;
            this._writeValue(el, incoming[name]);
            this._valueCache[name] = this._readValue(el);
        }
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Checks the validity of every field without showing validation UI.
     * @returns {boolean} Whether all fields are valid.
     */
    checkValidity() {
        return this._validate({ showUI: false }).length === 0;
    }

    render({ preserveValues = true } = {}) {
        const previous =
            preserveValues && this._controls.length ? this.values : null;

        this.shadowRoot.replaceChildren(this._buildTree());

        this._form = this.shadowRoot.querySelector("form");
        this._refreshSlottedCache();
        this._applyState();

        if (previous) this.values = previous;

        this._valueCache = {};
        for (const entry of this._controls) {
            if (entry.field.name)
                this._valueCache[entry.field.name] = this._readValue(entry.el);
        }

        this._bindFormListeners();
        hideEmptySlotContainers(this.shadowRoot, {
            header: ".header",
            footer: ".footer",
        });
    }

    /**
     * Resets all generated fields to their descriptor values after dispatching
     * a cancelable `y-reset` event.
     */
    reset() {
        const proceed = this.dispatchEvent(
            new CustomEvent("y-reset", {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {},
            }),
        );
        if (!proceed) return;

        for (const entry of this._controls) {
            this._writeValue(entry.el, this._initialValue(entry.field));
            this._setFieldValidity(entry, null);
            if (entry.field.name)
                this._valueCache[entry.field.name] = this._readValue(entry.el);
        }
    }

    /** Submits the form programmatically (validation and events included). */
    submit() {
        this._form?.requestSubmit();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /**
     * Syncs every state-only attribute onto the tree that already exists.
     * Nothing here replaces a generated control, so focus, caret position, IME
     * composition, and open dropdowns all survive a `loading` or `disabled`
     * toggle mid-submit.
     */
    _applyState() {
        if (!this._form) return;

        this._syncFormAttributes();
        this._syncControls();
        this._syncActions();
    }

    _bindFormListeners() {
        this._form.addEventListener("submit", (e) => this._onSubmit(e));
        this._form.addEventListener("reset", (e) => {
            e.preventDefault();
            this.reset();
        });
        this._form.addEventListener("change", (e) => this._onFieldInput(e));
        this._form.addEventListener("input", (e) => this._onFieldInput(e));
        this._form.addEventListener("keydown", (e) => this._onKeydown(e));

        for (const name of ["header", "footer"]) {
            const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
            slot?.addEventListener("slotchange", () =>
                hideEmptySlotContainers(this.shadowRoot, {
                    header: ".header",
                    footer: ".footer",
                }),
            );
        }

        for (const slot of this._fieldSlots) {
            slot.addEventListener("slotchange", () =>
                this._refreshSlottedCache(),
            );
        }
    }

    /**
     * Builds the bare action row. Button text, size, disabled state, and the
     * presence of the reset button and busy ring are all applied by
     * `_applyState` so they can change without a rebuild.
     */
    _buildActions() {
        const submit = _el(
            "y-button",
            {
                part: "submit-button",
                type: "submit",
                color: "primary",
                variant: "filled",
            },
            [this.submitText],
        );

        this._actionsSlot = _el("slot", { name: "actions" }, [submit]);
        return _el("div", { class: "actions", part: "actions" }, [
            this._actionsSlot,
        ]);
    }

    _buildControl(field) {
        const tag = FIELD_TAGS[field.type] || "y-input";
        const isChecked = CHECKED_TAGS.has(tag.toUpperCase());

        // The visible label lives in this shadow root, so it cannot name the
        // control by IDREF; `aria-label` carries the same string instead and
        // the control forwards it to its own inner element.
        const attrs = {
            name: field.name,
            "aria-label": field.label || null,
        };
        if (tag === "y-input") attrs.type = field.inputType || "text";
        if (PLACEHOLDER_TYPES.has(field.type) && field.placeholder != null)
            attrs.placeholder = field.placeholder;
        if (field.autocomplete != null)
            attrs.autocomplete = field.autocomplete;
        if (field.required) attrs.required = true;
        if (field.min != null) attrs.min = field.min;
        if (field.max != null) attrs.max = field.max;
        if (field.step != null) attrs.step = field.step;

        if (isChecked) {
            if (field.value) attrs.checked = true;
        } else if (field.value != null) {
            attrs.value = field.value;
        }

        const el = _el(tag, attrs);
        if (Array.isArray(field.options)) el.options = field.options;
        return el;
    }

    _buildField(rawField, index) {
        if (rawField.slot) {
            const outlet = _el("slot", { name: rawField.slot });
            this._fieldSlots.push(outlet);
            return _el("div", { class: "field field--slot" }, [outlet]);
        }

        const field = this._resolveField(rawField);
        const control = this._buildControl(field);
        const errorId = `field-error-${index}`;
        const error = _el("div", {
            class: "field-error",
            id: errorId,
            "aria-live": "polite",
            hidden: true,
        });

        const skeleton = this._buildSkeleton(field);

        const body = [control];
        if (field.help)
            body.push(_el("div", { class: "field-help" }, [field.help]));
        body.push(error, skeleton);

        const children = [];
        let label = null;
        let labelSkeleton = null;
        if (field.label) {
            labelSkeleton = this._buildLabelSkeleton(field);
            label = _el("span", { class: "field-label" }, [
                field.label,
                field.required
                    ? _el(
                          "span",
                          { class: "required-mark", "aria-hidden": "true" },
                          ["*"],
                      )
                    : null,
            ]);
            label.addEventListener("click", () => this._focusControl(control));
            children.push(label, labelSkeleton);
        }
        children.push(_el("div", { class: "field-body" }, body));

        this._controls.push({
            field,
            el: control,
            errorEl: error,
            errorId,
            skeletonEl: skeleton,
            labelEl: label,
            labelSkeletonEl: labelSkeleton,
        });
        return _el("div", { class: "field" }, children);
    }

    _buildLabelSkeleton(field) {
        const chars = Math.min(Math.max(field.label.length, 4), 16);

        return _el("y-skeleton", {
            class: "label-skeleton",
            variant: "text",
            width: `${chars}ch`,
            hidden: true,
        });
    }

    _buildSkeleton(field) {
        return _el("y-skeleton", {
            class: "field-skeleton",
            variant: "rect",
            height: this._skeletonHeight(field),
            width: this._isCompactField(field) ? "40%" : null,
            hidden: true,
        });
    }

    _buildTree() {
        this._controls = [];
        this._fieldSlots = [];

        const header = _el(
            "div",
            { class: "header", part: "header", id: "form-header" },
            [_el("slot", { name: "header" })],
        );

        const fields = _el(
            "div",
            {
                class: "fields",
                part: "fields",
                role: "group",
                "aria-labelledby": "form-header",
            },
            this.fields.map((field, index) => this._buildField(field, index)),
        );

        const children = [header, fields];
        children.push(this._buildActions());
        children.push(
            _el("div", { class: "footer", part: "footer" }, [
                _el("slot", { name: "footer" }),
            ]),
        );

        return _el(
            "form",
            {
                part: "form",
                novalidate: true,
                name: this.name || null,
                action: this.action,
                method: this.action ? this.method : null,
                "aria-busy": this.loading ? "true" : null,
            },
            children,
        );
    }

    _collectFormData() {
        const formData = new FormData();
        const values = this._collectValues();

        for (const [name, value] of Object.entries(values)) {
            if (typeof value === "boolean") {
                if (value) formData.append(name, "on");
            } else if (value != null) {
                formData.append(name, value);
            }
        }

        return formData;
    }

    _collectValues({ includeDisabled = false } = {}) {
        const values = {};

        for (const entry of this._controls) {
            const { field, el } = entry;
            if (!field.name) continue;
            if (!includeDisabled && (this.disabled || field.disabled)) continue;
            values[field.name] = this._readValue(el);
        }

        for (const el of this._slottedControls()) {
            const name = el.getAttribute("name");
            if (!name) continue;
            if (!includeDisabled && (this.disabled || el.disabled)) continue;
            values[name] = this._readValue(el);
        }

        return values;
    }

    /**
     * Resolves a field's validation message. Built-in checks run first so
     * `field.errorText` can replace the generic copy without reimplementing
     * them; `field.validate` runs last, once the value is known well-formed, so
     * it only handles cross-field and domain rules.
     * @param {Object} field — resolved field descriptor
     * @param {HTMLElement} el — the generated control
     * @param {Object} [values] — all current values, for cross-field rules
     * @returns {string|null} the message, or null when valid
     */
    _fieldError(field, el, values) {
        const value = this._readValue(el);
        const label = field.label || field.name;
        const empty =
            typeof value === "boolean" ? !value : value == null || value === "";

        if (field.required && empty)
            return field.errorText || `${label} is required`;

        if (typeof el.checkValidity === "function" && !el.checkValidity())
            return (
                field.errorText ||
                INVALID_MESSAGES[field.inputType] ||
                `${label} is invalid`
            );

        if (typeof field.validate === "function")
            return field.validate(value, values ?? this.values) || null;

        return null;
    }

    _focusControl(el) {
        const inner = this._innerControl(el);
        if (inner) inner.focus();
        else el.focus?.();
    }

    _initialValue(field) {
        if (field.value !== undefined) return field.value;
        if (CHECKED_TAGS.has((FIELD_TAGS[field.type] || "").toUpperCase()))
            return false;
        if (field.type === "slider") return field.min ?? 0;
        if (field.type === "rating") return 0;
        return "";
    }

    /**
     * The focusable element inside a control's shadow root — the node assistive
     * technology actually reads. Attributes set on the host itself never reach
     * it.
     * @param {HTMLElement} el — the control host
     * @returns {HTMLElement|null}
     */
    _innerControl(el) {
        return (
            el.input ??
            el.textarea ??
            el.shadowRoot?.querySelector(
                "input, textarea, select, [tabindex]",
            ) ??
            null
        );
    }

    _isCheckedControl(el) {
        return (
            CHECKED_TAGS.has(el.tagName) ||
            (el instanceof HTMLInputElement &&
                (el.type === "checkbox" || el.type === "radio"))
        );
    }

    _isCompactField(field) {
        const tag = FIELD_TAGS[field.type] || "y-input";
        return (
            CHECKED_TAGS.has(tag.toUpperCase()) ||
            field.type === "rating" ||
            field.type === "radio"
        );
    }

    _isShowingError(entry) {
        return "errorText" in entry.el
            ? entry.el.errorText !== ""
            : !entry.errorEl.hidden;
    }

    _onFieldInput(e) {
        const el = this._resolveEventControl(e);
        if (!el) return;

        const entry = this._controls.find((c) => c.el === el);
        const name = entry ? entry.field.name : el.getAttribute("name");
        if (!name) return;

        const value = this._readValue(el);
        if (this._valueCache[name] === value) return;
        this._valueCache[name] = value;

        const values = this.values;

        // Re-check only a field already showing an error, so typing clears the
        // message but a pristine field is not marked invalid mid-entry.
        if (entry && this._isShowingError(entry))
            this._setFieldValidity(
                entry,
                this._fieldError(entry.field, el, values),
            );

        this.dispatchEvent(
            new CustomEvent("y-change", {
                bubbles: true,
                composed: true,
                detail: { name, value, values },
            }),
        );
    }

    _onKeydown(e) {
        if (e.key !== "Enter") return;

        const origin = e.composedPath()[0];
        if (!(origin instanceof HTMLInputElement)) return;
        if (origin.type === "checkbox" || origin.type === "radio") return;

        const entry = this._controls.find((c) => c.el === e.target);
        const isTextField = entry
            ? entry.field.type === "input" || !entry.field.type
            : e.target.tagName === "Y-INPUT" || origin === e.target;
        if (!isTextField) return;

        this._form.requestSubmit();
    }

    _onSubmit(e) {
        if (this.loading || this.disabled) {
            e.preventDefault();
            return;
        }

        if (!this.novalidate) {
            const invalid = this._validate({ showUI: true });
            if (invalid.length) {
                e.preventDefault();
                this.dispatchEvent(
                    new CustomEvent("y-invalid", {
                        bubbles: true,
                        composed: true,
                        detail: { invalid },
                    }),
                );
                const first = this._controls.find(
                    (c) => c.field.name === invalid[0].name,
                );
                if (first) this._focusControl(first.el);
                return;
            }
        }

        const proceed = this.dispatchEvent(
            new CustomEvent("y-submit", {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    values: this.values,
                    formData: this._collectFormData(),
                },
            }),
        );

        if (!proceed || !this.action) e.preventDefault();
    }

    _readValue(el) {
        if (this._isCheckedControl(el)) return !!el.checked;
        return el.value;
    }

    _refreshSlottedCache() {
        this._slottedCache = new Set();

        for (const slot of this._fieldSlots) {
            for (const el of slot.assignedElements({ flatten: true })) {
                if (el.matches?.(CONTROL_SELECTOR)) this._slottedCache.add(el);
                else if (el.querySelectorAll)
                    for (const nested of el.querySelectorAll(CONTROL_SELECTOR))
                        this._slottedCache.add(nested);
            }
        }
    }

    _resolveEventControl(e) {
        for (const node of e.composedPath()) {
            if (node === this) return null;
            if (!(node instanceof Element)) continue;

            if (this._controls.some((c) => c.el === node)) return node;
            if (node.matches?.(CONTROL_SELECTOR)) {
                return this._slottedCache.has(node) ? node : null;
            }
        }
        return null;
    }

    /**
     * Shows or clears a field's validation message.
     *
     * Controls that own an `error-text` API render the message in their own
     * shadow root, where an `aria-describedby` IDREF can actually reach the
     * inner control. For the rest the message stays in this shadow root — an
     * IDREF cannot cross the boundary, so it is announced through the field's
     * live region and only `aria-invalid` is shimmed onto the inner control.
     */
    /**
     * Normalizes a descriptor into the shape the rest of the component expects,
     * without mutating the caller's object. An unrecognized `type` that names a
     * native input type is sugar for `{type: "input", inputType: <that>}`.
     * @param {Object} field — the caller's descriptor
     * @returns {Object} a resolved copy
     */
    _resolveField(field) {
        const type = field.type || "input";
        if (FIELD_TAGS[type]) return { ...field, type };

        return {
            ...field,
            type: "input",
            inputType: INPUT_TYPE_SHORTHANDS.has(type)
                ? type
                : field.inputType || "text",
        };
    }

    _setFieldValidity(entry, message) {
        const { el, errorEl } = entry;
        const delegates = "errorText" in el;

        if (delegates) {
            el.errorText = message || "";
            errorEl.textContent = "";
            errorEl.hidden = true;
        } else {
            errorEl.textContent = message || "";
            errorEl.hidden = !message;
            this._toggleAttribute(
                this._innerControl(el),
                "aria-invalid",
                !!message,
                "true",
            );
        }

        if ("invalid" in el) el.invalid = !!message;
    }

    _skeletonHeight(field) {
        if (this._isCompactField(field)) return "24px";
        return `var(--component-control-height-${this.size}, var(--sizing-${this.size}, 40px))`;
    }

    _slottedControls() {
        return [...this._slottedCache];
    }

    _syncActions() {
        const blocked = this.disabled || this.loading;
        const slot = this._actionsSlot;
        const submit = this.shadowRoot.querySelector('[part="submit-button"]');
        let reset = this.shadowRoot.querySelector('[part="reset-button"]');

        if (submit) {
            submit.textContent = this.submitText;
            submit.setAttribute("size", this.size);
            this._toggleAttribute(submit, "disabled", blocked);
            this._toggleAttribute(submit, "aria-disabled", blocked, "true");
        }

        if (this.noReset) {
            reset?.remove();
            reset = null;
        } else if (!reset) {
            reset = _el("y-button", {
                part: "reset-button",
                type: "reset",
                color: "base",
                variant: "flat",
            });
            reset.addEventListener("click", () => this._form.reset());
            submit?.after(reset);
        }

        if (reset) {
            reset.textContent = this.resetText;
            reset.setAttribute("size", this.size);
            this._toggleAttribute(reset, "disabled", blocked);
        }

        const showRing = this.loading && this.loadingMode === "ring";
        let ring = this.shadowRoot.querySelector(".loading-ring");

        if (!showRing) {
            ring?.remove();
        } else if (!ring) {
            ring = _el("y-progress", {
                class: "loading-ring",
                mode: "ring",
                size: "small",
                indeterminate: true,
                "aria-label": "Submitting",
            });
            slot?.appendChild(ring);
        }
    }

    _syncControls() {
        const showSkeleton = this.loading && this.loadingMode === "skeleton";

        for (const entry of this._controls) {
            const { field, el, skeletonEl, labelEl, labelSkeletonEl } = entry;

            this._toggleAttribute(
                el,
                "disabled",
                this.disabled || !!field.disabled,
            );
            if (SIZED_TYPES.has(field.type)) el.setAttribute("size", this.size);

            skeletonEl.hidden = !showSkeleton;
            skeletonEl.setAttribute("height", this._skeletonHeight(field));
            if (labelEl) labelEl.hidden = showSkeleton;
            if (labelSkeletonEl) labelSkeletonEl.hidden = !showSkeleton;
        }
    }

    _syncFormAttributes() {
        const form = this._form;

        this._toggleAttribute(form, "name", !!this.name, this.name);
        this._toggleAttribute(form, "action", !!this.action, this.action);
        this._toggleAttribute(form, "method", !!this.action, this.method);
        this._toggleAttribute(form, "aria-busy", this.loading, "true");
    }

    _toggleAttribute(el, name, on, value = "") {
        if (!el) return;
        if (on) el.setAttribute(name, value);
        else el.removeAttribute(name);
    }

    _validate({ showUI = true } = {}) {
        const invalid = [];
        this._refreshSlottedCache();
        const values = this.values;

        for (const entry of this._controls) {
            const { field, el } = entry;
            if (this.disabled || field.disabled || !field.name) continue;

            const message = this._fieldError(field, el, values);
            if (showUI) this._setFieldValidity(entry, message);
            if (message) invalid.push({ name: field.name, message });
        }

        for (const el of this._slottedControls()) {
            const name = el.getAttribute("name");
            if (!name || el.disabled) continue;
            if (typeof el.checkValidity === "function" && !el.checkValidity()) {
                invalid.push({ name, message: `${name} is invalid` });
                if (showUI) el.setAttribute("aria-invalid", "true");
            } else if (showUI) {
                el.removeAttribute("aria-invalid");
            }
        }

        return invalid;
    }

    _writeValue(el, value) {
        if (this._isCheckedControl(el)) el.checked = !!value;
        else el.value = value ?? "";
    }
}

if (!customElements.get("y-form")) {
    customElements.define("y-form", YumeForm);
}
