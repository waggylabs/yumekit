import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-input.js";

describe("<y-input>", () => {
    it("variant='underline' renders a bottom-only border with square bottom corners", async () => {
        const el = await fixture(html`<y-input variant="underline"></y-input>`);
        el.style.setProperty("--component-inputs-border-radius-outer", "6px");
        const cs = getComputedStyle(el.shadowRoot.querySelector(".input-container"));
        expect(cs.borderTopStyle).to.equal("none");
        expect(cs.borderBottomStyle).to.equal("solid");
        expect(cs.borderTopLeftRadius).to.equal("6px");
        expect(cs.borderBottomLeftRadius).to.equal("0px");
    });

    it("accepts per-side --component-inputs-border-width and multi-value border-radius", async () => {
        const el = await fixture(html`<y-input></y-input>`);
        // A border color is needed for the shorthand to be valid (and thus
        // border-style: solid) so the longhand widths render.
        el.style.setProperty("--component-input-border-color", "rgb(0, 0, 0)");
        el.style.setProperty("--component-inputs-border-width", "0px 0px 2px 0px");
        el.style.setProperty("--component-inputs-border-radius-outer", "8px 8px 0px 0px");
        const cs = getComputedStyle(el.shadowRoot.querySelector(".input-container"));
        // Width is a longhand now, so a 1–4 value pattern applies per side.
        expect(cs.borderTopWidth).to.equal("0px");
        expect(cs.borderBottomWidth).to.equal("2px");
        // border-radius already takes a 1–4 value pattern.
        expect(cs.borderTopLeftRadius).to.equal("8px");
        expect(cs.borderBottomLeftRadius).to.equal("0px");
    });

    it("renders correctly with default props", async () => {
        const el = await fixture(
            html`<y-input><span slot="label">Name</span></y-input>`
        );
        const input = el.shadowRoot.querySelector("input");

        expect(input).to.exist;
        expect(input.type).to.equal("text");
        expect(input.value).to.equal("");
        expect(el.getAttribute("size")).to.equal("medium");
        expect(el.getAttribute("label-position")).to.equal("top");
    });

    it("respects 'type' and 'value' attributes", async () => {
        const el = await fixture(
            html`<y-input type="email" value="me@example.com"></y-input>`
        );
        const input = el.shadowRoot.querySelector("input");

        expect(input.type).to.equal("email");
        expect(input.value).to.equal("me@example.com");
    });

    it("updates 'value' property when user types", async () => {
        const el = await fixture(html`<y-input></y-input>`);
        const input = el.shadowRoot.querySelector("input");

        input.value = "test123";
        input.dispatchEvent(
            new Event("input", { bubbles: true, composed: true })
        );

        expect(el.value).to.equal("test123");
    });

    it("dispatches 'input' event on change", async () => {
        const el = await fixture(html`<y-input></y-input>`);
        const input = el.shadowRoot.querySelector("input");

        setTimeout(() => {
            input.value = "hello";
            input.dispatchEvent(
                new Event("input", { bubbles: true, composed: true })
            );
        });

        const e = await oneEvent(el, "input");
        expect(e).to.exist;
        expect(e.detail.value).to.equal("hello");
    });

    it("reflects 'disabled' attribute correctly", async () => {
        const el = await fixture(html`<y-input disabled></y-input>`);
        const input = el.shadowRoot.querySelector("input");

        expect(input.hasAttribute("disabled")).to.be.true;
    });

    it("applies invalid styles when 'invalid' attribute is set", async () => {
        const el = await fixture(html`<y-input invalid></y-input>`);
        const wrapper = el.shadowRoot.querySelector(".input-container");

        expect(wrapper.classList.contains("is-invalid")).to.be.true;
    });

    it("sets form value when associated with a form", async () => {
        const form = await fixture(html`
            <form>
                <y-input name="username" value="jeff"></y-input>
                <button type="submit">Submit</button>
            </form>
        `);
        const data = new FormData(form);
        expect(data.get("username")).to.equal("jeff");
    });

    it("updates internal form value when 'value' changes", async () => {
        const form = await fixture(html`
            <form>
                <y-input name="email" value="original"></y-input>
            </form>
        `);

        const input = form.querySelector("y-input");
        input.value = "updated";

        // Trigger form data extraction
        const formData = new FormData(form);

        expect(formData.get("email")).to.equal("updated");
    });

    it("disabled setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-input></y-input>`);
        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
    });

    it("invalid setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-input></y-input>`);
        el.invalid = true;
        expect(el.hasAttribute("invalid")).to.be.true;
        el.invalid = false;
        expect(el.hasAttribute("invalid")).to.be.false;
    });

    it("size setter updates attribute", async () => {
        const el = await fixture(html`<y-input></y-input>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("value setter falls back to setAttribute when input element is not yet available", async () => {
        // Create element but set value before it is connected so this.input may be null
        const el = document.createElement("y-input");
        el.value = "preset";
        document.body.appendChild(el);
        await new Promise((r) => setTimeout(r, 0));
        expect(el.value).to.equal("preset");
        document.body.removeChild(el);
    });

    describe("XSS hardening", () => {
        const cases = [
            { name: "value", payload: `" onfocus="window.__xssInputValue=true" autofocus x="`, flag: "__xssInputValue" },
            { name: "type",  payload: `text" onfocus="window.__xssInputType=true" autofocus x="`, flag: "__xssInputType" },
            { name: "min",   payload: `0" onfocus="window.__xssInputMin=true" autofocus x="`,   flag: "__xssInputMin" },
            { name: "max",   payload: `9" onfocus="window.__xssInputMax=true" autofocus x="`,   flag: "__xssInputMax" },
            { name: "step",  payload: `1" onfocus="window.__xssInputStep=true" autofocus x="`,  flag: "__xssInputStep" },
        ];

        for (const { name, payload, flag } of cases) {
            it(`does not allow attribute breakout via ${name}`, async () => {
                const el = document.createElement("y-input");
                el.setAttribute(name, payload);
                document.body.appendChild(el);

                expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
                expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
                expect(window[flag]).to.be.undefined;

                document.body.removeChild(el);
            });
        }
    });
});
