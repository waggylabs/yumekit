import { fixture, html, expect, oneEvent, nextFrame } from "@open-wc/testing";
import "./y-date.js";

describe("<y-date>", () => {
    it("variant='underline' renders a bottom-only border with square bottom corners", async () => {
        const el = await fixture(html`<y-date variant="underline"></y-date>`);
        el.style.setProperty("--component-inputs-border-radius-outer", "6px");
        const cs = getComputedStyle(el.shadowRoot.querySelector(".trigger"));
        expect(cs.borderTopStyle).to.equal("none");
        expect(cs.borderBottomStyle).to.equal("solid");
        expect(cs.borderTopLeftRadius).to.equal("6px");
        expect(cs.borderBottomLeftRadius).to.equal("0px");
    });

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
        const el = await fixture(
            html`<y-date placeholder="Pick a day"></y-date>`,
        );
        const display = el.shadowRoot.querySelector(".display");
        expect(display.placeholder).to.equal("Pick a day");
    });

    it("shows range placeholder in range mode", async () => {
        const el = await fixture(html`<y-date mode="range"></y-date>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display.placeholder).to.equal("Select date range");
    });

    it("displays formatted date when value is set", async () => {
        const el = await fixture(
            html`<y-date
                value="2026-06-15T12:00:00.000Z"
                format="MM/DD/YYYY"
            ></y-date>`,
        );
        const display = el.shadowRoot.querySelector(".display");
        expect(display.value).to.equal("06/15/2026");
    });

    it("default format includes time when show-hours is set", async () => {
        const el = await fixture(html`<y-date show-hours></y-date>`);
        expect(el.format).to.include("hh:mm");
    });

    it("default format includes seconds when show-seconds is set", async () => {
        const el = await fixture(html`<y-date show-seconds></y-date>`);
        expect(el.format).to.include("hh:mm:ss");
    });

    it("displays time in the input when show-hours is set and value has time", async () => {
        const el = await fixture(
            html`<y-date show-hours value="2026-06-15T14:30:00.000Z"></y-date>`,
        );
        const display = el.shadowRoot.querySelector(".display");
        // Exact hour depends on the local timezone; verify the date and AM/PM marker are present
        expect(display.value).to.match(
            /06\/15\/2026\s+\d{1,2}:\d{2}\s+(AM|PM)/i,
        );
    });

    it("explicit format attribute overrides the time-aware default", async () => {
        const el = await fixture(
            html`<y-date show-hours format="MM/DD/YYYY"></y-date>`,
        );
        expect(el.format).to.equal("MM/DD/YYYY");
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
            <y-date label-position="bottom"
                ><span slot="label">Date</span></y-date
            >
        `);
        const wrapper = el.shadowRoot.querySelector(".wrapper");
        const children = [...wrapper.children];
        expect(
            children[children.length - 1].classList.contains("label-wrapper"),
        ).to.be.true;
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
        expect(
            el.shadowRoot
                .querySelector(".trigger")
                .getAttribute("aria-expanded"),
        ).to.equal("true");
    });

    it("Enter key opens the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    it("Space key opens the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", bubbles: true }),
        );
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.false;
    });

    it("Escape key closes the popup", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        el.shadowRoot
            .querySelector(".trigger")
            .dispatchEvent(
                new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
            );
        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("auto-closes after a single date is selected", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();

        const picker = el.shadowRoot.querySelector("y-datepicker");
        picker.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: "2026-06-15T00:00:00.000Z",
                    formatted: "06/15/2026",
                    source: "day",
                },
            }),
        );

        expect(el.shadowRoot.querySelector(".popup").hidden).to.be.true;
    });

    it("does not auto-close in range mode after first pick", async () => {
        const el = await fixture(html`<y-date mode="range"></y-date>`);
        el.open();

        const picker = el.shadowRoot.querySelector("y-datepicker");
        // Range with only start — no end yet
        picker.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: "2026-06-10T00:00:00.000Z",
                    formatted: "06/10/2026",
                },
            }),
        );

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
            picker.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        value: "2026-06-15T00:00:00.000Z",
                        formatted: "06/15/2026",
                    },
                }),
            );
        });

        const e = await oneEvent(el, "change");
        expect(e.detail.value).to.equal("2026-06-15T00:00:00.000Z");
    });

    // -------------------------------------------------------------------------
    // Clearable
    // -------------------------------------------------------------------------

    it("does not render clear button when clearable is false", async () => {
        const el = await fixture(
            html`<y-date value="2026-06-15T00:00:00.000Z"></y-date>`,
        );
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;
    });

    it("renders clear button when clearable is true and value is set", async () => {
        const el = await fixture(
            html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`,
        );
        expect(el.shadowRoot.querySelector(".clear-btn")).to.exist;
    });

    it("does not render clear button when clearable but no value", async () => {
        const el = await fixture(html`<y-date clearable></y-date>`);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;
    });

    it("clear() empties the value and emits change event", async () => {
        const el = await fixture(
            html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`,
        );

        setTimeout(() => el.clear());
        const e = await oneEvent(el, "change");

        expect(el.value).to.equal("");
        expect(e.detail.value).to.equal("");
    });

    it("clicking the clear button clears the value", async () => {
        const el = await fixture(
            html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`,
        );
        el.shadowRoot.querySelector(".clear-btn").click();
        await nextFrame();
        expect(el.value).to.equal("");
    });

    it("clear button is removed from the DOM after clicking it", async () => {
        const el = await fixture(
            html`<y-date clearable value="2026-06-15T00:00:00.000Z"></y-date>`,
        );
        el.shadowRoot.querySelector(".clear-btn").click();
        await nextFrame();
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;
    });

    it("clear button appears after a date is selected when clearable", async () => {
        const el = await fixture(html`<y-date clearable></y-date>`);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.be.null;

        const picker = el.shadowRoot.querySelector("y-datepicker");
        picker.dispatchEvent(
            new CustomEvent("change", {
                bubbles: true,
                composed: true,
                detail: {
                    value: "2026-06-15T00:00:00.000Z",
                    formatted: "06/15/2026",
                },
            }),
        );
        await nextFrame();

        expect(el.shadowRoot.querySelector(".clear-btn")).to.exist;
    });

    it("clear button input is cleared after clicking the clear button", async () => {
        const el = await fixture(
            html`<y-date
                clearable
                value="2026-06-15T00:00:00.000Z"
                format="MM/DD/YYYY"
            ></y-date>`,
        );
        el.shadowRoot.querySelector(".clear-btn").click();
        await nextFrame();
        expect(el.shadowRoot.querySelector(".display").value).to.equal("");
    });

    it("clear button does not restore value after blur re-evaluation", async () => {
        // Regression: input blur queues a setTimeout that could re-apply the
        // displayed date after clear() already set the value to "".
        const el = await fixture(
            html`<y-date
                clearable
                value="2026-06-15T00:00:00.000Z"
                format="MM/DD/YYYY"
            ></y-date>`,
        );
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
        expect(
            el.shadowRoot
                .querySelector(".trigger")
                .classList.contains("is-invalid"),
        ).to.be.true;
    });

    it("removes is-invalid class when invalid attribute is removed", async () => {
        const el = await fixture(html`<y-date invalid></y-date>`);
        el.removeAttribute("invalid");
        await nextFrame();
        expect(
            el.shadowRoot
                .querySelector(".trigger")
                .classList.contains("is-invalid"),
        ).to.be.false;
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

    // -------------------------------------------------------------------------
    // Mobile / native date input
    // -------------------------------------------------------------------------

    it("renders the popup on mobile when native-mobile is not set", async () => {
        const el = await fixture(
            html`<y-date mobile-breakpoint="99999"></y-date>`,
        );
        expect(el.mobile).to.be.true;
        expect(el.shadowRoot.querySelector(".popup")).to.exist;
        expect(el.shadowRoot.querySelector(".native-date")).to.be.null;
    });

    it("renders a native date input on mobile when native-mobile is set", async () => {
        const el = await fixture(
            html`<y-date mobile-breakpoint="99999" native-mobile></y-date>`,
        );
        expect(el.mobile).to.be.true;
        const nativeInput = el.shadowRoot.querySelector(".native-date");
        expect(nativeInput).to.exist;
        // The attribute, not `input.type`: the IDL property reports what the
        // engine supports rather than what the component asked for, and
        // Playwright's WebKit build has no native date input.
        expect(nativeInput.getAttribute("type")).to.equal("date");
        expect(el.shadowRoot.querySelector(".popup")).to.be.null;
        expect(el.shadowRoot.querySelector(".display")).to.be.null;
    });

    it("renders the standard popup on desktop breakpoint", async () => {
        const el = await fixture(html`<y-date mobile-breakpoint="1"></y-date>`);
        expect(el.mobile).to.be.false;
        expect(el.shadowRoot.querySelector(".popup")).to.exist;
        expect(el.shadowRoot.querySelector(".native-date")).to.be.null;
    });

    it("uses datetime-local input type when show-hours is set on mobile with native-mobile", async () => {
        const el = await fixture(
            html`<y-date
                mobile-breakpoint="99999"
                native-mobile
                show-hours
            ></y-date>`,
        );
        const nativeInput = el.shadowRoot.querySelector(".native-date");
        expect(nativeInput).to.exist;
        expect(nativeInput.getAttribute("type")).to.equal("datetime-local");
    });

    it("renders two native inputs in range mode on mobile with native-mobile", async () => {
        const el = await fixture(
            html`<y-date
                mobile-breakpoint="99999"
                native-mobile
                mode="range"
            ></y-date>`,
        );
        const inputs = el.shadowRoot.querySelectorAll(".native-date");
        expect(inputs.length).to.equal(2);
        expect(el.shadowRoot.querySelector(".native-sep")).to.exist;
    });

    it("sets native input value from component value on mobile with native-mobile", async () => {
        const d = new Date(2026, 5, 15);
        const el = await fixture(html`
            <y-date
                mobile-breakpoint="99999"
                native-mobile
                value="${d.toISOString()}"
            ></y-date>
        `);
        const input = el.shadowRoot.querySelector(".native-date");
        expect(input.value).to.equal("2026-06-15");
    });

    it("emits change event from native input selection on mobile with native-mobile", async () => {
        const el = await fixture(
            html`<y-date mobile-breakpoint="99999" native-mobile></y-date>`,
        );
        const input = el.shadowRoot.querySelector(".native-date");
        input.value = "2026-08-20";
        setTimeout(() => input.dispatchEvent(new Event("change")));
        const e = await oneEvent(el, "change");
        expect(e.detail.value).to.be.a("string").and.not.empty;
    });

    it("shows clear button on mobile with native-mobile when clearable and value is set", async () => {
        const el = await fixture(html`
            <y-date
                mobile-breakpoint="99999"
                native-mobile
                clearable
                value="2026-06-15T00:00:00.000Z"
            ></y-date>
        `);
        expect(el.shadowRoot.querySelector(".clear-btn")).to.exist;
    });

    it("clears value when clear button is clicked on mobile with native-mobile", async () => {
        const el = await fixture(html`
            <y-date
                mobile-breakpoint="99999"
                native-mobile
                clearable
                value="2026-06-15T00:00:00.000Z"
            ></y-date>
        `);
        const clearBtn = el.shadowRoot.querySelector(".clear-btn");
        setTimeout(() => clearBtn.click());
        const e = await oneEvent(el, "change");
        expect(e.detail.value).to.equal("");
    });

    it("nativeMobile getter/setter works", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.nativeMobile).to.be.false;
        el.nativeMobile = true;
        expect(el.hasAttribute("native-mobile")).to.be.true;
        el.nativeMobile = false;
        expect(el.hasAttribute("native-mobile")).to.be.false;
    });

    it("mobileBreakpoint getter/setter works", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        expect(el.mobileBreakpoint).to.equal("");
        el.mobileBreakpoint = "600";
        expect(el.getAttribute("mobile-breakpoint")).to.equal("600");
        el.mobileBreakpoint = "";
        expect(el.hasAttribute("mobile-breakpoint")).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Popup positioning
    // -------------------------------------------------------------------------

    it("positions popup below the trigger by default", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.style.top).to.not.equal("auto");
        expect(popup.style.bottom).to.equal("auto");
    });

    it("flips popup above the trigger when not enough space below", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");

        // Simulate trigger positioned near the bottom of the viewport
        const origGetBoundingClientRect = trigger.getBoundingClientRect.bind(trigger);
        trigger.getBoundingClientRect = () => ({
            ...origGetBoundingClientRect(),
            top: window.innerHeight - 10,
            bottom: window.innerHeight - 5,
        });

        el.open();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.style.top).to.equal("auto");
        expect(popup.style.bottom).to.not.equal("auto");

        trigger.getBoundingClientRect = origGetBoundingClientRect;
    });

    it("aligns popup to the left edge by default", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        el.open();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(["0", "0px"]).to.include(popup.style.left);
        expect(popup.style.right).to.equal("auto");
    });

    it("flips popup to right-aligned when not enough space to the right", async () => {
        const el = await fixture(html`<y-date></y-date>`);
        const trigger = el.shadowRoot.querySelector(".trigger");

        // Simulate trigger positioned near the right edge of the viewport
        const origGetBoundingClientRect = trigger.getBoundingClientRect.bind(trigger);
        trigger.getBoundingClientRect = () => ({
            ...origGetBoundingClientRect(),
            left: window.innerWidth - 5,
            right: window.innerWidth,
        });

        el.open();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.style.left).to.equal("auto");
        expect(["0", "0px"]).to.include(popup.style.right);

        trigger.getBoundingClientRect = origGetBoundingClientRect;
    });

    describe("XSS hardening", () => {
        const cases = [
            {
                name: "placeholder",
                payload: `Pick" onfocus="window.__xssDatePlaceholder=true" autofocus x="`,
                flag: "__xssDatePlaceholder",
            },
            {
                name: "value",
                payload: `2026-01-01" onfocus="window.__xssDateValue=true" autofocus x="`,
                flag: "__xssDateValue",
            },
            {
                name: "min",
                payload: `2026-01-01" onfocus="window.__xssDateMin=true" autofocus x="`,
                flag: "__xssDateMin",
            },
            {
                name: "max",
                payload: `2026-12-31" onfocus="window.__xssDateMax=true" autofocus x="`,
                flag: "__xssDateMax",
            },
            {
                name: "format",
                payload: `MM/DD/YYYY" onfocus="window.__xssDateFormat=true" autofocus x="`,
                flag: "__xssDateFormat",
            },
        ];

        for (const { name, payload, flag } of cases) {
            it(`does not allow attribute breakout via ${name}`, async () => {
                const el = document.createElement("y-date");
                el.setAttribute(name, payload);
                document.body.appendChild(el);

                expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
                expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
                expect(window[flag]).to.be.undefined;

                document.body.removeChild(el);
            });
        }

        it("clear button uses <y-icon name='x'> rather than inline SVG", async () => {
            const el = await fixture(
                html`<y-date clearable value="2026-01-01"></y-date>`,
            );
            const btn = el.shadowRoot.querySelector(".clear-btn");
            expect(btn).to.exist;
            // No raw SVG element inside the clear button
            expect(btn.querySelector("svg")).to.be.null;
            const icon = btn.querySelector("y-icon");
            expect(icon).to.exist;
            expect(icon.getAttribute("name")).to.equal("x");
        });
    });
});
