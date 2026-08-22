import { expect, fixture, html } from "@open-wc/testing";
import {
    computePosition,
    candidateSides,
    containingBlockOffset,
    containingBlockRect,
    parsePosition,
    pointerOffsetFor,
} from "./floating.js";

function rect(top, left, width, height) {
    return {
        top,
        left,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
    };
}

const VIEWPORT = { width: 1000, height: 800 };

describe("floating: parsePosition", () => {
    it("returns the requested side + alignment", () => {
        expect(parsePosition("top")).to.deep.equal({
            side: "top",
            align: "center",
            auto: false,
        });
        expect(parsePosition("bottom-start")).to.deep.equal({
            side: "bottom",
            align: "start",
            auto: false,
        });
        expect(parsePosition("right-end")).to.deep.equal({
            side: "right",
            align: "end",
            auto: false,
        });
    });

    it("marks the auto flag for 'auto'", () => {
        const result = parsePosition("auto");
        expect(result.auto).to.equal(true);
    });

    it("falls back when given garbage", () => {
        expect(parsePosition("nope")).to.deep.include({
            side: "bottom",
            align: "center",
            auto: false,
        });
        expect(parsePosition("top-zigzag")).to.deep.include({
            side: "top",
            align: "center",
        });
    });
});

describe("floating: candidateSides", () => {
    it("returns the global fallback order for auto", () => {
        expect(candidateSides("bottom", true)).to.deep.equal([
            "bottom",
            "top",
            "right",
            "left",
        ]);
    });

    it("tries requested → opposite → perpendiculars for a specific side", () => {
        expect(candidateSides("top", false)).to.deep.equal([
            "top",
            "bottom",
            "right",
            "left",
        ]);
        expect(candidateSides("left", false)).to.deep.equal([
            "left",
            "right",
            "bottom",
            "top",
        ]);
    });
});

describe("floating: computePosition flip cascade", () => {
    const size = { width: 200, height: 100 };

    it("returns the requested side when it fits", () => {
        const anchor = rect(400, 400, 80, 32);
        const result = computePosition(anchor, size, {
            position: "bottom",
            viewport: VIEWPORT,
        });
        expect(result.side).to.equal("bottom");
        expect(result.fits).to.equal(true);
    });

    it("flips bottom → top when there is no room below", () => {
        // Anchor near the bottom edge.
        const anchor = rect(VIEWPORT.height - 40, 400, 80, 32);
        const result = computePosition(anchor, size, {
            position: "bottom",
            viewport: VIEWPORT,
        });
        expect(result.side).to.equal("top");
        expect(result.fits).to.equal(true);
    });

    it("flips top → bottom when there is no room above", () => {
        const anchor = rect(4, 400, 80, 32);
        const result = computePosition(anchor, size, {
            position: "top",
            viewport: VIEWPORT,
        });
        expect(result.side).to.equal("bottom");
        expect(result.fits).to.equal(true);
    });

    it("falls through to perpendicular sides when neither main side fits", () => {
        // Anchor wedged where neither top nor bottom can hold a 100-tall popover.
        const tallSize = { width: 80, height: 400 };
        // 200px above and 200px below the anchor center; neither holds 400.
        const anchor = rect(VIEWPORT.height / 2 - 16, 400, 80, 32);
        const result = computePosition(anchor, tallSize, {
            position: "bottom",
            viewport: VIEWPORT,
        });
        // Right has plenty of horizontal room next to the anchor.
        expect(["right", "left"]).to.include(result.side);
        expect(result.fits).to.equal(true);
    });

    it("returns best-fit with fits=false when nothing fits", () => {
        const huge = { width: VIEWPORT.width + 100, height: VIEWPORT.height + 100 };
        const anchor = rect(400, 400, 80, 32);
        const result = computePosition(anchor, huge, {
            position: "bottom",
            viewport: VIEWPORT,
        });
        expect(result.fits).to.equal(false);
        expect(["top", "bottom", "left", "right"]).to.include(result.side);
    });

    it("preserves alignment through a main-axis flip", () => {
        const anchor = rect(VIEWPORT.height - 40, 400, 200, 32);
        const result = computePosition(anchor, size, {
            position: "bottom-start",
            viewport: VIEWPORT,
        });
        expect(result.side).to.equal("top");
        expect(result.align).to.equal("start");
        // start alignment keeps the floating element's left edge with the
        // anchor's left edge.
        expect(Math.abs(result.left - anchor.left)).to.be.lessThan(1.5);
    });
});

describe("floating: pointerOffsetFor", () => {
    it("centers the pointer under the anchor on a bottom placement", () => {
        const anchor = rect(100, 200, 80, 32);
        const size = { width: 200, height: 100 };
        const placement = { top: 140, left: 140 };
        const { axis, offset } = pointerOffsetFor("bottom", anchor, placement, size, 10);
        expect(axis).to.equal("x");
        // anchor center x = 240; placement.left = 140; pointer half = 5.
        // offset = 240 - 140 - 5 = 95 (within bounds).
        expect(offset).to.equal(95);
    });

    it("clamps the pointer so it cannot leave the floating edge", () => {
        const anchor = rect(100, 5000, 80, 32);
        const size = { width: 200, height: 100 };
        const placement = { top: 140, left: 0 };
        const { offset } = pointerOffsetFor("bottom", anchor, placement, size, 10);
        // anchor center is way past the right edge; clamped to width-pointer-half.
        expect(offset).to.equal(200 - 10 - 5);
    });
});

describe("containingBlockOffset", () => {
    it("returns the origin when no ancestor establishes a containing block", async () => {
        const host = await fixture(html`<div><span></span></div>`);
        expect(containingBlockOffset(host.firstElementChild)).to.deep.equal({
            x: 0,
            y: 0,
        });
    });

    it("finds a transformed ancestor and reports its viewport corner", async () => {
        const host = await fixture(html`
            <div style="position:absolute;top:120px;left:60px;transform:translateZ(0)">
                <span></span>
            </div>
        `);
        const offset = containingBlockOffset(host.firstElementChild);
        const box = host.getBoundingClientRect();
        expect(Math.round(offset.x)).to.equal(Math.round(box.left));
        expect(Math.round(offset.y)).to.equal(Math.round(box.top));
    });

    it("treats an identity transform as a containing block", async () => {
        // Storybook's docs preview wraps stories in exactly this.
        const host = await fixture(html`
            <div style="position:absolute;top:80px;left:40px;transform:matrix(1,0,0,1,0,0)">
                <span></span>
            </div>
        `);
        expect(containingBlockOffset(host.firstElementChild).y).to.be.closeTo(
            host.getBoundingClientRect().top,
            1,
        );
    });

    it("crosses shadow boundaries to find a transformed ancestor in the light DOM", async () => {
        // The regression: a floating surface living inside a component's shadow
        // root must still see a transformed wrapper outside it. `parentElement`
        // returns null at the shadow root, which silently reported (0, 0).
        const host = await fixture(html`
            <div style="position:absolute;top:150px;left:70px;transform:translateZ(0)">
                <div id="shadow-host"></div>
            </div>
        `);
        const inner = host.querySelector("#shadow-host");
        const root = inner.attachShadow({ mode: "open" });
        const deep = document.createElement("span");
        root.appendChild(deep);

        const offset = containingBlockOffset(deep);
        const box = host.getBoundingClientRect();
        expect(Math.round(offset.x)).to.equal(Math.round(box.left));
        expect(Math.round(offset.y)).to.equal(Math.round(box.top));
    });

    it("crosses several nested shadow roots", async () => {
        const host = await fixture(html`
            <div style="position:absolute;top:200px;left:90px;filter:blur(0px)">
                <div id="outer-host"></div>
            </div>
        `);
        const outer = host.querySelector("#outer-host");
        const outerRoot = outer.attachShadow({ mode: "open" });
        const middle = document.createElement("div");
        outerRoot.appendChild(middle);
        const middleRoot = middle.attachShadow({ mode: "open" });
        const deep = document.createElement("span");
        middleRoot.appendChild(deep);

        expect(containingBlockOffset(deep).y).to.be.closeTo(
            host.getBoundingClientRect().top,
            1,
        );
    });

    it("stops at the nearest containing block, not the outermost", async () => {
        const host = await fixture(html`
            <div style="position:absolute;top:40px;left:20px;transform:translateZ(0)">
                <div
                    id="near"
                    style="position:absolute;top:60px;left:30px;transform:translateZ(0)"
                >
                    <span></span>
                </div>
            </div>
        `);
        const near = host.querySelector("#near");
        const offset = containingBlockOffset(near.firstElementChild);
        expect(Math.round(offset.y)).to.equal(
            Math.round(near.getBoundingClientRect().top),
        );
    });
});

describe("containingBlockRect", () => {
    it("falls back to the viewport box when no ancestor establishes one", async () => {
        const host = await fixture(html`<div><span></span></div>`);
        const box = containingBlockRect(host.firstElementChild);
        expect(box.left).to.equal(0);
        expect(box.top).to.equal(0);
        expect(box.right).to.equal(window.innerWidth);
        expect(box.bottom).to.equal(window.innerHeight);
    });

    it("reports the far edges of a transformed ancestor, not the viewport's", async () => {
        const host = await fixture(html`
            <div style="position:absolute;top:100px;left:50px;width:200px;height:80px;transform:translateZ(0)">
                <span></span>
            </div>
        `);
        const box = containingBlockRect(host.firstElementChild);
        const rect = host.getBoundingClientRect();
        expect(box.right).to.be.closeTo(rect.right, 1);
        expect(box.bottom).to.be.closeTo(rect.bottom, 1);
        expect(box.bottom).to.not.be.closeTo(window.innerHeight, 1);
    });
});
