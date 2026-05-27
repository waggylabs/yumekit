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
        const el = await fixture(html`<y-shape size="large"></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("--component-shape-size-large");
    });

    it("applies aspect-ratio and leaves height auto when preserve-aspect is set", async () => {
        // preserve-aspect must leave height computable from aspect-ratio so
        // consumers can override width and have height follow. If height
        // were pinned to the size token, aspect-ratio would be a no-op.
        const el = await fixture(html`<y-shape preserve-aspect></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.include("aspect-ratio: 1 / 1");
        expect(style).to.include("height: auto");
    });

    it("anchors both width and height to the size token when preserve-aspect is unset", async () => {
        const el = await fixture(html`<y-shape></y-shape>`);
        const style = getStyleText(el);
        expect(style).to.not.include("aspect-ratio");
        expect(style).to.not.include("height: auto");
        // Width and height both reference --component-shape-size.
        const matches = style.match(/--component-shape-size/g) || [];
        expect(matches.length).to.be.at.least(2);
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

        it("rejects polygon-points with bare units (no numeric)", async () => {
            const el = await fixture(
                html`<y-shape
                    type="polygon"
                    polygon-points="px em"
                ></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.not.include("polygon(");
            expect(style).to.include("inset(0)");
        });

        it("rejects polygon-points with a trailing comma", async () => {
            const el = await fixture(
                html`<y-shape
                    type="polygon"
                    polygon-points="0% 0%, 100% 0%, 50% 100%,"
                ></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.not.include("polygon(");
            expect(style).to.include("inset(0)");
        });

        it("rejects polygon-points with fewer than 3 vertices", async () => {
            const el = await fixture(
                html`<y-shape
                    type="polygon"
                    polygon-points="0% 0%, 100% 100%"
                ></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.not.include("polygon(");
            expect(style).to.include("inset(0)");
        });

        it("rejects polygon-points where a vertex has the wrong token count", async () => {
            const el = await fixture(
                html`<y-shape
                    type="polygon"
                    polygon-points="0% 0% 0%, 100% 0%, 50% 100%"
                ></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.not.include("polygon(");
            expect(style).to.include("inset(0)");
        });

        it("rejects comma-separated ellipse radii", async () => {
            const el = await fixture(
                html`<y-shape type="ellipse" radius="40%,30%"></y-shape>`,
            );
            const style = getStyleText(el);
            // Falls back to the default 50% 50% rather than producing
            // ellipse(40%,30% ...) which is invalid CSS.
            expect(style).to.include("ellipse(50% 50% at 50% 50%)");
        });

        it("rejects ellipse radii with more than two tokens", async () => {
            const el = await fixture(
                html`<y-shape
                    type="ellipse"
                    radius="40% 30% 20%"
                ></y-shape>`,
            );
            const style = getStyleText(el);
            expect(style).to.include("ellipse(50% 50% at 50% 50%)");
        });
    });
});
