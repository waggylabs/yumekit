import { fixture, expect, html, oneEvent, aTimeout } from "@open-wc/testing";
import sinon from "sinon";
import "./y-tree.js";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("YumeTree", () => {
    const sandbox = sinon.createSandbox();
    let originalUrl;

    beforeEach(() => {
        originalUrl = window.location.href;
    });
    afterEach(() => {
        sandbox.restore();
        // Restore the URL so route-match tests don't leak state
        history.replaceState({}, "", originalUrl);
    });

    // ── Rendering & defaults ─────────────────────────────────────────────

    it("renders with role=tree and a default aria-label", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item><span slot="label">A</span></y-tree-item>
            </y-tree>
        `);
        expect(el.getAttribute("role")).to.equal("tree");
        expect(el.getAttribute("aria-label")).to.equal("Tree");
    });

    it("icon wrapper hides when no icon slotted, shows when icon is provided", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">No icon</span></y-tree-item>
                <y-tree-item id="b">
                    <y-icon slot="icon" name="folder" size="small"></y-icon>
                    <span slot="label">With icon</span>
                </y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        const b = el.querySelector("#b");
        expect(a.hasAttribute("data-has-icon")).to.be.false;
        expect(b.hasAttribute("data-has-icon")).to.be.true;

        const aIcon = a.shadowRoot.querySelector(".icon");
        const bIcon = b.shadowRoot.querySelector(".icon");
        expect(getComputedStyle(aIcon).display).to.equal("none");
        expect(getComputedStyle(bIcon).display).to.not.equal("none");
    });

    it("preserves a caller-supplied aria-label", async () => {
        const el = await fixture(html`
            <y-tree aria-label="Docs nav">
                <y-tree-item><span slot="label">A</span></y-tree-item>
            </y-tree>
        `);
        expect(el.getAttribute("aria-label")).to.equal("Docs nav");
    });

    it("defaults to selection=single and route-match=exact", async () => {
        const el = await fixture(html`<y-tree></y-tree>`);
        expect(el.selection).to.equal("single");
        expect(el.routeMatch).to.equal("exact");
        expect(el.exclusive).to.equal(false);
    });

    it("renders items with role=treeitem and aria-level reflecting depth", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="root">
                    <span slot="label">Root</span>
                    <y-tree-item slot="children" id="child">
                        <span slot="label">Child</span>
                    </y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        const root = el.querySelector("#root");
        const child = el.querySelector("#child");
        expect(root.getAttribute("role")).to.equal("treeitem");
        expect(root.getAttribute("aria-level")).to.equal("1");
        expect(child.getAttribute("aria-level")).to.equal("2");
    });

    // ── hasChildren detection ────────────────────────────────────────────

    it("hides the chevron on leaf items", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="leaf"><span slot="label">Leaf</span></y-tree-item>
            </y-tree>
        `);
        const leaf = el.querySelector("#leaf");
        const arrow = leaf.shadowRoot.querySelector('[part="arrow"]');
        expect(arrow.style.visibility).to.equal("hidden");
        expect(leaf.hasAttribute("aria-expanded")).to.be.false;
    });

    it("shows the chevron and aria-expanded on parent items", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="parent">
                    <span slot="label">Parent</span>
                    <y-tree-item slot="children"><span slot="label">Child</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        const parent = el.querySelector("#parent");
        await flush();
        expect(parent.hasChildren).to.equal(true);
        expect(parent.getAttribute("aria-expanded")).to.equal("false");
        const arrow = parent.shadowRoot.querySelector('[part="arrow"]');
        expect(arrow.style.visibility).to.not.equal("hidden");
    });

    // ── expand / collapse ────────────────────────────────────────────────

    it("toggles expansion on chevron click and fires expand/toggle events", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="parent">
                    <span slot="label">Parent</span>
                    <y-tree-item slot="children"><span slot="label">Child</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        const parent = el.querySelector("#parent");
        const arrow = parent.shadowRoot.querySelector('[part="arrow"]');

        const expandSpy = sandbox.spy();
        const toggleSpy = sandbox.spy();
        el.addEventListener("expand", expandSpy);
        el.addEventListener("toggle", toggleSpy);

        arrow.click();

        expect(parent.expanded).to.equal(true);
        expect(parent.getAttribute("aria-expanded")).to.equal("true");
        expect(expandSpy.calledOnce).to.equal(true);
        expect(toggleSpy.calledOnce).to.equal(true);
        expect(toggleSpy.firstCall.args[0].detail.expanded).to.equal(true);
    });

    it("clicking the chevron does not navigate or fire select", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="parent" href="/x">
                    <span slot="label">Parent</span>
                    <y-tree-item slot="children" href="/x/y"><span slot="label">Child</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        const parent = el.querySelector("#parent");
        const arrow = parent.shadowRoot.querySelector('[part="arrow"]');

        const navigateSpy = sandbox.spy();
        const selectSpy = sandbox.spy();
        el.addEventListener("navigate", navigateSpy);
        el.addEventListener("select", selectSpy);

        arrow.click();

        expect(navigateSpy.called).to.equal(false);
        expect(selectSpy.called).to.equal(false);
    });

    // ── activate (navigate + select) ─────────────────────────────────────

    it("clicking the row fires navigate and select for items with href", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="leaf" href="/page"><span slot="label">Leaf</span></y-tree-item>
            </y-tree>
        `);
        const leaf = el.querySelector("#leaf");
        const header = leaf.shadowRoot.querySelector('[part="header"]');

        sandbox.stub(history, "pushState");
        const navigateSpy = sandbox.spy();
        const selectSpy = sandbox.spy();
        el.addEventListener("navigate", navigateSpy);
        el.addEventListener("select", selectSpy);

        header.click();

        expect(navigateSpy.calledOnce).to.equal(true);
        expect(navigateSpy.firstCall.args[0].detail.href).to.equal("/page");
        expect(selectSpy.calledOnce).to.equal(true);
        expect(history.pushState.calledOnce).to.equal(true);
    });

    it("preventDefault on navigate skips the History API side-effect", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="leaf" href="/spa"><span slot="label">Leaf</span></y-tree-item>
            </y-tree>
        `);
        const leaf = el.querySelector("#leaf");
        const header = leaf.shadowRoot.querySelector('[part="header"]');

        const pushStub = sandbox.stub(history, "pushState");
        el.addEventListener("navigate", (e) => e.preventDefault());

        header.click();

        expect(pushStub.called).to.equal(false);
    });

    it("uses replaceState when history='replace'", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="leaf" href="/r" history="replace">
                    <span slot="label">Leaf</span>
                </y-tree-item>
            </y-tree>
        `);
        const leaf = el.querySelector("#leaf");
        const header = leaf.shadowRoot.querySelector('[part="header"]');

        const replaceStub = sandbox.stub(history, "replaceState");
        const pushStub = sandbox.stub(history, "pushState");

        header.click();

        expect(replaceStub.calledOnce).to.equal(true);
        expect(pushStub.called).to.equal(false);
    });

    it("items without href still fire select but not navigate", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="leaf"><span slot="label">Leaf</span></y-tree-item>
            </y-tree>
        `);
        const leaf = el.querySelector("#leaf");
        const header = leaf.shadowRoot.querySelector('[part="header"]');

        const navigateSpy = sandbox.spy();
        const selectSpy = sandbox.spy();
        el.addEventListener("navigate", navigateSpy);
        el.addEventListener("select", selectSpy);

        header.click();

        expect(navigateSpy.called).to.equal(false);
        expect(selectSpy.calledOnce).to.equal(true);
    });

    // ── selection ────────────────────────────────────────────────────────

    it("single selection: selecting one item clears others", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a" selected><span slot="label">A</span></y-tree-item>
                <y-tree-item id="b"><span slot="label">B</span></y-tree-item>
            </y-tree>
        `);
        const a = el.querySelector("#a");
        const b = el.querySelector("#b");
        b.shadowRoot.querySelector('[part="header"]').click();
        expect(a.selected).to.equal(false);
        expect(b.selected).to.equal(true);
    });

    it("selection='none' does not auto-toggle selected on activate", async () => {
        const el = await fixture(html`
            <y-tree selection="none" route-match="off">
                <y-tree-item id="a"><span slot="label">A</span></y-tree-item>
            </y-tree>
        `);
        const a = el.querySelector("#a");
        a.shadowRoot.querySelector('[part="header"]').click();
        expect(a.selected).to.equal(false);
    });

    // ── disabled ─────────────────────────────────────────────────────────

    it("disabled items receive aria-disabled and skip events on click", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a" disabled href="/x"><span slot="label">A</span></y-tree-item>
            </y-tree>
        `);
        const a = el.querySelector("#a");
        expect(a.getAttribute("aria-disabled")).to.equal("true");

        const navigateSpy = sandbox.spy();
        const selectSpy = sandbox.spy();
        el.addEventListener("navigate", navigateSpy);
        el.addEventListener("select", selectSpy);

        a.shadowRoot.querySelector('[part="header"]').click();

        expect(navigateSpy.called).to.equal(false);
        expect(selectSpy.called).to.equal(false);
    });

    // ── exclusive ────────────────────────────────────────────────────────

    it("exclusive: expanding one branch collapses sibling branches at the same level", async () => {
        const el = await fixture(html`
            <y-tree exclusive>
                <y-tree-item id="a" expanded>
                    <span slot="label">A</span>
                    <y-tree-item slot="children"><span slot="label">A1</span></y-tree-item>
                </y-tree-item>
                <y-tree-item id="b">
                    <span slot="label">B</span>
                    <y-tree-item slot="children"><span slot="label">B1</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        const a = el.querySelector("#a");
        const b = el.querySelector("#b");
        await flush();
        b.expand();
        expect(a.expanded).to.equal(false);
        expect(b.expanded).to.equal(true);
    });

    it("exclusive applies per-level only", async () => {
        const el = await fixture(html`
            <y-tree exclusive>
                <y-tree-item id="root" expanded>
                    <span slot="label">Root</span>
                    <y-tree-item slot="children" id="ch1" expanded>
                        <span slot="label">C1</span>
                        <y-tree-item slot="children"><span slot="label">G1</span></y-tree-item>
                    </y-tree-item>
                    <y-tree-item slot="children" id="ch2">
                        <span slot="label">C2</span>
                        <y-tree-item slot="children"><span slot="label">G2</span></y-tree-item>
                    </y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        await flush();
        const root = el.querySelector("#root");
        const ch1 = el.querySelector("#ch1");
        const ch2 = el.querySelector("#ch2");
        ch2.expand();
        expect(root.expanded).to.equal(true);
        expect(ch1.expanded).to.equal(false);
        expect(ch2.expanded).to.equal(true);
    });

    // ── route matching ───────────────────────────────────────────────────

    it("route-match='exact' marks the matching item with aria-current and selected", async () => {
        history.replaceState({}, "", "/docs/install");
        const el = await fixture(html`
            <y-tree>
                <y-tree-item href="/docs/install" id="match"><span slot="label">Install</span></y-tree-item>
                <y-tree-item href="/docs/quickstart" id="other"><span slot="label">QS</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const match = el.querySelector("#match");
        const other = el.querySelector("#other");
        expect(match.getAttribute("aria-current")).to.equal("page");
        expect(match.selected).to.equal(true);
        expect(other.hasAttribute("aria-current")).to.be.false;
    });

    it("route-match='prefix' picks the longest matching ancestor", async () => {
        history.replaceState({}, "", "/docs/install/macos");
        const el = await fixture(html`
            <y-tree route-match="prefix">
                <y-tree-item id="docs" href="/docs">
                    <span slot="label">Docs</span>
                    <y-tree-item slot="children" id="install" href="/docs/install">
                        <span slot="label">Install</span>
                    </y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        await flush();
        const docs = el.querySelector("#docs");
        const install = el.querySelector("#install");
        expect(install.getAttribute("aria-current")).to.equal("page");
        expect(docs.hasAttribute("aria-current")).to.be.false;
    });

    it("route-match='off' performs no automatic matching", async () => {
        history.replaceState({}, "", "/x");
        const el = await fixture(html`
            <y-tree route-match="off">
                <y-tree-item href="/x" id="a"><span slot="label">A</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        expect(a.hasAttribute("aria-current")).to.be.false;
        expect(a.selected).to.equal(false);
    });

    it("switching route-match to 'off' clears prior aria-current and selected", async () => {
        history.replaceState({}, "", "/a");
        const el = await fixture(html`
            <y-tree>
                <y-tree-item href="/a" id="a"><span slot="label">A</span></y-tree-item>
                <y-tree-item href="/b" id="b"><span slot="label">B</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        expect(a.getAttribute("aria-current")).to.equal("page");
        expect(a.selected).to.equal(true);

        el.setAttribute("route-match", "off");
        expect(a.hasAttribute("aria-current")).to.be.false;
        expect(a.selected).to.equal(false);
    });

    it("popstate re-evaluates route match", async () => {
        history.replaceState({}, "", "/a");
        const el = await fixture(html`
            <y-tree>
                <y-tree-item href="/a" id="a"><span slot="label">A</span></y-tree-item>
                <y-tree-item href="/b" id="b"><span slot="label">B</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        expect(el.querySelector("#a").selected).to.equal(true);
        history.replaceState({}, "", "/b");
        window.dispatchEvent(new PopStateEvent("popstate"));
        expect(el.querySelector("#b").selected).to.equal(true);
        expect(el.querySelector("#a").selected).to.equal(false);
    });

    // ── roving tabindex & keyboard nav ───────────────────────────────────

    it("roving tabindex: only one item has tabindex=0 at a time", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">A</span></y-tree-item>
                <y-tree-item id="b"><span slot="label">B</span></y-tree-item>
                <y-tree-item id="c"><span slot="label">C</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const items = Array.from(el.querySelectorAll("y-tree-item"));
        const focusable = items.filter((it) => it.tabIndex === 0);
        expect(focusable.length).to.equal(1);
    });

    it("focusing a different item via click transfers the roving tabindex", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">A</span></y-tree-item>
                <y-tree-item id="b"><span slot="label">B</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        const b = el.querySelector("#b");
        expect(a.tabIndex).to.equal(0);

        b.focus();
        expect(b.tabIndex).to.equal(0);
        expect(a.tabIndex).to.equal(-1);
    });

    it("ArrowDown/ArrowUp move focus among visible items, skipping disabled", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">A</span></y-tree-item>
                <y-tree-item id="b" disabled><span slot="label">B</span></y-tree-item>
                <y-tree-item id="c"><span slot="label">C</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        const c = el.querySelector("#c");
        el.focusItem(a);

        a.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        expect(c.tabIndex).to.equal(0);

        c.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
        expect(a.tabIndex).to.equal(0);
    });

    it("ArrowRight expands a collapsed branch; a second ArrowRight focuses first child", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="parent">
                    <span slot="label">P</span>
                    <y-tree-item slot="children" id="c1"><span slot="label">C1</span></y-tree-item>
                    <y-tree-item slot="children" id="c2"><span slot="label">C2</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        await flush();
        const parent = el.querySelector("#parent");
        const c1 = el.querySelector("#c1");
        el.focusItem(parent);

        parent.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(parent.expanded).to.equal(true);

        parent.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        expect(c1.tabIndex).to.equal(0);
    });

    it("ArrowLeft collapses an expanded branch; on a collapsed leaf, focuses parent", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="parent" expanded>
                    <span slot="label">P</span>
                    <y-tree-item slot="children" id="c1"><span slot="label">C1</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        await flush();
        const parent = el.querySelector("#parent");
        const c1 = el.querySelector("#c1");

        // From a child leaf, ArrowLeft moves to parent
        el.focusItem(c1);
        c1.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        expect(parent.tabIndex).to.equal(0);

        // From an expanded parent, ArrowLeft collapses it
        parent.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
        expect(parent.expanded).to.equal(false);
    });

    it("Home/End jump to first/last visible enabled item", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">A</span></y-tree-item>
                <y-tree-item id="b"><span slot="label">B</span></y-tree-item>
                <y-tree-item id="c"><span slot="label">C</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        const b = el.querySelector("#b");
        const c = el.querySelector("#c");
        el.focusItem(b);

        b.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
        expect(c.tabIndex).to.equal(0);

        c.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
        expect(a.tabIndex).to.equal(0);
    });

    it("Enter activates the focused item", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">A</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        const selectSpy = sandbox.spy();
        el.addEventListener("select", selectSpy);
        el.focusItem(a);

        a.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        expect(selectSpy.calledOnce).to.equal(true);
    });

    it("Space toggles expansion on a parent item", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="p">
                    <span slot="label">P</span>
                    <y-tree-item slot="children"><span slot="label">C</span></y-tree-item>
                </y-tree-item>
            </y-tree>
        `);
        await flush();
        const p = el.querySelector("#p");
        el.focusItem(p);

        p.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        expect(p.expanded).to.equal(true);

        p.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        expect(p.expanded).to.equal(false);
    });

    it("type-ahead jumps focus to the next item starting with that letter", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="a"><span slot="label">Apples</span></y-tree-item>
                <y-tree-item id="b"><span slot="label">Bananas</span></y-tree-item>
                <y-tree-item id="c"><span slot="label">Cherries</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const a = el.querySelector("#a");
        const c = el.querySelector("#c");
        el.focusItem(a);

        a.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true }));
        expect(c.tabIndex).to.equal(0);
    });

    // ── visibility helper ────────────────────────────────────────────────

    it("getVisibleItems excludes items under collapsed parents", async () => {
        const el = await fixture(html`
            <y-tree>
                <y-tree-item id="p">
                    <span slot="label">P</span>
                    <y-tree-item slot="children" id="hidden"><span slot="label">H</span></y-tree-item>
                </y-tree-item>
                <y-tree-item id="q"><span slot="label">Q</span></y-tree-item>
            </y-tree>
        `);
        await flush();
        const visible = el.getVisibleItems().map((it) => it.id);
        expect(visible).to.deep.equal(["p", "q"]);

        el.querySelector("#p").expand();
        const expanded = el.getVisibleItems().map((it) => it.id);
        expect(expanded).to.deep.equal(["p", "hidden", "q"]);
    });
});
