import { html, fixture, expect } from "@open-wc/testing";
import "./y-skeleton.js";

/** Read concatenated CSS text from a shadowRoot's adoptedStyleSheets. */
function getStyleText(el) {
    return el.shadowRoot.adoptedStyleSheets
        .flatMap((sheet) => [...sheet.cssRules].map((r) => r.cssText))
        .join(" ");
}

describe("YumeSkeleton", () => {
    it("defaults to a single text bar with pulse animation", async () => {
        const el = await fixture(html`<y-skeleton></y-skeleton>`);

        expect(el.variant).to.equal("text");
        expect(el.animation).to.equal("pulse");
        expect(el.lines).to.equal(1);

        const bars = el.shadowRoot.querySelectorAll(".bar");
        expect(bars.length).to.equal(1);
        expect(getStyleText(el)).to.include("yk-skeleton-pulse");
    });

    it("marks internals aria-hidden so AT ignores the placeholder", async () => {
        const el = await fixture(html`<y-skeleton></y-skeleton>`);
        expect(
            el.shadowRoot.querySelector(".root").getAttribute("aria-hidden"),
        ).to.equal("true");
    });

    it("carries the skeleton part on each rendered shape", async () => {
        const el = await fixture(
            html`<y-skeleton lines="3"></y-skeleton>`,
        );
        const parts = el.shadowRoot.querySelectorAll('[part="skeleton"]');
        expect(parts.length).to.equal(3);
    });

    it("renders the requested number of line bars", async () => {
        const el = await fixture(html`<y-skeleton lines="4"></y-skeleton>`);
        expect(el.shadowRoot.querySelectorAll(".bar").length).to.equal(4);
    });

    it("shortens the last bar only when lines > 1", async () => {
        const single = await fixture(html`<y-skeleton lines="1"></y-skeleton>`);
        expect(single.shadowRoot.querySelector(".bar--short")).to.not.exist;

        const many = await fixture(html`<y-skeleton lines="3"></y-skeleton>`);
        const shorts = many.shadowRoot.querySelectorAll(".bar--short");
        expect(shorts.length).to.equal(1);
        // The short bar is the last one.
        const bars = many.shadowRoot.querySelectorAll(".bar");
        expect(bars[bars.length - 1].classList.contains("bar--short")).to.be
            .true;
    });

    it("falls back to a single bar for invalid or non-positive lines", async () => {
        const el = await fixture(html`<y-skeleton lines="0"></y-skeleton>`);
        expect(el.lines).to.equal(1);
        expect(el.shadowRoot.querySelectorAll(".bar").length).to.equal(1);
    });

    it("renders a circle shape with a 50% radius", async () => {
        const el = await fixture(
            html`<y-skeleton variant="circle"></y-skeleton>`,
        );
        expect(el.shadowRoot.querySelector(".shape.single")).to.exist;
        expect(getStyleText(el)).to.include("border-radius: 50%");
    });

    it("renders a rect shape using the component radius token", async () => {
        const el = await fixture(
            html`<y-skeleton variant="rect" height="80px"></y-skeleton>`,
        );
        expect(getStyleText(el)).to.include(
            "--component-skeleton-radius",
        );
    });

    it("applies safe width/height as inline custom properties", async () => {
        const el = await fixture(
            html`<y-skeleton width="120px" height="2rem"></y-skeleton>`,
        );
        expect(el.style.getPropertyValue("--_skeleton-w")).to.equal("120px");
        expect(el.style.getPropertyValue("--_skeleton-h")).to.equal("2rem");
    });

    it("rejects a value that is not a valid width and does not paint it", async () => {
        const hostile = "120px; } :host { background: red;";
        const el = await fixture(
            html`<y-skeleton width=${hostile}></y-skeleton>`,
        );
        expect(el.style.getPropertyValue("--_skeleton-w")).to.equal("");
        expect(getStyleText(el)).to.not.include("background: red");
    });

    it("accepts calc() and var() expressions as dimensions", async () => {
        const el = await fixture(
            html`<y-skeleton
                width="calc(100% - 16px)"
                height="var(--x, 2rem)"
            ></y-skeleton>`,
        );
        expect(el.style.getPropertyValue("--_skeleton-w")).to.equal(
            "calc(100% - 16px)",
        );
        expect(el.style.getPropertyValue("--_skeleton-h")).to.equal(
            "var(--x, 2rem)",
        );
    });

    it("rejects unitless non-zero numbers and negative lengths", async () => {
        const el = await fixture(
            html`<y-skeleton width="2" height="-4px"></y-skeleton>`,
        );
        expect(el.style.getPropertyValue("--_skeleton-w")).to.equal("");
        expect(el.style.getPropertyValue("--_skeleton-h")).to.equal("");
    });

    it("clears the width custom property when the attribute is removed", async () => {
        const el = await fixture(
            html`<y-skeleton width="80px"></y-skeleton>`,
        );
        expect(el.style.getPropertyValue("--_skeleton-w")).to.equal("80px");
        el.removeAttribute("width");
        await new Promise((r) => setTimeout(r, 0));
        expect(el.style.getPropertyValue("--_skeleton-w")).to.equal("");
    });

    it("renders the wave overlay only for animation=wave", async () => {
        const wave = await fixture(
            html`<y-skeleton animation="wave"></y-skeleton>`,
        );
        const style = getStyleText(wave);
        expect(style).to.include("yk-skeleton-wave");
        expect(style).to.include("--component-skeleton-highlight");
        expect(style).to.not.include("yk-skeleton-pulse");
    });

    it("renders a static block for animation=none", async () => {
        const el = await fixture(
            html`<y-skeleton animation="none"></y-skeleton>`,
        );
        const style = getStyleText(el);
        expect(style).to.not.include("yk-skeleton-pulse");
        expect(style).to.not.include("yk-skeleton-wave");
    });

    it("always emits a reduced-motion fallback that disables animation", async () => {
        const el = await fixture(
            html`<y-skeleton animation="wave"></y-skeleton>`,
        );
        const style = getStyleText(el);
        expect(style).to.include("prefers-reduced-motion: reduce");
        // The browser normalizes `animation: none` to its longhand form; the
        // animation-name resets to `none` (serialized as `... running none`).
        expect(style).to.include("running none");
        expect(style).to.include("content: none");
    });

    it("renders the slot unconditionally for sizing content", async () => {
        const el = await fixture(html`<y-skeleton></y-skeleton>`);
        expect(el.shadowRoot.querySelector("slot")).to.exist;
    });

    it("switches to the overlay layout when sizing content is slotted", async () => {
        const el = await fixture(
            html`<y-skeleton variant="rect"
                ><img width="200" height="100" alt=""
            /></y-skeleton>`,
        );
        await new Promise((r) => setTimeout(r, 0));
        expect(
            el.shadowRoot.querySelector(".root").classList.contains(
                "has-content",
            ),
        ).to.be.true;
    });

    it("ignores an unknown variant and treats it as text", async () => {
        const el = await fixture(
            html`<y-skeleton variant="blob"></y-skeleton>`,
        );
        expect(el.variant).to.equal("text");
        expect(el.shadowRoot.querySelector(".bar")).to.exist;
    });

    it("re-renders when the variant changes", async () => {
        const el = await fixture(html`<y-skeleton variant="text"></y-skeleton>`);
        el.setAttribute("variant", "circle");
        await new Promise((r) => setTimeout(r, 0));
        expect(el.shadowRoot.querySelector(".shape.single")).to.exist;
        expect(getStyleText(el)).to.include("border-radius: 50%");
    });
});
