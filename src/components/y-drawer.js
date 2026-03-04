import { gripDots } from "../icons/index.js";

class YumeDrawer extends HTMLElement {
    static get observedAttributes() {
        return ["visible", "anchor", "position", "resizable"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._onAnchorClick = this._onAnchorClick.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onResizePointerDown = this._onResizePointerDown.bind(this);
        this._onResizePointerMove = this._onResizePointerMove.bind(this);
        this._onResizePointerUp = this._onResizePointerUp.bind(this);
    }

    connectedCallback() {
        this.render();
        this._setupAnchor();
        if (this.visible) this._show();
    }

    disconnectedCallback() {
        this._teardownAnchor();
        document.removeEventListener("keydown", this._onKeyDown);
        this._cleanupResize();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "visible") {
            this.visible ? this._show() : this._hide();
        }
        if (name === "anchor") {
            this._teardownAnchor();
            this._setupAnchor();
        }
        if (name === "position") {
            this._applyPosition();
        }
        if (name === "resizable") {
            this._applyResizable();
        }
    }

    get visible() {
        return this.hasAttribute("visible");
    }
    set visible(val) {
        if (val) this.setAttribute("visible", "");
        else this.removeAttribute("visible");
    }

    get anchor() {
        return this.getAttribute("anchor");
    }
    set anchor(id) {
        this.setAttribute("anchor", id);
    }

    /**
     * Which edge the drawer slides in from.
     * Accepted values: "left" | "right" | "top" | "bottom" (default "left").
     */
    get position() {
        return this.getAttribute("position") || "left";
    }
    set position(val) {
        this.setAttribute("position", val);
    }

    get resizable() {
        return this.hasAttribute("resizable");
    }
    set resizable(val) {
        if (val) this.setAttribute("resizable", "");
        else this.removeAttribute("resizable");
    }

    _setupAnchor() {
        const id = this.anchor;
        if (id) {
            const el = document.getElementById(id);
            if (el) {
                this._anchorEl = el;
                this._anchorEl.addEventListener("click", this._onAnchorClick);
            }
        }
    }

    _teardownAnchor() {
        if (this._anchorEl) {
            this._anchorEl.removeEventListener("click", this._onAnchorClick);
            this._anchorEl = null;
        }
    }

    _onAnchorClick() {
        this.visible = !this.visible;
    }

    _show() {
        this.style.display = "block";
        // Force a reflow so the browser registers the initial state
        this.offsetHeight; // eslint-disable-line no-unused-expressions

        const overlay = this.shadowRoot.querySelector(".overlay");
        const panel = this.shadowRoot.querySelector(".drawer-panel");

        if (overlay) overlay.classList.add("open");
        if (panel) {
            panel.classList.add("open");
            panel.focus();
        }

        document.addEventListener("keydown", this._onKeyDown);
    }

    _hide() {
        const overlay = this.shadowRoot.querySelector(".overlay");
        const panel = this.shadowRoot.querySelector(".drawer-panel");

        if (overlay) overlay.classList.remove("open");
        if (panel) panel.classList.remove("open");

        document.removeEventListener("keydown", this._onKeyDown);

        const duration = this._getTransitionDuration(panel);
        if (duration > 0) {
            clearTimeout(this._hideTimer);
            this._hideTimer = setTimeout(() => {
                if (!this.visible) this.style.display = "none";
            }, duration);
        } else {
            this.style.display = "none";
        }
    }

    _getTransitionDuration(el) {
        if (!el) return 0;
        const style = getComputedStyle(el);
        const raw = style.transitionDuration || "0s";
        const seconds = parseFloat(raw);
        return isNaN(seconds) ? 0 : seconds * 1000;
    }

    _onKeyDown(e) {
        if (e.key === "Escape" && this.visible) {
            this.visible = false;
        }
    }

    _onOverlayClick() {
        this.visible = false;
    }

    _applyPosition() {
        const panel = this.shadowRoot.querySelector(".drawer-panel");
        if (!panel) return;
        panel.setAttribute("data-position", this.position);
    }

    _applyResizable() {
        const handle = this.shadowRoot.querySelector(".resize-handle");
        if (!handle) return;
        handle.style.display = this.resizable ? "flex" : "none";
    }

    _isHorizontal() {
        return this.position === "left" || this.position === "right";
    }

    _onResizePointerDown(e) {
        e.preventDefault();
        this._resizing = true;
        this._startPointer = this._isHorizontal() ? e.clientX : e.clientY;
        const panel = this.shadowRoot.querySelector(".drawer-panel");
        this._startSize = this._isHorizontal()
            ? panel.offsetWidth
            : panel.offsetHeight;

        panel.style.transition = "none";
        document.addEventListener("pointermove", this._onResizePointerMove);
        document.addEventListener("pointerup", this._onResizePointerUp);
    }

    _onResizePointerMove(e) {
        if (!this._resizing) return;
        const panel = this.shadowRoot.querySelector(".drawer-panel");
        const current = this._isHorizontal() ? e.clientX : e.clientY;
        const delta = current - this._startPointer;
        let newSize;

        if (this.position === "left") newSize = this._startSize + delta;
        else if (this.position === "right") newSize = this._startSize - delta;
        else if (this.position === "top") newSize = this._startSize + delta;
        else newSize = this._startSize - delta;

        const minSize = 100;
        newSize = Math.max(minSize, newSize);

        if (this._isHorizontal()) {
            panel.style.width = `${newSize}px`;
        } else {
            panel.style.height = `${newSize}px`;
        }
    }

    _onResizePointerUp() {
        this._resizing = false;
        const panel = this.shadowRoot.querySelector(".drawer-panel");
        if (panel) panel.style.transition = "";
        document.removeEventListener("pointermove", this._onResizePointerMove);
        document.removeEventListener("pointerup", this._onResizePointerUp);
    }

    _cleanupResize() {
        document.removeEventListener("pointermove", this._onResizePointerMove);
        document.removeEventListener("pointerup", this._onResizePointerUp);
    }

    _gripSVG() {
        return gripDots(this._isHorizontal());
    }

    render() {
        this.shadowRoot.innerHTML = "";

        const style = document.createElement("style");
        style.textContent = `
            :host {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                display: none;
                z-index: 10000;
            }
            :host([visible]) {
                display: block;
            }

            .overlay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0);
                transition: background var(--drawer-transition-duration, 0.3s) ease;
            }
            .overlay.open {
                background: rgba(0, 0, 0, 0.4);
            }

            .drawer-panel {
                position: absolute;
                background: var(--component-drawer-background, #0c0c0d);
                color: var(--component-drawer-color, #f7f7fa);
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                outline: none;
                display: flex;
                flex-direction: column;
                border: none;
                border-radius: var(--component-drawer-border-radius, 0);
                transition: transform var(--drawer-transition-duration, 0.3s) ease;
            }

            .drawer-panel[data-position="left"],
            .drawer-panel[data-position="right"] {
                top: 0;
                bottom: 0;
                width: var(--drawer-width, 300px);
                flex-direction: row;
            }
            .drawer-panel[data-position="left"] {
                left: 0;
                transform: translateX(-100%);
                border-right: var(--component-drawer-border-width, 2px) solid var(--component-drawer-border-color, #37383a);
            }
            .drawer-panel[data-position="right"] {
                right: 0;
                transform: translateX(100%);
                border-left: var(--component-drawer-border-width, 2px) solid var(--component-drawer-border-color, #37383a);
            }

            .drawer-panel[data-position="top"],
            .drawer-panel[data-position="bottom"] {
                left: 0;
                right: 0;
                height: var(--drawer-height, 300px);
            }
            .drawer-panel[data-position="top"] {
                top: 0;
                transform: translateY(-100%);
                border-bottom: var(--component-drawer-border-width, 2px) solid var(--component-drawer-border-color, #37383a);
            }
            .drawer-panel[data-position="bottom"] {
                bottom: 0;
                transform: translateY(100%);
                border-top: var(--component-drawer-border-width, 2px) solid var(--component-drawer-border-color, #37383a);
            }

            .drawer-panel.open { transform: translate(0, 0); }

            .drawer-header {
                padding: var(--component-drawer-padding, 1rem);
                font-weight: bold;
            }
            .drawer-body {
                padding: var(--component-drawer-padding, 1rem);
                flex: 1;
                overflow: auto;
            }
            .drawer-footer {
                padding: var(--component-drawer-padding, 1rem);
            }

            /* Wrapper so header/body/footer stack vertically inside a row layout */
            .drawer-content {
                display: flex;
                flex-direction: column;
                flex: 1;
                min-width: 0;
                min-height: 0;
                overflow: hidden;
            }

            ::slotted(*) {
                margin: 0;
            }

            .resize-handle {
                display: none;              /* hidden until resizable attr */
                flex-shrink: 0;
                align-items: center;
                justify-content: center;
                color: var(--component-drawer-color, #f7f7fa);
                opacity: 0.6;
                touch-action: none;         /* needed for pointer events */
                user-select: none;
                transition: opacity 0.15s, background 0.15s;
            }
            .resize-handle:hover,
            .resize-handle:active {
                opacity: 1;
                background: var(--component-drawer-hover-background, #292a2b);
            }

            .drawer-panel[data-position="left"] > .resize-handle,
            .drawer-panel[data-position="right"] > .resize-handle {
                width: var(--component-drawer-handle-width, 6px);
                padding: var(--component-drawer-handle-padding, 4px);
                cursor: ew-resize;
            }
            .drawer-panel[data-position="left"] > .resize-handle {
                order: 99;
            }
            .drawer-panel[data-position="right"] > .resize-handle {
                order: -1;
            }

            .drawer-panel[data-position="top"] > .resize-handle,
            .drawer-panel[data-position="bottom"] > .resize-handle {
                height: var(--component-drawer-handle-width, 6px);
                padding: var(--component-drawer-handle-padding, 4px);
                cursor: ns-resize;
            }
            .drawer-panel[data-position="top"] > .resize-handle {
                order: 99;
            }
            .drawer-panel[data-position="bottom"] > .resize-handle {
                order: -1;
            }
        `;
        this.shadowRoot.appendChild(style);

        const overlay = document.createElement("div");
        overlay.className = "overlay";
        overlay.setAttribute("part", "overlay");
        overlay.addEventListener("click", () => this._onOverlayClick());
        this.shadowRoot.appendChild(overlay);

        const panel = document.createElement("div");
        panel.className = "drawer-panel";
        panel.setAttribute("role", "dialog");
        panel.setAttribute("aria-modal", "true");
        panel.setAttribute("tabindex", "-1");
        panel.setAttribute("part", "panel");
        panel.setAttribute("data-position", this.position);

        const handle = document.createElement("div");
        handle.className = "resize-handle";
        handle.innerHTML = this._gripSVG();
        handle.style.display = this.resizable ? "flex" : "none";
        handle.addEventListener("pointerdown", this._onResizePointerDown);
        panel.appendChild(handle);

        const content = document.createElement("div");
        content.className = "drawer-content";

        const header = document.createElement("div");
        header.className = "drawer-header";
        header.setAttribute("part", "header");
        header.innerHTML = `<slot name="header"></slot>`;

        const body = document.createElement("div");
        body.className = "drawer-body";
        body.setAttribute("part", "body");
        body.innerHTML = `<slot name="body"></slot>`;

        const footer = document.createElement("div");
        footer.className = "drawer-footer";
        footer.setAttribute("part", "footer");
        footer.innerHTML = `<slot name="footer"></slot>`;

        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);
        panel.appendChild(content);
        this.shadowRoot.appendChild(panel);

        if (this.visible) {
            requestAnimationFrame(() => {
                overlay.classList.add("open");
                panel.classList.add("open");
            });
        }
    }
}

if (!customElements.get("y-drawer")) {
    customElements.define("y-drawer", YumeDrawer);
}
