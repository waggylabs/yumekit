import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-breadcrumbs.js";

const ITEMS_3 = JSON.stringify([
    { text: "Home", href: "/" },
    { text: "Products", href: "/products" },
    { text: "Widget" },
]);

const ITEMS_5 = JSON.stringify([
    { text: "Home", href: "/" },
    { text: "Products", href: "/products" },
    { text: "Category", href: "/products/category" },
    { text: "Sub-category", href: "/products/category/sub" },
    { text: "Widget" },
]);

const ITEMS_WITH_ICON = JSON.stringify([
    { text: "Home", href: "/", icon: "home" },
    { text: "Products", href: "/products" },
    { text: "Widget" },
]);

describe("YumeBreadcrumbs", () => {
    // ── Defaults ──────────────────────────────────────────────

    it("renders with default attributes", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const nav = el.shadowRoot.querySelector("nav");
        expect(nav).to.exist;
        expect(nav.getAttribute("aria-label")).to.equal("Breadcrumb");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.size).to.equal("medium");
    });

    it("defaults to null separator (chevron icon)", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.separator).to.be.null;
    });

    it("defaults to null maxItems", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.maxItems).to.be.null;
    });

    it("renders empty when no items", async () => {
        const el = await fixture(html`<y-breadcrumbs></y-breadcrumbs>`);
        expect(el.shadowRoot.querySelector("nav ol li")).to.not.exist;
    });

    // ── Rendering ─────────────────────────────────────────────

    it("renders correct number of items", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const items = el.shadowRoot.querySelectorAll("li.item:not(.expand)");
        expect(items.length).to.equal(3);
    });

    it("renders separators between items", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const separators = el.shadowRoot.querySelectorAll(".separator");
        expect(separators.length).to.equal(2);
    });

    it("renders links for non-last items with href", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const links = el.shadowRoot.querySelectorAll("a.link");
        expect(links.length).to.equal(2);
        expect(links[0].getAttribute("href")).to.equal("/");
        expect(links[1].getAttribute("href")).to.equal("/products");
    });

    it("renders last item as text, not a link", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const items = el.shadowRoot.querySelectorAll("li.item:not(.expand)");
        const lastItem = items[items.length - 1];

        expect(lastItem.querySelector("a")).to.not.exist;
        expect(lastItem.querySelector("span.current-text")).to.exist;
        expect(lastItem.querySelector("span.current-text").textContent).to.equal("Widget");
    });

    it("renders chevron-right icon as default separator", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const separator = el.shadowRoot.querySelector(".separator");
        const icon = separator.querySelector("y-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("chevron-right");
    });

    it("renders custom separator text", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_3}"
                separator=">"
            ></y-breadcrumbs>`,
        );

        const separator = el.shadowRoot.querySelector(".separator");
        expect(separator.textContent.trim()).to.equal(">");
    });

    it("renders y-icon when item has icon", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_WITH_ICON}"></y-breadcrumbs>`,
        );

        const icon = el.shadowRoot.querySelector("y-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("home");
    });

    it("renders custom icon slot", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}">
                <y-icon slot="0-icon" name="home"></y-icon>
            </y-breadcrumbs>`,
        );

        const slot = el.shadowRoot.querySelector('slot[name="0-icon"]');
        expect(slot).to.exist;
    });

    it("clones slotted separator into every separator position", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}">
                <y-icon slot="separator" name="arrow-right" size="small"></y-icon>
            </y-breadcrumbs>`,
        );

        const separators = el.shadowRoot.querySelectorAll(".separator");
        expect(separators.length).to.equal(2);

        separators.forEach((sep) => {
            const icon = sep.querySelector("y-icon");
            expect(icon).to.exist;
            expect(icon.getAttribute("name")).to.equal("arrow-right");
        });
    });

    // ── Collapse / expand ─────────────────────────────────────

    it("collapses middle items when max-items is set", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="3"
            ></y-breadcrumbs>`,
        );

        const expandBtn = el.shadowRoot.querySelector(".expand-btn");
        expect(expandBtn).to.exist;

        const visibleItems = el.shadowRoot.querySelectorAll(
            "li.item:not(.expand)",
        );
        expect(visibleItems.length).to.equal(3);
    });

    it("shows first item and last N-1 items when collapsed", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="3"
            ></y-breadcrumbs>`,
        );

        const items = el.shadowRoot.querySelectorAll(
            "li.item:not(.expand)",
        );
        const texts = Array.from(items).map(
            (li) => li.querySelector(".link").textContent,
        );

        expect(texts[0]).to.equal("Home");
        expect(texts[1]).to.equal("Sub-category");
        expect(texts[2]).to.equal("Widget");
    });

    it("expand button reveals all items", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="3"
            ></y-breadcrumbs>`,
        );

        const expandBtn = el.shadowRoot.querySelector(".expand-btn");
        expandBtn.click();
        await new Promise((r) => setTimeout(r, 0));

        const items = el.shadowRoot.querySelectorAll(
            "li.item:not(.expand)",
        );
        expect(items.length).to.equal(5);
        expect(el.shadowRoot.querySelector(".expand-btn")).to.not.exist;
    });

    it("fires expand event when collapsed items are revealed", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="3"
            ></y-breadcrumbs>`,
        );

        const expandBtn = el.shadowRoot.querySelector(".expand-btn");
        setTimeout(() => expandBtn.click());

        const event = await oneEvent(el, "expand");
        expect(event).to.exist;
    });

    it("does not collapse when item count is within max-items", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_3}"
                max-items="5"
            ></y-breadcrumbs>`,
        );

        expect(el.shadowRoot.querySelector(".expand-btn")).to.not.exist;
    });

    it("treats max-items < 2 as no limit to avoid slice(-0) bug", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="1"
            ></y-breadcrumbs>`,
        );

        expect(el.maxItems).to.be.null;
        expect(el.shadowRoot.querySelector(".expand-btn")).to.not.exist;

        const items = el.shadowRoot.querySelectorAll("li.item:not(.expand)");
        expect(items.length).to.equal(5);
    });

    // ── Navigate event ────────────────────────────────────────

    it("fires navigate event when a link is clicked", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const link = el.shadowRoot.querySelector("a.link");
        setTimeout(() => link.click());

        const event = await oneEvent(el, "navigate");
        expect(event.detail.href).to.equal("/");
        expect(event.cancelable).to.be.true;
    });

    it("navigate event can be cancelled to prevent navigation", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        el.addEventListener("navigate", (e) => e.preventDefault());

        const pushed = [];
        const origPush = window.history.pushState.bind(window.history);
        window.history.pushState = (...args) => {
            pushed.push(args);
            return origPush(...args);
        };

        const link = el.shadowRoot.querySelector("a.link");
        link.click();
        await new Promise((r) => setTimeout(r, 50));

        window.history.pushState = origPush;
        expect(pushed.some((a) => a[2] === "/")).to.be.false;
    });

    it("uses pushState when history attribute is not false", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const pushed = [];
        const origPush = window.history.pushState.bind(window.history);
        window.history.pushState = (...args) => {
            pushed.push(args);
            return origPush(...args);
        };

        const link = el.shadowRoot.querySelector("a.link");
        link.click();
        await new Promise((r) => setTimeout(r, 0));

        window.history.pushState = origPush;
        expect(pushed.some((a) => a[2] === "/")).to.be.true;

        window.history.pushState({}, "", "/");
    });

    it("does not intercept modified clicks (cmd/ctrl)", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const navigateFired = [];
        el.addEventListener("navigate", (e) => navigateFired.push(e));

        // Suppress default at window capture so the test page doesn't navigate,
        // while still allowing our handler to decide whether to fire navigate.
        const suppressNav = (e) => e.preventDefault();
        window.addEventListener("click", suppressNav, true);

        const link = el.shadowRoot.querySelector("a.link");
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, metaKey: true }));
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true, ctrlKey: true }));

        await new Promise((r) => setTimeout(r, 0));

        window.removeEventListener("click", suppressNav, true);
        expect(navigateFired.length).to.equal(0);
    });

    // ── Accessibility ─────────────────────────────────────────

    it("wraps in nav with aria-label=Breadcrumb", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const nav = el.shadowRoot.querySelector("nav");
        expect(nav.getAttribute("aria-label")).to.equal("Breadcrumb");
    });

    it("uses an ordered list", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        expect(el.shadowRoot.querySelector("ol")).to.exist;
    });

    it("last item has aria-current=page", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const items = el.shadowRoot.querySelectorAll("li.item:not(.expand)");
        const lastItem = items[items.length - 1];
        const span = lastItem.querySelector("[aria-current]");

        expect(span.getAttribute("aria-current")).to.equal("page");
    });

    it("separators have aria-hidden=true", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );

        const separators = el.shadowRoot.querySelectorAll(".separator");
        separators.forEach((sep) => {
            expect(sep.getAttribute("aria-hidden")).to.equal("true");
        });
    });

    it("expand button has aria-label", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="3"
            ></y-breadcrumbs>`,
        );

        const btn = el.shadowRoot.querySelector(".expand-btn");
        expect(btn.getAttribute("aria-label")).to.equal(
            "Show all breadcrumbs",
        );
    });

    // ── CSS parts ─────────────────────────────────────────────

    it("exposes breadcrumbs part", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.shadowRoot.querySelector("[part~='breadcrumbs']")).to.exist;
    });

    it("exposes list part", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.shadowRoot.querySelector("[part~='list']")).to.exist;
    });

    it("exposes item and link parts", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.shadowRoot.querySelector("[part~='item']")).to.exist;
        expect(el.shadowRoot.querySelector("[part~='link']")).to.exist;
    });

    it("exposes item--current part on last item", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.shadowRoot.querySelector("[part~='item--current']")).to
            .exist;
    });

    it("exposes separator part", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        expect(el.shadowRoot.querySelector("[part~='separator']")).to.exist;
    });

    it("exposes expand-btn part when collapsed", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_5}"
                max-items="3"
            ></y-breadcrumbs>`,
        );
        expect(el.shadowRoot.querySelector("[part~='expand-btn']")).to.exist;
    });

    // ── Property setters ──────────────────────────────────────

    it("items setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        const newItems = [{ text: "One", href: "/" }];
        el.items = newItems;
        expect(JSON.parse(el.getAttribute("items"))).to.deep.equal(newItems);
    });

    it("size setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("separator setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        el.separator = ">";
        expect(el.getAttribute("separator")).to.equal(">");
    });

    it("separator setter removes attribute when null, undefined, or empty string", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}" separator=">"></y-breadcrumbs>`,
        );

        el.separator = null;
        expect(el.hasAttribute("separator")).to.be.false;

        el.separator = ">";
        el.separator = undefined;
        expect(el.hasAttribute("separator")).to.be.false;

        el.separator = ">";
        el.separator = "";
        expect(el.hasAttribute("separator")).to.be.false;
    });

    it("maxItems setter updates the attribute", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        el.maxItems = 3;
        expect(el.getAttribute("max-items")).to.equal("3");
    });

    it("maxItems setter removes attribute when null", async () => {
        const el = await fixture(
            html`<y-breadcrumbs
                items="${ITEMS_3}"
                max-items="3"
            ></y-breadcrumbs>`,
        );
        el.maxItems = null;
        expect(el.hasAttribute("max-items")).to.be.false;
    });

    // ── Host display ──────────────────────────────────────────

    it("sets host display to block", async () => {
        const el = await fixture(
            html`<y-breadcrumbs items="${ITEMS_3}"></y-breadcrumbs>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: block");
    });

    // ── Items without href ────────────────────────────────────

    it("renders plain text for items without href (not last)", async () => {
        const items = JSON.stringify([
            { text: "Home", href: "/" },
            { text: "No Link" },
            { text: "Current" },
        ]);

        const el = await fixture(
            html`<y-breadcrumbs items="${items}"></y-breadcrumbs>`,
        );

        const allItems = el.shadowRoot.querySelectorAll(
            "li.item:not(.expand)",
        );
        const secondItem = allItems[1];

        expect(secondItem.querySelector("a")).to.not.exist;
        expect(secondItem.querySelector("span.current-text")).to.exist;
    });
});
