import { close as closeSvg } from "../icons/index.js";

export class YumeTag extends HTMLElement {
    static get observedAttributes() {
        return ["removable", "color", "style-type", "shape"];
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

        const style = document.createElement("style");
        style.textContent = this.getStyle(color, styleType, shape);

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

    getStyle(color, styleType, shape) {
        const vars = {
            primary: [
                "--primary-content--",
                "--primary-content-hover",
                "--primary-background-component",
            ],
            secondary: [
                "--secondary-content--",
                "--secondary-content-hover",
                "--secondary-background-component",
            ],
            base: [
                "--base-content--",
                "--base-content-lighter",
                "--base-background-component",
            ],
            success: [
                "--success-content--",
                "--success-content-hover",
                "--success-background-component",
            ],
            error: [
                "--error-content--",
                "--error-content-hover",
                "--error-background-component",
            ],
            warning: [
                "--warning-content--",
                "--warning-content-hover",
                "--warning-background-component",
            ],
            help: [
                "--help-content--",
                "--help-content-hover",
                "--help-background-component",
            ],
        };

        const [content, hover, background] = vars[color] || vars.base;

        const borderRadius =
            shape === "round"
                ? "var(--component-tag-border-radius-circle)"
                : "var(--component-tag-border-radius-square)";

        const baseStyle = `
            :host {
                display: inline-block;
                font-family: var(--font-family-body, sans-serif);
                font-size: var(--font-size-label, 0.83em);
            }
            .tag {
                display: inline-flex;
                align-items: center;
                gap: var(--spacing-2x-small);
                padding: 0 var(--component-tag-padding-medium, var(--spacing-x-small));
                border: 1px solid transparent;
                transition: background-color 0.2s, color 0.2s;
                border-radius: ${borderRadius};
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
                    color: var(${background});
                }
                .remove {
                    color: var(${background});
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
