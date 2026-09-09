import { fixture, expect, html } from "@open-wc/testing";
import "./y-card.js";

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

    it("paints the base surface by default", async () => {
        const el = await fixture(html`<y-card></y-card>`);
        el.style.setProperty("--base-background-component", "rgb(1, 2, 3)");

        expect(getComputedStyle(el).backgroundColor).to.equal("rgb(1, 2, 3)");
    });

    it("paints the primary surface when color=primary", async () => {
        const el = await fixture(html`<y-card color="primary"></y-card>`);
        el.style.setProperty("--primary-background-component", "rgb(4, 5, 6)");

        expect(getComputedStyle(el).backgroundColor).to.equal("rgb(4, 5, 6)");
    });

    it("repaints when the color attribute changes", async () => {
        const el = await fixture(html`<y-card color="base"></y-card>`);
        el.style.setProperty("--error-background-component", "rgb(7, 8, 9)");
        el.setAttribute("color", "error");

        expect(getComputedStyle(el).backgroundColor).to.equal("rgb(7, 8, 9)");
    });

    it("sets the color attribute via the color setter", async () => {
        const el = await fixture(html`<y-card></y-card>`);
        el.color = "primary";

        expect(el.getAttribute("color")).to.equal("primary");
    });

    describe("ancestor overrides", () => {
        it("lets an ancestor override the card background", async () => {
            const wrapper = await fixture(html`
                <div style="--card-background: rgb(10, 20, 30)">
                    <y-card></y-card>
                </div>
            `);

            expect(
                getComputedStyle(wrapper.querySelector("y-card")).backgroundColor,
            ).to.equal("rgb(10, 20, 30)");
        });

        it("lets an ancestor override the card border color", async () => {
            const wrapper = await fixture(html`
                <div style="--card-border-color: rgb(40, 50, 60)">
                    <y-card></y-card>
                </div>
            `);

            expect(
                getComputedStyle(wrapper.querySelector("y-card")).borderTopColor,
            ).to.equal("rgb(40, 50, 60)");
        });

        it("lets an ancestor override the content color", async () => {
            const wrapper = await fixture(html`
                <div style="--card-content-color: rgb(70, 80, 90)">
                    <y-card></y-card>
                </div>
            `);

            expect(getComputedStyle(wrapper.querySelector("y-card")).color).to.equal(
                "rgb(70, 80, 90)",
            );
        });

        it("keeps an ancestor override ahead of the color attribute", async () => {
            const wrapper = await fixture(html`
                <div style="--card-background: rgb(11, 22, 33)">
                    <y-card color="error"></y-card>
                </div>
            `);

            expect(
                getComputedStyle(wrapper.querySelector("y-card")).backgroundColor,
            ).to.equal("rgb(11, 22, 33)");
        });
    });

    describe("raised", () => {
        it("keeps the border box so raised and unraised cards align", async () => {
            const raised = await fixture(html`<y-card raised></y-card>`);
            const plain = await fixture(html`<y-card></y-card>`);

            expect(getComputedStyle(raised).borderTopWidth).to.equal(
                getComputedStyle(plain).borderTopWidth,
            );
        });

        it("hides the border line rather than removing the border", async () => {
            const el = await fixture(html`<y-card raised></y-card>`);

            expect(getComputedStyle(el).borderTopColor).to.equal(
                "rgba(0, 0, 0, 0)",
            );
        });

        it("applies a shadow when raised and none when not", async () => {
            const raised = await fixture(html`<y-card raised></y-card>`);
            const plain = await fixture(html`<y-card></y-card>`);
            raised.style.setProperty("--base-shadow", "0 2px 4px rgb(0, 0, 0)");
            plain.style.setProperty("--base-shadow", "0 2px 4px rgb(0, 0, 0)");

            expect(getComputedStyle(raised).boxShadow).to.not.equal("none");
            expect(getComputedStyle(plain).boxShadow).to.equal("none");
        });

        it("applies the shadow when raised is toggled on", async () => {
            const el = await fixture(html`<y-card></y-card>`);
            el.style.setProperty("--base-shadow", "0 2px 4px rgb(0, 0, 0)");
            expect(getComputedStyle(el).boxShadow).to.equal("none");

            el.raised = true;

            expect(el.hasAttribute("raised")).to.be.true;
            expect(getComputedStyle(el).boxShadow).to.not.equal("none");
        });

        it("removes the raised attribute via the setter when set to false", async () => {
            const el = await fixture(html`<y-card raised></y-card>`);
            el.raised = false;

            expect(el.hasAttribute("raised")).to.be.false;
            expect(getComputedStyle(el).boxShadow).to.equal("none");
        });
    });

    describe("slot section timing", () => {
        it("shows sections without awaiting a frame when children are present", async () => {
            const el = await fixture(html`
                <y-card>
                    <span slot="header">Title</span>
                    <p>Body</p>
                    <span slot="footer">Actions</span>
                </y-card>
            `);

            expect(el.shadowRoot.querySelector(".header").style.display).to.equal("");
            expect(el.shadowRoot.querySelector(".footer").style.display).to.equal("");
        });

        it("gives a populated header a measurable height immediately", async () => {
            const el = await fixture(html`
                <y-card><span slot="header">Title</span><p>Body</p></y-card>
            `);

            expect(
                el.shadowRoot.querySelector(".header").getBoundingClientRect().height,
            ).to.be.greaterThan(0);
        });
    });
});
