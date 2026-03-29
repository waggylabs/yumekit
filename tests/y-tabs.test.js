import { fixture, expect, html } from "@open-wc/testing";
import "../src/components/y-tabs.js"; // path to your component file

describe("YumeTabs", () => {
    const options = [
        { id: "one", label: "One", slot: "one-slot" },
        { id: "two", label: "Two", slot: "two-slot", disabled: true },
        { id: "three", label: "Three", slot: "three-slot" },
    ];

    it("renders with default medium size and top position", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);

        const tabs = el.shadowRoot.querySelectorAll("button");
        expect(tabs.length).to.equal(3);
        expect(el.getAttribute("size")).to.equal("medium");
        expect(el.getAttribute("position")).to.equal("top");

        // first tab selected
        expect(tabs[0].getAttribute("aria-selected")).to.equal("true");
    });

    it("skips disabled tabs on activation and navigation", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);

        const [btn1, btn2, btn3] = el.shadowRoot.querySelectorAll("button");
        // btn2 disabled
        expect(btn2.disabled).to.be.true;

        // clicking btn2 should do nothing
        btn2.click();
        expect(
            el.shadowRoot.querySelector('button[aria-selected="true"]').dataset
                .id
        ).to.equal("one");

        // Arrow navigation should skip disabled
        btn1.focus();
        const event = new KeyboardEvent("keydown", {
            key: "ArrowRight",
            bubbles: true,
        });
        btn1.dispatchEvent(event);
        // focus jumps to btn3
        expect(document.activeElement.shadowRoot.activeElement).to.equal(btn3);
    });

    it("updates content when tab changes", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);

        const btn3 = el.shadowRoot.querySelector('button[data-id="three"]');
        btn3.click();
        await el.updateComplete;

        const panel = el.shadowRoot.querySelector(".tabpanel");
        const slotted = panel.querySelector("slot");
        expect(slotted.name).to.equal("three-slot");
    });

    it("respects size and position attributes", async () => {
        const el = await fixture(html`
            <y-tabs
                options="${JSON.stringify(options)}"
                size="large"
                position="bottom"
            >
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);

        // attributes set
        expect(el.getAttribute("size")).to.equal("large");
        expect(el.getAttribute("position")).to.equal("bottom");

        // CSS uses the correct padding variable
        const cssText = el.shadowRoot.querySelector("style").textContent;
        expect(cssText).to.include("--component-tab-padding-large");
    });

    it("options setter re-renders tabs", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
            </y-tabs>
        `);
        expect(el.shadowRoot.querySelectorAll("button").length).to.equal(3);

        el.options = [{ id: "alpha", label: "Alpha", slot: "alpha-slot" }];

        const buttons = el.shadowRoot.querySelectorAll("button");
        expect(buttons.length).to.equal(1);
        expect(buttons[0].dataset.id).to.equal("alpha");
    });

    it("size setter normalises invalid values to medium", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}"></y-tabs>
        `);
        el.size = "huge";
        expect(el.getAttribute("size")).to.equal("medium");
    });

    it("size setter accepts valid values", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}"></y-tabs>
        `);
        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");

        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("position setter normalises invalid values to top", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}"></y-tabs>
        `);
        el.position = "diagonal";
        expect(el.getAttribute("position")).to.equal("top");
    });

    it("position setter accepts all valid positions", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}"></y-tabs>
        `);
        for (const pos of ["top", "bottom", "left", "right"]) {
            el.position = pos;
            expect(el.getAttribute("position")).to.equal(pos);
        }
    });

    it("activateTab does nothing when the tab is disabled", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
            </y-tabs>
        `);
        el.activateTab("two");
        expect(el._activeTab).to.equal("one");
    });

    it("activateTab does nothing when the tab is already active", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
            </y-tabs>
        `);
        const renderSpy = el.render.bind(el);
        let renderCount = 0;
        el.render = () => { renderCount++; renderSpy(); };

        el.activateTab("one");
        expect(renderCount).to.equal(0);
    });

    it("activateTab switches to a valid tab", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        el.activateTab("three");
        expect(el._activeTab).to.equal("three");

        const panel = el.shadowRoot.querySelector(".tabpanel slot");
        expect(panel.name).to.equal("three-slot");
    });

    it("resolves active tab to first non-disabled tab automatically", async () => {
        const disabledFirstOptions = [
            { id: "x", label: "X", slot: "x-slot", disabled: true },
            { id: "y", label: "Y", slot: "y-slot" },
        ];
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(disabledFirstOptions)}">
                <div slot="y-slot">Y content</div>
            </y-tabs>
        `);
        expect(el._activeTab).to.equal("y");
        const activeBtn = el.shadowRoot.querySelector('button[aria-selected="true"]');
        expect(activeBtn.dataset.id).to.equal("y");
    });

    it("Enter key activates the focused tab", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn3 = el.shadowRoot.querySelector('button[data-id="three"]');
        btn3.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(el._activeTab).to.equal("three");
    });

    it("Space key activates the focused tab", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn3 = el.shadowRoot.querySelector('button[data-id="three"]');
        btn3.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        expect(el._activeTab).to.equal("three");
    });

    it("ArrowLeft key moves focus backward from the active tab", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn3 = el.shadowRoot.querySelector('button[data-id="three"]');
        btn3.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        // Skips disabled "two" and lands on "one"
        expect(el.shadowRoot.activeElement.dataset.id).to.equal("one");
    });

    it("CSS includes gap variable for active size", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}" size="small"></y-tabs>
        `);
        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("--component-tab-gap-small");
    });
});
