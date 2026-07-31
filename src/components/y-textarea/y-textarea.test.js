import { html, fixture, expect, oneEvent, aTimeout } from "@open-wc/testing";
import "./y-textarea.js";

function control(el) {
    return el.shadowRoot.querySelector("textarea");
}

/** Set the value and drop the caret at the end, as typing would. */
function typeInto(el, text) {
    const textarea = control(el);
    textarea.value = text;
    textarea.setSelectionRange(text.length, text.length);
    textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

/** Type a fragment, answer the query it raises, and hand back the query detail. */
async function openMentions(el, text, candidates) {
    const queried = oneEvent(el, "mention-query");
    typeInto(el, text);
    const { detail } = await queried;
    el.setMentionCandidates(detail.id, candidates);
    return detail;
}

function options(el) {
    return [...el.shadowRoot.querySelectorAll(".mention-option")];
}

function press(el, key) {
    control(el).dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
    );
}

const PEOPLE = [
    { value: "ada", label: "Ada Lovelace", description: "Engineering" },
    { value: "grace", label: "Grace Hopper" },
];

describe("YumeTextarea", () => {
    it("variant='underline' renders a bottom-only border with square bottom corners", async () => {
        const el = await fixture(html`<y-textarea variant="underline"></y-textarea>`);
        el.style.setProperty("--component-inputs-border-radius-outer", "6px");
        const cs = getComputedStyle(el.shadowRoot.querySelector(".input-container"));
        expect(cs.borderTopStyle).to.equal("none");
        expect(cs.borderBottomStyle).to.equal("solid");
        expect(cs.borderTopLeftRadius).to.equal("6px");
        expect(cs.borderBottomLeftRadius).to.equal("0px");
    });

    it("focuses the textarea when the container padding is clicked", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");
        const container = el.shadowRoot.querySelector(".input-container");

        container.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, cancelable: true })
        );

        expect(el.shadowRoot.activeElement).to.equal(textarea);
    });

    // ── Structure ─────────────────────────────────────────────
    it("renders a textarea element, not an input", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");
        const input = el.shadowRoot.querySelector("input");

        expect(textarea).to.exist;
        expect(input).to.not.exist;
    });

    it("exposes textarea via part attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("[part='textarea']");
        expect(textarea).to.exist;
    });

    it("renders input-container and input-wrapper", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        expect(el.shadowRoot.querySelector(".input-container")).to.exist;
        expect(el.shadowRoot.querySelector(".input-wrapper")).to.exist;
    });

    // ── Defaults ──────────────────────────────────────────────
    it("defaults to 3 rows", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");
        expect(textarea.getAttribute("rows")).to.equal("3");
    });

    it("defaults value to empty string", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        expect(el.value).to.equal("");
    });

    it("defaults to medium size", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const style = el.shadowRoot.adoptedStyleSheets[0].cssRules;
        const rules = Array.from(style).map((r) => r.cssText).join(" ");
        expect(rules).to.include("--component-inputs-padding-medium");
    });

    it("container aligns to flex-start for multiline content", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("align-items: flex-start");
    });

    // ── Value ─────────────────────────────────────────────────
    it("sets initial value via attribute", async () => {
        const el = await fixture(
            html`<y-textarea value="Hello"></y-textarea>`,
        );
        expect(el.value).to.equal("Hello");
        expect(el.shadowRoot.querySelector("textarea").value).to.equal("Hello");
    });

    it("value setter updates the textarea", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.value = "Updated";
        expect(el.value).to.equal("Updated");
        expect(el.shadowRoot.querySelector("textarea").value).to.equal(
            "Updated",
        );
    });

    it("value attribute change updates textarea", async () => {
        const el = await fixture(
            html`<y-textarea value="Before"></y-textarea>`,
        );
        el.setAttribute("value", "After");
        await new Promise((r) => setTimeout(r, 0));
        expect(el.shadowRoot.querySelector("textarea").value).to.equal("After");
    });

    // ── Rows ──────────────────────────────────────────────────
    it("respects rows attribute", async () => {
        const el = await fixture(
            html`<y-textarea rows="6"></y-textarea>`,
        );
        const textarea = el.shadowRoot.querySelector("textarea");
        expect(textarea.getAttribute("rows")).to.equal("6");
    });

    it("re-renders when rows attribute changes", async () => {
        const el = await fixture(
            html`<y-textarea rows="3"></y-textarea>`,
        );
        el.setAttribute("rows", "8");
        await new Promise((r) => setTimeout(r, 0));
        expect(
            el.shadowRoot.querySelector("textarea").getAttribute("rows"),
        ).to.equal("8");
    });

    // ── Size ──────────────────────────────────────────────────
    it("applies small size padding variable", async () => {
        const el = await fixture(
            html`<y-textarea size="small"></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--component-inputs-padding-small");
    });

    it("applies large size padding variable", async () => {
        const el = await fixture(
            html`<y-textarea size="large"></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--component-inputs-padding-large");
    });

    // ── Disabled ──────────────────────────────────────────────
    it("disables the textarea element when disabled attribute is set", async () => {
        const el = await fixture(
            html`<y-textarea disabled></y-textarea>`,
        );
        const textarea = el.shadowRoot.querySelector("textarea");
        expect(textarea.hasAttribute("disabled")).to.be.true;
    });

    it("applies disabled opacity and pointer-events via CSS", async () => {
        const el = await fixture(
            html`<y-textarea disabled></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("opacity: 0.75");
        expect(rules).to.include("pointer-events: none");
    });

    it("uses disabled background variable when disabled", async () => {
        const el = await fixture(
            html`<y-textarea disabled></y-textarea>`,
        );
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include(
            "var(--component-input-background-disabled)",
        );
    });

    // ── Invalid ───────────────────────────────────────────────
    it("adds is-invalid class to container when invalid", async () => {
        const el = await fixture(
            html`<y-textarea invalid></y-textarea>`,
        );
        const container = el.shadowRoot.querySelector(".input-container");
        expect(container.classList.contains("is-invalid")).to.be.true;
    });

    it("removes is-invalid class when invalid attribute is removed", async () => {
        const el = await fixture(
            html`<y-textarea invalid></y-textarea>`,
        );
        el.removeAttribute("invalid");
        await new Promise((r) => setTimeout(r, 0));
        const container = el.shadowRoot.querySelector(".input-container");
        expect(container.classList.contains("is-invalid")).to.be.false;
    });

    // ── Label ─────────────────────────────────────────────────
    it("renders label slot above textarea by default", async () => {
        const el = await fixture(
            html`<y-textarea>
                <span slot="label">Message</span>
            </y-textarea>`,
        );
        const wrapper = el.shadowRoot.querySelector(".input-wrapper");
        const children = Array.from(wrapper.children);
        const labelIdx = children.findIndex((c) =>
            c.classList.contains("label-wrapper"),
        );
        const containerIdx = children.findIndex((c) =>
            c.classList.contains("input-container"),
        );
        expect(labelIdx).to.be.lessThan(containerIdx);
    });

    // ── Events ────────────────────────────────────────────────
    it("dispatches input event when user types", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");

        setTimeout(() => {
            textarea.value = "typed";
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        });

        const event = await oneEvent(el, "input");
        expect(event.detail.value).to.equal("typed");
    });

    it("updates value attribute when input event fires", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = el.shadowRoot.querySelector("textarea");

        textarea.value = "new content";
        textarea.dispatchEvent(new Event("input", { bubbles: true }));

        expect(el.getAttribute("value")).to.equal("new content");
    });

    it("re-emits the inner textarea's native 'change' on the host", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const textarea = control(el);
        const events = [];
        el.addEventListener("change", (e) => events.push(e));

        // The browser fires this on commit (blur after an edit); native
        // `change` is not composed, so it stops at the shadow boundary.
        textarea.value = "committed";
        textarea.dispatchEvent(new Event("change", { bubbles: true }));

        expect(events.length).to.equal(1);
        expect(events[0].detail.value).to.equal("committed");
        expect(events[0].composed).to.be.true;
        expect(el.getAttribute("value")).to.equal("committed");
    });

    it("does not fire 'change' while typing", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        const events = [];
        el.addEventListener("change", (e) => events.push(e));

        typeInto(el, "typ");

        expect(events.length).to.equal(0);
    });

    // ── Re-render ─────────────────────────────────────────────
    it("re-renders when size attribute changes", async () => {
        const el = await fixture(
            html`<y-textarea size="small"></y-textarea>`,
        );
        el.setAttribute("size", "large");
        await new Promise((r) => setTimeout(r, 0));
        const rules = Array.from(
            el.shadowRoot.adoptedStyleSheets[0].cssRules,
        )
            .map((r) => r.cssText)
            .join(" ");
        expect(rules).to.include("--component-inputs-padding-large");
    });

    it("re-renders when disabled is toggled", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        expect(
            el.shadowRoot.querySelector("textarea").hasAttribute("disabled"),
        ).to.be.false;

        el.setAttribute("disabled", "");
        await new Promise((r) => setTimeout(r, 0));

        expect(
            el.shadowRoot.querySelector("textarea").hasAttribute("disabled"),
        ).to.be.true;
    });

    it("disabled setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
    });

    it("invalid setter sets and removes attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.invalid = true;
        expect(el.hasAttribute("invalid")).to.be.true;
        el.invalid = false;
        expect(el.hasAttribute("invalid")).to.be.false;
    });

    it("size setter updates attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.size = "large";
        expect(el.getAttribute("size")).to.equal("large");
    });

    it("labelPosition setter updates attribute", async () => {
        const el = await fixture(html`<y-textarea></y-textarea>`);
        el.labelPosition = "bottom";
        expect(el.getAttribute("label-position")).to.equal("bottom");
    });

    it("value setter falls back to setAttribute when textarea element is not yet available", async () => {
        const el = document.createElement("y-textarea");
        el.value = "preset";
        document.body.appendChild(el);
        await new Promise((r) => setTimeout(r, 0));
        expect(el.value).to.equal("preset");
        document.body.removeChild(el);
    });

    describe("placeholder", () => {
        it("has no placeholder by default", async () => {
            const el = await fixture(html`<y-textarea></y-textarea>`);
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("");
            expect(el.placeholder).to.equal("");
        });

        it("applies the placeholder attribute to the inner textarea", async () => {
            const el = await fixture(
                html`<y-textarea placeholder="Write something..."></y-textarea>`
            );
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal(
                "Write something..."
            );
        });

        it("updates the inner textarea when the attribute changes", async () => {
            const el = await fixture(
                html`<y-textarea placeholder="First"></y-textarea>`
            );
            el.setAttribute("placeholder", "Second");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("Second");

            el.removeAttribute("placeholder");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("");
        });

        it("reflects the placeholder property to the attribute", async () => {
            const el = await fixture(html`<y-textarea></y-textarea>`);
            el.placeholder = "Type here";
            expect(el.getAttribute("placeholder")).to.equal("Type here");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("Type here");

            el.placeholder = "";
            expect(el.hasAttribute("placeholder")).to.be.false;
        });

        it("survives a re-render triggered by another attribute", async () => {
            const el = await fixture(
                html`<y-textarea placeholder="Keep me"></y-textarea>`
            );
            el.setAttribute("size", "large");
            expect(el.shadowRoot.querySelector("textarea").placeholder).to.equal("Keep me");
        });
    });

    describe("XSS hardening", () => {
        it("does not allow attribute breakout via placeholder", async () => {
            const hostile = `Hi" onfocus="window.__xssTextareaPlaceholder=true" autofocus x="`;
            const el = document.createElement("y-textarea");
            el.setAttribute("placeholder", hostile);
            document.body.appendChild(el);

            expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
            expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
            expect(window.__xssTextareaPlaceholder).to.be.undefined;

            document.body.removeChild(el);
        });

        it("does not allow attribute breakout via rows", async () => {
            const hostile = `3" onfocus="window.__xssTextareaRows=true" autofocus x="`;
            const el = document.createElement("y-textarea");
            el.setAttribute("rows", hostile);
            document.body.appendChild(el);

            expect(el.shadowRoot.querySelector("[onfocus]")).to.be.null;
            expect(el.shadowRoot.querySelector("[autofocus]")).to.be.null;
            expect(window.__xssTextareaRows).to.be.undefined;

            document.body.removeChild(el);
        });
    });
    describe("accessibility forwarding", () => {
        it("forwards aria-label, required, and autocomplete to the inner textarea", async () => {
            const el = await fixture(
                html`<y-textarea
                    aria-label="Bio"
                    required
                    autocomplete="off"
                ></y-textarea>`,
            );
            const textarea = el.shadowRoot.querySelector("textarea");

            expect(textarea.getAttribute("aria-label")).to.equal("Bio");
            expect(textarea.hasAttribute("required")).to.be.true;
            expect(textarea.getAttribute("autocomplete")).to.equal("off");
        });

        it("describes the inner textarea from error-text within its own root", async () => {
            const el = await fixture(html`<y-textarea></y-textarea>`);
            el.errorText = "Tell us something";

            const textarea = el.shadowRoot.querySelector("textarea");
            const message = el.shadowRoot.getElementById(
                textarea.getAttribute("aria-describedby"),
            );

            expect(textarea.getAttribute("aria-invalid")).to.equal("true");
            expect(message).to.exist;
            expect(message.textContent).to.equal("Tell us something");
        });

        it("toggles disabled without replacing the textarea", async () => {
            const el = await fixture(html`<y-textarea></y-textarea>`);
            const textarea = el.shadowRoot.querySelector("textarea");

            el.disabled = true;
            expect(textarea.disabled).to.be.true;
            el.disabled = false;

            expect(el.shadowRoot.querySelector("textarea") === textarea).to.be
                .true;
        });
    });

    describe("mentions", () => {
        const mentionFixture = () =>
            fixture(
                html`<y-textarea
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user"}]'
                ></y-textarea>`,
            );

        it("stays inert until triggers are configured", async () => {
            const el = await fixture(
                html`<y-textarea mention-query-delay="0"></y-textarea>`,
            );
            let queried = false;
            el.addEventListener("mention-query", () => {
                queried = true;
            });

            typeInto(el, "@jo");
            await aTimeout(20);
            expect(queried).to.be.false;
        });

        it("queries with the trigger, type, query, and a monotonic id", async () => {
            const el = await mentionFixture();
            const first = await openMentions(el, "@jo", PEOPLE);

            expect(first).to.include({
                trigger: "@",
                type: "user",
                query: "jo",
            });

            const second = await openMentions(el, "@joh", PEOPLE);
            expect(second.id).to.be.greaterThan(first.id);
        });

        it("does not query a trigger sitting mid-word", async () => {
            const el = await mentionFixture();
            let queried = false;
            el.addEventListener("mention-query", () => {
                queried = true;
            });

            typeInto(el, "mail@example");
            await aTimeout(20);
            expect(queried).to.be.false;
        });

        it("activates a trigger at the start of a wrapped line", async () => {
            const el = await mentionFixture();
            const { query } = await openMentions(el, "first line\n@jo", PEOPLE);
            expect(query).to.equal("jo");
        });

        it("gives the textarea combobox semantics while open", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            const textarea = control(el);
            const list = el.shadowRoot.querySelector(".mention-list");
            expect(textarea.getAttribute("role")).to.equal("combobox");
            expect(textarea.getAttribute("aria-expanded")).to.equal("true");
            expect(textarea.getAttribute("aria-autocomplete")).to.equal("list");
            expect(textarea.getAttribute("aria-haspopup")).to.equal("listbox");
            expect(textarea.getAttribute("aria-controls")).to.equal(list.id);
            expect(textarea.getAttribute("aria-activedescendant")).to.equal(
                options(el)[0].id,
            );
            expect(options(el).length).to.equal(2);
        });

        it("reverts to plain textbox semantics on close", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            press(el, "Escape");

            const textarea = control(el);
            expect(textarea.hasAttribute("role")).to.be.false;
            expect(textarea.hasAttribute("aria-expanded")).to.be.false;
            expect(textarea.hasAttribute("aria-controls")).to.be.false;
            expect(textarea.hasAttribute("aria-activedescendant")).to.be.false;
        });

        it("replaces the fragment with plain text on Enter", async () => {
            const el = await mentionFixture();
            await openMentions(el, "hi @a", PEOPLE);

            press(el, "Enter");

            expect(control(el).value).to.equal("hi @Ada Lovelace ");
            expect(el.value).to.equal("hi @Ada Lovelace ");
        });

        it("ignores atomic — the value stays an unstructured string", async () => {
            const el = await fixture(
                html`<y-textarea
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user","atomic":true}]'
                ></y-textarea>`,
            );
            await openMentions(el, "@a", PEOPLE);

            press(el, "Enter");

            expect(el.value).to.equal("@Ada Lovelace ");
            expect(
                el.shadowRoot.querySelectorAll("[data-mention-value]").length,
            ).to.equal(0);
        });

        it("discards candidates for a superseded query", async () => {
            const el = await mentionFixture();
            const stale = await openMentions(el, "@a", PEOPLE);
            await openMentions(el, "@ad", [{ value: "ada" }]);

            el.setMentionCandidates(stale.id, [
                { value: "x" },
                { value: "y" },
            ]);
            expect(options(el).length).to.equal(1);
        });

        it("closes on Escape, leaving the typed trigger intact", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            const closed = oneEvent(el, "mention-close");
            press(el, "Escape");
            const { detail } = await closed;

            expect(detail).to.include({ type: "user", reason: "escape" });
            expect(el.value).to.equal("@a");
        });

        it("stays dismissed after Escape until the query moves on", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);
            press(el, "Escape");

            // A caret refresh over the same fragment must not re-query.
            let requeried = false;
            el.addEventListener("mention-query", () => {
                requeried = true;
            });
            control(el).dispatchEvent(
                new KeyboardEvent("keyup", { key: "Escape", bubbles: true }),
            );
            await aTimeout(20);

            expect(requeried).to.be.false;
            expect(options(el).length).to.equal(0);
            expect(control(el).hasAttribute("aria-expanded")).to.be.false;

            // Typing again reopens it.
            await openMentions(el, "@ad", PEOPLE);
            expect(options(el).length).to.equal(2);
        });

        it("lets several triggers coexist, one active at a time", async () => {
            const el = await fixture(
                html`<y-textarea
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user"},{"trigger":"#","type":"topic"}]'
                ></y-textarea>`,
            );

            expect((await openMentions(el, "@bo", PEOPLE)).type).to.equal(
                "user",
            );
            expect(
                (await openMentions(el, "@bob #ta", PEOPLE)).type,
            ).to.equal("topic");
        });

        it("never triggers while disabled", async () => {
            const el = await mentionFixture();
            let queried = false;
            el.addEventListener("mention-query", () => {
                queried = true;
            });

            el.disabled = true;
            typeInto(el, "@jo");
            await aTimeout(20);
            expect(queried).to.be.false;
        });

        it("anchors the popup to the caret", async () => {
            const el = await mentionFixture();
            await openMentions(el, "hello @a", PEOPLE);

            const anchor = el.shadowRoot.querySelector(".mention-anchor");
            expect(parseFloat(anchor.style.left)).to.be.greaterThan(0);
            expect(anchor.style.height).to.not.equal("");
        });

        it("keeps the anchor at the caret as the query grows", async () => {
            // The popup must not stay pinned to the trigger character: a long
            // query would leave it sitting well behind what is being typed.
            const el = await mentionFixture();
            const anchor = el.shadowRoot.querySelector(".mention-anchor");

            await openMentions(el, "@a", PEOPLE);
            const short = parseFloat(anchor.style.left);

            await openMentions(el, "@abcdefghij", PEOPLE);
            const long = parseFloat(anchor.style.left);

            expect(long).to.be.greaterThan(short);
        });

        it("does not reopen on the text it just inserted", async () => {
            // With allowSpaces the inserted "@ada " is itself a valid fragment
            // (one space, within maxChars), so a naive re-scan reopens the popup
            // on the mention that was just committed.
            const el = await fixture(
                html`<y-textarea
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user","allowSpaces":true,"insert":"{trigger}{value} "}]'
                ></y-textarea>`,
            );
            await openMentions(el, "@a", [{ value: "ada" }]);
            press(el, "Enter");
            expect(el.value).to.equal("@ada ");

            let reopened = false;
            el.addEventListener("mention-query", () => {
                reopened = true;
            });
            // Re-evaluate the caret the way selectionchange / keyup would.
            control(el).dispatchEvent(new Event("keyup", { bubbles: true }));
            await aTimeout(30);

            expect(reopened).to.be.false;
            expect(options(el).length).to.equal(0);
        });

        it("reopens once the query moves past the inserted text", async () => {
            const el = await fixture(
                html`<y-textarea
                    mention-query-delay="0"
                    triggers='[{"trigger":"@","type":"user","allowSpaces":true,"insert":"{trigger}{value} "}]'
                ></y-textarea>`,
            );
            await openMentions(el, "@a", [{ value: "ada" }]);
            press(el, "Enter");

            // Typing on turns "@ada " into a different fragment, so suppression
            // lapses and the trigger is live again.
            const { query } = await openMentions(el, "@ada b", [
                { value: "bob" },
            ]);
            expect(query).to.equal("ada b");
        });

        it("inserts programmatically, replacing the active fragment", async () => {
            const el = await mentionFixture();
            await openMentions(el, "@a", PEOPLE);

            el.insertMention(PEOPLE[1]);
            expect(el.value).to.equal("@Grace Hopper ");
        });
    });
});
