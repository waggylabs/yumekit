import { fixture, html, expect, nextFrame } from "@open-wc/testing";
import "./y-select.js";
import "../y-tag/y-tag.js"; // Needed for tag mode

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

    describe("property getters and setters", () => {
        it("options getter returns empty array for invalid JSON", async () => {
            const el = await fixture(html`<y-select></y-select>`);
            el.setAttribute("options", "not valid json {{");
            expect(el.options).to.deep.equal([]);
        });

        it("required setter adds and removes the required attribute", async () => {
            const el = await fixture(html`<y-select></y-select>`);
            el.required = true;
            expect(el.hasAttribute("required")).to.be.true;
            el.required = false;
            expect(el.hasAttribute("required")).to.be.false;
        });

        it("searchable setter adds and removes the searchable attribute", async () => {
            const el = await fixture(html`<y-select></y-select>`);
            el.searchable = true;
            expect(el.hasAttribute("searchable")).to.be.true;
            el.searchable = false;
            expect(el.hasAttribute("searchable")).to.be.false;
        });

        it("value setter accepts an array when multiple is set", async () => {
            const el = await fixture(
                html`<y-select
                    multiple
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el.value = ["apple", "banana"];
            await nextFrame();
            expect(el.selectedValues.has("apple")).to.be.true;
            expect(el.selectedValues.has("banana")).to.be.true;
        });
    });

    describe("dropdown toggle", () => {
        it("toggleDropdown closes an already-open dropdown", async () => {
            const el = await fixture(
                html`<y-select
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();
            expect(el.dropdown.classList.contains("open")).to.be.true;

            el.toggleDropdown();
            await nextFrame();
            expect(el.dropdown.classList.contains("open")).to.be.false;
        });

        it("toggleDropdown focuses search input when opening searchable select", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            // Dropdown is closed; toggleDropdown should open it and schedule focus
            el.toggleDropdown();
            await nextFrame();
            // A small wait for the setTimeout(0) focus scheduling
            await new Promise((r) => setTimeout(r, 10));
            expect(el.dropdown.classList.contains("open")).to.be.true;
        });
    });

    describe("searchable clear button reopens dropdown", () => {
        it("reopens the dropdown when clear button is clicked and dropdown was closed", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();

            // Ensure dropdown is closed before clicking clear
            el.closeDropdown();
            await nextFrame();
            expect(el.dropdown.classList.contains("open")).to.be.false;

            el.shadowRoot.querySelector(".clear-button").click();
            await nextFrame();

            expect(el.dropdown.classList.contains("open")).to.be.true;
        });

        it("dispatches change event and runs updateValidation when clear button clicked on searchable", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    required
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();

            let changeDetail = null;
            el.addEventListener("change", (e) => { changeDetail = e.detail; });

            el.shadowRoot.querySelector(".clear-button").click();
            await nextFrame();

            expect(changeDetail).to.not.be.null;
            expect(changeDetail.value).to.equal("");
            // required + no value → should be invalid
            expect(el.hasAttribute("invalid")).to.be.true;
        });
    });

    describe("multiple selection deselect behavior", () => {
        it("clicking a selected item in multi mode deselects it", async () => {
            const el = await fixture(
                html`<y-select
                    multiple
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el.value = "apple,banana";
            await nextFrame();
            el._openDropdown();
            await nextFrame();

            const appleItem = [...el.shadowRoot.querySelectorAll(".dropdown-item")]
                .find((i) => i.getAttribute("data-value") === "apple");
            appleItem.click();
            await nextFrame();

            expect(el.selectedValues.has("apple")).to.be.false;
            expect(el.selectedValues.has("banana")).to.be.true;
        });

        it("does not deselect in multi mode when required and only one item is selected", async () => {
            const el = await fixture(
                html`<y-select
                    multiple
                    required
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el.value = "apple";
            await nextFrame();
            el._openDropdown();
            await nextFrame();

            const appleItem = [...el.shadowRoot.querySelectorAll(".dropdown-item")]
                .find((i) => i.getAttribute("data-value") === "apple");
            appleItem.click();
            await nextFrame();

            // Should NOT have been deselected because required and size === 1
            expect(el.selectedValues.has("apple")).to.be.true;
        });
    });

    describe("searchable multi-tag keeps dropdown open after selection", () => {
        it("keeps dropdown open after selecting an item in searchable multi-tag mode", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    multiple
                    display-mode="tag"
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();

            const bananaItem = [...el.shadowRoot.querySelectorAll(".dropdown-item")]
                .find((i) => i.getAttribute("data-value") === "banana");
            bananaItem.click();
            await nextFrame();

            expect(el.dropdown.classList.contains("open")).to.be.true;
        });

        it("clears the search input after selecting in searchable multi-tag mode", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    multiple
                    display-mode="tag"
                    options='[{"label":"Apple","value":"apple"},{"label":"Banana","value":"banana"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();

            const input = el.shadowRoot.querySelector(".search-input");
            input.value = "ban";
            input.dispatchEvent(new Event("input"));
            await nextFrame();

            const bananaItem = [...el.shadowRoot.querySelectorAll(".dropdown-item")]
                .find((i) => i.getAttribute("data-value") === "banana");
            bananaItem.click();
            await nextFrame();

            expect(input.value).to.equal("");
        });
    });

    describe("_filterOptions edge case", () => {
        it("_filterOptions returns early and does not throw when dropdown is not yet in shadow DOM", async () => {
            const el = await fixture(html`<y-select></y-select>`);
            // Temporarily remove dropdown reference to simulate missing element
            const saved = el.dropdown;
            el.dropdown = null;
            expect(() => el._filterOptions("test")).to.not.throw();
            el.dropdown = saved;
        });
    });

    describe("closeDropdown restores search input for multi searchable", () => {
        it("clears the search input on closeDropdown for searchable multi mode", async () => {
            const el = await fixture(
                html`<y-select
                    searchable
                    multiple
                    display-mode="tag"
                    options='[{"label":"Apple","value":"apple"}]'
                ></y-select>`,
            );
            el._openDropdown();
            await nextFrame();

            const input = el.shadowRoot.querySelector(".search-input");
            input.value = "ap";

            el.closeDropdown();
            await nextFrame();

            expect(input.value).to.equal("");
        });
    });

    describe("XSS hardening", () => {
        it("does not allow attribute breakout via placeholder", async () => {
            const hostile = `Pick" onfocus="window.__xssSelectPlaceholder=true" autofocus x="`;
            const el = document.createElement("y-select");
            el.setAttribute("searchable", "");
            el.setAttribute("placeholder", hostile);
            el.setAttribute(
                "options",
                JSON.stringify([{ label: "A", value: "a" }]),
            );
            document.body.appendChild(el);

            expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
            expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
            expect(window.__xssSelectPlaceholder).to.be.undefined;

            const input = el.shadowRoot.querySelector(".search-input");
            expect(input).to.exist;
            expect(input.getAttribute("placeholder")).to.equal(hostile);

            document.body.removeChild(el);
        });

        it("renders option label as text, not HTML", async () => {
            const hostileLabel = `<img src=x onerror="window.__xssSelectLabel=true">`;
            const options = JSON.stringify([
                { label: hostileLabel, value: "h" },
            ]);
            const el = await fixture(
                html`<y-select options=${options}></y-select>`,
            );

            const item = el.shadowRoot.querySelector(".dropdown-item");
            expect(item).to.exist;
            expect(item.querySelector("img")).to.be.null;
            expect(item.textContent).to.equal(hostileLabel);
            expect(window.__xssSelectLabel).to.be.undefined;
        });

        it("does not allow attribute breakout via option value", async () => {
            const hostileValue = `a" onfocus="window.__xssSelectValue=true" autofocus x="`;
            const options = JSON.stringify([
                { label: "Apple", value: hostileValue },
            ]);
            const el = await fixture(
                html`<y-select options=${options}></y-select>`,
            );

            const item = el.shadowRoot.querySelector(".dropdown-item");
            expect(item).to.exist;
            expect(item.getAttribute("data-value")).to.equal(hostileValue);
            expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
            expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
            expect(window.__xssSelectValue).to.be.undefined;
        });

        it("ignores an unsafe option color (CSS-context escape)", async () => {
            const hostileColor = `red; }</style><script>window.__xssSelectColor=true</script><x x="`;
            const options = JSON.stringify([
                { label: "A", value: "a", color: hostileColor },
            ]);
            const el = await fixture(
                html`<y-select value="a" options=${options}></y-select>`,
            );

            const item = el.shadowRoot.querySelector(".dropdown-item.selected");
            expect(item).to.exist;
            // Hostile color is not applied as inline style
            expect(item.style.background).to.equal("");
            expect(window.__xssSelectColor).to.be.undefined;
        });

        it("accepts a safe hex color but rejects a hostile one wrapped in #", async () => {
            const safeOptions = JSON.stringify([
                { label: "A", value: "a", color: "#ff00ff" },
            ]);
            const el = await fixture(
                html`<y-select value="a" options=${safeOptions}></y-select>`,
            );
            const safeItem = el.shadowRoot.querySelector(
                ".dropdown-item.selected",
            );
            expect(safeItem.style.background).to.match(
                /(#ff00ff|rgb\(\s*255,\s*0,\s*255\s*\))/,
            );

            const hostileColor = `#ff00ff; background-image: url(javascript:alert(1));//`;
            const hostileOptions = JSON.stringify([
                { label: "A", value: "a", color: hostileColor },
            ]);
            el.setAttribute("options", hostileOptions);
            await nextFrame();

            const hostileItem = el.shadowRoot.querySelector(
                ".dropdown-item.selected",
            );
            expect(hostileItem.style.background).to.equal("");
        });
    });
});
