// Browser smoke test for the built per-component bundles in dist/. Deep-
// imports the built files (not src/) the way a consumer of
// `@waggylabs/yumekit/components/*` would, proving the externalized module
// graph resolves in a real browser and that all bundles share the single
// icon registry. Runs via `npm run test:dist` after a build — it is
// deliberately excluded from the `src/**` glob of the regular suite.
import { expect } from "@open-wc/testing";

import "../dist/components/y-table.js";
import "../dist/components/y-data-grid.js";
import "../dist/components/y-button.js";
import "../dist/components/y-money.js";
import { registerIcon, getIcon } from "../dist/icons/registry.js";
import { formatMoney } from "../dist/modules/money.js";

describe("dist deep imports", () => {
    it("registers the custom elements", () => {
        expect(customElements.get("y-table")).to.exist;
        expect(customElements.get("y-data-grid")).to.exist;
        expect(customElements.get("y-button")).to.exist;
        // Pulled in as externalized siblings, not inlined copies
        expect(customElements.get("y-skeleton")).to.exist;
        expect(customElements.get("y-icon")).to.exist;
    });

    it("renders skeleton rows from the shared skeleton-rows module", async () => {
        const el = document.createElement("y-table");
        el.setAttribute("loading", "");
        el.setAttribute("skeleton-rows", "3");
        el.columns = [
            { key: "a", label: "A" },
            { key: "b", label: "B" },
        ];
        document.body.appendChild(el);
        await new Promise((r) => requestAnimationFrame(r));

        const skeletons = el.shadowRoot.querySelectorAll("y-skeleton");
        expect(skeletons.length).to.be.greaterThan(0);
        el.remove();
    });

    it("shares one icon registry across bundles", async () => {
        registerIcon(
            "dist-smoke-icon",
            "<svg viewBox='0 0 24 24'><path d='M0 0h24v24H0z'/></svg>",
        );
        expect(getIcon("dist-smoke-icon")).to.be.a("string");

        const icon = document.createElement("y-icon");
        icon.setAttribute("name", "dist-smoke-icon");
        document.body.appendChild(icon);
        await new Promise((r) => requestAnimationFrame(r));

        // If y-icon carried a private inlined registry, the icon registered
        // above would be invisible to it and no svg would render.
        expect(icon.shadowRoot.querySelector("svg")).to.exist;
        icon.remove();
    });

    it("formats money the same way from the module and from y-money", async () => {
        const el = document.createElement("y-money");
        el.setAttribute("locale", "en-US");
        el.setAttribute("value", "1234.56");
        document.body.appendChild(el);
        await new Promise((r) => requestAnimationFrame(r));

        // A separate copy of the module inlined into the element bundle would
        // still agree here, so also assert the module resolves on its own.
        expect(formatMoney(123456, { locale: "en-US" })).to.equal("$1,234.56");
        expect(el.formattedValue).to.equal("$1,234.56");
        el.remove();
    });
});
