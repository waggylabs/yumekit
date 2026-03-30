import { getColorVarPair } from "../../modules/helpers.js";

export class YumeProgress extends HTMLElement {
    static get observedAttributes() {
        return [
            "value", "min", "max", "step", "size", "color",
            "label-display", "label-format", "indeterminate", "disabled",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("min"))  this.setAttribute("min", "0");
        if (!this.hasAttribute("max"))  this.setAttribute("max", "100");
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Color theme for the progress bar (default "primary"). */
    get color() { return this.getAttribute("color") || "primary"; }
    set color(val) { this.setAttribute("color", val); }

    /** Whether the progress bar is disabled. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Whether the progress bar shows an indeterminate animation. */
    get indeterminate() { return this.hasAttribute("indeterminate"); }
    set indeterminate(val) {
        if (val) this.setAttribute("indeterminate", "");
        else this.removeAttribute("indeterminate");
    }

    /** Label format: "percent" | "value" | "fraction" (default "percent"). */
    get labelFormat() { return this.getAttribute("label-format") || "percent"; }
    set labelFormat(val) { this.setAttribute("label-format", val); }

    /** Whether to show the value label on the bar (default true). */
    get labelDisplay() { return this.getAttribute("label-display") !== "false"; }
    set labelDisplay(val) { this.setAttribute("label-display", val ? "true" : "false"); }

    /** Maximum value (default 100). */
    get max() { return parseFloat(this.getAttribute("max")) || 100; }
    set max(val) { this.setAttribute("max", String(val)); }

    /** Minimum value (default 0). */
    get min() { return parseFloat(this.getAttribute("min")) || 0; }
    set min(val) { this.setAttribute("min", String(val)); }

    /** Bar thickness: "small" | "medium" | "large" (default "medium"). */
    get size() { return this.getAttribute("size") || "medium"; }
    set size(val) { this.setAttribute("size", val); }

    /** Step increment for snapping, or null if continuous. */
    get step() {
        const s = parseFloat(this.getAttribute("step"));
        return Number.isNaN(s) || s <= 0 ? null : s;
    }
    set step(val) {
        if (val === null || val === undefined) this.removeAttribute("step");
        else this.setAttribute("step", String(val));
    }

    /** Current progress value, or null if unset. */
    get value() {
        const val = parseFloat(this.getAttribute("value"));
        return Number.isNaN(val) ? null : val;
    }
    set value(val) {
        if (val === null || val === undefined) this.removeAttribute("value");
        else this.setAttribute("value", String(val));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Decrement the progress value by the step amount (or 1 if no step). */
    decrement() {
        if (this.value === null) return;
        this.value = Math.max(this.value - (this.step || 1), this.min);
    }

    /** Increment the progress value by the step amount (or 1 if no step). */
    increment() {
        if (this.value === null) return;
        this.value = Math.min(this.value + (this.step || 1), this.max);
    }

    /** Computed fill percentage (0–100), accounting for min, max, and step. */
    get percentage() {
        if (this.value === null) return 0;
        const range = this.max - this.min;
        if (range <= 0) return 0;
        let pct = ((this.value - this.min) / range) * 100;
        if (this.step) {
            const stepPct = (this.step / range) * 100;
            pct = Math.round(pct / stepPct) * stepPct;
        }
        return Math.max(0, Math.min(100, pct));
    }

    render() {
        const isIndeterminate = this.indeterminate;
        const pct = this.percentage;
        const [barColor, barTextColor] = getColorVarPair(this.color, null);
        const sizeVar = this._getSizeVar(this.size);
        const isDisabled = this.disabled;
        const showLabel = this.labelDisplay && !isIndeterminate;
        const labelText = this._getLabel();
        const ariaValue = this.value !== null ? this.value : undefined;

        this.shadowRoot.innerHTML =
            `<style>${this._buildStyleSheet(barColor, barTextColor, sizeVar, pct, isIndeterminate, isDisabled)}</style>` +
            this._buildHTML(pct, showLabel, labelText, isIndeterminate, ariaValue);
        this._autoHideHeader();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _autoHideHeader() {
        const header = this.shadowRoot.querySelector(".progress-header");
        const slot = header?.querySelector("slot");
        if (!slot || !header) return;

        const update = () => {
            const hasContent = slot
                .assignedNodes({ flatten: true })
                .some((n) => !(n.nodeType === Node.TEXT_NODE && n.textContent.trim() === ""));
            header.style.display = hasContent ? "" : "none";
        };

        slot.addEventListener("slotchange", update);
        update();
    }

    _buildHTML(pct, showLabel, labelText, isIndeterminate, ariaValue) {
        return `
            <div class="progress-wrapper">
                <div class="progress-header">
                    <span class="label"><slot></slot></span>
                </div>
                <div
                    class="track"
                    part="track"
                    role="progressbar"
                    aria-valuenow="${ariaValue !== undefined ? ariaValue : ""}"
                    aria-valuemin="${this.min}"
                    aria-valuemax="${this.max}"
                    ${isIndeterminate ? 'aria-busy="true"' : ""}
                >
                    ${showLabel ? `<span class="value-label value-label--track" part="value-label">${labelText}</span>` : ""}
                    <div class="bar" part="bar">
                        ${showLabel ? `<span class="value-label value-label--bar">${labelText}</span>` : ""}
                    </div>
                </div>
            </div>
        `;
    }

    _buildStyleSheet(barColor, barTextColor, sizeVar, pct, isIndeterminate, isDisabled) {
        return `
            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--base-content--);
                opacity: ${isDisabled ? "0.5" : "1"};
                pointer-events: ${isDisabled ? "none" : "auto"};
            }

            .progress-wrapper {
                display: flex;
                flex-direction: column;
                gap: var(--spacing-2x-small, 4px);
            }

            .progress-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: var(--font-size-label, 0.83em);
            }

            .label {
                color: var(--base-content--);
            }

            .track {
                position: relative;
                width: 100%;
                height: ${sizeVar};
                background: var(--base-background-component);
                border: var(--component-progress-border-width) solid var(--base-border);
                border-radius: var(--component-progress-border-radius-outer);
                overflow: hidden;
                box-sizing: border-box;
                padding: var(--component-progress-padding);
            }

            .bar {
                position: relative;
                height: 100%;
                background: ${barColor};
                border-radius: var(--component-progress-border-radius-inner);
                width: ${isIndeterminate ? "30%" : `${pct}%`};
                transition: ${isIndeterminate ? "none" : "width 0.3s ease"};
                overflow: hidden;
                ${isIndeterminate ? "animation: indeterminate 1.5s ease-in-out infinite;" : ""}
            }

            .value-label {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: var(--font-size-small, 0.75em);
                font-variant-numeric: tabular-nums;
                white-space: nowrap;
                pointer-events: none;
                font-weight: 600;
            }

            .value-label--track { color: ${barColor}; }
            .value-label--bar   { color: ${barTextColor}; width: calc(100% / (${pct || 1} / 100)); }

            @keyframes indeterminate {
                0%   { transform: translateX(0%); }
                50%  { transform: translateX(233%); }
                100% { transform: translateX(0%); }
            }
        `;
    }

    _getLabel() {
        if (this.indeterminate || this.value === null) return "";
        switch (this.labelFormat) {
            case "value":    return `${this.value} / ${this.max}`;
            case "fraction": return `${this.value - this.min} / ${this.max - this.min}`;
            case "percent":
            default:         return `${Math.round(this.percentage)}%`;
        }
    }

    _getSizeVar(size) {
        const map = {
            small: "var(--component-progress-size-small)",
            medium: "var(--component-progress-size-medium)",
            large: "var(--component-progress-size-large)",
        };
        return map[size] || map.medium;
    }
}

if (!customElements.get("y-progress")) {
    customElements.define("y-progress", YumeProgress);
}
