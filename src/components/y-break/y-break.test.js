import { html, fixture, expect, aTimeout } from "@open-wc/testing";
import "./y-break.js";

describe("YumeBreak", () => {
    // ── Defaults ──────────────────────────────────────────────
    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        const root = el.shadowRoot.querySelector(".break");
        expect(root).to.exist;
        expect(root.classList.contains("align-center")).to.be.true;
    });

    it("applies perpendicular spacing padding so the break separates content out of the box", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        el.style.setProperty("--component-break-spacing", "20px");
        const cs = getComputedStyle(el);
        // Horizontal: padding sits above/below the line, inline padding stays 0.
        expect(cs.paddingTop).to.equal("20px");
        expect(cs.paddingBottom).to.equal("20px");
        expect(cs.paddingLeft).to.equal("0px");
    });

    it("moves the spacing padding to the inline axis when vertical", async () => {
        const el = await fixture(html`<y-break orientation="vertical"></y-break>`);
        el.style.setProperty("--component-break-spacing", "20px");
        const cs = getComputedStyle(el);
        expect(cs.paddingLeft).to.equal("20px");
        expect(cs.paddingRight).to.equal("20px");
        expect(cs.paddingTop).to.equal("0px");
    });

    it("draws the line with the semantic border color", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        el.style.setProperty("--base-border", "rgb(10, 20, 30)");
        el.style.removeProperty("--component-break-line-color");
        const line = el.shadowRoot.querySelector(".line-start");
        // No explicit line-color set → falls back through to --base-border.
        expect(getComputedStyle(line).borderTopColor).to.equal("rgb(10, 20, 30)");
    });

    it("sets role=separator on the host", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        expect(el.getAttribute("role")).to.equal("separator");
    });

    it("does not set aria-orientation when horizontal (default)", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        expect(el.hasAttribute("aria-orientation")).to.be.false;
    });

    it("renders two line segments and a content slot", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        const lineStart = el.shadowRoot.querySelector(".line-start");
        const lineEnd = el.shadowRoot.querySelector(".line-end");
        const slot = el.shadowRoot.querySelector("slot");
        expect(lineStart).to.exist;
        expect(lineEnd).to.exist;
        expect(slot).to.exist;
    });

    it("collapses to a single continuous line when there is no slot/label/icon", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        await aTimeout(0);
        const root = el.shadowRoot.querySelector(".break");
        expect(root.classList.contains("is-empty")).to.be.true;

        // line-start absorbs both insets and line-end is hidden so dashed/
        // dotted variants stay visually unbroken across the divider.
        const lineEnd = el.shadowRoot.querySelector(".line-end");
        expect(getComputedStyle(lineEnd).display).to.equal("none");
    });

    // ── Orientation ───────────────────────────────────────────
    it("sets aria-orientation=vertical when orientation=vertical", async () => {
        const el = await fixture(
            html`<y-break orientation="vertical"></y-break>`,
        );
        expect(el.getAttribute("aria-orientation")).to.equal("vertical");
    });

    it("removes aria-orientation when orientation switches back to horizontal", async () => {
        const el = await fixture(
            html`<y-break orientation="vertical"></y-break>`,
        );
        el.setAttribute("orientation", "horizontal");
        expect(el.hasAttribute("aria-orientation")).to.be.false;
    });

    it("falls back to horizontal for unknown orientation values", async () => {
        const el = await fixture(html`<y-break orientation="diagonal"></y-break>`);
        expect(el.orientation).to.equal("horizontal");
    });

    // ── Align ─────────────────────────────────────────────────
    it("applies align-start class when align=start", async () => {
        const el = await fixture(html`<y-break align="start">x</y-break>`);
        const root = el.shadowRoot.querySelector(".break");
        expect(root.classList.contains("align-start")).to.be.true;
    });

    it("applies align-end class when align=end", async () => {
        const el = await fixture(html`<y-break align="end">x</y-break>`);
        const root = el.shadowRoot.querySelector(".break");
        expect(root.classList.contains("align-end")).to.be.true;
    });

    it("falls back to center for unknown align values", async () => {
        const el = await fixture(html`<y-break align="bogus">x</y-break>`);
        expect(el.align).to.equal("center");
    });

    // ── Variant ───────────────────────────────────────────────
    it("uses solid line style by default", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        const css = el.shadowRoot.adoptedStyleSheets[0].cssRules;
        const hostRule = [...css].find((r) => r.selectorText === ":host");
        expect(hostRule.cssText).to.include("solid");
    });

    it("applies dashed variant", async () => {
        const el = await fixture(html`<y-break variant="dashed"></y-break>`);
        const hostRule = [...el.shadowRoot.adoptedStyleSheets[0].cssRules].find(
            (r) => r.selectorText === ":host",
        );
        expect(hostRule.cssText).to.include("dashed");
    });

    it("applies dotted variant", async () => {
        const el = await fixture(html`<y-break variant="dotted"></y-break>`);
        const hostRule = [...el.shadowRoot.adoptedStyleSheets[0].cssRules].find(
            (r) => r.selectorText === ":host",
        );
        expect(hostRule.cssText).to.include("dotted");
    });

    it("falls back to solid for unknown variant values", async () => {
        const el = await fixture(html`<y-break variant="wavy"></y-break>`);
        expect(el.variant).to.equal("solid");
    });

    // ── Label / Icon attributes ───────────────────────────────
    it("renders label text in the content fallback", async () => {
        const el = await fixture(html`<y-break label="OR"></y-break>`);
        await aTimeout(0);
        const content = el.shadowRoot.querySelector(".content");
        const root = el.shadowRoot.querySelector(".break");
        expect(content.textContent).to.contain("OR");
        expect(root.classList.contains("is-empty")).to.be.false;
    });

    it("renders a y-icon in the content fallback when icon is set", async () => {
        const el = await fixture(html`<y-break icon="star"></y-break>`);
        const yIcon = el.shadowRoot.querySelector("y-icon");
        expect(yIcon).to.exist;
        expect(yIcon.getAttribute("name")).to.equal("star");
    });

    it("renders both icon and label when both are set (icon first)", async () => {
        const el = await fixture(
            html`<y-break icon="star" label="featured"></y-break>`,
        );
        const fallback = el.shadowRoot.querySelector(".fallback");
        expect(fallback).to.exist;
        expect(fallback.firstElementChild.tagName.toLowerCase()).to.equal(
            "y-icon",
        );
        expect(fallback.textContent).to.contain("featured");
    });

    // ── Slotted content takes precedence ──────────────────────
    it("slotted content is exposed and content area is visible", async () => {
        const el = await fixture(
            html`<y-break label="ignored"><span>real</span></y-break>`,
        );
        await aTimeout(0);
        const slot = el.shadowRoot.querySelector("slot");
        const assigned = slot
            .assignedNodes({ flatten: true })
            .filter((n) => n.nodeType === Node.ELEMENT_NODE);
        expect(assigned).to.have.length(1);
        expect(assigned[0].textContent).to.equal("real");

        const root = el.shadowRoot.querySelector(".break");
        expect(root.classList.contains("is-empty")).to.be.false;
    });

    // ── Inset ─────────────────────────────────────────────────
    it("falls back to none for unknown inset values", async () => {
        const el = await fixture(html`<y-break inset="huge"></y-break>`);
        expect(el.inset).to.equal("none");
    });

    it("applies small inset via spacing token", async () => {
        const el = await fixture(html`<y-break inset="small"></y-break>`);
        const hostRule = [...el.shadowRoot.adoptedStyleSheets[0].cssRules].find(
            (r) => r.selectorText === ":host",
        );
        expect(hostRule.cssText).to.include("--spacing-x-small");
    });

    // ── Re-renders on attribute change ────────────────────────
    it("re-renders when align changes", async () => {
        const el = await fixture(html`<y-break align="start">x</y-break>`);
        el.setAttribute("align", "end");
        const root = el.shadowRoot.querySelector(".break");
        expect(root.classList.contains("align-end")).to.be.true;
    });

    it("re-renders when label changes", async () => {
        const el = await fixture(html`<y-break label="A"></y-break>`);
        el.setAttribute("label", "B");
        const content = el.shadowRoot.querySelector(".content");
        expect(content.textContent).to.contain("B");
        expect(content.textContent).to.not.contain("A");
    });

    // ── CSS parts ─────────────────────────────────────────────
    it("exposes line, line-start, line-end and content parts", async () => {
        const el = await fixture(html`<y-break>x</y-break>`);
        expect(el.shadowRoot.querySelector("[part~='line-start']")).to.exist;
        expect(el.shadowRoot.querySelector("[part~='line-end']")).to.exist;
        expect(el.shadowRoot.querySelector("[part='content']")).to.exist;
    });

    // ── Listener hygiene ──────────────────────────────────────
    it("attaches exactly one slotchange listener per render (no leaks across attribute changes)", async () => {
        const el = await fixture(html`<y-break></y-break>`);

        // Force several re-renders.
        el.setAttribute("variant", "dashed");
        el.setAttribute("align", "start");
        el.setAttribute("label", "A");
        el.removeAttribute("label");
        await aTimeout(0);

        const slot = el.shadowRoot.querySelector("slot");
        let calls = 0;
        const original = el._updateContentVisibility.bind(el);
        el._updateContentVisibility = () => {
            calls += 1;
            original();
        };

        // A slotchange fires once when light-DOM children are added.
        const child = document.createElement("span");
        child.textContent = "x";
        el.appendChild(child);
        await aTimeout(0);

        expect(calls).to.equal(1);
    });

    // ── Property setters ──────────────────────────────────────
    it("orientation setter syncs the attribute", async () => {
        const el = await fixture(html`<y-break></y-break>`);
        el.orientation = "vertical";
        expect(el.getAttribute("orientation")).to.equal("vertical");
        expect(el.getAttribute("aria-orientation")).to.equal("vertical");
    });

    it("label setter clears the attribute when set to empty", async () => {
        const el = await fixture(html`<y-break label="hi"></y-break>`);
        el.label = "";
        expect(el.hasAttribute("label")).to.be.false;
    });

    it("icon setter clears the attribute when set to empty", async () => {
        const el = await fixture(html`<y-break icon="star"></y-break>`);
        el.icon = "";
        expect(el.hasAttribute("icon")).to.be.false;
    });
});
