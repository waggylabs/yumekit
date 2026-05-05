import { html, fixture, expect, aTimeout, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-droplist.js";

const flushFrame = () => new Promise((r) => requestAnimationFrame(r));

describe("YumeDroplist", () => {
    const sandbox = sinon.createSandbox();
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

        const dt =
            typeof DataTransfer === "function" ? new DataTransfer() : null;
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
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const endSpy = sandbox.spy();
        el.addEventListener("drag:end", endSpy);
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

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
        const evt = new DragEvent("dragstart", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
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
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

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

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
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

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

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

        a.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

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

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        // No dragover → no ghost.
        a.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

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
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        expect(a.getAttribute("aria-grabbed")).to.equal("true");

        // dragover inserts the ghost into the host's light DOM, which is a
        // childList mutation that re-fires _initializeChildren via the observer.
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
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

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
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

    // ── Cross-list groups ─────────────────────────────────────

    it("pull getter returns 'true' | 'clone' | 'false'", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.pull).to.equal("true");
        el.setAttribute("pull", "clone");
        expect(el.pull).to.equal("clone");
        el.setAttribute("pull", "false");
        expect(el.pull).to.equal("false");
        el.pull = "true";
        expect(el.getAttribute("pull")).to.equal("true");
    });

    it("put getter returns 'true' | 'false' | comma-separated group names", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.put).to.equal("true");
        el.setAttribute("put", "false");
        expect(el.put).to.equal("false");
        el.setAttribute("put", "foo,bar");
        expect(el.put).to.equal("foo,bar");
        el.put = "true";
        expect(el.getAttribute("put")).to.equal("true");
    });

    it("cross-list drop moves item to destination and fires events source-then-dest", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                    <div data-id="b">B</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="c">C</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        const srcUpdateSpy = sandbox.spy();
        const destReorderSpy = sandbox.spy();
        const destUpdateSpy = sandbox.spy();
        src.addEventListener("update", srcUpdateSpy);
        dest.addEventListener("reorder", destReorderSpy);
        dest.addEventListener("update", destUpdateSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(src.hasItem(a)).to.be.false;
        expect(dest.hasItem(a)).to.be.true;
        expect(src.toArray()).to.deep.equal(["b"]);

        expect(srcUpdateSpy).to.have.been.calledOnce;
        expect(srcUpdateSpy.firstCall.args[0].detail.newIndex).to.equal(-1);
        expect(srcUpdateSpy.firstCall.args[0].detail.oldIndex).to.equal(0);

        expect(destReorderSpy).to.have.been.calledOnce;
        expect(destUpdateSpy).to.have.been.calledOnce;
        expect(destReorderSpy.firstCall.args[0].detail.newIndex).to.equal(0);

        expect(srcUpdateSpy.calledBefore(destReorderSpy)).to.be.true;

        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;
        expect(src.querySelector("[data-y-droplist-ghost]")).to.not.exist;
    });

    it("ghost moves from source to destination on cross-list dragover", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        // First dragover within source creates ghost in source
        src.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(src.querySelector("[data-y-droplist-ghost]")).to.exist;
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        // Dragover on dest moves ghost there
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.exist;
        expect(src.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;
    });

    it("three-list drag: ghost relocates across lists and item lands in the third", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="a" group="kanban" animation="0">
                    <div data-id="task">Task</div>
                </y-droplist>
                <y-droplist id="b" group="kanban" animation="0">
                    <div data-id="x">X</div>
                </y-droplist>
                <y-droplist id="c" group="kanban" animation="0">
                    <div data-id="y">Y</div>
                </y-droplist>
            </div>
        `);
        const listA = container.querySelector("#a");
        const listB = container.querySelector("#b");
        const listC = container.querySelector("#c");
        const task = listA.children[0];

        task.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        listB.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(listB.querySelector("[data-y-droplist-ghost]")).to.exist;

        listC.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(listB.querySelector("[data-y-droplist-ghost]")).to.not.exist;
        expect(listC.querySelector("[data-y-droplist-ghost]")).to.exist;

        listC.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        task.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(listA.hasItem(task)).to.be.false;
        expect(listC.hasItem(task)).to.be.true;
        expect(listB.querySelector("[data-y-droplist-ghost]")).to.not.exist;
        expect(listC.querySelector("[data-y-droplist-ghost]")).to.not.exist;
    });

    it("pull='clone' inserts a copy in destination, original remains in source", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" pull="clone" animation="0">
                    <div data-id="a">A</div>
                    <div data-id="b">B</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="c">C</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(src.hasItem(a)).to.be.true;
        expect(src.toArray()).to.deep.equal(["a", "b"]);
        expect(dest.toArray()).to.include("a");

        const clone = dest.querySelector('[data-id="a"]');
        expect(clone).to.exist;
        expect(clone).to.not.equal(a);
        expect(dest.children.length).to.equal(2);
    });

    it("pull='false' prevents dragover from showing a ghost in another list", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" pull="false" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const overEvt = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt);

        expect(overEvt.defaultPrevented).to.be.false;
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(src.hasItem(a)).to.be.true;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("put='false' rejects all incoming items", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" put="false" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const overEvt = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt);

        expect(overEvt.defaultPrevented).to.be.false;
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(src.hasItem(a)).to.be.true;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("mismatched groups cannot exchange items", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="alpha" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="beta" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const overEvt = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt);

        expect(overEvt.defaultPrevented).to.be.false;
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(src.hasItem(a)).to.be.true;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("put as a comma-separated group list blocks a same-group source not in the list", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist
                    id="dest"
                    group="kanban"
                    put="other-group"
                    animation="0"
                >
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const overEvt = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt);

        // "kanban" is not in put list ["other-group"] → rejected
        expect(overEvt.defaultPrevented).to.be.false;
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("drag:enter fires on the destination when a compatible item enters", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        const enterSpy = sandbox.spy();
        dest.addEventListener("drag:enter", enterSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragenter", { bubbles: true, composed: true }),
        );

        expect(enterSpy).to.have.been.calledOnce;
        const detail = enterSpy.firstCall.args[0].detail;
        expect(detail.item).to.equal(a);
        expect(detail.list).to.equal(dest);
        expect(detail.from).to.equal(src);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("drag:enter does not fire for incompatible sources (pull='false')", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" pull="false" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        const enterSpy = sandbox.spy();
        dest.addEventListener("drag:enter", enterSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragenter", { bubbles: true, composed: true }),
        );

        expect(enterSpy).to.not.have.been.called;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("drag:leave fires on the source list when the dragged item leaves its bounds", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        const leaveSpy = sandbox.spy();
        src.addEventListener("drag:leave", leaveSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        // Dispatch dragleave with no relatedTarget (cursor went outside viewport)
        src.dispatchEvent(
            new DragEvent("dragleave", { bubbles: true, composed: true }),
        );

        expect(leaveSpy).to.have.been.calledOnce;
        const detail = leaveSpy.firstCall.args[0].detail;
        expect(detail.item).to.equal(a);
        expect(detail.list).to.equal(src);
        expect(detail.to).to.be.null;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("cross-list drop announces destination aria-label in the live region", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist
                    id="dest"
                    group="kanban"
                    aria-label="Done"
                    animation="0"
                >
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        await flushFrame();
        const live = dest.shadowRoot.querySelector(".sr-live");
        expect(live.textContent).to.contain("Done");
        expect(live.textContent).to.contain("position");
    });

    it("falls back to 'another list' when the destination has no aria-label", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        await flushFrame();
        const live = dest.shadowRoot.querySelector(".sr-live");
        expect(live.textContent).to.contain("another list");
    });

    it("changing the group attribute moves the list to the new group registry", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        // Initially same group — cross-drag works
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const overEvt1 = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt1);
        expect(overEvt1.defaultPrevented).to.be.true;
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Move dest to a different group
        dest.setAttribute("group", "other");

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const overEvt2 = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt2);
        expect(overEvt2.defaultPrevented).to.be.false;
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("destroy() unregisters the list so cross-list drag is blocked afterward", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="kanban" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="kanban" animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        dest.destroy();

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const overEvt = new DragEvent("dragover", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        dest.dispatchEvent(overEvt);
        expect(overEvt.defaultPrevented).to.be.false;
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    // ── Handle (drag initiator) ────────────────────────────────

    it("handle: items get tabindex=-1 and the matching child gets tabindex=0", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip">
                <div data-id="a">
                    <span class="grip">⋮</span>
                    <span>Alpha</span>
                </div>
            </y-droplist>
        `);
        const item = el.firstElementChild;
        const grip = item.querySelector(".grip");
        expect(item.getAttribute("tabindex")).to.equal("-1");
        expect(grip.getAttribute("tabindex")).to.equal("0");
    });

    it("handle: pointerdown outside the handle disables draggable on the item", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip">
                <div data-id="a">
                    <span class="grip">⋮</span>
                    <span class="body">Alpha</span>
                </div>
            </y-droplist>
        `);
        const item = el.firstElementChild;
        const body = item.querySelector(".body");
        body.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, composed: true }),
        );
        expect(item.getAttribute("draggable")).to.equal("false");
    });

    it("handle: pointerdown on the handle leaves draggable enabled", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip">
                <div data-id="a">
                    <span class="grip">⋮</span>
                    <span class="body">Alpha</span>
                </div>
            </y-droplist>
        `);
        const item = el.firstElementChild;
        const grip = item.querySelector(".grip");
        grip.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, composed: true }),
        );
        expect(item.getAttribute("draggable")).to.equal("true");
    });

    it("handle: pointerup restores draggable=true", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip">
                <div data-id="a">
                    <span class="grip">⋮</span>
                    <span class="body">Alpha</span>
                </div>
            </y-droplist>
        `);
        const item = el.firstElementChild;
        const body = item.querySelector(".body");
        body.dispatchEvent(
            new PointerEvent("pointerdown", { bubbles: true, composed: true }),
        );
        expect(item.getAttribute("draggable")).to.equal("false");
        window.dispatchEvent(new PointerEvent("pointerup"));
        expect(item.getAttribute("draggable")).to.equal("true");
    });

    it("handle: prevent-on-filter=false skips preventDefault on non-handle pointerdown", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip" prevent-on-filter="false">
                <div data-id="a">
                    <span class="grip">⋮</span>
                    <span class="body">Alpha</span>
                </div>
            </y-droplist>
        `);
        const item = el.firstElementChild;
        const body = item.querySelector(".body");
        const evt = new PointerEvent("pointerdown", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        body.dispatchEvent(evt);
        expect(evt.defaultPrevented).to.be.false;
        expect(item.getAttribute("draggable")).to.equal("false");
    });

    it("handle: prevent-on-filter (default true) prevents the pointerdown default", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip">
                <div data-id="a">
                    <span class="grip">⋮</span>
                    <span class="body">Alpha</span>
                </div>
            </y-droplist>
        `);
        const body = el.firstElementChild.querySelector(".body");
        const evt = new PointerEvent("pointerdown", {
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        body.dispatchEvent(evt);
        expect(evt.defaultPrevented).to.be.true;
    });

    it("handle: invalid selector warns and falls back to whole-item drag", async () => {
        const warn = sandbox.stub(console, "warn");
        const el = await fixture(html`
            <y-droplist handle=":::not-a-selector">
                <div data-id="a">
                    <span class="grip">⋮</span>
                </div>
            </y-droplist>
        `);
        expect(warn).to.have.been.calledOnce;
        expect(el.handle).to.equal("");
        expect(el.firstElementChild.getAttribute("tabindex")).to.equal("0");
    });

    it("handle: keyboard reorder works when focus is on the handle", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip" animation="0">
                <div data-id="a"><span class="grip">⋮</span></div>
                <div data-id="b"><span class="grip">⋮</span></div>
            </y-droplist>
        `);
        const a = el.children[0];
        const aGrip = a.querySelector(".grip");
        aGrip.focus();
        aGrip.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "ArrowDown",
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(el.toArray()).to.deep.equal(["b", "a"]);
        // Focus stays on the handle the user was holding.
        expect(document.activeElement).to.equal(aGrip);
    });

    it("handle: clearing the attribute restores tabindex=0 on items", async () => {
        const el = await fixture(html`
            <y-droplist handle=".grip">
                <div data-id="a"><span class="grip">⋮</span></div>
            </y-droplist>
        `);
        const item = el.firstElementChild;
        const grip = item.querySelector(".grip");
        expect(item.getAttribute("tabindex")).to.equal("-1");
        expect(grip.getAttribute("tabindex")).to.equal("0");

        el.removeAttribute("handle");
        expect(item.getAttribute("tabindex")).to.equal("0");
        expect(grip.hasAttribute("tabindex")).to.be.false;
    });

    // ── Swap mode ──────────────────────────────────────────────

    it("swap: dragover marks the cursor target with the swap class and does not place a ghost", async () => {
        const el = await fixture(html`
            <y-droplist swap animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
                <div data-id="c">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const c = el.children[2];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const cRect = c.getBoundingClientRect();
        c.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: cRect.left + cRect.width / 2,
                clientY: cRect.top + cRect.height / 2,
            }),
        );

        expect(c.classList.contains("y-droplist__swap-target")).to.be.true;
        expect(el.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("swap: drop swaps the source item with the marked target", async () => {
        const el = await fixture(html`
            <y-droplist swap animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
                <div data-id="c">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const c = el.children[2];

        const reorderSpy = sandbox.spy();
        const updateSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        el.addEventListener("update", updateSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const cRect = c.getBoundingClientRect();
        c.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: cRect.left + cRect.width / 2,
                clientY: cRect.top + cRect.height / 2,
            }),
        );
        c.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(el.toArray()).to.deep.equal(["c", "b", "a"]);
        expect(reorderSpy).to.have.been.calledOnce;
        expect(updateSpy).to.have.been.calledOnce;
        expect(reorderSpy.firstCall.args[0].detail.oldIndex).to.equal(0);
        expect(reorderSpy.firstCall.args[0].detail.newIndex).to.equal(2);
        expect(c.classList.contains("y-droplist__swap-target")).to.be.false;
    });

    it("swap: clone overrides swap (clone wins per spec)", async () => {
        const el = await fixture(html`
            <y-droplist swap clone animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const b = el.children[1];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const bRect = b.getBoundingClientRect();
        b.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: bRect.left + bRect.width / 2,
                clientY: bRect.top + bRect.height / 2,
            }),
        );
        // Clone path uses the ghost, no swap class.
        expect(b.classList.contains("y-droplist__swap-target")).to.be.false;
        expect(el.querySelector("[data-y-droplist-ghost]")).to.exist;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("swap: cross-list drop falls through to insert (swap is same-list only)", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="g" animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist id="dest" group="g" swap animation="0">
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        // Insert mode is in effect: ghost present, no swap mark.
        expect(dest.querySelector("[data-y-droplist-ghost]")).to.exist;

        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(dest.hasItem(a)).to.be.true;
    });

    // ── Clone mode ─────────────────────────────────────────────

    it("clone: same-list drop inserts a copy and leaves the original in place", async () => {
        const el = await fixture(html`
            <y-droplist clone animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
                <div data-id="c">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const c = el.children[2];

        const reorderSpy = sandbox.spy();
        const updateSpy = sandbox.spy();
        el.addEventListener("reorder", reorderSpy);
        el.addEventListener("update", updateSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const cRect = c.getBoundingClientRect();
        c.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: cRect.right + 5,
                clientY: cRect.top + cRect.height / 2,
            }),
        );
        a.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Original "a" is still at index 0; clone is appended.
        expect(el.children[0]).to.equal(a);
        expect(el.toArray()).to.deep.equal(["a", "b", "c", "a"]);
        // Source update is skipped on same-list clone — exactly one update fires.
        expect(updateSpy).to.have.been.calledOnce;
        expect(reorderSpy.firstCall.args[0].detail.oldIndex).to.equal(-1);
        expect(reorderSpy.firstCall.args[0].detail.newIndex).to.equal(3);
    });

    it("clone: same-list announcement says 'copied'", async () => {
        const el = await fixture(html`
            <y-droplist clone animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const b = el.children[1];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        const bRect = b.getBoundingClientRect();
        b.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: bRect.right + 5,
                clientY: bRect.top + bRect.height / 2,
            }),
        );
        a.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        await flushFrame();
        const live = el.shadowRoot.querySelector(".sr-live");
        expect(live.textContent).to.contain("copied");
    });

    it("clone: cross-list announcement says 'copied to list <label>'", async () => {
        const container = await fixture(html`
            <div>
                <y-droplist id="src" group="g" clone animation="0">
                    <div data-id="a">A</div>
                </y-droplist>
                <y-droplist
                    id="dest"
                    group="g"
                    aria-label="Inbox"
                    animation="0"
                >
                    <div data-id="b">B</div>
                </y-droplist>
            </div>
        `);
        const src = container.querySelector("#src");
        const dest = container.querySelector("#dest");
        const a = src.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        dest.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        dest.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Original stays in source; clone lands in dest.
        expect(src.hasItem(a)).to.be.true;
        expect(dest.querySelector('[data-id="a"]')).to.exist;

        await flushFrame();
        const live = dest.shadowRoot.querySelector(".sr-live");
        expect(live.textContent).to.contain("copied");
        expect(live.textContent).to.contain("Inbox");
    });

    it("clone attribute composes with cross-list groups (no group required for in-list)", async () => {
        const el = await fixture(html`
            <y-droplist clone animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        // Sanity: clone attribute exposed as boolean property.
        expect(el.clone).to.be.true;
        el.clone = false;
        expect(el.hasAttribute("clone")).to.be.false;
    });

    // ── scroll / scrollSensitivity / scrollSpeed getters ─────

    it("scroll getter: true by default, false when scroll='false'", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.scroll).to.be.true;
        el.setAttribute("scroll", "false");
        expect(el.scroll).to.be.false;
        el.removeAttribute("scroll");
        expect(el.scroll).to.be.true;
    });

    it("scroll setter round-trips correctly", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        el.scroll = false;
        expect(el.getAttribute("scroll")).to.equal("false");
        el.scroll = true;
        expect(el.hasAttribute("scroll")).to.be.false;
    });

    it("scrollSensitivity getter: default 30, accepts custom, falls back on invalid", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.scrollSensitivity).to.equal(30);
        el.setAttribute("scroll-sensitivity", "50");
        expect(el.scrollSensitivity).to.equal(50);
        el.setAttribute("scroll-sensitivity", "not-a-number");
        expect(el.scrollSensitivity).to.equal(30);
        el.setAttribute("scroll-sensitivity", "0");
        expect(el.scrollSensitivity).to.equal(30); // 0 is not > 0
    });

    it("scrollSpeed getter: default 10, accepts custom, falls back on invalid", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.scrollSpeed).to.equal(10);
        el.setAttribute("scroll-speed", "20");
        expect(el.scrollSpeed).to.equal(20);
        el.setAttribute("scroll-speed", "bad");
        expect(el.scrollSpeed).to.equal(10);
    });

    // ── revert getter ─────────────────────────────────────────

    it("revert getter: false by default, true when attribute present", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.revert).to.be.false;
        el.setAttribute("revert", "");
        expect(el.revert).to.be.true;
        el.removeAttribute("revert");
        expect(el.revert).to.be.false;
    });

    it("revert setter round-trips correctly", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        el.revert = true;
        expect(el.hasAttribute("revert")).to.be.true;
        el.revert = false;
        expect(el.hasAttribute("revert")).to.be.false;
    });

    // ── forceFloat getter ─────────────────────────────────────

    it("forceFloat getter: false by default, true when force-float present", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.forceFloat).to.be.false;
        el.setAttribute("force-float", "");
        expect(el.forceFloat).to.be.true;
        el.removeAttribute("force-float");
        expect(el.forceFloat).to.be.false;
    });

    it("forceFloat setter round-trips correctly", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        el.forceFloat = true;
        expect(el.hasAttribute("force-float")).to.be.true;
        el.forceFloat = false;
        expect(el.hasAttribute("force-float")).to.be.false;
    });

    // ── revert behavior ───────────────────────────────────────

    it("revert: drag:end fires after animation delay when drag is cancelled without drop", async () => {
        const el = await fixture(html`
            <y-droplist animation="100" revert>
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const endSpy = sandbox.spy();
        el.addEventListener("drag:end", endSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );

        // dragend without a preceding drop — revert should delay drag:end
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Not yet (revert animation in progress)
        expect(endSpy).to.not.have.been.called;

        // After the animation delay fires
        await aTimeout(200);
        expect(endSpy).to.have.been.calledOnce;
    });

    it("revert: ghost is removed immediately and drag state is cleared before animation", async () => {
        const el = await fixture(html`
            <y-droplist animation="100" revert>
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        expect(el.querySelector("[data-y-droplist-ghost]")).to.exist;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Ghost is gone immediately even though drag:end is deferred
        expect(el.querySelector("[data-y-droplist-ghost]")).to.not.exist;
        // aria-grabbed is reset
        expect(a.getAttribute("aria-grabbed")).to.equal("false");

        await aTimeout(200);
    });

    it("revert=false (default): drag:end fires immediately on cancelled drag", async () => {
        const el = await fixture(html`
            <y-droplist animation="100">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const endSpy = sandbox.spy();
        el.addEventListener("drag:end", endSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Fires synchronously when revert is absent
        expect(endSpy).to.have.been.calledOnce;
    });

    it("revert: successful drop does NOT delay drag:end", async () => {
        const el = await fixture(html`
            <y-droplist animation="0" revert>
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const endSpy = sandbox.spy();
        el.addEventListener("drag:end", endSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Fires synchronously after a valid drop
        expect(endSpy).to.have.been.calledOnce;
    });

    // ── force-float ghost ─────────────────────────────────────

    it("force-float: ghost is appended to document.body with position:fixed", async () => {
        const el = await fixture(html`
            <y-droplist force-float animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );

        const ghost = document.body.querySelector("[data-y-droplist-ghost]");
        expect(ghost).to.exist;
        expect(ghost.style.position).to.equal("fixed");
        // Ghost is NOT a child of the droplist
        expect(el.querySelector("[data-y-droplist-ghost]")).to.not.exist;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        // Ghost removed from body on drag end
        expect(document.body.querySelector("[data-y-droplist-ghost]")).to.not
            .exist;
    });

    it("force-float: ghost has pointer-events:none and high z-index", async () => {
        const el = await fixture(html`
            <y-droplist force-float animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );

        const ghost = document.body.querySelector("[data-y-droplist-ghost]");
        expect(ghost.style.pointerEvents).to.equal("none");
        expect(Number(ghost.style.zIndex)).to.be.greaterThan(0);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("force-float: ghost stays in body across multiple dragovers (position updated)", async () => {
        const el = await fixture(html`
            <y-droplist force-float animation="0">
                <div data-id="a" style="height:40px;display:block">A</div>
                <div data-id="b" style="height:40px;display:block">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientY: 5,
            }),
        );
        const ghost = document.body.querySelector("[data-y-droplist-ghost]");
        expect(ghost).to.exist;

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientY: 60,
            }),
        );
        // Still exactly one ghost in body (not duplicated)
        const allGhosts = document.body.querySelectorAll(
            "[data-y-droplist-ghost]",
        );
        expect(allGhosts.length).to.equal(1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("force-float: normal list drops still work (ghost removed from body on drop)", async () => {
        const el = await fixture(html`
            <y-droplist force-float animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(document.body.querySelector("[data-y-droplist-ghost]")).to.not
            .exist;
    });

    // ── auto-scroll engagement ────────────────────────────────

    it("auto-scroll: scrolls container when cursor is within sensitivity of bottom edge", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            height: "80px",
            width: "200px",
            overflow: "auto",
            position: "fixed",
            top: "100px",
            left: "0px",
        });
        document.body.appendChild(wrapper);

        // Populate wrapper with a tall droplist so it actually overflows.
        wrapper.innerHTML = `
            <y-droplist animation="0" style="display:block">
                <div data-id="a" style="height:40px;display:block">A</div>
                <div data-id="b" style="height:40px;display:block">B</div>
                <div data-id="c" style="height:40px;display:block">C</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0); // let connectedCallback run

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        // wrapper: top=100, height=80 → bottom=180.
        // sensitivity=30 → engage when clientY > 180-30=150.
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientY: 170, // 180-170=10 < 30 → engage scroll down
                clientX: 50,
            }),
        );

        await flushFrame();
        await flushFrame();

        expect(wrapper.scrollTop).to.be.greaterThan(0);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("auto-scroll: scroll='false' prevents engagement", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            height: "80px",
            width: "200px",
            overflow: "auto",
            position: "fixed",
            top: "100px",
            left: "0px",
        });
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
            <y-droplist scroll="false" animation="0" style="display:block">
                <div data-id="a" style="height:40px;display:block">A</div>
                <div data-id="b" style="height:40px;display:block">B</div>
                <div data-id="c" style="height:40px;display:block">C</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientY: 170,
                clientX: 50,
            }),
        );

        await flushFrame();
        await flushFrame();

        expect(wrapper.scrollTop).to.equal(0);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("auto-scroll: stops scrolling after drag ends", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            height: "80px",
            width: "200px",
            overflow: "auto",
            position: "fixed",
            top: "100px",
            left: "0px",
        });
        document.body.appendChild(wrapper);

        wrapper.innerHTML = `
            <y-droplist animation="0" style="display:block">
                <div data-id="a" style="height:40px;display:block">A</div>
                <div data-id="b" style="height:40px;display:block">B</div>
                <div data-id="c" style="height:40px;display:block">C</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientY: 170,
                clientX: 50,
            }),
        );
        await flushFrame();
        await flushFrame();
        const scrollAfterDrag = wrapper.scrollTop;
        expect(scrollAfterDrag).to.be.greaterThan(0);

        // End the drag; scroll should stop.
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        await flushFrame();
        await flushFrame();
        // scrollTop does not continue to grow after drag ends.
        expect(wrapper.scrollTop).to.equal(scrollAfterDrag);

        wrapper.remove();
    });
});

// ─── Touch / pointer pipeline ──────────────────────────────────────────────

describe("y-droplist — touch getters", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("delay defaults to 0", async () => {
        const el = await fixture(html`<y-droplist><div>A</div></y-droplist>`);
        expect(el.delay).to.equal(0);
    });

    it("delay returns numeric attribute value", async () => {
        const el = await fixture(
            html`<y-droplist delay="300"><div>A</div></y-droplist>`,
        );
        expect(el.delay).to.equal(300);
    });

    it("delay setter persists as attribute", async () => {
        const el = await fixture(html`<y-droplist><div>A</div></y-droplist>`);
        el.delay = 200;
        expect(el.getAttribute("delay")).to.equal("200");
    });

    it("delayOnTouchOnly defaults to false", async () => {
        const el = await fixture(html`<y-droplist><div>A</div></y-droplist>`);
        expect(el.delayOnTouchOnly).to.be.false;
    });

    it("delayOnTouchOnly true when attribute present", async () => {
        const el = await fixture(
            html`<y-droplist delay-on-touch-only><div>A</div></y-droplist>`,
        );
        expect(el.delayOnTouchOnly).to.be.true;
    });

    it("touchStartThreshold defaults to 0", async () => {
        const el = await fixture(html`<y-droplist><div>A</div></y-droplist>`);
        expect(el.touchStartThreshold).to.equal(0);
    });

    it("touchStartThreshold returns attribute value", async () => {
        const el = await fixture(
            html`<y-droplist touch-start-threshold="10"
                ><div>A</div></y-droplist
            >`,
        );
        expect(el.touchStartThreshold).to.equal(10);
    });
});

describe("y-droplist — touch reorder (pointerType=touch)", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    const fire = (el, type, extra = {}) =>
        el.dispatchEvent(
            new PointerEvent(type, {
                bubbles: true,
                composed: true,
                cancelable: true,
                pointerType: "touch",
                pointerId: 1,
                ...extra,
            }),
        );

    it("touch drag fires drag:end on pointerup at same position", async () => {
        const el = await fixture(html`
            <y-droplist animation="0" style="display:block;height:120px">
                <div style="height:40px">A</div>
                <div style="height:40px">B</div>
                <div style="height:40px">C</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();

        // pointerdown on item A.
        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });

        // Wait a tick (no delay set so drag starts immediately).
        await aTimeout(0);

        const endPromise = oneEvent(el, "drag:end");
        fire(a, "pointerup", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });

        const ev = await endPromise;
        expect(ev.detail.list).to.equal(el);
    });

    it("touch drag:start fires immediately when delay=0", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();

        const startPromise = oneEvent(el, "drag:start");
        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        await aTimeout(0);
        const ev = await startPromise;
        expect(ev.detail.item).to.equal(a);
    });

    it("pointerup before delay fires does not start drag", async () => {
        const el = await fixture(html`
            <y-droplist delay="200" animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();
        let started = false;
        el.addEventListener("drag:start", () => {
            started = true;
        });

        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        fire(a, "pointerup", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });

        await aTimeout(250);
        expect(started).to.be.false;
    });

    it("movement beyond touchStartThreshold during delay cancels pending drag", async () => {
        const el = await fixture(html`
            <y-droplist delay="200" touch-start-threshold="5" animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();
        let started = false;
        el.addEventListener("drag:start", () => {
            started = true;
        });

        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        // Move beyond threshold before delay expires.
        fire(a, "pointermove", {
            clientX: elRect.left + 5 + 20,
            clientY: elRect.top + 5,
        });

        await aTimeout(250);
        expect(started).to.be.false;
    });

    it("pointercancel during active drag fires drag:end", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();

        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        await aTimeout(0); // let _touchDragStart run

        const endPromise = oneEvent(el, "drag:end");
        fire(a, "pointercancel", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        const ev = await endPromise;
        expect(ev.detail.list).to.equal(el);
    });

    it("touch-action reset to empty string after drag ends", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();

        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        await aTimeout(0);
        fire(a, "pointercancel", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        await aTimeout(0);
        expect(a.style.touchAction).to.equal("");
    });

    it("delay timer fires and starts drag after delay ms", async () => {
        const el = await fixture(html`
            <y-droplist delay="50" animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();

        const startPromise = oneEvent(el, "drag:start");
        fire(a, "pointerdown", {
            clientX: elRect.left + 5,
            clientY: elRect.top + 5,
        });
        const ev = await startPromise;
        expect(ev.detail.item).to.equal(a);
    });

    it("mouse press with delay-on-touch-only defers to native DnD (no drag:start)", async () => {
        const el = await fixture(html`
            <y-droplist delay="50" delay-on-touch-only animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const elRect = el.getBoundingClientRect();
        let started = false;
        el.addEventListener("drag:start", () => {
            started = true;
        });

        a.dispatchEvent(
            new PointerEvent("pointerdown", {
                bubbles: true,
                composed: true,
                cancelable: true,
                pointerType: "mouse",
                pointerId: 1,
                clientX: elRect.left + 5,
                clientY: elRect.top + 5,
            }),
        );
        await aTimeout(100);
        // The touch pipeline should not have started since delay-on-touch-only
        // means mouse presses skip the pointer pipeline.
        expect(started).to.be.false;
    });
});

// ─── sort() ───────────────────────────────────────────────────────────────

describe("y-droplist — sort()", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("sort() without comparator sorts by data-id ASCII order", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="c">C</div>
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        el.sort();
        const ids = Array.from(el.children)
            .filter((c) => !c.hasAttribute("data-y-droplist-ghost"))
            .map((c) => c.getAttribute("data-id"));
        expect(ids).to.deep.equal(["a", "b", "c"]);
    });

    it("sort() with custom comparator uses it", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a" data-val="3">A</div>
                <div data-id="b" data-val="1">B</div>
                <div data-id="c" data-val="2">C</div>
            </y-droplist>
        `);
        el.sort((a, b) => Number(a.dataset.val) - Number(b.dataset.val));
        const ids = Array.from(el.children)
            .filter((c) => !c.hasAttribute("data-y-droplist-ghost"))
            .map((c) => c.getAttribute("data-id"));
        expect(ids).to.deep.equal(["b", "c", "a"]);
    });

    it("sort() fires a single update event with oldIndex=-1, newIndex=-1", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="b">B</div>
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const events = [];
        el.addEventListener("update", (e) => events.push(e.detail));
        el.sort();
        expect(events).to.have.length(1);
        expect(events[0].oldIndex).to.equal(-1);
        expect(events[0].newIndex).to.equal(-1);
        expect(events[0].list).to.equal(el);
    });

    it("sort() does not fire reorder", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="b">B</div>
                <div data-id="a">A</div>
            </y-droplist>
        `);
        let fired = false;
        el.addEventListener("reorder", () => {
            fired = true;
        });
        el.sort();
        expect(fired).to.be.false;
    });

    it("sort() with already-sorted list still fires update", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const events = [];
        el.addEventListener("update", (e) => events.push(e));
        el.sort();
        expect(events).to.have.length(1);
    });
});

// ─── option() ─────────────────────────────────────────────────────────────

describe("y-droplist — option()", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("option() reads a boolean attribute", async () => {
        const el = await fixture(
            html`<y-droplist disabled><div>A</div></y-droplist>`,
        );
        expect(el.option("disabled")).to.be.true;
    });

    it("option() reads a numeric attribute", async () => {
        const el = await fixture(
            html`<y-droplist animation="300"><div>A</div></y-droplist>`,
        );
        expect(el.option("animation")).to.equal(300);
    });

    it("option() reads a camelCase-mapped attribute (ghost-class)", async () => {
        const el = await fixture(
            html`<y-droplist ghost-class="my-ghost"><div>A</div></y-droplist>`,
        );
        expect(el.option("ghost-class")).to.equal("my-ghost");
    });

    it("option() sets a value by writing to the property", async () => {
        const el = await fixture(html`<y-droplist><div>A</div></y-droplist>`);
        el.option("animation", 500);
        expect(el.animation).to.equal(500);
        expect(el.getAttribute("animation")).to.equal("500");
    });

    it("option() round-trip: set then get returns same value", async () => {
        const el = await fixture(html`<y-droplist><div>A</div></y-droplist>`);
        el.option("scroll-speed", 20);
        expect(el.option("scroll-speed")).to.equal(20);
    });
});

// ─── closest() ────────────────────────────────────────────────────────────

describe("y-droplist — closest()", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("closest() returns the item at the event coordinates", async () => {
        const el = await fixture(html`
            <y-droplist style="display:block;height:120px">
                <div style="height:40px">A</div>
                <div style="height:40px">B</div>
                <div style="height:40px">C</div>
            </y-droplist>
        `);
        const b = el.children[1];
        const r = b.getBoundingClientRect();
        const fakeEvt = { clientX: r.left + 5, clientY: r.top + 5 };
        const result = el.closest(fakeEvt);
        expect(result).to.equal(b);
    });

    it("closest() returns null when coordinates miss every item", async () => {
        const el = await fixture(html`
            <y-droplist style="display:block;height:40px">
                <div style="height:40px">A</div>
            </y-droplist>
        `);
        // Use coordinates far off the element.
        const fakeEvt = { clientX: -9999, clientY: -9999 };
        expect(el.closest(fakeEvt)).to.be.null;
    });
});

// ─── drag:drop event ──────────────────────────────────────────────────────

describe("y-droplist — drag:drop event", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("drag:drop fires on drop and carries numeric index, item, and list", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        const dropped = [];
        el.addEventListener("drag:drop", (e) => dropped.push(e.detail));

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        el.dispatchEvent(
            new DragEvent("drop", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(dropped).to.have.length(1);
        expect(typeof dropped[0].index).to.equal("number");
        expect(dropped[0].item).to.equal(a);
        expect(dropped[0].list).to.equal(el);
    });
});

// ─── drag:move event ──────────────────────────────────────────────────────

describe("y-droplist — drag:move event", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("drag:move fires during dragover with x/y coordinates", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const movePromise = oneEvent(el, "drag:move");
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 50,
                clientY: 80,
            }),
        );
        const ev = await movePromise;
        expect(typeof ev.detail.x).to.equal("number");
        expect(typeof ev.detail.y).to.equal("number");
        expect(ev.detail.list).to.equal(el);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("drag:move detail includes item and list", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div>A</div>
                <div>B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const movePromise = oneEvent(el, "drag:move");
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
            }),
        );
        const ev = await movePromise;
        expect(ev.detail.item).to.equal(a);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });
});

// ─── drag:over event ──────────────────────────────────────────────────────

describe("y-droplist — drag:over event", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    it("drag:over fires when pointer moves over a different item", async () => {
        // Pin to document.body so getBoundingClientRect returns non-zero values.
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:fixed;top:0;left:0;width:200px";
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
                <div style="display:block;height:40px">C</div>
            </y-droplist>`;
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        const b = el.children[1];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        const bRect = b.getBoundingClientRect();
        const overPromise = oneEvent(el, "drag:over");
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: bRect.left + 5,
                clientY: bRect.top + 5,
            }),
        );
        const ev = await overPromise;
        expect(ev.detail.target).to.equal(b);
        expect(ev.detail.list).to.equal(el);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("drag:over does not fire twice for the same target item", async () => {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:fixed;top:0;left:0;width:200px";
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
            </y-droplist>`;
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        const b = el.children[1];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );

        let count = 0;
        el.addEventListener("drag:over", () => count++);

        const bRect = b.getBoundingClientRect();
        for (let i = 0; i < 3; i++) {
            el.dispatchEvent(
                new DragEvent("dragover", {
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                    clientX: bRect.left + 5,
                    clientY: bRect.top + 5,
                }),
            );
        }
        expect(count).to.equal(1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    // ── drag-preview ──────────────────────────────────────────

    it("dragPreview reflects to attribute", async () => {
        const el = await fixture(html`<y-droplist drag-preview></y-droplist>`);
        expect(el.dragPreview).to.be.true;
        el.dragPreview = false;
        expect(el.hasAttribute("drag-preview")).to.be.false;
        el.dragPreview = true;
        expect(el.hasAttribute("drag-preview")).to.be.true;
    });

    it("dragPreviewClass defaults to 'y-droplist__drag-preview'", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.dragPreviewClass).to.equal("y-droplist__drag-preview");
    });

    it("dragPreviewClass reads from attribute", async () => {
        const el = await fixture(
            html`<y-droplist drag-preview-class="my-preview"></y-droplist>`,
        );
        expect(el.dragPreviewClass).to.equal("my-preview");
    });

    it("dragPreviewOffset defaults to 'cursor'", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.dragPreviewOffset).to.equal("cursor");
    });

    it("dragPreviewOffset reads valid values from attribute", async () => {
        const el = await fixture(
            html`<y-droplist drag-preview-offset="center"></y-droplist>`,
        );
        expect(el.dragPreviewOffset).to.equal("center");
        el.setAttribute("drag-preview-offset", "top-left");
        expect(el.dragPreviewOffset).to.equal("top-left");
        el.setAttribute("drag-preview-offset", "invalid");
        expect(el.dragPreviewOffset).to.equal("cursor");
    });

    it("dragPreviewScale defaults to 1", async () => {
        const el = await fixture(html`<y-droplist></y-droplist>`);
        expect(el.dragPreviewScale).to.equal(1);
    });

    it("dragPreviewScale reads from attribute", async () => {
        const el = await fixture(
            html`<y-droplist drag-preview-scale="0.8"></y-droplist>`,
        );
        expect(el.dragPreviewScale).to.equal(0.8);
    });

    it("preview is NOT created when drag-preview attribute is absent", async () => {
        const el = await fixture(html`
            <y-droplist animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        expect(el._dragPreview).to.be.null;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("preview is created in document.body on dragstart when drag-preview is set", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        expect(el._dragPreview).to.not.be.null;
        expect(document.body.contains(el._dragPreview)).to.be.true;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("preview element carries aria-hidden, pointer-events:none, and correct class", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        expect(preview.getAttribute("aria-hidden")).to.equal("true");
        expect(preview.style.pointerEvents).to.equal("none");
        expect(preview.classList.contains("y-droplist__drag-preview")).to.be
            .true;
        expect(preview.getAttribute("part")).to.equal("drag-preview");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("preview is removed from the DOM on dragend", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        expect(document.body.contains(preview)).to.be.true;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );

        expect(document.body.contains(preview)).to.be.false;
        expect(el._dragPreview).to.be.null;
    });

    it("fires cancelable drag:preview event with item, preview, and list", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];

        const previewSpy = sandbox.spy();
        el.addEventListener("drag:preview", previewSpy);

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        expect(previewSpy).to.have.been.calledOnce;
        const detail = previewSpy.firstCall.args[0].detail;
        expect(detail.item).to.equal(a);
        expect(detail.list).to.equal(el);
        expect(detail.preview).to.be.instanceOf(HTMLElement);
        // Event is cancelable.
        expect(previewSpy.firstCall.args[0].cancelable).to.be.true;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("drag:preview fires before the preview is appended to document.body", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];

        let parentDuringEvent = "<unset>";
        el.addEventListener("drag:preview", (e) => {
            parentDuringEvent = e.detail.preview.parentNode;
        });

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        // Documented contract: the preview is detached when the event fires.
        expect(parentDuringEvent).to.be.null;
        // Once the handler returns without cancelling, the preview is inserted.
        expect(el._dragPreview.parentNode).to.equal(document.body);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("canceling drag:preview suppresses preview creation", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];
        el.addEventListener("drag:preview", (e) => e.preventDefault());

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        expect(el._dragPreview).to.be.null;

        // Position updates should be no-ops when there is no preview.
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 50,
                clientY: 50,
            }),
        );
        await flushFrame();
        expect(el._dragPreview).to.be.null;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("preview position updates on dragover", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 10,
                clientY: 5,
            }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        expect(preview).to.not.be.null;

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 60,
                clientY: 55,
            }),
        );
        await flushFrame();

        // Preview should have been repositioned (left/top are non-empty strings).
        expect(preview.style.left).to.not.equal("");
        expect(preview.style.top).to.not.equal("");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("preview follows document-level dragover when cursor leaves all droplists", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview drag-preview-offset="top-left" animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 10,
                clientY: 10,
            }),
        );
        await flushFrame();
        const preview = el._dragPreview;
        expect(preview).to.not.be.null;

        // Pointer moves over the page background — dispatch on document.body
        // (outside the droplist). The list's own dragover handler does not run,
        // but the document-level listener should still update the preview.
        document.body.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 250,
                clientY: 180,
            }),
        );
        await flushFrame();

        expect(parseFloat(preview.style.left)).to.be.closeTo(250, 1);
        expect(parseFloat(preview.style.top)).to.be.closeTo(180, 1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("document-level dragover listener is detached after drag ends", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 5,
                clientY: 5,
            }),
        );
        await flushFrame();
        expect(el._previewDocAbort).to.not.be.null;

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        expect(el._previewDocAbort).to.be.null;
        expect(el._dragPreview).to.be.null;

        // After teardown, document dragover should be a no-op — the preview
        // stays null and no errors are thrown.
        const positionSpy = sandbox.spy(el, "_positionDragPreview");
        document.body.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 100,
                clientY: 100,
            }),
        );
        await flushFrame();
        expect(positionSpy.called).to.be.false;
    });

    it("preview position offset modes: 'top-left' pins cursor to top-left corner", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview drag-preview-offset="top-left" animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 50,
                clientY: 20,
            }),
        );
        await flushFrame();

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 80,
                clientY: 60,
            }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        expect(parseFloat(preview.style.left)).to.be.closeTo(80, 1);
        expect(parseFloat(preview.style.top)).to.be.closeTo(60, 1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("preview position offset mode 'center' centers preview on cursor", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview drag-preview-offset="center" animation="0" style="display:block">
                <div style="display:block;width:100px;height:40px">A</div>
                <div style="display:block;width:100px;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 50,
                clientY: 20,
            }),
        );
        await flushFrame();

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 80,
                clientY: 60,
            }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        const w = parseFloat(preview.style.width);
        const h = parseFloat(preview.style.height);
        expect(parseFloat(preview.style.left)).to.be.closeTo(80 - w / 2, 1);
        expect(parseFloat(preview.style.top)).to.be.closeTo(60 - h / 2, 1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("preview position 'cursor' scales grab offset by drag-preview-scale", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview drag-preview-scale="0.5" animation="0" style="display:block">
                <div style="display:block;width:100px;height:40px">A</div>
                <div style="display:block;width:100px;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        sandbox.stub(el, "_prefersReducedMotion").returns(false);
        await aTimeout(0);

        const a = el.children[0];
        // Grab at (50, 20) — middle of a 100x40 item.
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 50,
                clientY: 20,
            }),
        );
        await flushFrame();

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 80,
                clientY: 60,
            }),
        );
        await flushFrame();

        // With scale 0.5, the grab offsets (50, 20) collapse to (25, 10) visually.
        const preview = el._dragPreview;
        expect(parseFloat(preview.style.left)).to.be.closeTo(80 - 25, 1);
        expect(parseFloat(preview.style.top)).to.be.closeTo(60 - 10, 1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("preview position 'center' uses scaled dimensions for centering", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview drag-preview-offset="center" drag-preview-scale="0.5" animation="0" style="display:block">
                <div style="display:block;width:100px;height:40px">A</div>
                <div style="display:block;width:100px;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        sandbox.stub(el, "_prefersReducedMotion").returns(false);
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", {
                bubbles: true,
                composed: true,
                clientX: 50,
                clientY: 20,
            }),
        );
        await flushFrame();

        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 80,
                clientY: 60,
            }),
        );
        await flushFrame();

        // Visual size at scale 0.5 is 50x20; centering on (80, 60) lands at (55, 50).
        const preview = el._dragPreview;
        expect(parseFloat(preview.style.left)).to.be.closeTo(80 - 25, 1);
        expect(parseFloat(preview.style.top)).to.be.closeTo(60 - 10, 1);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("nested [slot='drag-preview'] inside an item is not hijacked as the custom preview", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">
                    Outer A
                    <span slot="drag-preview" id="nested-slot">Nested</span>
                </div>
                <div data-id="b">B</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const nested = el.querySelector("#nested-slot");
        const priorDisplay = nested.style.display;

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        // The nested element's display must be untouched (no scoping bug).
        expect(nested.style.display).to.equal(priorDisplay);

        // Preview should clone the dragged item itself (default path), so the
        // nested span is present in the preview as part of the item clone.
        const preview = el._dragPreview;
        expect(preview).to.not.be.null;
        expect(preview.textContent).to.contain("Outer A");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("custom slot='drag-preview' content is cloned into the preview", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div slot="drag-preview" id="slot-node">Custom Preview</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const slotted = el.querySelector('[slot="drag-preview"]');

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        expect(preview).to.not.be.null;
        // The cloned content should be inside the preview.
        expect(preview.querySelector("#slot-node")).to.not.be.null;
        // The original slotted node is hidden.
        expect(slotted.style.display).to.equal("none");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("custom slot node is restored (display reset) after drag ends", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div slot="drag-preview">Custom Preview</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const slotted = el.querySelector('[slot="drag-preview"]');

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();
        expect(slotted.style.display).to.equal("none");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        expect(slotted.style.display).to.equal("");
    });

    it("custom slot node's prior inline display is restored exactly after drag ends", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div slot="drag-preview" style="display:inline-block">Custom Preview</div>
            </y-droplist>
        `);
        const a = el.children[0];
        const slotted = el.querySelector('[slot="drag-preview"]');
        expect(slotted.style.display).to.equal("inline-block");

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();
        expect(slotted.style.display).to.equal("none");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        expect(slotted.style.display).to.equal("inline-block");
    });

    it("custom slot node's '!important' display priority is preserved after drag ends", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div slot="drag-preview">Custom Preview</div>
            </y-droplist>
        `);
        const slotted = el.querySelector('[slot="drag-preview"]');
        slotted.style.setProperty("display", "flex", "important");
        const a = el.children[0];

        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        expect(slotted.style.getPropertyValue("display")).to.equal("flex");
        expect(slotted.style.getPropertyPriority("display")).to.equal(
            "important",
        );
    });

    it("custom slot node's prior display is restored when 'drag:preview' is cancelled", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
                <div slot="drag-preview" style="display:inline-block">Custom Preview</div>
            </y-droplist>
        `);
        const slotted = el.querySelector('[slot="drag-preview"]');
        el.addEventListener("drag:preview", (e) => e.preventDefault());

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        // Cancellation prevents preview creation; slotted node must be restored
        // to its original inline display value.
        expect(el._dragPreview).to.be.null;
        expect(slotted.style.display).to.equal("inline-block");

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
    });

    it("preview is removed when the element disconnects", async () => {
        const el = await fixture(html`
            <y-droplist drag-preview animation="0">
                <div data-id="a">A</div>
            </y-droplist>
        `);
        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        await flushFrame();

        const preview = el._dragPreview;
        expect(document.body.contains(preview)).to.be.true;

        el.remove();
        expect(document.body.contains(preview)).to.be.false;
    });

    it("force-float ghost and drag-preview coexist independently", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview force-float animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];
        a.dispatchEvent(
            new DragEvent("dragstart", { bubbles: true, composed: true }),
        );
        el.dispatchEvent(
            new DragEvent("dragover", {
                bubbles: true,
                composed: true,
                cancelable: true,
                clientX: 50,
                clientY: 30,
            }),
        );
        await flushFrame();

        // Both ghost (force-float) and drag-preview should exist in body.
        const preview = el._dragPreview;
        const ghost = el._ghost;
        expect(preview).to.not.be.null;
        expect(ghost).to.not.be.null;
        expect(document.body.contains(preview)).to.be.true;
        expect(document.body.contains(ghost)).to.be.true;
        // They are distinct elements.
        expect(preview).to.not.equal(ghost);

        a.dispatchEvent(
            new DragEvent("dragend", { bubbles: true, composed: true }),
        );
        wrapper.remove();
    });

    it("touch drag creates and removes preview via pointer pipeline", async () => {
        const wrapper = document.createElement("div");
        Object.assign(wrapper.style, {
            position: "fixed",
            top: "0px",
            left: "0px",
            width: "200px",
        });
        document.body.appendChild(wrapper);
        wrapper.innerHTML = `
            <y-droplist drag-preview animation="0" style="display:block">
                <div style="display:block;height:40px">A</div>
                <div style="display:block;height:40px">B</div>
            </y-droplist>
        `;
        await customElements.whenDefined("y-droplist");
        const el = wrapper.querySelector("y-droplist");
        await aTimeout(0);

        const a = el.children[0];

        // Simulate touch pointer sequence.
        a.dispatchEvent(
            new PointerEvent("pointerdown", {
                bubbles: true,
                composed: true,
                pointerId: 1,
                pointerType: "touch",
                clientX: 20,
                clientY: 10,
            }),
        );
        await flushFrame();

        // Preview should exist after drag start.
        expect(el._dragPreview).to.not.be.null;
        expect(document.body.contains(el._dragPreview)).to.be.true;

        // Simulate pointer up to end the drag.
        a.dispatchEvent(
            new PointerEvent("pointerup", {
                bubbles: true,
                composed: true,
                pointerId: 1,
                pointerType: "touch",
                clientX: 20,
                clientY: 10,
            }),
        );
        await flushFrame();

        expect(el._dragPreview).to.be.null;
        wrapper.remove();
    });
});
