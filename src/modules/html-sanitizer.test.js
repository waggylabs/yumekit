import { expect } from "@open-wc/testing";
import {
    DEFAULT_ALLOWED_TAGS,
    isSafeUrl,
    sanitizeHtml,
    sanitizeHtmlToFragment,
    tagsForBlocks,
} from "./html-sanitizer.js";

describe("html-sanitizer", () => {
    describe("isSafeUrl", () => {
        it("accepts the allowed schemes", () => {
            expect(isSafeUrl("http://example.com")).to.be.true;
            expect(isSafeUrl("https://example.com/a?b=1#c")).to.be.true;
            expect(isSafeUrl("mailto:someone@example.com")).to.be.true;
            expect(isSafeUrl("HTTPS://EXAMPLE.COM")).to.be.true;
        });

        it("accepts scheme-less URLs", () => {
            expect(isSafeUrl("/images/a.png")).to.be.true;
            expect(isSafeUrl("a.png")).to.be.true;
            expect(isSafeUrl("#anchor")).to.be.true;
            expect(isSafeUrl("?q=1")).to.be.true;
            expect(isSafeUrl("//cdn.example.com/a.png")).to.be.true;
        });

        it("rejects javascript: and other unlisted schemes", () => {
            expect(isSafeUrl("javascript:alert(1)")).to.be.false;
            expect(isSafeUrl("JaVaScRiPt:alert(1)")).to.be.false;
            expect(isSafeUrl("vbscript:msgbox(1)")).to.be.false;
            expect(isSafeUrl("file:///etc/passwd")).to.be.false;
            expect(isSafeUrl("ftp://example.com")).to.be.false;
        });

        it("rejects javascript: obfuscated with control characters", () => {
            expect(isSafeUrl("java\tscript:alert(1)")).to.be.false;
            expect(isSafeUrl("java\nscript:alert(1)")).to.be.false;
            expect(isSafeUrl("java\rscript:alert(1)")).to.be.false;
            expect(isSafeUrl("java\u0000script:alert(1)")).to.be.false;
            expect(isSafeUrl("  javascript:alert(1)")).to.be.false;
            expect(isSafeUrl("\u0001javascript:alert(1)")).to.be.false;
        });

        it("rejects data: URLs unless data images are allowed", () => {
            expect(isSafeUrl("data:image/png;base64,AAAA")).to.be.false;
            expect(
                isSafeUrl("data:image/png;base64,AAAA", {
                    allowDataImage: true,
                }),
            ).to.be.true;
        });

        it("allows only raster data: images", () => {
            const opts = { allowDataImage: true };
            expect(isSafeUrl("data:image/jpeg;base64,AAAA", opts)).to.be.true;
            expect(isSafeUrl("data:image/gif;base64,AAAA", opts)).to.be.true;
            expect(isSafeUrl("data:image/webp;base64,AAAA", opts)).to.be.true;
            expect(isSafeUrl("data:text/html;base64,AAAA", opts)).to.be.false;
            expect(isSafeUrl("data:image/svg+xml;base64,AAAA", opts)).to.be
                .false;
            expect(isSafeUrl("data:application/javascript,alert(1)", opts)).to
                .be.false;
        });

        it("rejects empty values", () => {
            expect(isSafeUrl("")).to.be.false;
            expect(isSafeUrl("   ")).to.be.false;
            expect(isSafeUrl(null)).to.be.false;
            expect(isSafeUrl(undefined)).to.be.false;
        });
    });

    describe("tagsForBlocks", () => {
        it("always includes p and inline formatting", () => {
            const tags = tagsForBlocks([]);
            expect(tags).to.include.members([
                "p",
                "strong",
                "em",
                "u",
                "s",
                "code",
                "a",
                "img",
                "br",
            ]);
        });

        it("maps the code block to pre", () => {
            expect(tagsForBlocks(["code"])).to.include("pre");
        });

        it("pulls in li for list blocks", () => {
            expect(tagsForBlocks(["ul"])).to.include.members(["ul", "li"]);
            expect(tagsForBlocks(["ol"])).to.include.members(["ol", "li"]);
        });

        it("omits blocks that were not requested", () => {
            const tags = tagsForBlocks(["h1"]);
            expect(tags).to.include("h1");
            expect(tags).to.not.include("h2");
            expect(tags).to.not.include("blockquote");
        });
    });

    describe("sanitizeHtml", () => {
        it("keeps allowed markup intact", () => {
            const out = sanitizeHtml(
                "<p>Hello <strong>bold</strong> and <em>italic</em></p>",
            );
            expect(out).to.equal(
                "<p>Hello <strong>bold</strong> and <em>italic</em></p>",
            );
        });

        it("returns an empty string for empty or non-string input", () => {
            expect(sanitizeHtml("")).to.equal("");
            expect(sanitizeHtml(null)).to.equal("");
            expect(sanitizeHtml(undefined)).to.equal("");
            expect(sanitizeHtml(42)).to.equal("");
        });

        it("strips script tags and their contents", () => {
            const out = sanitizeHtml(
                "<p>a</p><script>alert(1)</script><p>b</p>",
            );
            expect(out).to.equal("<p>a</p><p>b</p>");
            expect(out).to.not.contain("alert");
        });

        it("strips style and iframe tags and their contents", () => {
            expect(
                sanitizeHtml("<style>body{display:none}</style><p>a</p>"),
            ).to.equal("<p>a</p>");
            expect(
                sanitizeHtml(
                    '<iframe src="https://evil.com"></iframe><p>a</p>',
                ),
            ).to.equal("<p>a</p>");
        });

        it("strips svg and math wrappers with their contents", () => {
            expect(
                sanitizeHtml("<svg><script>alert(1)</script></svg><p>a</p>"),
            ).to.equal("<p>a</p>");
            expect(
                sanitizeHtml("<math><mtext></mtext></math><p>a</p>"),
            ).to.equal("<p>a</p>");
        });

        it("strips every on* handler", () => {
            const out = sanitizeHtml(
                '<p onclick="alert(1)" onmouseover="alert(2)" ONERROR="alert(3)">a</p>',
            );
            expect(out).to.equal("<p>a</p>");
        });

        it("strips img onerror payloads but keeps a safe image", () => {
            const out = sanitizeHtml(
                '<img src="https://example.com/a.png" onerror="alert(1)" alt="x">',
            );
            expect(out).to.contain('src="https://example.com/a.png"');
            expect(out).to.contain('alt="x"');
            expect(out).to.not.contain("onerror");
        });

        it("drops images whose src is unsafe", () => {
            expect(sanitizeHtml('<img src="javascript:alert(1)">')).to.equal(
                "",
            );
            expect(
                sanitizeHtml(
                    '<img src="data:text/html,<script>alert(1)</script>">',
                ),
            ).to.equal("");
            expect(
                sanitizeHtml(
                    '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
                ),
            ).to.equal("");
        });

        it("keeps data: raster images", () => {
            const out = sanitizeHtml(
                '<img src="data:image/png;base64,iVBORw0KGgo=">',
            );
            expect(out).to.contain("data:image/png;base64,iVBORw0KGgo=");
        });

        it("unwraps links with an unsafe href, keeping their text", () => {
            const out = sanitizeHtml(
                '<p><a href="javascript:alert(1)">click me</a></p>',
            );
            expect(out).to.equal("<p>click me</p>");
        });

        it("keeps links with a safe href", () => {
            const out = sanitizeHtml(
                '<p><a href="https://example.com" title="t">go</a></p>',
            );
            expect(out).to.equal(
                '<p><a href="https://example.com" title="t">go</a></p>',
            );
        });

        it("strips target and rel from links", () => {
            const out = sanitizeHtml(
                '<a href="https://example.com" target="_blank" rel="x">go</a>',
            );
            expect(out).to.equal('<a href="https://example.com">go</a>');
        });

        it("strips style and class attributes", () => {
            const out = sanitizeHtml(
                '<p style="position:fixed" class="evil">a</p>',
            );
            expect(out).to.equal("<p>a</p>");
        });

        it("unwraps disallowed tags but keeps their text", () => {
            expect(sanitizeHtml("<p><div>a</div></p>")).to.contain("a");
            expect(sanitizeHtml("<font color=red><p>a</p></font>")).to.equal(
                "<p>a</p>",
            );
        });

        it("removes comments", () => {
            expect(sanitizeHtml("<p>a</p><!-- secret -->")).to.equal(
                "<p>a</p>",
            );
        });

        it("honours a narrowed tag allowlist", () => {
            const out = sanitizeHtml(
                "<h1>title</h1><blockquote>q</blockquote>",
                {
                    allowedTags: tagsForBlocks(["p"]),
                },
            );
            expect(out).to.not.contain("<h1>");
            expect(out).to.not.contain("<blockquote>");
            expect(out).to.contain("title");
            expect(out).to.contain("q");
        });

        it("drops non-numeric img dimensions", () => {
            const out = sanitizeHtml(
                '<img src="https://example.com/a.png" width="10" height="expression(alert(1))">',
            );
            expect(out).to.contain('width="10"');
            expect(out).to.not.contain("height");
        });

        it("does not execute scripts while parsing", () => {
            window.__sanitizerPwned = false;
            sanitizeHtml(
                '<img src=x onerror="window.__sanitizerPwned = true">',
            );
            sanitizeHtml("<script>window.__sanitizerPwned = true</script>");
            expect(window.__sanitizerPwned).to.be.false;
            delete window.__sanitizerPwned;
        });

        it("is stable when re-sanitized", () => {
            const once = sanitizeHtml(
                '<p><a href="javascript:alert(1)">x</a><script>alert(1)</script><b>y</b></p>',
            );
            expect(sanitizeHtml(once)).to.equal(once);
        });

        it("survives pathologically nested input", () => {
            const deep = "<div>".repeat(500) + "hi" + "</div>".repeat(500);
            expect(() => sanitizeHtml(deep)).to.not.throw();
        });
    });

    describe("sanitizeHtmlToFragment", () => {
        it("returns a fragment owned by the current document", () => {
            const frag = sanitizeHtmlToFragment("<p>a</p>");
            expect(frag).to.be.instanceOf(DocumentFragment);
            expect(frag.firstChild.ownerDocument).to.equal(document);
        });

        it("returns an empty fragment for empty input", () => {
            expect(sanitizeHtmlToFragment("").childNodes.length).to.equal(0);
            expect(sanitizeHtmlToFragment(null).childNodes.length).to.equal(0);
        });

        it("applies the same allowlist as sanitizeHtml", () => {
            const frag = sanitizeHtmlToFragment(
                "<p>a</p><script>alert(1)</script>",
            );
            expect(frag.childNodes.length).to.equal(1);
            expect(frag.firstChild.tagName).to.equal("P");
        });

        it("defaults to DEFAULT_ALLOWED_TAGS", () => {
            expect(DEFAULT_ALLOWED_TAGS).to.include.members([
                "p",
                "h1",
                "ul",
                "li",
                "pre",
            ]);
        });
    });

    describe("mention chips", () => {
        const chip = (inner, attrs = 'data-mention-value="ada"') =>
            sanitizeHtml(`<p><span ${attrs}>${inner}</span></p>`, {
                allowMentions: true,
            });

        it("keeps a chip and its identifying data attributes", () => {
            const out = chip("@Ada");
            expect(out).to.contain('data-mention-value="ada"');
            expect(out).to.contain('contenteditable="false"');
            expect(out).to.contain("@Ada");
        });

        it("keeps only the allowlisted attributes", () => {
            const out = chip(
                "@Ada",
                'data-mention-value="ada" data-mention-type="user" data-mention-label="Ada" class="x" style="color:red" onclick="pwn()" part="mention-chip"',
            );
            expect(out).to.contain('data-mention-value="ada"');
            expect(out).to.contain('data-mention-type="user"');
            expect(out).to.contain('data-mention-label="Ada"');
            expect(out).to.not.contain("class=");
            expect(out).to.not.contain("style=");
            expect(out).to.not.contain("onclick");
            expect(out).to.not.contain("part=");
        });

        it("forces contenteditable to false", () => {
            const out = chip(
                "@Ada",
                'data-mention-value="ada" contenteditable="true"',
            );
            expect(out).to.contain('contenteditable="false"');
            expect(out).to.not.contain('contenteditable="true"');
        });

        it("flattens a nested link to its text", () => {
            const out = chip('<a href="http://evil.example">@Ada</a>');
            expect(out).to.not.contain("<a");
            expect(out).to.not.contain("href");
            expect(out).to.contain("@Ada");
        });

        it("flattens nested formatting to its text", () => {
            const out = chip("<strong>@Ada</strong> <em>L</em>");
            expect(out).to.not.contain("<strong");
            expect(out).to.not.contain("<em");
            expect(out).to.contain("@Ada L");
        });

        it("drops a nested image, leaving no embedded content", () => {
            const out = chip('@Ada<img src="http://example.com/a.png">');
            expect(out).to.not.contain("<img");
            expect(out).to.contain("@Ada");
        });

        it("drops a chip left with no text at all", () => {
            // An image-only chip renders as nothing once flattened.
            expect(chip('<img src="http://example.com/a.png">')).to.not.contain(
                "data-mention-value",
            );
        });

        it("does not surface a dropped subtree's text as chip text", () => {
            const out = chip("<script>alert(1)</script>");
            expect(out).to.not.contain("alert");
            expect(out).to.not.contain("data-mention-value");
        });

        it("keeps chip text that sits alongside a dropped subtree", () => {
            const out = chip("@Ada<script>alert(1)</script>");
            expect(out).to.not.contain("alert");
            expect(out).to.contain("@Ada");
        });

        it("flattens a nested chip into the outer one", () => {
            const out = chip(
                '@A<span data-mention-value="b">@B</span>',
            );
            expect(out.match(/data-mention-value/g)).to.have.lengthOf(1);
            expect(out).to.contain("@A@B");
        });

        it("unwraps the chip entirely when mentions are not allowed", () => {
            const out = sanitizeHtml(
                '<p><span data-mention-value="ada">@Ada</span></p>',
            );
            expect(out).to.not.contain("<span");
            expect(out).to.not.contain("data-mention-value");
            expect(out).to.contain("@Ada");
        });

        it("still unwraps a plain span when mentions are allowed", () => {
            const out = sanitizeHtml("<p><span>hi</span></p>", {
                allowMentions: true,
            });
            expect(out).to.equal("<p>hi</p>");
        });

        it("applies the same flattening through the fragment entry point", () => {
            const holder = document.createElement("div");
            holder.appendChild(
                sanitizeHtmlToFragment(
                    '<p><span data-mention-value="ada"><a href="http://evil.example">@Ada</a></span></p>',
                    { allowMentions: true },
                ),
            );
            const el = holder.querySelector("span[data-mention-value]");
            expect(el.querySelectorAll("*").length).to.equal(0);
            expect(el.textContent).to.equal("@Ada");
        });
    });
});
