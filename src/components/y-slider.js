export class YumeSlider extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return ["value", "min", "max", "step", "size", "color", "disabled", "name", "orientation"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this._dragging = false;
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("min")) this.setAttribute("min", "0");
        if (!this.hasAttribute("max")) this.setAttribute("max", "100");
        if (!this.hasAttribute("value")) this.setAttribute("value", "50");

        this._internals.setFormValue(this.value);
        this.render();
        this._bindEvents();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value" || name === "name") {
            this._internals.setFormValue(this.value, this.getAttribute("name"));
        }

        if (name === "value" && this.shadowRoot.querySelector(".slider-track")) {
            this._updateVisuals();
        } else {
            this.render();
            this._bindEvents();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme for the slider track and thumb. */
    get color() { return this.getAttribute("color") || "primary"; }
    set color(val) { this.setAttribute("color", val); }

    /** Whether the slider is disabled. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Maximum allowed value (default 100). */
    get max() { return parseFloat(this.getAttribute("max")) || 100; }
    set max(val) { this.setAttribute("max", String(val)); }

    /** Minimum allowed value (default 0). */
    get min() { return parseFloat(this.getAttribute("min")) || 0; }
    set min(val) { this.setAttribute("min", String(val)); }

    /** The slider orientation ("horizontal" or "vertical"). */
    get orientation() { return this.getAttribute("orientation") || "horizontal"; }
    set orientation(val) { this.setAttribute("orientation", val); }

    /** The current value as a percentage of the min-max range. */
    get percentage() {
        const range = this.max - this.min;
        if (range <= 0) return 0;
        const pct = ((this.value - this.min) / range) * 100;
        return Math.max(0, Math.min(100, pct));
    }

    /** Bar thickness: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** Step increment, or null for continuous. */
    get step() {
        const s = parseFloat(this.getAttribute("step"));
        return Number.isNaN(s) || s <= 0 ? null : s;
    }
    set step(val) {
        if (val === null || val === undefined) this.removeAttribute("step");
        else this.setAttribute("step", String(val));
    }

    /** Current slider value, clamped between min and max. */
    get value() {
        const val = parseFloat(this.getAttribute("value"));
        return Number.isNaN(val) ? 0 : val;
    }
    set value(val) {
        const clamped = Math.max(this.min, Math.min(this.max, Number(val)));
        const stepped = this._snapToStep(clamped);
        this.setAttribute("value", String(stepped));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const pct = this.percentage;
        const trackFillColor = this._getTrackColor(this.color);
        const thumbColor = this._getThumbColor(this.color);
        const { trackHeight } = this._getSizeVars(this.size);
        const isDisabled = this.disabled;

        this.shadowRoot.innerHTML =
            `<style>${this._buildStyleSheet(trackFillColor, thumbColor, trackHeight, pct, isDisabled)}</style>` +
            this._buildHTML(pct, isDisabled);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindEvents() {
        const track = this.shadowRoot.querySelector(".slider-track");
        const thumb = this.shadowRoot.querySelector(".thumb");
        if (!track || !thumb) return;

        const onPointerDown = (e) => {
            if (this.disabled) return;
            e.preventDefault();
            this._dragging = true;
            this._updateFromPointer(e);
            document.addEventListener("pointermove", onPointerMove);
            document.addEventListener("pointerup", onPointerUp);
        };

        const onPointerMove = (e) => {
            if (!this._dragging) return;
            this._updateFromPointer(e);
        };

        const onPointerUp = () => {
            this._dragging = false;
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
            this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
        };

        track.addEventListener("pointerdown", onPointerDown);
        thumb.addEventListener("pointerdown", onPointerDown);

        track.addEventListener("keydown", (e) => {
            if (this.disabled) return;
            const s = this.step || 1;
            let handled = true;
            switch (e.key) {
                case "ArrowRight":
                case "ArrowUp":   this.value = this.value + s; break;
                case "ArrowLeft":
                case "ArrowDown": this.value = this.value - s; break;
                case "Home":      this.value = this.min; break;
                case "End":       this.value = this.max; break;
                default:          handled = false;
            }
            if (handled) {
                e.preventDefault();
                this.dispatchEvent(new Event("input",  { bubbles: true, composed: true }));
                this.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
            }
        });
    }

    _buildHTML(pct, isDisabled) {
        return `
            <div class="slider-wrapper">
                <div
                    class="slider-track"
                    part="track"
                    role="slider"
                    tabindex="${isDisabled ? "-1" : "0"}"
                    aria-valuenow="${this.value}"
                    aria-valuemin="${this.min}"
                    aria-valuemax="${this.max}"
                    ${this.step ? `aria-valuestep="${this.step}"` : ""}
                    aria-orientation="${this.orientation}"
                    ${isDisabled ? 'aria-disabled="true"' : ""}
                >
                    <div class="slider-inner">
                        <div class="fill" part="fill"></div>
                        <div class="thumb" part="thumb"></div>
                    </div>
                </div>
            </div>
        `;
    }

    _buildStyleSheet(trackFillColor, thumbColor, trackHeight, pct, isDisabled) {
        return `
            :host {
                display: inline-block;
                font-family: var(--font-family-body);
                color: var(--base-content--);
                opacity: ${isDisabled ? "0.5" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
                min-width: 100px;
            }

            .slider-wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .slider-track {
                position: relative;
                width: 100%;
                height: ${trackHeight};
                background: var(--base-background-component);
                border: var(--component-slider-border-width) solid var(--base-border);
                border-radius: var(--component-slider-border-radius-outer);
                box-sizing: border-box;
                padding: var(--component-slider-padding);
                cursor: pointer;
                outline: none;
            }

            .slider-track:focus-visible {
                border-color: ${thumbColor};
            }

            .slider-inner {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }

            .fill {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                background: ${trackFillColor};
                border-radius: var(--component-slider-border-radius-inner) 0 0 var(--component-slider-border-radius-inner);
                width: ${pct}%;
                pointer-events: none;
            }

            .thumb {
                position: absolute;
                top: 0;
                left: ${pct}%;
                transform: translateX(-50%);
                width: 8px;
                height: 100%;
                background: ${thumbColor};
                border-radius: var(--component-slider-thumb-border-radius);
                cursor: grab;
                z-index: 1;
                touch-action: none;
            }

            .thumb:active {
                cursor: grabbing;
            }
        `;
    }

    _getSizeVars(size) {
        const map = {
            small: { trackHeight: "var(--sizing-small, 27px)" },
            medium: { trackHeight: "var(--sizing-medium, 35px)" },
            large: { trackHeight: "var(--sizing-large, 51px)" },
        };
        return map[size] || map.medium;
    }

    _getThumbColor(color) {
        const colorMap = {
            primary: "var(--primary-content--)",
            secondary: "var(--secondary-content--)",
            base: "var(--base-content--)",
            success: "var(--success-content--)",
            warning: "var(--warning-content--)",
            error: "var(--error-content--)",
            help: "var(--help-content--)",
        };
        return colorMap[color] || color;
    }

    _getTrackColor(color) {
        const colorMap = {
            primary: "var(--primary-background-hover)",
            secondary: "var(--secondary-background-hover)",
            base: "var(--base-background-active)",
            success: "var(--success-background-hover)",
            warning: "var(--warning-background-hover)",
            error: "var(--error-background-hover)",
            help: "var(--help-background-hover)",
        };
        return colorMap[color] || `color-mix(in srgb, ${color} 40%, transparent)`;
    }

    _snapToStep(val) {
        if (!this.step) return val;
        const steps = Math.round((val - this.min) / this.step);
        return Math.max(this.min, Math.min(this.max, this.min + steps * this.step));
    }

    _updateFromPointer(e) {
        const track = this.shadowRoot.querySelector(".slider-track");
        const inner = this.shadowRoot.querySelector(".slider-inner");
        const target = inner || track;
        const rect = target.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const rawValue = this.min + ratio * (this.max - this.min);

        this.value = rawValue;
        this.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    }

    /** Fast path: update only the dynamic parts (fill, thumb, aria). */
    _updateVisuals() {
        const pct = this.percentage;
        const fill = this.shadowRoot.querySelector(".fill");
        const thumb = this.shadowRoot.querySelector(".thumb");
        const track = this.shadowRoot.querySelector(".slider-track");

        if (fill) fill.style.width = `${pct}%`;
        if (thumb) thumb.style.left = `${pct}%`;
        if (track) track.setAttribute("aria-valuenow", String(this.value));
    }
}

if (!customElements.get("y-slider")) {
    customElements.define("y-slider", YumeSlider);
}
