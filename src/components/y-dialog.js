class YumeDialog extends HTMLElement {
    static get observedAttributes() {
        return ["visible", "anchor", "closable", "show-backdrop", "animate", "position"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onAnchorClick = this.onAnchorClick.bind(this);
    }

    connectedCallback() {
        this.render();
        this.setupAnchor();
        if (this.visible) this.show();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "visible") {
            this.visible ? this.show() : this.hide();
        }
        if (name === "anchor") {
            this.setupAnchor();
        }
        if (name === "closable") {
            this.render();
        }
    }

    /** Whether the dialog is currently displayed. */
    get visible() {
        return this.hasAttribute("visible");
    }

    set visible(val) {
        if (val) this.setAttribute("visible", "");
        else this.removeAttribute("visible");
    }

    /** The id of the element that toggles this dialog on click. */
    get anchor() {
        return this.getAttribute("anchor");
    }

    set anchor(id) {
        this.setAttribute("anchor", id);
    }

    /** Whether the dialog renders a close button in the header. */
    get closable() {
        return this.hasAttribute("closable");
    }
    set closable(val) {
        if (val) this.setAttribute("closable", "");
        else this.removeAttribute("closable");
    }

    /** Whether to apply a blurred backdrop behind the dialog. */
    get showBackdrop() {
        return this.hasAttribute("show-backdrop");
    }
    set showBackdrop(val) {
        if (val) this.setAttribute("show-backdrop", "");
        else this.removeAttribute("show-backdrop");
    }

    /** Whether the dialog uses an entrance animation. */
    get animate() {
        return this.hasAttribute("animate");
    }
    set animate(val) {
        if (val) this.setAttribute("animate", "");
        else this.removeAttribute("animate");
    }

    /** Screen position of the dialog. One of: center (default), top-left, top-center, top-right, left, right, bottom-left, bottom-center, bottom-right. */
    get position() {
        return this.getAttribute("position") || "center";
    }
    set position(val) {
        this.setAttribute("position", val);
    }

    /** Opens the dialog and focuses it. */
    show() {
        if (!this.shadowRoot.querySelector(".dialog")) {
            this.render();
        }

        document.addEventListener("keydown", this.onKeyDown);

        const dialog = this.shadowRoot.querySelector(".dialog");
        if (dialog && typeof dialog.focus === "function") {
            dialog.focus();
        }
    }

    /** Closes the dialog. */
    hide() {
        document.removeEventListener("keydown", this.onKeyDown);
    }

    setupAnchor() {
        if (this._anchorEl) {
            this._anchorEl.removeEventListener("click", this.onAnchorClick);
        }
        if (this.anchor) {
            const el = document.getElementById(this.anchor);
            if (el) {
                this._anchorEl = el;
                this._anchorEl.addEventListener("click", this.onAnchorClick);
            }
        }
    }

    onAnchorClick() {
        this.visible = !this.visible;
    }

    onKeyDown(e) {
        if (e.key === "Escape" && this.visible) {
            this.visible = false;
        }
    }

    render() {
        const style = document.createElement("style");
        style.textContent = `
            :host {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: var(--component-dialog-z-index, 1000);
                padding: var(--component-dialog-offset, 16px);
                box-sizing: border-box;
            }
            :host([visible]) {
                display: flex;
                pointer-events: none;
            }
            :host([visible]) .dialog {
                pointer-events: auto;
            }
            :host([visible][show-backdrop]) {
                pointer-events: auto;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(var(--component-dialog-backdrop-blur, 4px));
                -webkit-backdrop-filter: blur(var(--component-dialog-backdrop-blur, 4px));
            }

            :host([position="top-left"])      { align-items: flex-start; justify-content: flex-start; }
            :host([position="top-center"])    { align-items: flex-start; justify-content: center; }
            :host([position="top-right"])     { align-items: flex-start; justify-content: flex-end; }
            :host([position="left"])          { align-items: center;     justify-content: flex-start; }
            :host([position="right"])         { align-items: center;     justify-content: flex-end; }
            :host([position="bottom-left"])   { align-items: flex-end;   justify-content: flex-start; }
            :host([position="bottom-center"]) { align-items: flex-end;   justify-content: center; }
            :host([position="bottom-right"])  { align-items: flex-end;   justify-content: flex-end; }

            @keyframes dialog-fade-in {
                from { opacity: 0; transform: translateY(16px) scale(0.97); }
                to   { opacity: 1; transform: translateY(0) scale(1); }
            }

            .dialog {
                background: var(--component-dialog-background);
                border: var(--component-dialog-border-width, 1px) solid var(--component-dialog-border-color);
                border-radius: var(--component-dialog-border-radius-outer, 4px);
                max-width: 90%;
                max-height: 90%;
                display: flex;
                flex-direction: column;
                box-shadow: var(--component-dialog-shadow, 0 2px 10px rgba(0,0,0,0.3));
            }
            :host([animate][visible]) .dialog {
                animation: dialog-fade-in var(--component-dialog-animation-duration, 0.2s) ease-out both;
            }
            .header {
                padding: var(--component-dialog-padding, var(--spacing-medium));
                font-weight: bold;
                border-bottom: var(--component-dialog-inner-border-width, 1px) solid var(--component-dialog-border-color);
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--spacing-small, 8px);
            }
            .header-content {
                flex: 1;
            }
            .body {
                padding: var(--component-dialog-padding, var(--spacing-medium));
                overflow: auto;
                flex: 1;
            }
            .footer {
                padding: var(--component-dialog-padding, var(--spacing-medium));
                border-top: var(--component-dialog-inner-border-width, 1px) solid var(--component-dialog-border-color);
                display: flex;
                flex-wrap: wrap;
                justify-content: flex-end;
                gap: var(--component-dialog-footer-gap, var(--spacing-small, 8px));
            }

            ::slotted(*) {
                margin: 0;
            }
        `;

        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(style);

        const dialog = document.createElement("div");
        dialog.className = "dialog";
        dialog.setAttribute("role", "dialog");
        dialog.setAttribute("aria-modal", "true");
        dialog.setAttribute("tabindex", "-1");

        const header = document.createElement("div");
        header.className = "header";
        header.setAttribute("part", "header");

        const headerContent = document.createElement("div");
        headerContent.className = "header-content";
        headerContent.innerHTML = `<slot name="header"></slot>`;
        header.appendChild(headerContent);

        if (this.closable) {
            const closeBtn = document.createElement("y-button");
            closeBtn.setAttribute("size", "small");
            closeBtn.setAttribute("style-type", "flat");
            closeBtn.setAttribute("aria-label", "Close");
            closeBtn.textContent = "\u2715";
            closeBtn.addEventListener("click", () => {
                this.visible = false;
            });
            header.appendChild(closeBtn);
        }

        const body = document.createElement("div");
        body.className = "body";
        body.setAttribute("part", "body");
        body.innerHTML = `<slot name="body"></slot>`;

        const footer = document.createElement("div");
        footer.className = "footer";
        footer.setAttribute("part", "footer");
        footer.innerHTML = `<slot name="footer"></slot>`;

        dialog.appendChild(header);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        this.shadowRoot.appendChild(dialog);

        const hideIfEmpty = (wrapper) => {
            const slot = wrapper.querySelector("slot");
            if (!slot) return;

            const update = () => {
                const hasContent =
                    slot.assignedNodes({ flatten: true }).length > 0;
                wrapper.style.display = hasContent ? "" : "none";
            };

            slot.addEventListener("slotchange", update);
            update();
        };

        if (!this.closable) hideIfEmpty(header);
        hideIfEmpty(body);
        hideIfEmpty(footer);
    }
}

if (!customElements.get("y-dialog")) {
    customElements.define("y-dialog", YumeDialog);
}
