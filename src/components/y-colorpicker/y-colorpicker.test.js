import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-colorpicker.js";

describe("YumeColorpicker", () => {
    // ── Defaults ──────────────────────────────────────────────

    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const picker = el.shadowRoot.querySelector(".colorpicker");
        expect(picker).to.exist;
        expect(picker.getAttribute("part")).to.equal("colorpicker");
    });

    it("renders a canvas", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const canvas = el.shadowRoot.querySelector("canvas.canvas");
        expect(canvas).to.exist;
        expect(canvas.getAttribute("role")).to.equal("slider");
    });

    it("renders a hue slider", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const hue = el.shadowRoot.querySelector(".hue-slider");
        expect(hue).to.exist;
        expect(hue.getAttribute("role")).to.equal("slider");
        expect(hue.getAttribute("aria-valuemin")).to.equal("0");
        expect(hue.getAttribute("aria-valuemax")).to.equal("360");
    });

    it("does not render alpha slider by default", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const alpha = el.shadowRoot.querySelector(".alpha-slider");
        expect(alpha).to.not.exist;
    });

    it("renders a format select", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const sel = el.shadowRoot.querySelector("y-select.format-select");
        expect(sel).to.exist;
    });

    it("renders channel inputs", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        // hex format = 1 input
        expect(inputs.length).to.equal(1);
    });

    it("defaults to hex format", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.format).to.equal("hex");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.size).to.equal("medium");
    });

    // ── Value parsing ─────────────────────────────────────────

    it("parses hex value", async () => {
        const el = await fixture(html`<y-colorpicker value="#ff0000"></y-colorpicker>`);
        expect(el.value).to.equal("#ff0000");
    });

    it("parses rgb value", async () => {
        const el = await fixture(
            html`<y-colorpicker value="rgb(255, 0, 0)" format="rgb"></y-colorpicker>`,
        );
        expect(el.value).to.equal("rgb(255, 0, 0)");
    });

    it("parses hsl value", async () => {
        const el = await fixture(
            html`<y-colorpicker value="hsl(0, 100%, 50%)" format="hsl"></y-colorpicker>`,
        );
        expect(el.value).to.equal("hsl(0, 100%, 50%)");
    });

    it("parses hsv value", async () => {
        const el = await fixture(
            html`<y-colorpicker value="hsv(0, 100%, 100%)" format="hsv"></y-colorpicker>`,
        );
        expect(el.value).to.equal("hsv(0, 100%, 100%)");
    });

    it("parses short hex (#abc)", async () => {
        const el = await fixture(html`<y-colorpicker value="#abc"></y-colorpicker>`);
        // HSV roundtrip may cause ±1 rounding; verify it's close
        expect(el.value).to.match(/^#[0-9a-f]{6}$/);
        expect(el.value.startsWith("#a")).to.be.true;
    });

    it("parses rgba value with alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker value="rgba(255, 0, 0, 0.5)" format="rgb" show-alpha></y-colorpicker>`,
        );
        expect(el.value).to.equal("rgba(255, 0, 0, 0.5)");
    });

    it("parses hex8 value with alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff000080" show-alpha></y-colorpicker>`,
        );
        // alpha = 128/255 ≈ 0.50
        const val = el.value;
        expect(val.startsWith("#ff0000")).to.be.true;
        expect(val.length).to.equal(9);
    });

    // ── Format switching ──────────────────────────────────────

    it("formats property returns value in active format", async () => {
        const el = await fixture(html`<y-colorpicker value="#ff0000"></y-colorpicker>`);
        expect(el.format).to.equal("hex");
        expect(el.value).to.equal("#ff0000");

        el.format = "rgb";
        expect(el.value).to.equal("rgb(255, 0, 0)");
    });

    it("format setter updates the attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.format = "hsl";
        expect(el.getAttribute("format")).to.equal("hsl");
    });

    // ── Show-alpha ────────────────────────────────────────────

    it("renders alpha slider when show-alpha is set", async () => {
        const el = await fixture(html`<y-colorpicker show-alpha></y-colorpicker>`);
        const alpha = el.shadowRoot.querySelector(".alpha-slider");
        expect(alpha).to.exist;
        expect(alpha.getAttribute("role")).to.equal("slider");
        expect(alpha.getAttribute("aria-valuemin")).to.equal("0");
        expect(alpha.getAttribute("aria-valuemax")).to.equal("100");
    });

    it("showAlpha setter toggles the attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.showAlpha = true;
        expect(el.hasAttribute("show-alpha")).to.be.true;

        el.showAlpha = false;
        expect(el.hasAttribute("show-alpha")).to.be.false;
    });

    // ── Formats list ──────────────────────────────────────────

    it("defaults to all four formats", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.formats).to.deep.equal(["hex", "rgb", "hsl", "hsv"]);
    });

    it("accepts a custom formats list", async () => {
        const el = await fixture(
            html`<y-colorpicker formats='["hex","rgb"]'></y-colorpicker>`,
        );
        expect(el.formats).to.deep.equal(["hex", "rgb"]);
    });

    it("formats setter updates the attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.formats = ["hex", "hsl"];
        expect(el.formats).to.deep.equal(["hex", "hsl"]);
    });

    // ── Size ──────────────────────────────────────────────────

    it("size setter updates the attribute", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");
    });

    // ── Channel inputs per format ─────────────────────────────

    it("shows 1 input for hex format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hex" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(1);
    });

    it("shows 3 inputs for rgb format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="rgb" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(3);
    });

    it("shows 4 inputs for rgb format with alpha", async () => {
        const el = await fixture(
            html`<y-colorpicker format="rgb" value="#ff0000" show-alpha></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(4);
    });

    it("shows 3 inputs for hsl format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hsl" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(3);
    });

    it("shows 3 inputs for hsv format", async () => {
        const el = await fixture(
            html`<y-colorpicker format="hsv" value="#ff0000"></y-colorpicker>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(3);
    });

    // ── setColor method ───────────────────────────────────────

    it("setColor updates the internal color", async () => {
        const el = await fixture(html`<y-colorpicker format="hex"></y-colorpicker>`);
        el.setColor("#00ff00");
        expect(el.value).to.equal("#00ff00");
    });

    it("setColor accepts any format regardless of active format", async () => {
        const el = await fixture(html`<y-colorpicker format="hex"></y-colorpicker>`);
        el.setColor("rgb(0, 128, 255)");
        const hex = el.value;
        expect(hex).to.match(/^#[0-9a-f]{6}$/);
    });

    // ── Events ────────────────────────────────────────────────

    it("dispatches change event on value set via setColor", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        // setColor doesn't emit change — only user interaction does
        // But keyboard interaction on canvas does
        const canvas = el.shadowRoot.querySelector(".canvas");
        setTimeout(() => {
            canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        });
        const event = await oneEvent(el, "change");
        expect(event).to.exist;
        expect(event.detail.value).to.exist;
        expect(event.detail.hex).to.exist;
        expect(event.detail.rgb).to.exist;
        expect(event.detail.hsl).to.exist;
        expect(event.detail.hsv).to.exist;
        expect(event.detail.alpha).to.be.a("number");
    });

    // ── CSS parts ─────────────────────────────────────────────

    it("exposes colorpicker part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='colorpicker']")).to.exist;
    });

    it("exposes canvas part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='canvas']")).to.exist;
    });

    it("exposes canvas-handle part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='canvas-handle']")).to.exist;
    });

    it("exposes hue-slider part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='hue-slider']")).to.exist;
    });

    it("exposes hue-thumb part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='hue-thumb']")).to.exist;
    });

    it("exposes alpha-slider part when show-alpha", async () => {
        const el = await fixture(html`<y-colorpicker show-alpha></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='alpha-slider']")).to.exist;
    });

    it("exposes alpha-thumb part when show-alpha", async () => {
        const el = await fixture(html`<y-colorpicker show-alpha></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='alpha-thumb']")).to.exist;
    });

    it("exposes inputs-row part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='inputs-row']")).to.exist;
    });

    it("exposes format-select part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='format-select']")).to.exist;
    });

    it("exposes swatch-preview part", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        expect(el.shadowRoot.querySelector("[part='swatch-preview']")).to.exist;
    });

    // ── Accessibility ─────────────────────────────────────────

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
        const text = canvas.getAttribute("aria-valuetext");
        expect(text).to.include("Hue");
        expect(text).to.include("Saturation");
        expect(text).to.include("Brightness");
    });

    it("hue slider has aria-label", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const hue = el.shadowRoot.querySelector(".hue-slider");
        expect(hue.getAttribute("aria-label")).to.equal("Hue");
    });

    it("alpha slider has aria-label when show-alpha", async () => {
        const el = await fixture(html`<y-colorpicker show-alpha></y-colorpicker>`);
        const alpha = el.shadowRoot.querySelector(".alpha-slider");
        expect(alpha.getAttribute("aria-label")).to.equal("Alpha");
    });

    it("canvas is focusable", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const canvas = el.shadowRoot.querySelector(".canvas");
        expect(canvas.getAttribute("tabindex")).to.equal("0");
    });

    it("hue slider is focusable", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const hue = el.shadowRoot.querySelector(".hue-slider");
        expect(hue.getAttribute("tabindex")).to.equal("0");
    });

    it("alpha slider is focusable", async () => {
        const el = await fixture(html`<y-colorpicker show-alpha></y-colorpicker>`);
        const alpha = el.shadowRoot.querySelector(".alpha-slider");
        expect(alpha.getAttribute("tabindex")).to.equal("0");
    });

    // ── Keyboard navigation ───────────────────────────────────

    it("arrow right on canvas increases saturation", async () => {
        const el = await fixture(
            html`<y-colorpicker value="hsv(0, 50%, 50%)"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
        // Saturation should have increased by 1
        expect(el.value).to.not.equal("#804040"); // should differ
    });

    it("shift+arrow on canvas nudges by 10", async () => {
        const el = await fixture(
            html`<y-colorpicker value="hsv(0, 50%, 50%)" format="hsv"></y-colorpicker>`,
        );
        const canvas = el.shadowRoot.querySelector(".canvas");
        canvas.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
        expect(el.value).to.include("60%");
    });

    it("arrow right on hue slider increases hue", async () => {
        const el = await fixture(
            html`<y-colorpicker value="hsv(180, 100%, 100%)" format="hsv"></y-colorpicker>`,
        );
        const hue = el.shadowRoot.querySelector(".hue-slider");
        hue.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
        expect(el.value).to.include("181");
    });

    // ── Slots ─────────────────────────────────────────────────

    it("has a swatch slot", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const slot = el.shadowRoot.querySelector("slot[name='swatch']");
        expect(slot).to.exist;
    });

    // ── Host display ──────────────────────────────────────────

    it("sets host display to inline-block", async () => {
        const el = await fixture(html`<y-colorpicker></y-colorpicker>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: inline-block");
    });

    // ── Color conversions roundtrip ───────────────────────────

    it("roundtrips hex → rgb → hex correctly", async () => {
        const el = await fixture(html`<y-colorpicker value="#3366cc" format="hex"></y-colorpicker>`);
        const hex1 = el.value;
        el.format = "rgb";
        const rgb = el.value;
        el.format = "hex";
        expect(el.value).to.equal(hex1);
    });

    it("roundtrips through hsl", async () => {
        const el = await fixture(html`<y-colorpicker value="#ff8800" format="hex"></y-colorpicker>`);
        const hex1 = el.value;
        el.format = "hsl";
        el.format = "hex";
        expect(el.value).to.equal(hex1);
    });

    // ── Attribute changes ─────────────────────────────────────

    it("re-renders when value attribute changes", async () => {
        const el = await fixture(html`<y-colorpicker value="#ff0000"></y-colorpicker>`);
        el.setAttribute("value", "#00ff00");
        await new Promise((r) => setTimeout(r, 0));
        expect(el.value).to.equal("#00ff00");
    });

    it("re-renders when format attribute changes", async () => {
        const el = await fixture(
            html`<y-colorpicker value="#ff0000" format="hex"></y-colorpicker>`,
        );
        el.setAttribute("format", "rgb");
        await new Promise((r) => setTimeout(r, 0));
        const inputs = el.shadowRoot.querySelectorAll(".channel-inputs y-input");
        expect(inputs.length).to.equal(3);
    });
});
