import { fixture, expect, html } from "@open-wc/testing";
import "./y-avatar.js";

// 1x1 transparent GIF — a valid image source so tests that need the <img> to
// stay rendered are not knocked into the initials-fallback branch by a 404.
const VALID_IMG = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

describe("YumeAvatar", () => {
    it("renders an img when src is provided", async () => {
        const el = await fixture(
            html`<y-avatar src=${VALID_IMG} alt="User"></y-avatar>`,
        );

        const img = el.shadowRoot.querySelector("img");
        expect(img).to.exist;
        expect(img.getAttribute("src")).to.equal(VALID_IMG);
        expect(img.getAttribute("alt")).to.equal("User");
        expect(img.getAttribute("part")).to.equal("avatar");
    });

    it("renders initials from a two-word alt when no src is provided", async () => {
        const el = await fixture(
            html`<y-avatar alt="John Doe"></y-avatar>`,
        );

        const h5 = el.shadowRoot.querySelector("h5");
        expect(h5).to.exist;
        expect(h5.textContent).to.equal("JD");
    });

    it("renders first two characters of a single-word alt", async () => {
        const el = await fixture(html`<y-avatar alt="Alex"></y-avatar>`);

        const h5 = el.shadowRoot.querySelector("h5");
        expect(h5.textContent).to.equal("Al");
    });

    it("falls back to 'AN' initials when no alt is provided", async () => {
        const el = await fixture(html`<y-avatar></y-avatar>`);

        const h5 = el.shadowRoot.querySelector("h5");
        expect(h5.textContent).to.equal("AN");
    });

    it("renders a div.avatar with part=avatar when no src", async () => {
        const el = await fixture(html`<y-avatar alt="Test User"></y-avatar>`);

        const avatar = el.shadowRoot.querySelector(".avatar");
        expect(avatar).to.exist;
        expect(avatar.getAttribute("part")).to.equal("avatar");
    });

    it("re-renders as img when src attribute is added", async () => {
        const el = await fixture(html`<y-avatar alt="Jane Doe"></y-avatar>`);

        expect(el.shadowRoot.querySelector(".avatar")).to.exist;

        el.setAttribute("src", VALID_IMG);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("img")).to.exist;
        expect(el.shadowRoot.querySelector(".avatar")).to.not.exist;
    });

    it("re-renders as initials when src attribute is removed", async () => {
        const el = await fixture(
            html`<y-avatar src=${VALID_IMG} alt="Jane Doe"></y-avatar>`,
        );

        expect(el.shadowRoot.querySelector("img")).to.exist;

        el.removeAttribute("src");
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector(".avatar")).to.exist;
        expect(el.shadowRoot.querySelector("img")).to.not.exist;
    });

    it("applies circle border-radius by default", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-border-radius-circle");
    });

    it("applies square border-radius when shape=square", async () => {
        const el = await fixture(
            html`<y-avatar alt="AB" shape="square"></y-avatar>`,
        );

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-border-radius-square");
    });

    it("applies rounded border-radius when shape=rounded", async () => {
        const el = await fixture(
            html`<y-avatar alt="AB" shape="rounded"></y-avatar>`,
        );

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-border-radius-rounded");
    });

    it("applies small size variable when size=small", async () => {
        const el = await fixture(
            html`<y-avatar alt="AB" size="small"></y-avatar>`,
        );

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-size-small");
    });

    it("applies large size variable when size=large", async () => {
        const el = await fixture(
            html`<y-avatar alt="AB" size="large"></y-avatar>`,
        );

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-size-large");
    });

    it("applies primary color variables by default", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--primary-content--");
    });

    it("applies correct color variables when color attribute changes", async () => {
        const el = await fixture(
            html`<y-avatar alt="AB" color="success"></y-avatar>`,
        );

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--success-content--");
    });

    it("sets size attribute via the size setter", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-size-large");
    });

    it("sets shape attribute via the shape setter", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);
        el.shape = "square";
        expect(el.getAttribute("shape")).to.equal("square");

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--component-avatar-border-radius-square");
    });

    it("sets color attribute via the color setter", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);
        el.color = "error";
        expect(el.getAttribute("color")).to.equal("error");

        const sheet = el.shadowRoot.adoptedStyleSheets[0];
        const cssText = [...sheet.cssRules].map((r) => r.cssText).join(" ");
        expect(cssText).to.include("--error-content--");
    });

    it("sets alt attribute via the alt setter", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);
        el.alt = "Jane Doe";
        expect(el.getAttribute("alt")).to.equal("Jane Doe");

        const h5 = el.shadowRoot.querySelector("h5");
        expect(h5.textContent).to.equal("JD");
    });

    it("sets src via the src setter and renders an img", async () => {
        const el = await fixture(html`<y-avatar alt="AB"></y-avatar>`);
        el.src = VALID_IMG;
        expect(el.getAttribute("src")).to.equal(VALID_IMG);
        expect(el.shadowRoot.querySelector("img")).to.exist;
    });

    it("falls back to initials when the image fails to load", async () => {
        const el = await fixture(
            html`<y-avatar src="/img/does-not-exist.png" alt="Jane Doe"></y-avatar>`,
        );
        // Give the natural error event a tick to fire after the 404.
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("img")).to.not.exist;
        const h5 = el.shadowRoot.querySelector("h5");
        expect(h5).to.exist;
        expect(h5.textContent).to.equal("JD");
    });

    it("re-attempts the image after src changes following a failure", async () => {
        const el = await fixture(html`<y-avatar alt="Jane Doe"></y-avatar>`);

        // Force a failure on a first src.
        el.src = "/img/does-not-exist.png";
        const failingImg = el.shadowRoot.querySelector("img");
        failingImg.dispatchEvent(new Event("error"));
        expect(el.shadowRoot.querySelector(".avatar")).to.exist;

        // A new src should clear the failure flag and render the image again.
        el.setAttribute("src", VALID_IMG);
        await new Promise((r) => setTimeout(r, 0));

        expect(el.shadowRoot.querySelector("img")).to.exist;
        expect(el.shadowRoot.querySelector(".avatar")).to.not.exist;
    });

    it("removes src attribute when src setter is called with a falsy value", async () => {
        const el = await fixture(
            html`<y-avatar src=${VALID_IMG} alt="AB"></y-avatar>`,
        );
        el.src = null;
        expect(el.hasAttribute("src")).to.be.false;
        expect(el.shadowRoot.querySelector(".avatar")).to.exist;
    });

    describe("XSS hardening", () => {
        it("does not allow attribute breakout via src", async () => {
            const hostile = `" onerror="window.__xssAvatarSrc=true" x="`;
            const el = await fixture(
                html`<y-avatar src=${hostile} alt="X"></y-avatar>`,
            );
            // Hostile src is an invalid URL so it triggers the fallback; either
            // way, no `onerror` attribute should ever appear in the shadow root
            // and the inline handler must not execute.
            await new Promise((r) => setTimeout(r, 0));
            expect(el.shadowRoot.querySelector("[onerror]")).to.be.null;
            expect(window.__xssAvatarSrc).to.be.undefined;
        });

        it("does not allow attribute breakout via alt", async () => {
            const hostile = `" onload="window.__xssAvatarAlt=true" x="`;
            const el = await fixture(
                html`<y-avatar src=${VALID_IMG} alt=${hostile}></y-avatar>`,
            );

            const img = el.shadowRoot.querySelector("img");
            expect(img).to.exist;
            expect(img.getAttribute("alt")).to.equal(hostile);
            expect(img.hasAttribute("onload")).to.be.false;
            expect(el.shadowRoot.querySelector("[onload]")).to.be.null;
            expect(window.__xssAvatarAlt).to.be.undefined;
        });

        it("renders hostile alt as text in the initials fallback", async () => {
            const hostile = `<img src=x onerror="window.__xssAvatarInitials=true">`;
            const el = await fixture(html`<y-avatar alt=${hostile}></y-avatar>`);

            // No injected <img> should be present in the initials branch
            expect(el.shadowRoot.querySelector("img")).to.be.null;
            expect(el.shadowRoot.querySelector("[onerror]")).to.be.null;
            expect(window.__xssAvatarInitials).to.be.undefined;
        });
    });
});
