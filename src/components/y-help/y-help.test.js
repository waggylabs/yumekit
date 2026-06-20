import { html, fixture, expect, oneEvent, aTimeout } from "@open-wc/testing";
import "./y-help.js";

// Helper: render an element with a couple of target buttons in document.body
// so the tour has things to highlight. Returns the y-help element.
async function setupTour(steps, attrs = {}) {
    const container = document.createElement("div");
    container.innerHTML = `
        <button id="btn-a">A</button>
        <button id="btn-b">B</button>
        <button id="btn-c">C</button>
    `;
    document.body.appendChild(container);

    const help = document.createElement("y-help");
    for (const [k, v] of Object.entries(attrs)) {
        if (v === true) help.setAttribute(k, "");
        else if (v === false) help.setAttribute(k, "false");
        else help.setAttribute(k, String(v));
    }
    help.steps = steps;
    document.body.appendChild(help);

    return { help, container };
}

async function teardown(help, container) {
    if (help.open) help.close();
    if (container && container.parentNode) container.parentNode.removeChild(container);
    if (help.parentNode) help.parentNode.removeChild(help);
    await aTimeout(0);
}

function getPortal() {
    return document.querySelector(".y-help-root");
}

function getTooltip() {
    const portal = getPortal();
    return portal && portal.querySelector(".y-help-tooltip");
}

// The tooltip surface and pointer live in the inner <y-popover>'s shadow
// root since y-help delegates the visual chrome to y-popover.
function getTooltipSurface() {
    const popover = getTooltip();
    return popover && popover.shadowRoot.querySelector("[part='surface']");
}

function getTooltipPointer() {
    const popover = getTooltip();
    return popover && popover.shadowRoot.querySelector("[part='pointer']");
}

describe("YumeHelp", () => {
    // Aggressively clean up any leftover state between tests so a failing
    // assertion in one test doesn't leave portals or helpers in body that
    // confuse the next test.
    afterEach(() => {
        for (const node of document.querySelectorAll(".y-help-root")) {
            node.remove();
        }
        for (const node of document.querySelectorAll("y-help")) {
            node.remove();
        }
        for (const id of ["btn-a", "btn-b", "btn-c"]) {
            const el = document.getElementById(id);
            if (el && el.parentElement) {
                // Remove the parent container that wraps these buttons.
                const parent = el.closest("body > div");
                if (parent) parent.remove();
            }
        }
    });

    // ── Construction / steps parsing ──────────────────────────────────

    it("constructs with empty steps", async () => {
        const el = await fixture(html`<y-help></y-help>`);
        expect(el.steps).to.deep.equal([]);
    });

    it("accepts steps as a property (Array)", async () => {
        const el = await fixture(html`<y-help></y-help>`);
        el.steps = [{ content: "hi" }];
        expect(el.steps.length).to.equal(1);
        expect(el.steps[0].content).to.equal("hi");
    });

    it("accepts steps as a JSON string attribute", async () => {
        const el = await fixture(
            html`<y-help steps='[{"content":"hi"}]'></y-help>`,
        );
        expect(el.steps.length).to.equal(1);
    });

    it("returns [] for malformed JSON in the steps attribute", async () => {
        const el = await fixture(html`<y-help steps="{not-json}"></y-help>`);
        expect(el.steps).to.deep.equal([]);
    });

    // ── start() / open / portaling ────────────────────────────────────

    it("start() portals the overlay + tooltip to document.body", async () => {
        const { help, container } = await setupTour([
            { target: "btn-a", content: "first" },
        ]);
        help.start();
        await aTimeout(0);
        expect(getPortal()).to.exist;
        expect(getTooltip()).to.exist;
        expect(help.open).to.be.true;
        await teardown(help, container);
    });

    it("mounts the overlay into the nearest <y-theme> so it inherits the theme", async () => {
        // Theme variables are scoped to the <y-theme> subtree, so the portal
        // must stay inside it rather than landing on document.body.
        const theme = document.createElement("y-theme");
        document.body.appendChild(theme);
        const help = document.createElement("y-help");
        help.steps = [{ content: "themed" }];
        theme.appendChild(help);

        help.start();
        await aTimeout(0);

        const portal = getPortal();
        expect(portal).to.exist;
        expect(portal.parentNode).to.equal(theme);

        help.close();
        await aTimeout(0);
        theme.remove();
    });

    it("start() does nothing when there are no steps", async () => {
        const { help, container } = await setupTour([]);
        help.start();
        await aTimeout(0);
        expect(getPortal()).to.equal(null);
        expect(help.open).to.be.false;
        await teardown(help, container);
    });

    it("close() removes the portaled root", async () => {
        const { help, container } = await setupTour([
            { content: "hi" },
        ]);
        help.start();
        await aTimeout(0);
        help.close();
        await aTimeout(0);
        expect(getPortal()).to.equal(null);
        expect(help.open).to.be.false;
        await teardown(help, container);
    });

    it("setting open attribute starts the tour", async () => {
        const { help, container } = await setupTour([{ content: "x" }]);
        help.setAttribute("open", "");
        await aTimeout(0);
        expect(getPortal()).to.exist;
        await teardown(help, container);
    });

    // ── Step rendering ────────────────────────────────────────────────

    it("renders the step title and content as text", async () => {
        const { help, container } = await setupTour([
            { title: "Hello", content: "Welcome aboard" },
        ]);
        help.start();
        await aTimeout(0);
        const portal = getPortal();
        expect(portal.querySelector(".y-help-tooltip-title").textContent).to.equal("Hello");
        expect(portal.querySelector(".y-help-tooltip-content").textContent).to.equal(
            "Welcome aboard",
        );
        await teardown(help, container);
    });

    it("renders the visible highlight outlines on top of the dim", async () => {
        // The outlines are <rect class="y-help-highlight"> drawn directly
        // into the SVG (not inside the <mask>), so they sit on top of the
        // dim and the consumer-facing `highlight` part targets them.
        const { help, container } = await setupTour([
            { target: ["btn-a", "btn-b"], content: "two" },
        ]);
        help.start();
        await aTimeout(0);
        const svg = getPortal().querySelector(".y-help-overlay-svg");
        const visibleOutlines = svg.querySelectorAll(
            ":scope > .y-help-highlight",
        );
        expect(visibleOutlines.length).to.equal(2);
        // Each outline is also exposed as the `highlight` part for styling.
        for (const o of visibleOutlines) {
            expect(o.getAttribute("part")).to.equal("highlight");
        }
        // Mask cutouts (inside <mask>) drive the see-through, the visible
        // outlines are stroked separately on top.
        const maskCutouts = svg.querySelectorAll("mask > rect");
        // 1 white base + 2 cutouts = 3
        expect(maskCutouts.length).to.equal(3);
        await teardown(help, container);
    });

    it("renders one highlight cutout per resolved target", async () => {
        const { help, container } = await setupTour([
            { target: ["btn-a", "btn-b"], content: "two" },
        ]);
        help.start();
        await aTimeout(0);
        const portal = getPortal();
        const cutouts = portal.querySelectorAll(".y-help-highlight");
        expect(cutouts.length).to.equal(2);
        await teardown(help, container);
    });

    it("renders no cutouts (centered tooltip) when no targets resolve", async () => {
        const { help, container } = await setupTour([
            { target: "does-not-exist", content: "lost" },
        ]);
        help.start();
        await aTimeout(0);
        const portal = getPortal();
        const cutouts = portal.querySelectorAll(".y-help-highlight");
        expect(cutouts.length).to.equal(0);
        expect(getTooltipPointer().hidden).to.be.true;
        await teardown(help, container);
    });

    it("renders the 'N of M' progress label", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
            { content: "c" },
        ]);
        help.start();
        help.goto(1);
        await aTimeout(0);
        const portal = getPortal();
        expect(portal.querySelector(".y-help-tooltip-progress").textContent).to.equal(
            "2 of 3",
        );
        await teardown(help, container);
    });

    it("hides the progress label when show-progress=false", async () => {
        const { help, container } = await setupTour(
            [{ content: "a" }, { content: "b" }],
            { "show-progress": false },
        );
        help.start();
        await aTimeout(0);
        const portal = getPortal();
        expect(portal.querySelector(".y-help-tooltip-progress").hidden).to.be.true;
        await teardown(help, container);
    });

    it("hides overlay arrows when show-arrows=false", async () => {
        const { help, container } = await setupTour([{ content: "a" }], {
            "show-arrows": false,
        });
        help.start();
        await aTimeout(0);
        const portal = getPortal();
        expect(portal.querySelector(".y-help-nav-arrows").hidden).to.be.true;
        await teardown(help, container);
    });

    // ── Navigation ────────────────────────────────────────────────────

    it("next() advances the step index", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        await aTimeout(0);
        help.next();
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("1");
        await teardown(help, container);
    });

    it("prev() returns to the previous step", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        help.next();
        await aTimeout(0);
        help.prev();
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("0");
        await teardown(help, container);
    });

    it("goto(n) jumps directly to a step", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
            { content: "c" },
        ]);
        help.start();
        await aTimeout(0);
        help.goto(2);
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("2");
        await teardown(help, container);
    });

    it("prev() on the first step is a no-op", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        await aTimeout(0);
        help.prev();
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("0");
        await teardown(help, container);
    });

    it("next() past the last step closes the tour by default", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        help.next();
        await aTimeout(0);
        help.next();
        await aTimeout(0);
        expect(help.open).to.be.false;
        expect(getPortal()).to.equal(null);
        await teardown(help, container);
    });

    it("loop=true wraps around at the last step", async () => {
        const { help, container } = await setupTour(
            [{ content: "a" }, { content: "b" }],
            { loop: true },
        );
        help.start();
        help.next();
        await aTimeout(0);
        help.next();
        await aTimeout(0);
        expect(help.open).to.be.true;
        expect(help.getAttribute("index")).to.equal("0");
        await teardown(help, container);
    });

    // ── Events ────────────────────────────────────────────────────────

    it("fires y-help-open before mounting (cancelable)", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        const ev = oneEvent(help, "y-help-open");
        help.start();
        const { detail } = await ev;
        expect(detail.index).to.equal(0);
        await teardown(help, container);
    });

    it("preventDefault on y-help-open blocks the tour from starting", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        help.addEventListener("y-help-open", (e) => e.preventDefault(), {
            once: true,
        });
        help.start();
        await aTimeout(0);
        expect(getPortal()).to.equal(null);
        expect(help.open).to.be.false;
        await teardown(help, container);
    });

    it("fires y-help-start after the first step renders", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        const startEv = oneEvent(help, "y-help-start");
        help.start();
        const { detail } = await startEv;
        expect(detail.index).to.equal(0);
        expect(detail.step.content).to.equal("a");
        await teardown(help, container);
    });

    it("fires y-help-step-change with from/to/direction on next()", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        await aTimeout(0);
        const ev = oneEvent(help, "y-help-step-change");
        help.next();
        const { detail } = await ev;
        expect(detail.from).to.equal(0);
        expect(detail.to).to.equal(1);
        expect(detail.direction).to.equal("next");
        await teardown(help, container);
    });

    it("preventDefault on y-help-step-change blocks the move", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        await aTimeout(0);
        help.addEventListener(
            "y-help-step-change",
            (e) => e.preventDefault(),
            { once: true },
        );
        help.next();
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("0");
        await teardown(help, container);
    });

    it("fires y-help-complete after the last step (non-loop)", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        help.next();
        const ev = oneEvent(help, "y-help-complete");
        help.next();
        const { detail } = await ev;
        expect(detail.totalSteps).to.equal(2);
        await teardown(help, container);
    });

    it("fires y-help-close with the reason on close()", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        help.start();
        await aTimeout(0);
        const ev = oneEvent(help, "y-help-close");
        help.close("user");
        const { detail } = await ev;
        expect(detail.reason).to.equal("user");
        await teardown(help, container);
    });

    it("forces teardown on disconnect even when y-help-close is cancelled", async () => {
        // Reproduces the regression where a y-help-close listener that
        // called preventDefault() could keep the portaled overlay and the
        // window listeners alive after the host element had been removed
        // from the DOM. disconnectedCallback must bypass the cancelable
        // close path.
        const { help, container } = await setupTour([{ content: "x" }]);
        help.addEventListener("y-help-close", (e) => e.preventDefault());
        help.start();
        await aTimeout(0);
        expect(getPortal()).to.exist;

        help.remove();
        await aTimeout(0);

        expect(getPortal()).to.equal(null);
        await teardown(help, container);
    });

    it("preventDefault on y-help-close keeps the tour open", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        help.start();
        await aTimeout(0);
        help.addEventListener(
            "y-help-close",
            (e) => e.preventDefault(),
            { once: true },
        );
        help.close("user");
        await aTimeout(0);
        expect(help.open).to.be.true;
        expect(getPortal()).to.exist;
        await teardown(help, container);
    });

    // ── Keyboard ──────────────────────────────────────────────────────

    it("Escape closes the tour when close-on-escape=true", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        help.start();
        await aTimeout(0);
        const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
        window.dispatchEvent(ev);
        await aTimeout(0);
        expect(help.open).to.be.false;
        await teardown(help, container);
    });

    it("Escape does NOT close when close-on-escape=false", async () => {
        const { help, container } = await setupTour([{ content: "a" }], {
            "close-on-escape": false,
        });
        help.start();
        await aTimeout(0);
        const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
        window.dispatchEvent(ev);
        await aTimeout(0);
        expect(help.open).to.be.true;
        await teardown(help, container);
    });

    it("ArrowRight advances; ArrowLeft retreats", async () => {
        const { help, container } = await setupTour([
            { content: "a" },
            { content: "b" },
        ]);
        help.start();
        await aTimeout(0);
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("1");
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
        await aTimeout(0);
        expect(help.getAttribute("index")).to.equal("0");
        await teardown(help, container);
    });

    // ── Next-button label / aria-label sync ──────────────────────────

    it("updates the next-button's aria-label to match its visible text on the last step", async () => {
        // Regression: screen readers were announcing "Next" while the button
        // visually read "Done" on the last step because aria-label was set
        // once at construction time and never refreshed.
        const { help, container } = await setupTour(
            [{ content: "a" }, { content: "b" }],
            { "finish-label": "All done" },
        );
        help.start();
        await aTimeout(0);
        const portal = getPortal();
        const next = portal.querySelector('[part="next-button"]');
        // On the first step the next button is "Next".
        expect(next.textContent.trim()).to.equal("Next");
        expect(next.getAttribute("aria-label")).to.equal("Next");

        help.next();
        await aTimeout(0);

        // On the last step (non-loop) the text switches to finish-label,
        // and aria-label must follow.
        expect(next.textContent.trim()).to.equal("All done");
        expect(next.getAttribute("aria-label")).to.equal("All done");

        // The overlay-edge "next" arrow has no visible text but its
        // aria-label should still flip to reflect the action.
        const arrowNext = portal.querySelector('[part="arrow-next"]');
        expect(arrowNext.getAttribute("aria-label")).to.equal("All done");
        await teardown(help, container);
    });

    // ── Target resolution ─────────────────────────────────────────────

    it("falls back to querySelector when a bare tag-shaped target has no matching id", async () => {
        // Regression: identifier-shaped strings like "button" were treated
        // exclusively as element ids, so a documented CSS tag-selector
        // target like target: "button" returned null even when the page
        // had a matching <button>.
        const container = document.createElement("div");
        container.innerHTML = `<button>Lonely</button>`;
        document.body.appendChild(container);
        // Sanity: no element with id="button" exists on the page.
        expect(document.getElementById("button")).to.equal(null);

        const help = document.createElement("y-help");
        help.steps = [{ target: "button", content: "tag selector step" }];
        document.body.appendChild(help);
        help.start();
        await aTimeout(0);

        const portal = getPortal();
        // The cutout indicates the bare "button" selector resolved.
        expect(portal.querySelectorAll(".y-help-highlight").length).to.equal(1);
        await teardown(help, container);
    });

    it("prefers the element with matching id when one exists", async () => {
        // Confirms the fast path: when both an id and a tag-selector could
        // match, the id wins (same behavior as before the fallback was added).
        const container = document.createElement("div");
        container.innerHTML = `
            <button>Generic</button>
            <div id="button">Targeted</div>
        `;
        document.body.appendChild(container);

        const help = document.createElement("y-help");
        help.steps = [{ target: "button", content: "id wins" }];
        document.body.appendChild(help);
        help.start();
        await aTimeout(0);

        const portal = getPortal();
        const cutouts = portal.querySelectorAll(".y-help-highlight");
        expect(cutouts.length).to.equal(1);
        // Verify the highlight bounds match the #button div, not the <button> tag.
        const targetDiv = document.getElementById("button");
        const targetRect = targetDiv.getBoundingClientRect();
        const cutoutX = parseFloat(cutouts[0].getAttribute("x"));
        // The cutout has padding applied around the target so the rect's
        // left edge sits slightly left of the target's left.
        expect(cutoutX).to.be.closeTo(targetRect.left - 8, 1);
        await teardown(help, container);
    });

    // ── Multi-target anchor ───────────────────────────────────────────

    it("anchor='last' anchors the tooltip to the last resolved target", async () => {
        const { help, container } = await setupTour([
            {
                target: ["btn-a", "btn-b"],
                anchor: "last",
                position: "right",
                content: "x",
            },
        ]);
        // Force a known layout so the positioning assertion is independent
        // of the test-runner DOM's existing body content.
        document.getElementById("btn-a").style.cssText =
            "position:fixed;top:100px;left:50px;width:60px;height:30px";
        document.getElementById("btn-b").style.cssText =
            "position:fixed;top:100px;left:200px;width:60px;height:30px";
        help.start();
        await aTimeout(0);
        const tipRect = getTooltipSurface().getBoundingClientRect();
        const btnBRect = document
            .getElementById("btn-b")
            .getBoundingClientRect();
        // anchor='last' + position='right' → tip is to the right of btn-b
        // (well clear of btn-a, which is to the left). A 30px tolerance
        // covers the configurable tooltip-offset variable.
        expect(tipRect.left).to.be.at.least(btnBRect.right - 30);
        await teardown(help, container);
    });

    // ── Focus management ──────────────────────────────────────────────

    it("restores focus to the previously focused element on close", async () => {
        const { help, container } = await setupTour([{ content: "a" }]);
        const btn = document.getElementById("btn-a");
        btn.focus();
        help.start();
        await aTimeout(0);
        help.close();
        await aTimeout(0);
        expect(document.activeElement).to.equal(btn);
        await teardown(help, container);
    });

    // ── Untargeted-position fallback ──────────────────────────────────

    it("falls back to untargeted-position when no target is set", async () => {
        const { help, container } = await setupTour([
            { content: "no target" },
        ]);
        help.start();
        await aTimeout(0);
        // Pointer is hidden in center/untargeted mode.
        expect(getTooltipPointer().hidden).to.be.true;
        await teardown(help, container);
    });

    // ── disable-target-interaction ─────────────────────────────────────

    it("renders the full-screen blocker when disable-target-interaction is on (default)", async () => {
        const { help, container } = await setupTour([
            { target: "btn-a", content: "a" },
        ]);
        help.start();
        await aTimeout(0);
        const blocker = getPortal().querySelector(".y-help-blocker");
        expect(blocker).to.exist;
        expect(blocker.classList.contains("y-help-blocker--off")).to.be.false;
        await teardown(help, container);
    });

    it("still honors close-on-overlay-click when disable-target-interaction is false", async () => {
        // Regression: the close handler used to live only on the blocker
        // element, which gets pointer-events: none when
        // disable-target-interaction="false" — so dim-area clicks couldn't
        // close the tour in that configuration. The handler is now also
        // attached to the SVG dim rect (whose visiblePainted pointer-events
        // catch clicks in dim regions but pass cutouts through to targets).
        const { help, container } = await setupTour(
            [{ target: "btn-a", content: "a" }],
            {
                "close-on-overlay-click": true,
                "disable-target-interaction": false,
            },
        );
        help.start();
        await aTimeout(0);
        expect(getPortal()).to.exist;

        const dim = getPortal().querySelector(".y-help-overlay-dim");
        dim.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await aTimeout(0);

        expect(help.open).to.be.false;
        expect(getPortal()).to.equal(null);
        await teardown(help, container);
    });

    it("disables the blocker (pointer-events) when disable-target-interaction=false", async () => {
        const { help, container } = await setupTour(
            [{ target: "btn-a", content: "a" }],
            { "disable-target-interaction": false },
        );
        help.start();
        await aTimeout(0);
        const blocker = getPortal().querySelector(".y-help-blocker");
        expect(blocker.classList.contains("y-help-blocker--off")).to.be.true;
        await teardown(help, container);
    });
});
