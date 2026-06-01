import { expect } from "@open-wc/testing";
import { registerIcon, registerIcons, getIcon, getIconNames } from "./registry.js";

describe("icon registry", () => {
    it("registers and retrieves a single icon", () => {
        registerIcon("test-single", "<svg></svg>");
        expect(getIcon("test-single")).to.equal("<svg></svg>");
    });

    it("registers many icons at once", () => {
        registerIcons({ "test-a": "<svg>a</svg>", "test-b": "<svg>b</svg>" });
        expect(getIcon("test-a")).to.equal("<svg>a</svg>");
        expect(getIcon("test-b")).to.equal("<svg>b</svg>");
    });

    it("returns an empty string for an unknown name", () => {
        expect(getIcon("does-not-exist")).to.equal("");
    });

    it("getIconNames lists every registered name", () => {
        registerIcon("test-name", "<svg></svg>");
        const names = getIconNames();
        expect(names).to.be.an("array");
        expect(names).to.include("test-name");
    });
});
