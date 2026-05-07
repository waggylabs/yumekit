import "./y-paginator.js";
import "../y-icon/y-icon.js";
import "../y-theme/y-theme.js";
import "../../icons/all.js";

const wrapStyle =
    "padding: 24px; background: var(--base-background-app, #fafafa); border-radius: 8px;";

export default {
    title: "Navigation/Paginator",
    tags: ["autodocs"],
    argTypes: {
        currentPage: {
            name: "current-page",
            control: { type: "number", min: 1 },
            description: "Currently active page (1-indexed).",
            table: { defaultValue: { summary: "1" } },
        },
        totalPages: {
            name: "total-pages",
            control: { type: "number", min: 0 },
            description: "Total number of pages available.",
            table: { defaultValue: { summary: "0" } },
        },
        pageCount: {
            name: "page-count",
            control: { type: "number", min: 1 },
            description:
                "Maximum number of page buttons displayed at once (excluding ellipses).",
            table: { defaultValue: { summary: "5" } },
        },
        boundaryCount: {
            name: "boundary-count",
            control: { type: "number", min: 0 },
            description:
                "Number of pages always shown at the start and end of the list.",
            table: { defaultValue: { summary: "1" } },
        },
        variant: {
            control: "select",
            options: ["default", "compact", "detailed"],
            description:
                "Visual style. `compact` swaps the page list for a `n of n pages` status with first/prev/next/last buttons. `detailed` adds prev/next text labels and shows the items-per-page label.",
            table: { defaultValue: { summary: "default" } },
        },
        size: {
            control: "select",
            options: ["small", "medium", "large"],
            description: "Button size, font size, and spacing.",
            table: { defaultValue: { summary: "medium" } },
        },
        disabled: {
            control: "boolean",
            description: "Disables interaction with all controls.",
            table: { defaultValue: { summary: false } },
        },
        hideOnSinglePage: {
            name: "hide-on-single-page",
            control: "boolean",
            description: "When true, hides the component if total-pages ≤ 1.",
            table: { defaultValue: { summary: true } },
        },
        pageSizeOptions: {
            name: "page-size-options",
            control: "text",
            description:
                "JSON array of numbers (e.g. `[10, 25, 50]`) or `[{value, label}]` objects. When non-empty, an items-per-page `<y-select>` renders to the right of the page navigation.",
            table: { defaultValue: { summary: "(none)" } },
        },
        itemsPerPage: {
            name: "items-per-page",
            control: { type: "number", min: 0 },
            description:
                "Currently selected items-per-page value. Must match one of `page-size-options`. `0` leaves it unset (the first option is selected).",
            table: { defaultValue: { summary: "(unset)" } },
        },
        pageSizeLabel: {
            name: "page-size-label",
            control: "text",
            description:
                "Label text shown next to the items-per-page select when `variant=\"detailed\"`. Otherwise applied as the select's `aria-label`.",
            table: { defaultValue: { summary: "Items per page:" } },
        },
    },
    args: {
        currentPage: 5,
        totalPages: 20,
        pageCount: 5,
        boundaryCount: 1,
        variant: "default",
        size: "medium",
        disabled: false,
        hideOnSinglePage: true,
        pageSizeOptions: "",
        itemsPerPage: 0,
        pageSizeLabel: "",
    },
    render: ({
        currentPage,
        totalPages,
        pageCount,
        boundaryCount,
        variant,
        size,
        disabled,
        hideOnSinglePage,
        pageSizeOptions,
        itemsPerPage,
        pageSizeLabel,
    }) => `
        <div style="${wrapStyle}">
            <y-paginator
                current-page="${currentPage}"
                total-pages="${totalPages}"
                page-count="${pageCount}"
                boundary-count="${boundaryCount}"
                variant="${variant}"
                size="${size}"
                ${disabled ? "disabled" : ""}
                ${hideOnSinglePage ? "" : 'hide-on-single-page="false"'}
                ${pageSizeOptions ? `page-size-options='${pageSizeOptions}'` : ""}
                ${itemsPerPage ? `items-per-page="${itemsPerPage}"` : ""}
                ${pageSizeLabel ? `page-size-label="${pageSizeLabel}"` : ""}
            ></y-paginator>
        </div>
    `,
};

export const Default = {};

export const NearStart = {
    name: "Current near start",
    args: { currentPage: 2, totalPages: 30 },
};

export const NearEnd = {
    name: "Current near end",
    args: { currentPage: 29, totalPages: 30 },
};

export const FewPages = {
    name: "Fits without ellipsis",
    args: { currentPage: 3, totalPages: 7 },
};

export const Detailed = {
    name: "Detailed (prev/next labels)",
    args: { variant: "detailed", currentPage: 4, totalPages: 12 },
};

export const Compact = {
    args: { variant: "compact", size: "small", currentPage: 6, totalPages: 50 },
};

export const ItemsPerPage = {
    name: "Items per page (controls demo)",
    args: {
        totalPages: 50,
        currentPage: 1,
        pageSizeOptions: "[10, 25, 50, 100]",
        itemsPerPage: 25,
    },
    parameters: {
        docs: {
            description: {
                story:
                    "Tweak `page-size-options`, `items-per-page`, and `page-size-label` in the controls panel. Switch `variant` to `detailed` to see the visible label render alongside the select.",
            },
        },
    },
};

export const Disabled = {
    args: { disabled: true, currentPage: 4, totalPages: 12 },
};

export const Sizes = {
    render: () => `
        <div style="${wrapStyle}; display: flex; flex-direction: column; gap: 24px;">
            <div>
                <h4 style="margin:0 0 8px">Small</h4>
                <y-paginator size="small" total-pages="20" current-page="5"></y-paginator>
            </div>
            <div>
                <h4 style="margin:0 0 8px">Medium (default)</h4>
                <y-paginator size="medium" total-pages="20" current-page="5"></y-paginator>
            </div>
            <div>
                <h4 style="margin:0 0 8px">Large</h4>
                <y-paginator size="large" total-pages="20" current-page="5"></y-paginator>
            </div>
        </div>
    `,
};

export const HigherBoundary = {
    name: "Boundary count = 2",
    args: { boundaryCount: 2, currentPage: 25, totalPages: 50 },
};

export const SinglePageVisible = {
    name: "Single page (hide-on-single-page=false)",
    args: { totalPages: 1, currentPage: 1, hideOnSinglePage: false },
};

export const Interactive = {
    name: "Interactive (page-change event)",
    render: () => `
        <div style="${wrapStyle}">
            <p id="paginator-status" style="margin:0 0 16px; font-family: var(--font-family-body, sans-serif)">
                Showing page <strong>1</strong> of 25.
            </p>
            <y-paginator id="interactive-paginator" total-pages="25" current-page="1"></y-paginator>
            <script>
                (function () {
                    const el = document.getElementById('interactive-paginator');
                    const status = document.getElementById('paginator-status');
                    el.addEventListener('page-change', (e) => {
                        status.innerHTML = 'Showing page <strong>' + e.detail.page + '</strong> of 25.';
                    });
                })();
            </script>
        </div>
    `,
};

export const WithItemsPerPage = {
    name: "With items-per-page select",
    render: () => `
        <div style="${wrapStyle}">
            <p id="iperpage-status" style="margin:0 0 16px; font-family: var(--font-family-body, sans-serif)">
                Page <strong>1</strong> · <strong>10</strong> per page
            </p>
            <y-paginator
                id="iperpage-paginator"
                total-pages="50"
                current-page="1"
                items-per-page="10"
                page-size-options="[10, 25, 50, 100]"
            ></y-paginator>
            <script>
                (function () {
                    const el = document.getElementById('iperpage-paginator');
                    const status = document.getElementById('iperpage-status');
                    const fmt = () =>
                        'Page <strong>' + el.currentPage + '</strong> · <strong>' +
                        (el.itemsPerPage || 10) + '</strong> per page';
                    el.addEventListener('page-change', () => { status.innerHTML = fmt(); });
                    el.addEventListener('page-size-change', () => {
                        // Reset to page 1 when page size changes — common pattern
                        el.currentPage = 1;
                        setTimeout(() => { status.innerHTML = fmt(); }, 0);
                    });
                })();
            </script>
        </div>
    `,
};

export const PageSizeOnly = {
    name: "Page-size select with no rows",
    render: () => `
        <div style="${wrapStyle}">
            <y-paginator
                total-pages="0"
                page-size-options="[10, 25, 50]"
            ></y-paginator>
        </div>
    `,
};
