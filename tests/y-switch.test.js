import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/y-switch.js";

describe("<y-switch>", () => {
    it("renders with default properties", async () => {
        const el = await fixture(html`<y-switch></y-switch>`);
        const toggle = el.shadowRoot.querySelector(".toggle");
        expect(toggle).to.exist;
        expect(el.checked).to.be.false;
    });

    it("reflects the 'checked' attribute and updates form value", async () => {
        const el = await fixture(
            html`<y-switch checked name="test"></y-switch>`,
        );
        expect(el.checked).to.be.true;
        expect(
            el.shadowRoot.querySelector(".switch").getAttribute("aria-checked"),
        ).to.equal("true");
        expect(el.value).to.equal("on");
    });

    it("toggles checked state on click", async () => {
        const el = await fixture(html`<y-switch></y-switch>`);
        el.shadowRoot.querySelector(".switch").click();
        expect(el.checked).to.be.true;
        el.shadowRoot.querySelector(".switch").click();
        expect(el.checked).to.be.false;
    });

    it("toggles checked state with keyboard", async () => {
        const el = await fixture(html`<y-switch></y-switch>`);
        const switchEl = el.shadowRoot.querySelector(".switch");
        switchEl.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
        expect(el.checked).to.be.true;
    });

    it("emits 'change' event on toggle", async () => {
        const el = await fixture(html`<y-switch></y-switch>`);
        setTimeout(() => el.shadowRoot.querySelector(".switch").click());
        const ev = await oneEvent(el, "change");
        expect(ev).to.exist;
    });

    it("applies label and label-position correctly", async () => {
        const el = await fixture(html`
            <y-switch label-position="left">
                <span slot="label">Power</span>
            </y-switch>
        `);
        const labelSlot = el.shadowRoot.querySelector("slot[name='label']");
        expect(labelSlot).to.exist;
    });

    it("hides label wrapper when no label content is slotted", async () => {
        const el = await fixture(html`<y-switch></y-switch>`);
        const labelSlot = el.shadowRoot.querySelector("slot[name='label']");
        const wrapper = labelSlot?.closest(".label-wrapper");
        expect(wrapper?.style.display).to.equal("none");
    });

    it("shows label wrapper when label content is slotted", async () => {
        const el = await fixture(html`
            <y-switch label-position="right">
                <span slot="label">Power</span>
            </y-switch>
        `);
        const labelSlot = el.shadowRoot.querySelector("slot[name='label']");
        const wrapper = labelSlot?.closest(".label-wrapper");
        expect(wrapper?.style.display).to.not.equal("none");
    });

    it("participates in forms", async () => {
        const form = await fixture(html`
            <form>
                <y-switch name="status" checked></y-switch>
            </form>
        `);
        const input = form.querySelector("y-switch");
        expect(input.value).to.equal("on");
    });

    it("respects disabled attribute", async () => {
        const el = await fixture(html`<y-switch disabled></y-switch>`);
        el.shadowRoot.querySelector(".switch").click();
        expect(el.checked).to.be.false;
    });

    it("uses mirrored toggle content when both slots are defined", async () => {
        const el = await fixture(html`
            <y-switch checked>
                <span slot="on-label">🌙</span>
                <span slot="off-label">☀️</span>
            </y-switch>
        `);
        const visible = el.shadowRoot.querySelector(".toggle .on");
        expect(visible.textContent.trim()).to.equal("🌙");
    });

    it("uses fallback toggle content when only one label is defined", async () => {
        const el = await fixture(html`
            <y-switch checked>
                <span slot="on-label">OnlyOn</span>
            </y-switch>
        `);
        const visible = el.shadowRoot.querySelector(".toggle .on");
        expect(visible.textContent.trim()).to.equal("OnlyOn");
    });
});
