import { createElement as _el } from "../../modules/helpers.js";

const DEFAULT_GHOST_CLASS = "y-droplist__ghost";
const DEFAULT_DRAG_CLASS = "y-droplist__dragging";
const DEFAULT_SWAP_CLASS = "y-droplist__swap-target";

/** Cross-list drag group registry: group name → Set<YumeDroplist>. */
const _groups = new Map();

/** The list currently owning the active drag session. */
let _activeSource = null;

/** The list that currently holds the drag ghost element. */
let _ghostList = null;

function _registerInGroup(list) {
    const g = list.group;
    if (!g) return;
    if (!_groups.has(g)) _groups.set(g, new Set());
    _groups.get(g).add(list);
}

function _unregisterFromGroup(list) {
    const g = list.group;
    if (!g) return;
    const members = _groups.get(g);
    if (!members) return;
    members.delete(list);
    if (members.size === 0) _groups.delete(g);
}

export class YumeDroplist extends HTMLElement {
    static get observedAttributes() {
        return [
            "group",
            "disabled",
            "vertical",
            "animation",
            "ghost-class",
            "drag-class",
            "handle",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._dragItem = null;
        this._ghost = null;
        this._oldIndex = -1;
        this._abort = null;
        this._observer = null;
        this._handleSelectorInvalid = false;
        this._swapTarget = null;
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "list");
        this._abort = new AbortController();
        this._wireEvents();
        this._observeChildren();
        this._initializeChildren();
        this._syncDisabledAria();
        _registerInGroup(this);
    }

    disconnectedCallback() {
        this._teardown();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "disabled") {
            this._syncDisabledAria();
            this._initializeChildren();
        } else if (name === "group" && this._abort) {
            if (oldValue) {
                const members = _groups.get(oldValue);
                members?.delete(this);
                if (members && members.size === 0) _groups.delete(oldValue);
            }
            _registerInGroup(this);
        } else if (name === "handle") {
            this._handleSelectorInvalid = false;
            if (newValue) {
                try {
                    document.createElement("div").matches(newValue);
                } catch {
                    console.warn(
                        `y-droplist: invalid handle selector "${newValue}" — falling back to whole-item drag.`,
                    );
                    this._handleSelectorInvalid = true;
                }
            }
            if (this._abort) this._initializeChildren();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Settle-animation duration in ms. `0` disables the animation. */
    get animation() {
        const n = parseInt(this.getAttribute("animation") ?? "150", 10);
        return Number.isFinite(n) && n >= 0 ? n : 150;
    }
    set animation(val) {
        this.setAttribute("animation", String(val));
    }

    /** When true, drops insert a copy at the drop position; the original stays at its source index. */
    get clone() {
        return this.hasAttribute("clone");
    }
    set clone(val) {
        if (val) this.setAttribute("clone", "");
        else this.removeAttribute("clone");
    }

    /** Whether drag-and-drop is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** CSS class applied to the item being dragged. */
    get dragClass() {
        return this.getAttribute("drag-class") || DEFAULT_DRAG_CLASS;
    }
    set dragClass(val) {
        this.setAttribute("drag-class", val);
    }

    /** CSS class applied to the ghost placeholder. */
    get ghostClass() {
        return this.getAttribute("ghost-class") || DEFAULT_GHOST_CLASS;
    }
    set ghostClass(val) {
        this.setAttribute("ghost-class", val);
    }

    /** Group name for drag-and-drop interactions. */
    get group() {
        return this.getAttribute("group") || "";
    }
    set group(val) {
        this.setAttribute("group", val);
    }

    /**
     * CSS selector for the drag handle within each item. When set, drags only
     * initiate from elements matching this selector. Empty (default) keeps the
     * whole item draggable. Invalid selectors warn and fall back to whole-item.
     */
    get handle() {
        if (this._handleSelectorInvalid) return "";
        return this.getAttribute("handle") || "";
    }
    set handle(val) {
        if (val) this.setAttribute("handle", val);
        else this.removeAttribute("handle");
    }

    /**
     * In swap mode, controls which item is the active swap target.
     * `true` (default): item the cursor is currently over.
     * `false`: item whose midpoint the cursor has crossed.
     */
    get invertSwapElement() {
        return this.getAttribute("invert-swap-element") !== "false";
    }
    set invertSwapElement(val) {
        if (val === false || val === "false")
            this.setAttribute("invert-swap-element", "false");
        else this.setAttribute("invert-swap-element", "");
    }

    /**
     * When `handle` is set, calls `preventDefault()` on `pointerdown` events that
     * don't match the handle selector to suppress text selection. Default true.
     */
    get preventOnFilter() {
        return this.getAttribute("prevent-on-filter") !== "false";
    }
    set preventOnFilter(val) {
        if (val === false || val === "false")
            this.setAttribute("prevent-on-filter", "false");
        else this.setAttribute("prevent-on-filter", "");
    }

    /**
     * Whether this list allows items to be dragged out.
     * `"true"` (default) moves the item; `"clone"` leaves a copy; `"false"` blocks pulling.
     */
    get pull() {
        const val = this.getAttribute("pull");
        if (val === "false") return "false";
        if (val === "clone") return "clone";
        return "true";
    }
    set pull(val) {
        const s = String(val);
        if (s === "false") this.setAttribute("pull", "false");
        else if (s === "clone") this.setAttribute("pull", "clone");
        else this.setAttribute("pull", "true");
    }

    /**
     * Whether this list accepts incoming items.
     * `"true"` (default) accepts any same-group item; `"false"` rejects all;
     * or a comma-separated list of group names whose items are accepted.
     */
    get put() {
        const val = this.getAttribute("put");
        if (val === "false") return "false";
        if (val && val !== "true") return val;
        return "true";
    }
    set put(val) {
        const s = String(val);
        if (s === "false") this.setAttribute("put", "false");
        else if (s === "true" || s === "") this.setAttribute("put", "true");
        else this.setAttribute("put", s);
    }

    /**
     * When true, dropping over an item swaps the two items in place rather than
     * inserting between items. Same-list only.
     */
    get swap() {
        return this.hasAttribute("swap");
    }
    set swap(val) {
        if (val) this.setAttribute("swap", "");
        else this.removeAttribute("swap");
    }

    /** CSS class applied to the active swap target while dragging in swap mode. */
    get swapClass() {
        return this.getAttribute("swap-class") || DEFAULT_SWAP_CLASS;
    }
    set swapClass(val) {
        this.setAttribute("swap-class", val);
    }

    /** Whether items reorder along the vertical axis. Default true; set "false" to flip. */
    get vertical() {
        return this.getAttribute("vertical") !== "false";
    }
    set vertical(val) {
        if (val === false || val === "false")
            this.setAttribute("vertical", "false");
        else this.setAttribute("vertical", "");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Removes all listeners and observers. The component re-initializes if reconnected to the DOM. */
    destroy() {
        this._teardown();
    }

    /**
     * True if `item` is a direct slotted child of this droplist (excluding the
     * internal ghost placeholder). Use this instead of the native `contains()`
     * when you need a strict same-list membership check — e.g., to confirm an
     * event target is one of this droplist's items rather than a nested descendant.
     */
    hasItem(item) {
        return (
            Boolean(item) && item.parentNode === this && !this._isInternal(item)
        );
    }

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(
            _el("div", { class: "list", part: "list" }, [_el("slot")]),
            _el("div", {
                class: "sr-live",
                "aria-live": "polite",
                "aria-atomic": "true",
            }),
        );
    }

    /** Returns each direct child's `data-id` in current DOM order ("" when missing). */
    toArray() {
        return this._items().map((el) => el.getAttribute("data-id") || "");
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _announce(message) {
        const live = this.shadowRoot.querySelector(".sr-live");
        if (!live) return;
        live.textContent = "";
        // Defer so screen readers re-announce identical text across consecutive moves.
        requestAnimationFrame(() => {
            if (live.isConnected) live.textContent = message;
        });
    }

    _applyHandleA11y(item, handle) {
        // Strip any tabindex we previously placed on a descendant (the prior handle).
        for (const el of item.querySelectorAll(
            "[data-y-droplist-handle-tab]",
        )) {
            el.removeAttribute("tabindex");
            el.removeAttribute("data-y-droplist-handle-tab");
        }

        if (!handle) {
            // If we previously forced tabindex=-1 on the item, restore it to 0.
            if (item.getAttribute("data-y-droplist-handle-tab") === "item") {
                item.setAttribute("tabindex", "0");
                item.removeAttribute("data-y-droplist-handle-tab");
            } else if (!item.hasAttribute("tabindex")) {
                item.setAttribute("tabindex", "0");
            }
            return;
        }

        item.setAttribute("tabindex", "-1");
        item.setAttribute("data-y-droplist-handle-tab", "item");
        let handleEl = null;
        try {
            handleEl = item.querySelector(handle);
        } catch {
            // Selector validity is checked on attribute change; this catch is
            // belt-and-suspenders for the in-loop call.
        }
        if (handleEl && !handleEl.hasAttribute("tabindex")) {
            handleEl.setAttribute("tabindex", "0");
            handleEl.setAttribute("data-y-droplist-handle-tab", "");
        }
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
            }

            :host([disabled]) { cursor: not-allowed; }

            .list {
                display: flex;
                flex-direction: column;
                gap: var(--component-droplist-item-margin);
                box-sizing: border-box;
            }

            :host([vertical="false"]) .list {
                flex-direction: row;
            }

            ::slotted(*) {
                padding: var(--component-droplist-item-padding);
                box-sizing: border-box;
                user-select: none;
            }

            ::slotted([data-y-droplist-ghost]) {
                background: var(--component-droplist-ghost-background);
                border: var(--border-thin, 1px) dashed var(--component-droplist-ghost-border-color);
                opacity: var(--component-droplist-ghost-opacity);
                pointer-events: none;
            }

            ::slotted(.${DEFAULT_SWAP_CLASS}) {
                background: var(--component-droplist-swap-indicator-background);
            }

            .sr-live {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0,0,0,0);
                white-space: nowrap;
                border: 0;
            }
        `);
        return sheet;
    }

    _canAcceptFrom(source) {
        const myGroup = this.group;
        const theirGroup = source.group;
        if (!myGroup || !theirGroup || myGroup !== theirGroup) return false;
        if (source.pull === "false") return false;
        const put = this.put;
        if (put === "false") return false;
        if (put !== "true") {
            const allowed = put.split(",").map((s) => s.trim());
            if (!allowed.includes(theirGroup)) return false;
        }
        return true;
    }

    _clearSwapTarget() {
        if (this._swapTarget) {
            this._swapTarget.classList.remove(this.swapClass);
            this._swapTarget = null;
        }
    }

    _createGhost(refItem) {
        const rect = refItem.getBoundingClientRect();
        const ghost = document.createElement("div");
        // The ghost lives in light DOM (sibling of slotted items, so it participates
        // in the host's flex flow), which means ::part() can't reach it. Style it
        // via the [data-y-droplist-ghost] attribute selector, the ghost-class
        // attribute, or the --component-droplist-ghost-* custom properties instead.
        ghost.setAttribute("data-y-droplist-ghost", "");
        ghost.setAttribute("aria-hidden", "true");
        ghost.classList.add(this.ghostClass);
        if (this.vertical) ghost.style.height = `${rect.height}px`;
        else ghost.style.width = `${rect.width}px`;
        return ghost;
    }

    _dropSwap(source) {
        const target = this._swapTarget;
        const item = source._dragItem;
        if (!target || !item || item === target) {
            this._clearSwapTarget();
            return;
        }
        const oldIndex = this._index(item);
        this._swapItems(item, target);
        this._clearSwapTarget();
        const newIndex = this._index(item);
        if (newIndex === oldIndex) return;
        this._emit("reorder", { oldIndex, newIndex, item, list: this });
        this._emit("update", { item, oldIndex, newIndex, list: this });
        this._announce(`Item swapped with position ${newIndex + 1}.`);
    }

    _emit(name, detail) {
        this.dispatchEvent(
            new CustomEvent(name, {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
    }

    _eventItem(e) {
        const path = e.composedPath ? e.composedPath() : [e.target];
        for (const node of path) {
            if (node === this) return null;
            if (node && node.parentNode === this && !this._isInternal(node)) {
                return node;
            }
        }
        return null;
    }

    _findListForElement(el) {
        if (!el) return null;
        const myGroup = this.group;
        if (!myGroup) return null;
        const members = _groups.get(myGroup);
        if (!members) return null;
        for (const list of members) {
            if (list !== this && list.contains(el)) return list;
        }
        return null;
    }

    _findSwapTarget(e) {
        const items = this._items().filter((i) => i !== this._dragItem);
        if (items.length === 0) return null;

        const coord = this.vertical ? e.clientY : e.clientX;
        if (this.invertSwapElement) {
            // Item under cursor.
            for (const item of items) {
                const r = item.getBoundingClientRect();
                const start = this.vertical ? r.top : r.left;
                const end = this.vertical ? r.bottom : r.right;
                if (coord >= start && coord <= end) return item;
            }
            return null;
        }

        // Item whose midpoint the cursor has crossed.
        let target = null;
        for (const item of items) {
            const r = item.getBoundingClientRect();
            const mid = this.vertical
                ? r.top + r.height / 2
                : r.left + r.width / 2;
            if (coord >= mid) target = item;
        }
        return target;
    }

    _flip(snapshot) {
        if (this.animation === 0 || this._prefersReducedMotion()) return;

        const duration = `var(--component-droplist-transition-duration, ${this.animation}ms)`;
        const easing = "var(--component-droplist-transition-easing, ease)";

        for (const item of this._items()) {
            const before = snapshot.get(item);
            if (!before) continue;
            const after = item.getBoundingClientRect();
            const dx = before.left - after.left;
            const dy = before.top - after.top;
            if (dx === 0 && dy === 0) continue;
            item.style.transition = "none";
            item.style.transform = `translate(${dx}px, ${dy}px)`;
            void item.offsetWidth;
            item.style.transition = `transform ${duration} ${easing}`;
            item.style.transform = "";
            const onEnd = () => {
                item.style.transition = "";
                item.style.transform = "";
                item.removeEventListener("transitionend", onEnd);
            };
            item.addEventListener("transitionend", onEnd);
        }
    }

    _index(item) {
        return this._items().indexOf(item);
    }

    _initializeChildren() {
        const handle = this.handle;
        for (const child of Array.from(this.children)) {
            if (this._isInternal(child)) continue;
            child.setAttribute("role", "listitem");
            this._applyHandleA11y(child, handle);
            // Don't overwrite the active drag item's aria-grabbed="true" —
            // ghost insertion and other mid-drag mutations re-trigger this method.
            if (child !== this._dragItem) {
                child.setAttribute("aria-grabbed", "false");
            }
            if (this.disabled) child.removeAttribute("draggable");
            else child.setAttribute("draggable", "true");
        }
    }

    _isInternal(node) {
        return Boolean(
            node &&
            node.nodeType === 1 &&
            node.hasAttribute &&
            node.hasAttribute("data-y-droplist-ghost"),
        );
    }

    _items() {
        return Array.from(this.children).filter((c) => !this._isInternal(c));
    }

    _markSwapTarget(target) {
        if (this._swapTarget === target) return;
        const cls = this.swapClass;
        if (this._swapTarget) this._swapTarget.classList.remove(cls);
        if (target) target.classList.add(cls);
        this._swapTarget = target;
    }

    _moveByKeyboard(item, direction, focusEl) {
        if (this.disabled) return;
        const items = this._items();
        const oldIndex = items.indexOf(item);
        const newIndex = oldIndex + direction;
        if (oldIndex < 0 || newIndex < 0 || newIndex >= items.length) return;

        const snapshot = this._snapshot();
        const reference =
            direction > 0 ? items[newIndex].nextSibling : items[newIndex];
        this.insertBefore(item, reference);
        this._flip(snapshot);
        (focusEl || item).focus();
        this._emit("reorder", { oldIndex, newIndex, item, list: this });
        this._emit("update", { item, oldIndex, newIndex, list: this });
        this._announce(
            `Item moved from position ${oldIndex + 1} to position ${newIndex + 1}.`,
        );
    }

    _observeChildren() {
        this._observer = new MutationObserver(() => this._initializeChildren());
        this._observer.observe(this, { childList: true });
    }

    _onDragEnd(e) {
        const source = _activeSource;
        if (!source) return;
        const item = source._dragItem;
        if (!item) return;
        item.classList.remove(source.dragClass);
        item.setAttribute("aria-grabbed", "false");
        if (_ghostList) {
            _ghostList._removeGhost();
            _ghostList = null;
        }
        source._clearSwapTarget();
        source._dragItem = null;
        source._oldIndex = -1;
        _activeSource = null;
        source._emit("drag:end", { originalEvent: e, item, list: source });
    }

    _onDragEnter(e) {
        const source = _activeSource;
        if (!source || source === this) return;
        if (!this._canAcceptFrom(source)) return;
        const from = e.relatedTarget;
        if (from && this.contains(from)) return;
        this._emit("drag:enter", {
            originalEvent: e,
            item: source._dragItem,
            list: this,
            from: source,
        });
    }

    _onDragLeave(e) {
        const source = _activeSource;
        if (!source || source !== this) return;
        const to = e.relatedTarget;
        if (to && this.contains(to)) return;
        const toList = this._findListForElement(to);
        this._emit("drag:leave", {
            originalEvent: e,
            item: source._dragItem,
            list: this,
            to: toList,
        });
    }

    _onDragOver(e) {
        const source = _activeSource;
        if (!source) return;

        const isCrossList = source !== this;
        if (isCrossList && !this._canAcceptFrom(source)) return;

        const isClone = source.clone || source.pull === "clone";

        // Swap mode is same-list only and disabled when cloning.
        if (this.swap && !isCrossList && !isClone) {
            const target = this._findSwapTarget(e);
            this._markSwapTarget(target);
            if (target) e.preventDefault();
            return;
        }

        // Falling through to insert mode — clear any stale swap indicator.
        if (this._swapTarget) this._clearSwapTarget();

        // Move the ghost to this list if it currently lives elsewhere.
        if (_ghostList && _ghostList !== this) {
            _ghostList._removeGhost();
        }
        // Always accept the event — this allows dropping over the ghost,
        // flex gaps, and the drag item itself without the OS showing "no-drop".
        e.preventDefault();
        if (isCrossList && !this._ghost) {
            this._ghost = this._createGhost(source._dragItem);
        }
        _ghostList = this;
        const reference = this._projectInsertionPoint(e);
        this._placeGhost(reference);
    }

    _onDragStart(e) {
        if (this.disabled) {
            e.preventDefault();
            return;
        }
        const item = this._eventItem(e);
        if (!item) return;
        this._dragItem = item;
        this._oldIndex = this._index(item);
        item.classList.add(this.dragClass);
        item.setAttribute("aria-grabbed", "true");
        // Firefox refuses to start a drag without dataTransfer payload.
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            try {
                e.dataTransfer.setData("text/plain", "");
            } catch {
                // Some platforms throw when setData is called outside dragstart.
            }
        }
        _activeSource = this;
        this._emit("drag:start", { originalEvent: e, item, list: this });
    }

    _onDrop(e) {
        const source = _activeSource;
        if (!source) return;
        e.preventDefault();

        const isCrossList = source !== this;
        if (isCrossList && !this._canAcceptFrom(source)) return;

        const isClone = source.clone || source.pull === "clone";

        // Swap mode: same-list, non-clone.
        if (this.swap && !isCrossList && !isClone && this._swapTarget) {
            return this._dropSwap(source);
        }

        const item = source._dragItem;
        const oldIndex = source._oldIndex;
        const ghost = this._ghost;
        if (!ghost) return;

        const insertee = isClone ? item.cloneNode(true) : item;
        const snapshot = this._snapshot();
        this.insertBefore(insertee, ghost);
        this._removeGhost();
        _ghostList = null;

        const newIndex = this._index(insertee);
        this._flip(snapshot);

        if (isClone) this._initializeChildren();
        const destLabel = this.getAttribute("aria-label") || "";

        if (!isCrossList) {
            // Same-list drop.
            if (isClone) {
                this._emit("reorder", {
                    oldIndex: -1,
                    newIndex,
                    item: insertee,
                    list: this,
                });
                this._emit("update", {
                    item: insertee,
                    oldIndex: -1,
                    newIndex,
                    list: this,
                });
                this._announce(`Item copied to position ${newIndex + 1}.`);
                return;
            }
            if (newIndex !== oldIndex) {
                this._emit("reorder", { oldIndex, newIndex, item, list: this });
                this._emit("update", { item, oldIndex, newIndex, list: this });
                this._announce(
                    `Item moved from position ${oldIndex + 1} to position ${newIndex + 1}.`,
                );
            }
            return;
        }

        // Cross-list drop. Source-then-destination order per spec.
        source._emit("update", {
            item,
            oldIndex,
            newIndex: -1,
            list: source,
        });
        this._emit("reorder", {
            oldIndex: -1,
            newIndex,
            item: insertee,
            list: this,
            from: source,
        });
        this._emit("update", {
            item: insertee,
            oldIndex: -1,
            newIndex,
            list: this,
            from: source,
        });

        const verb = isClone ? "copied" : "moved";
        this._announce(
            destLabel
                ? `Item ${verb} to list ${destLabel} at position ${newIndex + 1}.`
                : `Item ${verb} to another list at position ${newIndex + 1}.`,
        );
    }

    _onKeyDown(e) {
        const target = e.target;
        if (!target) return;

        // Walk up from the focused element to find the containing item — this
        // lets keydown work when focus is on a handle nested inside the item.
        let item = target;
        while (item && item.parentNode !== this) item = item.parentNode;
        if (!item || this._isInternal(item)) return;

        let direction = 0;
        if (this.vertical) {
            if (e.key === "ArrowDown") direction = 1;
            else if (e.key === "ArrowUp") direction = -1;
        } else {
            if (e.key === "ArrowRight") direction = 1;
            else if (e.key === "ArrowLeft") direction = -1;
        }

        if (direction === 0) return;

        e.preventDefault();
        this._moveByKeyboard(item, direction, target);
    }

    _onPointerDown(e) {
        const handle = this.handle;
        if (!handle || this.disabled) return;

        const item = this._eventItem(e);
        if (!item) return;

        const path = e.composedPath ? e.composedPath() : [e.target];
        const start = path[0];
        let isHandle = false;
        let cur = start;
        while (cur && cur !== item) {
            if (cur.matches?.(handle)) {
                isHandle = true;
                break;
            }
            cur = cur.parentNode;
        }
        if (isHandle) return;

        item.setAttribute("draggable", "false");
        if (this.preventOnFilter) e.preventDefault();

        const restore = () => {
            if (item.isConnected && !this.disabled) {
                item.setAttribute("draggable", "true");
            }
        };
        const signal = this._abort?.signal;
        const opts = signal ? { once: true, signal } : { once: true };
        window.addEventListener("pointerup", restore, opts);
        window.addEventListener("pointercancel", restore, opts);
    }

    _placeGhost(reference) {
        if (!this._ghost) this._ghost = this._createGhost(this._dragItem);
        if (
            this._ghost.parentNode !== this ||
            this._ghost.nextSibling !== reference
        ) {
            this.insertBefore(this._ghost, reference || null);
        }
    }

    _prefersReducedMotion() {
        return Boolean(
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
    }

    _projectInsertionPoint(e) {
        const items = this._items().filter((i) => i !== this._dragItem);
        if (items.length === 0) return null;

        const coord = this.vertical ? e.clientY : e.clientX;
        for (const item of items) {
            const rect = item.getBoundingClientRect();
            const mid = this.vertical
                ? rect.top + rect.height / 2
                : rect.left + rect.width / 2;
            if (coord < mid) return item;
        }

        return null;
    }

    _removeGhost() {
        if (this._ghost && this._ghost.parentNode) this._ghost.remove();
        this._ghost = null;
    }

    _snapshot() {
        const map = new Map();
        for (const item of this._items()) {
            map.set(item, item.getBoundingClientRect());
        }
        return map;
    }

    _swapItems(a, b) {
        if (a === b || !a.parentNode || a.parentNode !== b.parentNode) return;
        if (a.nextSibling === b) {
            this.insertBefore(b, a);
            return;
        }
        if (b.nextSibling === a) {
            this.insertBefore(a, b);
            return;
        }
        const placeholder = document.createComment("");
        this.insertBefore(placeholder, a);
        this.insertBefore(a, b);
        this.insertBefore(b, placeholder);
        placeholder.remove();
    }

    _syncDisabledAria() {
        if (this.disabled) this.setAttribute("aria-disabled", "true");
        else this.removeAttribute("aria-disabled");
    }

    _teardown() {
        _unregisterFromGroup(this);

        if (_activeSource === this) _activeSource = null;
        if (_ghostList === this) _ghostList = null;

        this._abort?.abort();
        this._abort = null;
        this._observer?.disconnect();
        this._observer = null;
        this._removeGhost();
        this._clearSwapTarget();

        if (this._dragItem) {
            this._dragItem.classList.remove(this.dragClass);
            this._dragItem.setAttribute("aria-grabbed", "false");
            this._dragItem = null;
        }

        this._oldIndex = -1;
    }

    _wireEvents() {
        const signal = this._abort.signal;
        this.addEventListener("pointerdown", (e) => this._onPointerDown(e), {
            signal,
        });
        this.addEventListener("dragstart", (e) => this._onDragStart(e), {
            signal,
        });
        this.addEventListener("dragenter", (e) => this._onDragEnter(e), {
            signal,
        });
        this.addEventListener("dragleave", (e) => this._onDragLeave(e), {
            signal,
        });
        this.addEventListener("dragover", (e) => this._onDragOver(e), {
            signal,
        });
        this.addEventListener("drop", (e) => this._onDrop(e), { signal });
        this.addEventListener("dragend", (e) => this._onDragEnd(e), { signal });
        this.addEventListener("keydown", (e) => this._onKeyDown(e), { signal });
    }
}

if (!customElements.get("y-droplist")) {
    customElements.define("y-droplist", YumeDroplist);
}
