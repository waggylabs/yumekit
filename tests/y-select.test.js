import { fixture, html, expect, nextFrame } from "@open-wc/testing";
import "../src/components/y-select.js";
import "../src/components/y-tag.js"; // Needed for tag mode

describe("<y-select>", () => {
    it("renders with placeholder", async () => {
        const el = await fixture(
            html`<y-select
                placeholder="Choose"
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`,
        );
        expect(
            el.shadowRoot.querySelector(".value-display").textContent.trim(),
        ).to.equal("Choose");
    });

    it("renders the selected label when value is set", async () => {
        const el = await fixture(
            html`<y-select
                placeholder="Choose"
                options='[{"label":"Apple","value":"apple"}, {"label":"Banana","value":"banana"}]'
            ></y-select>`,
        );
        el.value = "banana";
        await nextFrame();

        expect(
            el.shadowRoot.querySelector(".value-display").textContent.trim(),
        ).to.equal("Banana");
    });

    it("supports multiple selection", async () => {
        const el = await fixture(
            html`<y-select
                multiple
                options='[{"label":"Apple","value":"apple"}, {"label":"Banana","value":"banana"}]'
            ></y-select>`,
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
            ></y-select>`,
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
            ></y-select>`,
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
            ></y-select>`,
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
            ></y-select>`,
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
            ></y-select>`,
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

    it("options setter triggers render with correct items", async () => {
        const el = await fixture(html`<y-select></y-select>`);
        el.options = [
            { label: "Apple", value: "apple" },
            { label: "Banana", value: "banana" },
        ];
        await nextFrame();

        const items = el.shadowRoot.querySelectorAll(".dropdown-item");
        expect(items.length).to.equal(2);
        expect(items[0].getAttribute("data-value")).to.equal("apple");
        expect(items[1].getAttribute("data-value")).to.equal("banana");
    });

    it("shows correct label when value attribute is set before options attribute", async () => {
        const el = await fixture(html`<y-select></y-select>`);
        el.setAttribute("value", "banana");
        el.setAttribute(
            "options",
            '[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]',
        );
        await nextFrame();

        expect(
            el.shadowRoot.querySelector(".value-display").textContent.trim(),
        ).to.equal("Banana");
    });

    it("marks correct item selected when value attribute is set before options attribute", async () => {
        const el = await fixture(html`<y-select></y-select>`);
        el.setAttribute("value", "banana");
        el.setAttribute(
            "options",
            '[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]',
        );
        await nextFrame();

        const selected = el.shadowRoot.querySelectorAll(".dropdown-item.selected");
        expect(selected.length).to.equal(1);
        expect(selected[0].getAttribute("data-value")).to.equal("banana");
    });

    it("clears invalid state when value is set", async () => {
        const el = await fixture(
            html`<y-select
                required
                options='[{"label":"Apple","value":"apple"}]'
            ></y-select>`,
        );

        el.setAttribute("invalid", "");
        expect(el.hasAttribute("invalid")).to.be.true;

        el.value = "apple";
        el.updateValidation();
        await nextFrame();

        expect(el.hasAttribute("invalid")).to.be.false;
    });

    describe("searchable", () => {
        it("renders a search input instead of value-display in single mode", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            expect(el.shadowRoot.querySelector(".search-input")).to.exist;
            expect(el.shadowRoot.querySelector(".value-display")).to.be.null;
        });

        it("shows placeholder in the search input when no value", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    placeholder="Pick one"
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            const input = el.shadowRoot.querySelector(".search-input");
            expect(input.placeholder).to.equal("Pick one");
        });

        it("shows selected label in search input when closed with a value", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el.value = "banana";
            await nextFrame();
            const input = el.shadowRoot.querySelector(".search-input");
            expect(input.value).to.equal("Banana");
        });

        it("shows clear button when a value is set", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();
            const btn = el.shadowRoot.querySelector(".clear-button");
            expect(btn.style.display).to.not.equal("none");
        });

        it("hides clear button when no value is set", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            const btn = el.shadowRoot.querySelector(".clear-button");
            expect(btn.style.display).to.equal("none");
        });

        it("opens dropdown on search input focus", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            const input = el.shadowRoot.querySelector(".search-input");
            input.dispatchEvent(new FocusEvent("focus"));
            await nextFrame();
            expect(
                el.shadowRoot.querySelector(".dropdown").classList.contains("open"),
            ).to.be.true;
        });

        it("filters options as the user types", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"},{"label":"Apricot","value":"apricot"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();

            const input = el.shadowRoot.querySelector(".search-input");
            input.value = "ap";
            input.dispatchEvent(new Event("input"));
            await nextFrame();

            const visible = [
                ...el.shadowRoot.querySelectorAll(".dropdown-item"),
            ].filter((item) => item.style.display !== "none");
            expect(visible.length).to.equal(2); // Apple and Apricot
        });

        it("shows all options when query is cleared", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();

            const input = el.shadowRoot.querySelector(".search-input");
            input.value = "ban";
            input.dispatchEvent(new Event("input"));
            input.value = "";
            input.dispatchEvent(new Event("input"));
            await nextFrame();

            const visible = [
                ...el.shadowRoot.querySelectorAll(".dropdown-item"),
            ].filter((item) => item.style.display !== "none");
            expect(visible.length).to.equal(2);
        });

        it("sets the selected value and restores label after picking an item", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();

            const item = [
                ...el.shadowRoot.querySelectorAll(".dropdown-item"),
            ].find((i) => i.getAttribute("data-value") === "banana");
            item.click();
            await nextFrame();

            expect(el.value).to.equal("banana");
            const input = el.shadowRoot.querySelector(".search-input");
            expect(input.value).to.equal("Banana");
        });

        it("renders search input inside value-display for multi-tag mode", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    multiple
                    display-mode="tag"
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            const display = el.shadowRoot.querySelector(".value-display");
            expect(display).to.exist;
            expect(display.querySelector(".search-input")).to.exist;
        });
    });

    describe("clearable", () => {
        it("renders a clear button", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            expect(el.shadowRoot.querySelector(".clear-button")).to.exist;
        });

        it("hides the clear button when no value is selected", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            const btn = el.shadowRoot.querySelector(".clear-button");
            expect(btn.style.display).to.equal("none");
        });

        it("shows the clear button when a value is selected", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();
            const btn = el.shadowRoot.querySelector(".clear-button");
            expect(btn.style.display).to.not.equal("none");
        });

        it("clears the value when the clear button is clicked", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();
            el.shadowRoot.querySelector(".clear-button").click();
            await nextFrame();
            expect(el.value).to.equal("");
        });

        it("updates the display text to placeholder after clearing", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    placeholder="Choose"
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();
            el.shadowRoot.querySelector(".clear-button").click();
            await nextFrame();
            expect(
                el.shadowRoot.querySelector(".value-display").textContent.trim(),
            ).to.equal("Choose");
        });

        it("dispatches a change event with empty value when cleared", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();

            let detail = null;
            el.addEventListener("change", (e) => {
                detail = e.detail;
            });
            el.shadowRoot.querySelector(".clear-button").click();
            await nextFrame();

            expect(detail).to.not.be.null;
            expect(detail.value).to.equal("");
        });

        it("hides the clear button again after clearing", async () => {
            const el = await fixture(
                html`<y-select
                    clearable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();
            el.shadowRoot.querySelector(".clear-button").click();
            await nextFrame();
            const btn = el.shadowRoot.querySelector(".clear-button");
            expect(btn.style.display).to.equal("none");
        });
    });
});
