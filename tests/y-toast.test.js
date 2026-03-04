import { html, fixture, expect, aTimeout } from "@open-wc/testing";
import "../src/components/y-toast.js";

describe("YumeToast", () => {
    it("renders a toast container", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        const container = el.shadowRoot.querySelector(".toast-container");
        expect(container).to.exist;
    });

    it("has correct default property values", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        expect(el.position).to.equal("bottom-right");
        expect(el.duration).to.equal(4000);
        expect(el.max).to.equal(5);
    });

    it("respects custom position attribute", async () => {
        const el = await fixture(html`<y-toast position="top-left"></y-toast>`);
        expect(el.position).to.equal("top-left");
    });

    it("shows a toast with message", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Hello World" });
        await aTimeout(50);
        const toast = el.shadowRoot.querySelector(".toast");
        expect(toast).to.exist;
        expect(toast.querySelector(".toast-message").textContent).to.equal(
            "Hello World",
        );
    });

    it("applies color class to toast", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Success!", color: "success" });
        await aTimeout(50);
        const toast = el.shadowRoot.querySelector(".toast");
        expect(toast.classList.contains("color-success")).to.be.true;
    });

    it("defaults to base color", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Default" });
        await aTimeout(50);
        const toast = el.shadowRoot.querySelector(".toast");
        expect(toast.classList.contains("color-base")).to.be.true;
    });

    it("renders a close button when dismissible", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Close me" });
        await aTimeout(50);
        const btn = el.shadowRoot.querySelector(".toast-close");
        expect(btn).to.exist;
        expect(btn.getAttribute("aria-label")).to.equal("Dismiss");
    });

    it("hides close button when dismissible is false", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "No close", dismissible: false });
        await aTimeout(50);
        const btn = el.shadowRoot.querySelector(".toast-close");
        expect(btn).to.not.exist;
    });

    it("renders an icon when provided", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "With icon", icon: "checkmark" });
        await aTimeout(50);
        const icon = el.shadowRoot.querySelector(".toast-icon");
        expect(icon).to.exist;
        expect(icon.tagName.toLowerCase()).to.equal("y-icon");
        expect(icon.getAttribute("name")).to.equal("checkmark");
        expect(icon.getAttribute("size")).to.equal("small");
    });

    it("does not render icon when not provided", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "No icon" });
        await aTimeout(50);
        const icon = el.shadowRoot.querySelector(".toast-icon");
        expect(icon).to.not.exist;
    });

    it("sets role=alert and aria-live=assertive on toast", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Accessible" });
        await aTimeout(50);
        const toast = el.shadowRoot.querySelector(".toast");
        expect(toast.getAttribute("role")).to.equal("alert");
        expect(toast.getAttribute("aria-live")).to.equal("assertive");
    });

    it("adds visible class after animation frame", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Animate" });
        await aTimeout(50);
        const toast = el.shadowRoot.querySelector(".toast");
        expect(toast.classList.contains("visible")).to.be.true;
    });

    it("removes toast when close button is clicked", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Dismiss me", duration: 0 });
        await aTimeout(50);
        const btn = el.shadowRoot.querySelector(".toast-close");
        btn.click();
        await aTimeout(400);
        const toasts = el.shadowRoot.querySelectorAll(".toast");
        expect(toasts.length).to.equal(0);
    });

    it("auto-dismisses after duration", async () => {
        const el = await fixture(html`<y-toast duration="100"></y-toast>`);
        el.show({ message: "Auto dismiss" });
        await aTimeout(50);
        expect(el.shadowRoot.querySelectorAll(".toast").length).to.equal(1);
        await aTimeout(500);
        expect(el.shadowRoot.querySelectorAll(".toast").length).to.equal(0);
    });

    it("does not auto-dismiss when duration is 0", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        el.show({ message: "Persistent", duration: 0 });
        await aTimeout(200);
        expect(el.shadowRoot.querySelectorAll(".toast").length).to.equal(1);
    });

    it("can show multiple toasts", async () => {
        const el = await fixture(html`<y-toast duration="0"></y-toast>`);
        el.show({ message: "First" });
        el.show({ message: "Second" });
        el.show({ message: "Third" });
        await aTimeout(50);
        const toasts = el.shadowRoot.querySelectorAll(".toast");
        expect(toasts.length).to.equal(3);
    });

    it("enforces max visible toasts", async () => {
        const el = await fixture(
            html`<y-toast duration="0" max="2"></y-toast>`,
        );
        el.show({ message: "One" });
        el.show({ message: "Two" });
        el.show({ message: "Three" });
        await aTimeout(400);
        const toasts = el.shadowRoot.querySelectorAll(".toast");
        expect(toasts.length).to.be.at.most(2);
    });

    it("clear() removes all toasts", async () => {
        const el = await fixture(html`<y-toast duration="0"></y-toast>`);
        el.show({ message: "A" });
        el.show({ message: "B" });
        await aTimeout(50);
        expect(el.shadowRoot.querySelectorAll(".toast").length).to.equal(2);
        el.clear();
        await aTimeout(400);
        expect(el.shadowRoot.querySelectorAll(".toast").length).to.equal(0);
    });

    it("fires y-toast-show event", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        let detail = null;
        el.addEventListener("y-toast-show", (e) => {
            detail = e.detail;
        });
        el.show({ message: "Event", color: "error" });
        expect(detail).to.not.be.null;
        expect(detail.message).to.equal("Event");
        expect(detail.color).to.equal("error");
    });

    it("fires y-toast-dismiss event when toast is removed", async () => {
        const el = await fixture(html`<y-toast></y-toast>`);
        let dismissed = false;
        el.addEventListener("y-toast-dismiss", () => {
            dismissed = true;
        });
        el.show({ message: "Dismiss event", duration: 0 });
        await aTimeout(50);
        const btn = el.shadowRoot.querySelector(".toast-close");
        btn.click();
        await aTimeout(400);
        expect(dismissed).to.be.true;
    });

    it("supports all color variants", async () => {
        const el = await fixture(html`<y-toast duration="0"></y-toast>`);
        const colors = [
            "base",
            "primary",
            "secondary",
            "success",
            "warning",
            "error",
            "help",
        ];
        for (const c of colors) {
            el.show({ message: c, color: c });
        }
        await aTimeout(50);
        const toasts = el.shadowRoot.querySelectorAll(".toast");
        expect(toasts.length).to.equal(colors.length);
        colors.forEach((c, i) => {
            expect(toasts[i].classList.contains(`color-${c}`)).to.be.true;
        });
    });
});
