import { chevronDown } from "../../icons/index.js";

export class YumePanel extends HTMLElement {
    static get observedAttributes() {
        return ["selected", "expanded", "href", "history"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._expanded = false;
        this._checkRouteMatchBound = this._checkRouteMatch.bind(this);
        this.render();
    }

    connectedCallback() {
        this._addHeaderListeners();
        this._checkForChildren();
        this._updateChildState();
        this._updateSelectedState();
        this._updateExpandedState();

        if (this.hasAttribute("href")) {
            this._checkRouteMatch();
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
        if (name === "selected") this._updateSelectedState();
        if (name === "expanded") this._updateExpandedState();
        if (name === "href") this._checkRouteMatch();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the panel's children slot is visible. */
    get expanded() { return this.hasAttribute("expanded"); }
    set expanded(val) {
        if (val) this.setAttribute("expanded", "");
        else this.removeAttribute("expanded");
    }

    /** @type {boolean} Whether the panel is in a selected/active state. */
    get selected() { return this.hasAttribute("selected"); }
    set selected(val) {
        if (val) this.setAttribute("selected", "");
        else this.removeAttribute("selected");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Collapses the panel to hide its children. */
    collapse() {
        this.expanded = false;
        this._expanded = false;
        this._updateExpandedState();
        this.dispatchEvent(new CustomEvent("collapse", {
            detail: { expanded: false },
            bubbles: true,
            composed: true,
        }));
    }

    /** Expands the panel to show its children. */
    expand() {
        if (!this._hasChildren()) return;
        this.expanded = true;
        this._expanded = true;
        this._updateExpandedState();
        this.dispatchEvent(new CustomEvent("expand", {
            detail: { expanded: true },
            bubbles: true,
            composed: true,
        }));
    }

    /** Rebuilds the shadow DOM. */
    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.innerHTML = `
            <div class="header" part="header" role="button" tabindex="0">
                <slot name="icon"></slot>
                <slot name="label"><slot></slot></slot>
                <button class="arrow" id="arrow" part="arrow" tabindex="0" aria-expanded="false" aria-label="Toggle children">
                    ${chevronDown}
                </button>
            </div>
            <div class="children" id="childrenContainer" part="children">
                <slot name="children"></slot>
            </div>
        `;
    }

    /** Toggles the expanded state (collapses siblings when inside an exclusive panelbar). */
    toggle() {
        if (!this._hasChildren()) return;

        if (!this._expanded) {
            this._collapseExclusiveSiblings();
            this.expand();
        } else {
            this.collapse();
        }

        this.dispatchEvent(new CustomEvent("toggle", {
            detail: { expanded: this._expanded },
            bubbles: true,
            composed: true,
        }));
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _addArrowListeners() {
        const arrow = this.shadowRoot.querySelector(".arrow");
        if (!arrow) return;

        arrow.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggle();
        });
        arrow.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    _addChildrenSlotListener() {
        const slot = this.shadowRoot.querySelector('slot[name="children"]');
        if (slot) slot.addEventListener("slotchange", () => this._checkForChildren());
    }

    _addHeaderListeners() {
        const header = this.shadowRoot.querySelector(".header");
        if (!header) return;

        header.addEventListener("click", (e) => this._handleHeaderClick(e));
        header.addEventListener("keydown", (e) => {
            if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                header.click();
            }
        });

        this._addArrowListeners();
        this._addChildrenSlotListener();
    }

    _buildStyleSheet() {
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
                transition: transform 0.2s ease;
                background: none;
                border: none;
                padding: 0;
                cursor: pointer;
                color: inherit;
                flex-shrink: 0;
            }

            .arrow:focus-visible {
                outline: 2px solid var(--component-panel-accent, currentColor);
                border-radius: 2px;
            }

            .arrow svg {
                width: 20px;
                height: 20px;
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
        return sheet;
    }

    _calcNestingDepth() {
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
        return depth;
    }

    _checkForChildren() {
        const hasChildren = this._hasChildren();
        this.setAttribute("data-has-children", hasChildren ? "true" : "false");
        if (!hasChildren && this.expanded) this.expanded = false;
    }

    _checkRouteMatch() {
        const href = this.getAttribute("href");
        this.selected = !!(href && window.location.pathname === href);
    }

    _collapseExclusiveSiblings() {
        const parentBar = this.closest("y-panelbar");
        if (!parentBar?.hasAttribute("exclusive")) return;
        const siblings = this.parentElement
            ? Array.from(this.parentElement.children).filter((el) => el.tagName === "Y-PANEL")
            : [];
        siblings.forEach((panel) => {
            if (panel !== this && panel.expanded) panel.collapse();
        });
    }

    _handleHeaderClick(e) {
        e.stopPropagation();
        if (this.hasAttribute("href")) {
            this._navigateToHref();
            return;
        }
        this.dispatchEvent(new CustomEvent("select", {
            detail: { selected: true },
            bubbles: true,
            composed: true,
        }));
    }

    _hasChildren() {
        const slot = this.shadowRoot.querySelector('slot[name="children"]');
        if (!slot) return false;
        return slot.assignedNodes({ flatten: true }).some((n) => {
            if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim() !== "";
            return true;
        });
    }

    _navigateToHref() {
        const href = this.getAttribute("href");
        if (this.getAttribute("history") !== "false") {
            history.pushState({}, "", href);
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
        } else {
            window.location.href = href;
        }
    }

    _updateChildState() {
        const depth = this._calcNestingDepth();
        this.setAttribute("data-is-child", depth > 0 ? "true" : "false");
        this.style.setProperty("--panel-depth", depth);
    }

    _updateExpandedState() {
        const hasChildren = this._hasChildren();
        const isExpanded = this.expanded && hasChildren;
        this._expanded = isExpanded;

        const arrow = this.shadowRoot.querySelector(".arrow");
        if (arrow) arrow.setAttribute("aria-expanded", String(isExpanded));
    }

    _updateSelectedState() {
        this.classList.toggle("selected", this.selected);
    }
}

if (!customElements.get("y-panel")) {
    customElements.define("y-panel", YumePanel);
}
