import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-toggle.js";

const OPTIONS = [
    { value: "list", label: "List" },
    { value: "grid", label: "Grid" },
    { value: "map", label: "Map" },
];

function segments(el) {
    return Array.from(el.shadowRoot.querySelectorAll(".segment"));
}

function segmentValues(el) {
    return segments(el).map((s) => s.dataset.value);
}

function checkedValue(el) {
    return (
        segments(el).find((s) => s.getAttribute("aria-checked") === "true")
            ?.dataset.value ?? ""
    );
}

function tabbableValues(el) {
    return segments(el)
        .filter((s) => s.tabIndex === 0)
        .map((s) => s.dataset.value);
}

function press(el, value, key) {
    const segment = segments(el).find((s) => s.dataset.value === value);
    segment.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, composed: true }),
    );
}

/** Wait past the double rAF the component uses to arm the thumb transition. */
function nextFrames() {
    return new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
}

describe("<y-toggle>", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    describe("rendering", () => {
        it("renders a segment per option", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            expect(segmentValues(el).join(",")).to.equal("list,grid,map");
        });

        it("seeds options from a JSON attribute", async () => {
            const el = await fixture(
                html`<y-toggle
                    options='[{"value":"a","label":"A"},{"value":"b","label":"B"}]'
                ></y-toggle>`,
            );
            expect(segmentValues(el).join(",")).to.equal("a,b");
        });

        it("renders an option slot per segment", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const names = Array.from(
                el.shadowRoot.querySelectorAll("slot"),
            ).map((s) => s.getAttribute("name"));
            expect(names.join(",")).to.equal(
                "option-list,option-grid,option-map",
            );
        });

        it("renders an icon when the option declares one", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [{ value: "a", label: "A", icon: "check" }];
            expect(el.shadowRoot.querySelectorAll("y-icon").length).to.equal(1);
        });

        it("names an icon-only segment from ariaLabel", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [{ value: "a", icon: "check", ariaLabel: "Approve" }];
            expect(segments(el)[0].getAttribute("aria-label")).to.equal(
                "Approve",
            );
        });

        it("exposes a radiogroup of radios", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            expect(
                el.shadowRoot.querySelector(".track").getAttribute("role"),
            ).to.equal("radiogroup");
            expect(
                segments(el).every((s) => s.getAttribute("role") === "radio"),
            ).to.equal(true);
        });

        it("forwards aria-label to the radiogroup", async () => {
            const el = await fixture(
                html`<y-toggle aria-label="View mode"></y-toggle>`,
            );
            el.options = OPTIONS;
            expect(
                el.shadowRoot.querySelector(".track").getAttribute("aria-label"),
            ).to.equal("View mode");
        });
    });

    describe("value", () => {
        it("defaults to the first enabled option", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            expect(el.value).to.equal("list");
            expect(checkedValue(el)).to.equal("list");
        });

        it("skips disabled options when defaulting", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [
                { value: "a", label: "A", disabled: true },
                { value: "b", label: "B" },
            ];
            expect(el.value).to.equal("b");
        });

        it("honours an initial value attribute", async () => {
            const el = await fixture(
                html`<y-toggle
                    value="map"
                    options='[{"value":"list"},{"value":"grid"},{"value":"map"}]'
                ></y-toggle>`,
            );
            expect(el.value).to.equal("map");
            expect(checkedValue(el)).to.equal("map");
        });

        it("reflects the value to the attribute", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            el.value = "grid";
            expect(el.getAttribute("value")).to.equal("grid");
        });

        it("falls back when the value names an unknown option", async () => {
            const el = await fixture(html`<y-toggle value="nope"></y-toggle>`);
            el.options = OPTIONS;
            expect(el.value).to.equal("list");
        });

        it("leaves nothing checked when every option is disabled", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [
                { value: "a", label: "A", disabled: true },
                { value: "b", label: "B", disabled: true },
            ];
            expect(el.value).to.equal("");
            expect(checkedValue(el)).to.equal("");
        });
    });

    describe("selection", () => {
        it("selects on click", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            segments(el)[1].click();
            expect(el.value).to.equal("grid");
            expect(checkedValue(el)).to.equal("grid");
        });

        it("fires change with the previous value", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            setTimeout(() => el.select("map"));
            const { detail } = await oneEvent(el, "change");
            expect(detail.value).to.equal("map");
            expect(detail.previousValue).to.equal("list");
        });

        it("does not fire change when the value property is set", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const spy = sandbox.spy();
            el.addEventListener("change", spy);
            el.value = "grid";
            expect(spy.callCount).to.equal(0);
        });

        it("does not fire change when re-selecting the current value", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const spy = sandbox.spy();
            el.addEventListener("change", spy);
            el.select("list");
            expect(spy.callCount).to.equal(0);
        });

        it("cancels the change when y-toggle-select is prevented", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const spy = sandbox.spy();
            el.addEventListener("change", spy);
            el.addEventListener("y-toggle-select", (e) => e.preventDefault());
            el.select("grid");
            expect(el.value).to.equal("list");
            expect(spy.callCount).to.equal(0);
        });

        it("ignores a disabled option", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [
                { value: "a", label: "A" },
                { value: "b", label: "B", disabled: true },
            ];
            el.select("b");
            expect(el.value).to.equal("a");
        });

        it("ignores selection while the group is disabled", async () => {
            const el = await fixture(html`<y-toggle disabled></y-toggle>`);
            el.options = OPTIONS;
            el.select("grid");
            expect(el.value).to.equal("list");
        });
    });

    describe("keyboard", () => {
        it("moves selection forward with ArrowRight", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            press(el, "list", "ArrowRight");
            expect(el.value).to.equal("grid");
        });

        it("wraps backward from the first segment", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            press(el, "list", "ArrowLeft");
            expect(el.value).to.equal("map");
        });

        it("skips disabled options while navigating", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [
                { value: "a", label: "A" },
                { value: "b", label: "B", disabled: true },
                { value: "c", label: "C" },
            ];
            press(el, "a", "ArrowRight");
            expect(el.value).to.equal("c");
        });

        it("jumps to the ends with Home and End", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            press(el, "list", "End");
            expect(el.value).to.equal("map");
            press(el, "map", "Home");
            expect(el.value).to.equal("list");
        });

        it("selects the focused segment with Space", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            press(el, "map", " ");
            expect(el.value).to.equal("map");
        });

        it("uses the vertical axis when orientation is vertical", async () => {
            const el = await fixture(
                html`<y-toggle orientation="vertical"></y-toggle>`,
            );
            el.options = OPTIONS;
            press(el, "list", "ArrowDown");
            expect(el.value).to.equal("grid");
        });

        it("keeps only the selected segment in the tab order", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            el.value = "grid";
            expect(tabbableValues(el).join(",")).to.equal("grid");
        });
    });

    describe("thumb", () => {
        it("sizes the thumb to the selected segment", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const thumb = el.shadowRoot.querySelector(".thumb");
            const selected = segments(el)[0];
            expect(thumb.style.width).to.equal(`${selected.offsetWidth}px`);
            expect(thumb.style.opacity).to.equal("1");
        });

        it("moves the thumb when the value changes", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const thumb = el.shadowRoot.querySelector(".thumb");
            const before = thumb.style.transform;
            el.value = "map";
            expect(thumb.style.transform).to.not.equal(before);
            expect(thumb.style.transform).to.contain(
                `${segments(el)[2].offsetLeft}px`,
            );
        });

        it("hides the thumb when nothing is selected", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [{ value: "a", label: "A", disabled: true }];
            expect(
                el.shadowRoot.querySelector(".thumb").style.opacity,
            ).to.equal("0");
        });

        it("arms the transition after the first paint", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            const track = el.shadowRoot.querySelector(".track");
            expect(track.classList.contains("animate")).to.equal(false);
            await nextFrames();
            expect(track.classList.contains("animate")).to.equal(true);
        });

        it("never arms the transition when animate is false", async () => {
            const el = await fixture(
                html`<y-toggle animate="false"></y-toggle>`,
            );
            el.options = OPTIONS;
            await nextFrames();
            expect(
                el.shadowRoot
                    .querySelector(".track")
                    .classList.contains("animate"),
            ).to.equal(false);
        });

        it("honours reduced motion in the stylesheet", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            expect(el.shadowRoot.querySelector("style").textContent).to.contain(
                "prefers-reduced-motion: reduce",
            );
        });
    });

    describe("color", () => {
        function thumbStyle(el) {
            const thumb = el.shadowRoot.querySelector(".thumb");
            return {
                background: thumb.style.backgroundColor,
                border: thumb.style.borderColor,
            };
        }

        function selectedTextColor(el) {
            return (
                segments(el).find(
                    (s) => s.getAttribute("aria-checked") === "true",
                )?.style.color ?? ""
            );
        }

        it("marks the selection with primary by default", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = OPTIONS;
            expect(thumbStyle(el).background).to.equal(
                "var(--primary-content--)",
            );
            expect(selectedTextColor(el)).to.equal(
                "var(--primary-content-inverse)",
            );
        });

        it("tints the outline thumb behind a matching border", async () => {
            const el = await fixture(
                html`<y-toggle variant="outline"></y-toggle>`,
            );
            el.options = OPTIONS;
            const { background, border } = thumbStyle(el);
            expect(background).to.equal("var(--primary-background-component)");
            expect(border).to.equal("var(--primary-content--)");
            expect(selectedTextColor(el)).to.equal("var(--primary-content--)");
        });

        it("honours an explicit color role on the group", async () => {
            const el = await fixture(
                html`<y-toggle color="success"></y-toggle>`,
            );
            el.options = OPTIONS;
            expect(thumbStyle(el).background).to.equal(
                "var(--success-content--)",
            );
            expect(selectedTextColor(el)).to.equal(
                "var(--success-content-inverse)",
            );
        });

        it("accepts a CSS color literal", async () => {
            const el = await fixture(
                html`<y-toggle color="#ff8800"></y-toggle>`,
            );
            el.options = OPTIONS;
            expect(thumbStyle(el).background).to.equal("rgb(255, 136, 0)");
        });

        it("falls back to primary for an unsafe color", async () => {
            const el = await fixture(
                html`<y-toggle color="red; --x: url(evil)"></y-toggle>`,
            );
            el.options = OPTIONS;
            expect(thumbStyle(el).background).to.equal(
                "var(--primary-content--)",
            );
        });

        it("lets an option override the group color", async () => {
            const el = await fixture(html`<y-toggle color="base"></y-toggle>`);
            el.options = [
                { value: "ok", label: "OK", color: "success" },
                { value: "no", label: "No", color: "error" },
            ];
            expect(thumbStyle(el).background).to.equal(
                "var(--success-content--)",
            );
        });

        it("recolors the thumb as the selection moves", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [
                { value: "ok", label: "OK", color: "success" },
                { value: "no", label: "No", color: "error" },
            ];
            el.select("no");
            expect(thumbStyle(el).background).to.equal("var(--error-content--)");
            expect(selectedTextColor(el)).to.equal(
                "var(--error-content-inverse)",
            );
        });

        it("clears the override when moving to an uncolored option", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [
                { value: "ok", label: "OK", color: "success" },
                { value: "plain", label: "Plain" },
            ];
            el.select("plain");
            expect(thumbStyle(el).background).to.equal(
                "var(--primary-content--)",
            );
        });

        it("falls back to the group color for an unsafe option color", async () => {
            const el = await fixture(html`<y-toggle color="help"></y-toggle>`);
            el.options = [{ value: "a", label: "A", color: "javascript:evil" }];
            expect(thumbStyle(el).background).to.equal("var(--help-content--)");
        });

        it("applies a per-option literal color", async () => {
            const el = await fixture(html`<y-toggle></y-toggle>`);
            el.options = [{ value: "a", label: "A", color: "#00aa55" }];
            expect(thumbStyle(el).background).to.equal("rgb(0, 170, 85)");
        });
    });

    describe("forms", () => {
        it("submits the selected value", async () => {
            const form = await fixture(html`
                <form>
                    <y-toggle
                        name="view"
                        value="grid"
                        options='[{"value":"list"},{"value":"grid"}]'
                    ></y-toggle>
                </form>
            `);
            expect(new FormData(form).get("view")).to.equal("grid");
        });

        it("restores the initial value on reset", async () => {
            const form = await fixture(html`
                <form>
                    <y-toggle
                        name="view"
                        value="list"
                        options='[{"value":"list"},{"value":"grid"}]'
                    ></y-toggle>
                </form>
            `);
            const el = form.querySelector("y-toggle");
            el.select("grid");
            form.reset();
            expect(el.value).to.equal("list");
        });

        it("disables via a surrounding fieldset", async () => {
            const form = await fixture(html`
                <form>
                    <fieldset disabled>
                        <y-toggle
                            name="view"
                            options='[{"value":"list"},{"value":"grid"}]'
                        ></y-toggle>
                    </fieldset>
                </form>
            `);
            expect(form.querySelector("y-toggle").disabled).to.equal(true);
        });
    });
});
