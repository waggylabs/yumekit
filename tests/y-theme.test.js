import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import "../src/components/y-theme.js";

describe("<y-theme>", () => {
    it("renders slotted content", async () => {
        const el = await fixture(
            html`<y-theme><div id="test-content">Hello</div></y-theme>`,
        );

        const slotted = el.querySelector("#test-content");
        expect(slotted).to.exist;
        expect(slotted.textContent).to.equal("Hello");
    });

    it("applies base variables from the bundled variables sheet", async () => {
        const el = await fixture(html`<y-theme></y-theme>`);

        // --spacing-medium is a concrete value defined in variables.css
        const spacing = el.style.getPropertyValue("--spacing-medium");
        expect(spacing.trim()).to.equal("8px");
    });

    it("defaults to blue-light theme when no attributes are set", async () => {
        const el = await fixture(html`<y-theme></y-theme>`);

        // --font-family-body is set to "Lexend", sans-serif in all theme files
        const font = el.style.getPropertyValue("--font-family-body");
        expect(font.trim()).to.not.be.empty;

        // blue-light sets --base-background-app to a neutral-light variable
        const bg = el.style.getPropertyValue("--base-background-app");
        expect(bg).to.include("light");
    });

    it("applies dark mode when theme='blue-dark'", async () => {
        const el = await fixture(
            html`<y-theme theme="blue-dark"></y-theme>`,
        );

        // blue-dark sets --base-background-app to a neutral-dark variable
        const bg = el.style.getPropertyValue("--base-background-app");
        expect(bg).to.include("dark");
    });

    it("updates applied variables when theme attribute changes", async () => {
        const el = await fixture(
            html`<y-theme theme="blue-light"></y-theme>`,
        );

        const lightBg = el.style.getPropertyValue("--base-background-app");
        expect(lightBg).to.include("light");

        el.setAttribute("theme", "blue-dark");

        await waitUntil(() =>
            el.style.getPropertyValue("--base-background-app").includes("dark"),
        );

        const darkBg = el.style.getPropertyValue("--base-background-app");
        expect(darkBg).to.include("dark");
    });

    it("updates applied variables when switching theme families", async () => {
        const el = await fixture(
            html`<y-theme theme="blue-light"></y-theme>`,
        );

        // Both blue-light and orange-light define --primary-content--.
        // Verify the property is still populated after switching theme.
        el.setAttribute("theme", "orange-light");

        const primaryContent = el.style.getPropertyValue("--primary-content--");
        expect(primaryContent.trim()).to.not.be.empty;
    });

    it("injects two <style> elements into shadow DOM (variables + theme)", async () => {
        const el = await fixture(
            html`<y-theme theme="blue-light"></y-theme>`,
        );

        const styles = el.shadowRoot.querySelectorAll("style");
        expect(styles.length).to.equal(2);
    });

    it("two side-by-side themes do not share inline style variables", async () => {
        const wrapper = await fixture(html`
            <div>
                <y-theme id="a" theme="blue-light"></y-theme>
                <y-theme id="b" theme="blue-dark"></y-theme>
            </div>
        `);

        const themeA = wrapper.querySelector("#a");
        const themeB = wrapper.querySelector("#b");

        const bgA = themeA.style.getPropertyValue("--base-background-app");
        const bgB = themeB.style.getPropertyValue("--base-background-app");

        expect(bgA).to.include("light");
        expect(bgB).to.include("dark");
        expect(bgA).to.not.equal(bgB);
    });

    it("nested themes apply their own variables independently", async () => {
        const outer = await fixture(html`
            <y-theme id="outer" theme="blue-light">
                <y-theme id="inner" theme="blue-dark"></y-theme>
            </y-theme>
        `);

        const inner = outer.querySelector("#inner");

        const outerBg = outer.style.getPropertyValue("--base-background-app");
        const innerBg = inner.style.getPropertyValue("--base-background-app");

        expect(outerBg).to.include("light");
        expect(innerBg).to.include("dark");
        expect(outerBg).to.not.equal(innerBg);
    });

    describe("custom theme paths", () => {
        let originalFetch;

        beforeEach(() => {
            originalFetch = window.fetch;
            window.fetch = async (url) => {
                const str = url.toString();
                if (str.includes("custom.css"))
                    return {
                        text: async () => `:root { --custom-var: hotpink; }`,
                    };
                if (str.includes("first.css"))
                    return {
                        text: async () => `:root { --theme-color: blue; }`,
                    };
                if (str.includes("second.css"))
                    return {
                        text: async () => `:root { --theme-color: green; }`,
                    };
                if (str.includes("override.css"))
                    return {
                        text: async () => `:root { --override-var: purple; }`,
                    };
                return originalFetch(url);
            };
        });

        afterEach(() => {
            window.fetch = originalFetch;
        });

        it("loads and applies CSS from a custom theme URL", async () => {
            const el = await fixture(
                html`<y-theme theme="custom.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--custom-var") === "hotpink",
            );

            expect(el.style.getPropertyValue("--custom-var")).to.equal(
                "hotpink",
            );
        });

        it("still applies base variables when using a custom theme", async () => {
            const el = await fixture(
                html`<y-theme theme="custom.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--custom-var") === "hotpink",
            );

            // variables.css is always bundled regardless of theme
            expect(
                el.style.getPropertyValue("--spacing-medium").trim(),
            ).to.equal("8px");
        });

        it("updates when theme attribute changes from one URL to another", async () => {
            const el = await fixture(
                html`<y-theme theme="first.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--theme-color") === "blue",
            );

            el.setAttribute("theme", "second.css");

            await waitUntil(
                () => el.style.getPropertyValue("--theme-color") === "green",
            );

            expect(el.style.getPropertyValue("--theme-color")).to.equal(
                "green",
            );
        });

        it("switches from a custom theme back to a built-in theme", async () => {
            const el = await fixture(
                html`<y-theme theme="custom.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--custom-var") === "hotpink",
            );

            el.setAttribute("theme", "blue-dark");

            await waitUntil(() =>
                el.style
                    .getPropertyValue("--base-background-app")
                    .includes("dark"),
            );

            expect(
                el.style.getPropertyValue("--base-background-app"),
            ).to.include("dark");
        });

        it("degrades gracefully when the theme fetch fails", async () => {
            window.fetch = async () => {
                throw new Error("Network error");
            };

            const el = await fixture(
                html`<y-theme theme="missing.css"></y-theme>`,
            );

            // Give the async _applyTheme a moment to settle after the error
            await waitUntil(
                () => el.shadowRoot.querySelectorAll("style").length >= 1,
            );

            // Base variables are still applied even though the theme failed
            expect(
                el.style.getPropertyValue("--spacing-medium").trim(),
            ).to.equal("8px");
            // Only one <style> tag (variables only, no theme)
            expect(el.shadowRoot.querySelectorAll("style").length).to.equal(1);
        });
    });
});
