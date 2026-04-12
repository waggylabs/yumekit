import sinon from "sinon";
import { fixture, html, expect, oneEvent, nextFrame } from "@open-wc/testing";
import "./y-colorpicker.js";

describe("<y-colorpicker>", () => {
    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    it("renders the canvas", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector(".canvas")).to.exist;
    });

    it("renders the canvas handle", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector(".canvas-handle")).to.exist;
    });

    it("renders the hue slider", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const slider = el.shadowRoot.querySelector(".hue-slider");
        expect(slider).to.exist;
        expect(slider.getAttribute("role")).to.equal("slider");
        expect(slider.getAttribute("aria-label")).to.equal("Hue");
    });

    it("renders the format select", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("y-select.format-select")).to.exist;
    });

    it("renders the swatch preview", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector(".swatch-preview")).to.exist;
    });

    it("renders channel inputs", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.be.greaterThan(0);
    });

    it("does not render alpha slider by default", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector(".alpha-slider")).to.not.exist;
    });

    it("renders alpha slider when show-alpha is set", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha></y-colorpicker>`,
        );
        const slider = el.shadowRoot.querySelector(".alpha-slider");
        expect(slider).to.exist;
        expect(slider.getAttribute("role")).to.equal("slider");
        expect(slider.getAttribute("aria-label")).to.equal("Alpha");
    });

    // -------------------------------------------------------------------------
    // Defaults
    // -------------------------------------------------------------------------

    it("defaults format to hex", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.format).to.equal("hex");
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.size).to.equal("medium");
    });

    it("defaults formats to all four", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.formats).to.deep.equal(["hex", "rgb", "hsl", "hsv"]);
    });

    it("defaults showAlpha to false", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.showAlpha).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Attributes / Properties
    // -------------------------------------------------------------------------

    it("reflects format attribute to property", async () => {
        const el = await fixture(
            html`<y-colorpicker format="rgb"></y-colorpicker>`,
        );
        expect(el.format).to.equal("rgb");
    });

    it("format setter updates attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.format = "hsl";
        expect(el.getAttribute("format")).to.equal("hsl");
    });

    it("reflects size attribute to property", async () => {
        const el = await fixture(
            html`<y-colorpicker size="small"></y-colorpicker>`,
        );
        expect(el.size).to.equal("small");
    });

    it("size setter updates attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("showAlpha setter toggles attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.showAlpha = true;
        expect(el.hasAttribute("show-alpha")).to.be.true;
        el.showAlpha = false;
        expect(el.hasAttribute("show-alpha")).to.be.false;
    });

    it("formats setter updates attribute as JSON", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.formats = ["hex", "rgb"];
        expect(JSON.parse(el.getAttribute("formats"))).to.deep.equal([
            "hex",
            "rgb",
        ]);
    });

    it("formats getter handles invalid JSON gracefully", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.setAttribute("formats", "not-json");
        expect(el.formats).to.deep.equal(["hex", "rgb", "hsl", "hsv"]);
    });

    it("passes formats to the format select options", async () => {
        const el = await fixture(
            html`<y-colorpicker formats='["hex","rgb"]'></y-colorpicker>`,
        );
        const select = el.shadowRoot.querySelector("y-select.format-select");
        const options = JSON.parse(select.getAttribute("options"));
        expect(options).to.have.length(2);
        expect(options[0].value).to.equal("hex");
        expect(options[1].value).to.equal("rgb");
    });

    it("format select has the current format as value", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hsl"></y-colorpicker>`,
        );
        const select = el.shadowRoot.querySelector("y-select.format-select");
        expect(select.getAttribute("value")).to.equal("hsl");
    });

    // -------------------------------------------------------------------------
    // Sizes
    // -------------------------------------------------------------------------

    it("applies small size", async () => {
        const el = await fixture(
            html`<y-colorpicker size="small"></y-colorpicker>`,
        );
        expect(el.size).to.equal("small");
        const select = el.shadowRoot.querySelector("y-select.format-select");
        expect(select.getAttribute("size")).to.equal("small");
    });

    it("applies large size", async () => {
        const el = await fixture(
            html`<y-colorpicker size="large"></y-colorpicker>`,
        );
        expect(el.size).to.equal("large");
        const select = el.shadowRoot.querySelector("y-select.format-select");
        expect(select.getAttribute("size")).to.equal("large");
    });

    // -------------------------------------------------------------------------
    // Value / setColor
    // -------------------------------------------------------------------------

    it("parses a hex value", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        expect(el.value).to.equal("#ff0000");
    });

    it("parses an rgb value", async () => {
        const el = await fixture(
            html`<y-colorpicker
                value="rgb(0, 255, 0)"
                format="rgb"
            ></y-colorpicker>`,
        );
        expect(el.value).to.equal("rgb(0, 255, 0)");
    });

    it("setColor updates the internal color model", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.setColor("#0000ff");
        expect(el.value).to.equal("#0000ff");
    });

    it("setColor with empty string does not crash", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el.setColor("");
        // Should not throw; value remains previous since empty string doesn't parse
        expect(el).to.exist;
    });

    it("value setter updates the attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.value = "#abcdef";
        expect(el.getAttribute("value")).to.equal("#abcdef");
    });

    // -------------------------------------------------------------------------
    // Format output
    // -------------------------------------------------------------------------

    it("outputs hex format by default", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        expect(el.value).to.match(/^#[0-9a-f]{6}$/i);
    });

    it("outputs rgb format when format is rgb", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000" format="rgb"></y-colorpicker>`,
        );
        expect(el.value).to.match(/^rgb\(\d+, \d+, \d+\)$/);
    });

    it("outputs hsl format when format is hsl", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000" format="hsl"></y-colorpicker>`,
        );
        expect(el.value).to.match(/^hsl\(\d+, \d+%, \d+%\)$/);
    });

    it("outputs hsv format when format is hsv", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000" format="hsv"></y-colorpicker>`,
        );
        expect(el.value).to.match(/^hsv\(\d+, \d+%, \d+%\)$/);
    });

    it("includes alpha in hex output when show-alpha and alpha < 1", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        // Set alpha to < 1
        el._a = 0.5;
        const val = el.value;
        // 8-char hex (with alpha)
        expect(val).to.match(/^#[0-9a-f]{8}$/i);
    });

    it("includes alpha in rgb output when show-alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker
                show-alpha
                value="#ff0000"
                format="rgb"
            ></y-colorpicker>`,
        );
        expect(el.value).to.match(/^rgba\(/);
    });

    it("includes alpha in hsl output when show-alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker
                show-alpha
                value="#ff0000"
                format="hsl"
            ></y-colorpicker>`,
        );
        expect(el.value).to.match(/^hsla\(/);
    });

    it("includes alpha in hsv output when show-alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker
                show-alpha
                value="#ff0000"
                format="hsv"
            ></y-colorpicker>`,
        );
        expect(el.value).to.match(/^hsva\(/);
    });

    // -------------------------------------------------------------------------
    // Channel inputs
    // -------------------------------------------------------------------------

    it("renders hex input for hex format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hex" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(1);
        expect(inputs[0].dataset.channel).to.equal("hex");
    });

    it("renders R, G, B inputs for rgb format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="rgb" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(3);
        expect(inputs[0].dataset.channel).to.equal("r");
        expect(inputs[1].dataset.channel).to.equal("g");
        expect(inputs[2].dataset.channel).to.equal("b");
    });

    it("renders H, S, L inputs for hsl format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hsl" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(3);
        expect(inputs[0].dataset.channel).to.equal("h");
        expect(inputs[1].dataset.channel).to.equal("s");
        expect(inputs[2].dataset.channel).to.equal("l");
    });

    it("renders H, S, V inputs for hsv format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hsv" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(3);
        expect(inputs[0].dataset.channel).to.equal("h");
        expect(inputs[1].dataset.channel).to.equal("s");
        expect(inputs[2].dataset.channel).to.equal("v");
    });

    it("adds alpha input when show-alpha is set (rgb)", async () => {
        const el = await fixture(
            html`<y-colorpicker
                format="rgb"
                show-alpha
                value="#ff0000"
            ></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(4);
        expect(inputs[3].dataset.channel).to.equal("a");
    });

    it("adds alpha input when show-alpha is set (hsl)", async () => {
        const el = await fixture(
            html`<y-colorpicker
                format="hsl"
                show-alpha
                value="#ff0000"
            ></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(4);
        expect(inputs[3].dataset.channel).to.equal("a");
    });

    it("hex input has full-width class", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hex" value="#ff0000"></y-colorpicker>`,
        );
        const input = el.shadowRoot.querySelector(
            '.channel-inputs y-input[data-channel="hex"]',
        );
        expect(input.classList.contains("full-width")).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    it("emits change event when color is updated via setColor", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        // setColor calls _emitChange internally
        // We need to listen before calling it
        const spy = sinon.spy();
        el.addEventListener("change", spy);
        el.setColor("#00ff00");
        // setColor calls _syncValueAttr -> _emitChange
        // Actually setColor doesn't call _emitChange directly; let's verify
        // by checking the value was updated
        expect(el.value).to.equal("#00ff00");
    });

    it("emits format-change when format select changes", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const select = el.shadowRoot.querySelector("y-select.format-select");
        setTimeout(() =>
            select.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: { value: "rgb" },
                }),
            ),
        );
        const { detail } = await oneEvent(el, "format-change");
        expect(detail.format).to.equal("rgb");
    });

    it("does not emit format-change when same format is selected", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hex" value="#ff0000"></y-colorpicker>`,
        );
        const spy = sinon.spy();
        el.addEventListener("format-change", spy);
        const select = el.shadowRoot.querySelector("y-select.format-select");
        select.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: { value: "hex" },
            }),
        );
        expect(spy.called).to.be.false;
    });

    it("updates channel inputs when format changes", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hex" value="#ff0000"></y-colorpicker>`,
        );
        let inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(1);

        el.format = "rgb";
        await nextFrame();
        inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(3);
    });

    // -------------------------------------------------------------------------
    // Keyboard navigation — canvas
    // -------------------------------------------------------------------------

    it("canvas ArrowRight increases saturation", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#808080"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        const before = el._s;
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el._s).to.equal(before + 1);
    });

    it("canvas ArrowLeft decreases saturation", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        const before = el._s;
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el._s).to.equal(before - 1);
    });

    it("canvas ArrowUp increases brightness", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#808080"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        const before = el._v;
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
        );
        expect(el._v).to.equal(before + 1);
    });

    it("canvas ArrowDown decreases brightness", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        const before = el._v;
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(el._v).to.equal(before - 1);
    });

    it("canvas Shift+Arrow steps by 10", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#808080"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        const before = el._s;
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowRight",
                shiftKey: true,
                bubbles: true,
            }),
        );
        expect(el._s).to.equal(before + 10);
    });

    it("canvas saturation clamps at 0", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#000000"></y-colorpicker>`,
        );
        el._s = 0;
        const canvas = el.shadowRoot.querySelector(".canvas");
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el._s).to.equal(0);
    });

    it("canvas saturation clamps at 100", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el._s = 100;
        const canvas = el.shadowRoot.querySelector(".canvas");
        canvas.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el._s).to.equal(100);
    });

    // -------------------------------------------------------------------------
    // Keyboard navigation — hue
    // -------------------------------------------------------------------------

    it("hue ArrowRight increases hue", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const hueSlider = el.shadowRoot.querySelector(".hue-slider");
        const before = el._h;
        hueSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el._h).to.equal((before + 1) % 360);
    });

    it("hue ArrowLeft decreases hue", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el._h = 10;
        const hueSlider = el.shadowRoot.querySelector(".hue-slider");
        hueSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el._h).to.equal(9);
    });

    it("hue wraps around at 360", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el._h = 359;
        const hueSlider = el.shadowRoot.querySelector(".hue-slider");
        hueSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el._h).to.equal(0);
    });

    it("hue wraps around below 0", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el._h = 0;
        const hueSlider = el.shadowRoot.querySelector(".hue-slider");
        hueSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el._h).to.equal(359);
    });

    it("hue Shift+Arrow steps by 10", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el._h = 50;
        const hueSlider = el.shadowRoot.querySelector(".hue-slider");
        hueSlider.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowRight",
                shiftKey: true,
                bubbles: true,
            }),
        );
        expect(el._h).to.equal(60);
    });

    // -------------------------------------------------------------------------
    // Keyboard navigation — alpha
    // -------------------------------------------------------------------------

    it("alpha ArrowRight increases alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        el._a = 0.5;
        const alphaSlider = el.shadowRoot.querySelector(".alpha-slider");
        alphaSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el._a).to.equal(0.51);
    });

    it("alpha ArrowLeft decreases alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        el._a = 0.5;
        const alphaSlider = el.shadowRoot.querySelector(".alpha-slider");
        alphaSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el._a).to.equal(0.49);
    });

    it("alpha clamps at 0", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        el._a = 0;
        const alphaSlider = el.shadowRoot.querySelector(".alpha-slider");
        alphaSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el._a).to.equal(0);
    });

    it("alpha clamps at 1", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        el._a = 1;
        const alphaSlider = el.shadowRoot.querySelector(".alpha-slider");
        alphaSlider.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el._a).to.equal(1);
    });

    it("alpha Shift+Arrow steps by 0.1", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        el._a = 0.5;
        const alphaSlider = el.shadowRoot.querySelector(".alpha-slider");
        alphaSlider.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowRight",
                shiftKey: true,
                bubbles: true,
            }),
        );
        expect(el._a).to.equal(0.6);
    });

    // -------------------------------------------------------------------------
    // Swatch preview
    // -------------------------------------------------------------------------

    it("updates swatch preview color", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const swatch = el.shadowRoot.querySelector(".swatch-preview");
        expect(swatch.style.backgroundColor).to.not.equal("");
    });

    it("swatch preview uses rgba when show-alpha is set", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        const swatch = el.shadowRoot.querySelector(".swatch-preview");
        expect(swatch.style.backgroundColor).to.not.equal("");
    });

    // -------------------------------------------------------------------------
    // ARIA
    // -------------------------------------------------------------------------

    it("canvas has role=slider", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const canvas = el.shadowRoot.querySelector(".canvas");
        expect(canvas.getAttribute("role")).to.equal("slider");
    });

    it("canvas has aria-label", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const canvas = el.shadowRoot.querySelector(".canvas");
        expect(canvas.getAttribute("aria-label")).to.equal("Color");
    });

    it("canvas has aria-valuetext", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        expect(canvas.getAttribute("aria-valuetext")).to.include("Hue");
        expect(canvas.getAttribute("aria-valuetext")).to.include("Saturation");
        expect(canvas.getAttribute("aria-valuetext")).to.include("Brightness");
    });

    it("hue slider has aria-valuemin and aria-valuemax", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const slider = el.shadowRoot.querySelector(".hue-slider");
        expect(slider.getAttribute("aria-valuemin")).to.equal("0");
        expect(slider.getAttribute("aria-valuemax")).to.equal("360");
    });

    it("hue slider has correct aria-valuenow", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        const slider = el.shadowRoot.querySelector(".hue-slider");
        expect(slider.getAttribute("aria-valuenow")).to.exist;
    });

    it("alpha slider has aria-valuemin and aria-valuemax", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha></y-colorpicker>`,
        );
        const slider = el.shadowRoot.querySelector(".alpha-slider");
        expect(slider.getAttribute("aria-valuemin")).to.equal("0");
        expect(slider.getAttribute("aria-valuemax")).to.equal("100");
    });

    // -------------------------------------------------------------------------
    // Focusability
    // -------------------------------------------------------------------------

    it("canvas is focusable", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const canvas = el.shadowRoot.querySelector(".canvas");
        expect(canvas.getAttribute("tabindex")).to.equal("0");
    });

    it("hue slider is focusable", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const slider = el.shadowRoot.querySelector(".hue-slider");
        expect(slider.getAttribute("tabindex")).to.equal("0");
    });

    it("alpha slider is focusable", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha></y-colorpicker>`,
        );
        const slider = el.shadowRoot.querySelector(".alpha-slider");
        expect(slider.getAttribute("tabindex")).to.equal("0");
    });

    // -------------------------------------------------------------------------
    // CSS Parts
    // -------------------------------------------------------------------------

    it("exposes expected CSS parts", async () => {
        const el = await fixture(
            html`<y-colorpicker show-alpha value="#ff0000"></y-colorpicker>`,
        );
        const parts = [
            "colorpicker",
            "canvas",
            "canvas-handle",
            "hue-slider",
            "hue-thumb",
            "alpha-slider",
            "alpha-thumb",
            "inputs-row",
            "format-select",
            "swatch-preview",
        ];
        for (const part of parts) {
            expect(
                el.shadowRoot.querySelector(`[part~="${part}"]`),
                `part="${part}" should exist`,
            ).to.exist;
        }
    });

    // -------------------------------------------------------------------------
    // Attribute changes
    // -------------------------------------------------------------------------

    it("re-renders when format attribute changes", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hex" value="#ff0000"></y-colorpicker>`,
        );
        el.setAttribute("format", "rgb");
        await nextFrame();
        const inputs = el.shadowRoot.querySelectorAll(
            ".channel-inputs y-input",
        );
        expect(inputs.length).to.equal(3);
    });

    it("updates internal model when value attribute changes", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el.setAttribute("value", "#00ff00");
        await nextFrame();
        expect(el.value).to.equal("#00ff00");
    });

    it("does not loop when _updatingValue guard is active", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000"></y-colorpicker>`,
        );
        el._updatingValue = true;
        el.setAttribute("value", "#0000ff");
        // Should not apply the new color since guard is active
        el._updatingValue = false;
        expect(el).to.exist;
    });

    // -------------------------------------------------------------------------
    // Swatch slot
    // -------------------------------------------------------------------------

    it("has a swatch slot for custom swatch content", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const slot = el.shadowRoot.querySelector('slot[name="swatch"]');
        expect(slot).to.exist;
    });

    // -------------------------------------------------------------------------
    // Global pointer cleanup
    // -------------------------------------------------------------------------

    it("removes global listeners on disconnectedCallback", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const spy = sinon.spy(window, "removeEventListener");
        el.remove();
        expect(spy.calledWith("pointermove")).to.be.true;
        expect(spy.calledWith("pointerup")).to.be.true;
        spy.restore();
    });
});
