import { fixture, html, expect, oneEvent, nextFrame, aTimeout } from "@open-wc/testing";
import "../src/components/y-select.js";
import "../src/components/y-tag.js"; // Needed for tag mode

describe("<y-select>", () => {
    it("renders with placeholder", async () => {
        const el = await fixture(
            html`<y-select
                placeholder="Choose"
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`
        );
        expect(
            el.shadowRoot.querySelector(".value-display").textContent.trim()
        ).to.equal("Choose");
    });

    it("renders the selected label when value is set", async () => {
        const el = await fixture(
            html`<y-select
                placeholder="Choose"
                options='[{"label":"Apple","value":"apple"}, {"label":"Banana","value":"banana"}]'
            ></y-select>`
        );
        el.value = "banana";
        await nextFrame();

        expect(
            el.shadowRoot.querySelector(".value-display").textContent.trim()
        ).to.equal("Banana");
    });

    it("supports multiple selection", async () => {
        const el = await fixture(
            html`<y-select
                multiple
                options='[{"label":"Apple","value":"apple"}, {"label":"Banana","value":"banana"}]'
            ></y-select>`
        );
        el.value = "apple,banana";
        await nextFrame();

        const items = el.shadowRoot.querySelectorAll(".dropdown-item.selected");
        expect(items.length).to.equal(2);
    });

    it("renders tags in tag mode", async () => {
        const el = await fixture(
            html`<y-select
                multiple
                display-mode="tag"
                options='[{"label":"Apple","value":"apple"}, {"label":"Banana","value":"banana"}]'
            ></y-select>`
        );
        el.value = "apple,banana";
        await nextFrame();

        const tags = el.shadowRoot.querySelectorAll("y-tag");
        expect(tags.length).to.equal(2);
    });

    it("removes tag and updates value", async () => {
        const el = await fixture(
            html`<y-select
                multiple
                display-mode="tag"
                options='[{"label":"Apple","value":"apple"}, {"label":"Banana","value":"banana"}]'
            ></y-select>`
        );
        el.value = "apple,banana";
        await nextFrame();

        let tags = el.shadowRoot.querySelectorAll("y-tag");
        expect(tags.length).to.equal(2);

        const removeEvent = new CustomEvent("remove", {
            bubbles: true,
            composed: true,
        });
        tags[0].dispatchEvent(removeEvent);
        await nextFrame();

        tags = el.shadowRoot.querySelectorAll("y-tag");
        expect(tags.length).to.equal(1);
        expect(el.value).to.equal("banana");
    });

    it("opens dropdown on click", async () => {
        const el = await fixture(
            html`<y-select
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`
        );
        const container = el.shadowRoot.querySelector(".select-container");
        container.click();
        await nextFrame();

        const dropdown = el.shadowRoot.querySelector(".dropdown");
        expect(dropdown.classList.contains("open")).to.be.true;
    });

    it("closes dropdown when clicking outside", async () => {
        const el = await fixture(
            html`<y-select
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`
        );
        const container = el.shadowRoot.querySelector(".select-container");
        container.click();
        await nextFrame();

        const dropdown = el.shadowRoot.querySelector(".dropdown");
        expect(dropdown.classList.contains("open")).to.be.true;

        document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextFrame();

        expect(dropdown.classList.contains("open")).to.be.false;
    });

    it("does not close dropdown on outside click when close-on-click-outside is false", async () => {
        const el = await fixture(
            html`<y-select
                close-on-click-outside="false"
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`
        );
        const container = el.shadowRoot.querySelector(".select-container");
        container.click();
        await nextFrame();

        const dropdown = el.shadowRoot.querySelector(".dropdown");
        expect(dropdown.classList.contains("open")).to.be.true;

        document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await nextFrame();

        expect(dropdown.classList.contains("open")).to.be.true;
    });

    it("clears invalid state when value is set", async () => {
        const el = await fixture(
            html`<y-select
                required
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`
        );

        el.setAttribute("invalid", "");
        expect(el.hasAttribute("invalid")).to.be.true;

        el.value = "apple";
        el.updateValidation(); // 💡 manually trigger validation
        await nextFrame();

        expect(el.hasAttribute("invalid")).to.be.false;
    });
});
