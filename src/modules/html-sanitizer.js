// Allowlist-based HTML sanitizer for rich-text content — the counterpart to
// svg-sanitizer.js. Every path that can introduce HTML into `y-editor` (the
// `value` setter, the default slot, paste) runs through here first, so the
// component never hands unsanitized markup to innerHTML.
//
// Parsing happens in an inert document via DOMParser("text/html"): scripts do
// not run and `src`/`href` are not fetched while we inspect the tree.

/**
 * Tags whose subtree is discarded wholesale. Everything else that is not
 * allowed is *unwrapped* instead, so its text survives — but for these there is
 * no text worth keeping and the content is itself the attack surface
 * (`<svg>` / `<math>` are here because their foreign-content parsing rules are
 * the basis of most mXSS round-trip bypasses).
 */
const DROP_WITH_CONTENT = new Set([
    "applet",
    "audio",
    "base",
    "canvas",
    "embed",
    "frame",
    "frameset",
    "head",
    "iframe",
    "link",
    "math",
    "meta",
    "noembed",
    "noframes",
    "noscript",
    "object",
    "param",
    "script",
    "source",
    "style",
    "svg",
    "template",
    "title",
    "track",
    "video",
    "xmp",
]);

/**
 * Per-tag attribute allowlist. Any tag absent from this map keeps no
 * attributes at all, which is what strips every `on*` handler, `style`, and
 * `class` without needing to enumerate them.
 */
const ATTR_POLICY = {
    a: new Set(["href", "title"]),
    img: new Set(["src", "alt", "title", "width", "height"]),
};

/** Inline formatting, links, and images — permitted regardless of block set. */
export const INLINE_TAGS = ["strong", "em", "u", "s", "code", "a", "img", "br"];

/** Block tags allowed when no explicit set is supplied. */
export const DEFAULT_ALLOWED_TAGS = [
    "p",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li",
    "pre",
    ...INLINE_TAGS,
];

/**
 * Media types accepted for a `data:` image URL. `image/svg+xml` is
 * deliberately excluded: an SVG data URL is script-bearing markup, and while
 * `<img src>` does not execute it today, allowing it would make the sanitizer's
 * guarantee depend on the embedding context rather than on the value itself.
 */
const DATA_IMAGE_RE =
    /^data:image\/(png|jpeg|jpg|gif|webp|avif|bmp|x-icon|vnd\.microsoft\.icon)[;,]/i;

/** Schemes permitted on `href`. */
const SAFE_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** Leading scheme, if the value carries one at all. */
const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;

/**
 * C0 controls and DEL. Browsers strip these from URLs before resolving them, so
 * a sanitizer that does not strip them first can be walked past with
 * `java\tscript:` and friends.
 */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** Guard against stack exhaustion from pathologically nested input. */
const MAX_DEPTH = 100;

/**
 * Strip URL-insignificant control characters and surrounding whitespace, giving
 * the same string the browser's URL parser would act on.
 *
 * @param {unknown} value
 * @returns {string}
 */
function cleanUrl(value) {
    return String(value ?? "")
        .replace(CONTROL_CHARS, "")
        .trim();
}

/**
 * Whether a URL is safe to place on `href` / `src`. Scheme-less values
 * (relative paths, `#fragment`, `?query`, protocol-relative `//host`) are
 * permitted — they cannot name a dangerous scheme. Anything carrying a scheme
 * must be `http`, `https`, `mailto`, or — when `allowDataImage` is set — a
 * `data:` URL of a raster image type.
 *
 * @param {unknown} value — raw attribute value
 * @param {{allowDataImage?: boolean}} [options]
 * @returns {boolean}
 */
export function isSafeUrl(value, { allowDataImage = false } = {}) {
    const url = cleanUrl(value);
    if (!url) return false;

    const match = url.match(SCHEME_RE);
    if (!match) return true;

    const scheme = `${match[1].toLowerCase()}:`;
    if (SAFE_SCHEMES.has(scheme)) return true;
    if (scheme === "data:" && allowDataImage) return DATA_IMAGE_RE.test(url);
    return false;
}

/**
 * Translate a `y-editor` block set into the tag allowlist it implies. The
 * `code` block maps to `<pre>`, and `ul` / `ol` pull in `<li>`. Inline
 * formatting is always included.
 *
 * @param {string[]} blocks — block ids, e.g. `["p", "h1", "ul"]`
 * @returns {string[]} — tag names
 */
export function tagsForBlocks(blocks) {
    const tags = new Set(["p", ...INLINE_TAGS]);

    for (const block of blocks) {
        if (block === "code") tags.add("pre");
        else if (block === "ul" || block === "ol") {
            tags.add(block);
            tags.add("li");
        } else if (block) tags.add(block);
    }

    return [...tags];
}

/**
 * Replace an element with its child nodes, keeping the text it wrapped.
 *
 * @param {Element} el
 */
function unwrap(el) {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    el.remove();
}

/**
 * Apply the attribute allowlist to one element, dropping unsafe URLs and
 * non-numeric dimensions.
 *
 * @param {Element} el
 * @param {string} tag — lowercased tag name
 */
function scrubAttributes(el, tag) {
    const policy = ATTR_POLICY[tag];

    for (const attr of [...el.attributes]) {
        const name = attr.name.toLowerCase();

        if (!policy || !policy.has(name)) {
            el.removeAttribute(attr.name);
            continue;
        }

        if (name === "href" || name === "src") {
            const allowDataImage = tag === "img";
            if (!isSafeUrl(attr.value, { allowDataImage })) {
                el.removeAttribute(attr.name);
            } else {
                el.setAttribute(name, cleanUrl(attr.value));
            }
            continue;
        }

        if (
            (name === "width" || name === "height") &&
            !/^\d+$/.test(attr.value.trim())
        ) {
            el.removeAttribute(attr.name);
        }
    }
}

/**
 * Recursively enforce the tag and attribute allowlists over a parsed subtree,
 * mutating it in place.
 *
 * @param {Node} root
 * @param {Set<string>} allowed — lowercased allowed tag names
 * @param {number} depth
 */
function scrub(root, allowed, depth) {
    for (const child of [...root.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) continue;

        if (child.nodeType !== Node.ELEMENT_NODE) {
            child.remove();
            continue;
        }

        const tag = child.tagName.toLowerCase();

        if (DROP_WITH_CONTENT.has(tag) || depth >= MAX_DEPTH) {
            child.remove();
            continue;
        }

        if (!allowed.has(tag)) {
            scrub(child, allowed, depth + 1);
            unwrap(child);
            continue;
        }

        scrubAttributes(child, tag);

        // A link with no surviving href is just text; an image with no
        // surviving src has nothing to show.
        if (tag === "a" && !child.hasAttribute("href")) {
            scrub(child, allowed, depth + 1);
            unwrap(child);
            continue;
        }
        if (tag === "img" && !child.hasAttribute("src")) {
            child.remove();
            continue;
        }

        scrub(child, allowed, depth + 1);
    }
}

/**
 * Sanitize an HTML string and return the result as a DocumentFragment owned by
 * the caller's document.
 *
 * Prefer this over `sanitizeHtml` when the result is going straight into the
 * DOM: it avoids serializing back to a string and re-parsing, which is the
 * round trip mXSS payloads are built to exploit.
 *
 * @param {string} raw — untrusted HTML markup
 * @param {{allowedTags?: string[]}} [options]
 * @returns {DocumentFragment}
 */
export function sanitizeHtmlToFragment(raw, { allowedTags } = {}) {
    const fragment = document.createDocumentFragment();
    if (!raw || typeof raw !== "string") return fragment;

    const allowed = new Set(
        (allowedTags ?? DEFAULT_ALLOWED_TAGS).map((t) => t.toLowerCase()),
    );

    const doc = new DOMParser().parseFromString(raw, "text/html");
    scrub(doc.body, allowed, 0);

    for (const node of [...doc.body.childNodes]) {
        fragment.appendChild(document.importNode(node, true));
    }

    return fragment;
}

/**
 * Sanitize an HTML string and return sanitized markup.
 *
 * @param {string} raw — untrusted HTML markup
 * @param {{allowedTags?: string[]}} [options]
 * @returns {string} — sanitized markup
 */
export function sanitizeHtml(raw, options) {
    const holder = document.createElement("div");
    holder.appendChild(sanitizeHtmlToFragment(raw, options));
    return holder.innerHTML;
}
