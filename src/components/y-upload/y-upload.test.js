import { html, fixture, expect, oneEvent } from "@open-wc/testing";
import sinon from "sinon";
import "./y-upload.js";

const file = (name, size = 100, type = "text/plain") => {
    const blob = new Blob(["x".repeat(size)], { type });
    return new File([blob], name, { type, lastModified: 1 });
};

const dropFiles = (el, files) => {
    const dropzone = el.shadowRoot.querySelector(".dropzone");
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    dropzone.dispatchEvent(
        new DragEvent("drop", { dataTransfer: dt, bubbles: true }),
    );
};

const rows = (el) => el.shadowRoot.querySelectorAll(".file-list .file");

describe("<y-upload>", () => {
    const sandbox = sinon.createSandbox();
    afterEach(() => sandbox.restore());

    describe("rendering", () => {
        it("renders a dropzone, hidden input, and default prompt", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            const dropzone = el.shadowRoot.querySelector(".dropzone");
            expect(dropzone).to.exist;
            expect(dropzone.getAttribute("role")).to.equal("button");
            expect(el.shadowRoot.querySelector('input[type="file"]')).to.exist;
            expect(dropzone.textContent).to.contain("Drag files here");
        });

        it("defaults size to medium and variant to dropzone", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            expect(el.size).to.equal("medium");
            expect(el.variant).to.equal("dropzone");
        });

        it("renders the compact button variant", async () => {
            const el = await fixture(
                html`<y-upload variant="button"></y-upload>`,
            );
            expect(
                el.shadowRoot.querySelector(".dropzone--button"),
            ).to.exist;
        });

        it("reflects accept, multiple, and directory onto the native input", async () => {
            const el = await fixture(
                html`<y-upload accept=".png" multiple directory></y-upload>`,
            );
            const input = el.shadowRoot.querySelector("input");
            expect(input.getAttribute("accept")).to.equal(".png");
            expect(input.hasAttribute("multiple")).to.be.true;
            expect(input.hasAttribute("webkitdirectory")).to.be.true;
        });

        it("hides the list when show-list is false", async () => {
            const el = await fixture(
                html`<y-upload show-list="false"></y-upload>`,
            );
            el.files = [file("a.txt")];
            expect(el.shadowRoot.querySelector(".file-list").style.display).to.equal(
                "none",
            );
        });
    });

    describe("adding files", () => {
        it("adds files via the files property and renders rows", async () => {
            const el = await fixture(html`<y-upload multiple></y-upload>`);
            el.files = [file("a.txt"), file("b.txt")];
            expect(el.files.length).to.equal(2);
            expect(rows(el).length).to.equal(2);
        });

        it("emits change with the file list on drop", async () => {
            const el = await fixture(html`<y-upload multiple></y-upload>`);
            setTimeout(() => dropFiles(el, [file("a.txt")]));
            const e = await oneEvent(el, "change");
            expect(e.detail.files.length).to.equal(1);
            expect(e.detail.files[0].name).to.equal("a.txt");
        });

        it("replaces the current file when multiple is absent", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            dropFiles(el, [file("a.txt")]);
            dropFiles(el, [file("b.txt")]);
            expect(el.files.length).to.equal(1);
            expect(el.files[0].name).to.equal("b.txt");
        });

        it("takes only the first file when multiple is absent", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            dropFiles(el, [file("a.txt"), file("b.txt")]);
            expect(el.files.length).to.equal(1);
        });

        it("ignores duplicates silently (name + size + lastModified)", async () => {
            const el = await fixture(html`<y-upload multiple></y-upload>`);
            const rejectSpy = sandbox.spy();
            el.addEventListener("reject", rejectSpy);
            dropFiles(el, [file("a.txt", 100)]);
            dropFiles(el, [file("a.txt", 100)]);
            expect(el.files.length).to.equal(1);
            expect(rejectSpy).to.not.have.been.called;
        });
    });

    describe("validation", () => {
        it("rejects a file failing accept", async () => {
            const el = await fixture(html`<y-upload accept=".png"></y-upload>`);
            setTimeout(() => dropFiles(el, [file("a.txt")]));
            const e = await oneEvent(el, "reject");
            expect(e.detail.rejections[0].reason).to.equal("accept");
            expect(el.files.length).to.equal(0);
        });

        it("accepts a wildcard MIME match", async () => {
            const el = await fixture(
                html`<y-upload accept="image/*"></y-upload>`,
            );
            dropFiles(el, [file("a.png", 10, "image/png")]);
            expect(el.files.length).to.equal(1);
        });

        it("rejects a file over max-size", async () => {
            const el = await fixture(
                html`<y-upload max-size="50"></y-upload>`,
            );
            setTimeout(() => dropFiles(el, [file("big.txt", 100)]));
            const e = await oneEvent(el, "reject");
            expect(e.detail.rejections[0].reason).to.equal("max-size");
        });

        it("rejects files beyond max-files", async () => {
            const el = await fixture(
                html`<y-upload multiple max-files="1"></y-upload>`,
            );
            setTimeout(() => dropFiles(el, [file("a.txt"), file("b.txt")]));
            const e = await oneEvent(el, "reject");
            expect(el.files.length).to.equal(1);
            expect(e.detail.rejections[0].reason).to.equal("max-files");
        });

        it("rejects when max-total-size is exceeded", async () => {
            const el = await fixture(
                html`<y-upload multiple max-total-size="150"></y-upload>`,
            );
            setTimeout(() =>
                dropFiles(el, [file("a.txt", 100), file("b.txt", 100)]),
            );
            const e = await oneEvent(el, "reject");
            expect(el.files.length).to.equal(1);
            expect(e.detail.rejections[0].reason).to.equal("max-total-size");
        });

        it("adds valid files from the same batch that has rejections", async () => {
            const el = await fixture(
                html`<y-upload multiple accept=".txt"></y-upload>`,
            );
            dropFiles(el, [file("a.txt"), file("b.png", 10, "image/png")]);
            expect(el.files.length).to.equal(1);
            expect(el.files[0].name).to.equal("a.txt");
        });
    });

    describe("removal", () => {
        it("removes a file via its remove button and emits change", async () => {
            const el = await fixture(html`<y-upload multiple></y-upload>`);
            el.files = [file("a.txt")];
            const btn = el.shadowRoot.querySelector(".remove-button");
            setTimeout(() => btn.click());
            await oneEvent(el, "change");
            expect(el.files.length).to.equal(0);
        });

        it("keeps the file when the cancelable remove event is prevented", async () => {
            const el = await fixture(html`<y-upload multiple></y-upload>`);
            el.files = [file("a.txt")];
            el.addEventListener("remove", (e) => e.preventDefault());
            el.shadowRoot.querySelector(".remove-button").click();
            expect(el.files.length).to.equal(1);
        });

        it("clear() removes all files", async () => {
            const el = await fixture(html`<y-upload multiple></y-upload>`);
            el.files = [file("a.txt"), file("b.txt")];
            el.clear();
            expect(el.files.length).to.equal(0);
            expect(rows(el).length).to.equal(0);
        });
    });

    describe("status and progress", () => {
        it("setProgress shows the row progress bar", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            el.files = [file("a.txt")];
            const target = el.files[0];
            el.setProgress(target, 42);
            const bar = el.shadowRoot.querySelector(".file-progress");
            expect(bar.style.display).to.not.equal("none");
            expect(bar.getAttribute("value")).to.equal("42");
        });

        it("setStatus error renders the error message", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            el.files = [file("a.txt")];
            el.setStatus(el.files[0], "error", "Upload failed");
            const err = el.shadowRoot.querySelector(".file-error");
            expect(err.style.display).to.not.equal("none");
            expect(err.textContent).to.equal("Upload failed");
        });

        it("ignores unknown status values", async () => {
            const el = await fixture(html`<y-upload></y-upload>`);
            el.files = [file("a.txt")];
            expect(() => el.setStatus(el.files[0], "bogus")).to.not.throw;
            const err = el.shadowRoot.querySelector(".file-error");
            expect(err.style.display).to.equal("none");
        });
    });

    describe("previews", () => {
        it("renders an image thumbnail when previews is on", async () => {
            const createStub = sandbox
                .stub(URL, "createObjectURL")
                .returns("blob:mock");
            sandbox.stub(URL, "revokeObjectURL");
            const el = await fixture(html`<y-upload previews></y-upload>`);
            el.files = [file("a.png", 10, "image/png")];
            const img = el.shadowRoot.querySelector(".file-preview img");
            expect(img).to.exist;
            expect(img.src).to.contain("blob:mock");
            expect(createStub).to.have.been.called;
        });

        it("revokes object URLs on disconnect", async () => {
            sandbox.stub(URL, "createObjectURL").returns("blob:mock");
            const revoke = sandbox.stub(URL, "revokeObjectURL");
            const el = await fixture(html`<y-upload previews></y-upload>`);
            el.files = [file("a.png", 10, "image/png")];
            el.remove();
            expect(revoke).to.have.been.calledWith("blob:mock");
        });
    });

    describe("form association & a11y", () => {
        it("is invalid when required and empty", async () => {
            const el = await fixture(
                html`<y-upload required name="doc"></y-upload>`,
            );
            expect(el.matches(":invalid")).to.be.true;
            el.files = [file("a.txt")];
            expect(el.matches(":invalid")).to.be.false;
        });

        it("submits each file under name via FormData", async () => {
            const form = await fixture(html`
                <form>
                    <y-upload name="docs" multiple></y-upload>
                </form>
            `);
            const el = form.querySelector("y-upload");
            el.files = [file("a.txt"), file("b.txt")];
            const data = new FormData(form);
            expect(data.getAll("docs").length).to.equal(2);
        });

        it("marks the dropzone disabled and removes it from tab order", async () => {
            const el = await fixture(html`<y-upload disabled></y-upload>`);
            const dropzone = el.shadowRoot.querySelector(".dropzone");
            expect(dropzone.getAttribute("aria-disabled")).to.equal("true");
            expect(dropzone.hasAttribute("tabindex")).to.be.false;
        });

        it("does not open the picker when disabled", async () => {
            const el = await fixture(html`<y-upload disabled></y-upload>`);
            const click = sandbox.spy(
                el.shadowRoot.querySelector("input"),
                "click",
            );
            el.browse();
            expect(click).to.not.have.been.called;
        });
    });
});
