import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../src/components/y-radio/y-radio.js";

describe("<y-radio>", () => {
    const options = [
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
        { value: "cherry", label: "Cherry" },
    ];

    it("renders all radio options from the 'options' attribute", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );

        const inputs = el.shadowRoot.querySelectorAll('input[type="radio"]');
        expect(inputs.length).to.equal(3);

        inputs.forEach((input, index) => {
            expect(input.value).to.equal(options[index].value);
        });
    });

    it("selects a radio option when clicked", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );

        const input = el.shadowRoot.querySelectorAll("input")[1];
        input.click();

        expect(el.value).to.equal("banana");
        expect(input.checked).to.be.true;
    });

    it("reflects initial 'value' attribute as checked", async () => {
        const el = await fixture(
            html`<y-radio
                .options=${options}
                name="fruits"
                value="cherry"
            ></y-radio>`
        );

        const input = el.shadowRoot.querySelector('input[value="cherry"]');
        expect(input.checked).to.be.true;
        expect(el.value).to.equal("cherry");
    });

    it("emits a 'change' event with new value", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );

        const input = el.shadowRoot.querySelectorAll("input")[2];
        setTimeout(() => input.click());

        const event = await oneEvent(el, "change");
        expect(event.detail.value).to.equal("cherry");
    });

    it("participates in forms", async () => {
        const el = await fixture(html`
            <form>
                <y-radio
                    name="fruit"
                    value="banana"
                    .options=${[
                        { value: "apple", label: "Apple" },
                        { value: "banana", label: "Banana" },
                    ]}
                ></y-radio>
            </form>
        `);

        const form = el;

        // Simulate a form submission
        const formData = new FormData(form);
        expect(formData.get("fruit")).to.equal("banana");
    });

    it("updates the selected value when the 'value' attribute is changed", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );

        el.setAttribute("value", "apple");
        await el.updateComplete;

        expect(el.value).to.equal("apple");

        const input = el.shadowRoot.querySelector('input[value="apple"]');
        expect(input.checked).to.be.true;
    });

    it("disabled setter sets the disabled attribute", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        expect(el.disabled).to.be.false;

        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        expect(el.disabled).to.be.true;
    });

    it("disabled setter removes the disabled attribute when set to false", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits" disabled></y-radio>`
        );
        expect(el.disabled).to.be.true;

        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
        expect(el.disabled).to.be.false;
    });

    it("options setter updates the rendered radio inputs", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        expect(el.shadowRoot.querySelectorAll("input[type=radio]").length).to.equal(3);

        el.options = [{ value: "mango", label: "Mango" }];

        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        expect(inputs.length).to.equal(1);
        expect(inputs[0].value).to.equal("mango");
    });

    it("ArrowDown moves focus to the next radio input", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        inputs[0].focus();
        inputs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(inputs[1]);
    });

    it("ArrowRight moves focus to the next radio input", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        inputs[0].focus();
        inputs[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(inputs[1]);
    });

    it("ArrowUp moves focus to the previous radio input", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        inputs[1].focus();
        inputs[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(inputs[0]);
    });

    it("ArrowLeft moves focus to the previous radio input", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        inputs[2].focus();
        inputs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(inputs[1]);
    });

    it("ArrowDown wraps from last to first radio input", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        inputs[2].focus();
        inputs[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(inputs[0]);
    });

    it("Enter key selects the focused radio and dispatches change event", async () => {
        const el = await fixture(
            html`<y-radio .options=${options} name="fruits"></y-radio>`
        );
        const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
        inputs[1].focus();

        setTimeout(() => {
            inputs[1].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        });

        const event = await oneEvent(el, "change");
        expect(el.value).to.equal("banana");
        expect(event.detail.value).to.equal("banana");
    });
});
