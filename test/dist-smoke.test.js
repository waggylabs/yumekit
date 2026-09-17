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
import "../dist/components/y-theme.js";
import { registerIcon, getIcon } from "../dist/icons/registry.js";
import {
    configureThemes,
    getThemeNames,
    registerTheme,
} from "../dist/themes/registry.js";
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

describe("dist theme registry", () => {
    afterEach(() => {
        configureThemes({
            allow: null,
            fallback: "blue-light",
            allowUrls: false,
            allowCrossOriginUrls: false,
        });
    });

    it("ships y-theme without any bundled theme CSS", () => {
        // dist/components/y-theme.js carries only variables.css; the themes
        // live in dist/themes/all.js. Nothing is registered until asked for.
        expect(getThemeNames().length).to.equal(0);
    });

    it("shares one registry between the component bundle and the registry bundle", async () => {
        // The component build keeps ../themes/registry.js external. If it
        // inlined its own copy instead, this theme would register into a
        // registry y-theme cannot see and the token below would never land.
        registerTheme("dist-smoke-theme", ":root { --dist-smoke: teal; }", {
            font: null,
        });

        const el = document.createElement("y-theme");
        el.setAttribute("theme", "dist-smoke-theme");
        const applied = new Promise((resolve) =>
            el.addEventListener("theme-change", resolve, { once: true }),
        );
        document.body.appendChild(el);
        await applied;

        expect(el.style.getPropertyValue("--dist-smoke")).to.equal("teal");
        el.remove();
    });

    it("registers every bundled theme from dist/themes/all.js", async () => {
        await import("../dist/themes/all.js");

        // Excluding the theme the previous test registered.
        const bundled = getThemeNames().filter(
            (n) => !n.startsWith("dist-smoke"),
        );

        expect(bundled.length).to.equal(60);
        expect(bundled.includes("blue-light")).to.be.true;
    });

    // Last, because importing the root bundle registers every bundled theme
    // and would spoil the counts above.
    it("shares that registry with the root entrypoint too", async () => {
        // The root ESM bundle keeps ../themes/registry.js external for this
        // reason: the documented pairing of registerTheme from
        // "@waggylabs/yumekit" with a deep import of
        // "@waggylabs/yumekit/components/y-theme.js" has to reach one map, or
        // y-theme falls back instead of applying the theme.
        const root = await import("../dist/index.js");

        root.registerTheme("dist-root-theme", ":root { --dist-root: teal; }", {
            font: null,
        });
        expect(getThemeNames().includes("dist-root-theme")).to.be.true;

        const el = document.createElement("y-theme");
        el.setAttribute("theme", "dist-root-theme");
        const applied = new Promise((resolve) =>
            el.addEventListener("theme-change", resolve, { once: true }),
        );
        document.body.appendChild(el);
        await applied;

        expect(el.style.getPropertyValue("--dist-root")).to.equal("teal");
        el.remove();
    });
});
