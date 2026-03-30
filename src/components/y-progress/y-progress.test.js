import { html, fixture, expect } from "@open-wc/testing";
import "./y-progress.js";

describe("YumeProgress", () => {
    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        const track = el.shadowRoot.querySelector(".track");
        const bar = el.shadowRoot.querySelector(".bar");

        expect(track).to.exist;
        expect(bar).to.exist;
        expect(track.getAttribute("role")).to.equal("progressbar");
        expect(track.getAttribute("aria-valuenow")).to.equal("50");
        expect(track.getAttribute("aria-valuemin")).to.equal("0");
        expect(track.getAttribute("aria-valuemax")).to.equal("100");
    });

    it("defaults min to 0 and max to 100", async () => {
        const el = await fixture(html`<y-progress value="25"></y-progress>`);
        expect(el.min).to.equal(0);
        expect(el.max).to.equal(100);
    });

    it("computes percentage correctly", async () => {
        const el = await fixture(
            html`<y-progress value="50" min="0" max="200"></y-progress>`,
        );
        expect(el.percentage).to.equal(25);
    });

    it("clamps percentage between 0 and 100", async () => {
        const el = await fixture(
            html`<y-progress value="150" max="100"></y-progress>`,
        );
        expect(el.percentage).to.equal(100);

        el.value = -10;
        expect(el.percentage).to.equal(0);
    });

    it("applies bar width from percentage", async () => {
        const el = await fixture(html`<y-progress value="75"></y-progress>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("width: 75%");
    });

    it("supports custom min and max", async () => {
        const el = await fixture(
            html`<y-progress value="5" min="0" max="10"></y-progress>`,
        );
        expect(el.percentage).to.equal(50);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("width: 50%");
    });

    it("snaps to step values", async () => {
        const el = await fixture(
            html`<y-progress value="33" step="25"></y-progress>`,
        );
        // 33% should snap to 25%
        expect(el.percentage).to.equal(25);
    });

    it("displays percent label centered in the track", async () => {
        const el = await fixture(html`<y-progress value="60"></y-progress>`);
        const track = el.shadowRoot.querySelector(".track");
        const trackLabel = track.querySelector(".value-label--track");
        const barLabel = track.querySelector(".value-label--bar");
        expect(trackLabel).to.exist;
        expect(trackLabel.textContent).to.equal("60%");
        expect(barLabel).to.exist;
        expect(barLabel.textContent).to.equal("60%");
    });

    it("hides label when label-display is false", async () => {
        const el = await fixture(
            html`<y-progress value="60" label-display="false"></y-progress>`,
        );
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label).to.not.exist;
    });

    it("shows value format when label-format is value", async () => {
        const el = await fixture(
            html`<y-progress
                value="40"
                max="200"
                label-format="value"
            ></y-progress>`,
        );
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("40 / 200");
    });

    it("shows fraction format when label-format is fraction", async () => {
        const el = await fixture(
            html`<y-progress
                value="30"
                min="10"
                max="60"
                label-format="fraction"
            ></y-progress>`,
        );
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("20 / 50");
    });

    it("applies color from colorMap", async () => {
        const el = await fixture(
            html`<y-progress value="50" color="success"></y-progress>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("var(--success-content--)");
    });

    it("uses fallback color if custom color provided", async () => {
        const el = await fixture(
            html`<y-progress value="50" color="#ff0000"></y-progress>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("#ff0000");
    });

    it("renders indeterminate state", async () => {
        const el = await fixture(html`<y-progress indeterminate></y-progress>`);
        const track = el.shadowRoot.querySelector(".track");
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(track.getAttribute("aria-busy")).to.equal("true");
        expect(style).to.include("animation: indeterminate");
        // no value label in indeterminate
        expect(el.shadowRoot.querySelector(".value-label")).to.not.exist;
    });

    it("applies disabled styling", async () => {
        const el = await fixture(
            html`<y-progress value="50" disabled></y-progress>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("opacity: 0.5");
        expect(style).to.include("pointer-events: none");
    });

    it("applies correct size variable", async () => {
        const el = await fixture(
            html`<y-progress value="50" size="large"></y-progress>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-progress-size-large");
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        expect(el.size).to.equal("medium");
    });

    it("increments value by step", async () => {
        const el = await fixture(
            html`<y-progress value="40" step="10" max="100"></y-progress>`,
        );
        el.increment();
        expect(el.value).to.equal(50);
    });

    it("does not increment past max", async () => {
        const el = await fixture(
            html`<y-progress value="95" step="10" max="100"></y-progress>`,
        );
        el.increment();
        expect(el.value).to.equal(100);
    });

    it("decrements value by step", async () => {
        const el = await fixture(
            html`<y-progress value="40" step="10"></y-progress>`,
        );
        el.decrement();
        expect(el.value).to.equal(30);
    });

    it("does not decrement below min", async () => {
        const el = await fixture(
            html`<y-progress value="5" step="10" min="0"></y-progress>`,
        );
        el.decrement();
        expect(el.value).to.equal(0);
    });

    it("updates when attributes change", async () => {
        const el = await fixture(html`<y-progress value="20"></y-progress>`);
        el.setAttribute("value", "80");
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("80%");
    });

    it("renders slotted label content", async () => {
        const el = await fixture(
            html`<y-progress value="50">Loading...</y-progress>`,
        );
        const slot = el.shadowRoot.querySelector("slot");
        expect(slot).to.exist;
    });

    it("sets color via the color setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.color = "error";
        expect(el.getAttribute("color")).to.equal("error");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("var(--error-content--)");
    });

    it("sets disabled to true via the disabled setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("opacity: 0.5");
    });

    it("removes disabled attribute via the disabled setter when set to false", async () => {
        const el = await fixture(
            html`<y-progress value="50" disabled></y-progress>`,
        );
        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("opacity: 1");
    });

    it("sets indeterminate to true via the indeterminate setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.indeterminate = true;
        expect(el.hasAttribute("indeterminate")).to.be.true;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-busy")).to.equal("true");
    });

    it("removes indeterminate attribute via the indeterminate setter when set to false", async () => {
        const el = await fixture(
            html`<y-progress value="50" indeterminate></y-progress>`,
        );
        el.indeterminate = false;
        expect(el.hasAttribute("indeterminate")).to.be.false;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-busy")).to.be.null;
    });

    it("sets size via the size setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-progress-size-small");
    });

    it("sets value via the value setter", async () => {
        const el = await fixture(html`<y-progress value="20"></y-progress>`);
        el.value = 75;
        expect(el.getAttribute("value")).to.equal("75");
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("75%");
    });

    it("removes value attribute via the value setter when set to null", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.value = null;
        expect(el.hasAttribute("value")).to.be.false;
        expect(el.value).to.be.null;
    });

    it("sets step via the step setter", async () => {
        const el = await fixture(html`<y-progress value="33"></y-progress>`);
        el.step = 10;
        expect(el.getAttribute("step")).to.equal("10");
        expect(el.step).to.equal(10);
    });

    it("removes step attribute via the step setter when set to null", async () => {
        const el = await fixture(
            html`<y-progress value="50" step="10"></y-progress>`,
        );
        el.step = null;
        expect(el.hasAttribute("step")).to.be.false;
        expect(el.step).to.be.null;
    });
});
