import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-select/y-select.js";
import { createElement as _el, upgradeProperties } from "../../modules/helpers.js";

const VARIANT_VALUES = ["default", "compact", "detailed"];
const SIZE_VALUES = ["small", "medium", "large"];

const NAV_CONFIG = {
    first: {
        iconName: "expand-left",
        iconSlot: "left-icon",
        ariaLabel: "Go to first page",
    },
    prev: {
        iconName: "chevron-left",
        iconSlot: "left-icon",
        ariaLabel: "Go to previous page",
        labelSlotName: "prev-label",
        labelFallback: "Previous",
    },
    next: {
        iconName: "chevron-right",
        iconSlot: "right-icon",
        ariaLabel: "Go to next page",
        labelSlotName: "next-label",
        labelFallback: "Next",
    },
    last: {
        iconName: "expand-right",
        iconSlot: "right-icon",
        ariaLabel: "Go to last page",
    },
};

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
        this._effectivePageCount = null;
        this._lastObservedWidth = 0;
        this._fitPending = false;
        this._fitIterations = 0;
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("role")) this.setAttribute("role", "navigation");
        if (!this.hasAttribute("aria-label")) {
            this.setAttribute("aria-label", "Pagination");
        }
        this.shadowRoot.addEventListener("keydown", this._onKeydown);
        this._setupResizeObserver();
        this._render();
    }

    disconnectedCallback() {
        this.shadowRoot.removeEventListener("keydown", this._onKeydown);
        this._teardownResizeObserver();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        // Declared maximum / variant changed — discard fit state so we
        // re-evaluate from the declared pageCount.
        if (
            name === "page-count" ||
            name === "total-pages" ||
            name === "variant" ||
            name === "size" ||
            name === "page-size-options"
        ) {
            this._effectivePageCount = null;
            this._fitIterations = 0;
        }

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

    /**
     * Currently active page (1-indexed). Clamped to [1, totalPages] when
     * totalPages >= 1; returns 0 (the unset/no-data sentinel) when
     * totalPages is 0.
     */
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
        else if (typeof v === "string") this.setAttribute("page-size-options", v);
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

    _applyEffectivePageCount(next) {
        this._effectivePageCount = next;
        this._fitIterations++;
        const focus = this._captureFocusKey();
        this._render();
        this._restoreFocusKey(focus);
    }

    _buildButton(page, { isCurrent, isDisabled }) {
        const parts = ["button"];
        if (isCurrent) parts.push("button--active");
        if (isDisabled) parts.push("button--disabled");

        const attrs = {
            class: `button${isCurrent ? " active" : ""}`,
            part: parts.join(" "),
            "variant": isCurrent ? "filled" : "flat",
            color: isCurrent ? "primary" : "base",
            size: this.size,
            // Number buttons stay square/circular even in themes (e.g. Material)
            // that give labeled buttons wide inline padding.
            "padding-mode": "square",
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
        const cfg = NAV_CONFIG[direction];
        const targetPage = this._navTargetPage(direction, current, total);
        const isEdgeDisabled = this._navIsEdge(direction, current, total);
        const isDisabled = isHostDisabled || isEdgeDisabled;

        const partName = `nav-${direction}`;
        const showLabel =
            this.variant === "detailed" && !!cfg.labelSlotName;

        const attrs = {
            class: `nav nav-${direction}`,
            part: `${partName}${isDisabled ? " button--disabled" : ""}`,
            "variant": "flat",
            color: "base",
            size: this.size,
            "aria-label": cfg.ariaLabel,
        };
        if (isDisabled) attrs.disabled = true;

        const icon = _el("y-icon", {
            slot: cfg.iconSlot,
            name: cfg.iconName,
            size: this.size,
        });

        const children = [icon];

        if (showLabel) {
            const slotFallback = _el("span", { class: "nav-text" }, [
                cfg.labelFallback,
            ]);
            const slot = _el(
                "slot",
                { name: cfg.labelSlotName },
                [slotFallback],
            );
            children.push(slot);
        }

        const btn = _el("y-button", attrs, children);

        if (!isDisabled) {
            btn.addEventListener("click", () => this._onPageClick(targetPage));
        }
        return btn;
    }

    _navIsEdge(direction, current, total) {
        if (direction === "first" || direction === "prev") return current <= 1;

        return current >= total;
    }

    _navTargetPage(direction, current, total) {
        if (direction === "first") return 1;
        if (direction === "prev") return current - 1;
        if (direction === "next") return current + 1;

        return total;
    }

    _buildCompactNav(wrapper, current, total, isHostDisabled) {
        wrapper.appendChild(
            this._buildNavButton("first", current, total, isHostDisabled),
        );
        wrapper.appendChild(
            this._buildNavButton("prev", current, total, isHostDisabled),
        );
        wrapper.appendChild(this._buildCompactStatus(current, total));
        wrapper.appendChild(
            this._buildNavButton("next", current, total, isHostDisabled),
        );
        wrapper.appendChild(
            this._buildNavButton("last", current, total, isHostDisabled),
        );
    }

    _buildCompactStatus(current, total) {
        return _el(
            "span",
            {
                class: "compact-status",
                part: "compact-status",
                role: "status",
                "aria-label": `Page ${current} of ${total}`,
            },
            [`${current} of ${total} pages`],
        );
    }

    _buildDefaultNav(wrapper, current, total, isHostDisabled) {
        wrapper.appendChild(
            this._buildNavButton("prev", current, total, isHostDisabled),
        );

        const effectivePageCount =
            this._effectivePageCount ?? this.pageCount;
        const items = this._getPageList(
            current,
            total,
            effectivePageCount,
            this.boundaryCount,
        );
        wrapper.appendChild(this._buildList(items, current, isHostDisabled));

        wrapper.appendChild(
            this._buildNavButton("next", current, total, isHostDisabled),
        );
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
        const showLabel = this.variant === "detailed" && !!labelText;
        if (showLabel) {
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

        const selectAttrs = {
            class: "page-size-select",
            part: "page-size-select",
            size: this.size,
            value: selected,
            options: JSON.stringify(normalized),
        };
        if (showLabel) {
            selectAttrs["aria-labelledby"] = "y-paginator-page-size-label";
        } else {
            selectAttrs["aria-label"] = labelText || "Items per page";
        }
        const select = _el("y-select", selectAttrs);

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
                max-width: 100%;
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

            .compact-status {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 0 var(--spacing-small, 8px);
                color: var(--component-paginator-color, var(--base-content--, #333));
                font-size: var(--component-paginator-font-size-${this.size}, 0.875em);
                white-space: nowrap;
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

    _buttonSizePx() {
        const styles = getComputedStyle(this);
        const raw = styles
            .getPropertyValue(`--component-paginator-button-size-${this.size}`)
            .trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 32;
    }

    _captureFocusKey() {
        const active = this.shadowRoot.activeElement;
        if (!active || active.tagName !== "Y-BUTTON") return null;

        const page = active.getAttribute("data-page");
        if (page) return { kind: "page", value: page };

        const part = active.getAttribute("part")?.split(" ")[0];
        if (part?.startsWith("nav-")) return { kind: "part", value: part };

        return null;
    }

    _gapPx() {
        const styles = getComputedStyle(this);
        const raw = styles
            .getPropertyValue(`--component-paginator-spacing-${this.size}`)
            .trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 4;
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

    _fitToWidth() {
        // Guard against runaway iterations if the layout never settles.
        if (this._fitIterations >= 6) return;

        const root = this.shadowRoot.querySelector(".root");
        if (!root) return;

        const hostWidth = this.clientWidth;
        if (!hostWidth) return;

        // Only the default/detailed variants render a paginated page list
        // whose count we can shrink. Compact has a fixed-size nav and a
        // single status label.
        if (this.variant === "compact") return;

        const declared = this.pageCount;
        const current = this._effectivePageCount ?? declared;
        const contentWidth = root.scrollWidth;
        const slot = this._buttonSizePx() + this._gapPx();
        if (slot <= 0) return;

        if (contentWidth > hostWidth + 1) {
            if (current <= 1) return;
            const overflow = contentWidth - hostWidth;
            const toShrink = Math.max(1, Math.ceil(overflow / slot));
            const next = Math.max(1, current - toShrink);
            if (next === current) return;
            this._applyEffectivePageCount(next);
            return;
        }

        // Room to grow back toward the declared maximum. Require a full slot
        // of slack plus a small buffer (hysteresis) before adding a button so
        // we don't bounce in and out at the threshold.
        if (current < declared) {
            const slack = hostWidth - contentWidth;
            const buffer = slot * 0.5;
            if (slack < slot + buffer) return;
            const grow = Math.floor((slack - buffer) / slot);
            const next = Math.min(declared, current + grow);
            if (next === current) return;
            this._applyEffectivePageCount(next);
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

        if (total > 0) {
            const wrapper = _el("div", {
                class: "nav-wrapper",
                part: "nav-wrapper",
            });

            if (this.variant === "compact") {
                this._buildCompactNav(wrapper, current, total, isHostDisabled);
            } else {
                this._buildDefaultNav(wrapper, current, total, isHostDisabled);
            }

            root.appendChild(wrapper);
        }

        const pageSize = this._buildPageSizeSelect();
        if (pageSize) root.appendChild(pageSize);

        this.shadowRoot.appendChild(root);

        // Capture post-layout width so the ResizeObserver can ignore the
        // dimension change caused by our own render and only react to genuine
        // external resizes.
        this._lastObservedWidth = this.getBoundingClientRect().width;

        this._scheduleFit();
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

    _restoreFocusKey(key) {
        if (!key) return;

        let el = null;
        if (key.kind === "page") {
            el = this.shadowRoot.querySelector(
                `y-button[data-page="${key.value}"]`,
            );
        } else if (key.kind === "part") {
            el = this.shadowRoot.querySelector(
                `y-button[part^="${key.value}"]`,
            );
        }

        if (el) this._focusYButton(el);
    }

    _scheduleFit() {
        if (this._fitPending) return;
        if (typeof requestAnimationFrame !== "function") return;

        this._fitPending = true;
        requestAnimationFrame(() => {
            this._fitPending = false;
            if (this.isConnected) this._fitToWidth();
        });
    }

    _setupResizeObserver() {
        if (typeof ResizeObserver === "undefined") return;
        if (this._ro) return;

        this._ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry) return;

            const width =
                entry.contentBoxSize?.[0]?.inlineSize ??
                entry.contentRect?.width ??
                0;

            // Ignore the resize triggered by our own render — width matches
            // what we measured at the end of _render.
            if (Math.abs(width - this._lastObservedWidth) < 1) return;

            this._lastObservedWidth = width;
            this._effectivePageCount = null;
            this._fitIterations = 0;
            if (this.isConnected) this._render();
        });
        this._ro.observe(this);
    }

    _teardownResizeObserver() {
        this._ro?.disconnect();
        this._ro = null;
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
