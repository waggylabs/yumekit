export class YumeButton extends HTMLElement {
    static get observedAttributes() {
        return [
            "left-icon",
            "right-icon",
            "color",
            "size",
            "style-type",
            "type",
            "disabled",
            "name",
            "value",
            "autofocus",
            "form",
            "formaction",
            "formenctype",
            "formmethod",
            "formnovalidate",
            "formtarget",
            "aria-label",
            "aria-pressed",
            "aria-hidden",
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.init();
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) {
            this.setAttribute("size", "medium");
        }

        this.init();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const attributes = YumeButton.observedAttributes;

        if (oldValue !== newValue && attributes.includes(name)) {
            if (newValue === null) {
                this.button.removeAttribute(name);
            } else {
                this.button.setAttribute(name, newValue);
            }
        }

        this.init();

        if (["color", "size", "style-type", "disabled"].includes(name)) {
            this.updateStyles();
        }
    }

    get value() {
        if (this.hasAttribute("multiple")) {
            return Array.from(this.selectedValues).join(",");
        } else {
            return this.selectedValues.size
                ? Array.from(this.selectedValues)[0]
                : "";
        }
    }

    set value(newVal) {
        if (this.hasAttribute("multiple")) {
            if (typeof newVal === "string") {
                this.selectedValues = new Set(
                    newVal.split(",").map((s) => s.trim()),
                );
            } else if (Array.isArray(newVal)) {
                this.selectedValues = new Set(newVal);
            }
        } else {
            if (typeof newVal === "string") {
                this.selectedValues = new Set([newVal.trim()]);
            } else {
                this.selectedValues = new Set();
            }
        }

        this.setAttribute("value", newVal);
    }

    setOptions(options) {
        this.setAttribute("options", JSON.stringify(options));
    }

    handleClick() {
        const detail = {};
        const eventType = this.getAttribute("data-event");

        if (this.hasAttribute("disabled") || !eventType) return;

        Array.from(this.attributes)
            .filter((attr) => attr.name.startsWith("data-detail-"))
            .forEach((attr) => {
                const key = attr.name.replace("data-detail-", "");
                detail[key] = attr.value;
            });

        this.dispatchEvent(
            new CustomEvent(eventType, {
                detail,
                bubbles: true,
                composed: true,
            }),
        );
    }

    init() {
        this.applyStyles();
        this.render();
        this.proxyNativeOnClick();
        this.addEventListeners();
    }

    proxyNativeOnClick() {
        try {
            Object.defineProperty(this, "onclick", {
                get: () => this.button.onclick,
                set: (value) => {
                    this.button.onclick = value;
                },
                configurable: true,
                enumerable: true,
            });
        } catch (e) {
            console.warn("Could not redefine onclick:", e);
        }
    }

    updateButtonAttributes() {
        const attributes = YumeButton.observedAttributes;

        attributes.forEach((attr) => {
            if (this.hasAttribute(attr)) {
                this.button.setAttribute(attr, this.getAttribute(attr));
            } else {
                this.button.removeAttribute(attr);
            }
        });
    }

    manageSlotVisibility(slotName, selector) {
        const slot = slotName
            ? this.shadowRoot.querySelector(`slot[name="${slotName}"]`)
            : this.shadowRoot.querySelector("slot:not([name])");
        const container = this.shadowRoot.querySelector(selector);

        const updateVisibility = () => {
            const hasContent = slot
                .assignedNodes({ flatten: true })
                .some(
                    (n) =>
                        !(
                            n.nodeType === Node.TEXT_NODE &&
                            n.textContent.trim() === ""
                        ),
                );
            container.style.display = hasContent ? "inline-flex" : "none";
        };

        updateVisibility();
        slot.addEventListener("slotchange", updateVisibility);
    }

    render() {
        if (!this.button) {
            this.button = document.createElement("button");
            this.button.classList.add("button");
            this.button.setAttribute("role", "button");
            this.button.setAttribute("tabindex", "0");
            this.button.setAttribute("part", "button");
            this.shadowRoot.appendChild(this.button);
        }

        this.updateButtonAttributes();

        if (this.hasAttribute("disabled")) {
            this.button.setAttribute("disabled", "");
            this.button.setAttribute("aria-disabled", "true");
        } else {
            this.button.removeAttribute("disabled");
            this.button.setAttribute("aria-disabled", "false");
        }

        this.button.innerHTML = `
          <span class="icon left-icon" part="left-icon"><slot name="left-icon"></slot></span>
          <span class="label" part="label"><slot></slot></span>
          <span class="icon right-icon" part="right-icon"><slot name="right-icon"></slot></span>
      `;

        this.manageSlotVisibility("left-icon", ".left-icon");
        this.manageSlotVisibility("right-icon", ".right-icon");
        this.manageSlotVisibility("", ".label");
    }

    applyStyles() {
        const style = document.createElement("style");
        style.textContent = `
        :host {
          display: inline-block;
        }

        @font-face {
            font-family: "Lexend";
            font-display: swap;
        }

        .button {
            box-sizing: border-box;
            display: inline-flex;
            min-height: var(--button-min-height, var(--sizing-medium, 40px));
            min-width: var(--button-min-width, var(--sizing-medium, 40px));
            padding: var(--button-padding, var(--component-button-padding-medium));
            gap: var(--button-gap, var(--component-button-padding-medium));
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            border-radius: var(--component-button-border-radius-outer, 4px);
            border: var(--component-button-border-width, 1px) solid var(--border-color, var(--base-content--, #1D1D1D));
            background: var(--background-color, #F1F6FA);
            transition: background-color 0.1s, color 0.1s, border-color 0.1s;
            cursor: pointer;
            color: var(--text-color);
            font-family: var(--font-family-body, Lexend, sans-serif);
            font-size: var(--font-size-button, 1em);
            line-height: 1;
        }

        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .button:hover:not(:disabled),
        .button:hover:not(:disabled) .button-content {
            background: var(--hover-background-color);
            color: var(--hover-text-color);
            border-color: var(--hover-border-color);
        }
        .button:focus:not(:disabled),
        .button:focus:not(:disabled) .button-content {
            background: var(--focus-background-color);
            color: var(--focus-text-color);
            border-color: var(--focus-border-color);
        }
        .button:active:not(:disabled),
        .button:active:not(:disabled) .button-content {
            background: var(--active-background-color);
            color: var(--active-text-color);
            border-color: var(--active-border-color);
        }
        .icon {
            display: flex;
            min-width: 16px;
            min-height: 1em;
            justify-content: center;
            align-items: center;
        }
        .label {
            line-height: inherit;
            min-height: 1em;
            align-items: center;
        }
      `;
        this.shadowRoot.appendChild(style);
    }

    addEventListeners() {
        this.button.addEventListener("focus", () => {
            this.dispatchEvent(
                new CustomEvent("focus", { bubbles: true, composed: true }),
            );
        });

        this.button.addEventListener("blur", () => {
            this.dispatchEvent(
                new CustomEvent("blur", { bubbles: true, composed: true }),
            );
        });

        this.button.addEventListener("keydown", (event) => {
            this.dispatchEvent(
                new CustomEvent("keydown", {
                    detail: { key: event.key, code: event.code },
                    bubbles: true,
                    composed: true,
                }),
            );
        });

        this.button.addEventListener("keyup", (event) => {
            this.dispatchEvent(
                new CustomEvent("keyup", {
                    detail: { key: event.key, code: event.code },
                    bubbles: true,
                    composed: true,
                }),
            );
        });

        this.button.addEventListener("click", (event) => {
            this.handleClick();

            if (this.getAttribute("type") === "submit") {
                const form = this.closest("form");
                if (form) {
                    event.preventDefault();
                    form.requestSubmit();
                }
            }
        });
    }

    updateStyles() {
        const color = this.getAttribute("color") || "base";
        const size = this.getAttribute("size") || "medium";
        const styleType = this.getAttribute("style-type") || "outlined";

        const colorVars = {
            primary: [
                "--primary-content--",
                "--primary-content-hover",
                "--primary-content-active",
                "--primary-background-component",
                "--primary-background-hover",
                "--primary-background-active",
                "--primary-content-inverse",
            ],
            secondary: [
                "--secondary-content--",
                "--secondary-content-hover",
                "--secondary-content-active",
                "--secondary-background-component",
                "--secondary-background-hover",
                "--secondary-background-active",
                "--secondary-content-inverse",
            ],
            base: [
                "--base-content--",
                "--base-content-lighter",
                "--base-content-lightest",
                "--base-background-component",
                "--base-background-hover",
                "--base-background-active",
                "--base-content-inverse",
            ],
            success: [
                "--success-content--",
                "--success-content-hover",
                "--success-content-active",
                "--success-background-component",
                "--success-background-hover",
                "--success-background-active",
                "--success-content-inverse",
            ],
            error: [
                "--error-content--",
                "--error-content-hover",
                "--error-content-active",
                "--error-background-component",
                "--error-background-hover",
                "--error-background-active",
                "--error-content-inverse",
            ],
            warning: [
                "--warning-content--",
                "--warning-content-hover",
                "--warning-content-active",
                "--warning-background-component",
                "--warning-background-hover",
                "--warning-background-active",
                "--warning-content-inverse",
            ],
            help: [
                "--help-content--",
                "--help-content-hover",
                "--help-content-active",
                "--help-background-component",
                "--help-background-hover",
                "--help-background-active",
                "--help-content-inverse",
            ],
        };

        const sizeVars = {
            small: [
                "--component-button-padding-small",
                "--component-button-padding-small",
            ],
            medium: [
                "--component-button-padding-medium",
                "--component-button-padding-medium",
            ],
            large: [
                "--component-button-padding-large",
                "--component-button-padding-large",
            ],
        };

        const styleVars = {
            outlined: {
                "--background-color": `var(${colorVars[color][3]}, rgba(241,246,250,1))`,
                "--border-color": `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
                "--text-color": `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
            },
            filled: {
                "--background-color": `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
                "--border-color": `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
                "--text-color": `var(${colorVars[color][6]}, rgba(241,246,250,1))`,
            },
            flat: {
                "--background-color": `var(${colorVars[color][3]},rgba(241,246,250,1))`,
                "--border-color": `var(${colorVars[color][3]},rgba(241,246,250,1))`,
                "--text-color": `var(${colorVars[color][0]},rgba(29,29,29,1))`,
            },
        };

        const currentStyle = styleVars[styleType] || styleVars.outlined;
        Object.entries(currentStyle).forEach(([key, value]) => {
            this.button.style.setProperty(key, value);
        });

        if (styleType === "filled") {
            this.button.style.setProperty(
                "--hover-background-color",
                `var(${colorVars[color][1]}, rgba(215,219,222,1))`,
            );
            this.button.style.setProperty(
                "--hover-text-color",
                `var(${colorVars[color][6]}, rgba(241,246,250,1))`,
            );
            this.button.style.setProperty(
                "--hover-border-color",
                `var(${colorVars[color][1]}, rgba(215,219,222,1))`,
            );
            this.button.style.setProperty(
                "--focus-background-color",
                `var(${colorVars[color][2]}, rgba(188,192,195,1))`,
            );
            this.button.style.setProperty(
                "--focus-text-color",
                `var(${colorVars[color][6]}, rgba(241,246,250,1))`,
            );
            this.button.style.setProperty(
                "--focus-border-color",
                `var(${colorVars[color][2]}, rgba(188,192,195,1))`,
            );
            this.button.style.setProperty(
                "--active-background-color",
                `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
            );
            this.button.style.setProperty(
                "--active-text-color",
                `var(${colorVars[color][6]}, rgba(241,246,250,1))`,
            );
            this.button.style.setProperty(
                "--active-border-color",
                `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
            );
        } else {
            const borderColor = `var(${colorVars[color][0]}, rgba(29,29,29,1))`;

            this.button.style.setProperty(
                "--hover-background-color",
                `var(${colorVars[color][4]}, rgba(215,219,222,1))`,
            );
            this.button.style.setProperty(
                "--hover-text-color",
                `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
            );
            this.button.style.setProperty(
                "--focus-background-color",
                `var(${colorVars[color][5]}, rgba(188,192,195,1))`,
            );
            this.button.style.setProperty(
                "--focus-text-color",
                `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
            );
            this.button.style.setProperty(
                "--active-background-color",
                `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
            );
            this.button.style.setProperty(
                "--active-text-color",
                `var(${colorVars[color][6]}, rgba(241,246,250,1))`,
            );

            if (styleType === "outlined") {
                // Outlined buttons keep their border color across all states
                this.button.style.setProperty(
                    "--hover-border-color",
                    borderColor,
                );
                this.button.style.setProperty(
                    "--focus-border-color",
                    borderColor,
                );
                this.button.style.setProperty(
                    "--active-border-color",
                    borderColor,
                );
            } else {
                // Flat buttons match border to background
                this.button.style.setProperty(
                    "--hover-border-color",
                    `var(${colorVars[color][4]}, rgba(215,219,222,1))`,
                );
                this.button.style.setProperty(
                    "--focus-border-color",
                    `var(${colorVars[color][5]}, rgba(188,192,195,1))`,
                );
                this.button.style.setProperty(
                    "--active-border-color",
                    `var(${colorVars[color][0]}, rgba(29,29,29,1))`,
                );
            }
        }

        const [contentPadding, buttonPadding] =
            sizeVars[size] || sizeVars.medium;
        this.button.style.setProperty(
            "--button-padding",
            `var(${buttonPadding}, var(--component-button-padding-medium))`,
        );
        this.button.style.setProperty(
            "--button-gap",
            `var(${contentPadding}, var(--component-button-padding-medium))`,
        );

        const minSizeMapping = {
            small: "var(--sizing-small, 32px)",
            medium: "var(--sizing-medium, 40px)",
            large: "var(--sizing-large, 56px)",
        };
        this.button.style.setProperty(
            "--button-min-height",
            minSizeMapping[size] || "40px",
        );
        this.button.style.setProperty(
            "--button-min-width",
            minSizeMapping[size] || "40px",
        );
    }
}

if (!customElements.get("y-button")) {
    customElements.define("y-button", YumeButton);
}
