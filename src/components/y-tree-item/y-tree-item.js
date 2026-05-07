import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";

export class YumeTreeItem extends HTMLElement {
    static get observedAttributes() {
        return ["href", "expanded", "selected", "disabled"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._level = 1;
        this._hasChildren = false;
        this._onArrowClick = this._onArrowClick.bind(this);
        this._onArrowMousedown = this._onArrowMousedown.bind(this);
        this._onChildrenSlotChange = this._onChildrenSlotChange.bind(this);
        this._onHeaderClick = this._onHeaderClick.bind(this);
        this._onHeaderMousedown = this._onHeaderMousedown.bind(this);
        this._render();
        this._attachListeners();
    }

    connectedCallback() {
        this._level = this._computeLevel();
        if (!this.hasAttribute("role")) this.setAttribute("role", "treeitem");
        if (this.tabIndex < 0 && !this.hasAttribute("tabindex")) this.tabIndex = -1;
        this.style.setProperty("--_y-tree-item-level", String(this._level));
        this._syncChildren();
        this._syncAria();
        this._syncArrow();
        this.dispatchEvent(new CustomEvent("y-tree-item-connect", {
            bubbles: true,
            composed: true,
        }));
    }

    disconnectedCallback() {
        this.dispatchEvent(new CustomEvent("y-tree-item-disconnect", {
            bubbles: true,
            composed: true,
        }));
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "expanded" || name === "selected" || name === "disabled") {
            this._syncAria();
            if (name === "expanded") this._syncArrow();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Whether the item is non-interactive and skipped in keyboard navigation. */
    get disabled() { return this.hasAttribute("disabled"); }
    set disabled(v) {
        if (v) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Whether the item's children are visible. */
    get expanded() { return this.hasAttribute("expanded"); }
    set expanded(v) {
        if (v) this.setAttribute("expanded", "");
        else this.removeAttribute("expanded");
    }

    /** Whether this item has at least one nested `<y-tree-item slot="children">`. */
    get hasChildren() { return this._hasChildren; }

    /**
     * History API behavior on navigate. `"push"` (default) calls `pushState`;
     * `"replace"` calls `replaceState`; `"false"` triggers a full-page nav via
     * `window.location.href`.
     */
    get history() {
        return this.getAttribute("history") || "push";
    }
    set history(v) {
        if (v) this.setAttribute("history", v);
        else this.removeAttribute("history");
    }

    /** Navigation target. When present the item behaves as a link. */
    get href() { return this.getAttribute("href"); }
    set href(v) {
        if (v) this.setAttribute("href", v);
        else this.removeAttribute("href");
    }

    /** 1-based depth from the enclosing `<y-tree>`. Computed at connect. */
    get level() { return this._level; }

    /** Active/current item state. */
    get selected() { return this.hasAttribute("selected"); }
    set selected(v) {
        if (v) this.setAttribute("selected", "");
        else this.removeAttribute("selected");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Activates the item: dispatches a cancelable `navigate` event and runs
     * the History API side effect when `href` is set, then dispatches `select`.
     * No-op when disabled.
     */
    activate() {
        if (this.disabled) return;

        if (this.href) {
            const event = new CustomEvent("navigate", {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: { href: this.href, item: this },
            });
            const proceed = this.dispatchEvent(event);
            if (proceed) this._performNavigation();
        }
        this.dispatchEvent(new CustomEvent("select", {
            bubbles: true,
            composed: true,
            detail: { item: this, href: this.href || null },
        }));
    }

    /** Collapses the branch. No-op if already collapsed. */
    collapse() {
        if (!this.expanded) return;

        this.expanded = false;
        this.dispatchEvent(new CustomEvent("collapse", {
            bubbles: true, composed: true, detail: { item: this },
        }));
        this.dispatchEvent(new CustomEvent("toggle", {
            bubbles: true, composed: true, detail: { item: this, expanded: false },
        }));
    }

    /** Expands the branch. No-op if already expanded or has no children. */
    expand() {
        if (this.expanded) return;
        if (!this._hasChildren) return;

        this.expanded = true;
        this.dispatchEvent(new CustomEvent("expand", {
            bubbles: true, composed: true, detail: { item: this },
        }));
        this.dispatchEvent(new CustomEvent("toggle", {
            bubbles: true, composed: true, detail: { item: this, expanded: true },
        }));
    }

    /** Toggles expansion. No-op when the item has no children. */
    toggle() {
        if (!this._hasChildren) return;

        if (this.expanded) this.collapse();
        else this.expand();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _attachListeners() {
        const header = this.shadowRoot.querySelector('[part="header"]');
        const arrow = this.shadowRoot.querySelector('[part="arrow"]');
        const slot = this.shadowRoot.querySelector('slot[name="children"]');
        header.addEventListener("click", this._onHeaderClick);
        header.addEventListener("mousedown", this._onHeaderMousedown);
        arrow.addEventListener("click", this._onArrowClick);
        arrow.addEventListener("mousedown", this._onArrowMousedown);
        slot.addEventListener("slotchange", this._onChildrenSlotChange);
    }

    _buildStyles() {
        return `
            :host {
                display: block;
                box-sizing: border-box;
                color: var(--component-tree-item-color);
                background: var(--component-tree-item-background);
                outline: none;
            }

            :host([disabled]) {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .header {
                display: flex;
                align-items: center;
                gap: var(--component-tree-icon-gap, 8px);
                padding: var(--component-tree-padding, 8px);
                padding-left: calc(
                    var(--component-tree-padding, 8px)
                    + (var(--_y-tree-item-level, 1) - 1) * var(--component-tree-indent, 16px)
                );
                cursor: pointer;
                user-select: none;
                transition: background 0.15s ease;
                background: transparent;
                border: 0;
                width: 100%;
                font: inherit;
                color: inherit;
                text-align: left;
            }

            .header:hover {
                background: var(--component-tree-item-hover-background);
            }

            :host([selected]) > .item .header,
            :host([aria-current="page"]) > .item .header {
                color: var(--component-tree-item-selected-color);
                background: var(--component-tree-item-selected-background);
            }

            :host(:focus-visible) > .item .header {
                outline: var(--component-tree-border-width, 2px) solid var(--component-tree-item-accent);
                outline-offset: -2px;
            }

            :host([disabled]) .header {
                cursor: not-allowed;
            }

            .arrow {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: none;
                border: 0;
                padding: 0;
                margin: 0;
                cursor: pointer;
                color: inherit;
                flex-shrink: 0;
                transition: transform 0.2s ease;
                width: 1em;
                height: 1em;
            }

            :host([expanded]) .arrow {
                transform: rotate(90deg);
            }

            .icon {
                display: inline-flex;
                align-items: center;
                flex-shrink: 0;
            }

            .icon:empty,
            .icon:has(slot[name="icon"]:not(:has(*))) {
                display: none;
            }

            .label {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .suffix {
                display: inline-flex;
                align-items: center;
                flex-shrink: 0;
                margin-left: auto;
            }

            .children {
                display: none;
                box-shadow: inset var(--component-tree-border-width, 2px) 0 0 0 var(--component-tree-item-active-border);
                margin-left: calc(
                    var(--component-tree-padding, 8px)
                    + (var(--_y-tree-item-level, 1) - 1) * var(--component-tree-indent, 16px)
                    + 0.5em
                );
            }

            :host([expanded]) > .children {
                display: block;
            }

            :host([expanded]) > .item {
                background: var(--component-tree-item-expanded-background);
            }
        `;
    }

    _computeLevel() {
        let level = 1;
        let el = this.parentElement;
        while (el) {
            if (el.tagName === "Y-TREE") break;
            if (el.tagName === "Y-TREE-ITEM") level++;
            el = el.parentElement;
        }
        return level;
    }

    _hasChildSlot() {
        const slot = this.shadowRoot.querySelector('slot[name="children"]');
        if (!slot) return false;

        return slot.assignedElements({ flatten: true })
            .some((el) => el.tagName === "Y-TREE-ITEM");
    }

    _onArrowClick(e) {
        e.stopPropagation();
        if (this.disabled) return;

        this.toggle();
        this.focus();
    }

    _onArrowMousedown(e) {
        // Prevent native focus shift to the chevron button so the host keeps focus.
        e.preventDefault();
    }

    _onChildrenSlotChange() {
        this._syncChildren();
        this._syncAria();
        this._syncArrow();
    }

    _onHeaderClick() {
        if (this.disabled) return;

        this.activate();
        this.focus();
    }

    _onHeaderMousedown(e) {
        // Keep focus on the host instead of moving to the inner header element.
        e.preventDefault();
        this.focus();
    }

    _performNavigation() {
        const mode = this.history;
        if (mode === "false") {
            window.location.href = this.href;
            return;
        }

        if (mode === "replace") {
            history.replaceState({}, "", this.href);
        } else {
            history.pushState({}, "", this.href);
        }
        window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    }

    _render() {
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(_el("style", {}, [this._buildStyles()]));

        const arrow = _el(
            "button",
            {
                class: "arrow",
                part: "arrow",
                type: "button",
                tabindex: "-1",
                "aria-hidden": "true",
            },
            [_el("y-icon", { name: "chevron-right", size: "small" })],
        );

        const iconWrap = _el("span", { class: "icon", part: "icon" }, [
            _el("slot", { name: "icon" }),
        ]);

        const labelSlot = _el("slot", { name: "label" });
        labelSlot.appendChild(_el("slot", {}));
        const labelWrap = _el("span", { class: "label", part: "label" }, [
            labelSlot,
        ]);

        const suffix = _el("span", { class: "suffix", part: "suffix" }, [
            _el("slot", { name: "suffix" }),
        ]);

        const header = _el("div", { class: "header", part: "header" }, [
            arrow,
            iconWrap,
            labelWrap,
            suffix,
        ]);

        const item = _el("div", { class: "item", part: "item" }, [header]);

        const children = _el(
            "div",
            { class: "children", part: "children", role: "group" },
            [_el("slot", { name: "children" })],
        );

        this.shadowRoot.appendChild(item);
        this.shadowRoot.appendChild(children);
    }

    _syncAria() {
        if (this._hasChildren) {
            this.setAttribute("aria-expanded", String(this.expanded));
        } else {
            this.removeAttribute("aria-expanded");
        }
        this.setAttribute("aria-selected", String(this.selected));
        if (this.disabled) this.setAttribute("aria-disabled", "true");
        else this.removeAttribute("aria-disabled");
        this.setAttribute("aria-level", String(this._level));
    }

    _syncArrow() {
        const arrow = this.shadowRoot.querySelector('[part="arrow"]');
        if (!arrow) return;

        arrow.style.visibility = this._hasChildren ? "" : "hidden";
    }

    _syncChildren() {
        const had = this._hasChildren;
        this._hasChildren = this._hasChildSlot();
        if (had && !this._hasChildren && this.expanded) {
            this.expanded = false;
        }
    }
}

if (!customElements.get("y-tree-item")) {
    customElements.define("y-tree-item", YumeTreeItem);
}
