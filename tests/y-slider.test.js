import { html, fixture, expect } from "@open-wc/testing";
import "../src/components/y-slider/y-slider.js";

describe("YumeSlider", () => {
    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        const track = el.shadowRoot.querySelector(".slider-track");
        const thumb = el.shadowRoot.querySelector(".thumb");
        const fill = el.shadowRoot.querySelector(".fill");

        expect(track).to.exist;
        expect(thumb).to.exist;
        expect(fill).to.exist;
        expect(track.getAttribute("role")).to.equal("slider");
        expect(track.getAttribute("aria-valuenow")).to.equal("50");
        expect(track.getAttribute("aria-valuemin")).to.equal("0");
        expect(track.getAttribute("aria-valuemax")).to.equal("100");
    });

    it("defaults min to 0, max to 100, value to 50", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        expect(el.min).to.equal(0);
        expect(el.max).to.equal(100);
        expect(el.value).to.equal(50);
    });

    it("computes percentage correctly", async () => {
        const el = await fixture(
            html`<y-slider value="25" min="0" max="200"></y-slider>`,
        );
        expect(el.percentage).to.equal(12.5);
    });

    it("clamps value to min and max", async () => {
        const el = await fixture(html`<y-slider min="0" max="100"></y-slider>`);
        el.value = 150;
        expect(el.value).to.equal(100);

        el.value = -10;
        expect(el.value).to.equal(0);
    });

    it("snaps value to step", async () => {
        const el = await fixture(
            html`<y-slider value="0" min="0" max="100" step="25"></y-slider>`,
        );
        el.value = 33;
        expect(el.value).to.equal(25);

        el.value = 38;
        expect(el.value).to.equal(50);
    });

    it("applies fill width from percentage", async () => {
        const el = await fixture(
            html`<y-slider value="75" min="0" max="100"></y-slider>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("width: 75%");
    });

    it("applies track fill color from background variable", async () => {
        const el = await fixture(
            html`<y-slider value="50" color="success"></y-slider>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("var(--success-background-hover)");
    });

    it("applies thumb color from content variable", async () => {
        const el = await fixture(
            html`<y-slider value="50" color="success"></y-slider>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("var(--success-content--)");
    });

    it("uses fallback color if custom color provided", async () => {
        const el = await fixture(
            html`<y-slider value="50" color="#ff0000"></y-slider>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("#ff0000");
    });

    it("applies disabled styling", async () => {
        const el = await fixture(
            html`<y-slider value="50" disabled></y-slider>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("opacity: 0.5");
        expect(style).to.include("pointer-events: none");
        const track = el.shadowRoot.querySelector(".slider-track");
        expect(track.getAttribute("tabindex")).to.equal("-1");
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        expect(el.size).to.equal("medium");
    });

    it("sets aria-valuestep when step is provided", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        expect(track.getAttribute("aria-valuestep")).to.equal("10");
    });

    it("is focusable via tabindex", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        const track = el.shadowRoot.querySelector(".slider-track");
        expect(track.getAttribute("tabindex")).to.equal("0");
    });

    it("updates when attributes change", async () => {
        const el = await fixture(html`<y-slider value="20"></y-slider>`);
        el.setAttribute("value", "80");
        const track = el.shadowRoot.querySelector(".slider-track");
        expect(track.getAttribute("aria-valuenow")).to.equal("80");
    });

    it("is form-associated", async () => {
        const el = await fixture(
            html`<y-slider name="volume" value="70"></y-slider>`,
        );
        expect(el._internals).to.exist;
    });

    it("dispatches input event on keyboard navigation", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        let inputFired = false;
        el.addEventListener("input", () => {
            inputFired = true;
        });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(inputFired).to.be.true;
        expect(el.value).to.equal(60);
    });

    it("does not go above max on ArrowRight", async () => {
        const el = await fixture(
            html`<y-slider value="95" step="10" max="100"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el.value).to.equal(100);
    });

    it("does not go below min on ArrowLeft", async () => {
        const el = await fixture(
            html`<y-slider value="5" step="10" min="0"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el.value).to.equal(0);
    });

    it("jumps to min on Home key", async () => {
        const el = await fixture(
            html`<y-slider value="50" min="10" max="100"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
        );
        expect(el.value).to.equal(10);
    });

    it("jumps to max on End key", async () => {
        const el = await fixture(
            html`<y-slider value="50" min="0" max="90"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "End", bubbles: true }),
        );
        expect(el.value).to.equal(90);
    });

    it("disabled setter sets the disabled attribute", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        expect(el.disabled).to.be.false;

        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        expect(el.disabled).to.be.true;
    });

    it("disabled setter removes the disabled attribute when set to false", async () => {
        const el = await fixture(html`<y-slider disabled></y-slider>`);
        expect(el.disabled).to.be.true;

        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
        expect(el.disabled).to.be.false;
    });

    it("step setter removes the step attribute when set to null", async () => {
        const el = await fixture(html`<y-slider step="10"></y-slider>`);
        expect(el.step).to.equal(10);

        el.step = null;
        expect(el.hasAttribute("step")).to.be.false;
        expect(el.step).to.be.null;
    });

    it("step setter removes the step attribute when set to undefined", async () => {
        const el = await fixture(html`<y-slider step="5"></y-slider>`);
        el.step = undefined;
        expect(el.hasAttribute("step")).to.be.false;
    });

    it("keyboard events do not fire on a disabled slider", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10" disabled></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        let inputFired = false;
        el.addEventListener("input", () => { inputFired = true; });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(inputFired).to.be.false;
        expect(el.value).to.equal(50);
    });

    it("dispatches change event on keyboard navigation", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        let changeFired = false;
        el.addEventListener("change", () => { changeFired = true; });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(changeFired).to.be.true;
        expect(el.value).to.equal(40);
    });

    it("unhandled key does not fire input event", async () => {
        const el = await fixture(html`<y-slider value="50"></y-slider>`);
        const track = el.shadowRoot.querySelector(".slider-track");
        let inputFired = false;
        el.addEventListener("input", () => { inputFired = true; });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Tab", bubbles: true }),
        );
        expect(inputFired).to.be.false;
    });

    it("_updateVisuals updates fill width and thumb position after value change", async () => {
        const el = await fixture(html`<y-slider value="0" min="0" max="100"></y-slider>`);
        el.value = 75;

        const fill = el.shadowRoot.querySelector(".fill");
        const thumb = el.shadowRoot.querySelector(".thumb");
        const track = el.shadowRoot.querySelector(".slider-track");

        expect(fill.style.width).to.equal("75%");
        expect(thumb.style.left).to.equal("75%");
        expect(track.getAttribute("aria-valuenow")).to.equal("75");
    });

    it("percentage returns 0 when range is zero", async () => {
        const el = await fixture(
            html`<y-slider value="5" min="5" max="5"></y-slider>`,
        );
        expect(el.percentage).to.equal(0);
    });

    it("pointerdown on a disabled slider does not start dragging", async () => {
        const el = await fixture(
            html`<y-slider value="50" disabled></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".slider-track");
        track.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0 }));
        expect(el._dragging).to.be.false;
    });
});
