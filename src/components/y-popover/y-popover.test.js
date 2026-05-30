import { html, fixture, expect, aTimeout } from "@open-wc/testing";
import sinon from "sinon";
import "./y-popover.js";

const surfaceSel = "[part='surface']";
const pointerSel = "[part='pointer']";

async function makeAnchorAndPopover(extraAttrs = {}) {
    const wrap = await fixture(html`
        <div style="padding:80px">
            <button id="anchor-btn" style="padding:8px 16px">Anchor</button>
            <y-popover anchor="anchor-btn" text="Hello"></y-popover>
        </div>
    `);
    const popover = wrap.querySelector("y-popover");
    for (const [name, value] of Object.entries(extraAttrs)) {
        if (value === true) popover.setAttribute(name, "");
        else if (value === false) popover.removeAttribute(name);
        else popover.setAttribute(name, String(value));
    }
    return {
        wrap,
        anchor: wrap.querySelector("#anchor-btn"),
        popover,
    };
}

describe("YumePopover", () => {
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });
    afterEach(() => {
        sandbox.restore();
        // Defensive teardown — fixture's auto-cleanup leaves window listeners
        // installed by an open popover if the test forgot to close it.
        for (const node of document.querySelectorAll("y-popover")) {
            if (node.open) node.hide("api");
            node.remove();
        }
    });

    // ── Construction / defaults ────────────────────────────────────────

    it("constructs with sensible defaults", async () => {
        const el = await fixture(html`<y-popover></y-popover>`);
        expect(el.open).to.equal(false);
        expect(el.position).to.equal("auto");
        expect(el.color).to.equal("base");
        expect(el.size).to.equal("medium");
        expect(el.offset).to.equal(8);
        expect(el.pointer).to.equal(true);
        expect(el.trigger).to.equal("manual");
        expect(el.delayShow).to.equal(0);
        expect(el.delayHide).to.equal(0);
        expect(el.closeOnEscape).to.equal(true);
        expect(el.closeOnOutsideClick).to.equal(true);
        expect(el.closeOnAnchorClick).to.equal(false);
    });

    it("renders a surface and a pointer in the shadow root", async () => {
        const el = await fixture(html`<y-popover></y-popover>`);
        const surface = el.shadowRoot.querySelector(surfaceSel);
        const pointer = el.shadowRoot.querySelector(pointerSel);
        expect(surface).to.exist;
        expect(pointer).to.exist;
        expect(surface.hidden).to.equal(true);
    });

    // ── Anchor resolution ──────────────────────────────────────────────

    it("resolves an anchor by id attribute", async () => {
        const { popover, anchor } = await makeAnchorAndPopover();
        expect(popover._anchorEl).to.equal(anchor);
    });

    it("resolves an anchor by CSS selector", async () => {
        const wrap = await fixture(html`
            <div>
                <button class="my-anchor">Anchor</button>
                <y-popover anchor=".my-anchor" text="x"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        expect(popover._anchorEl).to.equal(wrap.querySelector(".my-anchor"));
    });

    it("resolves the slotted [slot='trigger'] child when no anchor is set", async () => {
        const wrap = await fixture(html`
            <y-popover text="x">
                <button slot="trigger">click me</button>
            </y-popover>
        `);
        await aTimeout(0);
        const slottedTrigger = wrap.querySelector('[slot="trigger"]');
        expect(wrap._anchorEl).to.equal(slottedTrigger);
    });

    it("accepts an Element on the anchor property", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="dynamic">x</button>
                <y-popover text="x"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        popover.anchor = wrap.querySelector("#dynamic");
        expect(popover._anchorEl).to.equal(wrap.querySelector("#dynamic"));
    });

    it("dispatches popover-anchor-change when the anchor changes", async () => {
        const { popover, wrap } = await makeAnchorAndPopover();
        // Add a second anchor so we can rotate.
        const other = document.createElement("button");
        other.id = "other-anchor";
        wrap.appendChild(other);

        const handler = sandbox.stub();
        popover.addEventListener("popover-anchor-change", handler);
        popover.setAnchor(other);
        expect(handler.calledOnce).to.equal(true);
        expect(handler.firstCall.args[0].detail.to).to.equal(other);
    });

    // ── show() / hide() / events ───────────────────────────────────────

    it("opens via show() and positions the surface", async () => {
        const { popover } = await makeAnchorAndPopover();
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        expect(popover.open).to.equal(true);
        expect(surface.hidden).to.equal(false);
        expect(surface.style.top).to.not.equal("");
        expect(surface.style.left).to.not.equal("");
    });

    it("hides via hide() and clears the surface", async () => {
        const { popover } = await makeAnchorAndPopover();
        await popover.show();
        await popover.hide();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        expect(popover.open).to.equal(false);
        expect(surface.hidden).to.equal(true);
    });

    it("fires popover-open then popover-opened on show()", async () => {
        const { popover } = await makeAnchorAndPopover();
        const beforeOpen = sandbox.stub();
        const opened = sandbox.stub();
        popover.addEventListener("popover-open", beforeOpen);
        popover.addEventListener("popover-opened", opened);
        await popover.show();
        expect(beforeOpen.calledOnce).to.equal(true);
        expect(opened.calledOnce).to.equal(true);
    });

    it("popover-open is cancelable", async () => {
        const { popover } = await makeAnchorAndPopover();
        popover.addEventListener("popover-open", (e) => e.preventDefault());
        const result = await popover.show();
        expect(result).to.equal(false);
        expect(popover.open).to.equal(false);
    });

    it("popover-close is cancelable", async () => {
        const { popover } = await makeAnchorAndPopover();
        await popover.show();
        popover.addEventListener("popover-close", (e) => e.preventDefault());
        const result = await popover.hide("user");
        expect(result).to.equal(false);
        expect(popover.open).to.equal(true);
    });

    it("toggle() flips state", async () => {
        const { popover } = await makeAnchorAndPopover();
        await popover.toggle();
        expect(popover.open).to.equal(true);
        await popover.toggle();
        expect(popover.open).to.equal(false);
    });

    it("disabled prevents show()", async () => {
        const { popover } = await makeAnchorAndPopover({ disabled: true });
        const result = await popover.show();
        expect(result).to.equal(false);
        expect(popover.open).to.equal(false);
    });

    // ── Positioning / pointer ──────────────────────────────────────────

    it("places the surface above the anchor for position='top'", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            position: "top",
        });
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        const surfaceRect = surface.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        // Surface bottom should sit above the anchor's top minus the offset.
        expect(surfaceRect.bottom).to.be.lessThan(anchorRect.top);
    });

    it("places the surface below the anchor for position='bottom'", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            position: "bottom",
        });
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        const surfaceRect = surface.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        expect(surfaceRect.top).to.be.greaterThan(anchorRect.bottom - 1);
    });

    it("sets pointer data-side to match the resolved side", async () => {
        const { popover } = await makeAnchorAndPopover({ position: "bottom" });
        await popover.show();
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.dataset.side).to.equal("bottom");
        expect(pointer.hidden).to.equal(false);
    });

    it("hides the pointer when pointer='false'", async () => {
        const { popover } = await makeAnchorAndPopover({
            position: "bottom",
            pointer: "false",
        });
        await popover.show();
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.hidden).to.equal(true);
    });

    it("hides the pointer and centers when no anchor resolves", async () => {
        const popover = await fixture(html`<y-popover text="hi"></y-popover>`);
        await popover.show();
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.hidden).to.equal(true);
    });

    // ── ARIA wiring ────────────────────────────────────────────────────

    it("links aria-describedby on the anchor while open", async () => {
        const { popover, anchor } = await makeAnchorAndPopover();
        await popover.show();
        const surfaceId = popover.shadowRoot.querySelector(surfaceSel).id;
        expect(anchor.getAttribute("aria-describedby")).to.equal(surfaceId);

        await popover.hide();
        expect(anchor.hasAttribute("aria-describedby")).to.equal(false);
    });

    it("renders the `text` attribute via the default slot fallback", async () => {
        const el = await fixture(
            html`<y-popover text="Hello world"></y-popover>`,
        );
        const fallback = el.shadowRoot.querySelector(".text-fallback");
        expect(fallback.textContent).to.equal("Hello world");
    });

    // ── Trigger: click ─────────────────────────────────────────────────

    it("opens on anchor click when trigger='click'", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "click",
        });
        anchor.click();
        // show() is async — let popover-opened settle.
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("does not close on a second anchor click by default", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "click",
        });
        anchor.click();
        await aTimeout(0);
        anchor.click();
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("closes on a second anchor click when close-on-anchor-click is set", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "click",
            "close-on-anchor-click": true,
        });
        anchor.click();
        await aTimeout(0);
        anchor.click();
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    // ── Trigger: hover ─────────────────────────────────────────────────

    it("opens on mouseenter when trigger='hover'", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "hover",
        });
        anchor.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("hides on mouseleave when trigger='hover'", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "hover",
        });
        anchor.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(0);
        anchor.dispatchEvent(new MouseEvent("mouseleave"));
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    it("respects delay-show before opening on hover", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "hover",
            "delay-show": 30,
        });
        anchor.dispatchEvent(new MouseEvent("mouseenter"));
        // Synchronous: timer is queued but hasn't fired.
        expect(popover.open).to.equal(false);
        await aTimeout(50);
        expect(popover.open).to.equal(true);
    });

    it("respects delay-hide before closing on hover-out", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "hover",
            "delay-hide": 40,
        });
        anchor.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(0);
        expect(popover.open).to.equal(true);
        anchor.dispatchEvent(new MouseEvent("mouseleave"));
        // Still open within the delay window.
        await aTimeout(10);
        expect(popover.open).to.equal(true);
        await aTimeout(60);
        expect(popover.open).to.equal(false);
    });

    it("keeps open when mouse moves from anchor into the surface", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "hover",
            "delay-hide": 30,
        });
        anchor.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(0);
        anchor.dispatchEvent(new MouseEvent("mouseleave"));
        // Mouse arrives on the surface within the hide window.
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        surface.dispatchEvent(new MouseEvent("mouseenter"));
        await aTimeout(60);
        expect(popover.open).to.equal(true);
    });

    // ── Trigger: focus ─────────────────────────────────────────────────

    it("opens on anchor focus when trigger='focus'", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "focus",
        });
        anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("closes on anchor blur when relatedTarget is outside the popover", async () => {
        const { popover, anchor, wrap } = await makeAnchorAndPopover({
            trigger: "focus",
        });
        anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
        await aTimeout(0);
        const elsewhere = document.createElement("button");
        wrap.appendChild(elsewhere);
        anchor.dispatchEvent(
            new FocusEvent("focusout", {
                bubbles: true,
                relatedTarget: elsewhere,
            }),
        );
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    // ── Trigger: context-menu ──────────────────────────────────────────

    it("opens on contextmenu and suppresses the native menu", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "context-menu",
        });
        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            cancelable: true,
        });
        anchor.dispatchEvent(event);
        await aTimeout(0);
        expect(popover.open).to.equal(true);
        expect(event.defaultPrevented).to.equal(true);
    });

    // ── Document-level close paths ─────────────────────────────────────

    it("closes on Escape when close-on-escape is on (default)", async () => {
        const { popover } = await makeAnchorAndPopover();
        await popover.show();
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    it("does not close on Escape when close-on-escape='false'", async () => {
        const { popover } = await makeAnchorAndPopover({
            "close-on-escape": "false",
        });
        await popover.show();
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("closes on outside click when close-on-outside-click is on (default)", async () => {
        const { popover, wrap } = await makeAnchorAndPopover();
        await popover.show();
        const elsewhere = document.createElement("div");
        wrap.appendChild(elsewhere);
        elsewhere.click();
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    it("does not close when the click is on the anchor", async () => {
        const { popover, anchor } = await makeAnchorAndPopover();
        await popover.show();
        anchor.click();
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("does not close when the click is inside the popover body", async () => {
        const wrap = await fixture(html`
            <div style="padding:80px">
                <button id="anchor-btn">A</button>
                <y-popover anchor="anchor-btn">
                    <button id="inside-btn">Inside</button>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        wrap.querySelector("#inside-btn").click();
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    // ── Trigger detach on re-attach ────────────────────────────────────

    it("detaches old anchor listeners when the anchor changes", async () => {
        const { popover, anchor, wrap } = await makeAnchorAndPopover({
            trigger: "click",
        });
        const other = document.createElement("button");
        other.id = "other-anchor";
        wrap.appendChild(other);

        popover.setAnchor(other);
        // Clicking the old anchor should be inert now.
        anchor.click();
        await aTimeout(0);
        expect(popover.open).to.equal(false);
        other.click();
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    // ── Declarative open ───────────────────────────────────────────────

    it("opens cleanly when the `open` attribute is set declaratively", async () => {
        const wrap = await fixture(html`
            <div style="padding:80px">
                <button id="decl-anchor">A</button>
                <y-popover anchor="decl-anchor" open text="declared"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        // connectedCallback defers the open via rAF; wait two frames so the
        // popover-opened dispatch settles.
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));
        expect(popover.open).to.equal(true);
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        expect(surface.hidden).to.equal(false);
    });

    // ── Disabled gating ────────────────────────────────────────────────

    it("disabled inerts trigger listeners", async () => {
        const { popover, anchor } = await makeAnchorAndPopover({
            trigger: "click",
            disabled: true,
        });
        anchor.click();
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    // ── Auto-flip + collision ──────────────────────────────────────────

    it("flips position='bottom' to top when there is no room below", async () => {
        // Push the anchor near the viewport bottom so a bottom-placed popover
        // can't fit. We measure the actual inner-iframe viewport height so
        // the test stays accurate regardless of test-runner size.
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="flip-anchor"
                    style="position:fixed;bottom:8px;left:200px;padding:8px 16px"
                >Anchor</button>
                <y-popover anchor="flip-anchor" position="bottom" text="content"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        const opened = await popover.show();
        expect(opened).to.equal(true);
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        const sRect = surface.getBoundingClientRect();
        const anchor = document.getElementById("flip-anchor");
        const aRect = anchor.getBoundingClientRect();
        // Popover should now sit ABOVE the anchor — flipped.
        expect(sRect.bottom).to.be.lessThan(aRect.top + 1);
        // Pointer side reflects the flipped placement.
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.dataset.side).to.equal("top");
    });

    it("flips position='top' to bottom when there is no room above", async () => {
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="flip-anchor-top"
                    style="position:fixed;top:4px;left:200px;padding:8px 16px"
                >Anchor</button>
                <y-popover anchor="flip-anchor-top" position="top" text="content"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        const aRect = document.getElementById("flip-anchor-top").getBoundingClientRect();
        const sRect = surface.getBoundingClientRect();
        expect(sRect.top).to.be.greaterThan(aRect.bottom - 1);
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.dataset.side).to.equal("bottom");
    });

    it("auto position picks bottom when there is room below", async () => {
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="auto-anchor-top"
                    style="position:fixed;top:80px;left:200px;padding:8px 16px"
                >Anchor</button>
                <y-popover anchor="auto-anchor-top" position="auto" text="content"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.dataset.side).to.equal("bottom");
    });

    it("auto position falls to top when only space above exists", async () => {
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="auto-anchor-bottom"
                    style="position:fixed;bottom:8px;left:200px;padding:8px 16px"
                >Anchor</button>
                <y-popover anchor="auto-anchor-bottom" position="auto" text="content"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        // Bottom didn't fit; the cascade falls through to top next.
        expect(pointer.dataset.side).to.equal("top");
    });

    it("preserves alignment when an aligned variant flips on the main axis", async () => {
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="aligned-flip-anchor"
                    style="position:fixed;bottom:8px;left:200px;padding:8px 16px;width:200px"
                >Anchor</button>
                <y-popover
                    anchor="aligned-flip-anchor"
                    position="bottom-start"
                    text="aligned content"
                ></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        const sRect = surface.getBoundingClientRect();
        const aRect = document
            .getElementById("aligned-flip-anchor")
            .getBoundingClientRect();
        // Flipped to top (main-axis flip), alignment "start" preserved →
        // surface's left edge aligns with anchor's left edge.
        expect(sRect.bottom).to.be.lessThan(aRect.top + 1);
        expect(Math.abs(sRect.left - aRect.left)).to.be.lessThan(1.5);
    });

    it("hides the pointer when no candidate side fits", async () => {
        // Make the popover larger than the viewport in both dimensions so
        // nothing can fit; computePosition picks the best-fit candidate and
        // updatePosition hides the pointer.
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="nofit-anchor"
                    style="position:fixed;top:100px;left:100px;padding:8px 16px"
                >Anchor</button>
                <y-popover anchor="nofit-anchor" position="bottom">
                    <div style="width:5000px;height:5000px">big body</div>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        const pointer = popover.shadowRoot.querySelector(pointerSel);
        expect(pointer.hidden).to.equal(true);
    });

    it("popover-opened detail reflects the flipped side", async () => {
        const wrap = await fixture(html`
            <div style="position:relative">
                <button
                    id="event-flip-anchor"
                    style="position:fixed;bottom:8px;left:200px;padding:8px 16px"
                >Anchor</button>
                <y-popover anchor="event-flip-anchor" position="bottom" text="x"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        const opened = new Promise((resolve) =>
            popover.addEventListener("popover-opened", resolve, { once: true }),
        );
        await popover.show();
        const event = await opened;
        expect(event.detail.position).to.equal("top");
    });

    // ── Modal mode ─────────────────────────────────────────────────────

    it("applies role=dialog + aria-modal=true when modal", async () => {
        const { popover } = await makeAnchorAndPopover({ modal: true });
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        expect(surface.getAttribute("role")).to.equal("dialog");
        expect(surface.getAttribute("aria-modal")).to.equal("true");
    });

    it("keeps role=tooltip and omits aria-modal in non-modal mode", async () => {
        const { popover } = await makeAnchorAndPopover();
        await popover.show();
        const surface = popover.shadowRoot.querySelector(surfaceSel);
        expect(surface.getAttribute("role")).to.equal("tooltip");
        expect(surface.hasAttribute("aria-modal")).to.equal(false);
    });

    it("shows the backdrop by default when modal", async () => {
        const { popover } = await makeAnchorAndPopover({ modal: true });
        await popover.show();
        const backdrop = popover.shadowRoot.querySelector("[part='backdrop']");
        expect(backdrop.hidden).to.equal(false);
    });

    it("opts out of the backdrop when modal + show-backdrop='false'", async () => {
        const { popover } = await makeAnchorAndPopover({
            modal: true,
            "show-backdrop": "false",
        });
        await popover.show();
        const backdrop = popover.shadowRoot.querySelector("[part='backdrop']");
        expect(backdrop.hidden).to.equal(true);
    });

    it("renders the backdrop on a non-modal popover when show-backdrop is set", async () => {
        const { popover } = await makeAnchorAndPopover({
            "show-backdrop": true,
        });
        await popover.show();
        const backdrop = popover.shadowRoot.querySelector("[part='backdrop']");
        expect(backdrop.hidden).to.equal(false);
    });

    it("clicking the backdrop closes with reason='outside'", async () => {
        const { popover } = await makeAnchorAndPopover({ modal: true });
        await popover.show();
        const reason = new Promise((resolve) =>
            popover.addEventListener(
                "popover-closed",
                (e) => resolve(e.detail.reason),
                { once: true },
            ),
        );
        popover.shadowRoot.querySelector("[part='backdrop']").click();
        const r = await reason;
        expect(r).to.equal("outside");
    });

    it("Escape always closes modal even when close-on-escape='false'", async () => {
        const { popover } = await makeAnchorAndPopover({
            modal: true,
            "close-on-escape": "false",
        });
        await popover.show();
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        await aTimeout(0);
        expect(popover.open).to.equal(false);
    });

    // ── Focus management ──────────────────────────────────────────────

    it("focuses the first focusable inside the popover when modal opens", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="focus-anchor">Anchor</button>
                <y-popover anchor="focus-anchor" modal>
                    <button id="modal-action-1">Action 1</button>
                    <button id="modal-action-2">Action 2</button>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        await aTimeout(0);
        expect(document.activeElement.id).to.equal("modal-action-1");
    });

    it("restores focus to the previously-active element after modal closes", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="restore-anchor">Anchor</button>
                <y-popover anchor="restore-anchor" modal>
                    <button id="modal-action">Action</button>
                </y-popover>
            </div>
        `);
        const anchor = wrap.querySelector("#restore-anchor");
        anchor.focus();
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        await aTimeout(0);
        await popover.hide();
        await aTimeout(0);
        expect(document.activeElement).to.equal(anchor);
    });

    it("traps Tab inside the popover when modal", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="outside-before">before</button>
                <button id="trap-anchor">Anchor</button>
                <y-popover anchor="trap-anchor" modal>
                    <button id="trap-first">First</button>
                    <button id="trap-last">Last</button>
                </y-popover>
                <button id="outside-after">after</button>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        await aTimeout(0);
        // Focus is on first action; Shift+Tab from first cycles to last.
        wrap.querySelector("#trap-first").focus();
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                shiftKey: true,
                bubbles: true,
                cancelable: true,
            }),
        );
        await aTimeout(0);
        expect(document.activeElement.id).to.equal("trap-last");
        // Tab from last cycles to first.
        document.dispatchEvent(
            new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true,
            }),
        );
        await aTimeout(0);
        expect(document.activeElement.id).to.equal("trap-first");
    });

    // ── Portal ─────────────────────────────────────────────────────────

    it("moves the surface to document.body when portaled", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="portal-anchor">Anchor</button>
                <y-popover anchor="portal-anchor" portal text="content"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        const portal = document.body.querySelector(".y-popover-portal");
        expect(portal).to.exist;
        expect(portal.shadowRoot.querySelector(surfaceSel)).to.exist;
    });

    it("moves slotted body children into the portal so slots compose them", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="portal-body-anchor">Anchor</button>
                <y-popover anchor="portal-body-anchor" portal>
                    <button id="portal-body-button">Inside</button>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        const inside = wrap.querySelector("#portal-body-button");
        await popover.show();
        const portal = document.body.querySelector(".y-popover-portal");
        expect(portal.contains(inside)).to.equal(true);
        expect(popover.contains(inside)).to.equal(false);
    });

    it("returns the surface and children back when the portal closes", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="portal-restore-anchor">Anchor</button>
                <y-popover anchor="portal-restore-anchor" portal>
                    <button id="portal-restore-child">Inside</button>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        const inside = wrap.querySelector("#portal-restore-child");
        await popover.show();
        await popover.hide();
        expect(document.body.querySelector(".y-popover-portal")).to.equal(null);
        expect(popover.contains(inside)).to.equal(true);
        expect(popover.shadowRoot.querySelector(surfaceSel)).to.exist;
    });

    it("preserves outside-click detection for clicks inside a portaled popover", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="portal-oc-anchor">Anchor</button>
                <y-popover anchor="portal-oc-anchor" portal>
                    <button id="portal-oc-inside">Inside</button>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        // Click on the slotted child (now inside the portal) — should NOT close.
        document.getElementById("portal-oc-inside").click();
        await aTimeout(0);
        expect(popover.open).to.equal(true);
    });

    it("focuses the first slotted focusable when modal + portal", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="portal-modal-anchor">Anchor</button>
                <y-popover anchor="portal-modal-anchor" modal portal>
                    <button id="portal-modal-first">Confirm</button>
                </y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        await aTimeout(0);
        expect(document.activeElement.id).to.equal("portal-modal-first");
    });

    it("toggling portal while open activates/deactivates the portal", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="portal-toggle-anchor">Anchor</button>
                <y-popover anchor="portal-toggle-anchor" text="hi"></y-popover>
            </div>
        `);
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        expect(document.body.querySelector(".y-popover-portal")).to.equal(null);

        popover.setAttribute("portal", "");
        await aTimeout(0);
        expect(document.body.querySelector(".y-popover-portal")).to.exist;

        popover.removeAttribute("portal");
        await aTimeout(0);
        expect(document.body.querySelector(".y-popover-portal")).to.equal(null);
    });

    // ── End portal ─────────────────────────────────────────────────────

    it("does not move focus on open when non-modal", async () => {
        const wrap = await fixture(html`
            <div>
                <button id="nonmodal-keep">Keep me focused</button>
                <button id="nonmodal-anchor">Anchor</button>
                <y-popover anchor="nonmodal-anchor">
                    <button id="nonmodal-action">Action</button>
                </y-popover>
            </div>
        `);
        const keep = wrap.querySelector("#nonmodal-keep");
        keep.focus();
        const popover = wrap.querySelector("y-popover");
        await popover.show();
        await aTimeout(0);
        expect(document.activeElement).to.equal(keep);
    });
});
