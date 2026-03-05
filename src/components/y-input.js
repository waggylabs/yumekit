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
        ];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) {
            this.setAttribute("size", "medium");
        }
        if (!this.hasAttribute("label-position")) {
            this.setAttribute("label-position", "top");
        }
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
            this.updateValidationState();
            return;
        }

        this.render();
    }

    get value() {
        return this.input?.value || "";
    }

    set value(val) {
        if (this.input) this.input.value = val;
        else this.setAttribute("value", val);
        this._internals.setFormValue(val, this.getAttribute("name"));
    }

    checkValidity() {
        return this.input?.checkValidity?.() ?? true;
    }

    updateValidationState() {
        const isManuallyInvalid = this.hasAttribute("invalid");
        const isAutomaticallyInvalid = this.input && !this.checkValidity();
        const isInvalid = isManuallyInvalid || isAutomaticallyInvalid;

        this.inputContainer?.classList.toggle("is-invalid", isInvalid);
        this.labelWrapper?.classList.toggle("is-invalid", isInvalid);
    }

    render() {
        const type = this.getAttribute("type") || "text";
        const size = this.getAttribute("size") || "medium";
        const value = this.getAttribute("value") || "";
        const labelPosition = this.getAttribute("label-position") || "top";
        const isDisabled = this.hasAttribute("disabled");
        const isLabelTop = labelPosition === "top";

        const paddingVar = {
            small: "--component-inputs-padding-small",
            medium: "--component-inputs-padding-medium",
            large: "--component-inputs-padding-large",
        }[size];

        const minHeightVar =
            {
                small: "var(--sizing-small, 32px)",
                medium: "var(--sizing-medium, 40px)",
                large: "var(--sizing-large, 56px)",
            }[size] || "var(--sizing-medium, 40px)";

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
                gap: var(--spacing-2x-small, 4px);
            }

            .input-container {
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

        this.shadowRoot.adoptedStyleSheets = [sheet];

        this.shadowRoot.innerHTML = `
            <div class="input-wrapper">
                ${isLabelTop ? '<div class="label-wrapper"><slot name="label"></slot></div>' : ""}
                <div class="input-container">
                    <slot name="left-icon"></slot>
                    <input part="input" type="${type}" value="${value}" ${isDisabled ? "disabled" : ""} />
                    <slot name="right-icon"></slot>
                </div>
                ${!isLabelTop ? '<div class="label-wrapper"><slot name="label"></slot></div>' : ""}
            </div>
        `;

        this.input = this.shadowRoot.querySelector("input");
        this.inputContainer = this.shadowRoot.querySelector(".input-container");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");

        if (!isDisabled) {
            this.input.addEventListener("input", (e) => {
                this.setAttribute("value", e.target.value);
                this.dispatchEvent(
                    new CustomEvent("input", {
                        detail: { value: e.target.value },
                        bubbles: true,
                        composed: true,
                    }),
                );
                this.updateValidationState();
            });

            this.updateValidationState();
        }
    }
}

if (!customElements.get("y-input")) {
    customElements.define("y-input", YumeInput);
}
