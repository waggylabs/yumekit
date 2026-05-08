import { fixture, expect, html, oneEvent } from "@open-wc/testing";
import "../y-panelbar/y-panelbar.js";
import "./y-panel.js";

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

    it("applies --component-panel-accent color when selected", async () => {
        const el = await fixture(html`
            <y-panel selected>
                <span slot="label">Item</span>
            </y-panel>
        `);

        // Inject a sentinel value so we can confirm the CSS rule actually
        // references --component-panel-accent (regression: the variable was
        // never emitted by the token build, making selected state invisible).
        el.style.setProperty("--component-panel-accent", "rgb(255, 0, 0)");
        await new Promise((r) => setTimeout(r, 0));

        const color = window.getComputedStyle(el).color;
        expect(color).to.equal("rgb(255, 0, 0)");
    });

    it("applies accent box-shadow to a selected child panel", async () => {
        const bar = await fixture(html`
            <y-panelbar>
                <y-panel expanded>
                    <span slot="label">Parent</span>
                    <div slot="children">
                        <y-panel id="child" selected>
                            <span slot="label">Child</span>
                        </y-panel>
                    </div>
                </y-panel>
            </y-panelbar>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const child = bar.querySelector("#child");
        expect(child.getAttribute("data-is-child")).to.equal("true");

        child.style.setProperty("--component-panel-accent", "rgb(0, 128, 0)");
        child.style.setProperty("--component-panelbar-border-width", "4px");
        await new Promise((r) => setTimeout(r, 0));

        const boxShadow = window.getComputedStyle(child).boxShadow;
        expect(boxShadow).to.include("rgb(0, 128, 0)");
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
                    <y-panel slot="children"
                        ><span slot="label">1a</span></y-panel
                    >
                </y-panel>
                <y-panel id="p2">
                    <span slot="label">Two</span>
                    <y-panel slot="children"
                        ><span slot="label">2a</span></y-panel
                    >
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

describe("YumePanel — href / route matching", () => {
    it("adds a popstate listener when connected with href attribute", async () => {
        const addSpy = [];
        const origAdd = window.addEventListener.bind(window);
        window.addEventListener = (type, ...args) => {
            addSpy.push(type);
            return origAdd(type, ...args);
        };

        const el = await fixture(html`
            <y-panel href="/some-path">
                <span slot="label">Link</span>
            </y-panel>
        `);

        window.addEventListener = origAdd;
        expect(addSpy).to.include("popstate");
    });

    it("removes the popstate listener on disconnectedCallback when href is set", async () => {
        const removeSpy = [];
        const origRemove = window.removeEventListener.bind(window);
        window.removeEventListener = (type, ...args) => {
            removeSpy.push(type);
            return origRemove(type, ...args);
        };

        const el = await fixture(html`
            <y-panel href="/some-path">
                <span slot="label">Link</span>
            </y-panel>
        `);

        el.remove();

        window.removeEventListener = origRemove;
        expect(removeSpy).to.include("popstate");
    });

    it("sets selected=true when href matches the current pathname", async () => {
        // Patch location.pathname via history
        history.pushState({}, "", "/test-route");

        const el = await fixture(html`
            <y-panel href="/test-route">
                <span slot="label">Route</span>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        expect(el.selected).to.be.true;

        // Restore
        history.pushState({}, "", "/");
    });

    it("sets selected=false when href does not match the current pathname", async () => {
        history.pushState({}, "", "/");

        const el = await fixture(html`
            <y-panel href="/different-route">
                <span slot="label">Route</span>
            </y-panel>
        `);

        await new Promise((r) => setTimeout(r, 0));

        expect(el.selected).to.be.false;
    });

    it("navigates using pushState when history attribute is not false", async () => {
        const pushed = [];
        const origPush = history.pushState.bind(history);
        history.pushState = (...args) => {
            pushed.push(args);
            return origPush(...args);
        };

        const el = await fixture(html`
            <y-panel href="/push-route">
                <span slot="label">Nav</span>
            </y-panel>
        `);

        const header = el.shadowRoot.querySelector(".header");
        header.click();
        await new Promise((r) => setTimeout(r, 0));

        history.pushState = origPush;
        expect(pushed.some((a) => a[2] === "/push-route")).to.be.true;

        // Restore
        history.pushState({}, "", "/");
    });
});

describe("YumePanel — keyboard interaction", () => {
    it("pressing Space on the arrow button toggles the panel", async () => {
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

        arrow.dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", bubbles: true }),
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(el.expanded).to.be.true;
    });

    it("pressing Enter on the arrow button toggles the panel", async () => {
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
        arrow.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(el.expanded).to.be.true;
    });

    it("pressing Space on the header fires a click (select event)", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Leaf</span>
            </y-panel>
        `);

        const header = el.shadowRoot.querySelector(".header");

        setTimeout(() => {
            header.dispatchEvent(
                new KeyboardEvent("keydown", { key: " ", bubbles: true }),
            );
        });
        const event = await oneEvent(el, "select");

        expect(event).to.exist;
    });

    it("pressing Enter on the header fires a click (select event)", async () => {
        const el = await fixture(html`
            <y-panel>
                <span slot="label">Leaf</span>
            </y-panel>
        `);

        const header = el.shadowRoot.querySelector(".header");

        setTimeout(() => {
            header.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
            );
        });
        const event = await oneEvent(el, "select");

        expect(event).to.exist;
    });
});
