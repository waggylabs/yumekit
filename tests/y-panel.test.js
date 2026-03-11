import { fixture, expect, html, oneEvent } from "@open-wc/testing";
import "../src/components/y-panelbar.js";
import "../src/components/y-panel.js";

describe("YumePanel", () => {
    it("renders a header and arrow button", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Item</span>
            </y-panel>
        `);

        const header = el.shadowRoot.querySelector(".header");
        const arrow = el.shadowRoot.querySelector(".arrow");

        expect(header).to.exist;
        expect(arrow).to.exist;
        expect(arrow.tagName.toLowerCase()).to.equal("button");
    });

    it("arrow button carries aria-expanded, not the header", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Item</span>
            </y-panel>
        `);

        const header = el.shadowRoot.querySelector(".header");
        const arrow = el.shadowRoot.querySelector(".arrow");

        expect(arrow.getAttribute("aria-expanded")).to.equal("false");
        expect(header.hasAttribute("aria-expanded")).to.be.false;
    });

    it("arrow is hidden when there are no children", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Leaf</span>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const arrow = el.shadowRoot.querySelector(".arrow");
        const computed = window.getComputedStyle(arrow);
        expect(computed.visibility).to.equal("hidden");
    });

    it("arrow click expands a panel with children", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Parent</span>
                <y-panel slot="children">
                    <span slot="label">Child</span>
                </y-panel>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const arrow = el.shadowRoot.querySelector(".arrow");
        expect(el.expanded).to.be.false;

        arrow.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.expanded).to.be.true;
        expect(arrow.getAttribute("aria-expanded")).to.equal("true");
    });

    it("arrow click collapses an already expanded panel", async () => {
        const el = await fixture(html`
            <y-panel expanded>
                <span slot="label">Parent</span>
                <y-panel slot="children">
                    <span slot="label">Child</span>
                </y-panel>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const arrow = el.shadowRoot.querySelector(".arrow");
        expect(el.expanded).to.be.true;

        arrow.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.expanded).to.be.false;
        expect(arrow.getAttribute("aria-expanded")).to.equal("false");
    });

    it("header click on a parent panel fires select event (not toggle)", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Parent</span>
                <y-panel slot="children">
                    <span slot="label">Child</span>
                </y-panel>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const header = el.shadowRoot.querySelector(".header");

        setTimeout(() => header.click());
        const event = await oneEvent(el, "select");

        expect(event).to.exist;
        expect(event.detail.selected).to.be.true;
        expect(el.expanded).to.be.false;
    });

    it("header click on a leaf panel fires select event", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Leaf</span>
            </y-panel>
        `);

        const header = el.shadowRoot.querySelector(".header");

        setTimeout(() => header.click());
        const event = await oneEvent(el, "select");

        expect(event).to.exist;
        expect(event.detail.selected).to.be.true;
    });

    it("arrow click does not fire select event", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Parent</span>
                <y-panel slot="children">
                    <span slot="label">Child</span>
                </y-panel>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        let selectFired = false;
        el.addEventListener("select", () => {
            selectFired = true;
        });

        const arrow = el.shadowRoot.querySelector(".arrow");
        arrow.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(selectFired).to.be.false;
    });

    it("arrow click fires toggle event", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Parent</span>
                <y-panel slot="children">
                    <span slot="label">Child</span>
                </y-panel>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const arrow = el.shadowRoot.querySelector(".arrow");

        setTimeout(() => arrow.click());
        const event = await oneEvent(el, "toggle");

        expect(event).to.exist;
    });

    it("reflects selected attribute", async () => {
        const el = await fixture(html`
            <y-panel selected>
                <span slot="label">Item</span>
            </y-panel>
        `);

        expect(el.selected).to.be.true;

        el.selected = false;
        expect(el.selected).to.be.false;
    });

    it("expand() and collapse() methods work", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Parent</span>
                <y-panel slot="children">
                    <span slot="label">Child</span>
                </y-panel>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        el.expand();
        expect(el.expanded).to.be.true;

        el.collapse();
        expect(el.expanded).to.be.false;
    });

    it("collapses siblings in exclusive panelbar when arrow clicked", async () => {
        const bar = await fixture(html`
            <y-panelbar exclusive>
                <y-panel id="p1" expanded>
                    <span slot="label">One</span>
                    <y-panel slot="children"><span slot="label">1a</span></y-panel>
                </y-panel>
                <y-panel id="p2">
                    <span slot="label">Two</span>
                    <y-panel slot="children"><span slot="label">2a</span></y-panel>
                </y-panel>
            </y-panelbar>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const p1 = bar.querySelector("#p1");
        const p2 = bar.querySelector("#p2");
        const p2Arrow = p2.shadowRoot.querySelector(".arrow");

        expect(p1.expanded).to.be.true;
        p2Arrow.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(p2.expanded).to.be.true;
        expect(p1.expanded).to.be.false;
    });
});

describe("YumePanelBar", () => {
    it("renders a slot", async () => {
        const el = await fixture(html`
            <y-panelbar>
                <y-panel><span slot="label">Item</span></y-panel>
            </y-panelbar>
        `);

        const slot = el.shadowRoot.querySelector("slot");
        expect(slot).to.exist;
    });
});
