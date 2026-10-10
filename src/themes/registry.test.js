import { expect } from "@open-wc/testing";
import {
    DEFAULT_FONT,
    configureThemes,
    getTheme,
    getThemeFont,
    getThemeNames,
    getThemePolicy,
    hasTheme,
    isThemeAllowed,
    registerTheme,
    registerThemes,
} from "./registry.js";

/** Restores the shipped theme policy so one test's config can't leak. */
function resetThemePolicy() {
    configureThemes({
        allow: null,
        fallback: "blue-light",
        allowUrls: false,
        allowCrossOriginUrls: false,
    });
}

describe("theme registry", () => {
    beforeEach(resetThemePolicy);
    afterEach(resetThemePolicy);

    describe("registerTheme", () => {
        it("stores CSS retrievable by name", () => {
            registerTheme("reg-basic", ":root { --x: 1px; }");

            expect(getTheme("reg-basic")).to.equal(":root { --x: 1px; }");
        });

        it("returns an empty string for an unregistered name", () => {
            expect(getTheme("reg-never-registered")).to.equal("");
        });

        it("reports registration via hasTheme", () => {
            registerTheme("reg-has", ":root {}");

            expect(hasTheme("reg-has")).to.be.true;
            expect(hasTheme("reg-has-not")).to.be.false;
        });

        it("overwrites a name that is already registered", () => {
            registerTheme("reg-dupe", ":root { --v: first; }");
            registerTheme("reg-dupe", ":root { --v: second; }");

            expect(getTheme("reg-dupe")).to.equal(":root { --v: second; }");
        });

        it("does not duplicate an overwritten name in getThemeNames", () => {
            registerTheme("reg-dupe-names", ":root {}");
            const before = getThemeNames().filter(
                (n) => n === "reg-dupe-names",
            ).length;
            registerTheme("reg-dupe-names", ":root { --v: 2; }");
            const after = getThemeNames().filter(
                (n) => n === "reg-dupe-names",
            ).length;

            expect(before).to.equal(1);
            expect(after).to.equal(1);
        });
    });

    describe("font resolution", () => {
        it("defaults to the shared font query when no font is given", () => {
            registerTheme("font-default", ":root {}");

            expect(getThemeFont("font-default")).to.equal(DEFAULT_FONT);
        });

        it("stores an explicit font query", () => {
            registerTheme("font-explicit", ":root {}", { font: "Inter:wght@400" });

            expect(getThemeFont("font-explicit")).to.equal("Inter:wght@400");
        });

        it("preserves an explicit null for system-font themes", () => {
            registerTheme("font-system", ":root {}", { font: null });

            expect(getThemeFont("font-system")).to.equal(null);
        });

        it("falls back to the default font for an unregistered name", () => {
            expect(getThemeFont("font-unknown")).to.equal(DEFAULT_FONT);
        });
    });

    describe("registerThemes", () => {
        it("accepts a plain name-to-CSS map", () => {
            registerThemes({
                "bulk-a": ":root { --a: 1; }",
                "bulk-b": ":root { --b: 2; }",
            });

            expect(getTheme("bulk-a")).to.equal(":root { --a: 1; }");
            expect(getTheme("bulk-b")).to.equal(":root { --b: 2; }");
        });

        it("accepts entry objects carrying their own font", () => {
            registerThemes({
                "bulk-font": { css: ":root {}", font: "Roboto:wght@400" },
                "bulk-system": { css: ":root {}", font: null },
            });

            expect(getThemeFont("bulk-font")).to.equal("Roboto:wght@400");
            expect(getThemeFont("bulk-system")).to.equal(null);
        });

        it("gives string entries the default font", () => {
            registerThemes({ "bulk-plain": ":root {}" });

            expect(getThemeFont("bulk-plain")).to.equal(DEFAULT_FONT);
        });
    });

    describe("getThemeNames", () => {
        it("returns names in registration order", () => {
            registerTheme("order-first", ":root {}");
            registerTheme("order-second", ":root {}");
            registerTheme("order-third", ":root {}");

            const names = getThemeNames().filter((n) =>
                n.startsWith("order-"),
            );

            expect(names.join(",")).to.equal(
                "order-first,order-second,order-third",
            );
        });

        it("keeps the original position when a name is re-registered", () => {
            registerTheme("pos-a", ":root {}");
            registerTheme("pos-b", ":root {}");
            registerTheme("pos-a", ":root { --v: 2; }");

            const names = getThemeNames().filter((n) => n.startsWith("pos-"));

            expect(names.join(",")).to.equal("pos-a,pos-b");
        });
    });

    describe("configureThemes", () => {
        it("ships fail-closed defaults", () => {
            const policy = getThemePolicy();

            expect(policy.allow).to.equal(null);
            expect(policy.fallback).to.equal("blue-light");
            expect(policy.allowUrls).to.be.false;
            expect(policy.allowCrossOriginUrls).to.be.false;
        });

        it("merges over the previous config, leaving omitted keys alone", () => {
            configureThemes({ allowUrls: true });
            configureThemes({ fallback: "waggy" });

            const policy = getThemePolicy();

            expect(policy.allowUrls).to.be.true;
            expect(policy.fallback).to.equal("waggy");
            expect(policy.allowCrossOriginUrls).to.be.false;
        });

        it("ignores unknown keys", () => {
            configureThemes({ notARealOption: true });

            expect("notARealOption" in getThemePolicy()).to.be.false;
        });

        it("returns a copy that cannot mutate the live policy", () => {
            configureThemes({ allow: ["blue-light"] });

            const policy = getThemePolicy();
            policy.allowUrls = true;
            policy.allow.push("waggy");

            expect(getThemePolicy().allowUrls).to.be.false;
            expect(getThemePolicy().allow.join(",")).to.equal("blue-light");
        });

        it("copies the allow list so a caller cannot widen it later", () => {
            const allow = ["blue-light"];
            configureThemes({ allow });
            allow.push("waggy");

            expect(getThemePolicy().allow.join(",")).to.equal("blue-light");
        });
    });

    describe("isThemeAllowed", () => {
        it("permits any registered theme when allow is null", () => {
            registerTheme("allow-any", ":root {}");

            expect(isThemeAllowed("allow-any")).to.be.true;
        });

        it("rejects an unregistered theme even when allow is null", () => {
            expect(isThemeAllowed("allow-missing")).to.be.false;
        });

        it("rejects a registered theme outside the allow list", () => {
            registerTheme("allow-yes", ":root {}");
            registerTheme("allow-no", ":root {}");
            configureThemes({ allow: ["allow-yes"] });

            expect(isThemeAllowed("allow-yes")).to.be.true;
            expect(isThemeAllowed("allow-no")).to.be.false;
        });

        it("rejects an allow-listed name that was never registered", () => {
            configureThemes({ allow: ["allow-phantom"] });

            expect(isThemeAllowed("allow-phantom")).to.be.false;
        });

        it("rejects everything when allow is empty", () => {
            registerTheme("allow-empty", ":root {}");
            configureThemes({ allow: [] });

            expect(isThemeAllowed("allow-empty")).to.be.false;
        });
    });
});
