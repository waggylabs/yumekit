import { html, fixture, expect } from "@open-wc/testing";
import "../y-theme/y-theme.js"; // registers y-theme so themed tokens resolve
import "./y-gauge.js";

async function gauge(props = {}) {
    const el = await fixture(html`<y-gauge></y-gauge>`);
    Object.assign(el, props);
    return el;
}

describe("YumeGauge", () => {
    describe("defaults", () => {
        it("is a modern progress gauge with a track and fill", async () => {
            const el = await gauge({ value: 50 });
            expect(el.shadowRoot.querySelector(".track")).to.exist;
            expect(el.shadowRoot.querySelector(".progress")).to.exist;
            expect(el.shadowRoot.querySelector(".needle")).to.not.exist;
            expect(el.shadowRoot.querySelector(".zone")).to.not.exist;
            expect(el.shadowRoot.querySelector(".tick")).to.not.exist;
        });

        it("defaults the value to the minimum", async () => {
            const el = await gauge({ min: 10, max: 20 });
            expect(el.value).to.equal(10);
        });

        it("shows the value with its unit in the center", async () => {
            const el = await gauge({ value: 42, unit: "%" });
            const text = el.shadowRoot.querySelector(".value").textContent;
            expect(text).to.equal("42%");
        });
    });

    describe("meter semantics", () => {
        it("exposes meter role and value bounds", async () => {
            const el = await gauge({ value: 30, min: 0, max: 60 });
            const svg = el.shadowRoot.querySelector(".gauge");
            expect(svg.getAttribute("role")).to.equal("meter");
            expect(svg.getAttribute("aria-valuemin")).to.equal("0");
            expect(svg.getAttribute("aria-valuemax")).to.equal("60");
            expect(svg.getAttribute("aria-valuenow")).to.equal("30");
        });

        it("clamps aria-valuenow into the domain", async () => {
            const el = await gauge({ value: 999, min: 0, max: 100 });
            expect(
                el.shadowRoot.querySelector(".gauge").getAttribute("aria-valuenow"),
            ).to.equal("100");
        });

        it("builds an aria-valuetext with the unit", async () => {
            const el = await gauge({ value: 20, unit: "mph" });
            expect(
                el.shadowRoot
                    .querySelector(".gauge")
                    .getAttribute("aria-valuetext"),
            ).to.equal("20 mph");
        });

        it("names the gauge from its label", async () => {
            const el = await gauge({ label: "Speed" });
            expect(
                el.shadowRoot.querySelector(".gauge").getAttribute("aria-label"),
            ).to.equal("Speed");
        });
    });

    describe("progress", () => {
        it("offsets the fill by 1 − fraction", async () => {
            const el = await gauge({ value: 50, min: 0, max: 100 });
            const path = el.shadowRoot.querySelector(".progress");
            // Firefox and WebKit read the offset back with a `px` unit; Chromium doesn't.
            expect(parseFloat(path.style.strokeDashoffset)).to.equal(0.5);
        });

        it("fills fully at the maximum", async () => {
            const el = await gauge({ value: 100, min: 0, max: 100 });
            expect(
                parseFloat(
                    el.shadowRoot.querySelector(".progress").style
                        .strokeDashoffset,
                ),
            ).to.equal(0);
        });

        it("omits the fill when progress is false", async () => {
            const el = await gauge({ value: 50, progress: false });
            expect(el.shadowRoot.querySelector(".progress")).to.not.exist;
        });
    });

    describe("needle", () => {
        it("draws a needle rotated to the value angle", async () => {
            const el = await gauge({ needle: true, value: 0, min: 0, max: 100 });
            const needle = el.shadowRoot.querySelector(".needle");
            expect(needle).to.exist;
            // Value at the minimum sits at the start angle (225° by default).
            expect(needle.style.transform).to.equal("rotate(225deg)");
        });

        it("rotates toward the end angle as the value rises", async () => {
            const el = await gauge({ needle: true, value: 100, min: 0, max: 100 });
            expect(el.shadowRoot.querySelector(".needle").style.transform).to.equal(
                "rotate(495deg)",
            );
        });
    });

    describe("ranges", () => {
        it("paints one zone per valid range", async () => {
            const el = await gauge({
                ranges: [
                    { from: 0, to: 30, color: "#5CB85C" },
                    { from: 70, to: 100, color: "#D9534F" },
                ],
            });
            expect(el.shadowRoot.querySelectorAll(".zone")).to.have.lengthOf(2);
        });

        it("accepts the kepler startValue/endValue shape", async () => {
            const el = await gauge({
                ranges: [{ startValue: 6000, endValue: 8000, color: "#D9534F" }],
                min: 0,
                max: 8000,
            });
            expect(el.shadowRoot.querySelectorAll(".zone")).to.have.lengthOf(1);
        });

        it("skips a degenerate range", async () => {
            const el = await gauge({
                ranges: [{ from: 50, to: 50, color: "#000" }],
            });
            expect(el.shadowRoot.querySelector(".zone")).to.not.exist;
        });

        it("tints the accent by the range the value sits in", async () => {
            const el = await gauge({
                value: 80,
                ranges: [{ from: 70, to: 100, color: "#D9534F" }],
            });
            expect(
                el.shadowRoot
                    .querySelector(".gauge")
                    .style.getPropertyValue("--_gauge-accent"),
            ).to.equal("#D9534F");
        });

        it("lets an explicit color win over the range tint", async () => {
            const el = await gauge({
                value: 80,
                color: "#123456",
                ranges: [{ from: 70, to: 100, color: "#D9534F" }],
            });
            expect(
                el.shadowRoot
                    .querySelector(".gauge")
                    .style.getPropertyValue("--_gauge-accent"),
            ).to.equal("#123456");
        });

        it("rejects an unsafe range color", async () => {
            const el = await gauge({
                ranges: [{ from: 0, to: 50, color: "url(javascript:alert(1))" }],
            });
            // Painted via inline style, so a var() token resolves; the unsafe
            // value is dropped for the neutral fallback.
            const stroke = el.shadowRoot.querySelector(".zone").style.stroke;
            expect(stroke).to.not.contain("javascript");
        });

        it("accepts a var() token as a range color", async () => {
            const el = await gauge({
                ranges: [{ from: 0, to: 50, color: "var(--error-content)" }],
            });
            // Set as CSS (not a presentation attribute) so var() actually resolves.
            expect(el.shadowRoot.querySelector(".zone").style.stroke).to.equal(
                "var(--error-content)",
            );
        });

        it("tints the accent from a var() range color", async () => {
            const el = await gauge({
                value: 80,
                ranges: [{ from: 70, to: 100, color: "var(--error-content)" }],
            });
            expect(
                el.shadowRoot
                    .querySelector(".gauge")
                    .style.getPropertyValue("--_gauge-accent"),
            ).to.equal("var(--error-content)");
        });
    });

    describe("ticks", () => {
        it("draws major ticks at each interval boundary", async () => {
            const el = await gauge({ ticks: 10 });
            // 10 intervals → 11 boundary ticks.
            expect(el.shadowRoot.querySelectorAll(".tick")).to.have.lengthOf(11);
        });

        it("subdivides with minor ticks", async () => {
            const el = await gauge({ ticks: 2, minorTicks: 1 });
            // total = 2 * (1 + 1) = 4 segments → 3 majors, 2 minors.
            expect(
                el.shadowRoot.querySelectorAll(".tick:not(.tick--minor)"),
            ).to.have.lengthOf(3);
            expect(
                el.shadowRoot.querySelectorAll(".tick--minor"),
            ).to.have.lengthOf(2);
        });

        it("labels major ticks when tick-labels is set", async () => {
            const el = await gauge({ ticks: 4, tickLabels: true, max: 100 });
            const labels = [
                ...el.shadowRoot.querySelectorAll(".tick-label"),
            ].map((t) => t.textContent);
            expect(labels).to.deep.equal(["0", "25", "50", "75", "100"]);
        });
    });

    describe("target", () => {
        it("draws a target marker when a target is set", async () => {
            const el = await gauge({ target: 75, max: 100 });
            const target = el.shadowRoot.querySelector(".target");
            expect(target).to.exist;
            expect(target.getAttribute("aria-label")).to.contain("75");
        });

        it("draws no target by default", async () => {
            const el = await gauge({ value: 50 });
            expect(el.shadowRoot.querySelector(".target")).to.not.exist;
        });
    });

    describe("value text", () => {
        it("formats decimals with grouped thousands", async () => {
            const el = await gauge({ value: 1234.5, decimals: 1, max: 2000 });
            expect(el.shadowRoot.querySelector(".value").textContent).to.equal(
                "1,234.5",
            );
        });

        it("hides the center value when show-value is false", async () => {
            const el = await gauge({ value: 50, showValue: false });
            expect(el.shadowRoot.querySelector(".value")).to.not.exist;
        });

        it("still shows a label with the value hidden", async () => {
            const el = await gauge({ showValue: false, label: "RPM" });
            expect(el.shadowRoot.querySelector(".value")).to.not.exist;
            expect(el.shadowRoot.querySelector(".label").textContent).to.equal(
                "RPM",
            );
        });

        it("keeps the label centered without a needle", async () => {
            const el = await gauge({ value: 50, label: "Speed" });
            const label = el.shadowRoot.querySelector(".label");
            // Stacked under the value at the dial's center (CY = 100).
            expect(parseFloat(label.getAttribute("y"))).to.equal(116);
        });

        it("drops the value and label below the needle's sweep when a needle is present", async () => {
            const el = await gauge({ value: 50, label: "Speed", needle: true });
            // Below the tip circle: CY + (R − thickness·R − 4) + 10 with the
            // defaults = 100 + 58.16 + 10 — clear of the pointer at any angle,
            // so the needle can never cross the number. The label stacks 20
            // under the value, as it does at the center.
            const value = el.shadowRoot.querySelector(".value");
            const label = el.shadowRoot.querySelector(".label");
            expect(parseFloat(value.getAttribute("y"))).to.be.closeTo(168.16, 0.01);
            expect(parseFloat(label.getAttribute("y"))).to.be.closeTo(188.16, 0.01);
        });

        it("gives the label the top slot below the needle when the value is hidden", async () => {
            const el = await gauge({
                value: 50,
                label: "Speed",
                needle: true,
                showValue: false,
            });
            const label = el.shadowRoot.querySelector(".label");
            expect(parseFloat(label.getAttribute("y"))).to.be.closeTo(168.16, 0.01);
        });
    });

    describe("geometry", () => {
        it("honors custom start and end angles", async () => {
            const el = await gauge({
                needle: true,
                value: 0,
                min: 0,
                max: 100,
                startAngle: 270,
                endAngle: 450,
            });
            expect(el.shadowRoot.querySelector(".needle").style.transform).to.equal(
                "rotate(270deg)",
            );
        });

        it("draws a closed ring for a full revolution", async () => {
            const el = await gauge({ value: 50, startAngle: 0, endAngle: 360 });
            const track = el.shadowRoot.querySelector(".track");

            // A single A command whose endpoints coincide renders nothing, which is
            // what a naive 0->360 sweep produces — measure, don't trust the path.
            const box = track.getBBox();
            expect(box.width).to.be.greaterThan(100);
            expect(box.height).to.be.closeTo(box.width, 1, "a circle, not an arc");
        });

        it("fills a full-circle progress arc proportionally", async () => {
            const el = await gauge({
                value: 25,
                startAngle: 0,
                endAngle: 360,
                progress: true,
            });
            const path = el.shadowRoot.querySelector(".progress");

            expect(parseFloat(path.style.strokeDashoffset)).to.equal(0.75);
            // The whole circumference is available to fill, not half of it.
            const track = el.shadowRoot.querySelector(".track");
            expect(path.getTotalLength()).to.be.closeTo(
                track.getTotalLength(),
                1,
            );
        });

        it("does not stack a duplicate tick where the dial closes", async () => {
            const full = await gauge({
                startAngle: 0,
                endAngle: 360,
                ticks: 4,
                tickLabels: true,
            });
            const open = await gauge({ ticks: 4, tickLabels: true });

            // The open dial marks both ends; the closed one would put the last mark
            // exactly on the first.
            expect(open.shadowRoot.querySelectorAll(".tick")).to.have.lengthOf(5);
            expect(full.shadowRoot.querySelectorAll(".tick")).to.have.lengthOf(4);
        });

        it("treats more than one revolution as a single circle", async () => {
            const once = await gauge({ startAngle: 0, endAngle: 360 });
            const twice = await gauge({ startAngle: 0, endAngle: 720 });

            expect(twice.shadowRoot.querySelector(".track").getAttribute("d")).to.equal(
                once.shadowRoot.querySelector(".track").getAttribute("d"),
            );
        });

        it("keeps the default 270° sweep open", async () => {
            const el = await gauge({ value: 50 });
            const box = el.shadowRoot.querySelector(".track").getBBox();
            // The bottom gap makes it shorter than it is wide.
            expect(box.height).to.be.lessThan(box.width);
        });

        it("parses ranges from a JSON attribute", async () => {
            const el = await fixture(
                html`<y-gauge
                    ranges='[{"from":0,"to":50,"color":"#5CB85C"}]'
                ></y-gauge>`,
            );
            expect(el.shadowRoot.querySelectorAll(".zone")).to.have.lengthOf(1);
        });
    });

    describe("loading", () => {
        it("shows a skeleton dial in place of the gauge", async () => {
            const el = await gauge({ value: 60, loading: true });
            const skeleton = el.shadowRoot.querySelector(".skeleton");
            expect(skeleton).to.exist;
            expect(skeleton.getAttribute("aria-busy")).to.equal("true");
            expect(
                el.shadowRoot.querySelector("y-skeleton[variant='circle']"),
            ).to.exist;
            expect(el.shadowRoot.querySelector(".gauge")).to.not.exist;
        });

        it("announces a custom loading label", async () => {
            const el = await gauge({ loading: true, loadingText: "Reading…" });
            expect(
                el.shadowRoot.querySelector(".skeleton").getAttribute("aria-label"),
            ).to.equal("Reading…");
        });

        it("draws the gauge once loading clears", async () => {
            const el = await gauge({ value: 60, loading: true });
            el.loading = false;
            expect(el.shadowRoot.querySelector(".skeleton")).to.not.exist;
            expect(el.shadowRoot.querySelector(".gauge")).to.exist;
        });
    });

    describe("accessibility", () => {
        it("passes an a11y audit", async () => {
            const el = await gauge({
                value: 60,
                label: "CPU load",
                unit: "%",
                target: 80,
                ranges: [{ from: 80, to: 100, color: "#D9534F" }],
            });
            await expect(el).to.be.accessible();
        });

        it("passes an a11y audit while loading", async () => {
            const el = await gauge({ value: 60, label: "CPU load", loading: true });
            await expect(el).to.be.accessible();
        });
    });
});
