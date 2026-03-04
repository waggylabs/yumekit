import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "../src/components/y-tag.js";

describe("YumeTag", () => {
    // ── Defaults ──────────────────────────────────────────────
    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-tag>Default</y-tag>`);
        const tag = el.shadowRoot.querySelector(".tag");

        expect(tag).to.exist;
        expect(tag.getAttribute("part")).to.equal("tag");

        const slot = el.shadowRoot.querySelector("slot");
        expect(slot).to.exist;
    });

    it("does not render a remove button by default", async () => {
        const el = await fixture(html`<y-tag>Default</y-tag>`);
        const removeBtn = el.shadowRoot.querySelector(".remove");
        expect(removeBtn).to.not.exist;
    });

    it("applies filled style-type by default", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        // Default color is "base", filled uses background var
        expect(style).to.include("background: var(--base-content--)");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("--component-tag-height-medium");
        expect(style).to.include("--component-tag-padding-medium");
    });

    it("defaults to square shape", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("--component-tag-border-radius-square");
    });

    // ── Colors ────────────────────────────────────────────────
    it("applies primary color", async () => {
        const el = await fixture(html`<y-tag color="primary">Primary</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--primary-content--");
    });

    it("applies secondary color", async () => {
        const el = await fixture(
            html`<y-tag color="secondary">Secondary</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--secondary-content--");
    });

    it("applies success color", async () => {
        const el = await fixture(html`<y-tag color="success">Success</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--success-content--");
    });

    it("applies error color", async () => {
        const el = await fixture(html`<y-tag color="error">Error</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--error-content--");
    });

    it("applies warning color", async () => {
        const el = await fixture(html`<y-tag color="warning">Warning</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--warning-content--");
    });

    it("applies help color", async () => {
        const el = await fixture(html`<y-tag color="help">Help</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--help-content--");
    });

    it("falls back to base color for unknown values", async () => {
        const el = await fixture(html`<y-tag color="unknown">Unknown</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--base-content--");
    });

    // ── Style Types ───────────────────────────────────────────
    it("applies outlined style-type", async () => {
        const el = await fixture(
            html`<y-tag color="primary" style-type="outlined">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("border: 1px solid var(--primary-content--)");
        expect(style).to.include("background: transparent");
    });

    it("applies flat style-type", async () => {
        const el = await fixture(
            html`<y-tag color="primary" style-type="flat">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("background: transparent");
        expect(style).to.include("color: var(--primary-content--)");
    });

    it("falls back to filled for unknown style-type", async () => {
        const el = await fixture(html`<y-tag style-type="custom">Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        // Should use filled styles (background with content var)
        expect(style).to.include("background: var(--base-content--)");
    });

    // ── Shapes ────────────────────────────────────────────────
    it("applies round shape", async () => {
        const el = await fixture(html`<y-tag shape="round">Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-tag-border-radius-circle");
    });

    it("applies square shape", async () => {
        const el = await fixture(html`<y-tag shape="square">Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-tag-border-radius-square");
    });

    // ── Sizes ─────────────────────────────────────────────────
    it("applies small size", async () => {
        const el = await fixture(html`<y-tag size="small">Small</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("--component-tag-height-small");
        expect(style).to.include("--component-tag-padding-small");
        expect(style).to.include("--font-size-small");
    });

    it("applies medium size", async () => {
        const el = await fixture(html`<y-tag size="medium">Medium</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("--component-tag-height-medium");
        expect(style).to.include("--component-tag-padding-medium");
        expect(style).to.include("--font-size-label");
    });

    it("applies large size", async () => {
        const el = await fixture(html`<y-tag size="large">Large</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("--component-tag-height-large");
        expect(style).to.include("--component-tag-padding-large");
        expect(style).to.include("--font-size-paragraph");
    });

    it("falls back to medium for unknown size", async () => {
        const el = await fixture(html`<y-tag size="xl">XL</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("--component-tag-height-medium");
        expect(style).to.include("--component-tag-padding-medium");
    });

    it("sets box-sizing: border-box on .tag", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("box-sizing: border-box");
    });

    // ── Removable ─────────────────────────────────────────────
    it("renders a remove button when removable", async () => {
        const el = await fixture(html`<y-tag removable>Removable</y-tag>`);
        const removeBtn = el.shadowRoot.querySelector(".remove");

        expect(removeBtn).to.exist;
        expect(removeBtn.getAttribute("part")).to.equal("remove");
        expect(removeBtn.getAttribute("aria-label")).to.equal("Remove tag");
    });

    it("dispatches a remove event when remove button is clicked", async () => {
        const el = await fixture(html`<y-tag removable>Removable</y-tag>`);
        const removeBtn = el.shadowRoot.querySelector(".remove");

        setTimeout(() => removeBtn.click());

        const event = await oneEvent(el, "remove");
        expect(event).to.exist;
        expect(event.bubbles).to.be.true;
        expect(event.composed).to.be.true;
    });

    it("remove button contains an SVG icon", async () => {
        const el = await fixture(html`<y-tag removable>Tag</y-tag>`);
        const removeBtn = el.shadowRoot.querySelector(".remove");
        const svg = removeBtn.querySelector("svg");
        expect(svg).to.exist;
    });

    // ── Attribute changes ─────────────────────────────────────
    it("re-renders when color attribute changes", async () => {
        const el = await fixture(html`<y-tag color="primary">Tag</y-tag>`);
        el.setAttribute("color", "success");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--success-content--");
    });

    it("re-renders when size attribute changes", async () => {
        const el = await fixture(html`<y-tag size="small">Tag</y-tag>`);
        el.setAttribute("size", "large");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-tag-height-large");
    });

    it("re-renders when style-type attribute changes", async () => {
        const el = await fixture(
            html`<y-tag color="primary" style-type="filled">Tag</y-tag>`,
        );
        el.setAttribute("style-type", "outlined");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border: 1px solid var(--primary-content--)");
    });

    it("re-renders when shape attribute changes", async () => {
        const el = await fixture(html`<y-tag shape="square">Tag</y-tag>`);
        el.setAttribute("shape", "round");
        await new Promise((r) => setTimeout(r, 0));

        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-tag-border-radius-circle");
    });

    it("re-renders when removable is toggled on", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        expect(el.shadowRoot.querySelector(".remove")).to.not.exist;

        el.setAttribute("removable", "");
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector(".remove")).to.exist;
    });

    // ── CSS parts ─────────────────────────────────────────────
    it("exposes tag part", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        const tag = el.shadowRoot.querySelector("[part='tag']");
        expect(tag).to.exist;
    });

    it("exposes remove part when removable", async () => {
        const el = await fixture(html`<y-tag removable>Tag</y-tag>`);
        const remove = el.shadowRoot.querySelector("[part='remove']");
        expect(remove).to.exist;
    });

    // ── Host display ──────────────────────────────────────────
    it("sets host display to inline-block", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: inline-block");
    });
});
