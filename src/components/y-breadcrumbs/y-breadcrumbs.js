import "../y-icon/y-icon.js";
import {
    coerceRichData,
    createElement as _el,
    upgradeProperties,
} from "../../modules/helpers.js";

export class YumeBreadcrumbs extends HTMLElement {
    static get observedAttributes() {
        return ["items", "max-items", "separator", "size", "history"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._expanded = false;
        this._items = null;
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "items") {
            this._items = coerceRichData(newValue);
            this._expanded = false;
        } else if (name === "max-items") {
            this._expanded = false;
        }

        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** When omitted, navigation uses pushState. Set to "false" for full-page navigation. */
    get history() {
        return this.getAttribute("history");
    }
    set history(val) {
        if (val === null || val === undefined) this.removeAttribute("history");
        else this.setAttribute("history", val);
    }

    /** Array of breadcrumb items. */
    get items() {
        return Array.isArray(this._items) ? this._items : [];
    }
    set items(val) {
        this._items = coerceRichData(val);
        this._expanded = false;
        this.render();
    }

    /** Maximum visible items before collapsing. */
    get maxItems() {
        const val = parseInt(this.getAttribute("max-items"), 10);
        return Number.isFinite(val) && val >= 2 ? val : null;
    }
    set maxItems(val) {
        if (val === null || val === undefined) {
            this.removeAttribute("max-items");
        } else {
            this.setAttribute("max-items", String(val));
        }
    }

    /** Text or character used as the separator. Defaults to a chevron-right icon when unset. */
    get separator() {
        return this.getAttribute("separator");
    }
    set separator(val) {
        if (val === null || val === undefined || val === "") {
            this.removeAttribute("separator");
        } else {
            this.setAttribute("separator", val);
        }
    }

    /** Controls padding, font size, and icon size. */
    get size() {
        const val = this.getAttribute("size");
        return ["small", "medium", "large"].includes(val) ? val : "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const items = this.items;

        this.shadowRoot.innerHTML = "";

        const style = document.createElement("style");
        style.textContent = this._buildStyles();
        this.shadowRoot.appendChild(style);

        if (!items.length) return;

        const nav = _el("nav", {
            class: "breadcrumbs",
            part: "breadcrumbs",
            "aria-label": "Breadcrumb",
        });

        const ol = _el("ol", { class: "list", part: "list" });
        const visibleItems = this._getVisibleItems(items);

        visibleItems.forEach((entry) => {
            if (entry.type === "expand") {
                ol.appendChild(this._buildExpandItem());
                ol.appendChild(this._buildSeparatorItem());
            } else {
                ol.appendChild(this._buildItem(entry.item, entry.index, items));

                if (entry.index < items.length - 1) {
                    ol.appendChild(this._buildSeparatorItem());
                }
            }
        });

        nav.appendChild(ol);
        this.shadowRoot.appendChild(nav);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildExpandItem() {
        const btn = _el(
            "button",
            {
                class: "expand-btn",
                part: "expand-btn",
                "aria-label": "Show all breadcrumbs",
            },
            ["\u2026"],
        );

        btn.addEventListener("click", () => this._onExpand());

        const li = _el("li", { class: "item expand", role: "presentation" }, [
            btn,
        ]);

        return li;
    }

    _buildHostStyles() {
        return `
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                font-weight: var(--font-weight-body, 300);
            }

            :host([hidden]) {
                display: none !important;
            }
        `;
    }

    _buildItem(item, index, items) {
        const isCurrent = index === items.length - 1;
        const parts = ["item"];

        if (isCurrent) parts.push("item--current");

        const li = _el("li", {
            class: `item ${isCurrent ? "current" : ""}`,
            part: parts.join(" "),
        });

        let linkEl;
        if (isCurrent || !item.href) {
            linkEl = _el(
                "span",
                {
                    class: "link current-text",
                    part: "link",
                    "aria-current": isCurrent ? "page" : false,
                },
                [item.text],
            );
        } else {
            linkEl = _el(
                "a",
                {
                    class: "link",
                    part: "link",
                    href: item.href,
                },
                [item.text],
            );
            linkEl.addEventListener("click", (e) => {
                if (
                    e.button !== 0 ||
                    e.metaKey ||
                    e.ctrlKey ||
                    e.shiftKey ||
                    e.altKey
                )
                    return;
                this._onNavigate(e, item.href);
            });
        }

        const itemSlot = _el("slot", { name: `${index}-item` });
        if (item.icon) {
            itemSlot.appendChild(
                _el("y-icon", {
                    name: item.icon,
                    size: this._getIconSize(),
                    class: "item-icon",
                }),
            );
        }
        itemSlot.appendChild(linkEl);
        li.appendChild(itemSlot);

        return li;
    }

    _buildItemStyles() {
        const fontSizeVar = `var(--component-breadcrumbs-font-size-${this.size}, ${this._getDefaultFontSize()})`;
        const gapVar = `var(--component-breadcrumbs-gap-${this.size}, ${this._getDefaultGap()})`;

        return `
            .list {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: ${gapVar};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            .item {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: ${fontSizeVar};
            }

            .item-icon {
                display: inline-flex;
                align-items: center;
            }

            .link {
                color: var(--component-breadcrumbs-color, var(--primary-content--, #1976d2));
                text-decoration: none;
                transition: color 0.15s ease;
                cursor: pointer;
            }

            .link:hover {
                color: var(--component-breadcrumbs-color-hover, var(--primary-content-hover, #1565c0));
                text-decoration: underline;
            }

            .link:focus-visible {
                outline: 2px solid var(--primary-content--, #1976d2);
                outline-offset: 2px;
                border-radius: var(--radii-small, 2px);
            }

            .current-text {
                color: var(--component-breadcrumbs-color-current, var(--base-content--, #333));
                cursor: default;
                text-decoration: none;
            }

            .current-text:hover {
                color: var(--component-breadcrumbs-color-current, var(--base-content--, #333));
                text-decoration: none;
            }

            .expand-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 2px 4px;
                font-family: inherit;
                font-size: ${fontSizeVar};
                color: var(--component-breadcrumbs-color, var(--primary-content--, #1976d2));
                border-radius: var(--radii-small, 4px);
                line-height: 1;
            }

            .expand-btn:hover {
                color: var(--component-breadcrumbs-color-hover, var(--primary-content-hover, #1565c0));
                text-decoration: underline;
            }

            .expand-btn:focus-visible {
                outline: 2px solid var(--primary-content--, #1976d2);
                outline-offset: 2px;
            }
        `;
    }

    _buildSeparatorItem() {
        const slottedEl = this.querySelector('[slot="separator"]');

        let content;

        if (slottedEl) {
            content = slottedEl.cloneNode(true);
            content.removeAttribute("slot");
        } else if (this.separator) {
            content = document.createTextNode(this.separator);
        } else {
            content = _el("y-icon", { name: "chevron-right", size: "x-small" });
        }

        return _el(
            "li",
            {
                class: "separator",
                part: "separator",
                role: "presentation",
                "aria-hidden": "true",
            },
            [content],
        );
    }

    _buildSeparatorStyles() {
        return `
            .separator {
                display: flex;
                align-items: center;
                color: var(--component-breadcrumbs-separator-color, var(--base-content-lighter, #999));
                user-select: none;
            }
        `;
    }

    _buildStyles() {
        return [
            this._buildHostStyles(),
            this._buildItemStyles(),
            this._buildSeparatorStyles(),
        ].join("\n");
    }

    _getDefaultFontSize() {
        const map = { small: "0.75em", medium: "0.875em", large: "1em" };
        return map[this.size] || map.medium;
    }

    _getDefaultGap() {
        const map = { small: "4px", medium: "8px", large: "12px" };
        return map[this.size] || map.medium;
    }

    _getIconSize() {
        const map = { small: "x-small", medium: "small", large: "medium" };
        return map[this.size] || "small";
    }

    _getVisibleItems(items) {
        const max = this.maxItems;
        const shouldCollapse = max && items.length > max && !this._expanded;

        if (!shouldCollapse) {
            return items.map((item, index) => ({ type: "item", item, index }));
        }

        const first = { type: "item", item: items[0], index: 0 };
        const expand = { type: "expand" };
        const tailCount = max - 1;
        const tail = items.slice(-tailCount).map((item, i) => ({
            type: "item",
            item,
            index: items.length - tailCount + i,
        }));

        return [first, expand, ...tail];
    }

    _onExpand() {
        this._expanded = true;
        this.render();

        this.dispatchEvent(
            new CustomEvent("expand", { bubbles: true, composed: true }),
        );
    }

    _onNavigate(e, href) {
        const event = new CustomEvent("navigate", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { href },
        });

        if (!this.dispatchEvent(event)) {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        if (this.getAttribute("history") !== "false") {
            window.history.pushState({}, "", href);
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
        } else {
            window.location.href = href;
        }
    }
}

if (!customElements.get("y-breadcrumbs")) {
    customElements.define("y-breadcrumbs", YumeBreadcrumbs);
}
