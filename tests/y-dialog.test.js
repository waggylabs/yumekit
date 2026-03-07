import sinon from "sinon";
import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/y-dialog.js";

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
});
