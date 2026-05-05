import { html, fixture, expect } from "@open-wc/testing";
import {
    parseColor,
    luminance,
    contrastTextColor,
    getColorVarPair,
    clamp,
    hsvToRgb,
    rgbToHsv,
    hsvToHsl,
    hslToHsv,
    rgbToHex,
    rgbaToHex,
    parseHexColor,
    parseColorString,
    resolveCSSColor,
    hideEmptySlotContainers,
    createElement,
    manageLabelVisibility,
    resolveAnchor,
    buildNavItemIcon,
    isNavItemActive,
    navigateFrom,
    GAP_TOKEN_MAP,
    measureCSSLength,
    resolveGapToken,
} from "./helpers.js";

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

    // ── createElement ────────────────────────────────────────
    describe("createElement", () => {
        it("creates an element with the given tag", () => {
            const el = createElement("div");
            expect(el.tagName).to.equal("DIV");
        });

        it("sets attributes from the attrs object", () => {
            const el = createElement("button", { class: "btn", "aria-label": "Go" });
            expect(el.getAttribute("class")).to.equal("btn");
            expect(el.getAttribute("aria-label")).to.equal("Go");
        });

        it("skips null, undefined, and false attribute values", () => {
            const el = createElement("div", { id: null, hidden: false, title: undefined });
            expect(el.hasAttribute("id")).to.be.false;
            expect(el.hasAttribute("hidden")).to.be.false;
            expect(el.hasAttribute("title")).to.be.false;
        });

        it("sets valueless attribute for true", () => {
            const el = createElement("input", { disabled: true });
            expect(el.hasAttribute("disabled")).to.be.true;
            expect(el.getAttribute("disabled")).to.equal("");
        });

        it("appends text children", () => {
            const el = createElement("span", {}, ["hello"]);
            expect(el.textContent).to.equal("hello");
        });

        it("appends DOM node children", () => {
            const child = document.createElement("em");
            const el = createElement("div", {}, [child]);
            expect(el.firstChild).to.equal(child);
        });

        it("skips falsy children", () => {
            const el = createElement("div", {}, [null, "text", undefined]);
            expect(el.childNodes.length).to.equal(1);
            expect(el.textContent).to.equal("text");
        });
    });

    // ── resolveGapToken ───────────────────────────────────────
    describe("resolveGapToken", () => {
        it("resolves a side-gap attribute to its token", () => {
            const host = document.createElement("div");
            host.setAttribute("row-gap", "large");
            expect(resolveGapToken(host, "row-gap")).to.equal(
                GAP_TOKEN_MAP.large,
            );
        });

        it("falls back to gap when the side-gap is unset", () => {
            const host = document.createElement("div");
            host.setAttribute("gap", "small");
            expect(resolveGapToken(host, "row-gap")).to.equal(
                GAP_TOKEN_MAP.small,
            );
        });

        it("falls back to medium when nothing is set", () => {
            const host = document.createElement("div");
            expect(resolveGapToken(host, "gap")).to.equal(GAP_TOKEN_MAP.medium);
        });

        it("ignores unknown values and falls back", () => {
            const host = document.createElement("div");
            host.setAttribute("gap", "wat");
            expect(resolveGapToken(host, "gap")).to.equal(GAP_TOKEN_MAP.medium);
        });
    });

    // ── measureCSSLength ──────────────────────────────────────
    describe("measureCSSLength", () => {
        it("measures a px length", async () => {
            const container = await fixture(html`<div></div>`);
            expect(measureCSSLength(container, "32px")).to.equal(32);
        });

        it("removes the probe element after measurement", async () => {
            const container = await fixture(html`<div></div>`);
            measureCSSLength(container, "16px");
            expect(container.children.length).to.equal(0);
        });
    });

    // ── clamp ─────────────────────────────────────────────────
    describe("clamp", () => {
        it("returns the value when within range", () => {
            expect(clamp(5, 0, 10)).to.equal(5);
        });

        it("clamps to min when below range", () => {
            expect(clamp(-5, 0, 10)).to.equal(0);
        });

        it("clamps to max when above range", () => {
            expect(clamp(15, 0, 10)).to.equal(10);
        });
    });

    // ── hsvToRgb ──────────────────────────────────────────────
    describe("hsvToRgb", () => {
        it("converts pure red", () => {
            expect(hsvToRgb(0, 100, 100)).to.deep.equal([255, 0, 0]);
        });

        it("converts pure green", () => {
            expect(hsvToRgb(120, 100, 100)).to.deep.equal([0, 255, 0]);
        });

        it("converts pure blue", () => {
            expect(hsvToRgb(240, 100, 100)).to.deep.equal([0, 0, 255]);
        });

        it("normalizes hue outside 0-360", () => {
            expect(hsvToRgb(360, 100, 100)).to.deep.equal([255, 0, 0]);
            expect(hsvToRgb(-360, 100, 100)).to.deep.equal([255, 0, 0]);
        });

        it("returns black for value 0", () => {
            expect(hsvToRgb(180, 100, 0)).to.deep.equal([0, 0, 0]);
        });
    });

    // ── rgbToHsv ──────────────────────────────────────────────
    describe("rgbToHsv", () => {
        it("converts pure red", () => {
            expect(rgbToHsv(255, 0, 0)).to.deep.equal([0, 100, 100]);
        });

        it("converts pure green", () => {
            expect(rgbToHsv(0, 255, 0)).to.deep.equal([120, 100, 100]);
        });

        it("converts pure blue", () => {
            expect(rgbToHsv(0, 0, 255)).to.deep.equal([240, 100, 100]);
        });

        it("returns 0 saturation for grayscale", () => {
            const [, s] = rgbToHsv(128, 128, 128);
            expect(s).to.equal(0);
        });
    });

    // ── hsvToHsl ──────────────────────────────────────────────
    describe("hsvToHsl", () => {
        it("converts pure red", () => {
            expect(hsvToHsl(0, 100, 100)).to.deep.equal([0, 100, 50]);
        });

        it("returns 0 saturation when value is 0", () => {
            expect(hsvToHsl(180, 100, 0)).to.deep.equal([180, 0, 0]);
        });
    });

    // ── hslToHsv ──────────────────────────────────────────────
    describe("hslToHsv", () => {
        it("converts pure red", () => {
            expect(hslToHsv(0, 100, 50)).to.deep.equal([0, 100, 100]);
        });

        it("returns 0 saturation when lightness is 0", () => {
            expect(hslToHsv(180, 100, 0)).to.deep.equal([180, 0, 0]);
        });
    });

    // ── rgbToHex ──────────────────────────────────────────────
    describe("rgbToHex", () => {
        it("formats rgb as a 6-digit hex string", () => {
            expect(rgbToHex(255, 0, 0)).to.equal("#ff0000");
        });

        it("zero-pads each channel", () => {
            expect(rgbToHex(0, 0, 0)).to.equal("#000000");
            expect(rgbToHex(1, 2, 3)).to.equal("#010203");
        });
    });

    // ── rgbaToHex ─────────────────────────────────────────────
    describe("rgbaToHex", () => {
        it("appends alpha as a third byte", () => {
            expect(rgbaToHex(255, 0, 0, 1)).to.equal("#ff0000ff");
        });

        it("encodes 50% alpha as 0x80", () => {
            expect(rgbaToHex(0, 0, 0, 0.5)).to.equal("#00000080");
        });
    });

    // ── parseHexColor ─────────────────────────────────────────
    describe("parseHexColor", () => {
        it("parses a 6-digit hex", () => {
            expect(parseHexColor("#ff0000")).to.deep.equal({
                r: 255,
                g: 0,
                b: 0,
                a: 1,
            });
        });

        it("parses an 8-digit hex with alpha", () => {
            const c = parseHexColor("#ff000080");
            expect(c.r).to.equal(255);
            expect(c.a).to.be.closeTo(0.5, 0.01);
        });

        it("expands 3-digit shorthand", () => {
            expect(parseHexColor("#f00")).to.deep.equal({
                r: 255,
                g: 0,
                b: 0,
                a: 1,
            });
        });

        it("returns null for invalid lengths", () => {
            expect(parseHexColor("#ff")).to.be.null;
        });
    });

    // ── parseColorString ──────────────────────────────────────
    describe("parseColorString", () => {
        it("parses a hex color", () => {
            expect(parseColorString("#ff0000")).to.deep.equal({
                r: 255,
                g: 0,
                b: 0,
                a: 1,
            });
        });

        it("parses an rgb() string", () => {
            expect(parseColorString("rgb(10, 20, 30)")).to.deep.equal({
                r: 10,
                g: 20,
                b: 30,
                a: 1,
            });
        });

        it("parses an rgba() string with alpha", () => {
            const c = parseColorString("rgba(10, 20, 30, 0.5)");
            expect(c.r).to.equal(10);
            expect(c.a).to.equal(0.5);
        });

        it("parses an hsl() string", () => {
            const c = parseColorString("hsl(0, 100%, 50%)");
            expect(c.r).to.equal(255);
            expect(c.g).to.equal(0);
            expect(c.b).to.equal(0);
        });

        it("parses an hsv() string", () => {
            const c = parseColorString("hsv(120, 100%, 100%)");
            expect(c.g).to.equal(255);
        });

        it("returns null for empty or non-string input", () => {
            expect(parseColorString("")).to.be.null;
            expect(parseColorString(null)).to.be.null;
        });

        it("returns null for an unparseable string", () => {
            expect(parseColorString("notacolor")).to.be.null;
        });
    });

    // ── manageLabelVisibility ─────────────────────────────────
    describe("manageLabelVisibility", () => {
        let tagSeq = 0;

        function defineHost() {
            const tag = `mlv-host-${tagSeq++}`;
            customElements.define(
                tag,
                class extends HTMLElement {
                    constructor() {
                        super();
                        this.attachShadow({ mode: "open" });
                        this.shadowRoot.innerHTML = `
                            <div class="label-wrap" style="display:none;">
                                <slot name="label"></slot>
                            </div>
                        `;
                    }
                },
            );
            return tag;
        }

        it("shows the wrapper when the slot has content", async () => {
            const tag = defineHost();
            const el = await fixture(
                `<${tag}><span slot="label">Title</span></${tag}>`,
            );
            const wrap = el.shadowRoot.querySelector(".label-wrap");
            manageLabelVisibility(wrap);
            wrap.querySelector("slot").dispatchEvent(new Event("slotchange"));
            expect(wrap.style.display).to.equal("flex");
        });

        it("hides the wrapper (empty display) when the slot is empty", async () => {
            const tag = defineHost();
            const el = await fixture(`<${tag}></${tag}>`);
            const wrap = el.shadowRoot.querySelector(".label-wrap");
            manageLabelVisibility(wrap);
            wrap.querySelector("slot").dispatchEvent(new Event("slotchange"));
            expect(wrap.style.display).to.equal("");
        });

        it("does nothing when the wrapper is null", () => {
            expect(() => manageLabelVisibility(null)).to.not.throw();
        });

        it("does nothing when no label slot is present", () => {
            const wrap = document.createElement("div");
            wrap.style.display = "none";
            manageLabelVisibility(wrap);
            expect(wrap.style.display).to.equal("none");
        });
    });

    // ── resolveAnchor ─────────────────────────────────────────
    describe("resolveAnchor", () => {
        it("resolves synchronously when the anchor already exists", () => {
            const host = document.createElement("div");
            const anchor = document.createElement("div");
            anchor.id = "ra-sync-anchor";
            document.body.append(host, anchor);

            let found = null;
            resolveAnchor(host, "ra-sync-anchor", (el) => {
                found = el;
            });
            expect(found).to.equal(anchor);

            host.remove();
            anchor.remove();
        });

        it("resolves asynchronously when the anchor appears later", async () => {
            const host = document.createElement("div");
            document.body.appendChild(host);

            let found = null;
            const dispose = resolveAnchor(host, "ra-async-anchor", (el) => {
                found = el;
            });

            const anchor = document.createElement("div");
            anchor.id = "ra-async-anchor";
            await new Promise((r) => requestAnimationFrame(r));
            document.body.appendChild(anchor);

            await new Promise((r) => setTimeout(r, 50));
            expect(found).to.equal(anchor);

            dispose();
            host.remove();
            anchor.remove();
        });

        it("dispose cancels pending resolution", async () => {
            const host = document.createElement("div");
            document.body.appendChild(host);

            let found = null;
            const dispose = resolveAnchor(
                host,
                "ra-cancel-anchor",
                (el) => {
                    found = el;
                },
            );
            dispose();

            const anchor = document.createElement("div");
            anchor.id = "ra-cancel-anchor";
            document.body.appendChild(anchor);
            await new Promise((r) => setTimeout(r, 50));
            expect(found).to.be.null;

            host.remove();
            anchor.remove();
        });
    });

    // ── buildNavItemIcon ──────────────────────────────────────
    describe("buildNavItemIcon", () => {
        it("creates a y-icon for a named icon", () => {
            const el = buildNavItemIcon("home", "medium");
            expect(el.tagName.toLowerCase()).to.equal("y-icon");
            expect(el.getAttribute("name")).to.equal("home");
            expect(el.getAttribute("size")).to.equal("medium");
            expect(el.getAttribute("slot")).to.equal("left-icon");
        });

        it("wraps raw SVG markup in a span escape hatch", () => {
            const el = buildNavItemIcon("<svg><circle/></svg>", "medium");
            expect(el.tagName.toLowerCase()).to.equal("span");
            expect(el.getAttribute("slot")).to.equal("left-icon");
            expect(el.innerHTML).to.include("<svg");
        });

        it("trims leading whitespace before checking for SVG markup", () => {
            const el = buildNavItemIcon("   <svg></svg>", "medium");
            expect(el.tagName.toLowerCase()).to.equal("span");
        });
    });

    // ── isNavItemActive ───────────────────────────────────────
    describe("isNavItemActive", () => {
        it("returns true when item.selected is true", () => {
            expect(isNavItemActive({ selected: true })).to.be.true;
        });

        it("returns false when item has no href and no selected flag", () => {
            expect(isNavItemActive({})).to.be.false;
        });

        it("returns true when href matches the current path+search+hash", () => {
            const cur =
                window.location.pathname +
                window.location.search +
                window.location.hash;
            expect(isNavItemActive({ href: cur })).to.be.true;
        });

        it("returns true when href matches the full URL", () => {
            expect(isNavItemActive({ href: window.location.href })).to.be.true;
        });

        it("returns false for an unrelated href", () => {
            expect(isNavItemActive({ href: "/never-going-to-match-12345" }))
                .to.be.false;
        });
    });

    // ── navigateFrom ──────────────────────────────────────────
    describe("navigateFrom", () => {
        it("dispatches a cancelable navigate event with the href in detail", async () => {
            const host = await fixture(html`<div></div>`);
            let captured = null;
            host.addEventListener("navigate", (e) => {
                captured = e;
                e.preventDefault();
            });
            navigateFrom(host, "/test-href");
            expect(captured).to.not.be.null;
            expect(captured.detail).to.deep.equal({ href: "/test-href" });
            expect(captured.cancelable).to.be.true;
        });

        it("does not change history when the event is preventDefault'd", async () => {
            const host = await fixture(html`<div></div>`);
            host.addEventListener("navigate", (e) => e.preventDefault());
            const before = window.location.pathname;
            navigateFrom(host, "/should-not-navigate");
            expect(window.location.pathname).to.equal(before);
        });

        it("calls history.pushState by default and updates the URL", async () => {
            const host = await fixture(html`<div></div>`);
            const initialState = history.state;
            const initialPath =
                window.location.pathname +
                window.location.search +
                window.location.hash;
            const target = `/test-pushstate-${Date.now()}`;
            try {
                navigateFrom(host, target);
                expect(window.location.pathname).to.equal(target);
            } finally {
                history.replaceState(initialState, "", initialPath);
            }
        });
    });
});
