import {
    manageLabelVisibility,
    createElement as _el,
} from "../../modules/helpers.js";

export class YumeInput extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "type",
            "size",
            "value",
            "label-position",
            "disabled",
            "invalid",
            "name",
            "min",
            "max",
            "step",
            "variant",
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
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        this._internals.setFormValue(this.value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            if (this.input) this.input.value = newValue;
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

        if (name === "min" || name === "max" || name === "step") {
            if (this.input) {
                if (newValue != null) {
                    this.input.setAttribute(name, newValue);
                } else {
                    this.input.removeAttribute(name);
                }
            }
            return;
        }

        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the input is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {boolean} Whether the input is in an invalid state. */
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

    /** @type {string} Input size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /**
     * @type {"default"|"underline"} Field style. `"default"` is a full border;
     * `"underline"` shows only a bottom border with square bottom corners
     * (like the Material/Carbon text-field style).
     */
    get variant() {
        return this.getAttribute("variant") === "underline"
            ? "underline"
            : "default";
    }
    set variant(val) {
        this.setAttribute("variant", val === "underline" ? "underline" : "default");
    }

    /** @type {string} Input type (default "text"). */
    get type() {
        return this.getAttribute("type") || "text";
    }
    set type(val) {
        this.setAttribute("type", val);
    }

    /** @type {string} The current input value. */
    get value() {
        return this.input?.value || "";
    }
    set value(val) {
        if (this.input) this.input.value = val;
        this.setAttribute("value", val);
        this._internals.setFormValue(val, this.getAttribute("name"));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Checks the validity of the underlying input element.
     * @returns {boolean} Whether the input is valid.
     */
    checkValidity() {
        return this.input?.checkValidity?.() ?? true;
    }

    render() {
        const type = this.getAttribute("type") || "text";
        const size = this.getAttribute("size") || "medium";
        const value = this.getAttribute("value") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        const isDisabled = this.hasAttribute("disabled");
        const isLabelTop = labelPosition === "top";

        const paddingVar = this._getPaddingVar(size);
        const minHeightVar = this._getMinHeightVar(size);

        this.shadowRoot.adoptedStyleSheets = [
            this._buildStyleSheet(isDisabled, paddingVar, minHeightVar),
        ];
        this.shadowRoot.replaceChildren(
            this._buildTree(type, value, isLabelTop, isDisabled),
        );

        this.input = this.shadowRoot.querySelector("input");
        this.inputContainer = this.shadowRoot.querySelector(".input-container");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");

        manageLabelVisibility(this.labelWrapper);

        if (!isDisabled) {
            this._bindInputListeners();
            this._updateValidationState();
        }
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindInputListeners() {
        this.input.addEventListener("input", (e) => {
            this.setAttribute("value", e.target.value);
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

    _buildTree(type, value, isLabelTop, isDisabled) {
        const buildLabelSlot = () =>
            _el("div", { class: "label-wrapper" }, [
                _el("slot", { name: "label" }),
            ]);

        const input = _el("input", {
            part: "input",
            type,
            value,
            disabled: isDisabled || null,
        });
        const min = this.getAttribute("min");
        const max = this.getAttribute("max");
        const step = this.getAttribute("step");
        if (min != null) input.setAttribute("min", min);
        if (max != null) input.setAttribute("max", max);
        if (step != null) input.setAttribute("step", step);

        const container = _el("div", { class: "input-container" }, [
            _el("slot", { name: "left-icon" }),
            input,
            _el("slot", { name: "right-icon" }),
        ]);

        const children = [];
        if (isLabelTop) children.push(buildLabelSlot());
        children.push(container);
        if (!isLabelTop) children.push(buildLabelSlot());

        return _el("div", { class: "input-wrapper" }, children);
    }

    _buildStyleSheet(isDisabled, paddingVar, minHeightVar) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-input-color);
                opacity: ${isDisabled ? "0.75" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .input-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .label-wrapper {
                display: none;
                margin-bottom: var(--spacing-2x-small, 4px);
            }

            .input-container {
                flex: 1;
                display: flex;
                align-items: center;
                gap: var(--spacing-x-small);
                background: ${isDisabled ? "var(--component-input-background-disabled)" : "var(--component-input-background)"};
                border: var(--component-inputs-border-width) solid var(--component-input-border-color);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: var(${paddingVar});
                min-height: ${minHeightVar};
                box-sizing: border-box;
                transition: border-color 0.2s ease-in-out;
            }

            /* Underline variant: bottom border only, square bottom corners.
               Only border-style/radius are overridden so the existing
               hover/focus/invalid border-color rules still color the underline. */
            :host([variant="underline"]) .input-container {
                border-style: none;
                border-bottom-style: solid;
                border-radius: var(--component-inputs-border-radius-outer) var(--component-inputs-border-radius-outer) 0 0;
            }

            .input-container.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            .input-container.is-invalid input {
                color: var(--component-input-error-color);
            }

            .input-container.is-invalid:hover {
                border-color: var(--component-input-error-color);
            }

            .input-container.is-invalid:focus-within {
                border-color: var(--component-input-error-color);
            }

            .input-container.is-invalid:focus-within input {
                color: var(--component-input-color);
            }

            input {
                all: unset;
                flex: 1;
                font-family: inherit;
                font-size: 1em;
                color: inherit;
                min-width: 0;
                min-height: 20px;
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

            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-input-label-color);
            }

            ::slotted([slot="left-icon"]),
            ::slotted([slot="right-icon"]) {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--component-input-icon-color);
            }
        `);
        return sheet;
    }

    _getMinHeightVar(size) {
        const map = {
            small: "var(--sizing-small, 32px)",
            medium: "var(--sizing-medium, 40px)",
            large: "var(--sizing-large, 56px)",
        };
        return map[size] || map.medium;
    }

    _getPaddingVar(size) {
        const map = {
            small: "--component-inputs-padding-small",
            medium: "--component-inputs-padding-medium",
            large: "--component-inputs-padding-large",
        };
        return map[size] || map.medium;
    }

    _updateValidationState() {
        const isManuallyInvalid = this.hasAttribute("invalid");
        const isAutomaticallyInvalid = this.input && !this.checkValidity();
        const isInvalid = isManuallyInvalid || isAutomaticallyInvalid;

        this.inputContainer?.classList.toggle("is-invalid", isInvalid);
        this.labelWrapper?.classList.toggle("is-invalid", isInvalid);
    }
}

if (!customElements.get("y-input")) {
    customElements.define("y-input", YumeInput);
}
