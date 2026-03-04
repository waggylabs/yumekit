import { chevronDownLg } from "../icons/index.js";

export class YumePanel extends HTMLElement {
    static get observedAttributes() {
        return ["selected", "expanded", "href", "history"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._expanded = false;
        this._checkRouteMatchBound = this.checkRouteMatch.bind(this);
        this.render();
    }

    connectedCallback() {
        this.addHeaderListeners();
        this.checkForChildren();
        this.updateChildState();
        this.updateSelectedState();
        this.updateExpandedState();

        if (this.hasAttribute("href")) {
            this.checkRouteMatch();
            window.addEventListener("popstate", this._checkRouteMatchBound);
        }
    }

    disconnectedCallback() {
        if (this.hasAttribute("href")) {
            window.removeEventListener("popstate", this._checkRouteMatchBound);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "selected") {
            this.updateSelectedState();
        }

        if (name === "expanded") {
            this.updateExpandedState();
        }

        if (name === "href") {
            this.checkRouteMatch();
        }
    }

    get selected() {
        return this.hasAttribute("selected");
    }

    set selected(val) {
        if (val) this.setAttribute("selected", "");
        else this.removeAttribute("selected");
    }

    get expanded() {
        return this.hasAttribute("expanded");
    }

    set expanded(val) {
        if (val) this.setAttribute("expanded", "");
        else this.removeAttribute("expanded");
    }

    toggle() {
        if (!this.hasChildren()) return;
        if (!this._expanded) {
            const parentBar = this.closest("y-panelbar");
            if (parentBar && parentBar.hasAttribute("exclusive")) {
                const parent = this.parentElement;
                const siblingPanels = parent
                    ? Array.from(parent.children).filter(
                          (el) => el.tagName === "Y-PANEL",
                      )
                    : [];
                siblingPanels.forEach((panel) => {
                    if (panel !== this && panel.expanded) {
                        panel.collapse();
                    }
                });
            }
            this.expand();
        } else {
            this.collapse();
        }
        this.dispatchEvent(
            new CustomEvent("toggle", {
                detail: { expanded: this._expanded },
                bubbles: true,
                composed: true,
            }),
        );
    }

    expand() {
        if (!this.hasChildren()) return;
        this.expanded = true;
        this._expanded = true;
        this.updateExpandedState();
        this.dispatchEvent(
            new CustomEvent("expand", {
                detail: { expanded: true },
                bubbles: true,
                composed: true,
            }),
        );
    }

    collapse() {
        this.expanded = false;
        this._expanded = false;
        this.updateExpandedState();
        this.dispatchEvent(
            new CustomEvent("collapse", {
                detail: { expanded: false },
                bubbles: true,
                composed: true,
            }),
        );
    }

    updateSelectedState() {
        this.classList.toggle("selected", this.selected);
    }

    updateChildState() {
        let depth = 0;
        let el = this.parentElement;
        while (el) {
            const parent = el.closest("y-panel");
            if (parent && parent !== this) {
                depth++;
                el = parent.parentElement;
            } else {
                break;
            }
        }
        this.setAttribute("data-is-child", depth > 0 ? "true" : "false");
        this.style.setProperty("--panel-depth", depth);
    }

    checkRouteMatch() {
        const href = this.getAttribute("href");
        if (href && window.location.pathname === href) {
            this.selected = true;
        } else {
            this.selected = false;
        }
    }

    addHeaderListeners() {
        const header = this.shadowRoot.querySelector(".header");
        if (!header) return;

        header.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.hasAttribute("href")) {
                const href = this.getAttribute("href");
                if (this.getAttribute("history") !== "false") {
                    history.pushState({}, "", href);
                    window.dispatchEvent(
                        new PopStateEvent("popstate", { state: {} }),
                    );
                } else {
                    window.location.href = href;
                }
                return;
            }

            if (this.hasChildren()) {
                this.toggle();
            } else {
                this.dispatchEvent(
                    new CustomEvent("select", {
                        detail: { selected: true },
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
        });

        header.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                header.click();
            }
        });

        const childrenSlot = this.shadowRoot.querySelector(
            'slot[name="children"]',
        );
        if (childrenSlot) {
            childrenSlot.addEventListener("slotchange", () =>
                this.checkForChildren(),
            );
        }
    }

    hasChildren() {
        const childrenSlot = this.shadowRoot.querySelector(
            'slot[name="children"]',
        );
        if (!childrenSlot) return false;
        const nodes = childrenSlot.assignedNodes({ flatten: true });
        return nodes.some((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
                return n.textContent.trim() !== "";
            }
            return true;
        });
    }

    checkForChildren() {
        const hasChildren = this.hasChildren();
        this.setAttribute("data-has-children", hasChildren ? "true" : "false");
        if (!hasChildren && this.expanded) {
            this.expanded = false;
        }
    }

    updateExpandedState() {
        const hasChildren = this.hasChildren();
        const header = this.shadowRoot.querySelector(".header");
        const isExpanded = this.expanded && hasChildren;
        this._expanded = isExpanded;

        if (header) {
            header.setAttribute("aria-expanded", String(isExpanded));
        }
    }

    render() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
                background: var(--component-panel-background);
                color: var(--component-panel-color);
                font-family: var(--font-family-body);
                overflow: hidden;
            }

            :host([expanded]) {
                background: var(--component-panel-expanded-background);
            }

            :host([selected]) {
                color: var(--component-panel-accent);
            }

            :host([data-is-child="true"]) {
                box-shadow: inset var(--component-panelbar-border-width, 2px) 0 0 0 var(--component-panel-active-border);
            }

            :host([data-is-child="true"][selected]) {
                box-shadow: inset var(--component-panelbar-border-width, 2px) 0 0 0 var(--component-panel-accent);
            }

            :host([selected]) .header:hover {
                background: var(--component-panel-accent-hover-background);
            }

            :host([data-is-child="true"]) .header {
                padding-left: calc(var(--component-panelbar-padding, 4px) + (var(--panel-depth, 1) * var(--component-panelbar-indent, 16px)));
            }

            .header {
                display: flex;
                align-items: center;
                gap: var(--spacing-medium, 8px);
                padding: var(--component-panelbar-padding, 4px);
                cursor: pointer;
                transition: background 0.2s ease;
                user-select: none;
            }

            .header:hover {
                background: var(--component-panel-hover-background);
            }

            :host([data-has-children="false"]) .header {
                cursor: default;
            }

            .header ::slotted([slot="icon"]) {
                margin-right: 6px;
            }

            .header ::slotted([slot="label"]) {
                flex-grow: 1;
                cursor: inherit;
                font-size: 1rem;
                line-height: 1.2;
            }

            .arrow {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 20px;
                height: 20px;
                transition: transform 0.2s ease;
            }

            :host([expanded]) .arrow {
                transform: rotate(180deg);
            }

            .children {
                display: none;
                padding: 0;
                width: 100%;
                box-sizing: border-box;
            }

            .children ::slotted(y-panel) {
                width: 100%;
                box-sizing: border-box;
            }

            :host([expanded]) .children {
                display: block;
            }

            :host([data-has-children="false"]) .arrow {
                visibility: hidden;
            }
        `);

        this.shadowRoot.adoptedStyleSheets = [sheet];
        this.shadowRoot.innerHTML = `
            <div class="header" part="header" role="button" tabindex="0" aria-expanded="false">
                <slot name="icon"></slot>
                <slot name="label"><slot></slot></slot>
                <span class="arrow" id="arrow" part="arrow">
                    ${chevronDownLg}
                </span>
            </div>
            <div class="children" id="childrenContainer" part="children">
                <slot name="children"></slot>
            </div>
        `;
    }
}

if (!customElements.get("y-panel")) {
    customElements.define("y-panel", YumePanel);
}
