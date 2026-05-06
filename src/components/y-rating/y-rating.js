import { getSanitizedIcon } from "../../modules/svg-sanitizer.js";

export class YumeRating extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return ["icon", "color", "max", "value", "size", "disabled", "readonly", "name"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme for the icons (default "primary"). */
    get color() { return this.getAttribute("color") || "primary"; }
    set color(val) { this.setAttribute("color", val); }

    /** Whether the rating is disabled. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Icon name used for the rating stars (default "star"). */
    get icon() { return this.getAttribute("icon") || "star"; }
    set icon(val) { this.setAttribute("icon", val); }

    /** Maximum rating value (default 5). */
    get max() { return Math.max(1, parseInt(this.getAttribute("max") || "5", 10)); }
    set max(val) { this.setAttribute("max", String(val)); }

    /** The form name of the rating. */
    get name() { return this.getAttribute("name") || ""; }
    set name(val) { this.setAttribute("name", val); }

    /** Whether the rating is read-only. */
    get readonly() { return this.hasAttribute("readonly"); }
    set readonly(val) {
        if (val) this.setAttribute("readonly", "");
        else this.removeAttribute("readonly");
    }

    /** Icon size: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** Current rating value (default 0). */
    get value() { return parseInt(this.getAttribute("value") || "0", 10); }
    set value(val) {
        this.setAttribute("value", String(val));
        this._internals.setFormValue(String(val), this.getAttribute("name"));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const isInteractive = !this.disabled && !this.readonly;
        const iconSvg = getSanitizedIcon(this.icon);
        const filledColor = this._getFilledColor(this.color);
        const iconSizePx = this._getIconSize(this.size);
        const gapPx = this._getIconGap(this.size);

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet(isInteractive, filledColor, iconSizePx, gapPx)];
        this.shadowRoot.innerHTML = this._buildHTML(isInteractive, iconSvg);
        this._attachIconListeners();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _attachIconListeners() {
        const isInteractive = !this.disabled && !this.readonly;
        if (!isInteractive) return;

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
                const next = idx === this.value && !this.hasAttribute("required") ? 0 : idx;
                this.value = next;
                this._updateIcons(next);
                this.dispatchEvent(new CustomEvent("change", {
                    detail: { value: next },
                    bubbles: true,
                    composed: true,
                }));
            });
        });

        this.shadowRoot.querySelector(".rating").addEventListener("mouseleave", () => {
            this._hoverIndex = -1;
            this._updateIcons(this.value);
        });
    }

    _buildHTML(isInteractive, iconSvg) {
        const { max, value } = this;
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

        return `<div class="rating" part="rating" role="${isInteractive ? "radiogroup" : "img"}" aria-label="Rating: ${value} of ${max}">${icons}</div>`;
    }

    _buildStyleSheet(isInteractive, filledColor, iconSizePx, gapPx) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: inline-block;
                font-family: var(--font-family-body);
                opacity: ${this.disabled ? "0.5" : "1"};
                pointer-events: ${this.disabled ? "none" : "auto"};
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
        return sheet;
    }

    _getFilledColor(color) {
        const isCustomColor = color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl");
        return isCustomColor ? color : `var(--${color}-content--)`;
    }

    _getIconGap(size) {
        return { small: "2px", medium: "4px", large: "6px" }[size] || "4px";
    }

    _getIconSize(size) {
        return { small: "18px", medium: "24px", large: "32px" }[size] || "24px";
    }

    _updateIcons(activeIndex) {
        this.shadowRoot.querySelectorAll(".icon").forEach((el) => {
            const idx = parseInt(el.dataset.index, 10);
            el.classList.toggle("filled", idx <= activeIndex);
        });
    }
}

if (!customElements.get("y-rating")) {
    customElements.define("y-rating", YumeRating);
}
