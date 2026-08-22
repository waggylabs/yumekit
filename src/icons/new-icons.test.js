import { fixture, html, expect } from "@open-wc/testing";
import "./all.js";
import { getIcon } from "./registry.js";
import "../components/y-icon/y-icon.js";

describe("1.0 icon additions", () => {
    const names = [
        "currency",
        "wallet",
        "file",
        "file-plus",
        "file-text",
        "crop",
        "flip-horizontal",
        "flip-vertical",
    ];

    for (const name of names) {
        it(`registers ${name} in both weights`, async () => {
            expect(getIcon(name)).to.be.a("string");
            expect(getIcon(`${name}-fill`)).to.be.a("string");
        });

        it(`${name} renders through y-icon`, async () => {
            const el = await fixture(html`<y-icon name="${name}"></y-icon>`);
            expect(el.shadowRoot.querySelectorAll("svg").length).to.equal(1);
        });

        it(`${name} inherits currentColor in the line weight`, async () => {
            expect(getIcon(name)).to.contain('stroke="currentColor"');
        });

        it(`${name} uses the shared 24x24 viewBox`, async () => {
            expect(getIcon(name)).to.contain('viewBox="0 0 24 24"');
            expect(getIcon(`${name}-fill`)).to.contain('viewBox="0 0 24 24"');
        });
    }

    it("file is distinct from folder", async () => {
        expect(getIcon("file")).to.not.equal(getIcon("folder"));
    });

    // These icons are the first bundled ones to lean on <polyline>, <rect> and
    // <circle> together, so confirm the sanitizer keeps every shape rather than
    // quietly rendering an empty <svg>.
    it("keeps the file outline and its folded corner", async () => {
        const el = await fixture(html`<y-icon name="file"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg.querySelectorAll("path").length).to.equal(1);
        expect(svg.querySelectorAll("polyline").length).to.equal(1);
    });

    it("keeps the wallet front panel, back panel and clasp", async () => {
        const el = await fixture(html`<y-icon name="wallet"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg.querySelectorAll("circle").length).to.equal(1);
        expect(svg.querySelectorAll("path").length).to.equal(2);
    });

    it("wallet panels share a flush left edge to read as a fold", async () => {
        const art = getIcon("wallet");
        // Back panel and front panel both start their outline at x=3.
        expect(art).to.contain('d="M3 8V7');
        expect(art).to.contain('d="M3 8h16');
        // The front's upper-left corner is square, so no arc follows that move.
        expect(art).to.not.contain('d="M3 8h16a2 2 0 0 0');
    });

    it("keeps every mark on the currency note", async () => {
        const el = await fixture(html`<y-icon name="currency"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg.querySelectorAll("rect").length).to.equal(1);
        expect(svg.querySelectorAll("circle").length).to.equal(1);
        expect(svg.querySelectorAll("path").length).to.equal(2);
    });

    it("keeps the dashed mirror axis on both flip icons", async () => {
        for (const name of ["flip-horizontal", "flip-vertical"]) {
            const el = await fixture(html`<y-icon name="${name}"></y-icon>`);
            const svg = el.shadowRoot.querySelector("svg");
            // Two brackets plus four axis dashes.
            expect(svg.querySelectorAll("path").length).to.equal(6);
        }
    });

    it("flip-horizontal and flip-vertical are transposes, not duplicates", async () => {
        expect(getIcon("flip-horizontal")).to.not.equal(
            getIcon("flip-vertical"),
        );
        expect(getIcon("flip-horizontal")).to.contain("M12 2v2");
        expect(getIcon("flip-vertical")).to.contain("M2 12h2");
    });

    it("file-plus and file-text keep the file outline plus their own marks", async () => {
        const plus = await fixture(html`<y-icon name="file-plus"></y-icon>`);
        expect(plus.shadowRoot.querySelectorAll("svg polyline").length).to.equal(1);
        // Outline plus the two strokes of the cross.
        expect(plus.shadowRoot.querySelectorAll("svg path").length).to.equal(3);

        const text = await fixture(html`<y-icon name="file-text"></y-icon>`);
        expect(text.shadowRoot.querySelectorAll("svg polyline").length).to.equal(1);
        // Outline plus three text rules.
        expect(text.shadowRoot.querySelectorAll("svg path").length).to.equal(4);
    });

    it("filled currency carries the centre disc and both edge marks as holes", async () => {
        const el = await fixture(
            html`<y-icon name="currency" weight="filled"></y-icon>`,
        );
        const path = el.shadowRoot.querySelector("svg path");
        expect(path.getAttribute("fill-rule")).to.equal("evenodd");
        // Note outline, disc, and the two vertical edge marks.
        expect(path.getAttribute("d").match(/[Mm]/g).length).to.equal(4);
    });

    // The filled wallet is one stepped silhouette rather than stacked panels —
    // the fold reads from the step on the right and a seam cut through the fill.
    it("filled wallet carries its seam and clasp as holes", async () => {
        const el = await fixture(
            html`<y-icon name="wallet" weight="filled"></y-icon>`,
        );
        const paths = el.shadowRoot.querySelectorAll("svg path");
        expect(paths.length).to.equal(1);
        expect(paths[0].getAttribute("fill-rule")).to.equal("evenodd");
        // Silhouette, seam slot, clasp.
        expect(paths[0].getAttribute("d").match(/[Mm]/g).length).to.equal(3);
    });
});

describe("undo / redo rename", () => {
    it("registers rotate-left and rotate-right in both weights", async () => {
        for (const name of ["rotate-left", "rotate-right"]) {
            expect(getIcon(name)).to.be.a("string");
            expect(getIcon(`${name}-fill`)).to.be.a("string");
        }
    });

    it("keeps undo and redo registered with new artwork", async () => {
        expect(getIcon("undo")).to.be.a("string");
        expect(getIcon("redo")).to.be.a("string");
        expect(getIcon("undo")).to.not.equal(getIcon("rotate-left"));
        expect(getIcon("redo")).to.not.equal(getIcon("rotate-right"));
    });

    it("rotate-left and rotate-right carry the old circular-arrow art", async () => {
        // The 9-radius sweep is what made these read as rotation controls.
        expect(getIcon("rotate-left")).to.contain("a9 9 0 1 0");
        expect(getIcon("rotate-right")).to.contain("a9 9 0 1 1");
    });

    it("undo and redo are mirror images of each other", async () => {
        const undo = getIcon("undo");
        const redo = getIcon("redo");
        expect(undo).to.contain("a5 5 0 0 1");
        expect(redo).to.contain("a5 5 0 0 0");
        expect(undo).to.not.equal(redo);
    });

    it("y-editor's toolbar icon names still resolve", async () => {
        for (const name of ["undo", "redo"]) {
            const el = await fixture(html`<y-icon name="${name}"></y-icon>`);
            expect(el.shadowRoot.querySelectorAll("svg").length).to.equal(1);
        }
    });
});

describe("payment, category and retry icons", () => {
    const names = ["bank", "utensils", "cart-shopping", "car", "refresh"];

    for (const name of names) {
        it(`registers ${name} in both weights`, async () => {
            expect(getIcon(name)).to.be.a("string");
            expect(getIcon(`${name}-fill`)).to.be.a("string");
        });

        it(`${name} renders through y-icon`, async () => {
            const el = await fixture(html`<y-icon name="${name}"></y-icon>`);
            expect(el.shadowRoot.querySelectorAll("svg").length).to.equal(1);
        });

        it(`${name} inherits currentColor in the line weight`, async () => {
            expect(getIcon(name)).to.contain('stroke="currentColor"');
        });

        it(`${name} uses the shared 24x24 viewBox`, async () => {
            expect(getIcon(name)).to.contain('viewBox="0 0 24 24"');
            expect(getIcon(`${name}-fill`)).to.contain('viewBox="0 0 24 24"');
        });
    }

    // The whole point of `refresh` is to be a retry glyph that nobody reaches
    // for `rotate-right` to draw, so the two must not converge.
    it("refresh is a two-arrow cycle, distinct from the rotation glyphs", async () => {
        const refresh = getIcon("refresh");
        expect(refresh).to.not.equal(getIcon("rotate-right"));
        expect(refresh).to.not.equal(getIcon("rotate-left"));
        // Both halves of the cycle, each with its own arrowhead.
        expect(refresh.match(/a9 9 0 0 1/g).length).to.equal(2);
        expect(
            (await fixture(html`<y-icon name="refresh"></y-icon>`)).shadowRoot
                .querySelectorAll("svg polyline").length,
        ).to.equal(2);
    });

    it("bank draws an institution, not another coin", async () => {
        const el = await fixture(html`<y-icon name="bank"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        // Pediment, three columns, plinth and ground line.
        expect(svg.querySelectorAll("path").length).to.equal(1);
        expect(svg.querySelectorAll("line").length).to.equal(5);
        expect(getIcon("bank")).to.not.equal(getIcon("currency"));
    });

    it("keeps the cart basket and both wheels", async () => {
        const el = await fixture(html`<y-icon name="cart-shopping"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg.querySelectorAll("circle").length).to.equal(2);
        expect(svg.querySelectorAll("path").length).to.equal(1);
    });

    it("keeps the car body, both wheels and the axle between them", async () => {
        const el = await fixture(html`<y-icon name="car"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg.querySelectorAll("circle").length).to.equal(2);
        expect(svg.querySelectorAll("line").length).to.equal(1);
    });

    it("utensils carries a fork and a knife rather than one of each half", async () => {
        const el = await fixture(html`<y-icon name="utensils"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        // Fork head and knife blade.
        expect(svg.querySelectorAll("path").length).to.equal(2);
        // Middle tine, fork handle, knife handle.
        expect(svg.querySelectorAll("line").length).to.equal(3);
    });

    it("filled car carries a hub cut out of each wheel", async () => {
        const el = await fixture(
            html`<y-icon name="car" weight="filled"></y-icon>`,
        );
        const [body, wheels] = el.shadowRoot.querySelectorAll("svg path");

        // The silhouette is solid; only the wheels carry holes.
        expect(body.getAttribute("fill-rule")).to.equal(null);
        expect(wheels.getAttribute("fill-rule")).to.equal("evenodd");
        // Two wheels, each with its hub.
        expect(wheels.getAttribute("d").match(/[Mm]/g).length).to.equal(4);
    });
});

describe("bell-slash", () => {
    it("registers bell-slash in both weights", async () => {
        expect(getIcon("bell-slash")).to.be.a("string");
        expect(getIcon("bell-slash-fill")).to.be.a("string");
    });

    it("renders through y-icon in the shared 24x24 viewBox", async () => {
        const el = await fixture(html`<y-icon name="bell-slash"></y-icon>`);
        expect(el.shadowRoot.querySelectorAll("svg").length).to.equal(1);
        expect(getIcon("bell-slash")).to.contain('viewBox="0 0 24 24"');
        expect(getIcon("bell-slash-fill")).to.contain('viewBox="0 0 24 24"');
    });

    it("inherits currentColor in the line weight", async () => {
        expect(getIcon("bell-slash")).to.contain('stroke="currentColor"');
    });

    // The silenced state has to read as the same bell, muted — not as a second
    // bell drawing. Anything else and the two states stop being comparable at a
    // glance, which is the only thing this icon is for.
    it("keeps the bell body and dinger from the ringing glyph", async () => {
        const el = await fixture(html`<y-icon name="bell-slash"></y-icon>`);
        const svg = el.shadowRoot.querySelector("svg");
        expect(svg.querySelectorAll("path").length).to.equal(2);
        expect(getIcon("bell-slash")).to.contain('d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"');
    });

    it("adds a slash the ringing bell does not carry", async () => {
        const el = await fixture(html`<y-icon name="bell-slash"></y-icon>`);
        expect(el.shadowRoot.querySelectorAll("svg line").length).to.equal(1);
        expect(getIcon("bell-slash")).to.not.equal(getIcon("bell"));
        expect(getIcon("bell")).to.not.contain("<line");
    });

    // circle-slash is the near-miss to stay away from: on its own it says
    // forbidden, not silenced, so the slash has to sit on the bell itself.
    it("is not a restatement of circle-slash", async () => {
        expect(getIcon("bell-slash")).to.not.equal(getIcon("circle-slash"));
        expect(getIcon("bell-slash")).to.not.contain("<circle");
    });

    it("filled weight cuts the slash through the silhouette as one shape", async () => {
        const el = await fixture(
            html`<y-icon name="bell-slash" weight="filled"></y-icon>`,
        );
        const paths = el.shadowRoot.querySelectorAll("svg path");
        expect(paths.length).to.equal(1);
        expect(paths[0].getAttribute("fill-rule")).to.equal("evenodd");
        // Bell body, dinger, and the slash band knocked through both.
        expect(paths[0].getAttribute("d").match(/[Mm]/g).length).to.equal(3);
    });
});
