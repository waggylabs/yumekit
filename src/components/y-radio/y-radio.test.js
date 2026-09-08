import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-radio.js";

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

    describe("per-option disabled", () => {
        const mixed = [
            { value: "apple", label: "Apple" },
            { value: "banana", label: "Banana", disabled: true },
            { value: "cherry", label: "Cherry" },
        ];

        it("disables only the option marked disabled", async () => {
            const el = await fixture(
                html`<y-radio .options=${mixed} name="fruits"></y-radio>`
            );
            const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");

            expect(inputs[0].disabled).to.be.false;
            expect(inputs[1].disabled).to.be.true;
            expect(inputs[2].disabled).to.be.false;
        });

        it("does not change value when a disabled option is clicked", async () => {
            const el = await fixture(
                html`<y-radio .options=${mixed} name="fruits"></y-radio>`
            );
            el.shadowRoot.querySelectorAll("input[type=radio]")[1].click();

            expect(el.value).to.equal("");
        });

        it("skips a disabled option during arrow-key navigation", async () => {
            const el = await fixture(
                html`<y-radio .options=${mixed} name="fruits"></y-radio>`
            );
            const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");
            inputs[0].focus();
            inputs[0].dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })
            );

            expect(el.shadowRoot.activeElement.value).to.equal("cherry");
        });

        it("gives the roving tabindex to the first enabled option", async () => {
            const leadingDisabled = [
                { value: "apple", label: "Apple", disabled: true },
                { value: "banana", label: "Banana" },
            ];
            const el = await fixture(
                html`<y-radio .options=${leadingDisabled} name="fruits"></y-radio>`
            );
            const inputs = el.shadowRoot.querySelectorAll("input[type=radio]");

            expect(inputs[0].getAttribute("tabindex")).to.equal("-1");
            expect(inputs[1].getAttribute("tabindex")).to.equal("0");
        });

        it("still honors the group-level disabled attribute", async () => {
            const el = await fixture(
                html`<y-radio .options=${options} name="fruits" disabled></y-radio>`
            );
            const enabled = [
                ...el.shadowRoot.querySelectorAll("input[type=radio]"),
            ].filter((input) => !input.disabled);

            expect(enabled.length).to.equal(0);
        });
    });

    describe("group naming", () => {
        it("forwards aria-label onto the radiogroup", async () => {
            const el = await fixture(
                html`<y-radio
                    .options=${options}
                    name="fruits"
                    aria-label="Pick a fruit"
                ></y-radio>`
            );
            const fieldset = el.shadowRoot.querySelector("fieldset");

            expect(fieldset.getAttribute("role")).to.equal("radiogroup");
            expect(fieldset.getAttribute("aria-label")).to.equal("Pick a fruit");
        });

        it("forwards aria-labelledby onto the radiogroup", async () => {
            const el = await fixture(
                html`<y-radio
                    .options=${options}
                    name="fruits"
                    aria-labelledby="question"
                ></y-radio>`
            );

            expect(
                el.shadowRoot
                    .querySelector("fieldset")
                    .getAttribute("aria-labelledby")
            ).to.equal("question");
        });

        it("removes the forwarded name when the host attribute is removed", async () => {
            const el = await fixture(
                html`<y-radio
                    .options=${options}
                    name="fruits"
                    aria-label="Pick a fruit"
                ></y-radio>`
            );
            el.removeAttribute("aria-label");

            expect(
                el.shadowRoot.querySelector("fieldset").hasAttribute("aria-label")
            ).to.be.false;
        });
    });

    describe("validation", () => {
        it("marks the group invalid when the invalid attribute is set", async () => {
            const el = await fixture(
                html`<y-radio .options=${options} name="fruits"></y-radio>`
            );
            el.invalid = true;

            expect(
                el.shadowRoot.querySelector("fieldset").classList.contains("is-invalid")
            ).to.be.true;
        });

        it("renders error-text and describes the group with it", async () => {
            const el = await fixture(
                html`<y-radio
                    .options=${options}
                    name="fruits"
                    error-text="Pick one"
                ></y-radio>`
            );
            const fieldset = el.shadowRoot.querySelector("fieldset");
            const error = el.shadowRoot.querySelector(".error-text");

            expect(error.textContent).to.equal("Pick one");
            expect(error.hidden).to.be.false;
            expect(fieldset.getAttribute("aria-invalid")).to.equal("true");
            expect(fieldset.getAttribute("aria-describedby")).to.equal(error.id);
        });

        it("clears the error surface when error-text is removed", async () => {
            const el = await fixture(
                html`<y-radio
                    .options=${options}
                    name="fruits"
                    error-text="Pick one"
                ></y-radio>`
            );
            el.errorText = "";
            const fieldset = el.shadowRoot.querySelector("fieldset");

            expect(el.shadowRoot.querySelector(".error-text").hidden).to.be.true;
            expect(fieldset.hasAttribute("aria-invalid")).to.be.false;
            expect(fieldset.classList.contains("is-invalid")).to.be.false;
        });
    });
});
