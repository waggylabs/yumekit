import "../components/y-button.js";
import "../components/y-icon.js";
import "../components/y-menu.js";
import {
    chevronRight,
    chevronDown,
    collapseLeft,
    expandRight,
    menu,
} from "../icons/index.js";

export class YumeAppbar extends HTMLElement {
    static get observedAttributes() {
        return [
            "orientation",
            "collapsed",
            "items",
            "size",
            "menu-direction",
            "sticky",
            "mobile-breakpoint",
        ];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._onCollapseClick = this._onCollapseClick.bind(this);
        this._onMediaChange = this._onMediaChange.bind(this);
        this._idCounter = 0;
        this._mql = null;
        this._isMobile = false;
    }

    connectedCallback() {
        this._setupMediaQuery();
        this.render();
    }

    disconnectedCallback() {
        this._teardownMediaQuery();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "mobile-breakpoint" || name === "orientation") {
            this._setupMediaQuery();
        }
        this.render();
    }

    get orientation() {
        return this.getAttribute("orientation") || "vertical";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    get collapsed() {
        return this.hasAttribute("collapsed");
    }
    set collapsed(val) {
        if (val) this.setAttribute("collapsed", "");
        else this.removeAttribute("collapsed");
    }

    get items() {
        try {
            return JSON.parse(this.getAttribute("items")) || [];
        } catch {
            return [];
        }
    }
    set items(val) {
        this.setAttribute("items", JSON.stringify(val));
    }

    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /**
     * Direction menus pop out from nav buttons:
     * "right", "down", or unset (auto: vertical → right, horizontal → down).
     */
    get menuDirection() {
        return this.getAttribute("menu-direction") || "";
    }
    set menuDirection(val) {
        if (val) this.setAttribute("menu-direction", val);
        else this.removeAttribute("menu-direction");
    }

    get sticky() {
        const val = this.getAttribute("sticky");
        return ["start", "end"].includes(val) ? val : false;
    }
    set sticky(val) {
        if (val === "start" || val === "end") this.setAttribute("sticky", val);
        else this.removeAttribute("sticky");
    }

    /**
     * Override the mobile breakpoint (in pixels) for this instance.
     * Falls back to the CSS variable --component-appbar-mobile-breakpoint (default 768).
     */
    get mobileBreakpoint() {
        return this.getAttribute("mobile-breakpoint") || "";
    }
    set mobileBreakpoint(val) {
        if (val) this.setAttribute("mobile-breakpoint", val);
        else this.removeAttribute("mobile-breakpoint");
    }

    /** Whether the appbar is currently rendering in mobile mode. */
    get mobile() {
        return this._isMobile;
    }

    toggle() {
        this.collapsed = !this.collapsed;
    }

    _onCollapseClick() {
        this.toggle();
    }

    _uid(prefix) {
        return `${prefix}-${this._idCounter++}`;
    }

    _isItemActive(item) {
        if (item.selected) return true;
        if (item.href) {
            const loc = window.location;
            const current = loc.pathname + loc.search + loc.hash;
            return item.href === current || item.href === loc.href;
        }
        return false;
    }

    _getBreakpointPx() {
        const attr = this.mobileBreakpoint;
        if (attr) {
            const px = parseInt(attr, 10);
            if (!isNaN(px) && px > 0) return px;
        }
        const cssVal = getComputedStyle(document.documentElement)
            .getPropertyValue("--component-appbar-mobile-breakpoint")
            .trim();
        if (cssVal) {
            const px = parseInt(cssVal, 10);
            if (!isNaN(px) && px > 0) return px;
        }
        return 768;
    }

    _setupMediaQuery() {
        this._teardownMediaQuery();
        if (this.orientation !== "horizontal") {
            this._isMobile = false;
            return;
        }
        const bp = this._getBreakpointPx();
        this._mql = window.matchMedia(`(max-width: ${bp}px)`);
        this._isMobile = this._mql.matches;
        this._mql.addEventListener("change", this._onMediaChange);
    }

    _teardownMediaQuery() {
        if (this._mql) {
            this._mql.removeEventListener("change", this._onMediaChange);
            this._mql = null;
        }
    }

    _onMediaChange(e) {
        this._isMobile = e.matches;
        this.render();
    }

    /**
     * Convert appbar nav items to y-menu item format.
     * Maps `href` → `url` and recursively converts children.
     */
    _toMenuItems(items) {
        return items.map((item) => {
            const mi = { text: item.text || "" };
            if (item.href) mi.url = item.href;
            if (item.icon) mi.icon = item.icon;
            if (item.children?.length) {
                mi.children = this._toMenuItems(item.children);
            }
            return mi;
        });
    }

    render() {
        if (this._isMobile) {
            this._renderMobile();
        } else {
            this._renderDesktop();
        }
    }

    _renderMobile() {
        const size = this.size;

        const sizeConfig = {
            small: {
                padding: "var(--spacing-x-small, 4px)",
                buttonSize: "small",
                iconSize: "small",
            },
            medium: {
                padding: "var(--spacing-small, 6px)",
                buttonSize: "medium",
                iconSize: "medium",
            },
            large: {
                padding: "var(--spacing-medium, 8px)",
                buttonSize: "large",
                iconSize: "large",
            },
        };

        this.shadowRoot.innerHTML = "";
        this._idCounter = 0;

        const cfg = sizeConfig[size] || sizeConfig.medium;
        const style = document.createElement("style");

        style.textContent = `
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                color: var(--component-appbar-color, #f7f7fa);
            }

            :host([sticky]),
            :host([sticky="start"]),
            :host([sticky="end"]) {
                position: sticky;
                top: 0;
                left: 0;
                width: 100%;
                z-index: var(--component-appbar-z-index, 100);
            }

            :host([sticky]) .appbar {
                border-radius: 0;
                border: none;
                border-bottom: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
            }

            .appbar {
                display: flex;
                flex-direction: row;
                align-items: center;
                background: var(--component-appbar-background, #0c0c0d);
                border: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                border-radius: var(--component-appbar-border-radius, var(--component-sidebar-border-radius, 4px));
                overflow: visible;
                padding: var(--_appbar-padding);
                box-sizing: border-box;
                width: 100%;
                height: auto;
            }

            .mobile-start {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }

            .mobile-center {
                flex: 1;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
            }

            .mobile-end {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }

            .mobile-end ::slotted(*) {
                display: block;
            }

            ::slotted(*) {
                display: block;
            }
        `;
        this.shadowRoot.appendChild(style);

        const bar = document.createElement("div");
        bar.className = "appbar";
        bar.setAttribute("role", "navigation");
        bar.style.setProperty("--_appbar-padding", cfg.padding);

        /* ── Left: hamburger button ── */
        const startSection = document.createElement("div");
        startSection.className = "mobile-start";

        const menuBtn = document.createElement("y-button");
        const menuBtnId = this._uid("appbar-mobile-menu");
        menuBtn.id = menuBtnId;
        menuBtn.setAttribute("color", "base");
        menuBtn.setAttribute("style-type", "flat");
        menuBtn.setAttribute("size", cfg.buttonSize);
        menuBtn.setAttribute("aria-label", "Open menu");

        const menuIcon = document.createElement("span");
        menuIcon.slot = "left-icon";
        menuIcon.innerHTML = menu;
        menuBtn.appendChild(menuIcon);

        startSection.appendChild(menuBtn);

        const navItems = this.items;
        if (navItems.length > 0) {
            const mobileMenu = document.createElement("y-menu");
            mobileMenu.setAttribute("anchor", menuBtnId);
            mobileMenu.setAttribute("direction", "down");
            mobileMenu.setAttribute("size", cfg.buttonSize);
            mobileMenu.items = this._toMenuItems(navItems);
            startSection.appendChild(mobileMenu);
        }

        bar.appendChild(startSection);

        /* ── Center: logo + title ── */
        const centerSection = document.createElement("div");
        centerSection.className = "mobile-center";

        const logoSlot = document.createElement("slot");
        logoSlot.name = "logo";
        centerSection.appendChild(logoSlot);

        const titleSlot = document.createElement("slot");
        titleSlot.name = "title";
        centerSection.appendChild(titleSlot);

        bar.appendChild(centerSection);

        /* ── Right: footer slot ── */
        const endSection = document.createElement("div");
        endSection.className = "mobile-end";
        endSection.setAttribute("part", "footer");

        const footerSlot = document.createElement("slot");
        footerSlot.name = "footer";
        endSection.appendChild(footerSlot);

        bar.appendChild(endSection);
        this.shadowRoot.appendChild(bar);
    }

    _renderDesktop() {
        const isVertical = this.orientation === "vertical";
        const isCollapsed = this.collapsed && isVertical;
        const size = this.size;
        const menuDir = this.menuDirection || (isVertical ? "right" : "down");

        const sizeConfig = {
            small: {
                padding: "var(--spacing-x-small, 4px)",
                collapsedWidth: "var(--component-appbar-collapsed-width-small, 40px)",
                bodyGap: "2px",
                buttonSize: "small",
                iconSize: "small",
            },
            medium: {
                padding: "var(--spacing-small, 6px)",
                collapsedWidth: "var(--component-appbar-collapsed-width-medium, 52px)",
                bodyGap: "3px",
                buttonSize: "medium",
                iconSize: "medium",
            },
            large: {
                padding: "var(--spacing-medium, 8px)",
                collapsedWidth: "var(--component-appbar-collapsed-width-large, 64px)",
                bodyGap: "4px",
                buttonSize: "large",
                iconSize: "large",
            },
        };

        this.shadowRoot.innerHTML = "";
        this._idCounter = 0;

        const cfg = sizeConfig[size] || sizeConfig.medium;
        const style = document.createElement("style");

        style.textContent = `
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                color: var(--component-appbar-color, #f7f7fa);
            }

            :host([sticky]) {
                position: sticky;
                z-index: var(--component-appbar-z-index, 100);
            }
            :host([orientation="vertical"][sticky="start"]),
            :host(:not([orientation])[sticky="start"]) {
                left: 0;
                top: 0;
                height: 100%;
            }
            :host([orientation="vertical"][sticky="end"]),
            :host(:not([orientation])[sticky="end"]) {
                right: 0;
                top: 0;
                height: 100%;
            }
            :host([orientation="horizontal"][sticky="start"]) {
                top: 0;
                left: 0;
                width: 100%;
            }
            :host([orientation="horizontal"][sticky="end"]) {
                bottom: 0;
                left: 0;
                width: 100%;
            }

            :host([sticky]) .appbar {
                border-radius: 0;
                border: none;
            }
            :host([orientation="vertical"][sticky="start"]) .appbar,
            :host(:not([orientation])[sticky="start"]) .appbar {
                border-right: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
            }
            :host([orientation="vertical"][sticky="end"]) .appbar,
            :host(:not([orientation])[sticky="end"]) .appbar {
                border-left: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
            }
            :host([orientation="horizontal"][sticky="start"]) .appbar {
                border-bottom: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
            }
            :host([orientation="horizontal"][sticky="end"]) .appbar {
                border-top: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
            }

            .appbar {
                display: flex;
                background: var(--component-appbar-background, #0c0c0d);
                border: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                border-radius: var(--component-appbar-border-radius, var(--component-sidebar-border-radius, 4px));
                overflow: visible;
                padding: var(--_appbar-padding);
                box-sizing: border-box;
            }

            .appbar.vertical {
                flex-direction: column;
                width: var(--component-appbar-width, 240px);
                height: 100%;
                transition: width 0.2s ease;
            }
            .appbar.vertical.collapsed {
                width: var(--_appbar-collapsed-width);
            }

            .appbar.horizontal {
                flex-direction: row;
                width: 100%;
                height: auto;
                align-items: center;
            }

            .appbar-header,
            .appbar-body,
            .appbar-footer {
                flex-shrink: 0;
            }

            .appbar-body {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                display: flex;
                gap: var(--_appbar-body-gap);
            }

            .appbar.vertical .appbar-body {
                flex-direction: column;
            }
            .appbar.horizontal .appbar-body {
                flex-direction: row;
                overflow-y: hidden;
                overflow-x: auto;
                align-items: center;
            }

            .appbar.vertical .appbar-header {
                border-bottom: var(--component-appbar-inner-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                padding: var(--_appbar-padding) 0;
                margin-bottom: var(--_appbar-padding);
            }
            .appbar.vertical .appbar-footer {
                border-top: var(--component-appbar-inner-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                padding-top: var(--_appbar-padding);
                margin-top: var(--_appbar-padding);
            }

            .appbar.horizontal .appbar-header {
                border-right: var(--component-appbar-inner-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                padding: var(--_appbar-padding);
                padding-right: var(--spacing-x-large, 16px);
                margin-right: var(--_appbar-padding);
            }
            .appbar.horizontal .appbar-footer {
                border-left: var(--component-appbar-inner-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                padding-left: var(--_appbar-padding);
                margin-left: var(--_appbar-padding);
            }

            .header-content {
                display: flex;
                align-items: center;
                gap: var(--spacing-small, 8px);
                overflow: hidden;
            }
            .appbar.horizontal .header-content,
            .appbar.vertical .header-content {
                flex-direction: row;
            }
            .logo-wrapper {
                width: var(--_icon-col-width);
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
            }

            .header-title {
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                font-size: var(--font-size-label, 0.9em);
            }
            .appbar.vertical.collapsed .header-title {
                display: none;
            }

            .nav-item {
                display: flex;
                align-items: center;
                position: relative;
            }
            .appbar.vertical .nav-item {
                width: 100%;
            }
            .appbar.vertical .nav-item y-button {
                display: block;
                width: 100%;
            }
            .appbar.vertical .nav-item y-button::part(button),
            .appbar.vertical .appbar-footer y-button::part(button) {
                width: 100%;
                justify-content: flex-start;
                padding-left: 0;
                padding-right: 0;
            }

            /* Fixed-width icon column — matches collapsed inner width so icons stay centred across states */
            .appbar.vertical .nav-item y-button::part(left-icon),
            .appbar.vertical .appbar-footer y-button::part(left-icon) {
                width: var(--_icon-col-width);
                display: flex;
                justify-content: center;
                flex-shrink: 0;
            }

            .appbar.vertical .nav-item y-button::part(right-icon) {
                margin-left: auto;
            }

            .appbar.vertical.collapsed .nav-item y-button::part(button),
            .appbar.vertical.collapsed .appbar-footer y-button::part(button) {
                min-width: 0;
            }
            .appbar.vertical.collapsed .nav-item y-button::part(label),
            .appbar.vertical.collapsed .appbar-footer y-button::part(label) {
                display: none;
            }
            .appbar.vertical.collapsed .nav-item y-button::part(right-icon),
            .appbar.vertical.collapsed .appbar-footer y-button::part(right-icon) {
                display: none;
            }

            .appbar-footer {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .appbar.horizontal .appbar-footer {
                flex-direction: row;
                align-items: center;
            }
            .appbar.vertical .appbar-footer y-button {
                display: block;
                width: 100%;
            }

            .appbar.vertical.collapsed .appbar-header,
            .appbar.vertical.collapsed .appbar-body,
            .appbar.vertical.collapsed .appbar-footer {
                align-items: center;
            }

            ::slotted(*) {
                display: block;
            }
        `;
        this.shadowRoot.appendChild(style);

        const bar = document.createElement("div");
        bar.className = `appbar ${isVertical ? "vertical" : "horizontal"}`;

        if (isCollapsed) bar.classList.add("collapsed");

        bar.setAttribute("role", "navigation");
        bar.style.setProperty("--_appbar-padding", cfg.padding);
        bar.style.setProperty("--_appbar-collapsed-width", cfg.collapsedWidth);
        bar.style.setProperty("--_appbar-body-gap", cfg.bodyGap);
        bar.style.setProperty(
            "--_icon-col-width",
            `calc(${cfg.collapsedWidth} - 2 * var(--_appbar-padding) - 2 * var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)))`,
        );

        const header = document.createElement("div");
        header.className = "appbar-header";
        header.setAttribute("part", "header");

        const headerContent = document.createElement("div");
        headerContent.className = "header-content";

        const logoWrapper = document.createElement("div");
        logoWrapper.className = "logo-wrapper";

        const logoSlot = document.createElement("slot");
        logoSlot.name = "logo";
        logoWrapper.appendChild(logoSlot);
        headerContent.appendChild(logoWrapper);

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "header-title";

        const titleSlot = document.createElement("slot");
        titleSlot.name = "title";
        titleWrapper.appendChild(titleSlot);
        headerContent.appendChild(titleWrapper);

        const headerSlot = document.createElement("slot");
        headerSlot.name = "header";
        header.appendChild(headerContent);
        header.appendChild(headerSlot);
        bar.appendChild(header);

        const body = document.createElement("div");
        body.className = "appbar-body";
        body.setAttribute("part", "body");

        const navItems = this.items;

        navItems.forEach((item) => {
            const hasChildren = item.children?.length > 0;
            const wrapper = document.createElement("div");
            const btn = document.createElement("y-button");
            const btnId = this._uid("appbar-btn");
            const isActive = this._isItemActive(item);

            wrapper.className = "nav-item";
            btn.id = btnId;

            btn.setAttribute("color", isActive ? "primary" : "base");
            btn.setAttribute("style-type", "flat");
            btn.setAttribute("size", cfg.buttonSize);

            if (item.icon) {
                if (item.icon.trim().startsWith("<")) {
                    const iconEl = document.createElement("span");
                    iconEl.slot = "left-icon";
                    iconEl.setAttribute("part", "icon");
                    iconEl.innerHTML = item.icon;
                    btn.appendChild(iconEl);
                } else {
                    const iconEl = document.createElement("y-icon");
                    iconEl.slot = "left-icon";
                    iconEl.setAttribute("part", "icon");
                    iconEl.setAttribute("name", item.icon);
                    iconEl.setAttribute("size", cfg.iconSize);
                    btn.appendChild(iconEl);
                }
            }

            if (item.text && !isCollapsed) {
                const label = document.createTextNode(item.text);
                btn.appendChild(label);
            }

            if (hasChildren && !isCollapsed) {
                const arrow = document.createElement("span");
                arrow.slot = "right-icon";
                arrow.innerHTML = isVertical ? chevronRight : chevronDown;
                btn.appendChild(arrow);
            }

            if (item.href && !hasChildren) {
                btn.addEventListener("click", () => {
                    window.location.href = item.href;
                });
            }

            if (item.slot) {
                const slot = document.createElement("slot");
                slot.name = item.slot;
                slot.appendChild(btn);
                wrapper.appendChild(slot);
            } else {
                wrapper.appendChild(btn);
            }

            if (hasChildren) {
                const menu = document.createElement("y-menu");
                menu.setAttribute("anchor", btnId);
                menu.setAttribute("direction", menuDir);
                menu.setAttribute("size", cfg.buttonSize);
                menu.items = item.children;
                wrapper.appendChild(menu);
            }

            body.appendChild(wrapper);
        });

        bar.appendChild(body);

        const footer = document.createElement("div");
        footer.className = "appbar-footer";
        footer.setAttribute("part", "footer");

        const footerSlot = document.createElement("slot");
        footerSlot.name = "footer";
        footer.appendChild(footerSlot);

        if (isVertical) {
            const collapseBtn = document.createElement("y-button");
            collapseBtn.setAttribute("color", "base");
            collapseBtn.setAttribute("style-type", "flat");
            collapseBtn.setAttribute("size", cfg.buttonSize);
            collapseBtn.setAttribute(
                "aria-label",
                isCollapsed ? "Expand sidebar" : "Collapse sidebar",
            );
            collapseBtn.className = "collapse-btn";

            const collapseIcon = document.createElement("span");
            collapseIcon.slot = "left-icon";
            collapseIcon.innerHTML = isCollapsed ? expandRight : collapseLeft;
            collapseBtn.appendChild(collapseIcon);

            if (!isCollapsed) {
                const collapseLabel = document.createTextNode("Collapse");
                collapseBtn.appendChild(collapseLabel);
            }

            collapseBtn.addEventListener("click", this._onCollapseClick);
            footer.appendChild(collapseBtn);
        }

        bar.appendChild(footer);
        this.shadowRoot.appendChild(bar);
    }
}

if (!customElements.get("y-appbar")) {
    customElements.define("y-appbar", YumeAppbar);
}
