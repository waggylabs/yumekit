import { close as closeSvg } from "../icons/index.js";

export class YumeTag extends HTMLElement {
    static get observedAttributes() {
        return ["removable", "color", "style-type", "shape", "size"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    render() {
        const removable = this.hasAttribute("removable");
        const color = this.getAttribute("color") || "base";
        const styleType = this.getAttribute("style-type") || "filled";
        const shape = this.getAttribute("shape") || "square";
        const size = this.getAttribute("size") || "medium";

        const style = document.createElement("style");
        style.textContent = this.getStyle(color, styleType, shape, size);

        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(style);
        this.shadowRoot.innerHTML += `
            <span class="tag" part="tag">
                <slot></slot>
                ${
                    removable
                        ? `
                    <button class="remove" part="remove" aria-label="Remove tag">
                        ${closeSvg}
                    </button>
                `
                        : ""
                }
            </span>
        `;

        if (removable) {
            this.shadowRoot
                .querySelector(".remove")
                .addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.dispatchEvent(
                        new CustomEvent("remove", {
                            bubbles: true,
                            composed: true,
                        }),
                    );
                });
        }
    }

    getStyle(color, styleType, shape, size) {
        const vars = {
            primary: [
                "--primary-content--",
                "--primary-content-hover",
                "--primary-background-component",
                "--primary-content-inverse",
            ],
            secondary: [
                "--secondary-content--",
                "--secondary-content-hover",
                "--secondary-background-component",
                "--secondary-content-inverse",
            ],
            base: [
                "--base-content--",
                "--base-content-lighter",
                "--base-background-component",
                "--base-content-inverse",
            ],
            success: [
                "--success-content--",
                "--success-content-hover",
                "--success-background-component",
                "--success-content-inverse",
            ],
            error: [
                "--error-content--",
                "--error-content-hover",
                "--error-background-component",
                "--error-content-inverse",
            ],
            warning: [
                "--warning-content--",
                "--warning-content-hover",
                "--warning-background-component",
                "--warning-content-inverse",
            ],
            help: [
                "--help-content--",
                "--help-content-hover",
                "--help-background-component",
                "--help-content-inverse",
            ],
        };

        const [content, hover, background, inverse] = vars[color] || vars.base;

        const borderRadius =
            shape === "round"
                ? "var(--component-tag-border-radius-circle)"
                : "var(--component-tag-border-radius-square)";

        const sizeConfig = {
            small: {
                height: "var(--component-tag-height-small, 22px)",
                padding:
                    "var(--component-tag-padding-small, var(--spacing-2x-small))",
                fontSize: "var(--font-size-small, 0.8em)",
            },
            medium: {
                height: "var(--component-tag-height-medium, 28px)",
                padding:
                    "var(--component-tag-padding-medium, var(--spacing-x-small))",
                fontSize: "var(--font-size-label, 0.83em)",
            },
            large: {
                height: "var(--component-tag-height-large, 38px)",
                padding:
                    "var(--component-tag-padding-large, var(--spacing-small))",
                fontSize: "var(--font-size-paragraph, 1em)",
            },
        };
        const cfg = sizeConfig[size] || sizeConfig.medium;

        const baseStyle = `
            :host {
                display: inline-block;
                font-family: var(--font-family-body, sans-serif);
                font-size: ${cfg.fontSize};
            }
            .tag {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-2x-small);
                height: ${cfg.height};
                padding: 0 ${cfg.padding};
                border: 1px solid transparent;
                transition: background-color 0.2s, color 0.2s;
                border-radius: ${borderRadius};
                box-sizing: border-box;
            }
            .remove {
                all: unset;
                cursor: pointer;
                display: flex;
                align-items: center;
            }
            .remove svg {
                pointer-events: none;
            }
        `;

        const styleVariants = {
            filled: `
                .tag {
                    background: var(${content});
                    color: var(${inverse});
                }
                .remove {
                    color: var(${inverse});
                }
            `,
            outlined: `
                .tag {
                    border: 1px solid var(${content});
                    background: transparent;
                    color: var(${content});
                }
                .remove {
                    color: var(${content});
                }
            `,
            flat: `
                .tag {
                    background: transparent;
                    color: var(${content});
                }
                .remove {
                    color: var(${content});
                }
            `,
        };

        return baseStyle + (styleVariants[styleType] || styleVariants.filled);
    }
}

if (!customElements.get("y-tag")) {
    customElements.define("y-tag", YumeTag);
}
