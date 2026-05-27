import { expect } from "@open-wc/testing";
import { isSupportedLanguage, tokenize } from "./tokenizer.js";

// Helper: collapse a token stream into `[type, text]` tuples, dropping
// whitespace-only tokens for terser assertions.
function typed(tokens) {
    return tokens
        .filter((t) => t.type !== null)
        .map((t) => [t.type, t.text]);
}

describe("tokenizer", () => {
    describe("isSupportedLanguage", () => {
        it("returns true for known languages and common aliases", () => {
            expect(isSupportedLanguage("javascript")).to.be.true;
            expect(isSupportedLanguage("json")).to.be.true;
            expect(isSupportedLanguage("css")).to.be.true;
            expect(isSupportedLanguage("js")).to.be.true;
            expect(isSupportedLanguage("jsx")).to.be.true;
        });

        it("returns false for unknown languages and falsy input", () => {
            expect(isSupportedLanguage("python")).to.be.false;
            expect(isSupportedLanguage("text")).to.be.false;
            expect(isSupportedLanguage("")).to.be.false;
            expect(isSupportedLanguage(null)).to.be.false;
            expect(isSupportedLanguage(undefined)).to.be.false;
        });
    });

    describe("tokenize() returns null for unsupported languages", () => {
        it("returns null for python / text / unknown", () => {
            expect(tokenize("python", "print(1)")).to.equal(null);
            expect(tokenize("text", "hi")).to.equal(null);
            expect(tokenize("does-not-exist", "x")).to.equal(null);
        });
    });

    // ── JavaScript ─────────────────────────────────────────────────────

    describe("javascript", () => {
        it("classifies keywords", () => {
            const t = typed(tokenize("javascript", "const x = 1;"));
            expect(t).to.deep.include(["keyword", "const"]);
        });

        it("treats class-cased identifiers as class-name", () => {
            const t = typed(tokenize("javascript", "const c = new MyClass();"));
            expect(t).to.deep.include(["class-name", "MyClass"]);
        });

        it("treats `true` / `false` as boolean and `null` as constant", () => {
            const t = typed(tokenize("javascript", "let a = true; let b = null;"));
            expect(t).to.deep.include(["boolean", "true"]);
            expect(t).to.deep.include(["constant", "null"]);
        });

        it("classifies an identifier followed by `(` as function", () => {
            const t = typed(tokenize("javascript", "compute(1, 2)"));
            expect(t).to.deep.include(["function", "compute"]);
        });

        it("classifies numbers (decimal, hex, BigInt)", () => {
            const t = typed(tokenize("javascript", "1 0xff 99n"));
            expect(t).to.deep.include(["number", "1"]);
            expect(t).to.deep.include(["number", "0xff"]);
            expect(t).to.deep.include(["number", "99n"]);
        });

        it("captures double-quoted and single-quoted strings", () => {
            const t = typed(tokenize("javascript", `"hi"; 'yo'`));
            expect(t).to.deep.include(["string", '"hi"']);
            expect(t).to.deep.include(["string", "'yo'"]);
        });

        it("captures template literals including ${...} expressions", () => {
            const tokens = tokenize("javascript", "`hello, ${name}!`");
            const strs = tokens.filter((t) => t.type === "string");
            expect(strs.length).to.equal(1);
            expect(strs[0].text).to.equal("`hello, ${name}!`");
        });

        it("captures line and block comments", () => {
            const a = typed(tokenize("javascript", "// line\nconst x"));
            expect(a).to.deep.include(["comment", "// line"]);
            const b = typed(tokenize("javascript", "/* block */\nconst x"));
            expect(b).to.deep.include(["comment", "/* block */"]);
        });

        it("recognizes a regex literal after an operator (not as division)", () => {
            const t = tokenize("javascript", "const r = /ab+c/gi;");
            const regex = t.find((tok) => tok.type === "regex");
            expect(regex).to.exist;
            expect(regex.text).to.equal("/ab+c/gi");
        });

        it("treats `/` as division after an identifier", () => {
            const t = tokenize("javascript", "a / b");
            expect(t.find((tok) => tok.type === "regex")).to.be.undefined;
            expect(t.find((tok) => tok.type === "operator" && tok.text === "/"))
                .to.exist;
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `function add(a, b) {
    // sum
    return a + b;
}`;
            const t = tokenize("javascript", src);
            const reconstructed = t.map((tok) => tok.text).join("");
            expect(reconstructed).to.equal(src);
        });
    });

    // ── JSON ───────────────────────────────────────────────────────────

    describe("json", () => {
        it("tags property names vs string values", () => {
            const t = tokenize("json", '{ "name": "alice" }');
            const props = t.filter((tok) => tok.type === "property");
            const strs = t.filter((tok) => tok.type === "string");
            expect(props.length).to.equal(1);
            expect(props[0].text).to.equal('"name"');
            expect(strs.length).to.equal(1);
            expect(strs[0].text).to.equal('"alice"');
        });

        it("classifies numbers, booleans, and null", () => {
            const t = typed(tokenize("json", '{ "a": 1, "b": true, "c": null }'));
            expect(t).to.deep.include(["number", "1"]);
            expect(t).to.deep.include(["boolean", "true"]);
            expect(t).to.deep.include(["constant", "null"]);
        });

        it("handles arrays and nested objects", () => {
            const t = typed(tokenize("json", '{"items":[1,2,3]}'));
            expect(t).to.deep.include(["punctuation", "{"]);
            expect(t).to.deep.include(["punctuation", "["]);
            expect(t).to.deep.include(["number", "2"]);
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = '{\n  "name": "yk",\n  "ok": true\n}';
            const t = tokenize("json", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });

    // ── CSS ────────────────────────────────────────────────────────────

    describe("css", () => {
        it("classifies selectors, properties, and values", () => {
            const t = typed(tokenize("css", ".btn { color: red; }"));
            expect(t.some(([k, v]) => k === "selector" && v === "btn"))
                .to.be.true;
            expect(t).to.deep.include(["property", "color"]);
            expect(t).to.deep.include(["attr-value", "red"]);
        });

        it("captures comments and strings", () => {
            const t = tokenize(
                "css",
                `/* comment */ .x { content: "hello"; }`,
            );
            expect(t.find((tok) => tok.type === "comment").text).to.equal(
                "/* comment */",
            );
            expect(t.find((tok) => tok.type === "string").text).to.equal(
                '"hello"',
            );
        });

        it("tags numeric values with units and hex colors", () => {
            const t = tokenize("css", ".x { width: 12px; color: #fff; }");
            expect(t.find((tok) => tok.text === "12px").type).to.equal("number");
            expect(t.find((tok) => tok.text === "#fff").type).to.equal("number");
        });

        it("tags @-rules as keywords", () => {
            const t = typed(tokenize("css", "@media (min-width: 600px) {}"));
            expect(t).to.deep.include(["keyword", "@media"]);
        });

        it("tags !important", () => {
            const t = typed(tokenize("css", ".x { color: red !important; }"));
            expect(t).to.deep.include(["important", "!important"]);
        });

        it("tags CSS custom-property names as properties", () => {
            const t = typed(
                tokenize("css", ".x { --my-token: 1rem; color: var(--my-token); }"),
            );
            expect(t).to.deep.include(["property", "--my-token"]);
        });

        it("classifies value-context function names as functions", () => {
            const t = typed(tokenize("css", ".x { color: rgb(255, 0, 0); }"));
            expect(t).to.deep.include(["function", "rgb"]);
        });

        it("preserves the original source when tokens are concatenated", () => {
            const src = `.box {
    padding: 8px;
    color: #333;
}`;
            const t = tokenize("css", src);
            expect(t.map((tok) => tok.text).join("")).to.equal(src);
        });
    });
});
