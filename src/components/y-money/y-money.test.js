import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-money.js";

/**
 * Drive the inner input the way a user would: set the raw text, then fire the
 * `input` event the component listens for.
 */
function type(el, text, inputType = "insertText") {
    const input = el.shadowRoot.querySelector("input");
    input.focus();
    input.value = text;
    input.dispatchEvent(new InputEvent("input", { inputType, bubbles: true }));
    return input;
}

describe("<y-money>", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    describe("value semantics", () => {
        it("keeps a canonical decimal string as the value", async () => {
            const el = await fixture(
                html`<y-money value="1234.5" locale="en-US"></y-money>`,
            );
            expect(el.value).to.equal("1234.50");
        });

        it("submits the canonical string, not the formatted display", async () => {
            const form = await fixture(html`
                <form>
                    <y-money name="amount" value="1234.56" locale="en-US"></y-money>
                </form>
            `);
            const data = new FormData(form);
            expect(data.get("amount")).to.equal("1234.56");
        });

        it("treats an empty field as empty rather than zero", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            expect(el.value).to.equal("");
            expect(Number.isNaN(el.valueAsNumber)).to.equal(true);
        });

        it("exposes minor units via integer math", async () => {
            const el = await fixture(
                html`<y-money value="1234.56" locale="en-US"></y-money>`,
            );
            expect(el.valueAsMinorUnits).to.equal(123456);
        });

        it("uses the currency exponent for minor units", async () => {
            const jpy = await fixture(
                html`<y-money value="1234" currency="JPY" locale="en-US"></y-money>`,
            );
            expect(jpy.value).to.equal("1234");
            expect(jpy.valueAsMinorUnits).to.equal(1234);

            const kwd = await fixture(
                html`<y-money value="1.234" currency="KWD" locale="en-US"></y-money>`,
            );
            expect(kwd.value).to.equal("1.234");
            expect(kwd.valueAsMinorUnits).to.equal(1234);
        });
    });

    describe("rounding", () => {
        it("rounds half away from zero without float error", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            el.value = "1.005";
            expect(el.value).to.equal("1.01");
        });

        it("carries across a run of nines", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            el.value = "9.999";
            expect(el.value).to.equal("10.00");
        });

        it("never produces negative zero", async () => {
            const el = await fixture(
                html`<y-money allow-negative locale="en-US"></y-money>`,
            );
            el.value = "-0.001";
            expect(el.value).to.equal("0.00");
        });

        it("keeps full precision on amounts past float safety", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            el.value = "9007199254740993.99";
            expect(el.value).to.equal("9007199254740993.99");
        });
    });

    describe("formatting", () => {
        it("formats with the currency symbol when idle", async () => {
            const el = await fixture(
                html`<y-money value="1234.56" locale="en-US"></y-money>`,
            );
            expect(el.shadowRoot.querySelector("input").value).to.equal(
                "$1,234.56",
            );
        });

        it("swaps to a bare number on focus and back on blur", async () => {
            const el = await fixture(
                html`<y-money value="1234.56" locale="en-US"></y-money>`,
            );
            const input = el.shadowRoot.querySelector("input");

            input.focus();
            expect(input.value).to.equal("1234.56");

            input.blur();
            expect(input.value).to.equal("$1,234.56");
        });

        it("honours display='code' and display='none'", async () => {
            const code = await fixture(
                html`<y-money value="5" display="code" locale="en-US"></y-money>`,
            );
            expect(code.formattedValue).to.contain("USD");

            const none = await fixture(
                html`<y-money value="5" display="none" locale="en-US"></y-money>`,
            );
            expect(none.formattedValue).to.equal("5.00");
        });

        it("renders negatives in parentheses when asked", async () => {
            const el = await fixture(html`
                <y-money
                    value="-5"
                    allow-negative
                    negative-style="parentheses"
                    locale="en-US"
                ></y-money>
            `);
            expect(el.formattedValue).to.equal("($5.00)");
        });

        it("follows the locale for separators and symbol placement", async () => {
            const el = await fixture(
                html`<y-money value="1234.56" currency="EUR" locale="de-DE"></y-money>`,
            );
            expect(el.formattedValue).to.contain("1.234,56");
        });
    });

    describe("typing", () => {
        it("rejects letters and stray symbols", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            const input = type(el, "12a3b");
            expect(input.value).to.equal("123");
            expect(el.value).to.equal("123");
        });

        it("allows only one decimal separator", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            const input = type(el, "1.2.3");
            expect(input.value).to.equal("1.23");
        });

        it("caps the fraction at the currency precision", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            const input = type(el, "1.23456");
            expect(input.value).to.equal("1.23");
        });

        it("rejects a minus unless allow-negative is set", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            expect(type(el, "-5").value).to.equal("5");

            const negative = await fixture(
                html`<y-money allow-negative locale="en-US"></y-money>`,
            );
            expect(type(negative, "-5").value).to.equal("-5");
        });

        it("scrubs grouping separators out of a paste", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            type(el, "$1,234.56", "insertFromPaste");
            expect(el.value).to.equal("1234.56");
        });

        it("scrubs a de-DE formatted paste", async () => {
            const el = await fixture(
                html`<y-money currency="EUR" locale="de-DE"></y-money>`,
            );
            type(el, "1.234,56 €", "insertFromPaste");
            expect(el.value).to.equal("1234.56");
        });

        it("clamps a programmatic negative to zero when not allowed", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            el.value = "-42";
            expect(el.value).to.equal("0.00");
        });
    });

    describe("arrow-key stepping", () => {
        it("steps up and down by the step attribute", async () => {
            const el = await fixture(
                html`<y-money value="10" step="5" locale="en-US"></y-money>`,
            );
            const input = el.shadowRoot.querySelector("input");

            input.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
            );
            expect(el.value).to.equal("15.00");

            input.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowDown",
                    bubbles: true,
                }),
            );
            expect(el.value).to.equal("10.00");
        });

        it("defaults to a step of one whole unit", async () => {
            const el = await fixture(
                html`<y-money value="10" locale="en-US"></y-money>`,
            );
            el.stepUp();
            expect(el.value).to.equal("11.00");
        });

        it("clamps stepping to min and max", async () => {
            const el = await fixture(html`
                <y-money value="9" min="5" max="10" step="5" locale="en-US"></y-money>
            `);
            el.stepUp();
            expect(el.value).to.equal("10.00");
            el.stepDown(10);
            expect(el.value).to.equal("5.00");
        });

        it("does not step below zero when negatives are disallowed", async () => {
            const el = await fixture(
                html`<y-money value="0" step="5" locale="en-US"></y-money>`,
            );
            el.stepDown();
            expect(el.value).to.equal("0.00");
        });

        it("does nothing when disabled", async () => {
            const el = await fixture(
                html`<y-money value="10" disabled locale="en-US"></y-money>`,
            );
            el.stepUp();
            expect(el.value).to.equal("10.00");
        });
    });

    describe("validation", () => {
        it("flags a value below min without rewriting it", async () => {
            const el = await fixture(
                html`<y-money value="3" min="5" locale="en-US"></y-money>`,
            );
            expect(el.value).to.equal("3.00");
            expect(el.validity.rangeUnderflow).to.equal(true);
            expect(el.checkValidity()).to.equal(false);
        });

        it("flags a value above max without rewriting it", async () => {
            const el = await fixture(
                html`<y-money value="30" max="10" locale="en-US"></y-money>`,
            );
            expect(el.value).to.equal("30.00");
            expect(el.validity.rangeOverflow).to.equal(true);
        });

        it("reports valueMissing for an empty required field", async () => {
            const el = await fixture(
                html`<y-money required locale="en-US"></y-money>`,
            );
            expect(el.validity.valueMissing).to.equal(true);
        });

        it("does not paint a pristine required field as an error", async () => {
            const el = await fixture(
                html`<y-money required locale="en-US"></y-money>`,
            );
            const container = el.shadowRoot.querySelector(".input-container");
            expect(container.classList.contains("is-invalid")).to.equal(false);
        });

        it("paints a range violation immediately", async () => {
            const el = await fixture(
                html`<y-money value="3" min="5" locale="en-US"></y-money>`,
            );
            const container = el.shadowRoot.querySelector(".input-container");
            expect(container.classList.contains("is-invalid")).to.equal(true);
        });

        it("renders error-text and wires the accessible description", async () => {
            const el = await fixture(
                html`<y-money error-text="Too much" locale="en-US"></y-money>`,
            );
            const input = el.shadowRoot.querySelector("input");
            const error = el.shadowRoot.querySelector(".error-text");

            expect(error.textContent).to.equal("Too much");
            expect(input.getAttribute("aria-invalid")).to.equal("true");
            expect(input.getAttribute("aria-describedby")).to.equal(
                "error-text",
            );
        });
    });

    describe("events", () => {
        it("fires input on each keystroke with the canonical value", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            setTimeout(() => type(el, "12"));
            const e = await oneEvent(el, "input");
            expect(e.detail.value).to.equal("12");
            expect(e.detail.valueAsNumber).to.equal(12);
        });

        it("fires change on blur only when the value changed", async () => {
            const el = await fixture(
                html`<y-money value="10" locale="en-US"></y-money>`,
            );
            const input = el.shadowRoot.querySelector("input");
            const onChange = sandbox.spy();
            el.addEventListener("change", onChange);

            input.focus();
            input.blur();
            expect(onChange.callCount).to.equal(0);

            type(el, "25");
            input.blur();
            expect(onChange.callCount).to.equal(1);
            expect(el.value).to.equal("25.00");
        });

        it("does not fire events when value is set programmatically", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            const onInput = sandbox.spy();
            const onChange = sandbox.spy();
            el.addEventListener("input", onInput);
            el.addEventListener("change", onChange);

            el.value = "42";

            expect(onInput.callCount).to.equal(0);
            expect(onChange.callCount).to.equal(0);
        });
    });

    describe("accessibility and chrome", () => {
        it("uses a text input with a decimal inputmode", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            const input = el.shadowRoot.querySelector("input");
            expect(input.getAttribute("type")).to.equal("text");
            expect(input.getAttribute("inputmode")).to.equal("decimal");
        });

        it("forwards aria-label to the inner control", async () => {
            const el = await fixture(
                html`<y-money aria-label="Budget" locale="en-US"></y-money>`,
            );
            expect(
                el.shadowRoot.querySelector("input").getAttribute("aria-label"),
            ).to.equal("Budget");
        });

        it("focuses the input when the container padding is clicked", async () => {
            const el = await fixture(html`<y-money locale="en-US"></y-money>`);
            const input = el.shadowRoot.querySelector("input");
            el.shadowRoot
                .querySelector(".input-container")
                .dispatchEvent(
                    new MouseEvent("mousedown", {
                        bubbles: true,
                        cancelable: true,
                    }),
                );
            expect(el.shadowRoot.activeElement).to.equal(input);
        });

        it("variant='underline' renders a bottom-only border", async () => {
            const el = await fixture(
                html`<y-money variant="underline" locale="en-US"></y-money>`,
            );
            const cs = getComputedStyle(
                el.shadowRoot.querySelector(".input-container"),
            );
            expect(cs.borderTopStyle).to.equal("none");
            expect(cs.borderBottomStyle).to.equal("solid");
        });

        it("restores the default value on form reset", async () => {
            const form = await fixture(html`
                <form>
                    <y-money name="amount" value="10" locale="en-US"></y-money>
                </form>
            `);
            const el = form.querySelector("y-money");
            el.value = "99";
            form.reset();
            expect(el.value).to.equal("10.00");
        });
    });
});
