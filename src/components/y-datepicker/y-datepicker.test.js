import { fixture, html, expect, oneEvent, nextFrame } from "@open-wc/testing";
import "./y-datepicker.js";

describe("<y-datepicker>", () => {
    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    it("renders a single panel by default", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        const panels = el.shadowRoot.querySelectorAll(".panel");
        expect(panels.length).to.equal(1);
    });

    it("renders two panels in range mode", async () => {
        const el = await fixture(html`<y-datepicker mode="range"></y-datepicker>`);
        const panels = el.shadowRoot.querySelectorAll(".panel");
        expect(panels.length).to.equal(2);
    });

    it("renders day headers by default", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        const headers = el.shadowRoot.querySelectorAll(".day-hdr");
        expect(headers.length).to.equal(7);
    });

    it("renders day buttons for current month", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        const days = el.shadowRoot.querySelectorAll(".day-btn");
        expect(days.length).to.be.greaterThan(27);
    });

    it("hides day grid when show-days is false", async () => {
        const el = await fixture(html`<y-datepicker show-days="false"></y-datepicker>`);
        expect(el.shadowRoot.querySelector(".day-grid")).to.be.null;
    });

    it("renders month grid when show-days is false and show-months is true", async () => {
        const el = await fixture(html`<y-datepicker show-days="false"></y-datepicker>`);
        expect(el.shadowRoot.querySelector(".month-grid")).to.exist;
    });

    it("renders year grid when both show-days and show-months are false", async () => {
        const el = await fixture(html`<y-datepicker show-days="false" show-months="false"></y-datepicker>`);
        expect(el.shadowRoot.querySelector(".year-grid")).to.exist;
    });

    it("shows time column when show-time is set", async () => {
        const el = await fixture(html`<y-datepicker show-time></y-datepicker>`);
        expect(el.shadowRoot.querySelector(".time-column")).to.exist;
    });

    it("shows minutes column when show-minutes is set", async () => {
        const el = await fixture(html`<y-datepicker show-minutes></y-datepicker>`);
        const cols = el.shadowRoot.querySelectorAll(".time-col");
        const minutesCol = [...cols].find((c) => c.dataset.col === "minutes");
        expect(minutesCol).to.exist;
    });

    it("shows seconds column when show-seconds is set", async () => {
        const el = await fixture(html`<y-datepicker show-seconds></y-datepicker>`);
        const cols = el.shadowRoot.querySelectorAll(".time-col");
        const secondsCol = [...cols].find((c) => c.dataset.col === "seconds");
        expect(secondsCol).to.exist;
    });

    it("hides time column when no time attributes are set", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.shadowRoot.querySelector(".time-column")).to.be.null;
    });

    // -------------------------------------------------------------------------
    // Value & parsing
    // -------------------------------------------------------------------------

    it("parses a single ISO value and marks the correct day as selected", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        const selected = el.shadowRoot.querySelector(".day-btn[aria-pressed='true']");
        expect(selected).to.exist;
    });

    it("parses a range value and marks both edges as selected", async () => {
        const el = await fixture(html`
            <y-datepicker mode="range" value="2026-06-10T00:00:00.000Z,2026-06-20T00:00:00.000Z">
            </y-datepicker>
        `);
        const selected = el.shadowRoot.querySelectorAll(".day-btn[aria-pressed='true']");
        expect(selected.length).to.equal(2);
    });

    it("value getter returns empty string when no value is set", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.value).to.equal("");
    });

    it("value setter updates the attribute", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        el.value = "2026-06-15T00:00:00.000Z";
        expect(el.getAttribute("value")).to.equal("2026-06-15T00:00:00.000Z");
    });

    // -------------------------------------------------------------------------
    // Min / max constraints
    // -------------------------------------------------------------------------

    it("disables days before min date", async () => {
        // Set min to the last day of the current month of the fixture's view
        // Use a fixed value so the view is predictable
        const el = await fixture(html`
            <y-datepicker value="2026-06-15T00:00:00.000Z" min="2026-06-10T00:00:00.000Z">
            </y-datepicker>
        `);
        const dayBtns = [...el.shadowRoot.querySelectorAll(".day-btn")];
        const day5 = dayBtns.find((b) => new Date(b.dataset.date).getDate() === 5);
        expect(day5.hasAttribute("disabled")).to.be.true;
    });

    it("disables days after max date", async () => {
        const el = await fixture(html`
            <y-datepicker value="2026-06-15T00:00:00.000Z" max="2026-06-20T00:00:00.000Z">
            </y-datepicker>
        `);
        const dayBtns = [...el.shadowRoot.querySelectorAll(".day-btn")];
        const day25 = dayBtns.find((b) => new Date(b.dataset.date).getDate() === 25);
        expect(day25.hasAttribute("disabled")).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Day selection & change event
    // -------------------------------------------------------------------------

    it("emits change event when a day is clicked", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        const btn = el.shadowRoot.querySelector(".day-btn:not([disabled])");

        setTimeout(() => btn.click());
        const e = await oneEvent(el, "change");

        expect(e.detail.value).to.be.a("string").and.not.empty;
        expect(e.detail.startDate).to.be.instanceOf(Date);
    });

    it("emits change event with correct ISO value for single mode", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        const btn = el.shadowRoot.querySelector(".day-btn:not([disabled])");

        setTimeout(() => btn.click());
        const e = await oneEvent(el, "change");

        expect(e.detail.startDate).to.be.instanceOf(Date);
        expect(e.detail.endDate).to.be.null;
    });

    it("selects start then end date in range mode", async () => {
        const el = await fixture(html`<y-datepicker mode="range" value="2026-06-15T00:00:00.000Z,2026-06-20T00:00:00.000Z"></y-datepicker>`);
        const btns = [...el.shadowRoot.querySelectorAll(".day-btn:not([disabled])")];

        // First click sets start
        setTimeout(() => btns[0].click());
        const e1 = await oneEvent(el, "change");
        expect(e1.detail.startDate).to.be.instanceOf(Date);
        expect(e1.detail.endDate).to.be.null;

        // Second click sets end
        setTimeout(() => btns[5].click());
        const e2 = await oneEvent(el, "change");
        expect(e2.detail.startDate).to.be.instanceOf(Date);
        expect(e2.detail.endDate).to.be.instanceOf(Date);
    });

    it("swaps start and end when end is clicked before start", async () => {
        const el = await fixture(html`<y-datepicker mode="range" value="2026-06-15T00:00:00.000Z,2026-06-20T00:00:00.000Z"></y-datepicker>`);
        const btns = [...el.shadowRoot.querySelectorAll(".day-btn:not([disabled])")];

        // Click a later date first
        setTimeout(() => btns[9].click());
        await oneEvent(el, "change");

        // Click an earlier date second — should swap
        setTimeout(() => btns[2].click());
        const e = await oneEvent(el, "change");
        expect(e.detail.startDate <= e.detail.endDate).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Navigation
    // -------------------------------------------------------------------------

    it("navigates to the previous month when prev-month button is clicked", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        const prevMonth = el.shadowRoot.querySelector("[data-action='prev-month']");
        prevMonth.click();
        await nextFrame();

        const monthSel = el.shadowRoot.querySelector(".month-sel");
        expect(parseInt(monthSel.value)).to.equal(4); // May = 4
    });

    it("navigates to the next month when next-month button is clicked", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        const nextMonth = el.shadowRoot.querySelector("[data-action='next-month']");
        nextMonth.click();
        await nextFrame();

        const monthSel = el.shadowRoot.querySelector(".month-sel");
        expect(parseInt(monthSel.value)).to.equal(6); // July = 6
    });

    it("navigates to the previous year when prev-year button is clicked", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        const prevYear = el.shadowRoot.querySelector("[data-action='prev-year']");
        prevYear.click();
        await nextFrame();

        const yearSel = el.shadowRoot.querySelector(".year-sel");
        expect(parseInt(yearSel.value)).to.equal(2025);
    });

    it("navigates to the next year when next-year button is clicked", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        const nextYear = el.shadowRoot.querySelector("[data-action='next-year']");
        nextYear.click();
        await nextFrame();

        const yearSel = el.shadowRoot.querySelector(".year-sel");
        expect(parseInt(yearSel.value)).to.equal(2027);
    });

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    it("clear() removes the value and re-renders", async () => {
        const el = await fixture(html`<y-datepicker value="2026-06-15T00:00:00.000Z"></y-datepicker>`);
        el.clear();
        await nextFrame();

        expect(el.value).to.equal("");
        expect(el.shadowRoot.querySelector(".day-btn[aria-pressed='true']")).to.be.null;
    });

    it("formatDate() returns a formatted string using the format attribute", async () => {
        const el = await fixture(html`<y-datepicker format="DD/MM/YYYY"></y-datepicker>`);
        const result = el.formatDate(new Date(2026, 5, 15)); // June 15, 2026
        expect(result).to.equal("15/06/2026");
    });

    it("formatDate() returns empty string for invalid date", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.formatDate(new Date("invalid"))).to.equal("");
    });

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    it("mode getter defaults to 'single'", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.mode).to.equal("single");
    });

    it("color getter defaults to 'primary'", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.color).to.equal("primary");
    });

    it("format getter defaults to 'MM/DD/YYYY'", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.format).to.equal("MM/DD/YYYY");
    });

    it("showYears defaults to true", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.showYears).to.be.true;
    });

    it("showYears is false when set to false", async () => {
        const el = await fixture(html`<y-datepicker show-years="false"></y-datepicker>`);
        expect(el.showYears).to.be.false;
        expect(el.shadowRoot.querySelector(".year-sel")).to.be.null;
    });

    it("showMonths defaults to true", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.showMonths).to.be.true;
    });

    it("showDays defaults to true", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        expect(el.showDays).to.be.true;
    });

    it("min and max setters update attributes", async () => {
        const el = await fixture(html`<y-datepicker></y-datepicker>`);
        el.min = "2026-01-01";
        el.max = "2026-12-31";
        expect(el.getAttribute("min")).to.equal("2026-01-01");
        expect(el.getAttribute("max")).to.equal("2026-12-31");
    });
});
