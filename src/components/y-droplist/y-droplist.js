import { createElement as _el } from "../../modules/helpers.js";

const DEFAULT_GHOST_CLASS = "y-droplist__ghost";
const DEFAULT_DRAG_CLASS = "y-droplist__dragging";

export class YumeDroplist extends HTMLElement {
    static get observedAttributes() {
        return [
            "disabled",
            "vertical",
            "animation",
            "ghost-class",
            "drag-class",
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
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "list");
        this._abort = new AbortController();
        this._wireEvents();
        this._observeChildren();
        this._initializeChildren();
        this._syncDisabledAria();
    }

    disconnectedCallback() {
        this._teardown();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "disabled") {
            this._syncDisabledAria();
            this._initializeChildren();
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

    /**
     * True if `item` is a direct slotted child of this droplist.
     * Note: this overrides Node.prototype.contains and is intentionally stricter —
     * it returns false for descendants nested inside slotted children, and excludes
     * the internal ghost placeholder. Use `Node.prototype.contains.call(el, x)` if
     * you need native ancestry semantics.
     */
    contains(item) {
        return (
            Boolean(item) && item.parentNode === this && !this._isInternal(item)
        );
    }

    /** Removes all listeners and observers. The component re-initializes if reconnected to the DOM. */
    destroy() {
        this._teardown();
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

    _createGhost(refItem) {
        const rect = refItem.getBoundingClientRect();
        const ghost = document.createElement("div");
        ghost.setAttribute("data-y-droplist-ghost", "");
        ghost.setAttribute("part", "ghost");
        ghost.setAttribute("aria-hidden", "true");
        ghost.classList.add(this.ghostClass);
        if (this.vertical) ghost.style.height = `${rect.height}px`;
        else ghost.style.width = `${rect.width}px`;
        return ghost;
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
        for (const child of Array.from(this.children)) {
            if (this._isInternal(child)) continue;
            child.setAttribute("role", "listitem");
            if (!child.hasAttribute("tabindex"))
                child.setAttribute("tabindex", "0");
            child.setAttribute("aria-grabbed", "false");
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

    _moveByKeyboard(item, direction) {
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
        item.focus();
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
        if (!this._dragItem) return;
        const item = this._dragItem;
        item.classList.remove(this.dragClass);
        item.setAttribute("aria-grabbed", "false");
        this._removeGhost();
        this._dragItem = null;
        this._oldIndex = -1;
        this._emit("drag:end", { originalEvent: e, item, list: this });
    }

    _onDragOver(e) {
        if (!this._dragItem) return;
        // Always allow the drop while a drag is active — dropping over the
        // ghost, the flex gap, or the drag item itself otherwise refuses.
        e.preventDefault();
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
        this._emit("drag:start", { originalEvent: e, item, list: this });
    }

    _onDrop(e) {
        if (!this._dragItem) return;

        e.preventDefault();
        const item = this._dragItem;
        const oldIndex = this._oldIndex;
        const ghost = this._ghost;
        if (!ghost) return;

        const snapshot = this._snapshot();
        this.insertBefore(item, ghost);
        this._removeGhost();

        const newIndex = this._index(item);
        this._flip(snapshot);

        if (newIndex !== oldIndex) {
            this._emit("reorder", { oldIndex, newIndex, item, list: this });
            this._emit("update", { item, oldIndex, newIndex, list: this });
            this._announce(
                `Item moved from position ${oldIndex + 1} to position ${newIndex + 1}.`,
            );
        }
    }

    _onKeyDown(e) {
        const target = e.target;
        if (!target || target.parentNode !== this || this._isInternal(target))
            return;

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
        this._moveByKeyboard(target, direction);
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

    _syncDisabledAria() {
        if (this.disabled) this.setAttribute("aria-disabled", "true");
        else this.removeAttribute("aria-disabled");
    }

    _teardown() {
        this._abort?.abort();
        this._abort = null;
        this._observer?.disconnect();
        this._observer = null;
        this._removeGhost();
        if (this._dragItem) {
            this._dragItem.classList.remove(this.dragClass);
            this._dragItem.setAttribute("aria-grabbed", "false");
            this._dragItem = null;
        }
        this._oldIndex = -1;
    }

    _wireEvents() {
        const signal = this._abort.signal;
        this.addEventListener("dragstart", (e) => this._onDragStart(e), {
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
