import "../y-icon/y-icon.js";
import "../y-button/y-button.js";
import "../y-popover/y-popover.js";
import {
    createElement as _el,
    resolveThemeMountPoint,
} from "../../modules/helpers.js";

const VALID_POSITIONS = new Set([
    "top",
    "bottom",
    "left",
    "right",
    "center",
    "auto",
]);

let _instanceCount = 0;

export class YumeHelp extends HTMLElement {
    static get observedAttributes() {
        return [
            "steps",
            "open",
            "index",
            "default-position",
            "untargeted-position",
            "default-anchor",
            "highlight-padding",
            "show-progress",
            "show-arrows",
            "close-on-escape",
            "close-on-overlay-click",
            "disable-target-interaction",
            "prev-label",
            "next-label",
            "finish-label",
            "close-label",
            "loop",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._instanceId = ++_instanceCount;
        this._stepsCache = null;
        this._stepsRaw = null;
        this._activeTargets = [];
        this._previousFocus = null;
        this._mounted = false;
        this._suppressAttrEcho = false;
        this._rafId = 0;
        this._resizeObserver = null;
        this._reducedMotionMQ = null;
        this._onKeydown = this._onKeydown.bind(this);
        this._onWindowChange = this._onWindowChange.bind(this);
        this._onTargetMutation = this._onTargetMutation.bind(this);
    }

    connectedCallback() {
        // The component renders no light- or shadow-DOM UI of its own; the
        // tour lives in a portaled root attached to document.body.
        if (this.open) this._mount();
    }

    disconnectedCallback() {
        this._teardown();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (this._suppressAttrEcho) return;

        if (name === "steps") {
            this._stepsCache = null;
        }

        if (name === "open") {
            const wantOpen = newValue !== null && newValue !== "false";
            if (wantOpen && !this._mounted) this._mount();
            else if (!wantOpen && this._mounted) this._unmount("api");
            return;
        }

        if (name === "index" && this._mounted) {
            const next = this._clampIndex(parseInt(newValue, 10));
            if (next !== this._currentIndex) {
                this._currentIndex = next;
                this._renderStep();
            }
            return;
        }

        if (this._mounted) this._renderStep();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Aria-label for the close (×) button. */
    get closeLabel() {
        return this.getAttribute("close-label") || "Close";
    }
    set closeLabel(v) {
        if (v == null) this.removeAttribute("close-label");
        else this.setAttribute("close-label", String(v));
    }

    /** Close when the Escape key is pressed. Defaults to `true`. */
    get closeOnEscape() {
        const v = this.getAttribute("close-on-escape");
        return v === null ? true : v !== "false";
    }
    set closeOnEscape(v) {
        if (v === false || v === "false") {
            this.setAttribute("close-on-escape", "false");
        } else {
            this.removeAttribute("close-on-escape");
        }
    }

    /** Close when the dim overlay is clicked. Defaults to `false`. */
    get closeOnOverlayClick() {
        return this.hasAttribute("close-on-overlay-click");
    }
    set closeOnOverlayClick(v) {
        if (v) this.setAttribute("close-on-overlay-click", "");
        else this.removeAttribute("close-on-overlay-click");
    }

    /** Tooltip anchor used when a multi-target step does not specify `anchor`. */
    get defaultAnchor() {
        return this.getAttribute("default-anchor") || "bounds";
    }
    set defaultAnchor(v) {
        if (v == null) this.removeAttribute("default-anchor");
        else this.setAttribute("default-anchor", String(v));
    }

    /** Tooltip position used when a step does not specify one. */
    get defaultPosition() {
        const v = this.getAttribute("default-position");
        return VALID_POSITIONS.has(v) ? v : "auto";
    }
    set defaultPosition(v) {
        if (v == null) this.removeAttribute("default-position");
        else this.setAttribute("default-position", String(v));
    }

    /** When `false`, all highlighted elements remain clickable. Defaults to `true`. */
    get disableTargetInteraction() {
        const v = this.getAttribute("disable-target-interaction");
        return v === null ? true : v !== "false";
    }
    set disableTargetInteraction(v) {
        if (v === false || v === "false") {
            this.setAttribute("disable-target-interaction", "false");
        } else {
            this.removeAttribute("disable-target-interaction");
        }
    }

    /** Text on the next button on the last step. */
    get finishLabel() {
        return this.getAttribute("finish-label") || "Done";
    }
    set finishLabel(v) {
        if (v == null) this.removeAttribute("finish-label");
        else this.setAttribute("finish-label", String(v));
    }

    /** Default pixel padding around each highlighted element. */
    get highlightPadding() {
        const v = parseInt(this.getAttribute("highlight-padding"), 10);
        return Number.isFinite(v) && v >= 0 ? v : 8;
    }
    set highlightPadding(v) {
        if (v == null) this.removeAttribute("highlight-padding");
        else this.setAttribute("highlight-padding", String(v));
    }

    /** Current step index (0-based). */
    get index() {
        const v = parseInt(this.getAttribute("index"), 10);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    }
    set index(v) {
        const n = parseInt(v, 10);
        if (Number.isFinite(n)) this.setAttribute("index", String(n));
    }

    /** When `true`, advancing past the last step returns to the first. */
    get loop() {
        return this.hasAttribute("loop");
    }
    set loop(v) {
        if (v) this.setAttribute("loop", "");
        else this.removeAttribute("loop");
    }

    /** Text/aria-label for the next button. */
    get nextLabel() {
        return this.getAttribute("next-label") || "Next";
    }
    set nextLabel(v) {
        if (v == null) this.removeAttribute("next-label");
        else this.setAttribute("next-label", String(v));
    }

    /** Whether the tour is currently active. */
    get open() {
        return this.hasAttribute("open");
    }
    set open(v) {
        if (v) this.setAttribute("open", "");
        else this.removeAttribute("open");
    }

    /** Text/aria-label for the previous button. */
    get prevLabel() {
        return this.getAttribute("prev-label") || "Previous";
    }
    set prevLabel(v) {
        if (v == null) this.removeAttribute("prev-label");
        else this.setAttribute("prev-label", String(v));
    }

    /** Show large prev/next arrow buttons on the overlay edges. */
    get showArrows() {
        const v = this.getAttribute("show-arrows");
        return v === null ? true : v !== "false";
    }
    set showArrows(v) {
        if (v === false || v === "false") {
            this.setAttribute("show-arrows", "false");
        } else {
            this.removeAttribute("show-arrows");
        }
    }

    /** Show the "N of M" progress indicator in the tooltip. */
    get showProgress() {
        const v = this.getAttribute("show-progress");
        return v === null ? true : v !== "false";
    }
    set showProgress(v) {
        if (v === false || v === "false") {
            this.setAttribute("show-progress", "false");
        } else {
            this.removeAttribute("show-progress");
        }
    }

    /** Ordered list of steps. Accepts an array or a JSON string. */
    get steps() {
        if (this._stepsCache) return this._stepsCache;
        const raw = this._stepsRaw ?? this.getAttribute("steps");
        if (Array.isArray(raw)) {
            this._stepsCache = raw;
            return raw;
        }
        if (typeof raw === "string" && raw.trim()) {
            try {
                const parsed = JSON.parse(raw);
                this._stepsCache = Array.isArray(parsed) ? parsed : [];
            } catch {
                this._stepsCache = [];
            }
            return this._stepsCache;
        }
        this._stepsCache = [];
        return this._stepsCache;
    }
    set steps(v) {
        this._stepsCache = null;
        if (v == null) {
            this._stepsRaw = null;
            this.removeAttribute("steps");
        } else if (typeof v === "string") {
            this._stepsRaw = v;
            this.setAttribute("steps", v);
        } else {
            this._stepsRaw = v;
            this.setAttribute("steps", JSON.stringify(v));
        }
        if (this._mounted) {
            this._currentIndex = this._clampIndex(this._currentIndex);
            this._renderStep();
        }
    }

    /** Position used when a step has no resolvable `target`. */
    get untargetedPosition() {
        const v = this.getAttribute("untargeted-position");
        return VALID_POSITIONS.has(v) ? v : "center";
    }
    set untargetedPosition(v) {
        if (v == null) this.removeAttribute("untargeted-position");
        else this.setAttribute("untargeted-position", String(v));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Close the tour. `reason` ends up in the `y-help-close` event detail. */
    close(reason = "api") {
        if (!this._mounted) return;
        this._unmount(reason);
    }

    /** Jump to the step at the given index. */
    goto(index) {
        if (!this._mounted) return;
        const next = this._clampIndex(index);
        this._move(next, "goto");
    }

    /** Advance to the next step (or complete / loop). */
    next() {
        if (!this._mounted) return;

        const steps = this.steps;
        const last = steps.length - 1;

        if (this._currentIndex >= last) {
            if (this.loop) {
                this._move(0, "next");
            } else {
                this.dispatchEvent(
                    new CustomEvent("y-help-complete", {
                        bubbles: true,
                        composed: true,
                        detail: { totalSteps: steps.length },
                    }),
                );
                this._unmount("complete");
            }
            return;
        }

        this._move(this._currentIndex + 1, "next");
    }

    /** Return to the previous step. */
    prev() {
        if (!this._mounted) return;
        if (this._currentIndex <= 0) return;

        this._move(this._currentIndex - 1, "prev");
    }

    /** Begin the tour. */
    start(index = 0) {
        if (this._mounted) {
            this.goto(index);
            return;
        }
        // Bail before dispatching the open event or touching the `open`
        // attribute when there's nothing to render — keeps state consistent
        // with the no-op contract.
        if (this.steps.length === 0) return;

        this._currentIndex = this._clampIndex(index);
        const event = new CustomEvent("y-help-open", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { index: this._currentIndex },
        });

        if (!this.dispatchEvent(event)) return;

        this._suppressAttrEcho = true;
        this.setAttribute("open", "");
        this.setAttribute("index", String(this._currentIndex));
        this._suppressAttrEcho = false;
        this._mount();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildContainer() {
        const root = document.createElement("div");
        root.className = "y-help-root";
        root.setAttribute("data-y-help", String(this._instanceId));

        const style = document.createElement("style");
        style.textContent = this._buildStyles();
        root.appendChild(style);

        const overlay = this._buildOverlay();
        const tooltip = this._buildTooltip();
        const arrows = this._buildOverlayArrows();

        root.appendChild(overlay);
        root.appendChild(arrows);
        root.appendChild(tooltip);

        return { root, overlay, tooltip, arrows };
    }

    _buildOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "y-help-overlay";
        overlay.setAttribute("part", "overlay");
        overlay.setAttribute("aria-hidden", "true");

        const svgNs = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNs, "svg");
        svg.setAttribute("class", "y-help-overlay-svg");
        svg.setAttribute("aria-hidden", "true");

        const defs = document.createElementNS(svgNs, "defs");
        const mask = document.createElementNS(svgNs, "mask");
        const maskId = `y-help-mask-${this._instanceId}`;
        mask.setAttribute("id", maskId);

        const maskBase = document.createElementNS(svgNs, "rect");
        maskBase.setAttribute("x", "0");
        maskBase.setAttribute("y", "0");
        maskBase.setAttribute("width", "100%");
        maskBase.setAttribute("height", "100%");
        maskBase.setAttribute("fill", "white");
        mask.appendChild(maskBase);

        defs.appendChild(mask);
        svg.appendChild(defs);

        const dim = document.createElementNS(svgNs, "rect");
        dim.setAttribute("class", "y-help-overlay-dim");
        dim.setAttribute("x", "0");
        dim.setAttribute("y", "0");
        dim.setAttribute("width", "100%");
        dim.setAttribute("height", "100%");
        dim.setAttribute("mask", `url(#${maskId})`);
        svg.appendChild(dim);

        overlay.appendChild(svg);

        // Separate full-screen click-blocker rendered conditionally. Catches
        // clicks even in cutout regions when disable-target-interaction=true.
        const blocker = document.createElement("div");
        blocker.className = "y-help-blocker";
        overlay.appendChild(blocker);

        const onOverlayClick = (e) => {
            if (this.closeOnOverlayClick) {
                e.preventDefault();
                this._userClose("overlay");
            }
        };
        blocker.addEventListener("click", onOverlayClick);
        dim.addEventListener("click", onOverlayClick);

        this._overlaySvg = svg;
        this._overlayDim = dim;
        this._overlayMask = mask;
        this._overlayBlocker = blocker;
        return overlay;
    }

    _buildOverlayArrows() {
        const wrap = document.createElement("div");
        wrap.className = "y-help-nav-arrows";

        // Like y-gallery, the icons inherit their stroke color from the
        // button's `color` (white by default) via currentColor. The button
        // sits on the dim overlay, so a white icon on a translucent-white
        // background reads in every theme.
        const prev = _el(
            "button",
            {
                type: "button",
                class: "y-help-nav-arrow y-help-nav-arrow--prev",
                part: "arrow-prev",
                "aria-label": this.prevLabel,
            },
            [_el("y-icon", { name: "chevron-left", size: "large" })],
        );
        prev.addEventListener("click", () => this.prev());

        const next = _el(
            "button",
            {
                type: "button",
                class: "y-help-nav-arrow y-help-nav-arrow--next",
                part: "arrow-next",
                "aria-label": this.nextLabel,
            },
            [_el("y-icon", { name: "chevron-right", size: "large" })],
        );
        next.addEventListener("click", () => this.next());

        wrap.appendChild(prev);
        wrap.appendChild(next);

        this._arrowPrev = prev;
        this._arrowNext = next;
        return wrap;
    }

    _buildStyles() {
        return `
            .y-help-root {
                position: fixed;
                inset: 0;
                z-index: var(--component-help-overlay-z-index, 9000);
                pointer-events: none;
                font-family: var(--font-family-body, system-ui, sans-serif);
                color: var(--component-help-tooltip-color, var(--base-content--, #1a1a1a));
            }

            .y-help-overlay {
                position: absolute;
                inset: 0;
                pointer-events: none;
            }

            .y-help-overlay-svg {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .y-help-overlay-dim {
                fill: var(--component-help-overlay-bg, rgba(0, 0, 0, 0.55));
                pointer-events: visiblePainted;
            }

            /* Visible stroke drawn at each cutout's exact position, on top
               of the masked dim. Gives the "highlighted" area a clear edge
               against dark backgrounds where the cutout alone is hard to
               distinguish from surrounding content. */
            .y-help-highlight {
                fill: none;
                stroke: var(--component-help-highlight-outline-color, var(--primary-content--, #1976d2));
                stroke-width: var(--component-help-highlight-outline-width, 2);
                filter: var(--component-help-highlight-shadow, drop-shadow(0 0 6px var(--primary-content--, rgba(25, 118, 210, 0.5))));
                pointer-events: none;
            }

            .y-help-blocker {
                position: absolute;
                inset: 0;
                pointer-events: auto;
                background: transparent;
            }

            .y-help-blocker.y-help-blocker--off {
                pointer-events: none;
            }

            .y-help-nav-arrows {
                position: absolute;
                inset: 0;
                pointer-events: none;
            }

            /* Overlay-edge nav arrows mirror y-gallery's expand-prev/next
               style — semi-transparent white that reads cleanly against the
               dim overlay in every theme, since the overlay itself is the
               only background the arrows sit on. */
            .y-help-nav-arrow {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: var(--component-help-nav-arrow-size, 44px);
                height: var(--component-help-nav-arrow-size, 44px);
                border-radius: var(--radii-full, 50%);
                border: none;
                background: var(--component-help-nav-arrow-bg, rgba(255, 255, 255, 0.15));
                color: var(--component-help-nav-arrow-color, #fff);
                cursor: pointer;
                pointer-events: auto;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                transition: background 0.2s ease;
            }

            .y-help-nav-arrow:hover {
                background: var(--component-help-nav-arrow-bg-hover, rgba(255, 255, 255, 0.3));
            }

            .y-help-nav-arrow:focus-visible {
                outline: 2px solid var(--component-help-nav-arrow-color, #fff);
                outline-offset: 2px;
            }

            .y-help-nav-arrow:disabled,
            .y-help-nav-arrow[aria-disabled="true"] {
                opacity: 0.3;
                cursor: default;
                pointer-events: none;
            }

            .y-help-nav-arrow--prev { left: var(--spacing-large, 16px); }
            .y-help-nav-arrow--next { right: var(--spacing-large, 16px); }
            .y-help-nav-arrows[hidden] { display: none; }

            /* y-help styles the slotted children of the inner <y-popover>.
               Surface chrome (background, border, padding, shadow, pointer
               rendering) lives in the popover's own shadow root. */

            .y-help-tooltip-header {
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }

            .y-help-tooltip-title {
                flex: 1;
                margin: 0;
                font-size: 1rem;
                font-weight: var(--font-weight-heading, 600);
            }

            .y-help-tooltip-title:empty { display: none; }

            /* The close button is a y-button; trim its margins so it sits
               flush with the title baseline, and use 'margin-left: auto' so
               it stays right-anchored even when the title is empty and
               removes itself from the flex row. */
            .y-help-tooltip-close {
                margin: -4px -4px -4px auto;
            }

            .y-help-tooltip-content {
                line-height: 1.5;
                font-size: 0.95em;
                white-space: pre-wrap;
            }

            .y-help-tooltip-content:empty { display: none; }

            .y-help-tooltip-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex: 1;
            }

            .y-help-tooltip-progress {
                flex: 1;
                font-size: 0.85em;
                color: var(--base-content-light, rgba(0, 0, 0, 0.55));
            }

            .y-help-tooltip-progress[hidden] { display: none; }
        `;
    }

    _buildTooltip() {
        // y-help delegates tooltip surface, positioning, pointer rendering,
        // and focus management to <y-popover>. y-help still owns step state,
        // the SVG overlay/highlight, and the large overlay-edge nav arrows.
        const titleId = `y-help-title-${this._instanceId}`;
        const contentId = `y-help-content-${this._instanceId}`;

        const popover = _el("y-popover", {
            class: "y-help-tooltip",
            part: "tooltip",
            id: `y-help-tooltip-${this._instanceId}`,
            modal: "",
            trigger: "manual",
            // The SVG dim layer is y-help's backdrop; opt out of the
            // popover's own backdrop so the two do not stack.
            "show-backdrop": "false",
            "close-on-escape": "false",
            "close-on-outside-click": "false",
        });

        const header = _el("div", {
            slot: "header",
            class: "y-help-tooltip-header",
        });
        const title = _el("h2", {
            class: "y-help-tooltip-title",
            part: "tooltip-title",
            id: titleId,
        });
        const close = _el(
            "y-button",
            {
                class: "y-help-tooltip-close",
                part: "close-button",
                "variant": "flat",
                size: "small",
                "aria-label": this.closeLabel,
            },
            [
                _el("y-icon", {
                    slot: "left-icon",
                    name: "x",
                    size: "small",
                }),
            ],
        );
        close.addEventListener("click", () => this._userClose("user"));
        header.appendChild(title);
        header.appendChild(close);

        const content = _el("div", {
            class: "y-help-tooltip-content",
            part: "tooltip-content",
            id: contentId,
        });

        const actions = _el("div", {
            slot: "footer",
            class: "y-help-tooltip-actions",
            part: "tooltip-actions",
        });
        const progress = _el("div", {
            class: "y-help-tooltip-progress",
            part: "progress",
            "aria-live": "polite",
        });
        const prev = _el(
            "y-button",
            {
                class: "y-help-tooltip-btn",
                part: "prev-button",
                "variant": "outlined",
                size: "small",
                "aria-label": this.prevLabel,
            },
            [this.prevLabel],
        );
        prev.addEventListener("click", () => this.prev());
        const next = _el(
            "y-button",
            {
                class: "y-help-tooltip-btn",
                part: "next-button",
                "variant": "filled",
                color: "primary",
                size: "small",
                "aria-label": this.nextLabel,
            },
            [this.nextLabel],
        );
        next.addEventListener("click", () => this.next());

        actions.appendChild(progress);
        actions.appendChild(prev);
        actions.appendChild(next);

        // Header slot gets the title+close wrapper; default slot gets the
        // body; footer slot gets the actions wrapper.
        popover.appendChild(header);
        popover.appendChild(content);
        popover.appendChild(actions);

        this._tipTitle = title;
        this._tipContent = content;
        this._tipProgress = progress;
        this._tipPrev = prev;
        this._tipNext = next;
        this._tipClose = close;
        this._popover = popover;

        return popover;
    }

    _clampIndex(index) {
        const total = this.steps.length;
        if (total === 0) return 0;
        if (!Number.isFinite(index)) return 0;

        return Math.max(0, Math.min(total - 1, Math.floor(index)));
    }

    _currentStep() {
        return this.steps[this._currentIndex] ?? null;
    }

    _mount() {
        if (this._mounted) return;
        if (this.steps.length === 0) return;

        this._mounted = true;
        this._currentIndex = this._clampIndex(this._currentIndex ?? this.index);

        this._previousFocus = document.activeElement;
        this._reducedMotionMQ = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        );

        const { root } = this._buildContainer();
        this._portalRoot = root;
        this._resolveMountPoint().appendChild(root);

        window.addEventListener("keydown", this._onKeydown, true);
        window.addEventListener("resize", this._onWindowChange);
        window.addEventListener("scroll", this._onWindowChange, true);

        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver(this._onTargetMutation);
        }

        this._suppressAttrEcho = true;
        this.setAttribute("open", "");
        this.setAttribute("index", String(this._currentIndex));
        this._suppressAttrEcho = false;

        this._renderStep();
        this._dispatchStart();
    }

    _move(toIndex, direction) {
        const from = this._currentIndex;
        if (from === toIndex) return;

        const step = this.steps[toIndex];
        const event = new CustomEvent("y-help-step-change", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { from, to: toIndex, step, direction },
        });

        if (!this.dispatchEvent(event)) return;

        this._currentIndex = toIndex;
        this._suppressAttrEcho = true;
        this.setAttribute("index", String(toIndex));
        this._suppressAttrEcho = false;
        this._renderStep();
    }

    _dispatchStart() {
        const step = this._currentStep();
        this.dispatchEvent(
            new CustomEvent("y-help-start", {
                bubbles: true,
                composed: true,
                detail: { index: this._currentIndex, step },
            }),
        );
    }

    _onKeydown(e) {
        if (!this._mounted) return;

        if (e.key === "Escape") {
            // Always swallow Escape at the window capture phase so the
            // popover's own modal-Escape handler never fires — y-help owns
            // the cancelable close lifecycle.
            e.preventDefault();
            e.stopPropagation();
            if (this.closeOnEscape) this._userClose("escape");
            return;
        }

        if (e.key === "ArrowRight" || e.key === "Enter") {
            if (
                e.target &&
                e.target.tagName === "BUTTON" &&
                e.key === "Enter"
            ) {
                return; // let the button handle its own click
            }
            e.preventDefault();
            this.next();
            return;
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            this.prev();
            return;
        }
        // Tab cycling is delegated to y-popover's modal focus trap.
    }

    _onTargetMutation() {
        this._scheduleReposition();
    }

    _onWindowChange() {
        this._scheduleReposition();
    }

    _cssNumber(varName, fallback) {
        if (!this._portalRoot) return fallback;

        const styles = getComputedStyle(this._portalRoot);
        const raw = styles.getPropertyValue(varName).trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    _renderStep() {
        if (!this._mounted) return;

        const step = this._currentStep();
        if (!step) {
            this._unmount("complete");
            return;
        }

        this._tipTitle.textContent = step.title || "";
        this._tipContent.textContent = step.content || "";
        this._updateProgress();
        this._updateNavButtons();

        // Resolve targets fresh on every step transition so mid-tour DOM
        // changes don't leak stale references.
        this._unobserveTargets();
        this._activeTargets = this._resolveTargets(step.target);
        if (this._resizeObserver) {
            for (const el of this._activeTargets) {
                this._resizeObserver.observe(el);
            }
        }

        const hadTargets = (step.target ? this._activeTargets.length : 0) > 0;
        const stepPosition = hadTargets
            ? step.position && VALID_POSITIONS.has(step.position)
                ? step.position
                : this.defaultPosition
            : this.untargetedPosition;

        this._updateOverlay(step);

        // Translate the y-help position vocabulary to y-popover's. y-help's
        // "center" means "render mid-viewport, no pointer" — y-popover does
        // exactly that when no anchor is set, so we null the anchor.
        const anchorEl =
            stepPosition === "center" ? null : this._resolveAnchorElement(step);
        const popoverPosition =
            stepPosition === "center" ? "auto" : stepPosition;

        if (anchorEl) {
            this._scrollAnchorIntoView(anchorEl.getBoundingClientRect());
        }
        this._popover.setAttribute("position", popoverPosition);
        this._popover.setAnchor(anchorEl);
        if (!this._popover.open) {
            this._popover.show();
        } else {
            this._popover.updatePosition();
        }

        const isLast = this._currentIndex === this.steps.length - 1;
        const nextActionLabel =
            isLast && !this.loop ? this.finishLabel : this.nextLabel;
        this._tipNext.textContent = nextActionLabel;
        this._tipNext.setAttribute("aria-label", nextActionLabel);
        this._tipNext.dataset.last = isLast ? "true" : "false";

        if (this._arrowNext) {
            this._arrowNext.setAttribute("aria-label", nextActionLabel);
        }
    }

    _resolveMountPoint() {
        return resolveThemeMountPoint(this);
    }

    _resolveAnchorElement(step) {
        const targets = this._activeTargets;
        if (!targets.length) return null;

        const anchorPref = step.anchor ?? this.defaultAnchor;
        if (anchorPref === "first") return targets[0];
        if (anchorPref === "last") return targets[targets.length - 1];
        if (typeof anchorPref === "number" && targets[anchorPref]) {
            return targets[anchorPref];
        }

        return this._ensurePhantomAnchor(targets);
    }

    _ensurePhantomAnchor(targets) {
        const rect = this._unionRect(targets);
        let phantom = this._phantomAnchor;
        if (!phantom) {
            phantom = document.createElement("div");
            phantom.className = "y-help-phantom-anchor";
            phantom.setAttribute("aria-hidden", "true");
            phantom.style.position = "fixed";
            phantom.style.pointerEvents = "none";
            phantom.style.visibility = "hidden";
            this._portalRoot.appendChild(phantom);
            this._phantomAnchor = phantom;
        }
        phantom.style.top = `${rect.top}px`;
        phantom.style.left = `${rect.left}px`;
        phantom.style.width = `${rect.width}px`;
        phantom.style.height = `${rect.height}px`;
        return phantom;
    }

    _resolveTargets(target) {
        if (target == null) return [];

        const items = Array.isArray(target) ? target : [target];
        const out = [];

        for (const t of items) {
            const el = this._resolveOne(t);
            if (el && el.isConnected) out.push(el);
        }

        return out;
    }

    _resolveOne(t) {
        if (typeof t !== "string" || !t) return null;

        // For identifier-shaped strings (bare words like "btn-create"), try
        // the element-id shorthand first as a fast path. If nothing matches,
        // fall through to querySelector so documented CSS tag selectors
        // ("button", "main", "nav") still resolve correctly.
        if (/^[A-Za-z][\w-]*$/.test(t)) {
            const byId = document.getElementById(t);
            if (byId) return byId;
        }

        try {
            return document.querySelector(t);
        } catch {
            return null;
        }
    }

    _scheduleReposition() {
        if (this._rafId) return;

        this._rafId = requestAnimationFrame(() => {
            this._rafId = 0;
            if (!this._mounted) return;

            const step = this._currentStep();
            if (!step) return;

            this._updateOverlay(step);

            // For the union-anchor case the phantom div is positioned in
            // viewport coordinates, so it needs an explicit refresh as the
            // underlying real targets move on scroll/resize. The popover's
            // own ResizeObserver covers single-element anchors.
            if (this._phantomAnchor && this._activeTargets.length) {
                const rect = this._unionRect(this._activeTargets);
                this._phantomAnchor.style.top = `${rect.top}px`;
                this._phantomAnchor.style.left = `${rect.left}px`;
                this._phantomAnchor.style.width = `${rect.width}px`;
                this._phantomAnchor.style.height = `${rect.height}px`;
            }
            if (this._popover && this._popover.open) {
                this._popover.updatePosition();
            }
        });
    }

    _scrollAnchorIntoView(anchor) {
        if (!anchor) return;

        const vh = window.innerHeight;
        const vw = window.innerWidth;
        // Already inside viewport — no need to scroll.
        if (
            anchor.top >= 0 &&
            anchor.bottom <= vh &&
            anchor.left >= 0 &&
            anchor.right <= vw
        ) {
            return;
        }
        const target = this._activeTargets[0];
        if (!target) return;

        const reduced = this._reducedMotionMQ && this._reducedMotionMQ.matches;
        try {
            target.scrollIntoView({
                block: "center",
                inline: "center",
                behavior: reduced ? "auto" : "smooth",
            });
        } catch {
            // Older browsers without ScrollIntoViewOptions support.
            target.scrollIntoView();
        }
    }

    _unionRect(targets) {
        let top = Infinity;
        let left = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        for (const el of targets) {
            const r = el.getBoundingClientRect();
            if (r.top < top) top = r.top;
            if (r.left < left) left = r.left;
            if (r.right > right) right = r.right;
            if (r.bottom > bottom) bottom = r.bottom;
        }
        return {
            top,
            left,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
        };
    }

    _unmount(reason) {
        if (!this._mounted) return;

        const event = new CustomEvent("y-help-close", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { index: this._currentIndex, reason },
        });
        if (!this.dispatchEvent(event)) return;

        this._teardown();
    }

    /**
     * Performs the actual cleanup — separated from `_unmount` so paths that
     * must clean up unconditionally (e.g. `disconnectedCallback`, where the
     * host element is being removed from the DOM) can bypass the cancelable
     * `y-help-close` event. A consumer's `preventDefault()` is meaningful
     * for an explicit close attempt, but not when the component itself is
     * disappearing — letting it block teardown would leak the portaled
     * root and the document-level window listeners.
     */
    _teardown() {
        if (!this._mounted) return;

        this._mounted = false;
        this._unobserveTargets();

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        window.removeEventListener("keydown", this._onKeydown, true);
        window.removeEventListener("resize", this._onWindowChange);
        window.removeEventListener("scroll", this._onWindowChange, true);

        if (this._portalRoot && this._portalRoot.parentNode) {
            this._portalRoot.parentNode.removeChild(this._portalRoot);
        }

        this._portalRoot = null;
        this._popover = null;
        this._overlaySvg = null;
        this._overlayDim = null;
        this._overlayMask = null;
        this._overlayBlocker = null;
        this._phantomAnchor = null;
        this._activeTargets = [];

        this._suppressAttrEcho = true;
        this.removeAttribute("open");
        this._suppressAttrEcho = false;

        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = 0;
        }

        // Restore focus to where the user was before the tour opened.
        if (
            this._previousFocus &&
            typeof this._previousFocus.focus === "function" &&
            document.contains(this._previousFocus)
        ) {
            this._previousFocus.focus({ preventScroll: true });
        }
        this._previousFocus = null;
    }

    _unobserveTargets() {
        if (!this._resizeObserver) return;

        for (const el of this._activeTargets) {
            this._resizeObserver.unobserve(el);
        }
    }

    _updateNavButtons() {
        const last = this.steps.length - 1;
        const onFirst = this._currentIndex === 0;
        const onLast = this._currentIndex === last;
        this._tipPrev.disabled = onFirst;
        this._tipPrev.setAttribute("aria-disabled", onFirst ? "true" : "false");
        this._tipNext.disabled = onLast && !this.loop && this.steps.length <= 1;

        if (this._arrowPrev) {
            this._arrowPrev.disabled = onFirst;
            this._arrowPrev.setAttribute(
                "aria-disabled",
                onFirst ? "true" : "false",
            );
        }
        if (this._arrowNext) {
            const disableNext = onLast && !this.loop && this.steps.length <= 1;
            this._arrowNext.disabled = disableNext;
            this._arrowNext.setAttribute(
                "aria-disabled",
                disableNext ? "true" : "false",
            );
        }

        const arrowsWrap =
            this._portalRoot?.querySelector(".y-help-nav-arrows");
        if (arrowsWrap) arrowsWrap.hidden = !this.showArrows;
    }

    _updateOverlay(step) {
        const mask = this._overlayMask;
        if (!mask) return;

        // Clear all previous mask cutouts, leaving only the white base rect.
        while (mask.childNodes.length > 1) {
            mask.removeChild(mask.lastChild);
        }
        // Clear any previously-drawn visible outline rects.
        const svg = this._overlaySvg;
        if (svg) {
            for (const o of Array.from(
                svg.querySelectorAll(".y-help-highlight"),
            )) {
                o.remove();
            }
        }

        const svgNs = "http://www.w3.org/2000/svg";
        const padding =
            typeof step.highlightPadding === "number"
                ? step.highlightPadding
                : this.highlightPadding;
        const radius = this._cssNumber(
            "--component-help-highlight-border-radius",
            4,
        );

        for (const el of this._activeTargets) {
            const r = el.getBoundingClientRect();
            const x = r.left - padding;
            const y = r.top - padding;
            const w = r.width + padding * 2;
            const h = r.height + padding * 2;
            if (w <= 0 || h <= 0) continue;

            // Mask cutout — invisible itself, just punches a hole in the
            // dim so the underlying page shows through.
            const cutout = document.createElementNS(svgNs, "rect");
            cutout.setAttribute("x", String(x));
            cutout.setAttribute("y", String(y));
            cutout.setAttribute("width", String(w));
            cutout.setAttribute("height", String(h));
            cutout.setAttribute("rx", String(radius));
            cutout.setAttribute("ry", String(radius));
            cutout.setAttribute("fill", "black");
            mask.appendChild(cutout);

            // Visible outline — the styleable `highlight` part. Drawn into
            // the SVG (on top of the masked dim) so a primary-color stroke
            // makes the target's edge clear in dark themes.
            if (svg) {
                const outline = document.createElementNS(svgNs, "rect");
                outline.setAttribute("class", "y-help-highlight");
                outline.setAttribute("part", "highlight");
                outline.setAttribute("x", String(x));
                outline.setAttribute("y", String(y));
                outline.setAttribute("width", String(w));
                outline.setAttribute("height", String(h));
                outline.setAttribute("rx", String(radius));
                outline.setAttribute("ry", String(radius));
                svg.appendChild(outline);
            }
        }

        const blocker = this._overlayBlocker;
        if (blocker) {
            blocker.classList.toggle(
                "y-help-blocker--off",
                !this.disableTargetInteraction,
            );
        }
    }

    _updateProgress() {
        const total = this.steps.length;
        const text = `${this._currentIndex + 1} of ${total}`;
        this._tipProgress.textContent = text;
        this._tipProgress.hidden = !this.showProgress;
    }

    _userClose(reason) {
        this._unmount(reason);
    }
}

if (!customElements.get("y-help")) {
    customElements.define("y-help", YumeHelp);
}
