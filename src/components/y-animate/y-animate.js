import { createElement as _el } from "../../modules/helpers.js";

const DEFAULT_DURATION = 300;
const DEFAULT_DELAY = 0;
const DEFAULT_STAGGER_DELAY = 50;
const DEFAULT_EASING = "ease-out";

const ANIMATION_PRESETS = new Set([
    "fade",
    "slide",
    "zoom-in",
    "zoom-out",
    "flip-horizontal",
    "flip-vertical",
    "rotate-in",
    "bounce",
    "shake",
    "scale",
]);

const TRIGGERS = new Set(["load", "visible", "manual"]);
const DIRECTIONS = new Set(["up", "down", "left", "right"]);

export class YumeAnimate extends HTMLElement {
    static get observedAttributes() {
        return [
            "animation",
            "direction",
            "duration",
            "delay",
            "easing",
            "trigger",
            "once",
            "reverse",
            "stagger",
            "stagger-delay",
            "disabled",
            "hidden",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._animations = new Set();
        this._observer = null;
        this._hasPlayed = false;
        this.render();
    }

    connectedCallback() {
        this._setupTrigger();
    }

    disconnectedCallback() {
        this._teardownTrigger();
        this._cancelAll(false);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (!this.isConnected) return;
        if (name === "trigger") {
            this._teardownTrigger();
            this._setupTrigger();
            return;
        }
        // Stop any in-flight animation when the host is hidden or disabled
        // mid-flight, and emit `animation-cancel` so consumers can react to
        // the abort the same way they would for an explicit abort() call.
        if (
            (name === "hidden" || name === "disabled") &&
            newValue !== null
        ) {
            this._cancelAll(true);
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** Preset animation name. Falls back to "fade" for unknown values. */
    get animation() {
        const v = this.getAttribute("animation");
        return ANIMATION_PRESETS.has(v) ? v : "fade";
    }
    set animation(val) {
        this.setAttribute("animation", val);
    }

    /** Delay before the animation starts in milliseconds. */
    get delay() {
        const n = parseFloat(this.getAttribute("delay"));
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DELAY;
    }
    set delay(val) {
        this.setAttribute("delay", String(val));
    }

    /** Direction used by `slide`, `bounce`, and `shake`. Other animations ignore it. */
    get direction() {
        const v = this.getAttribute("direction");
        return DIRECTIONS.has(v) ? v : "up";
    }
    set direction(val) {
        this.setAttribute("direction", val);
    }

    /** Disables animation playback entirely. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /**
     * Duration of the animation in milliseconds. Falls back to the
     * `--component-animate-duration` token, then to `DEFAULT_DURATION`,
     * so themes can shift the default without a per-instance attribute.
     */
    get duration() {
        const n = parseFloat(this.getAttribute("duration"));
        if (Number.isFinite(n) && n > 0) return n;
        return this._readNumberToken(
            "--component-animate-duration",
            DEFAULT_DURATION,
        );
    }
    set duration(val) {
        this.setAttribute("duration", String(val));
    }

    /** Easing function (CSS easing keyword, `cubic-bezier(...)`, or `steps(...)`). */
    get easing() {
        return this.getAttribute("easing") || DEFAULT_EASING;
    }
    set easing(val) {
        this.setAttribute("easing", val);
    }

    /** Whether the animation only plays once. Defaults to true; pass `"false"` to opt out. */
    get once() {
        return this.getAttribute("once") !== "false";
    }
    set once(val) {
        if (val === false || val === "false") this.setAttribute("once", "false");
        else this.removeAttribute("once");
    }

    /** Plays the animation in reverse when true. */
    get reverse() {
        return this.hasAttribute("reverse");
    }
    set reverse(val) {
        if (val) this.setAttribute("reverse", "");
        else this.removeAttribute("reverse");
    }

    /** When true, each direct child animates with a per-index delay. */
    get stagger() {
        return this.hasAttribute("stagger");
    }
    set stagger(val) {
        if (val) this.setAttribute("stagger", "");
        else this.removeAttribute("stagger");
    }

    /**
     * Per-child delay (ms) when `stagger` is true. Falls back to the
     * `--component-animate-stagger-delay` token, then `DEFAULT_STAGGER_DELAY`.
     */
    get staggerDelay() {
        const n = parseFloat(this.getAttribute("stagger-delay"));
        if (Number.isFinite(n) && n >= 0) return n;
        return this._readNumberToken(
            "--component-animate-stagger-delay",
            DEFAULT_STAGGER_DELAY,
        );
    }
    set staggerDelay(val) {
        this.setAttribute("stagger-delay", String(val));
    }

    /** When the animation begins: `"load"`, `"visible"`, or `"manual"`. */
    get trigger() {
        const v = this.getAttribute("trigger");
        return TRIGGERS.has(v) ? v : "load";
    }
    set trigger(val) {
        this.setAttribute("trigger", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Cancels any currently running animation and emits `animation-cancel`. */
    abort() {
        this._cancelAll(true);
    }

    /** Manually triggers the animation. Resolves once all running animations finish. */
    play() {
        return this._play();
    }

    render() {
        this.shadowRoot.adoptedStyleSheets = [this._buildStyleSheet()];
        this.shadowRoot.replaceChildren(
            _el("div", { class: "content", part: "content" }, [_el("slot")]),
        );
    }

    /** Resets each target back to its initial inline style state. */
    reset() {
        this._cancelAll(false);
        for (const target of this._targets()) {
            if (target === this) continue;
            target.style.removeProperty("opacity");
            target.style.removeProperty("transform");
        }
        this._hasPlayed = false;
    }

    /** Updates animation type and (optionally) duration / easing in one call. */
    setAnimation(name, duration, easing) {
        if (name) this.setAttribute("animation", name);
        if (duration != null) this.setAttribute("duration", String(duration));
        if (easing) this.setAttribute("easing", easing);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bounceKeyframes(direction, height) {
        const horizontal = direction === "left" || direction === "right";
        const axis = horizontal ? "X" : "Y";
        const sign = direction === "down" || direction === "right" ? 1 : -1;
        const peak = sign * height;
        const half = sign * (height / 2);
        return [
            { transform: `translate${axis}(0)`, offset: 0 },
            { transform: `translate${axis}(${peak}px)`, offset: 0.4 },
            { transform: `translate${axis}(0)`, offset: 0.7 },
            { transform: `translate${axis}(${half}px)`, offset: 0.85 },
            { transform: `translate${axis}(0)`, offset: 1 },
        ];
    }

    _buildKeyframes(animation, direction) {
        // Resolve token values once per call. WAAPI's keyframe parser does not
        // reliably handle `var(...)` inside `transform` / `opacity` across
        // engines, so we substitute concrete numbers and lengths up front.
        const v = this._resolvedTokens();

        switch (animation) {
            case "fade":
                return [
                    { opacity: v.fadeStart },
                    { opacity: v.fadeEnd },
                ];
            case "slide":
                return [
                    {
                        transform: this._slideTransform(direction, v.slideDistance),
                        opacity: 0,
                    },
                    { transform: "translate(0, 0)", opacity: 1 },
                ];
            case "zoom-in":
                return [
                    { transform: `scale(${v.zoomInScale})`, opacity: 0 },
                    { transform: "scale(1)", opacity: 1 },
                ];
            case "zoom-out":
                return [
                    { transform: `scale(${v.zoomOutScale})`, opacity: 0 },
                    { transform: "scale(1)", opacity: 1 },
                ];
            case "flip-horizontal":
                return [
                    { transform: "rotateY(90deg)", opacity: 0 },
                    { transform: "rotateY(0deg)", opacity: 1 },
                ];
            case "flip-vertical":
                return [
                    { transform: "rotateX(90deg)", opacity: 0 },
                    { transform: "rotateX(0deg)", opacity: 1 },
                ];
            case "rotate-in":
                return [
                    {
                        transform: `rotate(${-v.rotateAngle}deg)`,
                        opacity: 0,
                    },
                    { transform: "rotate(0deg)", opacity: 1 },
                ];
            case "bounce":
                return this._bounceKeyframes(direction, v.bounceHeight);
            case "shake":
                return this._shakeKeyframes(direction, v.shakeAmplitude);
            case "scale":
                return [
                    { transform: `scale(${v.scaleStart})`, opacity: 0 },
                    { transform: `scale(${v.scaleEnd})`, opacity: 1 },
                ];
            default:
                return [{ opacity: 0 }, { opacity: 1 }];
        }
    }

    _buildStyleSheet() {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host {
                display: block;
                box-sizing: border-box;
            }
            :host([hidden]) {
                display: none;
            }
            .content {
                display: contents;
            }
        `);
        return sheet;
    }

    _cancelAll(emitEvents) {
        if (this._animations.size === 0) return;
        const animation = this.animation;
        for (const a of this._animations) {
            const target = a.effect && a.effect.target;
            try {
                a.cancel();
            } catch {
                // Cancel can throw on already-finished animations in some browsers.
            }
            if (emitEvents) {
                this._emit("animation-cancel", {
                    animation,
                    element: target || this,
                });
            }
        }
        this._animations.clear();
    }

    _emit(name, detail) {
        this.dispatchEvent(
            new CustomEvent(name, {
                bubbles: true,
                composed: true,
                detail,
            }),
        );
    }

    _onIntersect(entries) {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            this._play();
            if (this.once) this._teardownTrigger();
        }
    }

    _play() {
        if (this.disabled) return Promise.resolve();
        if (this.hasAttribute("hidden")) return Promise.resolve();
        if (this.once && this._hasPlayed) return Promise.resolve();

        const animation = this.animation;
        const direction = this.direction;
        const targets = this._targets();

        if (targets.length === 0) {
            this._hasPlayed = true;
            return Promise.resolve();
        }

        if (this._prefersReducedMotion()) {
            for (const target of targets) {
                this._emit("animation-start", { animation, element: target });
                this._emit("animation-end", { animation, element: target });
            }
            this._hasPlayed = true;
            return Promise.resolve();
        }

        this._cancelAll(false);

        const baseDelay = this.delay;
        const stepDelay = this.stagger ? this.staggerDelay : 0;
        const duration = this.duration;
        const easing = this.easing;
        const reverse = this.reverse;
        // Keyframes are identical for every target on this play() call —
        // resolving them once avoids N × getComputedStyle reads in stagger.
        const keyframes = this._buildKeyframes(animation, direction);

        const promises = targets.map((target, index) => {
            const options = {
                duration,
                easing,
                delay: baseDelay + index * stepDelay,
                fill: "forwards",
                direction: reverse ? "reverse" : "normal",
            };

            const playback = target.animate(keyframes, options);
            this._animations.add(playback);
            this._emit("animation-start", { animation, element: target });

            return playback.finished
                .then(() => {
                    if (this._animations.has(playback)) {
                        this._animations.delete(playback);
                        this._emit("animation-end", {
                            animation,
                            element: target,
                        });
                    }
                })
                .catch(() => {
                    // Cancellation rejects `finished`. The cancel event is
                    // emitted by `_cancelAll` when a caller aborts.
                    this._animations.delete(playback);
                });
        });

        this._hasPlayed = true;
        return Promise.all(promises).then(() => undefined);
    }

    _prefersReducedMotion() {
        return Boolean(
            window.matchMedia &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
    }

    _readNumberToken(name, fallback) {
        const raw = getComputedStyle(this).getPropertyValue(name).trim();
        if (!raw) return fallback;
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : fallback;
    }

    _resolvedTokens() {
        return {
            fadeStart: this._readNumberToken(
                "--component-animate-fade-opacity-start",
                0,
            ),
            fadeEnd: this._readNumberToken(
                "--component-animate-fade-opacity-end",
                1,
            ),
            slideDistance: this._readNumberToken(
                "--component-animate-slide-distance",
                16,
            ),
            zoomInScale: this._readNumberToken(
                "--component-animate-zoom-in-scale-start",
                0.8,
            ),
            zoomOutScale: this._readNumberToken(
                "--component-animate-zoom-out-scale-start",
                1.2,
            ),
            rotateAngle: this._readNumberToken(
                "--component-animate-rotate-angle",
                90,
            ),
            bounceHeight: this._readNumberToken(
                "--component-animate-bounce-height",
                16,
            ),
            shakeAmplitude: this._readNumberToken(
                "--component-animate-shake-amplitude",
                8,
            ),
            scaleStart: this._readNumberToken(
                "--component-animate-scale-start",
                0.5,
            ),
            scaleEnd: this._readNumberToken(
                "--component-animate-scale-end",
                1,
            ),
        };
    }

    _setupTrigger() {
        const trigger = this.trigger;
        if (trigger === "load") {
            // Defer one frame so slotted children and parent layout settle
            // before the animation is scheduled.
            requestAnimationFrame(() => {
                if (this.isConnected) this._play();
            });
            return;
        }
        if (trigger === "visible") {
            if (typeof IntersectionObserver === "undefined") {
                this._play();
                return;
            }
            this._observer = new IntersectionObserver((entries) =>
                this._onIntersect(entries),
            );
            this._observer.observe(this);
        }
    }

    _shakeKeyframes(direction, amplitude) {
        const horizontal = direction !== "up" && direction !== "down";
        const axis = horizontal ? "X" : "Y";
        return [
            { transform: `translate${axis}(0)`, offset: 0 },
            { transform: `translate${axis}(${-amplitude}px)`, offset: 0.2 },
            { transform: `translate${axis}(${amplitude}px)`, offset: 0.4 },
            { transform: `translate${axis}(${-amplitude}px)`, offset: 0.6 },
            { transform: `translate${axis}(${amplitude}px)`, offset: 0.8 },
            { transform: `translate${axis}(0)`, offset: 1 },
        ];
    }

    _slideTransform(direction, distance) {
        switch (direction) {
            case "down":
                return `translateY(${-distance}px)`;
            case "left":
                return `translateX(${distance}px)`;
            case "right":
                return `translateX(${-distance}px)`;
            case "up":
            default:
                return `translateY(${distance}px)`;
        }
    }

    _targets() {
        if (this.stagger) {
            return Array.from(this.children);
        }
        return [this];
    }

    _teardownTrigger() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }
}

if (!customElements.get("y-animate")) {
    customElements.define("y-animate", YumeAnimate);
}
