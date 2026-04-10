import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-banner.js";

describe("YumeBanner", () => {
    // ── Defaults ──────────────────────────────────────────────

    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        const banner = el.shadowRoot.querySelector(".banner");

        expect(banner).to.exist;
        expect(banner.getAttribute("part")).to.equal("banner");
        expect(banner.getAttribute("role")).to.equal("region");
    });

    it("renders a default slot for content", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        const slot = el.shadowRoot.querySelector("slot:not([name])");
        expect(slot).to.exist;
    });

    it("does not render a close button by default", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        const btn = el.shadowRoot.querySelector(".close-btn");
        expect(btn).to.not.exist;
    });

    it("defaults to base color", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        expect(el.color).to.equal("base");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--base-content--");
        expect(style).to.include("--base-content-inverse");
    });

    it("defaults to push position", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        expect(el.position).to.equal("push");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        expect(el.size).to.equal("medium");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-banner-padding-medium");
    });

    it("is not dismissed by default", async () => {
        const el = await fixture(html`<y-banner>Hello</y-banner>`);
        expect(el.dismissed).to.be.false;
        expect(el.hasAttribute("hidden")).to.be.false;
    });

    // ── Colors ────────────────────────────────────────────────

    it("applies primary color", async () => {
        const el = await fixture(html`<y-banner color="primary">Info</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--primary-content--");
        expect(style).to.include("--primary-content-inverse");
    });

    it("applies success color", async () => {
        const el = await fixture(html`<y-banner color="success">Done</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--success-content--");
        expect(style).to.include("--success-content-inverse");
    });

    it("applies error color", async () => {
        const el = await fixture(html`<y-banner color="error">Error</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--error-content--");
        expect(style).to.include("--error-content-inverse");
    });

    it("applies warning color", async () => {
        const el = await fixture(html`<y-banner color="warning">Warn</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--warning-content--");
        expect(style).to.include("--warning-content-inverse");
    });

    it("applies help color", async () => {
        const el = await fixture(html`<y-banner color="help">Help</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--help-content--");
        expect(style).to.include("--help-content-inverse");
    });

    it("applies secondary color", async () => {
        const el = await fixture(html`<y-banner color="secondary">Sec</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--secondary-content--");
        expect(style).to.include("--secondary-content-inverse");
    });

    it("falls back to base color for unknown values", async () => {
        const el = await fixture(html`<y-banner color="unknown">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--base-content--");
    });

    // ── Sizes ─────────────────────────────────────────────────

    it("applies small size", async () => {
        const el = await fixture(html`<y-banner size="small">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-banner-padding-small");
        expect(style).to.include("--font-size-small");
    });

    it("applies medium size", async () => {
        const el = await fixture(html`<y-banner size="medium">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-banner-padding-medium");
        expect(style).to.include("--font-size-label");
    });

    it("applies large size", async () => {
        const el = await fixture(html`<y-banner size="large">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-banner-padding-large");
        expect(style).to.include("--font-size-paragraph");
    });

    it("falls back to medium for unknown size", async () => {
        const el = await fixture(html`<y-banner size="xl">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-banner-padding-medium");
    });

    // ── Icon attribute ────────────────────────────────────────

    it("renders a y-icon when icon attribute is set", async () => {
        const el = await fixture(html`<y-banner icon="warning">Msg</y-banner>`);
        const icon = el.shadowRoot.querySelector("y-icon[name='warning']");
        expect(icon).to.exist;
    });

    it("does not render an icon when icon attribute is absent", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        const iconWrapper = el.shadowRoot.querySelector(".icon-wrapper");
        const icon = iconWrapper.querySelector("y-icon");
        expect(icon).to.not.exist;
    });

    // ── Position ──────────────────────────────────────────────

    it("uses block display for push position", async () => {
        const el = await fixture(html`<y-banner position="push">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.not.include("position: fixed");
        expect(style).to.not.include("position: absolute");
    });

    it("uses absolute positioning for overlap without sticky", async () => {
        const el = await fixture(html`<y-banner position="overlap">Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("position: absolute");
    });

    it("uses fixed positioning for overlap with sticky", async () => {
        const el = await fixture(html`<y-banner position="overlap" sticky>Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("position: fixed");
    });

    // ── Dismissable ───────────────────────────────────────────

    it("renders a y-button close button when dismissable", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        const btn = el.shadowRoot.querySelector(".close-btn");
        expect(btn).to.exist;
        expect(btn.tagName.toLowerCase()).to.equal("y-button");
        expect(btn.getAttribute("aria-label")).to.equal("Dismiss banner");
        expect(btn.getAttribute("part")).to.equal("close-btn");
        expect(btn.getAttribute("style-type")).to.equal("filled");
    });

    it("close button uses the same color as the banner", async () => {
        const el = await fixture(html`<y-banner color="error" dismissable>Msg</y-banner>`);
        const btn = el.shadowRoot.querySelector(".close-btn");
        expect(btn.getAttribute("color")).to.equal("error");
    });

    it("close button contains a y-icon with name x", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        const icon = el.shadowRoot.querySelector(".close-btn y-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("x");
    });

    it("dispatches a cancelable dismiss event when close button is clicked", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        const btn = el.shadowRoot.querySelector(".close-btn");

        setTimeout(() => btn.click());

        const event = await oneEvent(el, "dismiss");
        expect(event).to.exist;
        expect(event.bubbles).to.be.true;
        expect(event.cancelable).to.be.true;
    });

    it("sets dismissed and hidden after close button click", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        const btn = el.shadowRoot.querySelector(".close-btn");

        btn.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.dismissed).to.be.true;
        expect(el.hasAttribute("hidden")).to.be.true;
    });

    it("does not dismiss when dismiss event is cancelled", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        el.addEventListener("dismiss", (e) => e.preventDefault());

        const btn = el.shadowRoot.querySelector(".close-btn");
        btn.click();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.dismissed).to.be.false;
        expect(el.hasAttribute("hidden")).to.be.false;
    });

    // ── dismiss() / show() methods ────────────────────────────

    it("dismiss() hides the banner and fires event", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);

        setTimeout(() => el.dismiss());

        const event = await oneEvent(el, "dismiss");
        expect(event).to.exist;
        expect(el.dismissed).to.be.true;
        expect(el.hasAttribute("hidden")).to.be.true;
    });

    it("show() restores the banner after dismissal", async () => {
        const el = await fixture(html`<y-banner dismissed>Msg</y-banner>`);
        expect(el.dismissed).to.be.true;
        expect(el.hasAttribute("hidden")).to.be.true;

        el.show();
        await new Promise((r) => setTimeout(r, 0));

        expect(el.dismissed).to.be.false;
        expect(el.hasAttribute("hidden")).to.be.false;
    });

    it("dismissed can be set programmatically", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);

        el.dismissed = true;
        await new Promise((r) => setTimeout(r, 0));

        expect(el.hasAttribute("dismissed")).to.be.true;
        expect(el.hasAttribute("hidden")).to.be.true;
    });

    // ── Accessibility ─────────────────────────────────────────

    it("has role=region on the banner", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        const banner = el.shadowRoot.querySelector(".banner");
        expect(banner.getAttribute("role")).to.equal("region");
    });

    it("sets aria-label based on color", async () => {
        const el = await fixture(html`<y-banner color="warning">Msg</y-banner>`);
        const banner = el.shadowRoot.querySelector(".banner");
        expect(banner.getAttribute("aria-label")).to.equal("Warning banner");
    });

    it("sets aria-label for success color", async () => {
        const el = await fixture(html`<y-banner color="success">Msg</y-banner>`);
        const banner = el.shadowRoot.querySelector(".banner");
        expect(banner.getAttribute("aria-label")).to.equal("Success banner");
    });

    it("sets aria-label for error color", async () => {
        const el = await fixture(html`<y-banner color="error">Msg</y-banner>`);
        const banner = el.shadowRoot.querySelector(".banner");
        expect(banner.getAttribute("aria-label")).to.equal("Error banner");
    });

    it("close button has aria-label", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        const btn = el.shadowRoot.querySelector(".close-btn");
        expect(btn.getAttribute("aria-label")).to.equal("Dismiss banner");
    });

    // ── CSS parts ─────────────────────────────────────────────

    it("exposes banner part", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        expect(el.shadowRoot.querySelector("[part='banner']")).to.exist;
    });

    it("exposes icon part", async () => {
        const el = await fixture(html`<y-banner icon="check">Msg</y-banner>`);
        expect(el.shadowRoot.querySelector("[part='icon']")).to.exist;
    });

    it("exposes content part", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        expect(el.shadowRoot.querySelector("[part='content']")).to.exist;
    });

    it("exposes action part", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        expect(el.shadowRoot.querySelector("[part='action']")).to.exist;
    });

    it("exposes close-btn part when dismissable", async () => {
        const el = await fixture(html`<y-banner dismissable>Msg</y-banner>`);
        expect(el.shadowRoot.querySelector("[part='close-btn']")).to.exist;
    });

    // ── Slots ─────────────────────────────────────────────────

    it("has an icon slot", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        const slot = el.shadowRoot.querySelector("slot[name='icon']");
        expect(slot).to.exist;
    });

    it("has an action slot", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        const slot = el.shadowRoot.querySelector("slot[name='action']");
        expect(slot).to.exist;
    });

    // ── Attribute changes ─────────────────────────────────────

    it("re-renders when color attribute changes", async () => {
        const el = await fixture(html`<y-banner color="primary">Msg</y-banner>`);
        el.setAttribute("color", "error");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--error-content--");
    });

    it("re-renders when size attribute changes", async () => {
        const el = await fixture(html`<y-banner size="small">Msg</y-banner>`);
        el.setAttribute("size", "large");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-banner-padding-large");
    });

    it("re-renders when position changes to overlap", async () => {
        const el = await fixture(html`<y-banner position="push">Msg</y-banner>`);
        el.setAttribute("position", "overlap");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("position: absolute");
    });

    // ── Property setters ──────────────────────────────────────

    it("color setter updates the color attribute", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        el.color = "success";
        expect(el.getAttribute("color")).to.equal("success");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--success-content--");
    });

    it("position setter updates the position attribute", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        el.position = "overlap";
        expect(el.getAttribute("position")).to.equal("overlap");
    });

    it("size setter updates the size attribute", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("sticky setter toggles the sticky attribute", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        el.sticky = true;
        expect(el.hasAttribute("sticky")).to.be.true;

        el.sticky = false;
        expect(el.hasAttribute("sticky")).to.be.false;
    });

    it("dismissable setter toggles the attribute", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        el.dismissable = true;
        expect(el.hasAttribute("dismissable")).to.be.true;
        expect(el.shadowRoot.querySelector(".close-btn")).to.exist;

        el.dismissable = false;
        expect(el.hasAttribute("dismissable")).to.be.false;
        expect(el.shadowRoot.querySelector(".close-btn")).to.not.exist;
    });

    it("icon setter updates the attribute and renders y-icon", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        el.icon = "check";
        expect(el.getAttribute("icon")).to.equal("check");

        const icon = el.shadowRoot.querySelector("y-icon[name='check']");
        expect(icon).to.exist;
    });

    it("icon setter removes attribute when set to empty", async () => {
        const el = await fixture(html`<y-banner icon="check">Msg</y-banner>`);
        el.icon = "";
        expect(el.hasAttribute("icon")).to.be.false;
    });

    // ── Host display ──────────────────────────────────────────

    it("sets host display to block", async () => {
        const el = await fixture(html`<y-banner>Msg</y-banner>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: block");
    });
});
