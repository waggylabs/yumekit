import { html, fixture, expect } from "@open-wc/testing";
import "./y-shape.js";

/** Read concatenated CSS text from a shadowRoot's adoptedStyleSheets. */
function getStyleText(el) {
    return el.shadowRoot.adoptedStyleSheets
        .flatMap((sheet) => [...sheet.cssRules].map((r) => r.cssText))
        .join(" ");
}

describe("YumeShape", () => {
    it("renders with default attributes (rectangle, inset)", async () => {
        const el = await fixture(html`<y-shape></y-shape>`);

        expect(el.shadowRoot.querySelector('[part="host"]')).to.exist;
        expect(el.shadowRoot.querySelector('[part="content"]')).to.exist;
        expect(el.shadowRoot.querySelector("slot")).to.exist;

        const style = getStyleText(el);
        expect(style).to.include("--component-shape-clip-path: inset(0)");
    });

    it("renders a circle with default 50% radius", async () => {
        const el = await fixture(html`<y-shape type="circle"></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("circle(50% at 50% 50%)");
    });

    it("renders a circle with a custom safe radius", async () => {
        const el = await fixture(
            html`<y-shape type="circle" radius="40px"></y-shape>`,
        );
        const style = getStyleText(el);
        expect(style).to.include("circle(40px at 50% 50%)");
    });

    it("renders an ellipse with custom radii", async () => {
        const el = await fixture(
            html`<y-shape type="ellipse" radius="40% 30%"></y-shape>`,
        );
        const style = getStyleText(el);
        expect(style).to.include("ellipse(40% 30% at 50% 50%)");
    });

    it("renders a rectangle with rounded corners when radius is set", async () => {
        const el = await fixture(
            html`<y-shape type="rectangle" radius="12px"></y-shape>`,
        );
        const style = getStyleText(el);
        expect(style).to.include("inset(0 round 12px)");
    });

    it("renders preset polygon shapes", async () => {
        const el = await fixture(html`<y-shape type="star"></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("polygon(");
        expect(style).to.include("50% 0%");
    });

    it("renders a custom polygon when polygon-points is supplied", async () => {
        const el = await fixture(
            html`<y-shape
                type="polygon"
                polygon-points="0% 0%, 100% 0%, 50% 100%"
            ></y-shape>`,
        );
        const style = getStyleText(el);
        expect(style).to.include("polygon(0% 0%, 100% 0%, 50% 100%)");
    });

    it("falls back to inset(0) when polygon-points is missing", async () => {
        const el = await fixture(html`<y-shape type="polygon"></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("inset(0)");
        expect(style).to.not.include("polygon(");
    });

    it("applies the requested size token", async () => {
        const el = await fixture(html`<y-shape size="lg"></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("--component-shape-size-lg");
    });

    it("applies aspect-ratio when preserve-aspect is set", async () => {
        const el = await fixture(html`<y-shape preserve-aspect></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("aspect-ratio: 1 / 1");
    });

    it("maps the fit attribute to object-fit on slotted media", async () => {
        const el = await fixture(html`<y-shape fit="cover"></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("object-fit: cover");
    });

    it("re-renders when type changes", async () => {
        const el = await fixture(html`<y-shape type="rectangle"></y-shape>`);
        el.setAttribute("type", "circle");
        await new Promise((r) => setTimeout(r, 0));
        expect(getStyleText(el)).to.include("circle(");
    });

    it("emits a ready event with the computed clip-path", async () => {
        const el = document.createElement("y-shape");
        el.setAttribute("type", "circle");
        const promise = new Promise((resolve) => {
            el.addEventListener("ready", (e) => resolve(e.detail), {
                once: true,
            });
        });
        document.body.appendChild(el);
        const detail = await promise;
        expect(detail.clipPath).to.include("circle(");
        el.remove();
    });

    describe("Input hardening", () => {
        it("rejects an unsafe polygon-points string", async () => {
            const hostile =
                '0 0); } html { background: url("javascript:alert(1)"';
            const el = await fixture(
                html`<y-shape
                    type="polygon"
                    polygon-points=${hostile}
                ></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.not.include("javascript:");
            expect(style).to.not.include("url(");
            expect(style).to.include("inset(0)");
        });

        it("rejects an unsafe radius value and falls back", async () => {
            const hostile = "10px); background: red; clip-path: inset(0";
            const el = await fixture(
                html`<y-shape type="circle" radius=${hostile}></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.not.include("background: red");
            expect(style).to.include("circle(50% at 50% 50%)");
        });

        it("ignores an unknown type and treats it as rectangle", async () => {
            const el = await fixture(
                html`<y-shape type="trapezoid"></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.include("inset(0)");
        });
    });
});
