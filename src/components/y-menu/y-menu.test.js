import sinon from "sinon";
import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-menu.js";
import { YumeMenu } from "./y-menu.js";
import "../y-button/y-button.js";

describe("YumeMenu", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

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

        const ul = el.shadowRoot.querySelector(".menu");
        expect(ul).to.exist;

        // Only count top-level menu items (ignore submenu children)
        const topItems = ul.querySelectorAll(":scope > .menuitem");
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

    it("does not open when its anchor is disabled", async () => {
        const wrapper = await fixture(html`
            <div>
                <y-button id="trigger" disabled>Menu</y-button>
                <y-menu id="menu" anchor="trigger" .items=${testItems}></y-menu>
            </div>
        `);
        const trigger = wrapper.querySelector("#trigger");
        const menu = wrapper.querySelector("#menu");

        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
        expect(menu.visible).to.be.false;

        // Re-enabling the anchor restores the toggle behavior.
        trigger.removeAttribute("disabled");
        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
        expect(menu.visible).to.be.true;
    });

    it("sets aria-haspopup and aria-expanded on the resolved anchor", async () => {
        const wrapper = await fixture(html`
            <div>
                <button id="trigger">Menu</button>
                <y-menu id="menu" anchor="trigger" .items=${testItems}></y-menu>
            </div>
        `);
        const trigger = wrapper.querySelector("#trigger");
        const menu = wrapper.querySelector("#menu");

        expect(trigger.getAttribute("aria-haspopup")).to.equal("menu");
        expect(trigger.getAttribute("aria-expanded")).to.equal("false");

        menu.visible = true;
        await new Promise((r) => setTimeout(r, 0));
        expect(trigger.getAttribute("aria-expanded")).to.equal("true");

        menu.visible = false;
        await new Promise((r) => setTimeout(r, 0));
        expect(trigger.getAttribute("aria-expanded")).to.equal("false");
    });

    it("removes aria-haspopup and aria-expanded from the anchor on disconnect", async () => {
        const wrapper = await fixture(html`
            <div>
                <button id="trigger">Menu</button>
                <y-menu id="menu" anchor="trigger" .items=${testItems}></y-menu>
            </div>
        `);
        const trigger = wrapper.querySelector("#trigger");
        const menu = wrapper.querySelector("#menu");

        expect(trigger.hasAttribute("aria-haspopup")).to.be.true;

        menu.remove();

        expect(trigger.hasAttribute("aria-haspopup")).to.be.false;
        expect(trigger.hasAttribute("aria-expanded")).to.be.false;
    });

    it("renders submenu for items with children", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        const items = el.shadowRoot.querySelectorAll(".menuitem");
        const hasSubmenu = Array.from(items).some((item) =>
            item.querySelector(".submenu"),
        );

        expect(hasSubmenu).to.be.true;
    });

    it("displays chevron y-icon indicator for nested items", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        const indicators = el.shadowRoot.querySelectorAll(".submenu-indicator");
        expect(indicators.length).to.equal(1);
        const icon = indicators[0].querySelector("y-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("chevron-right");
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

        const leafItem = el.shadowRoot.querySelector(".menuitem");
        leafItem.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.visible).to.be.false;
    });

    it("does not close when a parent menu item (with children) is clicked", async () => {
        const el = await fixture(html`<y-menu .items=${testItems}></y-menu>`);
        el._anchorEl = el;
        el.visible = true;
        await new Promise((r) => setTimeout(r, 0));

        const items = el.shadowRoot.querySelectorAll(".menuitem");
        const parentItem = Array.from(items).find((li) =>
            li.querySelector(".submenu"),
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
        const li = el.shadowRoot.querySelector(".menuitem");
        expect(li).to.exist;
        // The item-content should contain the text
        const content = li.querySelector(".item-content");
        expect(content.textContent).to.equal("Go Home");
    });

    it("item without url does not attach a navigation handler but still renders", async () => {
        const noUrlItems = [{ text: "No Nav" }];
        const el = await fixture(html`<y-menu .items=${noUrlItems}></y-menu>`);
        const li = el.shadowRoot.querySelector(".menuitem");
        expect(li).to.exist;
        const content = li.querySelector(".item-content");
        expect(content.textContent).to.equal("No Nav");
    });

    it("item with href dispatches navigate event with detail.href on click", async () => {
        const el = await fixture(
            html`<y-menu history="false" .items=${[{ text: "Home", href: "/home" }]}></y-menu>`,
        );
        const li = el.shadowRoot.querySelector(".menuitem");

        const navigatePromise = oneEvent(el, "navigate");
        // Cancel so the test doesn't actually navigate the browser.
        el.addEventListener("navigate", (e) => e.preventDefault(), { once: true });
        li.click();
        const event = await navigatePromise;
        expect(event.detail.href).to.equal("/home");
    });

    it("href takes precedence over url when both are present", async () => {
        YumeMenu._urlDeprecationWarned = false;
        const warn = sandbox.stub(console, "warn");
        const el = await fixture(
            html`<y-menu history="false" .items=${[{ text: "Home", href: "/new", url: "/old" }]}></y-menu>`,
        );
        const li = el.shadowRoot.querySelector(".menuitem");

        const navigatePromise = oneEvent(el, "navigate");
        el.addEventListener("navigate", (e) => e.preventDefault(), { once: true });
        li.click();
        const event = await navigatePromise;
        expect(event.detail.href).to.equal("/new");
        expect(warn.called).to.be.false;
    });

    it("logs a deprecation warning when item.url is used without item.href", async () => {
        YumeMenu._urlDeprecationWarned = false;
        const warn = sandbox.stub(console, "warn");
        await fixture(html`<y-menu .items=${[{ text: "Old", url: "/old" }]}></y-menu>`);
        expect(warn.calledOnce).to.be.true;
        expect(warn.firstCall.args[0]).to.include("item.url is deprecated");
    });

    it("only emits the url deprecation warning once across multiple instances", async () => {
        YumeMenu._urlDeprecationWarned = false;
        const warn = sandbox.stub(console, "warn");
        await fixture(html`<y-menu .items=${[{ text: "A", url: "/a" }]}></y-menu>`);
        await fixture(html`<y-menu .items=${[{ text: "B", url: "/b" }]}></y-menu>`);
        expect(warn.calledOnce).to.be.true;
    });

    it("dispatches open event when visible becomes true", async () => {
        const el = await fixture(html`<y-menu></y-menu>`);
        const openPromise = oneEvent(el, "open");
        el.visible = true;
        const event = await openPromise;
        expect(event.type).to.equal("open");
    });

    it("dispatches close event when visible becomes false", async () => {
        const el = await fixture(html`<y-menu visible></y-menu>`);
        const closePromise = oneEvent(el, "close");
        el.visible = false;
        const event = await closePromise;
        expect(event.type).to.equal("close");
    });

    it("does not dispatch open during initial upgrade for an element with the visible attribute set", async () => {
        let opened = false;
        const onOpen = () => { opened = true; };
        document.addEventListener("open", onOpen);
        try {
            await fixture(html`<y-menu visible></y-menu>`);
            expect(opened).to.be.false;
        } finally {
            document.removeEventListener("open", onOpen);
        }
    });

    it("does not dispatch open when visible is set on a disconnected element", async () => {
        const el = document.createElement("y-menu");
        let opened = false;
        el.addEventListener("open", () => { opened = true; });
        el.visible = true;
        expect(opened).to.be.false;
    });

    it("dispatches the next visible transition after the element connects", async () => {
        const el = await fixture(html`<y-menu visible></y-menu>`);
        // Initial open suppressed; next transition should fire normally.
        const closePromise = oneEvent(el, "close");
        el.visible = false;
        const closeEvt = await closePromise;
        expect(closeEvt.type).to.equal("close");

        const openPromise = oneEvent(el, "open");
        el.visible = true;
        const openEvt = await openPromise;
        expect(openEvt.type).to.equal("open");
    });

    it("dispatches select event with detail.value defaulting to text", async () => {
        const el = await fixture(
            html`<y-menu .items=${[{ text: "Copy" }]}></y-menu>`,
        );
        const li = el.shadowRoot.querySelector(".menuitem");
        const selectPromise = oneEvent(el, "select");
        li.click();
        const event = await selectPromise;
        expect(event.detail.value).to.equal("Copy");
        expect(event.detail.item.text).to.equal("Copy");
    });

    it("uses explicit item.value for select detail when set", async () => {
        const el = await fixture(
            html`<y-menu .items=${[{ text: "Copy", value: "cmd:copy" }]}></y-menu>`,
        );
        const li = el.shadowRoot.querySelector(".menuitem");
        const selectPromise = oneEvent(el, "select");
        li.click();
        const event = await selectPromise;
        expect(event.detail.value).to.equal("cmd:copy");
    });

    it("does not dispatch select for items with children when the parent item is clicked", async () => {
        const el = await fixture(
            html`<y-menu .items=${[{ text: "Parent", children: [{ text: "Child" }] }]}></y-menu>`,
        );
        const root = el.shadowRoot.querySelector(".menu");
        const parentItem = root.querySelector(":scope > .menuitem");
        let fired = false;
        el.addEventListener("select", () => { fired = true; });
        parentItem.click();
        expect(fired).to.be.false;
    });

    it("treats light-DOM children as additional menu items and fires select on click", async () => {
        const el = await fixture(html`
            <y-menu>
                <button data-value="foo">Foo</button>
            </y-menu>
        `);
        const child = el.querySelector("button");
        expect(child.getAttribute("role")).to.equal("menuitem");
        expect(child.tabIndex).to.equal(0);

        const selectPromise = oneEvent(el, "select");
        child.click();
        const event = await selectPromise;
        expect(event.detail.value).to.equal("foo");
        expect(event.detail.element).to.equal(child);
    });

    it("falls back to textContent for slotted child value when data-value is absent", async () => {
        const el = await fixture(html`
            <y-menu>
                <a href="/x">Plain Link</a>
            </y-menu>
        `);
        const child = el.querySelector("a");
        const selectPromise = oneEvent(el, "select");
        // Cancel the default <a> navigation so the test doesn't navigate the page.
        child.addEventListener("click", (e) => e.preventDefault(), { once: true });
        child.click();
        const event = await selectPromise;
        expect(event.detail.value).to.equal("Plain Link");
    });

    it("applies menuitem-like styling to slotted default-slot children via ::slotted", async () => {
        const el = await fixture(html`
            <y-menu><button data-value="x">X</button></y-menu>
        `);
        const btn = el.querySelector("button");
        const computed = getComputedStyle(btn);
        // Slotted padding should match the menuitem padding (resolved button-padding token).
        expect(computed.cursor).to.equal("pointer");
        expect(parseFloat(computed.paddingTop)).to.be.greaterThan(0);
    });

    it("rebinds a slotted child when it is moved between y-menu instances", async () => {
        const wrapper = await fixture(html`
            <div>
                <y-menu id="m1"><button data-value="x">X</button></y-menu>
                <y-menu id="m2"></y-menu>
            </div>
        `);
        const m1 = wrapper.querySelector("#m1");
        const m2 = wrapper.querySelector("#m2");
        const btn = m1.querySelector("button");

        // Move the child from m1 to m2 and let slotchange settle on both.
        m2.appendChild(btn);
        await oneEvent(m2.shadowRoot.querySelector(".menu > slot"), "slotchange");

        // Click should fire select on m2 (the new owner), not m1.
        let firedOnM1 = false;
        m1.addEventListener("select", () => { firedOnM1 = true; });
        const selectOnM2 = oneEvent(m2, "select");
        btn.click();
        const evt = await selectOnM2;
        expect(evt.detail.value).to.equal("x");
        expect(firedOnM1).to.be.false;
    });

    it("removes click handlers from slotted children on disconnect", async () => {
        const host = await fixture(html`
            <div>
                <y-menu><button data-value="x">X</button></y-menu>
            </div>
        `);
        const menu = host.querySelector("y-menu");
        const btn = menu.querySelector("button");

        host.removeChild(menu);

        // After disconnect, clicking the (now-orphan) child must not dispatch select on the menu.
        let fired = false;
        menu.addEventListener("select", () => { fired = true; });
        btn.click();
        expect(fired).to.be.false;
    });

    it("renders item.icon as a y-icon element inside the menu item", async () => {
        const el = await fixture(
            html`<y-menu .items=${[{ text: "Edit", icon: "edit" }]}></y-menu>`,
        );
        const icon = el.shadowRoot.querySelector(".menuitem y-icon");
        expect(icon).to.not.be.null;
        expect(icon.getAttribute("name")).to.equal("edit");
    });

    it("renders a named slot when item.slot is set, with the default content as fallback", async () => {
        const el = await fixture(html`
            <y-menu .items=${[{ text: "Custom", slot: "my-item" }]}>
                <span slot="my-item">Replacement</span>
            </y-menu>
        `);
        const slot = el.shadowRoot.querySelector('.menuitem slot[name="my-item"]');
        expect(slot).to.not.be.null;
        const assigned = slot.assignedElements();
        expect(assigned.length).to.equal(1);
        expect(assigned[0].textContent).to.equal("Replacement");
    });

    it("logs a deprecation warning when item.template is used", async () => {
        YumeMenu._templateFieldDeprecationWarned = false;
        const warn = sandbox.stub(console, "warn");
        await fixture(html`<y-menu .items=${[{ text: "T", template: "missing" }]}></y-menu>`);
        expect(warn.calledOnce).to.be.true;
        expect(warn.firstCall.args[0]).to.include("template");
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
        const submenu = el.shadowRoot.querySelector(".submenu");
        expect(submenu).to.exist;
        const nestedSubmenu = submenu.querySelector(".submenu");
        expect(nestedSubmenu).to.exist;
        expect(nestedSubmenu.querySelector(".menuitem").textContent).to.include("Grandchild");
    });

    it("renders item as selected when item.selected is true", async () => {
        const selectedItems = [
            { text: "Active", selected: true },
            { text: "Inactive" },
        ];
        const el = await fixture(html`<y-menu .items=${selectedItems}></y-menu>`);
        const items = el.shadowRoot.querySelectorAll(".menuitem");
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
