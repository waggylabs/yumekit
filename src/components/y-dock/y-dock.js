import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";

export class YumeDock extends HTMLElement {
    static get observedAttributes() {
        return ["items", "position", "breakpoint", "size", "history"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._mediaQuery = null;
        this._onMediaChange = this._onMediaChange.bind(this);
    }

    connectedCallback() {
        if (!this.hasAttribute("position"))
            this.setAttribute("position", "bottom");
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");

        this.setAttribute("role", "navigation");
        this.setAttribute("aria-label", "Dock navigation");
        this.render();
        this._setupBreakpoint();
    }

    disconnectedCallback() {
        this._teardownBreakpoint();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "breakpoint") {
            this._teardownBreakpoint();
            this._setupBreakpoint();
        }
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Viewport width below which dock is visible (px). When omitted, always visible. */
    get breakpoint() {
        const val = this.getAttribute("breakpoint");
        return val ? Number(val) : null;
    }
    set breakpoint(val) {
        if (val == null) this.removeAttribute("breakpoint");
        else this.setAttribute("breakpoint", String(val));
    }

    /** Navigation mode. Omit for pushState SPA navigation; set to "false" for full-page navigation. */
    get history() {
        return this.getAttribute("history");
    }
    set history(val) {
        if (val == null) this.removeAttribute("history");
        else this.setAttribute("history", val);
    }

    /** Navigation items as a JSON array. */
    get items() {
        try {
            return JSON.parse(this.getAttribute("items") || "[]");
        } catch {
            return [];
        }
    }
    set items(val) {
        this.setAttribute("items", JSON.stringify(val));
    }

    /** Which edge of the viewport the dock anchors to. */
    get position() {
        const pos = this.getAttribute("position");
        return pos === "top" ? "top" : "bottom";
    }
    set position(val) {
        this.setAttribute("position", val === "top" ? "top" : "bottom");
    }

    /** Controls icon size, label font size, and overall dock height. */
    get size() {
        const sz = this.getAttribute("size");
        return ["small", "medium", "large"].includes(sz) ? sz : "medium";
    }
    set size(val) {
        this.setAttribute(
            "size",
            ["small", "medium", "large"].includes(val) ? val : "medium",
        );
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Rebuilds the shadow DOM. */
    render() {
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(this._buildStyles());
        this.shadowRoot.appendChild(this._buildBar());
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildBar() {
        const bar = _el("div", { class: "bar", part: "bar" });

        this.items.forEach((item) => bar.appendChild(this._buildItem(item)));
        bar.appendChild(_el("slot", {}));

        this._setupItemKeyboard(bar);

        return bar;
    }

    _buildItem(item) {
        if (item.slot && this.querySelector(`[slot="${item.slot}"]`)) {
            const wrapper = _el("div", { class: "item", part: "item" });
            wrapper.appendChild(_el("slot", { name: item.slot }));
            return wrapper;
        }

        const btn = _el("button", {
            class: "item",
            part: "item",
            "aria-label": item.name,
        });

        if (item.selected) btn.setAttribute("aria-current", "page");
        if (item.href) btn.dataset.href = item.href;

        const iconSize = { small: "medium", medium: "large", large: "x-large" }[
            this.size
        ];
        const icon = _el("y-icon", {
            name: item.icon,
            size: iconSize,
        });
        btn.appendChild(icon);

        const label = _el("span", { class: "item-label" }, [item.name]);
        btn.appendChild(label);

        btn.addEventListener("click", () => this._handleItemClick(item));

        return btn;
    }

    _buildStyles() {
        const style = document.createElement("style");
        const pos = this.position;
        const sz = this.size;
        const heightVar = `var(--component-dock-height, var(--component-dock-height-${sz}))`;
        const fontSize =
            sz === "small" ? "10px" : sz === "large" ? "13px" : "11px";
        style.textContent = `
            :host {
                display: block;
                position: fixed;
                ${pos === "top" ? "top: 0;" : "bottom: 0;"}
                left: 0;
                right: 0;
                z-index: var(--component-dock-z-index, 8000);
                ${
                    pos === "bottom"
                        ? "padding-bottom: env(safe-area-inset-bottom, 0px);"
                        : "padding-top: env(safe-area-inset-top, 0px);"
                }
                background: var(--component-dock-background);
                ${
                    pos === "bottom"
                        ? `border-top: var(--component-dock-border-width, 1px) solid var(--component-dock-border-color);`
                        : `border-bottom: var(--component-dock-border-width, 1px) solid var(--component-dock-border-color);`
                }
            }
            :host([hidden]) {
                display: none !important;
            }
            .bar {
                display: flex;
                align-items: center;
                justify-content: space-around;
                height: ${heightVar};
                position: relative;
            }
            .item {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                background: none;
                border: none;
                padding: 4px 8px;
                cursor: pointer;
                color: var(--component-dock-color);
                font-family: inherit;
                font-size: ${fontSize};
                min-width: 48px;
                outline: none;
                transition: color 0.15s ease;
                -webkit-tap-highlight-color: transparent;
            }
            .item:focus-visible {
                outline: 2px solid var(--component-dock-color-active);
                outline-offset: -2px;
                border-radius: 4px;
            }
            .item[aria-current="page"],
            .item:hover {
                color: var(--component-dock-color-active);
            }
            .item-label {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 64px;
            }
            ::slotted(*) {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                color: var(--component-dock-color);
                min-width: 48px;
            }
        `;
        return style;
    }

    _handleItemClick(item) {
        if (!item.href) return;

        const event = new CustomEvent("navigate", {
            detail: { href: item.href },
            bubbles: true,
            composed: true,
            cancelable: true,
        });

        if (!this.dispatchEvent(event)) return;

        if (this.history === "false") {
            window.location.href = item.href;
        } else {
            window.history.pushState({}, "", item.href);
            window.dispatchEvent(new PopStateEvent("popstate"));
        }
    }

    _onMediaChange(e) {
        this.hidden = !e.matches;
    }

    _setupBreakpoint() {
        const bp = this.breakpoint;
        if (bp == null) {
            this.hidden = false;
            return;
        }

        this._mediaQuery = window.matchMedia(`(max-width: ${bp}px)`);
        this._mediaQuery.addEventListener("change", this._onMediaChange);
        this.hidden = !this._mediaQuery.matches;
    }

    _setupItemKeyboard(bar) {
        const getItems = () => Array.from(bar.querySelectorAll(".item"));

        bar.addEventListener("keydown", (e) => {
            const items = getItems();
            const idx = items.indexOf(e.target);
            if (idx === -1) return;

            if (e.key === "ArrowRight") {
                e.preventDefault();
                const next = items[(idx + 1) % items.length];
                next.focus();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                const prev = items[(idx - 1 + items.length) % items.length];
                prev.focus();
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.target.click();
            }
        });
    }

    _teardownBreakpoint() {
        if (this._mediaQuery) {
            this._mediaQuery.removeEventListener("change", this._onMediaChange);
            this._mediaQuery = null;
        }
    }
}

if (!customElements.get("y-dock")) {
    customElements.define("y-dock", YumeDock);
}
