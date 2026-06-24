#!/usr/bin/env node
// `npx @waggylabs/yumekit init-ai` — copies YumeKit's bundled AI docs into the
// current project so coding assistants (Claude Code and generic LLM tooling)
// can use them. Opt-in and idempotent: existing files are skipped unless
// --force is passed.

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

const __dirname = dirname(fileURLToPath(import.meta.url));
const AI_DIR = join(__dirname, "..", "dist", "ai");

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

// Delimited so --force can refresh the AGENTS.md block in place without
// disturbing the rest of the user's file.
const POINTER_START = "<!-- yumekit-ai-docs -->";
const POINTER_END = "<!-- /yumekit-ai-docs -->";
const POINTER = `${POINTER_START}
## YumeKit UI components

This project uses [@waggylabs/yumekit](https://www.yumekit.com) web components.
When building UI with \`y-*\` elements, consult:
- \`.claude/skills/yumekit/\` — full component skill (Claude Code)
- \`llm.txt\` — component API reference for any LLM/agent
${POINTER_END}`;

// ---------- install steps ----------

// Copies the Claude skill tree into <cwd>/.claude/skills/yumekit/. With --force
// the destination is cleared first so the copy is a true replacement (a plain
// recursive copy would leave behind files removed/renamed upstream).
function installSkill(cwd, force) {
    const dest = join(cwd, ".claude", "skills", "yumekit");
    if (existsSync(dest) && !force) {
        return "• skip   .claude/skills/yumekit/ (exists — use --force)";
    }

    if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(AI_DIR, "skill"), dest, { recursive: true });
    return "✔ wrote  .claude/skills/yumekit/";
}

// Copies llm.txt into the project root.
function installLlm(cwd, force) {
    const dest = join(cwd, "llm.txt");
    if (existsSync(dest) && !force) {
        return "• skip   llm.txt (exists — use --force)";
    }

    cpSync(join(AI_DIR, "llm.txt"), dest);
    return "✔ wrote  llm.txt";
}

// Writes the pointer block into AGENTS.md: creates the file if absent, appends
// the block if the file exists without it, or (with --force) replaces an
// existing block in place. A legacy block with no end marker is replaced
// through end of file.
function installAgentsPointer(cwd, force) {
    const dest = join(cwd, "AGENTS.md");
    if (!existsSync(dest)) {
        writeFileSync(dest, `# AGENTS\n\n${POINTER}\n`);
        return "✔ wrote  AGENTS.md";
    }

    const existing = readFileSync(dest, "utf8");
    const start = existing.indexOf(POINTER_START);
    if (start === -1) {
        appendFileSync(dest, `\n${POINTER}\n`);
        return "✔ append AGENTS.md (pointer)";
    }
    if (!force) {
        return "• skip   AGENTS.md (pointer present — use --force)";
    }

    const endMark = existing.indexOf(POINTER_END, start);
    const end = endMark === -1 ? existing.length : endMark + POINTER_END.length;
    writeFileSync(dest, existing.slice(0, start) + POINTER + existing.slice(end));
    return "✔ update AGENTS.md (pointer)";
}

// ---------- run ----------

function main() {
    const args = process.argv.slice(2);
    const force = args.includes("--force");
    const wantsHelp = args.includes("--help") || args.includes("-h");
    const cmd = args.find((a) => !a.startsWith("-"));

    if (wantsHelp || cmd !== "init-ai") {
        console.log(HELP);
        process.exit(wantsHelp || !cmd ? 0 : 1);
    }

    if (!existsSync(AI_DIR)) {
        console.error(
            `✗ Bundled AI docs not found at ${AI_DIR}.\n  This package may not have been built with AI docs — please report it.`,
        );
        process.exit(1);
    }

    const cwd = process.cwd();
    const results = [
        installSkill(cwd, force),
        installLlm(cwd, force),
        installAgentsPointer(cwd, force),
    ];

    console.log(`\nYumeKit AI docs → ${cwd}\n`);
    console.log(results.map((r) => `  ${r}`).join("\n"));
    console.log("");
}

main();
