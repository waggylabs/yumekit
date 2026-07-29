import { html, fixture, expect, oneEvent, aTimeout } from "@open-wc/testing";
import sinon from "sinon";
import "./y-editor.js";

/** Place the caret across the whole of the editor's first block. */
function selectAll(editor) {
    const content = editor.shadowRoot.querySelector(".content");
    const range = document.createRange();
    range.selectNodeContents(content.firstElementChild);
    const selection = editor.shadowRoot.getSelection
        ? editor.shadowRoot.getSelection()
        : document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return range;
}

function content(editor) {
    return editor.shadowRoot.querySelector(".content");
}

function tool(editor, id) {
    return editor.shadowRoot.querySelector(`y-button[data-tool="${id}"]`);
}

function setCaret(editor, node, offset) {
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    const selection = editor.shadowRoot.getSelection
        ? editor.shadowRoot.getSelection()
        : document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

/** Replace the first block's text and drop the caret at the end of it. */
function typeInto(editor, text) {
    const block = content(editor).firstElementChild;
    block.textContent = text;
    setCaret(editor, block.firstChild, text.length);
    content(editor).dispatchEvent(new InputEvent("input", { bubbles: true }));
}

/** Type a fragment, answer the query it raises, and hand back the query detail. */
async function openMentions(editor, text, candidates) {
    const queried = oneEvent(editor, "mention-query");
    typeInto(editor, text);
    const { detail } = await queried;
    editor.setMentionCandidates(detail.id, candidates);
    return detail;
}

function options(editor) {
    return [...editor.shadowRoot.querySelectorAll(".mention-option")];
}

/**
 * Count rather than return the chips: a DOM node handed to a failing assertion
 * is serialized into the failure diff, which stalls the test reporter.
 */
function chipCount(editor) {
    return content(editor).querySelectorAll("span[data-mention-value]").length;
}

function press(editor, key) {
    content(editor).dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
    );
}

const PEOPLE = [
    { value: "ada", label: "Ada Lovelace", description: "Engineering" },
    { value: "grace", label: "Grace Hopper" },
];

describe("y-editor", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    describe("defaults", () => {
        it("renders the editing surface with textbox semantics", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            const surface = content(el);
            expect(surface.getAttribute("role")).to.equal("textbox");
            expect(surface.getAttribute("aria-multiline")).to.equal("true");
            expect(surface.getAttribute("contenteditable")).to.equal("true");
        });

        it("holds a single empty paragraph but reports an empty value", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            expect(content(el).children.length).to.equal(1);
            expect(content(el).firstElementChild.tagName).to.equal("P");
            expect(el.value).to.equal("");
        });

        it("defaults size to medium and rows to 6", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            expect(el.size).to.equal("medium");
            expect(el.rows).to.equal(6);
        });

        it("exposes the default allowed blocks", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            expect(el.allowedBlocks).to.deep.equal([
                "p",
                "h1",
                "h2",
                "h3",
                "blockquote",
                "ul",
                "ol",
                "code",
            ]);
        });

        it("is form-associated", () => {
            expect(customElements.get("y-editor").formAssociated).to.be.true;
        });
    });

    describe("toolbar", () => {
        it("renders the default tool set", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            for (const id of [
                "bold",
                "italic",
                "underline",
                "strike",
                "link",
                "undo",
            ]) {
                expect(tool(el, id), id).to.exist;
            }
        });

        it("groups tools with y-button-group", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            const groups = el.shadowRoot.querySelectorAll("y-button-group");
            expect(groups.length).to.equal(5);
        });

        it("hides the toolbar entirely when toolbar='false'", async () => {
            const el = await fixture(
                html`<y-editor toolbar="false"></y-editor>`,
            );
            expect(
                el.shadowRoot.querySelectorAll("y-button[data-tool]").length,
            ).to.equal(0);
        });

        it("honours a custom tool list", async () => {
            const el = await fixture(
                html`<y-editor toolbar="bold | link"></y-editor>`,
            );
            expect(tool(el, "bold")).to.exist;
            expect(tool(el, "link")).to.exist;
            expect(tool(el, "italic")).to.not.exist;
        });

        it("omits block tools that allowed-blocks does not permit", async () => {
            const el = await fixture(
                html`<y-editor allowed-blocks="p h1"></y-editor>`,
            );
            expect(tool(el, "heading")).to.exist;
            expect(tool(el, "blockquote")).to.not.exist;
            expect(tool(el, "ordered-list")).to.not.exist;
            expect(tool(el, "code")).to.not.exist;
            // Inline tools are unaffected by the block set.
            expect(tool(el, "bold")).to.exist;
        });

        it("is a single tab stop with a roving tabindex", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            const buttons = [
                ...el.shadowRoot.querySelectorAll("y-button[data-tool]"),
            ];
            expect(buttons.every((b) => b.button.tabIndex === -1)).to.be.true;
        });

        it("has toolbar role and aria-controls pointing at the surface", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            const toolbar = el.shadowRoot.querySelector(".toolbar");
            expect(toolbar.getAttribute("role")).to.equal("toolbar");
            expect(toolbar.getAttribute("aria-controls")).to.equal(
                content(el).id,
            );
        });

        it("is hidden when readonly", async () => {
            const el = await fixture(html`<y-editor readonly></y-editor>`);
            expect(el.shadowRoot.querySelector(".toolbar").hidden).to.be.true;
        });
    });

    describe("value", () => {
        it("sanitizes HTML assigned to value", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hi</p><script>window.__pwn = 1;</script>";
            expect(el.value).to.equal("<p>hi</p>");
            expect(content(el).querySelector("script")).to.not.exist;
        });

        it("strips event handlers from assigned HTML", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = '<p onclick="window.__pwn = 1">hi</p>';
            expect(el.value).to.equal("<p>hi</p>");
        });

        it("drops javascript: links but keeps their text", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = '<p><a href="javascript:alert(1)">x</a></p>';
            expect(el.value).to.equal("<p>x</p>");
        });

        it("normalizes disallowed blocks to p", async () => {
            const el = await fixture(
                html`<y-editor allowed-blocks="p"></y-editor>`,
            );
            el.value = "<h1>Title</h1>";
            expect(el.value).to.equal("<p>Title</p>");
        });

        it("normalizes stray inline content into a paragraph", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "bare text";
            expect(el.value).to.equal("<p>bare text</p>");
        });

        it("keeps allowed blocks intact", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<h2>Title</h2><p>Body</p>";
            expect(el.value).to.equal("<h2>Title</h2><p>Body</p>");
        });

        it("reflects to the value attribute when set imperatively", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hi</p>";
            expect(el.getAttribute("value")).to.equal("<p>hi</p>");
        });

        it("reads an initial value attribute", async () => {
            const el = await fixture(
                html`<y-editor value="<p>seed</p>"></y-editor>`,
            );
            expect(el.value).to.equal("<p>seed</p>");
        });

        it("reflects the sanitized value back to the attribute on connect", async () => {
            const el = await fixture(html`<y-editor value="bare"></y-editor>`);
            expect(el.value).to.equal("<p>bare</p>");
            expect(el.getAttribute("value")).to.equal("<p>bare</p>");
        });

        it("reflects the sanitized value when the attribute is set at runtime", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.setAttribute(
                "value",
                "<p>hi</p><script>window.__pwn = 1;</script>",
            );
            expect(el.value).to.equal("<p>hi</p>");
            expect(el.getAttribute("value")).to.equal("<p>hi</p>");
            expect(el.getAttribute("value")).to.not.contain("script");
        });

        it("reports empty rather than <p></p>", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p></p>";
            expect(el.value).to.equal("");
        });
    });

    describe("default slot", () => {
        it("adopts slotted markup as the starting value", async () => {
            const el = await fixture(
                html`<y-editor><p>from slot</p></y-editor>`,
            );
            expect(el.value).to.equal("<p>from slot</p>");
        });

        it("sanitizes slotted markup", async () => {
            const el = await fixture(
                html`<y-editor
                    ><p onclick="window.__pwn = 1">slot</p></y-editor
                >`,
            );
            expect(el.value).to.equal("<p>slot</p>");
        });

        it("defers to the value attribute when both are present", async () => {
            const el = await fixture(
                html`<y-editor value="<p>attr</p>"><p>slot</p></y-editor>`,
            );
            expect(el.value).to.equal("<p>attr</p>");
        });
    });

    describe("textContent", () => {
        it("reports the plain text of the document", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>Hello <strong>world</strong></p>";
            expect(el.textContent).to.equal("Hello world");
        });

        it("ignores assignment instead of throwing", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>Hello</p>";
            expect(() => {
                el.textContent = "";
            }).to.not.throw();
            expect(el.textContent).to.equal("Hello");
            expect(el.value).to.equal("<p>Hello</p>");
        });
    });

    describe("selection", () => {
        it("reports the block type and inline state at the caret", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<h1>Title</h1>";
            selectAll(el);
            await new Promise((r) => setTimeout(r, 0));
            expect(el.selection.blockType).to.equal("h1");
            expect(el.selection.bold).to.be.false;
        });

        it("reports a link href at the caret", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = '<p><a href="https://example.com">x</a></p>';
            selectAll(el);
            await new Promise((r) => setTimeout(r, 0));
            expect(el.selection.link).to.equal("https://example.com");
        });

        it("skips recompute for outside selections when already empty", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            document.getSelection().removeAllRanges();
            el._selection = el._emptySelection();
            const spy = sandbox.spy(el, "_refreshSelection");
            document.dispatchEvent(new Event("selectionchange"));
            expect(spy.called).to.be.false;
        });

        it("still recomputes when leaving a non-empty selection", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            document.getSelection().removeAllRanges();
            el._selection = { ...el._emptySelection(), bold: true };
            const spy = sandbox.spy(el, "_refreshSelection");
            document.dispatchEvent(new Event("selectionchange"));
            expect(spy.called).to.be.true;
        });
    });

    describe("formatting", () => {
        it("wraps the selection in strong for bold", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hello</p>";
            selectAll(el);
            tool(el, "bold").click();
            expect(el.value).to.equal("<p><strong>hello</strong></p>");
        });

        it("unwraps an already-bold selection", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p><strong>hello</strong></p>";
            selectAll(el);
            tool(el, "bold").click();
            expect(el.value).to.equal("<p>hello</p>");
        });

        it("applies italic and underline", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hi</p>";
            selectAll(el);
            tool(el, "italic").click();
            expect(el.value).to.equal("<p><em>hi</em></p>");
        });

        it("converts a paragraph to a blockquote and back", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>quoted</p>";
            selectAll(el);
            tool(el, "blockquote").click();
            expect(el.value).to.equal("<blockquote>quoted</blockquote>");
            selectAll(el);
            tool(el, "blockquote").click();
            expect(el.value).to.equal("<p>quoted</p>");
        });

        it("converts a paragraph to a list", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>item</p>";
            selectAll(el);
            tool(el, "unordered-list").click();
            expect(el.value).to.equal("<ul><li>item</li></ul>");
        });

        it("does not use document.execCommand", async () => {
            const spy = sandbox.spy(document, "execCommand");
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hello</p>";
            selectAll(el);
            tool(el, "bold").click();
            tool(el, "unordered-list").click();
            expect(spy.called).to.be.false;
        });
    });

    describe("events", () => {
        it("fires input on content mutation", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hi</p>";
            setTimeout(() => {
                selectAll(el);
                tool(el, "bold").click();
            });
            const e = await oneEvent(el, "input");
            expect(e.detail.value).to.contain("<strong>");
        });

        it("fires change on blur when the value changed", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hi</p>";
            el._committedValue = "";
            setTimeout(() => content(el).dispatchEvent(new FocusEvent("blur")));
            const e = await oneEvent(el, "change");
            expect(e.detail.value).to.equal("<p>hi</p>");
        });

        it("does not fire change on blur when nothing changed", async () => {
            const el = await fixture(
                html`<y-editor value="<p>hi</p>"></y-editor>`,
            );
            const spy = sandbox.spy();
            el.addEventListener("change", spy);
            content(el).dispatchEvent(new FocusEvent("blur"));
            expect(spy.called).to.be.false;
        });

        it("fires link-click for a link in the surface and is cancelable", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = '<p><a href="https://example.com">x</a></p>';
            const link = content(el).querySelector("a");
            setTimeout(() => link.click());
            const e = await oneEvent(el, "link-click");
            expect(e.detail.href).to.equal("https://example.com");
            expect(e.detail.text).to.equal("x");
            expect(e.cancelable).to.be.true;
        });
    });

    describe("disabled and readonly", () => {
        it("disabled removes contenteditable and the tab stop", async () => {
            const el = await fixture(html`<y-editor disabled></y-editor>`);
            expect(content(el).hasAttribute("contenteditable")).to.be.false;
            expect(content(el).hasAttribute("tabindex")).to.be.false;
            expect(content(el).getAttribute("aria-disabled")).to.equal("true");
        });

        it("readonly stays focusable but is not editable", async () => {
            const el = await fixture(html`<y-editor readonly></y-editor>`);
            expect(content(el).hasAttribute("contenteditable")).to.be.false;
            expect(content(el).getAttribute("tabindex")).to.equal("0");
            expect(content(el).getAttribute("aria-readonly")).to.equal("true");
        });

        it("readonly still submits its value", async () => {
            const el = await fixture(
                html`<y-editor readonly name="x" value="<p>v</p>"></y-editor>`,
            );
            expect(el.value).to.equal("<p>v</p>");
        });
    });

    describe("validation", () => {
        it("is invalid when required and empty", async () => {
            const el = await fixture(html`<y-editor required></y-editor>`);
            expect(el.checkValidity()).to.be.false;
            expect(content(el).getAttribute("aria-required")).to.equal("true");
            expect(content(el).getAttribute("aria-invalid")).to.equal("true");
        });

        it("is valid when required and filled", async () => {
            const el = await fixture(html`<y-editor required></y-editor>`);
            el.value = "<p>text</p>";
            expect(el.checkValidity()).to.be.true;
        });

        it("is invalid past max-length", async () => {
            const el = await fixture(
                html`<y-editor max-length="3"></y-editor>`,
            );
            el.value = "<p>toolong</p>";
            expect(el.checkValidity()).to.be.false;
        });

        it("mirrors invalid to aria-invalid", async () => {
            const el = await fixture(html`<y-editor invalid></y-editor>`);
            expect(content(el).getAttribute("aria-invalid")).to.equal("true");
        });
    });

    describe("character counter", () => {
        it("is absent unless show-count is set", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            expect(el.shadowRoot.querySelector(".counter").hidden).to.be.true;
        });

        it("renders n / max when max-length is set", async () => {
            const el = await fixture(
                html`<y-editor show-count max-length="10"></y-editor>`,
            );
            el.value = "<p>abc</p>";
            expect(
                el.shadowRoot.querySelector(".counter-text").textContent,
            ).to.equal("3 / 10");
        });

        it("is a polite live region", async () => {
            const el = await fixture(html`<y-editor show-count></y-editor>`);
            expect(
                el.shadowRoot
                    .querySelector(".counter")
                    .getAttribute("aria-live"),
            ).to.equal("polite");
        });

        it("stays quiet until the count approaches the limit", async () => {
            const el = await fixture(
                html`<y-editor show-count max-length="100"></y-editor>`,
            );
            el.value = "<p>short</p>";
            expect(
                el.shadowRoot.querySelector(".sr-only").textContent,
            ).to.equal("");
        });
    });

    describe("undo / redo", () => {
        it("reverts a formatting command", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hello</p>";
            selectAll(el);
            tool(el, "bold").click();
            expect(el.value).to.contain("<strong>");
            el.undo();
            expect(el.value).to.equal("<p>hello</p>");
        });

        it("redo re-applies the undone change", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.value = "<p>hello</p>";
            selectAll(el);
            tool(el, "bold").click();
            el.undo();
            el.redo();
            expect(el.value).to.contain("<strong>");
        });

        it("undo at the start of history is a no-op", async () => {
            const el = await fixture(
                html`<y-editor value="<p>a</p>"></y-editor>`,
            );
            el.undo();
            el.undo();
            expect(el.value).to.equal("<p>a</p>");
        });
    });

    describe("mode", () => {
        it("always reports rich", async () => {
            const el = await fixture(
                html`<y-editor mode="markdown"></y-editor>`,
            );
            expect(el.mode).to.equal("rich");
        });
    });

    describe("form participation", () => {
        it("submits its value under its name", async () => {
            const form = await fixture(html`
                <form>
                    <y-editor name="body" value="<p>hi</p>"></y-editor>
                </form>
            `);
            const data = new FormData(form);
            expect(data.get("body")).to.equal("<p>hi</p>");
        });

        it("is excluded from submission when disabled", async () => {
            const form = await fixture(html`
                <form>
                    <y-editor name="body" value="<p>hi</p>" disabled></y-editor>
                </form>
            `);
            const data = new FormData(form);
            expect(data.get("body")).to.be.null;
        });

        it("restores the initial value on form reset", async () => {
            const form = await fixture(html`
                <form>
                    <y-editor name="body" value="<p>start</p>"></y-editor>
                </form>
            `);
            const el = form.querySelector("y-editor");
            el.value = "<p>edited</p>";
            form.reset();
            expect(el.value).to.equal("<p>start</p>");
        });
    });

    describe("paste", () => {
        function pasteEvent(data) {
            const dt = new DataTransfer();
            for (const [type, value] of Object.entries(data))
                dt.setData(type, value);
            return new ClipboardEvent("paste", {
                clipboardData: dt,
                bubbles: true,
                cancelable: true,
            });
        }

        it("sanitizes pasted HTML", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            el.focus();
            selectAll(el);
            content(el).dispatchEvent(
                pasteEvent({
                    "text/html": "<p>ok</p><script>window.__pwn=1;</script>",
                }),
            );
            expect(el.value).to.contain("ok");
            expect(content(el).querySelector("script")).to.not.exist;
        });

        it("normalizes pasted HTML to the allowed block set", async () => {
            const el = await fixture(
                html`<y-editor allowed-blocks="p"></y-editor>`,
            );
            el.focus();
            selectAll(el);
            content(el).dispatchEvent(
                pasteEvent({ "text/html": "<h1>Big</h1>" }),
            );
            expect(el.value).to.not.contain("<h1>");
            expect(el.value).to.contain("Big");
        });
    });

    describe("image", () => {
        it("opens the local file picker when the image tool is used", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            const fileInput = el.shadowRoot.querySelector(".file-input");
            const click = sandbox.stub(fileInput, "click");
            const prompt = sandbox.stub(window, "prompt");

            tool(el, "image").click();

            expect(click.calledOnce).to.be.true;
            expect(prompt.called).to.be.false;
        });

        it("opens the file picker in routed upload mode too", async () => {
            const el = await fixture(html`<y-editor image-upload></y-editor>`);
            const fileInput = el.shadowRoot.querySelector(".file-input");
            const click = sandbox.stub(fileInput, "click");

            tool(el, "image").click();

            expect(click.calledOnce).to.be.true;
        });
    });

    describe("layout", () => {
        // The min-height calc references --component-editor-line-height. An
        // undefined var poisons the whole expression, so without an in-calc
        // fallback this silently collapses to `auto` wherever the token
        // stylesheet has not been loaded.
        it("derives a min-height from rows without the token stylesheet", async () => {
            const el = await fixture(html`<y-editor rows="3"></y-editor>`);
            const minHeight = getComputedStyle(content(el)).minHeight;
            expect(minHeight).to.not.equal("auto");
            expect(parseFloat(minHeight)).to.be.greaterThan(0);
        });

        it("scales min-height with rows", async () => {
            const short = await fixture(html`<y-editor rows="3"></y-editor>`);
            const tall = await fixture(html`<y-editor rows="12"></y-editor>`);
            expect(
                parseFloat(getComputedStyle(content(tall)).minHeight),
            ).to.be.greaterThan(
                parseFloat(getComputedStyle(content(short)).minHeight),
            );
        });
    });

    describe("theme scope", () => {
        it("keeps the link popover inside the editor's shadow root", async () => {
            const el = await fixture(html`<y-editor></y-editor>`);
            const popover = el.shadowRoot.querySelector("y-popover");
            expect(popover).to.exist;
            expect(popover.hasAttribute("portal")).to.be.false;
        });
    });

    describe("mentions", () => {
        const mentionFixture = () =>
            fixture(
                html`<y-editor
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user"}]'
                ></y-editor>`,
            );

        it("stays inert until triggers are configured", async () => {
            const el = await fixture(
                html`<y-editor mention-query-delay="0"></y-editor>`,
            );
            const spy = sandbox.spy();
            el.addEventListener("mention-query", spy);

            typeInto(el, "@jo");
            await aTimeout(20);
            expect(spy.called).to.be.false;
        });

        it("queries with the trigger, type, query, and a monotonic id", async () => {
            const el = await mentionFixture();
            const first = await openMentions(el, "@jo", PEOPLE);

            expect(first).to.include({
                trigger: "@",
                type: "user",
                query: "jo",
            });
            expect(first.id).to.be.a("number");

            const second = await openMentions(el, "@joh", PEOPLE);
            expect(second.id).to.be.greaterThan(first.id);
        });

        it("does not query a trigger sitting mid-word", async () => {
            const el = await mentionFixture();
            const spy = sandbox.spy();
            el.addEventListener("mention-query", spy);

            typeInto(el, "mail@example");
            await aTimeout(20);
            expect(spy.called).to.be.false;
        });

        it("renders candidates as a listbox and takes combobox semantics", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            const surface = content(el);
            expect(surface.getAttribute("role")).to.equal("combobox");
            expect(surface.getAttribute("aria-expanded")).to.equal("true");
            expect(surface.getAttribute("aria-autocomplete")).to.equal("list");
            expect(surface.getAttribute("aria-haspopup")).to.equal("listbox");

            const list = el.shadowRoot.querySelector(".mention-list");
            expect(surface.getAttribute("aria-controls")).to.equal(list.id);
            expect(list.getAttribute("role")).to.equal("listbox");
            expect(options(el).length).to.equal(2);
            expect(options(el)[0].getAttribute("aria-selected")).to.equal(
                "true",
            );
            expect(surface.getAttribute("aria-activedescendant")).to.equal(
                options(el)[0].id,
            );
        });

        it("moves the highlight with the arrow keys, wrapping", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            press(el, "ArrowDown");
            expect(options(el)[1].getAttribute("aria-selected")).to.equal(
                "true",
            );
            press(el, "ArrowDown");
            expect(options(el)[0].getAttribute("aria-selected")).to.equal(
                "true",
            );
            press(el, "ArrowUp");
            expect(options(el)[1].getAttribute("aria-selected")).to.equal(
                "true",
            );
        });

        it("discards candidates for a superseded query", async () => {
            const el = await mentionFixture();
            const stale = await openMentions(el, "@a", PEOPLE);
            await openMentions(el, "@ad", [{ value: "ada" }]);

            el.setMentionCandidates(stale.id, [
                { value: "x" },
                { value: "y" },
                { value: "z" },
            ]);
            expect(options(el).length).to.equal(1);
        });

        it("replaces the fragment on Enter and restores the surface roles", async () => {
            const el = await mentionFixture();
            await openMentions(el, "hi @a", PEOPLE);

            press(el, "Enter");

            expect(el.textContent).to.equal("hi @Ada Lovelace ");
            expect(content(el).getAttribute("role")).to.equal("textbox");
            expect(content(el).hasAttribute("aria-expanded")).to.be.false;
            expect(content(el).hasAttribute("aria-activedescendant")).to.be
                .false;
        });

        it("makes the insertion a single undo step", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            press(el, "Enter");
            expect(el.textContent).to.equal("@Ada Lovelace ");

            el.undo();
            expect(el.textContent).to.equal("@a");
        });

        it("lets mention-insert be cancelled", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            el.addEventListener("mention-insert", (e) => e.preventDefault());
            press(el, "Enter");

            expect(el.textContent).to.equal("@a");
        });

        it("closes on Escape, leaving the typed trigger intact", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            const closed = oneEvent(el, "mention-close");
            press(el, "Escape");
            const { detail } = await closed;

            expect(detail).to.include({ type: "user", reason: "escape" });
            expect(el.textContent).to.equal("@a");
            expect(content(el).getAttribute("role")).to.equal("textbox");
        });

        it("closes when the fragment is abandoned", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            const closed = oneEvent(el, "mention-close");
            typeInto(el, "@a done");
            const { detail } = await closed;

            expect(detail.reason).to.be.a("string");
            expect(options(el).length).to.equal(0);
        });

        it("suspends detection while an IME composition is running", async () => {
            const el = await mentionFixture();
            const spy = sandbox.spy();
            el.addEventListener("mention-query", spy);

            content(el).dispatchEvent(
                new CompositionEvent("compositionstart", { bubbles: true }),
            );
            typeInto(el, "@ab");
            await aTimeout(20);
            expect(spy.called).to.be.false;

            const queried = oneEvent(el, "mention-query");
            content(el).dispatchEvent(
                new CompositionEvent("compositionend", { bubbles: true }),
            );
            const { detail } = await queried;
            expect(detail.query).to.equal("ab");
        });

        it("never triggers while disabled or readonly", async () => {
            const el = await mentionFixture();
            const spy = sandbox.spy();
            el.addEventListener("mention-query", spy);

            el.readonly = true;
            typeInto(el, "@jo");
            await aTimeout(20);
            expect(spy.called).to.be.false;

            el.readonly = false;
            el.disabled = true;
            typeInto(el, "@jo");
            await aTimeout(20);
            expect(spy.called).to.be.false;
        });

        it("dismisses the popup from closeMentions without touching the text", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            el.closeMentions();
            expect(options(el).length).to.equal(0);
            expect(el.textContent).to.equal("@a");
        });

        it("inserts programmatically at the caret", async () => {
            const el = await mentionFixture();
            typeInto(el, "hello");
            el.insertMention({ value: "ada", label: "Ada" }, "@");
            expect(el.textContent).to.equal("hello@Ada ");
        });

        it("replaces the active fragment when inserting programmatically", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            el.insertMention(PEOPLE[1]);
            expect(el.textContent).to.equal("@Grace Hopper ");
        });

        it("anchors the popup on the fragment, below the caret line", async () => {
            const el = await mentionFixture();
            await openMentions(el, "hello world @a", PEOPLE);
            await aTimeout(0);

            const popover = el.shadowRoot.querySelector(".mention-popover");
            const surface = popover.shadowRoot.querySelector(".surface");
            expect(popover.open).to.be.true;
            expect(surface.hidden).to.be.false;

            // The anchor tracks the fragment, so it sits well right of the
            // surface's left edge only if it were parked at the origin.
            const anchor = el.shadowRoot.querySelector(".mention-anchor");
            const anchorBox = anchor.getBoundingClientRect();
            const contentBox = content(el).getBoundingClientRect();
            expect(anchorBox.left).to.be.greaterThan(contentBox.left);
            expect(anchorBox.height).to.be.greaterThan(0);

            // Placed under the caret rather than over it.
            expect(surface.getBoundingClientRect().top).to.be.at.least(
                anchorBox.top,
            );
        });

        it("shows the empty state when a query returns nothing", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@zz", []);

            const empty = el.shadowRoot.querySelector(".mention-empty");
            expect(empty.hidden).to.be.false;
            expect(options(el).length).to.equal(0);
        });

        it("shows the busy state while mention-loading is set", async () => {
            const el = await mentionFixture();
            const queried = oneEvent(el, "mention-query");
            typeInto(el, "@a");
            await queried;

            el.mentionLoading = true;
            const busy = el.shadowRoot.querySelector(".mention-loading");
            expect(busy.hidden).to.be.false;

            el.mentionCandidates = PEOPLE;
            expect(busy.hidden).to.be.true;
            expect(options(el).length).to.equal(2);
        });
    });

    describe("atomic mentions", () => {
        const atomicFixture = () =>
            fixture(
                html`<y-editor
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user","atomic":true}]'
                ></y-editor>`,
            );

        async function insertAtomic(el) {
            await openMentions(el, "@a", PEOPLE);
            press(el, "Enter");
        }

        it("inserts one non-editable node carrying the mention data", async () => {
            const el = await atomicFixture();
            await insertAtomic(el);

            const chip = content(el).querySelector("span[data-mention-value]");
            expect(chip).to.exist;
            expect(chip.getAttribute("contenteditable")).to.equal("false");
            expect(chip.dataset.mentionType).to.equal("user");
            expect(chip.dataset.mentionValue).to.equal("ada");
            expect(chip.getAttribute("part")).to.equal("mention-chip");
        });

        it("renders as its insert template for plain-text counting", async () => {
            const el = await atomicFixture();
            await insertAtomic(el);
            expect(el.textContent).to.equal("@Ada Lovelace ");
        });

        it("survives the serialize / parse round trip", async () => {
            const el = await atomicFixture();
            await insertAtomic(el);

            const value = el.value;
            expect(value).to.contain('data-mention-value="ada"');

            el.value = value;
            const chip = content(el).querySelector("span[data-mention-value]");
            expect(chip).to.exist;
            expect(chip.getAttribute("contenteditable")).to.equal("false");
            expect(el.textContent).to.equal("@Ada Lovelace ");
        });

        it("deletes as one unit on Backspace", async () => {
            const el = await atomicFixture();
            // The state a user reaches by backspacing over the trailing space:
            // the chip is the last thing in the block, caret right after it.
            el.value =
                '<p><span data-mention-type="user" data-mention-value="ada">@Ada Lovelace</span></p>';
            const block = content(el).firstElementChild;
            setCaret(el, block, block.childNodes.length);

            const event = new InputEvent("beforeinput", {
                inputType: "deleteContentBackward",
                bubbles: true,
                cancelable: true,
            });
            content(el).dispatchEvent(event);

            expect(event.defaultPrevented).to.be.true;
            expect(chipCount(el)).to.equal(0);
            expect(el.textContent).to.equal("");
        });

        it("leaves the chip alone when Backspace lands on the trailing space", async () => {
            const el = await atomicFixture();
            await insertAtomic(el);

            const event = new InputEvent("beforeinput", {
                inputType: "deleteContentBackward",
                bubbles: true,
                cancelable: true,
            });
            content(el).dispatchEvent(event);

            expect(event.defaultPrevented).to.be.false;
            expect(chipCount(el)).to.equal(1);
        });
    });
});
