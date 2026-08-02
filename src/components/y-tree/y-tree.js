import "../y-tree-item/y-tree-item.js";
import { createElement as _el, upgradeProperties } from "../../modules/helpers.js";

const ROUTE_MATCH_VALUES = ["exact", "prefix", "off"];
const SELECTION_VALUES = ["single", "none"];
const TYPE_AHEAD_TIMEOUT = 500;

export class YumeTree extends HTMLElement {
    static get observedAttributes() {
        return ["exclusive", "selection", "route-match"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._typeAheadBuf = "";
        this._typeAheadTimer = null;
        this._refreshScheduled = false;
        this._onItemConnect = this._onItemConnect.bind(this);
        this._onItemDisconnect = this._onItemDisconnect.bind(this);
        this._onItemExpand = this._onItemExpand.bind(this);
        this._onItemFocusin = this._onItemFocusin.bind(this);
        this._onItemSelect = this._onItemSelect.bind(this);
        this._onKeydown = this._onKeydown.bind(this);
        this._onPopstate = this._onPopstate.bind(this);
        this._render();
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("role")) this.setAttribute("role", "tree");
        if (!this.hasAttribute("aria-label")) {
            this.setAttribute("aria-label", "Tree");
        }
        this.addEventListener("keydown", this._onKeydown);
        this.addEventListener("focusin", this._onItemFocusin);
        this.addEventListener("y-tree-item-connect", this._onItemConnect);
        this.addEventListener("y-tree-item-disconnect", this._onItemDisconnect);
        this.addEventListener("expand", this._onItemExpand);
        this.addEventListener("select", this._onItemSelect);
        window.addEventListener("popstate", this._onPopstate);

        Promise.resolve().then(() => {
            if (!this.isConnected) return;

            this._evaluateRouteMatch();
            this._initRovingTabindex();
        });
    }

    disconnectedCallback() {
        this.removeEventListener("keydown", this._onKeydown);
        this.removeEventListener("focusin", this._onItemFocusin);
        this.removeEventListener("y-tree-item-connect", this._onItemConnect);
        this.removeEventListener(
            "y-tree-item-disconnect",
            this._onItemDisconnect,
        );
        this.removeEventListener("expand", this._onItemExpand);
        this.removeEventListener("select", this._onItemSelect);
        window.removeEventListener("popstate", this._onPopstate);
        clearTimeout(this._typeAheadTimer);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "route-match") this._evaluateRouteMatch();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** When set, expanding one branch collapses sibling branches at the same level. */
    get exclusive() {
        return this.hasAttribute("exclusive");
    }
    set exclusive(v) {
        if (v) this.setAttribute("exclusive", "");
        else this.removeAttribute("exclusive");
    }

    /**
     * Route-matching strategy used to highlight the current item from
     * `window.location.pathname`. `"exact"` matches `href === pathname`;
     * `"prefix"` also highlights ancestor items whose `href` is a path-segment
     * prefix of the current pathname; `"off"` disables route matching.
     */
    get routeMatch() {
        const v = this.getAttribute("route-match");
        return ROUTE_MATCH_VALUES.includes(v) ? v : "exact";
    }
    set routeMatch(v) {
        if (ROUTE_MATCH_VALUES.includes(v)) this.setAttribute("route-match", v);
        else this.removeAttribute("route-match");
    }

    /**
     * Whether one item can be selected at a time (`"single"`, default) or
     * selection is route-driven only (`"none"`).
     */
    get selection() {
        const v = this.getAttribute("selection");
        return SELECTION_VALUES.includes(v) ? v : "single";
    }
    set selection(v) {
        if (SELECTION_VALUES.includes(v)) this.setAttribute("selection", v);
        else this.removeAttribute("selection");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Returns every descendant `<y-tree-item>`, regardless of visibility. */
    getAllItems() {
        return Array.from(this.querySelectorAll("y-tree-item"));
    }

    /**
     * Returns visible items in document order — items hidden under a collapsed
     * ancestor are excluded.
     */
    getVisibleItems() {
        return this.getAllItems().filter((item) => this._isItemVisible(item));
    }

    /**
     * Moves focus to `item` and updates the roving `tabindex`. Items that are
     * disabled or detached from the tree are ignored.
     */
    focusItem(item) {
        if (!item || item.disabled || !this.contains(item)) return;

        const all = this.getAllItems();
        for (const it of all) it.tabIndex = -1;
        item.tabIndex = 0;
        item.focus();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildStyles() {
        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                background: var(--component-tree-background);
                color: var(--component-tree-item-color);
                font-family: var(--font-family-body);
                box-sizing: border-box;
            }
            .tree {
                display: flex;
                flex-direction: column;
            }
        `;
    }

    _evaluateRouteMatch() {
        const mode = this.routeMatch;

        if (mode === "off") {
            for (const item of this.getAllItems()) {
                if (!item.hasAttribute("aria-current")) continue;

                item.removeAttribute("aria-current");
                if (this.selection === "single") item.selected = false;
            }
            return;
        }

        const path =
            typeof window !== "undefined" ? window.location.pathname : "";
        const items = this.getAllItems();

        let matched = null;
        let bestLen = -1;

        for (const item of items) {
            const href = item.href;
            if (!href) continue;
            if (href === path) {
                matched = item;
                bestLen = href.length;
                if (mode === "exact") break;
                continue;
            }
            if (
                mode === "prefix" &&
                path.startsWith(href + "/") &&
                href.length > bestLen
            ) {
                matched = item;
                bestLen = href.length;
            }
        }

        for (const item of items) {
            const isMatch = item === matched;
            if (isMatch) item.setAttribute("aria-current", "page");
            else item.removeAttribute("aria-current");
            if (this.selection === "single") item.selected = isMatch;
        }
    }

    _focusByOffset(currentItem, offset) {
        const items = this.getVisibleItems().filter((it) => !it.disabled);
        if (!items.length) return;

        const idx = items.indexOf(currentItem);
        if (idx === -1) return;

        const next = items[idx + offset];
        if (next) this.focusItem(next);
    }

    _getFirstChild(item) {
        return Array.from(item.children).find(
            (el) =>
                el.tagName === "Y-TREE-ITEM" &&
                el.getAttribute("slot") === "children" &&
                !el.disabled,
        );
    }

    _getParentItem(item) {
        const p = item.parentElement;
        if (!p || p.tagName !== "Y-TREE-ITEM") return null;

        return p;
    }

    _getSiblings(item) {
        const parent = item.parentElement;

        if (!parent) return [];

        return Array.from(parent.children).filter(
            (el) => el.tagName === "Y-TREE-ITEM",
        );
    }

    _handleTypeAhead(letter, currentItem) {
        this._typeAheadBuf += letter.toLowerCase();
        clearTimeout(this._typeAheadTimer);
        this._typeAheadTimer = setTimeout(() => {
            this._typeAheadBuf = "";
        }, TYPE_AHEAD_TIMEOUT);

        const items = this.getVisibleItems().filter((it) => !it.disabled);
        if (!items.length) return;

        const startIdx = Math.max(items.indexOf(currentItem), 0) + 1;
        const ordered = [...items.slice(startIdx), ...items.slice(0, startIdx)];

        const match = ordered.find((it) => {
            const text = (it.textContent || "").trim().toLowerCase();
            return text.startsWith(this._typeAheadBuf);
        });

        if (match) this.focusItem(match);
    }

    _initRovingTabindex() {
        const items = this.getAllItems();
        if (!items.length) return;

        for (const it of items) it.tabIndex = -1;
        const focusable =
            items.find((it) => it.selected && !it.disabled) ||
            items.find((it) => !it.disabled);
        if (focusable) focusable.tabIndex = 0;
    }

    _isItemVisible(item) {
        let p = item.parentElement;
        while (p && p !== this) {
            if (p.tagName === "Y-TREE-ITEM" && !p.expanded) return false;

            p = p.parentElement;
        }
        return true;
    }

    _onItemConnect() {
        this._scheduleRefresh();
    }

    _onItemDisconnect() {
        this._scheduleRefresh();
    }

    _onItemExpand(e) {
        if (!this.exclusive) return;

        const item = e.target;
        if (!item || item.tagName !== "Y-TREE-ITEM") return;

        for (const sib of this._getSiblings(item)) {
            if (sib !== item && sib.expanded) sib.collapse();
        }
    }

    _onItemFocusin(e) {
        const item = this._resolveItem(e.target);
        if (!item || item.disabled) return;
        if (item.tabIndex === 0) return;

        for (const it of this.getAllItems()) it.tabIndex = -1;
        item.tabIndex = 0;
    }

    _onItemSelect(e) {
        if (this.selection !== "single") return;

        const item = e.target;
        if (!item || item.tagName !== "Y-TREE-ITEM" || item.disabled) return;

        for (const it of this.getAllItems()) {
            it.selected = it === item;
        }
    }

    _onKeydown(e) {
        const item = this._resolveItem(e.target);
        if (!item || item.disabled) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                this._focusByOffset(item, 1);
                return;
            case "ArrowUp":
                e.preventDefault();
                this._focusByOffset(item, -1);
                return;
            case "ArrowRight":
                e.preventDefault();
                this._stepRight(item);
                return;
            case "ArrowLeft":
                e.preventDefault();
                this._stepLeft(item);
                return;
            case "Home": {
                e.preventDefault();
                const items = this.getVisibleItems().filter(
                    (it) => !it.disabled,
                );
                if (items[0]) this.focusItem(items[0]);
                return;
            }
            case "End": {
                e.preventDefault();
                const items = this.getVisibleItems().filter(
                    (it) => !it.disabled,
                );
                if (items.length) this.focusItem(items[items.length - 1]);
                return;
            }
            case "Enter":
                e.preventDefault();
                item.activate();
                return;
            case " ":
                if (item.hasChildren) {
                    e.preventDefault();
                    item.toggle();
                }
                return;
            default:
                if (
                    e.key.length === 1 &&
                    !e.ctrlKey &&
                    !e.metaKey &&
                    !e.altKey
                ) {
                    this._handleTypeAhead(e.key, item);
                }
        }
    }

    _onPopstate() {
        this._evaluateRouteMatch();
    }

    _render() {
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(_el("style", {}, [this._buildStyles()]));
        this.shadowRoot.appendChild(
            _el("div", { class: "tree", part: "tree" }, [_el("slot", {})]),
        );
    }

    _resolveItem(target) {
        if (!target) return null;

        if (target.tagName === "Y-TREE-ITEM" && this.contains(target))
            return target;

        if (target.closest) {
            const found = target.closest("y-tree-item");
            return found && this.contains(found) ? found : null;
        }
        return null;
    }

    _scheduleRefresh() {
        if (this._refreshScheduled) return;

        this._refreshScheduled = true;
        Promise.resolve().then(() => {
            this._refreshScheduled = false;
            if (!this.isConnected) return;

            this._evaluateRouteMatch();
            this._ensureRovingTabindex();
        });
    }

    _ensureRovingTabindex() {
        const items = this.getAllItems();
        if (!items.length) return;

        const focused = items.find((it) => it.tabIndex === 0 && !it.disabled);
        if (focused) return;

        const next =
            items.find((it) => it.selected && !it.disabled) ||
            items.find((it) => !it.disabled);

        for (const it of items) it.tabIndex = -1;
        if (next) next.tabIndex = 0;
    }

    _stepLeft(item) {
        if (item.hasChildren && item.expanded) {
            item.collapse();
            return;
        }

        const parent = this._getParentItem(item);
        if (parent) this.focusItem(parent);
    }

    _stepRight(item) {
        if (!item.hasChildren) return;

        if (!item.expanded) {
            item.expand();
            return;
        }

        const child = this._getFirstChild(item);
        if (child) this.focusItem(child);
    }
}

if (!customElements.get("y-tree")) {
    customElements.define("y-tree", YumeTree);
}
