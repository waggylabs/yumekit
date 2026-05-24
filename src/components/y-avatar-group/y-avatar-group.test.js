import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-avatar-group.js";
import "../y-avatar/y-avatar.js";

describe("YumeAvatarGroup", () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("defaults", () => {
        it("sets role=group on the host", async () => {
            const el = await fixture(html`<y-avatar-group></y-avatar-group>`);
            expect(el.getAttribute("role")).to.equal("group");
        });

        it("does not override an authored role", async () => {
            const el = await fixture(
                html`<y-avatar-group role="list"></y-avatar-group>`,
            );
            expect(el.getAttribute("role")).to.equal("list");
        });

        it("defaults orientation to horizontal", async () => {
            const el = await fixture(html`<y-avatar-group></y-avatar-group>`);
            expect(el.orientation).to.equal("horizontal");
        });

        it("defaults overlap to 2 when unset", async () => {
            const el = await fixture(html`<y-avatar-group></y-avatar-group>`);
            expect(el.overlap).to.equal(2);
        });

        it("defaults stack-order to last", async () => {
            const el = await fixture(html`<y-avatar-group></y-avatar-group>`);
            expect(el.stackOrder).to.equal("last");
        });

        it("defaults max to 0 (unlimited)", async () => {
            const el = await fixture(html`<y-avatar-group></y-avatar-group>`);
            expect(el.max).to.equal(0);
        });
    });

    describe("slotted children", () => {
        it("renders a slot when no avatars JSON is provided", async () => {
            const el = await fixture(html`
                <y-avatar-group>
                    <y-avatar alt="A"></y-avatar>
                </y-avatar-group>
            `);
            expect(el.shadowRoot.querySelector("slot")).to.exist;
        });

        it("does not apply overlap margin to the first child", async () => {
            const el = await fixture(html`
                <y-avatar-group>
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[0].style.marginInlineStart).to.equal("");
        });

        it("applies negative inline-start margin to non-first children when horizontal", async () => {
            const el = await fixture(html`
                <y-avatar-group overlap="10">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[1].style.marginInlineStart).to.equal("-10px");
            expect(avatars[2].style.marginInlineStart).to.equal("-10px");
            expect(avatars[1].style.marginBlockStart).to.equal("");
        });

        it("applies negative block-start margin when orientation is vertical", async () => {
            const el = await fixture(html`
                <y-avatar-group orientation="vertical" overlap="6">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[1].style.marginBlockStart).to.equal("-6px");
            expect(avatars[1].style.marginInlineStart).to.equal("");
        });

        it("stack-order=last assigns increasing z-index", async () => {
            const el = await fixture(html`
                <y-avatar-group>
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[0].style.zIndex).to.equal("0");
            expect(avatars[1].style.zIndex).to.equal("1");
            expect(avatars[2].style.zIndex).to.equal("2");
        });

        it("stack-order=first reverses z-index so the first child is on top", async () => {
            const el = await fixture(html`
                <y-avatar-group stack-order="first">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[0].style.zIndex).to.equal("2");
            expect(avatars[1].style.zIndex).to.equal("1");
            expect(avatars[2].style.zIndex).to.equal("0");
        });
    });

    describe("overflow", () => {
        it("hides avatars beyond max and shows a +N overflow indicator", async () => {
            const el = await fixture(html`
                <y-avatar-group max="2">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                    <y-avatar alt="D"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[0].style.display).to.equal("");
            expect(avatars[1].style.display).to.equal("");
            expect(avatars[2].style.display).to.equal("none");
            expect(avatars[3].style.display).to.equal("none");

            const overflow = el.shadowRoot.querySelector(".overflow");
            expect(overflow).to.exist;
            expect(overflow.textContent).to.equal("+2");
            expect(overflow.getAttribute("aria-label")).to.equal("+2 more");
        });

        it("does not render an overflow indicator when total <= max", async () => {
            const el = await fixture(html`
                <y-avatar-group max="3">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            expect(el.shadowRoot.querySelector(".overflow")).to.be.null;
        });

        it("dispatches y-overflow-click with count detail when activated", async () => {
            const el = await fixture(html`
                <y-avatar-group max="2">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                    <y-avatar alt="D"></y-avatar>
                    <y-avatar alt="E"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const overflow = el.shadowRoot.querySelector(".overflow");

            setTimeout(() => overflow.click());
            const event = await oneEvent(el, "y-overflow-click");
            expect(event.detail.count).to.equal(3);
        });

        it("with stack-order=last gives overflow the highest z-index", async () => {
            const el = await fixture(html`
                <y-avatar-group max="2">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const overflow = el.shadowRoot.querySelector(".overflow");
            // visible count = 2 avatars + 1 overflow = 3 → top z-index = 2
            expect(overflow.style.zIndex).to.equal("2");
        });

        it("with stack-order=first gives overflow z-index 0", async () => {
            const el = await fixture(html`
                <y-avatar-group max="2" stack-order="first">
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            const overflow = el.shadowRoot.querySelector(".overflow");
            expect(overflow.style.zIndex).to.equal("0");
        });
    });

    describe("JSON avatars", () => {
        it("renders y-avatar elements from a JSON array in the shadow DOM", async () => {
            const data = JSON.stringify([
                { alt: "Jane Doe" },
                { alt: "John Smith" },
                { alt: "Pat Lee", color: "success" },
            ]);
            const el = await fixture(
                html`<y-avatar-group avatars=${data}></y-avatar-group>`,
            );
            const avatars = el.shadowRoot.querySelectorAll("y-avatar");
            expect(avatars).to.have.lengthOf(3);
            expect(avatars[0].getAttribute("alt")).to.equal("Jane Doe");
            expect(avatars[2].getAttribute("color")).to.equal("success");
        });

        it("applies the group's size attribute to JSON-rendered avatars", async () => {
            const data = JSON.stringify([{ alt: "A" }, { alt: "B" }]);
            const el = await fixture(
                html`<y-avatar-group
                    size="large"
                    avatars=${data}
                ></y-avatar-group>`,
            );
            const avatars = el.shadowRoot.querySelectorAll("y-avatar");
            expect(avatars[0].getAttribute("size")).to.equal("large");
            expect(avatars[1].getAttribute("size")).to.equal("large");
        });

        it("ignores slotted children when avatars JSON is set", async () => {
            const data = JSON.stringify([{ alt: "JSON-A" }]);
            const el = await fixture(html`
                <y-avatar-group avatars=${data}>
                    <y-avatar alt="SLOTTED"></y-avatar>
                </y-avatar-group>
            `);
            const shadowAvatars = el.shadowRoot.querySelectorAll("y-avatar");
            expect(shadowAvatars).to.have.lengthOf(1);
            expect(shadowAvatars[0].getAttribute("alt")).to.equal("JSON-A");
            expect(el.shadowRoot.querySelector("slot")).to.be.null;
        });

        it("falls back to slotted rendering when JSON is malformed", async () => {
            const el = await fixture(html`
                <y-avatar-group avatars="not-valid-json">
                    <y-avatar alt="A"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            expect(el.shadowRoot.querySelector("slot")).to.exist;
        });

        it("respects max with JSON avatars", async () => {
            const data = JSON.stringify([
                { alt: "A" },
                { alt: "B" },
                { alt: "C" },
                { alt: "D" },
            ]);
            const el = await fixture(
                html`<y-avatar-group max="2" avatars=${data}></y-avatar-group>`,
            );
            const avatars = el.shadowRoot.querySelectorAll("y-avatar");
            expect(avatars[0].style.display).to.equal("");
            expect(avatars[1].style.display).to.equal("");
            expect(avatars[2].style.display).to.equal("none");
            expect(avatars[3].style.display).to.equal("none");
            const overflow = el.shadowRoot.querySelector(".overflow");
            expect(overflow.textContent).to.equal("+2");
        });
    });

    describe("attribute updates", () => {
        it("re-applies styles when orientation changes", async () => {
            const el = await fixture(html`
                <y-avatar-group>
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            el.setAttribute("orientation", "vertical");
            await new Promise((r) => setTimeout(r, 0));
            const avatars = el.querySelectorAll("y-avatar");
            expect(avatars[1].style.marginBlockStart).to.equal("-2px");
            expect(avatars[1].style.marginInlineStart).to.equal("");
        });

        it("re-applies overflow when max changes", async () => {
            const el = await fixture(html`
                <y-avatar-group>
                    <y-avatar alt="A"></y-avatar>
                    <y-avatar alt="B"></y-avatar>
                    <y-avatar alt="C"></y-avatar>
                </y-avatar-group>
            `);
            await new Promise((r) => setTimeout(r, 0));
            expect(el.shadowRoot.querySelector(".overflow")).to.be.null;

            el.setAttribute("max", "2");
            await new Promise((r) => setTimeout(r, 0));
            const overflow = el.shadowRoot.querySelector(".overflow");
            expect(overflow).to.exist;
            expect(overflow.textContent).to.equal("+1");
        });

        it("setters reflect to attributes", async () => {
            const el = await fixture(html`<y-avatar-group></y-avatar-group>`);
            el.orientation = "vertical";
            el.max = 5;
            el.overlap = 12;
            el.size = "large";
            el.stackOrder = "first";
            expect(el.getAttribute("orientation")).to.equal("vertical");
            expect(el.getAttribute("max")).to.equal("5");
            expect(el.getAttribute("overlap")).to.equal("12");
            expect(el.getAttribute("size")).to.equal("large");
            expect(el.getAttribute("stack-order")).to.equal("first");
        });
    });
});
