// Builds the CSS variable files under `styles/` from the Tokens Studio
// sources under `tokens/`.
//
// Usage: `npm run build:tokens`
//
// Outputs:
//   styles/variables.css   — Colors palette + Numerics + Components dims +
//                             the Blue Light default theme (everything a
//                             consumer needs for a working baseline)
//   styles/{theme}.css     — per-theme override files (semantic + component-
//                             themed tokens only; refs to core stay as var()
//                             so these cascade on top of variables.css)

import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const TOKENS_DIR = join(ROOT, "tokens");
const STYLES_DIR = join(ROOT, "styles");

const DEFAULT_THEME_SLUG = "blue-light";

register(StyleDictionary);

// ---------- Custom transforms ----------

// Re-apply "px" to bare-number dimension values. The Tokens Studio preset's
// `ts/size/px` normalizes "0px" → "0", which loses information for CSS.
const UNIT_BEARING_TYPES = new Set([
    "dimension",
    "spacing",
    "sizing",
    "borderWidth",
    "borderRadius",
    "fontSizes",
]);
StyleDictionary.registerTransform({
    name: "size/yumekit-preserve-unit",
    type: "value",
    transitive: true,
    filter: (token) => UNIT_BEARING_TYPES.has(token.$type || token.type),
    transform: (token) => {
        const v = String(token.$value ?? token.value);
        if (/^-?\d+(?:\.\d+)?$/.test(v)) return `${v}px`;
        return v;
    },
});

// Restore multi-value border-width / border-radius. The tokens-studio pipeline
// mangles space-separated CSS lists (its math/dimension passes try to reduce
// each part), so a per-side `border-width` like "2px 5px 5px 2px" comes out
// corrupted. Note tokens-studio's `alignTypes` preprocessor rewrites the
// `borderWidth` / `borderRadius` `$type` to `dimension` (stashing the original
// under `$extensions["studio.tokens"].originalType`). These lists are already
// valid CSS, so when the *source* value is a space-separated list of lengths we
// restore it verbatim. Runs last so it has the final say.
const LENGTH_LIST = /^-?[\d.]+[a-z%]*(?:\s+-?[\d.]+[a-z%]*)+$/i;
StyleDictionary.registerTransform({
    name: "size/yumekit-multi-value",
    type: "value",
    transitive: true,
    filter: (token) => {
        const type = token.$type || token.type;
        const origType =
            token.$extensions?.["studio.tokens"]?.originalType;
        const dimensionish =
            ["borderWidth", "borderRadius", "dimension"].includes(type) ||
            ["borderWidth", "borderRadius"].includes(origType);
        if (!dimensionish) return false;
        const orig = token.original?.$value ?? token.original?.value;
        return typeof orig === "string" && LENGTH_LIST.test(orig.trim());
    },
    transform: (token) =>
        String(token.original.$value ?? token.original.value)
            .trim()
            .replace(/\s+/g, " "),
});

// Quote the primary font family so families with spaces (e.g. "Noto Sans")
// emit as valid CSS.
StyleDictionary.registerTransform({
    name: "fontFamily/yumekit-quote",
    type: "value",
    transitive: true,
    filter: (token) => (token.$type || token.type) === "fontFamily",
    transform: (token) => {
        const raw = String(token.$value ?? token.value);
        const parts = raw.split(",").map((p) => p.trim());
        if (!parts[0]) return raw;
        const primary = parts[0].replace(/^["'](.+)["']$/, "$1");
        const quoted = `"${primary}"`;
        return parts.length > 1 ? `${quoted}, ${parts.slice(1).join(", ")}` : quoted;
    },
});

// Kebab-join path segments, dropping a trailing `DEFAULT` sentinel so
// `neutral.DEFAULT` → `--neutral`, `base.content.DEFAULT` → `--base-content`.
// The sentinel is uppercase (Tailwind convention) to avoid collision with a
// real token literally named "default".
StyleDictionary.registerTransform({
    name: "name/yumekit-kebab",
    type: "name",
    transform: (token) => {
        const path = token.path;
        const segs =
            path[path.length - 1] === "DEFAULT" ? path.slice(0, -1) : path;
        return segs.join("-");
    },
});

// DEPRECATED: remove in next major.
// `shadow/css/shorthand` emits a 4-value `x y blur spread color` string even
// when spread is zero. We strip the trailing zero so existing consumers that
// may have parsed the 3-value form keep working. When this transform is
// removed, `--base-shadow` becomes `0 2px 6px 0 var(color)` — valid CSS that
// renders identically to the stripped form.
StyleDictionary.registerTransform({
    name: "shadow/yumekit-strip-zero-spread",
    type: "value",
    transitive: true,
    filter: (token) => (token.$type || token.type) === "shadow",
    transform: (token) => {
        const v = String(token.$value ?? token.value);
        return v
            .split(/,\s*/)
            .map((seg) =>
                seg.replace(
                    /^(\s*inset\s+)?(\S+\s+\S+\s+\S+)\s+0(\s+\S+.*)$/,
                    "$1$2$3",
                ),
            )
            .join(", ");
    },
});

// ---------- Custom transform group ----------

// Extends the registered tokens-studio group with our overrides. We drop the
// group's `name/camel` and `name/kebab` in favor of our own name transform,
// and drop `fontFamily/css` so our quoting transform sees the raw value. We
// also drop `ts/resolveMath`: no token uses arithmetic, and it corrupts
// space-separated CSS lists (e.g. a per-side `border-width: 2px 5px 5px 2px`)
// by trying to reduce each part as a math sub-expression.
const DROPPED_FROM_BASE = new Set([
    "name/camel",
    "name/kebab",
    "fontFamily/css",
]);
const TOKENS_STUDIO_BASE = StyleDictionary.hooks.transformGroups[
    "tokens-studio"
].filter((t) => !DROPPED_FROM_BASE.has(t));

StyleDictionary.registerTransformGroup({
    name: "yumekit-css",
    transforms: [
        ...TOKENS_STUDIO_BASE,
        "size/yumekit-preserve-unit",
        "size/yumekit-multi-value",
        "fontFamily/yumekit-quote",
        // DEPRECATED: remove with the transform above.
        "shadow/yumekit-strip-zero-spread",
        "name/yumekit-kebab",
    ],
});

// ---------- Custom format ----------

// Wraps the stock `css/variables` format and appends a deprecation block
// with `--X--: var(--X);` aliases for every token whose source path ended
// in the `DEFAULT` sentinel. Preserves the pre-migration yumekit naming
// convention (`--neutral--`, `--base-content--`, ...).
// DEPRECATED: remove in next major when the `--X--` aliases are dropped.
StyleDictionary.registerFormat({
    name: "yumekit/css-variables",
    format: async (args) => {
        const cssVariables =
            StyleDictionary.hooks.formats["css/variables"];
        const baseOutput = await cssVariables(args);

        const aliases = [];
        for (const token of args.dictionary.allTokens) {
            if (token.path[token.path.length - 1] === "DEFAULT") {
                aliases.push(`  --${token.name}--: var(--${token.name});`);
            }
        }
        if (aliases.length === 0) return baseOutput;

        const closing = baseOutput.lastIndexOf("}");
        if (closing === -1) return baseOutput;
        const head =
            "\n  /* DEPRECATED: --X-- aliases, use --X instead. */\n";
        return (
            baseOutput.slice(0, closing) +
            head +
            aliases.join("\n") +
            "\n" +
            baseOutput.slice(closing)
        );
    },
});

// ---------- Build pipeline ----------

function themeSlug(name) {
    return name.toLowerCase().replace(/\s+/g, "-");
}

function loadThemes() {
    const manifest = JSON.parse(
        readFileSync(join(TOKENS_DIR, "$themes.json"), "utf8"),
    );
    return manifest.filter((t) => t.group === "Themes");
}

function filesByStatus(theme, status) {
    return Object.entries(theme.selectedTokenSets)
        .filter(([, s]) => s === status)
        .map(([set]) => join(TOKENS_DIR, `${set}.json`));
}

function enabledSetKeys(theme) {
    return new Set(
        Object.entries(theme.selectedTokenSets)
            .filter(([, s]) => s === "enabled")
            .map(([set]) => resolve(TOKENS_DIR, `${set}.json`)),
    );
}

async function buildOne({ theme, destination, includeAll }) {
    const enabled = filesByStatus(theme, "enabled");
    const sourceOnly = filesByStatus(theme, "source");
    const enabledPaths = enabledSetKeys(theme);

    const config = {
        preprocessors: ["tokens-studio"],
        source: includeAll ? [...enabled, ...sourceOnly] : enabled,
        include: includeAll ? [] : sourceOnly,
        platforms: {
            css: {
                transformGroup: "yumekit-css",
                buildPath: STYLES_DIR + "/",
                files: [
                    {
                        destination,
                        format: "yumekit/css-variables",
                        filter: includeAll
                            ? undefined
                            : (token) =>
                                  enabledPaths.has(
                                      resolve(ROOT, token.filePath),
                                  ),
                        options: {
                            outputReferences: true,
                            selector: ":root",
                        },
                    },
                ],
            },
        },
        // Per-theme builds intentionally filter out core tokens and keep
        // them as var() references, which triggers a "filtered out token
        // references" warning. Silence it for partial builds only; the
        // full variables.css build still surfaces real warnings.
        log: {
            verbosity: "default",
            warnings: includeAll ? "warn" : "disabled",
        },
    };

    const sd = new StyleDictionary(config);
    await sd.hasInitialized;
    await sd.buildAllPlatforms();
}

async function main() {
    const themes = loadThemes();
    if (themes.length === 0) {
        throw new Error("No Themes-group entries found in tokens/$themes.json");
    }

    for (const theme of themes) {
        const slug = themeSlug(theme.name);
        await buildOne({
            theme,
            destination: `${slug}.css`,
            includeAll: false,
        });
    }

    const defaultTheme = themes.find(
        (t) => themeSlug(t.name) === DEFAULT_THEME_SLUG,
    );
    if (!defaultTheme) {
        throw new Error(
            `Default theme "${DEFAULT_THEME_SLUG}" not present in manifest`,
        );
    }
    await buildOne({
        theme: defaultTheme,
        destination: "variables.css",
        includeAll: true,
    });

    console.log(
        `Built styles/variables.css + ${themes.length} theme files from tokens/`,
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
