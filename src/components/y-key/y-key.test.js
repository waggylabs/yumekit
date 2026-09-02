import { fixture, html, expect } from "@open-wc/testing";
import sinon from "sinon";
import { YumeKey } from "./y-key.js";

const caps = (el) =>
    [...el.shadowRoot.querySelectorAll(".chord kbd")].map(
        (kbd) => kbd.textContent,
    );

describe("YumeKey", () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("chord parsing", () => {
        it("resolves mod to Command on mac", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+k"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘", "K"]);
        });

        it("resolves mod to Ctrl off mac", async () => {
            const el = await fixture(
                html`<y-key platform="windows" keys="mod+k"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["Ctrl", "K"]);
        });

        it("keeps cmd as the literal Meta key off mac", async () => {
            const el = await fixture(
                html`<y-key platform="windows" keys="cmd+k"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["Win", "K"]);
        });

        it("matches tokens case-insensitively", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="MOD+Shift"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘", "⇧"]);
        });

        it("tolerates whitespace around tokens", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys=" mod + shift + k "></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘", "⇧", "K"]);
        });

        it("folds aliases into their canonical token", async () => {
            const el = await fixture(
                html`<y-key
                    platform="mac"
                    keys="command+option+return"
                ></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘", "⌥", "⏎"]);
        });

        it("renders plus as a literal +", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+plus"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘", "+"]);
        });

        it("uppercases single characters", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+z"></y-key>`,
            );
            expect(caps(el)[1]).to.equal("Z");
        });

        it("passes an unknown token through verbatim and logs nothing", async () => {
            const warn = sandbox.stub(console, "warn");
            const error = sandbox.stub(console, "error");

            const el = await fixture(
                html`<y-key platform="mac" keys="mod+Frobnicate"></y-key>`,
            );

            expect(caps(el)).to.deep.equal(["⌘", "Frobnicate"]);
            expect(warn.callCount).to.equal(0);
            expect(error.callCount).to.equal(0);
        });
    });

    describe("notation", () => {
        it("uses symbols on mac by default", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="alt+esc"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌥", "⎋"]);
        });

        it("uses words off mac by default", async () => {
            const el = await fixture(
                html`<y-key platform="linux" keys="alt+esc"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["Alt", "Esc"]);
        });

        it("yields Apple word forms with notation=text on mac", async () => {
            const el = await fixture(
                html`<y-key
                    platform="mac"
                    notation="text"
                    keys="mod+alt+delete"
                ></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["Cmd", "Opt", "Del"]);
        });

        it("uses cross-platform symbols with notation=symbol off mac, falling back to words", async () => {
            const el = await fixture(
                html`<y-key
                    platform="windows"
                    notation="symbol"
                    keys="shift+alt+up"
                ></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⇧", "Alt", "↑"]);
        });
    });

    describe("accessible name", () => {
        it("names the host with the spoken chord", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+shift+k"></y-key>`,
            );
            expect(el.getAttribute("aria-label")).to.equal(
                "Command Shift K",
            );
        });

        it("hides the caps from assistive technology", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+k"></y-key>`,
            );
            const chord = el.shadowRoot.querySelector(".chord");
            expect(chord.getAttribute("aria-hidden")).to.equal("true");
        });

        it("lets the label attribute win over the computed name", async () => {
            const el = await fixture(
                html`<y-key
                    platform="mac"
                    keys="mod+k"
                    label="Open search"
                ></y-key>`,
            );
            expect(el.getAttribute("aria-label")).to.equal("Open search");
        });

        it("never clobbers an author-set aria-label", async () => {
            const el = await fixture(
                html`<y-key
                    platform="mac"
                    keys="mod+k"
                    aria-label="Quick open"
                ></y-key>`,
            );
            expect(el.getAttribute("aria-label")).to.equal("Quick open");

            el.keys = "mod+p";
            expect(el.getAttribute("aria-label")).to.equal("Quick open");
        });

        it("updates its own name when the chord changes", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+k"></y-key>`,
            );
            el.keys = "esc";
            expect(el.getAttribute("aria-label")).to.equal("Escape");
        });
    });

    describe("slot mode", () => {
        it("caps the slotted content and sets no aria-label", async () => {
            const el = await fixture(html`<y-key>F1</y-key>`);
            const cap = el.shadowRoot.querySelector('kbd[part="key"]');

            expect(el.shadowRoot.querySelectorAll("slot").length).to.equal(1);
            expect(cap.querySelectorAll("slot").length).to.equal(1);
            expect(cap.hasAttribute("hidden")).to.equal(false);
            expect(el.hasAttribute("aria-label")).to.equal(false);
        });

        it("hides the slot cap when keys is present", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="esc">F1</y-key>`,
            );
            const slotCap = el.shadowRoot.querySelector("slot").closest("kbd");

            expect(slotCap.hasAttribute("hidden")).to.equal(true);
            expect(caps(el)).to.deep.equal(["⎋"]);
        });

        it("drops its own aria-label when keys is removed", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="esc">F1</y-key>`,
            );
            el.removeAttribute("keys");

            expect(el.hasAttribute("aria-label")).to.equal(false);
        });
    });

    describe("layout options", () => {
        it("renders exactly one cap when combined", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+shift+k" combined></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘⇧K"]);
        });

        it("emits separators between caps and none at the ends", async () => {
            const el = await fixture(
                html`<y-key
                    platform="windows"
                    keys="mod+shift+k"
                    separator="+"
                ></y-key>`,
            );
            const chord = el.shadowRoot.querySelector(".chord");
            const separators =
                el.shadowRoot.querySelectorAll('[part="separator"]');

            expect(separators.length).to.equal(2);
            expect(chord.textContent).to.equal("Ctrl+Shift+K");
        });

        it("renders no separators when combined", async () => {
            const el = await fixture(
                html`<y-key
                    platform="mac"
                    keys="mod+k"
                    separator="+"
                    combined
                ></y-key>`,
            );
            expect(
                el.shadowRoot.querySelectorAll('[part="separator"]').length,
            ).to.equal(0);
        });

        it("marks every cap with part=key in both modes", async () => {
            const chordEl = await fixture(
                html`<y-key platform="mac" keys="mod+k"></y-key>`,
            );
            const slotEl = await fixture(html`<y-key>F1</y-key>`);

            expect(
                chordEl.shadowRoot.querySelectorAll('.chord [part="key"]')
                    .length,
            ).to.equal(2);
            expect(
                slotEl.shadowRoot.querySelectorAll('[part="key"]').length,
            ).to.equal(1);
        });
    });

    describe("color", () => {
        it("defaults to the base scheme", async () => {
            const el = await fixture(html`<y-key keys="esc"></y-key>`);
            const style = el.shadowRoot.querySelector("style").textContent;
            expect(style).to.include("--base-content--");
        });

        it("applies a semantic scheme", async () => {
            const el = await fixture(
                html`<y-key keys="esc" color="primary"></y-key>`,
            );
            const style = el.shadowRoot.querySelector("style").textContent;
            expect(style).to.include("--primary-content--");
        });

        it("accepts a safe CSS color literal", async () => {
            const el = await fixture(
                html`<y-key keys="esc" color="#ff0055"></y-key>`,
            );
            const style = el.shadowRoot.querySelector("style").textContent;
            expect(style).to.include("#ff0055");
        });

        it("falls back to base for an unsafe literal", async () => {
            const el = await fixture(
                html`<y-key keys="esc" color="red; }"></y-key>`,
            );
            const style = el.shadowRoot.querySelector("style").textContent;

            expect(style).to.not.include("red; }");
            expect(style).to.include("--base-content--");
        });
    });

    describe("variants and sizes", () => {
        it("defaults to the outlined variant at medium size", async () => {
            const el = await fixture(html`<y-key keys="esc"></y-key>`);
            const style = el.shadowRoot.querySelector("style").textContent;

            expect(style).to.include("--component-key-edge-width");
            expect(style).to.include("--component-key-height-medium");
        });

        it("drops the edge for the flat variant", async () => {
            const el = await fixture(
                html`<y-key keys="esc" variant="flat"></y-key>`,
            );
            const style = el.shadowRoot.querySelector("style").textContent;
            expect(style).to.include("border-color: transparent");
        });

        it("applies the requested size tokens", async () => {
            const el = await fixture(
                html`<y-key keys="esc" size="large"></y-key>`,
            );
            const style = el.shadowRoot.querySelector("style").textContent;
            expect(style).to.include("--component-key-height-large");
        });
    });

    describe("reactivity", () => {
        it("re-renders on every observed attribute", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod+k"></y-key>`,
            );
            const renderSpy = sandbox.spy(el, "render");

            for (const name of YumeKey.observedAttributes) {
                el.setAttribute(name, "x");
            }

            expect(renderSpy.callCount).to.equal(
                YumeKey.observedAttributes.length,
            );
        });

        it("applies a property set before upgrade", async () => {
            const el = document.createElement("y-key");
            el.setAttribute("platform", "mac");

            // Simulate a framework assigning `keys` before the definition
            // upgraded the element: an own property shadowing the setter.
            Object.defineProperty(el, "keys", {
                configurable: true,
                enumerable: true,
                writable: true,
                value: "esc",
            });

            document.body.appendChild(el);

            expect(el.getAttribute("keys")).to.equal("esc");
            expect(caps(el)).to.deep.equal(["⎋"]);

            el.remove();
        });
    });

    describe("platform detection", () => {
        it("renders without a navigator", async () => {
            const descriptor = Object.getOwnPropertyDescriptor(
                globalThis,
                "navigator",
            );
            Object.defineProperty(globalThis, "navigator", {
                value: undefined,
                configurable: true,
            });

            try {
                const el = await fixture(html`<y-key keys="esc"></y-key>`);
                expect(caps(el).length).to.equal(1);
            } finally {
                if (descriptor) {
                    Object.defineProperty(globalThis, "navigator", descriptor);
                } else {
                    delete globalThis.navigator;
                }
            }
        });

        it("honors an explicit platform over detection", async () => {
            const el = await fixture(
                html`<y-key platform="mac" keys="mod"></y-key>`,
            );
            expect(caps(el)).to.deep.equal(["⌘"]);
        });
    });
});
