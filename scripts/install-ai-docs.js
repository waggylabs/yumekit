#!/usr/bin/env node
import {
    appendFileSync,
    cpSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// `npx @waggylabs/yumekit init-ai` — copies YumeKit's bundled AI docs into the
// current project so coding assistants (Claude Code and generic LLM tooling)
// can use them. Opt-in and idempotent: existing files are skipped unless
// --force is passed.

const __dirname = dirname(fileURLToPath(import.meta.url));
const aiDir = join(__dirname, "..", "dist", "ai");

const args = process.argv.slice(2);
const force = args.includes("--force");
const wantsHelp = args.includes("--help") || args.includes("-h");
const cmd = args.find((a) => !a.startsWith("-"));

const HELP = `
YumeKit AI docs installer

Usage:
  npx @waggylabs/yumekit init-ai [--force]

Copies YumeKit's AI assistant docs into the current project:
  • .claude/skills/yumekit/   Claude Code skill (SKILL.md, reference, examples)
  • llm.txt                   generic LLM/agent component reference
  • AGENTS.md                 short pointer note (appended if the file exists)

Options:
  --force   Overwrite existing files (default: skip files that already exist)
  --help    Show this help
`;

if (wantsHelp || cmd !== "init-ai") {
    console.log(HELP);
    process.exit(wantsHelp || !cmd ? 0 : 1);
}

if (!existsSync(aiDir)) {
    console.error(
        `✗ Bundled AI docs not found at ${aiDir}.\n  This package may not have been built with AI docs — please report it.`,
    );
    process.exit(1);
}

const cwd = process.cwd();
const results = [];

// 1. Claude skill ---------------------------------------------------------
const skillDest = join(cwd, ".claude", "skills", "yumekit");
if (existsSync(skillDest) && !force) {
    results.push("• skip   .claude/skills/yumekit/ (exists — use --force)");
} else {
    // Clear the destination first so --force is a true replacement — a
    // recursive copy alone would leave behind files removed/renamed upstream.
    if (existsSync(skillDest)) rmSync(skillDest, { recursive: true, force: true });
    mkdirSync(dirname(skillDest), { recursive: true });
    cpSync(join(aiDir, "skill"), skillDest, { recursive: true });
    results.push("✔ wrote  .claude/skills/yumekit/");
}

// 2. llm.txt --------------------------------------------------------------
const llmDest = join(cwd, "llm.txt");
if (existsSync(llmDest) && !force) {
    results.push("• skip   llm.txt (exists — use --force)");
} else {
    cpSync(join(aiDir, "llm.txt"), llmDest);
    results.push("✔ wrote  llm.txt");
}

// 3. AGENTS.md pointer ----------------------------------------------------
// Delimited so --force can refresh the block in place without disturbing the
// rest of the user's AGENTS.md.
const POINTER_START = "<!-- yumekit-ai-docs -->";
const POINTER_END = "<!-- /yumekit-ai-docs -->";
const pointer = `${POINTER_START}
## YumeKit UI components

This project uses [@waggylabs/yumekit](https://www.yumekit.com) web components.
When building UI with \`y-*\` elements, consult:
- \`.claude/skills/yumekit/\` — full component skill (Claude Code)
- \`llm.txt\` — component API reference for any LLM/agent
${POINTER_END}`;
const agentsDest = join(cwd, "AGENTS.md");
if (!existsSync(agentsDest)) {
    writeFileSync(agentsDest, `# AGENTS\n\n${pointer}\n`);
    results.push("✔ wrote  AGENTS.md");
} else {
    const existing = readFileSync(agentsDest, "utf8");
    const start = existing.indexOf(POINTER_START);
    if (start === -1) {
        appendFileSync(agentsDest, `\n${pointer}\n`);
        results.push("✔ append AGENTS.md (pointer)");
    } else if (!force) {
        results.push("• skip   AGENTS.md (pointer present — use --force)");
    } else {
        // Replace the existing block (handles a legacy block with no end marker
        // by replacing through end of file).
        const endMark = existing.indexOf(POINTER_END, start);
        const end = endMark === -1 ? existing.length : endMark + POINTER_END.length;
        writeFileSync(agentsDest, existing.slice(0, start) + pointer + existing.slice(end));
        results.push("✔ update AGENTS.md (pointer)");
    }
}

console.log(`\nYumeKit AI docs → ${cwd}\n`);
console.log(results.map((r) => `  ${r}`).join("\n"));
console.log("");
