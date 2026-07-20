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
        this._valueCache = {};
        this._form = null;

        this.attachShadow({ mode: "open" });
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

        this.render();
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

    /** @type {Object} Current field values keyed by name. Setting merges by name into the rendered controls; unknown keys are ignored. Disabled fields are excluded, per native form semantics. */
    get values() {
        return this._collectValues();
    }
    set values(val) {
        const incoming = coerceRichData(val, {});

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
            preserveValues && this._controls.length
                ? this._collectValues({ includeDisabled: true })
                : null;

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(this._buildTree());

        this._form = this.shadowRoot.querySelector("form");

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

    _bindFormListeners() {
        this._form.addEventListener("submit", (e) => this._onSubmit(e));
        this._form.addEventListener("change", (e) => this._onFieldInput(e));
        this._form.addEventListener("input", (e) => this._onFieldInput(e));
        this._form.addEventListener("keydown", (e) => this._onKeydown(e));

        const resetButton = this.shadowRoot.querySelector(
            '[part="reset-button"]',
        );
        resetButton?.addEventListener("click", () => this.reset());

        for (const name of ["header", "footer"]) {
            const slot = this.shadowRoot.querySelector(`slot[name="${name}"]`);
            slot?.addEventListener("slotchange", () =>
                hideEmptySlotContainers(this.shadowRoot, {
                    header: ".header",
                    footer: ".footer",
                }),
            );
        }
    }

    _buildActions() {
        const blocked = this.disabled || this.loading;

        const submit = _el(
            "y-button",
            {
                part: "submit-button",
                type: "submit",
                color: "primary",
                variant: "filled",
                size: this.size,
                disabled: blocked || null,
                "aria-disabled": blocked ? "true" : null,
            },
            [this.submitText],
        );

        const reset = this.noReset
            ? null
            : _el(
                  "y-button",
                  {
                      part: "reset-button",
                      type: "reset",
                      color: "base",
                      variant: "flat",
                      size: this.size,
                      disabled: blocked || null,
                  },
                  [this.resetText],
              );

        const ring =
            this.loading && this.loadingMode === "ring"
                ? _el("y-progress", {
                      class: "loading-ring",
                      mode: "ring",
                      size: "small",
                      indeterminate: true,
                      "aria-label": "Submitting",
                  })
                : null;

        const slot = _el("slot", { name: "actions" }, [submit, reset, ring]);
        return _el("div", { class: "actions", part: "actions" }, [slot]);
    }

    _buildControl(field) {
        const tag = FIELD_TAGS[field.type] || "y-input";
        const isChecked = CHECKED_TAGS.has(tag.toUpperCase());

        const attrs = {
            name: field.name,
            disabled: this.disabled || field.disabled || null,
            "aria-label": field.label || null,
        };
        if (tag === "y-input") attrs.type = field.inputType || "text";
        if (SIZED_TYPES.has(field.type)) attrs.size = this.size;
        if (PLACEHOLDER_TYPES.has(field.type) && field.placeholder != null)
            attrs.placeholder = field.placeholder;
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

    _buildField(field, index) {
        if (field.slot) {
            const outlet = _el("slot", { name: field.slot });
            this._fieldSlots.push(outlet);
            return _el("div", { class: "field field--slot" }, [outlet]);
        }

        const control = this._buildControl(field);
        const errorId = `field-error-${index}`;
        const error = _el("div", {
            class: "field-error",
            id: errorId,
            "aria-live": "polite",
            hidden: true,
        });

        const showSkeleton = this.loading && this.loadingMode === "skeleton";

        const body = [control];
        if (field.help)
            body.push(_el("div", { class: "field-help" }, [field.help]));
        body.push(error);
        if (showSkeleton) body.push(this._buildSkeleton(field));

        const children = [];
        if (field.label && showSkeleton) {
            children.push(this._buildLabelSkeleton(field));
        } else if (field.label) {
            const label = _el("span", { class: "field-label" }, [
                field.label,
                field.required
                    ? _el("span", { class: "required-mark", "aria-hidden": "true" }, ["*"])
                    : null,
            ]);
            label.addEventListener("click", () => this._focusControl(control));
            children.push(label);
        }
        children.push(_el("div", { class: "field-body" }, body));

        this._controls.push({ field, el: control, errorEl: error, errorId });
        return _el("div", { class: "field" }, children);
    }

    _buildLabelSkeleton(field) {
        const chars = Math.min(Math.max(field.label.length, 4), 16);

        return _el("y-skeleton", {
            class: "label-skeleton",
            variant: "text",
            width: `${chars}ch`,
        });
    }

    _buildSkeleton(field) {
        const tag = FIELD_TAGS[field.type] || "y-input";
        const compact =
            CHECKED_TAGS.has(tag.toUpperCase()) ||
            field.type === "rating" ||
            field.type === "radio";

        const height = compact
            ? "24px"
            : `var(--component-control-height-${this.size}, var(--sizing-${this.size}, 40px))`;
        const width = compact ? "40%" : "";

        return _el("y-skeleton", {
            class: "field-skeleton",
            variant: "rect",
            height,
            width: width || null,
        });
    }

    _buildStyleSheet() {
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

            :host([loading][loading-mode="skeleton"]) .field-body > *:not(.field-skeleton) {
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
        return sheet;
    }

    _buildTree() {
        this._controls = [];
        this._fieldSlots = [];

        const header = _el("div", { class: "header", part: "header", id: "form-header" }, [
            _el("slot", { name: "header" }),
        ]);

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

    _fieldError(field, el) {
        const value = this._readValue(el);
        const label = field.label || field.name;
        const empty =
            typeof value === "boolean" ? !value : value == null || value === "";

        if (field.required && empty) return `${label} is required`;
        if (typeof el.checkValidity === "function" && !el.checkValidity())
            return `${label} is invalid`;
        return null;
    }

    _focusControl(el) {
        const inner = el.shadowRoot?.querySelector(
            "input, textarea, select, [tabindex]",
        );
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

    _isCheckedControl(el) {
        return (
            CHECKED_TAGS.has(el.tagName) ||
            (el instanceof HTMLInputElement &&
                (el.type === "checkbox" || el.type === "radio"))
        );
    }

    _onFieldInput(e) {
        const el = e.target;
        const entry = this._controls.find((c) => c.el === el);
        const isSlotted = !entry && this._slottedControls().includes(el);
        const name = entry
            ? entry.field.name
            : isSlotted
              ? el.getAttribute("name")
              : null;
        if (!name) return;

        const value = this._readValue(el);
        if (this._valueCache[name] === value) return;
        this._valueCache[name] = value;

        if (entry && !entry.errorEl.hidden)
            this._setFieldValidity(entry, this._fieldError(entry.field, el));

        this.dispatchEvent(
            new CustomEvent("y-change", {
                bubbles: true,
                composed: true,
                detail: { name, value, values: this.values },
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
            : e.target.tagName === "Y-INPUT" ||
              origin === e.target;
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

    _setFieldValidity(entry, message) {
        const { el, errorEl, errorId } = entry;

        errorEl.textContent = message || "";
        errorEl.hidden = !message;

        if (message) {
            el.setAttribute("aria-invalid", "true");
            el.setAttribute("aria-describedby", errorId);
            if ("invalid" in el) el.invalid = true;
        } else {
            el.removeAttribute("aria-invalid");
            el.removeAttribute("aria-describedby");
            if ("invalid" in el) el.invalid = false;
        }
    }

    _slottedControls() {
        const out = [];

        for (const slot of this._fieldSlots) {
            for (const el of slot.assignedElements({ flatten: true })) {
                if (el.matches?.(CONTROL_SELECTOR)) out.push(el);
                else if (el.querySelectorAll)
                    out.push(...el.querySelectorAll(CONTROL_SELECTOR));
            }
        }

        return out;
    }

    _validate({ showUI = true } = {}) {
        const invalid = [];

        for (const entry of this._controls) {
            const { field, el } = entry;
            if (this.disabled || field.disabled || !field.name) continue;

            const message = this._fieldError(field, el);
            if (showUI) this._setFieldValidity(entry, message);
            if (message) invalid.push({ name: field.name, message });
        }

        for (const el of this._slottedControls()) {
            const name = el.getAttribute("name");
            if (!name || el.disabled) continue;
            if (
                typeof el.checkValidity === "function" &&
                !el.checkValidity()
            ) {
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
