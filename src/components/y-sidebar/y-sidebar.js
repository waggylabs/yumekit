import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-menu/y-menu.js";
import {
    buildNavItemIcon,
    createElement as _el,
    isNavItemActive,
    navigateFrom,
    upgradeProperties,
} from "../../modules/helpers.js";

const SIZE_CONFIG = {
    small: {
        padding: "var(--spacing-x-small, 4px)",
        collapsedWidth:
            "var(--component-sidebar-collapsed-width-small, var(--component-appbar-collapsed-width-small, 40px))",
        bodyGap: "2px",
        buttonSize: "small",
        iconSize: "small",
    },
    medium: {
        padding: "var(--spacing-small, 6px)",
        collapsedWidth:
            "var(--component-sidebar-collapsed-width-medium, var(--component-appbar-collapsed-width-medium, 52px))",
        bodyGap: "3px",
        buttonSize: "medium",
        iconSize: "medium",
    },
    large: {
        padding: "var(--spacing-medium, 8px)",
        collapsedWidth:
            "var(--component-sidebar-collapsed-width-large, var(--component-appbar-collapsed-width-large, 64px))",
        bodyGap: "4px",
        buttonSize: "large",
        iconSize: "large",
    },
};

export class YumeSidebar extends HTMLElement {
    static get observedAttributes() {
        return [
            "collapsed",
            "items",
            "size",
            "menu-direction",
            "sticky",
            "history",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._onCollapseClick = this._onCollapseClick.bind(this);
        this._idCounter = 0;
    }

    connectedCallback() {
        upgradeProperties(this);
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Whether the sidebar is currently collapsed to icon-only mode. */
    get collapsed() {
        return this.hasAttribute("collapsed");
    }
    set collapsed(val) {
        if (val) this.setAttribute("collapsed", "");
        else this.removeAttribute("collapsed");
    }

    /**
     * Navigation mode: omit for pushState (SPA-friendly), set to "false" for
     * full-page navigation. A cancelable "navigate" event is always dispatched first.
     */
    get history() {
        return this.getAttribute("history");
    }
    set history(val) {
        if (val != null) this.setAttribute("history", val);
        else this.removeAttribute("history");
    }

    /** Nav items array parsed from the "items" attribute. */
    get items() {
        try {
            return JSON.parse(this.getAttribute("items")) || [];
        } catch {
            return [];
        }
    }
    set items(val) {
        if (val === null || val === undefined) this.removeAttribute("items");
        else if (typeof val === "string") this.setAttribute("items", val);
        else this.setAttribute("items", JSON.stringify(val));
    }

    /**
     * Direction menus pop out from nav buttons: "right" (default) or "down".
     */
    get menuDirection() {
        return this.getAttribute("menu-direction") || "";
    }
    set menuDirection(val) {
        if (val) this.setAttribute("menu-direction", val);
        else this.removeAttribute("menu-direction");
    }

    /** Size variant: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Sticky edge: "start" (left) | "end" (right) | false. */
    get sticky() {
        const val = this.getAttribute("sticky");
        return ["start", "end"].includes(val) ? val : false;
    }
    set sticky(val) {
        if (val === "start" || val === "end") this.setAttribute("sticky", val);
        else this.removeAttribute("sticky");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        this._initRender();

        const isCollapsed = this.collapsed;
        const cfg = SIZE_CONFIG[this.size] || SIZE_CONFIG.medium;
        const menuDir = this.menuDirection || "right";

        // Expose collapsed state as an inheritable CSS custom property so
        // default-slotted elements (framework router links, custom nav items)
        // can respond to collapse/expand transitions independently.
        this.style.setProperty(
            "--y-sidebar-collapsed",
            isCollapsed ? "1" : "0",
        );

        const style = _el("style", {}, [this._buildStyles()]);
        const bar = this._buildBar(cfg, isCollapsed, menuDir);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(bar);
    }

    /** Toggles the collapsed state. */
    toggle() {
        this.collapsed = !this.collapsed;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildBar(cfg, isCollapsed, menuDir) {
        const classes = ["sidebar"];
        if (isCollapsed) classes.push("collapsed");

        const bar = _el("div", {
            class: classes.join(" "),
            role: "navigation",
        });

        const iconColWidth = `calc(${cfg.collapsedWidth} - 2 * var(--_sidebar-padding) - ${this._iconColumnBorderX()})`;

        bar.style.setProperty("--_sidebar-padding", cfg.padding);
        bar.style.setProperty("--_sidebar-collapsed-width", cfg.collapsedWidth);
        bar.style.setProperty("--_sidebar-body-gap", cfg.bodyGap);
        bar.style.setProperty(
            "--_button-padding",
            `var(--component-button-padding-${cfg.buttonSize})`,
        );
        bar.style.setProperty("--_icon-col-width", iconColWidth);

        // Also expose icon column width on the host so slotted items can align
        // their own icon to the same column.
        this.style.setProperty("--y-sidebar-icon-col-width", iconColWidth);

        bar.appendChild(this._buildHeader());
        bar.appendChild(this._buildBody(cfg, isCollapsed, menuDir));
        bar.appendChild(this._buildFooter(cfg, isCollapsed));

        return bar;
    }

    _buildBody(cfg, isCollapsed, menuDir) {
        const body = _el("div", { class: "sidebar-body", part: "body" });

        this.items.forEach((item) => {
            body.appendChild(
                this._buildNavItem(item, cfg, isCollapsed, menuDir),
            );
        });
        body.appendChild(_el("slot", {}));

        return body;
    }

    _buildCollapseButton(cfg, isCollapsed) {
        const icon = _el("y-icon", {
            slot: "left-icon",
            name: isCollapsed ? "expand-right" : "expand-left",
            size: cfg.iconSize,
        });

        const children = isCollapsed ? [icon] : [icon, "Collapse"];
        const btn = _el(
            "y-button",
            {
                class: "collapse-btn",
                color: "base",
                "variant": "flat",
                size: cfg.buttonSize,
                "aria-label": isCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar",
            },
            children,
        );

        btn.addEventListener("click", this._onCollapseClick);
        return btn;
    }

    _buildFooter(cfg, isCollapsed) {
        const footer = _el("div", { class: "sidebar-footer", part: "footer" });
        footer.appendChild(_el("slot", { name: "footer" }));
        footer.appendChild(this._buildCollapseButton(cfg, isCollapsed));
        return footer;
    }

    _buildHeader() {
        const logoWrapper = _el("div", { class: "logo-wrapper" }, [
            _el("slot", { name: "logo" }),
        ]);
        const titleWrapper = _el("div", { class: "header-title" }, [
            _el("slot", { name: "title" }),
        ]);
        const headerContent = _el("div", { class: "header-content" }, [
            logoWrapper,
            titleWrapper,
        ]);

        return _el("div", { class: "sidebar-header", part: "header" }, [
            headerContent,
            _el("slot", { name: "header" }),
        ]);
    }

    _buildNavItem(item, cfg, isCollapsed, menuDir) {
        const hasChildren = item.children?.length > 0;
        const showLabel = item.text && !isCollapsed;
        const showArrow = hasChildren && !isCollapsed;
        const btnId = this._uid("sidebar-btn");
        const isActive = isNavItemActive(item);

        const btn = _el("y-button", {
            id: btnId,
            color: isActive ? "primary" : "base",
            "variant": "flat",
            size: cfg.buttonSize,
            "aria-current": isActive ? "page" : false,
        });

        if (item.icon) btn.appendChild(buildNavItemIcon(item.icon, cfg.iconSize));
        if (showLabel) btn.append(item.text);
        if (showArrow) {
            btn.appendChild(
                _el("y-icon", {
                    slot: "right-icon",
                    name: `chevron-${menuDir}`,
                    size: cfg.iconSize,
                }),
            );
        }

        if (item.href && !hasChildren) {
            btn.addEventListener("click", () => navigateFrom(this, item.href));
        }

        const wrapper = _el("div", { class: "nav-item" });
        if (item.slot) {
            const slot = _el("slot", { name: item.slot });
            slot.appendChild(btn);
            wrapper.appendChild(slot);
        } else {
            wrapper.appendChild(btn);
        }

        if (hasChildren) {
            const menuEl = _el("y-menu", {
                anchor: btnId,
                direction: menuDir,
                size: cfg.buttonSize,
                history: this.history,
            });
            menuEl.items = item.children;
            wrapper.appendChild(menuEl);
        }

        return wrapper;
    }

    _buildStyles() {
        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                color: var(--component-sidebar-color, var(--component-appbar-color, #f7f7fa));
            }

            :host([sticky]) {
                position: sticky;
                z-index: var(--component-sidebar-z-index, var(--component-appbar-z-index, 100));
            }
            :host([sticky="start"]) {
                left: 0;
                top: 0;
                height: 100%;
            }
            :host([sticky="end"]) {
                right: 0;
                top: 0;
                height: 100%;
            }

            :host([sticky]) .sidebar {
                border-radius: 0;
                border: none;
            }
            :host([sticky="start"]) .sidebar {
                border-right: var(--component-sidebar-border-width, var(--component-appbar-border-width, 2px)) solid var(--component-sidebar-border-color, var(--component-appbar-border-color, #37383a));
            }
            :host([sticky="end"]) .sidebar {
                border-left: var(--component-sidebar-border-width, var(--component-appbar-border-width, 2px)) solid var(--component-sidebar-border-color, var(--component-appbar-border-color, #37383a));
            }

            .sidebar {
                display: flex;
                flex-direction: column;
                background: var(--component-sidebar-background, var(--component-appbar-background, #0c0c0d));
                border: 2px solid var(--component-sidebar-border-color, var(--component-appbar-border-color, #37383a));
                border-width: var(--component-sidebar-border-width, var(--component-appbar-border-width, 2px));
                border-radius: var(--component-sidebar-border-radius, var(--component-appbar-border-radius, 4px));
                overflow: visible;
                padding: var(--_sidebar-padding);
                box-sizing: border-box;
                width: var(--component-sidebar-width, var(--component-appbar-width, 240px));
                height: 100%;
                transition: width 0.2s ease;
            }
            .sidebar.collapsed {
                width: var(--_sidebar-collapsed-width);
            }

            .sidebar-header,
            .sidebar-body,
            .sidebar-footer {
                flex-shrink: 0;
            }

            .sidebar-body {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                flex-direction: column;
                gap: var(--_sidebar-body-gap);
            }

            .sidebar-header {
                border-bottom: var(--component-sidebar-inner-border-width, var(--component-appbar-inner-border-width, var(--component-sidebar-border-width, 2px))) solid var(--component-sidebar-border-color, var(--component-appbar-border-color, #37383a));
                padding-bottom: var(--_sidebar-padding);
                margin-bottom: var(--_sidebar-padding);
            }
            .sidebar-footer {
                border-top: var(--component-sidebar-inner-border-width, var(--component-appbar-inner-border-width, var(--component-sidebar-border-width, 2px))) solid var(--component-sidebar-border-color, var(--component-appbar-border-color, #37383a));
                padding-top: var(--_sidebar-padding);
                margin-top: var(--_sidebar-padding);
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .header-content {
                display: flex;
                align-items: center;
                padding: var(--_button-padding) 0;
                gap: var(--_button-padding);
                overflow: hidden;
            }
            .logo-wrapper {
                width: var(--_icon-col-width);
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
                margin-left: var(--component-button-border-width, 2px);
            }
            .header-title {
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: var(--font-size-label, 0.9em);
            }
            .sidebar.collapsed .header-title {
                display: none;
            }

            .nav-item {
                display: flex;
                align-items: center;
                position: relative;
                width: 100%;
            }
            .nav-item y-button {
                display: block;
                width: 100%;
            }
            .nav-item y-button::part(button),
            .sidebar-footer y-button::part(button) {
                width: 100%;
                justify-content: flex-start;
                padding-left: 0;
                padding-right: 0;
            }

            /* Fixed-width icon column — keeps icons centred across expanded/collapsed states */
            .nav-item y-button::part(left-icon),
            .sidebar-footer y-button::part(left-icon) {
                width: var(--_icon-col-width);
                display: flex;
                justify-content: center;
                flex-shrink: 0;
            }

            .nav-item y-button::part(right-icon) {
                margin-left: auto;
            }

            /* Collapsed keeps the expanded layout (flex-start + the fixed
               icon column) so the icon stays in the exact same position across
               collapse/expand; only the min-width clamp differs. */
            .sidebar.collapsed .nav-item y-button::part(button),
            .sidebar.collapsed .sidebar-footer y-button::part(button) {
                min-width: 0;
            }
            .sidebar.collapsed .nav-item y-button::part(label),
            .sidebar.collapsed .sidebar-footer y-button::part(label) {
                display: none;
            }
            .sidebar.collapsed .nav-item y-button::part(right-icon),
            .sidebar.collapsed .sidebar-footer y-button::part(right-icon) {
                display: none;
            }

            .sidebar-footer y-button {
                display: block;
                width: 100%;
            }

            .sidebar.collapsed .sidebar-header,
            .sidebar.collapsed .sidebar-body,
            .sidebar.collapsed .sidebar-footer {
                align-items: center;
            }

            /* Default-slot items: full width expanded, clipped to icon column when
               collapsed. The --y-sidebar-collapsed and --y-sidebar-icon-col-width
               custom properties are also set on the host element so slotted components
               can respond to collapse transitions in their own styles. */
            ::slotted(*) {
                display: block;
            }
            ::slotted(:not([slot])) {
                width: 100%;
            }
            .sidebar.collapsed ::slotted(:not([slot])) {
                width: var(--_icon-col-width);
                overflow: hidden;
            }

            span[slot="left-icon"] svg,
            span[slot="right-icon"] svg {
                width: var(--component-icon-size-large, 1.25em);
                height: var(--component-icon-size-large, 1.25em);
            }
        `;
    }

    /**
     * Total horizontal border (left + right) of the collapsed bar, used to size
     * the icon column so collapsed and expanded icons line up. Resolved in JS
     * because the border-width tokens may be a multi-value shorthand (e.g. the
     * waggy offset border "2px 2px 6px 2px"), which can't be multiplied
     * inside calc(). Flat nav buttons render no border (border-style: none), so
     * only the sidebar's own border is subtracted.
     */
    _iconColumnBorderX() {
        const cs = getComputedStyle(this);
        const raw =
            cs.getPropertyValue("--component-sidebar-border-width").trim() ||
            cs.getPropertyValue("--component-appbar-border-width").trim() ||
            "2px";
        const parts = raw.split(/\s+/);
        const right = parts.length >= 2 ? parts[1] : parts[0];
        const left = parts.length === 4 ? parts[3] : right;
        return `(${left} + ${right})`;
    }

    _initRender() {
        this.shadowRoot.innerHTML = "";
        this._idCounter = 0;
    }

    _onCollapseClick() {
        this.toggle();
    }

    _uid(prefix) {
        return `${prefix}-${this._idCounter++}`;
    }
}

if (!customElements.get("y-sidebar")) {
    customElements.define("y-sidebar", YumeSidebar);
}
