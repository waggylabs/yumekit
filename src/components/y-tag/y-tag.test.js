import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-tag.js";

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

    it("applies filled variant by default", async () => {
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
    it("applies outlined variant", async () => {
        const el = await fixture(
            html`<y-tag color="primary" variant="outlined">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("border: 1px solid var(--primary-content--)");
        expect(style).to.include("background: transparent");
    });

    it("applies flat variant", async () => {
        const el = await fixture(
            html`<y-tag color="primary" variant="flat">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;

        expect(style).to.include("var(--primary-background-app)");
        expect(style).to.include("color: var(--primary-content--)");
    });

    it("falls back to filled for unknown variant", async () => {
        const el = await fixture(html`<y-tag variant="custom">Tag</y-tag>`);
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

    it("re-renders when variant attribute changes", async () => {
        const el = await fixture(
            html`<y-tag color="primary" variant="filled">Tag</y-tag>`,
        );
        el.setAttribute("variant", "outlined");
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
        expect(style).to.include("display: inline-flex");
    });

    // ── removable setter ──────────────────────────────────────
    it("removable setter sets the removable attribute", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        expect(el.removable).to.be.false;

        el.removable = true;
        expect(el.hasAttribute("removable")).to.be.true;
        expect(el.removable).to.be.true;
        expect(el.shadowRoot.querySelector(".remove")).to.exist;
    });

    it("removable setter removes the removable attribute when set to false", async () => {
        const el = await fixture(html`<y-tag removable>Tag</y-tag>`);
        expect(el.removable).to.be.true;

        el.removable = false;
        expect(el.hasAttribute("removable")).to.be.false;
        expect(el.removable).to.be.false;
        expect(el.shadowRoot.querySelector(".remove")).to.not.exist;
    });

    // ── Property setters ─────────────────────────────────────
    it("color setter updates the color attribute", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        el.color = "primary";
        expect(el.getAttribute("color")).to.equal("primary");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--primary-content--");
    });

    it("shape setter updates the shape attribute", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        el.shape = "round";
        expect(el.getAttribute("shape")).to.equal("round");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-tag-border-radius-circle");
    });

    it("size setter updates the size attribute", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-tag-height-large");
    });

    it("variant defaults to filled", async () => {
        const el = await fixture(html`<y-tag>Tag</y-tag>`);
        expect(el.variant).to.equal("filled");
    });

    it("variant setter updates the variant attribute", async () => {
        const el = await fixture(html`<y-tag color="primary">Tag</y-tag>`);
        el.variant = "outlined";
        expect(el.getAttribute("variant")).to.equal("outlined");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border: 1px solid var(--primary-content--)");
    });

    // ── Deprecated style-type alias ───────────────────────────
    it("treats style-type as a deprecated alias for variant", async () => {
        const el = await fixture(
            html`<y-tag color="primary" style-type="outlined">Tag</y-tag>`,
        );
        expect(el.variant).to.equal("outlined");
        expect(el.styleType).to.equal("outlined");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border: 1px solid var(--primary-content--)");
    });

    it("styleType setter updates the style-type attribute", async () => {
        const el = await fixture(html`<y-tag color="primary">Tag</y-tag>`);
        el.styleType = "outlined";
        expect(el.getAttribute("style-type")).to.equal("outlined");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border: 1px solid var(--primary-content--)");
    });

    it("prefers variant over style-type when both are set", async () => {
        const el = await fixture(
            html`<y-tag variant="flat" style-type="outlined">Tag</y-tag>`,
        );
        expect(el.variant).to.equal("flat");
    });

    // ── Custom color variants ─────────────────────────────────
    it("renders with custom hex color using filled variant", async () => {
        const el = await fixture(
            html`<y-tag color="#ff0000" variant="filled">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("background: #ff0000");
    });

    it("renders with custom hex color using outlined variant", async () => {
        const el = await fixture(
            html`<y-tag color="#00aaff" variant="outlined">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("border: 1px solid #00aaff");
        expect(style).to.include("background: transparent");
        expect(style).to.include("color: #00aaff");
    });

    it("renders with custom hex color using flat variant", async () => {
        const el = await fixture(
            html`<y-tag color="#00cc44" variant="flat">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("color-mix(in srgb, #00cc44 20%, transparent)");
        expect(style).to.include("color: #00cc44");
    });

    it("renders with custom rgb color using filled variant", async () => {
        const el = await fixture(
            html`<y-tag color="rgb(255,0,0)" variant="filled">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("background: rgb(255,0,0)");
    });

    it("falls back to filled for custom color with unknown variant", async () => {
        const el = await fixture(
            html`<y-tag color="#abcdef" variant="custom">Tag</y-tag>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("background: #abcdef");
    });
});
