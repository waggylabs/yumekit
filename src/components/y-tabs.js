export class YumeTabs extends HTMLElement {
    static get observedAttributes() {
        return ["options", "size", "position"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._activeTab = "";
    }

    connectedCallback() {
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("position"))
            this.setAttribute("position", "top");
        this.render();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (
            (name === "options" || name === "size" || name === "position") &&
            oldVal !== newVal
        ) {
            this.render();
        }
    }

    get options() {
        try {
            return JSON.parse(this.getAttribute("options") || "[]");
        } catch {
            return [];
        }
    }

    set options(val) {
        this.setAttribute("options", JSON.stringify(val));
        this.render();
    }

    get size() {
        const sz = this.getAttribute("size");
        return ["small", "medium", "large"].includes(sz) ? sz : "medium";
    }

    set size(val) {
        if (["small", "medium", "large"].includes(val))
            this.setAttribute("size", val);
        else this.setAttribute("size", "medium");
    }

    get position() {
        const pos = this.getAttribute("position");
        return ["top", "bottom", "left", "right"].includes(pos) ? pos : "top";
    }

    set position(val) {
        if (["top", "bottom", "left", "right"].includes(val))
            this.setAttribute("position", val);
        else this.setAttribute("position", "top");
    }

    activateTab(id) {
        const tab = this.options.find((t) => t.id === id);
        if (!tab || tab.disabled) return;
        if (this._activeTab === id) return;
        this._activeTab = id;
        this.render();
    }

    _setupEvents() {
        const buttons = Array.from(this.shadowRoot.querySelectorAll("button"));
        buttons.forEach((button) => {
            if (button.disabled) return;
            button.addEventListener("click", () =>
                this.activateTab(button.dataset.id),
            );
            button.addEventListener("keydown", (e) => {
                this._handleTabKeydown(e, buttons);
            });
        });
    }

    _handleTabKeydown(e, buttons) {
        const idx = buttons.indexOf(e.currentTarget);
        if (e.key === "ArrowRight") {
            e.preventDefault();
            this._findSiblingButton(buttons, idx, 1)?.focus();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            this._findSiblingButton(buttons, idx, -1)?.focus();
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            this.activateTab(e.currentTarget.dataset.id);
        }
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

    _resolveActiveTab(tabs) {
        const currentInvalid =
            !this._activeTab ||
            tabs.find((t) => t.id === this._activeTab)?.disabled;
        if (tabs.length && currentInvalid) {
            this._activeTab = tabs.find((t) => !t.disabled)?.id || "";
        }
    }

    _getStyles() {
        const paddingVar = `var(--component-tab-padding-${this.size})`;
        const gapVar = `var(--component-tab-gap-${this.size})`;
        return `
            :host {
                display: flex;
                font-family: var(--component-tabs-font-family, var(--font-family-body));
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
                border: var(--component-tab-border-width) solid var(--component-tabs-border-color);
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
                z-index: 0;
                border: var(--component-tab-border-width) solid var(--component-tabs-border-color);
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
        `;
    }

    _createTabButton(tab) {
        const isActive = tab.id === this._activeTab;
        const isDisabled = !!tab.disabled;
        const btn = document.createElement("button");
        btn.id = `tab-${tab.id}`;
        btn.setAttribute("role", "tab");
        btn.setAttribute("part", "tab");
        btn.setAttribute("aria-selected", isActive);
        btn.setAttribute("aria-controls", `panel-${tab.id}`);
        btn.setAttribute("aria-disabled", isDisabled);

        if (isDisabled) btn.disabled = true;
        btn.tabIndex = isActive && !isDisabled ? 0 : -1;
        btn.dataset.id = tab.id;

        if (this.querySelector(`[slot="left-icon-${tab.id}"]`)) {
            const leftSlot = document.createElement("slot");
            leftSlot.name = `left-icon-${tab.id}`;
            leftSlot.className = "icon-slot";
            btn.appendChild(leftSlot);
        }

        const labelSpan = document.createElement("span");
        labelSpan.textContent = tab.label;
        btn.appendChild(labelSpan);

        if (this.querySelector(`[slot="right-icon-${tab.id}"]`)) {
            const rightSlot = document.createElement("slot");
            rightSlot.name = `right-icon-${tab.id}`;
            rightSlot.className = "icon-slot";
            btn.appendChild(rightSlot);
        }

        return btn;
    }

    _createPanel(slotName) {
        const panel = document.createElement("div");
        panel.className = "tabpanel";
        panel.id = `panel-${this._activeTab}`;
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("part", "content");
        panel.setAttribute("aria-labelledby", `tab-${this._activeTab}`);

        const contentSlot = document.createElement("slot");
        contentSlot.name = slotName;
        panel.appendChild(contentSlot);
        return panel;
    }

    render() {
        const tabs = this.options;
        this._resolveActiveTab(tabs);

        const activeDef = tabs.find((t) => t.id === this._activeTab);

        this.shadowRoot.innerHTML = "";

        const style = document.createElement("style");
        style.textContent = this._getStyles();
        this.shadowRoot.appendChild(style);

        const tablist = document.createElement("div");
        tablist.className = "tablist";
        tablist.setAttribute("role", "tablist");
        tablist.setAttribute("part", "tablist");
        tabs.forEach((tab) => tablist.appendChild(this._createTabButton(tab)));
        this.shadowRoot.appendChild(tablist);

        this.shadowRoot.appendChild(this._createPanel(activeDef?.slot || ""));

        this._setupEvents();
    }
}

if (!customElements.get("y-tabs")) {
    customElements.define("y-tabs", YumeTabs);
}
