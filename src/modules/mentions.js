// Caret-triggered autocomplete shared by `y-editor` and `y-textarea`.
//
// The host owns the text; this module owns everything between the caret and
// the popup: which trigger fragment is active, when to ask the app for
// candidates, which candidate is highlighted, and where the popup sits. Hosts
// plug in through a small adapter (see `MentionController`) that knows how to
// read the caret and how to write an insertion back into their own model.
//
// Nothing here fetches. `mention-query` goes out, `setCandidates` comes back.

import { coerceRichData, createElement as _el } from "./helpers.js";
import { isSafeUrl } from "./html-sanitizer.js";

/** Debounce between the caret settling in a fragment and `mention-query`. */
export const DEFAULT_MENTION_QUERY_DELAY = 150;

/** Fragment length past which a trigger is abandoned. */
const DEFAULT_MAX_CHARS = 32;

/** `{trigger}` `{value}` `{label}` are substituted; the rest is literal. */
const DEFAULT_INSERT_TEMPLATE = "{trigger}{label} ";

/**
 * Characters that open a word alongside whitespace and start-of-text, so
 * `(@name` triggers but `a@b` does not.
 */
const OPENING_CHARS = new Set(["(", "[", "{", "<", '"', "'", "«", "‘", "“"]);

/**
 * Zero-width space marking the caret position in the textarea mirror. Built
 * from its code point so the source stays plain ASCII — an invisible literal
 * makes tooling treat this file as binary.
 */
const CARET_MARKER = String.fromCharCode(0x200b);

/**
 * Stands in for "the fragment the last insertion wrote", recorded before that
 * fragment can be measured and resolved to a real key on the next evaluation.
 */
const JUST_INSERTED = Symbol("just-inserted");

/** Textarea styles the mirror must copy for its line breaks to match. */
const MIRRORED_STYLES = [
    "borderBottomWidth",
    "borderLeftWidth",
    "borderRightWidth",
    "borderTopWidth",
    "boxSizing",
    "fontFamily",
    "fontSize",
    "fontStretch",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "letterSpacing",
    "lineHeight",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "tabSize",
    "textIndent",
    "textTransform",
    "width",
    "wordSpacing",
];

let _instanceCount = 0;

/**
 * Shadow-root CSS for the mention popup. Hosts concatenate this into their own
 * stylesheet — the popup lives in the host's shadow tree so its `part` names
 * are exposed from the host.
 */
export const MENTION_STYLES = `
    .mention-anchor {
        position: absolute;
        pointer-events: none;
        opacity: 0;
    }

    .mention-popover {
        --component-popover-padding-small: 0px;
        --component-popover-max-width: none;
        --component-popover-min-width: var(
            --component-editor-mention-popup-min-width,
            14rem
        );
    }

    .mention-popup {
        display: flex;
        flex-direction: column;
        max-height: var(--component-editor-mention-popup-max-height, 16rem);
        overflow-y: auto;
        overscroll-behavior: contain;
    }

    .mention-list[hidden],
    .mention-empty[hidden],
    .mention-loading[hidden] {
        display: none;
    }

    .mention-option {
        display: flex;
        align-items: center;
        gap: var(--spacing-small, 6px);
        padding: var(--spacing-small, 6px) var(--spacing-medium, 8px);
        cursor: pointer;
    }

    .mention-option[aria-selected="true"] {
        background: var(--base-background-hover, rgba(0, 0, 0, 0.06));
    }

    .mention-option[aria-disabled="true"] {
        opacity: 0.5;
        cursor: default;
    }

    .mention-option-avatar {
        flex: 0 0 auto;
        width: 1.5em;
        height: 1.5em;
        border-radius: 50%;
        object-fit: cover;
    }

    .mention-option-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .mention-option-label,
    .mention-option-description {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .mention-option-description {
        font-size: 0.85em;
        opacity: 0.7;
    }

    .mention-empty,
    .mention-loading {
        padding: var(--spacing-small, 6px) var(--spacing-medium, 8px);
        opacity: 0.7;
    }

    .mention-live {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0 0 0 0);
        white-space: nowrap;
        border: 0;
    }
`;

/**
 * Normalize a `triggers` value — an array, or the JSON string form of one —
 * into complete configs with every default filled in. Entries without a
 * `trigger` string, and duplicates of an earlier trigger, are dropped. Longer
 * triggers sort first so `@@` wins over `@` at the same position.
 *
 * @param {unknown} value
 * @returns {Array<Object>}
 */
export function normalizeTriggers(value) {
    const raw = coerceRichData(value, []);
    if (!Array.isArray(raw)) return [];

    const seen = new Set();
    const configs = [];

    for (const entry of raw) {
        if (!entry || typeof entry !== "object") continue;
        const trigger = typeof entry.trigger === "string" ? entry.trigger : "";
        if (!trigger || seen.has(trigger)) continue;

        seen.add(trigger);
        configs.push({
            trigger,
            type: typeof entry.type === "string" && entry.type ? entry.type : trigger,
            minChars: toCount(entry.minChars, 0),
            maxChars: toCount(entry.maxChars, DEFAULT_MAX_CHARS),
            allowSpaces: entry.allowSpaces === true,
            insert:
                typeof entry.insert === "string" && entry.insert
                    ? entry.insert
                    : DEFAULT_INSERT_TEMPLATE,
            atomic: entry.atomic === true,
        });
    }

    return configs.sort((a, b) => b.trigger.length - a.trigger.length);
}

/**
 * Find the trigger fragment the caret sits in, if any. Only one fragment is
 * ever active: when several triggers match, the one starting nearest the caret
 * wins.
 *
 * @param {string} text — the text the caret lives in (a block, or the value)
 * @param {number} caret — caret offset within `text`
 * @param {Array<Object>} triggers — normalized configs
 * @returns {{config: Object, trigger: string, type: string, query: string,
 *   start: number, end: number}|null}
 */
export function detectTriggerFragment(text, caret, triggers) {
    if (typeof text !== "string") return null;
    if (!Array.isArray(triggers) || triggers.length === 0) return null;

    const end = Math.max(0, Math.min(caret, text.length));
    let best = null;

    for (const config of triggers) {
        const found = findFragment(text, end, config);
        if (found && (!best || found.start > best.start)) best = found;
    }

    return best;
}

/**
 * Resolve a trigger's `insert` template against a candidate.
 *
 * The result always ends in whitespace, so the mention reads as a finished word
 * and the next keystroke starts a new one. A single space is appended only when
 * the resolved template does not already end in whitespace; whatever trailing
 * whitespace a template does specify is kept as authored rather than collapsed
 * to one space.
 *
 * @param {Object} config — normalized trigger config
 * @param {Object} candidate
 * @returns {string}
 */
export function renderMentionText(config, candidate) {
    const value = String(candidate?.value ?? "");
    const label = String(candidate?.label ?? candidate?.value ?? "");

    const text = String(config.insert ?? DEFAULT_INSERT_TEMPLATE)
        .split("{trigger}")
        .join(config.trigger)
        .split("{value}")
        .join(value)
        .split("{label}")
        .join(label);

    return /\s$/.test(text) ? text : `${text} `;
}

/**
 * Viewport rect of the caret at a character position inside a `<textarea>`. A
 * textarea has no Range API, so the text up to `index` is laid out again in an
 * off-screen mirror that copies every style affecting line breaking, and the
 * marker's offset within the mirror is mapped back onto the real control.
 *
 * @param {HTMLTextAreaElement} textarea
 * @param {number} index — character offset to measure
 * @returns {DOMRect}
 */
export function caretRectInTextarea(textarea, index) {
    const doc = textarea.ownerDocument;
    const computed = getComputedStyle(textarea);
    const mirror = doc.createElement("div");

    for (const prop of MIRRORED_STYLES) mirror.style[prop] = computed[prop];
    mirror.style.position = "absolute";
    mirror.style.top = "0";
    mirror.style.left = "-9999px";
    mirror.style.height = "auto";
    mirror.style.visibility = "hidden";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "break-word";

    const value = textarea.value;
    const at = Math.max(0, Math.min(index, value.length));
    const marker = doc.createElement("span");
    marker.textContent = CARET_MARKER;
    mirror.append(
        doc.createTextNode(value.slice(0, at)),
        marker,
        doc.createTextNode(value.slice(at)),
    );

    (textarea.parentNode ?? doc.body).appendChild(mirror);
    const markerRect = marker.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();
    mirror.remove();

    const box = textarea.getBoundingClientRect();
    const lineHeight = parseFloat(computed.lineHeight);

    return new DOMRect(
        box.left + (markerRect.left - mirrorRect.left) - textarea.scrollLeft,
        box.top + (markerRect.top - mirrorRect.top) - textarea.scrollTop,
        1,
        Number.isFinite(lineHeight) ? lineHeight : markerRect.height || 16,
    );
}

/**
 * Drives mention autocomplete for one host element.
 *
 * The adapter supplies everything host-specific:
 * - `surface` — element that carries the combobox roles while the popup is open
 * - `defaultRole` — role restored on close (`"textbox"`, or null for none)
 * - `isInactive()` — true while the host is disabled or readonly
 * - `getContext()` — `{text, caret}` at the caret, or null
 * - `getCaretRect(fragment)` — viewport rect of the caret, or null
 * - `applyInsertion({config, candidate, text, fragment})` — write the insertion
 */
export class MentionController {
    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor(host, adapter) {
        this._host = host;
        this._adapter = adapter;

        this._triggers = [];
        this._candidates = [];
        this._loading = false;
        this._queryDelay = DEFAULT_MENTION_QUERY_DELAY;

        this._activeQueryId = null;
        this._composing = false;
        this._dismissed = null;
        this._fragment = null;
        this._hasResult = false;
        this._highlight = -1;
        this._listId = `y-mentions-${++_instanceCount}`;
        this._open = false;
        this._queryKey = null;
        this._querySeq = 0;
        this._queryTimer = null;

        this._onPopupClick = this._onPopupClick.bind(this);
        this._onPopupMouseDown = this._onPopupMouseDown.bind(this);
    }

    /** Build the popup and attach it to a positioned element in the host's shadow root. */
    mount(container) {
        if (this._popover || !container) return;

        this._anchorHost = container;
        this._anchorEl = _el("div", {
            class: "mention-anchor",
            "aria-hidden": "true",
        });

        this._list = _el("div", {
            class: "mention-list",
            role: "listbox",
            id: this._listId,
            "aria-label": "Suggestions",
        });
        this._emptyEl = _el("div", { class: "mention-empty", part: "mention-empty" }, [
            _el("slot", { name: "mention-empty" }, ["No matches"]),
        ]);
        this._loadingEl = _el(
            "div",
            { class: "mention-loading", part: "mention-loading" },
            [_el("slot", { name: "mention-loading" }, ["Loading…"])],
        );

        this._popup = _el("div", { class: "mention-popup", part: "mention-popup" }, [
            this._list,
            this._emptyEl,
            this._loadingEl,
        ]);
        this._popup.addEventListener("mousedown", this._onPopupMouseDown);
        this._popup.addEventListener("click", this._onPopupClick);

        this._popover = _el(
            "y-popover",
            {
                class: "mention-popover",
                trigger: "manual",
                position: "bottom-start",
                size: "small",
                offset: "2",
                pointer: "false",
                "close-on-escape": "false",
                "close-on-outside-click": "false",
            },
            [this._popup],
        );

        this._live = _el("span", {
            class: "mention-live",
            "aria-live": "polite",
        });

        container.append(this._anchorEl, this._popover, this._live);
        this._popover.anchor = this._anchorEl;
        this._syncPopupState();
    }

    /** Tear down timers and DOM. Safe to call on a controller that never mounted. */
    destroy() {
        clearTimeout(this._queryTimer);
        this._queryTimer = null;
        this._reset();
        this._anchorEl?.remove();
        this._popover?.remove();
        this._live?.remove();
        this._anchorEl = null;
        this._popover = null;
        this._popup = null;
        this._live = null;
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {Array<Object>} Current candidate list. Assigning opens or refreshes the popup. */
    get candidates() {
        return this._candidates;
    }
    set candidates(list) {
        const next = coerceRichData(list, []);
        this._candidates = Array.isArray(next)
            ? next.filter((c) => c && typeof c === "object")
            : [];
        this._hasResult = true;
        this._loading = false;
        this._highlight = this._firstEnabledIndex();
        this._renderOptions();
        this._syncPopupState();
        this._announceCount();
    }

    /** @type {boolean} Whether the popup shows its busy state. */
    get loading() {
        return this._loading;
    }
    set loading(value) {
        this._loading = !!value;
        this._syncPopupState();
    }

    /** @type {boolean} Whether the popup is currently open. Read-only. */
    get open() {
        return this._open;
    }

    /** @type {number} Debounce in ms before `mention-query` fires. */
    get queryDelay() {
        return this._queryDelay;
    }
    set queryDelay(value) {
        const ms = Number(value);
        this._queryDelay =
            Number.isFinite(ms) && ms >= 0 ? ms : DEFAULT_MENTION_QUERY_DELAY;
    }

    /** @type {Array<Object>} Normalized trigger configs. */
    get triggers() {
        return this._triggers;
    }
    set triggers(value) {
        this._triggers = normalizeTriggers(value);
        if (this._triggers.length === 0) this.close("caret-moved");
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /** Dismiss the popup without touching the text. */
    close(reason = "caret-moved") {
        const fragment = this._fragment;

        // An explicit dismissal has to stick. The fragment is still under the
        // caret, so without remembering it the next caret or keyup refresh
        // would re-query and pop the list straight back open.
        if (reason === "escape") {
            this._dismissed = fragment ? this._fragmentKey(fragment) : null;
        }

        this._reset();
        if (!fragment) return;

        this._emit("mention-close", {
            trigger: fragment.trigger,
            type: fragment.type,
            reason,
        });
    }

    /** Composition ended — resume detection and re-evaluate the caret. */
    handleCompositionEnd() {
        this._composing = false;
        this.refresh();
    }

    /** Composition started — suspend detection until it ends. */
    handleCompositionStart() {
        this._composing = true;
    }

    /**
     * Offer a keydown to the popup.
     * @returns {boolean} whether the popup consumed the key.
     */
    handleKeyDown(event) {
        if (!this._open) return false;

        if (event.key === "Escape") {
            event.preventDefault();
            this.close("escape");
            return true;
        }

        if (this._candidates.length === 0) return false;

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            this._moveHighlight(event.key === "ArrowDown" ? 1 : -1);
            return true;
        }

        if (event.key === "Enter" || event.key === "Tab") {
            const candidate = this._candidates[this._highlight];
            if (!candidate || candidate.disabled) return false;
            event.preventDefault();
            this.insert(candidate);
            return true;
        }

        return false;
    }

    /**
     * Insert a candidate at the caret, replacing the active fragment when the
     * caret sits in one.
     * @param {Object} candidate
     * @param {string} [trigger] — trigger literal or type; defaults to the active one
     */
    insert(candidate, trigger) {
        if (!candidate || typeof candidate !== "object") return;

        const config = this._resolveConfig(trigger);
        if (!config) return;

        const fragment =
            this._fragment && this._fragment.config === config
                ? this._fragment
                : null;
        const text = renderMentionText(config, candidate);
        const range = fragment
            ? { start: fragment.start, end: fragment.end }
            : null;

        const event = new CustomEvent("mention-insert", {
            detail: {
                trigger: config.trigger,
                type: config.type,
                candidate,
                text,
                range,
            },
            bubbles: true,
            composed: true,
            cancelable: true,
        });
        const proceed = this._host.dispatchEvent(event);

        this.close("insert");
        if (!proceed) return;

        // Armed *before* the write, because the write itself can re-enter:
        // `execCommand` fires `input` synchronously, so the host's own refresh
        // runs inside `applyInsertion` and would otherwise query the text that
        // was just committed. The text can read as a live fragment on its own —
        // a one-word label under an `allowSpaces` trigger leaves `@ada ` behind,
        // whose query still holds the one space that trigger permits. Suppress
        // exactly that fragment; it comes back once the query text moves on.
        this._dismissed = JUST_INSERTED;

        this._adapter.applyInsertion({ config, candidate, text, fragment });
        this._announce(`${candidate.label ?? candidate.value} inserted`);
    }

    /**
     * Re-evaluate the caret: open, refresh, reposition, or close. Cheap enough
     * to call from every input, selection, and click handler.
     */
    refresh() {
        if (this._triggers.length === 0) return;
        if (this._composing) return;

        if (this._adapter.isInactive()) {
            this.close("blur");
            return;
        }

        const context = this._adapter.getContext();
        const fragment = context
            ? detectTriggerFragment(context.text, context.caret, this._triggers)
            : null;

        if (!fragment) {
            this._dismissed = null;
            // Ordinary typing lands here on every keystroke — skip the reset
            // when there is nothing to tear down.
            if (this._fragment || this._open) {
                this.close(this._abandonReason(context));
            }
            return;
        }

        // An insertion records its own result before that result can be
        // measured; pin it to the real key now that there is one.
        if (this._dismissed === JUST_INSERTED) {
            this._dismissed = this._fragmentKey(fragment);
            return;
        }

        // Escape, or an insertion, dismissed exactly this fragment; it reopens
        // only once the query text moves on.
        if (this._dismissed === this._fragmentKey(fragment)) return;
        this._dismissed = null;

        // A different trigger occurrence is a fresh popup, not a narrowing of
        // the current one: drop the previous results rather than flash them.
        const previous = this._fragment;
        if (
            previous &&
            (previous.type !== fragment.type || previous.start !== fragment.start)
        ) {
            this._candidates = [];
            this._hasResult = false;
            this._highlight = -1;
        }
        this._fragment = fragment;

        if (fragment.query.length < fragment.config.minChars) {
            this.close("caret-moved");
            return;
        }

        this._scheduleQuery(fragment);
        this._position();
    }

    /**
     * Supply results for a `mention-query`. A superseded or closed query is
     * ignored, so an out-of-order app response cannot repopulate the popup.
     * @param {number} id — the `id` carried by the `mention-query` event
     * @param {Array<Object>} candidates
     */
    setCandidates(id, candidates) {
        if (this._activeQueryId === null || id !== this._activeQueryId) return;
        this.candidates = candidates;
    }

    /**
     * Re-arm the suppression an insertion sets up, for a host that had to
     * rewrite the text the engine actually wrote — WebKit substitutes a
     * non-breaking space for the space ending an inserted run, and a textarea's
     * value is submitted as it reads. The rewrite changes the fragment the
     * insertion pinned, which would otherwise read as a new one and reopen the
     * popup on the mention just committed.
     */
    suppressInsertedFragment() {
        this._dismissed = JUST_INSERTED;
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    /**
     * Why a fragment stopped matching: still typing past the trigger means the
     * query outgrew the config, anything else means the caret left.
     */
    _abandonReason(context) {
        const fragment = this._fragment;
        if (!fragment || !context) return "caret-moved";

        const stillThere =
            context.caret >= fragment.end &&
            context.text.startsWith(fragment.trigger, fragment.start);
        return stillThere ? "no-match" : "caret-moved";
    }

    _announce(message) {
        if (!this._live) return;
        // A repeat of the same string is not re-announced; nudge it so the
        // count is spoken on every query.
        this._live.textContent =
            this._live.textContent === message ? `${message} ` : message;
    }

    _announceCount() {
        if (!this._open) return;
        const count = this._candidates.length;
        this._announce(
            count === 0
                ? "No matches"
                : `${count} suggestion${count === 1 ? "" : "s"} available`,
        );
    }

    _applyAria() {
        const surface = this._adapter.surface;
        if (!surface) return;

        if (this._open) {
            surface.setAttribute("role", "combobox");
            surface.setAttribute("aria-expanded", "true");
            surface.setAttribute("aria-controls", this._listId);
            surface.setAttribute("aria-autocomplete", "list");
            surface.setAttribute("aria-haspopup", "listbox");
            return;
        }

        const defaultRole = this._adapter.defaultRole;
        if (defaultRole) surface.setAttribute("role", defaultRole);
        else surface.removeAttribute("role");

        surface.removeAttribute("aria-expanded");
        surface.removeAttribute("aria-controls");
        surface.removeAttribute("aria-autocomplete");
        surface.removeAttribute("aria-haspopup");
        surface.removeAttribute("aria-activedescendant");
    }

    _emit(type, detail) {
        this._host.dispatchEvent(
            new CustomEvent(type, { detail, bubbles: true, composed: true }),
        );
    }

    _firstEnabledIndex() {
        return this._candidates.findIndex((c) => !c.disabled);
    }

    /** Identity of a fragment occurrence: which trigger, where, and what text. */
    _fragmentKey(fragment) {
        return `${fragment.type} ${fragment.start} ${fragment.query}`;
    }

    _moveHighlight(step) {
        const total = this._candidates.length;
        if (total === 0) return;

        let index = this._highlight;
        for (let attempt = 0; attempt < total; attempt += 1) {
            index = (index + step + total) % total;
            if (!this._candidates[index].disabled) {
                this._highlight = index;
                this._syncHighlight();
                return;
            }
        }
    }

    _onPopupClick(event) {
        const option = event
            .composedPath()
            .find((node) => node?.classList?.contains?.("mention-option"));
        if (!option) return;

        const index = Number(option.dataset.index);
        const candidate = this._candidates[index];
        if (!candidate || candidate.disabled) return;

        this._highlight = index;
        this.insert(candidate);
    }

    /** Keep the caret where it is: focusing the popup would collapse it. */
    _onPopupMouseDown(event) {
        event.preventDefault();
    }

    /** Park the invisible anchor on the caret so the popover tracks it. */
    _position() {
        if (!this._open || !this._anchorEl || !this._anchorHost) return;

        const rect = this._adapter.getCaretRect(this._fragment);
        if (!rect) return;

        const base = this._anchorHost.getBoundingClientRect();
        this._anchorEl.style.left = `${rect.left - base.left}px`;
        this._anchorEl.style.top = `${rect.top - base.top}px`;
        this._anchorEl.style.width = `${Math.max(rect.width, 1)}px`;
        this._anchorEl.style.height = `${Math.max(rect.height, 1)}px`;

        this._popover.updatePosition();
    }

    _renderOptions() {
        if (!this._list) return;

        const options = this._candidates.map((candidate, index) => {
            const label = String(candidate.label ?? candidate.value ?? "");
            const children = [];

            const avatar =
                typeof candidate.avatar === "string" &&
                isSafeUrl(candidate.avatar, { allowDataImage: true })
                    ? candidate.avatar
                    : null;

            if (avatar) {
                children.push(
                    _el("img", {
                        class: "mention-option-avatar",
                        part: "mention-option-avatar",
                        src: avatar,
                        alt: "",
                    }),
                );
            } else if (candidate.icon) {
                children.push(
                    _el("y-icon", {
                        class: "mention-option-avatar",
                        part: "mention-option-avatar",
                        name: String(candidate.icon),
                        size: "small",
                    }),
                );
            }

            const text = [
                _el(
                    "span",
                    {
                        class: "mention-option-label",
                        part: "mention-option-label",
                    },
                    [label],
                ),
            ];
            if (candidate.description) {
                text.push(
                    _el(
                        "span",
                        {
                            class: "mention-option-description",
                            part: "mention-option-description",
                        },
                        [String(candidate.description)],
                    ),
                );
            }
            children.push(_el("span", { class: "mention-option-text" }, text));

            return _el(
                "div",
                {
                    class: "mention-option",
                    part: "mention-option",
                    role: "option",
                    id: `${this._listId}-option-${index}`,
                    "data-index": String(index),
                    "aria-selected": "false",
                    "aria-disabled": candidate.disabled ? "true" : null,
                },
                children,
            );
        });

        this._list.replaceChildren(...options);
        this._syncHighlight();
    }

    /** Drop every trace of an active trigger and shut the popup. */
    _reset() {
        clearTimeout(this._queryTimer);
        this._queryTimer = null;
        this._activeQueryId = null;
        this._candidates = [];
        this._fragment = null;
        this._hasResult = false;
        this._highlight = -1;
        this._loading = false;
        this._queryKey = null;

        if (this._open) {
            this._open = false;
            this._applyAria();
            if (this._popover) this._popover.open = false;
        }
        this._list?.replaceChildren();
    }

    _resolveConfig(trigger) {
        if (trigger) {
            return (
                this._triggers.find(
                    (c) => c.trigger === trigger || c.type === trigger,
                ) ?? null
            );
        }
        return this._fragment?.config ?? this._triggers[0] ?? null;
    }

    /**
     * Emit `mention-query` once the fragment settles. The same fragment
     * re-evaluated (a caret nudge, a repeated selection change) does not
     * re-query.
     */
    _scheduleQuery(fragment) {
        const key = this._fragmentKey(fragment);
        if (key === this._queryKey) return;
        this._queryKey = key;

        clearTimeout(this._queryTimer);
        this._queryTimer = setTimeout(() => {
            this._queryTimer = null;
            const id = ++this._querySeq;
            this._activeQueryId = id;
            this._emit("mention-query", {
                trigger: fragment.trigger,
                type: fragment.type,
                query: fragment.query,
                id,
            });
        }, this._queryDelay);
    }

    _syncHighlight() {
        if (!this._list) return;

        const options = [...this._list.children];
        options.forEach((option, index) => {
            option.setAttribute(
                "aria-selected",
                String(index === this._highlight),
            );
        });

        const active = options[this._highlight];
        const surface = this._adapter.surface;
        if (!surface) return;

        if (active && this._open) {
            surface.setAttribute("aria-activedescendant", active.id);
            active.scrollIntoView?.({ block: "nearest" });
        } else {
            surface.removeAttribute("aria-activedescendant");
        }
    }

    /** Reconcile popup visibility, sections, and ARIA with the current state. */
    _syncPopupState() {
        if (!this._popover) return;

        const hasOptions = this._candidates.length > 0;
        this._list.hidden = !hasOptions;
        this._loadingEl.hidden = !this._loading;
        this._emptyEl.hidden = this._loading || hasOptions;

        const shouldOpen =
            !!this._fragment && (this._loading || this._hasResult);
        if (shouldOpen === this._open) {
            if (this._open) {
                this._syncHighlight();
                this._position();
            }
            return;
        }

        this._open = shouldOpen;
        this._popover.open = shouldOpen;
        this._applyAria();
        this._syncHighlight();
        if (shouldOpen) this._position();
    }
}

/**
 * Scan backwards from the caret for `config`'s trigger. The query may only
 * grow as the scan moves left, so the first invalid query ends the search.
 */
function findFragment(text, caret, config) {
    const { trigger } = config;
    const floor = Math.max(0, caret - trigger.length - config.maxChars);

    for (let start = caret - trigger.length; start >= floor; start -= 1) {
        const query = text.slice(start + trigger.length, caret);
        if (!isQueryable(query, config)) return null;
        if (!text.startsWith(trigger, start)) continue;
        if (!isBoundaryChar(text[start - 1])) continue;

        return {
            config,
            trigger,
            type: config.type,
            query,
            start,
            end: caret,
        };
    }

    return null;
}

/** A trigger only activates at start of text, after whitespace, or after an opener. */
function isBoundaryChar(char) {
    if (char === undefined) return true;
    return /\s/.test(char) || OPENING_CHARS.has(char);
}

/**
 * Whether a fragment is still a live query: within `maxChars`, on one line, and
 * carrying at most the one interior space `allowSpaces` permits.
 */
function isQueryable(query, { maxChars, allowSpaces }) {
    if (query.length > maxChars) return false;
    if (/[\n\r\t]/.test(query)) return false;
    if (!allowSpaces) return !/\s/.test(query);
    return (query.match(/ /g)?.length ?? 0) <= 1;
}

function toCount(value, fallback) {
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 ? Math.floor(count) : fallback;
}
