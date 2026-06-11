import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-button.js";

describe("KeplerButton", () => {
    it("renders a button with default attributes and slotted label", async () => {
        const el = await fixture(html`<y-button>Click Me</y-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");

        expect(shadowButton).to.exist;
        expect(shadowButton.getAttribute("role")).to.equal("button");

        // Check that the default slot renders the label.
        const labelSlot = el.shadowRoot.querySelector("slot:not([name])");
        const assigned = labelSlot.assignedNodes({ flatten: true });

        expect(assigned.some((node) => node.textContent.trim() === "Click Me"))
            .to.be.true;
    });

    it("reflects the disabled attribute to the inner button", async () => {
        const el = await fixture(html`<y-button disabled>Test</y-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");

        expect(shadowButton.hasAttribute("disabled")).to.be.true;
        expect(shadowButton.getAttribute("aria-disabled")).to.equal("true");
    });

    it("forwards aria-haspopup, aria-expanded, and aria-controls to the inner button", async () => {
        const el = await fixture(html`
            <y-button
                aria-haspopup="menu"
                aria-expanded="false"
                aria-controls="my-popup"
            >Trigger</y-button>
        `);
        const inner = el.shadowRoot.querySelector("button");

        expect(inner.getAttribute("aria-haspopup")).to.equal("menu");
        expect(inner.getAttribute("aria-expanded")).to.equal("false");
        expect(inner.getAttribute("aria-controls")).to.equal("my-popup");

        el.setAttribute("aria-expanded", "true");
        expect(inner.getAttribute("aria-expanded")).to.equal("true");

        el.removeAttribute("aria-haspopup");
        expect(inner.hasAttribute("aria-haspopup")).to.be.false;
    });

    it("updates styles when the color attribute changes", async () => {
        const el = await fixture(
            html`<y-button color="primary">Test</y-button>`
        );

        // Change color attribute to "success"
        el.setAttribute("color", "success");

        // Allow time for attributeChangedCallback to run.
        await new Promise((r) => setTimeout(r, 0));
        const shadowButton = el.shadowRoot.querySelector("button");

        // Check the inline custom property value instead.
        const bgVar = shadowButton.style.getPropertyValue("--background-color");
        expect(bgVar).to.contain("--success-background-component");
    });

    it("dispatches a click event when clicked", async () => {
        const el = await fixture(html`<y-button>Click Me</y-button>`);

        setTimeout(() => el.button.click());

        const event = await oneEvent(el, "click");
        expect(event).to.exist;
    });

    it("applies custom hex color CSS variables for filled style-type", async () => {
        const el = await fixture(
            html`<y-button color="#ff0000" style-type="filled">Test</y-button>`
        );
        const shadowButton = el.shadowRoot.querySelector("button");
        const bgColor = shadowButton.style.getPropertyValue("--background-color");
        expect(bgColor).to.equal("#ff0000");
    });

    it("applies custom hex color CSS variables for outlined style-type", async () => {
        const el = await fixture(
            html`<y-button color="#00aaff" style-type="outlined">Test</y-button>`
        );
        const shadowButton = el.shadowRoot.querySelector("button");
        const borderColor = shadowButton.style.getPropertyValue("--border-color");
        expect(borderColor).to.equal("#00aaff");
        const bgColor = shadowButton.style.getPropertyValue("--background-color");
        expect(bgColor).to.equal("transparent");
    });

    it("applies custom hex color CSS variables for flat style-type", async () => {
        const el = await fixture(
            html`<y-button color="#00ff88" style-type="flat">Test</y-button>`
        );
        const shadowButton = el.shadowRoot.querySelector("button");
        const bgColor = shadowButton.style.getPropertyValue("--background-color");
        expect(bgColor).to.equal("transparent");
        const textColor = shadowButton.style.getPropertyValue("--text-color");
        expect(textColor).to.equal("#00ff88");
    });

    it("value getter returns empty string when no value is set", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        expect(el.value).to.equal("");
    });

    it("value setter stores a string value", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        el.value = "option1";
        expect(el.value).to.equal("option1");
    });

    it("value setter with multiple attribute stores comma-separated values from string", async () => {
        const el = await fixture(html`<y-button multiple>Test</y-button>`);
        el.value = "a,b,c";
        expect(el.value).to.equal("a,b,c");
    });

    it("value setter with multiple attribute stores array values", async () => {
        const el = await fixture(html`<y-button multiple>Test</y-button>`);
        el.value = ["x", "y"];
        expect(el.value).to.equal("x,y");
    });

    it("value setter without multiple and non-string clears selectedValues", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        el.value = "something";
        el.value = 42;
        expect(el.value).to.equal("");
    });

    it("dispatches focus custom event when inner button receives focus", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        setTimeout(() => el.button.dispatchEvent(new Event("focus", { bubbles: true })));
        const event = await oneEvent(el, "focus");
        expect(event).to.exist;
    });

    it("dispatches blur custom event when inner button loses focus", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        setTimeout(() => el.button.dispatchEvent(new Event("blur", { bubbles: true })));
        const event = await oneEvent(el, "blur");
        expect(event).to.exist;
    });

    it("dispatches keydown event with key detail when key is pressed on button", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        setTimeout(() =>
            el.button.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true })
            )
        );
        const event = await oneEvent(el, "keydown");
        expect(event.detail.key).to.equal("Enter");
        expect(event.detail.code).to.equal("Enter");
    });

    it("dispatches keyup event with key detail when key is released on button", async () => {
        const el = await fixture(html`<y-button>Test</y-button>`);
        setTimeout(() =>
            el.button.dispatchEvent(
                new KeyboardEvent("keyup", { key: "Space", code: "Space", bubbles: true })
            )
        );
        const event = await oneEvent(el, "keyup");
        expect(event.detail.key).to.equal("Space");
        expect(event.detail.code).to.equal("Space");
    });

    it("dispatches a custom data-event when clicked and data-event attribute is present", async () => {
        const el = await fixture(
            html`<y-button data-event="my-action" data-detail-foo="bar">Test</y-button>`
        );
        setTimeout(() => el.button.click());
        const event = await oneEvent(el, "my-action");
        expect(event.detail.foo).to.equal("bar");
    });

    it("does not dispatch data-event when button is disabled", async () => {
        const el = await fixture(
            html`<y-button disabled data-event="my-action">Test</y-button>`
        );
        let fired = false;
        el.addEventListener("my-action", () => { fired = true; });
        el.button.click();
        await new Promise((r) => setTimeout(r, 0));
        expect(fired).to.be.false;
    });

    it("renders with only an icon slot and no label text (icon-only button)", async () => {
        const el = await fixture(html`
            <y-button>
                <svg slot="left-icon" width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>
            </y-button>
        `);
        const leftIconSlot = el.shadowRoot.querySelector('slot[name="left-icon"]');
        expect(leftIconSlot).to.exist;
        const assigned = leftIconSlot.assignedNodes({ flatten: true });
        expect(assigned.length).to.be.greaterThan(0);
    });

    it("applies small size padding CSS variables when size is small", async () => {
        const el = await fixture(html`<y-button size="small">Test</y-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");
        const block = shadowButton.style.getPropertyValue("--button-padding-block");
        const inline = shadowButton.style.getPropertyValue("--button-padding-inline");
        expect(block).to.include("--component-button-padding-block-small");
        expect(block).to.include("--component-button-padding-small");
        expect(inline).to.include("--component-button-padding-inline-small");
        expect(inline).to.include("--component-button-padding-small");
    });

    it("applies large size padding CSS variables when size is large", async () => {
        const el = await fixture(html`<y-button size="large">Test</y-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");
        const block = shadowButton.style.getPropertyValue("--button-padding-block");
        const inline = shadowButton.style.getPropertyValue("--button-padding-inline");
        expect(block).to.include("--component-button-padding-block-large");
        expect(inline).to.include("--component-button-padding-inline-large");
    });

    it("applies square padding (auto) when an icon is present without a label", async () => {
        const el = await fixture(html`
            <y-button>
                <svg slot="left-icon" width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>
            </y-button>
        `);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.classList.contains("square-padding")).to.be.true;
    });

    it("does not apply square padding (auto) when both an icon and a label are present", async () => {
        const el = await fixture(html`
            <y-button>
                <svg slot="left-icon" width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>
                Save
            </y-button>
        `);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.classList.contains("square-padding")).to.be.false;
    });

    it("does not apply square padding (auto) for a label-only button", async () => {
        const el = await fixture(html`<y-button>Save</y-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.classList.contains("square-padding")).to.be.false;
    });

    it("padding-mode='square' forces square padding on a label-only button", async () => {
        const el = await fixture(html`<y-button padding-mode="square">5</y-button>`);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.classList.contains("square-padding")).to.be.true;
    });

    it("padding-mode='wide' keeps wide padding on an icon-only button", async () => {
        const el = await fixture(html`
            <y-button padding-mode="wide">
                <svg slot="left-icon" width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>
            </y-button>
        `);
        const shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.classList.contains("square-padding")).to.be.false;
    });

    it("applies filled style background color from theme color vars", async () => {
        const el = await fixture(
            html`<y-button color="primary" style-type="filled">Test</y-button>`
        );
        const shadowButton = el.shadowRoot.querySelector("button");
        const bgColor = shadowButton.style.getPropertyValue("--background-color");
        expect(bgColor).to.include("--primary-content--");
    });

    it("applies flat style background color from theme color vars", async () => {
        const el = await fixture(
            html`<y-button color="error" style-type="flat">Test</y-button>`
        );
        const shadowButton = el.shadowRoot.querySelector("button");
        const bgColor = shadowButton.style.getPropertyValue("--background-color");
        expect(bgColor).to.include("--error-background-component");
    });

    it("removes disabled attribute from inner button when disabled is removed", async () => {
        const el = await fixture(html`<y-button disabled>Test</y-button>`);
        let shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.hasAttribute("disabled")).to.be.true;

        el.disabled = false;
        await new Promise((r) => setTimeout(r, 0));
        shadowButton = el.shadowRoot.querySelector("button");
        expect(shadowButton.hasAttribute("disabled")).to.be.false;
        expect(shadowButton.getAttribute("aria-disabled")).to.equal("false");
    });
});
