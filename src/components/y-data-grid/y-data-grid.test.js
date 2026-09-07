import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import { sendKeys } from "@web/test-runner-commands";
import sinon from "sinon";
import { supportsTypedDateInput } from "../../../test/browser.js";
import "./y-data-grid.js";

// y-popover renders its surface + slotted content into a `.y-popover-portal`
// element appended to document.body when `portal` is on. Tests that need to
// reach the menu content look up the portal whose subtree matches a selector
// the menu uniquely renders.
const findPortal = (innerSelector) =>
    [...document.body.querySelectorAll(".y-popover-portal")].find(
        (p) => p.querySelector(innerSelector),
    );
const waitFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

const columns = JSON.stringify([
    { key: "name", label: "Name" },
    { key: "age", label: "Age", type: "number" },
    { key: "city", label: "City" },
]);

const data = JSON.stringify([
    { name: "Alice", age: 30, city: "Portland" },
    { name: "Bob", age: 25, city: "Seattle" },
    { name: "Charlie", age: 35, city: "Austin" },
    { name: "Dave", age: 28, city: "Denver" },
]);

describe("YumeDataGrid", () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    // ---------------------------------------------------------------- rendering

    it("renders a grid with the configured columns and rows", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        const ths = el.shadowRoot.querySelectorAll("thead th");
        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(ths.length).to.equal(3);
        expect(trs.length).to.equal(4);
    });

    it("sets role=grid on the host", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        expect(el.getAttribute("role")).to.equal("grid");
    });

    it("renders the empty state when data is empty", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}"></y-data-grid>
        `);
        const empty = el.shadowRoot.querySelector("[data-empty]");
        expect(empty).to.not.be.null;
        expect(empty.textContent).to.include("No data available");
    });

    it("honors custom empty-message", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" empty-message="Nothing here"></y-data-grid>
        `);
        const empty = el.shadowRoot.querySelector("[data-empty]");
        expect(empty.textContent).to.include("Nothing here");
    });

    // ---------------------------------------------------------------- sorting

    it("sorts ascending on first header click", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll("thead th")[0].click();

        const firstCell = el.shadowRoot.querySelector("tbody tr td");
        expect(firstCell.textContent).to.equal("Alice");
    });

    it("sorts descending on second header click", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        const nameHeader = () => el.shadowRoot.querySelectorAll("thead th")[0];
        nameHeader().click();
        nameHeader().click();

        const firstCell = el.shadowRoot.querySelector("tbody tr td");
        expect(firstCell.textContent).to.equal("Dave");
    });

    it("clears sort on third header click", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        const nameHeader = () => el.shadowRoot.querySelectorAll("thead th")[0];
        nameHeader().click();
        nameHeader().click();
        nameHeader().click();

        const firstCell = el.shadowRoot.querySelector("tbody tr td");
        expect(firstCell.textContent).to.equal("Alice");
        expect(nameHeader().getAttribute("aria-sort")).to.equal("none");
    });

    it("sorts numeric columns numerically", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll("thead th")[1].click();
        const cells = el.shadowRoot.querySelectorAll("tbody tr td:nth-child(2)");
        expect(cells[0].textContent).to.equal("25");
        expect(cells[3].textContent).to.equal("35");
    });

    it("supports multi-column sort with shift-click", async () => {
        const dupAge = JSON.stringify([
            { name: "Bob", age: 30, city: "A" },
            { name: "Alice", age: 30, city: "B" },
            { name: "Eve", age: 25, city: "C" },
        ]);
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${dupAge}"></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll("thead th")[1].click(); // age asc
        const nameHeader = el.shadowRoot.querySelectorAll("thead th")[0];
        nameHeader.dispatchEvent(new MouseEvent("click", { shiftKey: true, bubbles: true }));

        const names = [...el.shadowRoot.querySelectorAll("tbody tr td:first-child")]
            .map((td) => td.textContent);
        expect(names).to.deep.equal(["Eve", "Alice", "Bob"]);
    });

    it("emits a cancelable sort-change event", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        setTimeout(() => el.shadowRoot.querySelectorAll("thead th")[0].click());
        const ev = await oneEvent(el, "sort-change");
        expect(ev.detail.column).to.equal("name");
        expect(ev.detail.direction).to.equal("asc");
        expect(ev.cancelable).to.be.true;
    });

    it("sets aria-sort on sorted columns", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll("thead th")[0].click();
        const th = el.shadowRoot.querySelectorAll("thead th")[0];
        expect(th.getAttribute("aria-sort")).to.equal("ascending");
    });

    it("does not make a header sortable when enable-sorting is 'false'", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" enable-sorting="false"></y-data-grid>
        `);
        const ths = el.shadowRoot.querySelectorAll("thead th");
        ths.forEach((th) => expect(th.classList.contains("sortable")).to.be.false);
    });

    // ---------------------------------------------------------------- filtering

    it("renders an inline filter row when filtering='inline'", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const inputs = el.shadowRoot.querySelectorAll(".filter-row y-input");
        expect(inputs.length).to.equal(3);
    });

    it("filters rows by column input", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const cityInput = el.shadowRoot.querySelectorAll(".filter-row y-input")[2];
        cityInput.dispatchEvent(
            new CustomEvent("input", { detail: { value: "Seattle" } }),
        );

        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(1);
        expect(trs[0].querySelector("td").textContent).to.equal("Bob");
    });

    it("emits a cancelable filter-change event", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const input = el.shadowRoot.querySelectorAll(".filter-row y-input")[0];
        setTimeout(() => {
            input.dispatchEvent(
                new CustomEvent("input", { detail: { value: "Bob" } }),
            );
        });
        const ev = await oneEvent(el, "filter-change");
        expect(ev.detail.filters.name).to.equal("Bob");
        expect(ev.cancelable).to.be.true;
    });

    it("keeps focus, caret, and value on the inline filter input across keystrokes", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const input = el.shadowRoot.querySelector(
            '[part="filter-input"][data-col-key="name"]',
        );
        // Mirror a real keystroke: focus and populate the native inner input,
        // then fire a native InputEvent so the full event path runs — y-input's
        // re-dispatched CustomEvent plus the composed native event reaching
        // the grid's listener on the host.
        input.input.focus();
        input.input.value = "Bo";
        input.input.setSelectionRange(2, 2);
        input.input.dispatchEvent(
            new InputEvent("input", { bubbles: true, composed: true }),
        );

        // Focus, caret, and the typed value must all survive the refresh, and
        // the rows must be filtered.
        const after = el.shadowRoot.querySelector(
            '[part="filter-input"][data-col-key="name"]',
        );
        expect(after.input.value).to.equal("Bo");
        expect(el.shadowRoot.activeElement).to.equal(after);
        expect(after.input.selectionStart).to.equal(2);
        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(1);
        expect(trs[0].querySelector("td").textContent).to.equal("Bob");
    });

    it("keeps typed digits in order in a number filter input", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const ageInput = () =>
            el.shadowRoot.querySelector(
                '[part="filter-input"][data-col-key="age"]',
            );
        expect(ageInput().input.type).to.equal("number");

        // Real keystrokes are the only way to cover this: a number input has
        // no selection API, so the caret can be neither read back nor
        // simulated. Rebuilding the input mid-entry left the caret at 0 and
        // every keystroke prepended, so "2" then "5" came out as "52".
        ageInput().input.focus();
        await sendKeys({ type: "2" });
        await sendKeys({ type: "5" });

        expect(ageInput().input.value).to.equal("25");
        expect(el.shadowRoot.activeElement).to.equal(ageInput());

        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(1);
        expect(trs[0].querySelector("td").textContent).to.equal("Bob");
    });

    it("honours a mid-string caret in a text filter input", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const nameInput = () =>
            el.shadowRoot.querySelector(
                '[part="filter-input"][data-col-key="name"]',
            );

        nameInput().input.focus();
        await sendKeys({ type: "ob" });
        nameInput().input.setSelectionRange(0, 0);
        await sendKeys({ type: "B" });

        // Text inputs report a real caret, so it must be preserved as-is
        // rather than forced to the end like the selection-less types.
        expect(nameInput().input.value).to.equal("Bob");
        expect(nameInput().input.selectionStart).to.equal(1);
    });

    // The segmented-entry regression this guards against only exists where the
    // engine has a typeable date input; Playwright's WebKit build reflects the
    // type but draws a plain text field, where `06/15/2022` neither segments
    // nor parses and the sanitized value stays empty.
    it("accepts a fully typed date in a date filter input", async function () {
        if (!(await supportsTypedDateInput())) this.skip();

        const dateColumns = JSON.stringify([
            { key: "name", label: "Name" },
            { key: "joined", label: "Joined", type: "date" },
        ]);
        const dateData = JSON.stringify([
            { name: "Ada", joined: "2021-03-04" },
            { name: "Alan", joined: "2022-06-15" },
        ]);
        const el = await fixture(html`
            <y-data-grid columns="${dateColumns}" data="${dateData}" filtering="inline"></y-data-grid>
        `);
        const joinedInput = () =>
            el.shadowRoot.querySelector(
                '[part="filter-input"][data-col-key="joined"]',
            );

        // A date input is segmented, so rebuilding it mid-entry sent the next
        // keystroke back to the month segment and no complete date could ever
        // be typed. The in-place refresh leaves the input alone.
        joinedInput().input.focus();
        await sendKeys({ type: "06/15/2022" });

        expect(joinedInput().input.value).to.equal("2022-06-15");
        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(1);
        expect(trs[0].querySelector("td").textContent).to.equal("Alan");
    });

    it("updates aria-rowcount and the empty state from an in-place refresh", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        const nameInput = el.shadowRoot.querySelector(
            '[part="filter-input"][data-col-key="name"]',
        );

        nameInput.input.focus();
        await sendKeys({ type: "zzz" });
        expect(el.getAttribute("aria-rowcount")).to.equal("0");
        expect(el.shadowRoot.querySelectorAll('[part="empty-state"]').length).to.equal(1);

        await sendKeys({ press: "Backspace" });
        await sendKeys({ press: "Backspace" });
        await sendKeys({ press: "Backspace" });
        expect(el.getAttribute("aria-rowcount")).to.equal("4");
        expect(el.shadowRoot.querySelectorAll('[part="empty-state"]').length).to.equal(0);
    });

    it("select-all toggles the filtered rows after an in-place refresh", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="inline"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        const selectAll = () =>
            el.shadowRoot.querySelector(
                '[part="header-row"] .select-cell y-checkbox',
            );
        const nameInput = el.shadowRoot.querySelector(
            '[part="filter-input"][data-col-key="name"]',
        );

        nameInput.input.focus();
        await sendKeys({ type: "Bob" });

        // The select-all cell is rebuilt by the refresh because its handler
        // closes over the visible rows — a stale one would select all four.
        selectAll().toggle();
        expect(el.selectedKeys).to.eql(["Bob"]);
    });

    it("keeps digit order in a number filter while virtualized", async () => {
        const manyRows = JSON.stringify(
            Array.from({ length: 200 }, (_, i) => ({
                name: `Person ${i}`,
                age: 20 + (i % 50),
                city: "Portland",
            })),
        );
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${manyRows}"
                filtering="inline"
                virtual
                viewport-height="200"
                row-height="40"
            ></y-data-grid>
        `);
        const ageInput = () =>
            el.shadowRoot.querySelector(
                '[part="filter-input"][data-col-key="age"]',
            );

        // Virtual scrolling restructures more than the body, so filtering
        // falls back to a full render — the caret restore still has to hold
        // the number input together across it.
        ageInput().input.focus();
        await sendKeys({ type: "4" });
        await sendKeys({ type: "5" });

        expect(ageInput().input.value).to.equal("45");
        expect(el.shadowRoot.activeElement).to.equal(ageInput());
    });

    it("clearFilters resets state and re-renders all rows", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" filtering="inline"></y-data-grid>
        `);
        el.filters = { city: "Seattle" };
        expect(el.shadowRoot.querySelectorAll("tbody tr").length).to.equal(1);

        el.clearFilters();
        expect(el.shadowRoot.querySelectorAll("tbody tr").length).to.equal(4);
    });

    // ---------------------------------------------------------------- pagination

    it("paginates to page-size rows by default", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                page-size="2"
            ></y-data-grid>
        `);
        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(2);
    });

    it("does not paginate when enable-pagination is 'false'", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                page-size="2"
                enable-pagination="false"
            ></y-data-grid>
        `);
        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(4);
        expect(el.shadowRoot.querySelector("[part='pagination']")).to.be.null;
    });

    it("changing page swaps the visible rows", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                page-size="2"
            ></y-data-grid>
        `);
        el.currentPage = 2;
        const trs = el.shadowRoot.querySelectorAll("tbody tr td:first-child");
        expect(trs[0].textContent).to.equal("Charlie");
        expect(trs[1].textContent).to.equal("Dave");
    });

    it("does not show an item count by default", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        expect(el.shadowRoot.querySelector("[part='item-count']")).to.be.null;
    });

    it("renders the item count on the right when show-item-count is set", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                page-size="2"
                show-item-count
            ></y-data-grid>
        `);
        const count = el.shadowRoot.querySelector("[part='item-count']");
        expect(count).to.not.be.null;
        // Page 1 of size 2 over 4 rows: "1–2 of 4".
        expect(count.textContent).to.include("1–2 of 4");
    });

    it("places the paginator before the item count in the footer", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                show-item-count
            ></y-data-grid>
        `);
        const footer = el.shadowRoot.querySelector("[part='pagination']");
        const children = [...footer.children];
        const paginatorIdx = children.findIndex((c) => c.tagName.toLowerCase() === "slot");
        const countIdx = children.findIndex((c) => c.getAttribute("part") === "item-count");
        expect(paginatorIdx).to.be.lessThan(countIdx);
    });

    it("renders just the count (no paginator) when pagination is disabled but show-item-count is on", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-pagination="false"
                show-item-count
            ></y-data-grid>
        `);
        const footer = el.shadowRoot.querySelector("[part='pagination']");
        expect(footer.querySelector("y-paginator")).to.be.null;
        expect(footer.querySelector("[part='item-count']").textContent).to.include("4 items");
    });

    it("emits a cancelable page-change event when the paginator changes page", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                page-size="2"
            ></y-data-grid>
        `);
        const paginator = el.shadowRoot.querySelector("y-paginator");

        setTimeout(() => {
            paginator.dispatchEvent(new CustomEvent("page-change", {
                detail: { page: 2 },
                bubbles: true,
                composed: true,
                cancelable: true,
            }));
        });
        const ev = await oneEvent(el, "page-change");
        expect(ev.detail.page).to.equal(2);
        expect(ev.detail.pageSize).to.equal(2);
        expect(ev.cancelable).to.be.true;
    });

    // ---------------------------------------------------------------- server mode

    it("does not sort locally in server mode (data passed through as-is)", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                mode="server"
                total-rows="100"
            ></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll("thead th")[0].click();
        // First row is still Alice — order preserved
        const first = el.shadowRoot.querySelector("tbody tr td");
        expect(first.textContent).to.equal("Alice");
    });

    it("respects total-rows for pagination in server mode", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                mode="server"
                total-rows="100"
                page-size="10"
            ></y-data-grid>
        `);
        const paginator = el.shadowRoot.querySelector("y-paginator");
        expect(paginator.getAttribute("total-pages")).to.equal("10");
    });

    // ---------------------------------------------------------------- loading

    it("sets aria-busy when loading", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}" loading></y-data-grid>
        `);
        expect(el.getAttribute("aria-busy")).to.equal("true");
        const overlay = el.shadowRoot.querySelector("[part='loading-overlay']");
        expect(overlay).to.not.be.null;
    });

    describe("loading modes", () => {
        const skeletonBody = (el) =>
            el.shadowRoot.querySelector("[part='skeleton-body']");
        const overlay = (el) =>
            el.shadowRoot.querySelector("[part='loading-overlay']");

        it("auto: renders skeleton when there are no rows to show", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" loading></y-data-grid>
            `);
            expect(skeletonBody(el)).to.exist;
            expect(overlay(el)).to.be.null;
        });

        it("auto: renders the overlay when rows are already visible", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" data="${data}" loading></y-data-grid>
            `);
            expect(overlay(el)).to.exist;
            expect(skeletonBody(el)).to.be.null;
        });

        it("auto: falls back to skeleton when a grid empties mid-load", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" data="${data}" loading></y-data-grid>
            `);
            expect(overlay(el)).to.exist;

            el.data = [];
            await waitFrame();
            expect(skeletonBody(el)).to.exist;
            expect(overlay(el)).to.be.null;
        });

        it("overlay: never renders skeleton even with no data", async () => {
            const el = await fixture(html`
                <y-data-grid
                    columns="${columns}"
                    loading
                    loading-mode="overlay"
                ></y-data-grid>
            `);
            expect(overlay(el)).to.exist;
            expect(skeletonBody(el)).to.be.null;
        });

        it("skeleton: always renders skeleton even with data present", async () => {
            const el = await fixture(html`
                <y-data-grid
                    columns="${columns}"
                    data="${data}"
                    loading
                    loading-mode="skeleton"
                ></y-data-grid>
            `);
            expect(skeletonBody(el)).to.exist;
            expect(overlay(el)).to.be.null;
        });

        it("honors skeleton-rows and clamps to a sane maximum", async () => {
            const el = await fixture(html`
                <y-data-grid
                    columns="${columns}"
                    loading
                    loading-mode="skeleton"
                    skeleton-rows="6"
                ></y-data-grid>
            `);
            expect(
                el.shadowRoot.querySelectorAll("[part='skeleton-row']").length,
            ).to.equal(6);

            el.setAttribute("skeleton-rows", "500");
            await waitFrame();
            expect(
                el.shadowRoot.querySelectorAll("[part='skeleton-row']").length,
            ).to.equal(50);
        });

        it("suppresses the empty state while loading in every mode", async () => {
            const el = await fixture(html`
                <y-data-grid
                    columns="${columns}"
                    loading
                    loading-mode="overlay"
                ></y-data-grid>
            `);
            expect(el.shadowRoot.querySelector("[data-empty]")).to.be.null;
        });

        it("reports aria-rowcount 0 while skeleton rows stand in", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" loading></y-data-grid>
            `);
            expect(el.getAttribute("aria-rowcount")).to.equal("0");
        });

        it("skeleton rows are aria-hidden and carry no row identity", async () => {
            const el = await fixture(html`
                <y-data-grid
                    columns="${columns}"
                    loading
                    loading-mode="skeleton"
                    enable-selection
                ></y-data-grid>
            `);
            const rows = el.shadowRoot.querySelectorAll("[part='skeleton-row']");
            expect(rows.length).to.be.greaterThan(0);
            rows.forEach((r) => {
                expect(r.getAttribute("aria-hidden")).to.equal("true");
                expect(r.hasAttribute("data-row-key")).to.be.false;
            });
        });

        it("bypasses virtualization in skeleton mode", async () => {
            const el = await fixture(html`
                <y-data-grid
                    columns="${columns}"
                    loading
                    loading-mode="skeleton"
                    virtual
                    viewport-height="200"
                ></y-data-grid>
            `);
            expect(skeletonBody(el)).to.exist;
            expect(el.shadowRoot.querySelector(".spacer-row")).to.be.null;
        });

        it("announces once and hides the overlay from assistive tech", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" data="${data}" loading></y-data-grid>
            `);
            const statuses = el.shadowRoot.querySelectorAll("[role='status']");
            expect(statuses.length).to.equal(1);
            expect(overlay(el).getAttribute("aria-hidden")).to.equal("true");
        });

        it("disables pagination while loading", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" data="${data}" loading></y-data-grid>
            `);
            const paginator = el.shadowRoot.querySelector("y-paginator");
            expect(paginator).to.exist;
            expect(paginator.hasAttribute("disabled")).to.be.true;
        });

        it("clears aria-busy and skeleton once loading completes", async () => {
            const el = await fixture(html`
                <y-data-grid columns="${columns}" loading></y-data-grid>
            `);
            expect(skeletonBody(el)).to.exist;

            el.removeAttribute("loading");
            el.data = JSON.parse(data);
            await waitFrame();
            expect(el.hasAttribute("aria-busy")).to.be.false;
            expect(skeletonBody(el)).to.be.null;
            expect(el.getAttribute("aria-rowcount")).to.equal("4");
        });
    });

    // ---------------------------------------------------------------- row events

    it("emits row-click when a row is clicked", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        const row = el.shadowRoot.querySelector("tbody tr");
        setTimeout(() => row.click());
        const ev = await oneEvent(el, "row-click");
        expect(ev.detail.row.name).to.equal("Alice");
    });

    // ---------------------------------------------------------------- setters

    it("columns setter accepts an array", async () => {
        const el = await fixture(html`<y-data-grid></y-data-grid>`);
        el.columns = [{ key: "title", label: "Title" }];
        const ths = el.shadowRoot.querySelectorAll("thead th");
        expect(ths.length).to.equal(1);
        expect(ths[0].textContent).to.include("Title");
    });

    it("data setter accepts an array", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}"></y-data-grid>
        `);
        el.data = [{ name: "X", age: 1, city: "Y" }];
        const trs = el.shadowRoot.querySelectorAll("tbody tr");
        expect(trs.length).to.equal(1);
    });

    it("columns and data getters return [] when a non-array is assigned", async () => {
        const el = await fixture(html`<y-data-grid></y-data-grid>`);
        el.setAttribute("columns", '{"key":"x"}');
        el.setAttribute("data", '{"name":"X"}');
        expect(el.columns).to.deep.equal([]);
        expect(el.data).to.deep.equal([]);
    });

    // ---------------------------------------------------------------- selection

    it("renders a checkbox column when enable-selection is set", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
            ></y-data-grid>
        `);
        const headerCells = el.shadowRoot.querySelectorAll("thead tr:first-child th");
        // 1 select header + 3 column headers
        expect(headerCells.length).to.equal(4);
        const bodyCheckboxes = el.shadowRoot.querySelectorAll("tbody td.select-cell y-checkbox");
        expect(bodyCheckboxes.length).to.equal(4);
    });

    it("toggles a single row via the row checkbox", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        const checkbox = el.shadowRoot.querySelector("tbody tr y-checkbox");
        checkbox.toggle();

        expect(el.selectedKeys).to.deep.equal(["Alice"]);
        expect(el.selectedRows[0].name).to.equal("Alice");
    });

    it("selected row uses the base content color and primary tint (readable in light and dark)", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        el.style.setProperty("--base-content", "rgb(10, 20, 30)");
        el.style.setProperty("--primary-background-active", "rgb(200, 220, 255)");
        el.shadowRoot.querySelector("tbody tr y-checkbox").toggle();
        await waitFrame();
        const cs = getComputedStyle(el.shadowRoot.querySelector("tbody tr.selected"));
        // text is the normal content color, not the (white) primary inverse
        expect(cs.color).to.equal("rgb(10, 20, 30)");
        expect(cs.backgroundColor).to.equal("rgb(200, 220, 255)");
    });

    it("emits a cancelable row-select event when selection changes", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        setTimeout(() => {
            const checkbox = el.shadowRoot.querySelector("tbody tr y-checkbox");
            checkbox.toggle();
        });
        const ev = await oneEvent(el, "row-select");
        expect(ev.cancelable).to.be.true;
        expect(ev.detail.rows[0].name).to.equal("Alice");
        expect(ev.detail.keys).to.deep.equal(["Alice"]);
    });

    it("single selection-mode replaces selection on toggle", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                selection-mode="single"
                row-key="name"
            ></y-data-grid>
        `);
        const checkboxes = el.shadowRoot.querySelectorAll("tbody tr y-checkbox");
        checkboxes[0].toggle();
        checkboxes[1].toggle();

        expect(el.selectedKeys).to.deep.equal(["Bob"]);
    });

    it("select-all header toggles every visible row", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        const selectAll = el.shadowRoot.querySelector("thead tr:first-child .select-cell y-checkbox");
        selectAll.toggle();
        expect(el.selectedKeys.length).to.equal(4);

        const afterToggle = el.shadowRoot.querySelector("thead tr:first-child .select-cell y-checkbox");
        afterToggle.toggle();
        expect(el.selectedKeys.length).to.equal(0);
    });

    it("select-all checkbox is indeterminate on partial selection", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll("tbody tr y-checkbox")[0].toggle();
        const selectAll = el.shadowRoot.querySelector("thead tr:first-child .select-cell y-checkbox");
        expect(selectAll.hasAttribute("indeterminate")).to.be.true;
    });

    it("preventing row-select rolls back the change", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        el.addEventListener("row-select", (e) => e.preventDefault());
        el.shadowRoot.querySelector("tbody tr y-checkbox").toggle();
        expect(el.selectedKeys).to.deep.equal([]);
    });

    it("ctrl-click on a row toggles selection when enable-selection is on", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        const row = el.shadowRoot.querySelector("tbody tr");
        row.dispatchEvent(new MouseEvent("click", { ctrlKey: true, bubbles: true }));
        expect(el.selectedKeys).to.deep.equal(["Alice"]);
    });

    it("sets aria-selected on selected rows", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        el.selectedKeys = ["Bob"];
        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows[0].getAttribute("aria-selected")).to.equal("false");
        expect(rows[1].getAttribute("aria-selected")).to.equal("true");
    });

    it("clearSelection empties the selection", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-selection
                row-key="name"
            ></y-data-grid>
        `);
        el.selectedKeys = ["Alice", "Bob"];
        el.clearSelection();
        expect(el.selectedKeys).to.deep.equal([]);
    });

    // ---------------------------------------------------------------- editing

    it("does not enter edit mode unless enable-editing is set", async () => {
        const el = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        const cell = el.shadowRoot.querySelector("tbody td");
        cell.click();
        expect(el.shadowRoot.querySelector("td.editing")).to.be.null;
    });

    it("preserves the cell width while editing (ghost reserves space)", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        const widthBefore = el.shadowRoot.querySelector("tbody td").getBoundingClientRect().width;
        el.shadowRoot.querySelector("tbody td").click();

        // After re-render, query the new editing cell.
        const editingCell = el.shadowRoot.querySelector("tbody td.editing");
        const ghost = editingCell.querySelector(".cell-value-ghost");
        expect(ghost).to.not.be.null;
        expect(getComputedStyle(ghost).visibility).to.equal("hidden");
        const widthAfter = editingCell.getBoundingClientRect().width;
        expect(Math.abs(widthAfter - widthBefore)).to.be.lessThan(1);
    });

    it("clicking a cell enters edit mode and renders a y-input", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        const cell = el.shadowRoot.querySelector("tbody td");
        cell.click();
        const editor = el.shadowRoot.querySelector("td.editing [part='cell-editor']");
        expect(editor).to.not.be.null;
        expect(editor.tagName.toLowerCase()).to.equal("y-input");
    });

    it("emits cell-edit-start on entering edit mode", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        setTimeout(() => el.shadowRoot.querySelector("tbody td").click());
        const ev = await oneEvent(el, "cell-edit-start");
        expect(ev.detail.row.name).to.equal("Alice");
        expect(ev.detail.column).to.equal("name");
        expect(ev.detail.value).to.equal("Alice");
    });

    it("commits an edit and emits cell-edit-end with new + old values", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector("tbody td").click();
        const editor = el.shadowRoot.querySelector("td.editing [part='cell-editor']");
        editor.value = "Alicia";

        const promise = oneEvent(el, "cell-edit-end");
        el.commitEdit();
        const ev = await promise;

        expect(ev.detail.value).to.equal("Alicia");
        expect(ev.detail.oldValue).to.equal("Alice");
        expect(ev.cancelable).to.be.true;
        expect(el.shadowRoot.querySelector("tbody td").textContent).to.include("Alicia");
    });

    it("cancelEdit emits cell-edit-cancel and restores original value", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector("tbody td").click();
        const editor = el.shadowRoot.querySelector("td.editing [part='cell-editor']");
        editor.value = "Should not stick";

        const promise = oneEvent(el, "cell-edit-cancel");
        el.cancelEdit();
        await promise;

        expect(el.shadowRoot.querySelector("tbody td").textContent).to.include("Alice");
    });

    it("rejecting cell-edit-end leaves the cell in error state", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        el.addEventListener("cell-edit-end", (e) => e.preventDefault());
        el.shadowRoot.querySelector("tbody td").click();
        const editor = el.shadowRoot.querySelector("td.editing [part='cell-editor']");
        editor.value = "Rejected";
        el.commitEdit();

        const status = el.shadowRoot.querySelector(".edit-status--error");
        expect(status).to.not.be.null;
        // Old value preserved
        expect(el.shadowRoot.querySelector("tbody td").textContent).to.include("Alice");
    });

    it("blocks commit on validation failure (required field empty)", async () => {
        const requiredCols = JSON.stringify([
            { key: "name", label: "Name", required: true },
            { key: "age", label: "Age", type: "number" },
        ]);
        const el = await fixture(html`
            <y-data-grid
                columns="${requiredCols}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector("tbody td").click();
        const editor = el.shadowRoot.querySelector("td.editing [part='cell-editor']");
        editor.value = "";
        el.commitEdit();

        const status = el.shadowRoot.querySelector(".edit-status--error");
        expect(status).to.not.be.null;
    });

    it("non-editable columns do not enter edit mode", async () => {
        const partial = JSON.stringify([
            { key: "name", label: "Name", editable: false },
            { key: "age", label: "Age", type: "number" },
        ]);
        const el = await fixture(html`
            <y-data-grid
                columns="${partial}"
                data="${data}"
                enable-editing
            ></y-data-grid>
        `);
        const nameCell = el.shadowRoot.querySelector("tbody td");
        nameCell.click();
        expect(el.shadowRoot.querySelector("td.editing")).to.be.null;
    });

    // ---------------------------------------------------------------- grouping

    const groupedData = JSON.stringify([
        { dept: "Eng", name: "Alice", salary: 100 },
        { dept: "Eng", name: "Bob", salary: 110 },
        { dept: "Eng", name: "Carol", salary: 120 },
        { dept: "Design", name: "Dave", salary: 90 },
        { dept: "Design", name: "Eve", salary: 95 },
    ]);
    const groupCols = JSON.stringify([
        { key: "dept", label: "Department" },
        { key: "name", label: "Name" },
        { key: "salary", label: "Salary", type: "number", align: "right" },
    ]);

    it("renders group header rows when group-by is set", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
            ></y-data-grid>
        `);
        const groups = el.shadowRoot.querySelectorAll(".group-header");
        expect(groups.length).to.equal(2);
        expect(groups[0].textContent).to.include("Eng");
        expect(groups[0].textContent).to.include("(3)");
        expect(groups[1].textContent).to.include("Design");
        expect(groups[1].textContent).to.include("(2)");
    });

    it("hides pagination when grouping is active", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
                page-size="2"
            ></y-data-grid>
        `);
        expect(el.shadowRoot.querySelector("[part='pagination']")).to.be.null;
    });

    it("collapses a group when its header is clicked", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
            ></y-data-grid>
        `);
        const engHeader = el.shadowRoot.querySelector(".group-header");
        engHeader.click();

        const dataRows = el.shadowRoot.querySelectorAll("tbody tr:not(.group-header)");
        // Only Design's 2 rows remain
        expect(dataRows.length).to.equal(2);
    });

    it("emits a group-toggle event when a group is toggled", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
            ></y-data-grid>
        `);
        setTimeout(() => el.shadowRoot.querySelector(".group-header").click());
        const ev = await oneEvent(el, "group-toggle");
        expect(ev.detail.path).to.deep.equal(["Eng"]);
        expect(ev.detail.expanded).to.be.false;
    });

    it("supports nested grouping with indentation", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept","name"]'
            ></y-data-grid>
        `);
        const groups = el.shadowRoot.querySelectorAll(".group-header");
        const depths = [...groups].map((g) => g.getAttribute("data-depth"));
        expect(depths).to.include("0");
        expect(depths).to.include("1");
    });

    it("computes aggregate values in the group header row", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
                aggregates='{"salary":"sum"}'
            ></y-data-grid>
        `);
        const engHeader = el.shadowRoot.querySelector(".group-header");
        const aggCell = engHeader.querySelector(".group-header-agg");
        expect(aggCell).to.not.be.null;
        expect(aggCell.textContent).to.include("330");
    });

    it("collapseAllGroups + expandAllGroups update visibility", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
            ></y-data-grid>
        `);
        el.collapseAllGroups();
        let dataRows = el.shadowRoot.querySelectorAll("tbody tr:not(.group-header)");
        expect(dataRows.length).to.equal(0);

        el.expandAllGroups();
        dataRows = el.shadowRoot.querySelectorAll("tbody tr:not(.group-header)");
        expect(dataRows.length).to.equal(5);
    });

    // ---------------------------------------------------------------- virtualization

    const largeData = JSON.stringify(
        Array.from({ length: 500 }, (_, i) => ({
            id: i,
            name: `User ${i}`,
            score: i * 2,
        })),
    );
    const largeCols = JSON.stringify([
        { key: "id", label: "ID", type: "number" },
        { key: "name", label: "Name" },
        { key: "score", label: "Score", type: "number" },
    ]);

    it("renders only a windowed slice when virtual + viewport-height are set", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${largeCols}"
                data="${largeData}"
                virtual
                viewport-height="200"
                row-height="40"
                buffer-size="5"
                enable-pagination="false"
            ></y-data-grid>
        `);
        const rows = el.shadowRoot.querySelectorAll("tbody tr:not(.spacer-row):not([data-empty])");
        // 200 / 40 = 5 visible + 5 buffer above/below ≈ 15 max
        expect(rows.length).to.be.below(500);
        expect(rows.length).to.be.lessThan(30);
    });

    it("inserts spacer rows that reserve total scroll height", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${largeCols}"
                data="${largeData}"
                virtual
                viewport-height="200"
                row-height="40"
                enable-pagination="false"
            ></y-data-grid>
        `);
        const spacers = el.shadowRoot.querySelectorAll(".spacer-row td");
        const totalSpacerHeight = [...spacers].reduce(
            (sum, td) => sum + parseFloat(td.style.height || "0"),
            0,
        );
        const visibleRowCount = el.shadowRoot.querySelectorAll(
            "tbody tr:not(.spacer-row)",
        ).length;
        // total scroll height = 500 rows * 40px = 20000px
        expect(totalSpacerHeight + visibleRowCount * 40).to.equal(500 * 40);
    });

    it("skips virtualization when group-by is active", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupCols}"
                data="${groupedData}"
                group-by='["dept"]'
                virtual
                viewport-height="200"
            ></y-data-grid>
        `);
        // No spacer rows means full render
        expect(el.shadowRoot.querySelectorAll(".spacer-row").length).to.equal(0);
    });

    // ---------------------------------------------------------------- column groups

    const groupedColumnTree = JSON.stringify([
        { key: "name", label: "Name" },
        {
            label: "Address",
            children: [
                { key: "city", label: "City" },
                { key: "country", label: "Country" },
            ],
        },
    ]);
    const addressData = JSON.stringify([
        { name: "Alice", city: "Portland", country: "USA" },
        { name: "Bob", city: "Berlin", country: "Germany" },
    ]);

    it("renders two header rows when a single-level column group is used", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
            ></y-data-grid>
        `);
        const headerRows = el.shadowRoot.querySelectorAll("thead tr[part='header-row']");
        expect(headerRows.length).to.equal(2);
    });

    it("renders the group header cell with the correct colspan", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
            ></y-data-grid>
        `);
        const groupTh = el.shadowRoot.querySelector(".group-column-header");
        expect(groupTh).to.not.be.null;
        expect(groupTh.textContent).to.include("Address");
        expect(groupTh.getAttribute("colspan")).to.equal("2");
    });

    it("gives top-level leaf columns a rowspan that fills the header", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
            ></y-data-grid>
        `);
        const topRow = el.shadowRoot.querySelector("thead tr[part='header-row']");
        const nameTh = topRow.querySelector("th:not(.group-column-header)");
        expect(nameTh.getAttribute("rowspan")).to.equal("2");
    });

    it("renders only leaf headers in the second row", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
            ></y-data-grid>
        `);
        const rows = el.shadowRoot.querySelectorAll("thead tr[part='header-row']");
        const secondRowThs = rows[1].querySelectorAll("th");
        expect(secondRowThs.length).to.equal(2);
        expect(secondRowThs[0].textContent).to.include("City");
        expect(secondRowThs[1].textContent).to.include("Country");
    });

    it("renders body cells from the flattened leaf list", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
            ></y-data-grid>
        `);
        const firstRowCells = el.shadowRoot.querySelectorAll("tbody tr:first-child td");
        expect(firstRowCells.length).to.equal(3);
        expect(firstRowCells[0].textContent).to.equal("Alice");
        expect(firstRowCells[1].textContent).to.equal("Portland");
        expect(firstRowCells[2].textContent).to.equal("USA");
    });

    it("supports nested column groups across three header rows", async () => {
        const nested = JSON.stringify([
            { key: "id", label: "ID" },
            {
                label: "Profile",
                children: [
                    { key: "name", label: "Name" },
                    {
                        label: "Address",
                        children: [
                            { key: "city", label: "City" },
                            { key: "country", label: "Country" },
                        ],
                    },
                ],
            },
        ]);
        const nestedData = JSON.stringify([
            { id: 1, name: "Alice", city: "Portland", country: "USA" },
        ]);
        const el = await fixture(html`
            <y-data-grid columns="${nested}" data="${nestedData}"></y-data-grid>
        `);
        const headerRows = el.shadowRoot.querySelectorAll("thead tr[part='header-row']");
        expect(headerRows.length).to.equal(3);

        // Top-level "Profile" group spans 3 leaves; "Address" group spans 2.
        const profileTh = el.shadowRoot.querySelector("thead tr:first-child .group-column-header");
        expect(profileTh.getAttribute("colspan")).to.equal("3");
        const addressTh = el.shadowRoot.querySelectorAll(".group-column-header")[1];
        expect(addressTh.getAttribute("colspan")).to.equal("2");

        // ID at depth 0 spans all 3 rows; Name at depth 1 spans 2 rows.
        const idTh = headerRows[0].querySelector("th:not(.group-column-header)");
        expect(idTh.getAttribute("rowspan")).to.equal("3");
        const nameTh = headerRows[1].querySelector("th:not(.group-column-header)");
        expect(nameTh.getAttribute("rowspan")).to.equal("2");
    });

    it("rowspans the selection column across all header rows", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
                enable-selection
            ></y-data-grid>
        `);
        const selectTh = el.shadowRoot.querySelector("thead .select-cell");
        expect(selectTh.getAttribute("rowspan")).to.equal("2");
    });

    it("renders the filter row beneath all group rows when filtering is enabled", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
                filtering="inline"
            ></y-data-grid>
        `);
        const filterInputs = el.shadowRoot.querySelectorAll(".filter-row y-input");
        // 3 leaf columns -> 3 filter inputs
        expect(filterInputs.length).to.equal(3);
    });

    it("still supports sorting on leaf columns nested inside groups", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${groupedColumnTree}"
                data="${addressData}"
            ></y-data-grid>
        `);
        const cityHeader = el.shadowRoot.querySelectorAll(
            "thead tr[data-header-depth='1'] th",
        )[0];
        cityHeader.click();
        const firstCity = el.shadowRoot.querySelector("tbody tr:first-child td:nth-child(2)");
        expect(firstCity.textContent).to.equal("Berlin");
    });

    it("hides pagination in virtual mode", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${largeCols}"
                data="${largeData}"
                virtual
                viewport-height="200"
                row-height="40"
            ></y-data-grid>
        `);
        expect(el.shadowRoot.querySelector("[part='pagination']")).to.be.null;
    });

    // ---------------------------------------------------------------- header menu

    it("renders a header menu trigger only when enable-header-menu is set", async () => {
        const off = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        expect(off.shadowRoot.querySelector(".header-menu-trigger")).to.be.null;

        const on = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        const triggers = on.shadowRoot.querySelectorAll(".header-menu-trigger");
        expect(triggers.length).to.equal(3);
    });

    it("opens a popover with sort + columns + move sections when triggered", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        const trigger = el.shadowRoot.querySelector(".header-menu-trigger");
        trigger.click();
        await waitFrame();

        const portal = findPortal(".header-menu");
        expect(portal).to.not.be.undefined;

        const menu = portal.querySelector(".header-menu");
        const sections = menu.querySelectorAll(".menu-section");
        // sort, columns, move = 3 sections (filter lives in its own popover).
        expect(sections.length).to.equal(3);

        // Filter inputs no longer live in the kebab menu.
        expect(menu.querySelector(".filter-row-inputs")).to.be.null;
    });

    it("renders a filter trigger only when filtering='advanced'", async () => {
        const off = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        expect(off.shadowRoot.querySelector(".header-filter-trigger")).to.be.null;

        const on = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="advanced"
            ></y-data-grid>
        `);
        expect(on.shadowRoot.querySelectorAll(".header-filter-trigger").length).to.equal(3);
        // Advanced filtering does NOT auto-enable the kebab menu.
        expect(on.shadowRoot.querySelector(".header-menu-trigger")).to.be.null;
    });

    it("renders both triggers when filtering='advanced' and enable-header-menu are both on", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="advanced"
                enable-header-menu
            ></y-data-grid>
        `);
        expect(el.shadowRoot.querySelectorAll(".header-filter-trigger").length).to.equal(3);
        expect(el.shadowRoot.querySelectorAll(".header-menu-trigger").length).to.equal(3);
    });

    it("sort-ascending menu item sorts the column ascending", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll(".header-menu-trigger")[1].click(); // age
        await waitFrame();

        const portal = findPortal(".header-menu");
        const ascItem = [...portal.querySelectorAll(".menu-item")].find(
            (b) => b.textContent.includes("Sort ascending"),
        );
        ascItem.click();

        const ages = [...el.shadowRoot.querySelectorAll("tbody tr td:nth-child(2)")]
            .map((td) => Number(td.textContent));
        expect(ages[0]).to.equal(25);
        expect(ages[ages.length - 1]).to.equal(35);
    });

    it("filter popover Apply commits operator + value (gt for number)", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="advanced"
            ></y-data-grid>
        `);
        // Open the age column's filter popover.
        el.shadowRoot.querySelectorAll(".header-filter-trigger")[1].click();
        await waitFrame();

        const portal = findPortal(".filter-popover");
        const opSelect = portal.querySelector(".filter-row-inputs y-select");
        const valInput = portal.querySelector(".filter-row-inputs y-input");

        opSelect.value = "gt";
        // Set the y-input's value directly (its internal <input> wrap reads from the attribute).
        valInput.value = "28";

        const applyBtn = [...portal.querySelectorAll("y-button")].find(
            (b) => b.textContent.includes("Apply"),
        );
        applyBtn.click();
        await waitFrame();

        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).to.equal(2);
        const names = [...rows].map((r) => r.querySelector("td").textContent);
        expect(names).to.deep.equal(["Alice", "Charlie"]);
    });

    it("selecting an operator from the dropdown keeps the filter popover open and applies", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="advanced"
            ></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll(".header-filter-trigger")[1].click(); // age
        await waitFrame();

        const portal = findPortal(".filter-popover");
        const opSelect = portal.querySelector(".filter-row-inputs y-select");

        // Pick "Greater than" by clicking the option inside the select's
        // portaled (`.y-select-portal`) dropdown — this is the interaction that
        // previously dismissed the whole filter popover and dropped the choice.
        opSelect._openDropdown();
        await waitFrame();
        const gtItem = opSelect._portalContainer.shadowRoot.querySelector(
            '.dropdown-item[data-value="gt"]',
        );
        gtItem.click();
        await waitFrame();

        expect(el._filterPopover.open).to.be.true;
        expect(opSelect.value).to.equal("gt");

        const valInput = portal.querySelector(".filter-row-inputs y-input");
        valInput.value = "28";
        const applyBtn = [...portal.querySelectorAll("y-button")].find((b) =>
            b.textContent.includes("Apply"),
        );
        applyBtn.click();
        await waitFrame();

        const names = [...el.shadowRoot.querySelectorAll("tbody tr")].map((r) =>
            r.querySelector("td").textContent,
        );
        expect(names).to.deep.equal(["Alice", "Charlie"]);
    });

    it("filter popover Clear removes the column filter", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="advanced"
            ></y-data-grid>
        `);
        // Seed a filter via the API.
        el.filters = { city: "Seattle" };
        expect(el.shadowRoot.querySelectorAll("tbody tr").length).to.equal(1);

        el.shadowRoot.querySelectorAll(".header-filter-trigger")[2].click();
        await waitFrame();

        const portal = findPortal(".filter-popover");
        const clearBtn = [...portal.querySelectorAll("y-button")].find(
            (b) => b.textContent.includes("Clear"),
        );
        clearBtn.click();
        await waitFrame();

        expect(el.shadowRoot.querySelectorAll("tbody tr").length).to.equal(4);
    });

    it("marks the filter trigger as active when a filter is set on that column", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                filtering="advanced"
            ></y-data-grid>
        `);
        el.filters = { city: "Seattle" };
        const triggers = el.shadowRoot.querySelectorAll(".header-filter-trigger");
        // city is the 3rd column.
        expect(triggers[2].classList.contains("is-active")).to.be.true;
        expect(triggers[0].classList.contains("is-active")).to.be.false;
    });

    it("stages column hide and applies it only when the submenu closes", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector(".header-menu-trigger").click();
        await waitFrame();

        const portal = findPortal(".header-menu");
        const colsItem = [...portal.querySelectorAll(".menu-item")].find(
            (b) => b.textContent.includes("Columns"),
        );
        colsItem.click();
        await waitFrame();

        const submenuPortal = findPortal(".column-item[data-col-key]");
        const cityRow = submenuPortal.querySelector(".column-item[data-col-key='city']");
        cityRow.click();

        // Body is unchanged while the submenu is still open.
        let firstRowCells = el.shadowRoot.querySelectorAll("tbody tr:first-child td");
        expect(firstRowCells.length).to.equal(3);

        // Closing the submenu commits the change.
        const submenuPopover = el.shadowRoot.querySelector("[part='header-menu-submenu']");
        await submenuPopover.hide("api");

        firstRowCells = el.shadowRoot.querySelectorAll("tbody tr:first-child td");
        expect(firstRowCells.length).to.equal(2);
        const headers = [...el.shadowRoot.querySelectorAll("thead th[scope='col']")]
            .map((th) => th.textContent.replace(/\s+/g, "").trim());
        expect(headers.some((h) => h.startsWith("City"))).to.be.false;
    });

    it("blocks hiding the last visible column", async () => {
        const oneCol = JSON.stringify([{ key: "name", label: "Name" }]);
        const el = await fixture(html`
            <y-data-grid
                columns="${oneCol}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector(".header-menu-trigger").click();
        await waitFrame();

        const portal = findPortal(".header-menu");
        const colsItem = [...portal.querySelectorAll(".menu-item")].find(
            (b) => b.textContent.includes("Columns"),
        );
        colsItem.click();
        await waitFrame();

        const submenuPortal = findPortal(".column-item[data-col-key='name']");
        const row = submenuPortal.querySelector(".column-item[data-col-key='name']");
        row.click();
        expect(row.getAttribute("aria-checked")).to.equal("true");

        const submenuPopover = el.shadowRoot.querySelector("[part='header-menu-submenu']");
        await submenuPopover.hide("api");

        expect(el.shadowRoot.querySelectorAll("thead th[scope='col']").length).to.equal(1);
    });

    it("move column next swaps it with the following leaf sibling", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        el.shadowRoot.querySelectorAll(".header-menu-trigger")[0].click();
        await waitFrame();

        const portal = findPortal(".header-menu");
        const nextItem = [...portal.querySelectorAll(".menu-item")].find(
            (b) => b.textContent.includes("Move column next"),
        );
        nextItem.click();

        const headers = [...el.shadowRoot.querySelectorAll("thead th[scope='col']")]
            .map((th) => th.textContent.trim().split(/\s/)[0]);
        expect(headers[0].startsWith("Age")).to.be.true;
        expect(headers[1].startsWith("Name")).to.be.true;
    });

    it("move column previous is disabled on the first column", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector(".header-menu-trigger").click();
        await waitFrame();

        const portal = findPortal(".header-menu");
        const prevItem = [...portal.querySelectorAll(".menu-item")].find(
            (b) => b.textContent.includes("Move column previous"),
        );
        expect(prevItem.hasAttribute("disabled")).to.be.true;
    });

    it("hovering the Columns item opens the submenu", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-header-menu
            ></y-data-grid>
        `);
        el.shadowRoot.querySelector(".header-menu-trigger").click();
        await waitFrame();

        const portal = findPortal(".header-menu");
        const colsItem = [...portal.querySelectorAll(".menu-item")].find(
            (b) => b.textContent.includes("Columns"),
        );
        colsItem.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        await waitFrame();

        const submenuPopover = el.shadowRoot.querySelector("[part='header-menu-submenu']");
        expect(submenuPopover.open).to.be.true;
    });

    // ----------------------------------------------------- column resize

    it("applies a configured column width through the colgroup", async () => {
        const cols = JSON.stringify([
            { key: "name", label: "Name", width: "250px" },
            { key: "age", label: "Age" },
        ]);
        const el = await fixture(html`
            <y-data-grid columns="${cols}" data="${data}"></y-data-grid>
        `);
        const col = el.shadowRoot.querySelector(
            "colgroup col[data-col-key='name']",
        );
        expect(col.style.width).to.equal("250px");
    });

    it("renders a resize handle per leaf header when enable-column-resize is set", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-column-resize
            ></y-data-grid>
        `);
        expect(
            el.shadowRoot.querySelectorAll(".col-resize-handle").length,
        ).to.equal(3);
    });

    it("omits the resize handle for columns with resizable:false", async () => {
        const cols = JSON.stringify([
            { key: "name", label: "Name", resizable: false },
            { key: "age", label: "Age" },
        ]);
        const el = await fixture(html`
            <y-data-grid
                columns="${cols}"
                data="${data}"
                enable-column-resize
            ></y-data-grid>
        `);
        expect(
            el.shadowRoot.querySelectorAll(".col-resize-handle").length,
        ).to.equal(1);
    });

    it("dragging the resize handle widens the column and emits column-resize", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-column-resize
            ></y-data-grid>
        `);
        const handle = el.shadowRoot.querySelector(
            "thead th[data-col-key='name'] .col-resize-handle",
        );
        const th = handle.closest("th");
        const startWidth = th.getBoundingClientRect().width;
        const r = handle.getBoundingClientRect();

        let detail = null;
        el.addEventListener("column-resize", (e) => (detail = e.detail));

        const opts = (x) => ({
            bubbles: true,
            button: 0,
            pointerId: 7,
            clientX: x,
            clientY: r.top + 2,
        });
        handle.dispatchEvent(new PointerEvent("pointerdown", opts(r.left)));
        handle.dispatchEvent(new PointerEvent("pointermove", opts(r.left + 60)));
        handle.dispatchEvent(new PointerEvent("pointerup", opts(r.left + 60)));

        expect(detail).to.not.be.null;
        expect(detail.column).to.equal("name");
        expect(detail.width).to.be.greaterThan(startWidth);
        const col = el.shadowRoot.querySelector(
            "colgroup col[data-col-key='name']",
        );
        expect(col.style.width).to.not.equal("");
    });

    it("resizing a column does not also trigger a sort", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-column-resize
            ></y-data-grid>
        `);
        const handle = el.shadowRoot.querySelector(
            "thead th[data-col-key='name'] .col-resize-handle",
        );
        const r = handle.getBoundingClientRect();
        const opts = (x) => ({
            bubbles: true,
            button: 0,
            pointerId: 8,
            clientX: x,
            clientY: r.top + 2,
        });
        // Shrink so the pointer ends over the header body, then fire the
        // trailing click that a real drag would produce there.
        handle.dispatchEvent(new PointerEvent("pointerdown", opts(r.left)));
        handle.dispatchEvent(new PointerEvent("pointermove", opts(r.left - 40)));
        handle.dispatchEvent(new PointerEvent("pointerup", opts(r.left - 40)));
        el.shadowRoot.querySelector("thead th[data-col-key='name']").click();

        expect(
            el.shadowRoot
                .querySelector("thead th[data-col-key='name']")
                .getAttribute("aria-sort"),
        ).to.equal("none");
    });

    it("double-clicking the resize handle clears the column width", async () => {
        const cols = JSON.stringify([
            { key: "name", label: "Name", width: "300px" },
            { key: "age", label: "Age" },
        ]);
        const el = await fixture(html`
            <y-data-grid
                columns="${cols}"
                data="${data}"
                enable-column-resize
            ></y-data-grid>
        `);
        let detail = null;
        el.addEventListener("column-resize", (e) => (detail = e.detail));

        el.shadowRoot
            .querySelector("thead th[data-col-key='name'] .col-resize-handle")
            .dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

        expect(detail).to.deep.equal({ column: "name", width: null });
        expect(
            el.shadowRoot.querySelector("colgroup col[data-col-key='name']")
                .style.width,
        ).to.equal("");
    });

    // ---------------------------------------------------- column reorder

    it("marks leaf headers reorderable only when enable-column-reorder is set", async () => {
        const off = await fixture(html`
            <y-data-grid columns="${columns}" data="${data}"></y-data-grid>
        `);
        expect(off.shadowRoot.querySelector("thead th.reorderable")).to.be.null;

        const on = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-column-reorder
            ></y-data-grid>
        `);
        expect(
            on.shadowRoot.querySelectorAll("thead th.reorderable").length,
        ).to.equal(3);
    });

    it("reorders a column when its header is dragged onto another", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-column-reorder
            ></y-data-grid>
        `);
        const headers = () => [
            ...el.shadowRoot.querySelectorAll("thead th[data-col-key]"),
        ];
        const nameTh = headers()[0];
        const cityRect = headers()[2].getBoundingClientRect();
        const startRect = nameTh.getBoundingClientRect();

        let detail = null;
        el.addEventListener("column-reorder", (e) => (detail = e.detail));

        nameTh.dispatchEvent(
            new PointerEvent("pointerdown", {
                bubbles: true,
                button: 0,
                pointerId: 3,
                clientX: startRect.left + 5,
                clientY: startRect.top + 5,
            }),
        );
        nameTh.dispatchEvent(
            new PointerEvent("pointermove", {
                bubbles: true,
                pointerId: 3,
                clientX: cityRect.right - 2,
                clientY: cityRect.top + 5,
            }),
        );
        nameTh.dispatchEvent(
            new PointerEvent("pointerup", {
                bubbles: true,
                pointerId: 3,
                clientX: cityRect.right - 2,
                clientY: cityRect.top + 5,
            }),
        );
        await waitFrame();
        await waitFrame();

        expect(headers().map((th) => th.dataset.colKey)).to.deep.equal([
            "age",
            "city",
            "name",
        ]);
        expect(detail.column).to.equal("name");
        expect(detail.order).to.deep.equal(["age", "city", "name"]);
    });

    it("treats a header press without travel as a sort click, not a drag", async () => {
        const el = await fixture(html`
            <y-data-grid
                columns="${columns}"
                data="${data}"
                enable-column-reorder
            ></y-data-grid>
        `);
        const nameTh = el.shadowRoot.querySelector("thead th[data-col-key='name']");
        const rect = nameTh.getBoundingClientRect();
        const at = (type) =>
            nameTh.dispatchEvent(
                new PointerEvent(type, {
                    bubbles: true,
                    button: 0,
                    pointerId: 4,
                    clientX: rect.left + 5,
                    clientY: rect.top + 5,
                }),
            );
        at("pointerdown");
        at("pointerup");
        nameTh.click();

        expect(el.shadowRoot.querySelector("tbody tr td").textContent).to.equal(
            "Alice",
        );
    });
});
