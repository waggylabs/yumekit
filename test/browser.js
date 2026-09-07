/**
 * Helpers that paper over engine differences in the *test harness* — not in the
 * library. Everything here exists because a browser refuses to let a script
 * synthesize something a user can do for real. Keep component behaviour out of
 * this file: if a workaround would hide a genuine rendering or API difference,
 * fix the component instead.
 */

import { sendKeys } from "@web/test-runner-commands";

/**
 * Whether the engine implements a native input of this `type`.
 *
 * An engine without one falls back to `text`, which changes both `input.type`
 * and how typed characters are read back — `06/15/2022` stays as typed instead
 * of parsing to `2022-06-15`. A test that needs the native control asks first
 * rather than asserting a capability the build lacks. Note that this only
 * reports what the type reflects to; see `supportsTypedDateInput` for whether
 * the control can actually be typed into.
 */
export function supportsInputType(type) {
    const input = document.createElement("input");
    input.setAttribute("type", type);
    return input.type === type;
}

let typedDateSupport = null;

/**
 * Whether a date can be entered into a native date input by typing.
 *
 * Playwright's WebKit build reflects `type="date"` but draws a plain text
 * field with no segments, so keystrokes land as free text that value
 * sanitization then discards, leaving `value` empty. Reflection alone
 * therefore says nothing about whether the control is typeable, so this
 * probes it for real, once per session.
 */
export async function supportsTypedDateInput() {
    if (typedDateSupport !== null) return typedDateSupport;
    if (!supportsInputType("date")) {
        typedDateSupport = false;
        return typedDateSupport;
    }

    const probe = document.createElement("input");
    probe.type = "date";
    document.body.appendChild(probe);
    probe.focus();
    await sendKeys({ type: "06/15/2022" });
    typedDateSupport = probe.value === "2022-06-15";
    probe.remove();

    return typedDateSupport;
}

/**
 * Install `range` as the selection, returning it.
 *
 * WebKit silently drops `Selection.addRange()` when the range points into a
 * shadow tree: `rangeCount` stays 0, `getComposedRanges()` reports nothing, and
 * a component reading the selection sees no caret at all. `setBaseAndExtent()`
 * takes the same two positions, works in every engine, and produces a selection
 * WebKit does expose through `getComposedRanges()`. A real user selection is
 * unaffected — the browser installs that one itself.
 *
 * @param {Range} range
 * @param {Document|ShadowRoot} [root] — the tree whose selection to set;
 *   Chromium exposes a per-shadow-root selection, other engines the document's
 */
export function selectRange(range, root = document) {
    const selection = root.getSelection
        ? root.getSelection()
        : document.getSelection();

    selection.removeAllRanges();
    selection.setBaseAndExtent(
        range.startContainer,
        range.startOffset,
        range.endContainer,
        range.endOffset,
    );

    return range;
}

/**
 * Build a `paste` event carrying `data` (a `{mimeType: value}` map).
 *
 * Firefox ignores the `clipboardData` member of the init dictionary and hands
 * the listener a fresh, empty `DataTransfer`, so a synthesized paste arrives
 * with no payload. Real pastes are unaffected — the browser populates them
 * itself — so the payload is reattached here rather than worked around in the
 * components, which read `event.clipboardData` exactly as they should.
 */
export function pasteEvent(data) {
    const transfer = new DataTransfer();
    for (const [type, value] of Object.entries(data)) {
        transfer.setData(type, value);
    }

    const event = new ClipboardEvent("paste", {
        clipboardData: transfer,
        bubbles: true,
        cancelable: true,
    });

    const delivered = event.clipboardData;
    const carriedPayload =
        delivered && delivered.types.length === transfer.types.length;
    if (!carriedPayload) {
        Object.defineProperty(event, "clipboardData", { value: transfer });
    }

    return event;
}
