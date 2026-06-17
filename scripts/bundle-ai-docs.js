import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs";
import { join } from "path";

// Stages the AI-assistant docs into dist/ so they ship with the package and the
// `init-ai` CLI can copy them into a consumer's project. dist is already in the
// published `files` allowlist, so this avoids dot-directory publish quirks and
// keeps the installed paths clean.

const skillSrc = ".claude/skills/yumekit";
const llmSrc = "llm.txt";
const outDir = "dist/ai";
const skillOut = join(outDir, "skill");
const repo = "https://github.com/waggylabs/yumekit/blob/main";

if (!existsSync(skillSrc)) {
    console.error(`✗ Skill source not found at ${skillSrc}`);
    process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(skillSrc, skillOut, { recursive: true });

// The skill's one repo-relative link points at contributor-only docs that don't
// ship and would resolve to bogus paths inside a consumer's project — rewrite it
// to absolute GitHub URLs. Fail loudly if the source phrasing changed, so we
// never silently ship the unreplaced contributor-only links.
const skillMd = join(skillOut, "SKILL.md");
const linkPattern = /When writing or modifying component source code.*$/m;
const original = readFileSync(skillMd, "utf8");
if (!linkPattern.test(original)) {
    console.error(
        `✗ ${skillMd}: expected contributor-doc link sentence not found — update the rewrite pattern in bundle-ai-docs.js.`,
    );
    process.exit(1);
}
const md = original.replace(
    linkPattern,
    `When contributing to YumeKit itself, follow the authoring standards in [CONTRIBUTING.md](${repo}/CONTRIBUTING.md#component-authoring-standards) and [CLAUDE.md](${repo}/CLAUDE.md).`,
);
writeFileSync(skillMd, md);

cpSync(llmSrc, join(outDir, "llm.txt"));

console.log(`✔ Bundled AI docs → ${outDir} (skill + llm.txt)`);
