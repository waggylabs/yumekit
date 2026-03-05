export class YumeProgress extends HTMLElement {
    static get observedAttributes() {
        return [
            "value",
            "min",
            "max",
            "step",
            "size",
            "color",
            "label-display",
            "label-format",
            "indeterminate",
            "disabled",
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("min")) this.setAttribute("min", "0");
        if (!this.hasAttribute("max")) this.setAttribute("max", "100");
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    get value() {
        const val = parseFloat(this.getAttribute("value"));
        return Number.isNaN(val) ? null : val;
    }

    set value(val) {
        if (val === null || val === undefined) {
            this.removeAttribute("value");
        } else {
            this.setAttribute("value", String(val));
        }
    }

    get min() {
        return parseFloat(this.getAttribute("min")) || 0;
    }

    set min(val) {
        this.setAttribute("min", String(val));
    }

    get max() {
        return parseFloat(this.getAttribute("max")) || 100;
    }

    set max(val) {
        this.setAttribute("max", String(val));
    }

    get step() {
        const s = parseFloat(this.getAttribute("step"));
        return Number.isNaN(s) || s <= 0 ? null : s;
    }

    set step(val) {
        if (val === null || val === undefined) {
            this.removeAttribute("step");
        } else {
            this.setAttribute("step", String(val));
        }
    }

    get size() {
        return this.getAttribute("size") || "medium";
    }

    set size(val) {
        this.setAttribute("size", val);
    }

    get color() {
        return this.getAttribute("color") || "primary";
    }

    set color(val) {
        this.setAttribute("color", val);
    }

    get labelDisplay() {
        return this.getAttribute("label-display") !== "false";
    }

    set labelDisplay(val) {
        this.setAttribute("label-display", val ? "true" : "false");
    }

    get labelFormat() {
        return this.getAttribute("label-format") || "percent";
    }

    set labelFormat(val) {
        this.setAttribute("label-format", val);
    }

    get indeterminate() {
        return this.hasAttribute("indeterminate");
    }

    set indeterminate(val) {
        if (val) this.setAttribute("indeterminate", "");
        else this.removeAttribute("indeterminate");
    }

    get disabled() {
        return this.hasAttribute("disabled");
    }

    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /**
     * Increment the progress value by the step amount (or 1 if no step).
     */
    increment() {
        if (this.value === null) return;
        const s = this.step || 1;
        this.value = Math.min(this.value + s, this.max);
    }

    /**
     * Decrement the progress value by the step amount (or 1 if no step).
     */
    decrement() {
        if (this.value === null) return;
        const s = this.step || 1;
        this.value = Math.max(this.value - s, this.min);
    }

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

    getBarColorVars(color) {
        const colorMap = {
            primary: [
                "var(--primary-content--)",
                "var(--primary-content-inverse)",
            ],
            secondary: [
                "var(--secondary-content--)",
                "var(--secondary-content-inverse)",
            ],
            base: ["var(--base-content--)", "var(--base-content-inverse)"],
            success: [
                "var(--success-content--)",
                "var(--success-content-inverse)",
            ],
            warning: [
                "var(--warning-content--)",
                "var(--warning-content-inverse)",
            ],
            error: ["var(--error-content--)", "var(--error-content-inverse)"],
            help: ["var(--help-content--)", "var(--help-content-inverse)"],
        };
        return colorMap[color] || [color, "var(--base-content-inverse)"];
    }

    getSizeVar(size) {
        const map = {
            small: "var(--component-progress-size-small)",
            medium: "var(--component-progress-size-medium)",
            large: "var(--component-progress-size-large)",
        };
        return map[size] || map.medium;
    }

    getLabel() {
        if (this.indeterminate) return "";
        if (this.value === null) return "";

        switch (this.labelFormat) {
            case "value":
                return `${this.value} / ${this.max}`;
            case "fraction":
                return `${this.value - this.min} / ${this.max - this.min}`;
            case "percent":
            default:
                return `${Math.round(this.percentage)}%`;
        }
    }

    render() {
        const isIndeterminate = this.indeterminate;
        const pct = this.percentage;
        const [barColor, barTextColor] = this.getBarColorVars(this.color);
        const sizeVar = this.getSizeVar(this.size);
        const isDisabled = this.disabled;
        const showLabel = this.labelDisplay && !isIndeterminate;
        const labelText = this.getLabel();
        const ariaValue = this.value !== null ? this.value : undefined;

        this.shadowRoot.innerHTML = `
            <style>
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
                    border: var(--component-progress-border-width) solid var(--base-background-border);
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
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: var(--font-size-small, 0.75em);
                    font-variant-numeric: tabular-nums;
                    white-space: nowrap;
                    pointer-events: none;
                    font-weight: 600;
                }

                .value-label--track {
                    color: ${barColor};
                }

                .value-label--bar {
                    color: ${barTextColor};
                    width: calc(100% / (${pct || 1} / 100));
                }

                @keyframes indeterminate {
                    0% {
                        transform: translateX(0%);
                    }
                    50% {
                        transform: translateX(233%);
                    }
                    100% {
                        transform: translateX(0%);
                    }
                }
            </style>

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
                    <div class="bar" part="bar">${showLabel ? `<span class="value-label value-label--bar">${labelText}</span>` : ""}</div>
                </div>
            </div>
        `;
    }
}

if (!customElements.get("y-progress")) {
    customElements.define("y-progress", YumeProgress);
}
