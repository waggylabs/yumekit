import { createElement as _el, upgradeProperties } from "../../modules/helpers.js";
import "../y-icon/y-icon.js";

const VALID_ARROWS = new Set(["true", "false", "hover"]);
const VALID_PAGINATION = new Set(["dots", "fraction", "none"]);
const DRAG_THRESHOLD = 8;
const SETTLE_DELAY = 120;

export class YumeCarousel extends HTMLElement {
    static get observedAttributes() {
        return [
            "arrows",
            "autoplay",
            "gap",
            "index",
            "interval",
            "loop",
            "orientation",
            "pagination",
            "pause-on-hover",
            "per-view",
            "snap",
            "swipe",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._index = 0;
        this._slides = [];
        this._autoplayTimer = null;
        this._settleTimer = null;
        this._pointer = null;
        this._offscreen = false;
        this._hovered = false;
        this._focused = false;
        this._userPaused = false;
        this._reflecting = false;

        this._onVisibilityChange = () => this._syncAutoplay();
        this._onHostHover = (hovered) => {
            this._hovered = hovered;
            this._syncAutoplay();
        };
        this._onHostFocus = (focused) => {
            this._focused = focused;
            this._syncAutoplay();
        };
        this._onPointerEnter = () => this._onHostHover(true);
        this._onPointerLeave = () => this._onHostHover(false);
        this._onFocusIn = () => this._onHostFocus(true);
        this._onFocusOut = () => this._onHostFocus(false);

        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);

        const attrIndex = Number(this.getAttribute("index"));
        if (Number.isFinite(attrIndex) && this.hasAttribute("index")) {
            this._index = attrIndex;
        }

        document.addEventListener("visibilitychange", this._onVisibilityChange);
        this.addEventListener("pointerenter", this._onPointerEnter);
        this.addEventListener("pointerleave", this._onPointerLeave);
        this.addEventListener("focusin", this._onFocusIn);
        this.addEventListener("focusout", this._onFocusOut);

        this._observeOffscreen();
        this._setupSlides();
        this._syncAutoplay();
    }

    disconnectedCallback() {
        this._stopAutoplay();
        document.removeEventListener(
            "visibilitychange",
            this._onVisibilityChange,
        );
        this.removeEventListener("pointerenter", this._onPointerEnter);
        this.removeEventListener("pointerleave", this._onPointerLeave);
        this.removeEventListener("focusin", this._onFocusIn);
        this.removeEventListener("focusout", this._onFocusOut);
        this._io?.disconnect();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "index") {
            if (!this._reflecting) this.goTo(Number(newValue));
            return;
        }

        if (
            name === "autoplay" ||
            name === "interval" ||
            name === "pause-on-hover"
        ) {
            this._syncAutoplay();
            return;
        }

        this.render();
        this._setupSlides();
        this._syncAutoplay();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {"true"|"false"|"hover"} When to show the prev/next buttons. */
    get arrows() {
        const val = this.getAttribute("arrows");
        return VALID_ARROWS.has(val) ? val : "true";
    }
    set arrows(val) {
        this.setAttribute("arrows", val);
    }

    /** @type {boolean} Whether slides advance automatically. */
    get autoplay() {
        return this.hasAttribute("autoplay");
    }
    set autoplay(val) {
        if (val) this.setAttribute("autoplay", "");
        else this.removeAttribute("autoplay");
    }

    /** @type {string} CSS length between slides. */
    get gap() {
        return this.getAttribute("gap") || "0";
    }
    set gap(val) {
        this.setAttribute("gap", val);
    }

    /** @type {number} Index of the current (leftmost visible) slide. */
    get index() {
        return this._index;
    }
    set index(val) {
        this.goTo(Number(val));
    }

    /** @type {number} Autoplay delay in milliseconds. */
    get interval() {
        const n = Number(this.getAttribute("interval"));
        return Number.isFinite(n) && n > 0 ? n : 5000;
    }
    set interval(val) {
        this.setAttribute("interval", String(val));
    }

    /** @type {boolean} Whether navigation wraps around at the ends. */
    get loop() {
        return this.hasAttribute("loop");
    }
    set loop(val) {
        if (val) this.setAttribute("loop", "");
        else this.removeAttribute("loop");
    }

    /** @type {"horizontal"|"vertical"} Scroll axis. */
    get orientation() {
        return this.getAttribute("orientation") === "vertical"
            ? "vertical"
            : "horizontal";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** @type {"dots"|"fraction"|"none"} Slide position indicator style. */
    get pagination() {
        const val = this.getAttribute("pagination");
        return VALID_PAGINATION.has(val) ? val : "dots";
    }
    set pagination(val) {
        this.setAttribute("pagination", val);
    }

    /** @type {boolean} Whether autoplay pauses on hover / focus (default true). */
    get pauseOnHover() {
        return this.getAttribute("pause-on-hover") !== "false";
    }
    set pauseOnHover(val) {
        this.setAttribute("pause-on-hover", val ? "true" : "false");
    }

    /** @type {number} Slides visible at once (fractional values peek the next). */
    get perView() {
        const n = Number(this.getAttribute("per-view"));
        return Number.isFinite(n) && n > 0 ? n : 1;
    }
    set perView(val) {
        this.setAttribute("per-view", String(val));
    }

    /** @type {"start"|"center"} Slide alignment within the viewport. */
    get snap() {
        return this.getAttribute("snap") === "center" ? "center" : "start";
    }
    set snap(val) {
        this.setAttribute("snap", val);
    }

    /** @type {boolean} Whether pointer/touch drag navigation is enabled (default true). */
    get swipe() {
        return this.getAttribute("swipe") !== "false";
    }
    set swipe(val) {
        this.setAttribute("swipe", val ? "true" : "false");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Navigates to a slide index (clamped, or wrapped when `loop`).
     * @param {number} index
     */
    goTo(index) {
        const total = this._slides.length;
        if (!total) return;

        let target = Math.round(Number(index));
        if (!Number.isFinite(target)) return;

        if (this.loop) {
            target = ((target % total) + total) % total;
        } else {
            target = Math.max(0, Math.min(target, total - 1));
        }

        this._navigate(target, true);
    }

    /** Advances one page (`per-view` slides). Wraps when `loop`. */
    next() {
        const max = this._maxIndex();
        if (this._index >= max) {
            if (this.loop) this._navigate(0, true);
            return;
        }
        this._navigate(Math.min(this._index + this._pageStep(), max), true);
    }

    /** Stops autoplay until `play()` is called. */
    pause() {
        this._userPaused = true;
        this._syncAutoplay();
    }

    /** Starts autoplay at runtime (no effect without the `autoplay` attribute). */
    play() {
        this._userPaused = false;
        this._syncAutoplay();
    }

    /** Goes back one page. Wraps when `loop`. */
    previous() {
        if (this._index <= 0) {
            if (this.loop) this._navigate(this._maxIndex(), true);
            return;
        }
        this._navigate(Math.max(this._index - this._pageStep(), 0), true);
    }

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(this._buildTree());
        this._queryRefs();
        this._wireEvents();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildArrowButton(dir) {
        const isPrev = dir === "prev";
        const horizontal = this.orientation === "horizontal";
        const slotName = isPrev ? "prev-icon" : "next-icon";
        const iconName = isPrev
            ? horizontal
                ? "chevron-left"
                : "chevron-up"
            : horizontal
              ? "chevron-right"
              : "chevron-down";

        const slot = _el("slot", { name: slotName }, [
            _el("y-icon", { name: iconName, size: "small" }),
        ]);

        return _el(
            "button",
            {
                class: `arrow arrow--${dir}`,
                part: `${dir}-button`,
                type: "button",
                "aria-label": isPrev ? "Previous slide" : "Next slide",
            },
            [slot],
        );
    }

    _buildPagination() {
        const style = this.pagination;
        const pagination = _el("div", {
            class: "pagination",
            part: "pagination",
        });

        if (style === "none") {
            pagination.style.display = "none";
            return pagination;
        }

        if (style === "fraction") {
            const fraction = _el("div", {
                class: "fraction",
                part: "fraction",
                "aria-hidden": "true",
            });
            pagination.appendChild(fraction);
            return pagination;
        }

        const total = this._slides.length;
        for (let i = 0; i < total; i += 1) {
            const dot = _el("button", {
                class: "dot",
                part: "dot",
                type: "button",
                "aria-label": `Go to slide ${i + 1}`,
            });
            dot.addEventListener("click", () => this.goTo(i));
            pagination.appendChild(dot);
        }
        return pagination;
    }

    _buildStyleSheet() {
        const horizontal = this.orientation === "horizontal";
        const axis = horizontal ? "x" : "y";
        const gap = this._resolveGap();
        const pv = this.perView;
        const basis = `calc((100% - (${pv} - 1) * ${gap}) / ${pv})`;
        const touchAction = !this.swipe
            ? "auto"
            : horizontal
              ? "pan-y"
              : "pan-x";
        const overflow = this.swipe ? "auto" : "hidden";

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                position: relative;
                font-family: var(--font-family-body, sans-serif);
                color: var(--base-content--);
            }

            :host([hidden]) {
                display: none;
            }

            .wrapper {
                display: flex;
                flex-direction: column;
                height: 100%;
                box-sizing: border-box;
            }

            .viewport {
                position: relative;
                flex: 1 1 auto;
                min-height: 0;
            }

            .track {
                display: flex;
                flex-direction: ${horizontal ? "row" : "column"};
                gap: ${gap};
                overflow-${axis}: ${overflow};
                overflow-${horizontal ? "y" : "x"}: hidden;
                scroll-snap-type: ${axis} mandatory;
                scrollbar-width: none;
                touch-action: ${touchAction};
                height: ${horizontal ? "auto" : "100%"};
                outline: none;
            }

            .track::-webkit-scrollbar {
                display: none;
            }

            .track.is-dragging {
                scroll-snap-type: none;
                scroll-behavior: auto;
                cursor: grabbing;
            }

            ::slotted(*) {
                flex: 0 0 ${basis};
                min-width: 0;
                min-height: 0;
                scroll-snap-align: ${this.snap};
                scroll-snap-stop: always;
            }

            .arrow {
                position: absolute;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: center;
                width: var(--component-carousel-arrow-size, 40px);
                height: var(--component-carousel-arrow-size, 40px);
                padding: 0;
                border: none;
                border-radius: var(--radii-full, 50%);
                background: var(--component-carousel-arrow-background, var(--base-background-component));
                color: var(--component-carousel-arrow-color, var(--base-content--));
                box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                transition:
                    opacity var(--component-carousel-transition-duration, 0.3s) ease,
                    background var(--component-carousel-transition-duration, 0.3s) ease;
            }

            .arrow:disabled {
                opacity: 0.4;
                cursor: default;
                pointer-events: none;
            }

            .arrow:focus-visible {
                outline: 2px solid var(--primary-content--);
                outline-offset: 2px;
            }

            ${
                horizontal
                    ? `.arrow--prev { left: var(--spacing-small, 8px); top: 50%; transform: translateY(-50%); }
                       .arrow--next { right: var(--spacing-small, 8px); top: 50%; transform: translateY(-50%); }`
                    : `.arrow--prev { top: var(--spacing-small, 8px); left: 50%; transform: translateX(-50%); }
                       .arrow--next { bottom: var(--spacing-small, 8px); left: 50%; transform: translateX(-50%); }`
            }

            :host([arrows="false"]) .arrow {
                display: none;
            }

            .arrows--hover .arrow {
                opacity: 0;
            }

            .arrows--hover:hover .arrow,
            .arrows--hover:focus-within .arrow {
                opacity: 1;
            }

            .pagination {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--spacing-x-small, 6px);
                margin-top: var(--component-carousel-pagination-gap, 8px);
            }

            .dot {
                width: var(--component-carousel-dot-size, 8px);
                height: var(--component-carousel-dot-size, 8px);
                padding: 0;
                border: none;
                border-radius: var(--radii-full, 50%);
                background: var(--component-carousel-dot-color, var(--base-border));
                cursor: pointer;
                transition: background var(--component-carousel-transition-duration, 0.3s) ease;
            }

            .dot[aria-current="true"] {
                background: var(--component-carousel-dot-color-active, var(--primary-content--));
            }

            .dot:focus-visible {
                outline: 2px solid var(--primary-content--);
                outline-offset: 2px;
            }

            .fraction {
                font-size: 0.85em;
                color: var(--base-content-light);
            }
        `);
        return sheet;
    }

    _buildTree() {
        const track = _el(
            "div",
            {
                class: "track",
                part: "track",
                role: "region",
                tabindex: "0",
                "aria-roledescription": "carousel",
                "aria-label": this.getAttribute("aria-label") || "Carousel",
            },
            [_el("slot")],
        );

        const viewport = _el("div", { class: "viewport", part: "viewport" }, [
            track,
            this._buildArrowButton("prev"),
            this._buildArrowButton("next"),
        ]);

        return _el("div", { class: `wrapper arrows--${this.arrows}` }, [
            viewport,
            this._buildPagination(),
        ]);
    }

    _deriveIndex() {
        const horizontal = this.orientation === "horizontal";
        const center = this.snap === "center";
        const track = this._track;
        const tr = track.getBoundingClientRect();
        const trackAnchor = horizontal
            ? center
                ? tr.left + tr.width / 2
                : tr.left
            : center
              ? tr.top + tr.height / 2
              : tr.top;

        let best = 0;
        let bestDist = Infinity;
        this._slides.forEach((slide, i) => {
            const r = slide.getBoundingClientRect();
            const anchor = horizontal
                ? center
                    ? r.left + r.width / 2
                    : r.left
                : center
                  ? r.top + r.height / 2
                  : r.top;
            const dist = Math.abs(anchor - trackAnchor);
            if (dist < bestDist) {
                bestDist = dist;
                best = i;
            }
        });
        return best;
    }

    _emitChange(previousIndex) {
        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { index: this._index, previousIndex },
                bubbles: true,
                composed: true,
            }),
        );
    }

    _handleKeydown(e) {
        const horizontal = this.orientation === "horizontal";
        const prevKey = horizontal ? "ArrowLeft" : "ArrowUp";
        const nextKey = horizontal ? "ArrowRight" : "ArrowDown";

        const actions = {
            [prevKey]: () => this.previous(),
            [nextKey]: () => this.next(),
            Home: () => this.goTo(0),
            End: () => this.goTo(this._slides.length - 1),
        };

        const action = actions[e.key];
        if (!action) return;
        e.preventDefault();
        action();
    }

    _maxIndex() {
        const total = this._slides.length;
        const visible = Math.ceil(this.perView);
        return Math.max(0, total - visible);
    }

    _navigate(index, smooth) {
        this._scrollToSlide(index, smooth);
        this._resetAutoplay();
    }

    _observeOffscreen() {
        if (typeof IntersectionObserver === "undefined") return;
        this._io = new IntersectionObserver(
            (entries) => {
                this._offscreen = !entries[entries.length - 1].isIntersecting;
                this._syncAutoplay();
            },
            { threshold: 0 },
        );
        this._io.observe(this);
    }

    _onPointerDown(e) {
        if (!this.swipe || e.pointerType === "touch" || e.button !== 0) return;

        this._pointer = {
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: this._track.scrollLeft,
            scrollTop: this._track.scrollTop,
            dragging: false,
        };
    }

    _onPointerMove(e) {
        const p = this._pointer;
        if (!p) return;

        const horizontal = this.orientation === "horizontal";
        const dx = e.clientX - p.startX;
        const dy = e.clientY - p.startY;
        const primary = horizontal ? dx : dy;

        if (!p.dragging) {
            if (Math.abs(primary) < DRAG_THRESHOLD) return;
            p.dragging = true;
            this._track.classList.add("is-dragging");
            this._track.setPointerCapture(e.pointerId);
        }

        if (horizontal) this._track.scrollLeft = p.scrollLeft - dx;
        else this._track.scrollTop = p.scrollTop - dy;
    }

    _onPointerUp(e) {
        const p = this._pointer;
        this._pointer = null;
        if (!p || !p.dragging) return;

        this._track.classList.remove("is-dragging");
        if (this._track.hasPointerCapture?.(e.pointerId)) {
            this._track.releasePointerCapture(e.pointerId);
        }
        this._navigate(this._deriveIndex(), true);
    }

    _onScroll() {
        if (this._pointer?.dragging) return;
        clearTimeout(this._settleTimer);
        this._settleTimer = setTimeout(() => this._settle(), SETTLE_DELAY);
    }

    _pageStep() {
        return Math.max(1, Math.floor(this.perView));
    }

    _prefersReducedMotion() {
        return (
            typeof matchMedia === "function" &&
            matchMedia("(prefers-reduced-motion: reduce)").matches
        );
    }

    _queryRefs() {
        this._wrapper = this.shadowRoot.querySelector(".wrapper");
        this._track = this.shadowRoot.querySelector(".track");
        this._slot = this.shadowRoot.querySelector("slot");
        this._prevBtn = this.shadowRoot.querySelector(".arrow--prev");
        this._nextBtn = this.shadowRoot.querySelector(".arrow--next");
        this._pagination = this.shadowRoot.querySelector(".pagination");
    }

    _reflectIndex() {
        this._reflecting = true;
        this.setAttribute("index", String(this._index));
        this._reflecting = false;
    }

    _resetAutoplay() {
        if (!this._autoplayTimer) return;
        this._stopAutoplay();
        this._startAutoplay();
    }

    _resolveGap() {
        const gap = this.gap.trim();
        return /^[\d.]+$/.test(gap) ? `${gap}px` : gap;
    }

    _scrollToSlide(index, smooth) {
        const slide = this._slides[index];
        if (!slide) return;

        const horizontal = this.orientation === "horizontal";
        const center = this.snap === "center";
        const track = this._track;
        const tr = track.getBoundingClientRect();
        const sr = slide.getBoundingClientRect();

        let delta;
        if (horizontal) {
            delta = center
                ? sr.left + sr.width / 2 - (tr.left + tr.width / 2)
                : sr.left - tr.left;
        } else {
            delta = center
                ? sr.top + sr.height / 2 - (tr.top + tr.height / 2)
                : sr.top - tr.top;
        }

        const behavior =
            smooth && !this._prefersReducedMotion() ? "smooth" : "auto";

        if (horizontal) {
            track.scrollTo({ left: track.scrollLeft + delta, behavior });
        } else {
            track.scrollTo({ top: track.scrollTop + delta, behavior });
        }
    }

    _settle() {
        if (!this._slides.length) return;

        const previous = this._index;
        const derived = this._deriveIndex();

        if (derived !== previous) {
            this._index = derived;
            this._reflectIndex();
            this._updateUi();
            this._emitChange(previous);
        } else {
            this._updateUi();
        }
    }

    _setupSlides() {
        this._slides = this._slot
            ? this._slot.assignedElements({ flatten: true })
            : [];
        const total = this._slides.length;

        this._slides.forEach((slide, i) => {
            slide.setAttribute("role", "group");
            slide.setAttribute("aria-roledescription", "slide");
            slide.setAttribute("aria-label", `${i + 1} of ${total}`);
        });

        this._index = Math.min(this._index, this._maxIndex());

        this._pagination.replaceWith(this._buildPagination());
        this._pagination = this.shadowRoot.querySelector(".pagination");

        this._updateUi();
        if (this._index > 0) this._scrollToSlide(this._index, false);
    }

    _startAutoplay() {
        if (this._autoplayTimer) return;
        this._autoplayTimer = setInterval(() => this.next(), this.interval);
    }

    _stopAutoplay() {
        clearInterval(this._autoplayTimer);
        this._autoplayTimer = null;
    }

    _syncAutoplay() {
        const blockedByHover =
            this.pauseOnHover && (this._hovered || this._focused);
        const active =
            this.autoplay &&
            !this._userPaused &&
            !this._offscreen &&
            !document.hidden &&
            !this._prefersReducedMotion() &&
            !blockedByHover;

        if (active) this._startAutoplay();
        else this._stopAutoplay();

        this._updateLive(active);
    }

    _updateArrows() {
        if (this.arrows === "false") return;
        const atStart = this._index <= 0;
        const atEnd = this._index >= this._maxIndex();
        this._prevBtn.disabled = !this.loop && atStart;
        this._nextBtn.disabled = !this.loop && atEnd;
    }

    _updateLive(playing) {
        if (!this._track) return;
        if (playing) this._track.removeAttribute("aria-live");
        else this._track.setAttribute("aria-live", "polite");
    }

    _updatePagination() {
        if (this.pagination === "none") return;

        if (this.pagination === "fraction") {
            const fraction = this._pagination.querySelector(".fraction");
            if (fraction) {
                fraction.textContent = `${this._index + 1} / ${this._slides.length}`;
            }
            return;
        }

        const dots = this._pagination.querySelectorAll(".dot");
        dots.forEach((dot, i) => {
            if (i === this._index) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
    }

    _updateUi() {
        this._updateArrows();
        this._updatePagination();
        this._updateVisibility();
    }

    _updateVisibility() {
        const start = this._index;
        const end = start + Math.ceil(this.perView);
        this._slides.forEach((slide, i) => {
            const hidden = i < start || i >= end;
            slide.toggleAttribute("inert", hidden);
            slide.setAttribute("aria-hidden", hidden ? "true" : "false");
        });
    }

    _wireEvents() {
        this._slot.addEventListener("slotchange", () => this._setupSlides());

        this._track.addEventListener("scroll", () => this._onScroll(), {
            passive: true,
        });
        this._track.addEventListener("scrollend", () => this._settle());
        this._track.addEventListener("keydown", (e) => this._handleKeydown(e));

        this._track.addEventListener("pointerdown", (e) =>
            this._onPointerDown(e),
        );
        this._track.addEventListener("pointermove", (e) =>
            this._onPointerMove(e),
        );
        this._track.addEventListener("pointerup", (e) => this._onPointerUp(e));
        this._track.addEventListener("pointercancel", (e) =>
            this._onPointerUp(e),
        );

        this._prevBtn.addEventListener("click", () => this.previous());
        this._nextBtn.addEventListener("click", () => this.next());
    }
}

if (!customElements.get("y-carousel")) {
    customElements.define("y-carousel", YumeCarousel);
}
