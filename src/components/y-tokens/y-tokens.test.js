import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-tokens.js";
import "../y-input/y-input.js";
import "../y-theme/y-theme.js";
import variablesCSS from "../../../styles/variables.css";

const OPTIONS = [
    { value: "design", label: "Design" },
    { value: "research", label: "Research" },
    { value: "eng", label: "Engineering" },
];

const input = (el) => el.shadowRoot.querySelector(".input");
const tokens = (el) => el.shadowRoot.querySelectorAll(".token");
const options = (el) => el.shadowRoot.querySelectorAll(".option");
const popup = (el) => el.shadowRoot.querySelector(".popup");
const live = (el) => el.shadowRoot.querySelector(".sr-only");

const type = (el, text) => {
    const field = input(el);
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
};

const key = (el, k, init = {}) =>
    input(el).dispatchEvent(
        new KeyboardEvent("keydown", {
            key: k,
            bubbles: true,
            cancelable: true,
            ...init,
        }),
    );

const values = (el) => el.value.map((token) => token.value);

describe("<y-tokens>", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    describe("rendering", () => {
        it("renders a combobox input, a token list, and a hidden popup", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            expect(input(el).getAttribute("role")).to.equal("combobox");
            expect(input(el).getAttribute("aria-autocomplete")).to.equal("list");
            expect(input(el).getAttribute("aria-expanded")).to.equal("false");
            expect(
                el.shadowRoot.querySelector(".token-list").getAttribute("role"),
            ).to.equal("list");
            expect(popup(el).hidden).to.be.true;
        });

        it("defaults size, label-position, and the chip presentation", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            expect(el.size).to.equal("medium");
            expect(el.labelPosition).to.equal("top");
            expect(el.tokenVariant).to.equal("filled");
            expect(el.tokenShape).to.equal("square");
            expect(el.duplicates).to.equal("ignore");
            expect(el.filter).to.equal("contains");
            expect(el.queryDelay).to.equal(200);
            expect(el.separators).to.equal(",");
        });

        it("renders one y-tag per token, one size step down", async () => {
            const el = await fixture(
                html`<y-tokens size="large" value='["a","b"]'></y-tokens>`,
            );
            const chips = tokens(el);
            expect(chips).to.have.lengthOf(2);
            expect(chips[0].tagName.toLowerCase()).to.equal("y-tag");
            expect(chips[0].getAttribute("size")).to.equal("medium");
            expect(chips[0].getAttribute("role")).to.equal("listitem");
        });

        it("names each remove control after its own token", async () => {
            const el = await fixture(
                html`<y-tokens value='[{"value":"d","label":"Design"}]'></y-tokens>`,
            );
            expect(
                el.shadowRoot
                    .querySelector(".token-remove")
                    .getAttribute("aria-label"),
            ).to.equal("Remove Design");
        });

        it("renders the empty and loading slots unconditionally", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            expect(el.shadowRoot.querySelector('slot[name="empty"]')).to.exist;
            expect(el.shadowRoot.querySelector('slot[name="loading"]')).to.exist;
            expect(el.shadowRoot.querySelector('slot[name="label"]')).to.exist;
            expect(el.shadowRoot.querySelector('slot[name="left-icon"]')).to
                .exist;
        });

        it("hides the input entirely when readonly", async () => {
            const el = await fixture(
                html`<y-tokens readonly value='["a"]'></y-tokens>`,
            );
            expect(input(el)).to.not.exist;
            expect(el.shadowRoot.querySelector(".token-remove")).to.not.exist;
            expect(tokens(el)[0].getAttribute("tabindex")).to.equal("0");
        });

        it("takes the input out of the tab order when disabled", async () => {
            const el = await fixture(html`<y-tokens disabled></y-tokens>`);
            expect(input(el).disabled).to.be.true;
            expect(input(el).getAttribute("tabindex")).to.equal("-1");
            expect(
                el.shadowRoot.querySelector(".control").getAttribute("aria-disabled"),
            ).to.equal("true");
        });
    });

    describe("value coercion", () => {
        it("accepts a JSON array attribute", async () => {
            const el = await fixture(
                html`<y-tokens
                    value='[{"value":"a","label":"Alpha"},"b"]'
                ></y-tokens>`,
            );
            expect(values(el)).to.eql(["a", "b"]);
            expect(el.value[0].label).to.equal("Alpha");
        });

        it("accepts a separator-delimited attribute", async () => {
            const el = await fixture(
                html`<y-tokens value="a, b ,c"></y-tokens>`,
            );
            expect(values(el)).to.eql(["a", "b", "c"]);
        });

        it("does not reflect an imperative set back to the attribute", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.value = [{ value: "x" }];
            expect(values(el)).to.eql(["x"]);
            expect(el.hasAttribute("value")).to.be.false;
        });

        it("strips the options-only disabled key from committed tokens", async () => {
            const el = await fixture(
                html`<y-tokens
                    value='[{"value":"a","disabled":true}]'
                ></y-tokens>`,
            );
            expect(el.value[0]).to.eql({ value: "a" });

            el.value = [{ value: "b", label: "B", disabled: true }];
            expect(el.value[0]).to.eql({ value: "b", label: "B" });

            el.addToken({ value: "c", disabled: true });
            expect(el.value[1]).to.eql({ value: "c" });
        });

        it("keeps disabled on options", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = [{ value: "a", disabled: true }, { value: "b" }];
            expect(el.options[0].disabled).to.be.true;
            expect(el.options[1].disabled).to.be.undefined;
        });

        it("does not carry disabled across when an option is committed", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = [{ value: "a", label: "Alpha" }];
            input(el).dispatchEvent(new FocusEvent("focus"));
            options(el)[0].click();

            expect(el.value[0]).to.eql({ value: "a", label: "Alpha" });
        });

        it("drops entries with no value", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.value = ["a", "", { label: "no value" }, { value: "  " }];
            expect(values(el)).to.eql(["a"]);
        });
    });

    describe("committing", () => {
        it("commits the typed text on Enter when allow-custom is set", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            type(el, "hello");
            key(el, "Enter");
            expect(values(el)).to.eql(["hello"]);
            expect(input(el).value).to.equal("");
        });

        it("commits on a separator character", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            type(el, "alpha");
            key(el, ",");
            expect(values(el)).to.eql(["alpha"]);
        });

        it("honors a custom separators list", async () => {
            const el = await fixture(
                html`<y-tokens allow-custom separators=",;"></y-tokens>`,
            );
            type(el, "alpha");
            key(el, ";");
            expect(values(el)).to.eql(["alpha"]);
        });

        it("refuses unmatched text and keeps it when allow-custom is off", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            type(el, "nope");
            key(el, "Enter");
            expect(values(el)).to.eql([]);
            expect(input(el).value).to.equal("nope");
            expect(live(el).textContent).to.contain("not an option");
        });

        it("matches an option by label, case-insensitively", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            type(el, "dEsIgN");
            key(el, "Enter");
            expect(values(el)).to.eql(["design"]);
            expect(el.value[0].label).to.equal("Design");
        });

        it("commits a highlighted option on Enter", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            key(el, "ArrowDown");
            key(el, "ArrowDown");
            key(el, "Enter");
            expect(values(el)).to.eql(["research"]);
        });

        it("commits an option on click", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            input(el).dispatchEvent(new FocusEvent("focus"));
            options(el)[0].click();
            expect(values(el)).to.eql(["design"]);
        });

        it("toggles a committed option back off when clicked again", async () => {
            const el = await fixture(
                html`<y-tokens value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            const onRemove = sandbox.spy();
            el.addEventListener("token-remove", onRemove);

            options(el)[0].click();

            expect(values(el)).to.eql([]);
            expect(onRemove.firstCall.args[0].detail.source).to.equal(
                "deselect",
            );
            expect(options(el)[0].classList.contains("is-selected")).to.be
                .false;
        });

        it("toggles off from the keyboard too", async () => {
            const el = await fixture(
                html`<y-tokens value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            key(el, "ArrowDown");
            key(el, "Enter");
            expect(values(el)).to.eql([]);
        });

        it("lets a prevented token-remove keep a deselected option", async () => {
            const el = await fixture(
                html`<y-tokens value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            el.addEventListener("token-remove", (e) => e.preventDefault());
            options(el)[0].click();
            expect(values(el)).to.eql(["design"]);
        });

        it("adds another copy instead of toggling under duplicates=allow", async () => {
            const el = await fixture(
                html`<y-tokens duplicates="allow" value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            options(el)[0].click();
            expect(values(el)).to.eql(["design", "design"]);
        });

        it("still applies the duplicates policy to typed text", async () => {
            const el = await fixture(
                html`<y-tokens value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            type(el, "Design");
            key(el, "Enter");

            expect(values(el)).to.eql(["design"]);
            expect(live(el).textContent).to.contain("already added");
        });

        it("splits a multi-value paste into several tokens with one change", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            const onChange = sandbox.spy();
            el.addEventListener("change", onChange);

            const data = new DataTransfer();
            data.setData("text", "a, b, c");
            input(el).dispatchEvent(
                new ClipboardEvent("paste", {
                    clipboardData: data,
                    bubbles: true,
                    cancelable: true,
                }),
            );

            expect(values(el)).to.eql(["a", "b", "c"]);
            expect(onChange).to.have.been.calledOnce;
        });

        it("drops the unmatched fragments of a paste and commits the rest", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;

            const data = new DataTransfer();
            data.setData("text", "design, nope, eng");
            input(el).dispatchEvent(
                new ClipboardEvent("paste", {
                    clipboardData: data,
                    bubbles: true,
                    cancelable: true,
                }),
            );

            expect(values(el)).to.eql(["design", "eng"]);
            expect(live(el).textContent).to.contain("nope is not an option");
        });

        it("commits pending text on blur when allow-custom is set", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            type(el, "later");
            input(el).dispatchEvent(new FocusEvent("blur"));
            expect(values(el)).to.eql(["later"]);
        });

        it("discards and announces pending text on blur otherwise", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            type(el, "later");
            input(el).dispatchEvent(new FocusEvent("blur"));
            expect(values(el)).to.eql([]);
            expect(input(el).value).to.equal("");
            expect(live(el).textContent).to.contain("discarded");
        });
    });

    describe("duplicates", () => {
        it("ignores a repeat and announces it by default", async () => {
            const el = await fixture(
                html`<y-tokens allow-custom value='["alpha"]'></y-tokens>`,
            );
            type(el, "ALPHA");
            key(el, "Enter");
            expect(values(el)).to.eql(["alpha"]);
            expect(live(el).textContent).to.contain("already added");
        });

        it("adds the repeat under duplicates=allow", async () => {
            const el = await fixture(
                html`<y-tokens
                    allow-custom
                    duplicates="allow"
                    value='["alpha"]'
                ></y-tokens>`,
            );
            type(el, "alpha");
            key(el, "Enter");
            expect(values(el)).to.eql(["alpha", "alpha"]);
        });

        it("goes invalid under duplicates=error", async () => {
            const el = await fixture(
                html`<y-tokens
                    allow-custom
                    duplicates="error"
                    value='["alpha"]'
                ></y-tokens>`,
            );
            type(el, "alpha");
            key(el, "Enter");

            expect(values(el)).to.eql(["alpha"]);
            expect(el.validity.customError).to.be.true;
            expect(
                el.shadowRoot.querySelector(".error-text").textContent,
            ).to.contain("already been added");
        });

        it("clears the duplicate error on the next successful commit", async () => {
            const el = await fixture(
                html`<y-tokens
                    allow-custom
                    duplicates="error"
                    value='["alpha"]'
                ></y-tokens>`,
            );
            type(el, "alpha");
            key(el, "Enter");
            type(el, "beta");
            key(el, "Enter");

            expect(values(el)).to.eql(["alpha", "beta"]);
            expect(el.validity.customError).to.be.false;
        });

        it("preserves the first-committed casing", async () => {
            const el = await fixture(
                html`<y-tokens allow-custom value='["Alpha"]'></y-tokens>`,
            );
            type(el, "alpha");
            key(el, "Enter");
            expect(el.value[0].value).to.equal("Alpha");
        });
    });

    describe("max", () => {
        it("blocks commits at the limit", async () => {
            const el = await fixture(
                html`<y-tokens allow-custom max="2" value='["a","b"]'></y-tokens>`,
            );
            type(el, "c");
            key(el, "Enter");
            expect(values(el)).to.eql(["a", "b"]);
            expect(input(el).value).to.equal("c");
            expect(live(el).textContent).to.contain("Maximum of 2");
        });

        it("reports rangeOverflow when seeded past the limit", async () => {
            const el = await fixture(
                html`<y-tokens max="1" value='["a","b"]'></y-tokens>`,
            );
            expect(el.validity.rangeOverflow).to.be.true;
        });
    });

    describe("removal", () => {
        it("removes a token from its remove control", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b"]'></y-tokens>`,
            );
            el.shadowRoot.querySelectorAll(".token-remove")[0].click();
            expect(values(el)).to.eql(["b"]);
        });

        it("fires a cancelable token-remove that can keep the token", async () => {
            const el = await fixture(html`<y-tokens value='["a"]'></y-tokens>`);
            el.addEventListener("token-remove", (e) => e.preventDefault());
            el.shadowRoot.querySelector(".token-remove").click();
            expect(values(el)).to.eql(["a"]);
        });

        it("arms on the first Backspace and deletes on the second", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b"]'></y-tokens>`,
            );
            key(el, "Backspace");
            expect(values(el)).to.eql(["a", "b"]);
            expect(tokens(el)[1].classList.contains("is-active")).to.be.true;

            key(el, "Backspace");
            expect(values(el)).to.eql(["a"]);
        });

        it("ignores auto-repeated Backspace so a held key cannot eat the field", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b","c"]'></y-tokens>`,
            );
            key(el, "Backspace");
            key(el, "Backspace", { repeat: true });
            key(el, "Backspace", { repeat: true });
            key(el, "Backspace", { repeat: true });
            expect(values(el)).to.eql(["a", "b", "c"]);
        });

        it("leaves the text alone while Backspace has something to delete", async () => {
            const el = await fixture(
                html`<y-tokens allow-custom value='["a"]'></y-tokens>`,
            );
            type(el, "xy");
            key(el, "Backspace");
            expect(values(el)).to.eql(["a"]);
            expect(tokens(el)[0].classList.contains("is-active")).to.be.false;
        });

        it("removes the highlighted token on Delete and highlights its neighbor", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b","c"]'></y-tokens>`,
            );
            key(el, "ArrowLeft");
            key(el, "ArrowLeft");
            key(el, "Delete");
            expect(values(el)).to.eql(["a", "c"]);
            expect(tokens(el)[1].classList.contains("is-active")).to.be.true;
        });

        it("clears every token from the clear control", async () => {
            const el = await fixture(
                html`<y-tokens clearable value='["a","b"]'></y-tokens>`,
            );
            const button = el.shadowRoot.querySelector(".clear-button");
            expect(button.hidden).to.be.false;
            button.click();
            expect(values(el)).to.eql([]);
            expect(button.hidden).to.be.true;
        });
    });

    describe("keyboard navigation", () => {
        it("moves the token highlight with Left / Right and returns to the input", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b"]'></y-tokens>`,
            );
            key(el, "ArrowLeft");
            expect(tokens(el)[1].classList.contains("is-active")).to.be.true;
            expect(input(el).getAttribute("aria-activedescendant")).to.equal(
                "token-1",
            );

            key(el, "ArrowLeft");
            expect(tokens(el)[0].classList.contains("is-active")).to.be.true;

            key(el, "ArrowRight");
            key(el, "ArrowRight");
            expect(
                el.shadowRoot.querySelectorAll(".token.is-active"),
            ).to.have.lengthOf(0);
            expect(input(el).hasAttribute("aria-activedescendant")).to.be.false;
        });

        it("jumps to the first and last token with Home / End", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b","c"]'></y-tokens>`,
            );
            key(el, "ArrowLeft");
            key(el, "Home");
            expect(tokens(el)[0].classList.contains("is-active")).to.be.true;
            key(el, "End");
            expect(tokens(el)[2].classList.contains("is-active")).to.be.true;
        });

        it("wraps the suggestion highlight and tracks aria-activedescendant", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;

            key(el, "ArrowDown");
            expect(input(el).getAttribute("aria-activedescendant")).to.equal(
                "option-0",
            );
            key(el, "ArrowUp");
            expect(input(el).getAttribute("aria-activedescendant")).to.equal(
                "option-2",
            );
        });

        it("skips disabled options", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = [
                { value: "a" },
                { value: "b", disabled: true },
                { value: "c" },
            ];
            key(el, "ArrowDown");
            key(el, "ArrowDown");
            expect(input(el).getAttribute("aria-activedescendant")).to.equal(
                "option-2",
            );
        });

        it("closes the popup on the first Escape and clears text on the second", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            el.options = OPTIONS;
            type(el, "des");
            expect(popup(el).hidden).to.be.false;

            key(el, "Escape");
            expect(popup(el).hidden).to.be.true;
            expect(input(el).value).to.equal("des");

            key(el, "Escape");
            expect(input(el).value).to.equal("");
        });

        it("lets Enter through on an empty closed field so the form can submit", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            const event = new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true,
            });
            input(el).dispatchEvent(event);
            expect(event.defaultPrevented).to.be.false;
        });
    });

    describe("filtering", () => {
        it("filters options by substring by default", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            type(el, "e");
            expect(options(el)).to.have.lengthOf(3);
            type(el, "sea");
            expect(options(el)).to.have.lengthOf(1);
        });

        it("filters by prefix under filter=starts-with", async () => {
            const el = await fixture(
                html`<y-tokens filter="starts-with"></y-tokens>`,
            );
            el.options = OPTIONS;
            type(el, "re");
            expect(options(el)).to.have.lengthOf(1);
            type(el, "sea");
            expect(options(el)).to.have.lengthOf(0);
        });

        it("leaves options untouched under filter=none", async () => {
            const el = await fixture(html`<y-tokens filter="none"></y-tokens>`);
            el.options = OPTIONS;
            type(el, "zzz");
            expect(options(el)).to.have.lengthOf(3);
        });

        it("shows the empty state when nothing matches", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            type(el, "zzz");
            expect(el.shadowRoot.querySelector(".empty").hidden).to.be.false;
            expect(live(el).textContent).to.contain("0 results available");
        });

        it("marks already-committed options as selected", async () => {
            const el = await fixture(
                html`<y-tokens value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            expect(options(el)[0].getAttribute("aria-selected")).to.equal(
                "true",
            );
            expect(options(el)[0].classList.contains("is-selected")).to.be.true;
        });

        it("paints a selected option with its own color, like y-select", async () => {
            const el = await fixture(
                html`<y-tokens value='["a","b","c"]'></y-tokens>`,
            );
            el.options = [
                { value: "a", color: "success" },
                { value: "b", color: "#ff0000" },
                { value: "c" },
            ];
            const [semantic, custom, plain] = options(el);

            expect(semantic.style.background).to.equal(
                "var(--success-content--)",
            );
            expect(custom.style.background).to.equal("rgb(255, 0, 0)");
            // No per-option color — the stylesheet's accent fill applies.
            expect(plain.style.background).to.equal("");
        });

        it("keeps the keyboard highlight visible on a selected option", async () => {
            const el = await fixture(
                html`<y-tokens value='["design"]'></y-tokens>`,
            );
            el.options = OPTIONS;
            key(el, "ArrowDown");

            const highlighted = options(el)[0];
            expect(highlighted.classList.contains("is-selected")).to.be.true;
            expect(highlighted.classList.contains("is-highlighted")).to.be.true;
            expect(getComputedStyle(highlighted).boxShadow).to.not.equal(
                "none",
            );
        });
    });

    describe("async", () => {
        it("emits query after the debounce and marks the popup busy", async () => {
            const el = await fixture(
                html`<y-tokens async query-delay="200"></y-tokens>`,
            );
            const clock = sandbox.useFakeTimers();
            const onQuery = sandbox.spy();
            el.addEventListener("query", onQuery);

            type(el, "de");
            expect(onQuery).to.not.have.been.called;

            clock.tick(200);
            expect(onQuery).to.have.been.calledOnce;
            expect(onQuery.firstCall.args[0].detail.query).to.equal("de");
            expect(el.loading).to.be.true;
            expect(el.shadowRoot.querySelector(".loading").hidden).to.be.false;
        });

        it("emits synchronously when query-delay is 0", async () => {
            const el = await fixture(
                html`<y-tokens async query-delay="0"></y-tokens>`,
            );
            setTimeout(() => type(el, "x"));
            const event = await oneEvent(el, "query");
            expect(event.detail.query).to.equal("x");
        });

        it("collapses rapid keystrokes into a single query", async () => {
            const el = await fixture(html`<y-tokens async></y-tokens>`);
            const clock = sandbox.useFakeTimers();
            const onQuery = sandbox.spy();
            el.addEventListener("query", onQuery);

            type(el, "d");
            clock.tick(100);
            type(el, "de");
            clock.tick(200);

            expect(onQuery).to.have.been.calledOnce;
            expect(onQuery.firstCall.args[0].detail.query).to.equal("de");
        });

        it("clears the busy state when options are assigned", async () => {
            const el = await fixture(html`<y-tokens async></y-tokens>`);
            const clock = sandbox.useFakeTimers();
            type(el, "de");
            clock.tick(200);
            expect(el.loading).to.be.true;

            el.options = OPTIONS;
            expect(el.loading).to.be.false;
            expect(el.shadowRoot.querySelector(".loading").hidden).to.be.true;
        });

        it("rejects a stale response through setOptions", async () => {
            const el = await fixture(html`<y-tokens async></y-tokens>`);
            const clock = sandbox.useFakeTimers();
            const ids = [];
            el.addEventListener("query", (e) => ids.push(e.detail.id));

            type(el, "a");
            clock.tick(200);
            type(el, "ab");
            clock.tick(200);
            expect(ids).to.eql([1, 2]);

            expect(el.setOptions(OPTIONS, ids[0])).to.be.false;
            expect(options(el)).to.have.lengthOf(0);

            expect(el.setOptions(OPTIONS, ids[1])).to.be.true;
            expect(options(el)).to.have.lengthOf(3);
        });

        it("does not filter locally in async mode", async () => {
            const el = await fixture(html`<y-tokens async></y-tokens>`);
            el.options = OPTIONS;
            type(el, "zzz");
            expect(options(el)).to.have.lengthOf(3);
        });
    });

    describe("events", () => {
        it("fires a cancelable token-add carrying its source", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            const onAdd = sandbox.spy();
            el.addEventListener("token-add", onAdd);

            type(el, "alpha");
            key(el, "Enter");

            expect(onAdd).to.have.been.calledOnce;
            expect(onAdd.firstCall.args[0].detail.source).to.equal("enter");
            expect(onAdd.firstCall.args[0].detail.token.value).to.equal("alpha");
        });

        it("blocks a prevented add and leaves the text in the input", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            el.addEventListener("token-add", (e) => e.preventDefault());
            type(el, "alpha");
            key(el, "Enter");

            expect(values(el)).to.eql([]);
            expect(input(el).value).to.equal("alpha");
        });

        it("fires input with the pending text, but not on commit", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            const onInput = sandbox.spy();
            el.addEventListener("input", onInput);

            type(el, "ab");
            key(el, "Enter");

            expect(onInput).to.have.been.calledOnce;
            expect(onInput.firstCall.args[0].detail.text).to.equal("ab");
        });

        it("reports the new value on change", async () => {
            const el = await fixture(html`<y-tokens allow-custom></y-tokens>`);
            setTimeout(() => {
                type(el, "alpha");
                key(el, "Enter");
            });
            const event = await oneEvent(el, "change");
            expect(event.detail.value.map((t) => t.value)).to.eql(["alpha"]);
        });
    });

    describe("form association", () => {
        it("submits one entry per token", async () => {
            const form = await fixture(html`
                <form>
                    <y-tokens name="topics" value='["a","b","c"]'></y-tokens>
                </form>
            `);
            const data = new FormData(form);
            expect(data.getAll("topics")).to.eql(["a", "b", "c"]);
        });

        it("submits nothing when disabled", async () => {
            const form = await fixture(html`
                <form>
                    <y-tokens name="topics" value='["a"]' disabled></y-tokens>
                </form>
            `);
            expect(new FormData(form).getAll("topics")).to.eql([]);
        });

        it("reports valueMissing when required and empty", async () => {
            const el = await fixture(html`<y-tokens required></y-tokens>`);
            expect(el.validity.valueMissing).to.be.true;
            expect(el.checkValidity()).to.be.false;

            el.value = ["a"];
            expect(el.validity.valueMissing).to.be.false;
            expect(el.checkValidity()).to.be.true;
        });

        it("reports customError for a token flagged invalid", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.value = [{ value: "bad", invalid: true }];
            expect(el.validity.customError).to.be.true;
            expect(tokens(el)[0].getAttribute("aria-invalid")).to.equal("true");
            expect(tokens(el)[0].getAttribute("color")).to.equal("error");
        });

        it("restores the initial value on form reset", async () => {
            const form = await fixture(html`
                <form>
                    <y-tokens name="topics" value='["a"]' allow-custom></y-tokens>
                </form>
            `);
            const el = form.querySelector("y-tokens");
            type(el, "b");
            key(el, "Enter");
            expect(values(el)).to.eql(["a", "b"]);

            form.reset();
            expect(values(el)).to.eql(["a"]);
        });

        it("restores session state through formStateRestoreCallback", async () => {
            const el = await fixture(
                html`<y-tokens name="topics"></y-tokens>`,
            );
            const state = new FormData();
            state.append("topics", "x");
            state.append("topics", "y");

            el.formStateRestoreCallback(state);
            expect(values(el)).to.eql(["x", "y"]);
        });
    });

    describe("presentation", () => {
        it("hides the placeholder once a token exists", async () => {
            const el = await fixture(
                html`<y-tokens placeholder="Add a topic"></y-tokens>`,
            );
            expect(input(el).placeholder).to.equal("Add a topic");
            el.value = ["a"];
            expect(input(el).placeholder).to.equal("");
        });

        it("keeps the placeholder with placeholder-persist", async () => {
            const el = await fixture(
                html`<y-tokens
                    placeholder="Add a topic"
                    placeholder-persist
                    value='["a"]'
                ></y-tokens>`,
            );
            expect(input(el).placeholder).to.equal("Add a topic");
        });

        it("defaults chips to the same filled primary as a y-select tag", async () => {
            const el = await fixture(html`<y-tokens value='["a"]'></y-tokens>`);
            expect(tokens(el)[0].getAttribute("variant")).to.equal("filled");
            expect(tokens(el)[0].getAttribute("color")).to.equal("primary");
        });

        it("pads the control exactly like a y-input of the same size", async () => {
            // The comparison is only meaningful with the generated token sheet
            // loaded — without it both sides resolve to an empty var() and
            // trivially match.
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(variablesCSS);
            const original = document.adoptedStyleSheets;
            document.adoptedStyleSheets = [...original, sheet];

            for (const size of ["small", "medium", "large"]) {
                const wrap = await fixture(html`
                    <div>
                        <y-input size="${size}"></y-input>
                        <y-tokens size="${size}"></y-tokens>
                    </div>
                `);
                const field = wrap
                    .querySelector("y-input")
                    .shadowRoot.querySelector(".input-container");
                const control = wrap
                    .querySelector("y-tokens")
                    .shadowRoot.querySelector(".control");

                expect(getComputedStyle(control).padding, size).to.equal(
                    getComputedStyle(field).padding,
                );
                expect(getComputedStyle(control).minHeight, size).to.equal(
                    getComputedStyle(field).minHeight,
                );
                expect(getComputedStyle(control).padding).to.not.equal("0px");
            }

            document.adoptedStyleSheets = original;
        });

        it("forwards token-variant and token-shape to each chip", async () => {
            const el = await fixture(
                html`<y-tokens
                    token-variant="outlined"
                    token-shape="round"
                    value='["a"]'
                ></y-tokens>`,
            );
            expect(tokens(el)[0].getAttribute("variant")).to.equal("outlined");
            expect(tokens(el)[0].getAttribute("shape")).to.equal("round");
        });

        it("passes a semantic color through and gates an unsafe one", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.value = [
                { value: "a", color: "success" },
                { value: "b", color: "#ff0000" },
                { value: "c", color: "red; background: url(x)" },
            ];
            const chips = tokens(el);
            expect(chips[0].getAttribute("color")).to.equal("success");
            expect(chips[1].getAttribute("color")).to.equal("#ff0000");
            expect(chips[2].getAttribute("color")).to.equal("primary");
        });

        it("renders error-text and describes the input with it", async () => {
            const el = await fixture(
                html`<y-tokens error-text="Pick at least one"></y-tokens>`,
            );
            const error = el.shadowRoot.querySelector(".error-text");
            expect(error.hidden).to.be.false;
            expect(error.textContent).to.equal("Pick at least one");
            expect(input(el).getAttribute("aria-describedby")).to.equal(
                "error-text",
            );
            expect(input(el).getAttribute("aria-invalid")).to.equal("true");
        });

        it("forwards aria-label to the combobox", async () => {
            const el = await fixture(
                html`<y-tokens aria-label="Topics"></y-tokens>`,
            );
            expect(input(el).getAttribute("aria-label")).to.equal("Topics");
        });

        it("marks the input required for assistive tech", async () => {
            const el = await fixture(html`<y-tokens required></y-tokens>`);
            expect(input(el).getAttribute("aria-required")).to.equal("true");
        });
    });

    describe("popup lifecycle", () => {
        it("opens on typing and closes on an outside click", async () => {
            const el = await fixture(html`<y-tokens></y-tokens>`);
            el.options = OPTIONS;
            type(el, "d");
            expect(popup(el).hidden).to.be.false;
            expect(input(el).getAttribute("aria-expanded")).to.equal("true");

            document.body.click();
            expect(popup(el).hidden).to.be.true;
            expect(input(el).getAttribute("aria-expanded")).to.equal("false");
        });

        it("never opens when readonly or disabled", async () => {
            const el = await fixture(html`<y-tokens disabled></y-tokens>`);
            el.options = OPTIONS;
            el.openPopup();
            expect(popup(el).hidden).to.be.true;
        });

        it("repositions instead of closing when anything scrolls", async () => {
            for (const portal of [false, true]) {
                const theme = await fixture(html`
                    <y-theme><y-tokens></y-tokens></y-theme>
                `);
                const el = theme.querySelector("y-tokens");
                el.portal = portal;
                el.options = OPTIONS;
                el.openPopup();

                const panel = portal
                    ? theme
                          .querySelector(".y-tokens-portal")
                          .shadowRoot.querySelector(".popup")
                    : popup(el);
                expect(panel.hidden, `portal=${portal}`).to.be.false;

                window.dispatchEvent(new Event("scroll"));
                window.dispatchEvent(new Event("resize"));
                expect(panel.hidden, `portal=${portal}`).to.be.false;

                // Capture-phase listener: a scroll inside the popup's own
                // listbox reaches it too, and must not dismiss the popup.
                panel.dispatchEvent(new Event("scroll"));
                expect(panel.hidden, `portal=${portal}`).to.be.false;

                el.closePopup();
            }
        });

        it("keeps the portaled popup anchored to the control as it moves", async () => {
            const theme = await fixture(html`
                <y-theme style="position:absolute;top:40px;left:24px">
                    <y-tokens portal></y-tokens>
                </y-theme>
            `);
            const el = theme.querySelector("y-tokens");
            el.options = OPTIONS;
            el.openPopup();

            const panel = theme
                .querySelector(".y-tokens-portal")
                .shadowRoot.querySelector(".popup");
            const before = panel.style.top;

            theme.style.top = "180px";
            window.dispatchEvent(new Event("scroll"));

            expect(panel.style.position).to.equal("fixed");
            expect(panel.style.top).to.not.equal(before);
            el.closePopup();
        });

        it("forwards inline custom properties onto the portal", async () => {
            const theme = await fixture(html`
                <y-theme>
                    <y-tokens
                        portal
                        style="--component-select-z-index: 9999;
                               --component-tokens-popup-max-height: 90px;
                               color: rebeccapurple"
                    ></y-tokens>
                </y-theme>
            `);
            const el = theme.querySelector("y-tokens");
            el.options = OPTIONS;
            el.openPopup();

            const portal = theme.querySelector(".y-tokens-portal");
            const panel = portal.shadowRoot.querySelector(".popup");

            // The stacking override is the case that bites, but every custom
            // property the popup reads has the same hole.
            expect(getComputedStyle(panel).zIndex).to.equal("9999");
            expect(getComputedStyle(panel).maxHeight).to.equal("90px");
            // Regular declarations are not the portal's business.
            expect(portal.style.color).to.equal("");

            el.closePopup();
        });

        it("leaves the portal alone when the host has no inline overrides", async () => {
            const theme = await fixture(html`
                <y-theme><y-tokens portal></y-tokens></y-theme>
            `);
            const el = theme.querySelector("y-tokens");
            el.options = OPTIONS;
            el.openPopup();

            expect(
                theme.querySelector(".y-tokens-portal").getAttribute("style"),
            ).to.be.oneOf([null, ""]);
            el.closePopup();
        });

        it("mounts the popup inside the nearest y-theme when portaled", async () => {
            const theme = await fixture(html`
                <y-theme><y-tokens portal></y-tokens></y-theme>
            `);
            const el = theme.querySelector("y-tokens");
            el.options = OPTIONS;
            el.openPopup();

            const portal = theme.querySelector(".y-tokens-portal");
            expect(portal).to.exist;
            expect(portal.shadowRoot.querySelector(".popup")).to.exist;

            el.closePopup();
            expect(theme.querySelector(".y-tokens-portal")).to.not.exist;
        });
    });
});
