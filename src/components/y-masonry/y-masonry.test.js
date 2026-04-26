import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-masonry.js";

describe("YumeMasonry", () => {
    // -------------------------------------------------------------------------
    // Defaults
    // -------------------------------------------------------------------------

    it("renders a slot inside a container div", async () => {
        const el = await fixture(html`<y-masonry></y-masonry>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(container).to.exist;
        expect(container.getAttribute("part")).to.equal("container");
        expect(container.querySelector("slot")).to.exist;
    });

    it("defaults columns to 3", async () => {
        const el = await fixture(html`<y-masonry></y-masonry>`);
        expect(el.columns).to.equal(3);
    });

    it("defaults gap to medium", async () => {
        const el = await fixture(html`<y-masonry></y-masonry>`);
        expect(el.gap).to.equal("medium");
    });

    it("defaults responsive to true", async () => {
        const el = await fixture(html`<y-masonry></y-masonry>`);
        expect(el.responsive).to.be.true;
    });

    it("defaults minItemWidth to 240px", async () => {
        const el = await fixture(html`<y-masonry></y-masonry>`);
        expect(el.minItemWidth).to.equal("240px");
    });

    it("renders as display: block", async () => {
        const el = await fixture(html`<y-masonry></y-masonry>`);
        expect(getComputedStyle(el).display).to.equal("block");
    });

    it("does not apply background, border, or padding", async () => {
        const el = await fixture(html`<y-masonry><div>A</div></y-masonry>`);
        const styles = getComputedStyle(el);
        expect(styles.backgroundColor).to.be.oneOf([
            "rgba(0, 0, 0, 0)",
            "transparent",
        ]);
        expect(styles.borderStyle).to.be.oneOf(["none", ""]);
        expect(styles.padding).to.be.oneOf(["0px", ""]);
    });

    // -------------------------------------------------------------------------
    // Attribute reflection
    // -------------------------------------------------------------------------

    it("reflects columns via getter and setter", async () => {
        const el = await fixture(html`<y-masonry columns="4"></y-masonry>`);
        expect(el.columns).to.equal(4);
        el.columns = 6;
        expect(el.getAttribute("columns")).to.equal("6");
    });

    it("reflects gap via getter and setter", async () => {
        const el = await fixture(html`<y-masonry gap="large"></y-masonry>`);
        expect(el.gap).to.equal("large");
        el.gap = "x-large";
        expect(el.getAttribute("gap")).to.equal("x-large");
    });

    it("reflects rowGap and columnGap via getter and setter", async () => {
        const el = await fixture(
            html`<y-masonry row-gap="small" column-gap="large"></y-masonry>`,
        );
        expect(el.rowGap).to.equal("small");
        expect(el.columnGap).to.equal("large");
    });

    it("reflects responsive via getter and setter", async () => {
        const el = await fixture(
            html`<y-masonry responsive="false"></y-masonry>`,
        );
        expect(el.responsive).to.be.false;
        el.responsive = true;
        expect(el.hasAttribute("responsive")).to.be.false;
        expect(el.responsive).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Layout
    // -------------------------------------------------------------------------

    it("applies relative position to the container", async () => {
        const el = await fixture(
            html`<y-masonry><div>A</div><div>B</div></y-masonry>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).position).to.equal("relative");
    });

    it("applies absolute positioning to children", async () => {
        const el = await fixture(html`
            <y-masonry columns="2" responsive="false" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-masonry>
        `);
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        const items = el.querySelectorAll("div");
        expect(items[0].style.position).to.equal("absolute");
        expect(items[1].style.position).to.equal("absolute");
    });

    it("packs into the shortest column", async () => {
        const el = await fixture(html`
            <y-masonry columns="2" gap="none" responsive="false" style="width:400px">
                <div style="height:200px">A</div>
                <div style="height:50px">B</div>
                <div style="height:50px">C</div>
            </y-masonry>
        `);
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        const items = el.querySelectorAll("div");
        // A: col 0, y=0, height 200. B: col 1 (shortest), y=0. C: col 1
        // (still shortest at 50 vs 200), y=50.
        expect(items[0].style.left).to.equal("0px");
        expect(items[1].style.left).to.equal("200px");
        expect(items[2].style.left).to.equal("200px");
        expect(items[2].style.top).to.equal("50px");
    });

    it("honors row-gap when packing items into the same column", async () => {
        const el = await fixture(html`
            <y-masonry columns="2" gap="none" row-gap="4x-large" responsive="false" style="width:400px">
                <div style="height:50px">A</div>
                <div style="height:50px">B</div>
                <div style="height:50px">C</div>
            </y-masonry>
        `);
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        const items = el.querySelectorAll("div");
        // Item C stacks under item A (col 0), separated by row-gap
        // (4x-large = 32px). gap=none so the bug would put it at y=50.
        expect(items[2].style.top).to.equal("82px");
    });

    it("honors column-gap for horizontal placement", async () => {
        const el = await fixture(html`
            <y-masonry columns="2" gap="none" column-gap="4x-large" responsive="false" style="width:432px">
                <div style="height:50px">A</div>
                <div style="height:50px">B</div>
            </y-masonry>
        `);
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        const items = el.querySelectorAll("div");
        // 432 - 32 col-gap = 400 / 2 = 200 each. B at left = 200 + 32 = 232.
        expect(items[0].style.left).to.equal("0px");
        expect(items[1].style.left).to.equal("232px");
        expect(items[1].style.width).to.equal("200px");
    });

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    it("emits y-masonry-layout after a settle", async () => {
        const el = await fixture(html`
            <y-masonry columns="2" responsive="false" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-masonry>
        `);
        const event = await oneEvent(el, "y-masonry-layout");
        expect(event.detail.columns).to.equal(2);
        expect(event.detail.containerWidth).to.equal(400);
    });

    it("emits y-masonry-layout exactly once on initial connect", async () => {
        const events = [];
        const handler = (e) => events.push(e);
        document.addEventListener("y-masonry-layout", handler);
        try {
            await fixture(html`
                <y-masonry columns="2" responsive="false" style="width:400px">
                    <div style="height:100px">A</div>
                    <div style="height:100px">B</div>
                </y-masonry>
            `);
            await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
            );
            expect(events.length).to.equal(1);
        } finally {
            document.removeEventListener("y-masonry-layout", handler);
        }
    });

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    it("exposes a relayout() method that triggers a layout pass", async () => {
        const el = await fixture(html`
            <y-masonry columns="2" responsive="false" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-masonry>
        `);
        await oneEvent(el, "y-masonry-layout");

        const child = el.querySelector("div");
        // Force a height change RO won't notice synchronously, then relayout.
        child.style.height = "200px";
        const promise = oneEvent(el, "y-masonry-layout");
        el.relayout();
        const event = await promise;
        expect(event.detail.columns).to.equal(2);
    });
});
