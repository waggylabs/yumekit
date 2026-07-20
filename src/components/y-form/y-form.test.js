import { fixture, html, expect, oneEvent } from "@open-wc/testing";
import "./y-form.js";

const BASIC_FIELDS = [
    { type: "input", name: "username", label: "Username" },
    { type: "input", name: "email", label: "Email", inputType: "email" },
    { type: "checkbox", name: "subscribe", label: "Subscribe" },
];

describe("<y-form>", () => {
    it("renders generated controls from fields in order", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = BASIC_FIELDS;

        const controls = el.shadowRoot.querySelectorAll(
            ".fields y-input, .fields y-checkbox",
        );
        expect(controls.length).to.equal(3);
        expect(controls[0].getAttribute("name")).to.equal("username");
        expect(controls[1].getAttribute("type")).to.equal("email");
        expect(controls[2].tagName).to.equal("Y-CHECKBOX");
    });

    it("accepts fields as a JSON attribute", async () => {
        const el = await fixture(html`
            <y-form
                fields='[{"type":"input","name":"a","label":"A"}]'
            ></y-form>
        `);
        expect(el.fields.length).to.equal(1);
        expect(el.shadowRoot.querySelector("y-input[name='a']")).to.exist;
    });

    it("renders a named slot outlet at the entry's position, even before a child exists", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "before" },
            { slot: "custom" },
            { type: "input", name: "after" },
        ];

        const rows = el.shadowRoot.querySelectorAll(".fields .field");
        expect(rows.length).to.equal(3);
        const outlet = rows[1].querySelector("slot[name='custom']");
        expect(outlet).to.exist;
    });

    it("collects values from generated and slotted controls", async () => {
        const el = await fixture(html`
            <y-form>
                <y-input slot="custom" name="nickname" value="Momo"></y-input>
            </y-form>
        `);
        el.fields = [
            { type: "input", name: "username", value: "jeff" },
            { slot: "custom" },
            { type: "checkbox", name: "subscribe", value: true },
        ];

        expect(el.values).to.deep.equal({
            username: "jeff",
            nickname: "Momo",
            subscribe: true,
        });
    });

    it("merges the values setter by name and ignores unknown keys", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = BASIC_FIELDS;

        el.values = { username: "momo", subscribe: true, unknown: "x" };

        expect(el.values.username).to.equal("momo");
        expect(el.values.subscribe).to.be.true;
        expect(el.values).to.not.have.property("unknown");
    });

    it("dispatches y-submit with values and formData when valid", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];

        setTimeout(() => el.submit());
        const ev = await oneEvent(el, "y-submit");

        expect(ev.detail.values).to.deep.equal({ username: "jeff" });
        expect(ev.detail.formData).to.be.instanceOf(FormData);
        expect(ev.detail.formData.get("username")).to.equal("jeff");
    });

    it("dispatches y-invalid instead of y-submit when a required field is empty", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "username", label: "Username", required: true },
        ];

        let submitted = false;
        el.addEventListener("y-submit", () => (submitted = true));

        setTimeout(() => el.submit());
        const ev = await oneEvent(el, "y-invalid");

        expect(submitted).to.be.false;
        expect(ev.detail.invalid).to.deep.equal([
            { name: "username", message: "Username is required" },
        ]);
    });

    it("shows an error message and marks the control invalid on failed submit", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "username", label: "Username", required: true },
        ];

        el.submit();

        const error = el.shadowRoot.querySelector(".field-error");
        const control = el.shadowRoot.querySelector("y-input");
        expect(error.hidden).to.be.false;
        expect(error.textContent).to.equal("Username is required");
        expect(control.getAttribute("aria-invalid")).to.equal("true");
        expect(control.getAttribute("aria-describedby")).to.equal(error.id);
    });

    it("clears the error once the field becomes valid again", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "username", label: "Username", required: true },
        ];

        el.submit();
        expect(el.shadowRoot.querySelector(".field-error").hidden).to.be.false;

        const control = el.shadowRoot.querySelector("y-input");
        control.value = "jeff";
        control.dispatchEvent(
            new CustomEvent("input", { bubbles: true, composed: true }),
        );

        expect(el.shadowRoot.querySelector(".field-error").hidden).to.be.true;
        expect(control.hasAttribute("aria-invalid")).to.be.false;
    });

    it("skips validation when novalidate is set", async () => {
        const el = await fixture(html`<y-form novalidate></y-form>`);
        el.fields = [{ type: "input", name: "username", required: true }];

        setTimeout(() => el.submit());
        const ev = await oneEvent(el, "y-submit");
        expect(ev.detail.values.username).to.equal("");
    });

    it("dispatches y-change when a field value changes", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = BASIC_FIELDS;

        const control = el.shadowRoot.querySelector("y-input[name='username']");
        setTimeout(() => {
            control.value = "momo";
            control.dispatchEvent(
                new CustomEvent("input", { bubbles: true, composed: true }),
            );
        });
        const ev = await oneEvent(el, "y-change");

        expect(ev.detail.name).to.equal("username");
        expect(ev.detail.value).to.equal("momo");
        expect(ev.detail.values.username).to.equal("momo");
    });

    it("does not dispatch y-change when the value is unchanged", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];

        let changes = 0;
        el.addEventListener("y-change", () => changes++);

        const control = el.shadowRoot.querySelector("y-input");
        control.dispatchEvent(
            new CustomEvent("input", { bubbles: true, composed: true }),
        );
        expect(changes).to.equal(0);
    });

    it("dispatches y-change for slotted controls in field outlets", async () => {
        const el = await fixture(html`
            <y-form>
                <y-input slot="custom" name="nickname"></y-input>
            </y-form>
        `);
        el.fields = [{ slot: "custom" }];

        const slotted = el.querySelector("y-input");
        setTimeout(() => {
            slotted.value = "Momo";
            slotted.dispatchEvent(
                new CustomEvent("input", { bubbles: true, composed: true }),
            );
        });
        const ev = await oneEvent(el, "y-change");

        expect(ev.detail.name).to.equal("nickname");
        expect(ev.detail.value).to.equal("Momo");
    });

    it("attributes events originating inside a slotted control's shadow root", async () => {
        const el = await fixture(html`
            <y-form>
                <y-input slot="custom" name="nickname"></y-input>
            </y-form>
        `);
        el.fields = [{ slot: "custom" }];

        const slotted = el.querySelector("y-input");
        const inner = slotted.shadowRoot.querySelector("input");
        setTimeout(() => {
            inner.value = "Momo";
            inner.dispatchEvent(
                new Event("input", { bubbles: true, composed: true }),
            );
        });
        const ev = await oneEvent(el, "y-change");

        expect(ev.detail.name).to.equal("nickname");
        expect(ev.detail.value).to.equal("Momo");
    });

    it("picks up slotted controls that arrive after render via slotchange", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ slot: "custom" }];

        const late = document.createElement("y-input");
        late.setAttribute("slot", "custom");
        late.setAttribute("name", "late");
        late.value = "here";
        el.appendChild(late);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        setTimeout(() => {
            late.value = "updated";
            late.dispatchEvent(
                new CustomEvent("input", { bubbles: true, composed: true }),
            );
        });
        const ev = await oneEvent(el, "y-change");

        expect(ev.detail.name).to.equal("late");
        expect(ev.detail.value).to.equal("updated");
        expect(el.values.late).to.equal("updated");
    });

    it("resets fields to their descriptor values and dispatches y-reset", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "username", value: "jeff" },
            { type: "checkbox", name: "subscribe" },
        ];
        el.values = { username: "changed", subscribe: true };

        setTimeout(() => el.reset());
        await oneEvent(el, "y-reset");

        expect(el.values).to.deep.equal({ username: "jeff", subscribe: false });
    });

    it("cancels the reset when y-reset is prevented", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];
        el.values = { username: "changed" };

        el.addEventListener("y-reset", (e) => e.preventDefault());
        el.reset();

        expect(el.values.username).to.equal("changed");
    });

    it("routes native form resets through the cancelable y-reset flow", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];
        el.values = { username: "changed" };

        let resets = 0;
        el.addEventListener("y-reset", (e) => {
            resets++;
            if (resets === 1) e.preventDefault();
        });

        const form = el.shadowRoot.querySelector("form");
        form.reset();
        expect(resets).to.equal(1);
        expect(el.values.username, "canceled y-reset must not clear").to.equal(
            "changed",
        );

        form.reset();
        expect(resets).to.equal(2);
        expect(el.values.username).to.equal("jeff");
    });

    it("resets via the reset button", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];
        el.values = { username: "changed" };

        el.shadowRoot.querySelector('[part="reset-button"]').click();
        expect(el.values.username).to.equal("jeff");
    });

    it("does not reset via the reset button when y-reset is prevented", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "username", value: "jeff" },
            { type: "checkbox", name: "subscribe" },
        ];
        el.values = { username: "changed", subscribe: true };

        let fired = 0;
        el.addEventListener("y-reset", (e) => {
            fired++;
            e.preventDefault();
        });

        el.shadowRoot.querySelector('[part="reset-button"]').click();

        expect(fired).to.equal(1);
        expect(el.values).to.deep.equal({
            username: "changed",
            subscribe: true,
        });
    });

    it("excludes disabled fields from values and the payload", async () => {
        const el = await fixture(html`<y-form novalidate></y-form>`);
        el.fields = [
            { type: "input", name: "username", value: "jeff" },
            { type: "input", name: "secret", value: "hidden", disabled: true },
        ];

        expect(el.values).to.deep.equal({ username: "jeff" });

        setTimeout(() => el.submit());
        const ev = await oneEvent(el, "y-submit");
        expect(ev.detail.formData.has("secret")).to.be.false;
    });

    it("disables all controls and buttons when disabled", async () => {
        const el = await fixture(html`<y-form disabled></y-form>`);
        el.fields = BASIC_FIELDS;

        const controls = el.shadowRoot.querySelectorAll(
            ".fields y-input, .fields y-checkbox",
        );
        controls.forEach((c) => expect(c.hasAttribute("disabled")).to.be.true);
        expect(
            el.shadowRoot
                .querySelector('[part="submit-button"]')
                .hasAttribute("disabled"),
        ).to.be.true;
    });

    it("blocks submission and sets aria-busy while loading", async () => {
        const el = await fixture(html`<y-form loading novalidate></y-form>`);
        el.fields = [{ type: "input", name: "username" }];

        let submitted = false;
        el.addEventListener("y-submit", () => (submitted = true));
        el.submit();

        expect(submitted).to.be.false;
        expect(
            el.shadowRoot.querySelector("form").getAttribute("aria-busy"),
        ).to.equal("true");
        expect(
            el.shadowRoot.querySelector("y-progress").getAttribute("mode"),
        ).to.equal("ring");
        expect(
            el.shadowRoot
                .querySelector('[part="submit-button"]')
                .hasAttribute("disabled"),
        ).to.be.true;
    });

    it("shows skeleton placeholders instead of controls and labels with loading-mode='skeleton'", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "username", label: "Username", value: "jeff" },
            { type: "switch", name: "newsletter" },
        ];

        el.setAttribute("loading-mode", "skeleton");
        el.setAttribute("loading", "");

        expect(
            el.shadowRoot.querySelectorAll("y-skeleton.field-skeleton").length,
        ).to.equal(2);
        expect(
            el.shadowRoot.querySelectorAll("y-skeleton.label-skeleton").length,
        ).to.equal(1);
        expect(el.shadowRoot.querySelector(".field-label")).to.not.exist;
        expect(el.shadowRoot.querySelector("y-progress")).to.not.exist;

        const control = el.shadowRoot.querySelector("y-input");
        expect(getComputedStyle(control).display).to.equal("none");

        el.removeAttribute("loading");
        expect(el.shadowRoot.querySelector("y-skeleton")).to.not.exist;
        expect(el.shadowRoot.querySelector(".field-label")).to.exist;
        expect(el.values.username).to.equal("jeff");
    });

    it("left-aligns inline controls instead of stretching them", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "switch", name: "newsletter", label: "Newsletter" },
            { type: "checkbox", name: "terms", label: "Terms" },
        ];

        const switchEl = el.shadowRoot.querySelector("y-switch");
        const checkboxEl = el.shadowRoot.querySelector("y-checkbox");
        expect(getComputedStyle(switchEl).alignSelf).to.equal("flex-start");
        expect(getComputedStyle(checkboxEl).alignSelf).to.equal("flex-start");
    });

    it("preserves typed values when an unrelated attribute re-renders the form", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];
        el.values = { username: "typed" };

        el.setAttribute("loading", "");
        expect(el.values.username).to.equal("typed");
    });

    it("hides the reset button with no-reset and applies custom button labels", async () => {
        const el = await fixture(html`
            <y-form no-reset submit-text="Save"></y-form>
        `);
        expect(el.shadowRoot.querySelector('[part="reset-button"]')).to.not
            .exist;
        expect(
            el.shadowRoot
                .querySelector('[part="submit-button"]')
                .textContent.trim(),
        ).to.equal("Save");
    });

    it("propagates size to generated controls and buttons", async () => {
        const el = await fixture(html`<y-form size="large"></y-form>`);
        el.fields = [{ type: "input", name: "username" }];

        expect(
            el.shadowRoot.querySelector("y-input").getAttribute("size"),
        ).to.equal("large");
        expect(
            el.shadowRoot
                .querySelector('[part="submit-button"]')
                .getAttribute("size"),
        ).to.equal("large");
    });

    it("renders labels, required markers, and help text", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            {
                type: "input",
                name: "username",
                label: "Username",
                required: true,
                help: "Pick something memorable",
            },
        ];

        const label = el.shadowRoot.querySelector(".field-label");
        expect(label.textContent).to.contain("Username");
        expect(label.querySelector(".required-mark")).to.exist;
        expect(
            el.shadowRoot.querySelector(".field-help").textContent,
        ).to.equal("Pick something memorable");
    });

    it("always renders the header, actions, and footer slots", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        for (const name of ["header", "actions", "footer"]) {
            expect(el.shadowRoot.querySelector(`slot[name="${name}"]`), name)
                .to.exist;
        }
    });

    it("passes options through to select and radio controls", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        const options = [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
        ];
        el.fields = [
            { type: "select", name: "pick", options },
            { type: "radio", name: "choice", options },
        ];

        expect(el.shadowRoot.querySelector("y-select").options).to.deep.equal(
            options,
        );
        expect(el.shadowRoot.querySelector("y-radio").options).to.deep.equal(
            options,
        );
    });

    it("submits when Enter is pressed in a single-line input", async () => {
        const el = await fixture(html`<y-form novalidate></y-form>`);
        el.fields = [{ type: "input", name: "username", value: "jeff" }];

        const inner = el.shadowRoot
            .querySelector("y-input")
            .shadowRoot.querySelector("input");
        setTimeout(() =>
            inner.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "Enter",
                    bubbles: true,
                    composed: true,
                }),
            ),
        );
        const ev = await oneEvent(el, "y-submit");
        expect(ev.detail.values.username).to.equal("jeff");
    });

    it("focuses the first invalid control on failed submit", async () => {
        const el = await fixture(html`<y-form></y-form>`);
        el.fields = [
            { type: "input", name: "a", label: "A", required: true },
            { type: "input", name: "b", label: "B" },
        ];

        el.submit();

        const inner = el.shadowRoot
            .querySelector("y-input[name='a']")
            .shadowRoot.querySelector("input");
        expect(el.shadowRoot.activeElement?.shadowRoot?.activeElement).to.equal(
            inner,
        );
    });
});
