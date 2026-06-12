import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";

export class YumeTabs extends HTMLElement {
    static get observedAttributes() {
        return ["options", "size", "position", "variant"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._activeTab = "";
        this._warnedSlots = new Set();
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("position"))
            this.setAttribute("position", "top");
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "options") this._warnedSlots.clear();
        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {Array<Object>} Tab definitions. Each object: `{ id, label, slot, disabled?, leftIcon?, rightIcon? }`. `leftIcon`/`rightIcon` are `y-icon` names rendered inside the tab button. Use the `tab-content-{id}` slot to supply fully custom tab button content instead. */
    get options() {
        try {
            return JSON.parse(this.getAttribute("options") || "[]");
        } catch {
            return [];
        }
    }
    set options(val) {
        if (val === null || val === undefined) this.removeAttribute("options");
        else if (typeof val === "string") this.setAttribute("options", val);
        else this.setAttribute("options", JSON.stringify(val));
        this.render();
    }

    /** @type {"top"|"bottom"|"left"|"right"} Which edge the tab strip is placed on. */
    get position() {
        const pos = this.getAttribute("position");
        return ["top", "bottom", "left", "right"].includes(pos) ? pos : "top";
    }
    set position(val) {
        this.setAttribute(
            "position",
            ["top", "bottom", "left", "right"].includes(val) ? val : "top",
        );
    }

    /**
     * @type {"default"|"accent"} Visual style. `"default"` renders bordered,
     * boxed tabs; `"accent"` renders minimal tabs with a primary-colored
     * indicator border on the active tab's content-facing edge.
     */
    get variant() {
        return this.getAttribute("variant") === "accent" ? "accent" : "default";
    }
    set variant(val) {
        this.setAttribute("variant", val === "accent" ? "accent" : "default");
    }

    /** @type {"small"|"medium"|"large"} Controls tab button padding and gap. */
    get size() {
        const sz = this.getAttribute("size");
        return ["small", "medium", "large"].includes(sz) ? sz : "medium";
    }
    set size(val) {
        this.setAttribute(
            "size",
            ["small", "medium", "large"].includes(val) ? val : "medium",
        );
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Activates a tab by its id.
     * @param {string} id - The id of the tab to activate.
     */
    activateTab(id) {
        const tab = this.options.find((t) => t.id === id);
        if (!tab || tab.disabled) return;
        if (this._activeTab === id) return;
        this._activeTab = id;
        this.render();
    }

    render() {
        const tabs = this.options;
        this._resolveActiveTab(tabs);

        const activeDef = tabs.find((t) => t.id === this._activeTab);

        this.shadowRoot.innerHTML = "";

        const style = document.createElement("style");
        style.textContent = this._getStyles();
        this.shadowRoot.appendChild(style);

        const tablist = _el("div", {
            class: "tablist",
            role: "tablist",
            part: "tablist",
        });
        tabs.forEach((tab) => tablist.appendChild(this._createTabButton(tab)));
        this.shadowRoot.appendChild(tablist);

        this.shadowRoot.appendChild(this._createPanel(activeDef?.slot || ""));

        this._setupEvents();
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _appendDeprecatedIconSlot(parent, side, tabId) {
        const slotName = `${side}-icon-${tabId}`;

        if (!this.querySelector(`[slot="${slotName}"]`)) return;

        if (!this._warnedSlots.has(slotName)) {
            this._warnedSlots.add(slotName);
            // eslint-disable-next-line no-console
            console.warn(
                `[y-tabs] The "${slotName}" slot is deprecated. ` +
                    `Use the ${side}Icon property on the tab options object instead, ` +
                    `or use the "tab-content-${tabId}" slot for custom content.`,
            );
        }

        parent.appendChild(_el("slot", { name: slotName, class: "icon-slot" }));
    }

    _createIcon(name) {
        return _el("y-icon", { name, size: this.size });
    }

    _createPanel(slotName) {
        const panel = _el("div", {
            class: "tabpanel",
            id: `panel-${this._activeTab}`,
            role: "tabpanel",
            part: "content",
            "aria-labelledby": `tab-${this._activeTab}`,
        });

        panel.appendChild(_el("slot", { name: slotName }));

        return panel;
    }

    _createTabButton(tab) {
        const isActive = tab.id === this._activeTab;
        const isDisabled = !!tab.disabled;

        const btn = _el("button", {
            id: `tab-${tab.id}`,
            role: "tab",
            part: "tab",
            "aria-label": tab.label,
            "aria-selected": String(isActive),
            "aria-controls": `panel-${tab.id}`,
            "aria-disabled": String(isDisabled),
        });

        if (isDisabled) btn.disabled = true;
        btn.tabIndex = isActive && !isDisabled ? 0 : -1;
        btn.dataset.id = tab.id;

        const contentSlot = _el("slot", { name: `tab-content-${tab.id}` });
        btn.appendChild(contentSlot);

        if (tab.leftIcon) {
            contentSlot.appendChild(this._createIcon(tab.leftIcon));
        } else {
            this._appendDeprecatedIconSlot(contentSlot, "left", tab.id);
        }

        contentSlot.appendChild(_el("span", {}, [tab.label]));

        if (tab.rightIcon) {
            contentSlot.appendChild(this._createIcon(tab.rightIcon));
        } else {
            this._appendDeprecatedIconSlot(contentSlot, "right", tab.id);
        }

        return btn;
    }

    _findSiblingButton(buttons, fromIndex, direction) {
        for (let i = 1; i <= buttons.length; i++) {
            const b =
                buttons[
                    (fromIndex + i * direction + buttons.length) %
                        buttons.length
                ];
            if (!b.disabled) return b;
        }
        return null;
    }

    _getStyles() {
        const paddingVar = `var(--component-tab-padding-${this.size})`;
        const gapVar = `var(--component-tab-gap-${this.size})`;
        return `
            :host {
                display: flex;
            }
            :host([position="top"]) { flex-direction: column; }
            :host([position="bottom"]) { flex-direction: column-reverse; }
            :host([position="left"]) { flex-direction: row; }
            :host([position="right"]) { flex-direction: row-reverse; }

            .tablist {
                display: flex;
                gap: 0;
                position: relative;
                z-index: 1;
            }
            :host([position="top"])    .tablist { margin-bottom: -1px; margin-top: 0; }
            :host([position="bottom"]) .tablist { margin-top: -1px; margin-bottom: 0; }
            :host([position="left"])   .tablist { flex-direction: column; margin-right: -1px; margin-left: 0; }
            :host([position="right"])  .tablist { flex-direction: column; margin-left: -1px; margin-right: 0; }

            :host([position="top"])    .tablist button { border-bottom: none; }
            :host([position="bottom"]) .tablist button { border-top: none; }
            :host([position="left"])   .tablist button { border-right: none; }
            :host([position="right"])  .tablist button { border-left: none; }

            button {
                background: var(--component-tabs-border-color);
                color: var(--component-tabs-color);
                border: var(--component-tabs-border-width, var(--component-tab-border-width, 1px)) solid var(--component-tabs-border-color);
                margin: 0;
                padding: ${paddingVar};
                cursor: pointer;
                font-size: var(--font-size-label);
                display: inline-flex;
                align-items: center;
                gap: ${gapVar};
                transition: background 0.2s ease;
                outline: none;
                font-family: inherit;
            }
            :host([position="top"])    .tablist button:first-child { border-top-left-radius: var(--component-tab-border-radius-outer); }
            :host([position="top"])    .tablist button:last-child  { border-top-right-radius: var(--component-tab-border-radius-outer); }
            :host([position="bottom"]) .tablist button:first-child { border-bottom-left-radius: var(--component-tab-border-radius-outer); }
            :host([position="bottom"]) .tablist button:last-child  { border-bottom-right-radius: var(--component-tab-border-radius-outer); }
            :host([position="left"])   .tablist button:first-child   { border-top-left-radius: var(--component-tab-border-radius-outer); }
            :host([position="left"])   .tablist button:last-child    { border-bottom-left-radius: var(--component-tab-border-radius-outer); }
            :host([position="right"])  .tablist button:first-child  { border-top-right-radius: var(--component-tab-border-radius-outer); }
            :host([position="right"])  .tablist button:last-child   { border-bottom-right-radius: var(--component-tab-border-radius-outer); }

            button[aria-selected="true"] {
                background: var(--component-tabs-background);
            }
            button:focus-visible {
                outline: 2px solid var(--component-tabs-accent);
                outline-offset: -1px;
            }
            button[disabled] {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .icon-slot {
                display: inline-flex;
                align-items: center;
                margin: 0 4px;
            }
            .tabpanel {
                position: relative;
                border: var(--component-tabs-border-width, var(--component-tab-border-width, 1px)) solid var(--component-tabs-border-color);
                border-radius: var(--component-tab-border-radius-outer);
                padding: var(--component-tab-content-padding);
                background: var(--component-tabs-background);
            }
            :host([position="top"])    .tabpanel { border-top-left-radius: 0; }
            :host([position="bottom"]) .tabpanel { border-bottom-left-radius: 0; }
            :host([position="left"])   .tabpanel { border-top-left-radius: 0; }
            :host([position="right"])  .tabpanel { border-top-right-radius: 0; }
            :host([position="top"])    .tabpanel { margin-top: -1px; }
            :host([position="bottom"]) .tabpanel { margin-bottom: -1px; }
            :host([position="left"])   .tabpanel { margin-left: -1px; }
            :host([position="right"])  .tabpanel { margin-right: -1px; }

            /* ---- Accent variant: minimal tabs with a primary indicator border
                   on the active tab's content-facing edge ---- */
            :host([variant="accent"]) .tablist { margin: 0; }
            :host([variant="accent"]) button {
                background: transparent;
                border: none;
                border-radius: 0;
            }
            :host([variant="accent"]) button[aria-selected="true"] {
                background: transparent;
                color: var(--component-tabs-accent);
            }
            :host([variant="accent"]) .tabpanel {
                border: none;
                border-radius: 0;
                margin: 0;
            }
            /* A rail in the base border color runs along the tabs' content-facing
               edge; the active tab switches that edge to the accent color. */
            :host([variant="accent"][position="top"])    .tablist button { border-bottom: var(--component-tabs-accent-width, 2px) solid var(--component-tabs-border-color); }
            :host([variant="accent"][position="bottom"]) .tablist button { border-top: var(--component-tabs-accent-width, 2px) solid var(--component-tabs-border-color); }
            :host([variant="accent"][position="left"])   .tablist button { border-right: var(--component-tabs-accent-width, 2px) solid var(--component-tabs-border-color); }
            :host([variant="accent"][position="right"])  .tablist button { border-left: var(--component-tabs-accent-width, 2px) solid var(--component-tabs-border-color); }
            :host([variant="accent"][position="top"])    .tablist button[aria-selected="true"] { border-bottom-color: var(--component-tabs-accent); }
            :host([variant="accent"][position="bottom"]) .tablist button[aria-selected="true"] { border-top-color: var(--component-tabs-accent); }
            :host([variant="accent"][position="left"])   .tablist button[aria-selected="true"] { border-right-color: var(--component-tabs-accent); }
            :host([variant="accent"][position="right"])  .tablist button[aria-selected="true"] { border-left-color: var(--component-tabs-accent); }
        `;
    }

    _handleTabKeydown(e, buttons) {
        const idx = buttons.indexOf(e.currentTarget);

        if (e.key === "ArrowRight") {
            e.preventDefault();
            this._findSiblingButton(buttons, idx, 1)?.focus();
            return;
        }

        if (e.key === "ArrowLeft") {
            e.preventDefault();
            this._findSiblingButton(buttons, idx, -1)?.focus();
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.activateTab(e.currentTarget.dataset.id);
        }
    }

    _resolveActiveTab(tabs) {
        const currentInvalid =
            !this._activeTab ||
            tabs.find((t) => t.id === this._activeTab)?.disabled;
        if (tabs.length && currentInvalid) {
            this._activeTab = tabs.find((t) => !t.disabled)?.id || "";
        }
    }

    _setupEvents() {
        const buttons = Array.from(this.shadowRoot.querySelectorAll("button"));
        buttons.forEach((button) => {
            if (button.disabled) return;
            button.addEventListener("click", () =>
                this.activateTab(button.dataset.id),
            );
            button.addEventListener("keydown", (e) =>
                this._handleTabKeydown(e, buttons),
            );
        });
    }
}

if (!customElements.get("y-tabs")) {
    customElements.define("y-tabs", YumeTabs);
}
