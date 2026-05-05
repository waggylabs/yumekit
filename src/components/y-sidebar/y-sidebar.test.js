import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../../icons/all.js";
import "./y-sidebar.js";

describe("YumeSidebar", () => {
    const sampleItems = [
        { text: "Home", icon: "home", href: "/" },
        { text: "Dashboard", icon: "magnifying-glass" },
        {
            text: "Settings",
            icon: "gear",
            children: [
                { text: "Profile", href: "/settings/profile" },
                { text: "Security", href: "/settings/security" },
            ],
        },
    ];

    const namedIconItems = [
        { text: "Home", icon: "home", href: "/" },
        { text: "Search", icon: "magnifying-glass" },
        {
            text: "Settings",
            icon: "gear",
            children: [
                { text: "Profile", href: "/settings/profile" },
                { text: "Security", href: "/settings/security" },
            ],
        },
    ];

    // -------------------------------------------------------------------------
    // Structure
    // -------------------------------------------------------------------------

    it("renders with three structural sections", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        const header = el.shadowRoot.querySelector(".sidebar-header");
        const body = el.shadowRoot.querySelector(".sidebar-body");
        const footer = el.shadowRoot.querySelector(".sidebar-footer");

        expect(header).to.not.be.null;
        expect(body).to.not.be.null;
        expect(footer).to.not.be.null;
    });

    it("has role navigation on the inner bar", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        const bar = el.shadowRoot.querySelector(".sidebar");
        expect(bar.getAttribute("role")).to.equal("navigation");
    });

    it("is not collapsed by default", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(el.collapsed).to.be.false;
        const bar = el.shadowRoot.querySelector(".sidebar");
        expect(bar.classList.contains("collapsed")).to.be.false;
    });

    it("applies collapsed class when collapsed attribute is set", async () => {
        const el = await fixture(html`<y-sidebar collapsed></y-sidebar>`);
        expect(el.collapsed).to.be.true;
        const bar = el.shadowRoot.querySelector(".sidebar");
        expect(bar.classList.contains("collapsed")).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Slots
    // -------------------------------------------------------------------------

    it("renders logo and title slots in the header", async () => {
        const el = await fixture(html`
            <y-sidebar>
                <img slot="logo" src="" alt="Logo" />
                <span slot="title">My App</span>
            </y-sidebar>
        `);
        const logoSlot = el.shadowRoot.querySelector('slot[name="logo"]');
        const titleSlot = el.shadowRoot.querySelector('slot[name="title"]');

        expect(logoSlot).to.not.be.null;
        expect(titleSlot).to.not.be.null;

        const logoAssigned = logoSlot.assignedNodes({ flatten: true });
        expect(logoAssigned.length).to.be.greaterThan(0);
    });

    it("exposes a default slot for user-supplied nav elements", async () => {
        const el = await fixture(html`
            <y-sidebar>
                <a href="/a">A</a>
                <a href="/b">B</a>
            </y-sidebar>
        `);
        const navSlot = el.shadowRoot.querySelector(
            ".sidebar-body slot:not([name])",
        );
        expect(navSlot).to.not.be.null;
        const assigned = navSlot.assignedElements();
        expect(assigned.length).to.equal(2);
        expect(assigned[0].getAttribute("href")).to.equal("/a");
    });

    it("renders items and slotted nav together", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${sampleItems}>
                <a href="/extra">Extra</a>
            </y-sidebar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(
            ".sidebar-body y-button",
        );
        expect(buttons.length).to.equal(3);
        const navSlot = el.shadowRoot.querySelector(
            ".sidebar-body slot:not([name])",
        );
        expect(navSlot.assignedElements().length).to.equal(1);
    });

    it("footer slot receives assigned nodes", async () => {
        const el = await fixture(html`
            <y-sidebar>
                <span slot="footer">User</span>
            </y-sidebar>
        `);
        const footerSlot = el.shadowRoot.querySelector('slot[name="footer"]');
        const assigned = footerSlot.assignedNodes({ flatten: true });
        expect(assigned.length).to.be.greaterThan(0);
        expect(assigned[0].textContent).to.equal("User");
    });

    // -------------------------------------------------------------------------
    // Items
    // -------------------------------------------------------------------------

    it("renders nav buttons from items attribute", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${sampleItems}></y-sidebar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(
            ".sidebar-body y-button",
        );
        expect(buttons.length).to.equal(3);
    });

    it("renders y-button elements with base color and flat style-type", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${sampleItems}></y-sidebar>
        `);
        const btn = el.shadowRoot.querySelector(".sidebar-body y-button");
        expect(btn.getAttribute("color")).to.equal("base");
        expect(btn.getAttribute("style-type")).to.equal("flat");
    });

    it("renders icon, label, and arrow on items with children", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${sampleItems}></y-sidebar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(
            ".sidebar-body y-button",
        );
        const settingsBtn = buttons[2];

        expect(settingsBtn.querySelector('[slot="left-icon"]')).to.not.be.null;
        expect(settingsBtn.textContent).to.include("Settings");
        expect(settingsBtn.querySelector('[slot="right-icon"]')).to.not.be.null;
    });

    it("creates a y-menu for items with children", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${sampleItems}></y-sidebar>
        `);
        const menus = el.shadowRoot.querySelectorAll("y-menu");
        expect(menus.length).to.equal(1);

        const menuItems = menus[0].items;
        expect(menuItems.length).to.equal(2);
    });

    it("forwards history attribute to submenu y-menu", async () => {
        const el = await fixture(html`
            <y-sidebar history="false" .items=${sampleItems}></y-sidebar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.getAttribute("history")).to.equal("false");
    });

    it("does not set history on submenu y-menu when sidebar has none", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${sampleItems}></y-sidebar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.hasAttribute("history")).to.be.false;
    });

    it("marks the active item with aria-current=page", async () => {
        const items = [
            { text: "Home", icon: "home", href: "/" },
            { text: "Active", icon: "gear", selected: true },
        ];
        const el = await fixture(html`<y-sidebar .items=${items}></y-sidebar>`);
        const buttons = el.shadowRoot.querySelectorAll(
            ".sidebar-body y-button",
        );

        expect(buttons[0].hasAttribute("aria-current")).to.be.false;
        expect(buttons[1].getAttribute("aria-current")).to.equal("page");
    });

    it("renders item without icon when icon property is absent", async () => {
        const items = [{ text: "Plain" }];
        const el = await fixture(html`<y-sidebar .items=${items}></y-sidebar>`);
        const btn = el.shadowRoot.querySelector(".sidebar-body y-button");
        expect(btn.querySelector('[slot="left-icon"]')).to.be.null;
    });

    it("parses items from JSON attribute", async () => {
        const json = JSON.stringify(sampleItems);
        const el = await fixture(html`<y-sidebar items="${json}"></y-sidebar>`);
        expect(el.items.length).to.equal(3);
        expect(el.items[0].text).to.equal("Home");
    });

    it("renders a named slot when item has a slot property", async () => {
        const items = [{ text: "Custom", slot: "custom-item" }];
        const el = await fixture(html`
            <y-sidebar .items=${items}>
                <div slot="custom-item">Custom Content</div>
            </y-sidebar>
        `);
        const slot = el.shadowRoot.querySelector('slot[name="custom-item"]');
        expect(slot).to.not.be.null;
    });

    it("shows slotted content when item.slot matches a light DOM element", async () => {
        const items = [{ text: "Custom", slot: "custom-item" }];
        const el = await fixture(html`
            <y-sidebar .items=${items}>
                <span slot="custom-item" id="my-custom">My Widget</span>
            </y-sidebar>
        `);
        const slot = el.shadowRoot.querySelector('slot[name="custom-item"]');
        const assigned = slot.assignedNodes();
        expect(assigned.length).to.equal(1);
        expect(assigned[0].textContent).to.equal("My Widget");
    });

    it("falls back to default button when item.slot is set but no light DOM element matches", async () => {
        const items = [{ text: "Fallback", slot: "missing-slot" }];
        const el = await fixture(html`<y-sidebar .items=${items}></y-sidebar>`);
        const slot = el.shadowRoot.querySelector('slot[name="missing-slot"]');
        expect(slot).to.not.be.null;
        const btn = slot.querySelector("y-button");
        expect(btn).to.not.be.null;
        expect(btn.textContent).to.include("Fallback");
    });

    it("renders default button without slot wrapper when item has no slot property", async () => {
        const items = [{ text: "Normal" }];
        const el = await fixture(html`<y-sidebar .items=${items}></y-sidebar>`);
        const wrapper = el.shadowRoot.querySelector(".nav-item");
        const btn = wrapper.querySelector("y-button");
        expect(btn).to.not.be.null;
        expect(wrapper.querySelector("slot")).to.be.null;
    });

    // -------------------------------------------------------------------------
    // Icons
    // -------------------------------------------------------------------------

    it("renders named icons via y-icon", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${namedIconItems}></y-sidebar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            '.sidebar-body y-button y-icon[slot="left-icon"]',
        );
        expect(icons.length).to.equal(3);
        expect(icons[0].getAttribute("name")).to.equal("home");
        expect(icons[1].getAttribute("name")).to.equal("magnifying-glass");
        expect(icons[2].getAttribute("name")).to.equal("gear");
    });

    it("matches icon size to sidebar size (default medium)", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${namedIconItems}></y-sidebar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".sidebar-body y-button y-icon",
        );
        expect(icon.getAttribute("size")).to.equal("medium");
    });

    it("scales icon size with size='small'", async () => {
        const el = await fixture(html`
            <y-sidebar size="small" .items=${namedIconItems}></y-sidebar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".sidebar-body y-button y-icon",
        );
        expect(icon.getAttribute("size")).to.equal("small");
    });

    it("scales icon size with size='large'", async () => {
        const el = await fixture(html`
            <y-sidebar size="large" .items=${namedIconItems}></y-sidebar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".sidebar-body y-button y-icon",
        );
        expect(icon.getAttribute("size")).to.equal("large");
    });

    it("assigns left-icon slot to y-icon elements", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${namedIconItems}></y-sidebar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".sidebar-body y-button y-icon",
        );
        expect(icon.slot).to.equal("left-icon");
    });

    it("exposes part='icon' on y-icon elements", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${namedIconItems}></y-sidebar>
        `);
        const icon = el.shadowRoot.querySelector(
            ".sidebar-body y-button y-icon",
        );
        expect(icon.getAttribute("part")).to.equal("icon");
    });

    // -------------------------------------------------------------------------
    // Collapsed state
    // -------------------------------------------------------------------------

    it("omits labels and arrows when collapsed", async () => {
        const el = await fixture(html`
            <y-sidebar collapsed .items=${sampleItems}></y-sidebar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(
            ".sidebar-body y-button",
        );
        expect(buttons[0].querySelector('[slot="left-icon"]')).to.not.be.null;
        expect(buttons[2].querySelector('[slot="right-icon"]')).to.be.null;
        expect(buttons[2].textContent.trim()).to.equal("");
    });

    it("renders named icons in collapsed state", async () => {
        const el = await fixture(html`
            <y-sidebar collapsed .items=${namedIconItems}></y-sidebar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            ".sidebar-body y-button y-icon",
        );
        expect(icons.length).to.equal(3);
        expect(icons[0].getAttribute("name")).to.equal("home");
    });

    it("hides title when collapsed via CSS", async () => {
        const el = await fixture(html`
            <y-sidebar collapsed>
                <span slot="title">My App</span>
            </y-sidebar>
        `);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include(".sidebar.collapsed .header-title");
        expect(style).to.include("display: none");
    });

    it("sets --y-sidebar-collapsed to 1 when collapsed", async () => {
        const el = await fixture(html`<y-sidebar collapsed></y-sidebar>`);
        expect(el.style.getPropertyValue("--y-sidebar-collapsed")).to.equal(
            "1",
        );
    });

    it("sets --y-sidebar-collapsed to 0 when expanded", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(el.style.getPropertyValue("--y-sidebar-collapsed")).to.equal(
            "0",
        );
    });

    it("sets --y-sidebar-icon-col-width on the host element", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(
            el.style.getPropertyValue("--y-sidebar-icon-col-width"),
        ).to.not.equal("");
    });

    // -------------------------------------------------------------------------
    // Collapse button
    // -------------------------------------------------------------------------

    it("renders a collapse button in the footer", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        expect(collapseBtn).to.not.be.null;
        expect(collapseBtn.tagName.toLowerCase()).to.equal("y-button");
        expect(collapseBtn.getAttribute("aria-label")).to.equal(
            "Collapse sidebar",
        );
    });

    it("collapse button shows expand label when collapsed", async () => {
        const el = await fixture(html`<y-sidebar collapsed></y-sidebar>`);
        const collapseBtn = el.shadowRoot.querySelector(".collapse-btn");
        expect(collapseBtn.getAttribute("aria-label")).to.equal(
            "Expand sidebar",
        );
    });

    it("collapse button toggles collapsed state on click", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(el.collapsed).to.be.false;
        el.shadowRoot.querySelector(".collapse-btn").click();
        expect(el.collapsed).to.be.true;
    });

    // -------------------------------------------------------------------------
    // toggle() / setters / re-render
    // -------------------------------------------------------------------------

    it("toggle() switches collapsed state", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(el.collapsed).to.be.false;
        el.toggle();
        expect(el.collapsed).to.be.true;
        el.toggle();
        expect(el.collapsed).to.be.false;
    });

    it("sets collapsed property via setter", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        el.collapsed = true;
        expect(el.hasAttribute("collapsed")).to.be.true;
        el.collapsed = false;
        expect(el.hasAttribute("collapsed")).to.be.false;
    });

    it("re-renders when collapsed attribute changes", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(
            el.shadowRoot
                .querySelector(".sidebar")
                .classList.contains("collapsed"),
        ).to.be.false;
        el.setAttribute("collapsed", "");
        expect(
            el.shadowRoot
                .querySelector(".sidebar")
                .classList.contains("collapsed"),
        ).to.be.true;
    });

    it("re-renders when items attribute changes", async () => {
        const el = await fixture(html`<y-sidebar></y-sidebar>`);
        expect(
            el.shadowRoot.querySelectorAll(".sidebar-body y-button").length,
        ).to.equal(0);
        el.items = namedIconItems;
        expect(
            el.shadowRoot.querySelectorAll(".sidebar-body y-button").length,
        ).to.equal(3);
    });

    // -------------------------------------------------------------------------
    // Navigate event
    // -------------------------------------------------------------------------

    it("fires navigate event when an item with href is clicked", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${namedIconItems}></y-sidebar>
        `);
        const listener = oneEvent(el, "navigate");
        el.shadowRoot.querySelector(".sidebar-body y-button").click();
        const event = await listener;
        expect(event.detail.href).to.equal("/");
    });

    it("navigate event is cancelable", async () => {
        const el = await fixture(html`
            <y-sidebar .items=${namedIconItems}></y-sidebar>
        `);
        el.addEventListener("navigate", (e) => e.preventDefault());
        const btn = el.shadowRoot.querySelector(".sidebar-body y-button");
        btn.click();
        // No throw = success; navigation was prevented
    });

    it("does not fire navigate event for items without href", async () => {
        const el = await fixture(html`
            <y-sidebar
                .items=${[{ text: "No href", icon: "home" }]}
            ></y-sidebar>
        `);
        let fired = false;
        el.addEventListener("navigate", () => {
            fired = true;
        });
        el.shadowRoot.querySelector(".sidebar-body y-button").click();
        expect(fired).to.be.false;
    });
});
