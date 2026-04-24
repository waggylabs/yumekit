import { html, fixture, expect } from "@open-wc/testing";
import "./y-badge.js"; // adjust path as needed

describe("YumeBadge", () => {
    it("renders with default attributes", async () => {
        const el = await fixture(
            html`<y-badge value="5"><div>Item</div></y-badge>`,
        );
        const badge = el.shadowRoot.querySelector(".badge");

        expect(badge).to.exist;
        expect(badge.textContent.trim()).to.equal("5");

        const computed = getComputedStyle(badge);
        expect(computed.position).to.equal("absolute");

        expect(el.shadowRoot.querySelector("slot")).to.exist;
    });

    it("applies custom position and alignment", async () => {
        const el = await fixture(
            html`<y-badge value="1" position="bottom" alignment="left"
                ><div>Box</div></y-badge
            >`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include(
            "bottom: calc(var(--spacing-small, 6px) * -1);",
        );
        expect(style).to.include("left: calc(var(--spacing-small, 6px) * -1);");
    });

    it("applies color from colorMap", async () => {
        const el = await fixture(
            html`<y-badge value="!" color="success"
                ><div>Target</div></y-badge
            >`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("background: var(--success");
    });

    it("uses custom color if custom color is provided", async () => {
        const el = await fixture(
            html`<y-badge value="!" color="#ff00ff"
                ><div>Target</div></y-badge
            >`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("background: #ff00ff");
    });

    it("adjusts size correctly for small", async () => {
        const el = await fixture(
            html`<y-badge value="1" size="small"><div>Size</div></y-badge>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include(
            "min-width: var(--component-badge-size-small)",
        );
    });

    it("updates when attribute changes", async () => {
        const el = await fixture(html`<y-badge value="7"></y-badge>`);
        el.setAttribute("value", "99");
        await el.updateComplete?.(); // optional for Lit-based rerendering
        const badge = el.shadowRoot.querySelector(".badge");
        expect(badge.textContent.trim()).to.equal("99");
    });

    it("renders inline when no slotted target content exists", async () => {
        const el = await fixture(html`<y-badge value="AU"></y-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        const slot = el.shadowRoot.querySelector("slot");

        expect(badge).to.exist;
        expect(slot).to.exist;
        expect(slot.assignedNodes({ flatten: true })).to.have.lengthOf(0);
        expect(getComputedStyle(badge).position).to.equal("static");
    });

    it("renders overlay mode when an element child is present", async () => {
        const el = await fixture(
            html`<y-badge value="5"><span>Target</span></y-badge>`,
        );
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).position).to.equal("absolute");
    });

    it("renders inline for a whitespace-only text node child", async () => {
        const el = await fixture(html`<y-badge value="3">   </y-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).position).to.equal("static");
    });

    it("renders inline when only comment nodes are present", async () => {
        const el = await fixture(html`<y-badge value="7"></y-badge>`);
        el.appendChild(document.createComment("just a comment"));
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).position).to.equal("static");
    });

    it("switches to overlay mode when an element child is added after mount", async () => {
        const el = await fixture(html`<y-badge value="9"></y-badge>`);
        const badge = el.shadowRoot.querySelector(".badge");
        expect(getComputedStyle(badge).position).to.equal("static");

        el.appendChild(document.createElement("span"));
        // slotchange fires asynchronously after slot assignment settles
        await new Promise((r) => setTimeout(r, 0));
        expect(getComputedStyle(badge).position).to.equal("absolute");
    });
});
