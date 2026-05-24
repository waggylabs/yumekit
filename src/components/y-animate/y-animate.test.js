import { html, fixture, expect, aTimeout, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-animate.js";

const flushFrame = () => new Promise((r) => requestAnimationFrame(r));

describe("YumeAnimate", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => sandbox.restore());

    // ── Initialization ────────────────────────────────────────
    it("renders shadow structure with a content part and a slot", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual"></y-animate>`,
        );
        expect(el.shadowRoot.querySelector("[part='content']")).to.exist;
        expect(el.shadowRoot.querySelector("slot")).to.exist;
    });

    // ── Defaults / attribute parsing ──────────────────────────
    it("defaults animation to fade", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual"></y-animate>`,
        );
        expect(el.animation).to.equal("fade");
    });

    it("falls back to fade for an unknown animation", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" animation="bogus"></y-animate>`,
        );
        expect(el.animation).to.equal("fade");
    });

    it("falls back to up for an unknown direction", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" direction="diag"></y-animate>`,
        );
        expect(el.direction).to.equal("up");
    });

    it("falls back to load for an unknown trigger", async () => {
        const el = await fixture(
            html`<y-animate trigger="bogus"></y-animate>`,
        );
        expect(el.trigger).to.equal("load");
    });

    it("falls back to default duration for non-numeric input", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="not-a-number"></y-animate>`,
        );
        expect(el.duration).to.equal(300);
    });

    it("falls back to 0 for non-numeric delay", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" delay="abc"></y-animate>`,
        );
        expect(el.delay).to.equal(0);
    });

    it("duration reads --component-animate-duration when the attribute is unset", async () => {
        const el = await fixture(html`
            <div style="--component-animate-duration: 750">
                <y-animate trigger="manual"></y-animate>
            </div>
        `);
        const animate = el.querySelector("y-animate");
        expect(animate.duration).to.equal(750);
    });

    it("staggerDelay reads --component-animate-stagger-delay when the attribute is unset", async () => {
        const el = await fixture(html`
            <div style="--component-animate-stagger-delay: 120">
                <y-animate trigger="manual"></y-animate>
            </div>
        `);
        const animate = el.querySelector("y-animate");
        expect(animate.staggerDelay).to.equal(120);
    });

    it("once defaults to true and is opt-out via once='false'", async () => {
        const a = await fixture(
            html`<y-animate trigger="manual"></y-animate>`,
        );
        const b = await fixture(
            html`<y-animate trigger="manual" once="false"></y-animate>`,
        );
        expect(a.once).to.equal(true);
        expect(b.once).to.equal(false);
    });

    // ── play() / events ───────────────────────────────────────
    it("play() emits animation-start synchronously", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="20"></y-animate>`,
        );
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        el.play();
        expect(spy).to.have.been.calledOnce;
        expect(spy.firstCall.args[0].detail.animation).to.equal("fade");
        expect(spy.firstCall.args[0].detail.element).to.equal(el);
    });

    it("play() emits animation-end after the animation completes", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="10"></y-animate>`,
        );
        const endPromise = oneEvent(el, "animation-end");
        el.play();
        const evt = await endPromise;
        expect(evt.detail.animation).to.equal("fade");
        expect(evt.detail.element).to.equal(el);
    });

    // ── Trigger=load ──────────────────────────────────────────
    it("trigger=load auto-plays without a manual play() call", async () => {
        // Auto-play schedules a WAAPI animation via requestAnimationFrame in
        // connectedCallback. A sufficiently long duration keeps it running
        // past fixture()'s frame wait, so we can still observe its lifecycle
        // events through the public API.
        const el = await fixture(
            html`<y-animate duration="500"></y-animate>`,
        );
        const evt = await oneEvent(el, "animation-end");
        expect(evt.detail.animation).to.equal("fade");
        expect(evt.detail.element).to.equal(el);
    });

    // ── Trigger=manual ────────────────────────────────────────
    it("trigger=manual does not auto-play", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="10"></y-animate>`,
        );
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        await flushFrame();
        await flushFrame();
        expect(spy).to.not.have.been.called;
    });

    // ── Trigger=visible ───────────────────────────────────────
    it("trigger=visible installs an IntersectionObserver", async () => {
        const observe = sandbox.spy();
        const disconnect = sandbox.spy();
        class FakeIO {
            constructor(cb) {
                this._cb = cb;
            }
            observe(...args) {
                observe(...args);
            }
            disconnect() {
                disconnect();
            }
            unobserve() {}
            takeRecords() {
                return [];
            }
        }
        const original = window.IntersectionObserver;
        window.IntersectionObserver = FakeIO;
        try {
            await fixture(
                html`<y-animate trigger="visible" duration="10"></y-animate>`,
            );
            await aTimeout(0);
            expect(observe).to.have.been.called;
        } finally {
            window.IntersectionObserver = original;
        }
    });

    it("trigger=visible plays once and detaches the observer when intersecting", async () => {
        let savedCb = null;
        const disconnect = sandbox.spy();
        class FakeIO {
            constructor(cb) {
                savedCb = cb;
            }
            observe() {}
            disconnect() {
                disconnect();
            }
            unobserve() {}
            takeRecords() {
                return [];
            }
        }
        const original = window.IntersectionObserver;
        window.IntersectionObserver = FakeIO;
        try {
            const el = await fixture(
                html`<y-animate trigger="visible" duration="10"></y-animate>`,
            );
            const startSpy = sandbox.spy();
            el.addEventListener("animation-start", startSpy);
            savedCb([{ isIntersecting: true, target: el }]);
            expect(startSpy).to.have.been.calledOnce;
            expect(disconnect).to.have.been.called;
        } finally {
            window.IntersectionObserver = original;
        }
    });

    // ── Disabled / Hidden ─────────────────────────────────────
    it("disabled blocks play()", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" disabled duration="10"></y-animate>`,
        );
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        el.play();
        expect(spy).to.not.have.been.called;
    });

    it("hidden blocks play()", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" hidden duration="10"></y-animate>`,
        );
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        el.play();
        expect(spy).to.not.have.been.called;
    });

    // ── once / reset ──────────────────────────────────────────
    it("once=true (default) blocks subsequent play() calls", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="10"></y-animate>`,
        );
        await el.play();
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        await el.play();
        expect(spy).to.not.have.been.called;
    });

    it("once='false' allows the animation to replay", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" once="false" duration="10"></y-animate>`,
        );
        await el.play();
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        await el.play();
        expect(spy).to.have.been.called;
    });

    it("reset() lets a once=true animation replay", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="10"></y-animate>`,
        );
        await el.play();
        el.reset();
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        await el.play();
        expect(spy).to.have.been.called;
    });

    // ── abort() ──────────────────────────────────────────────
    it("abort() cancels active animation and emits animation-cancel", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="2000"></y-animate>`,
        );
        const cancelSpy = sandbox.spy();
        el.addEventListener("animation-cancel", cancelSpy);
        el.play();
        el.abort();
        expect(cancelSpy).to.have.been.calledOnce;
        expect(cancelSpy.firstCall.args[0].detail.animation).to.equal("fade");
    });

    // ── setAnimation() ────────────────────────────────────────
    it("setAnimation() updates the animation, duration, and easing attributes", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual"></y-animate>`,
        );
        el.setAnimation("zoom-in", 500, "ease-in");
        expect(el.getAttribute("animation")).to.equal("zoom-in");
        expect(el.getAttribute("duration")).to.equal("500");
        expect(el.getAttribute("easing")).to.equal("ease-in");
    });

    // ── Stagger ──────────────────────────────────────────────
    it("stagger animates each direct child individually", async () => {
        const el = await fixture(html`
            <y-animate trigger="manual" stagger duration="20">
                <div>1</div>
                <div>2</div>
                <div>3</div>
            </y-animate>
        `);
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        el.play();
        expect(spy).to.have.been.calledThrice;
        const elements = spy.getCalls().map((c) => c.args[0].detail.element);
        expect(elements).to.deep.equal(Array.from(el.children));
    });

    it("non-stagger animates the host element", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="10"
                ><span>x</span></y-animate
            >`,
        );
        const spy = sandbox.spy();
        el.addEventListener("animation-start", spy);
        el.play();
        expect(spy.firstCall.args[0].detail.element).to.equal(el);
    });

    // ── Reverse ──────────────────────────────────────────────
    it("reverse passes direction='reverse' to the underlying animation", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" reverse duration="50"></y-animate>`,
        );
        el.play();
        const animations = el.getAnimations();
        expect(animations.length).to.be.greaterThan(0);
        expect(animations[0].effect.getTiming().direction).to.equal("reverse");
    });

    // ── prefers-reduced-motion ───────────────────────────────
    it("prefers-reduced-motion skips playback but still emits start+end", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="10"></y-animate>`,
        );
        sandbox.stub(el, "_prefersReducedMotion").returns(true);
        const startSpy = sandbox.spy();
        const endSpy = sandbox.spy();
        el.addEventListener("animation-start", startSpy);
        el.addEventListener("animation-end", endSpy);
        await el.play();
        expect(startSpy).to.have.been.called;
        expect(endSpy).to.have.been.called;
        expect(el.getAnimations()).to.have.lengthOf(0);
    });

    // ── Hidden / disabled mid-flight ─────────────────────────
    it("setting hidden mid-animation cancels and emits animation-cancel", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="2000"></y-animate>`,
        );
        el.play();
        expect(el.getAnimations()).to.have.lengthOf(1);
        const cancelSpy = sandbox.spy();
        el.addEventListener("animation-cancel", cancelSpy);
        el.setAttribute("hidden", "");
        expect(el.getAnimations()).to.have.lengthOf(0);
        expect(cancelSpy).to.have.been.calledOnce;
        expect(cancelSpy.firstCall.args[0].detail.animation).to.equal("fade");
    });

    it("setting disabled mid-animation cancels and emits animation-cancel", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual" duration="2000"></y-animate>`,
        );
        el.play();
        expect(el.getAnimations()).to.have.lengthOf(1);
        const cancelSpy = sandbox.spy();
        el.addEventListener("animation-cancel", cancelSpy);
        el.setAttribute("disabled", "");
        expect(el.getAnimations()).to.have.lengthOf(0);
        expect(cancelSpy).to.have.been.calledOnce;
    });

    // ── Setters round-trip ───────────────────────────────────
    it("setters round-trip via attributes", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual"></y-animate>`,
        );
        el.animation = "scale";
        el.duration = 250;
        el.delay = 100;
        el.easing = "ease-in-out";
        el.direction = "left";
        el.staggerDelay = 75;
        expect(el.getAttribute("animation")).to.equal("scale");
        expect(el.getAttribute("duration")).to.equal("250");
        expect(el.getAttribute("delay")).to.equal("100");
        expect(el.getAttribute("easing")).to.equal("ease-in-out");
        expect(el.getAttribute("direction")).to.equal("left");
        expect(el.getAttribute("stagger-delay")).to.equal("75");
    });

    // ── Boolean setters ──────────────────────────────────────
    it("boolean setters reflect through attribute presence", async () => {
        const el = await fixture(
            html`<y-animate trigger="manual"></y-animate>`,
        );
        el.disabled = true;
        el.reverse = true;
        el.stagger = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        expect(el.hasAttribute("reverse")).to.be.true;
        expect(el.hasAttribute("stagger")).to.be.true;
        el.disabled = false;
        el.reverse = false;
        el.stagger = false;
        expect(el.hasAttribute("disabled")).to.be.false;
        expect(el.hasAttribute("reverse")).to.be.false;
        expect(el.hasAttribute("stagger")).to.be.false;
    });
});
