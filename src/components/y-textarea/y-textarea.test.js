import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-textarea.js";

describe("YumeTextarea", () => {
    it("variant='underline' renders a bottom-only border with square bottom corners", async () => {
        const el = await fixture(html`<y-textarea variant="underline"></y-textarea>`);
        el.style.setProperty("--component-inputs-border-radius-outer", "6px");
        const cs = getComputedStyle(el.shadowRoot.querySelector(".input-container"));
        expect(cs.borderTopStyle).to.equal("none");
        expect(cs.borderBottomStyle).to.equal("solid");
        expect(cs.borderTopLeftRadius).to.equal("6px");
        expect(cs.borderBottomLeftRadius).to.equal("0px");
    });

    it("focuses the textarea when the container padding is clicked", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");
        const container = el.shadowRoot.querySelector(".input-container");

        container.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, cancelable: true })
        );

        expect(el.shadowRoot.activeElement).to.equal(textarea);
    });

    // ── Structure ─────────────────────────────────────────────
    it("renders a textarea element, not an input", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");
        const input = el.shadowRoot.querySelector("input");

        expect(textarea).to.exist;
        expect(input).to.not.exist;
    });

    it("exposes textarea via part attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("[part='textarea']");
        expect(textarea).to.exist;
    });

    it("renders input-container and input-wrapper", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        expect(el.shadowRoot.querySelector(".input-container")).to.exist;
        expect(el.shadowRoot.querySelector(".input-wrapper")).to.exist;
    });

    // ── Defaults ──────────────────────────────────────────────
    it("defaults to 3 rows", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");
        expect(textarea.getAttribute("rows")).to.equal("3");
    });

    it("defaults value to empty string", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        expect(el.value).to.equal("");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const style = el.shadowRoot.adoptedStyleSheets[0].cssRules;
        const rules = Array.from(style).map((r) => r.cssText).join(" ");
        expect(rules).to.include("--component-inputs-padding-medium");
    });

    it("container aligns to flex-start for multiline content", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("align-items: flex-start");
    });

    // ── Value ─────────────────────────────────────────────────
    it("sets initial value via attribute", async () => {
        const el = await fixture(
            html`<y-textarea value="Hello"></y-textarea>`,
        );
        expect(el.value).to.equal("Hello");
        expect(el.shadowRoot.querySelector("textarea").value).to.equal("Hello");
    });

    it("value setter updates the textarea", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.value = "Updated";
        expect(el.value).to.equal("Updated");
        expect(el.shadowRoot.querySelector("textarea").value).to.equal(
            "Updated",
        );
    });

    it("value attribute change updates textarea", async () => {
        const el = await fixture(
            html`<y-textarea value="Before"></y-textarea>`,
        );
        el.setAttribute("value", "After");
        await new Promise((r) => setTimeout(r, 0));
        expect(el.shadowRoot.querySelector("textarea").value).to.equal("After");
    });

    // ── Rows ──────────────────────────────────────────────────
    it("respects rows attribute", async () => {
        const el = await fixture(
            html`<y-textarea rows="6"></y-textarea>`,
        );
        const textarea = el.shadowRoot.querySelector("textarea");
        expect(textarea.getAttribute("rows")).to.equal("6");
    });

    it("re-renders when rows attribute changes", async () => {
        const el = await fixture(
            html`<y-textarea rows="3"></y-textarea>`,
        );
        el.setAttribute("rows", "8");
        await new Promise((r) => setTimeout(r, 0));
        expect(
            el.shadowRoot.querySelector("textarea").getAttribute("rows"),
        ).to.equal("8");
    });

    // ── Size ──────────────────────────────────────────────────
    it("applies small size padding variable", async () => {
        const el = await fixture(
            html`<y-textarea size="small"></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--component-inputs-padding-small");
    });

    it("applies large size padding variable", async () => {
        const el = await fixture(
            html`<y-textarea size="large"></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--component-inputs-padding-large");
    });

    // ── Disabled ──────────────────────────────────────────────
    it("disables the textarea element when disabled attribute is set", async () => {
        const el = await fixture(
            html`<y-textarea disabled></y-textarea>`,
        );
        const textarea = el.shadowRoot.querySelector("textarea");
        expect(textarea.hasAttribute("disabled")).to.be.true;
    });

    it("applies disabled opacity and pointer-events via CSS", async () => {
        const el = await fixture(
            html`<y-textarea disabled></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("opacity: 0.75");
        expect(rules).to.include("pointer-events: none");
    });

    it("uses disabled background variable when disabled", async () => {
        const el = await fixture(
            html`<y-textarea disabled></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include(
            "var(--component-input-background-disabled)",
        );
    });

    // ── Invalid ───────────────────────────────────────────────
    it("adds is-invalid class to container when invalid", async () => {
        const el = await fixture(
            html`<y-textarea invalid></y-textarea>`,
        );
        const container = el.shadowRoot.querySelector(".input-container");
        expect(container.classList.contains("is-invalid")).to.be.true;
    });

    it("removes is-invalid class when invalid attribute is removed", async () => {
        const el = await fixture(
            html`<y-textarea invalid></y-textarea>`,
        );
        el.removeAttribute("invalid");
        await new Promise((r) => setTimeout(r, 0));
        const container = el.shadowRoot.querySelector(".input-container");
        expect(container.classList.contains("is-invalid")).to.be.false;
    });

    // ── Label ─────────────────────────────────────────────────
    it("renders label slot above textarea by default", async () => {
        const el = await fixture(
            html`<y-textarea>
                <span slot="label">Message</span>
            </y-textarea>`,
        );
        const wrapper = el.shadowRoot.querySelector(".input-wrapper");
        const children = Array.from(wrapper.children);
        const labelIdx = children.findIndex((c) =>
            c.classList.contains("label-wrapper"),
        );
        const containerIdx = children.findIndex((c) =>
            c.classList.contains("input-container"),
        );
        expect(labelIdx).to.be.lessThan(containerIdx);
    });

    // ── Events ────────────────────────────────────────────────
    it("dispatches input event when user types", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");

        setTimeout(() => {
            textarea.value = "typed";
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        });

        const event = await oneEvent(el, "input");
        expect(event.detail.value).to.equal("typed");
    });

    it("updates value attribute when input event fires", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");

        textarea.value = "new content";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        expect(el.getAttribute("value")).to.equal("new content");
    });

    // ── Re-render ─────────────────────────────────────────────
    it("re-renders when size attribute changes", async () => {
        const el = await fixture(
            html`<y-textarea size="small"></y-textarea>`,
        );
        el.setAttribute("size", "large");
        await new Promise((r) => setTimeout(r, 0));
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--component-inputs-padding-large");
    });

    it("re-renders when disabled is toggled", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        expect(
            el.shadowRoot.querySelector("textarea").hasAttribute("disabled"),
        ).to.be.false;

        el.setAttribute("disabled", "");
        await new Promise((r) => setTimeout(r, 0));

        expect(
            el.shadowRoot.querySelector("textarea").hasAttribute("disabled"),
        ).to.be.true;
    });

    it("disabled setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
    });

    it("invalid setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.invalid = true;
        expect(el.hasAttribute("invalid")).to.be.true;
        el.invalid = false;
        expect(el.hasAttribute("invalid")).to.be.false;
    });

    it("size setter updates attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("labelPosition setter updates attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.labelPosition = "bottom";
        expect(el.getAttribute("label-position")).to.equal("bottom");
    });

    it("value setter falls back to setAttribute when textarea element is not yet available", async () => {
        const el = document.createElement("y-textarea");
        el.value = "preset";
        document.body.appendChild(el);
        await new Promise((r) => setTimeout(r, 0));
        expect(el.value).to.equal("preset");
        document.body.removeChild(el);
    });

    describe("placeholder", () => {
        it("has no placeholder by default", async () => {
            const el = await fixture(html`<y-textarea></y-textarea>`);
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("");
            expect(el.placeholder).to.equal("");
        });

        it("applies the placeholder attribute to the inner textarea", async () => {
            const el = await fixture(
                html`<y-textarea placeholder="Write something..."></y-textarea>`
            );
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal(
                "Write something..."
            );
        });

        it("updates the inner textarea when the attribute changes", async () => {
            const el = await fixture(
                html`<y-textarea placeholder="First"></y-textarea>`
            );
            el.setAttribute("placeholder", "Second");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("Second");

            el.removeAttribute("placeholder");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("");
        });

        it("reflects the placeholder property to the attribute", async () => {
            const el = await fixture(html`<y-textarea></y-textarea>`);
            el.placeholder = "Type here";
            expect(el.getAttribute("placeholder")).to.equal("Type here");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("Type here");

            el.placeholder = "";
            expect(el.hasAttribute("placeholder")).to.be.false;
        });

        it("survives a re-render triggered by another attribute", async () => {
            const el = await fixture(
                html`<y-textarea placeholder="Keep me"></y-textarea>`
            );
            el.setAttribute("size", "large");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("Keep me");
        });
    });

    describe("XSS hardening", () => {
        it("does not allow attribute breakout via placeholder", async () => {
            const hostile = `Hi" onfocus="window.__xssTextareaPlaceholder=true" autofocus x="`;
            const el = document.createElement("y-textarea");
            el.setAttribute("placeholder", hostile);
            document.body.appendChild(el);

            expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
            expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
            expect(window.__xssTextareaPlaceholder).to.be.undefined;

            document.body.removeChild(el);
        });

        it("does not allow attribute breakout via rows", async () => {
            const hostile = `3" onfocus="window.__xssTextareaRows=true" autofocus x="`;
            const el = document.createElement("y-textarea");
            el.setAttribute("rows", hostile);
            document.body.appendChild(el);

            expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
            expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
            expect(window.__xssTextareaRows).to.be.undefined;

            document.body.removeChild(el);
        });
    });
});
