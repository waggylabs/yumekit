import {
    checkmark,
    indeterminate as indeterminateSvg,
} from "../icons/index.js";

export class YumeCheckbox extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "checked",
            "disabled",
            "indeterminate",
            "label-position",
            "name",
            "value",
        ];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("label-position")) {
            this.setAttribute("label-position", "right");
        }

        this._internals.setFormValue(this.checked ? this.value : null);
    }

    attributeChangedCallback(name) {
        if (name === "checked" || name === "value") {
            this._internals.setFormValue(this.checked ? this.value : null);
        }

        if (name === "indeterminate") {
            this.updateIcon();
        }

        if (name === "label-position") {
            this.render();
        }

        this.updateState();
    }

    get checked() {
        return this.hasAttribute("checked");
    }

    set checked(val) {
        if (val) this.setAttribute("checked", "");
        else this.removeAttribute("checked");
    }

    get disabled() {
        return this.hasAttribute("disabled");
    }

    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    get indeterminate() {
        return this.hasAttribute("indeterminate");
    }

    set indeterminate(val) {
        if (val) this.setAttribute("indeterminate", "");
        else this.removeAttribute("indeterminate");
    }

    get value() {
        return this.getAttribute("value") || "on";
    }

    set value(val) {
        this.setAttribute("value", val);
    }

    get name() {
        return this.getAttribute("name");
    }

    toggle() {
        if (this.disabled) return;
        if (this.indeterminate) {
            this.indeterminate = false;
            this.checked = true;
        } else {
            this.checked = !this.checked;
        }

        this.dispatchEvent(
            new Event("change", { bubbles: true, composed: true }),
        );
    }

    updateIcon() {
        const icon = this.shadowRoot.querySelector(".icon");
        if (!icon) return;

        if (this.indeterminate) {
            icon.innerHTML = indeterminateSvg;
        } else if (this.checked) {
            icon.innerHTML = checkmark;
        } else {
            icon.innerHTML = "";
        }
    }

    updateState() {
        const box = this.shadowRoot.querySelector(".checkbox");
        box.setAttribute(
            "aria-checked",
            this.indeterminate ? "mixed" : this.checked ? "true" : "false",
        );
        this.updateIcon();
    }

    render() {
        const labelPosition = this.getAttribute("label-position") || "right";
        const isDisabled = this.disabled;

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: inline-flex;
                align-items: center;
                line-height: 1;
                vertical-align: middle;
                font-family: var(--font-family-body);
                cursor: ${isDisabled ? "not-allowed" : "pointer"};
                opacity: ${isDisabled ? "0.6" : "1"};
            }

            .wrapper {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-x-small, 6px);
                line-height: 1;
                flex-direction: ${
                    labelPosition === "top"
                        ? "column"
                        : labelPosition === "bottom"
                          ? "column-reverse"
                          : labelPosition === "left"
                            ? "row-reverse"
                            : "row"
                };
            }

            .checkbox {
                width: var(--component-checkbox-size, 20px);
                height: var(--component-checkbox-size, 20px);
                border: var(--component-inputs-border-width, 2px) solid var(--component-checkbox-border-color);
                border-radius: var(--component-inputs-border-radius-outer, 4px);
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--component-checkbox-background);
                box-sizing: border-box;
                transition: border-color 0.2s ease;
                line-height: 0;
            }

            :host([disabled]) .checkbox {
                opacity: 0.5;
                border-color: var(--component-checkbox-border-color);
                background: var(--component-checkbox-disabled-background, var(--component-checkbox-background));
                cursor: not-allowed;
            }

            :host([disabled]) .checkbox:hover {
                border-color: var(--component-checkbox-border-color);
            }

            :host([disabled]) [part="label"] {
                opacity: 0.5;
            }

            .checkbox:hover {
                border-color: var(--component-checkbox-accent);
            }

            .checkbox svg {
                width: var(--component-checkbox-icon-size, 16px);
                height: var(--component-checkbox-icon-size, 16px);
                stroke: var(--component-checkbox-accent);
                display: block;
            }

            [part="label"] {
                display: inline-flex;
                align-items: center;
                font-size: 0.9em;
                line-height: 1;
                color: var(--component-checkbox-color);
            }

            .icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
                line-height: 0;
            }

        `);

        this.shadowRoot.adoptedStyleSheets = [sheet];

        this.shadowRoot.innerHTML = `
            <div class="wrapper">
                <div class="checkbox" role="checkbox" tabindex="0">
                    <span class="icon"></span>
                </div>
                <label part="label">
                    <slot></slot>
                </label>
            </div>
        `;

        this.shadowRoot
            .querySelector(".checkbox")
            .addEventListener("click", () => this.toggle());
        this.shadowRoot
            .querySelector(".checkbox")
            .addEventListener("keydown", (e) => {
                if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    this.toggle();
                }
            });

        this.updateState();
    }
}

if (!customElements.get("y-checkbox")) {
    customElements.define("y-checkbox", YumeCheckbox);
}
