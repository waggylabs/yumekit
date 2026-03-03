class YumeDialog extends HTMLElement {
    static get observedAttributes() {
        return ["visible", "anchor", "closable"];
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

    get closable() {
        return this.hasAttribute("closable");
    }
    set closable(val) {
        if (val) this.setAttribute("closable", "");
        else this.removeAttribute("closable");
    }

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
                background: rgba(0,0,0,0.5);
                z-index: 1000;
            }
            :host([visible]) { display: flex; }
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
            .close-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: var(--spacing-x-small, 4px);
                color: var(--component-dialog-color, #000);
                font-size: 1.25em;
                line-height: 1;
                border-radius: var(--component-button-border-radius-outer, 4px);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .close-btn:hover {
                background: var(--component-dialog-hover-background, #eee);
            }
            .close-btn:focus-visible {
                outline: 2px solid var(--component-dialog-accent);
                outline-offset: -1px;
            }
            .body {
                padding: var(--component-dialog-padding, var(--spacing-medium));
                overflow: auto;
                flex: 1;
            }
            .footer {
                padding: var(--component-dialog-padding, var(--spacing-medium));
                border-top: var(--component-dialog-inner-border-width, 1px) solid var(--component-dialog-border-color);
                text-align: right;
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
            const closeBtn = document.createElement("button");
            closeBtn.className = "close-btn";
            closeBtn.setAttribute("aria-label", "Close");
            closeBtn.innerHTML = "&#10005;";
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
    }
}

if (!customElements.get("y-dialog")) {
    customElements.define("y-dialog", YumeDialog);
}
