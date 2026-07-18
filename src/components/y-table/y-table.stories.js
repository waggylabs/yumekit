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
        loading: {
            control: "boolean",
            description: "Renders skeleton placeholder rows in place of the body.",
            table: { defaultValue: { summary: false } },
        },
        skeletonRows: {
            control: "number",
            description: "Number of placeholder rows rendered while loading.",
            table: { defaultValue: { summary: "5" } },
        },
    },
    args: {
        columns: defaultColumns,
        data: defaultData,
        size: "medium",
        striped: false,
        loading: false,
        skeletonRows: 5,
    },
    render: ({ columns, data, size, striped, loading, skeletonRows }) => `
        <y-table
            columns='${columns}'
            data='${data}'
            size="${size}"
            ${striped ? "striped" : ""}
            ${loading ? "loading" : ""}
            skeleton-rows="${skeletonRows}"
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

export const Loading = {
    args: { loading: true },
    parameters: {
        docs: {
            description: {
                story: "With `loading` set, `y-table` replaces its body with skeleton rows generated from the columns. Sort controls are disabled and a single visually-hidden live region announces the load. Skeleton is the table's only loading presentation — reach for `y-data-grid` if you need an overlay on refetch.",
            },
        },
    },
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
