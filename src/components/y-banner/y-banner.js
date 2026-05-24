import "../y-button/y-button.js";
import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";

export class YumeBanner extends HTMLElement {
    static get observedAttributes() {
        return [
            "color",
            "icon",
            "position",
            "sticky",
            "dismissable",
            "dismissed",
            "size",
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
        this.render();
        this._bindSlotListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === "dismissed") {
            this._applyDismissedState();
            return;
        }
        this.render();
        this._bindSlotListeners();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Semantic color for the banner background. */
    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** Icon name passed to an internal y-icon. */
    get icon() {
        return this.getAttribute("icon") || "";
    }
    set icon(val) {
        if (val) this.setAttribute("icon", val);
        else this.removeAttribute("icon");
    }

    /** Position mode: "push" (in-flow) or "overlap" (over content). */
    get position() {
        return this.getAttribute("position") || "push";
    }
    set position(val) {
        this.setAttribute("position", val);
    }

    /** When true with position="overlap", fixes to viewport top on scroll. */
    get sticky() {
        return this.hasAttribute("sticky");
    }
    set sticky(val) {
        if (val) this.setAttribute("sticky", "");
        else this.removeAttribute("sticky");
    }

    /** Whether the banner shows a close button. */
    get dismissable() {
        return this.hasAttribute("dismissable");
    }
    set dismissable(val) {
        if (val) this.setAttribute("dismissable", "");
        else this.removeAttribute("dismissable");
    }

    /** Whether the banner is currently dismissed (hidden). */
    get dismissed() {
        return this.hasAttribute("dismissed");
    }
    set dismissed(val) {
        if (val) this.setAttribute("dismissed", "");
        else this.removeAttribute("dismissed");
    }

    /** Controls padding, icon size, and font size. */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Hides the banner and fires the dismiss event. */
    dismiss() {
        const event = new CustomEvent("dismiss", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        if (this.dispatchEvent(event)) {
            this.dismissed = true;
        }
    }

    /** Shows the banner if it is currently dismissed. */
    show() {
        this.dismissed = false;
    }

    render() {
        const color = this.color;
        const size = this.size;
        const iconSize = this._getIconSize(size);

        this.shadowRoot.adoptedStyleSheets = [
            this._buildStyleSheet(color, size),
        ];
        this.shadowRoot.replaceChildren(this._buildBanner(color, size, iconSize));

        if (this.dismissable) {
            this.shadowRoot
                .querySelector(".close-btn")
                .addEventListener("click", () => this.dismiss());
        }

        this._applyDismissedState();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _applyDismissedState() {
        if (this.dismissed) {
            this.setAttribute("hidden", "");
        } else {
            this.removeAttribute("hidden");
        }
    }

    _bindSlotListeners() {
        const iconSlot = this.shadowRoot.querySelector("slot[name='icon']");
        const actionSlot = this.shadowRoot.querySelector("slot[name='action']");

        if (iconSlot) {
            iconSlot.addEventListener("slotchange", () =>
                this._updateSlotVisibility(),
            );
        }
        if (actionSlot) {
            actionSlot.addEventListener("slotchange", () =>
                this._updateSlotVisibility(),
            );
        }

        this._updateSlotVisibility();
    }

    _buildBanner(color, size, iconSize) {
        const iconAttr = this.icon;

        const iconSlot = _el("slot", { name: "icon" });
        if (iconAttr) {
            iconSlot.appendChild(
                _el("y-icon", { name: iconAttr, size: iconSize }),
            );
        }

        const children = [
            _el("span", { class: "icon-wrapper", part: "icon" }, [iconSlot]),
            _el("span", { class: "content", part: "content" }, [_el("slot")]),
            _el("span", { class: "action-wrapper", part: "action" }, [
                _el("slot", { name: "action" }),
            ]),
        ];

        if (this.dismissable) {
            const closeBtn = _el(
                "y-button",
                {
                    class: "close-btn",
                    part: "close-btn",
                    "aria-label": "Dismiss banner",
                    color,
                    "style-type": "filled",
                    size,
                },
                [_el("y-icon", { name: "x", size: iconSize })],
            );
            children.push(closeBtn);
        }

        return _el(
            "div",
            {
                class: "banner",
                part: "banner",
                role: "region",
                "aria-label": this._getAriaLabel(color),
            },
            children,
        );
    }

    _buildStyleSheet(color, size) {
        const [bgVar, fgVar] = this._getColorVars(color);
        const position = this.position;
        const isOverlap = position === "overlap";
        const isSticky = this.sticky;

        const sizeConfig = {
            small: {
                padding:
                    "var(--component-banner-padding-small, var(--spacing-x-small) var(--spacing-medium))",
                fontSize: "var(--font-size-small, 0.8em)",
                iconSize: "var(--component-banner-icon-size-small, 14px)",
            },
            medium: {
                padding:
                    "var(--component-banner-padding-medium, var(--spacing-medium) var(--spacing-x-large))",
                fontSize: "var(--font-size-label, 0.83em)",
                iconSize: "var(--component-banner-icon-size-medium, 18px)",
            },
            large: {
                padding:
                    "var(--component-banner-padding-large, var(--spacing-large) var(--spacing-2x-large))",
                fontSize: "var(--font-size-paragraph, 1em)",
                iconSize: "var(--component-banner-icon-size-large, 22px)",
            },
        };
        const cfg = sizeConfig[size] || sizeConfig.medium;

        let positionCSS = "";
        if (isOverlap && isSticky) {
            positionCSS = `
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: var(--component-banner-z-index, 200);
                }
            `;
        } else if (isOverlap) {
            positionCSS = `
                :host {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: var(--component-banner-z-index, 200);
                }
            `;
        }

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                font-weight: var(--font-weight-body, 300);
            }

            :host([hidden]) {
                display: none !important;
            }

            ${positionCSS}

            .banner {
                display: flex;
                align-items: center;
                gap: var(--component-banner-gap, var(--spacing-medium, 8px));
                padding: ${cfg.padding};
                background: var(${bgVar});
                color: var(${fgVar});
                font-size: ${cfg.fontSize};
                line-height: 1.4;
                border-radius: var(--component-banner-border-radius, 0);
                box-sizing: border-box;
                width: 100%;
            }

            .icon-wrapper {
                display: flex;
                align-items: center;
                flex-shrink: 0;
                color: inherit;
            }

            .icon-wrapper y-icon {
                color: inherit;
                --component-icon-size-small: ${cfg.iconSize};
                --component-icon-size-medium: ${cfg.iconSize};
                --component-icon-size-large: ${cfg.iconSize};
            }

            .content {
                flex: 1;
                min-width: 0;
            }

            .action-wrapper {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }
        `);
        return sheet;
    }

    _getAriaLabel(color) {
        const labels = {
            base: "Banner",
            primary: "Information banner",
            secondary: "Information banner",
            success: "Success banner",
            error: "Error banner",
            warning: "Warning banner",
            help: "Help banner",
        };
        return labels[color] || "Banner";
    }

    _getColorVars(color) {
        const map = {
            base: ["--base-content--", "--base-content-inverse"],
            primary: ["--primary-content--", "--primary-content-inverse"],
            secondary: ["--secondary-content--", "--secondary-content-inverse"],
            success: ["--success-content--", "--success-content-inverse"],
            error: ["--error-content--", "--error-content-inverse"],
            warning: ["--warning-content--", "--warning-content-inverse"],
            help: ["--help-content--", "--help-content-inverse"],
        };
        return map[color] || map.base;
    }

    _getIconSize(size) {
        const map = { small: "small", medium: "medium", large: "large" };
        return map[size] || "medium";
    }

    _updateSlotVisibility() {
        const iconSlot = this.shadowRoot.querySelector("slot[name='icon']");
        const actionSlot = this.shadowRoot.querySelector("slot[name='action']");
        const iconWrapper = this.shadowRoot.querySelector(".icon-wrapper");
        const actionWrapper = this.shadowRoot.querySelector(".action-wrapper");

        if (iconSlot && iconWrapper) {
            const hasSlotted = iconSlot
                .assignedNodes({ flatten: true })
                .some(
                    (n) =>
                        !(
                            n.nodeType === Node.TEXT_NODE &&
                            n.textContent.trim() === ""
                        ),
                );
            const hasIconAttr = !!this.icon;
            iconWrapper.style.display = hasSlotted || hasIconAttr ? "" : "none";
        }

        if (actionSlot && actionWrapper) {
            const hasSlotted = actionSlot
                .assignedNodes({ flatten: true })
                .some(
                    (n) =>
                        !(
                            n.nodeType === Node.TEXT_NODE &&
                            n.textContent.trim() === ""
                        ),
                );
            actionWrapper.style.display = hasSlotted ? "" : "none";
        }
    }
}

if (!customElements.get("y-banner")) {
    customElements.define("y-banner", YumeBanner);
}
