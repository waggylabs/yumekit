import { resolveCSSColor, contrastTextColor } from "../modules/helpers.js";

export class YumeTooltip extends HTMLElement {
    static get observedAttributes() {
        return ["text", "position", "delay", "color"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._showTimeout = null;
        this._hideTimeout = null;
        this._visible = false;
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onFocusIn = this._onFocusIn.bind(this);
        this._onFocusOut = this._onFocusOut.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
    }

    connectedCallback() {
        this.render();
        this.addEventListener("mouseenter", this._onMouseEnter);
        this.addEventListener("mouseleave", this._onMouseLeave);
        this.addEventListener("focusin", this._onFocusIn);
        this.addEventListener("focusout", this._onFocusOut);
        document.addEventListener("keydown", this._onKeyDown);
    }

    disconnectedCallback() {
        this.removeEventListener("mouseenter", this._onMouseEnter);
        this.removeEventListener("mouseleave", this._onMouseLeave);
        this.removeEventListener("focusin", this._onFocusIn);
        this.removeEventListener("focusout", this._onFocusOut);
        document.removeEventListener("keydown", this._onKeyDown);
        clearTimeout(this._showTimeout);
        clearTimeout(this._hideTimeout);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        this.render();
    }

    get text() {
        return this.getAttribute("text") || "";
    }
    set text(val) {
        this.setAttribute("text", val);
    }

    get position() {
        return this.getAttribute("position") || "top";
    }
    set position(val) {
        this.setAttribute("position", val);
    }

    get delay() {
        return parseInt(this.getAttribute("delay") ?? "200", 10);
    }
    set delay(val) {
        this.setAttribute("delay", String(val));
    }

    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    show() {
        clearTimeout(this._hideTimeout);
        this._showTimeout = setTimeout(() => {
            this._visible = true;
            const tip = this.shadowRoot.querySelector(".tooltip");
            if (tip) {
                const bg = this._getBg();
                const resolvedBg = resolveCSSColor(bg, this);
                tip.style.color = contrastTextColor(resolvedBg);
                tip.classList.add("visible");
            }
        }, this.delay);
    }

    hide() {
        clearTimeout(this._showTimeout);
        this._visible = false;
        const tip = this.shadowRoot.querySelector(".tooltip");
        if (tip) tip.classList.remove("visible");
    }

    _onMouseEnter() {
        this.show();
    }
    _onMouseLeave() {
        this.hide();
    }
    _onFocusIn() {
        this.show();
    }
    _onFocusOut() {
        this.hide();
    }
    _onKeyDown(e) {
        if (e.key === "Escape" && this._visible) {
            this.hide();
        }
    }

    _getBg() {
        const map = {
            base: "var(--base-content--, #555)",
            primary: "var(--primary-content--, #0070f3)",
            secondary: "var(--secondary-content--, #6c757d)",
            success: "var(--success-content--, #28a745)",
            warning: "var(--warning-content--, #ffc107)",
            error: "var(--error-content--, #dc3545)",
            help: "var(--help-content--, #6f42c1)",
        };
        return map[this.color] || map.base;
    }

    render() {
        const pos = this.position;
        const bg = this._getBg();
        const resolvedBg = resolveCSSColor(bg, this);
        const fg = contrastTextColor(resolvedBg);

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    position: relative;
                    font-family: var(--font-family-body, sans-serif);
                }

                .trigger {
                    display: inline-block;
                }

                .tooltip {
                    position: absolute;
                    z-index: var(--component-tooltip-z-index, 7000);
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transform: scale(0.95);
                    transition: opacity 0.15s ease, transform 0.15s ease;
                    padding: var(--component-tooltip-padding, var(--spacing-x-small, 4px)) var(--component-tooltip-padding-h, var(--spacing-medium, 8px));
                    border-radius: var(--component-tooltip-border-radius, var(--radii-small, 4px));
                    font-size: var(--font-size-small, 0.8em);
                    background: ${bg};
                    color: ${fg};
                    line-height: 1.4;
                }

                .tooltip.visible {
                    opacity: 1;
                    transform: scale(1);
                }

                .tooltip::after {
                    content: "";
                    position: absolute;
                    border: 5px solid transparent;
                }

                .tooltip.top {
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) scale(0.95);
                    margin-bottom: 6px;
                }
                .tooltip.top.visible {
                    transform: translateX(-50%) scale(1);
                }
                .tooltip.top::after {
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-top-color: ${bg};
                }

                .tooltip.bottom {
                    top: 100%;
                    left: 50%;
                    transform: translateX(-50%) scale(0.95);
                    margin-top: 6px;
                }
                .tooltip.bottom.visible {
                    transform: translateX(-50%) scale(1);
                }
                .tooltip.bottom::after {
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    border-bottom-color: ${bg};
                }

                .tooltip.left {
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%) scale(0.95);
                    margin-right: 6px;
                }
                .tooltip.left.visible {
                    transform: translateY(-50%) scale(1);
                }
                .tooltip.left::after {
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border-left-color: ${bg};
                }

                .tooltip.right {
                    left: 100%;
                    top: 50%;
                    transform: translateY(-50%) scale(0.95);
                    margin-left: 6px;
                }
                .tooltip.right.visible {
                    transform: translateY(-50%) scale(1);
                }
                .tooltip.right::after {
                    right: 100%;
                    top: 50%;
                    transform: translateY(-50%);
                    border-right-color: ${bg};
                }
            </style>
            <slot class="trigger"></slot>
            <div class="tooltip ${pos}" role="tooltip" part="tooltip">${this.text}</div>
        `;
    }
}

if (!customElements.get("y-tooltip")) {
    customElements.define("y-tooltip", YumeTooltip);
}
