import { fixture, html, expect } from "@open-wc/testing";
import "../src/icons/all.js";
import "../src/components/y-appbar.js";

describe("YumeAppbar", () => {
    const sampleItems = [
        {
            text: "Home",
            icon: '<svg width="16" height="16"><rect width="16" height="16"/></svg>',
            href: "/",
        },
        {
            text: "Dashboard",
            icon: '<svg width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>',
        },
        {
            text: "Settings",
            icon: '<svg width="16" height="16"><rect width="16" height="16"/></svg>',
            children: [
                { text: "Profile", href: "/settings/profile" },
                { text: "Security", href: "/settings/security" },
            ],
        },
    ];

    const namedIconItems = [
        { text: "Home", icon: "home", href: "/" },
        { text: "Search", icon: "search" },
        {
            text: "Settings",
            icon: "settings",
            children: [
                { text: "Profile", href: "/settings/profile" },
                { text: "Security", href: "/settings/security" },
            ],
        },
    ];

    it("renders with default vertical orientation", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.orientation).to.equal("vertical");
        const bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("vertical")).to.be.true;
    });

    it("accepts horizontal orientation", async () => {
        const el = await fixture(
            html`<y-appbar orientation="horizontal"></y-appbar>`,
        );
        expect(el.orientation).to.equal("horizontal");
        const bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("horizontal")).to.be.true;
    });

    it("is not collapsed by default", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.collapsed).to.be.false;
        const bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("collapsed")).to.be.false;
    });

    it("applies collapsed class when collapsed attribute is set", async () => {
        const el = await fixture(html`<y-appbar collapsed></y-appbar>`);
        expect(el.collapsed).to.be.true;
        const bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("collapsed")).to.be.true;
    });

    it("ignores collapsed in horizontal mode", async () => {
        const el = await fixture(
            html`<y-appbar orientation="horizontal" collapsed></y-appbar>`,
        );
        const bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("collapsed")).to.be.false;
    });

    it("toggle() switches collapsed state", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.collapsed).to.be.false;
        el.toggle();
        expect(el.collapsed).to.be.true;
        el.toggle();
        expect(el.collapsed).to.be.false;
    });

    it("has role navigation", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        const bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.getAttribute("role")).to.equal("navigation");
    });

    it("renders logo and title slots in the header", async () => {
        const el = await fixture(html`
            <y-appbar>
                <img slot="logo" src="" alt="Logo" />
                <span slot="title">My App</span>
            </y-appbar>
        `);
        const logoSlot = el.shadowRoot.querySelector('slot[name="logo"]');
        const titleSlot = el.shadowRoot.querySelector('slot[name="title"]');

        expect(logoSlot).to.not.be.null;
        expect(titleSlot).to.not.be.null;

        const logoAssigned = logoSlot.assignedNodes({ flatten: true });
        expect(logoAssigned.length).to.be.greaterThan(0);
    });

    it("renders nav buttons from items attribute", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(".appbar-body y-button");
        expect(buttons.length).to.equal(3);
    });

    it("renders y-button elements with color and style-type", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const btn = el.shadowRoot.querySelector(".appbar-body y-button");
        expect(btn.getAttribute("color")).to.equal("base");
        expect(btn.getAttribute("style-type")).to.equal("flat");
    });

    it("renders icon, label, and arrow on items with children", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(".appbar-body y-button");
        const settingsBtn = buttons[2]; // "Settings" has children

        expect(settingsBtn.querySelector('[slot="left-icon"]')).to.not.be.null;
        expect(settingsBtn.textContent).to.include("Settings");
        expect(settingsBtn.querySelector('[slot="right-icon"]')).to.not.be.null;
    });

    it("creates a y-menu for items with children", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const menus = el.shadowRoot.querySelectorAll("y-menu");
        expect(menus.length).to.equal(1);

        const menuItems = menus[0].items;
        expect(menuItems.length).to.equal(2);
    });

    it("omits labels and arrows when collapsed", async () => {
        const el = await fixture(html`
            <y-appbar collapsed .items=${sampleItems}></y-appbar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(".appbar-body y-button");
        // Icons still present
        expect(buttons[0].querySelector('[slot="left-icon"]')).to.not.be.null;
        // Labels and right-icon arrows should not be rendered
        expect(buttons[2].querySelector('[slot="right-icon"]')).to.be.null;
        expect(buttons[2].textContent.trim()).to.equal("");
    });

    it("hides title when collapsed", async () => {
        const el = await fixture(html`
            <y-appbar collapsed>
                <span slot="title">My App</span>
            </y-appbar>
        `);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include(".appbar.vertical.collapsed .header-title");
        expect(style).to.include("display: none");
    });

    it("renders a collapse button in vertical mode", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        expect(collapseBtn).to.not.be.null;
        expect(collapseBtn.tagName.toLowerCase()).to.equal("y-button");
        expect(collapseBtn.getAttribute("aria-label")).to.equal(
            "Collapse sidebar",
        );
    });

    it("does not render a collapse button in horizontal mode", async () => {
        const el = await fixture(
            html`<y-appbar orientation="horizontal"></y-appbar>`,
        );
        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        expect(collapseBtn).to.be.null;
    });

    it("collapse button toggles collapsed state", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.collapsed).to.be.false;

        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        collapseBtn.click();
        expect(el.collapsed).to.be.true;
    });

    it("collapse button shows expand icon when collapsed", async () => {
        const el = await fixture(html`<y-appbar collapsed></y-appbar>`);
        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        expect(collapseBtn.getAttribute("aria-label")).to.equal(
            "Expand sidebar",
        );
    });

    it("footer slot receives assigned nodes", async () => {
        const el = await fixture(html`
            <y-appbar>
                <span slot="footer">User</span>
            </y-appbar>
        `);
        const footerSlot = el.shadowRoot.querySelector('slot[name="footer"]');
        const assigned = footerSlot.assignedNodes({ flatten: true });
        expect(assigned.length).to.be.greaterThan(0);
        expect(assigned[0].textContent).to.equal("User");
    });

    it("re-renders when orientation changes", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        let bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("vertical")).to.be.true;

        el.setAttribute("orientation", "horizontal");
        bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("horizontal")).to.be.true;
    });

    it("re-renders when collapsed changes", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        let bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("collapsed")).to.be.false;

        el.setAttribute("collapsed", "");
        bar = el.shadowRoot.querySelector(".appbar");
        expect(bar.classList.contains("collapsed")).to.be.true;
    });

    it("has three structural sections", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        const header = el.shadowRoot.querySelector(".appbar-header");
        const body = el.shadowRoot.querySelector(".appbar-body");
        const footer = el.shadowRoot.querySelector(".appbar-footer");

        expect(header).to.not.be.null;
        expect(body).to.not.be.null;
        expect(footer).to.not.be.null;
    });

    it("sets collapsed property via setter", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.collapsed = true;
        expect(el.hasAttribute("collapsed")).to.be.true;
        el.collapsed = false;
        expect(el.hasAttribute("collapsed")).to.be.false;
    });

    it("sets orientation property via setter", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.orientation = "horizontal";
        expect(el.getAttribute("orientation")).to.equal("horizontal");
    });

    it("parses items from JSON attribute", async () => {
        const json = JSON.stringify(sampleItems);
        const el = await fixture(html`<y-appbar items="${json}"></y-appbar>`);
        expect(el.items.length).to.equal(3);
        expect(el.items[0].text).to.equal("Home");
    });

    it("sets items via property setter", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.items = sampleItems;
        expect(el.items.length).to.equal(3);
        const buttons = el.shadowRoot.querySelectorAll(".appbar-body y-button");
        expect(buttons.length).to.equal(3);
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.size).to.equal("medium");
    });

    it("accepts small size and passes it to buttons", async () => {
        const el = await fixture(html`
            <y-appbar size="small" .items=${sampleItems}></y-appbar>
        `);
        expect(el.size).to.equal("small");
        const btn = el.shadowRoot.querySelector(".appbar-body y-button");
        expect(btn.getAttribute("size")).to.equal("small");
    });

    it("accepts large size and passes it to buttons", async () => {
        const el = await fixture(html`
            <y-appbar size="large" .items=${sampleItems}></y-appbar>
        `);
        expect(el.size).to.equal("large");
        const btn = el.shadowRoot.querySelector(".appbar-body y-button");
        expect(btn.getAttribute("size")).to.equal("large");
    });

    it("passes size to collapse button", async () => {
        const el = await fixture(html`<y-appbar size="large"></y-appbar>`);
        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        expect(collapseBtn.getAttribute("size")).to.equal("large");
    });

    it("sets size property via setter", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");
    });

    it("sets menu direction to 'right' on vertical menus by default", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.getAttribute("direction")).to.equal("right");
    });

    it("sets menu direction to 'down' on horizontal menus by default", async () => {
        const el = await fixture(html`
            <y-appbar orientation="horizontal" .items=${sampleItems}></y-appbar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.getAttribute("direction")).to.equal("down");
    });

    it("allows overriding menu-direction on vertical appbar", async () => {
        const el = await fixture(html`
            <y-appbar menu-direction="down" .items=${sampleItems}></y-appbar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.getAttribute("direction")).to.equal("down");
    });

    it("defaults menuDirection to empty string", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.menuDirection).to.equal("");
    });

    it("sets menuDirection via property setter", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.menuDirection = "down";
        expect(el.getAttribute("menu-direction")).to.equal("down");
    });

    // ── Icon name support ────────────────────────────────────────

    it("renders y-icon elements when item.icon is a name string", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            ".appbar-body y-button y-icon",
        );
        expect(icons.length).to.equal(3);
    });

    it("sets correct name attribute on y-icon from item.icon", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            ".appbar-body y-button y-icon",
        );
        expect(icons[0].getAttribute("name")).to.equal("home");
        expect(icons[1].getAttribute("name")).to.equal("search");
        expect(icons[2].getAttribute("name")).to.equal("settings");
    });

    it("matches icon size to appbar size (default medium)", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".appbar-body y-button y-icon",
        );
        expect(icon.getAttribute("size")).to.equal("medium");
    });

    it("scales icon size with appbar size='small'", async () => {
        const el = await fixture(html`
            <y-appbar size="small" .items=${namedIconItems}></y-appbar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".appbar-body y-button y-icon",
        );
        expect(icon.getAttribute("size")).to.equal("small");
    });

    it("scales icon size with appbar size='large'", async () => {
        const el = await fixture(html`
            <y-appbar size="large" .items=${namedIconItems}></y-appbar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".appbar-body y-button y-icon",
        );
        expect(icon.getAttribute("size")).to.equal("large");
    });

    it("assigns left-icon slot to y-icon elements", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".appbar-body y-button y-icon",
        );
        expect(icon.slot).to.equal("left-icon");
    });

    it("exposes part='icon' on y-icon elements for external styling", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".appbar-body y-button y-icon",
        );
        expect(icon.getAttribute("part")).to.equal("icon");
    });

    it("exposes part='icon' on raw SVG icon spans for external styling", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const span = el.shadowRoot.querySelector(
            '.appbar-body y-button span[slot="left-icon"]',
        );
        expect(span.getAttribute("part")).to.equal("icon");
    });

    it("still renders raw SVG icons via span when icon starts with '<'", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const spans = el.shadowRoot.querySelectorAll(
            '.appbar-body y-button span[slot="left-icon"]',
        );
        expect(spans.length).to.equal(3);
        expect(spans[0].innerHTML).to.include("<svg");
    });

    it("does not create y-icon when item.icon is raw SVG", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            ".appbar-body y-button y-icon",
        );
        expect(icons.length).to.equal(0);
    });

    it("renders named icons in collapsed state", async () => {
        const el = await fixture(html`
            <y-appbar collapsed .items=${namedIconItems}></y-appbar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            ".appbar-body y-button y-icon",
        );
        expect(icons.length).to.equal(3);
        expect(icons[0].getAttribute("name")).to.equal("home");
    });

    it("renders item without icon when icon property is absent", async () => {
        const items = [{ text: "Plain" }];
        const el = await fixture(html` <y-appbar .items=${items}></y-appbar> `);
        const btn = el.shadowRoot.querySelector(".appbar-body y-button");
        expect(btn.querySelector('[slot="left-icon"]')).to.be.null;
    });

    it("renders a named slot when item has a slot property", async () => {
        const items = [{ text: "Custom", slot: "custom-item" }];
        const el = await fixture(html`
            <y-appbar .items=${items}>
                <div slot="custom-item">Custom Content</div>
            </y-appbar>
        `);
        const slot = el.shadowRoot.querySelector('slot[name="custom-item"]');
        expect(slot).to.not.be.null;
    });

    it("shows slotted content when item.slot matches a light DOM element", async () => {
        const items = [{ text: "Custom", slot: "custom-item" }];
        const el = await fixture(html`
            <y-appbar .items=${items}>
                <span slot="custom-item" id="my-custom">My Widget</span>
            </y-appbar>
        `);
        const slot = el.shadowRoot.querySelector('slot[name="custom-item"]');
        const assigned = slot.assignedNodes();
        expect(assigned.length).to.equal(1);
        expect(assigned[0].textContent).to.equal("My Widget");
    });

    it("falls back to default button when item.slot is set but no light DOM element matches", async () => {
        const items = [{ text: "Fallback", slot: "missing-slot" }];
        const el = await fixture(html` <y-appbar .items=${items}></y-appbar> `);
        const slot = el.shadowRoot.querySelector('slot[name="missing-slot"]');
        expect(slot).to.not.be.null;
        const btn = slot.querySelector("y-button");
        expect(btn).to.not.be.null;
        expect(btn.textContent).to.include("Fallback");
    });

    it("renders default button when item has no slot property", async () => {
        const items = [{ text: "Normal" }];
        const el = await fixture(html` <y-appbar .items=${items}></y-appbar> `);
        const wrapper = el.shadowRoot.querySelector(".nav-item");
        const btn = wrapper.querySelector("y-button");
        expect(btn).to.not.be.null;
        // No slot wrapper around the button
        expect(wrapper.querySelector("slot")).to.be.null;
    });
});
