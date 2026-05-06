import { createElement as _el } from "../../modules/helpers.js";
import "../y-avatar/y-avatar.js";

const AVATAR_ATTRS = ["alt", "src", "color", "shape"];

export class YumeAvatarGroup extends HTMLElement {
    static get observedAttributes() {
        return [
            "avatars",
            "max",
            "orientation",
            "overlap",
            "size",
            "stack-order",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "group");
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** JSON array of avatar objects: `[{ alt, src, color, shape }]`. */
    get avatars() {
        return this.getAttribute("avatars");
    }
    set avatars(val) {
        if (val == null) this.removeAttribute("avatars");
        else
            this.setAttribute(
                "avatars",
                typeof val === "string" ? val : JSON.stringify(val),
            );
    }

    /** Maximum visible avatars. `0` means unlimited. */
    get max() {
        return parseInt(this.getAttribute("max"), 10) || 0;
    }
    set max(val) {
        this.setAttribute("max", val);
    }

    /** Layout direction: "horizontal" | "vertical" (default "horizontal"). */
    get orientation() {
        return this.getAttribute("orientation") || "horizontal";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** Overlap offset in pixels (default 2). */
    get overlap() {
        const raw = this.getAttribute("overlap");
        const parsed = parseInt(raw, 10);
        return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2;
    }
    set overlap(val) {
        this.setAttribute("overlap", val);
    }

    /** Avatar size for JSON-rendered avatars: "small" | "medium" | "large". */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Which end sits on top: "first" | "last" (default "last"). */
    get stackOrder() {
        return this.getAttribute("stack-order") || "last";
    }
    set stackOrder(val) {
        this.setAttribute("stack-order", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const fromJson = this._parseAvatars();
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        if (fromJson) this._renderFromJson(fromJson);
        else this._renderFromSlot();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyChildStyles(children) {
        const total = children.length;
        const max = this.max;
        const limit = max > 0 && total > max ? max : total;
        const overflowCount = max > 0 && total > max ? total - max : 0;
        const overlapPx = this.overlap;
        const isVertical = this.orientation === "vertical";
        const marginProp = isVertical
            ? "marginBlockStart"
            : "marginInlineStart";
        const otherMargin = isVertical
            ? "marginInlineStart"
            : "marginBlockStart";
        const visibleCount = limit + (overflowCount > 0 ? 1 : 0);
        const stackLast = this.stackOrder !== "first";

        children.forEach((child, index) => {
            child.style[otherMargin] = "";
            child.style[marginProp] = index === 0 ? "" : `-${overlapPx}px`;
            child.style.position = "relative";
            if (index < limit) {
                child.style.display = "";
                child.style.zIndex = stackLast
                    ? String(index)
                    : String(visibleCount - 1 - index);
            } else {
                child.style.display = "none";
                child.style.zIndex = "";
            }
        });

        return { overflowCount, visibleCount };
    }

    _buildOverflow(count, lastChild, visibleCount) {
        const sample = lastChild || null;
        const size = sample?.getAttribute?.("size") || this.size;
        const shape = sample?.getAttribute?.("shape") || "circle";
        const stackLast = this.stackOrder !== "first";
        const zIndex = stackLast ? String(visibleCount - 1) : "0";
        const btn = _el(
            "button",
            {
                type: "button",
                part: "overflow",
                class: "overflow",
                "data-size": size,
                "data-shape": shape,
                "aria-label": `+${count} more`,
            },
            [`+${count}`],
        );
        btn.style.zIndex = zIndex;
        btn.addEventListener("click", () => this._handleOverflowClick(count));
        return btn;
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        const isVertical = this.orientation === "vertical";
        sheet.replaceSync(`
            :host {
                display: inline-flex;
                flex-direction: ${isVertical ? "column" : "row"};
                align-items: center;
                isolation: isolate;
            }
            ::slotted(*) {
                flex-shrink: 0;
            }
            ::slotted(y-avatar),
            y-avatar {
                border-radius: var(--component-avatar-border-radius-circle, 9999px);
                box-shadow: 0 0 0 var(--component-avatar-group-border-width, 2px) var(--base-background-component);
            }
            ::slotted(y-avatar[shape="square"]),
            ::slotted(y-avatar[shape="rounded"]),
            y-avatar[shape="square"],
            y-avatar[shape="rounded"] {
                border-radius: var(--component-avatar-border-radius-square, 4px);
            }
            .overflow {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                position: relative;
                flex-shrink: 0;
                font-family: var(--font-family-header, "Lexend"), sans-serif;
                font-weight: 600;
                background-color: var(--base-content--);
                color: var(--base-content-inverse);
                border: 0;
                cursor: pointer;
                padding: 0;
                ${isVertical ? "margin-block-start" : "margin-inline-start"}: -${this.overlap}px;
            }
            .overflow[data-size="small"] {
                width: var(--component-avatar-size-small, 27px);
                height: var(--component-avatar-size-small, 27px);
                font-size: calc(var(--component-avatar-size-small, 27px) * 0.4);
            }
            .overflow[data-size="medium"] {
                width: var(--component-avatar-size-medium, 35px);
                height: var(--component-avatar-size-medium, 35px);
                font-size: calc(var(--component-avatar-size-medium, 35px) * 0.4);
            }
            .overflow[data-size="large"] {
                width: var(--component-avatar-size-large, 51px);
                height: var(--component-avatar-size-large, 51px);
                font-size: calc(var(--component-avatar-size-large, 51px) * 0.4);
            }
            .overflow[data-shape="circle"] {
                border-radius: var(--component-avatar-border-radius-circle, 9999px);
            }
            .overflow[data-shape="square"] {
                border-radius: var(--component-avatar-border-radius-square, 4px);
            }
            .overflow[data-shape="rounded"] {
                border-radius: var(--component-avatar-border-radius-square, 4px);
            }
            .overflow:focus-visible {
                outline: 2px solid var(--primary-content--);
                outline-offset: 2px;
            }
        `);
        return sheet;
    }

    _handleOverflowClick(count) {
        this.dispatchEvent(
            new CustomEvent("y-overflow-click", {
                bubbles: true,
                composed: true,
                detail: { count },
            }),
        );
    }

    _parseAvatars() {
        const raw = this.avatars;
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }

    _renderFromJson(items) {
        const size = this.size;
        const children = items.map((item) => {
            const attrs = { size };
            for (const key of AVATAR_ATTRS) {
                if (item && item[key] != null) attrs[key] = item[key];
            }
            return _el("y-avatar", attrs);
        });

        const { overflowCount, visibleCount } =
            this._applyChildStyles(children);
        const nodes = [...children];
        if (overflowCount > 0) {
            const lastVisible = children[this.max - 1] || null;
            nodes.push(
                this._buildOverflow(overflowCount, lastVisible, visibleCount),
            );
        }
        this.shadowRoot.replaceChildren(...nodes);
    }

    _renderFromSlot() {
        let slot = this.shadowRoot.querySelector("slot");
        if (!slot) {
            slot = _el("slot", null);
            slot.addEventListener("slotchange", () =>
                this._updateSlottedChildren(),
            );
            this.shadowRoot.replaceChildren(slot);
        }
        this._updateSlottedChildren();
    }

    _updateSlottedChildren() {
        const slot = this.shadowRoot.querySelector("slot");
        if (!slot) return;

        const children = slot.assignedElements({ flatten: true });
        const { overflowCount, visibleCount } =
            this._applyChildStyles(children);

        const existing = this.shadowRoot.querySelector(".overflow");
        if (existing) existing.remove();

        if (overflowCount > 0) {
            const lastVisible = children[this.max - 1] || null;
            this.shadowRoot.appendChild(
                this._buildOverflow(overflowCount, lastVisible, visibleCount),
            );
        }
    }
}

if (!customElements.get("y-avatar-group")) {
    customElements.define("y-avatar-group", YumeAvatarGroup);
}
