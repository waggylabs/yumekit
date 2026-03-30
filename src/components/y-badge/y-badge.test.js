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
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(badge).to.exist;
        expect(style).to.include("position: static;");
        expect(el.shadowRoot.querySelector("slot")).to.not.exist;
    });

    it("treats a non-empty text node child as target content", async () => {
        // A text node with non-empty trimmed content should make _hasTargetContent return true
        const el = await fixture(html`<y-badge value="5">some text</y-badge>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        // Because _hasTargetContent returns true, the badge should be positioned absolute
        expect(style).to.include("position: absolute");
        // The slot should be rendered since there is target content
        expect(el.shadowRoot.querySelector("slot")).to.exist;
    });

    it("ignores a whitespace-only text node child — renders inline", async () => {
        // A text node whose trimmed content is "" should not count as target content
        const el = await fixture(html`<y-badge value="3">   </y-badge>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("position: static;");
        expect(el.shadowRoot.querySelector("slot")).to.not.exist;
    });

    it("ignores a comment node child — returns false", async () => {
        // Comment nodes are neither ELEMENT_NODE nor TEXT_NODE
        const el = await fixture(html`<y-badge value="7"></y-badge>`);
        // Insert a comment node as the only child
        el.appendChild(document.createComment("just a comment"));
        // Manually re-render so the new child is evaluated
        el.render();

        const style = el.shadowRoot.querySelector("style").textContent;
        // A comment node alone should not be treated as target content
        expect(style).to.include("position: static;");
        expect(el.shadowRoot.querySelector("slot")).to.not.exist;
    });
});
