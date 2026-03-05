export class YumeToast extends HTMLElement {
    static get observedAttributes() {
        return ["position", "duration", "max"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._queue = [];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        this.render();
    }

    get position() {
        return this.getAttribute("position") || "bottom-right";
    }
    set position(val) {
        this.setAttribute("position", val);
    }

    get duration() {
        return parseInt(this.getAttribute("duration") ?? "4000", 10);
    }
    set duration(val) {
        this.setAttribute("duration", String(val));
    }

    get max() {
        return parseInt(this.getAttribute("max") ?? "5", 10);
    }
    set max(val) {
        this.setAttribute("max", String(val));
    }

    /**
     * Show a toast notification.
     * @param {Object} opts
     * @param {string} opts.message  — Required text content.
     * @param {string} [opts.color]  — base|primary|secondary|success|warning|error|help (default base).
     * @param {number} [opts.duration] — Override container-level duration for this toast.
     * @param {boolean} [opts.dismissible] — Show a close button (default true).
     * @param {string} [opts.icon] — Optional y-icon name e.g. "checkmark".
     * @returns {HTMLElement} The toast element (for manual removal).
     */
    show(opts = {}) {
        const {
            message = "",
            color = "base",
            duration = this.duration,
            dismissible = true,
            icon = null,
        } = opts;

        const container = this.shadowRoot.querySelector(".toast-container");
        if (!container) return null;

        const existing = container.querySelectorAll(".toast");
        if (existing.length >= this.max) {
            this._removeToast(existing[0]);
        }

        const toast = document.createElement("div");
        toast.className = `toast color-${color}`;
        toast.setAttribute("role", "alert");
        toast.setAttribute("aria-live", "assertive");
        toast.setAttribute("part", "toast");

        const [bg, fg] = this._getColorVars(color);
        toast.style.backgroundColor = bg;
        toast.style.color = fg;

        if (icon) {
            const iconEl = document.createElement("y-icon");
            iconEl.setAttribute("name", icon);
            iconEl.setAttribute("size", "small");
            iconEl.className = "toast-icon";
            iconEl.setAttribute("part", "icon");
            toast.appendChild(iconEl);
        }

        const msg = document.createElement("span");
        msg.className = "toast-message";
        msg.setAttribute("part", "message");
        msg.textContent = message;
        toast.appendChild(msg);

        if (dismissible) {
            const btn = document.createElement("button");
            btn.className = "toast-close";
            btn.setAttribute("aria-label", "Dismiss");
            btn.innerHTML = "&#215;";
            btn.addEventListener("click", () => this._removeToast(toast));
            toast.appendChild(btn);
        }

        container.appendChild(toast);

        // Trigger enter animation (next frame)
        requestAnimationFrame(() => {
            toast.classList.add("visible");
        });

        if (duration > 0) {
            toast._timeout = setTimeout(
                () => this._removeToast(toast),
                duration,
            );
        }

        this.dispatchEvent(
            new CustomEvent("y-toast-show", {
                detail: { message, color },
                bubbles: true,
            }),
        );

        return toast;
    }

    clear() {
        const container = this.shadowRoot.querySelector(".toast-container");
        if (!container) return;
        container
            .querySelectorAll(".toast")
            .forEach((t) => this._removeToast(t));
    }

    _removeToast(toast) {
        if (!toast || toast._removing) return;
        toast._removing = true;
        clearTimeout(toast._timeout);
        toast.classList.remove("visible");
        toast.classList.add("exit");
        toast.addEventListener(
            "transitionend",
            () => {
                toast.remove();
                this.dispatchEvent(
                    new CustomEvent("y-toast-dismiss", { bubbles: true }),
                );
            },
            { once: true },
        );
        // Fallback if transition doesn't fire
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 350);
    }

    _getPositionStyles() {
        const pos = this.position;
        const base = `position: fixed; z-index: var(--component-toast-z-index, 9000); display: flex; flex-direction: column; gap: var(--spacing-small, 6px); pointer-events: none; max-width: 420px; min-width: 280px;`;
        const pad = `var(--component-toast-offset, var(--spacing-x-large, 16px))`;

        const map = {
            "top-right": `${base} top: ${pad}; right: ${pad}; align-items: flex-end;`,
            "top-left": `${base} top: ${pad}; left: ${pad}; align-items: flex-start;`,
            "top-center": `${base} top: ${pad}; left: 50%; transform: translateX(-50%); align-items: center;`,
            "bottom-right": `${base} bottom: ${pad}; right: ${pad}; align-items: flex-end;`,
            "bottom-left": `${base} bottom: ${pad}; left: ${pad}; align-items: flex-start;`,
            "bottom-center": `${base} bottom: ${pad}; left: 50%; transform: translateX(-50%); align-items: center;`,
        };

        return map[pos] || map["bottom-right"];
    }

    _getColorVars(color) {
        const map = {
            base: ["var(--base-content--)", "var(--base-content-inverse)"],
            primary: [
                "var(--primary-content--)",
                "var(--primary-content-inverse)",
            ],
            secondary: [
                "var(--secondary-content--)",
                "var(--secondary-content-inverse)",
            ],
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
        return map[color] || map.base;
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    font-family: var(--font-family-body, sans-serif);
                }

                .toast-container {
                    ${this._getPositionStyles()}
                }

                .toast {
                    pointer-events: auto;
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-medium, 8px);
                    padding: var(--component-toast-padding, var(--spacing-medium, 8px));
                    border-radius: var(--component-toast-border-radius, var(--radii-small, 4px));
                    font-size: var(--font-size-paragraph, 1em);
                    line-height: 1.4;
                    opacity: 0;
                    transform: translateY(8px);
                    transition: opacity 0.25s ease, transform 0.25s ease;
                    box-shadow: var(--base-shadow, 0 2px 6px rgba(0,0,0,0.15));
                }

                .toast.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .toast.exit {
                    opacity: 0;
                    transform: translateY(-8px);
                }

                .toast-icon {
                    flex-shrink: 0;
                    font-size: 1.1em;
                }

                .toast-message {
                    flex: 1;
                }

                .toast-close {
                    flex-shrink: 0;
                    align-self: flex-start;
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.2em;
                    cursor: pointer;
                    padding: 0 0 0 var(--spacing-small, 6px);
                    opacity: 0.7;
                    line-height: 1;
                }
                .toast-close:hover {
                    opacity: 1;
                }
            </style>
            <div class="toast-container"></div>
        `;
    }
}

if (!customElements.get("y-toast")) {
    customElements.define("y-toast", YumeToast);
}
