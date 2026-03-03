import { fixture, html, expect, waitUntil } from "@open-wc/testing";
import { YumeTheme } from "../src/components/y-theme.js";
import "../src/components/y-theme.js";

describe("<y-theme>", () => {
    it("loads and applies default CSS variables via link tag", async () => {
        const el = await fixture(html`<y-theme></y-theme>`);

        // The load-defaults module should have injected a <link> into <head>
        const link = document.getElementById("yumekit-default-variables");
        expect(link).to.exist;
        expect(link.rel).to.equal("stylesheet");
        expect(link.href).to.include("styles/variables.css");
    });

    it("applies variables from theme path", async () => {
        // Create a mock CSS file response using fetch interception
        const mockThemeCSS = `:root { --custom-color: red; }`;

        const originalFetch = window.fetch;
        window.fetch = async (url) => {
            if (url.includes("test-theme.css")) {
                return { text: async () => mockThemeCSS };
            }
            return originalFetch(url);
        };

        const el = await fixture(
            html`<y-theme theme-path="test-theme.css"></y-theme>`,
        );

        await waitUntil(
            () => el.style.getPropertyValue("--custom-color") === "red",
        );

        const appliedVar = el.style.getPropertyValue("--custom-color");
        expect(appliedVar).to.equal("red");

        window.fetch = originalFetch;
    });

    it("updates when theme-path changes", async () => {
        const mockFirst = `:root { --theme-color: blue; }`;
        const mockSecond = `:root { --theme-color: green; }`;

        const originalFetch = window.fetch;
        window.fetch = async (url) => {
            if (url.includes("first.css")) {
                return { text: async () => mockFirst };
            }
            if (url.includes("second.css")) {
                return { text: async () => mockSecond };
            }
            return originalFetch(url);
        };

        const el = await fixture(
            html`<y-theme theme-path="first.css"></y-theme>`,
        );
        await waitUntil(
            () => el.style.getPropertyValue("--theme-color") === "blue",
        );

        el.setAttribute("theme-path", "second.css");

        await waitUntil(
            () => el.style.getPropertyValue("--theme-color") === "green",
        );

        window.fetch = originalFetch;
    });

    it("renders slotted content", async () => {
        const el = await fixture(
            html`<y-theme><div id="test-content">Hello</div></y-theme>`,
        );

        const slotted = el.querySelector("#test-content");
        expect(slotted).to.exist;
        expect(slotted.textContent).to.equal("Hello");
    });

    it("applies different themes side-by-side without interference", async () => {
        const originalFetch = window.fetch;
        window.fetch = async (url) => {
            if (url.includes("theme-a.css")) {
                return { text: async () => `:root { --color-a: red; }` };
            }
            if (url.includes("theme-b.css")) {
                return { text: async () => `:root { --color-b: blue; }` };
            }
            return originalFetch(url);
        };

        const wrapper = await fixture(html`
            <div>
                <y-theme id="a" theme-path="theme-a.css"></y-theme>
                <y-theme id="b" theme-path="theme-b.css"></y-theme>
            </div>
        `);

        const themeA = wrapper.querySelector("#a");
        const themeB = wrapper.querySelector("#b");

        await waitUntil(
            () => themeA.style.getPropertyValue("--color-a") === "red",
        );
        await waitUntil(
            () => themeB.style.getPropertyValue("--color-b") === "blue",
        );

        expect(themeA.style.getPropertyValue("--color-a")).to.equal("red");
        expect(themeB.style.getPropertyValue("--color-b")).to.equal("blue");

        expect(themeA.style.getPropertyValue("--color-b")).to.not.equal("blue");
        expect(themeB.style.getPropertyValue("--color-a")).to.not.equal("red");

        window.fetch = originalFetch;
    });

    it("applies nested themes independently", async () => {
        const originalFetch = window.fetch;
        window.fetch = async (url) => {
            if (url.includes("outer.css")) {
                return {
                    text: async () => `:root { --theme-depth: shallow; }`,
                };
            }
            if (url.includes("inner.css")) {
                return { text: async () => `:root { --theme-depth: deep; }` };
            }
            return originalFetch(url);
        };

        const el = await fixture(html`
            <y-theme id="outer" theme-path="outer.css">
                <y-theme id="inner" theme-path="inner.css"></y-theme>
            </y-theme>
        `);

        const outer = el;
        const inner = el.querySelector("#inner");

        await waitUntil(
            () => outer.style.getPropertyValue("--theme-depth") === "shallow",
        );
        await waitUntil(
            () => inner.style.getPropertyValue("--theme-depth") === "deep",
        );

        expect(outer.style.getPropertyValue("--theme-depth")).to.equal(
            "shallow",
        );
        expect(inner.style.getPropertyValue("--theme-depth")).to.equal("deep");

        window.fetch = originalFetch;
    });
});
