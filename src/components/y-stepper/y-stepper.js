import "../y-icon/y-icon.js";
import { createElement as _el } from "../../modules/helpers.js";

export class YumeStepper extends HTMLElement {
    static get observedAttributes() {
        return [
            "items",
            "current",
            "orientation",
            "position",
            "size",
            "linear",
            "editable",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._stepStates = [];
    }

    connectedCallback() {
        this._syncStepStates();
        this.render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "items") {
            this._syncStepStates();
        }

        this.render();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Zero-based index of the active step. */
    get current() {
        const val = parseInt(this.getAttribute("current"), 10);
        return Number.isFinite(val)
            ? Math.max(0, Math.min(val, this.items.length - 1))
            : 0;
    }
    set current(val) {
        this.setAttribute("current", String(val));
    }

    /** When set, completed steps can be clicked to return to them. */
    get editable() {
        return this.hasAttribute("editable");
    }
    set editable(val) {
        if (val) this.setAttribute("editable", "");
        else this.removeAttribute("editable");
    }

    /** Array of step definitions. */
    get items() {
        try {
            return JSON.parse(this.getAttribute("items") || "[]");
        } catch {
            return [];
        }
    }
    set items(val) {
        if (val === null || val === undefined) this.removeAttribute("items");
        else if (typeof val === "string") this.setAttribute("items", val);
        else this.setAttribute("items", JSON.stringify(val));
    }

    /** When set, users can only advance via next() or complete(). */
    get linear() {
        return this.hasAttribute("linear");
    }
    set linear(val) {
        if (val) this.setAttribute("linear", "");
        else this.removeAttribute("linear");
    }

    /** Layout direction of step indicators. */
    get orientation() {
        const val = this.getAttribute("orientation");
        return val === "vertical" ? "vertical" : "horizontal";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** Whether step indicators appear before or after the content panels. */
    get position() {
        const val = this.getAttribute("position");
        return val === "end" ? "end" : "start";
    }
    set position(val) {
        this.setAttribute("position", val);
    }

    /** Controls indicator size, font size, and spacing. */
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

    /** Marks a step as complete without advancing. Defaults to the current step. */
    complete(index) {
        const idx = index !== undefined ? index : this.current;
        if (idx < 0 || idx >= this.items.length) return;

        this._stepStates[idx] = "complete";
        this.render();

        this.dispatchEvent(
            new CustomEvent("complete", {
                bubbles: true,
                composed: true,
                detail: { step: this.items[idx], index: idx },
            }),
        );
    }

    /** Jumps to the step at the given index. */
    goTo(index) {
        if (index < 0 || index >= this.items.length) return;
        if (index === this.current) return;

        if (this.linear && this._getStepState(index) !== "complete") return;

        this._fireChangeAndApply(index);
    }

    /** Advances to the next step. Marks current as complete. */
    next() {
        const items = this.items;
        const cur = this.current;

        if (cur === items.length - 1) {
            this._stepStates[cur] = "complete";
            this.render();

            const allComplete = this._stepStates.every((s) => s === "complete");
            if (allComplete) {
                this.dispatchEvent(
                    new CustomEvent("finish", {
                        bubbles: true,
                        composed: true,
                    }),
                );
            }
            return;
        }

        this._stepStates[cur] = "complete";
        this._fireChangeAndApply(cur + 1);
    }

    /** Returns to the previous step. */
    previous() {
        if (this.current <= 0) return;
        this._fireChangeAndApply(this.current - 1);
    }

    render() {
        const items = this.items;
        if (!items.length) {
            this.shadowRoot.innerHTML = "";
            return;
        }

        this.shadowRoot.innerHTML = "";

        const style = document.createElement("style");
        style.textContent = this._buildStyles();
        this.shadowRoot.appendChild(style);

        const indicators = this._buildIndicators(items);
        const panels = this._buildPanels(items);

        if (this.position === "end") {
            this.shadowRoot.appendChild(panels);
            this.shadowRoot.appendChild(indicators);
        } else {
            this.shadowRoot.appendChild(indicators);
            this.shadowRoot.appendChild(panels);
        }
    }

    /** Returns all steps to pending and sets current back to 0. */
    reset() {
        this._stepStates = this.items.map(() => "pending");
        this.current = 0;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildConnectorStyles() {
        const sizeVar = `var(--component-stepper-indicator-size-${this.size}, ${this._getDefaultIndicatorSize()})`;
        return `
            .connector {
                flex: 1;
                min-width: calc(${sizeVar} + 8px);
                min-height: calc(${sizeVar} + 8px);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .connector-line {
                background: var(--component-stepper-connector-color, var(--base-border, #ddd));
                transition: background 0.2s ease;
            }

            .connector-line.complete {
                background: var(--component-stepper-connector-color-complete, var(--primary-content--, #1976d2));
            }

            :host([orientation="horizontal"]) .connector-line {
                height: 2px;
                width: 100%;
            }

            :host([orientation="vertical"]) .connector-line {
                width: 2px;
                height: 100%;
            }
        `;
    }

    _buildHostStyles() {
        return `
            :host {
                display: block;
                font-family: var(--font-family-body, sans-serif);
                font-weight: var(--font-weight-body, 300);
            }

            :host([orientation="vertical"]) {
                display: flex;
            }

            :host([hidden]) {
                display: none !important;
            }
        `;
    }

    _buildIndicator(item, index, items) {
        const state = this._getStepState(index);
        const isActive = index === this.current;
        const isClickable = this._isIndicatorClickable(index, state);

        const indicatorParts = ["indicator"];
        if (isActive) indicatorParts.push("indicator--active");
        if (state === "complete") indicatorParts.push("indicator--complete");
        if (state === "error") indicatorParts.push("indicator--error");

        const btn = this._buildIndicatorButton(
            item,
            index,
            state,
            isActive,
            isClickable,
        );
        const indicator = _el(
            "div",
            {
                class: `indicator ${state} ${isActive ? "active" : ""}`,
                part: indicatorParts.join(" "),
                role: "listitem",
            },
            [btn],
        );

        const children = [indicator];

        if (index < items.length - 1) {
            children.push(
                _el(
                    "div",
                    {
                        class: "connector",
                        part: "connector",
                        role: "presentation",
                        "aria-hidden": "true",
                    },
                    [
                        _el("div", {
                            class: `connector-line ${state === "complete" ? "complete" : ""}`,
                        }),
                    ],
                ),
            );
        }

        return children;
    }

    _buildIndicatorButton(item, index, state, isActive, isClickable) {
        const panelId = `panel-${item.slot}`;
        const indicatorId = `indicator-${item.slot}`;
        const ariaLabel =
            state === "complete" ? `${item.label} (complete)` : item.label;

        const attrs = {
            class: "indicator-btn",
            id: indicatorId,
            "aria-controls": panelId,
            "aria-label": ariaLabel,
        };

        if (isActive) attrs["aria-current"] = "step";
        if (isActive) {
            attrs.tabindex = "0";
        } else if (isClickable) {
            attrs.tabindex = "-1";
        } else {
            attrs["aria-disabled"] = "true";
            attrs.tabindex = "-1";
        }

        const icon = this._buildIndicatorIcon(item, index, state);
        const label = this._buildIndicatorLabel(item);

        const btn = _el("button", attrs, [icon, label]);

        if (isClickable) {
            btn.addEventListener("click", () => this._onIndicatorClick(index));
        }
        btn.addEventListener("keydown", (e) =>
            this._onIndicatorKeydown(e, index),
        );

        return btn;
    }

    _buildIndicatorIcon(item, index, state) {
        const customSlotName = `${item.slot}-icon`;
        const hasCustomIcon = !!this.querySelector(
            `[slot="${customSlotName}"]`,
        );

        if (hasCustomIcon) {
            const slot = _el("slot", { name: customSlotName });
            return _el(
                "span",
                { class: "indicator-icon", part: "indicator-icon" },
                [slot],
            );
        }

        let iconContent;

        if (state === "complete") {
            iconContent = _el("y-icon", {
                name: "check",
                size: this._getIconSize(),
            });
        } else if (state === "error") {
            iconContent = _el("y-icon", {
                name: "circle-exclamation",
                size: this._getIconSize(),
            });
        } else if (item.icon) {
            iconContent = _el("y-icon", {
                name: item.icon,
                size: this._getIconSize(),
            });
        } else {
            iconContent = document.createTextNode(String(index + 1));
        }

        return _el(
            "span",
            { class: "indicator-icon", part: "indicator-icon" },
            [iconContent],
        );
    }

    _buildIndicatorLabel(item) {
        const children = [
            _el(
                "span",
                { class: "indicator-label-text", part: "indicator-label" },
                [item.label],
            ),
        ];

        if (item.description) {
            children.push(
                _el(
                    "span",
                    {
                        class: "indicator-description",
                        part: "indicator-description",
                    },
                    [item.description],
                ),
            );
        }

        return _el("span", { class: "indicator-label" }, children);
    }

    _buildIndicators(items) {
        const children = items.flatMap((item, i) =>
            this._buildIndicator(item, i, items),
        );

        return _el(
            "div",
            {
                class: "indicators",
                part: "indicators",
                role: "list",
            },
            children,
        );
    }

    _buildIndicatorStyles() {
        const sizeVar = `var(--component-stepper-indicator-size-${this.size}, ${this._getDefaultIndicatorSize()})`;
        const gapVar = `var(--component-stepper-gap-${this.size}, ${this._getDefaultGap()})`;

        return `
            .indicators {
                display: flex;
                align-items: center;
                gap: ${gapVar};
                margin: 0;
                padding: 0;
                list-style: none;
            }

            :host([orientation="vertical"]) .indicators {
                flex-direction: column;
                align-items: flex-start;
            }

            .indicator {
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }

            :host([orientation="vertical"]) .indicator {
                flex-direction: row;
            }

            .indicator-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: none;
                border: none;
                cursor: default;
                padding: 4px;
                font-family: inherit;
                font-size: inherit;
                color: inherit;
                border-radius: var(--radii-small, 4px);
                outline: none;
                transition: opacity 0.2s ease;
            }

            .indicator-btn[aria-disabled="false"],
            .indicator-btn:not([aria-disabled="true"])[tabindex="0"] {
                cursor: pointer;
            }

            .indicator-btn:focus-visible {
                outline: 2px solid var(--primary-content--, #1976d2);
                outline-offset: 2px;
            }

            .indicator-btn[aria-disabled="true"] {
                opacity: 0.55;
            }

            .indicator-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: ${sizeVar};
                height: ${sizeVar};
                border-radius: var(--radii-full, 50%);
                font-size: var(--font-size-label, 0.85em);
                font-weight: var(--font-weight-heading, 500);
                flex-shrink: 0;
                transition: background 0.2s ease, color 0.2s ease;
                background: var(--component-stepper-color-pending, var(--base-border, #ccc));
                color: var(--component-stepper-label-color, var(--base-content--, #333));
            }

            .active .indicator-icon {
                background: var(--component-stepper-color-active, var(--primary-content--, #1976d2));
                color: var(--component-stepper-color-active-text, var(--primary-content-inverse, #fff));
            }

            .complete .indicator-icon {
                background: var(--component-stepper-color-complete, var(--success-content--, #2e7d32));
                color: var(--component-stepper-color-complete-text, var(--success-content-inverse, #fff));
            }

            .error .indicator-icon {
                background: var(--component-stepper-color-error, var(--error-content--, #d32f2f));
                color: var(--component-stepper-color-error-text, var(--error-content-inverse, #fff));
            }

            .indicator-label {
                display: flex;
                flex-direction: column;
                gap: 2px;
                text-align: left;
            }

            .indicator-label-text {
                font-size: var(--font-size-label, 0.85em);
                font-weight: var(--font-weight-heading, 500);
                color: var(--component-stepper-label-color, var(--base-content--, #333));
            }

            .indicator-description {
                font-size: var(--font-size-small, 0.75em);
                color: var(--component-stepper-label-color, var(--base-content--, #666));
                opacity: 0.7;
            }
        `;
    }

    _buildPanelStyles() {
        return `
            .panels {
                margin-top: var(--spacing-medium, 16px);
            }

            :host([position="end"]) .panels {
                margin-top: 0;
                margin-bottom: var(--spacing-medium, 16px);
            }

            :host([orientation="vertical"]) .panels {
                margin-top: 0;
                margin-left: var(--spacing-medium, 16px);
                flex: 1;
            }

            :host([orientation="vertical"][position="end"]) .panels {
                margin-left: 0;
                margin-right: var(--spacing-medium, 16px);
            }
        `;
    }

    _buildPanels(items) {
        const panels = _el("div", { class: "panels", part: "panels" });

        items.forEach((item, i) => {
            const isActive = i === this.current;
            const panelId = `panel-${item.slot}`;
            const indicatorId = `indicator-${item.slot}`;

            const panel = _el("div", {
                class: "panel",
                part: "panel",
                id: panelId,
                role: "tabpanel",
                "aria-labelledby": indicatorId,
                hidden: !isActive ? true : false,
            });

            const slot = _el("slot", { name: item.slot });
            panel.appendChild(slot);
            panels.appendChild(panel);
        });

        return panels;
    }

    _buildStyles() {
        return [
            this._buildHostStyles(),
            this._buildIndicatorStyles(),
            this._buildConnectorStyles(),
            this._buildPanelStyles(),
        ].join("\n");
    }

    _fireChangeAndApply(nextIndex) {
        const previousIndex = this.current;
        const step = this.items[nextIndex];

        const event = new CustomEvent("change", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { index: nextIndex, previousIndex, step },
        });

        if (!this.dispatchEvent(event)) return;

        this.current = nextIndex;
    }

    _getDefaultGap() {
        const map = { small: "4px", medium: "8px", large: "12px" };
        return map[this.size] || map.medium;
    }

    _getDefaultIndicatorSize() {
        const map = { small: "28px", medium: "36px", large: "44px" };
        return map[this.size] || map.medium;
    }

    _getIconSize() {
        const map = { small: "small", medium: "medium", large: "large" };
        return map[this.size] || "medium";
    }

    _getStepState(index) {
        if (this._stepStates[index] && this._stepStates[index] !== "pending")
            return this._stepStates[index];

        return "pending";
    }

    _isIndicatorClickable(index, state) {
        if (index === this.current) return false;
        if (this.linear) return false;
        if (this.editable && state === "complete") return true;
        if (!this.editable && state !== "complete") return true;

        return false;
    }

    _onIndicatorClick(index) {
        this.goTo(index);
    }

    _onIndicatorKeydown(e, index) {
        const indicators = Array.from(
            this.shadowRoot.querySelectorAll(".indicator-btn"),
        );
        const currentIdx = indicators.indexOf(e.currentTarget);

        const isHorizontal = this.orientation === "horizontal";
        const nextKey = isHorizontal ? "ArrowRight" : "ArrowDown";
        const prevKey = isHorizontal ? "ArrowLeft" : "ArrowUp";

        if (e.key === nextKey) {
            e.preventDefault();
            const next = indicators[currentIdx + 1];
            if (next) {
                e.currentTarget.setAttribute("tabindex", "-1");
                next.setAttribute("tabindex", "0");
                next.focus();
            }
        } else if (e.key === prevKey) {
            e.preventDefault();
            const prev = indicators[currentIdx - 1];
            if (prev) {
                e.currentTarget.setAttribute("tabindex", "-1");
                prev.setAttribute("tabindex", "0");
                prev.focus();
            }
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (
                !e.currentTarget.getAttribute("aria-disabled") ||
                e.currentTarget.getAttribute("aria-disabled") === "false"
            ) {
                this._onIndicatorClick(index);
            }
        }
    }

    _syncStepStates() {
        const items = this.items;
        const existing = this._stepStates;

        this._stepStates = items.map(
            (item, i) => existing[i] || item.status || "pending",
        );
    }
}

if (!customElements.get("y-stepper")) {
    customElements.define("y-stepper", YumeStepper);
}
