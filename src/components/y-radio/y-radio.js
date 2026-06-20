import { createElement as _el } from "../../modules/helpers.js";

export class YumeRadio extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return ["options", "name", "value", "disabled"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this._value = "";
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "value") {
            this._value = newVal;
            this._internals.setFormValue(newVal, this.name);
            this._updateChecked();
        } else if (["options", "name", "disabled"].includes(name)) {
            this.render();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the radio group is disabled. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {string} The form name of the radio group. */
    get name() { return this.getAttribute("name") || ""; }
    set name(val) { this.setAttribute("name", val); }

    /** @type {Array<{value: string, label: string}>} The radio options parsed from the "options" attribute. */
    get options() {
        try {
            return JSON.parse(this.getAttribute("options") || "[]");
        } catch {
            return [];
        }
    }
    set options(val) {
        this.setAttribute("options", Array.isArray(val) ? JSON.stringify(val) : (val ?? "[]"));
    }

    /** @type {string} The currently selected radio value. */
    get value() { return this._value; }
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

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(fieldset);

        this._bindRadioListeners();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindRadioListeners() {
        this.shadowRoot.querySelectorAll("input[type=radio]").forEach((input, i, list) => {
            input.addEventListener("keydown", (e) => this._handleKey(e, i, list));
            input.addEventListener("click", (e) => {
                this.value = e.target.value;
                this.dispatchEvent(new CustomEvent("change", {
                    detail: { value: this.value },
                    bubbles: true,
                    composed: true,
                }));
            });
        });
    }

    _buildOptions() {
        const { name, disabled, value, options } = this;

        return options.map((opt, idx) => {
            const isSelected = value === opt.value;
            const tabindex = value
                ? (isSelected ? "0" : "-1")
                : (idx === 0 ? "0" : "-1");

            const input = _el("input", {
                type: "radio",
                name,
                value: opt.value,
                disabled,
                checked: isSelected,
                tabindex,
                role: "radio",
                "aria-checked": String(isSelected),
            });

            return _el("label", { part: "label" }, [input, opt.label]);
        });
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
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
        `);
        return sheet;
    }

    _handleKey(e, index, radios) {
        const len = radios.length;
        let newIndex;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            newIndex = (index + 1) % len;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            newIndex = (index - 1 + len) % len;
        } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            this.value = radios[index].value;
            this.dispatchEvent(new CustomEvent("change", {
                detail: { value: this.value },
                bubbles: true,
                composed: true,
            }));
            return;
        } else {
            return;
        }

        radios[newIndex].focus();
    }

    _updateChecked() {
        this.shadowRoot.querySelectorAll("input[type=radio]").forEach((input) => {
            const isSelected = input.value === this.value;
            input.checked = isSelected;
            input.setAttribute("aria-checked", isSelected);
            input.setAttribute("tabindex", isSelected ? "0" : "-1");
        });
    }
}

if (!customElements.get("y-radio")) {
    customElements.define("y-radio", YumeRadio);
}
