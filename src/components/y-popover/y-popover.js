import "../y-icon/y-icon.js";
import {
    createElement as _el,
    getColorVarPair,
    isSafeCssColor,
    resolveThemeMountPoint,
    upgradeProperties,
} from "../../modules/helpers.js";
import { computePosition, pointerOffsetFor } from "../../modules/floating.js";

const VALID_POSITIONS = new Set([
    "auto",
    "top",
    "bottom",
    "left",
    "right",
    "top-start",
    "top-end",
    "bottom-start",
    "bottom-end",
    "left-start",
    "left-end",
    "right-start",
    "right-end",
]);

const NAMED_COLORS = new Set([
    "base",
    "primary",
    "secondary",
    "success",
    "warning",
    "error",
    "help",
]);

const SIZES = new Set(["small", "medium", "large"]);

const VALID_TRIGGERS = new Set([
    "manual",
    "click",
    "hover",
    "focus",
    "context-menu",
]);

/**
 * Whether `host` IS `active` or contains `active` inside its shadow root.
 * Used by the focus trap: the trapped focusables list holds slotted hosts
 * (e.g. `<y-button>`), but document.activeElement after focus lands is the
 * host's inner `<button>`. Strict equality misses that case.
 */
function isOrShadowContains(host, active) {
    if (host === active) return true;
    return host.shadowRoot ? host.shadowRoot.contains(active) : false;
}

let _instanceCount = 0;

export class YumePopover extends HTMLElement {
    static get observedAttributes() {
        return [
            "open",
            "anchor",
            "position",
            "offset",
            "pointer",
            "text",
            "color",
            "size",
            "disabled",
            "trigger",
            "delay-show",
            "delay-hide",
            "close-on-escape",
            "close-on-outside-click",
            "close-on-anchor-click",
            "modal",
            "show-backdrop",
            "portal",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._instanceId = ++_instanceCount;
        this._anchorEl = null;
        this._anchorProperty = null;
        this._listenedAnchor = null;
        this._open = false;
        this._suppressAttrEcho = false;
        this._rafId = 0;
        this._resizeObserver = null;
        this._triggerSet = new Set(["manual"]);
        this._showTimer = 0;
        this._hideTimer = 0;
        // `_hovering` / `_focusing` hold the popover open as long as the
        // mouse or focus is on either the anchor or the surface, so the
        // schedule-hide path can decide whether to actually close.
        this._hovering = false;
        this._focusing = false;
        this._onWindowChange = this._onWindowChange.bind(this);
        this._onTriggerSlotChange = this._onTriggerSlotChange.bind(this);
        this._onAnchorClick = this._onAnchorClick.bind(this);
        this._onAnchorEnter = this._onAnchorEnter.bind(this);
        this._onAnchorLeave = this._onAnchorLeave.bind(this);
        this._onAnchorFocus = this._onAnchorFocus.bind(this);
        this._onAnchorBlur = this._onAnchorBlur.bind(this);
        this._onAnchorContextMenu = this._onAnchorContextMenu.bind(this);
        this._onSurfaceEnter = this._onSurfaceEnter.bind(this);
        this._onSurfaceLeave = this._onSurfaceLeave.bind(this);
        this._onSurfaceFocusIn = this._onSurfaceFocusIn.bind(this);
        this._onSurfaceFocusOut = this._onSurfaceFocusOut.bind(this);
        this._onDocumentClick = this._onDocumentClick.bind(this);
        this._onDocumentKeydown = this._onDocumentKeydown.bind(this);
        this._onBackdropClick = this._onBackdropClick.bind(this);
        this._previousFocus = null;
        this._portalContainer = null;
        this._portalShadow = null;
        this._portalLightChildren = null;
    }

    connectedCallback() {
        upgradeProperties(this);
        this._triggerSet = this._parseTriggerAttr(this.getAttribute("trigger"));
        this._render();
        this._resolveAnchor();
        if (this.hasAttribute("open") && !this.disabled) {
            // Defer one frame so a slotted trigger has time to assign before
            // the first positioning pass needs to measure it.
            requestAnimationFrame(() => this.show());
        }
    }

    disconnectedCallback() {
        this._detachTriggerListeners(this._listenedAnchor);
        this._cancelShow();
        this._cancelHide();

        if (this._open) this._detachDocumentListeners();
        if (this._portalContainer) this._deactivatePortal();

        this._stopObservers();
        this._open = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (this._suppressAttrEcho) return;

        if (name === "open") {
            // Declarative `<y-popover open>` triggers this callback during
            // parsing — before connectedCallback runs and the shadow DOM is
            // built. Defer to connectedCallback in that case; it already
            // applies a deferred show() for the open attribute.
            if (!this._surface) return;

            const wantOpen = newValue !== null && newValue !== "false";

            if (wantOpen) this.show();
            else this.hide("api");
            return;
        }
        if (name === "anchor") {
            this._anchorProperty = null;
            this._resolveAnchor();
            return;
        }
        if (name === "trigger") {
            this._detachTriggerListeners(this._listenedAnchor);
            this._triggerSet = this._parseTriggerAttr(newValue);
            this._attachTriggerListeners();
            return;
        }
        if (name === "disabled" && this._open) {
            this.hide("api");
            return;
        }
        if (!this.shadowRoot.firstChild) return;

        if (name === "text" && this._textFallback) {
            this._textFallback.textContent = this.text;
        }

        if (name === "modal") {
            this._applyModalAttrs();
            this._updateBackdrop();
        }
        if (name === "show-backdrop") {
            this._updateBackdrop();
        }
        if (name === "portal" && this._open) {
            // Sync portal state with the new attribute value live.
            if (this.portal && !this._portalContainer) {
                this._activatePortal();
            } else if (!this.portal && this._portalContainer) {
                this._deactivatePortal();
            }
        }

        // Visual / classification attributes — re-style the surface in place
        // rather than rebuilding so an open popover keeps its state.
        this._applySurfaceAttrs();
        if (this._open) this.updatePosition();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Direct DOM-element anchor reference. Wins over the `anchor` attribute. */
    get anchor() {
        return this._anchorProperty ?? this.getAttribute("anchor");
    }
    set anchor(value) {
        if (value instanceof Element) {
            this._anchorProperty = value;
            this._resolveAnchor();
        } else if (value == null) {
            this._anchorProperty = null;
            this.removeAttribute("anchor");
        } else {
            this._anchorProperty = null;
            this.setAttribute("anchor", String(value));
        }
    }

    /** Color theme — semantic name or any safe CSS color literal. */
    get color() {
        return this.getAttribute("color") || "base";
    }
    set color(v) {
        if (v == null) this.removeAttribute("color");
        else this.setAttribute("color", String(v));
    }

    /** Whether a click on the anchor closes an already-open popover. */
    get closeOnAnchorClick() {
        const v = this.getAttribute("close-on-anchor-click");
        return v !== null && v !== "false";
    }
    set closeOnAnchorClick(v) {
        if (v === true || v === "" || v === "true") {
            this.setAttribute("close-on-anchor-click", "");
        } else {
            this.removeAttribute("close-on-anchor-click");
        }
    }

    /** Whether Escape closes the popover. Defaults to `true`. */
    get closeOnEscape() {
        const v = this.getAttribute("close-on-escape");
        return v === null ? true : v !== "false";
    }
    set closeOnEscape(v) {
        if (v === false || v === "false") {
            this.setAttribute("close-on-escape", "false");
        } else {
            this.removeAttribute("close-on-escape");
        }
    }

    /** Whether a click outside the popover/anchor closes it. Defaults to `true`. */
    get closeOnOutsideClick() {
        const v = this.getAttribute("close-on-outside-click");
        return v === null ? true : v !== "false";
    }
    set closeOnOutsideClick(v) {
        if (v === false || v === "false") {
            this.setAttribute("close-on-outside-click", "false");
        } else {
            this.removeAttribute("close-on-outside-click");
        }
    }

    /** Delay in ms before closing on hover/focus release. */
    get delayHide() {
        const v = parseInt(this.getAttribute("delay-hide"), 10);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    }
    set delayHide(v) {
        if (v == null) this.removeAttribute("delay-hide");
        else this.setAttribute("delay-hide", String(v));
    }

    /** Delay in ms before opening on hover/focus. */
    get delayShow() {
        const v = parseInt(this.getAttribute("delay-show"), 10);
        return Number.isFinite(v) && v >= 0 ? v : 0;
    }
    set delayShow(v) {
        if (v == null) this.removeAttribute("delay-show");
        else this.setAttribute("delay-show", String(v));
    }

    /** When true, triggers and `show()` become no-ops and an open popover closes. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(v) {
        if (v) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /**
     * When `true`, traps focus inside the popover, sets `role="dialog"` +
     * `aria-modal="true"`, and (by default) renders the backdrop. Escape
     * always closes a modal popover. Off by default.
     */
    get modal() {
        return this.hasAttribute("modal");
    }
    set modal(v) {
        if (v) this.setAttribute("modal", "");
        else this.removeAttribute("modal");
    }

    /** Pixel gap between the anchor and the popover edge. */
    get offset() {
        const v = parseInt(this.getAttribute("offset"), 10);
        if (Number.isFinite(v) && v >= 0) return v;
        return this._cssNumber("--component-popover-offset", 8);
    }
    set offset(v) {
        if (v == null) this.removeAttribute("offset");
        else this.setAttribute("offset", String(v));
    }

    /** Reflects whether the popover is currently visible. */
    get open() {
        return this._open;
    }
    set open(v) {
        if (v) this.show();
        else this.hide("api");
    }

    /** Render the pointer/arrow connecting the popover to its anchor. */
    get pointer() {
        const v = this.getAttribute("pointer");
        return v === null ? true : v !== "false";
    }
    set pointer(v) {
        if (v === false || v === "false") {
            this.setAttribute("pointer", "false");
        } else if (v === true || v === "" || v == null) {
            this.removeAttribute("pointer");
        } else {
            this.setAttribute("pointer", String(v));
        }
    }

    /**
     * Render the popover surface into `document.body`, escaping ancestor
     * `overflow` / `clip-path` / `z-index` / stacking-context constraints.
     * Off by default; opt in when an ancestor would clip or out-stack the
     * popover. Tradeoff: the surface loses CSS-variable inheritance from
     * its original ancestor chain.
     */
    get portal() {
        return (
            this.hasAttribute("portal") &&
            this.getAttribute("portal") !== "false"
        );
    }
    set portal(v) {
        if (v === false || v === "false") this.removeAttribute("portal");
        else if (v === true || v === "" || v === "true")
            this.setAttribute("portal", "");
        else this.removeAttribute("portal");
    }

    /** Requested placement relative to the anchor. */
    get position() {
        const v = this.getAttribute("position");
        return v && VALID_POSITIONS.has(v) ? v : "auto";
    }
    set position(v) {
        if (v == null) this.removeAttribute("position");
        else this.setAttribute("position", String(v));
    }

    /**
     * Render the dim backdrop behind the popover. Implicitly `true` when
     * `modal` is set; explicit `show-backdrop="false"` opts out of the
     * backdrop even in modal mode.
     */
    get showBackdrop() {
        const v = this.getAttribute("show-backdrop");
        if (v === "false") return false;
        if (v !== null) return true;
        return this.modal;
    }
    set showBackdrop(v) {
        if (v === false || v === "false") {
            this.setAttribute("show-backdrop", "false");
        } else if (v === true || v === "" || v === "true") {
            this.setAttribute("show-backdrop", "");
        } else {
            this.removeAttribute("show-backdrop");
        }
    }

    /** Size variant — controls padding, font-size, and max-width. */
    get size() {
        const v = this.getAttribute("size");
        return v && SIZES.has(v) ? v : "medium";
    }
    set size(v) {
        if (v == null) this.removeAttribute("size");
        else this.setAttribute("size", String(v));
    }

    /** Simple text content for the default slot. */
    get text() {
        return this.getAttribute("text") || "";
    }
    set text(v) {
        if (v == null) this.removeAttribute("text");
        else this.setAttribute("text", String(v));
    }

    /**
     * Space-separated list of activation modes. Any subset of
     * `"click"`, `"hover"`, `"focus"`, `"context-menu"`, `"manual"`.
     * Defaults to `"manual"` — only `show()`/`hide()`/`open` control state.
     */
    get trigger() {
        return this.getAttribute("trigger") || "manual";
    }
    set trigger(v) {
        if (v == null) this.removeAttribute("trigger");
        else this.setAttribute("trigger", String(v));
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Close the popover. Resolves `true` once closed, `false` if cancelled. */
    async hide(reason = "api") {
        if (!this._open) return false;

        const beforeClose = new CustomEvent("popover-close", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { reason },
        });
        if (!this.dispatchEvent(beforeClose)) return false;

        // Decide whether to restore focus *before* mutating state so
        // `_isInsidePopover` can still consult the live DOM. Modal always
        // restores; non-modal only restores when focus was inside the
        // popover at close time.
        const restoreFocus =
            this.modal || this._isInsidePopover(this._deepActiveElement());

        this._open = false;
        this._hovering = false;
        this._focusing = false;
        this._cancelShow();
        this._cancelHide();
        this._detachDocumentListeners();
        this._stopObservers();
        this._surface.hidden = true;

        if (this._portalContainer) this._deactivatePortal();
        this._updateBackdrop();

        if (restoreFocus) this._restoreFocus();
        this._previousFocus = null;

        this._syncAriaOnAnchor(false);

        this._suppressAttrEcho = true;
        this.removeAttribute("open");
        this._suppressAttrEcho = false;

        this.dispatchEvent(
            new CustomEvent("popover-closed", {
                bubbles: true,
                composed: true,
                detail: { reason },
            }),
        );
        return true;
    }

    /** Open the popover. Resolves `true` once positioned, `false` if cancelled. */
    async show(detail = { trigger: "manual" }) {
        if (this._open) return false;
        if (this.disabled) return false;

        const beforeOpen = new CustomEvent("popover-open", {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail,
        });
        if (!this.dispatchEvent(beforeOpen)) return false;

        if (!this._anchorEl) this._resolveAnchor();

        // Capture the previously-focused element before the open. Modal
        // popovers always restore on close; non-modal only restore if focus
        // ended up inside the popover.
        this._previousFocus = this._deepActiveElement();

        this._open = true;
        this._surface.hidden = false;

        this._suppressAttrEcho = true;
        this.setAttribute("open", "");
        this._suppressAttrEcho = false;

        this._applyModalAttrs();
        if (this.portal) this._activatePortal();
        this._updateBackdrop();
        this._startObservers();
        this._attachDocumentListeners();
        this._syncAriaOnAnchor(true);

        // Position after the surface is unhidden so getBoundingClientRect
        // reads a real size, then await one rAF so callers can synchronously
        // measure the surface after `await popover.show()`.
        const placedSide = this.updatePosition();
        await new Promise((resolve) => requestAnimationFrame(resolve));

        if (this.modal) this._focusFirstInPopover();

        this.dispatchEvent(
            new CustomEvent("popover-opened", {
                bubbles: true,
                composed: true,
                detail: { position: placedSide || this.position },
            }),
        );
        return true;
    }

    /** Set the anchor programmatically. */
    setAnchor(value) {
        this._suppressAttrEcho = true;
        if (value instanceof Element) {
            this._anchorProperty = value;
            this.removeAttribute("anchor");
        } else if (value == null) {
            this._anchorProperty = null;
            this.removeAttribute("anchor");
        } else {
            this._anchorProperty = null;
            this.setAttribute("anchor", String(value));
        }
        this._suppressAttrEcho = false;
        // _resolveAnchor handles the popover-anchor-change dispatch and
        // calls updatePosition when open.
        this._resolveAnchor();
    }

    /** Flip the open state. */
    async toggle() {
        return this._open ? this.hide("api") : this.show();
    }

    /** Recompute the popover's position immediately. Returns the resolved side. */
    updatePosition() {
        if (!this._open || !this._surface) return null;

        const surface = this._surface;
        // Lay out at viewport origin to read accurate measurements.
        surface.style.transform = "";
        surface.style.top = "0px";
        surface.style.left = "0px";
        const rect = surface.getBoundingClientRect();
        const size = { width: rect.width, height: rect.height };

        // `position: fixed` is relative to the nearest transformed ancestor
        // (transform/filter/perspective/contain make an element the
        // containing block for fixed descendants — CSS Transforms spec).
        // Storybook's docs preview wraps every story in a transformed div,
        // so we subtract that ancestor's viewport offset to keep computed
        // viewport coords landing where they should. When no transformed
        // ancestor exists the offset is (0, 0), and behavior is unchanged.
        const cb = this._containingBlockOffset();

        if (!this._anchorEl) {
            // Centered fallback when no anchor resolves.
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            surface.style.top = `${Math.max(8, (vh - size.height) / 2) - cb.y}px`;
            surface.style.left = `${Math.max(8, (vw - size.width) / 2) - cb.x}px`;
            this._pointerEl.hidden = true;
            return null;
        }

        const anchorRect = this._anchorEl.getBoundingClientRect();
        const result = computePosition(anchorRect, size, {
            position: this.position,
            offset: this.offset,
        });

        surface.style.top = `${result.top - cb.y}px`;
        surface.style.left = `${result.left - cb.x}px`;

        this._positionPointer(
            result.side,
            anchorRect,
            result,
            size,
            result.fits,
        );
        return result.side;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _activatePortal() {
        if (this._portalContainer) return;
        if (!this._surface) return;

        const portal = document.createElement("div");
        portal.className = "y-popover-portal";
        portal.dataset.popoverId = String(this._instanceId);
        const shadow = portal.attachShadow({ mode: "open" });
        // Share the original stylesheet so all CSS (surface, backdrop,
        // pointer, slot empty-state hides) continues to apply.
        shadow.adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets;

        // Move the surface + backdrop into the portal's shadow root. Moving
        // (not cloning) preserves listener identity, attribute observers,
        // and current style/state.
        shadow.appendChild(this._backdropEl);
        shadow.appendChild(this._surface);

        // Move slotted body/header/footer children from light DOM into the
        // portal container so the slots inside the portaled surface can
        // compose them. The trigger stays put — it is the anchor.
        const movedChildren = [];
        for (const child of Array.from(this.children)) {
            if (child.matches && child.matches('[slot="trigger"]')) continue;
            movedChildren.push(child);
            portal.appendChild(child);
        }
        this._portalLightChildren = movedChildren;

        this._resolveMountPoint().appendChild(portal);
        this._portalContainer = portal;
        this._portalShadow = shadow;
    }

    _applyModalAttrs() {
        const surface = this._surface;

        if (!surface) return;
        if (this.modal) {
            surface.setAttribute("role", "dialog");
            surface.setAttribute("aria-modal", "true");
        } else {
            surface.setAttribute("role", "tooltip");
            surface.removeAttribute("aria-modal");
        }
    }

    _applySurfaceAttrs() {
        const surface = this._surface;
        if (!surface) return;

        const sizeVal = this.size;
        surface.dataset.size = sizeVal;

        // For "base" (or unknown) the popover wears its default surface
        // tokens — a white/dark themed background, not a content fill. Only
        // tinted schemes (primary/error/…) and safe CSS literals override
        // the bg + fg pair. Set the vars on the surface itself (not the
        // host) so the tint follows it into the portal's shadow root.
        const color = this.color;
        if (
            color === "base" ||
            (!NAMED_COLORS.has(color) && !isSafeCssColor(color))
        ) {
            surface.style.removeProperty("--_popover-bg");
            surface.style.removeProperty("--_popover-color");
        } else {
            const [bg, fg] = getColorVarPair(color);
            surface.style.setProperty("--_popover-bg", bg);
            surface.style.setProperty("--_popover-color", fg);
        }

        // Pointer visibility is decided on every reposition (also tied to
        // whether an anchor resolved), but mirror the attribute now so the
        // initial render is correct before the first updatePosition pass.
        if (this._pointerEl) this._pointerEl.hidden = !this.pointer;
    }

    _attachDocumentListeners() {
        document.addEventListener("click", this._onDocumentClick, true);
        document.addEventListener("keydown", this._onDocumentKeydown, true);
    }

    _attachTriggerListeners() {
        const anchor = this._anchorEl;
        if (!anchor) return;
        const modes = this._triggerSet;

        if (modes.has("click")) {
            anchor.addEventListener("click", this._onAnchorClick);
        }
        if (modes.has("hover")) {
            anchor.addEventListener("mouseenter", this._onAnchorEnter);
            anchor.addEventListener("mouseleave", this._onAnchorLeave);
        }
        if (modes.has("focus")) {
            anchor.addEventListener("focusin", this._onAnchorFocus);
            anchor.addEventListener("focusout", this._onAnchorBlur);
        }
        if (modes.has("context-menu")) {
            anchor.addEventListener("contextmenu", this._onAnchorContextMenu);
        }
        this._listenedAnchor = anchor;
    }

    _cancelHide() {
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = 0;
        }
    }

    _cancelShow() {
        if (this._showTimer) {
            clearTimeout(this._showTimer);
            this._showTimer = 0;
        }
    }

    _containingBlockOffset() {
        // Walk the flattened DOM ancestry to find the nearest element that
        // establishes a containing block for `position: fixed`. Returns its
        // viewport-coord top-left so the caller can subtract it from computed
        // viewport coords.
        let el = this._portalContainer
            ? this._portalContainer
            : this.parentElement;
        while (el) {
            const cs = getComputedStyle(el);
            const willChange = cs.willChange || "";
            const contain = cs.contain || "";
            if (
                cs.transform !== "none" ||
                cs.perspective !== "none" ||
                cs.filter !== "none" ||
                cs.backdropFilter !== "none" ||
                willChange.includes("transform") ||
                willChange.includes("filter") ||
                willChange.includes("perspective") ||
                contain.includes("paint") ||
                contain.includes("layout") ||
                contain.includes("strict") ||
                contain.includes("content")
            ) {
                const r = el.getBoundingClientRect();
                return { x: r.left, y: r.top };
            }
            el = el.parentElement;
        }
        return { x: 0, y: 0 };
    }

    _cssNumber(varName, fallback) {
        const styles = getComputedStyle(this);
        const raw = styles.getPropertyValue(varName).trim();
        const parsed = parseFloat(raw);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    _deactivatePortal() {
        if (!this._portalContainer) return;

        // Move the slotted children back to the host first so they remain
        // in document order when we move the surface back.
        if (this._portalLightChildren) {
            for (const child of this._portalLightChildren) {
                this.appendChild(child);
            }
            this._portalLightChildren = null;
        }

        // Move surface + backdrop back to the original shadow root.
        if (this._backdropEl) this.shadowRoot.appendChild(this._backdropEl);
        if (this._surface) this.shadowRoot.appendChild(this._surface);

        this._portalContainer.remove();
        this._portalContainer = null;
        this._portalShadow = null;
    }

    _deepActiveElement() {
        // document.activeElement only sees the outermost host across shadow
        // boundaries; recurse so that focus inside a custom element resolves
        // to the real focused node.
        let el = document.activeElement;
        while (el && el.shadowRoot && el.shadowRoot.activeElement) {
            el = el.shadowRoot.activeElement;
        }
        return el;
    }

    _detachDocumentListeners() {
        document.removeEventListener("click", this._onDocumentClick, true);
        document.removeEventListener("keydown", this._onDocumentKeydown, true);
    }

    _detachTriggerListeners(anchor) {
        if (!anchor) return;
        anchor.removeEventListener("click", this._onAnchorClick);
        anchor.removeEventListener("mouseenter", this._onAnchorEnter);
        anchor.removeEventListener("mouseleave", this._onAnchorLeave);
        anchor.removeEventListener("focusin", this._onAnchorFocus);
        anchor.removeEventListener("focusout", this._onAnchorBlur);
        anchor.removeEventListener("contextmenu", this._onAnchorContextMenu);
        if (this._listenedAnchor === anchor) {
            this._listenedAnchor = null;
        }
    }

    _focusableInPopover() {
        const sel = [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]',
            // YumeKit interactive custom elements that delegate focus through
            // their inner controls.
            "y-button:not([disabled])",
            "y-input:not([disabled])",
            "y-textarea:not([disabled])",
            "y-select:not([disabled])",
            "y-checkbox:not([disabled])",
            "y-radio:not([disabled])",
            "y-switch:not([disabled])",
        ].join(",");
        // When portaled, the slotted body/header/footer children live as
        // light-DOM children of the portal container instead of the host.
        const root = this._portalContainer || this;
        return Array.from(root.querySelectorAll(sel)).filter(
            (el) => !el.closest('[slot="trigger"]'),
        );
    }

    _focusEl(el) {
        if (!el) return;
        // Custom elements without delegatesFocus need help forwarding focus
        // into their internal focusable. Walk one shadow root deep — enough
        // for the YumeKit components used as popover content today.
        const inner = el.shadowRoot?.querySelector(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        (inner || el).focus({ preventScroll: true });
    }

    _focusFirstInPopover() {
        const focusables = this._focusableInPopover();
        if (focusables.length > 0) {
            this._focusEl(focusables[0]);
            return;
        }
        // Nothing tabbable; focus the surface itself so screen readers
        // announce the dialog and Escape still works.
        if (this._surface && !this._surface.hasAttribute("tabindex")) {
            this._surface.setAttribute("tabindex", "-1");
        }
        this._focusEl(this._surface);
    }

    _isInsidePopover(el) {
        if (!el) return false;
        // Walk up through nested shadow boundaries so that focus inside a
        // slotted child's own shadow root (e.g. the inner <button> of a
        // <y-button> footer action) still resolves as "inside the popover".
        // In portal mode the surface, backdrop, and slotted body/header/
        // footer children all live under `_portalContainer` instead of `this`.
        const portal = this._portalContainer;
        const portalShadow = this._portalShadow;
        let node = el;
        while (node) {
            if (node === this) return true;
            if (this.contains(node)) return true;
            if (this.shadowRoot && this.shadowRoot.contains(node)) return true;
            if (portal && (node === portal || portal.contains(node)))
                return true;
            if (portalShadow && portalShadow.contains(node)) return true;
            const root = node.getRootNode();
            if (root instanceof ShadowRoot) {
                node = root.host;
            } else {
                return false;
            }
        }
        return false;
    }

    _onAnchorBlur(e) {
        if (!this._triggerSet.has("focus")) return;
        if (this._isInsidePopover(e.relatedTarget)) return;
        this._focusing = false;
        this._cancelShow();
        this._scheduleHide("blur");
    }

    _onAnchorClick() {
        if (this.disabled) return;
        if (!this._triggerSet.has("click")) return;
        if (!this._open) {
            this.show({ trigger: "click" });
        } else if (this.closeOnAnchorClick) {
            this.hide("anchor-click");
        }
    }

    _onAnchorContextMenu(e) {
        if (this.disabled) return;
        if (!this._triggerSet.has("context-menu")) return;
        e.preventDefault();
        if (this._open) {
            this.updatePosition();
        } else {
            this.show({ trigger: "context-menu" });
        }
    }

    _onAnchorEnter() {
        if (this.disabled) return;
        if (!this._triggerSet.has("hover")) return;
        this._hovering = true;
        this._cancelHide();
        this._scheduleShow({ trigger: "hover" });
    }

    _onAnchorFocus() {
        if (this.disabled) return;
        if (!this._triggerSet.has("focus")) return;
        this._focusing = true;
        this._cancelHide();
        this._scheduleShow({ trigger: "focus" });
    }

    _onAnchorLeave() {
        if (!this._triggerSet.has("hover")) return;
        this._hovering = false;
        this._cancelShow();
        this._scheduleHide("blur");
    }

    _onBackdropClick() {
        if (!this._open) return;
        if (!this.closeOnOutsideClick) return;
        this.hide("outside");
    }

    _onDocumentClick(e) {
        if (!this._open) return;
        if (!this.closeOnOutsideClick) return;
        const path = e.composedPath();
        if (this._surface && path.includes(this._surface)) return;
        if (this._anchorEl && path.includes(this._anchorEl)) return;
        this.hide("outside");
    }

    _onDocumentKeydown(e) {
        if (!this._open) return;

        if (e.key === "Escape") {
            // Modal popovers honor Escape regardless of close-on-escape;
            // non-modal respects the attribute.
            if (!this.modal && !this.closeOnEscape) return;
            e.preventDefault();
            this.hide("escape");
            return;
        }

        if (this.modal && e.key === "Tab") {
            this._trapTab(e);
        }
    }

    _onSurfaceEnter() {
        if (!this._triggerSet.has("hover")) return;
        this._hovering = true;
        this._cancelHide();
    }

    _onSurfaceFocusIn() {
        if (!this._triggerSet.has("focus")) return;
        this._focusing = true;
        this._cancelHide();
    }

    _onSurfaceFocusOut(e) {
        if (!this._triggerSet.has("focus")) return;
        if (this._isInsidePopover(e.relatedTarget)) return;
        this._focusing = false;
        this._scheduleHide("blur");
    }

    _onSurfaceLeave() {
        if (!this._triggerSet.has("hover")) return;
        this._hovering = false;
        this._scheduleHide("blur");
    }

    _onTriggerSlotChange() {
        // Only fall back to the slotted trigger when no explicit anchor wins.
        const hasExplicit =
            this._anchorProperty instanceof Element ||
            (this.hasAttribute("anchor") && this.getAttribute("anchor") !== "");
        if (hasExplicit) return;
        this._resolveAnchor();
    }

    _onWindowChange() {
        this._scheduleReposition();
    }

    _parseTriggerAttr(value) {
        const set = new Set();
        if (typeof value === "string" && value.trim()) {
            for (const token of value.trim().split(/\s+/)) {
                if (VALID_TRIGGERS.has(token)) set.add(token);
            }
        }
        if (set.size === 0) set.add("manual");
        return set;
    }

    _positionPointer(side, anchorRect, placement, floatingSize, fits = true) {
        const ptr = this._pointerEl;
        if (!ptr) return;
        if (!this.pointer) {
            ptr.hidden = true;
            return;
        }
        // When no candidate side fits, the popover landed on its best-fit
        // option and the pointer is no longer reliably attached to the
        // anchor's edge — hide it rather than have it dangle.
        if (!fits) {
            ptr.hidden = true;
            return;
        }

        ptr.hidden = false;
        ptr.dataset.side = side;
        ptr.style.top = "";
        ptr.style.left = "";
        ptr.style.right = "";
        ptr.style.bottom = "";

        const pointerSize = this._cssNumber(
            "--component-popover-pointer-size",
            10,
        );
        const half = pointerSize / 2;
        const { axis, offset } = pointerOffsetFor(
            side,
            anchorRect,
            placement,
            floatingSize,
            pointerSize,
        );

        if (side === "top") {
            ptr.style.bottom = `-${half}px`;
            ptr.style.left = `${offset}px`;
        } else if (side === "bottom") {
            ptr.style.top = `-${half}px`;
            ptr.style.left = `${offset}px`;
        } else if (side === "left") {
            ptr.style.right = `-${half}px`;
            ptr.style.top = `${offset}px`;
        } else {
            ptr.style.left = `-${half}px`;
            ptr.style.top = `${offset}px`;
        }
        // Acknowledge `axis` — currently informational; reserved for future
        // pointer-arrow variants that align along a single CSS dimension.
        void axis;
    }

    _render() {
        if (this.shadowRoot.firstChild) return;

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(this._styles());
        this.shadowRoot.adoptedStyleSheets = [sheet];

        // The trigger slot lives in light DOM next to the popover so it
        // participates in normal layout — most consumers either wrap a
        // trigger element directly or anchor by id.
        const triggerSlot = _el("slot", { name: "trigger", part: "trigger" });
        triggerSlot.addEventListener("slotchange", this._onTriggerSlotChange);

        const surfaceId = `y-popover-surface-${this._instanceId}`;
        const bodyId = `y-popover-body-${this._instanceId}`;
        const headerId = `y-popover-header-${this._instanceId}`;

        const headerSlot = _el("slot", {
            name: "header",
            part: "header",
            class: "header",
            id: headerId,
        });
        headerSlot.addEventListener("slotchange", () => {
            this._refreshSlotState(headerSlot);
            if (this._open) this.updatePosition();
        });

        const bodyWrap = _el("div", {
            class: "body",
            part: "body",
            id: bodyId,
        });
        const bodySlot = _el("slot");
        // Fallback span renders the `text` attribute when the default slot
        // has no assigned content (web-components built-in slot fallback).
        const textFallback = _el("span", { class: "text-fallback" });
        textFallback.textContent = this.text;
        bodySlot.appendChild(textFallback);
        bodyWrap.appendChild(bodySlot);

        const footerSlot = _el("slot", {
            name: "footer",
            part: "footer",
            class: "footer",
        });
        footerSlot.addEventListener("slotchange", () => {
            this._refreshSlotState(footerSlot);
            if (this._open) this.updatePosition();
        });

        const pointerSlot = _el("slot", { name: "pointer" });
        const defaultPointer = _el("div", {
            class: "pointer",
            part: "pointer",
        });
        pointerSlot.appendChild(defaultPointer);

        const surface = _el(
            "div",
            {
                class: "surface",
                part: "surface",
                id: surfaceId,
                role: "tooltip",
                "aria-labelledby": headerId,
                "aria-describedby": bodyId,
                hidden: true,
            },
            [headerSlot, bodyWrap, footerSlot, pointerSlot],
        );

        const backdrop = _el("div", {
            class: "backdrop",
            part: "backdrop",
            "aria-hidden": "true",
            hidden: true,
        });
        backdrop.addEventListener("click", this._onBackdropClick);

        this._surface = surface;
        this._backdropEl = backdrop;
        this._pointerEl = defaultPointer;
        this._textFallback = textFallback;

        // Surface listeners are attached once and stay active for the
        // lifetime of the element — the handlers themselves bail when the
        // current trigger set does not include hover or focus.
        surface.addEventListener("mouseenter", this._onSurfaceEnter);
        surface.addEventListener("mouseleave", this._onSurfaceLeave);
        surface.addEventListener("focusin", this._onSurfaceFocusIn);
        surface.addEventListener("focusout", this._onSurfaceFocusOut);

        // Backdrop renders before the surface in source order so the surface
        // stacks naturally on top within the same z-index context.
        this.shadowRoot.append(triggerSlot, backdrop, surface);

        this._applySurfaceAttrs();
        this._applyModalAttrs();
    }

    _resolveAnchor() {
        const previous = this._anchorEl;
        let next = null;

        if (this._anchorProperty instanceof Element) {
            next = this._anchorProperty;
        } else {
            const attr = this.getAttribute("anchor");
            if (attr) {
                next = this._resolveAnchorString(attr);
            } else {
                const slotted = this.querySelector(':scope > [slot="trigger"]');
                if (slotted) next = slotted;
            }
        }

        if (next === previous) return;

        this._detachTriggerListeners(previous);
        if (previous && this._open) this._syncAriaOnAnchor(false, previous);

        this._anchorEl = next;
        this._attachTriggerListeners();

        if (this._open) {
            this.updatePosition();
            this._syncAriaOnAnchor(true);
        }
        if (previous || next) {
            this.dispatchEvent(
                new CustomEvent("popover-anchor-change", {
                    bubbles: true,
                    composed: true,
                    detail: { from: previous, to: next },
                }),
            );
        }
    }

    _refreshSlotState(slot) {
        const hasContent = slot
            .assignedNodes({ flatten: true })
            .some(
                (n) =>
                    !(
                        n.nodeType === Node.TEXT_NODE &&
                        n.textContent.trim() === ""
                    ),
            );
        slot.classList.toggle("has-content", hasContent);
    }

    _resolveMountPoint() {
        return resolveThemeMountPoint(this);
    }

    _restoreFocus() {
        const target = this._previousFocus;
        if (!target) return;
        if (typeof target.focus !== "function") return;
        if (!document.contains(target)) return;
        this._focusEl(target);
    }

    _resolveAnchorString(value) {
        // Bare identifiers route through getElementById for the common case;
        // anything containing selector punctuation goes through querySelector.
        if (/^[A-Za-z][\w-]*$/.test(value)) {
            const byId = document.getElementById(value);
            if (byId) return byId;
        }
        try {
            return document.querySelector(value);
        } catch {
            return null;
        }
    }

    _scheduleHide(reason) {
        if (!this._open) return;
        // Persistent triggers (hover and focus) hold the popover open as long
        // as the pointer or focus rests on the anchor or surface — bail when
        // either is currently engaged.
        if (this._hovering || this._focusing) return;
        this._cancelShow();
        if (this._hideTimer) return;

        const delay = this.delayHide;
        this._hideTimer = setTimeout(() => {
            this._hideTimer = 0;
            // Re-check at fire time so a follow-up enter inside the delay
            // window keeps the popover open.
            if (this._hovering || this._focusing) return;
            this.hide(reason);
        }, delay);
    }

    _scheduleReposition() {
        if (this._rafId) return;
        this._rafId = requestAnimationFrame(() => {
            this._rafId = 0;
            if (this._open) this.updatePosition();
        });
    }

    _scheduleShow(detail) {
        if (this._open) return;
        if (this.disabled) return;
        this._cancelHide();
        if (this._showTimer) return;

        const delay = this.delayShow;
        if (delay <= 0) {
            this.show(detail);
            return;
        }
        this._showTimer = setTimeout(() => {
            this._showTimer = 0;
            this.show(detail);
        }, delay);
    }

    _startObservers() {
        window.addEventListener("resize", this._onWindowChange);
        window.addEventListener("scroll", this._onWindowChange, true);

        if (typeof ResizeObserver !== "undefined") {
            this._resizeObserver = new ResizeObserver(this._onWindowChange);
            if (this._anchorEl) this._resizeObserver.observe(this._anchorEl);
            if (this._surface) this._resizeObserver.observe(this._surface);
        }
    }

    _stopObservers() {
        window.removeEventListener("resize", this._onWindowChange);
        window.removeEventListener("scroll", this._onWindowChange, true);
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = 0;
        }
    }

    _styles() {
        return `
            :host([hidden]) {
                display: none;
            }

            :host {
                display: contents;
            }

            .backdrop {
                position: fixed;
                inset: 0;
                background: var(--component-popover-backdrop, rgba(0, 0, 0, 0.4));
                backdrop-filter: blur(var(--component-popover-backdrop-blur, 0));
                -webkit-backdrop-filter: blur(var(--component-popover-backdrop-blur, 0));
                /* Sit one z-stack below the surface but in the same context. */
                z-index: calc(var(--component-popover-z-index, 7500) - 1);
            }

            .backdrop[hidden] {
                display: none;
            }

            .surface {
                position: fixed;
                top: 0;
                left: 0;
                z-index: var(--component-popover-z-index, 7500);
                box-sizing: border-box;
                background: var(--_popover-bg, var(--component-popover-background, var(--base-background-component, #fff)));
                color: var(--_popover-color, var(--component-popover-color, var(--base-content--, #1a1a1a)));
                border: 1px solid var(--component-popover-border-color, var(--base-border, rgba(0, 0, 0, 0.12)));
                border-width: var(--component-popover-border-width, 1px);
                border-radius: var(--component-popover-border-radius, 8px);
                box-shadow: var(--component-popover-shadow, 0 8px 32px rgba(0, 0, 0, 0.18));
                min-width: var(--component-popover-min-width, auto);
                max-width: var(--component-popover-max-width, 320px);
                font-family: var(--font-family-body, system-ui, sans-serif);
                font-size: var(--component-popover-font-size-medium, 0.95rem);
                padding: var(--component-popover-padding-medium, 12px);
                display: grid;
                gap: var(--spacing-x-small, 6px);
                pointer-events: auto;
            }

            .surface[hidden] {
                display: none;
            }

            .surface[data-size="small"] {
                font-size: var(--component-popover-font-size-small, 0.85rem);
                padding: var(--component-popover-padding-small, 8px);
            }

            .surface[data-size="large"] {
                font-size: var(--component-popover-font-size-large, 1.05rem);
                padding: var(--component-popover-padding-large, 16px);
            }

            .header {
                display: block;
                font-weight: var(--font-weight-heading, 600);
                padding-bottom: var(--spacing-x-small, 6px);
                border-bottom: 1px solid var(--component-popover-header-divider-color, var(--base-border, rgba(0, 0, 0, 0.08)));
            }

            .header:not(.has-content),
            .footer:not(.has-content) {
                display: none;
            }

            .body {
                display: block;
                line-height: 1.5;
            }

            .footer {
                display: flex;
                gap: var(--spacing-x-small, 6px);
                justify-content: flex-end;
                padding-top: var(--spacing-x-small, 6px);
                border-top: 1px solid var(--component-popover-header-divider-color, var(--base-border, rgba(0, 0, 0, 0.08)));
            }

            .pointer {
                position: absolute;
                width: var(--component-popover-pointer-size, 10px);
                height: var(--component-popover-pointer-size, 10px);
                /* Mirror the surface bg fallback chain so dark themes render
                   the pointer against the dark surface, not white. */
                background: var(--component-popover-pointer-color, var(--_popover-bg, var(--component-popover-background, var(--base-background-component, #fff))));
                border: var(--component-popover-border-width, 1px) solid var(--component-popover-pointer-border-color, var(--component-popover-border-color, var(--base-border, rgba(0, 0, 0, 0.12))));
                transform: rotate(45deg);
                pointer-events: none;
            }

            .pointer[hidden] { display: none; }

            /* Hide the two inward-facing edges per side so the rotated square
               reads as a tail extending the surface's border, not a diamond. */
            .pointer[data-side="top"] {
                border-top-color: transparent;
                border-left-color: transparent;
            }
            .pointer[data-side="bottom"] {
                border-right-color: transparent;
                border-bottom-color: transparent;
            }
            .pointer[data-side="left"] {
                border-bottom-color: transparent;
                border-left-color: transparent;
            }
            .pointer[data-side="right"] {
                border-top-color: transparent;
                border-right-color: transparent;
            }

            ::slotted([slot="header"]),
            ::slotted([slot="footer"]) {
                margin: 0;
            }

            @media (prefers-reduced-motion: reduce) {
                .surface { transition: none; }
            }
        `;
    }

    _syncAriaOnAnchor(open, target) {
        const anchor = target || this._anchorEl;
        if (!anchor || !this._surface) return;
        const surfaceId = this._surface.id;

        if (open) {
            this._previousAriaDescribedby =
                anchor.getAttribute("aria-describedby");
            const existing = this._previousAriaDescribedby || "";
            const merged = existing
                ? existing.split(/\s+/).includes(surfaceId)
                    ? existing
                    : `${existing} ${surfaceId}`
                : surfaceId;
            anchor.setAttribute("aria-describedby", merged);
        } else {
            const current = anchor.getAttribute("aria-describedby") || "";
            const restored = current
                .split(/\s+/)
                .filter((id) => id && id !== surfaceId)
                .join(" ");
            if (restored) anchor.setAttribute("aria-describedby", restored);
            else anchor.removeAttribute("aria-describedby");
            this._previousAriaDescribedby = null;
        }
    }

    _trapTab(e) {
        const focusables = this._focusableInPopover();
        if (focusables.length === 0) {
            e.preventDefault();
            this._focusEl(this._surface);
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = this._deepActiveElement();
        const insidePopover = this._isInsidePopover(active);

        // When the focused element is the inner control of a slotted custom
        // element (e.g. <y-button>'s inner <button>), strict equality with
        // `first`/`last` (the slotted host) fails. Compare against either
        // the host itself or anything inside its shadow root.
        const isFirst = isOrShadowContains(first, active);
        const isLast = isOrShadowContains(last, active);

        if (e.shiftKey) {
            if (!insidePopover || isFirst) {
                e.preventDefault();
                this._focusEl(last);
            }
        } else {
            if (!insidePopover || isLast) {
                e.preventDefault();
                this._focusEl(first);
            }
        }
    }

    _updateBackdrop() {
        if (!this._backdropEl) return;
        this._backdropEl.hidden = !this._open || !this.showBackdrop;
    }
}

if (!customElements.get("y-popover")) {
    customElements.define("y-popover", YumePopover);
}
