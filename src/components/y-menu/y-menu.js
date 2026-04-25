import { resolveAnchor, createElement as _el } from "../../modules/helpers.js";
import "../y-icon/y-icon.js";

export class YumeMenu extends HTMLElement {
    static get observedAttributes() {
        return ["items", "anchor", "visible", "direction", "size", "history"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

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
        if (this.visible) this._updatePosition();
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

        if (name === "visible" || name === "direction") {
            this._updatePosition();
        }

        if (name === "visible") {
            this.dispatchEvent(new CustomEvent(this.visible ? "open" : "close", {
                bubbles: true,
                composed: true,
            }));
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Which anchor element ID triggers this menu. */
    get anchor() { return this.getAttribute("anchor"); }
    set anchor(val) { this.setAttribute("anchor", val); }

    /** Direction for menu placement: "down" | "up" | "left" | "right" (default "down"). */
    get direction() { return this.getAttribute("direction") || "down"; }
    set direction(val) { this.setAttribute("direction", val); }

    /**
     * Navigation mode: omit for pushState (SPA-friendly), set to "false" for full-page navigation.
     * Regardless of this setting, a cancelable "navigate" event is always dispatched first.
     */
    get history() { return this.getAttribute("history"); }
    set history(val) {
        if (val != null) this.setAttribute("history", val);
        else this.removeAttribute("history");
    }

    /** Menu items array (JSON attribute). */
    get items() {
        try {
            return JSON.parse(this.getAttribute("items")) || [];
        } catch {
            return [];
        }
    }
    set items(val) {
        this.setAttribute("items", Array.isArray(val) ? JSON.stringify(val) : (val ?? "[]"));
    }

    /** Size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        const sz = this.getAttribute("size");
        return ["small", "medium", "large"].includes(sz) ? sz : "medium";
    }
    set size(val) {
        this.setAttribute("size", ["small", "medium", "large"].includes(val) ? val : "medium");
    }

    /** Whether the menu is currently visible. */
    get visible() { return this.hasAttribute("visible"); }
    set visible(val) {
        if (val) this.setAttribute("visible", "");
        else this.removeAttribute("visible");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this.shadowRoot.innerHTML = "";

        const style = _el("style", {}, [this._buildStyles()]);

        const rootUl = this._createMenuList(this.items);
        rootUl.classList.add("menu");
        rootUl.setAttribute("role", "menu");
        rootUl.setAttribute("part", "menu");

        const childSlot = _el("slot");
        childSlot.addEventListener("slotchange", () => this._processSlottedItems());
        rootUl.appendChild(childSlot);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(rootUl);
        this._processSlottedItems();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _activateItem(item) {
        if (item.children?.length > 0) return;

        this._dispatchSelect({
            value: item.value ?? item.text,
            item,
        });

        const href = item.href ?? item.url;
        if (href) this._navigateTo(href);

        this.visible = false;
    }

    _activateSlottedItem(el) {
        this._dispatchSelect({
            value: el.dataset.value ?? el.textContent.trim(),
            element: el,
        });
        this.visible = false;
    }

    _buildStyles() {
        const paddingVar = `var(--component-button-padding-${this.size}, 0.5rem)`;
        return `
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
                position: relative;
            }

            li.menuitem:hover {
                background: var(--component-menu-hover-background, #292a2b);
            }

            li.menuitem.selected {
                background: var(--component-menu-selected-background);
                color: var(--component-menu-selected-color);
            }

            li.menuitem.selected:hover {
                background: var(--component-menu-selected-background);
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
                display: inline-flex;
                align-items: center;
                margin-left: 0.5rem;
                opacity: 0.6;
            }

            .item-content {
                flex: 1;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }
        `;
    }

    static _closeAll(except) {
        document.querySelectorAll("y-menu").forEach((menu) => {
            if (menu !== except && menu.visible) {
                menu.visible = false;
            }
        });
    }

    _computeMenuOffset(direction, anchorRect, menuRect, vw, vh) {
        if (direction === "right") {
            let top = anchorRect.top;
            let left = anchorRect.right;
            if (left + menuRect.width > vw) left = anchorRect.left - menuRect.width;
            if (top + menuRect.height > vh) top = anchorRect.top - menuRect.height;
            return { top, left };
        }

        if (direction === "up") {
            let top = anchorRect.top - menuRect.height;
            let left = anchorRect.left;
            if (top < 0) top = anchorRect.bottom;
            if (left + menuRect.width > vw) left = vw - menuRect.width - 10;
            return { top, left };
        }

        if (direction === "left") {
            let top = anchorRect.top;
            let left = anchorRect.left - menuRect.width;
            if (left < 0) left = anchorRect.right;
            if (top + menuRect.height > vh) top = anchorRect.top - menuRect.height;
            return { top, left };
        }

        // "down" (default)
        let top = anchorRect.bottom;
        let left = anchorRect.left;
        if (top + menuRect.height > vh) top = anchorRect.top - menuRect.height;
        if (left + menuRect.width > vw) left = vw - menuRect.width - 10;
        return { top, left };
    }

    _createItemContent(item) {
        const wrapper = _el("span", { class: "item-content" });

        if (item.icon) {
            wrapper.appendChild(_el("y-icon", { name: item.icon, size: this.size }));
        } else if (item["icon-template"]) {
            YumeMenu._warnTemplateFieldDeprecated();
            const tpl = this._findTemplate(item["icon-template"]);
            if (tpl) wrapper.appendChild(tpl.content.cloneNode(true));
        }

        if (item.template) {
            YumeMenu._warnTemplateFieldDeprecated();
            const tpl = this._findTemplate(item.template);
            if (tpl) wrapper.appendChild(tpl.content.cloneNode(true));
            else wrapper.append(item.text ?? "");
        } else {
            wrapper.append(item.text ?? "");
        }

        if (!item.slot) return wrapper;

        const slotEl = _el("slot", { name: item.slot });
        slotEl.appendChild(wrapper);
        return slotEl;
    }

    _createMenuItem(item) {
        const isSelected = !!item.selected;
        const partValue = isSelected ? "menuitem selected" : "menuitem";

        const li = _el("li", {
            class: partValue,
            role: "menuitem",
            part: partValue,
            "aria-current": isSelected ? "true" : "false",
            tabindex: "0",
        });

        li.appendChild(this._createItemContent(item));

        if (item.url && !item.href) YumeMenu._warnUrlDeprecated();

        li.addEventListener("click", () => this._activateItem(item));

        if (item.children?.length > 0) {
            li.appendChild(this._createSubmenuIndicator());

            const submenu = this._createMenuList(item.children);
            submenu.classList.add("submenu");
            submenu.setAttribute("role", "menu");
            li.appendChild(submenu);
        }

        return li;
    }

    _createMenuList(items) {
        const ul = _el("ul");
        items.forEach((item) => ul.appendChild(this._createMenuItem(item)));
        return ul;
    }

    _createSubmenuIndicator() {
        return _el("span", { class: "submenu-indicator" }, [
            _el("y-icon", { name: "chevron-right", size: this.size }),
        ]);
    }

    _dispatchSelect(detail) {
        this.dispatchEvent(new CustomEvent("select", {
            detail,
            bubbles: true,
            composed: true,
        }));
    }

    _findTemplate(name) {
        return this.querySelector(`template[slot="${name}"]`);
    }

    _navigateTo(href) {
        const event = new CustomEvent("navigate", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { href },
        });
        if (!this.dispatchEvent(event)) return;

        if (this.getAttribute("history") === "false") {
            window.location.href = href;
        } else {
            history.pushState({}, "", href);
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
        }
    }

    _onAnchorClick(e) {
        e.stopPropagation();
        if (!this.visible) YumeMenu._closeAll(this);
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

    _processSlottedItems() {
        const slot = this.shadowRoot.querySelector("ul.menu > slot");
        if (!slot) return;

        slot.assignedElements().forEach((el) => {
            if (el._yMenuItemBound) return;
            el._yMenuItemBound = true;

            if (!el.hasAttribute("role")) el.setAttribute("role", "menuitem");
            if (el.tabIndex < 0) el.tabIndex = 0;

            el.addEventListener("click", () => this._activateSlottedItem(el));
        });
    }

    _setupAnchor() {
        const id = this.anchor;
        if (!id) return;

        const root = this.getRootNode();
        this._anchorResolveDispose = resolveAnchor(
            this,
            id,
            (el) => {
                this._anchorEl = el;
                el.addEventListener("click", this._onAnchorClick);
            },
            root && root.getElementById ? root : document,
        );
    }

    _teardownAnchor() {
        if (this._anchorResolveDispose) {
            this._anchorResolveDispose();
            this._anchorResolveDispose = null;
        }
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

        // Measure menu off-screen so we know its size before placing it.
        this.style.visibility = "hidden";
        this.style.display = "block";
        const menuRect = this.getBoundingClientRect();
        this.style.visibility = "";

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const { top, left } = this._computeMenuOffset(
            this.direction,
            anchorRect,
            menuRect,
            vw,
            vh,
        );

        const clampedTop = Math.max(0, Math.min(top, vh - menuRect.height));
        const clampedLeft = Math.max(0, Math.min(left, vw - menuRect.width));

        this.style.top = `${clampedTop}px`;
        this.style.left = `${clampedLeft}px`;
        this.style.display = "block";
    }

    static _warnTemplateFieldDeprecated() {
        if (YumeMenu._templateFieldDeprecationWarned) return;
        YumeMenu._templateFieldDeprecationWarned = true;
        // eslint-disable-next-line no-console
        console.warn(
            "[y-menu] item.template and item['icon-template'] are deprecated; use item.icon (icon name) and item.slot (named slot) instead. Support will be removed in a future release.",
        );
    }

    static _warnUrlDeprecated() {
        if (YumeMenu._urlDeprecationWarned) return;
        YumeMenu._urlDeprecationWarned = true;
        // eslint-disable-next-line no-console
        console.warn(
            "[y-menu] item.url is deprecated; use item.href instead. Support for item.url will be removed in a future release.",
        );
    }
}

if (!customElements.get("y-menu")) {
    customElements.define("y-menu", YumeMenu);
}
