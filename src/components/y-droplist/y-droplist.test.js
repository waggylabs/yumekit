import { html, fixture, expect, aTimeout, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-droplist.js";

const flushFrame = () => new Promise((r) => requestAnimationFrame(r));

describe("YumeDroplist", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => sandbox.restore());

    // ── Initialization ────────────────────────────────────────
    it("sets role=list on the host", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.getAttribute("role")).to.equal("list");
    });

    it("decorates each direct child with role, tabindex, draggable, aria-grabbed", async () => {
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        for (const child of el.children) {
            expect(child.getAttribute("role")).to.equal("listitem");
            expect(child.getAttribute("tabindex")).to.equal("0");
            expect(child.getAttribute("draggable")).to.equal("true");
            expect(child.getAttribute("aria-grabbed")).to.equal("false");
        }
    });

    it("preserves an existing tabindex on a slotted child", async () => {
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a" tabindex="-1">A</div>
            </y-droplist>
        `);
        expect(el.firstElementChild.getAttribute("tabindex")).to.equal("-1");
    });

    it("auto-initializes children added after connect", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        const child = document.createElement("div");
        child.dataset.id = "new";
        el.appendChild(child);
        await aTimeout(0);
        expect(child.getAttribute("role")).to.equal("listitem");
        expect(child.getAttribute("draggable")).to.equal("true");
    });

    // ── Disabled ──────────────────────────────────────────────
    it("removes draggable and sets aria-disabled when disabled", async () => {
        const el = await fixture(html`
            <y-droplist disabled>
                <div data-id="a">A</div>
            </y-droplist>
        `);
        expect(el.getAttribute("aria-disabled")).to.equal("true");
        expect(el.firstElementChild.hasAttribute("draggable")).to.be.false;
    });

    it("toggles draggable on/off as the disabled attribute changes", async () => {
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a">A</div>
            </y-droplist>
        `);
        el.setAttribute("disabled", "");
        expect(el.firstElementChild.hasAttribute("draggable")).to.be.false;
        el.removeAttribute("disabled");
        expect(el.firstElementChild.getAttribute("draggable")).to.equal("true");
        expect(el.hasAttribute("aria-disabled")).to.be.false;
    });

    // ── toArray / hasItem / contains ──────────────────────────
    it("toArray returns data-id values in DOM order", async () => {
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a">A</div>
                <div data-id="b">B</div>
                <div data-id="c">C</div>
            </y-droplist>
        `);
        expect(el.toArray()).to.deep.equal(["a", "b", "c"]);
    });

    it("toArray returns empty string for items missing data-id", async () => {
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a">A</div>
                <div>plain</div>
            </y-droplist>
        `);
        expect(el.toArray()).to.deep.equal(["a", ""]);
    });

    it("hasItem() returns true only for direct slotted children", async () => {
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a"><span>nested</span></div>
            </y-droplist>
        `);
        const direct = el.firstElementChild;
        const nested = direct.firstElementChild;
        expect(el.hasItem(direct)).to.be.true;
        expect(el.hasItem(nested)).to.be.false;
        expect(el.hasItem(null)).to.be.false;
    });

    it("native contains() is preserved (returns true for nested descendants)", async () => {
        // Regression: an earlier draft overrode Node.prototype.contains with
        // strict direct-child semantics, breaking common patterns like
        // click-outside detection. Native ancestry semantics must be intact.
        const el = await fixture(html`
            <y-droplist>
                <div data-id="a"><span>nested</span></div>
            </y-droplist>
        `);
        const direct = el.firstElementChild;
        const nested = direct.firstElementChild;
        expect(el.contains(direct)).to.be.true;
        expect(el.contains(nested)).to.be.true;
        expect(el.contains(document.body)).to.be.false;
    });

    // ── Keyboard reorder ──────────────────────────────────────
    it("ArrowDown moves a focused item down", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a" tabindex="0">A</div>
                <div data-id="b" tabindex="0">B</div>
                <div data-id="c" tabindex="0">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.focus();
        const reorderPromise = oneEvent(el, "reorder");
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        const reorder = await reorderPromise;
        expect(reorder.detail.oldIndex).to.equal(0);
        expect(reorder.detail.newIndex).to.equal(1);
        expect(el.toArray()).to.deep.equal(["b", "a", "c"]);
        expect(el.shadowRoot.activeElement || document.activeElement).to.exist;
    });

    it("ArrowUp moves a focused item up", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
                <div data-id="c">C</div>
            </y-droplist>
        `);
        const c = el.children[2];
        c.focus();
        c.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
        );
        await aTimeout(0);
        expect(el.toArray()).to.deep.equal(["a", "c", "b"]);
    });

    it("ArrowDown at the last item is a no-op", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const reorderSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        const last = el.children[1];
        last.focus();
        last.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(reorderSpy).to.not.have.been.called;
        expect(el.toArray()).to.deep.equal(["a", "b"]);
    });

    it("fires both reorder and update with matching oldIndex/newIndex", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const reorderSpy = sandbox.spy();
        const updateSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        el.addEventListener("update", updateSpy);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(reorderSpy).to.have.been.calledOnce;
        expect(updateSpy).to.have.been.calledOnce;
        expect(reorderSpy.firstCall.args[0].detail.oldIndex).to.equal(0);
        expect(updateSpy.firstCall.args[0].detail.newIndex).to.equal(1);
    });

    it("vertical=false enables ArrowLeft/ArrowRight and ignores ArrowUp/Down", async () => {
        const el = await fixture(html`
            <y-droplist animation="0" vertical="false">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
                <div data-id="c">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(el.toArray()).to.deep.equal(["a", "b", "c"]);
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
        expect(el.toArray()).to.deep.equal(["b", "a", "c"]);
    });

    it("disabled blocks keyboard reorder", async () => {
        const el = await fixture(html`
            <y-droplist disabled animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(el.toArray()).to.deep.equal(["a", "b"]);
    });

    it("does not fire reorder when the index would not change", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const reorderSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
        );
        expect(reorderSpy).to.not.have.been.called;
    });

    // ── Live region ───────────────────────────────────────────
    it("announces moves via the polite live region", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        await flushFrame();
        const live = el.shadowRoot.querySelector(".sr-live");
        expect(live.getAttribute("aria-live")).to.equal("polite");
        expect(live.textContent).to.contain("position 1");
        expect(live.textContent).to.contain("position 2");
    });

    // ── destroy() ─────────────────────────────────────────────
    it("destroy() makes keyboard reorder inert", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        el.destroy();
        const reorderSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(reorderSpy).to.not.have.been.called;
        expect(el.toArray()).to.deep.equal(["a", "b"]);
    });

    it("re-initializes after disconnect/reconnect", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const parent = el.parentNode;
        el.destroy();
        parent.removeChild(el);
        parent.appendChild(el);
        const a = el.children[0];
        a.focus();
        a.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );
        expect(el.toArray()).to.deep.equal(["b", "a"]);
    });

    // ── Drag pipeline (synthetic) ─────────────────────────────
    it("dragstart marks the item, sets aria-grabbed, and dispatches drag:start", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const startSpy = sandbox.spy();
        el.addEventListener("drag:start", startSpy);

        const dt = typeof DataTransfer === "function" ? new DataTransfer() : null;
        const evt = new DragEvent("dragstart", {
            bubbles: true,
            composed: true,
            dataTransfer: dt,
        });
        a.dispatchEvent(evt);

        expect(a.classList.contains(el.dragClass)).to.be.true;
        expect(a.getAttribute("aria-grabbed")).to.equal("true");
        expect(startSpy).to.have.been.calledOnce;
        expect(startSpy.firstCall.args[0].detail.item).to.equal(a);
    });

    it("dragend clears drag state and fires drag:end", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(new DragEvent("dragstart", { bubbles: true, composed: true }));

        const endSpy = sandbox.spy();
        el.addEventListener("drag:end", endSpy);
        a.dispatchEvent(new DragEvent("dragend", { bubbles: true, composed: true }));

        expect(a.classList.contains(el.dragClass)).to.be.false;
        expect(a.getAttribute("aria-grabbed")).to.equal("false");
        expect(endSpy).to.have.been.calledOnce;
    });

    it("dragstart on a disabled droplist is prevented", async () => {
        const el = await fixture(html`
            <y-droplist disabled animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const startSpy = sandbox.spy();
        el.addEventListener("drag:start", startSpy);
        const evt = new DragEvent("dragstart", { bubbles: true, composed: true, cancelable: true });
        a.dispatchEvent(evt);
        expect(startSpy).to.not.have.been.called;
        expect(evt.defaultPrevented).to.be.true;
    });

    // ── Drop pipeline (regression: dropping over the ghost / gaps) ────
    it("preventDefaults dragover even when the cursor is over the ghost or gap", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a" style="height:40px">A</div>
                <div data-id="b" style="height:40px">B</div>
                <div data-id="c" style="height:40px">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(new DragEvent("dragstart", { bubbles: true, composed: true }));

        // Synthetic dragover with no specific item target (e.g., over the gap).
        const evt = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        el.dispatchEvent(evt);

        expect(evt.defaultPrevented).to.be.true;
        // A ghost should have been placed.
        expect(el.querySelector("[data-y-droplist-ghost]")).to.exist;

        // Now dispatch dragover again with the ghost as target — should still preventDefault.
        const ghost = el.querySelector("[data-y-droplist-ghost]");
        const evt2 = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        ghost.dispatchEvent(evt2);
        expect(evt2.defaultPrevented).to.be.true;

        a.dispatchEvent(new DragEvent("dragend", { bubbles: true, composed: true }));
    });

    it("drop reorders to the projected insertion point and fires reorder/update", async () => {
        const el = await fixture(html`
            <y-droplist animation="0" style="display:block">
                <div data-id="a" style="height:40px;display:block">A</div>
                <div data-id="b" style="height:40px;display:block">B</div>
                <div data-id="c" style="height:40px;display:block">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const c = el.children[2];

        a.dispatchEvent(new DragEvent("dragstart", { bubbles: true, composed: true }));

        // Project past the last item so the ghost lands at the end.
        const cRect = c.getBoundingClientRect();
        const dragover = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
            clientY: cRect.bottom + 5,
            clientX: cRect.left + 5,
        });
        el.dispatchEvent(dragover);

        const reorderSpy = sandbox.spy();
        const updateSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        el.addEventListener("update", updateSpy);

        a.dispatchEvent(new DragEvent("drop", { bubbles: true, composed: true, cancelable: true }));
        a.dispatchEvent(new DragEvent("dragend", { bubbles: true, composed: true }));

        expect(reorderSpy).to.have.been.calledOnce;
        expect(updateSpy).to.have.been.calledOnce;
        expect(reorderSpy.firstCall.args[0].detail.oldIndex).to.equal(0);
        expect(reorderSpy.firstCall.args[0].detail.newIndex).to.equal(2);
        expect(el.toArray()).to.deep.equal(["b", "c", "a"]);
        // Ghost is cleaned up.
        expect(el.querySelector("[data-y-droplist-ghost]")).to.not.exist;
    });

    it("drop without movement (no projected point) is a silent no-op", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const reorderSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);

        a.dispatchEvent(new DragEvent("dragstart", { bubbles: true, composed: true }));
        // No dragover → no ghost.
        a.dispatchEvent(new DragEvent("drop", { bubbles: true, composed: true, cancelable: true }));
        a.dispatchEvent(new DragEvent("dragend", { bubbles: true, composed: true }));

        expect(reorderSpy).to.not.have.been.called;
        expect(el.toArray()).to.deep.equal(["a"]);
    });

    // ── Regression: aria-grabbed survives mid-drag mutations ──
    it("preserves aria-grabbed='true' on the active drag item across mutations", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a" style="height:40px">A</div>
                <div data-id="b" style="height:40px">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(new DragEvent("dragstart", { bubbles: true, composed: true }));
        expect(a.getAttribute("aria-grabbed")).to.equal("true");

        // dragover inserts the ghost into the host's light DOM, which is a
        // childList mutation that re-fires _initializeChildren via the observer.
        el.dispatchEvent(new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        }));
        // Let the MutationObserver microtask flush.
        await aTimeout(0);

        expect(a.getAttribute("aria-grabbed")).to.equal("true");

        // Also verify direct DOM mutation while dragging doesn't clear it.
        const c = document.createElement("div");
        c.dataset.id = "c";
        el.appendChild(c);
        await aTimeout(0);

        expect(a.getAttribute("aria-grabbed")).to.equal("true");
        expect(c.getAttribute("aria-grabbed")).to.equal("false");

        a.dispatchEvent(new DragEvent("dragend", { bubbles: true, composed: true }));
        expect(a.getAttribute("aria-grabbed")).to.equal("false");
    });

    // ── CSS parts ─────────────────────────────────────────────
    it("exposes a `list` part", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.shadowRoot.querySelector("[part='list']")).to.exist;
    });

    // ── Setters ───────────────────────────────────────────────
    it("animation setter accepts numeric values and falls back on garbage", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        el.animation = 300;
        expect(el.animation).to.equal(300);
        el.setAttribute("animation", "not-a-number");
        expect(el.animation).to.equal(150);
    });

    it("ghostClass and dragClass setters round-trip via attributes", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        el.ghostClass = "my-ghost";
        el.dragClass = "my-drag";
        expect(el.getAttribute("ghost-class")).to.equal("my-ghost");
        expect(el.getAttribute("drag-class")).to.equal("my-drag");
    });
});
