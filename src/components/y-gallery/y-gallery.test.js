import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-gallery.js";

describe("YumeGallery", () => {
    // ── Defaults ──────────────────────────────────────────────

    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const gallery = el.shadowRoot.querySelector(".gallery");
        expect(gallery).to.exist;
        expect(gallery.getAttribute("part")).to.equal("gallery");
        expect(gallery.getAttribute("role")).to.equal("list");
    });

    it("renders a default slot", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const slot = el.shadowRoot.querySelector("slot:not([name])");
        expect(slot).to.exist;
    });

    it("defaults to grid layout", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.layout).to.equal("grid");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("grid-template-columns");
    });

    it("defaults to 3 columns", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.columns).to.equal(3);
    });

    it("defaults to medium gap", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.gap).to.equal("medium");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-gallery-gap-medium");
    });

    it("defaults to 1/1 aspect ratio", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.aspectRatio).to.equal("1/1");
    });

    it("defaults to expandable", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.expandable).to.be.true;
    });

    it("defaults to no loop", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.loop).to.be.false;
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.size).to.equal("medium");
    });

    // ── Layout modes ──────────────────────────────────────────

    it("applies grid layout", async () => {
        const el = await fixture(html`<y-gallery layout="grid">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("grid-template-columns");
    });

    it("applies masonry layout", async () => {
        const el = await fixture(html`<y-gallery layout="masonry">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("break-inside: avoid");
    });

    it("applies row layout", async () => {
        const el = await fixture(html`<y-gallery layout="row">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("flex-direction: row");
        expect(style).to.include("overflow-x: auto");
    });

    it("applies column layout", async () => {
        const el = await fixture(html`<y-gallery layout="column">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("flex-direction: column");
    });

    // ── Gap ───────────────────────────────────────────────────

    it("applies small gap", async () => {
        const el = await fixture(html`<y-gallery gap="small">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-gallery-gap-small");
    });

    it("applies large gap", async () => {
        const el = await fixture(html`<y-gallery gap="large">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-gallery-gap-large");
    });

    it("passes through custom CSS length for gap", async () => {
        const el = await fixture(html`<y-gallery gap="20px">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("20px");
    });

    // ── Item indexing ─────────────────────────────────────────

    it("indexes img children as items", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const items = el.shadowRoot.querySelectorAll(".item");
        expect(items.length).to.equal(2);
    });

    it("indexes figure children as items", async () => {
        const el = await fixture(html`<y-gallery>
            <figure><img src="a.jpg" alt="A"><figcaption>Caption</figcaption></figure>
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const items = el.shadowRoot.querySelectorAll(".item");
        expect(items.length).to.equal(1);
    });

    it("creates item wrappers with part attribute", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const item = el.shadowRoot.querySelector(".item");
        expect(item.getAttribute("part")).to.equal("item");
    });

    it("creates images with item-img part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const img = el.shadowRoot.querySelector("[part='item-img']");
        expect(img).to.exist;
    });

    // ── Expandable ────────────────────────────────────────────

    it("makes items clickable when expandable", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const item = el.shadowRoot.querySelector(".item");
        expect(item.getAttribute("tabindex")).to.equal("0");
        expect(item.getAttribute("role")).to.equal("button");
    });

    it("does not make items interactive when expandable=false", async () => {
        const el = await fixture(html`<y-gallery expandable="false">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const item = el.shadowRoot.querySelector(".item");
        expect(item.hasAttribute("tabindex")).to.be.false;
    });

    // ── Expand event ──────────────────────────────────────────

    it("fires expand event when thumbnail is clicked", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" data-src="full-a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const item = el.shadowRoot.querySelector(".item");
        setTimeout(() => item.click());

        const event = await oneEvent(el, "expand");
        expect(event).to.exist;
        expect(event.detail.index).to.equal(0);
        expect(event.detail.src).to.equal("full-a.jpg");
        expect(event.cancelable).to.be.true;
    });

    it("opens expanded view on thumbnail click", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const overlay = el.shadowRoot.querySelector(".expand-overlay");
        expect(overlay).to.exist;
        expect(overlay.getAttribute("role")).to.equal("dialog");
        expect(overlay.getAttribute("aria-modal")).to.equal("true");
    });

    it("does not open expanded view when expand event is cancelled", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.addEventListener("expand", (e) => e.preventDefault());
        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const overlay = el.shadowRoot.querySelector(".expand-overlay");
        expect(overlay).to.not.exist;
    });

    // ── Expanded view ─────────────────────────────────────────

    it("shows full-size image from data-src", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="thumb.jpg" data-src="full.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const img = el.shadowRoot.querySelector(".expand-img");
        expect(img.getAttribute("src")).to.equal("full.jpg");
    });

    it("falls back to src when data-src is absent", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="thumb.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const img = el.shadowRoot.querySelector(".expand-img");
        expect(img.getAttribute("src")).to.equal("thumb.jpg");
    });

    it("shows counter in expanded view", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const counter = el.shadowRoot.querySelector(".expand-counter");
        expect(counter.textContent).to.equal("1 / 2");
    });

    it("shows caption from figcaption", async () => {
        const el = await fixture(html`<y-gallery>
            <figure><img src="a.jpg" alt="A"><figcaption>My caption</figcaption></figure>
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const caption = el.shadowRoot.querySelector(".expand-caption");
        expect(caption).to.exist;
        expect(caption.textContent).to.equal("My caption");
    });

    it("shows alt as caption when no figcaption", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="Mountain vista">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const caption = el.shadowRoot.querySelector(".expand-caption");
        expect(caption).to.exist;
        expect(caption.textContent).to.equal("Mountain vista");
    });

    // ── Navigation ────────────────────────────────────────────

    it("next() advances to next image", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.next());
        const event = await oneEvent(el, "navigate");
        expect(event.detail.index).to.equal(1);
        expect(event.detail.previousIndex).to.equal(0);
        expect(event.detail.direction).to.equal("next");
    });

    it("previous() goes to previous image", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(1);
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.previous());
        const event = await oneEvent(el, "navigate");
        expect(event.detail.index).to.equal(0);
        expect(event.detail.previousIndex).to.equal(1);
        expect(event.detail.direction).to.equal("prev");
    });

    it("does not navigate past last without loop", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(1);
        await new Promise((r) => setTimeout(r, 0));

        let navigated = false;
        el.addEventListener("navigate", () => { navigated = true; });
        el.next();
        await new Promise((r) => setTimeout(r, 50));
        expect(navigated).to.be.false;
    });

    it("does not navigate before first without loop", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        let navigated = false;
        el.addEventListener("navigate", () => { navigated = true; });
        el.previous();
        await new Promise((r) => setTimeout(r, 50));
        expect(navigated).to.be.false;
    });

    it("wraps around with loop attribute", async () => {
        const el = await fixture(html`<y-gallery loop>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(1);
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.next());
        const event = await oneEvent(el, "navigate");
        expect(event.detail.index).to.equal(0);
    });

    it("wraps backwards with loop attribute", async () => {
        const el = await fixture(html`<y-gallery loop>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.previous());
        const event = await oneEvent(el, "navigate");
        expect(event.detail.index).to.equal(1);
    });

    // ── Close ─────────────────────────────────────────────────

    it("close() removes expanded view and fires event", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        setTimeout(() => el.close());
        const event = await oneEvent(el, "close");
        expect(event).to.exist;
        expect(event.detail.index).to.equal(0);

        const overlay = el.shadowRoot.querySelector(".expand-overlay");
        expect(overlay).to.not.exist;
    });

    // ── Accessibility ─────────────────────────────────────────

    it("gallery container has role=list", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const gallery = el.shadowRoot.querySelector(".gallery");
        expect(gallery.getAttribute("role")).to.equal("list");
    });

    it("items have role=listitem", async () => {
        const el = await fixture(html`<y-gallery expandable="false">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const item = el.shadowRoot.querySelector(".item");
        expect(item.getAttribute("role")).to.equal("listitem");
    });

    it("expandable items have aria-label with alt text", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="Mountain vista">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        const item = el.shadowRoot.querySelector(".item");
        expect(item.getAttribute("aria-label")).to.equal("View image: Mountain vista");
    });

    it("expanded view has dialog role with aria-modal", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const overlay = el.shadowRoot.querySelector(".expand-overlay");
        expect(overlay.getAttribute("role")).to.equal("dialog");
        expect(overlay.getAttribute("aria-modal")).to.equal("true");
        expect(overlay.getAttribute("aria-label")).to.equal("Image viewer");
    });

    it("expanded image has aria-current", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const img = el.shadowRoot.querySelector(".expand-img");
        expect(img.getAttribute("aria-current")).to.equal("true");
    });

    it("prev/next buttons have aria-label", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const prev = el.shadowRoot.querySelector(".expand-prev");
        const next = el.shadowRoot.querySelector(".expand-next");
        expect(prev.getAttribute("aria-label")).to.equal("Previous image");
        expect(next.getAttribute("aria-label")).to.equal("Next image");
    });

    it("prev button is disabled at index 0 without loop", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const prev = el.shadowRoot.querySelector(".expand-prev");
        expect(prev.disabled).to.be.true;
    });

    it("next button is disabled at last index without loop", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
            <img src="b.jpg" alt="B">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(1);
        await new Promise((r) => setTimeout(r, 0));

        const next = el.shadowRoot.querySelector(".expand-next");
        expect(next.disabled).to.be.true;
    });

    it("close button has aria-label", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const close = el.shadowRoot.querySelector(".expand-close");
        expect(close.getAttribute("aria-label")).to.equal("Close image viewer");
    });

    // ── CSS parts ─────────────────────────────────────────────

    it("exposes gallery part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        expect(el.shadowRoot.querySelector("[part='gallery']")).to.exist;
    });

    it("exposes item part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("[part='item']")).to.exist;
    });

    it("exposes expand-overlay part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("[part='expand-overlay']")).to.exist;
    });

    it("exposes expand-img part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("[part='expand-img']")).to.exist;
    });

    it("exposes expand-prev and expand-next parts", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("[part='expand-prev']")).to.exist;
        expect(el.shadowRoot.querySelector("[part='expand-next']")).to.exist;
    });

    it("exposes expand-close part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("[part='expand-close']")).to.exist;
    });

    it("exposes expand-counter part", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("[part='expand-counter']")).to.exist;
    });

    // ── Slots ─────────────────────────────────────────────────

    it("has expand-prev-icon slot", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const slot = el.shadowRoot.querySelector("slot[name='expand-prev-icon']");
        expect(slot).to.exist;
    });

    it("has expand-next-icon slot", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const slot = el.shadowRoot.querySelector("slot[name='expand-next-icon']");
        expect(slot).to.exist;
    });

    it("has expand-close-icon slot", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        await new Promise((r) => setTimeout(r, 0));

        el.open(0);
        await new Promise((r) => setTimeout(r, 0));

        const slot = el.shadowRoot.querySelector("slot[name='expand-close-icon']");
        expect(slot).to.exist;
    });

    // ── Property setters ──────────────────────────────────────

    it("layout setter updates the attribute", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.layout = "masonry";
        expect(el.getAttribute("layout")).to.equal("masonry");
    });

    it("columns setter updates the attribute", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.columns = 4;
        expect(el.getAttribute("columns")).to.equal("4");
    });

    it("gap setter updates the attribute", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.gap = "large";
        expect(el.getAttribute("gap")).to.equal("large");
    });

    it("loop setter toggles the attribute", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.loop = true;
        expect(el.hasAttribute("loop")).to.be.true;

        el.loop = false;
        expect(el.hasAttribute("loop")).to.be.false;
    });

    it("size setter updates the attribute", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    // ── Attribute changes ─────────────────────────────────────

    it("re-renders when layout changes", async () => {
        const el = await fixture(html`<y-gallery layout="grid">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.setAttribute("layout", "masonry");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("break-inside: avoid");
    });

    it("re-renders when columns changes", async () => {
        const el = await fixture(html`<y-gallery columns="3">
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        el.setAttribute("columns", "5");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("5");
    });

    // ── Host display ──────────────────────────────────────────

    it("sets host display to block", async () => {
        const el = await fixture(html`<y-gallery>
            <img src="a.jpg" alt="A">
        </y-gallery>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: block");
    });
});
