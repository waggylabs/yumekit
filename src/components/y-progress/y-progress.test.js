import { html, fixture, expect } from "@open-wc/testing";
import "./y-progress.js";

describe("YumeProgress", () => {
    // ── Bar mode (default) — back-compat ────────────────────
    it("renders with default attributes", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        const track = el.shadowRoot.querySelector(".track");
        const bar = el.shadowRoot.querySelector(".bar");

        expect(track).to.exist;
        expect(bar).to.exist;
        expect(track.getAttribute("role")).to.equal("progressbar");
        expect(track.getAttribute("aria-valuenow")).to.equal("50");
        expect(track.getAttribute("aria-valuemin")).to.equal("0");
        expect(track.getAttribute("aria-valuemax")).to.equal("100");
    });

    it("defaults min to 0 and max to 100", async () => {
        const el = await fixture(html`<y-progress value="25"></y-progress>`);
        expect(el.min).to.equal(0);
        expect(el.max).to.equal(100);
    });

    it("computes percentage correctly", async () => {
        const el = await fixture(
            html`<y-progress value="50" min="0" max="200"></y-progress>`,
        );
        expect(el.percentage).to.equal(25);
    });

    it("clamps percentage between 0 and 100", async () => {
        const el = await fixture(
            html`<y-progress value="150" max="100"></y-progress>`,
        );
        expect(el.percentage).to.equal(100);

        el.value = -10;
        expect(el.percentage).to.equal(0);
    });

    it("applies bar width from percentage", async () => {
        const el = await fixture(html`<y-progress value="75"></y-progress>`);
        const bar = el.shadowRoot.querySelector(".bar");
        expect(bar.style.width).to.equal("75%");
    });

    it("supports custom min and max", async () => {
        const el = await fixture(
            html`<y-progress value="5" min="0" max="10"></y-progress>`,
        );
        expect(el.percentage).to.equal(50);
        const bar = el.shadowRoot.querySelector(".bar");
        expect(bar.style.width).to.equal("50%");
    });

    it("snaps to step values", async () => {
        const el = await fixture(
            html`<y-progress value="33" step="25"></y-progress>`,
        );
        // 33% should snap to 25%
        expect(el.percentage).to.equal(25);
    });

    it("displays percent label centered in the track", async () => {
        const el = await fixture(html`<y-progress value="60"></y-progress>`);
        const track = el.shadowRoot.querySelector(".track");
        const trackLabel = track.querySelector(".value-label--track");
        const barLabel = track.querySelector(".value-label--bar");
        expect(trackLabel).to.exist;
        expect(trackLabel.textContent).to.equal("60%");
        expect(barLabel).to.exist;
        expect(barLabel.textContent).to.equal("60%");
    });

    it("hides label when label-display is false", async () => {
        const el = await fixture(
            html`<y-progress value="60" label-display="false"></y-progress>`,
        );
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label).to.not.exist;
    });

    it("shows value format when label-format is value", async () => {
        const el = await fixture(
            html`<y-progress
                value="40"
                max="200"
                label-format="value"
            ></y-progress>`,
        );
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("40 / 200");
    });

    it("shows fraction format when label-format is fraction", async () => {
        const el = await fixture(
            html`<y-progress
                value="30"
                min="10"
                max="60"
                label-format="fraction"
            ></y-progress>`,
        );
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("20 / 50");
    });

    it("applies color from colorMap to the bar inline style", async () => {
        const el = await fixture(
            html`<y-progress value="50" color="success"></y-progress>`,
        );
        const bar = el.shadowRoot.querySelector(".bar");
        expect(bar.getAttribute("style")).to.include(
            "var(--success-content--)",
        );
    });

    it("uses raw color value when a hex color is provided", async () => {
        const el = await fixture(
            html`<y-progress value="50" color="#ff0000"></y-progress>`,
        );
        const bar = el.shadowRoot.querySelector(".bar");
        expect(bar.getAttribute("style")).to.include("#ff0000");
    });

    it("renders indeterminate state", async () => {
        const el = await fixture(html`<y-progress indeterminate></y-progress>`);
        const track = el.shadowRoot.querySelector(".track");
        const bar = el.shadowRoot.querySelector(".bar");

        expect(track.getAttribute("aria-busy")).to.equal("true");
        expect(bar.classList.contains("bar--indeterminate")).to.be.true;
        expect(el.shadowRoot.querySelector(".value-label")).to.not.exist;
    });

    it("applies disabled styling via the host attribute", async () => {
        const el = await fixture(
            html`<y-progress value="50" disabled></y-progress>`,
        );
        expect(el.hasAttribute("disabled")).to.be.true;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-disabled")).to.equal("true");
    });

    it("applies size token to the track", async () => {
        const el = await fixture(
            html`<y-progress value="50" size="large"></y-progress>`,
        );
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("style")).to.include(
            "--component-progress-size-large",
        );
    });

    it("defaults size to medium", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        expect(el.size).to.equal("medium");
    });

    it("increments value by step", async () => {
        const el = await fixture(
            html`<y-progress value="40" step="10" max="100"></y-progress>`,
        );
        el.increment();
        expect(el.value).to.equal(50);
    });

    it("does not increment past max", async () => {
        const el = await fixture(
            html`<y-progress value="95" step="10" max="100"></y-progress>`,
        );
        el.increment();
        expect(el.value).to.equal(100);
    });

    it("decrements value by step", async () => {
        const el = await fixture(
            html`<y-progress value="40" step="10"></y-progress>`,
        );
        el.decrement();
        expect(el.value).to.equal(30);
    });

    it("does not decrement below min", async () => {
        const el = await fixture(
            html`<y-progress value="5" step="10" min="0"></y-progress>`,
        );
        el.decrement();
        expect(el.value).to.equal(0);
    });

    it("updates when attributes change", async () => {
        const el = await fixture(html`<y-progress value="20"></y-progress>`);
        el.setAttribute("value", "80");
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("80%");
    });

    it("renders slotted label content", async () => {
        const el = await fixture(
            html`<y-progress value="50">Loading...</y-progress>`,
        );
        const slot = el.shadowRoot.querySelector("slot");
        expect(slot).to.exist;
    });

    it("sets color via the color setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.color = "error";
        expect(el.getAttribute("color")).to.equal("error");
        const bar = el.shadowRoot.querySelector(".bar");
        expect(bar.getAttribute("style")).to.include("var(--error-content--)");
    });

    it("sets disabled to true via the disabled setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.disabled = true;
        expect(el.hasAttribute("disabled")).to.be.true;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-disabled")).to.equal("true");
    });

    it("removes disabled attribute via the disabled setter when set to false", async () => {
        const el = await fixture(
            html`<y-progress value="50" disabled></y-progress>`,
        );
        el.disabled = false;
        expect(el.hasAttribute("disabled")).to.be.false;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.hasAttribute("aria-disabled")).to.be.false;
    });

    it("sets indeterminate to true via the indeterminate setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.indeterminate = true;
        expect(el.hasAttribute("indeterminate")).to.be.true;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-busy")).to.equal("true");
    });

    it("removes indeterminate attribute via the indeterminate setter when set to false", async () => {
        const el = await fixture(
            html`<y-progress value="50" indeterminate></y-progress>`,
        );
        el.indeterminate = false;
        expect(el.hasAttribute("indeterminate")).to.be.false;
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-busy")).to.be.null;
    });

    it("sets size via the size setter", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.size = "small";
        expect(el.getAttribute("size")).to.equal("small");
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("style")).to.include(
            "--component-progress-size-small",
        );
    });

    it("sets value via the value setter", async () => {
        const el = await fixture(html`<y-progress value="20"></y-progress>`);
        el.value = 75;
        expect(el.getAttribute("value")).to.equal("75");
        const label = el.shadowRoot.querySelector(".value-label");
        expect(label.textContent).to.equal("75%");
    });

    it("removes value attribute via the value setter when set to null", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.value = null;
        expect(el.hasAttribute("value")).to.be.false;
        expect(el.value).to.be.null;
    });

    it("sets step via the step setter", async () => {
        const el = await fixture(html`<y-progress value="33"></y-progress>`);
        el.step = 10;
        expect(el.getAttribute("step")).to.equal("10");
        expect(el.step).to.equal(10);
    });

    it("removes step attribute via the step setter when set to null", async () => {
        const el = await fixture(
            html`<y-progress value="50" step="10"></y-progress>`,
        );
        el.step = null;
        expect(el.hasAttribute("step")).to.be.false;
        expect(el.step).to.be.null;
    });

    // ── Stacked bar (multi-value) ───────────────────────────
    it("renders one .bar--stacked per entry when values has >1 entries", async () => {
        const el = await fixture(html`
            <y-progress
                values='[{"value":30,"color":"primary"},{"value":40,"color":"success"}]'
            ></y-progress>
        `);
        const bars = el.shadowRoot.querySelectorAll(".bar--stacked");
        expect(bars).to.have.lengthOf(2);
        expect(bars[0].style.width).to.equal("30%");
        expect(bars[1].style.width).to.equal("40%");
        expect(bars[0].getAttribute("style")).to.include(
            "var(--primary-content--)",
        );
        expect(bars[1].getAttribute("style")).to.include(
            "var(--success-content--)",
        );
    });

    it("stacked aria-valuenow is the sum of entry values, capped at max", async () => {
        const el = await fixture(html`
            <y-progress values='[{"value":30},{"value":40}]'></y-progress>
        `);
        const track = el.shadowRoot.querySelector(".track");
        expect(track.getAttribute("aria-valuenow")).to.equal("70");
    });

    it("falls back to value when values is invalid JSON", async () => {
        const el = await fixture(
            html`<y-progress value="50" values="not-json"></y-progress>`,
        );
        const bars = el.shadowRoot.querySelectorAll(".bar");
        expect(bars).to.have.lengthOf(1);
        expect(bars[0].classList.contains("bar--stacked")).to.be.false;
        expect(bars[0].style.width).to.equal("50%");
    });

    it("hides the value label in multi-value mode", async () => {
        const el = await fixture(html`
            <y-progress values='[{"value":30},{"value":40}]'></y-progress>
        `);
        expect(el.shadowRoot.querySelector(".value-label")).to.not.exist;
    });

    // ── Segmented bar ───────────────────────────────────────
    it("renders N segment children when segmented is set with an integer", async () => {
        const el = await fixture(
            html`<y-progress value="50" segmented="5"></y-progress>`,
        );
        const segments = el.shadowRoot.querySelectorAll(".segment");
        expect(segments).to.have.lengthOf(5);
    });

    it("derives segment count from step when segmented has no value", async () => {
        const el = await fixture(
            html`<y-progress value="40" step="20" segmented></y-progress>`,
        );
        // (max-min)/step = 100/20 = 5
        const segments = el.shadowRoot.querySelectorAll(".segment");
        expect(segments).to.have.lengthOf(5);
    });

    it("marks segments up to percentage as filled", async () => {
        const el = await fixture(
            html`<y-progress value="60" segmented="10"></y-progress>`,
        );
        const filled = el.shadowRoot.querySelectorAll(".segment--filled");
        expect(filled).to.have.lengthOf(6);
    });

    // ── Ring mode ───────────────────────────────────────────
    it("renders an SVG ring with track and fill circles", async () => {
        const el = await fixture(
            html`<y-progress value="50" mode="ring"></y-progress>`,
        );
        const svg = el.shadowRoot.querySelector("svg.ring");
        expect(svg).to.exist;
        expect(svg.getAttribute("role")).to.equal("progressbar");
        expect(svg.getAttribute("aria-valuenow")).to.equal("50");
        expect(svg.querySelector(".ring-track")).to.exist;
        expect(svg.querySelector(".ring-fill")).to.exist;
    });

    it("renders concentric rings when ring mode has >1 entries", async () => {
        const el = await fixture(html`
            <y-progress
                mode="ring"
                values='[{"value":80},{"value":50},{"value":20}]'
            ></y-progress>
        `);
        const fills = el.shadowRoot.querySelectorAll(".ring-fill");
        expect(fills.length).to.equal(3);
    });

    it("renders the centered value label by default in ring mode", async () => {
        const el = await fixture(
            html`<y-progress value="42" mode="ring"></y-progress>`,
        );
        const center = el.shadowRoot.querySelector(".center");
        expect(center).to.exist;
        const label = center.querySelector(".value-label");
        expect(label.textContent).to.equal("42%");
    });

    it("ring mode supports the center slot to replace the built-in label", async () => {
        const el = await fixture(html`
            <y-progress value="42" mode="ring">
                <span slot="center">Custom</span>
            </y-progress>
        `);
        const slot = el.shadowRoot.querySelector("slot[name='center']");
        expect(slot).to.exist;
        const assigned = slot.assignedNodes({ flatten: true });
        const node = assigned.find((n) => n.nodeType === 1);
        expect(node.textContent).to.equal("Custom");
    });

    it("segmented ring produces visible angular gaps between segments", async () => {
        const el = await fixture(
            html`<y-progress
                mode="ring"
                value="100"
                segmented="6"
                size="120px"
                segment-gap="8px"
            ></y-progress>`,
        );
        const segs = el.shadowRoot.querySelectorAll(".ring-fill--segment");
        expect(segs).to.have.lengthOf(6);
        // Each segment occupies 60° of arc; with a non-zero gap the rendered
        // arc must be shorter than the full slot — getTotalLength catches the
        // case where the gap collapses to 0 and segments visually touch.
        const r = 120 / 2 - parseFloat(segs[0].getAttribute("stroke-width")) / 2;
        const fullSegLen = (2 * Math.PI * r) / 6;
        for (const seg of segs) {
            expect(seg.getTotalLength()).to.be.lessThan(fullSegLen - 0.5);
        }
    });

    it("ring indeterminate sets aria-busy and skips the value label", async () => {
        const el = await fixture(
            html`<y-progress mode="ring" indeterminate></y-progress>`,
        );
        const svg = el.shadowRoot.querySelector("svg.ring");
        expect(svg.getAttribute("aria-busy")).to.equal("true");
        expect(el.shadowRoot.querySelector(".center .value-label")).to.not
            .exist;
    });

    // ── Pie mode ────────────────────────────────────────────
    it("renders an SVG pie with a track circle and a sector fill", async () => {
        const el = await fixture(
            html`<y-progress value="50" mode="pie"></y-progress>`,
        );
        const svg = el.shadowRoot.querySelector("svg.pie");
        expect(svg).to.exist;
        expect(svg.querySelector(".pie-track")).to.exist;
        expect(svg.querySelector(".pie-fill")).to.exist;
    });

    it("renders one slice per entry in multi-value pie", async () => {
        const el = await fixture(html`
            <y-progress
                mode="pie"
                values='[{"value":25},{"value":25},{"value":25}]'
            ></y-progress>
        `);
        const slices = el.shadowRoot.querySelectorAll(".pie-fill");
        expect(slices.length).to.equal(3);
    });

    // ── New attributes ──────────────────────────────────────
    it("track-color attribute sets --track-color on the host", async () => {
        const el = await fixture(
            html`<y-progress value="50" track-color="#eee"></y-progress>`,
        );
        expect(el.style.getPropertyValue("--track-color")).to.equal("#eee");
    });

    it("mode falls back to bar for an unknown value", async () => {
        const el = await fixture(
            html`<y-progress value="50" mode="bogus"></y-progress>`,
        );
        expect(el.mode).to.equal("bar");
    });

    it("direction setter round-trips and clamps to clockwise", async () => {
        const el = await fixture(html`<y-progress value="50"></y-progress>`);
        el.direction = "counterclockwise";
        expect(el.getAttribute("direction")).to.equal("counterclockwise");
        el.setAttribute("direction", "sideways");
        expect(el.direction).to.equal("clockwise");
    });

    it("startAngle defaults to 0 (12 o'clock) and accepts overrides", async () => {
        const el = await fixture(
            html`<y-progress mode="ring" value="50"></y-progress>`,
        );
        expect(el.startAngle).to.equal(0);
        el.setAttribute("start-angle", "90");
        expect(el.startAngle).to.equal(90);
    });

    it("values setter serializes JSON onto the attribute", async () => {
        const el = await fixture(html`<y-progress></y-progress>`);
        el.values = [{ value: 10 }, { value: 20 }];
        expect(el.getAttribute("values")).to.equal(
            '[{"value":10},{"value":20}]',
        );
        expect(el.values.length).to.equal(2);
    });

    it("values setter passes pre-serialized JSON strings through unchanged", async () => {
        const el = await fixture(html`<y-progress></y-progress>`);
        const raw = '[{"value":10},{"value":20}]';
        el.values = raw;
        expect(el.getAttribute("values")).to.equal(raw);
        expect(el.values.length).to.equal(2);
    });
});
