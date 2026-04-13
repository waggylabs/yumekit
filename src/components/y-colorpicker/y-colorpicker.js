import "../y-input/y-input.js";
import "../y-select/y-select.js";
import {
    clamp,
    hsvToRgb,
    rgbToHsv,
    hsvToHsl,
    hslToHsv,
    rgbToHex,
    rgbaToHex,
    parseColorString,
} from "../../modules/helpers.js";

export class YumeColorpicker extends HTMLElement {
    static get observedAttributes() {
        return ["value", "format", "formats", "show-alpha", "size"];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        // Internal HSV + alpha model
        this._h = 0;
        this._s = 100;
        this._v = 100;
        this._a = 1;
        this._dragging = null; // "canvas" | "hue" | "alpha"
        this._rendered = false;
        this._updatingValue = false; // guard against attribute ↔ model loops
        this._drawnHue = -1; // last hue the canvas was drawn for
        // Stable bound handlers for global pointer events
        this._onPointerMove = (e) => this._onGlobalMove(e);
        this._onPointerUp = () => this._onGlobalUp();
    }

    connectedCallback() {
        if (this.getAttribute("value")) {
            this._parseAndApply(this.getAttribute("value"));
        }
        this.render();
        this._rendered = true;
    }

    disconnectedCallback() {
        this._removeGlobalListeners();
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === "value" && this._rendered) {
            if (this._updatingValue) return;
            this._parseAndApply(newVal);
            this._updateAll();
        } else if (this._rendered) {
            this.render();
        }
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    get value() {
        return this._formatColor(this.format);
    }
    set value(val) {
        this.setAttribute("value", val);
    }

    get format() {
        return this.getAttribute("format") || "hex";
    }
    set format(val) {
        this.setAttribute("format", val);
    }

    get formats() {
        try {
            return JSON.parse(
                this.getAttribute("formats") || '["hex","rgb","hsl","hsv"]',
            );
        } catch {
            return ["hex", "rgb", "hsl", "hsv"];
        }
    }
    set formats(val) {
        this.setAttribute("formats", JSON.stringify(val));
    }

    get showAlpha() {
        return this.hasAttribute("show-alpha");
    }
    set showAlpha(val) {
        if (val) this.setAttribute("show-alpha", "");
        else this.removeAttribute("show-alpha");
    }

    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    setColor(value) {
        this._parseAndApply(value);
        this._updateAll();
        this._syncValueAttr();
    }

    render() {
        const size = this.size;
        const showAlpha = this.showAlpha;
        const formats = this.formats;

        this.shadowRoot.innerHTML = `
            <style>${this._buildStyles()}</style>
            <div class="colorpicker" part="colorpicker">
                <div class="canvas-container">
                    <canvas class="canvas" part="canvas" tabindex="0"
                        role="slider" aria-label="Color"
                        aria-valuetext="Hue ${this._h}, Saturation ${this._s}%, Brightness ${this._v}%"
                    ></canvas>
                    <div class="canvas-handle" part="canvas-handle"></div>
                </div>
                <div class="hue-slider" part="hue-slider" tabindex="0"
                    role="slider" aria-label="Hue"
                    aria-valuemin="0" aria-valuemax="359" aria-valuenow="${this._h}"
                >
                    <div class="hue-thumb" part="hue-thumb"></div>
                </div>
                ${
                    showAlpha
                        ? `
                <div class="alpha-slider" part="alpha-slider" tabindex="0"
                    role="slider" aria-label="Alpha"
                    aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(this._a * 100)}"
                >
                    <div class="alpha-gradient"></div>
                    <div class="alpha-thumb" part="alpha-thumb"></div>
                </div>`
                        : ""
                }
                <div class="inputs-row" part="inputs-row">
                    <div class="swatch-container">
                        <slot name="swatch">
                            <div class="swatch-preview" part="swatch-preview"></div>
                        </slot>
                    </div>
                    <y-select class="format-select" part="format-select"
                        size="${size}"
                        options='${JSON.stringify(formats.map((f) => ({ value: f, label: f.toUpperCase() })))}'
                        value="${this.format}"
                    ></y-select>
                    <div class="channel-inputs"></div>
                </div>
            </div>
        `;

        this._canvas = this.shadowRoot.querySelector(".canvas");
        this._canvasHandle = this.shadowRoot.querySelector(".canvas-handle");
        this._hueSlider = this.shadowRoot.querySelector(".hue-slider");
        this._hueThumb = this.shadowRoot.querySelector(".hue-thumb");
        this._alphaSlider = this.shadowRoot.querySelector(".alpha-slider");
        this._alphaThumb = this.shadowRoot.querySelector(".alpha-thumb");
        this._formatSelect = this.shadowRoot.querySelector(".format-select");
        this._channelInputs = this.shadowRoot.querySelector(".channel-inputs");
        this._swatchPreview = this.shadowRoot.querySelector(".swatch-preview");

        this._bindEvents();
        this._drawCanvas();
        this._updateAll();
    }

    // -------------------------------------------------------------------------
    // Private — color helpers
    // -------------------------------------------------------------------------

    _parseAndApply(str) {
        const parsed = parseColorString(str);
        if (!parsed) return;
        const [h, s, v] = rgbToHsv(parsed.r, parsed.g, parsed.b);
        this._h = h;
        this._s = s;
        this._v = v;
        this._a = parsed.a;
    }

    _formatColor(fmt) {
        const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
        const a = Math.round(this._a * 100) / 100;
        switch (fmt) {
            case "hex":
                return this.showAlpha && a < 1
                    ? rgbaToHex(r, g, b, a)
                    : rgbToHex(r, g, b);
            case "rgb":
                return this.showAlpha
                    ? `rgba(${r}, ${g}, ${b}, ${a})`
                    : `rgb(${r}, ${g}, ${b})`;
            case "hsl": {
                const [hh, ss, ll] = hsvToHsl(this._h, this._s, this._v);
                return this.showAlpha
                    ? `hsla(${hh}, ${ss}%, ${ll}%, ${a})`
                    : `hsl(${hh}, ${ss}%, ${ll}%)`;
            }
            case "hsv":
                return this.showAlpha
                    ? `hsva(${this._h}, ${this._s}%, ${this._v}%, ${a})`
                    : `hsv(${this._h}, ${this._s}%, ${this._v}%)`;
            default:
                return rgbToHex(r, g, b);
        }
    }

    _getColorRepresentations() {
        const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
        const a = Math.round(this._a * 100) / 100;
        const [hh, ss, ll] = hsvToHsl(this._h, this._s, this._v);
        return {
            hex:
                this.showAlpha && a < 1
                    ? rgbaToHex(r, g, b, a)
                    : rgbToHex(r, g, b),
            rgb: this.showAlpha
                ? `rgba(${r}, ${g}, ${b}, ${a})`
                : `rgb(${r}, ${g}, ${b})`,
            hsl: this.showAlpha
                ? `hsla(${hh}, ${ss}%, ${ll}%, ${a})`
                : `hsl(${hh}, ${ss}%, ${ll}%)`,
            hsv: this.showAlpha
                ? `hsva(${this._h}, ${this._s}%, ${this._v}%, ${a})`
                : `hsv(${this._h}, ${this._s}%, ${this._v}%)`,
        };
    }

    // -------------------------------------------------------------------------
    // Private — drawing
    // -------------------------------------------------------------------------

    _drawCanvas() {
        const canvas = this._canvas;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const w = rect.width || 260;
        const h = rect.height || 160;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        // Solid hue fill
        const [r, g, b] = hsvToRgb(this._h, 100, 100);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, w, h);

        // White→transparent gradient (saturation)
        const whiteGrad = ctx.createLinearGradient(0, 0, w, 0);
        whiteGrad.addColorStop(0, "rgba(255,255,255,1)");
        whiteGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = whiteGrad;
        ctx.fillRect(0, 0, w, h);

        // Black→transparent gradient (value)
        const blackGrad = ctx.createLinearGradient(0, 0, 0, h);
        blackGrad.addColorStop(0, "rgba(0,0,0,0)");
        blackGrad.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = blackGrad;
        ctx.fillRect(0, 0, w, h);
        this._drawnHue = this._h;
    }

    // -------------------------------------------------------------------------
    // Private — UI updates
    // -------------------------------------------------------------------------

    _getChannelFields() {
        const showAlpha = this.showAlpha;
        const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
        const [hh, ss, ll] = hsvToHsl(this._h, this._s, this._v);
        const a = Math.round(this._a * 100) / 100;

        let fields = [];
        switch (this.format) {
            case "hex":
                fields = [
                    {
                        label: "Hex",
                        name: "hex",
                        value:
                            showAlpha && a < 1
                                ? rgbaToHex(r, g, b, a)
                                : rgbToHex(r, g, b),
                        full: true,
                    },
                ];
                break;
            case "rgb":
                fields = [
                    {
                        label: "R",
                        name: "r",
                        value: String(r),
                        min: 0,
                        max: 255,
                    },
                    {
                        label: "G",
                        name: "g",
                        value: String(g),
                        min: 0,
                        max: 255,
                    },
                    {
                        label: "B",
                        name: "b",
                        value: String(b),
                        min: 0,
                        max: 255,
                    },
                ];
                if (showAlpha)
                    fields.push({
                        label: "A",
                        name: "a",
                        value: String(a),
                        min: 0,
                        max: 1,
                        step: 0.01,
                    });
                break;
            case "hsl":
                fields = [
                    {
                        label: "H",
                        name: "h",
                        value: String(hh),
                        min: 0,
                        max: 360,
                    },
                    {
                        label: "S",
                        name: "s",
                        value: String(ss),
                        min: 0,
                        max: 100,
                    },
                    {
                        label: "L",
                        name: "l",
                        value: String(ll),
                        min: 0,
                        max: 100,
                    },
                ];
                if (showAlpha)
                    fields.push({
                        label: "A",
                        name: "a",
                        value: String(a),
                        min: 0,
                        max: 1,
                        step: 0.01,
                    });
                break;
            case "hsv":
                fields = [
                    {
                        label: "H",
                        name: "h",
                        value: String(this._h),
                        min: 0,
                        max: 360,
                    },
                    {
                        label: "S",
                        name: "s",
                        value: String(this._s),
                        min: 0,
                        max: 100,
                    },
                    {
                        label: "V",
                        name: "v",
                        value: String(this._v),
                        min: 0,
                        max: 100,
                    },
                ];
                if (showAlpha)
                    fields.push({
                        label: "A",
                        name: "a",
                        value: String(a),
                        min: 0,
                        max: 1,
                        step: 0.01,
                    });
                break;
        }
        return fields;
    }

    _rebuildInputs() {
        if (!this._channelInputs) return;
        const size = this.size;
        const fields = this._getChannelFields();

        this._channelInputs.innerHTML = "";
        fields.forEach((f) => {
            const input = document.createElement("y-input");
            input.setAttribute("size", size);
            input.setAttribute("aria-label", f.label);
            input.setAttribute("placeholder", f.label);
            input.setAttribute("value", f.value);
            input.dataset.channel = f.name;
            if (f.full) input.classList.add("full-width");
            this._channelInputs.appendChild(input);

            input.addEventListener("input", (e) => {
                this._handleChannelInput(
                    f.name,
                    e.detail?.value ?? e.target.value,
                    f,
                );
            });
        });
    }

    _updateAll() {
        this._updateCanvasHandle();
        this._updateHueThumb();
        this._updateAlphaThumb();
        this._updateSwatch();
        this._updateInputValues();
        if (this._drawnHue !== this._h) this._drawCanvas();
        this._updateAriaValues();
    }

    _updateAlphaThumb() {
        const thumb = this._alphaThumb;
        const slider = this._alphaSlider;
        if (!thumb || !slider) return;
        thumb.style.left = `${this._a * 100}%`;
        const gradient = slider.querySelector(".alpha-gradient");
        if (gradient) {
            const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
            gradient.style.background = `linear-gradient(to right, rgba(${r},${g},${b},0), rgb(${r},${g},${b}))`;
        }
    }

    _updateAriaValues() {
        const canvas = this._canvas;
        if (canvas) {
            canvas.setAttribute(
                "aria-valuetext",
                `Hue ${this._h}, Saturation ${this._s}%, Brightness ${this._v}%`,
            );
        }
        if (this._hueSlider) {
            this._hueSlider.setAttribute("aria-valuenow", String(this._h));
        }
        if (this._alphaSlider) {
            this._alphaSlider.setAttribute(
                "aria-valuenow",
                String(Math.round(this._a * 100)),
            );
        }
    }

    _updateCanvasHandle() {
        const handle = this._canvasHandle;
        const canvas = this._canvas;
        if (!handle || !canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = (this._s / 100) * rect.width;
        const y = (1 - this._v / 100) * rect.height;
        handle.style.left = `${x}px`;
        handle.style.top = `${y}px`;
        const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
        handle.style.backgroundColor = `rgb(${r},${g},${b})`;
    }

    _updateHueThumb() {
        const thumb = this._hueThumb;
        const slider = this._hueSlider;
        if (!thumb || !slider) return;
        const pct = this._h / 360;
        thumb.style.left = `${pct * 100}%`;
        const [r, g, b] = hsvToRgb(this._h, 100, 100);
        thumb.style.backgroundColor = `rgb(${r},${g},${b})`;
    }

    _updateInputValues() {
        if (!this._channelInputs) return;
        const fields = this._getChannelFields();
        const inputs = this._channelInputs.querySelectorAll("y-input");
        if (inputs.length !== fields.length) {
            this._rebuildInputs();
            return;
        }
        fields.forEach((f, i) => {
            inputs[i].setAttribute("value", f.value);
        });
    }

    _updateSwatch() {
        if (!this._swatchPreview) return;
        const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
        this._swatchPreview.style.backgroundColor = this.showAlpha
            ? `rgba(${r},${g},${b},${this._a})`
            : `rgb(${r},${g},${b})`;
    }

    // -------------------------------------------------------------------------
    // Private — event handling
    // -------------------------------------------------------------------------

    _bindEvents() {
        // Canvas pointer
        this._canvas.addEventListener("pointerdown", (e) =>
            this._onCanvasDown(e),
        );

        // Hue slider pointer
        this._hueSlider.addEventListener("pointerdown", (e) =>
            this._onHueDown(e),
        );

        // Alpha slider pointer
        if (this._alphaSlider) {
            this._alphaSlider.addEventListener("pointerdown", (e) =>
                this._onAlphaDown(e),
            );
        }

        // Keyboard on canvas
        this._canvas.addEventListener("keydown", (e) => this._onCanvasKey(e));

        // Keyboard on hue
        this._hueSlider.addEventListener("keydown", (e) => this._onHueKey(e));

        // Keyboard on alpha
        if (this._alphaSlider) {
            this._alphaSlider.addEventListener("keydown", (e) =>
                this._onAlphaKey(e),
            );
        }

        // Format select
        this._formatSelect.addEventListener("change", (e) => {
            const val = e.detail?.value ?? e.target.value;
            if (val && val !== this.format) {
                this.setAttribute("format", val);
                this._rebuildInputs();
                this.dispatchEvent(
                    new CustomEvent("format-change", {
                        bubbles: true,
                        composed: true,
                        detail: { format: val },
                    }),
                );
            }
        });
    }

    _addGlobalListeners() {
        window.addEventListener("pointermove", this._onPointerMove);
        window.addEventListener("pointerup", this._onPointerUp);
    }

    _removeGlobalListeners() {
        window.removeEventListener("pointermove", this._onPointerMove);
        window.removeEventListener("pointerup", this._onPointerUp);
    }

    // Canvas drag
    _onCanvasDown(e) {
        e.preventDefault();
        this._dragging = "canvas";
        this._addGlobalListeners();
        this._updateCanvasFromPointer(e);
    }

    _updateCanvasFromPointer(e) {
        const rect = this._canvas.getBoundingClientRect();
        const x = clamp(e.clientX - rect.left, 0, rect.width);
        const y = clamp(e.clientY - rect.top, 0, rect.height);
        this._s = Math.round((x / rect.width) * 100);
        this._v = Math.round((1 - y / rect.height) * 100);
        this._updateAll();
        this._emitChange();
    }

    // Hue drag
    _onHueDown(e) {
        e.preventDefault();
        this._dragging = "hue";
        this._addGlobalListeners();
        this._updateHueFromPointer(e);
    }

    _updateHueFromPointer(e) {
        const rect = this._hueSlider.getBoundingClientRect();
        const x = clamp(e.clientX - rect.left, 0, rect.width);
        this._h = Math.round((x / rect.width) * 360) % 360;
        this._updateAll();
        this._emitChange();
    }

    // Alpha drag
    _onAlphaDown(e) {
        e.preventDefault();
        this._dragging = "alpha";
        this._addGlobalListeners();
        this._updateAlphaFromPointer(e);
    }

    _updateAlphaFromPointer(e) {
        const rect = this._alphaSlider.getBoundingClientRect();
        const x = clamp(e.clientX - rect.left, 0, rect.width);
        this._a = Math.round((x / rect.width) * 100) / 100;
        this._updateAll();
        this._emitChange();
    }

    // Global move/up
    _onGlobalMove(e) {
        if (this._dragging === "canvas") this._updateCanvasFromPointer(e);
        else if (this._dragging === "hue") this._updateHueFromPointer(e);
        else if (this._dragging === "alpha") this._updateAlphaFromPointer(e);
    }

    _onGlobalUp() {
        this._dragging = null;
        this._removeGlobalListeners();
    }

    // Keyboard — canvas
    _onCanvasKey(e) {
        const step = e.shiftKey ? 10 : 1;
        let handled = true;
        switch (e.key) {
            case "ArrowRight":
                this._s = clamp(this._s + step, 0, 100);
                break;
            case "ArrowLeft":
                this._s = clamp(this._s - step, 0, 100);
                break;
            case "ArrowUp":
                this._v = clamp(this._v + step, 0, 100);
                break;
            case "ArrowDown":
                this._v = clamp(this._v - step, 0, 100);
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            this._updateAll();
            this._emitChange();
        }
    }

    // Keyboard — hue
    _onHueKey(e) {
        const step = e.shiftKey ? 10 : 1;
        let handled = true;
        switch (e.key) {
            case "ArrowRight":
                this._h = (this._h + step) % 360;
                break;
            case "ArrowLeft":
                this._h = (this._h - step + 360) % 360;
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            this._updateAll();
            this._emitChange();
        }
    }

    // Keyboard — alpha
    _onAlphaKey(e) {
        const step = e.shiftKey ? 0.1 : 0.01;
        let handled = true;
        switch (e.key) {
            case "ArrowRight":
                this._a = clamp(this._a + step, 0, 1);
                break;
            case "ArrowLeft":
                this._a = clamp(this._a - step, 0, 1);
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            this._a = Math.round(this._a * 100) / 100;
            this._updateAll();
            this._emitChange();
        }
    }

    // Channel input handler
    _handleChannelInput(channel, rawValue, fieldDef) {
        const fmt = this.format;

        if (channel === "hex") {
            const parsed = parseColorString(rawValue);
            if (!parsed) return;
            const [h, s, v] = rgbToHsv(parsed.r, parsed.g, parsed.b);
            this._h = h;
            this._s = s;
            this._v = v;
            this._a = parsed.a;
        } else if (channel === "a") {
            const v = parseFloat(rawValue);
            if (isNaN(v) || v < 0 || v > 1) return;
            this._a = Math.round(v * 100) / 100;
        } else {
            const num = parseInt(rawValue, 10);
            if (isNaN(num)) return;
            const clamped = clamp(num, fieldDef.min, fieldDef.max);

            if (fmt === "rgb") {
                const [r, g, b] = hsvToRgb(this._h, this._s, this._v);
                const nr = channel === "r" ? clamped : r;
                const ng = channel === "g" ? clamped : g;
                const nb = channel === "b" ? clamped : b;
                const [h, s, v] = rgbToHsv(nr, ng, nb);
                this._h = h;
                this._s = s;
                this._v = v;
            } else if (fmt === "hsl") {
                const [hh, ss, ll] = hsvToHsl(this._h, this._s, this._v);
                const nh = channel === "h" ? clamped : hh;
                const ns = channel === "s" ? clamped : ss;
                const nl = channel === "l" ? clamped : ll;
                const [h, s, v] = hslToHsv(nh, ns, nl);
                this._h = h;
                this._s = s;
                this._v = v;
            } else if (fmt === "hsv") {
                if (channel === "h") this._h = clamped;
                else if (channel === "s") this._s = clamped;
                else if (channel === "v") this._v = clamped;
            }
        }

        if (this._drawnHue !== this._h) this._drawCanvas();
        this._updateCanvasHandle();
        this._updateHueThumb();
        this._updateAlphaThumb();
        this._updateSwatch();
        this._updateAriaValues();
        this._emitChange();
    }

    _syncValueAttr() {
        this._updatingValue = true;
        this.setAttribute("value", this._formatColor(this.format));
        this._updatingValue = false;
    }

    _emitChange() {
        this._syncValueAttr();
        const reps = this._getColorRepresentations();
        this.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: this._formatColor(this.format),
                    ...reps,
                    alpha: Math.round(this._a * 100) / 100,
                },
            }),
        );
    }

    // -------------------------------------------------------------------------
    // Private — styles
    // -------------------------------------------------------------------------

    _buildStyles() {
        return `
            :host {
                display: inline-block;
                font-family: var(--font-family-body, sans-serif);
                font-weight: var(--font-weight-body, 300);
                --_swatch-size: var(--sizing-medium, 40px);
                --_canvas-width: var(--component-colorpicker-width, 260px);
                --_canvas-height: var(--component-colorpicker-canvas-height, 160px);
            }

            :host([size="small"]) {
                --_swatch-size: var(--sizing-small, 32px);
                --_canvas-width: var(--component-colorpicker-width-small, 200px);
                --_canvas-height: var(--component-colorpicker-canvas-height-small, 120px);
            }

            :host([size="large"]) {
                --_swatch-size: var(--sizing-large, 56px);
                --_canvas-width: var(--component-colorpicker-width-large, 320px);
                --_canvas-height: var(--component-colorpicker-canvas-height-large, 200px);
            }

            .colorpicker {
                width: var(--_canvas-width);
                display: flex;
                flex-direction: column;
                gap: var(--component-colorpicker-gap, var(--spacing-medium, 8px));
            }

            /* ── Canvas ── */
            .canvas-container {
                position: relative;
                width: 100%;
                height: var(--_canvas-height);
                border-radius: var(--component-colorpicker-border-radius, var(--radii-x-small, 2px));
                overflow: hidden;
                cursor: crosshair;
                touch-action: none;
            }

            .canvas {
                display: block;
                width: 100%;
                height: 100%;
                border: none;
                outline: none;
            }

            .canvas:focus-visible {
                box-shadow: 0 0 0 2px var(--primary-content--, #0576ff);
            }

            .canvas-handle {
                position: absolute;
                width: var(--component-colorpicker-canvas-handle-size, 16px);
                height: var(--component-colorpicker-canvas-handle-size, 16px);
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 0 2px rgba(0,0,0,0.5);
                transform: translate(-50%, -50%);
                pointer-events: none;
            }

            /* ── Sliders ── */
            .hue-slider,
            .alpha-slider {
                position: relative;
                width: 100%;
                height: var(--component-colorpicker-slider-height, 12px);
                border-radius: var(--component-colorpicker-border-radius, var(--radii-x-small, 2px));
                cursor: pointer;
                outline: none;
                touch-action: none;
            }

            .hue-slider:focus-visible,
            .alpha-slider:focus-visible {
                box-shadow: 0 0 0 2px var(--primary-content--, #0576ff);
            }

            .hue-slider {
                background: linear-gradient(to right,
                    hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%),
                    hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%),
                    hsl(360,100%,50%)
                );
            }

            .alpha-slider {
                background-image:
                    linear-gradient(45deg,
                        var(--base-content-lightest, #ccc) 25%, transparent 25%,
                        transparent 75%, var(--base-content-lightest, #ccc) 75%),
                    linear-gradient(45deg,
                        var(--base-content-lightest, #ccc) 25%, transparent 25%,
                        transparent 75%, var(--base-content-lightest, #ccc) 75%);
                background-size:
                    calc(var(--component-colorpicker-checkerboard-size, 8px) * 2)
                    calc(var(--component-colorpicker-checkerboard-size, 8px) * 2);
                background-position:
                    0 0,
                    var(--component-colorpicker-checkerboard-size, 8px)
                    var(--component-colorpicker-checkerboard-size, 8px);
            }

            .alpha-gradient {
                position: absolute;
                inset: 0;
                border-radius: inherit;
            }

            .hue-thumb,
            .alpha-thumb {
                position: absolute;
                top: 50%;
                width: var(--component-colorpicker-slider-thumb-size, 16px);
                height: var(--component-colorpicker-slider-thumb-size, 16px);
                border-radius: 50%;
                border: 2px solid #fff;
                box-shadow: 0 0 2px rgba(0,0,0,0.4);
                transform: translate(-50%, -50%);
                pointer-events: none;
            }

            /* ── Inputs row ── */
            .inputs-row {
                display: flex;
                align-items: flex-end;
                gap: var(--spacing-x-small, 4px);
            }

            .swatch-container {
                flex-shrink: 0;
            }

            .swatch-preview {
                width: var(--_swatch-size);
                height: var(--_swatch-size);
                border-radius: var(--component-colorpicker-border-radius, var(--radii-x-small, 2px));
                border: 1px solid var(--base-border, #ccc);
            }

            .format-select {
                flex-shrink: 0;
                width: 72px;
            }

            .channel-inputs {
                display: flex;
                flex: 1;
                gap: var(--spacing-2x-small, 2px);
                min-width: 0;
            }

            .channel-inputs y-input {
                flex: 1;
                min-width: 0;
            }

            .channel-inputs y-input.full-width {
                flex: 2;
            }
        `;
    }
}

if (!customElements.get("y-colorpicker")) {
    customElements.define("y-colorpicker", YumeColorpicker);
}
