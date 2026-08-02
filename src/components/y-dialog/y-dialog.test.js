import sinon from "sinon";
import { fixture, html, expect } from "@open-wc/testing";
import "./y-dialog.js";

describe("YumeDialog", () => {
    it("is hidden by default", async () => {
        const el = await fixture(html`
            <y-dialog>
                <div slot="header">Header</div>
                <div slot="body">Body</div>
                <div slot="footer">Footer</div>
            </y-dialog>
        `);
        expect(el.hasAttribute("visible")).to.be.false;
        expect(getComputedStyle(el).display).to.equal("none");
    });

    it("shows when visible attribute is set", async () => {
        const el = await fixture(html`<y-dialog visible></y-dialog>`);
        expect(el.hasAttribute("visible")).to.be.true;
        expect(getComputedStyle(el).display).to.equal("flex");
    });

    it("toggles visibility when anchor element is clicked", async () => {
        const container = await fixture(html`
            <div>
                <button id="toggle-btn">Toggle</button>
                <y-dialog anchor="toggle-btn">
                    <div slot="header">H</div>
                    <div slot="body">B</div>
                    <div slot="footer">F</div>
                </y-dialog>
            </div>
        `);
        const btn = container.querySelector("#toggle-btn");
        const dialog = container.querySelector("y-dialog");
        expect(dialog.hasAttribute("visible")).to.be.false;
        btn.click();
        expect(dialog.hasAttribute("visible")).to.be.true;
        btn.click();
        expect(dialog.hasAttribute("visible")).to.be.false;
    });

    it("closes on Escape key when open", async () => {
        const el = await fixture(html`<y-dialog visible></y-dialog>`);
        expect(el.hasAttribute("visible")).to.be.true;
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        expect(el.hasAttribute("visible")).to.be.false;
    });

    it("fires open when it becomes visible and close when it hides", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        const events = [];
        el.addEventListener("open", (e) => events.push(e.type));
        el.addEventListener("close", (e) => events.push(e.type));

        el.visible = true;
        el.visible = false;

        expect(events.join(",")).to.equal("open,close");
    });

    it("fires close when Escape dismisses the dialog", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        el.visible = true;
        const events = [];
        el.addEventListener("close", (e) => events.push(e.type));

        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );

        expect(events.length).to.equal(1);
    });

    it("fires close when the close button dismisses the dialog", async () => {
        const el = await fixture(html`<y-dialog closable visible></y-dialog>`);
        const events = [];
        el.addEventListener("close", (e) => events.push(e.type));

        el.shadowRoot.querySelector("y-button").click();

        expect(events.length).to.equal(1);
        expect(el.hasAttribute("visible")).to.be.false;
    });

    it("does not fire open when it mounts already visible", async () => {
        const events = [];
        const onOpen = (e) => events.push(e.type);
        document.addEventListener("open", onOpen);
        await fixture(html`<y-dialog visible></y-dialog>`);
        document.removeEventListener("open", onOpen);

        expect(events.length).to.equal(0);
    });

    it("does not fire a duplicate open when already open", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        el.visible = true;
        const events = [];
        el.addEventListener("open", (e) => events.push(e.type));

        el.show();
        el.visible = true;

        expect(events.length).to.equal(0);
    });

    it("open and close bubble and cross the shadow boundary", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        const events = [];
        const onOpen = (e) => events.push(e);
        document.addEventListener("open", onOpen);

        el.visible = true;
        document.removeEventListener("open", onOpen);

        expect(events.length).to.equal(1);
        expect(events[0].composed).to.be.true;
    });

    it("focuses the dialog element on show", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        const dialogEl = el.shadowRoot.querySelector(".dialog");
        const focusSpy = sinon.spy(dialogEl, "focus");
        el.visible = true;
        expect(focusSpy.calledOnce).to.be.true;
    });

    it("renders header, body, and footer slots correctly", async () => {
        const el = await fixture(html`
            <y-dialog visible>
                <div slot="header">My Header</div>
                <p slot="body">My Body</p>
                <span slot="footer">My Footer</span>
            </y-dialog>
        `);
        const headerSlot = el.shadowRoot.querySelector('slot[name="header"]');
        const bodySlot = el.shadowRoot.querySelector('slot[name="body"]');
        const footerSlot = el.shadowRoot.querySelector('slot[name="footer"]');
        const assignedHeader = headerSlot
            .assignedNodes()
            .find((n) => n.textContent.includes("My Header"));
        const assignedBody = bodySlot
            .assignedNodes()
            .find((n) => n.textContent.includes("My Body"));
        const assignedFooter = footerSlot
            .assignedNodes()
            .find((n) => n.textContent.includes("My Footer"));
        expect(assignedHeader).to.exist;
        expect(assignedBody).to.exist;
        expect(assignedFooter).to.exist;
    });

    it("supports show-backdrop attribute", async () => {
        const el = await fixture(
            html`<y-dialog visible show-backdrop></y-dialog>`,
        );
        expect(el.showBackdrop).to.be.true;
        expect(el.hasAttribute("show-backdrop")).to.be.true;
        el.showBackdrop = false;
        expect(el.hasAttribute("show-backdrop")).to.be.false;
    });

    it("supports animate attribute", async () => {
        const el = await fixture(html`<y-dialog visible animate></y-dialog>`);
        expect(el.animate).to.be.true;
        expect(el.hasAttribute("animate")).to.be.true;
        el.animate = false;
        expect(el.hasAttribute("animate")).to.be.false;
    });

    it("without show-backdrop, the host is pointer-events:none so background is interactive", async () => {
        const el = await fixture(html`<y-dialog visible></y-dialog>`);
        expect(getComputedStyle(el).pointerEvents).to.equal("none");
    });

    it("with show-backdrop, the host is pointer-events:auto so it blocks background", async () => {
        const el = await fixture(html`<y-dialog visible show-backdrop></y-dialog>`);
        expect(getComputedStyle(el).pointerEvents).to.equal("auto");
    });

    it("defaults position to center", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        expect(el.position).to.equal("center");
    });

    it("position getter/setter round-trips", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        el.position = "bottom-right";
        expect(el.position).to.equal("bottom-right");
        expect(el.getAttribute("position")).to.equal("bottom-right");
    });

    it("position attribute applies correct alignment (top-left)", async () => {
        const el = await fixture(html`<y-dialog visible position="top-left"></y-dialog>`);
        const styles = getComputedStyle(el);
        expect(styles.alignItems).to.equal("flex-start");
        expect(styles.justifyContent).to.equal("flex-start");
    });

    it("position attribute applies correct alignment (bottom-right)", async () => {
        const el = await fixture(html`<y-dialog visible position="bottom-right"></y-dialog>`);
        const styles = getComputedStyle(el);
        expect(styles.alignItems).to.equal("flex-end");
        expect(styles.justifyContent).to.equal("flex-end");
    });

    it("position attribute applies correct alignment (top-center)", async () => {
        const el = await fixture(html`<y-dialog visible position="top-center"></y-dialog>`);
        const styles = getComputedStyle(el);
        expect(styles.alignItems).to.equal("flex-start");
        expect(styles.justifyContent).to.equal("center");
    });

    it("closable setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        el.closable = true;
        expect(el.hasAttribute("closable")).to.be.true;
        el.closable = false;
        expect(el.hasAttribute("closable")).to.be.false;
    });

    it("visible setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        el.visible = true;
        expect(el.hasAttribute("visible")).to.be.true;
        el.visible = false;
        expect(el.hasAttribute("visible")).to.be.false;
    });

    it("renders a close button in the header when closable is set", async () => {
        const el = await fixture(html`<y-dialog closable></y-dialog>`);
        const closeBtn = el.shadowRoot.querySelector("y-button");
        expect(closeBtn).to.exist;
        expect(closeBtn.getAttribute("aria-label")).to.equal("Close");
    });

    it("close button hides the dialog when clicked", async () => {
        const el = await fixture(html`<y-dialog visible closable></y-dialog>`);
        expect(el.visible).to.be.true;
        const closeBtn = el.shadowRoot.querySelector("y-button");
        closeBtn.click();
        expect(el.visible).to.be.false;
    });

    it("does not render a close button when closable is not set", async () => {
        const el = await fixture(html`<y-dialog></y-dialog>`);
        const closeBtn = el.shadowRoot.querySelector("y-button");
        expect(closeBtn).to.not.exist;
    });

    it("re-uses existing anchor listener when anchor attribute is changed", async () => {
        const container = await fixture(html`
            <div>
                <button id="btn-a">A</button>
                <button id="btn-b">B</button>
                <y-dialog anchor="btn-a"></y-dialog>
            </div>
        `);
        const dialog = container.querySelector("y-dialog");
        // Change to a different anchor — triggers _setupAnchor cleanup branch
        dialog.setAttribute("anchor", "btn-b");
        const btnB = container.querySelector("#btn-b");
        btnB.click();
        expect(dialog.hasAttribute("visible")).to.be.true;
    });
});
