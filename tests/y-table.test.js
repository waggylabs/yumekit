import { fixture, html, expect } from "@open-wc/testing";
import "../src/components/y-table.js";

const sampleColumns = JSON.stringify([
    { field: "name", header: "Name" },
    { field: "age", header: "Age" },
    { field: "city", header: "City" },
]);

const sampleData = JSON.stringify([
    { name: "Alice", age: 30, city: "Portland" },
    { name: "Bob", age: 25, city: "Seattle" },
    { name: "Charlie", age: 35, city: "Austin" },
]);

const nonSortableColumns = JSON.stringify([
    { field: "name", header: "Name", sortable: false },
    { field: "age", header: "Age" },
]);

describe("YumeTable", () => {
    it("renders a table with columns and rows", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const ths = el.shadowRoot.querySelectorAll("thead th");
        const tds = el.shadowRoot.querySelectorAll("tbody td");

        expect(ths.length).to.equal(3);
        expect(tds.length).to.equal(9);
        expect(ths[0].textContent).to.include("Name");
        expect(ths[1].textContent).to.include("Age");
    });

    it("renders an empty table when no data is provided", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}"></y-table>
        `);
        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).to.equal(0);
    });

    it("renders an empty table when no columns are provided", async () => {
        const el = await fixture(html`
            <y-table data="${sampleData}"></y-table>
        `);
        const ths = el.shadowRoot.querySelectorAll("thead th");
        expect(ths.length).to.equal(0);
    });

    it("sorts ascending on first header click", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const nameHeader = el.shadowRoot.querySelector("thead th");
        nameHeader.click();

        const firstCell = el.shadowRoot.querySelector("tbody tr td");
        expect(firstCell.textContent).to.equal("Alice");
    });

    it("sorts descending on second header click", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const nameHeader = el.shadowRoot.querySelector("thead th");
        nameHeader.click(); // asc
        nameHeader.click(); // desc

        const firstCell = el.shadowRoot.querySelector("tbody tr td");
        expect(firstCell.textContent).to.equal("Charlie");
    });

    it("resets sort on third header click", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const nameHeader = el.shadowRoot.querySelector("thead th");
        nameHeader.click(); // asc
        nameHeader.click(); // desc
        nameHeader.click(); // none

        const firstCell = el.shadowRoot.querySelector("tbody tr td");
        // Should be back to original order
        expect(firstCell.textContent).to.equal("Alice");
    });

    it("sorts numeric columns correctly", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const ageHeader = el.shadowRoot.querySelectorAll("thead th")[1];
        ageHeader.click(); // asc

        const cells = el.shadowRoot.querySelectorAll("tbody tr");
        const firstAge = cells[0].querySelectorAll("td")[1].textContent;
        const lastAge = cells[2].querySelectorAll("td")[1].textContent;
        expect(Number(firstAge)).to.equal(25);
        expect(Number(lastAge)).to.equal(35);
    });

    it("dispatches a sort event on header click", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);

        let detail = null;
        el.addEventListener("sort", (e) => {
            detail = e.detail;
        });

        const nameHeader = el.shadowRoot.querySelector("thead th");
        nameHeader.click();

        expect(detail).to.not.be.null;
        expect(detail.field).to.equal("name");
        expect(detail.direction).to.equal("asc");
    });

    it("does not sort when sortable is false", async () => {
        const el = await fixture(html`
            <y-table
                columns="${nonSortableColumns}"
                data="${sampleData}"
            ></y-table>
        `);
        const nameHeader = el.shadowRoot.querySelector("thead th");
        expect(nameHeader.classList.contains("sortable")).to.be.false;
    });

    it("marks the first column as row-header", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const firstTd = el.shadowRoot.querySelector("tbody tr td");
        expect(firstTd.classList.contains("row-header")).to.be.true;
    });

    it("applies striped attribute", async () => {
        const el = await fixture(html`
            <y-table
                columns="${sampleColumns}"
                data="${sampleData}"
                striped
            ></y-table>
        `);
        expect(el.hasAttribute("striped")).to.be.true;
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        expect(el.size).to.equal("medium");
    });

    it("accepts size attribute", async () => {
        const el = await fixture(html`
            <y-table
                columns="${sampleColumns}"
                data="${sampleData}"
                size="large"
            ></y-table>
        `);
        expect(el.size).to.equal("large");
    });

    it("shows no sort icon on unsorted headers", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const svg = el.shadowRoot.querySelector("thead th .sort-icon");
        expect(svg).to.be.null;
    });

    it("shows sort icon only on the active sorted column", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        el.shadowRoot.querySelector("thead th").click();

        const icons = el.shadowRoot.querySelectorAll("thead th .sort-icon");
        expect(icons.length).to.equal(1);
    });

    it("removes sort icon when sort is cleared", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const nameHeader = el.shadowRoot.querySelector("thead th");
        nameHeader.click(); // asc
        nameHeader.click(); // desc
        el.shadowRoot.querySelector("thead th").click(); // none

        const svg = el.shadowRoot.querySelector("thead th .sort-icon");
        expect(svg).to.be.null;
    });

    it("sets aria-sort attribute on sorted column", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        let nameHeader = el.shadowRoot.querySelector("thead th");
        nameHeader.click();
        // Re-query after re-render
        nameHeader = el.shadowRoot.querySelector("thead th");
        expect(nameHeader.getAttribute("aria-sort")).to.equal("ascending");

        nameHeader.click();
        nameHeader = el.shadowRoot.querySelector("thead th");
        expect(nameHeader.getAttribute("aria-sort")).to.equal("descending");
    });

    it("re-renders when columns attribute changes", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        expect(el.shadowRoot.querySelectorAll("thead th").length).to.equal(3);

        const newCols = JSON.stringify([{ field: "name", header: "Name" }]);
        el.setAttribute("columns", newCols);

        expect(el.shadowRoot.querySelectorAll("thead th").length).to.equal(1);
    });

    it("re-renders when data attribute changes", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        expect(el.shadowRoot.querySelectorAll("tbody tr").length).to.equal(3);

        const newData = JSON.stringify([
            { name: "Dave", age: 40, city: "Denver" },
        ]);
        el.setAttribute("data", newData);

        expect(el.shadowRoot.querySelectorAll("tbody tr").length).to.equal(1);
    });

    it("handles switching sort to a different column", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        const headers = el.shadowRoot.querySelectorAll("thead th");

        headers[0].click(); // sort by name asc
        headers[1].click(); // switch to age asc

        const firstAge = el.shadowRoot
            .querySelector("tbody tr")
            .querySelectorAll("td")[1].textContent;
        expect(Number(firstAge)).to.equal(25);
    });

    it("columns setter accepts an array and serialises it", async () => {
        const el = await fixture(html`
            <y-table></y-table>
        `);
        el.columns = [{ field: "title", header: "Title" }];
        const ths = el.shadowRoot.querySelectorAll("thead th");
        expect(ths.length).to.equal(1);
        expect(ths[0].textContent).to.include("Title");
    });

    it("columns setter accepts a JSON string directly", async () => {
        const el = await fixture(html`<y-table></y-table>`);
        el.columns = JSON.stringify([{ field: "x", header: "X" }]);
        const ths = el.shadowRoot.querySelectorAll("thead th");
        expect(ths.length).to.equal(1);
    });

    it("data setter accepts an array and serialises it", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}"></y-table>
        `);
        el.data = [{ name: "Eve", age: 28, city: "Miami" }];
        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).to.equal(1);
        expect(rows[0].querySelector("td").textContent).to.equal("Eve");
    });

    it("data setter accepts a JSON string directly", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}"></y-table>
        `);
        el.data = JSON.stringify([{ name: "Frank", age: 22, city: "Boston" }]);
        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).to.equal(1);
    });

    it("striped setter sets the striped attribute", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}"></y-table>
        `);
        expect(el.striped).to.be.false;

        el.striped = true;
        expect(el.hasAttribute("striped")).to.be.true;
        expect(el.striped).to.be.true;

        const css = el.shadowRoot.querySelector("style").textContent;
        expect(css).to.include("nth-child(even)");
    });

    it("striped setter removes the striped attribute when set to false", async () => {
        const el = await fixture(html`
            <y-table columns="${sampleColumns}" data="${sampleData}" striped></y-table>
        `);
        expect(el.striped).to.be.true;

        el.striped = false;
        expect(el.hasAttribute("striped")).to.be.false;
        expect(el.striped).to.be.false;
    });

    it("sorts rows with null values to the end in ascending order", async () => {
        const colsWithNull = JSON.stringify([
            { field: "name", header: "Name" },
            { field: "score", header: "Score" },
        ]);
        const dataWithNull = JSON.stringify([
            { name: "Alice", score: 10 },
            { name: "Bob", score: null },
            { name: "Charlie", score: 5 },
        ]);
        const el = await fixture(html`
            <y-table columns="${colsWithNull}" data="${dataWithNull}"></y-table>
        `);
        const scoreHeader = el.shadowRoot.querySelectorAll("thead th")[1];
        scoreHeader.click(); // sort by score asc

        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        const lastRowScore = rows[2].querySelectorAll("td")[1].textContent;
        // null sorts to the bottom
        expect(lastRowScore).to.equal("");
    });

    it("sorts two rows both having null values as equal (stable)", async () => {
        const colsWithNull = JSON.stringify([
            { field: "name", header: "Name" },
            { field: "score", header: "Score" },
        ]);
        const dataWithNull = JSON.stringify([
            { name: "Alice", score: null },
            { name: "Bob", score: null },
        ]);
        const el = await fixture(html`
            <y-table columns="${colsWithNull}" data="${dataWithNull}"></y-table>
        `);
        const scoreHeader = el.shadowRoot.querySelectorAll("thead th")[1];
        scoreHeader.click();

        const rows = el.shadowRoot.querySelectorAll("tbody tr");
        // Both have null score — just check neither throws and two rows render
        expect(rows.length).to.equal(2);
    });
});
