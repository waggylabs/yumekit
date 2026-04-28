import { expect, aTimeout } from "@open-wc/testing";
import sinon from "sinon";
import "./y-splitter.js";

const flushFrame = () => new Promise((r) => requestAnimationFrame(r));

function fakePointerEvent(type, opts = {}) {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(e, {
        pointerId: 1,
        button: 0,
        pointerType: "mouse",
        clientX: 0,
        clientY: 0,
        ...opts,
    });
    return e;
}

function getHandle(el) {
    return el.shadowRoot.querySelector(".handle");
}

describe("YumeSplitter", () => {
    let sandbox;
    let mounted = [];

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
        for (const node of mounted) node.remove();
        mounted = [];
    });

    async function mkSplitter(attrs = "", innerHTML = "") {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "width:400px;height:200px";
        wrapper.innerHTML = `
            <y-splitter ${attrs}>
                ${innerHTML || `<div>One</div><div>Two</div>`}
            </y-splitter>
        `;
        document.body.appendChild(wrapper);
        mounted.push(wrapper);
        await aTimeout(0);
        return wrapper.querySelector("y-splitter");
    }

    // ── Defaults ─────────────────────────────────────────────────────────
    it("renders shadow structure with two pane slots and a handle", async () => {
        const el = await mkSplitter();
        expect(el.shadowRoot.querySelector(".pane-1")).to.exist;
        expect(el.shadowRoot.querySelector(".pane-2")).to.exist;
        expect(el.shadowRoot.querySelector(".handle")).to.exist;
        expect(el.shadowRoot.querySelector('slot[name="pane-1"]')).to.exist;
        expect(el.shadowRoot.querySelector('slot[name="pane-2"]')).to.exist;
        expect(el.shadowRoot.querySelector('slot[name="handle"]')).to.exist;
    });

    it("sets role=group on the host", async () => {
        const el = await mkSplitter();
        expect(el.getAttribute("role")).to.equal("group");
    });

    it("defaults split to 0.5", async () => {
        const el = await mkSplitter();
        expect(el.split).to.equal(0.5);
    });

    it("defaults orientation to horizontal", async () => {
        const el = await mkSplitter();
        expect(el.orientation).to.equal("horizontal");
    });

    it("falls back to horizontal for an unknown orientation", async () => {
        const el = await mkSplitter('orientation="diagonal"');
        expect(el.orientation).to.equal("horizontal");
    });

    // ── Slot assignment ─────────────────────────────────────────────────
    it("auto-assigns the first child to pane-1 and the second to pane-2", async () => {
        const el = await mkSplitter(
            "",
            `<div id="a">A</div><div id="b">B</div>`,
        );
        expect(el.querySelector("#a").getAttribute("slot")).to.equal("pane-1");
        expect(el.querySelector("#b").getAttribute("slot")).to.equal("pane-2");
    });

    it("ignores extra children beyond the first two panes (warning)", async () => {
        const warn = sandbox.stub(console, "warn");
        await mkSplitter("", `<div>A</div><div>B</div><div id="extra">C</div>`);
        expect(warn.called).to.be.true;
    });

    it("does not reassign children that already have slot=handle", async () => {
        const el = await mkSplitter(
            "",
            `<div id="a">A</div><span slot="handle">H</span><div id="b">B</div>`,
        );
        expect(el.querySelector("#a").getAttribute("slot")).to.equal("pane-1");
        expect(el.querySelector("#b").getAttribute("slot")).to.equal("pane-2");
        expect(el.querySelector('[slot="handle"]')).to.exist;
    });

    it("reassigns slots when children are added later", async () => {
        const el = await mkSplitter("", `<div id="a">A</div>`);
        const newChild = document.createElement("div");
        newChild.id = "b";
        el.appendChild(newChild);
        await aTimeout(0);
        expect(newChild.getAttribute("slot")).to.equal("pane-2");
    });

    // ── Split ratio ─────────────────────────────────────────────────────
    it("reads the split attribute on connect", async () => {
        const el = await mkSplitter('split="0.3"');
        expect(el.split).to.be.closeTo(0.3, 1e-6);
    });

    it("clamps split into the [min-ratio, max-ratio] range", async () => {
        const el = await mkSplitter(
            'split="0.05" min-ratio="0.2" max-ratio="0.8"',
        );
        expect(el.split).to.equal(0.2);
    });

    it("setter mirrors to the attribute and clamps", async () => {
        const el = await mkSplitter('min-ratio="0.2" max-ratio="0.8"');
        el.split = 0.95;
        expect(parseFloat(el.getAttribute("split"))).to.equal(0.8);
        expect(el.split).to.equal(0.8);
    });

    it("ignores non-numeric split values via setter", async () => {
        const el = await mkSplitter();
        el.split = "not a number";
        expect(el.split).to.equal(0.5);
    });

    it("emits split-changed when the attribute changes", async () => {
        const el = await mkSplitter();
        const events = [];
        el.addEventListener("split-changed", (e) => events.push(e.detail));
        el.setAttribute("split", "0.7");
        expect(events).to.have.length(1);
        expect(events[0].split).to.be.closeTo(0.7, 1e-6);
        expect(events[0].orientation).to.equal("horizontal");
    });

    it("re-clamps the current split when min-ratio shifts above it", async () => {
        const el = await mkSplitter('split="0.2"');
        const events = [];
        el.addEventListener("split-changed", (e) => events.push(e.detail));
        el.setAttribute("min-ratio", "0.4");
        expect(el.split).to.equal(0.4);
        expect(events).to.have.length(1);
    });

    // ── Pointer drag ────────────────────────────────────────────────────
    it("emits split-start on pointerdown and split-end on pointerup", async () => {
        const el = await mkSplitter();
        const handle = getHandle(el);
        const startSpy = sandbox.spy();
        const endSpy = sandbox.spy();
        el.addEventListener("split-start", startSpy);
        el.addEventListener("split-end", endSpy);

        handle.dispatchEvent(
            fakePointerEvent("pointerdown", { clientX: 200, clientY: 100 }),
        );
        handle.dispatchEvent(
            fakePointerEvent("pointerup", { clientX: 200, clientY: 100 }),
        );
        expect(startSpy.calledOnce).to.be.true;
        expect(endSpy.calledOnce).to.be.true;
    });

    it("updates split on pointermove (rAF-throttled)", async () => {
        const el = await mkSplitter('split="0.5"');
        const handle = getHandle(el);
        // Force a known container width for deterministic math.
        sandbox.stub(el, "_containerRect").returns({ width: 400, height: 200 });

        handle.dispatchEvent(
            fakePointerEvent("pointerdown", { clientX: 200, clientY: 100 }),
        );
        handle.dispatchEvent(
            fakePointerEvent("pointermove", { clientX: 280, clientY: 100 }),
        );
        await flushFrame();
        // delta = 80px / (400 - 10 handle) ≈ 0.2051
        expect(el.split).to.be.closeTo(0.5 + 80 / 390, 1e-3);

        handle.dispatchEvent(
            fakePointerEvent("pointerup", { clientX: 280, clientY: 100 }),
        );
    });

    it("does not start drag when disabled", async () => {
        const el = await mkSplitter("disabled");
        const handle = getHandle(el);
        const spy = sandbox.spy();
        el.addEventListener("split-start", spy);
        handle.dispatchEvent(fakePointerEvent("pointerdown"));
        expect(spy.called).to.be.false;
    });

    // ── Keyboard ────────────────────────────────────────────────────────
    it("ArrowRight increases the split by the keyboard step", async () => {
        const el = await mkSplitter('split="0.5"');
        const handle = getHandle(el);
        handle.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el.split).to.be.closeTo(0.51, 1e-6);
    });

    it("ArrowLeft decreases the split by the keyboard step", async () => {
        const el = await mkSplitter('split="0.5"');
        const handle = getHandle(el);
        handle.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
        expect(el.split).to.be.closeTo(0.49, 1e-6);
    });

    it("PageUp / PageDown step by 10%", async () => {
        const el = await mkSplitter('split="0.5"');
        const handle = getHandle(el);
        handle.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp" }));
        expect(el.split).to.be.closeTo(0.6, 1e-6);
        handle.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" }));
        handle.dispatchEvent(new KeyboardEvent("keydown", { key: "PageDown" }));
        expect(el.split).to.be.closeTo(0.4, 1e-6);
    });

    it("Home jumps to min-ratio and End jumps to max-ratio", async () => {
        const el = await mkSplitter(
            'split="0.5" min-ratio="0.2" max-ratio="0.8"',
        );
        const handle = getHandle(el);
        handle.dispatchEvent(new KeyboardEvent("keydown", { key: "Home" }));
        expect(el.split).to.equal(0.2);
        handle.dispatchEvent(new KeyboardEvent("keydown", { key: "End" }));
        expect(el.split).to.equal(0.8);
    });

    it("ignores keyboard when disabled", async () => {
        const el = await mkSplitter('split="0.5" disabled');
        const handle = getHandle(el);
        handle.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight" }),
        );
        expect(el.split).to.equal(0.5);
    });

    // ── Accessibility ───────────────────────────────────────────────────
    it("handle exposes role=slider with valuemin/max/now/text/orientation", async () => {
        const el = await mkSplitter('split="0.4"');
        const handle = getHandle(el);
        expect(handle.getAttribute("role")).to.equal("slider");
        expect(handle.getAttribute("aria-valuemin")).to.equal("0");
        expect(handle.getAttribute("aria-valuemax")).to.equal("100");
        expect(handle.getAttribute("aria-valuenow")).to.equal("40");
        expect(handle.getAttribute("aria-valuetext")).to.equal("40%");
        expect(handle.getAttribute("aria-orientation")).to.equal("horizontal");
    });

    it("default aria-label is 'Resizable splitter'", async () => {
        const el = await mkSplitter();
        const handle = getHandle(el);
        expect(handle.getAttribute("aria-label")).to.equal(
            "Resizable splitter",
        );
    });

    it("host aria-label overrides the default", async () => {
        const el = await mkSplitter('aria-label="Sidebar resize"');
        const handle = getHandle(el);
        expect(handle.getAttribute("aria-label")).to.equal("Sidebar resize");
    });

    it("disabled removes the handle from the tab order and sets aria-disabled", async () => {
        const el = await mkSplitter("disabled");
        const handle = getHandle(el);
        expect(handle.getAttribute("aria-disabled")).to.equal("true");
        expect(handle.getAttribute("tabindex")).to.equal("-1");
    });

    // ── Touch (PointerEvent already covers it) ──────────────────────────
    it("accepts touch pointer events", async () => {
        const el = await mkSplitter();
        const handle = getHandle(el);
        sandbox.stub(el, "_containerRect").returns({ width: 400, height: 200 });
        const start = sandbox.spy();
        el.addEventListener("split-start", start);
        handle.dispatchEvent(
            fakePointerEvent("pointerdown", {
                pointerType: "touch",
                clientX: 200,
                clientY: 100,
            }),
        );
        expect(start.calledOnce).to.be.true;
        handle.dispatchEvent(
            fakePointerEvent("pointerup", { pointerType: "touch" }),
        );
    });

    // ── CSS parts ───────────────────────────────────────────────────────
    it("exposes container, pane-1, pane-2, handle, grip parts", async () => {
        const el = await mkSplitter();
        expect(el.shadowRoot.querySelector("[part='container']")).to.exist;
        expect(el.shadowRoot.querySelector("[part='pane-1']")).to.exist;
        expect(el.shadowRoot.querySelector("[part='pane-2']")).to.exist;
        expect(el.shadowRoot.querySelector("[part='handle']")).to.exist;
        expect(el.shadowRoot.querySelector("[part='grip']")).to.exist;
    });

    // ── Property/attribute round-trip ───────────────────────────────────
    it("orientation setter updates the attribute, re-renders, and updates aria", async () => {
        const el = await mkSplitter();
        el.orientation = "vertical";
        expect(el.getAttribute("orientation")).to.equal("vertical");

        const handle = getHandle(el);
        expect(handle.getAttribute("aria-orientation")).to.equal("vertical");
    });

    it("disabled setter syncs aria-disabled", async () => {
        const el = await mkSplitter();
        el.disabled = true;
        expect(getHandle(el).getAttribute("aria-disabled")).to.equal("true");
        el.disabled = false;
        expect(getHandle(el).hasAttribute("aria-disabled")).to.be.false;
    });

    // ── Custom handle slot ──────────────────────────────────────────────
    it("custom slotted handle content replaces the default grip icon", async () => {
        const el = await mkSplitter(
            "",
            `<div>A</div><div>B</div><span id="custom" slot="handle">x</span>`,
        );
        const slot = el.shadowRoot.querySelector('slot[name="handle"]');
        const assigned = slot
            .assignedNodes({ flatten: true })
            .filter((n) => n.nodeType === Node.ELEMENT_NODE);
        expect(assigned.length).to.equal(1);
        expect(assigned[0].id).to.equal("custom");
    });
});
