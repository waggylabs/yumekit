import { fixture, html, expect } from "@open-wc/testing";
import "./y-stack.js";

describe("YumeStack", () => {
    // -------------------------------------------------------------------------
    // Defaults
    // -------------------------------------------------------------------------

    it("renders a slot inside a container div", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(container).to.exist;
        expect(container.getAttribute("part")).to.equal("container");
        expect(container.querySelector("slot")).to.exist;
    });

    it("defaults to flex mode, row direction", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.mode).to.equal("flex");
        expect(el.direction).to.equal("row");
    });

    it("defaults gap to medium", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.gap).to.equal("medium");
    });

    it("defaults wrap to false", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.wrap).to.be.false;
    });

    it("defaults align to stretch", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.align).to.equal("stretch");
    });

    it("defaults justify to start", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.justify).to.equal("start");
    });

    it("defaults columns to 3", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.columns).to.equal(3);
    });

    it("defaults responsive to true", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.responsive).to.be.true;
    });

    it("disables responsive when responsive=\"false\" is set", async () => {
        const el = await fixture(html`<y-stack responsive="false"></y-stack>`);
        expect(el.responsive).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Attribute reflection
    // -------------------------------------------------------------------------

    it("reflects direction attribute via getter", async () => {
        const el = await fixture(html`<y-stack direction="column"></y-stack>`);
        expect(el.direction).to.equal("column");
    });

    it("sets direction via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.direction = "column";
        expect(el.getAttribute("direction")).to.equal("column");
    });

    it("reflects mode attribute via getter", async () => {
        const el = await fixture(html`<y-stack mode="grid"></y-stack>`);
        expect(el.mode).to.equal("grid");
    });

    it("sets mode via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.mode = "grid";
        expect(el.getAttribute("mode")).to.equal("grid");
    });

    it("reflects columns attribute via getter", async () => {
        const el = await fixture(html`<y-stack columns="4"></y-stack>`);
        expect(el.columns).to.equal(4);
    });

    it("sets columns via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.columns = 5;
        expect(el.getAttribute("columns")).to.equal("5");
    });

    it("reflects gap attribute via getter", async () => {
        const el = await fixture(html`<y-stack gap="large"></y-stack>`);
        expect(el.gap).to.equal("large");
    });

    it("sets gap via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.gap = "x-large";
        expect(el.getAttribute("gap")).to.equal("x-large");
    });

    it("reflects wrap attribute via getter", async () => {
        const el = await fixture(html`<y-stack wrap></y-stack>`);
        expect(el.wrap).to.be.true;
    });

    it("sets wrap via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.wrap = true;
        expect(el.hasAttribute("wrap")).to.be.true;
        el.wrap = false;
        expect(el.hasAttribute("wrap")).to.be.false;
    });

    it("reflects align attribute via getter", async () => {
        const el = await fixture(html`<y-stack align="center"></y-stack>`);
        expect(el.align).to.equal("center");
    });

    it("sets align via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.align = "baseline";
        expect(el.getAttribute("align")).to.equal("baseline");
    });

    it("reflects justify attribute via getter", async () => {
        const el = await fixture(html`<y-stack justify="between"></y-stack>`);
        expect(el.justify).to.equal("between");
    });

    it("sets justify via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.justify = "evenly";
        expect(el.getAttribute("justify")).to.equal("evenly");
    });

    it("reflects responsive attribute via getter", async () => {
        const el = await fixture(html`<y-stack responsive="false"></y-stack>`);
        expect(el.responsive).to.be.false;
    });

    it("sets responsive via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.responsive = false;
        expect(el.getAttribute("responsive")).to.equal("false");
        el.responsive = true;
        expect(el.hasAttribute("responsive")).to.be.false;
        expect(el.responsive).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Flex mode styles
    // -------------------------------------------------------------------------

    it("applies flex display in flex mode", async () => {
        const el = await fixture(html`<y-stack><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.display).to.equal("flex");
    });

    it("applies column direction in flex mode", async () => {
        const el = await fixture(html`<y-stack direction="column"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.flexDirection).to.equal("column");
    });

    it("applies flex-wrap when wrap is set", async () => {
        const el = await fixture(html`<y-stack wrap><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.flexWrap).to.equal("wrap");
    });

    it("applies nowrap when wrap is not set and responsive is disabled", async () => {
        const el = await fixture(html`<y-stack responsive="false"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.flexWrap).to.equal("nowrap");
    });

    it("prevents slotted children from shrinking when wrap is set", async () => {
        const el = await fixture(html`<y-stack wrap><div>A</div></y-stack>`);
        const child = el.querySelector("div");
        expect(getComputedStyle(child).flexShrink).to.equal("0");
    });

    it("allows slotted children to shrink when wrap is off and responsive is disabled", async () => {
        const el = await fixture(html`<y-stack responsive="false"><div>A</div></y-stack>`);
        const child = el.querySelector("div");
        expect(getComputedStyle(child).flexShrink).to.equal("1");
    });

    it("auto-enables wrap on row flex when responsive is set", async () => {
        const el = await fixture(html`<y-stack responsive><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexWrap).to.equal("wrap");
        const child = el.querySelector("div");
        expect(getComputedStyle(child).flexShrink).to.equal("0");
    });

    it("does not auto-enable wrap on column flex when responsive is set", async () => {
        const el = await fixture(html`<y-stack direction="column" responsive><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexWrap).to.equal("nowrap");
    });

    it("maps align=center to align-items: center", async () => {
        const el = await fixture(html`<y-stack align="center"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.alignItems).to.equal("center");
    });

    it("maps justify=between to justify-content: space-between", async () => {
        const el = await fixture(html`<y-stack justify="between"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.justifyContent).to.equal("space-between");
    });

    // -------------------------------------------------------------------------
    // Grid mode styles
    // -------------------------------------------------------------------------

    it("applies grid display in grid mode", async () => {
        const el = await fixture(html`<y-stack mode="grid"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.display).to.equal("grid");
    });

    it("applies correct number of grid columns", async () => {
        const el = await fixture(html`<y-stack mode="grid" columns="4" responsive="false" style="width:400px"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        // Computed value resolves 1fr to pixel widths — count the space-separated values
        const colCount = styles.gridTemplateColumns.trim().split(/\s+/).length;
        expect(colCount).to.equal(4);
    });

    it("collapses responsive grid columns when container is narrower than min-item-width", async () => {
        const el = await fixture(html`
            <y-stack mode="grid" columns="4" responsive style="width:400px">
                <div>A</div><div>B</div><div>C</div><div>D</div>
            </y-stack>
        `);
        const container = el.shadowRoot.querySelector(".container");
        const colCount = getComputedStyle(container).gridTemplateColumns.trim().split(/\s+/).length;
        // 400px container with default 240px min — should collapse to 1 column
        expect(colCount).to.equal(1);
    });

    it("keeps full responsive grid columns when container is wide enough", async () => {
        const el = await fixture(html`
            <y-stack mode="grid" columns="4" responsive style="width:1200px">
                <div>A</div><div>B</div><div>C</div><div>D</div>
            </y-stack>
        `);
        const container = el.shadowRoot.querySelector(".container");
        const colCount = getComputedStyle(container).gridTemplateColumns.trim().split(/\s+/).length;
        expect(colCount).to.equal(4);
    });

    // -------------------------------------------------------------------------
    // Masonry mode
    // -------------------------------------------------------------------------

    it("applies relative position to container in masonry mode", async () => {
        const el = await fixture(html`<y-stack mode="masonry"><div>A</div><div>B</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        const styles = getComputedStyle(container);
        expect(styles.position).to.equal("relative");
    });

    it("applies absolute positioning to children in masonry mode", async () => {
        const el = await fixture(html`
            <y-stack mode="masonry" columns="2" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-stack>
        `);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const items = el.querySelectorAll("div");
        expect(items[0].style.position).to.equal("absolute");
        expect(items[1].style.position).to.equal("absolute");
    });

    // -------------------------------------------------------------------------
    // Mode switching
    // -------------------------------------------------------------------------

    it("clears masonry positions when switching to flex mode", async () => {
        const el = await fixture(html`
            <y-stack mode="masonry" columns="2" style="width:400px">
                <div style="height:100px">A</div>
                <div style="height:100px">B</div>
            </y-stack>
        `);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        el.mode = "flex";
        await new Promise((r) => setTimeout(r, 0));

        const items = el.querySelectorAll("div");
        expect(items[0].style.position).to.equal("");
    });

    it("updates layout when attributes change", async () => {
        const el = await fixture(html`<y-stack><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");

        el.direction = "column";
        await new Promise((r) => setTimeout(r, 0));
        expect(getComputedStyle(container).flexDirection).to.equal("column");
    });

    // -------------------------------------------------------------------------
    // No visual styling
    // -------------------------------------------------------------------------

    it("does not apply background, border, or padding", async () => {
        const el = await fixture(html`<y-stack><div>A</div></y-stack>`);
        const styles = getComputedStyle(el);
        expect(styles.backgroundColor).to.be.oneOf(["rgba(0, 0, 0, 0)", "transparent"]);
        expect(styles.borderStyle).to.be.oneOf(["none", ""]);
        expect(styles.padding).to.be.oneOf(["0px", ""]);
    });

    // -------------------------------------------------------------------------
    // Host display
    // -------------------------------------------------------------------------

    it("renders as display: block", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(getComputedStyle(el).display).to.equal("block");
    });
});
