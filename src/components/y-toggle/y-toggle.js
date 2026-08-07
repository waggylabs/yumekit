import "../y-icon/y-icon.js";
import {
    coerceRichData,
    contrastTextColor,
    createElement as _el,
    forwardControlAttributes,
    isSafeCssColor,
    upgradeProperties,
} from "../../modules/helpers.js";

const THUMB_COLOR_ROLES = [
    "base",
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "help",
];

export class YumeToggle extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "animate",
            "color",
            "disabled",
            "full-width",
            "name",
            "options",
            "orientation",
            "size",
            "value",
            "variant",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this.attachShadow({ mode: "open" });
        this._options = null;
        this._value = "";
        this._initialValue = null;
        this._reflecting = false;
        this._resizeObserver = null;
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("animate")) this.setAttribute("animate", "true");
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("orientation"))
            this.setAttribute("orientation", "horizontal");
        if (this._initialValue === null)
            this._initialValue = this.getAttribute("value") || "";
        this.render();
    }

    disconnectedCallback() {
        this._teardownResize();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;

        if (name === "value") {
            if (this._reflecting) return;
            this._setValue(newVal || "");
            return;
        }

        if (name === "options") this._options = coerceRichData(newVal);
        this.render();
    }

    formDisabledCallback(disabled) {
        if (disabled) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    formResetCallback() {
        this._setValue(this._initialValue || "");
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether the thumb slides between segments. Set `animate="false"` to move it instantly. Reduced-motion preferences win regardless. */
    get animate() {
        return this.getAttribute("animate") !== "false";
    }
    set animate(val) {
        this.setAttribute("animate", val ? "true" : "false");
    }

    /** @type {string} Semantic color role marking the selected segment — `base`, `primary`, `secondary`, `success`, `warning`, `error`, `help`, or a CSS color literal. Defaults to `primary`. Individual options override it via `options[].color`. */
    get color() {
        return this.getAttribute("color") || "";
    }
    set color(val) {
        this.setAttribute("color", val);
    }

    /** @type {boolean} Whether the whole group is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /** @type {boolean} Whether the group fills its container with equal-width segments. */
    get fullWidth() {
        return this.hasAttribute("full-width");
    }
    set fullWidth(val) {
        if (val) this.setAttribute("full-width", "");
        else this.removeAttribute("full-width");
    }

    /** @type {string} The form field name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /** @type {Array<{value: string, label?: string, icon?: string, color?: string, disabled?: boolean, ariaLabel?: string}>} Option definitions. `icon` is a `y-icon` name; `color` overrides the group's `color` while that option is selected; `ariaLabel` names an icon-only segment. Rich data held as a property (identity preserved, not serialized); the `options` attribute seeds an initial value but is not kept in sync after an imperative set. */
    get options() {
        return Array.isArray(this._options) ? this._options : [];
    }
    set options(val) {
        this._options = coerceRichData(val);
        this.render();
    }

    /** @type {"horizontal"|"vertical"} The axis segments are laid out on, and the axis the thumb slides along. */
    get orientation() {
        return this.getAttribute("orientation") === "vertical"
            ? "vertical"
            : "horizontal";
    }
    set orientation(val) {
        this.setAttribute(
            "orientation",
            val === "vertical" ? "vertical" : "horizontal",
        );
    }

    /** @type {"small"|"medium"|"large"} Controls segment padding, gap, and icon size. */
    get size() {
        const size = this.getAttribute("size");
        return ["small", "medium", "large"].includes(size) ? size : "medium";
    }
    set size(val) {
        this.setAttribute(
            "size",
            ["small", "medium", "large"].includes(val) ? val : "medium",
        );
    }

    /** @type {string} The selected option value. Setting it moves the selection without firing events — use `select()` for the eventful path. */
    get value() {
        return this._value;
    }
    set value(val) {
        this._setValue(val == null ? "" : String(val));
    }

    /** @type {"solid"|"outline"|"flat"} Visual style, matching the `y-button` variant of the same name. `solid` fills the track and the selected thumb; `outline` borders the track and tints the selected thumb behind a matching border; `flat` drops the track and fills the selected thumb alone. */
    get variant() {
        const variant = this.getAttribute("variant");
        return ["solid", "outline", "flat"].includes(variant)
            ? variant
            : "solid";
    }
    set variant(val) {
        this.setAttribute(
            "variant",
            ["solid", "outline", "flat"].includes(val) ? val : "solid",
        );
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    render() {
        const options = this.options;

        this._teardownResize();
        this.shadowRoot.replaceChildren();

        const style = _el("style");
        style.textContent = this._getStyles();
        this.shadowRoot.appendChild(style);

        const track = _el("div", {
            class: "track",
            part: "base track",
            role: "radiogroup",
        });
        track.appendChild(_el("div", { class: "thumb", part: "thumb" }));
        options.forEach((option) =>
            track.appendChild(this._buildSegment(option)),
        );

        forwardControlAttributes(this, track, [
            "aria-label",
            "aria-labelledby",
        ]);
        this.shadowRoot.appendChild(track);

        this._resolveValue();
        this._updateSelection();
        this._updateThumb();
        this._observeResize();
        this._enableAnimation();
    }

    /**
     * Selects an option by value. Fires a cancelable `y-toggle-select` before
     * the change is applied and a `change` after it. No event fires when the
     * value is unknown, disabled, already selected, or the group is disabled.
     * @param {string} value - The value of the option to select.
     */
    select(value) {
        const next = value == null ? "" : String(value);
        const option = this.options.find((o) => String(o.value) === next);
        if (this.disabled || !option || option.disabled) return;
        if (next === this._value) return;

        const previousValue = this._value;
        const event = new CustomEvent("y-toggle-select", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { value: next, previousValue },
        });

        if (!this.dispatchEvent(event)) return;

        this._setValue(next);
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: { value: next, previousValue },
            }),
        );
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /**
     * Paints the thumb and the selected segment's text from the active option's
     * palette. Applied inline rather than in the stylesheet so a per-option
     * `color` can recolor the thumb as it slides between segments.
     */
    _applySelectionColors() {
        const thumb = this.shadowRoot.querySelector(".thumb");
        const segments = this._getSegments();
        const selected = segments.find(
            (s) => s.getAttribute("aria-checked") === "true",
        );

        segments.forEach((segment) => segment.style.removeProperty("color"));
        if (!thumb) return;

        const option = this.options.find(
            (o) => String(o.value) === selected?.dataset.value,
        );
        const palette = this._getThumbPalette(option?.color);

        thumb.style.backgroundColor = palette.background;
        thumb.style.borderColor = palette.border;
        if (selected) selected.style.color = palette.color;
    }

    _buildSegment(option) {
        const value = String(option.value);
        const isDisabled = !!option.disabled || this.disabled;

        const segment = _el("button", {
            type: "button",
            class: "segment",
            part: "segment",
            role: "radio",
            "aria-checked": "false",
            "aria-disabled": String(isDisabled),
            "aria-label": option.ariaLabel || null,
            tabindex: "-1",
        });
        segment.disabled = isDisabled;
        segment.dataset.value = value;

        const slot = _el("slot", { name: `option-${value}` });
        if (option.icon) {
            slot.appendChild(
                _el("y-icon", {
                    name: option.icon,
                    size: this.size,
                    part: "icon",
                    "aria-hidden": "true",
                }),
            );
        }
        if (option.label) {
            slot.appendChild(_el("span", { part: "label" }, [option.label]));
        }
        segment.appendChild(slot);

        segment.addEventListener("click", () => this.select(value));
        segment.addEventListener("keydown", (e) => this._handleKeydown(e));

        return segment;
    }

    _enableAnimation() {
        if (!this.animate) return;

        const track = this.shadowRoot.querySelector(".track");
        if (!track) return;

        // Position the thumb before the transition is armed, so the first paint
        // doesn't slide it in from the track origin.
        requestAnimationFrame(() =>
            requestAnimationFrame(() => track.classList.add("animate")),
        );
    }

    _findSibling(segments, fromIndex, direction) {
        for (let i = 1; i <= segments.length; i++) {
            const next =
                segments[
                    (fromIndex + i * direction + segments.length) %
                        segments.length
                ];
            if (!next.disabled) return next;
        }
        return null;
    }

    _getRolePalette(role) {
        if (this.variant === "outline") {
            return {
                background: `var(--${role}-background-component)`,
                border: `var(--${role}-content--)`,
                color: `var(--${role}-content--)`,
            };
        }

        return {
            background: `var(--${role}-content--)`,
            border: "transparent",
            color: `var(--${role}-content-inverse)`,
        };
    }

    _getSegments() {
        return Array.from(this.shadowRoot.querySelectorAll(".segment"));
    }

    _getStyles() {
        const isVertical = this.orientation === "vertical";
        const gap = `var(--component-toggle-gap-${this.size})`;
        const padding = `var(--component-toggle-segment-padding-${this.size})`;

        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: inline-block;
                font-family: var(--font-family-body);
            }
            :host([full-width]) {
                display: block;
            }

            .track {
                position: relative;
                display: inline-flex;
                flex-direction: ${isVertical ? "column" : "row"};
                align-items: stretch;
                gap: ${gap};
                padding: var(--component-toggle-padding);
                background: var(--component-toggle-background);
                border: var(--component-toggle-border-width) solid transparent;
                border-radius: var(--component-toggle-border-radius-outer);
                box-sizing: border-box;
            }
            :host([full-width]) .track {
                display: flex;
                width: 100%;
            }
            :host([variant="outline"]) .track {
                background: transparent;
                border-color: var(--component-toggle-border-color);
            }
            :host([variant="flat"]) .track {
                background: transparent;
                padding: 0;
            }

            .thumb {
                position: absolute;
                top: 0;
                left: 0;
                width: 0;
                height: 0;
                opacity: 0;
                box-sizing: border-box;
                /* Fill and border color are applied inline per selection, so a
                   per-option color can recolor the thumb as it travels. */
                border: var(--component-toggle-border-width) solid transparent;
                border-radius: var(--component-toggle-border-radius-inner);
                box-shadow: var(--component-toggle-thumb-shadow);
                pointer-events: none;
            }
            :host([variant="flat"]) .thumb,
            :host([variant="outline"]) .thumb {
                box-shadow: none;
            }
            .track.animate .thumb {
                transition:
                    transform var(--component-toggle-transition-duration) ease,
                    width var(--component-toggle-transition-duration) ease,
                    height var(--component-toggle-transition-duration) ease,
                    opacity var(--component-toggle-transition-duration) ease,
                    background-color var(--component-toggle-transition-duration) ease,
                    border-color var(--component-toggle-transition-duration) ease;
            }

            .segment {
                position: relative;
                z-index: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: ${gap};
                margin: 0;
                padding: ${padding};
                background: transparent;
                border: none;
                border-radius: var(--component-toggle-border-radius-inner);
                color: var(--component-toggle-color);
                font-family: inherit;
                font-size: var(--font-size-label);
                line-height: 1;
                white-space: nowrap;
                cursor: pointer;
                outline: none;
                transition: color var(--component-toggle-transition-duration) ease;
            }
            :host([full-width]) .segment {
                flex: 1 1 0;
            }
            .segment:focus-visible {
                outline: 2px solid var(--primary-content--);
                outline-offset: -2px;
            }
            .segment[disabled] {
                opacity: 0.5;
                cursor: not-allowed;
            }

            @media (prefers-reduced-motion: reduce) {
                .track.animate .thumb,
                .segment {
                    transition: none;
                }
            }
        `;
    }

    /**
     * Resolves a selected segment's fill, border, and text color, mirroring the
     * matching `y-button` variant: `solid` and `flat` fill the thumb and invert
     * the text, `outline` tints it and draws the color as a border with
     * matching text. An unrecognised color falls back to the group's `color`,
     * and then to `primary`.
     * @param {string} [color] — a per-option color overriding the group's
     * @returns {{background: string, border: string, color: string}}
     */
    _getThumbPalette(color) {
        const requested = color || this.color || "primary";
        const isOutline = this.variant === "outline";
        const isRole = THUMB_COLOR_ROLES.includes(requested);

        if (!isRole && isSafeCssColor(requested)) {
            if (isOutline) {
                return {
                    background: `color-mix(in srgb, ${requested} 8%, transparent)`,
                    border: `color-mix(in srgb, ${requested} 55%, transparent)`,
                    color: requested,
                };
            }
            return {
                background: requested,
                border: "transparent",
                color: contrastTextColor(requested),
            };
        }

        // Neither a role nor a usable CSS color — a per-option value defers to
        // the group, and the group itself defers to primary.
        if (!isRole) {
            return color ? this._getThumbPalette() : this._getRolePalette("primary");
        }

        return this._getRolePalette(requested);
    }

    _handleKeydown(e) {
        const segments = this._getSegments();
        const index = segments.indexOf(e.currentTarget);
        if (index === -1) return;

        const isVertical = this.orientation === "vertical";
        const forward = isVertical ? "ArrowDown" : "ArrowRight";
        const backward = isVertical ? "ArrowUp" : "ArrowLeft";
        const alternateForward = isVertical ? "ArrowRight" : "ArrowDown";
        const alternateBackward = isVertical ? "ArrowLeft" : "ArrowUp";

        let target;

        if (e.key === forward || e.key === alternateForward) {
            target = this._findSibling(segments, index, 1);
        } else if (e.key === backward || e.key === alternateBackward) {
            target = this._findSibling(segments, index, -1);
        } else if (e.key === "Home") {
            target = this._findSibling(segments, -1, 1);
        } else if (e.key === "End") {
            target = this._findSibling(segments, segments.length, -1);
        } else if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            this.select(e.currentTarget.dataset.value);
            return;
        } else {
            return;
        }

        if (!target) return;

        e.preventDefault();
        this.select(target.dataset.value);
        target.focus();
    }

    _observeResize() {
        if (typeof ResizeObserver === "undefined") return;

        const track = this.shadowRoot.querySelector(".track");
        if (!track) return;

        this._resizeObserver = new ResizeObserver(() => this._updateThumb());
        this._resizeObserver.observe(track);
        this._resizeObserver.observe(this);
    }

    _reflect() {
        this._reflecting = true;
        if (this._value) this.setAttribute("value", this._value);
        else this.removeAttribute("value");
        this._reflecting = false;
    }

    /**
     * Falls the selection back to the first enabled option whenever the current
     * value names nothing selectable, so a group with options always submits a
     * value. Leaves the selection empty when every option is disabled.
     */
    _resolveValue() {
        const options = this.options;
        if (!options.length) return;

        const current = options.find((o) => String(o.value) === this._value);
        if (current && !current.disabled) return;

        const fallback = options.find((o) => !o.disabled);
        this._value = fallback ? String(fallback.value) : "";
        this._reflect();
        this._internals.setFormValue(this._value, this.name);
    }

    _setValue(next) {
        if (next === this._value) return;

        this._value = next;
        this._reflect();
        this._internals.setFormValue(next, this.name);
        this._updateSelection();
        this._updateThumb();
    }

    _teardownResize() {
        this._resizeObserver?.disconnect();
        this._resizeObserver = null;
    }

    _updateSelection() {
        const segments = this._getSegments();
        const selected = segments.find(
            (s) => s.dataset.value === this._value && !s.disabled,
        );
        const focusable = selected || segments.find((s) => !s.disabled);

        segments.forEach((segment) => {
            const isSelected = segment === selected;
            segment.setAttribute("aria-checked", String(isSelected));
            segment.tabIndex = segment === focusable ? 0 : -1;
        });

        this._applySelectionColors();
    }

    _updateThumb() {
        const track = this.shadowRoot.querySelector(".track");
        const thumb = this.shadowRoot.querySelector(".thumb");
        if (!track || !thumb) return;

        const selected = this._getSegments().find(
            (s) => s.getAttribute("aria-checked") === "true",
        );
        const width = selected?.offsetWidth || 0;
        const height = selected?.offsetHeight || 0;

        // A zero box means nothing is selected or the group is not laid out yet
        // (display:none, a closed drawer). Hide rather than cache a bad rect —
        // the ResizeObserver re-runs this once the track has a size.
        if (!width || !height) {
            thumb.style.opacity = "0";
            return;
        }

        thumb.style.opacity = "1";
        thumb.style.width = `${width}px`;
        thumb.style.height = `${height}px`;
        thumb.style.transform = `translate(${selected.offsetLeft}px, ${selected.offsetTop}px)`;
    }
}

if (!customElements.get("y-toggle")) {
    customElements.define("y-toggle", YumeToggle);
}
