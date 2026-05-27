import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import "./y-code.js";

describe("YumeCode", () => {
    // ── Rendering ──────────────────────────────────────────────────────

    it("renders without crashing", async () => {
        const el = await fixture(html`<y-code>hello</y-code>`);
        expect(el.shadowRoot.querySelector("pre.code")).to.exist;
        expect(el.shadowRoot.querySelector("code.code-inner")).to.exist;
    });

    it("renders one .line per source line", async () => {
        const el = await fixture(html`<y-code>line one
line two
line three</y-code>`);
        const lines = el.shadowRoot.querySelectorAll(".line");
        expect(lines.length).to.equal(3);
        expect(lines[0].textContent.trim()).to.equal("line one");
        expect(lines[2].textContent.trim()).to.equal("line three");
    });

    it("dedents common leading whitespace", async () => {
        const el = await fixture(html`<y-code>
            const x = 1;
            const y = 2;
        </y-code>`);
        const lines = el.shadowRoot.querySelectorAll(".line .line-content");
        expect(lines[0].textContent).to.equal("const x = 1;");
        expect(lines[1].textContent).to.equal("const y = 2;");
    });

    it("renders an aria-label that includes the language and line count", async () => {
        const el = await fixture(html`<y-code language="javascript">a
b</y-code>`);
        const pre = el.shadowRoot.querySelector("pre.code");
        expect(pre.getAttribute("aria-label")).to.equal(
            "javascript code, 2 lines",
        );
    });

    // ── Line numbers ───────────────────────────────────────────────────

    it("renders line numbers when line-numbers is set", async () => {
        const el = await fixture(html`<y-code line-numbers>a
b</y-code>`);
        const nums = el.shadowRoot.querySelectorAll(".line-number");
        expect(nums.length).to.equal(2);
        expect(nums[0].textContent).to.equal("1");
        expect(nums[1].textContent).to.equal("2");
    });

    it("does not render line numbers by default", async () => {
        const el = await fixture(html`<y-code>a</y-code>`);
        expect(el.shadowRoot.querySelector(".line-number")).to.not.exist;
    });

    it("makes each line interactive (role=button + tabindex) when line-numbers is set", async () => {
        const el = await fixture(html`<y-code line-numbers>a
b</y-code>`);
        const line = el.shadowRoot.querySelector(".line");
        expect(line.getAttribute("role")).to.equal("button");
        expect(line.getAttribute("tabindex")).to.equal("0");
    });

    // ── Header ─────────────────────────────────────────────────────────

    it("renders a header when filename is set", async () => {
        const el = await fixture(
            html`<y-code filename="example.js">a</y-code>`,
        );
        const header = el.shadowRoot.querySelector("header.header");
        expect(header).to.exist;
        expect(header.textContent).to.include("example.js");
    });

    it("omits the header when there is no filename and no header slot and no copy button", async () => {
        const el = await fixture(
            html`<y-code copyable="false">a</y-code>`,
        );
        expect(el.shadowRoot.querySelector("header.header")).to.not.exist;
    });

    it("renders the copy button by default", async () => {
        const el = await fixture(html`<y-code>a</y-code>`);
        expect(el.shadowRoot.querySelector(".copy-btn")).to.exist;
    });

    it("hides the copy button when copyable='false'", async () => {
        const el = await fixture(html`<y-code copyable="false">a</y-code>`);
        expect(el.shadowRoot.querySelector(".copy-btn")).to.not.exist;
    });

    it("hides the copy button when disabled", async () => {
        const el = await fixture(html`<y-code disabled>a</y-code>`);
        expect(el.shadowRoot.querySelector(".copy-btn")).to.not.exist;
    });

    // ── Copy behavior ──────────────────────────────────────────────────

    it("fires a `copy` event with the block source when copyBlock() succeeds", async () => {
        const el = await fixture(html`<y-code>const x = 1;</y-code>`);
        // Override the clipboard write so the test doesn't need permission.
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: async () => {} },
            configurable: true,
        });
        try {
            const ev = oneEvent(el, "copy");
            el.copyBlock();
            const detail = (await ev).detail;
            expect(detail.target).to.equal("block");
            expect(detail.source).to.equal("const x = 1;");
        } finally {
            Object.defineProperty(navigator, "clipboard", {
                value: originalClipboard,
                configurable: true,
            });
        }
    });

    it("fires a `copy` event with `target: 'line'` and the line index when copyLine() succeeds", async () => {
        const el = await fixture(html`<y-code>first
second
third</y-code>`);
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: async () => {} },
            configurable: true,
        });
        try {
            const ev = oneEvent(el, "copy");
            el.copyLine(1);
            const detail = (await ev).detail;
            expect(detail.target).to.equal("line");
            expect(detail.lineIndex).to.equal(1);
            expect(detail.source).to.equal("second");
        } finally {
            Object.defineProperty(navigator, "clipboard", {
                value: originalClipboard,
                configurable: true,
            });
        }
    });

    it("fires `copy-fail` when clipboard write throws", async () => {
        const el = await fixture(html`<y-code>x</y-code>`);
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText: async () => {
                    throw new Error("denied");
                },
            },
            configurable: true,
        });
        try {
            const ev = oneEvent(el, "copy-fail");
            el.copyBlock();
            const detail = (await ev).detail;
            expect(detail.error).to.be.instanceOf(Error);
            expect(detail.error.message).to.equal("denied");
        } finally {
            Object.defineProperty(navigator, "clipboard", {
                value: originalClipboard,
                configurable: true,
            });
        }
    });

    // ── max-lines collapse ─────────────────────────────────────────────

    it("collapses to max-lines and renders an expand toggle", async () => {
        const el = await fixture(html`<y-code max-lines="2">a
b
c
d</y-code>`);
        expect(el.shadowRoot.querySelectorAll(".line").length).to.equal(2);
        const toggle = el.shadowRoot.querySelector(".expand-toggle");
        expect(toggle).to.exist;
        expect(toggle.textContent).to.include("2 more");
    });

    it("expands fully when the toggle is clicked", async () => {
        const el = await fixture(html`<y-code max-lines="2">a
b
c
d</y-code>`);
        el.shadowRoot.querySelector(".expand-toggle").click();
        expect(el.shadowRoot.querySelectorAll(".line").length).to.equal(4);
        expect(
            el.shadowRoot.querySelector(".expand-toggle").textContent,
        ).to.include("Show less");
    });

    // ── Highlighted slot sanitization ──────────────────────────────────

    it("renders sanitized span structure from the highlighted slot", async () => {
        const el = await fixture(html`
            <y-code>
                <div slot="highlighted"><span class="token keyword">const</span> x = <span class="token number">1</span>;</div>
            </y-code>
        `);
        const line = el.shadowRoot.querySelector(".line .line-content");
        const keyword = line.querySelector(".token.keyword");
        const number = line.querySelector(".token.number");
        expect(keyword).to.exist;
        expect(keyword.textContent).to.equal("const");
        expect(number).to.exist;
        expect(number.textContent).to.equal("1");
    });

    it("strips disallowed elements from the highlighted slot", async () => {
        const el = await fixture(html`
            <y-code>
                <div slot="highlighted"><script>alert(1)</script><span class="keyword">ok</span></div>
            </y-code>
        `);
        const line = el.shadowRoot.querySelector(".line .line-content");
        expect(line.querySelector("script")).to.not.exist;
        expect(line.textContent).to.include("ok");
    });

    it("drops unknown class names from highlighted spans", async () => {
        const el = await fixture(html`
            <y-code>
                <div slot="highlighted"><span class="keyword evil-class">hi</span></div>
            </y-code>
        `);
        const span = el.shadowRoot.querySelector(".line .line-content span");
        expect(span.classList.contains("keyword")).to.be.true;
        expect(span.classList.contains("evil-class")).to.be.false;
    });

    it("splits highlighted content into lines at \\n boundaries", async () => {
        const el = await fixture(html`
            <y-code><div slot="highlighted"><span class="keyword">a</span>
<span class="keyword">b</span>
<span class="keyword">c</span></div></y-code>
        `);
        const lines = el.shadowRoot.querySelectorAll(".line");
        expect(lines.length).to.equal(3);
        expect(lines[0].textContent.trim()).to.equal("a");
        expect(lines[2].textContent.trim()).to.equal("c");
    });

    // ── Tokenizer integration ──────────────────────────────────────────

    it("auto-tokenizes JavaScript and renders keyword spans", async () => {
        const el = await fixture(html`<y-code language="javascript">const x = 1;</y-code>`);
        const keyword = el.shadowRoot.querySelector(".line-content .token.keyword");
        expect(keyword).to.exist;
        expect(keyword.textContent).to.equal("const");
    });

    it("auto-tokenizes JSON and tags property names", async () => {
        const el = await fixture(html`<y-code language="json">{"name":"yumekit"}</y-code>`);
        const property = el.shadowRoot.querySelector(".line-content .token.property");
        expect(property).to.exist;
        expect(property.textContent).to.equal('"name"');
    });

    it("auto-tokenizes CSS and tags selectors + properties", async () => {
        const el = await fixture(html`<y-code language="css">.btn { color: red; }</y-code>`);
        const property = el.shadowRoot.querySelector(".line-content .token.property");
        const string = el.shadowRoot.querySelector(".line-content .token.attr-value");
        expect(property).to.exist;
        expect(property.textContent).to.equal("color");
        expect(string).to.exist;
        expect(string.textContent).to.equal("red");
    });

    it("falls back to plain text rendering for unsupported languages", async () => {
        const el = await fixture(html`<y-code language="python">print("hi")</y-code>`);
        expect(el.shadowRoot.querySelector(".line-content .token")).to.not.exist;
    });

    it("prefers the highlighted slot over the tokenizer when both could apply", async () => {
        // language=javascript would normally trigger tokenization, but the
        // sanitized highlighted slot wins so consumers can override the
        // built-in tokenizer with their own pipeline.
        const el = await fixture(html`
            <y-code language="javascript">
                <div slot="highlighted"><span class="comment">manual override</span></div>
            </y-code>
        `);
        const comment = el.shadowRoot.querySelector(".line-content .comment");
        expect(comment).to.exist;
        expect(comment.textContent).to.equal("manual override");
    });

    it("copy block on a tokenized language still copies the raw text", async () => {
        const el = await fixture(html`<y-code language="javascript">const x = 1;</y-code>`);
        const originalClipboard = navigator.clipboard;
        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: async () => {} },
            configurable: true,
        });
        try {
            const ev = oneEvent(el, "copy");
            el.copyBlock();
            const detail = (await ev).detail;
            expect(detail.source).to.equal("const x = 1;");
        } finally {
            Object.defineProperty(navigator, "clipboard", {
                value: originalClipboard,
                configurable: true,
            });
        }
    });

    // ── Language change event ──────────────────────────────────────────

    it("fires `language-change` when setLanguage() is called", async () => {
        const el = await fixture(html`<y-code language="text">a</y-code>`);
        const ev = oneEvent(el, "language-change");
        el.setLanguage("python");
        const detail = (await ev).detail;
        expect(detail.language).to.equal("python");
        expect(el.language).to.equal("python");
    });
});
