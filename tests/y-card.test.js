import { fixture, expect, html } from "@open-wc/testing";
import "../src/components/y-card.js";

describe("YumeCard", () => {
    it("renders header, body, and footer slots", async () => {
        const el = await fixture(html`
            <y-card>
                <span slot="header">Title</span>
                <p>Body content</p>
                <span slot="footer">Footer</span>
            </y-card>
        `);

        expect(el.shadowRoot.querySelector(".header")).to.exist;
        expect(el.shadowRoot.querySelector(".body")).to.exist;
        expect(el.shadowRoot.querySelector(".footer")).to.exist;
    });

    it("hides header section when no header slot content is provided", async () => {
        const el = await fixture(html`
            <y-card>
                <p>Body only</p>
            </y-card>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const header = el.shadowRoot.querySelector(".header");
        expect(header.style.display).to.equal("none");
    });

    it("hides footer section when no footer slot content is provided", async () => {
        const el = await fixture(html`
            <y-card>
                <p>Body only</p>
            </y-card>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const footer = el.shadowRoot.querySelector(".footer");
        expect(footer.style.display).to.equal("none");
    });

    it("shows header and footer when slot content is provided", async () => {
        const el = await fixture(html`
            <y-card>
                <span slot="header">Title</span>
                <p>Body</p>
                <span slot="footer">Actions</span>
            </y-card>
        `);

        await new Promise((r) => setTimeout(r, 0));

        const header = el.shadowRoot.querySelector(".header");
        const footer = el.shadowRoot.querySelector(".footer");
        expect(header.style.display).to.not.equal("none");
        expect(footer.style.display).to.not.equal("none");
    });

    it("applies base color CSS variables by default", async () => {
        const el = await fixture(html`<y-card></y-card>`);

        expect(el.style.getPropertyValue("--card-background")).to.include(
            "--base-background-component",
        );
        expect(el.style.getPropertyValue("--card-border-color")).to.include(
            "--base-border",
        );
    });

    it("applies primary color CSS variables when color=primary", async () => {
        const el = await fixture(html`<y-card color="primary"></y-card>`);

        expect(el.style.getPropertyValue("--card-background")).to.include(
            "--primary-background-component",
        );
        expect(el.style.getPropertyValue("--card-border-color")).to.include(
            "--primary-border",
        );
    });

    it("updates color variables when color attribute changes", async () => {
        const el = await fixture(html`<y-card color="base"></y-card>`);

        el.setAttribute("color", "error");
        await new Promise((r) => setTimeout(r, 0));

        expect(el.style.getPropertyValue("--card-background")).to.include(
            "--error-background-component",
        );
    });

    it("applies raised elevation styles when raised attribute is set", async () => {
        const el = await fixture(html`<y-card raised></y-card>`);

        expect(el.style.getPropertyValue("--card-border-width")).to.equal("0");
        expect(el.style.getPropertyValue("--card-box-shadow")).to.include(
            "--base-shadow",
        );
    });

    it("applies bordered styles when raised attribute is absent", async () => {
        const el = await fixture(html`<y-card></y-card>`);

        expect(el.style.getPropertyValue("--card-box-shadow")).to.equal("none");
        expect(
            el.style.getPropertyValue("--card-border-width"),
        ).to.include("--component-card-border-width");
    });

    it("updates elevation when raised attribute is toggled", async () => {
        const el = await fixture(html`<y-card></y-card>`);

        expect(el.style.getPropertyValue("--card-box-shadow")).to.equal("none");

        el.setAttribute("raised", "");
        await new Promise((r) => setTimeout(r, 0));

        expect(el.style.getPropertyValue("--card-box-shadow")).to.include(
            "--base-shadow",
        );
    });
});
