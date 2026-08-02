import sinon from "sinon";
import { fixture, html, expect } from "@open-wc/testing";
import "./y-drawer.js";

describe("YumeDrawer", () => {
    it("is hidden by default", async () => {
        const el = await fixture(html`
            <y-drawer>
                <div slot="header">Header</div>
                <div slot="body">Body</div>
                <div slot="footer">Footer</div>
            </y-drawer>
        `);
        expect(el.hasAttribute("visible")).to.be.false;
        expect(getComputedStyle(el).display).to.equal("none");
    });

    it("shows when visible attribute is set", async () => {
        const el = await fixture(html`<y-drawer visible></y-drawer>`);
        expect(el.hasAttribute("visible")).to.be.true;
        expect(getComputedStyle(el).display).to.equal("block");
    });

    it("defaults position to left", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        expect(el.position).to.equal("left");
        const panel = el.shadowRoot.querySelector(".drawer-panel");
        expect(panel.getAttribute("data-position")).to.equal("left");
    });

    it("accepts position attribute for each side", async () => {
        for (const pos of ["left", "right", "top", "bottom"]) {
            const el = await fixture(
                html`<y-drawer position="${pos}"></y-drawer>`,
            );
            expect(el.position).to.equal(pos);
            const panel = el.shadowRoot.querySelector(".drawer-panel");
            expect(panel.getAttribute("data-position")).to.equal(pos);
        }
    });

    it("toggles visibility when anchor element is clicked", async () => {
        const container = await fixture(html`
            <div>
                <button id="drawer-trigger">Open</button>
                <y-drawer anchor="drawer-trigger">
                    <div slot="body">Content</div>
                </y-drawer>
            </div>
        `);
        const btn = container.querySelector("#drawer-trigger");
        const drawer = container.querySelector("y-drawer");

        expect(drawer.hasAttribute("visible")).to.be.false;
        btn.click();
        expect(drawer.hasAttribute("visible")).to.be.true;
        btn.click();
        expect(drawer.hasAttribute("visible")).to.be.false;
    });

    it("closes on Escape key when open", async () => {
        const el = await fixture(html`<y-drawer visible></y-drawer>`);
        expect(el.hasAttribute("visible")).to.be.true;
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        expect(el.hasAttribute("visible")).to.be.false;
    });

    it("closes when overlay is clicked", async () => {
        const el = await fixture(html`<y-drawer visible></y-drawer>`);
        expect(el.hasAttribute("visible")).to.be.true;
        const overlay = el.shadowRoot.querySelector(".overlay");
        overlay.click();
        expect(el.hasAttribute("visible")).to.be.false;
    });

    it("fires open when it becomes visible and close when it hides", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        const events = [];
        el.addEventListener("open", (e) => events.push(e.type));
        el.addEventListener("close", (e) => events.push(e.type));

        el.visible = true;
        el.visible = false;

        expect(events.join(",")).to.equal("open,close");
    });

    it("fires close when the overlay dismisses the drawer", async () => {
        const el = await fixture(html`<y-drawer visible></y-drawer>`);
        const events = [];
        el.addEventListener("close", (e) => events.push(e.type));

        el.shadowRoot.querySelector(".overlay").click();

        expect(events.length).to.equal(1);
    });

    it("fires close when Escape dismisses the drawer", async () => {
        const el = await fixture(html`<y-drawer visible></y-drawer>`);
        const events = [];
        el.addEventListener("close", (e) => events.push(e.type));

        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );

        expect(events.length).to.equal(1);
    });

    it("does not fire open when it mounts already visible", async () => {
        const events = [];
        const onOpen = (e) => events.push(e.type);
        document.addEventListener("open", onOpen);
        await fixture(html`<y-drawer visible></y-drawer>`);
        document.removeEventListener("open", onOpen);

        expect(events.length).to.equal(0);
    });

    it("open bubbles and crosses the shadow boundary", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        const events = [];
        const onOpen = (e) => events.push(e);
        document.addEventListener("open", onOpen);

        el.visible = true;
        document.removeEventListener("open", onOpen);

        expect(events.length).to.equal(1);
        expect(events[0].composed).to.be.true;
    });

    it("focuses the drawer panel on show", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        const panel = el.shadowRoot.querySelector(".drawer-panel");
        const focusSpy = sinon.spy(panel, "focus");
        el.visible = true;
        expect(focusSpy.calledOnce).to.be.true;
    });

    it("renders header, body, and footer slots", async () => {
        const el = await fixture(html`
            <y-drawer visible>
                <div slot="header">My Header</div>
                <p slot="body">My Body</p>
                <span slot="footer">My Footer</span>
            </y-drawer>
        `);
        const headerSlot = el.shadowRoot.querySelector('slot[name="header"]');
        const bodySlot = el.shadowRoot.querySelector('slot[name="body"]');
        const footerSlot = el.shadowRoot.querySelector('slot[name="footer"]');

        expect(
            headerSlot
                .assignedNodes()
                .find((n) => n.textContent.includes("My Header")),
        ).to.exist;
        expect(
            bodySlot
                .assignedNodes()
                .find((n) => n.textContent.includes("My Body")),
        ).to.exist;
        expect(
            footerSlot
                .assignedNodes()
                .find((n) => n.textContent.includes("My Footer")),
        ).to.exist;
    });

    it("updates position via property setter", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        el.position = "right";
        await new Promise((r) => setTimeout(r, 0));
        const panel = el.shadowRoot.querySelector(".drawer-panel");
        expect(panel.getAttribute("data-position")).to.equal("right");
    });

    it("adds open class to panel and overlay on show", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        el.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        const panel = el.shadowRoot.querySelector(".drawer-panel");
        const overlay = el.shadowRoot.querySelector(".overlay");
        expect(panel.classList.contains("open")).to.be.true;
        expect(overlay.classList.contains("open")).to.be.true;
    });

    it("removes open class on hide", async () => {
        const el = await fixture(html`<y-drawer visible></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));
        el.visible = false;
        await new Promise((r) => setTimeout(r, 0));
        const panel = el.shadowRoot.querySelector(".drawer-panel");
        const overlay = el.shadowRoot.querySelector(".overlay");
        expect(panel.classList.contains("open")).to.be.false;
        expect(overlay.classList.contains("open")).to.be.false;
    });

    it("does not show resize handle by default", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        const handle = el.shadowRoot.querySelector(".resize-handle");
        expect(handle).to.exist;
        expect(handle.style.display).to.equal("none");
    });

    it("shows resize handle when resizable is set", async () => {
        const el = await fixture(html`<y-drawer resizable></y-drawer>`);
        const handle = el.shadowRoot.querySelector(".resize-handle");
        expect(handle.style.display).to.equal("flex");
    });

    it("contains grip SVG inside resize handle", async () => {
        const el = await fixture(html`<y-drawer resizable></y-drawer>`);
        const handle = el.shadowRoot.querySelector(".resize-handle");
        const svg = handle.querySelector("svg");
        expect(svg).to.exist;
    });

    it("resizable property getter reflects attribute", async () => {
        const el = await fixture(html`<y-drawer></y-drawer>`);
        expect(el.resizable).to.be.false;
        el.resizable = true;
        expect(el.hasAttribute("resizable")).to.be.true;
        expect(el.resizable).to.be.true;
    });

    it("pointerdown on resize handle sets _resizing and disables panel transition", async () => {
        const el = await fixture(html`<y-drawer resizable visible></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 300, clientY: 200, bubbles: true })
        );

        expect(el._resizing).to.be.true;
        expect(panel.style.transition).to.equal("none");
    });

    it("pointermove resizes the panel width for a left drawer", async () => {
        const el = await fixture(html`<y-drawer resizable visible position="left"></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        // Start resize at clientX=300
        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 300, clientY: 0, bubbles: true })
        );

        // Move pointer right by 50px — should increase width
        document.dispatchEvent(
            new PointerEvent("pointermove", { clientX: 350, clientY: 0, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 0));

        // Panel width should be set as a px value
        expect(panel.style.width).to.match(/\d+px/);
    });

    it("pointermove resizes the panel width for a right drawer", async () => {
        const el = await fixture(html`<y-drawer resizable visible position="right"></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 100, clientY: 0, bubbles: true })
        );

        // Move pointer left by 50px — right drawer grows when dragging left
        document.dispatchEvent(
            new PointerEvent("pointermove", { clientX: 50, clientY: 0, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(panel.style.width).to.match(/\d+px/);
    });

    it("pointermove resizes the panel height for a top drawer", async () => {
        const el = await fixture(html`<y-drawer resizable visible position="top"></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 0, clientY: 200, bubbles: true })
        );

        document.dispatchEvent(
            new PointerEvent("pointermove", { clientX: 0, clientY: 260, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(panel.style.height).to.match(/\d+px/);
    });

    it("pointermove resizes the panel height for a bottom drawer", async () => {
        const el = await fixture(html`<y-drawer resizable visible position="bottom"></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 0, clientY: 500, bubbles: true })
        );

        // Move up by 80px — bottom drawer grows when dragging up
        document.dispatchEvent(
            new PointerEvent("pointermove", { clientX: 0, clientY: 420, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(panel.style.height).to.match(/\d+px/);
    });

    it("pointermove enforces a minimum panel size of 100px", async () => {
        const el = await fixture(html`<y-drawer resizable visible position="left"></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        // Start at 300px and drag far left so new size would be negative
        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 300, clientY: 0, bubbles: true })
        );

        document.dispatchEvent(
            new PointerEvent("pointermove", { clientX: 10, clientY: 0, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 0));

        const width = parseInt(panel.style.width, 10);
        expect(width).to.be.at.least(100);
    });

    it("pointermove does nothing when _resizing is false", async () => {
        const el = await fixture(html`<y-drawer resizable visible position="left"></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const panel = el.shadowRoot.querySelector(".drawer-panel");
        const widthBefore = panel.style.width;

        // Dispatch pointermove without a preceding pointerdown (so _resizing stays false)
        document.dispatchEvent(
            new PointerEvent("pointermove", { clientX: 200, clientY: 0, bubbles: true })
        );
        await new Promise((r) => setTimeout(r, 0));

        expect(panel.style.width).to.equal(widthBefore);
    });

    it("pointerup clears _resizing and restores panel transition", async () => {
        const el = await fixture(html`<y-drawer resizable visible></y-drawer>`);
        await new Promise((r) => setTimeout(r, 50));

        const handle = el.shadowRoot.querySelector(".resize-handle");
        const panel = el.shadowRoot.querySelector(".drawer-panel");

        handle.dispatchEvent(
            new PointerEvent("pointerdown", { clientX: 300, clientY: 0, bubbles: true })
        );
        expect(el._resizing).to.be.true;
        expect(panel.style.transition).to.equal("none");

        document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));

        expect(el._resizing).to.be.false;
        // Transition is restored to empty string (the CSS class takes over)
        expect(panel.style.transition).to.equal("");
    });
});
