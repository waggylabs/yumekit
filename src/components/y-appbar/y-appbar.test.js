import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "../../icons/all.js";
import "./y-appbar.js";

describe("YumeAppbar", () => {
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

    it("renders the appbar with role navigation", async () => {
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

    it("exposes a default slot for user-supplied link elements", async () => {
        const el = await fixture(html`
            <y-appbar>
                <a href="/a">A</a>
                <a href="/b">B</a>
            </y-appbar>
        `);
        const navSlot = el.shadowRoot.querySelector(
            ".appbar-body slot:not([name])",
        );
        expect(navSlot).to.not.be.null;
        const assigned = navSlot.assignedElements();
        expect(assigned.length).to.equal(2);
        expect(assigned[0].getAttribute("href")).to.equal("/a");
    });

    it("renders items and slotted nav together", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}>
                <a href="/extra">Extra</a>
            </y-appbar>
        `);
        const buttons = el.shadowRoot.querySelectorAll(".appbar-body y-button");
        expect(buttons.length).to.equal(3);
        const navSlot = el.shadowRoot.querySelector(
            ".appbar-body slot:not([name])",
        );
        expect(navSlot.assignedElements().length).to.equal(1);
    });

    it("renders y-button elements with color and variant", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const btn = el.shadowRoot.querySelector(".appbar-body y-button");
        expect(btn.getAttribute("color")).to.equal("base");
        expect(btn.getAttribute("variant")).to.equal("flat");
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

    it("re-renders when items change", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(
            el.shadowRoot.querySelectorAll(".appbar-body y-button").length,
        ).to.equal(0);

        el.items = sampleItems;
        expect(
            el.shadowRoot.querySelectorAll(".appbar-body y-button").length,
        ).to.equal(3);
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

    it("mirrors a JSON string assigned to items instead of double-encoding it", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        const json = JSON.stringify(sampleItems);
        el.items = json;
        expect(el.getAttribute("items")).to.equal(json);
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

    it("sets size property via setter", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");
    });

    it("sets menu direction to 'down' by default", async () => {
        const el = await fixture(html`
            <y-appbar .items=${sampleItems}></y-appbar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.getAttribute("direction")).to.equal("down");
    });

    it("allows overriding menu-direction", async () => {
        const el = await fixture(html`
            <y-appbar menu-direction="right" .items=${sampleItems}></y-appbar>
        `);
        const menu = el.shadowRoot.querySelector("y-menu");
        expect(menu.getAttribute("direction")).to.equal("right");
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
            '.appbar-body y-button y-icon[slot="left-icon"]',
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
        expect(icons[1].getAttribute("name")).to.equal("magnifying-glass");
        expect(icons[2].getAttribute("name")).to.equal("gear");
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

    it("renders named icons on items", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        const icons = el.shadowRoot.querySelectorAll(
            '.appbar-body y-button y-icon[slot="left-icon"]',
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

    it("marks the active item with aria-current=page", async () => {
        const items = [
            { text: "Home", icon: "home", href: "/" },
            { text: "Active", icon: "gear", selected: true },
        ];
        const el = await fixture(html`<y-appbar .items=${items}></y-appbar>`);
        const buttons = el.shadowRoot.querySelectorAll(".appbar-body y-button");

        expect(buttons[0].hasAttribute("aria-current")).to.be.false;
        expect(buttons[1].getAttribute("aria-current")).to.equal("page");
    });

    it("marks the active item with aria-current=page in mobile layout", async () => {
        const items = [
            { text: "Home", icon: "home", href: "/" },
            { text: "Active", icon: "gear", selected: true },
        ];
        const el = await fixture(html`<y-appbar .items=${items}></y-appbar>`);
        el._isMobile = true;
        el.render();

        const panel = el.shadowRoot.querySelector(".mobile-panel");
        const buttons = panel.querySelectorAll(".nav-item y-button");

        expect(buttons[0].hasAttribute("aria-current")).to.be.false;
        expect(buttons[1].getAttribute("aria-current")).to.equal("page");
    });

    // ── sticky attribute ─────────────────────────────────────────

    it("sticky getter returns false when sticky attribute is absent", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.sticky).to.be.false;
    });

    it("sticky getter returns 'start' when sticky='start'", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        expect(el.sticky).to.equal("start");
    });

    it("sticky getter returns 'end' when sticky='end'", async () => {
        const el = await fixture(html`<y-appbar sticky="end"></y-appbar>`);
        expect(el.sticky).to.equal("end");
    });

    it("sticky getter returns false for an invalid sticky value", async () => {
        const el = await fixture(html`<y-appbar sticky="middle"></y-appbar>`);
        expect(el.sticky).to.be.false;
    });

    it("sticky setter sets the sticky attribute to 'start'", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.sticky = "start";
        expect(el.getAttribute("sticky")).to.equal("start");
    });

    it("sticky setter sets the sticky attribute to 'end'", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.sticky = "end";
        expect(el.getAttribute("sticky")).to.equal("end");
    });

    it("sticky setter removes the attribute when set to false", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        el.sticky = false;
        expect(el.hasAttribute("sticky")).to.be.false;
    });

    it("sticky setter removes the attribute when set to an invalid value", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        el.sticky = "middle";
        expect(el.hasAttribute("sticky")).to.be.false;
    });

    it("includes sticky CSS rules in the rendered style block", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include(":host([sticky])");
        expect(style).to.include("position: sticky");
    });

    it("sticky border uses the border-width shorthand so multi-value tokens (e.g. waggy) render", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        // A single-edge `border-bottom: <4-value token>` is invalid CSS; the
        // shorthand `border-width` accepts per-side values, so the content-edge
        // border renders for themes that set asymmetric widths.
        expect(style).to.include(
            "border-width: var(--component-appbar-border-width",
        );
        expect(style).to.not.include("border: none");
    });

    it("sticky=start keeps the content-facing (bottom) border and drops the screen-flush edges", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border-top-width: 0;");
        expect(style).to.include("border-left-width: 0;");
        expect(style).to.include("border-right-width: 0;");
    });

    it("sticky=end drops the bottom (screen-flush) edge instead of the top", async () => {
        const el = await fixture(html`<y-appbar sticky="end"></y-appbar>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border-bottom-width: 0;");
    });

    // ── mobileBreakpoint getter/setter ───────────────────────────

    it("mobileBreakpoint getter returns empty string when attribute is absent", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.mobileBreakpoint).to.equal("");
    });

    it("mobileBreakpoint setter stores the value as an attribute", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el.mobileBreakpoint = "1024";
        expect(el.getAttribute("mobile-breakpoint")).to.equal("1024");
    });

    it("mobileBreakpoint setter removes the attribute when set to empty", async () => {
        const el = await fixture(
            html`<y-appbar mobile-breakpoint="600"></y-appbar>`,
        );
        el.mobileBreakpoint = "";
        expect(el.hasAttribute("mobile-breakpoint")).to.be.false;
    });

    // ── mobile getter ────────────────────────────────────────────

    it("mobile getter is false when not in mobile viewport", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        expect(el.mobile).to.be.false;
    });

    it("mobile getter is false when breakpoint is 1px", async () => {
        // Breakpoint of 1px means no normal viewport will match
        const el = await fixture(
            html`<y-appbar mobile-breakpoint="1"></y-appbar>`,
        );
        expect(el.mobile).to.be.false;
    });

    // ── _renderMobile path ───────────────────────────────────────

    it("renders mobile layout when _isMobile is set to true and render() is called", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el._isMobile = true;
        el.render();

        const appbar = el.shadowRoot.querySelector(".appbar");
        expect(appbar).to.not.be.null;
        // Mobile layout uses mobile-start / mobile-center / mobile-end sections
        expect(el.shadowRoot.querySelector(".mobile-start")).to.not.be.null;
        expect(el.shadowRoot.querySelector(".mobile-center")).to.not.be.null;
        expect(el.shadowRoot.querySelector(".mobile-end")).to.not.be.null;
    });

    it("mobile layout contains a hamburger y-button with aria-label 'Open menu'", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el._isMobile = true;
        el.render();

        const menuBtn = el.shadowRoot.querySelector(".mobile-start y-button");
        expect(menuBtn).to.not.be.null;
        expect(menuBtn.getAttribute("aria-label")).to.equal("Open menu");
    });

    it("mobile layout panel renders no nav items when items are absent", async () => {
        const el = await fixture(html`<y-appbar></y-appbar>`);
        el._isMobile = true;
        el.render();

        const panel = el.shadowRoot.querySelector(".mobile-panel");
        expect(panel).to.not.be.null;
        expect(panel.querySelectorAll(".nav-item").length).to.equal(0);
    });

    it("mobile layout includes logo and title slots in the center section", async () => {
        const el = await fixture(html`
            <y-appbar>
                <img slot="logo" src="" alt="Logo" />
                <span slot="title">App</span>
            </y-appbar>
        `);
        el._isMobile = true;
        el.render();

        const center = el.shadowRoot.querySelector(".mobile-center");
        const logoSlot = center.querySelector('slot[name="logo"]');
        const titleSlot = center.querySelector('slot[name="title"]');
        expect(logoSlot).to.not.be.null;
        expect(titleSlot).to.not.be.null;
    });

    it("mobile layout includes footer slot in the end section", async () => {
        const el = await fixture(html`
            <y-appbar>
                <span slot="footer">User</span>
            </y-appbar>
        `);
        el._isMobile = true;
        el.render();

        const endSection = el.shadowRoot.querySelector(".mobile-end");
        const footerSlot = endSection.querySelector('slot[name="footer"]');
        expect(footerSlot).to.not.be.null;
        if (footerSlot.assignedNodes({ flatten: true }).length === 0) {
            await oneEvent(footerSlot, "slotchange");
        }
        expect(
            footerSlot.assignedNodes({ flatten: true }).length,
        ).to.be.greaterThan(0);
    });

    it("mobile dropdown panel renders items as nav buttons", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        el._isMobile = true;
        el.render();

        const panel = el.shadowRoot.querySelector(".mobile-panel");
        expect(panel).to.not.be.null;
        const buttons = panel.querySelectorAll(".nav-item y-button");
        expect(buttons.length).to.equal(3);
    });

    it("mobile dropdown panel exposes a default slot after items", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}>
                <a href="/extra">Extra</a>
            </y-appbar>
        `);
        el._isMobile = true;
        el.render();

        const panel = el.shadowRoot.querySelector(".mobile-panel");
        const navSlot = panel.querySelector("slot:not([name])");
        expect(navSlot).to.not.be.null;
        const items = panel.querySelectorAll(".nav-item");
        expect(items.length).to.equal(3);
        // Slot must follow the items in DOM order (same priority as desktop).
        const children = Array.from(panel.children);
        const lastItem = children.findIndex((c) =>
            c.classList.contains("nav-item"),
        );
        const slotIdx = children.indexOf(navSlot);
        expect(slotIdx).to.be.greaterThan(lastItem);
        if (navSlot.assignedElements().length === 0) {
            await oneEvent(navSlot, "slotchange");
        }
        expect(navSlot.assignedElements().length).to.equal(1);
    });

    it("mobile hamburger toggles the dropdown panel open", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        el._isMobile = true;
        el.render();

        const menuBtn = el.shadowRoot.querySelector(".mobile-start y-button");
        const panel = el.shadowRoot.querySelector(".mobile-panel");
        expect(panel.classList.contains("open")).to.be.false;
        menuBtn.click();
        expect(panel.classList.contains("open")).to.be.true;
        expect(menuBtn.getAttribute("aria-expanded")).to.equal("true");
        menuBtn.click();
        expect(panel.classList.contains("open")).to.be.false;
    });

    it("mobile panel closes when a nav item with href is clicked", async () => {
        const el = await fixture(html`
            <y-appbar .items=${namedIconItems}></y-appbar>
        `);
        el._isMobile = true;
        el.render();

        const menuBtn = el.shadowRoot.querySelector(".mobile-start y-button");
        const panel = el.shadowRoot.querySelector(".mobile-panel");

        menuBtn.click();
        expect(panel.classList.contains("open")).to.be.true;

        // Home is the first item and has href: "/"
        const homeBtn = panel.querySelector(".nav-item y-button");
        homeBtn.click();

        expect(panel.classList.contains("open")).to.be.false;
        expect(menuBtn.getAttribute("aria-expanded")).to.equal("false");
    });

    it("mobile layout passes size to the hamburger menu button", async () => {
        const el = await fixture(html`<y-appbar size="large"></y-appbar>`);
        el._isMobile = true;
        el.render();

        const menuBtn = el.shadowRoot.querySelector(".mobile-start y-button");
        expect(menuBtn.getAttribute("size")).to.equal("large");
    });

    it("mobile layout sticky CSS uses position sticky and full width", async () => {
        const el = await fixture(html`<y-appbar sticky="start"></y-appbar>`);
        el._isMobile = true;
        el.render();

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include(":host([sticky])");
        expect(style).to.include("position: sticky");
        expect(style).to.include("width: 100%");
    });
});
