import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-paginator.js";

describe("YumePaginator", () => {
    // ── Defaults ──────────────────────────────────────────────

    it("has default attribute values", async () => {
        const el = await fixture(html`<y-paginator total-pages="10"></y-paginator>`);
        expect(el.currentPage).to.equal(1);
        expect(el.totalPages).to.equal(10);
        expect(el.pageCount).to.equal(5);
        expect(el.boundaryCount).to.equal(1);
        expect(el.variant).to.equal("default");
        expect(el.size).to.equal("medium");
        expect(el.disabled).to.be.false;
        expect(el.hideOnSinglePage).to.be.true;
        expect(el.itemsPerPage).to.be.null;
        expect(el.pageSizeOptions).to.deep.equal([]);
    });

    it("sets navigation role and aria-label on connect", async () => {
        const el = await fixture(html`<y-paginator total-pages="3"></y-paginator>`);
        expect(el.getAttribute("role")).to.equal("navigation");
        expect(el.getAttribute("aria-label")).to.equal("Pagination");
    });

    it("does not overwrite a user-supplied aria-label", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="3" aria-label="Search results pagination"></y-paginator>`,
        );
        expect(el.getAttribute("aria-label")).to.equal(
            "Search results pagination",
        );
    });

    // ── Hide-on-single-page ───────────────────────────────────

    it("hides itself when total-pages is 0 and no page-size select", async () => {
        const el = await fixture(html`<y-paginator total-pages="0"></y-paginator>`);
        expect(el.hasAttribute("hidden")).to.be.true;
    });

    it("hides itself when total-pages is 1 by default", async () => {
        const el = await fixture(html`<y-paginator total-pages="1"></y-paginator>`);
        expect(el.hasAttribute("hidden")).to.be.true;
    });

    it("renders when hide-on-single-page=false even with one page", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="1" hide-on-single-page="false"></y-paginator>`,
        );
        expect(el.hasAttribute("hidden")).to.be.false;
        expect(el.shadowRoot.querySelectorAll(".button").length).to.equal(1);
    });

    it("stays visible at total=0 when a page-size select is configured", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="0"
                page-size-options="[10,25,50]"
            ></y-paginator>`,
        );
        expect(el.hasAttribute("hidden")).to.be.false;
        expect(el.shadowRoot.querySelector(".page-size")).to.exist;
    });

    // ── Rendering ─────────────────────────────────────────────

    it("renders all pages when total fits within window", async () => {
        const el = await fixture(html`<y-paginator total-pages="5"></y-paginator>`);
        const buttons = el.shadowRoot.querySelectorAll(".button");
        expect(buttons.length).to.equal(5);
        expect(buttons[0].textContent.trim()).to.equal("1");
        expect(buttons[4].textContent.trim()).to.equal("5");
    });

    it("renders page buttons as <y-button> with style-type=flat", async () => {
        const el = await fixture(html`<y-paginator total-pages="5"></y-paginator>`);
        const inactive = el.shadowRoot.querySelector(
            '.button:not(.active)',
        );
        expect(inactive.tagName).to.equal("Y-BUTTON");
        expect(inactive.getAttribute("style-type")).to.equal("flat");
    });

    it("renders the active page as filled primary y-button", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="5" current-page="3"></y-paginator>`,
        );
        const active = el.shadowRoot.querySelector('[aria-current="page"]');
        expect(active.tagName).to.equal("Y-BUTTON");
        expect(active.getAttribute("style-type")).to.equal("filled");
        expect(active.getAttribute("color")).to.equal("primary");
        expect(active.textContent.trim()).to.equal("3");
    });

    it("inserts an ellipsis on the right when current page is near the start", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="20" current-page="1"></y-paginator>`,
        );
        const list = el.shadowRoot.querySelector(".list");
        const tokens = Array.from(list.children).map((c) =>
            c.classList.contains("ellipsis")
                ? c.dataset.key
                : c.textContent.trim(),
        );
        expect(tokens).to.include("ellipsis-end");
        expect(tokens).to.not.include("ellipsis-start");
        expect(tokens[tokens.length - 1]).to.equal("20");
    });

    it("inserts an ellipsis on the left when current page is near the end", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="20" current-page="20"></y-paginator>`,
        );
        const list = el.shadowRoot.querySelector(".list");
        const tokens = Array.from(list.children).map((c) =>
            c.classList.contains("ellipsis")
                ? c.dataset.key
                : c.textContent.trim(),
        );
        expect(tokens).to.include("ellipsis-start");
        expect(tokens).to.not.include("ellipsis-end");
        expect(tokens[0]).to.equal("1");
    });

    it("inserts ellipses on both sides when current page is in the middle", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="20" current-page="10"></y-paginator>`,
        );
        const list = el.shadowRoot.querySelector(".list");
        const ellipses = list.querySelectorAll(".ellipsis");
        expect(ellipses.length).to.equal(2);
    });

    it("respects boundary-count for first/last visible pages", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="50"
                current-page="25"
                boundary-count="2"
            ></y-paginator>`,
        );
        const list = el.shadowRoot.querySelector(".list");
        const buttons = Array.from(list.querySelectorAll(".button")).map((b) =>
            b.textContent.trim(),
        );
        expect(buttons.slice(0, 2)).to.deep.equal(["1", "2"]);
        expect(buttons.slice(-2)).to.deep.equal(["49", "50"]);
    });

    it("clamps current-page above total-pages to total-pages", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="5" current-page="99"></y-paginator>`,
        );
        expect(el.currentPage).to.equal(5);
        const active = el.shadowRoot.querySelector('[aria-current="page"]');
        expect(active.textContent.trim()).to.equal("5");
    });

    // ── Interaction ───────────────────────────────────────────

    it("emits a page-change event when a page button is clicked", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="1"></y-paginator>`,
        );
        const target = el.shadowRoot.querySelector('[data-page="3"]');
        setTimeout(() => target.click());
        const event = await oneEvent(el, "page-change");
        expect(event.detail.page).to.equal(3);
        expect(el.currentPage).to.equal(3);
    });

    it("does not change page when page-change is canceled", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="1"></y-paginator>`,
        );
        el.addEventListener("page-change", (e) => e.preventDefault());

        const target = el.shadowRoot.querySelector('[data-page="3"]');
        target.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.currentPage).to.equal(1);
    });

    it("emits update:current-page after page-change", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="1"></y-paginator>`,
        );
        let updateFired = false;
        el.addEventListener("update:current-page", (e) => {
            updateFired = true;
            expect(e.detail.page).to.equal(2);
        });

        el.next();
        await new Promise((r) => setTimeout(r, 0));
        expect(updateFired).to.be.true;
    });

    it("disables prev navigation on the first page", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="1"></y-paginator>`,
        );
        const prev = el.shadowRoot.querySelector(".nav-prev");
        expect(prev.hasAttribute("disabled")).to.be.true;
    });

    it("disables next navigation on the last page", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="10"></y-paginator>`,
        );
        const next = el.shadowRoot.querySelector(".nav-next");
        expect(next.hasAttribute("disabled")).to.be.true;
    });

    it("next() advances to the following page", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="2"></y-paginator>`,
        );
        el.next();
        await new Promise((r) => setTimeout(r, 0));
        expect(el.currentPage).to.equal(3);
    });

    it("previous() returns to the prior page", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="2"></y-paginator>`,
        );
        el.previous();
        await new Promise((r) => setTimeout(r, 0));
        expect(el.currentPage).to.equal(1);
    });

    it("goTo() clamps the requested page into range", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="5"></y-paginator>`,
        );
        el.goTo(99);
        await new Promise((r) => setTimeout(r, 0));
        expect(el.currentPage).to.equal(10);
    });

    // ── Disabled state ────────────────────────────────────────

    it("blocks click navigation when disabled", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="10"
                current-page="1"
                disabled
            ></y-paginator>`,
        );
        const target = el.shadowRoot.querySelector('[data-page="3"]');
        target.click();
        await new Promise((r) => setTimeout(r, 0));
        expect(el.currentPage).to.equal(1);
    });

    it("marks every page button as disabled when disabled", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                current-page="1"
                disabled
            ></y-paginator>`,
        );
        const buttons = el.shadowRoot.querySelectorAll(".button");
        for (const b of buttons) {
            expect(b.hasAttribute("disabled")).to.be.true;
        }
    });

    // ── Variant ───────────────────────────────────────────────

    it("renders prev/next labels when variant=detailed", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="10"
                current-page="2"
                variant="detailed"
            ></y-paginator>`,
        );
        expect(el.shadowRoot.querySelector(".nav-prev .nav-text")).to.exist;
        expect(el.shadowRoot.querySelector(".nav-next .nav-text")).to.exist;
    });

    it("does not render label spans in default/compact variants", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="10" current-page="2"></y-paginator>`,
        );
        expect(el.shadowRoot.querySelector(".nav-prev .nav-text")).to.not.exist;
    });

    // ── Slots ─────────────────────────────────────────────────

    it("exposes a custom ellipsis slot when an ellipsis is rendered", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="20"
                current-page="10"
            ></y-paginator>`,
        );
        const slot = el.shadowRoot.querySelector('slot[name="ellipsis"]');
        expect(slot).to.exist;
    });

    // ── CSS Parts ─────────────────────────────────────────────

    it("exposes documented CSS parts", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="5" current-page="2"></y-paginator>`,
        );
        expect(el.shadowRoot.querySelector('[part~="list"]')).to.exist;
        expect(el.shadowRoot.querySelector('[part~="button"]')).to.exist;
        expect(el.shadowRoot.querySelector('[part~="button--active"]')).to.exist;
        expect(el.shadowRoot.querySelector('[part~="nav-prev"]')).to.exist;
        expect(el.shadowRoot.querySelector('[part~="nav-next"]')).to.exist;
    });

    // ── Items per page ────────────────────────────────────────

    it("renders a page-size select when page-size-options is set", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options="[10,25,50]"
            ></y-paginator>`,
        );
        const select = el.shadowRoot.querySelector(".page-size-select");
        expect(select).to.exist;
        expect(select.tagName).to.equal("Y-SELECT");
        const options = JSON.parse(select.getAttribute("options"));
        expect(options).to.deep.equal([
            { value: "10", label: "10" },
            { value: "25", label: "25" },
            { value: "50", label: "50" },
        ]);
    });

    it("accepts {value, label} objects in page-size-options", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options='[{"value":10,"label":"Ten"},{"value":25,"label":"Twenty-five"}]'
            ></y-paginator>`,
        );
        const select = el.shadowRoot.querySelector(".page-size-select");
        const options = JSON.parse(select.getAttribute("options"));
        expect(options[0]).to.deep.equal({ value: "10", label: "Ten" });
    });

    it("preselects items-per-page when it matches an option", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options="[10,25,50]"
                items-per-page="25"
            ></y-paginator>`,
        );
        const select = el.shadowRoot.querySelector(".page-size-select");
        expect(select.getAttribute("value")).to.equal("25");
    });

    it("falls back to first option when items-per-page is unset", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options="[10,25,50]"
            ></y-paginator>`,
        );
        const select = el.shadowRoot.querySelector(".page-size-select");
        expect(select.getAttribute("value")).to.equal("10");
    });

    it("emits page-size-change when the user picks a new value", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options="[10,25,50]"
                items-per-page="10"
            ></y-paginator>`,
        );
        let event;
        el.addEventListener("page-size-change", (e) => (event = e));

        const select = el.shadowRoot.querySelector(".page-size-select");
        select.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: "25" },
                bubbles: true,
                composed: true,
            }),
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(event).to.exist;
        expect(event.detail.pageSize).to.equal(25);
        expect(el.itemsPerPage).to.equal(25);
    });

    it("does not update items-per-page when page-size-change is canceled", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options="[10,25,50]"
                items-per-page="10"
            ></y-paginator>`,
        );
        el.addEventListener("page-size-change", (e) => e.preventDefault());

        const select = el.shadowRoot.querySelector(".page-size-select");
        select.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: "25" },
                bubbles: true,
                composed: true,
            }),
        );
        await new Promise((r) => setTimeout(r, 0));
        expect(el.itemsPerPage).to.equal(10);
    });

    it("setPageSize() programmatically changes items-per-page", async () => {
        const el = await fixture(
            html`<y-paginator
                total-pages="5"
                page-size-options="[10,25,50]"
                items-per-page="10"
            ></y-paginator>`,
        );
        el.setPageSize(50);
        await new Promise((r) => setTimeout(r, 0));
        expect(el.itemsPerPage).to.equal(50);
    });

    // ── Keyboard ──────────────────────────────────────────────

    it("supports ArrowRight to step focus to the next y-button", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="5" current-page="3"></y-paginator>`,
        );
        const page1 = el.shadowRoot.querySelector('[data-page="1"]');
        const page2 = el.shadowRoot.querySelector('[data-page="2"]');
        const page1Inner = page1.shadowRoot.querySelector("button");
        page1Inner.focus();

        page1.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowRight",
                bubbles: true,
                composed: true,
            }),
        );
        expect(document.activeElement.shadowRoot.activeElement).to.equal(page2);
    });

    it("supports Home to focus the first interactive y-button", async () => {
        const el = await fixture(
            html`<y-paginator total-pages="5" current-page="3"></y-paginator>`,
        );
        const navPrev = el.shadowRoot.querySelector(".nav-prev");
        const page3 = el.shadowRoot.querySelector('[data-page="3"]');
        page3.shadowRoot.querySelector("button").focus();

        page3.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Home",
                bubbles: true,
                composed: true,
            }),
        );
        expect(document.activeElement.shadowRoot.activeElement).to.equal(
            navPrev,
        );
    });
});
