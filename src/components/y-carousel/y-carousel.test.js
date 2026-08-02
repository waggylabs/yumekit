import { fixture, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-carousel.js";

const slides = (n) =>
    Array.from({ length: n }, (_, i) => `<div>Slide ${i + 1}</div>`).join("");

const make = (attrs = "", n = 3) =>
    fixture(`<y-carousel ${attrs}>${slides(n)}</y-carousel>`);

describe("<y-carousel>", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    describe("rendering", () => {
        it("renders a viewport region, track, arrows, and pagination", async () => {
            const el = await make();
            const track = el.shadowRoot.querySelector(".track");
            expect(track.getAttribute("role")).to.equal("region");
            expect(track.getAttribute("aria-roledescription")).to.equal(
                "carousel",
            );
            expect(el.shadowRoot.querySelector(".arrow--prev")).to.exist;
            expect(el.shadowRoot.querySelector(".arrow--next")).to.exist;
            expect(el.shadowRoot.querySelector(".pagination")).to.exist;
        });

        it("applies sensible defaults", async () => {
            const el = await make();
            expect(el.perView).to.equal(1);
            expect(el.arrows).to.equal("true");
            expect(el.pagination).to.equal("dots");
            expect(el.snap).to.equal("start");
            expect(el.orientation).to.equal("horizontal");
            expect(el.swipe).to.be.true;
            expect(el.pauseOnHover).to.be.true;
        });

        it("renders one dot per slide", async () => {
            const el = await make("", 4);
            expect(el.shadowRoot.querySelectorAll(".dot").length).to.equal(4);
        });

        it("renders a fraction indicator when pagination='fraction'", async () => {
            const el = await make('pagination="fraction"', 3);
            const fraction = el.shadowRoot.querySelector(".fraction");
            expect(fraction).to.exist;
            expect(fraction.textContent).to.equal("1 / 3");
        });

        it("gives each slide a full-width flex-basis with a unit (default gap)", async () => {
            const el = await make("", 3);
            const slide = el.children[0];
            const basis = getComputedStyle(slide).flexBasis;
            // A broken calc() (unitless gap) collapses to "auto" and slides shrink.
            expect(basis).to.not.equal("auto");
            expect(el._resolveGap()).to.equal("0px");
        });

        it("normalizes a unitless gap to px but leaves lengths alone", async () => {
            const el = await make('gap="16"');
            expect(el._resolveGap()).to.equal("16px");
            el.gap = "1rem";
            expect(el._resolveGap()).to.equal("1rem");
        });

        it("hides pagination when pagination='none'", async () => {
            const el = await make('pagination="none"');
            expect(el.shadowRoot.querySelector(".dot")).to.not.exist;
            expect(
                el.shadowRoot.querySelector(".pagination").style.display,
            ).to.equal("none");
        });
    });

    describe("slide setup and accessibility", () => {
        it("labels each slide as a group with position", async () => {
            const el = await make("", 3);
            const [first] = el.children;
            expect(first.getAttribute("role")).to.equal("group");
            expect(first.getAttribute("aria-roledescription")).to.equal("slide");
            expect(first.getAttribute("aria-label")).to.equal("1 of 3");
        });

        it("marks off-screen slides inert and aria-hidden", async () => {
            const el = await make("", 3);
            const [a, b, c] = el.children;
            expect(a.hasAttribute("inert")).to.be.false;
            expect(b.hasAttribute("inert")).to.be.true;
            expect(c.getAttribute("aria-hidden")).to.equal("true");
        });

        it("keeps per-view slides visible", async () => {
            const el = await make('per-view="2"', 3);
            const [a, b, c] = el.children;
            expect(a.hasAttribute("inert")).to.be.false;
            expect(b.hasAttribute("inert")).to.be.false;
            expect(c.hasAttribute("inert")).to.be.true;
        });

        it("recomputes on slotchange", async () => {
            const el = await make("", 2);
            expect(el.shadowRoot.querySelectorAll(".dot").length).to.equal(2);
            el.appendChild(document.createElement("div"));
            await new Promise((r) => setTimeout(r, 0));
            expect(el.shadowRoot.querySelectorAll(".dot").length).to.equal(3);
        });
    });

    describe("navigation", () => {
        it("next() advances one page of per-view slides", async () => {
            const el = await make('per-view="2"', 6);
            const spy = sandbox.stub(el, "_scrollToSlide");
            el.next();
            expect(spy.firstCall.args[0]).to.equal(2);
        });

        it("next() clamps to the last reachable index", async () => {
            const el = await make("", 3);
            const spy = sandbox.stub(el, "_scrollToSlide");
            el._index = 1;
            el.next();
            expect(spy.firstCall.args[0]).to.equal(2);
        });

        it("goTo() clamps out-of-range values without loop", async () => {
            const el = await make("", 3);
            const spy = sandbox.stub(el, "_scrollToSlide");
            el.goTo(99);
            expect(spy.firstCall.args[0]).to.equal(2);
        });

        it("goTo() wraps negative values when loop is on", async () => {
            const el = await make("loop", 3);
            const spy = sandbox.stub(el, "_scrollToSlide");
            el.goTo(-1);
            expect(spy.firstCall.args[0]).to.equal(2);
        });

        it("previous() wraps to the end when loop is on", async () => {
            const el = await make("loop", 3);
            const spy = sandbox.stub(el, "_scrollToSlide");
            el.previous();
            expect(spy.firstCall.args[0]).to.equal(2);
        });

        it("disables prev/next arrows at the ends without loop", async () => {
            const el = await make("", 3);
            expect(el.shadowRoot.querySelector(".arrow--prev").disabled).to.be
                .true;
            expect(el.shadowRoot.querySelector(".arrow--next").disabled).to.be
                .false;
        });

        it("never disables arrows when loop is on", async () => {
            const el = await make("loop", 3);
            expect(el.shadowRoot.querySelector(".arrow--prev").disabled).to.be
                .false;
        });

        it("uses left/right chevrons horizontally", async () => {
            const el = await make("", 3);
            const icon = el.shadowRoot
                .querySelector(".arrow--next")
                .querySelector("y-icon");
            expect(icon.getAttribute("name")).to.equal("chevron-right");
        });

        it("uses up/down chevrons in vertical orientation", async () => {
            const el = await make('orientation="vertical"', 3);
            const prev = el.shadowRoot
                .querySelector(".arrow--prev")
                .querySelector("y-icon");
            const next = el.shadowRoot
                .querySelector(".arrow--next")
                .querySelector("y-icon");
            expect(prev.getAttribute("name")).to.equal("chevron-up");
            expect(next.getAttribute("name")).to.equal("chevron-down");
        });
    });

    describe("change event", () => {
        it("emits change with index and previousIndex after settle", async () => {
            const el = await make("", 3);
            sandbox.stub(el, "_deriveIndex").returns(2);
            setTimeout(() => el._settle());
            const e = await oneEvent(el, "change");
            expect(e.detail.index).to.equal(2);
            expect(e.detail.previousIndex).to.equal(0);
            expect(el.index).to.equal(2);
            expect(el.getAttribute("index")).to.equal("2");
        });

        it("does not emit when the index is unchanged", async () => {
            const el = await make("", 3);
            const handler = sandbox.spy();
            el.addEventListener("change", handler);
            sandbox.stub(el, "_deriveIndex").returns(0);
            el._settle();
            expect(handler.called).to.be.false;
        });
    });

    describe("keyboard", () => {
        it("ArrowRight advances, ArrowLeft goes back (horizontal)", async () => {
            const el = await make("", 3);
            const next = sandbox.stub(el, "next");
            const prev = sandbox.stub(el, "previous");
            const track = el.shadowRoot.querySelector(".track");
            track.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowRight" }),
            );
            track.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowLeft" }),
            );
            expect(next.calledOnce).to.be.true;
            expect(prev.calledOnce).to.be.true;
        });

        it("Home and End jump to the first and last slide", async () => {
            const el = await make("", 4);
            const goTo = sandbox.stub(el, "goTo");
            const track = el.shadowRoot.querySelector(".track");
            track.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
            track.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
            expect(goTo.firstCall.args[0]).to.equal(0);
            expect(goTo.secondCall.args[0]).to.equal(3);
        });
    });

    describe("autoplay", () => {
        it("play() and pause() toggle the timer", async () => {
            const el = await make("autoplay interval=\"1000\"", 3);
            expect(el._autoplayTimer).to.not.be.null;
            el.pause();
            expect(el._autoplayTimer).to.be.null;
            el.play();
            expect(el._autoplayTimer).to.not.be.null;
        });

        it("does not autoplay without the autoplay attribute", async () => {
            const el = await make("", 3);
            el.play();
            expect(el._autoplayTimer).to.be.null;
        });

        it("does not accumulate host listeners across re-renders", async () => {
            const el = await make("", 3);
            // Attribute changes call render() -> _wireEvents() repeatedly.
            el.setAttribute("gap", "8px");
            el.setAttribute("per-view", "2");
            el.setAttribute("snap", "center");

            const spy = sandbox.spy(el, "_syncAutoplay");
            el.dispatchEvent(new Event("pointerenter"));
            expect(spy.callCount).to.equal(1);
            expect(el._hovered).to.be.true;
        });
    });
});
