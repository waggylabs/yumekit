import { createElement as _el } from "../../modules/helpers.js";
import "../y-icon/y-icon.js";

const VALID_ORIENTATIONS = new Set(["horizontal", "vertical"]);
const VALID_ALIGNMENTS = new Set(["start", "center", "end"]);
const VALID_VARIANTS = new Set(["solid", "dashed", "dotted"]);
const VALID_INSETS = new Set(["none", "sm", "md", "lg"]);

const INSET_TOKENS = {
    none: "0",
    sm: "var(--spacing-x-small)",
    md: "var(--spacing-medium)",
    lg: "var(--spacing-x-large)",
};

export class YumeBreak extends HTMLElement {
    static get observedAttributes() {
        return ["orientation", "align", "variant", "label", "icon", "inset"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "separator");
        this._syncAriaOrientation();
        this._observeSlot();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        this.render();
        this._syncAriaOrientation();
        this._observeSlot();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Position of break content along the line: "start" | "center" | "end". */
    get align() {
        const v = this.getAttribute("align");
        return VALID_ALIGNMENTS.has(v) ? v : "center";
    }
    set align(val) {
        this.setAttribute("align", val);
    }

    /** Convenience icon name rendered in the center when no slotted content is present. */
    get icon() {
        return this.getAttribute("icon") || "";
    }
    set icon(val) {
        if (val) this.setAttribute("icon", val);
        else this.removeAttribute("icon");
    }

    /** Outer end padding token: "none" | "sm" | "md" | "lg". */
    get inset() {
        const v = this.getAttribute("inset");
        return VALID_INSETS.has(v) ? v : "none";
    }
    set inset(val) {
        this.setAttribute("inset", val);
    }

    /** Convenience text label rendered in the center when no slotted content is present. */
    get label() {
        return this.getAttribute("label") || "";
    }
    set label(val) {
        if (val) this.setAttribute("label", val);
        else this.removeAttribute("label");
    }

    /** Direction the line is drawn: "horizontal" | "vertical". */
    get orientation() {
        const v = this.getAttribute("orientation");
        return VALID_ORIENTATIONS.has(v) ? v : "horizontal";
    }
    set orientation(val) {
        this.setAttribute("orientation", val);
    }

    /** Line style: "solid" | "dashed" | "dotted". */
    get variant() {
        const v = this.getAttribute("variant");
        return VALID_VARIANTS.has(v) ? v : "solid";
    }
    set variant(val) {
        this.setAttribute("variant", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const root = _el("div", { class: `break align-${this.align}` });

        const lineStart = _el("div", {
            class: "line line-start",
            part: "line line-start",
            "aria-hidden": "true",
        });
        const lineEnd = _el("div", {
            class: "line line-end",
            part: "line line-end",
            "aria-hidden": "true",
        });

        const slot = _el("slot");
        const fallback = this._buildFallbackContent();
        if (fallback) slot.appendChild(fallback);

        const content = _el(
            "div",
            { class: "content", part: "content" },
            [slot],
        );

        root.appendChild(lineStart);
        root.appendChild(content);
        root.appendChild(lineEnd);

        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(root);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _buildFallbackContent() {
        const { icon, label } = this;
        if (!icon && !label) return null;

        const wrapper = _el("span", { class: "fallback" });
        if (icon) {
            wrapper.appendChild(
                _el("y-icon", { name: icon, "aria-hidden": "true" }),
            );
        }
        if (label) {
            wrapper.appendChild(document.createTextNode(label));
        }
        return wrapper;
    }

    _buildStyleSheet() {
        const variant = this.variant;
        const inset = INSET_TOKENS[this.inset];

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                --_line-style: var(--component-break-line-style, ${variant});
                --_inset: var(--component-break-inset, ${inset});
                display: block;
                box-sizing: border-box;
                color: var(--component-break-content-color);
            }

            :host([orientation="vertical"]) {
                display: inline-flex;
                align-self: stretch;
                min-height: 1em;
            }

            .break {
                display: flex;
                align-items: center;
                width: 100%;
                box-sizing: border-box;
            }

            :host([orientation="vertical"]) .break {
                flex-direction: column;
                width: auto;
                height: 100%;
            }

            .line {
                flex: 1 1 auto;
                min-width: var(--component-break-min-length);
                border-top: var(--component-break-line-thickness) var(--_line-style) var(--component-break-line-color);
                align-self: center;
            }

            :host([orientation="vertical"]) .line {
                border-top: 0;
                border-left: var(--component-break-line-thickness) var(--_line-style) var(--component-break-line-color);
                min-width: 0;
                min-height: var(--component-break-min-length);
                width: 0;
                height: auto;
            }

            .line-start { margin-inline-start: var(--_inset); }
            .line-end { margin-inline-end: var(--_inset); }

            :host([orientation="vertical"]) .line-start {
                margin-inline-start: 0;
                margin-block-start: var(--_inset);
            }
            :host([orientation="vertical"]) .line-end {
                margin-inline-end: 0;
                margin-block-end: var(--_inset);
            }

            .align-start .line-start { flex: 0 0 0; min-width: 0; min-height: 0; }
            .align-end .line-end     { flex: 0 0 0; min-width: 0; min-height: 0; }

            .content {
                display: inline-flex;
                align-items: center;
                gap: var(--component-break-gap);
                padding-inline: var(--component-break-gap);
                color: inherit;
                font-size: var(--component-break-content-font-size);
                font-weight: var(--component-break-content-font-weight);
                line-height: 1;
                white-space: nowrap;
            }

            :host([orientation="vertical"]) .content {
                padding-inline: 0;
                padding-block: var(--component-break-gap);
            }

            .content.is-empty { display: none; }

            .fallback {
                display: inline-flex;
                align-items: center;
                gap: var(--component-break-gap);
            }

            ::slotted(*) { line-height: 1; }
        `);
        return sheet;
    }

    _hasMeaningfulContent() {
        const slot = this.shadowRoot?.querySelector("slot");
        if (!slot) return false;

        const assigned = slot.assignedNodes({ flatten: true });
        const realChildren = assigned.filter((n) => {
            if (n.nodeType === Node.ELEMENT_NODE) return true;
            if (n.nodeType === Node.TEXT_NODE) return n.textContent.trim() !== "";
            return false;
        });
        if (realChildren.length > 0) return true;

        return Boolean(this.label || this.icon);
    }

    _observeSlot() {
        const slot = this.shadowRoot?.querySelector("slot");
        if (!slot) return;
        slot.addEventListener("slotchange", () => this._updateContentVisibility());
        this._updateContentVisibility();
    }

    _syncAriaOrientation() {
        if (this.orientation === "vertical") {
            this.setAttribute("aria-orientation", "vertical");
        } else {
            this.removeAttribute("aria-orientation");
        }
    }

    _updateContentVisibility() {
        const content = this.shadowRoot?.querySelector(".content");
        if (!content) return;
        content.classList.toggle("is-empty", !this._hasMeaningfulContent());
    }
}

if (!customElements.get("y-break")) {
    customElements.define("y-break", YumeBreak);
}
