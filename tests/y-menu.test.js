import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/y-menu.js";
import "../src/components/y-button.js";

describe("YumeMenu", () => {
    const testItems = [
        { text: "Dashboard", url: "/dashboard" },
        {
            text: "Settings",
            children: [
                { text: "Profile", url: "/settings/profile" },
                { text: "Security" },
            ],
        },
        { text: "Help" },
    ];

    it("renders menu items correctly", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);

        const ul = el.shadowRoot.querySelector("ul.menu");
        expect(ul).to.exist;

        // Only count top-level menu items (ignore submenu children)
        const topItems = ul.querySelectorAll(":scope > li.menuitem");
        expect(topItems.length).to.equal(3);
    });

    it("toggles visibility when anchor is clicked", async () => {
        const wrapper = await fixture(html`
            <div>
                <y-button id="trigger">Menu</y-button>
                <y-menu id="menu" anchor="trigger" .items=${testItems}></y-menu>
            </div>
        `);

        const triggerBtn = wrapper
            .querySelector('y-button[id="trigger"]')
            .shadowRoot.querySelector("button");
        triggerBtn.click();
        // allow attributeChangedCallback to run
        await new Promise((r) => setTimeout(r, 0));

        const menu = wrapper.querySelector("#menu");
        expect(menu.hasAttribute("visible")).to.be.true;
    });

    it("renders submenu for items with children", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        const items = el.shadowRoot.querySelectorAll("li.menuitem");
        const hasSubmenu = Array.from(items).some((item) =>
            item.querySelector("ul.submenu"),
        );

        expect(hasSubmenu).to.be.true;
    });

    it("displays chevron SVG indicator for nested items", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        const indicators = el.shadowRoot.querySelectorAll(".submenu-indicator");
        expect(indicators.length).to.equal(1);
        expect(indicators[0].querySelector("svg")).to.exist;
    });

    it("hides menu when visible is toggled off", async () => {
        const el = await fixture(
            html`<y-menu .items="\${testItems}"></y-menu>`,
        );
        // Mock an anchor element so positioning logic can set display
        el._anchorEl = el;

        // Show the menu by toggling visible property
        el.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        expect(el.style.display).to.equal("block");

        // Now hide the menu
        el.visible = false;
        await new Promise((r) => setTimeout(r, 0));
        expect(el.style.display).to.equal("none");
    });

    it("defaults direction to 'down'", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        expect(el.direction).to.equal("down");
    });

    it("accepts direction attribute 'right'", async () => {
        const el = await fixture(
            html`<y-menu direction="right" .items=${testItems}></y-menu>`,
        );
        expect(el.direction).to.equal("right");
    });

    it("sets direction via property setter", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        el.direction = "right";
        expect(el.getAttribute("direction")).to.equal("right");
    });

    it("closes when a leaf menu item is clicked", async () => {
        const noUrlItems = [{ text: "Alpha" }, { text: "Beta" }];
        const el = await fixture(
            html`<y-menu .items=${noUrlItems}></y-menu>`,
        );
        el._anchorEl = el;
        el.visible = true;
        await new Promise((r) => setTimeout(r, 0));

        const leafItem = el.shadowRoot.querySelector("li.menuitem");
        leafItem.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.visible).to.be.false;
    });

    it("does not close when a parent menu item (with children) is clicked", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        el._anchorEl = el;
        el.visible = true;
        await new Promise((r) => setTimeout(r, 0));

        const items = el.shadowRoot.querySelectorAll("li.menuitem");
        const parentItem = Array.from(items).find((li) =>
            li.querySelector("ul.submenu"),
        );
        parentItem.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.visible).to.be.true;
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        expect(el.size).to.equal("medium");
    });

    it("accepts size attribute of small, medium, or large", async () => {
        for (const size of ["small", "medium", "large"]) {
            const el = await fixture(
                html`<y-menu size="${size}" .items=${testItems}></y-menu>`,
            );
            expect(el.size).to.equal(size);
        }
    });

    it("falls back to medium for an invalid size value", async () => {
        const el = await fixture(
            html`<y-menu size="huge" .items=${testItems}></y-menu>`,
        );
        expect(el.size).to.equal("medium");
    });

    it("sets size via property setter", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("applies the correct padding CSS variable for each size", async () => {
        for (const size of ["small", "medium", "large"]) {
            const el = await fixture(
                html`<y-menu size="${size}" .items=${testItems}></y-menu>`,
            );
            const styleEl = el.shadowRoot.querySelector("style");
            expect(styleEl.textContent).to.include(
                `--component-button-padding-${size}`,
            );
        }
    });

    it("re-renders with updated padding when size attribute changes", async () => {
        const el = await fixture(
            html`<y-menu size="small" .items=${testItems}></y-menu>`,
        );

        let styleEl = el.shadowRoot.querySelector("style");
        expect(styleEl.textContent).to.include("--component-button-padding-small");

        el.setAttribute("size", "large");
        await new Promise((r) => setTimeout(r, 0));

        styleEl = el.shadowRoot.querySelector("style");
        expect(styleEl.textContent).to.include("--component-button-padding-large");
    });
});
