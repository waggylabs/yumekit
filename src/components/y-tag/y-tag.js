import { close as closeSvg } from "../../icons/index.js";
import { contrastTextColor } from "../../modules/helpers.js";

export class YumeTag extends HTMLElement {
    static get observedAttributes() {
        return ["removable", "color", "style-type", "shape", "size"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme for the tag (default "base"). */
    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** Whether the tag has a remove button. */
    get removable() {
        return this.hasAttribute("removable");
    }
    set removable(val) {
        if (val) this.setAttribute("removable", "");
        else this.removeAttribute("removable");
    }

    /** Shape: "square" | "round" (default "square"). */
    get shape() {
        return this.getAttribute("shape") || "square";
    }
    set shape(val) {
        this.setAttribute("shape", val);
    }

    /** Size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Visual style: "filled" | "outlined" | "flat" (default "filled"). */
    get styleType() {
        return this.getAttribute("style-type") || "filled";
    }
    set styleType(val) {
        this.setAttribute("style-type", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this.shadowRoot.innerHTML = `
            <style>${this._getStyle()}</style>
            <span class="tag" part="tag">
                <slot></slot>
                ${this.removable ? `<button class="remove" part="remove" aria-label="Remove tag">${closeSvg}</button>` : ""}
            </span>
        `;

        if (this.removable) this._bindRemoveListener();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindRemoveListener() {
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

    _getCustomColorVariant(color, styleType) {
        const textColor = contrastTextColor(color);
        const variants = {
            filled: `
                .tag { background: ${color}; color: ${textColor}; }
                .remove { color: ${textColor}; }
            `,
            outlined: `
                .tag { border: 1px solid ${color}; background: transparent; color: ${color}; }
                .remove { color: ${color}; }
            `,
            flat: `
                .tag { background: color-mix(in srgb, ${color} 20%, transparent); border-color: transparent; color: ${color}; }
                .remove { color: ${color}; }
            `,
        };
        return variants[styleType] || variants.filled;
    }

    _getStyle() {
        const { color, styleType, shape, size } = this;

        const vars = {
            primary: [
                "--primary-content--",
                "--primary-content-inverse",
                "--primary-background-app",
            ],
            secondary: [
                "--secondary-content--",
                "--secondary-content-inverse",
                "--secondary-background-app",
            ],
            base: [
                "--base-content--",
                "--base-content-inverse",
                "--base-background-app",
            ],
            success: [
                "--success-content--",
                "--success-content-inverse",
                "--success-background-app",
            ],
            error: [
                "--error-content--",
                "--error-content-inverse",
                "--error-background-app",
            ],
            warning: [
                "--warning-content--",
                "--warning-content-inverse",
                "--warning-background-app",
            ],
            help: [
                "--help-content--",
                "--help-content-inverse",
                "--help-background-app",
            ],
        };

        const varEntry = vars[color];
        const isCustomColor =
            !varEntry &&
            (color.startsWith("#") ||
                color.startsWith("rgb") ||
                color.startsWith("hsl"));

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
                display: inline-flex;
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
                width: 1.1em;
                height: 1.1em;
                stroke-width: 2.5;
            }
        `;

        if (isCustomColor)
            return baseStyle + this._getCustomColorVariant(color, styleType);

        const [content, inverse, flatBackground] = varEntry || vars.base;

        const styleVariants = {
            filled: `
                .tag { background: var(${content}); color: var(${inverse}); }
                .remove { color: var(${inverse}); }
            `,
            outlined: `
                .tag { border: 1px solid var(${content}); background: transparent; color: var(${content}); }
                .remove { color: var(${content}); }
            `,
            flat: `
                .tag { background: var(${flatBackground}); border-color: var(${flatBackground}); color: var(${content}); }
                .remove { color: var(${content}); }
            `,
        };

        return baseStyle + (styleVariants[styleType] || styleVariants.filled);
    }
}

if (!customElements.get("y-tag")) {
    customElements.define("y-tag", YumeTag);
}
