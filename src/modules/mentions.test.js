import { expect, fixture, html } from "@open-wc/testing";
import {
    caretRectInTextarea,
    detectTriggerFragment,
    normalizeTriggers,
    renderMentionText,
} from "./mentions.js";

const AT = normalizeTriggers([{ trigger: "@" }]);

describe("mentions", () => {
    describe("normalizeTriggers", () => {
        it("fills every default in", () => {
            expect(normalizeTriggers([{ trigger: "@" }])[0]).to.deep.equal({
                trigger: "@",
                type: "@",
                minChars: 0,
                maxChars: 32,
                allowSpaces: false,
                insert: "{trigger}{label} ",
                atomic: false,
            });
        });

        it("parses the JSON attribute form", () => {
            const configs = normalizeTriggers('[{"trigger":"#","type":"tag"}]');
            expect(configs).to.have.lengthOf(1);
            expect(configs[0].type).to.equal("tag");
        });

        it("drops entries without a trigger and duplicate triggers", () => {
            const configs = normalizeTriggers([
                { trigger: "@" },
                { type: "nope" },
                { trigger: "@", type: "duplicate" },
                "junk",
            ]);
            expect(configs).to.have.lengthOf(1);
            expect(configs[0].type).to.equal("@");
        });

        it("sorts longer triggers first so they win at the same position", () => {
            const configs = normalizeTriggers([
                { trigger: "@" },
                { trigger: "@@" },
            ]);
            expect(configs.map((c) => c.trigger)).to.deep.equal(["@@", "@"]);
        });

        it("returns an empty list for anything that is not an array", () => {
            expect(normalizeTriggers(null)).to.deep.equal([]);
            expect(normalizeTriggers("not json")).to.deep.equal([]);
            expect(normalizeTriggers(42)).to.deep.equal([]);
        });
    });

    describe("detectTriggerFragment", () => {
        it("activates at the start of the text", () => {
            const fragment = detectTriggerFragment("@jo", 3, AT);
            expect(fragment).to.include({ query: "jo", start: 0, end: 3 });
        });

        it("activates after whitespace and after an opening bracket", () => {
            expect(detectTriggerFragment("hi @jo", 6, AT).start).to.equal(3);
            expect(detectTriggerFragment("(@jo", 4, AT).start).to.equal(1);
            expect(detectTriggerFragment("line\n@jo", 8, AT).start).to.equal(5);
        });

        it("ignores a trigger mid-word, so an email address is inert", () => {
            expect(detectTriggerFragment("a@b", 3, AT)).to.equal(null);
            expect(detectTriggerFragment("me@example.com", 14, AT)).to.equal(
                null,
            );
        });

        it("ends the fragment at whitespace", () => {
            expect(detectTriggerFragment("@jo bar", 7, AT)).to.equal(null);
        });

        it("tolerates one interior space with allowSpaces", () => {
            const configs = normalizeTriggers([
                { trigger: "@", allowSpaces: true },
            ]);
            expect(detectTriggerFragment("@jo do", 6, configs).query).to.equal(
                "jo do",
            );
            expect(detectTriggerFragment("@jo do e", 8, configs)).to.equal(
                null,
            );
        });

        it("abandons the trigger past maxChars", () => {
            const configs = normalizeTriggers([
                { trigger: "@", maxChars: 3 },
            ]);
            expect(detectTriggerFragment("@abc", 4, configs).query).to.equal(
                "abc",
            );
            expect(detectTriggerFragment("@abcd", 5, configs)).to.equal(null);
        });

        it("picks the fragment nearest the caret when triggers coexist", () => {
            const configs = normalizeTriggers([
                { trigger: "@", type: "user" },
                { trigger: "#", type: "topic" },
            ]);
            expect(detectTriggerFragment("@bob #ta", 8, configs)).to.include({
                type: "topic",
                query: "ta",
            });
            expect(detectTriggerFragment("#ta @bo", 7, configs)).to.include({
                type: "user",
                query: "bo",
            });
        });

        it("matches multi-character triggers", () => {
            const configs = normalizeTriggers([{ trigger: "::" }]);
            expect(detectTriggerFragment("say ::sm", 8, configs)).to.include({
                query: "sm",
                start: 4,
            });
        });

        it("returns null without triggers", () => {
            expect(detectTriggerFragment("@jo", 3, [])).to.equal(null);
        });
    });

    describe("caretRectInTextarea", () => {
        const build = (value) =>
            fixture(html`
                <textarea
                    style="width:220px;height:90px;font:16px/20px monospace;padding:0;border:0"
                    .value=${value}
                ></textarea>
            `);

        it("advances with the character offset along a line", async () => {
            const textarea = await build("@abcdefgh");
            const atTrigger = caretRectInTextarea(textarea, 0);
            const atCaret = caretRectInTextarea(textarea, 9);
            expect(atCaret.left).to.be.greaterThan(atTrigger.left);
            expect(atCaret.top).to.be.closeTo(atTrigger.top, 1);
        });

        it("reports the next line once the text has wrapped", async () => {
            // 220px / ~9.6px per monospace char wraps well before 60 chars.
            const textarea = await build("x".repeat(60));
            const first = caretRectInTextarea(textarea, 0);
            const last = caretRectInTextarea(textarea, 60);
            expect(last.top).to.be.greaterThan(first.top);
        });

        it("clamps an out-of-range offset instead of throwing", async () => {
            const textarea = await build("hi");
            expect(() => caretRectInTextarea(textarea, 999)).to.not.throw();
            expect(() => caretRectInTextarea(textarea, -5)).to.not.throw();
        });
    });

    describe("renderMentionText", () => {
        it("substitutes trigger, label, and value", () => {
            const [config] = normalizeTriggers([
                { trigger: "@", insert: "{trigger}{value}|{label}" },
            ]);
            expect(
                renderMentionText(config, { value: "u1", label: "Ada" }),
            ).to.equal("@u1|Ada ");
        });

        it("falls back to the value when there is no label", () => {
            expect(renderMentionText(AT[0], { value: "ada" })).to.equal("@ada ");
        });

        it("appends a space when the template does not end in whitespace", () => {
            const [config] = normalizeTriggers([
                { trigger: "@", insert: "{trigger}{label}" },
            ]);
            expect(renderMentionText(config, { value: "ada" })).to.equal(
                "@ada ",
            );
        });

        it("keeps the template's own trailing whitespace as authored", () => {
            const [config] = normalizeTriggers([
                { trigger: "@", insert: "{label}  " },
            ]);
            expect(renderMentionText(config, { value: "ada" })).to.equal(
                "ada  ",
            );
        });

        it("accepts a trailing newline or tab as the separator", () => {
            const [newline] = normalizeTriggers([
                { trigger: "@", insert: "{label}\n" },
            ]);
            expect(renderMentionText(newline, { value: "ada" })).to.equal(
                "ada\n",
            );

            const [tab] = normalizeTriggers([
                { trigger: "@", insert: "{label}\t" },
            ]);
            expect(renderMentionText(tab, { value: "ada" })).to.equal("ada\t");
        });
    });
});
