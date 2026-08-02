import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-stepper.js";

const ITEMS_3 = JSON.stringify([
    { label: "Account", slot: "account" },
    { label: "Details", slot: "details" },
    { label: "Review", slot: "review" },
]);

const ITEMS_WITH_DESC = JSON.stringify([
    { label: "Account", slot: "account", description: "Create your account" },
    { label: "Details", slot: "details", description: "Personal info" },
    { label: "Review", slot: "review" },
]);

const ITEMS_WITH_ICON = JSON.stringify([
    { label: "Account", slot: "account", icon: "user" },
    { label: "Details", slot: "details" },
    { label: "Review", slot: "review" },
]);

const ITEMS_WITH_STATUS = JSON.stringify([
    { label: "Account", slot: "account", status: "complete" },
    { label: "Details", slot: "details", status: "error" },
    { label: "Review", slot: "review" },
]);

describe("YumeStepper", () => {
    // ── Defaults ──────────────────────────────────────────────

    it("renders with default attributes", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account content</div>
                <div slot="details">Details content</div>
                <div slot="review">Review content</div>
            </y-stepper>`,
        );

        const indicators = el.shadowRoot.querySelector(".indicators");
        expect(indicators).to.exist;
        expect(indicators.getAttribute("role")).to.equal("list");
    });

    it("defaults to current=0", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.current).to.equal(0);
    });

    it("defaults to horizontal orientation", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.orientation).to.equal("horizontal");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.size).to.equal("medium");
    });

    it("defaults to start position", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.position).to.equal("start");
    });

    it("defaults to non-linear", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.linear).to.be.false;
    });

    it("defaults to non-editable", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.editable).to.be.false;
    });

    // ── Rendering ─────────────────────────────────────────────

    it("renders correct number of indicators", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        const indicators = el.shadowRoot.querySelectorAll(".indicator");
        expect(indicators.length).to.equal(3);
    });

    it("renders connectors between indicators", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const connectors = el.shadowRoot.querySelectorAll(".connector");
        expect(connectors.length).to.equal(2);
    });

    it("renders step numbers when no icon is provided", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const icons = el.shadowRoot.querySelectorAll(".indicator-icon");
        expect(icons[0].textContent.trim()).to.equal("1");
        expect(icons[1].textContent.trim()).to.equal("2");
        expect(icons[2].textContent.trim()).to.equal("3");
    });

    it("renders y-icon when icon is provided", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_ICON}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const firstIcon = el.shadowRoot.querySelector(".indicator-icon y-icon");
        expect(firstIcon).to.exist;
        expect(firstIcon.getAttribute("name")).to.equal("user");
    });

    it("renders description text", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_DESC}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const desc = el.shadowRoot.querySelector(".indicator-description");
        expect(desc).to.exist;
        expect(desc.textContent).to.equal("Create your account");
    });

    it("renders panels for each step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        const panels = el.shadowRoot.querySelectorAll(".panel");
        expect(panels.length).to.equal(3);
    });

    it("only shows the active panel", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        const panels = el.shadowRoot.querySelectorAll(".panel");
        expect(panels[0].hidden).to.be.false;
        expect(panels[1].hidden).to.be.true;
        expect(panels[2].hidden).to.be.true;
    });

    it("renders empty when no items", async () => {
        const el = await fixture(
            html`<y-stepper>
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        expect(el.shadowRoot.querySelector(".indicators")).to.not.exist;
    });

    // ── Step status ───────────────────────────────────────────

    it("applies status from items definition", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const indicators = el.shadowRoot.querySelectorAll(".indicator");
        expect(indicators[0].classList.contains("complete")).to.be.true;
        expect(indicators[1].classList.contains("error")).to.be.true;
    });

    it("shows check icon for complete steps", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const firstIcon = el.shadowRoot.querySelector(
            ".indicator.complete .indicator-icon y-icon",
        );
        expect(firstIcon).to.exist;
        expect(firstIcon.getAttribute("name")).to.equal("check");
    });

    it("shows exclamation icon for error steps", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const errorIcon = el.shadowRoot.querySelector(
            ".indicator.error .indicator-icon y-icon",
        );
        expect(errorIcon).to.exist;
        expect(errorIcon.getAttribute("name")).to.equal("circle-exclamation");
    });

    // ── Navigation: next() ────────────────────────────────────

    it("next() advances to next step and marks current as complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        setTimeout(() => el.next());
        const event = await oneEvent(el, "change");

        expect(event.detail.index).to.equal(1);
        expect(event.detail.previousIndex).to.equal(0);
        expect(el.current).to.equal(1);
    });

    it("next() on last step fires finish when all complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        el.complete(0);
        el.complete(1);
        el.current = 2;
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.next());
        const event = await oneEvent(el, "finish");
        expect(event).to.exist;
    });

    it("next() on last step does not fire finish when not all complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        el.current = 2;
        await new Promise((r) => setTimeout(r, 0));

        let finished = false;
        el.addEventListener("finish", () => {
            finished = true;
        });
        el.next();
        await new Promise((r) => setTimeout(r, 50));
        expect(finished).to.be.false;
    });

    // ── Navigation: previous() ────────────────────────────────

    it("previous() goes back one step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" current="1">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        setTimeout(() => el.previous());
        const event = await oneEvent(el, "change");
        expect(event.detail.index).to.equal(0);
        expect(event.detail.previousIndex).to.equal(1);
    });

    it("previous() at step 0 is a no-op", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        let changed = false;
        el.addEventListener("change", () => {
            changed = true;
        });
        el.previous();
        await new Promise((r) => setTimeout(r, 50));
        expect(changed).to.be.false;
    });

    // ── Navigation: goTo() ────────────────────────────────────

    it("goTo() jumps to a step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        setTimeout(() => el.goTo(2));
        const event = await oneEvent(el, "change");
        expect(event.detail.index).to.equal(2);
    });

    it("goTo() is blocked by linear when target is not complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" linear>
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        let changed = false;
        el.addEventListener("change", () => {
            changed = true;
        });
        el.goTo(2);
        await new Promise((r) => setTimeout(r, 50));
        expect(changed).to.be.false;
    });

    it("goTo() is allowed in linear mode when target is complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" linear current="2">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        el.complete(0);
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.goTo(0));
        const event = await oneEvent(el, "change");
        expect(event.detail.index).to.equal(0);
    });

    // ── complete() ────────────────────────────────────────────

    it("complete() marks current step as complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        setTimeout(() => el.complete());
        const event = await oneEvent(el, "complete");
        expect(event.detail.index).to.equal(0);
        expect(event.detail.step.label).to.equal("Account");
    });

    it("complete(index) marks specific step as complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        setTimeout(() => el.complete(1));
        const event = await oneEvent(el, "complete");
        expect(event.detail.index).to.equal(1);
    });

    // ── reset() ───────────────────────────────────────────────

    it("reset() returns all steps to pending and current to 0", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" current="2">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        el.complete(0);
        el.complete(1);
        el.reset();

        expect(el.current).to.equal(0);

        const indicators = el.shadowRoot.querySelectorAll(
            ".indicator.complete",
        );
        expect(indicators.length).to.equal(0);
    });

    // ── change event cancelation ──────────────────────────────

    it("change event can be cancelled to prevent navigation", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        el.addEventListener("change", (e) => e.preventDefault());
        el.next();
        await new Promise((r) => setTimeout(r, 50));
        expect(el.current).to.equal(0);
    });

    // ── linear mode ───────────────────────────────────────────

    it("linear disables clicking on non-complete indicators", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" linear>
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const buttons = el.shadowRoot.querySelectorAll(".indicator-btn");
        expect(buttons[1].getAttribute("aria-disabled")).to.equal("true");
        expect(buttons[2].getAttribute("aria-disabled")).to.equal("true");
    });

    // ── editable mode ─────────────────────────────────────────

    it("editable allows clicking completed steps", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" editable current="2">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        el.complete(0);
        el.complete(1);
        await new Promise((r) => setTimeout(r, 0));

        const buttons = el.shadowRoot.querySelectorAll(".indicator-btn");
        expect(buttons[0].hasAttribute("aria-disabled")).to.be.false;
    });

    // ── Accessibility ─────────────────────────────────────────

    it("indicators container has role=list", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const indicators = el.shadowRoot.querySelector(".indicators");
        expect(indicators.getAttribute("role")).to.equal("list");
    });

    it("each indicator has role=listitem", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const items = el.shadowRoot.querySelectorAll(".indicator");
        items.forEach((item) => {
            expect(item.getAttribute("role")).to.equal("listitem");
        });
    });

    it("active indicator has aria-current=step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const activeBtn = el.shadowRoot.querySelector(
            ".indicator.active .indicator-btn",
        );
        expect(activeBtn.getAttribute("aria-current")).to.equal("step");
    });

    it("indicator buttons have aria-controls linked to panels", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const btn = el.shadowRoot.querySelector(".indicator-btn");
        expect(btn.getAttribute("aria-controls")).to.equal("panel-account");
    });

    it("panels have aria-labelledby linked to indicators", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const panel = el.shadowRoot.querySelector("#panel-account");
        expect(panel.getAttribute("aria-labelledby")).to.equal(
            "indicator-account",
        );
    });

    it("completed step has (complete) in aria-label", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const btn = el.shadowRoot.querySelector(
            ".indicator.complete .indicator-btn",
        );
        expect(btn.getAttribute("aria-label")).to.include("(complete)");
    });

    it("inactive panels have hidden attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
                <div slot="details">Details</div>
                <div slot="review">Review</div>
            </y-stepper>`,
        );

        const panels = el.shadowRoot.querySelectorAll(".panel");
        expect(panels[0].hidden).to.be.false;
        expect(panels[1].hidden).to.be.true;
    });

    // ── CSS parts ─────────────────────────────────────────────

    it("exposes stepper parts", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        expect(el.shadowRoot.querySelector("[part~='indicators']")).to.exist;
        expect(el.shadowRoot.querySelector("[part~='indicator']")).to.exist;
        expect(el.shadowRoot.querySelector("[part~='indicator-icon']")).to
            .exist;
        expect(el.shadowRoot.querySelector("[part~='indicator-label']")).to
            .exist;
        expect(el.shadowRoot.querySelector("[part~='connector']")).to.exist;
        expect(el.shadowRoot.querySelector("[part~='panels']")).to.exist;
        expect(el.shadowRoot.querySelector("[part~='panel']")).to.exist;
    });

    it("exposes indicator--active part on active step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        expect(el.shadowRoot.querySelector("[part~='indicator--active']")).to
            .exist;
    });

    it("exposes indicator--complete part on complete step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        expect(el.shadowRoot.querySelector("[part~='indicator--complete']")).to
            .exist;
    });

    it("exposes indicator--error part on error step", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        expect(el.shadowRoot.querySelector("[part~='indicator--error']")).to
            .exist;
    });

    // ── Property setters ──────────────────────────────────────

    it("current setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        el.current = 1;
        expect(el.getAttribute("current")).to.equal("1");
    });

    it("orientation setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        el.orientation = "vertical";
        expect(el.getAttribute("orientation")).to.equal("vertical");
    });

    it("position setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        el.position = "end";
        expect(el.getAttribute("position")).to.equal("end");
    });

    it("size setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("linear setter toggles the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        el.linear = true;
        expect(el.hasAttribute("linear")).to.be.true;

        el.linear = false;
        expect(el.hasAttribute("linear")).to.be.false;
    });

    it("editable setter toggles the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        el.editable = true;
        expect(el.hasAttribute("editable")).to.be.true;

        el.editable = false;
        expect(el.hasAttribute("editable")).to.be.false;
    });

    it("items setter stores rich data on the property without reflecting to the attribute", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const newItems = [{ label: "One", slot: "one" }];
        el.items = newItems;
        expect(el.items).to.equal(newItems);
        // Rich data is not serialized back to the attribute; the seed remains.
        expect(el.getAttribute("items")).to.equal(ITEMS_3);
    });

    it("items setter parses a JSON string into an array", async () => {
        const el = await fixture(html`<y-stepper></y-stepper>`);
        el.items = '[{"label":"One","slot":"one"}]';
        expect(el.items).to.deep.equal([{ label: "One", slot: "one" }]);
    });

    // ── Position ──────────────────────────────────────────────

    it("renders indicators before panels by default (start)", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const children = Array.from(el.shadowRoot.children).filter(
            (c) => c.tagName !== "STYLE",
        );
        expect(children[0].classList.contains("indicators")).to.be.true;
        expect(children[1].classList.contains("panels")).to.be.true;
    });

    it("renders panels before indicators when position=end", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" position="end">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const children = Array.from(el.shadowRoot.children).filter(
            (c) => c.tagName !== "STYLE",
        );
        expect(children[0].classList.contains("panels")).to.be.true;
        expect(children[1].classList.contains("indicators")).to.be.true;
    });

    it("applies bottom margin to panels when position=end (horizontal)", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}" position="end">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("margin-bottom");
    });

    it("applies right margin to panels when position=end (vertical)", async () => {
        const el = await fixture(
            html`<y-stepper
                items="${ITEMS_3}"
                position="end"
                orientation="vertical"
            >
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("margin-right");
    });

    // ── Connector states ──────────────────────────────────────

    it("connector becomes complete when preceding step is complete", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_WITH_STATUS}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const connectors = el.shadowRoot.querySelectorAll(".connector-line");
        expect(connectors[0].classList.contains("complete")).to.be.true;
    });

    // ── Host display ──────────────────────────────────────────

    it("sets host display to block", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <div slot="account">Account</div>
            </y-stepper>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: block");
    });

    // ── Custom icon slots ─────────────────────────────────────

    it("renders custom icon slot when slotted content exists", async () => {
        const el = await fixture(
            html`<y-stepper items="${ITEMS_3}">
                <y-icon slot="account-icon" name="user"></y-icon>
                <div slot="account">Account</div>
            </y-stepper>`,
        );

        const iconSlot = el.shadowRoot.querySelector(
            "slot[name='account-icon']",
        );
        expect(iconSlot).to.exist;
    });
});
