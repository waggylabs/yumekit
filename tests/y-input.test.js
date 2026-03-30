import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/y-input/y-input.js";

describe("<y-input>", () => {
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
});
