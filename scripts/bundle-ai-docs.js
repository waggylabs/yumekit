// Stages the AI-assistant docs into dist/ so they ship with the package and the
// `init-ai` CLI can copy them into a consumer's project. dist is already in the
// published `files` allowlist, so this avoids dot-directory publish quirks and
// keeps the installed paths clean.
//
// Usage: `node scripts/bundle-ai-docs.js` (runs as part of `npm run build`)

import {
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs";
import { join } from "path";

const SKILL_SRC = ".claude/skills/yumekit";
const LLM_SRC = "llm.txt";
const OUT_DIR = "dist/ai";
const SKILL_OUT = join(OUT_DIR, "skill");
const REPO = "https://github.com/waggylabs/yumekit/blob/main";

// The skill's one repo-relative link points at contributor-only docs that don't
// ship and would resolve to bogus paths inside a consumer's project. Rewrite it
// to absolute GitHub URLs, failing loudly if the source phrasing changed so we
// never silently ship the unreplaced contributor-only link.
const CONTRIBUTOR_LINK = /When writing or modifying component source code.*$/m;

// Recreates OUT_DIR from scratch and copies the skill tree into it.
function stageSkill() {
    rmSync(OUT_DIR, { recursive: true, force: true });
    mkdirSync(OUT_DIR, { recursive: true });
    cpSync(SKILL_SRC, SKILL_OUT, { recursive: true });
}

// Rewrites the contributor-only link in the bundled SKILL.md to absolute URLs.
// Exits with an error if the expected source sentence is missing.
function rewriteContributorLink() {
    const skillMd = join(SKILL_OUT, "SKILL.md");
    const original = readFileSync(skillMd, "utf8");

    if (!CONTRIBUTOR_LINK.test(original)) {
        console.error(
            `✗ ${skillMd}: expected contributor-doc link sentence not found — update the rewrite pattern in bundle-ai-docs.js.`,
        );
        process.exit(1);
    }

    const rewritten = original.replace(
        CONTRIBUTOR_LINK,
        `When contributing to YumeKit itself, follow the authoring standards in [CONTRIBUTING.md](${REPO}/CONTRIBUTING.md#component-authoring-standards) and [CLAUDE.md](${REPO}/CLAUDE.md).`,
    );
    writeFileSync(skillMd, rewritten);
}

function main() {
    if (!existsSync(SKILL_SRC)) {
        console.error(`✗ Skill source not found at ${SKILL_SRC}`);
        process.exit(1);
    }

    stageSkill();
    rewriteContributorLink();
    cpSync(LLM_SRC, join(OUT_DIR, "llm.txt"));

    console.log(`✔ Bundled AI docs → ${OUT_DIR} (skill + llm.txt)`);
}

main();
