import { html, fixture, expect } from "@open-wc/testing";
import {
    parseColor,
    luminance,
    contrastTextColor,
    getColorVarPair,
    resolveCSSColor,
    hideEmptySlotContainers,
} from "../src/modules/helpers.js";

describe("helpers", () => {
    // ── parseColor ────────────────────────────────────────────
    describe("parseColor", () => {
        it("parses a 6-char hex color", () => {
            expect(parseColor("#ff0000")).to.deep.equal({ r: 255, g: 0, b: 0 });
        });

        it("expands a 3-char hex shorthand", () => {
            expect(parseColor("#f00")).to.deep.equal({ r: 255, g: 0, b: 0 });
        });

        it("expands a 4-char hex shorthand", () => {
            expect(parseColor("#f00f")).to.deep.equal({
                r: 255,
                g: 0,
                b: 0,
            });
        });

        it("parses an rgb() color", () => {
            expect(parseColor("rgb(10, 20, 30)")).to.deep.equal({
                r: 10,
                g: 20,
                b: 30,
            });
        });

        it("parses an rgba() color", () => {
            expect(parseColor("rgba(10, 20, 30, 0.5)")).to.deep.equal({
                r: 10,
                g: 20,
                b: 30,
            });
        });

        it("returns null for an unparseable color string", () => {
            expect(parseColor("hsl(120, 100%, 50%)")).to.be.null;
        });

        it("returns null for an arbitrary string", () => {
            expect(parseColor("notacolor")).to.be.null;
        });
    });

    // ── luminance ─────────────────────────────────────────────
    describe("luminance", () => {
        it("returns 0 for black", () => {
            expect(luminance({ r: 0, g: 0, b: 0 })).to.equal(0);
        });

        it("returns ~1 for white", () => {
            expect(luminance({ r: 255, g: 255, b: 255 })).to.be.closeTo(
                1,
                0.001,
            );
        });
    });

    // ── contrastTextColor ─────────────────────────────────────
    describe("contrastTextColor", () => {
        it("returns white text for a dark background", () => {
            expect(contrastTextColor("#000000")).to.include("white");
        });

        it("returns black text for a light background", () => {
            expect(contrastTextColor("#ffffff")).to.include("black");
        });

        it("returns white for an unparseable color", () => {
            expect(contrastTextColor("hsl(120, 100%, 50%)")).to.include(
                "white",
            );
        });
    });

    // ── getColorVarPair ───────────────────────────────────────
    describe("getColorVarPair", () => {
        it("returns CSS vars for a known color name", () => {
            const [bg, fg] = getColorVarPair("primary");
            expect(bg).to.include("--primary-content--");
            expect(fg).to.include("--primary-content-inverse");
        });

        it("returns the raw hex color and auto-contrasted text for a custom hex color", () => {
            const [bg, fg] = getColorVarPair("#ff0000");
            expect(bg).to.equal("#ff0000");
            expect(fg).to.be.a("string");
        });

        it("returns base vars for an unknown color name with default fallback", () => {
            const [bg, fg] = getColorVarPair("unknown");
            expect(bg).to.include("--base-content--");
        });

        it("passes the raw color through when fallbackColor is null", () => {
            const [bg, fg] = getColorVarPair("custom-value", null);
            expect(bg).to.equal("custom-value");
            expect(fg).to.equal("var(--base-content-inverse)");
        });

        it("falls back to base when fallbackColor is also an unknown color name", () => {
            const [bg, fg] = getColorVarPair("unknown", "also-unknown");
            expect(bg).to.include("--base-content--");
        });
    });

    // ── resolveCSSColor ───────────────────────────────────────
    describe("resolveCSSColor", () => {
        it("returns the expression unchanged when it is not a var()", () => {
            expect(resolveCSSColor("#ff0000", document.body)).to.equal(
                "#ff0000",
            );
        });

        it("resolves a var() expression from an element's computed style", () => {
            const el = document.createElement("div");
            el.style.setProperty("--test-resolve-color", "rgb(1, 2, 3)");
            document.body.appendChild(el);
            const result = resolveCSSColor("var(--test-resolve-color)", el);
            document.body.removeChild(el);
            expect(result).to.be.a("string");
        });

        it("falls back to the var() expression when the property is not set", () => {
            const el = document.createElement("div");
            document.body.appendChild(el);
            const result = resolveCSSColor("var(--nonexistent-prop)", el);
            document.body.removeChild(el);
            expect(result).to.equal("var(--nonexistent-prop)");
        });
    });

    // ── hideEmptySlotContainers ───────────────────────────────
    describe("hideEmptySlotContainers", () => {
        it("hides a container when its named slot has no assigned content", async () => {
            const el = await fixture(
                html`<div></div>`,
            );
            el.attachShadow({ mode: "open" });
            el.shadowRoot.innerHTML = `
                <slot name="header"></slot>
                <div class="header-wrap">Header</div>
            `;
            hideEmptySlotContainers(el.shadowRoot, { header: ".header-wrap" });
            expect(
                el.shadowRoot.querySelector(".header-wrap").style.display,
            ).to.equal("none");
        });

        it("shows a container when its named slot has content", async () => {
            const el = await fixture(
                html`<div><span slot="header">Title</span></div>`,
            );
            el.attachShadow({ mode: "open" });
            el.shadowRoot.innerHTML = `
                <slot name="header"></slot>
                <div class="header-wrap">Header</div>
            `;
            hideEmptySlotContainers(el.shadowRoot, { header: ".header-wrap" });
            expect(
                el.shadowRoot.querySelector(".header-wrap").style.display,
            ).to.not.equal("none");
        });

        it("filters out whitespace-only text nodes when checking the default slot", async () => {
            // Register a one-off custom element so shadow DOM slot assignment works
            const tagName = "test-slot-host-" + Math.random().toString(36).slice(2);
            customElements.define(
                tagName,
                class extends HTMLElement {
                    constructor() {
                        super();
                        this.attachShadow({ mode: "open" });
                        this.shadowRoot.innerHTML = `
                            <slot></slot>
                            <div class="body-wrap"></div>
                        `;
                    }
                },
            );

            // Only whitespace between the tags → text node goes to default slot
            const el = await fixture(`<${tagName}>   </${tagName}>`);

            hideEmptySlotContainers(el.shadowRoot, { "": ".body-wrap" });
            expect(
                el.shadowRoot.querySelector(".body-wrap").style.display,
            ).to.equal("none");
        });
    });
});
