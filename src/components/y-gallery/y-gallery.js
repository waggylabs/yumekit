import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";

export class YumeGallery extends HTMLElement {
    static get observedAttributes() {
        return [
            "layout",
            "columns",
            "gap",
            "aspect-ratio",
            "expandable",
            "loop",
            "size",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._expandedIndex = -1;
        this._items = [];
        this._onKeyDown = this._onKeyDown.bind(this);
        this._previouslyFocused = null;
    }

    connectedCallback() {
        this.render();
        this._bindSlotListener();
    }

    disconnectedCallback() {
        document.removeEventListener("keydown", this._onKeyDown);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        const wasExpanded = this._expandedIndex >= 0;

        this.render();
        this._bindSlotListener();

        if (wasExpanded) {
            this._showExpandedView();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Layout mode for the thumbnail grid. */
    get layout() {
        return this.getAttribute("layout") || "grid";
    }
    set layout(val) {
        this.setAttribute("layout", val);
    }

    /** Number of columns in grid/masonry layouts. */
    get columns() {
        return parseInt(this.getAttribute("columns"), 10) || 3;
    }
    set columns(val) {
        this.setAttribute("columns", String(val));
    }

    /** Gap between items. */
    get gap() {
        return this.getAttribute("gap") || "medium";
    }
    set gap(val) {
        this.setAttribute("gap", val);
    }

    /** Thumbnail aspect ratio for grid/row layouts. */
    get aspectRatio() {
        return this.getAttribute("aspect-ratio") || "1/1";
    }
    set aspectRatio(val) {
        this.setAttribute("aspect-ratio", val);
    }

    /** Whether clicking a thumbnail opens the expanded view. */
    get expandable() {
        return (
            !this.hasAttribute("expandable") ||
            this.getAttribute("expandable") !== "false"
        );
    }
    set expandable(val) {
        if (val) this.removeAttribute("expandable");
        else this.setAttribute("expandable", "false");
    }

    /** Whether navigation wraps around. */
    get loop() {
        return this.hasAttribute("loop");
    }
    set loop(val) {
        if (val) this.setAttribute("loop", "");
        else this.removeAttribute("loop");
    }

    /** Size for thumbnails and expand arrows. */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Closes the expanded view. */
    close() {
        if (this._expandedIndex < 0) return;

        const idx = this._expandedIndex;
        this._expandedIndex = -1;

        this._removeExpandedView();
        document.removeEventListener("keydown", this._onKeyDown);

        this.dispatchEvent(
            new CustomEvent("close", {
                bubbles: true,
                composed: true,
                detail: { index: idx },
            }),
        );

        if (this._previouslyFocused) {
            this._previouslyFocused.focus();
            this._previouslyFocused = null;
        }
    }

    /** Advances to the next image in the expanded view. */
    next() {
        if (this._expandedIndex < 0) return;

        const prevIndex = this._expandedIndex;
        let nextIndex = prevIndex + 1;

        if (nextIndex >= this._items.length) {
            if (this.loop) nextIndex = 0;
            else return;
        }

        this._expandedIndex = nextIndex;
        this._updateExpandedView();

        this.dispatchEvent(
            new CustomEvent("navigate", {
                bubbles: true,
                composed: true,
                detail: {
                    index: nextIndex,
                    previousIndex: prevIndex,
                    direction: "next",
                },
            }),
        );
    }

    /** Opens the expanded view at the given index. */
    open(index) {
        if (!this.expandable) return;
        if (index < 0 || index >= this._items.length) return;

        const item = this._items[index];
        const event = new CustomEvent("expand", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { index, src: item.fullSrc, element: item.element },
        });
        if (!this.dispatchEvent(event)) return;

        const item_el = this.shadowRoot.querySelector(`.item[data-index="${index}"]`);
        this._previouslyFocused = item_el?.querySelector(".item-btn") || item_el;
        this._expandedIndex = index;
        this._showExpandedView();
        document.addEventListener("keydown", this._onKeyDown);
    }

    /** Returns to the previous image in the expanded view. */
    previous() {
        if (this._expandedIndex < 0) return;

        const prevIndex = this._expandedIndex;
        let nextIndex = prevIndex - 1;

        if (nextIndex < 0) {
            if (this.loop) nextIndex = this._items.length - 1;
            else return;
        }

        this._expandedIndex = nextIndex;
        this._updateExpandedView();
        this.dispatchEvent(
            new CustomEvent("navigate", {
                bubbles: true,
                composed: true,
                detail: {
                    index: nextIndex,
                    previousIndex: prevIndex,
                    direction: "prev",
                },
            }),
        );
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles()}</style>
            <div class="slot-hidden"><slot></slot></div>
            <div class="gallery" part="gallery" role="list"></div>
        `;

        this._indexItems();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindExpandedListeners() {
        const overlay = this.shadowRoot.querySelector(".expand-overlay");
        if (!overlay) return;

        overlay
            .querySelector(".expand-close")
            .addEventListener("click", () => this.close());

        const prevBtn = overlay.querySelector(".expand-prev");
        const nextBtn = overlay.querySelector(".expand-next");

        prevBtn.addEventListener("click", () => this.previous());
        nextBtn.addEventListener("click", () => this.next());

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) this.close();
        });
    }

    _bindSlotListener() {
        const slot = this.shadowRoot.querySelector("slot");
        if (slot) {
            slot.addEventListener("slotchange", () => this._indexItems());
        }
    }

    _buildBaseStyles() {
        return `
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                font-weight: var(--font-weight-body, 300);
            }

            :host([hidden]) {
                display: none !important;
            }

            .slot-hidden {
                display: none !important;
            }

            .gallery {
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .item {
                position: relative;
                overflow: hidden;
                border-radius: var(--component-gallery-thumbnail-radius, var(--radii-small, 4px));
            }

            .item img {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        `;
    }

    _buildExpandStyles() {
        const arrowSizeMap = { small: "32px", medium: "44px", large: "56px" };
        const arrowS = arrowSizeMap[this.size] || arrowSizeMap.medium;

        return `
            .expand-overlay {
                position: fixed;
                inset: 0;
                z-index: var(--component-gallery-expand-z-index, 1000);
                background: var(--component-gallery-expand-background, rgba(0,0,0,0.9));
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--component-gallery-expand-color, #fff);
            }

            .expand-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                max-width: 90vw;
                max-height: 90vh;
            }

            .expand-img {
                max-width: 85vw;
                max-height: 80vh;
                object-fit: contain;
            }

            .expand-caption {
                margin-top: var(--spacing-medium, 8px);
                font-size: 0.95em;
                text-align: center;
                max-width: 600px;
            }

            .expand-counter {
                margin-top: var(--spacing-small, 4px);
                font-size: 0.8em;
                opacity: 0.7;
            }

            .expand-prev,
            .expand-next,
            .expand-close {
                position: absolute;
                background: var(--component-gallery-expand-button-background, rgba(255,255,255,0.15));
                color: var(--component-gallery-expand-color, #fff);
                border: none;
                border-radius: var(--radii-full, 50%);
                width: ${arrowS};
                height: ${arrowS};
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                padding: 0;
                transition: background 0.2s ease;
            }

            .expand-prev:hover,
            .expand-next:hover,
            .expand-close:hover {
                background: var(--component-gallery-expand-button-background-hover, rgba(255,255,255,0.3));
            }

            .expand-prev:focus-visible,
            .expand-next:focus-visible,
            .expand-close:focus-visible {
                outline: 2px solid var(--component-gallery-expand-color, #fff);
                outline-offset: 2px;
            }

            .expand-prev:disabled,
            .expand-next:disabled {
                opacity: 0.3;
                cursor: default;
                pointer-events: none;
            }

            .expand-prev {
                left: var(--spacing-large, 16px);
                top: 50%;
                transform: translateY(-50%);
            }

            .expand-next {
                right: var(--spacing-large, 16px);
                top: 50%;
                transform: translateY(-50%);
            }

            .expand-close {
                top: var(--spacing-large, 16px);
                right: var(--spacing-large, 16px);
            }
        `;
    }

    _buildExpandedDOM() {
        const item = this._items[this._expandedIndex];
        const caption = item.caption || item.alt || "";
        const counter = `${this._expandedIndex + 1} / ${this._items.length}`;
        const prevDisabled = !this.loop && this._expandedIndex === 0;
        const nextDisabled =
            !this.loop && this._expandedIndex === this._items.length - 1;

        const closeBtn = this._createNavButton(
            "expand-close",
            "Close image viewer",
            "close",
            "expand-close-icon",
        );
        const prevBtn = this._createNavButton(
            "expand-prev",
            "Previous image",
            "chevron-left",
            "expand-prev-icon",
            prevDisabled,
        );
        const nextBtn = this._createNavButton(
            "expand-next",
            "Next image",
            "chevron-right",
            "expand-next-icon",
            nextDisabled,
        );
        const content = this._createExpandContent(item, caption, counter);

        return _el(
            "div",
            {
                class: "expand-overlay",
                part: "expand-overlay",
                role: "dialog",
                "aria-modal": "true",
                "aria-label": "Image viewer",
            },
            [closeBtn, prevBtn, content, nextBtn],
        );
    }

    _buildInteractiveStyles() {
        return `
            .item-btn {
                display: block;
                width: 100%;
                height: 100%;
                padding: 0;
                border: none;
                background: none;
                cursor: pointer;
                font: inherit;
                color: inherit;
                border-radius: inherit;
            }

            .item-btn img {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .item-btn::after {
                content: "";
                position: absolute;
                inset: 0;
                background: var(--component-gallery-thumbnail-overlay-color, var(--neutral-black-translucent, rgba(0,0,0,0.12)));
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
                border-radius: inherit;
            }

            .item-btn:hover::after,
            .item-btn:focus-visible::after {
                opacity: 1;
            }

            .item-btn:focus-visible {
                outline: 2px solid var(--primary-content--);
                outline-offset: 2px;
            }
        `;
    }

    _buildLayoutStyles() {
        const gap = this._resolveGap();
        const columns = this.columns;
        const aspectRatio = this.aspectRatio;
        const tabletCols = Math.min(2, columns);
        const minW = this._getThumbnailMinWidth();

        const responsiveCSS = `
            @media (max-width: 768px) {
                .gallery { ${this.layout === "grid" ? `grid-template-columns: repeat(${tabletCols}, 1fr)` : `columns: ${tabletCols}`}; }
            }
            @media (max-width: 480px) {
                .gallery { ${this.layout === "grid" ? "grid-template-columns: 1fr" : "columns: 1"}; }
            }
        `;

        switch (this.layout) {
            case "grid":
                return `
                    .gallery {
                        display: grid;
                        grid-template-columns: repeat(var(--component-gallery-columns, ${columns}), 1fr);
                        gap: ${gap};
                    }
                    .item img {
                        aspect-ratio: var(--component-gallery-aspect-ratio, ${aspectRatio});
                    }
                    ${responsiveCSS}
                `;
            case "masonry":
                return `
                    .gallery {
                        columns: var(--component-gallery-columns, ${columns});
                        column-gap: ${gap};
                    }
                    .item {
                        break-inside: avoid;
                        margin-bottom: ${gap};
                    }
                    ${responsiveCSS}
                `;
            case "row":
                return `
                    .gallery {
                        display: flex;
                        flex-direction: row;
                        gap: ${gap};
                        overflow-x: auto;
                        overflow-y: hidden;
                    }
                    .item {
                        flex: 0 0 auto;
                        min-width: ${minW};
                    }
                    .item img {
                        aspect-ratio: var(--component-gallery-aspect-ratio, ${aspectRatio});
                    }
                `;
            case "column":
                return `
                    .gallery {
                        display: flex;
                        flex-direction: column;
                        gap: ${gap};
                    }
                `;
            default:
                return "";
        }
    }

    _buildStyles() {
        return [
            this._buildBaseStyles(),
            this._buildLayoutStyles(),
            this.expandable ? this._buildInteractiveStyles() : "",
            this._buildExpandStyles(),
        ].join("\n");
    }

    _createExpandContent(item, caption, counter) {
        const img = _el("img", {
            class: "expand-img",
            part: "expand-img",
            src: item.fullSrc,
            alt: item.alt || "",
            "aria-current": "true",
        });

        const children = [img];

        if (caption) {
            children.push(
                _el(
                    "div",
                    { class: "expand-caption", part: "expand-caption" },
                    [caption],
                ),
            );
        }

        children.push(
            _el("div", { class: "expand-counter", part: "expand-counter" }, [
                counter,
            ]),
        );

        return _el("div", { class: "expand-content" }, children);
    }

    _createItemWrapper(data, index) {
        const attrs = { class: "item", part: "item", role: "listitem", "data-index": String(index) };
        const img = _el("img", { src: data.src, alt: data.alt, part: "item-img", draggable: "false" });

        if (this.expandable) {
            const btn = _el("button", {
                class: "item-btn",
                "aria-label": `View image: ${data.alt || `Image ${index + 1}`}`,
            }, [img]);
            btn.addEventListener("click", () => this.open(index));
            return _el("div", attrs, [btn]);
        }

        return _el("div", attrs, [img]);
    }

    _createNavButton(name, label, iconName, slotName, disabled) {
        const icon = _el("y-icon", {
            name: iconName,
            size: this._getExpandIconSize(),
        });
        const slot = _el("slot", { name: slotName }, [icon]);
        const attrs = { class: name, part: name, "aria-label": label };

        if (disabled) attrs.disabled = true;

        return _el("button", attrs, [slot]);
    }

    _getExpandIconSize() {
        const sizeMap = { small: "medium", medium: "large", large: "x-large" };
        return sizeMap[this.size] || "large";
    }

    _getThumbnailMinWidth() {
        const sizeMap = { small: "80px", medium: "120px", large: "180px" };
        return sizeMap[this.size] || sizeMap.medium;
    }

    _getImageData(el) {
        let img, caption;

        if (el.tagName === "FIGURE") {
            img = el.querySelector("img");
            const figcaption = el.querySelector("figcaption");
            caption = figcaption ? figcaption.textContent : "";
        } else if (el.tagName === "IMG") {
            img = el;
            caption = "";
        } else {
            return null;
        }

        if (!img) return null;

        return {
            element: el,
            src: img.getAttribute("src") || "",
            fullSrc:
                img.getAttribute("data-src") || img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "",
            caption,
        };
    }

    _indexItems() {
        const slot = this.shadowRoot.querySelector("slot");
        if (!slot) return;

        const gallery = this.shadowRoot.querySelector(".gallery");
        gallery.querySelectorAll(".item").forEach((el) => el.remove());

        const assigned = slot.assignedElements({ flatten: true });
        this._items = [];

        assigned.forEach((el) => {
            const data = this._getImageData(el);
            if (!data) return;

            this._items.push(data);
            gallery.appendChild(this._createItemWrapper(data, this._items.length - 1));
        });
    }

    _onKeyDown(e) {
        if (this._expandedIndex < 0) return;

        const keyActions = {
            Escape: () => this.close(),
            ArrowLeft: () => this.previous(),
            ArrowRight: () => this.next(),
        };

        const action = keyActions[e.key];
        if (action) {
            e.preventDefault();
            action();
            return;
        }

        if (e.key === "Tab") {
            this._trapFocus(e);
        }
    }

    _removeExpandedView() {
        const overlay = this.shadowRoot.querySelector(".expand-overlay");
        if (overlay) overlay.remove();
    }

    _resolveGap() {
        const gap = this.gap;
        const gapMap = {
            small: "var(--component-gallery-gap-small, 4px)",
            medium: "var(--component-gallery-gap-medium, 8px)",
            large: "var(--component-gallery-gap-large, 16px)",
        };

        if (gapMap[gap]) return gapMap[gap];

        if (typeof CSS !== "undefined" && CSS.supports && CSS.supports("gap", gap)) {
            return gap;
        }

        return gapMap.medium;
    }

    _showExpandedView() {
        this._removeExpandedView();
        this.shadowRoot.appendChild(this._buildExpandedDOM());
        this._bindExpandedListeners();

        const closeBtn = this.shadowRoot.querySelector(".expand-close");

        if (closeBtn) closeBtn.focus();
    }

    _trapFocus(e) {
        const overlay = this.shadowRoot.querySelector(".expand-overlay");
        if (!overlay) return;

        const focusable = overlay.querySelectorAll("button:not(:disabled)");
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = this.shadowRoot.activeElement || document.activeElement;

        if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    }

    _updateExpandedView() {
        this._removeExpandedView();
        this.shadowRoot.appendChild(this._buildExpandedDOM());
        this._bindExpandedListeners();

        const prevBtn = this.shadowRoot.querySelector(".expand-prev");
        const nextBtn = this.shadowRoot.querySelector(".expand-next");

        if (prevBtn && !prevBtn.disabled) {
            prevBtn.focus();
        } else if (nextBtn && !nextBtn.disabled) {
            nextBtn.focus();
        }
    }
}

if (!customElements.get("y-gallery")) {
    customElements.define("y-gallery", YumeGallery);
}
