import sinon from "sinon";
import { fixture, html, expect } from "@open-wc/testing";
import "./y-dock.js";

describe("YumeDock", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    const items = [
        { name: "Home", icon: "home", href: "/", selected: true },
        { name: "Search", icon: "search", href: "/search" },
        { name: "Profile", icon: "settings", href: "/profile" },
    ];

    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        expect(el.getAttribute("position")).to.equal("bottom");
        expect(el.getAttribute("size")).to.equal("medium");
        expect(el.getAttribute("role")).to.equal("navigation");
        expect(el.getAttribute("aria-label")).to.equal("Dock navigation");
    });

    it("renders the correct number of item buttons from JSON items", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const buttons = el.shadowRoot.querySelectorAll(".item");
        expect(buttons.length).to.equal(3);
    });

    it("sets aria-current=page on selected item", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const firstItem = el.shadowRoot.querySelector(".item");
        expect(firstItem.getAttribute("aria-current")).to.equal("page");
    });

    it("renders y-icon for each item", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const icons = el.shadowRoot.querySelectorAll(".item y-icon");
        expect(icons.length).to.equal(3);
        expect(icons[0].getAttribute("name")).to.equal("home");
        expect(icons[1].getAttribute("name")).to.equal("search");
    });

    it("renders item labels", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const labels = el.shadowRoot.querySelectorAll(".item-label");
        expect(labels.length).to.equal(3);
        expect(labels[0].textContent).to.equal("Home");
        expect(labels[2].textContent).to.equal("Profile");
    });

    it("items getter parses JSON attribute", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);
        expect(el.items).to.deep.equal(items);
    });

    it("items getter returns empty array for invalid JSON", async () => {
        const el = await fixture(html`<y-dock items="not-json"></y-dock>`);
        expect(el.items).to.deep.equal([]);
    });

    it("items setter stores rich data on the property and re-renders", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);

        el.items = items;
        expect(el.items).to.equal(items);
        // Rich data is not reflected back to the attribute.
        expect(el.hasAttribute("items")).to.be.false;
        const buttons = el.shadowRoot.querySelectorAll(".item");
        expect(buttons.length).to.equal(3);
    });

    it("items setter parses a JSON string into an array", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);

        el.items = JSON.stringify(items);
        expect(el.items).to.deep.equal(items);
        expect(el.shadowRoot.querySelectorAll(".item").length).to.equal(3);
    });

    it("position defaults to bottom", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        expect(el.position).to.equal("bottom");
    });

    it("position setter accepts top", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        el.position = "top";
        expect(el.getAttribute("position")).to.equal("top");
        expect(el.position).to.equal("top");
    });

    it("position setter normalizes invalid value to bottom", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        el.position = "left";
        expect(el.position).to.equal("bottom");
    });

    it("size defaults to medium", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        expect(el.size).to.equal("medium");
    });

    it("size setter accepts valid values", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);

        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");

        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("size setter normalizes invalid value to medium", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        el.size = "huge";
        expect(el.getAttribute("size")).to.equal("medium");
    });

    it("fires navigate event with href detail on item click", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const listener = sandbox.spy();
        el.addEventListener("navigate", listener);

        const firstItem = el.shadowRoot.querySelector(".item");
        firstItem.click();

        expect(listener.calledOnce).to.be.true;
        expect(listener.firstCall.args[0].detail.href).to.equal("/");
    });

    it("navigate event is cancelable", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const pushStateSpy = sandbox.spy(window.history, "pushState");
        el.addEventListener("navigate", (e) => e.preventDefault());

        const firstItem = el.shadowRoot.querySelector(".item");
        firstItem.click();

        expect(pushStateSpy.called).to.be.false;
    });

    it("uses pushState navigation by default", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const pushStateSpy = sandbox.spy(window.history, "pushState");
        const secondItem = el.shadowRoot.querySelectorAll(".item")[1];
        secondItem.click();

        expect(pushStateSpy.calledOnce).to.be.true;
        expect(pushStateSpy.firstCall.args[2]).to.equal("/search");
    });

    it("uses window.location.href when history=false", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}' history="false"></y-dock>`);

        // Prevent actual navigation by canceling the event
        el.addEventListener("navigate", (e) => e.preventDefault());

        const pushStateSpy = sandbox.spy(window.history, "pushState");
        const firstItem = el.shadowRoot.querySelector(".item");
        firstItem.click();

        expect(pushStateSpy.called).to.be.false;
    });

    it("does not fire navigate for items without href", async () => {
        const noHrefItems = [{ name: "Action", icon: "star" }];
        const el = await fixture(html`<y-dock items='${JSON.stringify(noHrefItems)}'></y-dock>`);

        const listener = sandbox.spy();
        el.addEventListener("navigate", listener);

        el.shadowRoot.querySelector(".item").click();
        expect(listener.called).to.be.false;
    });

    it("renders default slot for direct children", async () => {
        const el = await fixture(html`
            <y-dock>
                <button>Custom Item</button>
            </y-dock>
        `);

        const defaultSlot = el.shadowRoot.querySelector("slot:not([name])");
        expect(defaultSlot).to.exist;
    });

    it("ArrowRight moves focus to next item", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const btns = el.shadowRoot.querySelectorAll(".item");
        btns[0].focus();

        btns[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(btns[1]);
    });

    it("ArrowLeft moves focus to previous item", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const btns = el.shadowRoot.querySelectorAll(".item");
        btns[1].focus();

        btns[1].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(btns[0]);
    });

    it("ArrowRight wraps from last to first item", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const btns = el.shadowRoot.querySelectorAll(".item");
        btns[2].focus();

        btns[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(el.shadowRoot.activeElement).to.equal(btns[0]);
    });

    it("breakpoint getter returns null when attribute is omitted", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        expect(el.breakpoint).to.be.null;
    });

    it("breakpoint getter returns number when attribute is set", async () => {
        const el = await fixture(html`<y-dock breakpoint="768"></y-dock>`);
        expect(el.breakpoint).to.equal(768);
    });

    it("breakpoint setter removes attribute when null", async () => {
        const el = await fixture(html`<y-dock breakpoint="768"></y-dock>`);
        el.breakpoint = null;
        expect(el.hasAttribute("breakpoint")).to.be.false;
    });

    it("history getter and setter round-trip", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        expect(el.history).to.be.null;

        el.history = "false";
        expect(el.history).to.equal("false");
        expect(el.getAttribute("history")).to.equal("false");

        el.history = null;
        expect(el.hasAttribute("history")).to.be.false;
    });

    it("CSS includes correct height variable for size", async () => {
        const el = await fixture(html`<y-dock size="large"></y-dock>`);

        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("--component-dock-height-large");
    });

    it("position=top anchors to top and border is on bottom", async () => {
        const el = await fixture(html`<y-dock position="top"></y-dock>`);

        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("top: 0;");
        expect(css).to.include("border-bottom:");
    });

    it("position=bottom anchors to bottom and border is on top", async () => {
        const el = await fixture(html`<y-dock position="bottom"></y-dock>`);

        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("bottom: 0;");
        expect(css).to.include("border-top:");
    });

    it("floating getter reflects the attribute", async () => {
        const el = await fixture(html`<y-dock></y-dock>`);
        expect(el.floating).to.be.false;

        el.floating = true;
        expect(el.hasAttribute("floating")).to.be.true;
        expect(el.floating).to.be.true;

        el.floating = false;
        expect(el.hasAttribute("floating")).to.be.false;
    });

    it("non-floating dock spans the edge with a single edge border", async () => {
        const el = await fixture(html`<y-dock position="bottom"></y-dock>`);

        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("left: 0;");
        expect(css).to.include("border-top:");
        expect(css).to.not.include("box-shadow:");
        expect(css).to.not.include("--component-dock-floating-margin");
    });

    it("floating dock is inset with a full border, radius, and shadow", async () => {
        const el = await fixture(html`<y-dock floating></y-dock>`);

        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("--component-dock-floating-margin");
        expect(css).to.include("border-radius:");
        expect(css).to.include("box-shadow:");
    });

    it("renders item with custom slot template", async () => {
        const slotItems = [{ name: "Custom", icon: "star", slot: "custom-item" }];
        const el = await fixture(html`
            <y-dock items='${JSON.stringify(slotItems)}'>
                <div slot="custom-item">Custom content</div>
            </y-dock>
        `);

        const slotEl = el.shadowRoot.querySelector('slot[name="custom-item"]');
        expect(slotEl).to.exist;
    });

    it("each item button has aria-label from name", async () => {
        const el = await fixture(html`<y-dock items='${JSON.stringify(items)}'></y-dock>`);

        const buttons = el.shadowRoot.querySelectorAll("button.item");
        buttons.forEach((btn, i) => {
            expect(btn.getAttribute("aria-label")).to.equal(items[i].name);
        });
    });
});
