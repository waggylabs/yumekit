import { fixture, expect, html } from "@open-wc/testing";
import sinon from "sinon";
import "./y-tabs.js";

describe("YumeTabs", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

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

    it("options setter mirrors a JSON string instead of double-encoding it", async () => {
        const el = await fixture(html`<y-tabs></y-tabs>`);
        const json = '[{"id":"alpha","label":"Alpha","slot":"alpha-slot"}]';
        el.options = json;
        expect(el.getAttribute("options")).to.equal(json);
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

    it("tab buttons always have aria-label from tab.label", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const buttons = el.shadowRoot.querySelectorAll("button");
        buttons.forEach((btn, i) => {
            expect(btn.getAttribute("aria-label")).to.equal(options[i].label);
        });
    });

    it("aria-label is set even when tab-content slot is used with icon-only content", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <span slot="tab-content-one"><y-icon name="home"></y-icon></span>
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn = el.shadowRoot.querySelector('button[data-id="one"]');
        expect(btn.getAttribute("aria-label")).to.equal("One");
    });

    it("renders y-icon for leftIcon option property", async () => {
        const iconOptions = [
            { id: "one", label: "One", slot: "one-slot", leftIcon: "home" },
            { id: "two", label: "Two", slot: "two-slot" },
        ];
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(iconOptions)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
            </y-tabs>
        `);
        const btn1 = el.shadowRoot.querySelector('button[data-id="one"]');
        const icon = btn1.querySelector("y-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("home");
        expect(icon.getAttribute("size")).to.equal("medium");
    });

    it("renders y-icon for rightIcon option property", async () => {
        const iconOptions = [
            { id: "one", label: "One", slot: "one-slot", rightIcon: "arrow-right" },
        ];
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(iconOptions)}">
                <div slot="one-slot">First</div>
            </y-tabs>
        `);
        const btn = el.shadowRoot.querySelector('button[data-id="one"]');
        const slot = btn.querySelector('slot[name="tab-content-one"]');
        const slotChildren = [...slot.children];
        const icon = slot.querySelector("y-icon");
        expect(icon).to.exist;
        expect(icon.getAttribute("name")).to.equal("arrow-right");
        // icon comes after the label span
        expect(slotChildren.indexOf(icon)).to.be.greaterThan(slotChildren.indexOf(slot.querySelector("span")));
    });

    it("y-icon inherits the component size", async () => {
        const iconOptions = [
            { id: "one", label: "One", slot: "one-slot", leftIcon: "home" },
        ];
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(iconOptions)}" size="large">
                <div slot="one-slot">First</div>
            </y-tabs>
        `);
        const icon = el.shadowRoot.querySelector('button[data-id="one"] y-icon');
        expect(icon.getAttribute("size")).to.equal("large");
    });

    it("tab-content slot is always rendered for each tab button", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        for (const tab of options) {
            const btn = el.shadowRoot.querySelector(`button[data-id="${tab.id}"]`);
            expect(btn.querySelector(`slot[name="tab-content-${tab.id}"]`)).to.exist;
        }
    });

    it("tab-content slot fallback contains the label span", async () => {
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn1 = el.shadowRoot.querySelector('button[data-id="one"]');
        const slot = btn1.querySelector('slot[name="tab-content-one"]');
        expect(slot.querySelector("span")).to.exist;
        expect(slot.querySelector("span").textContent).to.equal("One");
    });

    it("tab-content slot leftIcon fallback is inside the slot", async () => {
        const iconOptions = [
            { id: "one", label: "One", slot: "one-slot", leftIcon: "home" },
        ];
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(iconOptions)}">
                <div slot="one-slot">First</div>
            </y-tabs>
        `);
        const slot = el.shadowRoot.querySelector('button[data-id="one"] slot[name="tab-content-one"]');
        expect(slot.querySelector("y-icon")).to.exist;
    });

    it("deprecated left-icon slot still renders with a console warning", async () => {
        const warn = sandbox.stub(console, "warn");
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <y-icon slot="left-icon-one" name="home" size="small"></y-icon>
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn1 = el.shadowRoot.querySelector('button[data-id="one"]');
        expect(btn1.querySelector('slot[name="left-icon-one"]')).to.exist;
        expect(warn.calledWith(sinon.match(/left-icon-one.*deprecated/))).to.be.true;
    });

    it("deprecated left-icon slot warning is emitted only once across re-renders", async () => {
        const warn = sandbox.stub(console, "warn");
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <y-icon slot="left-icon-one" name="home" size="small"></y-icon>
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        el.size = "large";
        el.size = "small";
        el.activateTab("three");
        const count = warn.args.filter(([msg]) => /left-icon-one.*deprecated/.test(msg)).length;
        expect(count).to.equal(1);
    });

    it("deprecated right-icon slot still renders with a console warning", async () => {
        const warn = sandbox.stub(console, "warn");
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <y-icon slot="right-icon-one" name="chevron-right" size="small"></y-icon>
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        const btn1 = el.shadowRoot.querySelector('button[data-id="one"]');
        expect(btn1.querySelector('slot[name="right-icon-one"]')).to.exist;
        expect(warn.calledWith(sinon.match(/right-icon-one.*deprecated/))).to.be.true;
    });

    it("deprecated right-icon slot warning is emitted only once across re-renders", async () => {
        const warn = sandbox.stub(console, "warn");
        const el = await fixture(html`
            <y-tabs options="${JSON.stringify(options)}">
                <y-icon slot="right-icon-one" name="chevron-right" size="small"></y-icon>
                <div slot="one-slot">First</div>
                <div slot="two-slot">Second</div>
                <div slot="three-slot">Third</div>
            </y-tabs>
        `);
        el.size = "large";
        el.size = "small";
        el.activateTab("three");
        const count = warn.args.filter(([msg]) => /right-icon-one.*deprecated/.test(msg)).length;
        expect(count).to.equal(1);
    });
});
