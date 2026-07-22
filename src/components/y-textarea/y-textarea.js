import {
    applyControlError,
    createElement as _el,
    forwardControlAttributes,
    manageLabelVisibility,
    upgradeProperties,
} from "../../modules/helpers.js";

export class YumeTextarea extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "size",
            "rows",
            "value",
            "label-position",
            "disabled",
            "invalid",
            "name",
            "placeholder",
            "variant",
            "required",
            "autocomplete",
            "error-text",
            "aria-label",
            "aria-labelledby",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        this._internals.setFormValue(this.value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            if (this.textarea) this.textarea.value = newValue;
            if (this._internals) {
                this._internals.setFormValue(
                    newValue,
                    this.getAttribute("name"),
                );
            }
            return;
        }

        if (name === "name") {
            this._internals.setFormValue(this.value, newValue);
            return;
        }

        if (name === "invalid") {
            this._updateValidationState();
            return;
        }

        if (name === "error-text") {
            this._updateErrorText();
            return;
        }

        // Re-rendering here would replace the <textarea>, dropping focus, caret
        // position, and IME composition — exactly what a form does on submit.
        if (name === "disabled") {
            if (this.textarea) this.textarea.disabled = this.disabled;
            this._updateValidationState();
            return;
        }

        if (
            name === "required" ||
            name === "autocomplete" ||
            name === "aria-label" ||
            name === "aria-labelledby"
        ) {
            forwardControlAttributes(this, this.textarea);
            this._updateValidationState();
            return;
        }

        if (name === "placeholder") {
            if (this.textarea) {
                if (newValue != null) {
                    this.textarea.setAttribute("placeholder", newValue);
                } else {
                    this.textarea.removeAttribute("placeholder");
                }
            }
            return;
        }

        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the textarea is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /**
     * @type {string} Validation message shown below the field. A non-empty
     * value also puts the textarea in the invalid state and becomes its
     * accessible description.
     */
    get errorText() {
        return this.getAttribute("error-text") || "";
    }
    set errorText(val) {
        if (val == null || val === "") this.removeAttribute("error-text");
        else this.setAttribute("error-text", val);
    }

    /** @type {boolean} Whether the textarea is in an invalid state. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {string} Label position: "top" | "bottom" (default "top"). */
    get labelPosition() {
        return this.getAttribute("label-position") || "top";
    }
    set labelPosition(val) {
        this.setAttribute("label-position", val);
    }

    /** @type {string} The form field name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {string} Hint text shown when the textarea is empty. */
    get placeholder() {
        return this.getAttribute("placeholder") || "";
    }
    set placeholder(val) {
        if (val == null || val === "") this.removeAttribute("placeholder");
        else this.setAttribute("placeholder", val);
    }

    /** @type {number} Number of visible text rows (default 3). */
    get rows() {
        return parseInt(this.getAttribute("rows") || "3", 10);
    }
    set rows(val) {
        this.setAttribute("rows", String(val));
    }

    /** @type {string} Textarea size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /**
     * @type {"default"|"underline"} Field style. `"default"` is a full border;
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

    /** @type {string} The current textarea value. */
    get value() {
        return this.textarea?.value || "";
    }
    set value(val) {
        if (this.textarea) this.textarea.value = val;
        this.setAttribute("value", val);
        this._internals.setFormValue(val, this.getAttribute("name"));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    checkValidity() {
        return this.textarea?.checkValidity?.() ?? true;
    }

    render() {
        const size = this.getAttribute("size") || "medium";
        const rows = this.getAttribute("rows") || "3";
        const value = this.getAttribute("value") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        const isDisabled = this.hasAttribute("disabled");
        const isLabelTop = labelPosition === "top";

        const paddingVar = this._getPaddingVar(size);

        this.shadowRoot.adoptedStyleSheets = [
            this._buildStyleSheet(paddingVar),
        ];
        this.shadowRoot.replaceChildren(
            this._buildTree(rows, isLabelTop, isDisabled),
        );

        this.textarea = this.shadowRoot.querySelector("textarea");
        this.inputContainer = this.shadowRoot.querySelector(".input-container");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");
        this.errorElement = this.shadowRoot.querySelector(".error-text");

        manageLabelVisibility(this.labelWrapper);
        forwardControlAttributes(this, this.textarea);
        this._updateErrorText();

        // <textarea> value must be set via property, not HTML attribute
        this.textarea.value = value;

        this._bindTextareaListeners();
        this._updateValidationState();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindTextareaListeners() {
        this.inputContainer.addEventListener("mousedown", (e) => {
            if (e.target !== this.textarea) {
                e.preventDefault();
                this.textarea.focus();
            }
        });

        this.textarea.addEventListener("input", (e) => {
            this.setAttribute("value", e.target.value);
            this._internals.setFormValue(
                e.target.value,
                this.getAttribute("name"),
            );
            this.dispatchEvent(
                new CustomEvent("input", {
                    detail: { value: e.target.value },
                    bubbles: true,
                    composed: true,
                }),
            );
            this._updateValidationState();
        });
    }

    _buildTree(rows, isLabelTop, isDisabled) {
        const buildLabelSlot = () =>
            _el("div", { class: "label-wrapper" }, [
                _el("slot", { name: "label" }),
            ]);

        const textarea = _el("textarea", {
            part: "textarea",
            rows,
            placeholder: this.getAttribute("placeholder"),
            disabled: isDisabled || null,
        });

        const container = _el("div", { class: "input-container" }, [textarea]);

        const error = _el("div", {
            class: "error-text",
            part: "error-text",
            id: "error-text",
            "aria-live": "polite",
            hidden: true,
        });

        const children = [];
        if (isLabelTop) children.push(buildLabelSlot());
        children.push(container);
        if (!isLabelTop) children.push(buildLabelSlot());
        children.push(error);

        return _el("div", { class: "input-wrapper" }, children);
    }

    _buildStyleSheet(paddingVar) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-input-color);
                opacity: 1;
                pointer-events: auto;
            }

            /* Expressed as a selector, not interpolated, so toggling disabled
               never has to rebuild the shadow tree. */
            :host([disabled]) {
                opacity: 0.75;
                pointer-events: none;
            }

            .input-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .label-wrapper {
                display: none;
            }

            .input-container {
                display: flex;
                align-items: flex-start;
                background: var(--component-input-background);
                border: 1px solid var(--component-input-border-color);
                border-width: var(--component-inputs-border-width, 1px);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: var(${paddingVar});
                box-sizing: border-box;
                transition: border-color 0.2s ease-in-out;
            }

            :host([disabled]) .input-container {
                background: var(--component-input-background-disabled);
            }

            /* Underline variant: bottom border only, square bottom corners. */
            :host([variant="underline"]) .input-container {
                border-style: none;
                border-bottom-style: solid;
                border-radius: var(--component-inputs-border-radius-outer) var(--component-inputs-border-radius-outer) 0 0;
            }

            .input-container.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            .input-container.is-invalid textarea {
                color: var(--component-input-error-color);
            }

            .input-container.is-invalid:hover {
                border-color: var(--component-input-error-color);
            }

            .input-container.is-invalid:focus-within {
                border-color: var(--component-input-error-color);
            }

            .input-container.is-invalid:focus-within textarea {
                color: var(--component-input-color);
            }

            textarea {
                all: unset;
                flex: 1;
                width: 100%;
                font-family: inherit;
                font-size: 1em;
                color: inherit;
                line-height: 1.5;
                resize: vertical;
                overflow-y: auto;
                box-sizing: border-box;
            }

            textarea::placeholder {
                color: var(--component-input-placeholder-color);
                opacity: 1;
            }

            .input-container:hover {
                border-color: var(--component-input-color);
                transition: border-color 0.2s ease-in-out;
            }

            .input-container:focus-within {
                border-color: var(--component-input-accent);
            }

            .label-wrapper.is-invalid ::slotted([slot="label"]) {
                color: var(--component-input-error-color);
            }

            .error-text {
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
        `);
        return sheet;
    }

    _getPaddingVar(size) {
        const map = {
            small: "--component-inputs-padding-small",
            medium: "--component-inputs-padding-medium",
            large: "--component-inputs-padding-large",
        };
        return map[size] || map.medium;
    }

    _updateErrorText() {
        applyControlError(this.textarea, this.errorElement, this.errorText);
        this._updateValidationState();
    }

    _updateValidationState() {
        // A pristine empty `required` field is not styled as an error — that
        // only lands once something asks for it (a form submit setting
        // `error-text`/`invalid`). Format failures still show immediately.
        const validity = this.textarea?.validity;
        const isInvalid =
            this.hasAttribute("invalid") ||
            this.errorText !== "" ||
            (!!validity && !validity.valid && !validity.valueMissing);
        this.inputContainer?.classList.toggle("is-invalid", isInvalid);
        this.labelWrapper?.classList.toggle("is-invalid", isInvalid);
    }
}

if (!customElements.get("y-textarea")) {
    customElements.define("y-textarea", YumeTextarea);
}
