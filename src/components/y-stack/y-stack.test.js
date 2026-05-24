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

    it("defaults direction to row", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.direction).to.equal("row");
    });

    it("defaults gap to medium", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.gap).to.equal("medium");
    });

    it("defaults wrap to nowrap", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.wrap).to.equal("nowrap");
    });

    it("defaults align to stretch", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.align).to.equal("stretch");
    });

    it("defaults justify to start", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.justify).to.equal("start");
    });

    it("defaults alignContent to stretch", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.alignContent).to.equal("stretch");
    });

    it("defaults inline to false", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(el.inline).to.be.false;
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

    it("falls back to row for unknown direction values", async () => {
        const el = await fixture(html`<y-stack direction="diagonal"></y-stack>`);
        expect(el.direction).to.equal("row");
    });

    it("supports row-reverse and column-reverse direction values", async () => {
        const el = await fixture(html`<y-stack direction="row-reverse"></y-stack>`);
        expect(el.direction).to.equal("row-reverse");
        el.direction = "column-reverse";
        expect(el.direction).to.equal("column-reverse");
    });

    it("treats boolean wrap presence as 'wrap'", async () => {
        const el = await fixture(html`<y-stack wrap></y-stack>`);
        expect(el.wrap).to.equal("wrap");
    });

    it("supports wrap-reverse explicitly", async () => {
        const el = await fixture(html`<y-stack wrap="wrap-reverse"></y-stack>`);
        expect(el.wrap).to.equal("wrap-reverse");
    });

    it("supports explicit wrap=nowrap", async () => {
        const el = await fixture(html`<y-stack wrap="nowrap"></y-stack>`);
        expect(el.wrap).to.equal("nowrap");
    });

    it("sets wrap via setter (true / false / explicit string)", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.wrap = true;
        expect(el.hasAttribute("wrap")).to.be.true;
        expect(el.getAttribute("wrap")).to.equal("");
        el.wrap = "wrap-reverse";
        expect(el.getAttribute("wrap")).to.equal("wrap-reverse");
        el.wrap = false;
        expect(el.hasAttribute("wrap")).to.be.false;
    });

    it("reflects align attribute via getter", async () => {
        const el = await fixture(html`<y-stack align="center"></y-stack>`);
        expect(el.align).to.equal("center");
    });

    it("reflects justify attribute via getter", async () => {
        const el = await fixture(html`<y-stack justify="between"></y-stack>`);
        expect(el.justify).to.equal("between");
    });

    it("reflects align-content via alignContent getter", async () => {
        const el = await fixture(html`<y-stack align-content="between"></y-stack>`);
        expect(el.alignContent).to.equal("between");
    });

    it("reflects gap attribute via getter", async () => {
        const el = await fixture(html`<y-stack gap="large"></y-stack>`);
        expect(el.gap).to.equal("large");
    });

    it("reflects row-gap and column-gap via getters", async () => {
        const el = await fixture(html`<y-stack row-gap="small" column-gap="large"></y-stack>`);
        expect(el.rowGap).to.equal("small");
        expect(el.columnGap).to.equal("large");
    });

    it("reflects inline attribute via getter", async () => {
        const el = await fixture(html`<y-stack inline></y-stack>`);
        expect(el.inline).to.be.true;
    });

    it("sets inline via setter", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        el.inline = true;
        expect(el.hasAttribute("inline")).to.be.true;
        el.inline = false;
        expect(el.hasAttribute("inline")).to.be.false;
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
    // Computed styles
    // -------------------------------------------------------------------------

    it("applies flex display by default", async () => {
        const el = await fixture(html`<y-stack><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).display).to.equal("flex");
    });

    it("applies inline-flex when inline is set", async () => {
        const el = await fixture(html`<y-stack inline><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).display).to.equal("inline-flex");
    });

    it("applies column flex-direction", async () => {
        const el = await fixture(html`<y-stack direction="column" responsive="false"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexDirection).to.equal("column");
    });

    it("applies row-reverse flex-direction", async () => {
        const el = await fixture(html`<y-stack direction="row-reverse" responsive="false"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexDirection).to.equal("row-reverse");
    });

    it("applies flex-wrap when wrap is set", async () => {
        const el = await fixture(html`<y-stack wrap><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexWrap).to.equal("wrap");
    });

    it("applies wrap-reverse when wrap=\"wrap-reverse\"", async () => {
        const el = await fixture(html`<y-stack wrap="wrap-reverse"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexWrap).to.equal("wrap-reverse");
    });

    it("applies nowrap when wrap is unset and responsive is disabled", async () => {
        const el = await fixture(html`<y-stack responsive="false"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexWrap).to.equal("nowrap");
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

    it("maps align=center to align-items: center", async () => {
        const el = await fixture(html`<y-stack align="center"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).alignItems).to.equal("center");
    });

    it("maps justify=between to justify-content: space-between", async () => {
        const el = await fixture(html`<y-stack justify="between"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).justifyContent).to.equal("space-between");
    });

    it("maps align-content=around to align-content: space-around", async () => {
        const el = await fixture(html`<y-stack align-content="around"><div>A</div></y-stack>`);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).alignContent).to.equal("space-around");
    });

    // -------------------------------------------------------------------------
    // Responsive collapse to column
    // -------------------------------------------------------------------------

    it("collapses to column flex-direction below the mobile breakpoint", async () => {
        const el = await fixture(html`
            <y-stack responsive style="width:300px">
                <div>A</div><div>B</div>
            </y-stack>
        `);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexDirection).to.equal("column");
    });

    it("stays in row flex-direction above the mobile breakpoint", async () => {
        const el = await fixture(html`
            <y-stack responsive style="width:1000px">
                <div>A</div><div>B</div>
            </y-stack>
        `);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexDirection).to.equal("row");
    });

    it("does not collapse when responsive is disabled", async () => {
        const el = await fixture(html`
            <y-stack responsive="false" style="width:200px">
                <div>A</div><div>B</div>
            </y-stack>
        `);
        const container = el.shadowRoot.querySelector(".container");
        expect(getComputedStyle(container).flexDirection).to.equal("row");
    });

    // -------------------------------------------------------------------------
    // Reactivity
    // -------------------------------------------------------------------------

    it("updates layout when attributes change", async () => {
        const el = await fixture(html`<y-stack responsive="false"><div>A</div></y-stack>`);
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

    it("renders as display: block by default", async () => {
        const el = await fixture(html`<y-stack></y-stack>`);
        expect(getComputedStyle(el).display).to.equal("block");
    });

    it("renders as display: inline-block when inline is set", async () => {
        const el = await fixture(html`<y-stack inline></y-stack>`);
        expect(getComputedStyle(el).display).to.equal("inline-block");
    });
});
