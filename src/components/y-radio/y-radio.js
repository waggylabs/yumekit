import {
    applyControlError,
    coerceRichData,
    createElement as _el,
    forwardControlAttributes,
    upgradeProperties,
} from "../../modules/helpers.js";

/**
 * Naming attributes moved from the host onto the inner `fieldset[role=radiogroup]`.
 * The shared default set is narrowed because `autocomplete` means nothing on a
 * group, and `required` on a fieldset is not a native constraint.
 */
const RADIO_FORWARDED_ATTRIBUTES = ["aria-label", "aria-labelledby"];

export class YumeRadio extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "options",
            "name",
            "value",
            "disabled",
            "invalid",
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
        this._value = "";
        this._options = null;
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "value") {
            this._value = newVal;
            this._internals.setFormValue(newVal, this.name);
            this._updateChecked();
        } else if (name === "invalid") {
            this._updateValidationState();
        } else if (name === "error-text") {
            this._updateErrorText();
        } else if (name === "aria-label" || name === "aria-labelledby") {
            forwardControlAttributes(
                this,
                this._fieldset,
                RADIO_FORWARDED_ATTRIBUTES,
            );
        } else if (["options", "name", "disabled"].includes(name)) {
            if (name === "options") this._options = coerceRichData(newVal);
            this.render();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the radio group is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {string} Validation message shown beneath the group. A non-empty value also puts the group in the invalid state and becomes its accessible description. */
    get errorText() {
        return this.getAttribute("error-text") || "";
    }
    set errorText(val) {
        if (val == null || val === "") this.removeAttribute("error-text");
        else this.setAttribute("error-text", val);
    }

    /** @type {boolean} Whether the group is in an invalid state. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {string} The form name of the radio group. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {Array<{value: string, label: string, disabled?: boolean}>} The radio options. An option with `disabled: true` renders unselectable and is skipped by arrow-key navigation. Rich data held as a property (identity preserved, not serialized); the `options` attribute seeds an initial value but is not kept in sync after an imperative set. */
    get options() {
        return Array.isArray(this._options) ? this._options : [];
    }
    set options(val) {
        this._options = coerceRichData(val);
        this.render();
    }

    /** @type {string} The currently selected radio value. */
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
        this.setAttribute("value", val);
        this._internals.setFormValue(val, this.name);
        this._updateChecked();
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const fieldset = _el(
            "fieldset",
            { role: "radiogroup", part: "radio" },
            this._buildOptions(),
        );

        // The group, not any single input, is what carries the validation
        // message — so `applyControlError` describes the fieldset.
        const error = _el("div", {
            class: "error-text",
            part: "error-text",
            id: "error-text",
            "aria-live": "polite",
            hidden: true,
        });

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(fieldset, error);

        this._fieldset = fieldset;
        this._errorElement = error;

        forwardControlAttributes(this, fieldset, RADIO_FORWARDED_ATTRIBUTES);
        this._bindRadioListeners();
        this._updateErrorText();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindRadioListeners() {
        this.shadowRoot
            .querySelectorAll("input[type=radio]")
            .forEach((input, i, list) => {
                input.addEventListener("keydown", (e) =>
                    this._handleKey(e, i, list),
                );
                input.addEventListener("click", (e) => {
                    if (e.target.disabled) return;

                    this.value = e.target.value;
                    this.dispatchEvent(
                        new CustomEvent("change", {
                            detail: { value: this.value },
                            bubbles: true,
                            composed: true,
                        }),
                    );
                });
            });
    }

    _buildOptions() {
        const { name, value, options } = this;
        const selectedIndex = options.findIndex((opt) => opt.value === value);
        const entryIndex =
            selectedIndex !== -1 &&
            !this._isOptionDisabled(options[selectedIndex])
                ? selectedIndex
                : options.findIndex((opt) => !this._isOptionDisabled(opt));

        return options.map((opt, idx) => {
            const isSelected = value === opt.value;

            const input = _el("input", {
                type: "radio",
                name,
                value: opt.value,
                disabled: this._isOptionDisabled(opt),
                checked: isSelected,
                tabindex: idx === entryIndex ? "0" : "-1",
                role: "radio",
                "aria-checked": String(isSelected),
            });

            return _el(
                "label",
                {
                    part: "label",
                    class: this._isOptionDisabled(opt) ? "is-disabled" : null,
                },
                [input, opt.label],
            );
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
            }
            fieldset {
                border: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: var(--spacing-x-small, 8px);
            }
            label {
                display: flex;
                align-items: center;
                gap: 0.5em;
                cursor: pointer;
            }
            input[type="radio"] {
                appearance: none;
                width: var(--component-radio-size, 16px);
                height: var(--component-radio-size, 16px);
                border: 2px solid var(--component-radio-color);
                border-width: var(--component-inputs-border-width, 2px);
                border-radius: 50%;
                position: relative;
                outline: none;
                cursor: pointer;
                background: var(--component-radio-background, transparent);
                transition: background-color 0.2s ease, border-color 0.2s ease;
            }
            input[type="radio"]:checked {
                background: var(--component-radio-checked-background, var(--component-radio-background, transparent));
                border-color: var(--component-radio-checked-border-color, var(--component-radio-color));
            }
            input[type="radio"]:checked::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: var(--component-radio-dot-size, 8px);
                height: var(--component-radio-dot-size, 8px);
                background: var(--component-radio-checked-dot-color, var(--component-radio-accent));
                border-radius: 50%;
                transform: translate(-50%, -50%);
            }
            input[type="radio"]:focus-visible {
                outline: 2px solid var(--component-radio-accent);
                outline-offset: 2px;
            }
            input[disabled] {
                opacity: 0.5;
                cursor: not-allowed;
            }
            label.is-disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            fieldset.is-invalid input[type="radio"] {
                border-color: var(--component-radio-error-color, var(--error-content));
            }

            .error-text {
                margin-top: var(--spacing-2x-small, 4px);
                font-size: 0.8em;
                color: var(--component-radio-error-color, var(--error-content));
            }

            .error-text[hidden] {
                display: none;
            }
        `);
        return sheet;
    }

    _handleKey(e, index, radios) {
        let step;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            step = 1;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            step = -1;
        } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (radios[index].disabled) return;

            this.value = radios[index].value;
            this.dispatchEvent(
                new CustomEvent("change", {
                    detail: { value: this.value },
                    bubbles: true,
                    composed: true,
                }),
            );
            return;
        } else {
            return;
        }

        e.preventDefault();

        const next = this._nextEnabledIndex(index, step, radios);
        if (next !== -1) radios[next].focus();
    }

    _isOptionDisabled(opt) {
        return this.disabled || opt?.disabled === true;
    }

    /**
     * Walk the group from `index` in `step` direction, wrapping, and return the
     * first enabled option. Returns -1 when no other option can take focus,
     * which leaves focus where it is rather than moving it nowhere.
     */
    _nextEnabledIndex(index, step, radios) {
        const len = radios.length;

        for (let i = 1; i <= len; i++) {
            const candidate = (((index + step * i) % len) + len) % len;
            if (!radios[candidate].disabled) return candidate;
        }

        return -1;
    }

    _updateChecked() {
        const radios = [
            ...this.shadowRoot.querySelectorAll("input[type=radio]"),
        ];
        const selected = radios.find((input) => input.value === this.value);
        const entry =
            selected && !selected.disabled
                ? selected
                : radios.find((input) => !input.disabled);

        radios.forEach((input) => {
            const isSelected = input.value === this.value;
            input.checked = isSelected;
            input.setAttribute("aria-checked", isSelected);
            input.setAttribute("tabindex", input === entry ? "0" : "-1");
        });
    }

    _updateErrorText() {
        applyControlError(this._fieldset, this._errorElement, this.errorText);
        this._updateValidationState();
    }

    _updateValidationState() {
        const isInvalid = this.hasAttribute("invalid") || this.errorText !== "";
        this._fieldset?.classList.toggle("is-invalid", isInvalid);
    }
}

if (!customElements.get("y-radio")) {
    customElements.define("y-radio", YumeRadio);
}
