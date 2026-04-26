import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-grid.js";

describe("YumeGrid", () => {
    // -------------------------------------------------------------------------
    // Defaults
    // -------------------------------------------------------------------------

    it("renders a slot inside a container div", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(container).to.exist;
        expect(container.getAttribute("part")).to.equal("container");
        expect(container.querySelector("slot")).to.exist;
    });

    it("defaults to grid mode", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.mode).to.equal("grid");
    });

    it("defaults columns to 3", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.columns).to.equal("3");
    });

    it("defaults gap to medium", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.gap).to.equal("medium");
    });

    it("defaults align to stretch", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.align).to.equal("stretch");
    });

    it("defaults justify to stretch", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.justify).to.equal("stretch");
    });

    it("defaults justifyContent to start", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.justifyContent).to.equal("start");
    });

    it("defaults responsive to true", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.responsive).to.be.true;
    });

    it("defaults autoFlow to row", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.autoFlow).to.equal("row");
    });

    it("defaults dense to false", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.dense).to.be.false;
    });

    it("defaults minItemWidth to 240px", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(el.minItemWidth).to.equal("240px");
    });

    // -------------------------------------------------------------------------
    // Attribute reflection
    // -------------------------------------------------------------------------

    it("reflects mode via getter and setter", async () => {
        const el = await fixture(html`<y-grid mode="masonry"></y-grid>`);
        expect(el.mode).to.equal("masonry");
        el.mode = "grid";
        expect(el.getAttribute("mode")).to.equal("grid");
    });

    it("reflects columns via getter and setter", async () => {
        const el = await fixture(html`<y-grid columns="4"></y-grid>`);
        expect(el.columns).to.equal("4");
        el.columns = 6;
        expect(el.getAttribute("columns")).to.equal("6");
    });

    it("accepts a raw template string for columns", async () => {
        const el = await fixture(html`<y-grid columns="1fr 2fr auto" responsive="false"></y-grid>`);
        expect(el.columns).to.equal("1fr 2fr auto");
    });

    it("reflects rows via getter and setter", async () => {
        const el = await fixture(html`<y-grid rows="2"></y-grid>`);
        expect(el.rows).to.equal("2");
    });

    it("reflects gap via getter and setter", async () => {
        const el = await fixture(html`<y-grid gap="large"></y-grid>`);
        expect(el.gap).to.equal("large");
        el.gap = "x-large";
        expect(el.getAttribute("gap")).to.equal("x-large");
    });

    it("reflects rowGap and columnGap via getter and setter", async () => {
        const el = await fixture(
            html`<y-grid row-gap="small" column-gap="large"></y-grid>`,
        );
        expect(el.rowGap).to.equal("small");
        expect(el.columnGap).to.equal("large");
    });

    it("reflects align and justify via getter and setter", async () => {
        const el = await fixture(html`<y-grid align="center" justify="end"></y-grid>`);
        expect(el.align).to.equal("center");
        expect(el.justify).to.equal("end");
    });

    it("reflects alignContent and justifyContent via getter and setter", async () => {
        const el = await fixture(
            html`<y-grid align-content="between" justify-content="evenly"></y-grid>`,
        );
        expect(el.alignContent).to.equal("between");
        expect(el.justifyContent).to.equal("evenly");
    });

    it("reflects autoFlow via getter and setter", async () => {
        const el = await fixture(html`<y-grid auto-flow="column"></y-grid>`);
        expect(el.autoFlow).to.equal("column");
    });

    it("reflects dense via getter and setter", async () => {
        const el = await fixture(html`<y-grid dense></y-grid>`);
        expect(el.dense).to.be.true;
        el.dense = false;
        expect(el.hasAttribute("dense")).to.be.false;
    });

    it("reflects responsive via getter and setter", async () => {
        const el = await fixture(html`<y-grid responsive="false"></y-grid>`);
        expect(el.responsive).to.be.false;
        el.responsive = true;
        expect(el.hasAttribute("responsive")).to.be.false;
        expect(el.responsive).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Grid mode styles
    // -------------------------------------------------------------------------

    it("applies grid display in grid mode", async () => {
        const el = await fixture(html`<y-grid><div>A</div></y-grid>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).display).to.equal("grid");
    });

    it("applies the requested column count when responsive is disabled", async () => {
        const el = await fixture(
            html`<y-grid columns="4" responsive="false" style="width:400px"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        const colCount = getComputedStyle(container)
            .gridTemplateColumns.trim()
            .split(/\s+/).length;
        expect(colCount).to.equal(4);
    });

    it("collapses responsive grid columns when container is narrower than min-item-width", async () => {
        const el = await fixture(html`
            <y-grid columns="4" responsive style="width:400px">
                <div>A</div><div>B</div><div>C</div><div>D</div>
            </y-grid>
        `);
        const container = el.shadowRoot.querySelector(".container");
        const colCount = getComputedStyle(container)
            .gridTemplateColumns.trim()
            .split(/\s+/).length;
        expect(colCount).to.equal(1);
    });

    it("keeps full responsive grid columns when container is wide enough", async () => {
        const el = await fixture(html`
            <y-grid columns="4" responsive style="width:1200px">
                <div>A</div><div>B</div><div>C</div><div>D</div>
            </y-grid>
        `);
        const container = el.shadowRoot.querySelector(".container");
        const colCount = getComputedStyle(container)
            .gridTemplateColumns.trim()
            .split(/\s+/).length;
        expect(colCount).to.equal(4);
    });

    it("passes through a raw column template verbatim", async () => {
        const el = await fixture(
            html`<y-grid columns="100px 1fr 50px" gap="none" responsive="false" style="width:400px"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        const cols = getComputedStyle(container).gridTemplateColumns.trim();
        expect(cols).to.equal("100px 250px 50px");
    });

    it("uses auto-fit when columns=\"auto\"", async () => {
        const el = await fixture(
            html`<y-grid columns="auto" min-item-width="100px" gap="none" responsive="false" style="width:400px"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        const colCount = getComputedStyle(container)
            .gridTemplateColumns.trim()
            .split(/\s+/).length;
        expect(colCount).to.equal(4);
    });

    it("maps align=center to align-items: center", async () => {
        const el = await fixture(html`<y-grid align="center"><div>A</div></y-grid>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).alignItems).to.equal("center");
    });

    it("maps justify=end to justify-items: end", async () => {
        const el = await fixture(html`<y-grid justify="end"><div>A</div></y-grid>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).justifyItems).to.equal("end");
    });

    it("maps justify-content=between to space-between", async () => {
        const el = await fixture(
            html`<y-grid justify-content="between"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).justifyContent).to.equal("space-between");
    });

    it("applies grid-auto-flow when auto-flow is set", async () => {
        const el = await fixture(
            html`<y-grid auto-flow="column" responsive="false"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).gridAutoFlow).to.equal("column");
    });

    it("treats dense as a row dense shortcut", async () => {
        const el = await fixture(
            html`<y-grid dense responsive="false"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        // Browsers normalize "row dense" to "dense" in computed style.
        expect(getComputedStyle(container).gridAutoFlow).to.be.oneOf([
            "row dense",
            "dense",
        ]);
    });

    it("lets explicit auto-flow override dense", async () => {
        const el = await fixture(
            html`<y-grid dense auto-flow="column" responsive="false"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).gridAutoFlow).to.equal("column");
    });

    it("applies grid-auto-rows when auto-rows is set", async () => {
        const el = await fixture(
            html`<y-grid auto-rows="100px" responsive="false"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).gridAutoRows).to.equal("100px");
    });

    // -------------------------------------------------------------------------
    // Row / column gap overrides
    // -------------------------------------------------------------------------

    it("uses unified gap for both row and column gap when not overridden", async () => {
        const el = await fixture(
            html`<y-grid gap="large" responsive="false"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.rowGap).to.equal(styles.columnGap);
    });

    it("overrides row gap independently", async () => {
        const el = await fixture(
            html`<y-grid gap="small" row-gap="4x-large" responsive="false"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(parseInt(styles.rowGap, 10)).to.be.greaterThan(
            parseInt(styles.columnGap, 10),
        );
    });

    it("uses column-gap (not unified gap) for responsive column-width math", async () => {
        const el = await fixture(html`
            <y-grid columns="3" gap="none" column-gap="4x-large" responsive style="width:600px">
                <div>A</div><div>B</div><div>C</div>
            </y-grid>
        `);
        // The responsive template lives in the adopted stylesheet — read it
        // directly because computed gridTemplateColumns is resolved to fr/px.
        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const containerRule = [...sheet.cssRules].find(
            (r) => r.selectorText === ".container",
        );
        const template = containerRule.style.gridTemplateColumns;
        // 4x-large maps to var(--spacing-4x-large, 32px); the unified gap
        // (none → 0px) must not appear in the calc.
        expect(template).to.include("--spacing-4x-large");
        expect(template).not.to.include("--spacing-none");
    });

    // -------------------------------------------------------------------------
    // Masonry mode
    // -------------------------------------------------------------------------

    it("applies relative position to container in masonry mode", async () => {
        const el = await fixture(
            html`<y-grid mode="masonry"><div>A</div><div>B</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).position).to.equal("relative");
    });

    it("applies absolute positioning to children in masonry mode", async () => {
        const el = await fixture(html`
            <y-grid mode="masonry" columns="2" responsive="false" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-grid>
        `);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const items = el.querySelectorAll("div");
        expect(items[0].style.position).to.equal("absolute");
        expect(items[1].style.position).to.equal("absolute");
    });

    it("honors row-gap when packing items into the same column in masonry mode", async () => {
        const el = await fixture(html`
            <y-grid mode="masonry" columns="2" gap="none" row-gap="4x-large" responsive="false" style="width:400px">
                <div style="height:50px">A</div>
                <div style="height:50px">B</div>
                <div style="height:50px">C</div>
            </y-grid>
        `);
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        const items = el.querySelectorAll("div");
        // Items 0 and 1 fill columns 0 and 1 (y=0 each). Item 2 stacks under
        // one of them, separated by row-gap (4x-large = 32px). gap="none" so
        // bug would put item 2 at y=50 instead of y=82.
        expect(items[2].style.top).to.equal("82px");
    });

    it("honors column-gap for horizontal placement in masonry mode", async () => {
        const el = await fixture(html`
            <y-grid mode="masonry" columns="2" gap="none" column-gap="4x-large" responsive="false" style="width:432px">
                <div style="height:50px">A</div>
                <div style="height:50px">B</div>
            </y-grid>
        `);
        await new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
        );
        const items = el.querySelectorAll("div");
        // 432px container, 2 cols, 32px column-gap → colWidth = (432 - 32) / 2 = 200.
        // Item B sits in column 1 at x = colWidth + column-gap = 232.
        expect(items[0].style.left).to.equal("0px");
        expect(items[1].style.left).to.equal("232px");
        expect(items[1].style.width).to.equal("200px");
    });

    it("emits y-grid-layout after a masonry settle", async () => {
        const el = await fixture(html`
            <y-grid mode="masonry" columns="2" responsive="false" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-grid>
        `);
        const event = await oneEvent(el, "y-grid-layout");
        expect(event.detail.mode).to.equal("masonry");
        expect(event.detail.columns).to.equal(2);
        expect(event.detail.containerWidth).to.equal(400);
    });

    it("emits y-grid-layout exactly once on initial masonry connect", async () => {
        const events = [];
        const handler = (e) => events.push(e);
        document.addEventListener("y-grid-layout", handler);
        try {
            await fixture(html`
                <y-grid mode="masonry" columns="2" responsive="false" style="width:400px">
                    <div style="height:100px">A</div>
                    <div style="height:100px">B</div>
                </y-grid>
            `);
            // Allow any deferred rAF callbacks to flush before counting.
            await new Promise((r) =>
                requestAnimationFrame(() => requestAnimationFrame(r)),
            );
            expect(events.length).to.equal(1);
        } finally {
            document.removeEventListener("y-grid-layout", handler);
        }
    });

    // -------------------------------------------------------------------------
    // Mode switching
    // -------------------------------------------------------------------------

    it("clears masonry positions when switching to grid mode", async () => {
        const el = await fixture(html`
            <y-grid mode="masonry" columns="2" responsive="false" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-grid>
        `);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        el.mode = "grid";
        await new Promise((r) => setTimeout(r, 0));

        const items = el.querySelectorAll("div");
        expect(items[0].style.position).to.equal("");
    });

    it("updates layout when attributes change", async () => {
        const el = await fixture(
            html`<y-grid columns="2" responsive="false" style="width:400px"><div>A</div></y-grid>`,
        );
        const container = el.shadowRoot.querySelector(".container");

        el.columns = 4;
        await new Promise((r) => setTimeout(r, 0));
        const colCount = getComputedStyle(container)
            .gridTemplateColumns.trim()
            .split(/\s+/).length;
        expect(colCount).to.equal(4);
    });

    // -------------------------------------------------------------------------
    // No visual styling
    // -------------------------------------------------------------------------

    it("does not apply background, border, or padding", async () => {
        const el = await fixture(html`<y-grid><div>A</div></y-grid>`);
        const styles = getComputedStyle(el);
        expect(styles.backgroundColor).to.be.oneOf([
            "rgba(0, 0, 0, 0)",
            "transparent",
        ]);
        expect(styles.borderStyle).to.be.oneOf(["none", ""]);
        expect(styles.padding).to.be.oneOf(["0px", ""]);
    });

    // -------------------------------------------------------------------------
    // Host display
    // -------------------------------------------------------------------------

    it("renders as display: block", async () => {
        const el = await fixture(html`<y-grid></y-grid>`);
        expect(getComputedStyle(el).display).to.equal("block");
    });
});
