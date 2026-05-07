import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-select/y-select.js";
import { createElement as _el } from "../../modules/helpers.js";

const VARIANT_VALUES = ["default", "compact", "detailed"];
const SIZE_VALUES = ["small", "medium", "large"];

export class YumePaginator extends HTMLElement {
    static get observedAttributes() {
        return [
            "current-page",
            "total-pages",
            "page-count",
            "boundary-count",
            "variant",
            "size",
            "disabled",
            "hide-on-single-page",
            "items-per-page",
            "page-size-options",
            "page-size-label",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._onKeydown = this._onKeydown.bind(this);
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "navigation");
        if (!this.hasAttribute("aria-label")) {
            this.setAttribute("aria-label", "Pagination");
        }
        this.shadowRoot.addEventListener("keydown", this._onKeydown);
        this._render();
    }

    disconnectedCallback() {
        this.shadowRoot.removeEventListener("keydown", this._onKeydown);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (this.isConnected) this._render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Number of boundary pages always shown at each end. */
    get boundaryCount() {
        const v = parseInt(this.getAttribute("boundary-count"), 10);
        return Number.isFinite(v) && v >= 0 ? v : 1;
    }
    set boundaryCount(v) {
        this.setAttribute("boundary-count", String(v));
    }

    /** Currently active page (1-indexed). Clamped to [1, totalPages]. */
    get currentPage() {
        const v = parseInt(this.getAttribute("current-page"), 10);
        const total = this.totalPages;

        if (!Number.isFinite(v)) return total > 0 ? 1 : 0;
        if (total <= 0) return 0;

        return Math.max(1, Math.min(v, total));
    }
    set currentPage(v) {
        this.setAttribute("current-page", String(v));
    }

    /** When set, all interactive controls are inert. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(v) {
        if (v) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** When set, the component renders nothing if `totalPages <= 1`. */
    get hideOnSinglePage() {
        const v = this.getAttribute("hide-on-single-page");
        return v === null ? true : v !== "false";
    }
    set hideOnSinglePage(v) {
        if (v === false || v === "false") {
            this.setAttribute("hide-on-single-page", "false");
        } else {
            this.removeAttribute("hide-on-single-page");
        }
    }

    /**
     * Currently selected items-per-page value. Returns `null` when the
     * attribute is unset or not numeric.
     */
    get itemsPerPage() {
        const v = parseInt(this.getAttribute("items-per-page"), 10);
        return Number.isFinite(v) && v > 0 ? v : null;
    }
    set itemsPerPage(v) {
        if (v == null) this.removeAttribute("items-per-page");
        else this.setAttribute("items-per-page", String(v));
    }

    /** Maximum number of page buttons displayed at once (excluding ellipses). */
    get pageCount() {
        const v = parseInt(this.getAttribute("page-count"), 10);
        return Number.isFinite(v) && v >= 1 ? v : 5;
    }
    set pageCount(v) {
        this.setAttribute("page-count", String(v));
    }

    /** Label rendered next to the items-per-page select. */
    get pageSizeLabel() {
        return this.getAttribute("page-size-label") ?? "Items per page:";
    }
    set pageSizeLabel(v) {
        if (v == null) this.removeAttribute("page-size-label");
        else this.setAttribute("page-size-label", v);
    }

    /**
     * Available items-per-page choices. Accepts a JSON array of numbers
     * (e.g. `[10, 25, 50]`) or `{ value, label }` objects. Returns `[]` when
     * unset or invalid; the items-per-page select is only rendered when at
     * least one option is available.
     */
    get pageSizeOptions() {
        const raw = this.getAttribute("page-size-options");
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    set pageSizeOptions(v) {
        if (v == null) this.removeAttribute("page-size-options");
        else this.setAttribute("page-size-options", JSON.stringify(v));
    }

    /** Controls button size, font size, and spacing. */
    get size() {
        const v = this.getAttribute("size");
        return SIZE_VALUES.includes(v) ? v : "medium";
    }
    set size(v) {
        this.setAttribute("size", v);
    }

    /** Total number of pages. `0` indicates no data. */
    get totalPages() {
        const v = parseInt(this.getAttribute("total-pages"), 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    }
    set totalPages(v) {
        this.setAttribute("total-pages", String(v));
    }

    /** Visual style — `default`, `compact`, or `detailed` (with prev/next labels). */
    get variant() {
        const v = this.getAttribute("variant");
        return VARIANT_VALUES.includes(v) ? v : "default";
    }
    set variant(v) {
        this.setAttribute("variant", v);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Programmatically jump to a page. Honors event cancellation. */
    goTo(page) {
        const total = this.totalPages;
        if (total <= 0) return;

        const target = Math.max(1, Math.min(parseInt(page, 10) || 0, total));
        if (target === this.currentPage) return;

        this._requestPageChange(target);
    }

    /** Advance to the next page. */
    next() {
        this.goTo(this.currentPage + 1);
    }

    /** Return to the previous page. */
    previous() {
        this.goTo(this.currentPage - 1);
    }

    /** Programmatically change items-per-page. Honors event cancellation. */
    setPageSize(value) {
        const next = parseInt(value, 10);
        if (!Number.isFinite(next) || next <= 0) return;
        if (next === this.itemsPerPage) return;

        this._requestPageSizeChange(next);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildButton(page, { isCurrent, isDisabled }) {
        const parts = ["button"];
        if (isCurrent) parts.push("button--active");
        if (isDisabled) parts.push("button--disabled");

        const attrs = {
            class: `button${isCurrent ? " active" : ""}`,
            part: parts.join(" "),
            "style-type": isCurrent ? "filled" : "flat",
            color: isCurrent ? "primary" : "base",
            size: this.size,
            "data-page": String(page),
            "aria-label": `Go to page ${page}`,
        };

        if (isCurrent) attrs["aria-current"] = "page";
        if (isDisabled) attrs.disabled = true;

        const btn = _el("y-button", attrs, [String(page)]);
        if (!isDisabled) {
            btn.addEventListener("click", () => this._onPageClick(page));
        }
        return btn;
    }

    _buildEllipsis(key) {
        const fallback = _el("span", { "aria-hidden": "true" }, ["…"]);
        const slot = _el("slot", { name: "ellipsis" }, [fallback]);
        return _el(
            "span",
            {
                class: "ellipsis",
                part: "ellipsis",
                role: "presentation",
                "data-key": key,
                "aria-hidden": "true",
            },
            [slot],
        );
    }

    _buildList(items, current, isHostDisabled) {
        const list = _el("div", {
            class: "list",
            part: "list",
            role: "group",
            "aria-label": "Page Navigation",
        });

        for (const item of items) {
            if (item === "ellipsis-start" || item === "ellipsis-end") {
                list.appendChild(this._buildEllipsis(item));
                continue;
            }
            list.appendChild(
                this._buildButton(item, {
                    isCurrent: item === current,
                    isDisabled: isHostDisabled,
                }),
            );
        }

        return list;
    }

    _buildNavButton(direction, current, total, isHostDisabled) {
        const isPrev = direction === "prev";
        const targetPage = isPrev ? current - 1 : current + 1;
        const isEdgeDisabled = isPrev ? current <= 1 : current >= total;
        const isDisabled = isHostDisabled || isEdgeDisabled;

        const partName = isPrev ? "nav-prev" : "nav-next";
        const slotName = isPrev ? "prev-label" : "next-label";
        const iconName = isPrev ? "chevron-left" : "chevron-right";
        const iconAttr = isPrev ? "left-icon" : "right-icon";
        const ariaLabel = isPrev ? "Go to previous page" : "Go to next page";
        const showLabel = this.variant === "detailed";

        const attrs = {
            class: `nav nav-${direction}`,
            part: `${partName}${isDisabled ? " button--disabled" : ""}`,
            "style-type": "flat",
            color: "base",
            size: this.size,
            "aria-label": ariaLabel,
            [iconAttr]: iconName,
        };
        if (isDisabled) attrs.disabled = true;

        const slotFallback = _el("span", { class: "nav-text" }, [
            isPrev ? "Previous" : "Next",
        ]);
        const slot = _el("slot", { name: slotName }, [slotFallback]);

        const children = showLabel ? [slot] : [];
        const btn = _el("y-button", attrs, children);

        if (!isDisabled) {
            btn.addEventListener("click", () => this._onPageClick(targetPage));
        }
        return btn;
    }

    _buildPageSizeSelect() {
        const options = this.pageSizeOptions;
        if (!options.length) return null;

        const normalized = options.map((opt) => {
            if (typeof opt === "object" && opt !== null) {
                return {
                    value: String(opt.value),
                    label: String(opt.label ?? opt.value),
                };
            }
            return { value: String(opt), label: String(opt) };
        });

        const current = this.itemsPerPage;
        const selected =
            current != null && normalized.some((o) => o.value === String(current))
                ? String(current)
                : normalized[0].value;

        const wrap = _el(
            "div",
            {
                class: "page-size",
                part: "page-size",
            },
        );

        const labelText = this.pageSizeLabel;
        if (labelText) {
            wrap.appendChild(
                _el(
                    "span",
                    {
                        class: "page-size-label",
                        part: "page-size-label",
                        id: "y-paginator-page-size-label",
                    },
                    [labelText],
                ),
            );
        }

        const select = _el("y-select", {
            class: "page-size-select",
            part: "page-size-select",
            size: this.size,
            value: selected,
            options: JSON.stringify(normalized),
            "aria-labelledby": "y-paginator-page-size-label",
        });

        if (this.disabled) select.setAttribute("disabled", "");

        select.addEventListener("change", (e) => {
            e.stopPropagation();
            const next = parseInt(e.detail?.value, 10);
            if (Number.isFinite(next)) this._requestPageSizeChange(next);
        });

        wrap.appendChild(select);
        return wrap;
    }

    _buildStyles() {
        return `
            :host {
                display: inline-block;
                font-family: var(--font-family-body, sans-serif);
                font-weight: var(--font-weight-body, 400);
                color: var(--component-paginator-color, var(--base-content--, #333));
                box-sizing: border-box;
            }

            :host([hidden]) {
                display: none !important;
            }

            .root {
                display: flex;
                align-items: center;
                gap: var(--spacing-medium, 16px);
                flex-wrap: wrap;
            }

            .nav-wrapper {
                display: flex;
                align-items: center;
                gap: var(--component-paginator-spacing-${this.size}, 4px);
            }

            .list {
                display: flex;
                align-items: center;
                gap: var(--component-paginator-spacing-${this.size}, 4px);
            }

            .button,
            .nav {
                min-width: var(--component-paginator-button-size-${this.size}, 32px);
            }

            :host([variant="compact"]) .button,
            :host([variant="compact"]) .nav {
                min-width: calc(var(--component-paginator-button-size-${this.size}, 32px) - 4px);
            }

            .ellipsis {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: var(--component-paginator-button-size-${this.size}, 32px);
                height: var(--component-paginator-button-size-${this.size}, 32px);
                color: var(--component-paginator-ellipsis-color, var(--base-content-lighter, #999));
                font-size: var(--component-paginator-font-size-${this.size}, 0.875em);
                user-select: none;
            }

            .page-size {
                display: inline-flex;
                align-items: center;
                gap: var(--component-paginator-spacing-${this.size}, 4px);
                font-size: var(--component-paginator-font-size-${this.size}, 0.875em);
            }

            .page-size-label {
                color: var(--component-paginator-color, var(--base-content--, #333));
                white-space: nowrap;
            }
        `;
    }

    _getPageList(current, total, pageCount, boundaryCount) {
        if (total <= 0) return [];

        const siblingCount = Math.max(0, Math.floor((pageCount - 1) / 2));
        const totalSlots = boundaryCount * 2 + pageCount + 2;

        if (total <= totalSlots) {
            return this._range(1, total);
        }

        const startPages = this._range(1, boundaryCount);
        const endPages = this._range(total - boundaryCount + 1, total);

        const minWindowStart = boundaryCount + 2;
        const maxWindowEnd = total - boundaryCount - 1;

        let windowStart = Math.max(current - siblingCount, minWindowStart);
        let windowEnd = Math.min(current + siblingCount, maxWindowEnd);

        const desiredWindow = pageCount;
        if (windowEnd - windowStart + 1 < desiredWindow) {
            if (current - minWindowStart < maxWindowEnd - current) {
                windowEnd = Math.min(
                    windowStart + desiredWindow - 1,
                    maxWindowEnd,
                );
            } else {
                windowStart = Math.max(
                    windowEnd - desiredWindow + 1,
                    minWindowStart,
                );
            }
        }

        const items = [...startPages];

        if (windowStart > minWindowStart) {
            items.push("ellipsis-start");
        } else if (windowStart === minWindowStart) {
            items.push(boundaryCount + 1);
            windowStart = boundaryCount + 2;
        }

        items.push(...this._range(windowStart, windowEnd));

        if (windowEnd < maxWindowEnd) {
            items.push("ellipsis-end");
        } else if (windowEnd === maxWindowEnd) {
            items.push(total - boundaryCount);
        }

        items.push(...endPages);

        return this._dedupe(items);
    }

    _dedupe(items) {
        const seen = new Set();
        const out = [];
        for (const item of items) {
            const key = String(item);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(item);
        }
        return out;
    }

    _onKeydown(e) {
        if (this.disabled) return;

        const target = e.target;
        if (!target || target.tagName !== "Y-BUTTON") return;

        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                this._stepFocus(target, -1);
                return;
            case "ArrowRight":
                e.preventDefault();
                this._stepFocus(target, 1);
                return;
            case "Home":
                e.preventDefault();
                this._focusFirstButton();
                return;
            case "End":
                e.preventDefault();
                this._focusLastButton();
                return;
            default:
                return;
        }
    }

    _focusableButtons() {
        return Array.from(
            this.shadowRoot.querySelectorAll("y-button:not([disabled])"),
        );
    }

    _focusYButton(yBtn) {
        if (!yBtn) return;
        const inner = yBtn.shadowRoot?.querySelector("button, a");
        if (inner) inner.focus();
        else yBtn.focus();
    }

    _focusFirstButton() {
        this._focusYButton(this._focusableButtons()[0]);
    }

    _focusLastButton() {
        const all = this._focusableButtons();
        this._focusYButton(all[all.length - 1]);
    }

    _stepFocus(currentBtn, offset) {
        const buttons = this._focusableButtons();
        const idx = buttons.indexOf(currentBtn);
        if (idx === -1) return;

        this._focusYButton(buttons[idx + offset]);
    }

    _onPageClick(page) {
        if (this.disabled) return;

        const total = this.totalPages;
        const target = Math.max(1, Math.min(page, total));
        if (target === this.currentPage) return;

        this._requestPageChange(target);
    }

    _range(start, end) {
        if (end < start) return [];
        const out = [];
        for (let i = start; i <= end; i++) out.push(i);
        return out;
    }

    _render() {
        this.shadowRoot.innerHTML = "";
        this.shadowRoot.appendChild(_el("style", {}, [this._buildStyles()]));

        const total = this.totalPages;
        const hasPageSize = this.pageSizeOptions.length > 0;

        if (this.hideOnSinglePage && total <= 1 && !hasPageSize) {
            this.setAttribute("hidden", "");
            return;
        }
        this.removeAttribute("hidden");

        const current = this.currentPage;
        const isHostDisabled = this.disabled;

        const root = _el("div", { class: "root", part: "wrapper" });

        const pageSize = this._buildPageSizeSelect();
        if (pageSize) root.appendChild(pageSize);

        if (total > 0) {
            const wrapper = _el("div", {
                class: "nav-wrapper",
                part: "nav-wrapper",
            });
            wrapper.appendChild(
                this._buildNavButton("prev", current, total, isHostDisabled),
            );

            const items = this._getPageList(
                current,
                total,
                this.pageCount,
                this.boundaryCount,
            );
            wrapper.appendChild(
                this._buildList(items, current, isHostDisabled),
            );

            wrapper.appendChild(
                this._buildNavButton("next", current, total, isHostDisabled),
            );

            root.appendChild(wrapper);
        }

        this.shadowRoot.appendChild(root);
    }

    _requestPageSizeChange(nextSize) {
        const previous = this.itemsPerPage;
        if (nextSize === previous) return;

        const detail = { pageSize: nextSize, previous };

        const event = new CustomEvent("page-size-change", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail,
        });
        if (!this.dispatchEvent(event)) {
            this._render();
            return;
        }

        const update = new CustomEvent("update:items-per-page", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail,
        });
        if (!this.dispatchEvent(update)) {
            this._render();
            return;
        }

        this.itemsPerPage = nextSize;
    }

    _requestPageChange(nextPage) {
        const detail = { page: nextPage };

        const changeEvent = new CustomEvent("page-change", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail,
        });
        if (!this.dispatchEvent(changeEvent)) return;

        const updateEvent = new CustomEvent("update:current-page", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail,
        });
        if (!this.dispatchEvent(updateEvent)) return;

        this.currentPage = nextPage;
    }
}

if (!customElements.get("y-paginator")) {
    customElements.define("y-paginator", YumePaginator);
}
