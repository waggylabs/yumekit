import { createElement as _el, clamp } from "../../modules/helpers.js";
import "../y-icon/y-icon.js";

const VALID_ORIENTATIONS = new Set(["horizontal", "vertical"]);
const VALID_HANDLE_POSITIONS = new Set(["center", "start", "end"]);

const DEFAULT_SPLIT = 0.5;
const DEFAULT_MIN_RATIO = 0.1;
const DEFAULT_MAX_RATIO = 0.9;
const DEFAULT_HANDLE_SIZE = 10;
const DEFAULT_KEYBOARD_STEP = 0.01;
const DEFAULT_KEYBOARD_STEP_LARGE = 0.1;

export class YumeSplitter extends HTMLElement {
    static get observedAttributes() {
        return [
            "orientation",
            "split",
            "min-ratio",
            "max-ratio",
            "disabled",
            "handle-size",
            "handle-position",
            "aria-label",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._split = DEFAULT_SPLIT;
        this._rafId = null;
        this._pendingSplit = null;
        this._dragging = false;
        this._pointerId = null;
        this._observer = null;
        this._onChildrenChanged = this._onChildrenChanged.bind(this);
        this._onHandlePointerDown = this._onHandlePointerDown.bind(this);
        this._onHandlePointerMove = this._onHandlePointerMove.bind(this);
        this._onHandlePointerUp = this._onHandlePointerUp.bind(this);
        this._onHandleKeyDown = this._onHandleKeyDown.bind(this);
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "group");

        this._split = this._readSplitAttribute();
        this._assignPaneSlots();
        this._observer = new MutationObserver(this._onChildrenChanged);
        this._observer.observe(this, { childList: true });
        this._applySplit();
        this._syncHandleAria();
    }

    disconnectedCallback() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }

        this._releasePointer();

        if (this._rafId != null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "split") {
            const next = this._readSplitAttribute();
            if (next !== this._split) {
                this._split = next;
                this._applySplit();
                this._emit("split-changed", {
                    split: this._split,
                    orientation: this.orientation,
                });
            }
            return;
        }

        if (
            name === "orientation" ||
            name === "handle-size" ||
            name === "handle-position"
        ) {
            this.render();
            this._assignPaneSlots();
            this._applySplit();
            this._syncHandleAria();
            return;
        }

        if (name === "min-ratio" || name === "max-ratio") {
            const clamped = clamp(this._split, this.minRatio, this.maxRatio);
            if (clamped !== this._split) {
                this._split = clamped;
                this._reflectSplitAttribute();
                this._applySplit();
                this._emit("split-changed", {
                    split: this._split,
                    orientation: this.orientation,
                });
            } else {
                this._syncHandleAria();
            }
            return;
        }
        if (name === "disabled") {
            this._syncHandleAria();
            if (this.disabled) this._releasePointer();
            return;
        }
        if (name === "aria-label") {
            this._syncHandleAria();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Disables drag and keyboard resizing. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** Visual position of the visible handle line within the handle area. */
    get handlePosition() {
        const v = this.getAttribute("handle-position");
        return VALID_HANDLE_POSITIONS.has(v) ? v : "center";
    }
    set handlePosition(val) {
        this.setAttribute("handle-position", val);
    }

    /** Width (horizontal) or height (vertical) of the drag handle in pixels. */
    get handleSize() {
        const n = parseFloat(this.getAttribute("handle-size"));
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_HANDLE_SIZE;
    }
    set handleSize(val) {
        this.setAttribute("handle-size", String(val));
    }

    /** Maximum ratio for the first pane (0.0 to 1.0). */
    get maxRatio() {
        const n = parseFloat(this.getAttribute("max-ratio"));
        const v = Number.isFinite(n) ? n : DEFAULT_MAX_RATIO;
        return clamp(v, 0, 1);
    }
    set maxRatio(val) {
        this.setAttribute("max-ratio", String(val));
    }

    /** Minimum ratio for the first pane (0.0 to 1.0). */
    get minRatio() {
        const n = parseFloat(this.getAttribute("min-ratio"));
        const v = Number.isFinite(n) ? n : DEFAULT_MIN_RATIO;
        return clamp(v, 0, 1);
    }
    set minRatio(val) {
        this.setAttribute("min-ratio", String(val));
    }

    /** Direction of the split: "horizontal" (left/right) or "vertical" (top/bottom). */
    get orientation() {
        const v = this.getAttribute("orientation");
        return VALID_ORIENTATIONS.has(v) ? v : "horizontal";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** Current split ratio (0.0 to 1.0) of the first pane. */
    get split() {
        return this._split;
    }
    set split(val) {
        const n = parseFloat(val);
        if (!Number.isFinite(n)) return;
        this.setAttribute(
            "split",
            String(clamp(n, this.minRatio, this.maxRatio)),
        );
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];

        const handleSlot = _el("slot", { name: "handle" });
        handleSlot.appendChild(
            _el("y-icon", {
                name: this._isHorizontal() ? "ellipsis-v" : "ellipsis-h",
                "aria-hidden": "true",
                class: "grip",
                part: "grip",
            }),
        );

        const handle = _el(
            "div",
            {
                class: "handle",
                part: "handle",
                role: "slider",
                tabindex: this.disabled ? "-1" : "0",
            },
            [
                _el("div", { class: "handle-line", part: "handle-line", "aria-hidden": "true" }),
                handleSlot,
            ],
        );
        handle.addEventListener("pointerdown", this._onHandlePointerDown);
        handle.addEventListener("keydown", this._onHandleKeyDown);

        const root = _el("div", { class: "splitter", part: "container" }, [
            _el("div", { class: "pane pane-1", part: "pane-1" }, [
                _el("slot", { name: "pane-1" }),
            ]),
            handle,
            _el("div", { class: "pane pane-2", part: "pane-2" }, [
                _el("slot", { name: "pane-2" }),
            ]),
        ]);

        this.shadowRoot.replaceChildren(root);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applySplit() {
        const root = this.shadowRoot?.querySelector(".splitter");
        if (!root) return;
        root.style.setProperty("--_split", String(this._split));
        root.style.setProperty("--_handle-size", `${this.handleSize}px`);
    }

    _assignPaneSlots() {
        let paneIndex = 0;
        for (const child of Array.from(this.children)) {
            if (child.getAttribute && child.getAttribute("slot") === "handle")
                continue;
            const target =
                paneIndex === 0 ? "pane-1" : paneIndex === 1 ? "pane-2" : null;
            if (target == null) {
                console.warn(
                    "<y-splitter> ignores extra children beyond the first two panes.",
                );
                if (child.getAttribute) child.removeAttribute("slot");
                paneIndex += 1;
                continue;
            }
            if (child.getAttribute && child.getAttribute("slot") !== target) {
                child.setAttribute("slot", target);
            }
            paneIndex += 1;
        }
    }

    _buildStyleSheet() {
        const handlePosition = this.handlePosition;
        // Aligns the visible line + grip within the (possibly larger) handle area.
        const align =
            handlePosition === "start"
                ? "flex-start"
                : handlePosition === "end"
                  ? "flex-end"
                  : "center";

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                position: relative;
                box-sizing: border-box;
                width: 100%;
                height: 100%;
                min-width: 0;
                min-height: 0;
            }

            .splitter {
                display: flex;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                --_split: ${DEFAULT_SPLIT};
                --_handle-size: ${DEFAULT_HANDLE_SIZE}px;
            }

            :host([orientation="vertical"]) .splitter {
                flex-direction: column;
            }

            .pane {
                box-sizing: border-box;
                overflow: auto;
                min-width: 0;
                min-height: 0;
            }

            .pane-1 {
                flex: 0 0 calc(var(--_split) * (100% - var(--_handle-size)));
            }

            .pane-2 {
                flex: 1 1 0;
            }

            .handle {
                box-sizing: border-box;
                flex: 0 0 var(--component-splitter-handle-size, var(--_handle-size));
                position: relative;
                display: flex;
                align-items: ${align};
                justify-content: center;
                background: var(--component-splitter-handle-background, transparent);
                color: var(--component-splitter-handle-grip-color, currentColor);
                cursor: var(--component-splitter-cursor, col-resize);
                touch-action: none;
                user-select: none;
                outline: none;
                transition: background 0.15s ease, color 0.15s ease;
            }

            :host([orientation="vertical"]) .handle {
                flex-direction: column;
                align-items: center;
                justify-content: ${align};
                cursor: var(--component-splitter-cursor, row-resize);
            }

            .handle:hover {
                background: var(--component-splitter-handle-hover-background, rgba(0, 0, 0, 0.06));
            }
            .handle:focus-visible {
                outline: 2px solid var(--component-splitter-handle-active-background, currentColor);
                outline-offset: -2px;
            }
            :host(.dragging) .handle,
            .handle:active {
                background: var(--component-splitter-handle-active-background, rgba(0, 0, 0, 0.12));
                color: var(--component-splitter-handle-active-grip-color, var(--component-splitter-handle-grip-color, currentColor));
            }

            :host([disabled]) .handle {
                cursor: not-allowed;
                pointer-events: none;
                opacity: 0.5;
            }

            /* The visible line — always shown, regardless of hover state. */
            .handle-line {
                position: absolute;
                background: var(--component-splitter-handle-border-color, currentColor);
                pointer-events: none;
            }
            :host(:not([orientation="vertical"])) .handle-line {
                top: 0;
                bottom: 0;
                width: var(--component-splitter-handle-border-width, 1px);
                ${
                    handlePosition === "start"
                        ? "left: 0;"
                        : handlePosition === "end"
                          ? "right: 0;"
                          : "left: 50%; transform: translateX(-50%);"
                }
            }
            :host([orientation="vertical"]) .handle-line {
                left: 0;
                right: 0;
                height: var(--component-splitter-handle-border-width, 1px);
                ${
                    handlePosition === "start"
                        ? "top: 0;"
                        : handlePosition === "end"
                          ? "bottom: 0;"
                          : "top: 50%; transform: translateY(-50%);"
                }
            }

            .grip {
                position: relative;
                z-index: 1;
                pointer-events: none;
                width: var(--component-splitter-grip-size, 16px);
                height: var(--component-splitter-grip-size, 16px);
                color: inherit;
                opacity: 0.7;
            }
            :host(:not([orientation="vertical"])) .grip {
                width: calc(var(--component-splitter-grip-size, 16px) * 0.6);
            }
            :host([orientation="vertical"]) .grip {
                height: calc(var(--component-splitter-grip-size, 16px) * 0.6);
            }
            .handle:hover .grip,
            .handle:focus-visible .grip,
            :host(.dragging) .grip {
                opacity: 1;
            }

            ::slotted([slot="pane-1"]),
            ::slotted([slot="pane-2"]) {
                display: block;
                box-sizing: border-box;
                width: 100%;
                height: 100%;
            }
        `);
        return sheet;
    }

    _commitSplit(next, source) {
        const clamped = clamp(
            Number.isFinite(next) ? next : this._split,
            this.minRatio,
            this.maxRatio,
        );

        if (clamped === this._split) return;

        this._split = clamped;
        this._reflectSplitAttribute();
        this._applySplit();
        this._syncHandleAria();
        this._emit("split-changed", {
            split: this._split,
            orientation: this.orientation,
            source,
        });
    }

    _containerRect() {
        const root = this.shadowRoot?.querySelector(".splitter");
        return root ? root.getBoundingClientRect() : null;
    }

    _emit(name, detail) {
        this.dispatchEvent(
            new CustomEvent(name, { bubbles: true, composed: true, detail }),
        );
    }

    _isHorizontal() {
        return this.orientation === "horizontal";
    }

    _onChildrenChanged() {
        this._assignPaneSlots();
    }

    _onHandleKeyDown(e) {
        if (this.disabled) return;
        const horizontal = this._isHorizontal();
        const step = DEFAULT_KEYBOARD_STEP;
        const stepLarge = DEFAULT_KEYBOARD_STEP_LARGE;
        let delta = 0;
        let absolute = null;

        switch (e.key) {
            case "ArrowLeft":
            case "ArrowDown":
                delta = -step;
                break;
            case "ArrowRight":
            case "ArrowUp":
                delta = step;
                break;
            case "PageDown":
                delta = -stepLarge;
                break;
            case "PageUp":
                delta = stepLarge;
                break;
            case "Home":
                absolute = this.minRatio;
                break;
            case "End":
                absolute = this.maxRatio;
                break;
            default:
                return;
        }
        // Arrow Left/Down decreases for both orientations per spec; no axis
        // remapping needed beyond the switch above. `horizontal` is referenced
        // here only so a future refinement (e.g. ignoring vertical-axis arrows
        // in horizontal mode) has a one-line entry point.
        void horizontal;

        e.preventDefault();
        const next = absolute != null ? absolute : this._split + delta;
        this._commitSplit(next, "keyboard");
    }

    _onHandlePointerDown(e) {
        if (this.disabled) return;
        if (e.button !== 0 && e.pointerType === "mouse") return;
        const handle = e.currentTarget;
        const rect = this._containerRect();
        if (!rect) return;

        this._dragging = true;
        this._pointerId = e.pointerId;
        this._dragStartCoord = this._isHorizontal() ? e.clientX : e.clientY;
        this._dragStartSplit = this._split;
        this._dragRect = rect;

        try {
            handle.setPointerCapture(e.pointerId);
        } catch {
            // Pointer capture can throw in synthetic test environments.
        }
        this.classList.add("dragging");

        handle.addEventListener("pointermove", this._onHandlePointerMove);
        handle.addEventListener("pointerup", this._onHandlePointerUp);
        handle.addEventListener("pointercancel", this._onHandlePointerUp);

        this._emit("split-start", { x: e.clientX, y: e.clientY });
        e.preventDefault();
    }

    _onHandlePointerMove(e) {
        if (!this._dragging) return;
        if (this._pointerId != null && e.pointerId !== this._pointerId) return;

        const horizontal = this._isHorizontal();
        const total = horizontal ? this._dragRect.width : this._dragRect.height;
        const usable = Math.max(1, total - this.handleSize);
        const current = horizontal ? e.clientX : e.clientY;
        const delta = current - this._dragStartCoord;
        const next = this._dragStartSplit + delta / usable;

        this._pendingSplit = next;

        if (this._rafId != null) return;

        this._rafId = requestAnimationFrame(() => {
            this._rafId = null;

            if (this._pendingSplit == null) return;

            const v = this._pendingSplit;
            this._pendingSplit = null;

            if (this._dragging) this._commitSplit(v, "pointer");
        });
    }

    _onHandlePointerUp(e) {
        if (!this._dragging) return;
        if (this._pointerId != null && e.pointerId !== this._pointerId) return;

        this._releasePointer();
        this._emit("split-end", { x: e.clientX, y: e.clientY });
    }

    _readSplitAttribute() {
        const raw = this.getAttribute("split");
        const n = raw == null ? DEFAULT_SPLIT : parseFloat(raw);
        const v = Number.isFinite(n) ? n : DEFAULT_SPLIT;
        return clamp(v, this.minRatio, this.maxRatio);
    }

    _reflectSplitAttribute() {
        // Avoid loop with attributeChangedCallback by writing only when the
        // serialized value differs.
        const serialized = String(this._split);
        if (this.getAttribute("split") !== serialized) {
            this.setAttribute("split", serialized);
        }
    }

    _releasePointer() {
        const handle = this.shadowRoot?.querySelector(".handle");
        if (handle) {
            handle.removeEventListener(
                "pointermove",
                this._onHandlePointerMove,
            );
            handle.removeEventListener("pointerup", this._onHandlePointerUp);
            handle.removeEventListener(
                "pointercancel",
                this._onHandlePointerUp,
            );
            if (this._pointerId != null) {
                try {
                    handle.releasePointerCapture(this._pointerId);
                } catch {
                    // Already released or never captured.
                }
            }
        }
        this._dragging = false;
        this._pointerId = null;
        this._dragRect = null;
        this._pendingSplit = null;
        this.classList.remove("dragging");
    }

    _syncHandleAria() {
        const handle = this.shadowRoot?.querySelector(".handle");
        if (!handle) return;

        const percent = Math.round(this._split * 100);

        handle.setAttribute("aria-valuenow", String(percent));
        handle.setAttribute("aria-valuemin", "0");
        handle.setAttribute("aria-valuemax", "100");
        handle.setAttribute("aria-valuetext", `${percent}%`);
        handle.setAttribute("aria-orientation", this.orientation);

        const label = this.getAttribute("aria-label") || "Resizable splitter";

        handle.setAttribute("aria-label", label);

        if (this.disabled) {
            handle.setAttribute("aria-disabled", "true");
            handle.setAttribute("tabindex", "-1");
        } else {
            handle.removeAttribute("aria-disabled");
            handle.setAttribute("tabindex", "0");
        }
    }
}

if (!customElements.get("y-splitter")) {
    customElements.define("y-splitter", YumeSplitter);
}
