import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-menu/y-menu.js";
import { createElement as _el } from "../../modules/helpers.js";

const SIZE_CONFIG = {
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
        this._onMediaChange = this._onMediaChange.bind(this);
        this._idCounter = 0;
        this._mql = null;
        this._isMobile = false;
        this._mobileOutsideClick = null;
    }

    connectedCallback() {
        this._setupMediaQuery();
        this.render();
    }

    disconnectedCallback() {
        this._teardownMediaQuery();
        this._teardownMobileOutsideClick();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "mobile-breakpoint" || name === "orientation") {
            this._setupMediaQuery();
        }
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Whether the sidebar is currently collapsed. */
    get collapsed() {
        return this.hasAttribute("collapsed");
    }
    set collapsed(val) {
        if (val) this.setAttribute("collapsed", "");
        else this.removeAttribute("collapsed");
    }

    /**
     * Navigation mode: omit for pushState (SPA-friendly), set to "false" for full-page navigation.
     * Regardless of this setting, a cancelable "navigate" event is always dispatched first.
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
        this.setAttribute("items", JSON.stringify(val));
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

    /** Whether the appbar is currently rendering in mobile mode. */
    get mobile() {
        return this._isMobile;
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

    /** Layout orientation: "vertical" | "horizontal" (default "vertical"). */
    get orientation() {
        return this.getAttribute("orientation") || "vertical";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** Size variant: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Sticky position: "start" | "end" | false. */
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
        if (this._isMobile) this._renderMobile();
        else this._renderDesktop();
    }

    /** Toggles the collapsed state of the sidebar. */
    toggle() {
        this.collapsed = !this.collapsed;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildBody(cfg, isCollapsed, menuDir) {
        const body = _el("div", { class: "appbar-body", part: "body" });

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
                "style-type": "flat",
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

    _buildDesktopBar(cfg, isVertical, isCollapsed, menuDir) {
        const classes = ["appbar", isVertical ? "vertical" : "horizontal"];
        if (isCollapsed) classes.push("collapsed");

        const bar = _el("div", {
            class: classes.join(" "),
            role: "navigation",
        });

        // Layout-specific sizing tokens consumed by the stylesheet.
        const iconColWidth = `calc(${cfg.collapsedWidth} - 2 * var(--_appbar-padding) - 2 * var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) - 2 * var(--component-button-border-width, 1px))`;
        bar.style.setProperty("--_appbar-padding", cfg.padding);
        bar.style.setProperty("--_appbar-collapsed-width", cfg.collapsedWidth);
        bar.style.setProperty("--_appbar-body-gap", cfg.bodyGap);
        bar.style.setProperty(
            "--_button-padding",
            `var(--component-button-padding-${cfg.buttonSize})`,
        );
        bar.style.setProperty("--_icon-col-width", iconColWidth);

        bar.appendChild(this._buildHeader());
        bar.appendChild(this._buildBody(cfg, isCollapsed, menuDir));
        bar.appendChild(this._buildFooter(cfg, isVertical, isCollapsed));

        return bar;
    }

    _buildDesktopStyles() {
        return `
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
                padding-bottom: var(--_appbar-padding);
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
            .appbar.vertical .header-content {
                padding: var(--_button-padding) 0;
                gap: var(--_button-padding);
            }
            .logo-wrapper {
                width: var(--_icon-col-width);
                display: flex;
                justify-content: center;
                align-items: center;
                flex-shrink: 0;
            }
            .appbar.vertical .logo-wrapper {
                margin-left: var(--component-button-border-width, 2px);
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
            .appbar.vertical ::slotted(:not([slot])) {
                width: 100%;
            }
            .appbar.horizontal ::slotted(:not([slot])) {
                display: inline-flex;
                align-items: center;
            }
            .appbar.vertical.collapsed ::slotted(:not([slot])) {
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

    _buildFooter(cfg, isVertical, isCollapsed) {
        const footer = _el("div", { class: "appbar-footer", part: "footer" });
        footer.appendChild(_el("slot", { name: "footer" }));

        if (isVertical) {
            footer.appendChild(this._buildCollapseButton(cfg, isCollapsed));
        }

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

        return _el("div", { class: "appbar-header", part: "header" }, [
            headerContent,
            _el("slot", { name: "header" }),
        ]);
    }

    _buildItemIcon(iconValue, cfg) {
        // Raw SVG markup is preserved as a public escape hatch; everything else
        // routes through y-icon for consistent sizing/theming.
        if (iconValue.trim().startsWith("<")) {
            const span = _el("span", { slot: "left-icon", part: "icon" });
            span.innerHTML = iconValue;
            return span;
        }
        return _el("y-icon", {
            slot: "left-icon",
            part: "icon",
            name: iconValue,
            size: cfg.iconSize,
        });
    }

    _buildMobileBar(cfg) {
        const bar = _el("div", { class: "appbar", role: "navigation" });
        bar.style.setProperty("--_appbar-padding", cfg.padding);

        bar.appendChild(this._buildMobileStart(cfg));
        bar.appendChild(this._buildMobileCenter());
        bar.appendChild(this._buildMobileEnd());

        return bar;
    }

    _buildMobileCenter() {
        return _el("div", { class: "mobile-center" }, [
            _el("slot", { name: "logo" }),
            _el("slot", { name: "title" }),
        ]);
    }

    _buildMobileEnd() {
        return _el("div", { class: "mobile-end", part: "footer" }, [
            _el("slot", { name: "footer" }),
        ]);
    }

    _buildMobileStart(cfg) {
        const menuBtnId = this._uid("appbar-mobile-menu");
        const panelId = this._uid("appbar-mobile-panel");

        const menuBtn = _el(
            "y-button",
            {
                id: menuBtnId,
                color: "base",
                "style-type": "flat",
                size: cfg.buttonSize,
                "aria-label": "Open menu",
                "aria-controls": panelId,
                "aria-expanded": "false",
            },
            [
                _el("y-icon", {
                    slot: "left-icon",
                    name: "menu",
                    size: cfg.iconSize,
                }),
            ],
        );

        const panel = _el("div", { id: panelId, class: "mobile-panel" });
        this.items.forEach((item) => {
            panel.appendChild(this._buildNavItem(item, cfg, false, "down"));
        });
        panel.appendChild(_el("slot", {}));

        const closePanel = () => {
            panel.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        };

        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const open = panel.classList.toggle("open");
            menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        });

        panel.addEventListener("navigate", closePanel);

        this._mobileOutsideClick = (e) => {
            if (e.composedPath().includes(this)) return;
            closePanel();
        };
        document.addEventListener("pointerdown", this._mobileOutsideClick);

        return _el("div", { class: "mobile-start" }, [menuBtn, panel]);
    }

    _buildMobileStyles() {
        return `
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
                position: relative;
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

            .mobile-panel {
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 4px;
                background: var(--component-appbar-background, #0c0c0d);
                border: var(--component-appbar-border-width, var(--component-sidebar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                border-radius: var(--component-appbar-border-radius, var(--component-sidebar-border-radius, 4px));
                padding: var(--_appbar-padding);
                display: none;
                flex-direction: column;
                gap: 2px;
                min-width: 180px;
                z-index: var(--component-appbar-z-index, 100);
            }
            .mobile-panel.open {
                display: flex;
            }
            .mobile-panel .nav-item {
                display: flex;
                width: 100%;
            }
            .mobile-panel .nav-item y-button {
                display: block;
                width: 100%;
            }
            .mobile-panel .nav-item y-button::part(button) {
                width: 100%;
                justify-content: flex-start;
            }
            .mobile-panel ::slotted(:not([slot])) {
                width: 100%;
            }

            ::slotted(*) {
                display: block;
            }
            span[slot="left-icon"] svg,
            span[slot="right-icon"] svg {
                width: var(--component-icon-size-large, 1.25em);
                height: var(--component-icon-size-large, 1.25em);
            }
        `;
    }

    _buildNavItem(item, cfg, isCollapsed, menuDir) {
        const hasChildren = item.children?.length > 0;
        const showLabel = item.text && !isCollapsed;
        const showArrow = hasChildren && !isCollapsed;
        const btnId = this._uid("appbar-btn");

        const btn = _el("y-button", {
            id: btnId,
            color: this._isItemActive(item) ? "primary" : "base",
            "style-type": "flat",
            size: cfg.buttonSize,
        });

        if (item.icon) btn.appendChild(this._buildItemIcon(item.icon, cfg));
        if (showLabel) btn.appendChild(document.createTextNode(item.text));
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
            btn.addEventListener("click", () => this._navigateTo(item.href));
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
            });
            menuEl.items = item.children;
            wrapper.appendChild(menuEl);
        }

        return wrapper;
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

    _initRender() {
        this._teardownMobileOutsideClick();
        this.shadowRoot.innerHTML = "";
        this._idCounter = 0;
    }

    _isItemActive(item) {
        if (item.selected) return true;
        if (!item.href) return false;

        const loc = window.location;
        const current = loc.pathname + loc.search + loc.hash;

        return item.href === current || item.href === loc.href;
    }

    _navigateTo(href) {
        const event = new CustomEvent("navigate", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { href },
        });
        if (!this.dispatchEvent(event)) return;

        if (this.getAttribute("history") === "false") {
            window.location.href = href;
        } else {
            history.pushState({}, "", href);
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
        }
    }

    _onCollapseClick() {
        this.toggle();
    }

    _onMediaChange(e) {
        this._isMobile = e.matches;
        this.render();
    }

    _renderDesktop() {
        this._initRender();

        const isVertical = this.orientation === "vertical";
        const isCollapsed = this.collapsed && isVertical;
        const cfg = SIZE_CONFIG[this.size] || SIZE_CONFIG.medium;
        const menuDir = this.menuDirection || (isVertical ? "right" : "down");

        const style = _el("style", {}, [this._buildDesktopStyles()]);
        const bar = this._buildDesktopBar(
            cfg,
            isVertical,
            isCollapsed,
            menuDir,
        );

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(bar);
    }

    _renderMobile() {
        this._initRender();
        const cfg = SIZE_CONFIG[this.size] || SIZE_CONFIG.medium;

        const style = _el("style", {}, [this._buildMobileStyles()]);
        const bar = this._buildMobileBar(cfg);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(bar);
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
        if (!this._mql) return;
        this._mql.removeEventListener("change", this._onMediaChange);
        this._mql = null;
    }

    _teardownMobileOutsideClick() {
        if (!this._mobileOutsideClick) return;
        document.removeEventListener("pointerdown", this._mobileOutsideClick);
        this._mobileOutsideClick = null;
    }

    _uid(prefix) {
        return `${prefix}-${this._idCounter++}`;
    }
}

if (!customElements.get("y-appbar")) {
    customElements.define("y-appbar", YumeAppbar);
}
