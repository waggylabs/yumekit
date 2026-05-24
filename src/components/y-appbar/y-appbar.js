import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import "../y-menu/y-menu.js";
import {
    createElement as _el,
    buildNavItemIcon,
    isNavItemActive,
    navigateFrom,
} from "../../modules/helpers.js";

const SIZE_CONFIG = {
    small: {
        padding: "var(--spacing-x-small, 4px)",
        bodyGap: "2px",
        buttonSize: "small",
        iconSize: "small",
    },
    medium: {
        padding: "var(--spacing-small, 6px)",
        bodyGap: "3px",
        buttonSize: "medium",
        iconSize: "medium",
    },
    large: {
        padding: "var(--spacing-medium, 8px)",
        bodyGap: "4px",
        buttonSize: "large",
        iconSize: "large",
    },
};

export class YumeAppbar extends HTMLElement {
    static get observedAttributes() {
        return [
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
        this._onMediaChange = this._onMediaChange.bind(this);
        this._idCounter = 0;
        this._mql = null;
        this._isMobile = false;
        this._mobileOutsideClick = null;
        this._mobileNavigateClose = null;
    }

    connectedCallback() {
        this._setupMediaQuery();
        this.render();
    }

    disconnectedCallback() {
        this._teardownMediaQuery();
        this._teardownMobileOutsideClick();
        this._teardownMobileNavigateClose();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "mobile-breakpoint") {
            this._setupMediaQuery();
        }
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

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
        if (val === null || val === undefined) this.removeAttribute("items");
        else if (typeof val === "string") this.setAttribute("items", val);
        else this.setAttribute("items", JSON.stringify(val));
    }

    /**
     * Direction menus pop out from nav buttons: "down" (default) or "right".
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

    /** Size variant: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** Sticky position: "start" (top) | "end" (bottom) | false. */
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

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildBody(cfg, menuDir) {
        const body = _el("div", { class: "appbar-body", part: "body" });

        this.items.forEach((item) => {
            body.appendChild(this._buildNavItem(item, cfg, menuDir));
        });
        body.appendChild(_el("slot", {}));

        return body;
    }

    _buildDesktopBar(cfg, menuDir) {
        const bar = _el("div", {
            class: "appbar",
            role: "navigation",
        });

        bar.style.setProperty("--_appbar-padding", cfg.padding);
        bar.style.setProperty("--_appbar-body-gap", cfg.bodyGap);
        bar.style.setProperty(
            "--_button-padding",
            `var(--component-button-padding-${cfg.buttonSize})`,
        );

        bar.appendChild(this._buildHeader());
        bar.appendChild(this._buildBody(cfg, menuDir));
        bar.appendChild(this._buildFooter());

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
                left: 0;
                width: 100%;
                z-index: var(--component-appbar-z-index, 100);
            }
            :host([sticky="start"]) {
                top: 0;
            }
            :host([sticky="end"]) {
                bottom: 0;
            }

            :host([sticky]) .appbar {
                border-radius: 0;
                border: none;
            }
            :host([sticky="start"]) .appbar {
                border-bottom: var(--component-appbar-border-width, 2px) solid var(--component-appbar-border-color, #37383a);
            }
            :host([sticky="end"]) .appbar {
                border-top: var(--component-appbar-border-width, 2px) solid var(--component-appbar-border-color, #37383a);
            }

            .appbar {
                display: flex;
                flex-direction: row;
                align-items: center;
                background: var(--component-appbar-background, #0c0c0d);
                border: var(--component-appbar-border-width, 2px) solid var(--component-appbar-border-color, #37383a);
                border-radius: var(--component-appbar-border-radius, 4px);
                overflow: visible;
                padding: var(--_appbar-padding);
                box-sizing: border-box;
                width: 100%;
                height: auto;
            }

            .appbar-header,
            .appbar-body,
            .appbar-footer {
                flex-shrink: 0;
            }

            .appbar-body {
                flex: 1;
                overflow-y: hidden;
                overflow-x: auto;
                display: flex;
                flex-direction: row;
                gap: var(--_appbar-body-gap);
                align-items: center;
            }

            .appbar-header {
                border-right: var(--component-appbar-inner-border-width, var(--component-appbar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                padding: var(--_appbar-padding);
                padding-right: var(--spacing-x-large, 16px);
                margin-right: var(--_appbar-padding);
            }
            .appbar-footer {
                border-left: var(--component-appbar-inner-border-width, var(--component-appbar-border-width, 2px)) solid var(--component-appbar-border-color, #37383a);
                padding-left: var(--_appbar-padding);
                margin-left: var(--_appbar-padding);
                display: flex;
                flex-direction: row;
                align-items: center;
            }

            .header-content {
                display: flex;
                align-items: center;
                gap: var(--spacing-small, 8px);
                overflow: hidden;
            }
            .logo-wrapper {
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

            .nav-item {
                display: flex;
                align-items: center;
                position: relative;
            }

            ::slotted(*) {
                display: block;
            }
            ::slotted(:not([slot])) {
                display: inline-flex;
                align-items: center;
            }
            span[slot="left-icon"] svg,
            span[slot="right-icon"] svg {
                width: var(--component-icon-size-large, 1.25em);
                height: var(--component-icon-size-large, 1.25em);
            }
        `;
    }

    _buildFooter() {
        const footer = _el("div", { class: "appbar-footer", part: "footer" });
        footer.appendChild(_el("slot", { name: "footer" }));
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

    _buildMobileMenuButton(id, panelId, cfg) {
        return _el(
            "y-button",
            {
                id,
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
    }

    _buildMobilePanel(panelId, cfg) {
        const panel = _el("div", { id: panelId, class: "mobile-panel" });
        this.items.forEach((item) => {
            panel.appendChild(this._buildNavItem(item, cfg, "down"));
        });
        panel.appendChild(_el("slot", {}));
        return panel;
    }

    _buildMobileStart(cfg) {
        const menuBtnId = this._uid("appbar-mobile-menu");
        const panelId = this._uid("appbar-mobile-panel");

        const menuBtn = this._buildMobileMenuButton(menuBtnId, panelId, cfg);
        const panel = this._buildMobilePanel(panelId, cfg);
        this._wireMobileMenu(menuBtn, panel);

        return _el("div", { class: "mobile-start" }, [menuBtn, panel]);
    }

    _buildMobileStyles() {
        return `
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                color: var(--component-appbar-color, #f7f7fa);
            }

            :host([sticky]) {
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

    _buildNavItem(item, cfg, menuDir) {
        const hasChildren = item.children?.length > 0;
        const btnId = this._uid("appbar-btn");
        const isActive = isNavItemActive(item);

        const btn = _el("y-button", {
            id: btnId,
            color: isActive ? "primary" : "base",
            "style-type": "flat",
            size: cfg.buttonSize,
            "aria-current": isActive ? "page" : false,
        });

        if (item.icon) btn.appendChild(buildNavItemIcon(item.icon, cfg.iconSize));
        if (item.text) btn.append(item.text);
        if (hasChildren) {
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
        this._teardownMobileNavigateClose();
        this.shadowRoot.innerHTML = "";
        this._idCounter = 0;
    }

    _onMediaChange(e) {
        this._isMobile = e.matches;
        this.render();
    }

    _renderDesktop() {
        this._initRender();

        const cfg = SIZE_CONFIG[this.size] || SIZE_CONFIG.medium;
        const menuDir = this.menuDirection || "down";

        const style = _el("style", {}, [this._buildDesktopStyles()]);
        const bar = this._buildDesktopBar(cfg, menuDir);

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

    _teardownMobileNavigateClose() {
        if (!this._mobileNavigateClose) return;
        this.removeEventListener("navigate", this._mobileNavigateClose);
        this._mobileNavigateClose = null;
    }

    _uid(prefix) {
        return `${prefix}-${this._idCounter++}`;
    }

    _wireMobileMenu(menuBtn, panel) {
        const closePanel = () => {
            panel.classList.remove("open");
            menuBtn.setAttribute("aria-expanded", "false");
        };

        menuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const open = panel.classList.toggle("open");
            menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
        });

        // navigateFrom dispatches "navigate" from the host, so the listener
        // must live on the host — not on a descendant of the panel.
        this._mobileNavigateClose = closePanel;
        this.addEventListener("navigate", this._mobileNavigateClose);

        this._mobileOutsideClick = (e) => {
            if (e.composedPath().includes(this)) return;
            closePanel();
        };
        document.addEventListener("pointerdown", this._mobileOutsideClick);
    }
}

if (!customElements.get("y-appbar")) {
    customElements.define("y-appbar", YumeAppbar);
}
