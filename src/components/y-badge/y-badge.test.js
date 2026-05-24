import { html, fixture, expect } from "@open-wc/testing";
import "./y-badge.js"; // adjust path as needed

/** Read concatenated CSS text from a shadowRoot's adoptedStyleSheets. */
function getStyleText(el) {
    return el.shadowRoot.adoptedStyleSheets
        .flatMap((sheet) => [...sheet.cssRules].map((r) => r.cssText))
        .join(" ");
}

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
        const style = getStyleText(el);

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
        const style = getStyleText(el);
        expect(style).to.include("background: var(--success");
    });

    it("uses custom color if custom color is provided", async () => {
        const el = await fixture(
            html`<y-badge value="!" color="#ff00ff"
                ><div>Target</div></y-badge
            >`,
        );
        const style = getStyleText(el);
        // Browser may serialize #ff00ff as rgb(255, 0, 255) when read from
        // CSSStyleSheet rules.
        expect(style).to.match(
            /background:\s*(#ff00ff|rgb\(\s*255,\s*0,\s*255\s*\))/,
        );
    });

    it("adjusts size correctly for small", async () => {
        const el = await fixture(
            html`<y-badge value="1" size="small"><div>Size</div></y-badge>`,
        );
        const style = getStyleText(el);
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

    describe("XSS hardening", () => {
        it("renders value as text, not HTML", async () => {
            const hostile = `<img src=x onerror="window.__xssBadgeValue=true">`;
            const el = await fixture(
                html`<y-badge value=${hostile}></y-badge>`,
            );

            const badge = el.shadowRoot.querySelector(".badge");
            expect(badge).to.exist;
            expect(badge.querySelector("img")).to.be.null;
            expect(badge.textContent).to.equal(hostile);
            expect(window.__xssBadgeValue).to.be.undefined;
        });

        it("falls back to the primary theme for an unsafe custom color (CSS-context escape)", async () => {
            // A hostile color that tries to escape the <style> context. Since
            // the badge no longer uses an inline <style> block this would be
            // moot, but we still validate the input to keep CSS clean and
            // preempt regressions.
            const hostile = `red; }</style><script>window.__xssBadgeColor=true</script><x x="`;
            const el = await fixture(
                html`<y-badge value="!" color=${hostile}></y-badge>`,
            );

            const style = getStyleText(el);
            // No </style> sequence in the resolved rules
            expect(style).to.not.include("</style>");
            expect(style).to.not.include("<script>");
            // Falls back to the primary theme variable
            expect(style).to.include("--primary-content");
            expect(window.__xssBadgeColor).to.be.undefined;
        });

        it("accepts a safe hex color but rejects a hostile one wrapped in #", async () => {
            const el = await fixture(
                html`<y-badge value="!" color="#ff00ff"></y-badge>`,
            );
            const safeStyle = getStyleText(el);
            expect(safeStyle).to.match(
                /background:\s*(#ff00ff|rgb\(\s*255,\s*0,\s*255\s*\))/,
            );

            // Now a hostile string that starts with `#` but is not a valid hex
            const hostile = `#ff00ff; background-image: url(javascript:alert(1));//`;
            el.setAttribute("color", hostile);
            await new Promise((r) => setTimeout(r, 0));

            const hostileStyle = getStyleText(el);
            expect(hostileStyle).to.not.include("javascript:");
            // Falls back to the primary theme variable
            expect(hostileStyle).to.include("--primary-content");
        });
    });
});
