// Prints the CHANGELOG.md section for a version, for use as GitHub release
// notes. The changelog is the hand-written record of a release and the notes
// on the release should say the same thing, so they are lifted from it rather
// than written twice or replaced by a generated commit list.
//
// A missing or empty section exits non-zero, which fails the release before a
// tag exists — an unreleasable state rather than a release with empty notes.
//
//   node scripts/changelog-notes.js              # version from package.json
//   node scripts/changelog-notes.js 0.5.5-beta.3 # explicit version

import { readFileSync } from "fs";

const version =
    process.argv[2] || JSON.parse(readFileSync("package.json", "utf8")).version;

const changelog = readFileSync("CHANGELOG.md", "utf8");
const lines = changelog.split("\n");

// Headings read `## [0.5.4] - 2026-08-02` or `## [0.5.5-beta.3]`; whatever
// follows the bracketed version is presentation and varies between entries.
const isHeading = (line) => line.startsWith("## ");
const start = lines.findIndex((line) => line.startsWith(`## [${version}]`));

if (start === -1) {
    console.error(
        `No CHANGELOG.md section for ${version} — add a "## [${version}]" entry before releasing.`,
    );
    process.exit(1);
}

const after = lines.slice(start + 1);
const end = after.findIndex(isHeading);
const notes = (end === -1 ? after : after.slice(0, end)).join("\n").trim();

if (!notes) {
    console.error(
        `The CHANGELOG.md section for ${version} is empty — write the release notes before releasing.`,
    );
    process.exit(1);
}

console.log(notes);
