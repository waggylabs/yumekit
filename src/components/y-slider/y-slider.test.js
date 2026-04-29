import { html, fixture, expect } from "@open-wc/testing";
import sinon from "sinon";
import "./y-slider.js";

describe("YumeSlider", () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("renders track, fill, and thumb with default attributes", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        const track = el.shadowRoot.querySelector(".track");
        const thumb = el.shadowRoot.querySelector(".thumb");
        const fill = el.shadowRoot.querySelector(".fill");

        expect(track).to.exist;
        expect(thumb).to.exist;
        expect(fill).to.exist;
        expect(track.getAttribute("role")).to.equal("slider");
        expect(track.getAttribute("aria-valuenow")).to.equal("50");
        expect(track.getAttribute("aria-valuemin")).to.equal("0");
        expect(track.getAttribute("aria-valuemax")).to.equal("100");
    });

    it("defaults min to 0, max to 100, value to 50", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        expect(el.min).to.equal(0);
        expect(el.max).to.equal(100);
        expect(el.value).to.equal(50);
    });

    it("computes percentage correctly", async () => {
        const el = await fixture(
            html`<y-slider value="25" min="0" max="200"></y-slider>`,
        );
        expect(el.percentage).to.equal(12.5);
    });

    it("clamps value to min and max", async () => {
        const el = await fixture(html`<y-slider min="0" max="100"></y-slider>`);
        el.value = 150;
        expect(el.value).to.equal(100);

        el.value = -10;
        expect(el.value).to.equal(0);
    });

    it("snaps value to step", async () => {
        const el = await fixture(
            html`<y-slider value="0" min="0" max="100" step="25"></y-slider>`,
        );
        el.value = 33;
        expect(el.value).to.equal(25);

        el.value = 38;
        expect(el.value).to.equal(50);
    });

    it("exposes percentage as the --_pct host variable", async () => {
        const el = await fixture(
            html`<y-slider value="75" min="0" max="100"></y-slider>`,
        );
        expect(el.style.getPropertyValue("--_pct")).to.equal("75%");
    });

    it("resolves the fill color from a named color", async () => {
        const el = await fixture(
            html`<y-slider value="50" color="success"></y-slider>`,
        );
        expect(el.style.getPropertyValue("--_fill-color")).to.equal(
            "var(--success-content--)",
        );
    });

    it("uses a custom CSS color when provided", async () => {
        const el = await fixture(
            html`<y-slider value="50" color="#ff0000"></y-slider>`,
        );
        expect(el.style.getPropertyValue("--_fill-color")).to.equal("#ff0000");
    });

    it("resolves thumb-size and track-thickness from the size attribute", async () => {
        const el = await fixture(html`<y-slider size="large"></y-slider>`);
        expect(el.style.getPropertyValue("--_thumb-size")).to.equal(
            "var(--component-slider-thumb-size-large)",
        );
        expect(el.style.getPropertyValue("--_track-thickness")).to.equal(
            "var(--component-slider-track-thickness-large)",
        );
    });

    it("disables interaction when disabled is set", async () => {
        const el = await fixture(
            html`<y-slider value="50" disabled></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("tabindex")).to.equal("-1");
        expect(track.getAttribute("aria-disabled")).to.equal("true");
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        expect(el.size).to.equal("medium");
    });

    it("sets aria-valuestep when step is provided", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-valuestep")).to.equal("10");
    });

    it("is focusable via tabindex", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("tabindex")).to.equal("0");
    });

    it("updates aria-valuenow when value changes", async () => {
        const el = await fixture(html`<y-slider value="20"></y-slider>`);
        el.setAttribute("value", "80");
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-valuenow")).to.equal("80");
    });

    it("is form-associated", async () => {
        const el = await fixture(
            html`<y-slider name="volume" value="70"></y-slider>`,
        );
        expect(el._internals).to.exist;
    });

    it("dispatches input event on keyboard navigation", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        let inputFired = false;
        el.addEventListener("input", () => {
            inputFired = true;
        });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", tooltips: true }),
        );
        expect(inputFired).to.be.true;
        expect(el.value).to.equal(60);
    });

    it("does not go above max on ArrowRight", async () => {
        const el = await fixture(
            html`<y-slider value="95" step="10" max="100"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", tooltips: true }),
        );
        expect(el.value).to.equal(100);
    });

    it("does not go below min on ArrowLeft", async () => {
        const el = await fixture(
            html`<y-slider value="5" step="10" min="0"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", tooltips: true }),
        );
        expect(el.value).to.equal(0);
    });

    it("jumps to min on Home key", async () => {
        const el = await fixture(
            html`<y-slider value="50" min="10" max="100"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Home", tooltips: true }),
        );
        expect(el.value).to.equal(10);
    });

    it("jumps to max on End key", async () => {
        const el = await fixture(
            html`<y-slider value="50" min="0" max="90"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "End", tooltips: true }),
        );
        expect(el.value).to.equal(90);
    });

    it("disabled setter sets the disabled attribute", async () => {
        const el = await fixture(html`<y-slider></y-slider>`);
        expect(el.disabled).to.be.false;

        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        expect(el.disabled).to.be.true;
    });

    it("disabled setter removes the disabled attribute when set to false", async () => {
        const el = await fixture(html`<y-slider disabled></y-slider>`);
        expect(el.disabled).to.be.true;

        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
        expect(el.disabled).to.be.false;
    });

    it("step setter removes the step attribute when set to null", async () => {
        const el = await fixture(html`<y-slider step="10"></y-slider>`);
        expect(el.step).to.equal(10);

        el.step = null;
        expect(el.hasAttribute("step")).to.be.false;
        expect(el.step).to.be.null;
    });

    it("step setter removes the step attribute when set to undefined", async () => {
        const el = await fixture(html`<y-slider step="5"></y-slider>`);
        el.step = undefined;
        expect(el.hasAttribute("step")).to.be.false;
    });

    it("keyboard events do not fire on a disabled slider", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10" disabled></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        let inputFired = false;
        el.addEventListener("input", () => {
            inputFired = true;
        });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowRight", tooltips: true }),
        );
        expect(inputFired).to.be.false;
        expect(el.value).to.equal(50);
    });

    it("dispatches change event on keyboard navigation", async () => {
        const el = await fixture(
            html`<y-slider value="50" step="10"></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        let changeFired = false;
        el.addEventListener("change", () => {
            changeFired = true;
        });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "ArrowLeft", tooltips: true }),
        );
        expect(changeFired).to.be.true;
        expect(el.value).to.equal(40);
    });

    it("unhandled key does not fire input event", async () => {
        const el = await fixture(html`<y-slider value="50"></y-slider>`);
        const track = el.shadowRoot.querySelector(".track");
        let inputFired = false;
        el.addEventListener("input", () => {
            inputFired = true;
        });
        track.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Tab", tooltips: true }),
        );
        expect(inputFired).to.be.false;
    });

    it("_updateVisuals updates --_pct and aria-valuenow after value change", async () => {
        const el = await fixture(
            html`<y-slider value="0" min="0" max="100"></y-slider>`,
        );
        el.value = 75;

        const track = el.shadowRoot.querySelector(".track");
        expect(el.style.getPropertyValue("--_pct")).to.equal("75%");
        expect(track.getAttribute("aria-valuenow")).to.equal("75");
    });

    it("percentage returns 0 when range is zero", async () => {
        const el = await fixture(
            html`<y-slider value="5" min="5" max="5"></y-slider>`,
        );
        expect(el.percentage).to.equal(0);
    });

    it("pointerdown on a disabled slider does not start dragging", async () => {
        const el = await fixture(
            html`<y-slider value="50" disabled></y-slider>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        track.dispatchEvent(
            new PointerEvent("pointerdown", { tooltips: true, clientX: 0 }),
        );
        expect(el._dragging).to.be.false;
    });

    describe("vertical orientation", () => {
        it("sets aria-orientation and orientation class", async () => {
            const el = await fixture(
                html`<y-slider orientation="vertical" value="40"></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            expect(track.classList.contains("track--vertical")).to.be.true;
            expect(track.getAttribute("aria-orientation")).to.equal("vertical");
        });

        it("computes value from a vertical pointer position (bottom = min, top = max)", async () => {
            const el = await fixture(
                html`<y-slider
                    orientation="vertical"
                    value="0"
                    min="0"
                    max="100"
                    style="height: 100px"
                ></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            sandbox.stub(track, "getBoundingClientRect").returns({
                left: 0,
                top: 0,
                right: 10,
                bottom: 100,
                width: 10,
                height: 100,
            });

            // Click at the top of the track → value should be max.
            el._updateFromPointer({ clientX: 5, clientY: 0 });
            expect(el.value).to.equal(100);

            // Click in the middle → value should be 50.
            el._updateFromPointer({ clientX: 5, clientY: 50 });
            expect(el.value).to.equal(50);

            // Click at the bottom → value should be min.
            el._updateFromPointer({ clientX: 5, clientY: 100 });
            expect(el.value).to.equal(0);
        });

        it("ArrowUp increases and ArrowDown decreases value in vertical mode", async () => {
            const el = await fixture(
                html`<y-slider
                    orientation="vertical"
                    value="50"
                    step="10"
                ></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");

            track.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowUp", tooltips: true }),
            );
            expect(el.value).to.equal(60);

            track.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowDown",
                    tooltips: true,
                }),
            );
            expect(el.value).to.equal(50);
        });
    });

    describe("range mode", () => {
        function stubHorizontalTrack(sandbox, el, width = 100) {
            const track = el.shadowRoot.querySelector(".track");
            sandbox.stub(track, "getBoundingClientRect").returns({
                left: 0,
                top: 0,
                right: width,
                bottom: 10,
                width,
                height: 10,
            });
            return track;
        }

        it("renders two thumbs with per-thumb slider role and the track as a group", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                ></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");

            expect(track.getAttribute("role")).to.equal("group");
            expect(track.hasAttribute("tabindex")).to.be.false;
            expect(thumbMin).to.exist;
            expect(thumbMax).to.exist;
            expect(thumbMin.getAttribute("role")).to.equal("slider");
            expect(thumbMax.getAttribute("role")).to.equal("slider");
            expect(thumbMin.getAttribute("aria-label")).to.equal("Minimum");
            expect(thumbMax.getAttribute("aria-label")).to.equal("Maximum");
        });

        it("defaults value-min to min and value-max to max", async () => {
            const el = await fixture(
                html`<y-slider range min="10" max="90"></y-slider>`,
            );
            expect(el.valueMin).to.equal(10);
            expect(el.valueMax).to.equal(90);
        });

        it("clamps each thumb's aria-valuemin/max against the other thumb minus the gap", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    min-gap="5"
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");

            expect(thumbMin.getAttribute("aria-valuemin")).to.equal("0");
            expect(thumbMin.getAttribute("aria-valuemax")).to.equal("75");
            expect(thumbMax.getAttribute("aria-valuemin")).to.equal("25");
            expect(thumbMax.getAttribute("aria-valuemax")).to.equal("100");
        });

        it("min-gap defaults to step when present, else 1", async () => {
            const stepSlider = await fixture(
                html`<y-slider range step="5"></y-slider>`,
            );
            expect(stepSlider.minGap).to.equal(5);

            const noStep = await fixture(html`<y-slider range></y-slider>`);
            expect(noStep.minGap).to.equal(1);
        });

        it("setting valueMin clamps against valueMax minus minGap", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    min-gap="10"
                ></y-slider>`,
            );
            el.valueMin = 95;
            expect(el.valueMin).to.equal(70);
        });

        it("setting valueMax clamps against valueMin plus minGap", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    min-gap="10"
                ></y-slider>`,
            );
            el.valueMax = 5;
            expect(el.valueMax).to.equal(30);
        });

        it("exposes percentageMin / percentageMax host variables", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="25"
                    value-max="75"
                ></y-slider>`,
            );
            expect(el.style.getPropertyValue("--_pct-min")).to.equal("25%");
            expect(el.style.getPropertyValue("--_pct-max")).to.equal("75%");
        });

        it("formats the form value as 'lower,upper'", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    name="band"
                    value-min="20"
                    value-max="80"
                ></y-slider>`,
            );
            expect(el._formatFormValue()).to.equal("20,80");
        });

        it("ArrowRight on thumb-min only moves the lower thumb", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    step="5"
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");

            thumbMin.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    tooltips: true,
                }),
            );
            expect(el.valueMin).to.equal(25);
            expect(el.valueMax).to.equal(80);
        });

        it("ArrowLeft on thumb-max only moves the upper thumb", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    step="5"
                ></y-slider>`,
            );
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");

            thumbMax.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowLeft",
                    tooltips: true,
                }),
            );
            expect(el.valueMax).to.equal(75);
            expect(el.valueMin).to.equal(20);
        });

        it("Home on thumb-max moves it to valueMin + minGap", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    min-gap="5"
                ></y-slider>`,
            );
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");

            thumbMax.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Home", tooltips: true }),
            );
            expect(el.valueMax).to.equal(25);
        });

        it("min-gap prevents lower thumb from crossing upper thumb on keyboard", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="40"
                    value-max="50"
                    min-gap="10"
                    step="5"
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");

            thumbMin.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    tooltips: true,
                }),
            );
            expect(el.valueMin).to.equal(40);
            expect(el.valueMax).to.equal(50);
        });

        it("input event in range mode reports which thumb moved", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    step="5"
                ></y-slider>`,
            );
            const events = [];
            el.addEventListener("input", (e) => events.push(e.detail));

            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            thumbMin.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "ArrowRight",
                    tooltips: true,
                }),
            );

            expect(events).to.have.lengthOf(1);
            expect(events[0].thumb).to.equal("min");
            expect(events[0].valueMin).to.equal(25);
            expect(events[0].valueMax).to.equal(80);
        });

        it("track click picks the nearest thumb and moves it", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    style="width: 100px"
                ></y-slider>`,
            );
            const track = stubHorizontalTrack(sandbox, el);

            // Click at x=70 → closer to value-max (80) than value-min (20).
            track.dispatchEvent(
                new PointerEvent("pointerdown", {
                    tooltips: true,
                    clientX: 70,
                    clientY: 5,
                }),
            );

            expect(el._activeThumb).to.equal("max");
            expect(el.valueMax).to.equal(70);
            expect(el.valueMin).to.equal(20);
        });

        it("track click breaks ties toward the lower thumb", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    style="width: 100px"
                ></y-slider>`,
            );
            const track = stubHorizontalTrack(sandbox, el);

            // Click at x=50 → equidistant between value-min (20) and value-max (80).
            track.dispatchEvent(
                new PointerEvent("pointerdown", {
                    tooltips: true,
                    clientX: 50,
                    clientY: 5,
                }),
            );

            expect(el._activeThumb).to.equal("min");
            expect(el.valueMin).to.equal(50);
            expect(el.valueMax).to.equal(80);
        });

        it("respects custom aria-label-min / aria-label-max", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    aria-label-min="Lower bound"
                    aria-label-max="Upper bound"
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");
            expect(thumbMin.getAttribute("aria-label")).to.equal("Lower bound");
            expect(thumbMax.getAttribute("aria-label")).to.equal("Upper bound");
        });

        it("toggling range off restores the single-mode contract", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                ></y-slider>`,
            );
            el.removeAttribute("range");

            const track = el.shadowRoot.querySelector(".track");
            expect(track.getAttribute("role")).to.equal("slider");
            expect(el.shadowRoot.querySelector(".thumb-min")).to.be.null;
            expect(el.shadowRoot.querySelector(".thumb-max")).to.be.null;
        });

        it("disables both thumbs when disabled is set", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    disabled
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");
            expect(thumbMin.getAttribute("tabindex")).to.equal("-1");
            expect(thumbMax.getAttribute("tabindex")).to.equal("-1");
            expect(thumbMin.getAttribute("aria-disabled")).to.equal("true");
            expect(thumbMax.getAttribute("aria-disabled")).to.equal("true");
        });
    });

    describe("ticks", () => {
        it("renders no tick elements when ticks attribute is absent", async () => {
            const el = await fixture(html`<y-slider value="50"></y-slider>`);
            expect(el.shadowRoot.querySelectorAll(".tick").length).to.equal(0);
        });

        it("derives ticks from step when ticks='true'", async () => {
            const el = await fixture(
                html`<y-slider
                    value="0"
                    min="0"
                    max="100"
                    step="25"
                    ticks="true"
                ></y-slider>`,
            );
            const ticks = el.shadowRoot.querySelectorAll(".tick");
            // 0, 25, 50, 75, 100 = 5 ticks
            expect(ticks.length).to.equal(5);
        });

        it("renders 10 evenly spaced ticks when ticks='true' and no step", async () => {
            const el = await fixture(
                html`<y-slider
                    value="50"
                    min="0"
                    max="100"
                    ticks="true"
                ></y-slider>`,
            );
            // stride = 100/10 = 10 → values 0,10,...,100 = 11 ticks
            const ticks = el.shadowRoot.querySelectorAll(".tick");
            expect(ticks.length).to.equal(11);
        });

        it("renders N evenly spaced ticks when ticks is an integer", async () => {
            const el = await fixture(
                html`<y-slider
                    value="0"
                    min="0"
                    max="100"
                    ticks="5"
                ></y-slider>`,
            );
            const ticks = el.shadowRoot.querySelectorAll(".tick");
            expect(ticks.length).to.equal(5);
        });

        it("renders ticks from a JSON array of bare values", async () => {
            const el = await fixture(
                html`<y-slider
                    value="50"
                    min="0"
                    max="100"
                    ticks="[0, 50, 100]"
                ></y-slider>`,
            );
            const ticks = el.shadowRoot.querySelectorAll(".tick");
            expect(ticks.length).to.equal(3);
        });

        it("renders ticks from a JSON array of {value, label} objects", async () => {
            const el = await fixture(
                html`<y-slider
                    value="50"
                    min="0"
                    max="100"
                    tick-labels
                    ticks='[{"value": 0, "label": "Low"}, {"value": 50, "label": "Mid"}, {"value": 100, "label": "High"}]'
                ></y-slider>`,
            );
            const labels = el.shadowRoot.querySelectorAll(".tick-label");
            expect(labels.length).to.equal(3);
            expect(labels[0].textContent).to.equal("Low");
            expect(labels[1].textContent).to.equal("Mid");
            expect(labels[2].textContent).to.equal("High");
        });

        it("falls back to the tick value when tick-labels is on but the entry has no label", async () => {
            const el = await fixture(
                html`<y-slider
                    value="50"
                    min="0"
                    max="100"
                    tick-labels
                    ticks="[0, 50, 100]"
                ></y-slider>`,
            );
            const labels = el.shadowRoot.querySelectorAll(".tick-label");
            expect(labels.length).to.equal(3);
            expect(labels[0].textContent).to.equal("0");
            expect(labels[1].textContent).to.equal("50");
            expect(labels[2].textContent).to.equal("100");
        });

        it("does not render labels when tick-labels is absent", async () => {
            const el = await fixture(
                html`<y-slider
                    value="50"
                    min="0"
                    max="100"
                    ticks="[0, 50, 100]"
                ></y-slider>`,
            );
            expect(el.shadowRoot.querySelectorAll(".tick-label").length).to.equal(
                0,
            );
        });

        it("warns and skips ticks outside [min, max]", async () => {
            const warn = sandbox.stub(console, "warn");
            const el = await fixture(
                html`<y-slider
                    min="0"
                    max="100"
                    ticks="[10, 200, 50]"
                ></y-slider>`,
            );
            const ticks = el.shadowRoot.querySelectorAll(".tick");
            expect(ticks.length).to.equal(2);
            expect(warn.called).to.be.true;
            const messages = warn.getCalls().map((c) => c.args[0]);
            expect(messages.some((m) => m.includes("200"))).to.be.true;
        });

        it("positions each tick at its value's percentage", async () => {
            const el = await fixture(
                html`<y-slider
                    min="0"
                    max="100"
                    ticks="[0, 25, 100]"
                ></y-slider>`,
            );
            const ticks = el.shadowRoot.querySelectorAll(".tick");
            expect(ticks[0].style.cssText).to.include("--_tick-pct: 0%");
            expect(ticks[1].style.cssText).to.include("--_tick-pct: 25%");
            expect(ticks[2].style.cssText).to.include("--_tick-pct: 100%");
        });

        it("renders ticks in range mode below the thumbs in DOM order", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    ticks="[0, 50, 100]"
                ></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            const ticks = track.querySelectorAll(".tick");
            expect(ticks.length).to.equal(3);
            // Thumbs come after ticks in DOM order so they paint on top.
            const lastTickIndex = Array.from(track.children).indexOf(
                ticks[ticks.length - 1],
            );
            const thumbMinIndex = Array.from(track.children).indexOf(
                el.shadowRoot.querySelector(".thumb-min"),
            );
            expect(thumbMinIndex).to.be.greaterThan(lastTickIndex);
        });
    });

    describe("snap-to-ticks", () => {
        it("setting value snaps to the nearest tick when snap-to-ticks is enabled", async () => {
            const el = await fixture(
                html`<y-slider
                    min="0"
                    max="100"
                    ticks="[0, 25, 50, 75, 100]"
                    snap-to-ticks
                ></y-slider>`,
            );
            el.value = 33;
            expect(el.value).to.equal(25);

            el.value = 60;
            expect(el.value).to.equal(50);

            el.value = 80;
            expect(el.value).to.equal(75);
        });

        it("ignores step when snap-to-ticks is enabled", async () => {
            const el = await fixture(
                html`<y-slider
                    min="0"
                    max="100"
                    step="10"
                    ticks="[0, 30, 70, 100]"
                    snap-to-ticks
                ></y-slider>`,
            );
            el.value = 50;
            expect(el.value).to.equal(30);
        });

        it("falls back to step snapping when snap-to-ticks is off", async () => {
            const el = await fixture(
                html`<y-slider
                    min="0"
                    max="100"
                    step="10"
                    ticks="[0, 33, 66, 100]"
                ></y-slider>`,
            );
            el.value = 35;
            expect(el.value).to.equal(40);
        });

        it("keyboard ArrowRight lands on the next tick when snap-to-ticks is on", async () => {
            const el = await fixture(
                html`<y-slider
                    value="25"
                    min="0"
                    max="100"
                    ticks="[0, 25, 50, 75, 100]"
                    snap-to-ticks
                ></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            track.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowRight", tooltips: true }),
            );
            // ArrowRight moves +1 (no step), 25→26, then snap to nearest tick = 25.
            // To actually advance, we need step to push past the tick boundary.
            // Without step, +1 from 25 = 26 → still snaps back to 25.
            expect(el.value).to.equal(25);
        });

        it("with step + snap-to-ticks, keyboard moves by step then snaps to nearest tick", async () => {
            const el = await fixture(
                html`<y-slider
                    value="0"
                    min="0"
                    max="100"
                    step="20"
                    ticks="[0, 25, 50, 75, 100]"
                    snap-to-ticks
                ></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            // 0 + 20 = 20 → snap to nearest tick = 25.
            track.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowRight", tooltips: true }),
            );
            expect(el.value).to.equal(25);
        });

        it("range mode snaps both thumbs to ticks", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    min="0"
                    max="100"
                    value-min="0"
                    value-max="100"
                    ticks="[0, 25, 50, 75, 100]"
                    snap-to-ticks
                ></y-slider>`,
            );
            el.valueMin = 33;
            el.valueMax = 80;
            expect(el.valueMin).to.equal(25);
            expect(el.valueMax).to.equal(75);
        });

        it("respects min-gap when snapping range thumbs to ticks", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    min="0"
                    max="100"
                    value-min="0"
                    value-max="50"
                    min-gap="20"
                    ticks="[0, 25, 50, 75, 100]"
                    snap-to-ticks
                ></y-slider>`,
            );
            // Try to push valueMin up to 45 — but valueMax=50 minus gap=20 means valueMin must be ≤30,
            // and the only allowable tick ≤30 is 25.
            el.valueMin = 45;
            expect(el.valueMin).to.equal(25);
        });
    });

    describe("show-value tooltip", () => {
        it("renders no tooltip by default (show-value='none')", async () => {
            const el = await fixture(html`<y-slider value="50"></y-slider>`);
            expect(el.shadowRoot.querySelector("y-tooltip")).to.be.null;
        });

        it("wraps the single thumb in a y-tooltip when show-value='always'", async () => {
            const el = await fixture(
                html`<y-slider value="40" show-value="always"></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip).to.exist;
            expect(tooltip.getAttribute("text")).to.equal("40");
            expect(tooltip.hasAttribute("open")).to.be.true;
            // Thumb is still inside, focusable, with all the data-thumb / role attrs.
            const thumb = tooltip.querySelector(".thumb");
            expect(thumb).to.exist;
        });

        it("wraps both range thumbs with their own y-tooltip", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    show-value="always"
                ></y-slider>`,
            );
            const min = el.shadowRoot.querySelector("y-tooltip.tooltip-min");
            const max = el.shadowRoot.querySelector("y-tooltip.tooltip-max");
            expect(min.getAttribute("text")).to.equal("20");
            expect(max.getAttribute("text")).to.equal("80");
            expect(min.hasAttribute("open")).to.be.true;
            expect(max.hasAttribute("open")).to.be.true;
        });

        it("does not set open on the tooltip when show-value='dragging'", async () => {
            const el = await fixture(
                html`<y-slider value="40" show-value="dragging"></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip).to.exist;
            expect(tooltip.hasAttribute("open")).to.be.false;
        });

        it("updates the tooltip text when value changes", async () => {
            const el = await fixture(
                html`<y-slider value="40" show-value="always"></y-slider>`,
            );
            el.value = 75;
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("text")).to.equal("75");
        });

        it("flattens value-prefix slot text into the tooltip", async () => {
            const el = await fixture(
                html`<y-slider value="25" show-value="always">
                    <span slot="value-prefix">$</span>
                </y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("text")).to.equal("$25");
        });

        it("flattens value-suffix slot text into the tooltip", async () => {
            const el = await fixture(
                html`<y-slider value="50" show-value="always">
                    <span slot="value-suffix">%</span>
                </y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("text")).to.equal("50%");
        });

        it("combines prefix and suffix in the tooltip text", async () => {
            const el = await fixture(
                html`<y-slider value="20" show-value="always">
                    <span slot="value-prefix">~</span>
                    <span slot="value-suffix">°C</span>
                </y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("text")).to.equal("~20°C");
        });

        it("sets aria-valuetext on the track when single mode + tooltip + suffix", async () => {
            const el = await fixture(
                html`<y-slider value="50" show-value="always">
                    <span slot="value-suffix">%</span>
                </y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            expect(track.getAttribute("aria-valuetext")).to.equal("50%");
        });

        it("sets aria-valuetext on each thumb in range mode", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    show-value="always"
                >
                    <span slot="value-prefix">$</span>
                </y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");
            expect(thumbMin.getAttribute("aria-valuetext")).to.equal("$20");
            expect(thumbMax.getAttribute("aria-valuetext")).to.equal("$80");
        });

        it("resolves value-position='end' to 'bottom' on horizontal sliders", async () => {
            const el = await fixture(
                html`<y-slider
                    value="50"
                    show-value="always"
                    value-position="end"
                ></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("position")).to.equal("bottom");
        });

        it("resolves value-position='start' to 'left' on vertical sliders", async () => {
            const el = await fixture(
                html`<y-slider
                    orientation="vertical"
                    value="50"
                    show-value="always"
                    value-position="start"
                ></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("position")).to.equal("left");
        });

        it("defaults to start (top) on horizontal sliders", async () => {
            const el = await fixture(
                html`<y-slider value="50" show-value="always"></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("position")).to.equal("top");
        });

        it("defaults to end (right) on vertical sliders", async () => {
            const el = await fixture(
                html`<y-slider
                    orientation="vertical"
                    value="50"
                    show-value="always"
                ></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.getAttribute("position")).to.equal("right");
        });

        it("warns and falls back when value-position is not 'start' or 'end'", async () => {
            const warn = sandbox.stub(console, "warn");
            const el = await fixture(
                html`<y-slider
                    value="50"
                    show-value="always"
                    value-position="top"
                ></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            // Falls back to default (start → top for horizontal)
            expect(tooltip.getAttribute("position")).to.equal("top");
            expect(warn.called).to.be.true;
        });

        it("toggling show-value to 'none' removes the tooltip wrapper", async () => {
            const el = await fixture(
                html`<y-slider value="50" show-value="always"></y-slider>`,
            );
            expect(el.shadowRoot.querySelector("y-tooltip")).to.exist;
            el.removeAttribute("show-value");
            expect(el.shadowRoot.querySelector("y-tooltip")).to.be.null;
        });

        it("preserves data-thumb on the inner thumb so pointer drag still picks the right thumb", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    show-value="always"
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const thumbMax = el.shadowRoot.querySelector(".thumb-max");
            expect(thumbMin.getAttribute("data-thumb")).to.equal("min");
            expect(thumbMax.getAttribute("data-thumb")).to.equal("max");
        });
    });

    describe("show-value='dragging' open management", () => {
        function stubHorizontalTrack(sandbox, el, width = 100) {
            const track = el.shadowRoot.querySelector(".track");
            sandbox.stub(track, "getBoundingClientRect").returns({
                left: 0,
                top: 0,
                right: width,
                bottom: 10,
                width,
                height: 10,
            });
            return track;
        }

        it("does not start with open in single mode", async () => {
            const el = await fixture(
                html`<y-slider value="40" show-value="dragging"></y-slider>`,
            );
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            expect(tooltip.hasAttribute("open")).to.be.false;
        });

        it("opens the tooltip when the track gains focus (single mode)", async () => {
            const el = await fixture(
                html`<y-slider value="40" show-value="dragging"></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            track.dispatchEvent(new FocusEvent("focus"));
            expect(tooltip.hasAttribute("open")).to.be.true;
        });

        it("closes the tooltip when the track blurs (and not dragging)", async () => {
            const el = await fixture(
                html`<y-slider value="40" show-value="dragging"></y-slider>`,
            );
            const track = el.shadowRoot.querySelector(".track");
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");
            track.dispatchEvent(new FocusEvent("focus"));
            expect(tooltip.hasAttribute("open")).to.be.true;
            track.dispatchEvent(new FocusEvent("blur"));
            expect(tooltip.hasAttribute("open")).to.be.false;
        });

        it("opens the tooltip when drag starts in single mode", async () => {
            const el = await fixture(
                html`<y-slider
                    value="40"
                    show-value="dragging"
                    style="width: 100px"
                ></y-slider>`,
            );
            const track = stubHorizontalTrack(sandbox, el);
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");

            track.dispatchEvent(
                new PointerEvent("pointerdown", {
                    bubbles: true,
                    clientX: 50,
                    clientY: 5,
                }),
            );
            expect(tooltip.hasAttribute("open")).to.be.true;
        });

        it("opens the tooltip for the focused range thumb only", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    show-value="dragging"
                ></y-slider>`,
            );
            const thumbMin = el.shadowRoot.querySelector(".thumb-min");
            const tooltipMin = el.shadowRoot.querySelector(
                "y-tooltip.tooltip-min",
            );
            const tooltipMax = el.shadowRoot.querySelector(
                "y-tooltip.tooltip-max",
            );

            thumbMin.dispatchEvent(new FocusEvent("focus"));
            expect(tooltipMin.hasAttribute("open")).to.be.true;
            expect(tooltipMax.hasAttribute("open")).to.be.false;
        });

        it("opens the tooltip for the dragged range thumb only", async () => {
            const el = await fixture(
                html`<y-slider
                    range
                    value-min="20"
                    value-max="80"
                    show-value="dragging"
                    style="width: 100px"
                ></y-slider>`,
            );
            const track = stubHorizontalTrack(sandbox, el);
            const tooltipMin = el.shadowRoot.querySelector(
                "y-tooltip.tooltip-min",
            );
            const tooltipMax = el.shadowRoot.querySelector(
                "y-tooltip.tooltip-max",
            );

            // Click closer to the max thumb (80) at x=70 (|70-20|=50, |70-80|=10).
            track.dispatchEvent(
                new PointerEvent("pointerdown", {
                    bubbles: true,
                    clientX: 70,
                    clientY: 5,
                }),
            );
            expect(tooltipMax.hasAttribute("open")).to.be.true;
            expect(tooltipMin.hasAttribute("open")).to.be.false;
        });

        it("keeps tooltip open after drag ends if focus remains", async () => {
            const el = await fixture(
                html`<y-slider
                    value="40"
                    show-value="dragging"
                    style="width: 100px"
                ></y-slider>`,
            );
            const track = stubHorizontalTrack(sandbox, el);
            const tooltip = el.shadowRoot.querySelector("y-tooltip.tooltip");

            track.dispatchEvent(new FocusEvent("focus"));
            track.dispatchEvent(
                new PointerEvent("pointerdown", {
                    bubbles: true,
                    clientX: 50,
                    clientY: 5,
                }),
            );
            // pointerup is dispatched on document, not the track
            document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
            // Track is still focused — tooltip should remain open
            expect(tooltip.hasAttribute("open")).to.be.true;
        });
    });
});
