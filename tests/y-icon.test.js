import { html, fixture, expect } from "@open-wc/testing";
import "../src/components/y-icon.js";

describe("YumeIcon", () => {
    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        const wrapper = el.shadowRoot.querySelector(".icon-wrapper");
        expect(wrapper).to.exist;
        expect(wrapper.getAttribute("part")).to.equal("icon");
    });

    it("renders the correct SVG for a given name", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg).to.exist;
    });

    it("renders empty when name is invalid", async () => {
        const el = await fixture(
            html`<y-icon name="nonexistent"></y-icon>`,
        );
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg).to.not.exist;
    });

    it("renders empty when no name is provided", async () => {
        const el = await fixture(html`<y-icon></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg).to.not.exist;
    });

    it("has correct default property values", async () => {
        const el = await fixture(html`<y-icon name="star"></y-icon>`);
        expect(el.name).to.equal("star");
        expect(el.size).to.equal("medium");
        expect(el.color).to.equal("base");
    });

    it("applies size attribute to host styles", async () => {
        const small = await fixture(
            html`<y-icon name="home" size="small"></y-icon>`,
        );
        const large = await fixture(
            html`<y-icon name="home" size="large"></y-icon>`,
        );
        const smallStyle =
            small.shadowRoot.querySelector("style").textContent;
        const largeStyle =
            large.shadowRoot.querySelector("style").textContent;

        expect(smallStyle).to.include("--component-icon-size-small");
        expect(largeStyle).to.include("--component-icon-size-large");
    });

    it("applies color attribute to host styles", async () => {
        const el = await fixture(
            html`<y-icon name="home" color="primary"></y-icon>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--primary-content--");
    });

    it("applies base color by default", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--base-content--");
    });

    it("supports all semantic colors", async () => {
        const colors = [
            "base",
            "primary",
            "secondary",
            "success",
            "warning",
            "error",
            "help",
        ];
        for (const color of colors) {
            const el = await fixture(
                html`<y-icon name="star" color="${color}"></y-icon>`,
            );
            const style = el.shadowRoot.querySelector("style").textContent;
            expect(style).to.include(`--${color}-content--`);
        }
    });

    it("falls back to base color for unknown color values", async () => {
        const el = await fixture(
            html`<y-icon name="home" color="nope"></y-icon>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--base-content--");
    });

    it("falls back to medium size for unknown size values", async () => {
        const el = await fixture(
            html`<y-icon name="home" size="huge"></y-icon>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--component-icon-size-medium");
    });

    it("updates SVG when name attribute changes", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        const svgBefore = el.shadowRoot.querySelector("svg").outerHTML;

        el.setAttribute("name", "star");
        const svgAfter = el.shadowRoot.querySelector("svg").outerHTML;
        expect(svgAfter).to.not.equal(svgBefore);
    });

    it("updates styles when size attribute changes", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        const styleBefore =
            el.shadowRoot.querySelector("style").textContent;
        expect(styleBefore).to.include("--component-icon-size-medium");

        el.setAttribute("size", "large");
        const styleAfter =
            el.shadowRoot.querySelector("style").textContent;
        expect(styleAfter).to.include("--component-icon-size-large");
    });

    it("updates styles when color attribute changes", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        el.setAttribute("color", "error");
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("--error-content--");
    });

    it("does not re-render when attribute value is unchanged", async () => {
        const el = await fixture(
            html`<y-icon name="home" size="medium"></y-icon>`,
        );
        const wrapper = el.shadowRoot.querySelector(".icon-wrapper");
        el.setAttribute("size", "medium");
        // Same DOM node should still be there (no unnecessary re-render)
        expect(el.shadowRoot.querySelector(".icon-wrapper")).to.equal(
            wrapper,
        );
    });

    it("supports hyphenated icon names", async () => {
        const el = await fixture(
            html`<y-icon name="arrow-right"></y-icon>`,
        );
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg).to.exist;
    });

    it("renders different icons correctly", async () => {
        const names = [
            "home",
            "search",
            "star",
            "settings",
            "mail",
            "user",
            "arrow-right",
            "chevron-down",
        ];
        for (const name of names) {
            const el = await fixture(
                html`<y-icon name="${name}"></y-icon>`,
            );
            const svg = el.shadowRoot.querySelector("svg");
            expect(svg, `icon "${name}" should render an SVG`).to.exist;
        }
    });

    it("uses inline-flex display", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);
        const style = el.shadowRoot.querySelector("style").textContent;
        expect(style).to.include("display: inline-flex");
    });

    it("sets width and height to the same size value", async () => {
        const el = await fixture(
            html`<y-icon name="home" size="small"></y-icon>`,
        );
        const style = el.shadowRoot.querySelector("style").textContent;
        const sizeVar = "--component-icon-size-small";
        // Both width and height should reference the same size var
        const widthMatch = style.match(/width:\s*var\(([^)]+)\)/);
        const heightMatch = style.match(/height:\s*var\(([^)]+)\)/);
        expect(widthMatch[1]).to.include(sizeVar);
        expect(heightMatch[1]).to.include(sizeVar);
    });

    it("property setters update attributes", async () => {
        const el = await fixture(html`<y-icon name="home"></y-icon>`);

        el.name = "star";
        expect(el.getAttribute("name")).to.equal("star");

        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");

        el.color = "success";
        expect(el.getAttribute("color")).to.equal("success");
    });
});
