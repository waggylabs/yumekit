import { html, fixture, expect, aTimeout } from "@open-wc/testing";
import "./y-tooltip.js";

describe("YumeTooltip", () => {
    it("renders with default attributes", async () => {
        const el = await fixture(
            html`<y-tooltip text="Hello"><button>Hover me</button></y-tooltip>`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip).to.exist;
        expect(tip.textContent).to.equal("Hello");
        expect(tip.classList.contains("top")).to.be.true;
        expect(tip.getAttribute("role")).to.equal("tooltip");
    });

    it("renders slotted content", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip"
                ><span id="target">Target</span></y-tooltip
            >`,
        );
        const slot = el.shadowRoot.querySelector("slot");
        expect(slot).to.exist;
        const nodes = slot.assignedNodes({ flatten: true });
        expect(nodes.length).to.be.greaterThan(0);
    });

    it("sets position attribute correctly", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" position="bottom"
                ><button>B</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.classList.contains("bottom")).to.be.true;
    });

    it("supports left position", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" position="left"
                ><button>L</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.classList.contains("left")).to.be.true;
    });

    it("supports right position", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" position="right"
                ><button>R</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.classList.contains("right")).to.be.true;
    });

    it("shows tooltip on mouseenter after delay", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="50"
                ><button>Hover</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.classList.contains("visible")).to.be.false;

        el.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(100);

        expect(tip.classList.contains("visible")).to.be.true;
    });

    it("hides tooltip on mouseleave", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="0"
                ><button>Hover</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");

        el.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(50);
        expect(tip.classList.contains("visible")).to.be.true;

        el.dispatchEvent(new MouseEvent("mouseleave"));
        expect(tip.classList.contains("visible")).to.be.false;
    });

    it("shows tooltip on focusin", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="0"
                ><button>Focus</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");

        el.dispatchEvent(new FocusEvent("focusin"));
        await aTimeout(50);
        expect(tip.classList.contains("visible")).to.be.true;
    });

    it("hides tooltip on focusout", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="0"
                ><button>Focus</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");

        el.dispatchEvent(new FocusEvent("focusin"));
        await aTimeout(50);
        expect(tip.classList.contains("visible")).to.be.true;

        el.dispatchEvent(new FocusEvent("focusout"));
        expect(tip.classList.contains("visible")).to.be.false;
    });

    it("hides tooltip on Escape key", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="0"
                ><button>Esc</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");

        el.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(50);
        expect(tip.classList.contains("visible")).to.be.true;

        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        expect(tip.classList.contains("visible")).to.be.false;
    });

    it("has default delay of 200", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip"><button>D</button></y-tooltip>`,
        );
        expect(el.delay).to.equal(200);
    });

    it("respects custom delay attribute", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="500"
                ><button>D</button></y-tooltip
            >`,
        );
        expect(el.delay).to.equal(500);
    });

    it("supports color attribute", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" color="error"
                ><button>E</button></y-tooltip
            >`,
        );
        expect(el.color).to.equal("error");
    });

    it("provides show() and hide() methods", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip" delay="0"
                ><button>M</button></y-tooltip
            >`,
        );
        const tip = el.shadowRoot.querySelector(".tooltip");

        el.show();
        await aTimeout(50);
        expect(tip.classList.contains("visible")).to.be.true;

        el.hide();
        expect(tip.classList.contains("visible")).to.be.false;
    });

    it("updates text when attribute changes", async () => {
        const el = await fixture(
            html`<y-tooltip text="Old"><button>U</button></y-tooltip>`,
        );
        el.setAttribute("text", "New");
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.textContent).to.equal("New");
    });

    it("has correct default property values", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip"><button>P</button></y-tooltip>`,
        );
        expect(el.position).to.equal("top");
        expect(el.color).to.equal("base");
        expect(el.text).to.equal("Tip");
    });

    it("sets color via the color setter", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip"><button>C</button></y-tooltip>`,
        );
        el.color = "error";
        expect(el.getAttribute("color")).to.equal("error");
        expect(el.color).to.equal("error");
    });

    it("sets delay via the delay setter", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip"><button>D</button></y-tooltip>`,
        );
        el.delay = 300;
        expect(el.getAttribute("delay")).to.equal("300");
        expect(el.delay).to.equal(300);
    });

    it("sets position via the position setter", async () => {
        const el = await fixture(
            html`<y-tooltip text="Tip"><button>P</button></y-tooltip>`,
        );
        el.position = "bottom";
        expect(el.getAttribute("position")).to.equal("bottom");
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.classList.contains("bottom")).to.be.true;
    });

    it("sets text via the text setter", async () => {
        const el = await fixture(
            html`<y-tooltip text="Old"><button>T</button></y-tooltip>`,
        );
        el.text = "Updated";
        expect(el.getAttribute("text")).to.equal("Updated");
        const tip = el.shadowRoot.querySelector(".tooltip");
        expect(tip.textContent).to.equal("Updated");
    });
});
