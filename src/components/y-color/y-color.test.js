import { fixture, html, expect, oneEvent, nextFrame } from "@open-wc/testing";
import "./y-color.js";

describe("<y-color>", () => {
    it("variant='underline' renders a bottom-only border with square bottom corners", async () => {
        const el = await fixture(html`<y-color variant="underline"></y-color>`);
        el.style.setProperty("--component-inputs-border-radius-outer", "6px");
        const cs = getComputedStyle(el.shadowRoot.querySelector(".trigger"));
        expect(cs.borderTopStyle).to.equal("none");
        expect(cs.borderBottomStyle).to.equal("solid");
        expect(cs.borderTopLeftRadius).to.equal("6px");
        expect(cs.borderBottomLeftRadius).to.equal("0px");
    });

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    it("renders the trigger and popup by default", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        expect(el.shadowRoot.querySelector(".trigger")).to.exist;
        expect(el.shadowRoot.querySelector(".popup")).to.exist;
    });

    it("renders a y-colorpicker inside the popup", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        expect(el.shadowRoot.querySelector("y-colorpicker")).to.exist;
    });

    it("renders the swatch in the trigger", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const swatch = el.shadowRoot.querySelector(".swatch");
        expect(swatch).to.exist;
        expect(swatch.getAttribute("aria-hidden")).to.equal("true");
    });

    it("shows placeholder text when no value is set", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display.textContent).to.equal("Select color");
    });

    it("shows custom placeholder", async () => {
        const el = await fixture(
            html`<y-color placeholder="Pick a color"></y-color>`,
        );
        const display = el.shadowRoot.querySelector(".display");
        expect(display.textContent).to.equal("Pick a color");
    });

    it("displays color value when value is set", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        const display = el.shadowRoot.querySelector(".display");
        expect(display.textContent).to.equal("#ff0000");
    });

    it("fills the swatch with the current color", async () => {
        const el = await fixture(html`<y-color value="#00ff00"></y-color>`);
        const swatch = el.shadowRoot.querySelector(".swatch");
        expect(swatch.style.backgroundColor).to.equal("rgb(0, 255, 0)");
    });

    it("swatch has no color when value is empty", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const swatch = el.shadowRoot.querySelector(".swatch");
        expect(swatch.style.backgroundColor).to.equal("");
    });

    // -------------------------------------------------------------------------
    // Defaults
    // -------------------------------------------------------------------------

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        expect(el.size).to.equal("medium");
    });

    it("defaults format to hex", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        expect(el.format).to.equal("hex");
    });

    it("defaults label-position to top", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        expect(el.labelPosition).to.equal("top");
    });

    it("defaults formats to all four", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        expect(el.formats).to.deep.equal(["hex", "rgb", "hsl", "hsv"]);
    });

    // -------------------------------------------------------------------------
    // Attributes / Properties
    // -------------------------------------------------------------------------

    it("reflects size to the colorpicker", async () => {
        const el = await fixture(html`<y-color size="large"></y-color>`);
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        expect(picker.getAttribute("size")).to.equal("large");
    });

    it("reflects format to the colorpicker", async () => {
        const el = await fixture(html`<y-color format="rgb"></y-color>`);
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        expect(picker.getAttribute("format")).to.equal("rgb");
    });

    it("passes show-alpha to the colorpicker", async () => {
        const el = await fixture(html`<y-color show-alpha></y-color>`);
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        expect(picker.hasAttribute("show-alpha")).to.be.true;
    });

    it("passes formats to the colorpicker", async () => {
        const el = await fixture(
            html`<y-color formats='["hex","rgb"]'></y-color>`,
        );
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        expect(picker.getAttribute("formats")).to.include("hex");
        expect(picker.getAttribute("formats")).to.include("rgb");
    });

    it("passes value to the colorpicker", async () => {
        const el = await fixture(html`<y-color value="#abcdef"></y-color>`);
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        expect(picker.getAttribute("value")).to.equal("#abcdef");
    });

    it("formats setter parses a JSON string without reflecting to the attribute", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        el.formats = '["hex","rgb"]';
        expect(el.hasAttribute("formats")).to.be.false;
        expect(el.formats).to.deep.equal(["hex", "rgb"]);
    });

    // -------------------------------------------------------------------------
    // Sizes
    // -------------------------------------------------------------------------

    it("renders small size", async () => {
        const el = await fixture(html`<y-color size="small"></y-color>`);
        expect(el.size).to.equal("small");
        expect(el.getAttribute("size")).to.equal("small");
    });

    it("renders large size", async () => {
        const el = await fixture(html`<y-color size="large"></y-color>`);
        expect(el.size).to.equal("large");
    });

    // -------------------------------------------------------------------------
    // Disabled
    // -------------------------------------------------------------------------

    it("disables the trigger when disabled is set", async () => {
        const el = await fixture(html`<y-color disabled></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        expect(trigger.getAttribute("aria-disabled")).to.equal("true");
        expect(trigger.getAttribute("tabindex")).to.equal("-1");
    });

    it("does not open popup when disabled", async () => {
        const el = await fixture(html`<y-color disabled></y-color>`);
        el.open();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.hidden).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Invalid
    // -------------------------------------------------------------------------

    it("applies invalid class to trigger", async () => {
        const el = await fixture(html`<y-color invalid></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        expect(trigger.classList.contains("is-invalid")).to.be.true;
    });

    it("removes invalid class when attribute is removed", async () => {
        const el = await fixture(html`<y-color invalid></y-color>`);
        el.removeAttribute("invalid");
        await nextFrame();
        const trigger = el.shadowRoot.querySelector(".trigger");
        expect(trigger.classList.contains("is-invalid")).to.be.false;
    });

    // -------------------------------------------------------------------------
    // Clearable
    // -------------------------------------------------------------------------

    it("shows clear button when clearable and value is set", async () => {
        const el = await fixture(
            html`<y-color clearable value="#ff0000"></y-color>`,
        );
        const clearBtn = el.shadowRoot.querySelector(".clear-btn");
        expect(clearBtn).to.exist;
    });

    it("does not show clear button when value is empty", async () => {
        const el = await fixture(html`<y-color clearable></y-color>`);
        const clearBtn = el.shadowRoot.querySelector(".clear-btn");
        expect(clearBtn).to.not.exist;
    });

    it("does not show clear button when clearable is not set", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        const clearBtn = el.shadowRoot.querySelector(".clear-btn");
        expect(clearBtn).to.not.exist;
    });

    // -------------------------------------------------------------------------
    // Open / Close
    // -------------------------------------------------------------------------

    it("opens the popup on open()", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        el.open();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.hidden).to.be.false;
    });

    it("closes the popup on close()", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        el.open();
        el.close();
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.hidden).to.be.true;
    });

    it("sets aria-expanded on trigger", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        expect(trigger.getAttribute("aria-expanded")).to.equal("false");
        el.open();
        expect(trigger.getAttribute("aria-expanded")).to.equal("true");
        el.close();
        expect(trigger.getAttribute("aria-expanded")).to.equal("false");
    });

    it("popup has role=dialog", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.getAttribute("role")).to.equal("dialog");
        expect(popup.getAttribute("aria-label")).to.equal("Color picker");
    });

    // -------------------------------------------------------------------------
    // Clear
    // -------------------------------------------------------------------------

    it("clear() resets value and emits change", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        setTimeout(() => el.clear());
        const { detail } = await oneEvent(el, "change");
        expect(detail.value).to.equal("");
        expect(el.value).to.equal("");
    });

    it("clear() updates the display to placeholder", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        el.clear();
        await nextFrame();
        const display = el.shadowRoot.querySelector(".display");
        expect(display.textContent).to.equal("Select color");
    });

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    it("re-dispatches change events from the colorpicker", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        el.open();
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        setTimeout(() =>
            picker.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        value: "#00ff00",
                        hex: "#00ff00",
                        rgb: "rgb(0, 255, 0)",
                        hsl: "hsl(120, 100%, 50%)",
                        hsv: "hsv(120, 100%, 100%)",
                        alpha: 1,
                    },
                }),
            ),
        );
        const { detail } = await oneEvent(el, "change");
        expect(detail.value).to.equal("#00ff00");
        expect(detail.hex).to.equal("#00ff00");
    });

    // -------------------------------------------------------------------------
    // Keyboard
    // -------------------------------------------------------------------------

    it("opens on Enter key", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
        );
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.hidden).to.be.false;
    });

    it("opens on Space key", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(
            new KeyboardEvent("keydown", { key: " ", bubbles: true }),
        );
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.hidden).to.be.false;
    });

    it("closes on Escape key", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        el.open();
        const trigger = el.shadowRoot.querySelector(".trigger");
        trigger.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        const popup = el.shadowRoot.querySelector(".popup");
        expect(popup.hidden).to.be.true;
    });

    // -------------------------------------------------------------------------
    // Label
    // -------------------------------------------------------------------------

    it("renders label slot", async () => {
        const el = await fixture(
            html`<y-color><span slot="label">Color</span></y-color>`,
        );
        const labelWrapper = el.shadowRoot.querySelector(".label-wrapper");
        expect(labelWrapper).to.exist;
    });

    it("label-position bottom places label after trigger", async () => {
        const el = await fixture(
            html`<y-color label-position="bottom"
                ><span slot="label">Color</span></y-color
            >`,
        );
        const wrapper = el.shadowRoot.querySelector(".wrapper");
        const children = Array.from(wrapper.children).filter(
            (c) => c.nodeType === 1,
        );
        const triggerIdx = children.findIndex((c) =>
            c.classList.contains("trigger"),
        );
        const labelIdx = children.findIndex((c) =>
            c.classList.contains("label-wrapper"),
        );
        expect(triggerIdx).to.be.lessThan(labelIdx);
    });

    // -------------------------------------------------------------------------
    // Show-alpha swatch
    // -------------------------------------------------------------------------

    it("swatch gets has-alpha class when show-alpha is set", async () => {
        const el = await fixture(html`<y-color show-alpha></y-color>`);
        const swatch = el.shadowRoot.querySelector(".swatch");
        expect(swatch.classList.contains("has-alpha")).to.be.true;
    });

    it("swatch does not have has-alpha class by default", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const swatch = el.shadowRoot.querySelector(".swatch");
        expect(swatch.classList.contains("has-alpha")).to.be.false;
    });

    // -------------------------------------------------------------------------
    // CSS Parts
    // -------------------------------------------------------------------------

    it("exposes expected CSS parts", async () => {
        const el = await fixture(
            html`<y-color value="#ff0000" clearable></y-color>`,
        );
        const parts = [
            "color",
            "wrapper",
            "label-wrapper",
            "trigger",
            "swatch",
            "display",
            "clear-btn",
            "popup",
        ];
        for (const part of parts) {
            expect(
                el.shadowRoot.querySelector(`[part~="${part}"]`),
                `part="${part}" should exist`,
            ).to.exist;
        }
    });

    // -------------------------------------------------------------------------
    // Form association
    // -------------------------------------------------------------------------

    it("is form-associated", async () => {
        const el = await fixture(
            html`<form><y-color name="col" value="#ff0000"></y-color></form>`,
        );
        const form = el;
        const fd = new FormData(form);
        expect(fd.get("col")).to.equal("#ff0000");
    });

    it("updates form value on clear", async () => {
        const el = await fixture(
            html`<form><y-color name="col" value="#ff0000"></y-color></form>`,
        );
        const color = el.querySelector("y-color");
        color.clear();
        const fd = new FormData(el);
        expect(fd.get("col")).to.equal("");
    });

    // -------------------------------------------------------------------------
    // Attribute changes
    // -------------------------------------------------------------------------

    it("updates display when value changes via attribute", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        el.setAttribute("value", "#0000ff");
        await nextFrame();
        const display = el.shadowRoot.querySelector(".display");
        expect(display.textContent).to.equal("#0000ff");
    });

    it("updates swatch when value changes via attribute", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        el.setAttribute("value", "#0000ff");
        await nextFrame();
        const swatch = el.shadowRoot.querySelector(".swatch");
        expect(swatch.style.backgroundColor).to.equal("rgb(0, 0, 255)");
    });

    it("swatch updates after multiple consecutive picker changes", async () => {
        const el = await fixture(html`<y-color value="#ff0000"></y-color>`);
        el.open();
        await nextFrame();
        const picker = el.shadowRoot.querySelector("y-colorpicker");
        const swatch = el.shadowRoot.querySelector(".swatch");

        expect(swatch.style.backgroundColor).to.equal("rgb(255, 0, 0)");

        const colors = [
            { hex: "#00ff00", rgb: "rgb(0, 255, 0)" },
            { hex: "#0000ff", rgb: "rgb(0, 0, 255)" },
            { hex: "#ffff00", rgb: "rgb(255, 255, 0)" },
            { hex: "#ff00ff", rgb: "rgb(255, 0, 255)" },
        ];
        for (const { hex, rgb } of colors) {
            picker.dispatchEvent(
                new CustomEvent("change", {
                    bubbles: true,
                    composed: true,
                    detail: {
                        value: hex,
                        hex,
                        rgb: "",
                        hsl: "",
                        hsv: "",
                        alpha: 1,
                    },
                }),
            );
            await nextFrame();
            expect(swatch.style.backgroundColor).to.equal(rgb);
            expect(
                el.shadowRoot.querySelector(".display").textContent,
            ).to.equal(hex);
        }
    });

    // -------------------------------------------------------------------------
    // Trigger anatomy
    // -------------------------------------------------------------------------

    it("trigger has aria-haspopup", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        expect(trigger.getAttribute("aria-haspopup")).to.equal("true");
    });

    it("trigger has role=combobox", async () => {
        const el = await fixture(html`<y-color></y-color>`);
        const trigger = el.shadowRoot.querySelector(".trigger");
        expect(trigger.getAttribute("role")).to.equal("combobox");
    });
});
