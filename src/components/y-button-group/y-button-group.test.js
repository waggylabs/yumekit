import { fixture, html, expect } from "@open-wc/testing";
import "./y-button-group.js";
import "../y-button/y-button.js";

describe("YumeButtonGroup", () => {
    it("renders a slot in its shadow DOM", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>One</y-button>
            </y-button-group>
        `);
        const slot = el.shadowRoot.querySelector("slot");
        expect(slot).to.exist;
    });

    it("defaults to horizontal orientation", async () => {
        const el = await fixture(html`<y-button-group></y-button-group>`);
        expect(el.orientation).to.equal("horizontal");
    });

    it("reflects the orientation attribute via getter", async () => {
        const el = await fixture(html`<y-button-group orientation="vertical"></y-button-group>`);
        expect(el.orientation).to.equal("vertical");
    });

    it("sets orientation via setter", async () => {
        const el = await fixture(html`<y-button-group></y-button-group>`);
        el.orientation = "vertical";
        expect(el.getAttribute("orientation")).to.equal("vertical");
    });

    it("does not apply border-radius override to a single child", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>Only</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const btn = el.querySelector("y-button");
        const radius = btn.style.getPropertyValue("--component-button-border-radius-outer");
        expect(radius).to.equal("");
    });

    it("applies left-only radius to the first child in a horizontal group", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>One</y-button>
                <y-button>Two</y-button>
                <y-button>Three</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        const radius = buttons[0].style.getPropertyValue("--component-button-border-radius-outer");
        // Should be "Xpx 0 0 Xpx" — right corners are 0
        expect(radius).to.match(/\S+ 0 0 \S+/);
    });

    it("applies zero radius to middle children in a horizontal group", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>One</y-button>
                <y-button>Two</y-button>
                <y-button>Three</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        const radius = buttons[1].style.getPropertyValue("--component-button-border-radius-outer");
        expect(radius).to.equal("0");
    });

    it("applies right-only radius to the last child in a horizontal group", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>One</y-button>
                <y-button>Two</y-button>
                <y-button>Three</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        const radius = buttons[2].style.getPropertyValue("--component-button-border-radius-outer");
        // Should be "0 Xpx Xpx 0" — left corners are 0
        expect(radius).to.match(/0 \S+ \S+ 0/);
    });

    it("applies top-only radius to the first child in a vertical group", async () => {
        const el = await fixture(html`
            <y-button-group orientation="vertical">
                <y-button>Top</y-button>
                <y-button>Bottom</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        const radius = buttons[0].style.getPropertyValue("--component-button-border-radius-outer");
        // Should be "Xpx Xpx 0 0" — bottom corners are 0
        expect(radius).to.match(/\S+ \S+ 0 0/);
    });

    it("applies bottom-only radius to the last child in a vertical group", async () => {
        const el = await fixture(html`
            <y-button-group orientation="vertical">
                <y-button>Top</y-button>
                <y-button>Bottom</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        const radius = buttons[1].style.getPropertyValue("--component-button-border-radius-outer");
        // Should be "0 0 Xpx Xpx" — top corners are 0
        expect(radius).to.match(/0 0 \S+ \S+/);
    });

    it("collapses the left margin on non-first children in a horizontal group", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>One</y-button>
                <y-button>Two</y-button>
                <y-button>Three</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        expect(buttons[0].style.marginLeft).to.equal("");
        expect(buttons[1].style.marginLeft).to.equal("-1px");
        expect(buttons[2].style.marginLeft).to.equal("-1px");
    });

    it("collapses the top margin on non-first children in a vertical group", async () => {
        const el = await fixture(html`
            <y-button-group orientation="vertical">
                <y-button>Top</y-button>
                <y-button>Middle</y-button>
                <y-button>Bottom</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));
        const buttons = el.querySelectorAll("y-button");
        expect(buttons[0].style.marginTop).to.equal("");
        expect(buttons[1].style.marginTop).to.equal("-1px");
        expect(buttons[2].style.marginTop).to.equal("-1px");
    });

    it("re-applies child styles when orientation attribute changes", async () => {
        const el = await fixture(html`
            <y-button-group>
                <y-button>One</y-button>
                <y-button>Two</y-button>
            </y-button-group>
        `);
        await new Promise((r) => setTimeout(r, 0));

        el.setAttribute("orientation", "vertical");
        await new Promise((r) => setTimeout(r, 0));

        const buttons = el.querySelectorAll("y-button");
        // First child should now have a top-biased radius (vertical)
        const radius = buttons[0].style.getPropertyValue("--component-button-border-radius-outer");
        expect(radius).to.match(/\S+ \S+ 0 0/);
        // Collapsed margin should now be on top, not left
        expect(buttons[1].style.marginTop).to.equal("-1px");
        expect(buttons[1].style.marginLeft).to.equal("");
    });
});
