import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-rating.js";
import { registerIcon } from "../../icons/registry.js";

// Register a minimal test icon so getIcon() returns something non-empty
registerIcon(
    "star",
    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>`,
);

describe("YumeRating", () => {
    // ── Structure ─────────────────────────────────────────────
    it("renders a .rating container", async () => {
        const el = await fixture(html`<y-rating></y-rating>`);
        expect(el.shadowRoot.querySelector(".rating")).to.exist;
    });

    it("renders 5 icons by default", async () => {
        const el = await fixture(html`<y-rating></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons.length).to.equal(5);
    });

    it("renders the correct number of icons from max attribute", async () => {
        const el = await fixture(html`<y-rating max="10"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons.length).to.equal(10);
    });

    it("assigns data-index starting at 1", async () => {
        const el = await fixture(html`<y-rating max="3"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons[0].dataset.index).to.equal("1");
        expect(icons[1].dataset.index).to.equal("2");
        expect(icons[2].dataset.index).to.equal("3");
    });

    it("exposes icon part on each icon element", async () => {
        const el = await fixture(html`<y-rating max="3"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll("[part='icon']");
        expect(icons.length).to.equal(3);
    });

    // ── Value / Filled state ───────────────────────────────────
    it("defaults value to 0 with no icons filled", async () => {
        const el = await fixture(html`<y-rating></y-rating>`);
        expect(el.value).to.equal(0);
        const filled = el.shadowRoot.querySelectorAll(".icon.filled");
        expect(filled.length).to.equal(0);
    });

    it("fills icons up to the value", async () => {
        const el = await fixture(html`<y-rating value="3" max="5"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons[0].classList.contains("filled")).to.be.true;
        expect(icons[1].classList.contains("filled")).to.be.true;
        expect(icons[2].classList.contains("filled")).to.be.true;
        expect(icons[3].classList.contains("filled")).to.be.false;
        expect(icons[4].classList.contains("filled")).to.be.false;
    });

    it("fills all icons when value equals max", async () => {
        const el = await fixture(html`<y-rating value="5" max="5"></y-rating>`);
        const filled = el.shadowRoot.querySelectorAll(".icon.filled");
        expect(filled.length).to.equal(5);
    });

    it("fills no icons when value is 0", async () => {
        const el = await fixture(html`<y-rating value="0" max="5"></y-rating>`);
        const filled = el.shadowRoot.querySelectorAll(".icon.filled");
        expect(filled.length).to.equal(0);
    });

    // ── Value getter/setter ────────────────────────────────────
    it("value getter returns current numeric value", async () => {
        const el = await fixture(html`<y-rating value="4"></y-rating>`);
        expect(el.value).to.equal(4);
    });

    it("value setter updates filled icons", async () => {
        const el = await fixture(html`<y-rating value="2" max="5"></y-rating>`);
        el.value = 4;
        await new Promise((r) => setTimeout(r, 0));
        const filled = el.shadowRoot.querySelectorAll(".icon.filled");
        expect(filled.length).to.equal(4);
    });

    it("re-renders when value attribute changes", async () => {
        const el = await fixture(html`<y-rating value="1" max="5"></y-rating>`);
        el.setAttribute("value", "3");
        await new Promise((r) => setTimeout(r, 0));
        const filled = el.shadowRoot.querySelectorAll(".icon.filled");
        expect(filled.length).to.equal(3);
    });

    // ── Color ─────────────────────────────────────────────────
    it("applies primary color variable to filled icons by default", async () => {
        const el = await fixture(html`<y-rating value="1"></y-rating>`);
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--primary-content--");
    });

    it("applies specified color variable to filled icons", async () => {
        const el = await fixture(
            html`<y-rating value="1" color="warning"></y-rating>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--warning-content--");
    });

    it("re-renders when color attribute changes", async () => {
        const el = await fixture(
            html`<y-rating value="1" color="primary"></y-rating>`,
        );
        el.setAttribute("color", "error");
        await new Promise((r) => setTimeout(r, 0));
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--error-content--");
    });

    // ── Size ──────────────────────────────────────────────────
    it("applies medium icon size by default", async () => {
        const el = await fixture(html`<y-rating></y-rating>`);
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("24px");
    });

    it("applies small icon size", async () => {
        const el = await fixture(html`<y-rating size="small"></y-rating>`);
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("18px");
    });

    it("applies large icon size", async () => {
        const el = await fixture(html`<y-rating size="large"></y-rating>`);
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("32px");
    });

    // ── Click interaction ─────────────────────────────────────
    it("dispatches change event when icon is clicked", async () => {
        const el = await fixture(html`<y-rating value="0" max="5"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");

        setTimeout(() => icons[2].click());

        const event = await oneEvent(el, "change");
        expect(event.detail.value).to.equal(3);
    });

    it("sets value when icon is clicked", async () => {
        const el = await fixture(html`<y-rating value="0" max="5"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");

        icons[3].click();
        expect(el.value).to.equal(4);
    });

    it("clears value when active icon is clicked again", async () => {
        const el = await fixture(html`<y-rating value="3" max="5"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");

        icons[2].click(); // clicking index 3 (current value)
        expect(el.value).to.equal(0);
    });

    it("does not clear value when required and active icon is clicked", async () => {
        const el = await fixture(
            html`<y-rating value="3" max="5" required></y-rating>`,
        );
        const icons = el.shadowRoot.querySelectorAll(".icon");

        icons[2].click(); // clicking index 3 (current value)
        expect(el.value).to.equal(3);
    });

    // ── Disabled ──────────────────────────────────────────────
    it("applies disabled opacity and pointer-events via CSS", async () => {
        const el = await fixture(
            html`<y-rating value="3" disabled></y-rating>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("opacity: 0.5");
        expect(rules).to.include("pointer-events: none");
    });

    it("does not dispatch change event when disabled", async () => {
        const el = await fixture(
            html`<y-rating value="0" max="5" disabled></y-rating>`,
        );
        let fired = false;
        el.addEventListener("change", () => { fired = true; });

        // pointer-events: none prevents real clicks, but simulate directly
        const icons = el.shadowRoot.querySelectorAll(".icon");
        icons[1].click();
        await new Promise((r) => setTimeout(r, 50));

        expect(fired).to.be.false;
    });

    // ── Readonly ──────────────────────────────────────────────
    it("does not dispatch change event when readonly", async () => {
        const el = await fixture(
            html`<y-rating value="2" max="5" readonly></y-rating>`,
        );
        let fired = false;
        el.addEventListener("change", () => { fired = true; });

        const icons = el.shadowRoot.querySelectorAll(".icon");
        icons[4].click();
        await new Promise((r) => setTimeout(r, 50));

        expect(fired).to.be.false;
    });

    it("does not apply hover cursor styles when readonly", async () => {
        const el = await fixture(
            html`<y-rating value="2" readonly></y-rating>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("cursor: default");
    });

    // ── Accessibility ─────────────────────────────────────────
    it("renders as radiogroup when interactive", async () => {
        const el = await fixture(html`<y-rating value="2"></y-rating>`);
        const rating = el.shadowRoot.querySelector(".rating");
        expect(rating.getAttribute("role")).to.equal("radiogroup");
    });

    it("renders as img when readonly", async () => {
        const el = await fixture(
            html`<y-rating value="2" readonly></y-rating>`,
        );
        const rating = el.shadowRoot.querySelector(".rating");
        expect(rating.getAttribute("role")).to.equal("img");
    });

    it("sets aria-label on rating container", async () => {
        const el = await fixture(html`<y-rating value="3" max="5"></y-rating>`);
        const rating = el.shadowRoot.querySelector(".rating");
        expect(rating.getAttribute("aria-label")).to.equal("Rating: 3 of 5");
    });

    it("updates aria-label when value changes", async () => {
        const el = await fixture(html`<y-rating value="1" max="5"></y-rating>`);
        el.setAttribute("value", "4");
        await new Promise((r) => setTimeout(r, 0));
        const rating = el.shadowRoot.querySelector(".rating");
        expect(rating.getAttribute("aria-label")).to.equal("Rating: 4 of 5");
    });

    it("gives each interactive icon role=radio and aria-label", async () => {
        const el = await fixture(html`<y-rating max="3"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons[0].getAttribute("role")).to.equal("radio");
        expect(icons[0].getAttribute("aria-label")).to.equal("1 of 3");
        expect(icons[2].getAttribute("aria-label")).to.equal("3 of 3");
    });

    // ── Max clamping ──────────────────────────────────────────
    it("clamps max to at least 1", async () => {
        const el = await fixture(html`<y-rating max="0"></y-rating>`);
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons.length).to.equal(1);
    });

    it("re-renders when max attribute changes", async () => {
        const el = await fixture(html`<y-rating max="5"></y-rating>`);
        el.setAttribute("max", "3");
        await new Promise((r) => setTimeout(r, 0));
        const icons = el.shadowRoot.querySelectorAll(".icon");
        expect(icons.length).to.equal(3);
    });
});
