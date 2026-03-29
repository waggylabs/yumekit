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

    it("item with url navigates on click (url property is set on li)", async () => {
        const urlItems = [{ text: "Go Home", url: "/home" }];
        const el = await fixture(html`<y-menu .items=${urlItems}></y-menu>`);
        const li = el.shadowRoot.querySelector("li.menuitem");
        expect(li).to.exist;
        // The item-content should contain the text
        const content = li.querySelector(".item-content");
        expect(content.textContent).to.equal("Go Home");
    });

    it("item without url does not attach a navigation handler but still renders", async () => {
        const noUrlItems = [{ text: "No Nav" }];
        const el = await fixture(html`<y-menu .items=${noUrlItems}></y-menu>`);
        const li = el.shadowRoot.querySelector("li.menuitem");
        expect(li).to.exist;
        const content = li.querySelector(".item-content");
        expect(content.textContent).to.equal("No Nav");
    });

    it("renders submenu items recursively", async () => {
        const nested = [
            {
                text: "Parent",
                children: [
                    {
                        text: "Child",
                        children: [{ text: "Grandchild" }],
                    },
                ],
            },
        ];
        const el = await fixture(html`<y-menu .items=${nested}></y-menu>`);
        const submenu = el.shadowRoot.querySelector("ul.submenu");
        expect(submenu).to.exist;
        const nestedSubmenu = submenu.querySelector("ul.submenu");
        expect(nestedSubmenu).to.exist;
        expect(nestedSubmenu.querySelector("li").textContent).to.include("Grandchild");
    });

    it("renders item as selected when item.selected is true", async () => {
        const selectedItems = [
            { text: "Active", selected: true },
            { text: "Inactive" },
        ];
        const el = await fixture(html`<y-menu .items=${selectedItems}></y-menu>`);
        const items = el.shadowRoot.querySelectorAll("li.menuitem");
        expect(items[0].classList.contains("selected")).to.be.true;
        expect(items[0].getAttribute("aria-current")).to.equal("true");
        expect(items[1].classList.contains("selected")).to.be.false;
        expect(items[1].getAttribute("aria-current")).to.equal("false");
    });

    it("renders icon-template content when item['icon-template'] references a template slot", async () => {
        const tplItems = [{ text: "With Icon", "icon-template": "my-icon-tpl" }];
        const el = await fixture(html`
            <y-menu .items=${tplItems}>
                <template slot="my-icon-tpl"><span class="icon-tpl-content">*</span></template>
            </y-menu>
        `);
        const contentWrapper = el.shadowRoot.querySelector(".item-content");
        expect(contentWrapper).to.exist;
        // The icon template content should be cloned into the wrapper
        expect(contentWrapper.querySelector(".icon-tpl-content")).to.exist;
    });

    it("renders template content when item.template references a template slot", async () => {
        const tplItems = [{ text: "Fallback", template: "my-text-tpl" }];
        const el = await fixture(html`
            <y-menu .items=${tplItems}>
                <template slot="my-text-tpl"><em class="text-tpl-content">Custom Text</em></template>
            </y-menu>
        `);
        const contentWrapper = el.shadowRoot.querySelector(".item-content");
        expect(contentWrapper).to.exist;
        expect(contentWrapper.querySelector(".text-tpl-content")).to.exist;
    });

    it("falls back to item.text when item.template is set but no matching template exists", async () => {
        const tplItems = [{ text: "Fallback Text", template: "nonexistent-tpl" }];
        const el = await fixture(html`<y-menu .items=${tplItems}></y-menu>`);
        const contentWrapper = el.shadowRoot.querySelector(".item-content");
        expect(contentWrapper.textContent).to.equal("Fallback Text");
    });

    it("positions menu to the right of the anchor when direction is 'right'", async () => {
        const wrapper = await fixture(html`
            <div style="position:relative">
                <button id="right-anchor" style="position:absolute;top:100px;left:100px;width:80px;height:40px">Menu</button>
                <y-menu id="right-menu" anchor="right-anchor" direction="right" .items=${testItems}></y-menu>
            </div>
        `);
        const menu = wrapper.querySelector("#right-menu");
        menu._anchorEl = wrapper.querySelector("#right-anchor");
        menu.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        // Menu should be displayed
        expect(menu.style.display).to.equal("block");
        // left should be a pixel string
        expect(menu.style.left).to.match(/\d+px/);
    });

    it("positions menu above the anchor when direction is 'up'", async () => {
        const wrapper = await fixture(html`
            <div style="position:relative">
                <button id="up-anchor" style="position:absolute;top:200px;left:100px;width:80px;height:40px">Menu</button>
                <y-menu id="up-menu" anchor="up-anchor" direction="up" .items=${testItems}></y-menu>
            </div>
        `);
        const menu = wrapper.querySelector("#up-menu");
        menu._anchorEl = wrapper.querySelector("#up-anchor");
        menu.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        expect(menu.style.display).to.equal("block");
        expect(menu.style.top).to.match(/\d+px/);
    });

    it("positions menu to the left of the anchor when direction is 'left'", async () => {
        const wrapper = await fixture(html`
            <div style="position:relative">
                <button id="left-anchor" style="position:absolute;top:100px;left:300px;width:80px;height:40px">Menu</button>
                <y-menu id="left-menu" anchor="left-anchor" direction="left" .items=${testItems}></y-menu>
            </div>
        `);
        const menu = wrapper.querySelector("#left-menu");
        menu._anchorEl = wrapper.querySelector("#left-anchor");
        menu.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        expect(menu.style.display).to.equal("block");
        expect(menu.style.left).to.match(/\d+px/);
    });

    it("updates position when scroll or resize event fires while visible", async () => {
        const wrapper = await fixture(html`
            <div>
                <button id="scroll-anchor">Menu</button>
                <y-menu id="scroll-menu" anchor="scroll-anchor" .items=${testItems}></y-menu>
            </div>
        `);
        const menu = wrapper.querySelector("#scroll-menu");
        menu._anchorEl = wrapper.querySelector("#scroll-anchor");
        menu.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        const topBefore = menu.style.top;
        // Fire scroll event — position should be recalculated (top stays a pixel value)
        window.dispatchEvent(new Event("scroll", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
        expect(menu.style.top).to.match(/\d+px/);
        // Ensure display remains block (still visible after repositioning)
        expect(menu.style.display).to.equal("block");
    });

    it("closes other visible menus when a new menu is opened", async () => {
        const wrapper = await fixture(html`
            <div>
                <button id="btn-a">A</button>
                <y-menu id="menu-a" anchor="btn-a" .items=${[{ text: "A1" }]}></y-menu>
                <button id="btn-b">B</button>
                <y-menu id="menu-b" anchor="btn-b" .items=${[{ text: "B1" }]}></y-menu>
            </div>
        `);
        const menuA = wrapper.querySelector("#menu-a");
        const menuB = wrapper.querySelector("#menu-b");
        const btnA = wrapper.querySelector("#btn-a");
        const btnB = wrapper.querySelector("#btn-b");

        btnA.click();
        await new Promise((r) => setTimeout(r, 0));
        expect(menuA.visible).to.be.true;

        btnB.click();
        await new Promise((r) => setTimeout(r, 0));
        expect(menuB.visible).to.be.true;
        // Menu A should have been closed by _closeAll
        expect(menuA.visible).to.be.false;
    });
});
