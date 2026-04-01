import { fixture, html, expect, oneEvent, nextFrame } from "@open-wc/testing";
import "./y-date.js";

describe("<y-date>", () => {
    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    it("renders the trigger and popup by default", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.shadowRoot.querySelector(".trigger")).to.exist;
        expect(el.shadowRoot.querySelector(".popup")).to.exist;
    });

    it("renders a y-datepicker inside the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.shadowRoot.querySelector("y-datepicker")).to.exist;
    });

    it("renders a y-icon calendar icon in the trigger", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const icon = el.shadowRoot.querySelector("y-icon.cal-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("calendar");
    });

    it("shows placeholder text when no value is set", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display).to.exist;
        expect(display.placeholder).to.equal("Select date");
    });

    it("shows custom placeholder when placeholder attribute is set", async () => {
        const el = await fixture(html`<y-date placeholder="Pick a day"></y-date>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display.placeholder).to.equal("Pick a day");
    });

    it("shows range placeholder in range mode", async () => {
        const el = await fixture(html`<y-date mode="range"></y-date>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display.placeholder).to.equal("Select date range");
    });

    it("displays formatted date when value is set", async () => {
        const el = await fixture(html`<y-date value="2026-06-15T12:00:00.000Z" format="MM/DD/YYYY"></y-date>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display.value).to.equal("06/15/2026");
    });

    it("renders label slot at top by default", async () => {
        const el = await fixture(html`
            <y-date><span slot="label">Date</span></y-date>
        `);
        const wrapper = el.shadowRoot.querySelector(".wrapper");
        const children = [...wrapper.children];
        expect(children[0].classList.contains("label-wrapper")).to.be.true;
    });

    it("renders label slot at bottom when label-position is bottom", async () => {
        const el = await fixture(html`
            <y-date label-position="bottom"><span slot="label">Date</span></y-date>
        `);
        const wrapper = el.shadowRoot.querySelector(".wrapper");
        const children = [...wrapper.children];
        expect(children[children.length - 1].classList.contains("label-wrapper")).to.be.true;
    });

    it("applies default size attribute of medium", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.getAttribute("size")).to.equal("medium");
    });

    // -------------------------------------------------------------------------
    // Open / close
    // -------------------------------------------------------------------------

    it("popup is hidden by default", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("open() shows the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    it("close() hides the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        el.close();
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("clicking the trigger opens the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.shadowRoot.querySelector(".trigger").click();
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    it("clicking the trigger again closes the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.click();
        trigger.click();
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("clicking outside closes the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("sets aria-expanded on the trigger when opened", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        expect(el.shadowRoot.querySelector(".trigger").getAttribute("aria-expanded")).to.equal("true");
    });

    it("Enter key opens the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    it("Space key opens the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    it("Escape key closes the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        el.shadowRoot.querySelector(".trigger").dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
        );
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("auto-closes after a single date is selected", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();

        const picker = el.shadowRoot.querySelector("y-datepicker");
        picker.dispatchEvent(new CustomEvent("change", {
            bubbles: true, composed: true,
            detail: { value: "2026-06-15T00:00:00.000Z", formatted: "06/15/2026" },
        }));

        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("does not auto-close in range mode after first pick", async () => {
        const el = await fixture(html`<y-date mode="range"></y-date>`);
        el.open();

        const picker = el.shadowRoot.querySelector("y-datepicker");
        // Range with only start — no end yet
        picker.dispatchEvent(new CustomEvent("change", {
            bubbles: true, composed: true,
            detail: { value: "2026-06-10T00:00:00.000Z", formatted: "06/10/2026" },
        }));

        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Value & change event
    // -------------------------------------------------------------------------

    it("value getter returns empty string by default", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.value).to.equal("");
    });

    it("value setter updates attribute and form value", async () => {
        const el = await fixture(html`<y-date name="appt"></y-date>`);
        el.value = "2026-06-15T00:00:00.000Z";
        expect(el.getAttribute("value")).to.equal("2026-06-15T00:00:00.000Z");
    });

    it("updates display when value attribute changes", async () => {
        const el = await fixture(html`<y-date format="MM/DD/YYYY"></y-date>`);
        el.setAttribute("value", "2026-06-15T12:00:00.000Z");
        await nextFrame();
        const display = el.shadowRoot.querySelector(".display");
        expect(display.value).to.equal("06/15/2026");
    });

    it("bubbles change event from datepicker", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const picker = el.shadowRoot.querySelector("y-datepicker");

        setTimeout(() => {
            picker.dispatchEvent(new CustomEvent("change", {
                bubbles: true, composed: true,
                detail: { value: "2026-06-15T00:00:00.000Z", formatted: "06/15/2026" },
            }));
        });

        const e = await oneEvent(el, "change");
        expect(e.detail.value).to.equal("2026-06-15T00:00:00.000Z");
    });

    // -------------------------------------------------------------------------
    // Clearable
    // -------------------------------------------------------------------------

    it("does not render clear button when clearable is false", async () => {
        const el = await fixture(html`<y-date value="2026-06-15T00:00:00.000Z"></y-date>`);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;
    });

    it("renders clear button when clearable is true and value is set", async () => {
        const el = await fixture(html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.exist;
    });

    it("does not render clear button when clearable but no value", async () => {
        const el = await fixture(html`<y-date clearable></y-date>`);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;
    });

    it("clear() empties the value and emits change event", async () => {
        const el = await fixture(html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`);

        setTimeout(() => el.clear());
        const e = await oneEvent(el, "change");

        expect(el.value).to.equal("");
        expect(e.detail.value).to.equal("");
    });

    it("clicking the clear button clears the value", async () => {
        const el = await fixture(html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`);
        el.shadowRoot.querySelector(".clear-btn").click();
        await nextFrame();
        expect(el.value).to.equal("");
    });

    it("clear button is removed from the DOM after clicking it", async () => {
        const el = await fixture(html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`);
        el.shadowRoot.querySelector(".clear-btn").click();
        await nextFrame();
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;
    });

    it("clear button appears after a date is selected when clearable", async () => {
        const el = await fixture(html`<y-date clearable></y-date>`);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;

        const picker = el.shadowRoot.querySelector("y-datepicker");
        picker.dispatchEvent(new CustomEvent("change", {
            bubbles: true, composed: true,
            detail: { value: "2026-06-15T00:00:00.000Z", formatted: "06/15/2026" },
        }));
        await nextFrame();

        expect(el.shadowRoot.querySelector(".clear-btn")).to.exist;
    });

    it("clear button input is cleared after clicking the clear button", async () => {
        const el = await fixture(html`<y-date clearable value="2026-06-15T00:00:00.000Z" format="MM/DD/YYYY"></y-date>`);
        el.shadowRoot.querySelector(".clear-btn").click();
        await nextFrame();
        expect(el.shadowRoot.querySelector(".display").value).to.equal("");
    });

    it("clear button does not restore value after blur re-evaluation", async () => {
        // Regression: input blur queues a setTimeout that could re-apply the
        // displayed date after clear() already set the value to "".
        const el = await fixture(html`<y-date clearable value="2026-06-15T00:00:00.000Z" format="MM/DD/YYYY"></y-date>`);
        const input = el.shadowRoot.querySelector(".display");
        input.focus();
        // Simulate blur firing before the clear-button click completes
        input.dispatchEvent(new Event("blur"));
        el.shadowRoot.querySelector(".clear-btn").click();
        // Wait long enough for the blur's setTimeout(0) to fire
        await new Promise((r) => setTimeout(r, 10));
        expect(el.value).to.equal("");
        expect(input.value).to.equal("");
    });

    // -------------------------------------------------------------------------
    // Disabled
    // -------------------------------------------------------------------------

    it("does not open when disabled", async () => {
        const el = await fixture(html`<y-date disabled></y-date>`);
        el.shadowRoot.querySelector(".trigger")?.click();
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("disabled setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Invalid
    // -------------------------------------------------------------------------

    it("applies is-invalid class to trigger when invalid", async () => {
        const el = await fixture(html`<y-date invalid></y-date>`);
        expect(el.shadowRoot.querySelector(".trigger").classList.contains("is-invalid")).to.be.true;
    });

    it("removes is-invalid class when invalid attribute is removed", async () => {
        const el = await fixture(html`<y-date invalid></y-date>`);
        el.removeAttribute("invalid");
        await nextFrame();
        expect(el.shadowRoot.querySelector(".trigger").classList.contains("is-invalid")).to.be.false;
    });

    it("invalid setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.invalid = true;
        expect(el.hasAttribute("invalid")).to.be.true;
        el.invalid = false;
        expect(el.hasAttribute("invalid")).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Form association
    // -------------------------------------------------------------------------

    it("participates in form data with name and value", async () => {
        const form = await fixture(html`
            <form>
                <y-date name="appt" value="2026-06-15T00:00:00.000Z"></y-date>
            </form>
        `);
        const data = new FormData(form);
        expect(data.get("appt")).to.equal("2026-06-15T00:00:00.000Z");
    });

    it("updates form value when value changes", async () => {
        const form = await fixture(html`
            <form>
                <y-date name="appt" value="2026-06-15T00:00:00.000Z"></y-date>
            </form>
        `);
        form.querySelector("y-date").value = "2026-07-04T00:00:00.000Z";
        const data = new FormData(form);
        expect(data.get("appt")).to.equal("2026-07-04T00:00:00.000Z");
    });
});
