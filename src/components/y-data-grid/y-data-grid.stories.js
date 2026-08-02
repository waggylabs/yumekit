import "./y-data-grid.js";
import "../y-theme/y-theme.js";

// Storybook renders templates as plain HTML strings, and we wrap JSON attribute
// values in single quotes. Any apostrophe inside the JSON (e.g. "O'Connor")
// closes the attribute early and breaks parsing — escape them up front.
const attr = (s) => String(s).replace(/'/g, "&#39;");

const defaultColumns = attr(JSON.stringify([
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "department", label: "Department" },
    { key: "salary", label: "Salary", type: "number", align: "right" },
    { key: "status", label: "Status" },
]));

const defaultData = attr(JSON.stringify([
    { name: "Alice Johnson", role: "Engineer", department: "Platform", salary: 125000, status: "Active" },
    { name: "Bob Smith", role: "Designer", department: "Design", salary: 95000, status: "Active" },
    { name: "Carol White", role: "Manager", department: "Platform", salary: 145000, status: "On Leave" },
    { name: "David Brown", role: "Engineer", department: "Infrastructure", salary: 130000, status: "Active" },
    { name: "Eva Martinez", role: "QA", department: "Platform", salary: 90000, status: "Inactive" },
    { name: "Frank Wilson", role: "Engineer", department: "Infrastructure", salary: 135000, status: "Active" },
    { name: "Grace Lee", role: "Product", department: "Product", salary: 120000, status: "Active" },
    { name: "Henry Patel", role: "Designer", department: "Design", salary: 98000, status: "Active" },
    { name: "Ivy Chen", role: "Manager", department: "Product", salary: 155000, status: "Active" },
    { name: "Jack Rivera", role: "QA", department: "Platform", salary: 88000, status: "Active" },
    { name: "Kim Nguyen", role: "Engineer", department: "Infrastructure", salary: 128000, status: "Active" },
    { name: "Liam O'Connor", role: "Engineer", department: "Platform", salary: 122000, status: "On Leave" },
]));

const wrapStyle = "padding: 24px; background: var(--base-background-app, #fafafa); border-radius: 8px;";

export default {
    title: "Data/DataGrid",
    tags: ["autodocs"],
    argTypes: {
        columns: {
            control: "text",
            description: "JSON array of `{ key, label, type?, width?, align?, sortable?, filterable? }`.",
        },
        data: {
            control: "text",
            description: "JSON array of row objects keyed by column `key`.",
        },
        mode: {
            control: "select",
            options: ["client", "server"],
            description: "`client` sorts/filters/pages locally; `server` emits events for the parent to handle.",
            table: { defaultValue: { summary: "client" } },
        },
        pageSize: {
            name: "page-size",
            control: { type: "number", min: 1 },
            table: { defaultValue: { summary: "20" } },
        },
        striped: {
            control: "boolean",
            description: "Alternating row backgrounds. Defaults to false.",
            table: { defaultValue: { summary: "false" } },
        },
        hover: {
            control: "boolean",
            description: "Highlight rows on hover. Defaults to true.",
            table: { defaultValue: { summary: "true" } },
        },
        fixedHeader: {
            name: "fixed-header",
            control: "boolean",
            description: "Sticky header during vertical scroll. Defaults to true.",
            table: { defaultValue: { summary: "true" } },
        },
        filtering: {
            control: "select",
            options: [null, "inline", "advanced"],
            description:
                "Filtering UI. `inline` renders a per-column filter row beneath the header; `advanced` adds a funnel trigger that opens a filter popover (operator + value + Clear/Apply). Default: no filtering UI.",
            table: { defaultValue: { summary: "(none)" } },
        },
        enableSorting: {
            name: "enable-sorting",
            control: "boolean",
            description: "Allow click-to-sort on column headers. Shift+click to multi-sort. Defaults to true.",
            table: { defaultValue: { summary: "true" } },
        },
        enablePagination: {
            name: "enable-pagination",
            control: "boolean",
            description: "Render the pagination footer. Defaults to true.",
            table: { defaultValue: { summary: "true" } },
        },
        showItemCount: {
            name: "show-item-count",
            control: "boolean",
            description: "Show the row count on the right edge of the footer. Defaults to false.",
            table: { defaultValue: { summary: "false" } },
        },
        enableColumnResize: {
            name: "enable-column-resize",
            control: "boolean",
            description: "Drag the inline (right) edge of a header to resize the column. Opt out per column with `resizable: false`; double-click the handle to reset. Defaults to false.",
            table: { defaultValue: { summary: "false" } },
        },
        enableColumnReorder: {
            name: "enable-column-reorder",
            control: "boolean",
            description: "Drag a column header onto another to reorder columns. Opt out per column with `reorderable: false`. Defaults to false.",
            table: { defaultValue: { summary: "false" } },
        },
        loading: {
            control: "boolean",
            description: "Present a loading state and set `aria-busy`. What is shown depends on `loading-mode`.",
        },
        loadingMode: {
            name: "loading-mode",
            control: "select",
            options: ["auto", "overlay", "skeleton"],
            description: "`auto` (default) shows skeleton on first load and overlay on refetch; `overlay` always dims under a spinner; `skeleton` always renders placeholder rows.",
            table: { defaultValue: { summary: "auto" } },
        },
        skeletonRows: {
            name: "skeleton-rows",
            control: "number",
            description: "Placeholder row count in skeleton mode (defaults to page size, else 10).",
        },
        emptyMessage: {
            name: "empty-message",
            control: "text",
            table: { defaultValue: { summary: "No data available" } },
        },
    },
    args: {
        columns: defaultColumns,
        data: defaultData,
        mode: "client",
        pageSize: 5,
        striped: false,
        hover: true,
        fixedHeader: true,
        filtering: null,
        enableSorting: true,
        enablePagination: true,
        showItemCount: false,
        enableColumnResize: false,
        enableColumnReorder: false,
        loading: false,
        loadingMode: "auto",
        skeletonRows: undefined,
        emptyMessage: "No data available",
    },
    render: (args) => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${attr(args.columns)}'
                data='${attr(args.data)}'
                mode="${args.mode}"
                page-size="${args.pageSize}"
                striped="${args.striped}"
                hover="${args.hover}"
                fixed-header="${args.fixedHeader}"
                enable-sorting="${args.enableSorting}"
                enable-pagination="${args.enablePagination}"
                ${args.showItemCount ? "show-item-count" : ""}
                ${args.enableColumnResize ? "enable-column-resize" : ""}
                ${args.enableColumnReorder ? "enable-column-reorder" : ""}
                ${args.filtering ? `filtering="${args.filtering}"` : ""}
                ${args.loading ? "loading" : ""}
                loading-mode="${args.loadingMode}"
                ${args.skeletonRows ? `skeleton-rows="${args.skeletonRows}"` : ""}
                empty-message="${args.emptyMessage}"
            ></y-data-grid>
        </div>
    `,
};

export const Default = {};

export const FilterableInline = {
    args: { filtering: "inline", pageSize: 8 },
};

export const FilterableAdvanced = {
    args: { filtering: "advanced", pageSize: 8 },
};

export const Loading = {
    args: { loading: true, pageSize: 5 },
    parameters: {
        docs: {
            description: {
                story: "Default `loading-mode=\"auto\"` with data already present resolves to the overlay — the existing rows stay visible and dimmed, which reads well on a refetch.",
            },
        },
    },
};

export const LoadingFirstLoad = {
    args: { loading: true, data: "[]", pageSize: 8 },
    parameters: {
        docs: {
            description: {
                story: "A grid loading with no rows: `auto` renders shape-accurate skeleton rows reusing the real column widths, instead of a spinner over an empty grid. The empty state is suppressed while loading.",
            },
        },
    },
};

export const LoadingSkeleton = {
    args: { loading: true, loadingMode: "skeleton", skeletonRows: 6, pageSize: 5 },
    parameters: {
        docs: {
            description: {
                story: "`loading-mode=\"skeleton\"` always renders placeholder rows, even when data is present.",
            },
        },
    },
};

export const LoadingOverlay = {
    args: { loading: true, loadingMode: "overlay", data: "[]", pageSize: 5 },
    parameters: {
        docs: {
            description: {
                story: "`loading-mode=\"overlay\"` keeps the pre-0.5.4 behavior — a spinner over the (here empty) body — in every case.",
            },
        },
    },
};

export const Empty = {
    args: { data: "[]" },
};

export const NoPagination = {
    args: { enablePagination: false },
};

export const WithItemCount = {
    args: { showItemCount: true, pageSize: 5 },
};

export const ServerMode = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                In <code>mode="server"</code> the grid passes data through unchanged. Page,
                sort, and filter events are emitted for the parent to handle.
            </p>
            <y-data-grid
                id="server-grid"
                columns='${defaultColumns}'
                data='${defaultData}'
                mode="server"
                total-rows="100"
                page-size="5"
                filtering="inline"
            ></y-data-grid>
            <pre id="server-log" style="margin-top:12px;padding:8px;background:var(--base-background-component,#1c1d1f);color:var(--base-content,#f7f7fa);font-size:12px;max-height:140px;overflow:auto"></pre>
            <script>
                {
                    const grid = document.getElementById("server-grid");
                    const log = document.getElementById("server-log");
                    const write = (label, e) => {
                        log.textContent =
                            "[" + new Date().toLocaleTimeString() + "] " + label + ": " +
                            JSON.stringify(e.detail) + "\\n" + log.textContent;
                    };
                    grid.addEventListener("page-change", (e) => write("page-change", e));
                    grid.addEventListener("sort-change", (e) => write("sort-change", e));
                    grid.addEventListener("filter-change", (e) => write("filter-change", e));
                }
            </script>
        </div>
    `,
};

export const HeaderToolbar = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                page-size="5"
                filtering="inline"
            >
                <div slot="header-before" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--base-background-component,#1c1d1f);color:var(--base-content,#f7f7fa);font-family:sans-serif;font-weight:600">
                    Employees
                    <span style="font-weight:400;font-size:0.875em;opacity:0.7">12 rows</span>
                </div>
            </y-data-grid>
        </div>
    `,
};

export const MultiSelection = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                id="select-grid"
                columns='${defaultColumns}'
                data='${defaultData}'
                page-size="6"
                enable-selection
                row-key="name"
            ></y-data-grid>
            <p id="select-log" style="font-family:sans-serif;margin-top:12px;color:var(--base-content,#333)">No rows selected.</p>
            <script>
                {
                    const g = document.getElementById("select-grid");
                    const log = document.getElementById("select-log");
                    g.addEventListener("row-select", (e) => {
                        const names = e.detail.rows.map(r => r.name).join(", ");
                        log.textContent = e.detail.rows.length
                            ? "Selected: " + names
                            : "No rows selected.";
                    });
                }
            </script>
        </div>
    `,
};

export const SingleSelection = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                page-size="6"
                enable-selection
                selection-mode="single"
                row-key="name"
            ></y-data-grid>
        </div>
    `,
};

const editableColumns = attr(JSON.stringify([
    { key: "name", label: "Name", required: true },
    { key: "role", label: "Role", editor: "select", options: ["Engineer", "Designer", "Manager", "Product", "QA"] },
    { key: "department", label: "Department" },
    { key: "salary", label: "Salary", type: "number", align: "right", min: 0 },
    { key: "active", label: "Active", editor: "checkbox", editable: true },
]));

const editableData = attr(JSON.stringify([
    { name: "Alice Johnson", role: "Engineer", department: "Platform", salary: 125000, active: true },
    { name: "Bob Smith", role: "Designer", department: "Design", salary: 95000, active: true },
    { name: "Carol White", role: "Manager", department: "Platform", salary: 145000, active: false },
    { name: "David Brown", role: "Engineer", department: "Infrastructure", salary: 130000, active: true },
]));

export const InlineEditing = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                Click any cell to edit. Press <kbd>Enter</kbd> to commit, <kbd>Esc</kbd> to cancel.
                The <em>Name</em> column is required.
            </p>
            <y-data-grid
                columns='${editableColumns}'
                data='${editableData}'
                page-size="5"
                enable-editing
                row-key="name"
            ></y-data-grid>
        </div>
    `,
};

export const SelectionAndEditing = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${editableColumns}'
                data='${editableData}'
                page-size="5"
                enable-selection
                enable-editing
                row-key="name"
            ></y-data-grid>
        </div>
    `,
};

export const GroupedSingleLevel = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                group-by='["department"]'
            ></y-data-grid>
        </div>
    `,
};

export const GroupedWithAggregates = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                group-by='["department"]'
                aggregates='${JSON.stringify({ salary: "sum", name: "count" })}'
            ></y-data-grid>
        </div>
    `,
};

export const GroupedNested = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                group-by='["department","role"]'
                aggregates='${JSON.stringify({ salary: "avg" })}'
            ></y-data-grid>
        </div>
    `,
};

const largeDataset = attr(JSON.stringify(
    Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: ["Engineer", "Designer", "Manager", "Product", "QA"][i % 5],
        score: Math.round(Math.random() * 1000),
    })),
));

const largeColumns = attr(JSON.stringify([
    { key: "id", label: "ID", type: "number", align: "right", width: "80px" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "score", label: "Score", type: "number", align: "right" },
]));

const groupedHeaderColumns = attr(JSON.stringify([
    { key: "name", label: "Name" },
    {
        label: "Contact",
        children: [
            { key: "email", label: "Email" },
            { key: "phone", label: "Phone" },
        ],
    },
    {
        label: "Compensation",
        children: [
            { key: "salary", label: "Salary", type: "number", align: "right" },
            { key: "bonus", label: "Bonus", type: "number", align: "right" },
        ],
    },
]));

const groupedHeaderData = attr(JSON.stringify([
    { name: "Alice Johnson", email: "alice@ex.com", phone: "555-0001", salary: 125000, bonus: 12000 },
    { name: "Bob Smith", email: "bob@ex.com", phone: "555-0002", salary: 95000, bonus: 8000 },
    { name: "Carol White", email: "carol@ex.com", phone: "555-0003", salary: 145000, bonus: 18000 },
    { name: "David Brown", email: "david@ex.com", phone: "555-0004", salary: 130000, bonus: 14000 },
]));

export const GroupedHeaders = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${groupedHeaderColumns}'
                data='${groupedHeaderData}'
            ></y-data-grid>
        </div>
    `,
};

const nestedHeaderColumns = attr(JSON.stringify([
    { key: "id", label: "ID", type: "number", align: "right", width: "60px" },
    {
        label: "Employee",
        children: [
            { key: "name", label: "Name" },
            {
                label: "Address",
                children: [
                    { key: "city", label: "City" },
                    { key: "country", label: "Country" },
                ],
            },
        ],
    },
    {
        label: "Compensation",
        children: [
            { key: "salary", label: "Salary", type: "number", align: "right" },
            {
                label: "Equity",
                children: [
                    { key: "shares", label: "Shares", type: "number", align: "right" },
                    { key: "vested", label: "Vested %", type: "number", align: "right" },
                ],
            },
        ],
    },
]));

const nestedHeaderData = attr(JSON.stringify([
    { id: 1, name: "Alice", city: "Portland", country: "USA", salary: 125000, shares: 5000, vested: 75 },
    { id: 2, name: "Bob", city: "Berlin", country: "DE", salary: 95000, shares: 3000, vested: 50 },
    { id: 3, name: "Carol", city: "Tokyo", country: "JP", salary: 145000, shares: 8000, vested: 100 },
]));

export const NestedGroupedHeaders = {
    render: () => `
        <div style="${wrapStyle}">
            <y-data-grid
                columns='${nestedHeaderColumns}'
                data='${nestedHeaderData}'
                enable-selection
                filtering="inline"
                row-key="id"
            ></y-data-grid>
        </div>
    `,
};

export const HeaderMenu = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                Hover any header to reveal the action triggers. The funnel
                (<code>filtering="advanced"</code>) opens a per-column filter popover with
                operator + value + Clear/Apply; the kebab (<code>enable-header-menu</code>) opens
                a popover with asc/desc sort, a hover-opened columns submenu, and move next/previous.
            </p>
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                filtering="advanced"
                enable-header-menu
            ></y-data-grid>
        </div>
    `,
};

export const ResizableColumns = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                Hover the inline (right) edge of any header to reveal the resize handle, then drag to
                set the column width. Double-click a handle to reset that column to auto width.
            </p>
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                page-size="6"
                enable-column-resize
            ></y-data-grid>
        </div>
    `,
};

export const ReorderableColumns = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                Grab a column header and drag it onto another column to change the order. A drop line
                marks where the column will land. Clicking a header (without dragging) still sorts.
            </p>
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                page-size="6"
                enable-column-reorder
            ></y-data-grid>
        </div>
    `,
};

export const ResizableAndReorderable = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                Resize and reorder together — drag the edge to size a column, drag the body of the
                header to move it. Pairs naturally with <code>enable-header-menu</code>.
            </p>
            <y-data-grid
                columns='${defaultColumns}'
                data='${defaultData}'
                page-size="6"
                enable-column-resize
                enable-column-reorder
                enable-header-menu
            ></y-data-grid>
        </div>
    `,
};

export const Virtualized = {
    render: () => `
        <div style="${wrapStyle}">
            <p style="margin:0 0 12px;font-family:sans-serif;color:var(--base-content,#333)">
                5,000 rows rendered with virtualization — only the visible window + buffer is in the DOM.
            </p>
            <y-data-grid
                columns='${largeColumns}'
                data='${largeDataset}'
                virtual
                viewport-height="400"
                row-height="36"
                buffer-size="10"
                enable-pagination="false"
            ></y-data-grid>
        </div>
    `,
};
