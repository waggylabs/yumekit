import "./y-table.js";

const defaultColumns = JSON.stringify([
    { field: "name", header: "Name", sortable: true },
    { field: "role", header: "Role", sortable: true },
    { field: "status", header: "Status" },
]);

const defaultData = JSON.stringify([
    { name: "Alice Johnson", role: "Engineer", status: "Active" },
    { name: "Bob Smith", role: "Designer", status: "Active" },
    { name: "Carol White", role: "Manager", status: "On Leave" },
    { name: "David Brown", role: "Engineer", status: "Active" },
    { name: "Eva Martinez", role: "QA", status: "Inactive" },
]);

export default {
    title: "Data/Table",
    tags: ["autodocs"],
    argTypes: {
        columns: {
            control: "text",
            description: 'JSON array of `{ field, header?, sortable? }` objects.',
        },
        data: {
            control: "text",
            description: "JSON array of row objects keyed by column field names.",
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Cell padding size.",
            table: { defaultValue: { summary: "medium" } },
        },
        striped: {
            control: "boolean",
            description: "Whether to show alternating row backgrounds.",
            table: { defaultValue: { summary: false } },
        },
    },
    args: {
        columns: defaultColumns,
        data: defaultData,
        size: "medium",
        striped: false,
    },
    render: ({ columns, data, size, striped }) => `
        <y-table
            columns='${columns}'
            data='${data}'
            size="${size}"
            ${striped ? "striped" : ""}
        ></y-table>
    `,
};

export const Default = {};

export const Striped = {
    args: { striped: true },
};

export const Sizes = {
    render: () => `
        <div style="display:flex;flex-direction:column;gap:32px">
            <y-table columns='${defaultColumns}' data='${defaultData}' size="small"></y-table>
            <y-table columns='${defaultColumns}' data='${defaultData}' size="medium"></y-table>
            <y-table columns='${defaultColumns}' data='${defaultData}' size="large"></y-table>
        </div>
    `,
};

export const Sortable = {
    render: () => `
        <y-table
            columns='${JSON.stringify([
                { field: "name", header: "Name", sortable: true },
                { field: "age", header: "Age", sortable: true },
                { field: "city", header: "City", sortable: true },
            ])}'
            data='${JSON.stringify([
                { name: "Alice", age: 32, city: "New York" },
                { name: "Bob", age: 25, city: "London" },
                { name: "Carol", age: 28, city: "Paris" },
                { name: "David", age: 35, city: "Tokyo" },
            ])}'
        ></y-table>
    `,
};

export const StripedSortable = {
    args: { striped: true },
    render: () => `
        <y-table
            columns='${defaultColumns}'
            data='${defaultData}'
            striped
        ></y-table>
    `,
};
