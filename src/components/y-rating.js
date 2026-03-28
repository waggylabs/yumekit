import { getIcon } from "../icons/registry.js";

export class YumeRating extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return ["icon", "color", "max", "value", "size", "disabled", "readonly", "name"];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this._hoverIndex = -1;
        this.render();
    }

    connectedCallback() {
        this._internals.setFormValue(this.value);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            this._internals.setFormValue(newValue, this.getAttribute("name"));
        }

        if (name === "name") {
            this._internals.setFormValue(this.value, newValue);
            return;
        }

        this.render();
    }

    /** @type {number} The current rating value. */
    get value() {
        return parseInt(this.getAttribute("value") || "0", 10);
    }

    set value(val) {
        this.setAttribute("value", String(val));
        this._internals.setFormValue(String(val), this.getAttribute("name"));
    }

    _updateIcons(activeIndex) {
        this.shadowRoot.querySelectorAll(".icon").forEach((el) => {
            const idx = parseInt(el.dataset.index, 10);
            el.classList.toggle("filled", idx <= activeIndex);
        });
    }

    _attachIconListeners() {
        const isDisabled = this.hasAttribute("disabled");
        const isReadonly = this.hasAttribute("readonly");

        if (isDisabled || isReadonly) return;

        this.shadowRoot.querySelectorAll(".icon").forEach((el) => {
            const idx = parseInt(el.dataset.index, 10);

            el.addEventListener("mouseenter", () => {
                this._hoverIndex = idx;
                this._updateIcons(idx);
            });

            el.addEventListener("mouseleave", () => {
                this._hoverIndex = -1;
                this._updateIcons(this.value);
            });

            el.addEventListener("click", () => {
                // Clicking the current value clears the rating (unless required)
                const next = idx === this.value && !this.hasAttribute("required") ? 0 : idx;
                this.value = next;
                this._updateIcons(next);
                this.dispatchEvent(
                    new CustomEvent("change", {
                        detail: { value: next },
                        bubbles: true,
                        composed: true,
                    }),
                );
            });
        });

        this.shadowRoot.querySelector(".rating").addEventListener("mouseleave", () => {
            this._hoverIndex = -1;
            this._updateIcons(this.value);
        });
    }

    render() {
        const iconName = this.getAttribute("icon") || "star";
        const color = this.getAttribute("color") || "primary";
        const max = Math.max(1, parseInt(this.getAttribute("max") || "5", 10));
        const value = this.value;
        const size = this.getAttribute("size") || "medium";
        const isDisabled = this.hasAttribute("disabled");
        const isReadonly = this.hasAttribute("readonly");
        const isInteractive = !isDisabled && !isReadonly;

        const iconSvg = getIcon(iconName);

        const iconSizePx = { small: "18px", medium: "24px", large: "32px" }[size] || "24px";
        const gapPx = { small: "2px", medium: "4px", large: "6px" }[size] || "4px";

        const isCustomColor =
            color.startsWith("#") ||
            color.startsWith("rgb") ||
            color.startsWith("hsl");
        const filledColor = isCustomColor ? color : `var(--${color}-content--)`;

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: inline-block;
                font-family: var(--font-family-body);
                opacity: ${isDisabled ? "0.5" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .rating {
                display: inline-flex;
                align-items: center;
                gap: ${gapPx};
            }

            .icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: ${iconSizePx};
                height: ${iconSizePx};
                color: var(--base-content-lighter, #9d9fa3);
                transition: color 0.15s ease, transform 0.1s ease;
                cursor: ${isInteractive ? "pointer" : "default"};
                flex-shrink: 0;
            }

            .icon.filled {
                color: ${filledColor};
            }

            .icon svg {
                width: 100%;
                height: 100%;
            }

            ${isInteractive ? `
            .icon:hover,
            .icon:focus-visible {
                transform: scale(1.15);
            }
            ` : ""}
        `);

        this.shadowRoot.adoptedStyleSheets = [sheet];

        const icons = Array.from({ length: max }, (_, i) => {
            const idx = i + 1;
            const isFilled = idx <= value;
            return `<span
                class="icon${isFilled ? " filled" : ""}"
                data-index="${idx}"
                part="icon"
                ${isInteractive ? `role="radio" aria-label="${idx} of ${max}" tabindex="0"` : `aria-hidden="true"`}
            >${iconSvg}</span>`;
        }).join("");

        this.shadowRoot.innerHTML = `
            <div class="rating" part="rating" role="${isInteractive ? "radiogroup" : "img"}" aria-label="Rating: ${value} of ${max}">
                ${icons}
            </div>
        `;

        this._attachIconListeners();
    }
}

if (!customElements.get("y-rating")) {
    customElements.define("y-rating", YumeRating);
}
