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

// ---------------------------------------------------------------------------
// Shared auto-scroll scheduler — only one RAF loop runs across all instances
// ---------------------------------------------------------------------------

let _scrollRafId = null;
let _scrollTarget = null; // Element | Window
let _scrollDx = 0;
let _scrollDy = 0;

/** Walk up from `list` to find the nearest scrollable ancestor, or window. */
function _findScrollContainer(list) {
    let el = list.parentElement;
    while (el) {
        const { overflowX, overflowY } = window.getComputedStyle(el);
        if (
            overflowX === "auto" ||
            overflowX === "scroll" ||
            overflowY === "auto" ||
            overflowY === "scroll"
        ) {
            return el;
        }
        el = el.parentElement;
    }
    return window;
}

function _scrollTick() {
    if (_scrollTarget === null) {
        _scrollRafId = null;
        return;
    }
    if (_scrollTarget === window) {
        window.scrollBy(_scrollDx, _scrollDy);
    } else {
        _scrollTarget.scrollLeft += _scrollDx;
        _scrollTarget.scrollTop += _scrollDy;
    }
    _scrollRafId = requestAnimationFrame(_scrollTick);
}

function _startScroll() {
    if (_scrollRafId !== null) return;
    _scrollRafId = requestAnimationFrame(_scrollTick);
}

function _stopScroll() {
    if (_scrollRafId !== null) {
        cancelAnimationFrame(_scrollRafId);
        _scrollRafId = null;
    }
    _scrollTarget = null;
    _scrollDx = 0;
    _scrollDy = 0;
}

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
        this._scrollContainer = null;
        this._lastGhostRef = null;

        // Touch / pointer-drag state
        this._touchActive = false;
        this._touchItem = null;
        this._touchPointerId = null;
        this._touchDelayTimer = null;
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._touchPointerAbort = null;

        // Granular drag event state
        this._moveRafId = null;
        this._movePending = null;
        this._lastDragOverTarget = null;

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

    /**
     * Delay (ms) before a press becomes a drag. `0` (default) means immediate.
     * Does not gate keyboard reordering.
     */
    get delay() {
        const n = parseInt(this.getAttribute("delay") ?? "0", 10);
        return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    set delay(val) {
        this.setAttribute("delay", String(val));
    }

    /**
     * When present, `delay` only applies to touch/pointer input — mouse drags
     * start immediately regardless of `delay`.
     */
    get delayOnTouchOnly() {
        return this.hasAttribute("delay-on-touch-only");
    }
    set delayOnTouchOnly(val) {
        if (val) this.setAttribute("delay-on-touch-only", "");
        else this.removeAttribute("delay-on-touch-only");
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

    /**
     * When present, the ghost element is appended to `document.body` with
     * `position: fixed` so it floats above all stacking contexts and
     * overflow-clipped containers. Default false.
     */
    get forceFloat() {
        return this.hasAttribute("force-float");
    }
    set forceFloat(val) {
        if (val) this.setAttribute("force-float", "");
        else this.removeAttribute("force-float");
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
     * When present, items dropped outside any valid target animate back to
     * their original index using FLIP. Default false (silent cancel).
     */
    get revert() {
        return this.hasAttribute("revert");
    }
    set revert(val) {
        if (val) this.setAttribute("revert", "");
        else this.removeAttribute("revert");
    }

    /**
     * Auto-scroll the nearest scrollable ancestor when the cursor is near its
     * edge. Enabled by default; set `scroll="false"` to disable.
     */
    get scroll() {
        return this.getAttribute("scroll") !== "false";
    }
    set scroll(val) {
        if (val === false || val === "false")
            this.setAttribute("scroll", "false");
        else this.removeAttribute("scroll");
    }

    /** Distance (px) from the scroll-container edge that engages auto-scroll. Default 30. */
    get scrollSensitivity() {
        const n = parseInt(this.getAttribute("scroll-sensitivity") ?? "30", 10);
        return Number.isFinite(n) && n > 0 ? n : 30;
    }
    set scrollSensitivity(val) {
        this.setAttribute("scroll-sensitivity", String(val));
    }

    /** Per-frame scroll delta (px). Default 10. Clamped internally to 30. */
    get scrollSpeed() {
        const n = parseInt(this.getAttribute("scroll-speed") ?? "10", 10);
        return Number.isFinite(n) && n > 0 ? n : 10;
    }
    set scrollSpeed(val) {
        this.setAttribute("scroll-speed", String(val));
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

    /**
     * Movement distance (px) required before a touch/pointer press becomes a
     * drag. Cancels any pending `delay` timer when exceeded before the timer
     * fires. `0` (default) means any movement starts the drag immediately after
     * `delay` (or instantly when `delay` is 0).
     */
    get touchStartThreshold() {
        const n = parseInt(
            this.getAttribute("touch-start-threshold") ?? "0",
            10,
        );
        return Number.isFinite(n) && n >= 0 ? n : 0;
    }
    set touchStartThreshold(val) {
        this.setAttribute("touch-start-threshold", String(val));
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
     * Returns the slotted item directly under the event's viewport coordinates,
     * or `null` if the event misses every item. Useful for building custom drop
     * indicators without polling `drag:move`.
     */
    closest(evt) {
        const el = document.elementFromPoint(evt.clientX, evt.clientY);
        if (!el) return null;
        let cur = el;
        while (cur) {
            if (cur.parentNode === this && !this._isInternal(cur)) return cur;
            cur = cur.parentNode;
        }
        return null;
    }

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

    /**
     * Get or set a configuration option by attribute name (kebab-case).
     * Omit `value` to read; provide `value` to write (mirrors to the attribute).
     * Recognised names match the documented attribute names.
     */
    option(name, value) {
        const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        if (arguments.length < 2) return this[camel];
        this[camel] = value;
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

    /**
     * Sorts slotted children using `compareFn`. When omitted, sorts by
     * `data-id` in ASCII order. Fires a single `update` event with
     * `{ oldIndex: -1, newIndex: -1 }` to signal a bulk change. The settle
     * animation runs once across the whole list.
     */
    sort(compareFn) {
        const items = this._items();
        if (items.length < 2) return;
        const snapshot = this._snapshot();
        const sorted = [...items].sort(
            compareFn ??
                ((a, b) => {
                    const aId = a.getAttribute("data-id") ?? "";
                    const bId = b.getAttribute("data-id") ?? "";
                    return aId < bId ? -1 : aId > bId ? 1 : 0;
                }),
        );
        for (const item of sorted) this.appendChild(item);
        this._flip(snapshot);
        this._emit("update", {
            item: null,
            oldIndex: -1,
            newIndex: -1,
            list: this,
        });
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

    /**
     * Returns `true` and applies side-effects (draggable reset, optional
     * `preventDefault`) when a pointerdown lands outside the configured drag
     * handle. Returns `false` when no handle is configured or the press is on
     * the handle — meaning the caller should continue with the drag pipeline.
     */
    _blockNonHandlePress(e) {
        const handle = this.handle;
        if (!handle || this.disabled) return false;

        const item = this._eventItem(e);
        if (!item) return false;

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
        if (isHandle) return false;

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
        return true;
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

    /** Cancel a pending delay without starting the drag. */
    _cancelTouchPending() {
        if (this._touchDelayTimer !== null) {
            clearTimeout(this._touchDelayTimer);
            this._touchDelayTimer = null;
        }
        if (this._touchItem) {
            this._touchItem.style.touchAction = "";
        }
        this._touchItem = null;
        this._touchPointerId = null;
        this._touchPointerAbort?.abort();
        this._touchPointerAbort = null;
    }

    /**
     * Emit `drag:over` on `targetList` when the item under the pointer changes.
     * Tracking is stored on the source instance (`source._lastDragOverTarget`).
     */
    _checkDragOver(source, e, targetList) {
        const hovered = targetList._itemAtPoint(e.clientX, e.clientY);
        if (!hovered || hovered === source._dragItem) return;
        if (hovered === source._lastDragOverTarget) return;
        source._lastDragOverTarget = hovered;
        targetList._emit("drag:over", {
            originalEvent: e,
            item: source._dragItem,
            list: targetList,
            target: hovered,
        });
    }

    _clearSwapTarget() {
        if (this._swapTarget) {
            this._swapTarget.classList.remove(this.swapClass);
            this._swapTarget = null;
        }
    }

    /**
     * Compute the per-frame scroll deltas (dx, dy) based on cursor proximity
     * to the edges of `container`. Returns `{ dx: 0, dy: 0 }` when the cursor
     * is not near any edge.
     */
    _computeScrollDeltas(e, container, sensitivity, speed) {
        let dx = 0;
        let dy = 0;
        if (container === window) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            if (e.clientX < sensitivity) dx = -speed;
            else if (e.clientX > vw - sensitivity) dx = speed;
            if (e.clientY < sensitivity) dy = -speed;
            else if (e.clientY > vh - sensitivity) dy = speed;
        } else {
            const r = container.getBoundingClientRect();
            if (e.clientX - r.left < sensitivity) dx = -speed;
            else if (r.right - e.clientX < sensitivity) dx = speed;
            if (e.clientY - r.top < sensitivity) dy = -speed;
            else if (r.bottom - e.clientY < sensitivity) dy = speed;
        }
        return { dx, dy };
    }

    _createGhost(refItem) {
        const rect = refItem.getBoundingClientRect();
        const ghost = _el("div", {
            "data-y-droplist-ghost": "",
            "aria-hidden": "true",
            class: this.ghostClass,
        });
        // The ghost lives in light DOM (sibling of slotted items, so it participates
        // in the host's flex flow), which means ::part() can't reach it. Style it
        // via the [data-y-droplist-ghost] attribute selector, the ghost-class
        // attribute, or the --component-droplist-ghost-* custom properties instead.
        if (this.forceFloat) {
            // Ghost lives in document.body — inline styles are needed since the
            // shadow-root ::slotted() rule won't reach it. CSS custom properties
            // still resolve if they are defined on :root.
            ghost.style.cssText = [
                "position:fixed",
                "pointer-events:none",
                "z-index:9999",
                `width:${rect.width}px`,
                `height:${rect.height}px`,
                "box-sizing:border-box",
                "background:var(--component-droplist-ghost-background,rgba(0,0,0,0.05))",
                "border:1px dashed var(--component-droplist-ghost-border-color,currentColor)",
                "opacity:var(--component-droplist-ghost-opacity,0.5)",
            ].join(";");
        } else {
            if (this.vertical) ghost.style.height = `${rect.height}px`;
            else ghost.style.width = `${rect.width}px`;
        }
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

    /**
     * Emit reorder/update events and announce the result after a completed
     * insert-mode drop. Handles same-list, clone, and cross-list cases.
     */
    _emitInsertComplete(
        source,
        targetList,
        item,
        insertee,
        oldIndex,
        newIndex,
        isClone,
        isCrossList,
    ) {
        const destLabel = targetList.getAttribute("aria-label") || "";
        if (!isCrossList) {
            if (isClone) {
                source._emit("reorder", {
                    oldIndex: -1,
                    newIndex,
                    item: insertee,
                    list: source,
                });
                source._emit("update", {
                    item: insertee,
                    oldIndex: -1,
                    newIndex,
                    list: source,
                });
                source._announce(`Item copied to position ${newIndex + 1}.`);
            } else if (newIndex !== oldIndex) {
                source._emit("reorder", {
                    oldIndex,
                    newIndex,
                    item,
                    list: source,
                });
                source._emit("update", {
                    item,
                    oldIndex,
                    newIndex,
                    list: source,
                });
                source._announce(
                    `Item moved from position ${oldIndex + 1} to position ${newIndex + 1}.`,
                );
            }
            return;
        }
        // Cross-list drop. Source-then-destination order per spec.
        source._emit("update", { item, oldIndex, newIndex: -1, list: source });
        targetList._emit("reorder", {
            oldIndex: -1,
            newIndex,
            item: insertee,
            list: targetList,
            from: source,
        });
        targetList._emit("update", {
            item: insertee,
            oldIndex: -1,
            newIndex,
            list: targetList,
            from: source,
        });
        const verb = isClone ? "copied" : "moved";
        targetList._announce(
            destLabel
                ? `Item ${verb} to list ${destLabel} at position ${newIndex + 1}.`
                : `Item ${verb} to another list at position ${newIndex + 1}.`,
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

    /**
     * Returns the zero-based index at which the ghost is currently projected
     * to be inserted (counting only non-ghost children before the ghost).
     */
    _ghostIndex(ghost) {
        let index = 0;

        for (const child of this.children) {
            if (child === ghost) return index;
            if (!this._isInternal(child)) index++;
        }

        return index;
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

    /** Returns the first item whose bounding rect contains `(x, y)`, or null. */
    _itemAtPoint(x, y) {
        for (const item of this._items()) {
            const r = item.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
                return item;
            }
        }
        return null;
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

        _stopScroll();
        source._scrollContainer = null;

        item.classList.remove(source.dragClass);
        item.setAttribute("aria-grabbed", "false");

        // If the ghost still exists, the drag was cancelled (no valid drop).
        const isCancelled = _ghostList !== null;

        if (_ghostList) {
            if (isCancelled && source.revert) {
                // Animate displaced items back to their pre-ghost positions (FLIP).
                const ghostListRef = _ghostList;
                const snapshot = ghostListRef._snapshot();
                ghostListRef._removeGhost();
                _ghostList = null;
                source._clearSwapTarget();
                source._dragItem = null;
                source._oldIndex = -1;
                source._lastDragOverTarget = null;
                _activeSource = null;
                ghostListRef._flip(snapshot);

                const delay =
                    ghostListRef.animation === 0 ||
                    ghostListRef._prefersReducedMotion()
                        ? 0
                        : ghostListRef.animation;

                if (delay > 0) {
                    setTimeout(
                        () =>
                            source._emit("drag:end", {
                                originalEvent: e,
                                item,
                                list: source,
                            }),
                        delay,
                    );
                } else {
                    source._emit("drag:end", {
                        originalEvent: e,
                        item,
                        list: source,
                    });
                }
                return;
            }
            _ghostList._removeGhost();
            _ghostList = null;
        }

        source._clearSwapTarget();
        source._dragItem = null;
        source._oldIndex = -1;
        source._lastDragOverTarget = null;
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

        // Auto-scroll runs in all modes (swap and insert) as long as source has it enabled.
        if (source.scroll) {
            if (!source._scrollContainer) {
                source._scrollContainer = _findScrollContainer(this);
            }
            this._updateScroll(e, source);
        }

        const isClone = source.clone || source.pull === "clone";

        // Throttled drag:move (fires regardless of swap/insert mode).
        this._scheduleMoveEmit(source, e);

        // Swap mode is same-list only and disabled when cloning.
        if (this.swap && !isCrossList && !isClone) {
            const target = this._findSwapTarget(e);
            this._markSwapTarget(target);
            if (target) {
                e.preventDefault();
                this._checkDragOver(source, e, this);
            }
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
        this._checkDragOver(source, e, this);
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
            const swapDropIndex = this._index(this._swapTarget);
            this._emit("drag:drop", {
                originalEvent: e,
                item: source._dragItem,
                list: this,
                index: swapDropIndex,
            });
            return this._dropSwap(source);
        }

        const item = source._dragItem;
        const oldIndex = source._oldIndex;
        const ghost = this._ghost;
        if (!ghost) return;

        const insertee = isClone ? item.cloneNode(true) : item;
        const snapshot = this._snapshot();
        // When force-float, the ghost lives in document.body, so it cannot be
        // used as an insertBefore marker. Use the tracked _lastGhostRef instead.
        const insertionRef = this.forceFloat ? this._lastGhostRef : ghost;
        const dropIndex = this.forceFloat
            ? (insertionRef ? Array.prototype.indexOf.call(this.children, insertionRef) : this.children.length)
            : this._ghostIndex(ghost);

        this._emit("drag:drop", {
            originalEvent: e,
            item: insertee,
            list: this,
            index: dropIndex,
        });
        this.insertBefore(insertee, insertionRef || null);
        this._removeGhost();
        this._lastGhostRef = null;
        _ghostList = null;

        const newIndex = this._index(insertee);
        this._flip(snapshot);

        if (isClone) this._initializeChildren();
        this._emitInsertComplete(
            source,
            this,
            item,
            insertee,
            oldIndex,
            newIndex,
            isClone,
            isCrossList,
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

    _onPointerCancel(e) {
        if (!this._touchItem) return;
        if (this._touchDelayTimer !== null) {
            this._cancelTouchPending();
            return;
        }
        this._touchDragEnd(e);
    }

    _onPointerDown(e) {
        if (this._blockNonHandlePress(e)) return;

        // ── Touch / pointer drag pipeline ──────────────────────────────────────
        // Only engage for touch/pen pointer types, or for mouse when we have a
        // non-zero delay that should also apply to mouse (i.e. delayOnTouchOnly
        // is false). For plain mouse with no delay or delay-on-touch-only, let
        // the native HTML5 DnD path handle everything.
        if (this.disabled) return;

        const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
        const effectiveDelay =
            isTouch || !this.delayOnTouchOnly ? this.delay : 0;

        // Mouse with no effective delay: defer entirely to native DnD events.
        if (!isTouch && effectiveDelay === 0) return;

        const item = this._eventItem(e);
        if (!item) return;

        // Prevent the browser from taking over the touch scroll / text selection.
        e.preventDefault();

        this._touchItem = item;
        this._touchPointerId = e.pointerId;
        this._touchStartX = e.clientX;
        this._touchStartY = e.clientY;

        // Capture pointer so pointermove fires even if the finger drifts off the element.
        try {
            item.setPointerCapture(e.pointerId);
        } catch {
            /* optional */
        }

        // Set touch-action:none to block native scrolling during potential drag.
        item.style.touchAction = "none";

        // Set up per-gesture pointer listeners on the item.
        this._touchPointerAbort = new AbortController();
        const sig = this._touchPointerAbort.signal;

        item.addEventListener("pointermove", (ev) => this._onPointerMove(ev), {
            signal: sig,
        });
        item.addEventListener("pointerup", (ev) => this._onPointerUp(ev), {
            signal: sig,
        });
        item.addEventListener(
            "pointercancel",
            (ev) => this._onPointerCancel(ev),
            { signal: sig },
        );

        if (effectiveDelay > 0) {
            // Arm the delay timer. The move handler will cancel it if the
            // pointer moves beyond touchStartThreshold before the timer fires.
            this._touchDelayTimer = setTimeout(() => {
                this._touchDelayTimer = null;
                if (this._touchItem === item) this._touchDragStart(e, item);
            }, effectiveDelay);
        } else {
            // No delay — start the drag immediately.
            this._touchDragStart(e, item);
        }
    }

    _onPointerMove(e) {
        if (!this._touchItem) return;

        const dx = e.clientX - this._touchStartX;
        const dy = e.clientY - this._touchStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const threshold = this.touchStartThreshold;

        if (this._touchDelayTimer !== null) {
            // Still in the delay window — cancel if movement exceeds threshold.
            if (threshold > 0 && dist > threshold) {
                this._cancelTouchPending();
            }
            return;
        }

        // Drag is active.
        if (!this._touchActive) return;

        // Build a synthetic event-like object that has the coordinates we need.
        // This object is passed to _onDragOver-equivalent logic.
        const synthetic = { clientX: e.clientX, clientY: e.clientY };

        // Auto-scroll.
        if (this.scroll) {
            if (!this._scrollContainer) {
                this._scrollContainer = _findScrollContainer(this);
            }
            this._updateScroll(synthetic, this);
        }

        // Hit-test to find which list (could be a cross-list group member) the
        // pointer is currently over.
        const targetList = this._touchHitList(e.clientX, e.clientY);

        if (!targetList) {
            // Cursor is outside all lists — remove ghost if it's in one.
            if (_ghostList) {
                _ghostList._removeGhost();
                _ghostList = null;
            }
            _stopScroll();
            return;
        }

        // Cross-list compatibility check.
        const isCrossList = targetList !== this;
        if (isCrossList && !targetList._canAcceptFrom(this)) {
            if (_ghostList) {
                _ghostList._removeGhost();
                _ghostList = null;
            }
            return;
        }

        // Move ghost to the target list if needed.
        if (_ghostList && _ghostList !== targetList) {
            _ghostList._removeGhost();
        }
        if (!targetList._ghost) {
            targetList._ghost = targetList._createGhost(this._dragItem);
        }
        _ghostList = targetList;

        // Throttled move + transition-based over events.
        this._scheduleMoveEmit(this, e);
        this._checkDragOver(this, e, targetList);

        const reference = targetList._projectInsertionPoint(synthetic);
        targetList._placeGhost(reference);
    }

    _onPointerUp(e) {
        if (!this._touchItem) return;

        if (this._touchDelayTimer !== null) {
            // Pointer released before the delay fired — cancel without dragging.
            this._cancelTouchPending();
            return;
        }

        if (!this._touchActive) {
            this._cancelTouchPending();
            return;
        }

        // Commit the drop.
        const targetList = this._touchHitList(e.clientX, e.clientY);
        if (targetList) {
            const isCrossList = targetList !== this;
            if (!isCrossList || targetList._canAcceptFrom(this)) {
                // Synthesize a drop on the target list.
                this._touchCommitDrop(targetList, e);
                return;
            }
        }

        // Dropped outside any valid target.
        this._touchDragEnd(e);
    }

    _placeGhost(reference) {
        if (!this._ghost) this._ghost = this._createGhost(this._dragItem);

        if (this.forceFloat) {
            // Track the last insertion reference for use in _onDrop, since the
            // ghost lives in body and can't serve as a DOM insertBefore marker.
            this._lastGhostRef = reference;
            this._positionFloatGhost(reference);

            if (!this._ghost.parentNode) {
                document.body.appendChild(this._ghost);
            }
        } else {
            if (
                this._ghost.parentNode !== this ||
                this._ghost.nextSibling !== reference
            ) {
                this.insertBefore(this._ghost, reference || null);
            }
        }
    }

    /**
     * Update the `top`/`left` of a force-float ghost to match the current
     * projected insertion point in viewport coordinates.
     */
    _positionFloatGhost(reference) {
        const ghost = this._ghost;
        if (!ghost) return;
        if (reference) {
            const r = reference.getBoundingClientRect();
            ghost.style.top = `${r.top}px`;
            ghost.style.left = `${r.left}px`;
        } else {
            const items = this._items();
            if (items.length > 0) {
                const last = items[items.length - 1];
                const r = last.getBoundingClientRect();
                if (this.vertical) {
                    ghost.style.top = `${r.bottom}px`;
                    ghost.style.left = `${r.left}px`;
                } else {
                    ghost.style.top = `${r.top}px`;
                    ghost.style.left = `${r.right}px`;
                }
            } else {
                const r = this.getBoundingClientRect();
                ghost.style.top = `${r.top}px`;
                ghost.style.left = `${r.left}px`;
            }
        }
    }

    /**
     * Resets all touch drag state after a committed drop or cancel.
     * The caller is always responsible for emitting `drag:end`.
     */
    _touchCleanup(item, _pointerEvent) {
        if (item) {
            item.classList.remove(this.dragClass);
            item.setAttribute("aria-grabbed", "false");
            item.style.touchAction = "";
        }
        this._touchActive = false;
        this._touchItem = null;
        this._touchPointerId = null;
        this._touchStartX = 0;
        this._touchStartY = 0;
        this._clearSwapTarget();
        this._dragItem = null;
        this._oldIndex = -1;
        this._lastDragOverTarget = null;
        _activeSource = null;
        this._touchPointerAbort?.abort();
        this._touchPointerAbort = null;
    }

    /**
     * Commits a touch drop onto `targetList` then cleans up.
     */
    _touchCommitDrop(targetList, pointerEvent) {
        const source = this;
        const item = source._dragItem;
        const oldIndex = source._oldIndex;

        const isClone = source.clone || source.pull === "clone";
        const isCrossList = targetList !== source;
        const isSwap =
            targetList.swap &&
            !isCrossList &&
            !isClone &&
            targetList._swapTarget;

        _stopScroll();
        source._scrollContainer = null;

        if (isSwap) {
            const swapDropIndex = targetList._index(targetList._swapTarget);
            targetList._emit("drag:drop", {
                originalEvent: pointerEvent,
                item,
                list: targetList,
                index: swapDropIndex,
            });
            targetList._dropSwap(source);
        } else {
            const ghost = targetList._ghost;
            if (ghost) {
                const insertee = isClone ? item.cloneNode(true) : item;
                const snapshot = targetList._snapshot();
                const insertionRef = targetList.forceFloat
                    ? targetList._lastGhostRef
                    : ghost;
                const dropIndex = targetList.forceFloat
                    ? (insertionRef ? Array.prototype.indexOf.call(targetList.children, insertionRef) : targetList.children.length)
                    : targetList._ghostIndex(ghost);

                targetList._emit("drag:drop", {
                    originalEvent: pointerEvent,
                    item: insertee,
                    list: targetList,
                    index: dropIndex,
                });
                targetList.insertBefore(insertee, insertionRef || null);
                targetList._removeGhost();
                targetList._lastGhostRef = null;
                _ghostList = null;

                const newIndex = targetList._index(insertee);
                targetList._flip(snapshot);
                if (isClone) targetList._initializeChildren();
                source._emitInsertComplete(
                    source,
                    targetList,
                    item,
                    insertee,
                    oldIndex,
                    newIndex,
                    isClone,
                    isCrossList,
                );
            }
        }

        this._touchCleanup(item, pointerEvent);
        this._emit("drag:end", {
            originalEvent: pointerEvent,
            item,
            list: this,
        });
    }

    /**
     * Ends an active touch drag without a valid drop (cancel / drop outside).
     */
    _touchDragEnd(pointerEvent) {
        const item = this._dragItem;
        _stopScroll();
        this._scrollContainer = null;

        const isCancelled = _ghostList !== null;

        if (_ghostList) {
            if (isCancelled && this.revert) {
                const ghostListRef = _ghostList;
                const snapshot = ghostListRef._snapshot();

                ghostListRef._removeGhost();
                _ghostList = null;
                this._clearSwapTarget();
                ghostListRef._flip(snapshot);

                const delay =
                    ghostListRef.animation === 0 ||
                    ghostListRef._prefersReducedMotion()
                        ? 0
                        : ghostListRef.animation;
                this._touchCleanup(item, pointerEvent);

                if (delay > 0) {
                    setTimeout(
                        () =>
                            this._emit("drag:end", {
                                originalEvent: pointerEvent,
                                item,
                                list: this,
                            }),
                        delay,
                    );
                } else {
                    this._emit("drag:end", {
                        originalEvent: pointerEvent,
                        item,
                        list: this,
                    });
                }
                return;
            }
            _ghostList._removeGhost();
            _ghostList = null;
        }

        this._touchCleanup(item, pointerEvent);
        this._emit("drag:end", {
            originalEvent: pointerEvent,
            item,
            list: this,
        });
    }

    /**
     * Called when delay timer fires or when delay===0 and a touch press begins.
     * Marks the drag as active and emits drag:start.
     */
    _touchDragStart(originalPointerEvent, item) {
        if (this.disabled || _activeSource) return;

        this._touchActive = true;
        this._dragItem = item;
        this._oldIndex = this._index(item);

        item.classList.add(this.dragClass);
        item.setAttribute("aria-grabbed", "true");
        item.style.touchAction = "none";

        _activeSource = this;

        // Place the initial ghost.
        if (!this._ghost) this._ghost = this._createGhost(item);
        _ghostList = this;
        this._placeGhost(null);

        this._emit("drag:start", {
            originalEvent: originalPointerEvent,
            item,
            list: this,
        });
    }

    /**
     * Hit-test `(x, y)` against all known droplists that could accept the
     * current drag (this list for same-list, group members for cross-list).
     * Returns the deepest matching list, or `this` if the point is anywhere
     * inside this list's bounding box (fallback for within-list reorder).
     */
    _touchHitList(x, y) {
        // Check this list first.
        const myRect = this.getBoundingClientRect();
        const inSelf =
            x >= myRect.left &&
            x <= myRect.right &&
            y >= myRect.top &&
            y <= myRect.bottom;

        // Check group peers.
        const myGroup = this.group;
        if (myGroup) {
            const members = _groups.get(myGroup);
            if (members) {
                for (const list of members) {
                    if (list === this) continue;
                    const r = list.getBoundingClientRect();
                    if (
                        x >= r.left &&
                        x <= r.right &&
                        y >= r.top &&
                        y <= r.bottom
                    ) {
                        return list;
                    }
                }
            }
        }

        return inSelf ? this : null;
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
        this._lastGhostRef = null;
    }

    /**
     * Schedule a `drag:move` emission on `source` for the next animation frame,
     * coalescing rapid pointer events so at most one fires per frame.
     */
    _scheduleMoveEmit(source, e) {
        source._movePending = e;
        if (source._moveRafId !== null) return;
        source._moveRafId = requestAnimationFrame(() => {
            source._moveRafId = null;
            const ev = source._movePending;
            source._movePending = null;
            if (!ev || !source._dragItem) return;
            source._emit("drag:move", {
                originalEvent: ev,
                item: source._dragItem,
                list: source,
                x: ev.clientX,
                y: ev.clientY,
            });
        });
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

        if (_activeSource === this) {
            _stopScroll();
            if (_ghostList && _ghostList !== this) {
                _ghostList._removeGhost();
            }
            _ghostList = null;
            _activeSource = null;
        }
        if (_ghostList === this) _ghostList = null;
        this._scrollContainer = null;

        this._abort?.abort();
        this._abort = null;
        this._observer?.disconnect();
        this._observer = null;
        this._removeGhost();
        this._clearSwapTarget();

        // Cancel any in-progress touch gesture.
        if (this._touchDelayTimer !== null) {
            clearTimeout(this._touchDelayTimer);
            this._touchDelayTimer = null;
        }
        if (this._touchItem) {
            this._touchItem.style.touchAction = "";
            this._touchItem = null;
        }
        this._touchActive = false;
        this._touchPointerId = null;
        this._touchPointerAbort?.abort();
        this._touchPointerAbort = null;

        if (this._moveRafId !== null) {
            cancelAnimationFrame(this._moveRafId);
            this._moveRafId = null;
        }
        this._movePending = null;
        this._lastDragOverTarget = null;

        if (this._dragItem) {
            this._dragItem.classList.remove(this.dragClass);
            this._dragItem.setAttribute("aria-grabbed", "false");
            this._dragItem = null;
        }

        this._oldIndex = -1;
    }

    /**
     * Compute and apply auto-scroll state based on the current cursor position
     * relative to the cached scroll container.
     *
     * @param {DragEvent} e
     * @param {YumeDroplist} source  The source list (owns sensitivity/speed attrs).
     */
    _updateScroll(e, source) {
        const container = source._scrollContainer;
        if (!container) return;

        const sensitivity = source.scrollSensitivity;
        const rawSpeed = source.scrollSpeed;
        const speed = this._prefersReducedMotion()
            ? Math.ceil(rawSpeed / 2)
            : rawSpeed;
        const clampedSpeed = Math.min(speed, 30);

        const { dx, dy } = this._computeScrollDeltas(
            e,
            container,
            sensitivity,
            clampedSpeed,
        );

        _scrollDx = dx;
        _scrollDy = dy;
        _scrollTarget = dx !== 0 || dy !== 0 ? container : null;

        // When near the edge, ensure the RAF loop is running.
        // When not near the edge, set _scrollTarget = null so _scrollTick
        // winds down naturally on its next invocation.
        if (_scrollTarget) _startScroll();
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
