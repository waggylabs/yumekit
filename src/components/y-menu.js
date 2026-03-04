class YumeMenu extends HTMLElement {
    static get observedAttributes() {
        return ["items", "anchor", "visible", "direction", "size"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._onAnchorClick = this._onAnchorClick.bind(this);
        this._onDocumentClick = this._onDocumentClick.bind(this);
        this._onScrollOrResize = this._onScrollOrResize.bind(this);
    }

    connectedCallback() {
        if (!this.hasAttribute("items")) this.items = [];
        this._setupAnchor();
        this.render();
        document.addEventListener("click", this._onDocumentClick);
        window.addEventListener("scroll", this._onScrollOrResize, true);
        window.addEventListener("resize", this._onScrollOrResize);
        this.style.position = "fixed";
        this.style.zIndex = "1000";
        this.style.display = "none";
    }

    disconnectedCallback() {
        this._teardownAnchor();
        document.removeEventListener("click", this._onDocumentClick);
        window.removeEventListener("scroll", this._onScrollOrResize, true);
        window.removeEventListener("resize", this._onScrollOrResize);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "items" || name === "size") this.render();
        if (name === "anchor") {
            this._teardownAnchor();
            this._setupAnchor();
        }
        if (name === "visible") {
            this._updatePosition();
        }
        if (name === "direction") {
            this._updatePosition();
        }
    }

    get items() {
        try {
            return JSON.parse(this.getAttribute("items")) || [];
        } catch {
            return [];
        }
    }
    set items(val) {
        this.setAttribute("items", JSON.stringify(val));
    }

    get anchor() {
        return this.getAttribute("anchor");
    }
    set anchor(val) {
        this.setAttribute("anchor", val);
    }

    get visible() {
        return this.hasAttribute("visible");
    }
    set visible(val) {
        if (val) this.setAttribute("visible", "");
        else this.removeAttribute("visible");
    }

    get direction() {
        return this.getAttribute("direction") || "down";
    }
    set direction(val) {
        this.setAttribute("direction", val);
    }

    get size() {
        const sz = this.getAttribute("size");
        return ["small", "medium", "large"].includes(sz) ? sz : "medium";
    }
    set size(val) {
        if (["small", "medium", "large"].includes(val))
            this.setAttribute("size", val);
        else this.setAttribute("size", "medium");
    }

    _createMenuList(items) {
        const ul = document.createElement("ul");

        items.forEach((item) => {
            const li = document.createElement("li");
            li.className = "menuitem";
            li.setAttribute("role", "menuitem");
            li.setAttribute("part", "menuitem");
            li.tabIndex = 0;

            const contentWrapper = document.createElement("span");
            contentWrapper.className = "item-content";

            if (item["icon-template"]) {
                const iconTpl = this._findTemplate(item["icon-template"]);
                if (iconTpl)
                    contentWrapper.appendChild(iconTpl.content.cloneNode(true));
            }

            if (item.template) {
                const textTpl = this._findTemplate(item.template);
                if (textTpl) {
                    contentWrapper.appendChild(textTpl.content.cloneNode(true));
                } else {
                    contentWrapper.textContent = item.text;
                }
            } else {
                contentWrapper.textContent = item.text;
            }

            li.appendChild(contentWrapper);

            if (item.url) {
                li.addEventListener("click", () => {
                    window.location.href = item.url;
                });
            }

            if (item.children?.length) {
                const indicator = document.createElement("span");
                indicator.className = "submenu-indicator";
                indicator.textContent = "▶";
                li.appendChild(indicator);

                const submenu = this._createMenuList(item.children);
                submenu.classList.add("submenu");
                submenu.setAttribute("role", "menu");
                li.appendChild(submenu);
            }

            ul.appendChild(li);
        });

        return ul;
    }

    _findTemplate(name) {
        return this.querySelector(`template[slot="${name}"]`);
    }

    _onAnchorClick(e) {
        e.stopPropagation();
        this.visible = !this.visible;
    }

    _onDocumentClick(e) {
        const path = e.composedPath();
        if (this._anchorEl && path.includes(this._anchorEl)) return;
        if (path.includes(this)) return;
        this.visible = false;
    }

    _onScrollOrResize() {
        if (this.visible) this._updatePosition();
    }

    _setupAnchor() {
        const id = this.anchor;
        if (id) {
            const root = this.getRootNode();
            const el = root?.getElementById
                ? root.getElementById(id)
                : document.getElementById(id);
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

    _updatePosition() {
        if (!this.visible || !this._anchorEl) {
            this.style.display = "none";
            return;
        }

        const anchorRect = this._anchorEl.getBoundingClientRect();
        const menuRect = this.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let top, left;

        if (this.direction === "right") {
            top = anchorRect.top;
            left = anchorRect.right;

            if (left + menuRect.width > vw) {
                left = anchorRect.left - menuRect.width;
            }
            if (top + menuRect.height > vh) {
                top = anchorRect.top - menuRect.height;
            }
        } else if (this.direction === "up") {
            top = anchorRect.top - menuRect.height;
            left = anchorRect.left;

            if (top < 0) {
                top = anchorRect.bottom;
            }
            if (left + menuRect.width > vw) {
                left = vw - menuRect.width - 10;
            }
        } else if (this.direction === "left") {
            top = anchorRect.top;
            left = anchorRect.left - menuRect.width;

            if (left < 0) {
                left = anchorRect.right;
            }
            if (top + menuRect.height > vh) {
                top = anchorRect.top - menuRect.height;
            }
        } else {
            // "down" (default)
            top = anchorRect.bottom;
            left = anchorRect.left;

            if (top + menuRect.height > vh) {
                top = anchorRect.top - menuRect.height;
            }
            if (left + menuRect.width > vw) {
                left = vw - menuRect.width - 10;
            }
        }

        top = Math.max(0, Math.min(top, vh - menuRect.height));
        left = Math.max(0, Math.min(left, vw - menuRect.width));

        this.style.top = `${top}px`;
        this.style.left = `${left}px`;
        this.style.display = "block";
    }

    render() {
        this.shadowRoot.innerHTML = "";

        const paddingVar = `var(--component-button-padding-${this.size}, 0.5rem)`;

        const style = document.createElement("style");
        style.textContent = `
            ul.menu,
            ul.submenu {
                list-style: none;
                margin: 0;
                padding: 0;
                background: var(--component-menu-background, #0c0c0d);
                border: var(--component-menu-border-width, 1px) solid var(--component-menu-border-color, #37383a);
                border-radius: var(--component-menu-border-radius, 4px);
                box-shadow: var(--component-menu-shadow, 0 2px 8px rgba(0, 0, 0, 0.15));
                min-width: 150px;
                max-height: 300px;
                overflow-y: auto;
            }

            li.menuitem {
                cursor: pointer;
                padding: ${paddingVar};
                display: flex;
                align-items: center;
                justify-content: space-between;
                white-space: nowrap;
                color: var(--component-menu-color, #f7f7fa);
                font-size: var(--font-size-button, 1em);
            }

            li.menuitem:hover {
                background: var(--component-menu-hover-background, #292a2b);
            }

            ul.submenu {
                position: absolute;
                top: 0;
                left: 100%;
                display: none;
                z-index: var(--component-menu-z-index, 1001);
            }

            li.menuitem:hover > ul.submenu {
                display: block;
            }

            .submenu-indicator {
                font-size: 0.75em;
                margin-left: 0.5rem;
                opacity: 0.6;
            }

            .item-content {
                flex: 1;
            }
        `;
        this.shadowRoot.appendChild(style);

        const rootUl = this._createMenuList(this.items);
        rootUl.classList.add("menu");
        rootUl.setAttribute("role", "menu");
        rootUl.setAttribute("part", "menu");
        this.shadowRoot.appendChild(rootUl);
    }
}

if (!customElements.get("y-menu")) {
    customElements.define("y-menu", YumeMenu);
}
