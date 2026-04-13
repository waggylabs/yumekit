import "../y-icon/y-icon.js";

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
        this.render();
        this._bindSlotListener();
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

        this._previouslyFocused = this.shadowRoot.querySelector(
            `.item[data-index="${index}"]`,
        );
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

    _bindSlotListener() {
        const slot = this.shadowRoot.querySelector("slot");
        if (slot) {
            slot.addEventListener("slotchange", () => this._indexItems());
        }
    }

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

    _buildExpandedHTML() {
        const item = this._items[this._expandedIndex];
        const caption = item.caption || item.alt || "";
        const counter = `${this._expandedIndex + 1} / ${this._items.length}`;
        const size = this.size;
        const iconSize =
            size === "small"
                ? "medium"
                : size === "large"
                  ? "x-large"
                  : "large";
        const isFirst = this._expandedIndex === 0;
        const isLast = this._expandedIndex === this._items.length - 1;
        const prevDisabled = !this.loop && isFirst;
        const nextDisabled = !this.loop && isLast;

        return `
            <div class="expand-overlay" part="expand-overlay" role="dialog" aria-modal="true" aria-label="Image viewer">
                <button class="expand-close" part="expand-close" aria-label="Close image viewer">
                    <slot name="expand-close-icon"><y-icon name="close" size="${iconSize}"></y-icon></slot>
                </button>
                <button class="expand-prev" part="expand-prev" aria-label="Previous image"${prevDisabled ? ' aria-disabled="true"' : ""}>
                    <slot name="expand-prev-icon"><y-icon name="chevron-left" size="${iconSize}"></y-icon></slot>
                </button>
                <div class="expand-content">
                    <img class="expand-img" part="expand-img" src="${item.fullSrc}" alt="${item.alt || ""}" aria-current="true">
                    ${caption ? `<div class="expand-caption" part="expand-caption">${caption}</div>` : ""}
                    <div class="expand-counter" part="expand-counter">${counter}</div>
                </div>
                <button class="expand-next" part="expand-next" aria-label="Next image"${nextDisabled ? ' aria-disabled="true"' : ""}>
                    <slot name="expand-next-icon"><y-icon name="chevron-right" size="${iconSize}"></y-icon></slot>
                </button>
            </div>
        `;
    }

    _buildStyles() {
        const layout = this.layout;
        const columns = this.columns;
        const gap = this._resolveGap();
        const aspectRatio = this.aspectRatio;
        const isExpandable = this.expandable;
        const size = this.size;

        const thumbnailMinWidth = {
            small: "80px",
            medium: "120px",
            large: "180px",
        };
        const minW = thumbnailMinWidth[size] || thumbnailMinWidth.medium;

        const arrowSize = {
            small: "32px",
            medium: "44px",
            large: "56px",
        };
        const arrowS = arrowSize[size] || arrowSize.medium;

        const tabletCols = Math.min(2, columns);

        let layoutCSS = "";

        if (layout === "grid") {
            layoutCSS = `
                .gallery {
                    display: grid;
                    grid-template-columns: repeat(var(--component-gallery-columns, ${columns}), 1fr);
                    gap: ${gap};
                }
                .item img {
                    aspect-ratio: var(--component-gallery-aspect-ratio, ${aspectRatio});
                }
                @media (max-width: 768px) {
                    .gallery {
                        grid-template-columns: repeat(${tabletCols}, 1fr);
                    }
                }
                @media (max-width: 480px) {
                    .gallery {
                        grid-template-columns: 1fr;
                    }
                }
            `;
        } else if (layout === "masonry") {
            layoutCSS = `
                .gallery {
                    columns: var(--component-gallery-columns, ${columns});
                    column-gap: ${gap};
                }
                .item {
                    break-inside: avoid;
                    margin-bottom: ${gap};
                }
                @media (max-width: 768px) {
                    .gallery {
                        columns: ${tabletCols};
                    }
                }
                @media (max-width: 480px) {
                    .gallery {
                        columns: 1;
                    }
                }
            `;
        } else if (layout === "row") {
            layoutCSS = `
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
        } else if (layout === "column") {
            layoutCSS = `
                .gallery {
                    display: flex;
                    flex-direction: column;
                    gap: ${gap};
                }
            `;
        }

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

            ${layoutCSS}

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

            ${
                isExpandable
                    ? `
            .item {
                cursor: pointer;
            }

            .item::after {
                content: "";
                position: absolute;
                inset: 0;
                background: var(--component-gallery-thumbnail-overlay-color, var(--neutral-black-translucent, rgba(0,0,0,0.12)));
                opacity: 0;
                transition: opacity 0.2s ease;
                pointer-events: none;
                border-radius: inherit;
            }

            .item:hover::after,
            .item:focus-visible::after {
                opacity: 1;
            }

            .item:focus-visible {
                outline: 2px solid var(--primary-content--);
                outline-offset: 2px;
            }
            `
                    : ""
            }

            /* Expanded view */
            .expand-overlay {
                position: fixed;
                inset: 0;
                z-index: var(--component-gallery-expand-z-index, 1000);
                background: var(--component-gallery-expand-background, rgba(0,0,0,0.9));
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--base-content-inverse, #fff);
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
                color: var(--base-content-inverse, #fff);
                max-width: 600px;
            }

            .expand-counter {
                margin-top: var(--spacing-small, 4px);
                font-size: 0.8em;
                opacity: 0.7;
                color: var(--base-content-inverse, #fff);
            }

            .expand-prev,
            .expand-next,
            .expand-close {
                position: absolute;
                background: var(--component-gallery-arrow-background, var(--neutral-white-translucent, rgba(255,255,255,0.15)));
                color: var(--component-gallery-arrow-color, var(--base-content-inverse, #fff));
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
                background: var(--base-background-hover, rgba(255,255,255,0.3));
            }

            .expand-prev:focus-visible,
            .expand-next:focus-visible,
            .expand-close:focus-visible {
                outline: 2px solid var(--base-content-inverse, #fff);
                outline-offset: 2px;
            }

            .expand-prev[aria-disabled="true"],
            .expand-next[aria-disabled="true"] {
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

        // Remove existing wrapper items
        gallery.querySelectorAll(".item").forEach((el) => el.remove());

        const assigned = slot.assignedElements({ flatten: true });
        this._items = [];

        assigned.forEach((el) => {
            const data = this._getImageData(el);
            if (!data) return;

            this._items.push(data);
            const index = this._items.length - 1;

            const wrapper = document.createElement("div");
            wrapper.className = "item";
            wrapper.setAttribute("part", "item");
            wrapper.setAttribute("role", "listitem");
            wrapper.setAttribute("data-index", String(index));

            if (this.expandable) {
                wrapper.setAttribute("tabindex", "0");
                wrapper.setAttribute("role", "button");
                wrapper.setAttribute(
                    "aria-label",
                    `View image: ${data.alt || `Image ${index + 1}`}`,
                );
                wrapper.addEventListener("click", () => this.open(index));
                wrapper.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        this.open(index);
                    }
                });
            }

            // Clone the image for the shadow DOM display
            const img = document.createElement("img");
            img.setAttribute("src", data.src);
            img.setAttribute("alt", data.alt);
            img.setAttribute("part", "item-img");
            img.setAttribute("draggable", "false");

            wrapper.appendChild(img);
            gallery.appendChild(wrapper);
        });
    }

    _onKeyDown(e) {
        if (this._expandedIndex < 0) return;
        if (e.key === "Escape") {
            e.preventDefault();
            this.close();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            this.previous();
        } else if (e.key === "ArrowRight") {
            e.preventDefault();
            this.next();
        } else if (e.key === "Tab") {
            // Trap focus inside expanded view
            const overlay = this.shadowRoot.querySelector(".expand-overlay");
            if (!overlay) return;
            const focusable = overlay.querySelectorAll(
                "button:not([aria-disabled='true'])",
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (
                    document.activeElement === first ||
                    this.shadowRoot.activeElement === first
                ) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (
                    document.activeElement === last ||
                    this.shadowRoot.activeElement === last
                ) {
                    e.preventDefault();
                    first.focus();
                }
            }
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
        return gapMap[gap] || gap;
    }

    _showExpandedView() {
        this._removeExpandedView();
        const template = document.createElement("template");
        template.innerHTML = this._buildExpandedHTML();
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._bindExpandedListeners();

        // Focus the close button
        const closeBtn = this.shadowRoot.querySelector(".expand-close");
        if (closeBtn) closeBtn.focus();
    }

    _updateExpandedView() {
        this._removeExpandedView();
        const template = document.createElement("template");
        template.innerHTML = this._buildExpandedHTML();
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._bindExpandedListeners();

        // Focus prev or next depending on direction
        const prevBtn = this.shadowRoot.querySelector(".expand-prev");
        const nextBtn = this.shadowRoot.querySelector(".expand-next");
        if (prevBtn && !prevBtn.hasAttribute("aria-disabled")) {
            prevBtn.focus();
        } else if (nextBtn && !nextBtn.hasAttribute("aria-disabled")) {
            nextBtn.focus();
        }
    }
}

if (!customElements.get("y-gallery")) {
    customElements.define("y-gallery", YumeGallery);
}
