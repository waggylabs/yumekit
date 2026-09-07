import {
    applyControlError,
    createElement as _el,
    forwardControlAttributes,
    manageLabelVisibility,
    upgradeProperties,
} from "../../modules/helpers.js";
import {
    DEFAULT_CURRENCY,
    currencyPrecision,
    decimalToMinorUnits,
    formatMoney,
    minorUnitsToDecimal,
    roundDecimal,
} from "../../modules/money.js";

const CURRENCY_DISPLAYS = ["symbol", "code", "name", "none"];
const MAX_PRECISION = 20;

export class YumeMoney extends HTMLElement {
    static formAssociated = true;

    static get observedAttributes() {
        return [
            "value",
            "currency",
            "locale",
            "precision",
            "display",
            "allow-negative",
            "negative-style",
            "step",
            "min",
            "max",
            "size",
            "variant",
            "label-position",
            "name",
            "placeholder",
            "disabled",
            "required",
            "invalid",
            "error-text",
            "autocomplete",
            "aria-label",
            "aria-labelledby",
        ];
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._focused = false;
        this._reflecting = false;
        this._value = "";
        this._valueAtFocus = "";
        this.attachShadow({ mode: "open" });
        this.render();
    }

    connectedCallback() {
        upgradeProperties(this);
        if (!this.hasAttribute("size")) this.setAttribute("size", "medium");
        if (!this.hasAttribute("label-position"))
            this.setAttribute("label-position", "top");
        this._value = this._normalize(this.getAttribute("value") || "");
        if (this._defaultValue === undefined) this._defaultValue = this._value;
        this._internals.setFormValue(this._value, this.getAttribute("name"));
        this._updateDisplay();
        this._updateValidationState();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            if (this._reflecting) return;
            this._value = this._normalize(newValue || "");
            this._internals.setFormValue(this._value, this.getAttribute("name"));
            this._updateDisplay();
            this._updateValidationState();
            return;
        }

        if (name === "name") {
            this._internals.setFormValue(this._value, newValue);
            return;
        }

        if (name === "error-text") {
            this._updateErrorText();
            return;
        }

        if (name === "invalid" || name === "required") {
            forwardControlAttributes(this, this.input);
            this._updateValidationState();
            return;
        }

        // Re-rendering here would replace the <input>, dropping focus, caret
        // position, and IME composition — exactly what a form does on submit.
        if (name === "disabled") {
            if (this.input) this.input.disabled = this.disabled;
            this._updateValidationState();
            return;
        }

        if (name === "placeholder") {
            if (this.input) {
                if (newValue != null) this.input.placeholder = newValue;
                else this.input.removeAttribute("placeholder");
            }
            return;
        }

        if (name === "autocomplete" || name.startsWith("aria-")) {
            forwardControlAttributes(this, this.input);
            return;
        }

        // Currency, locale, precision, display, negative-style, min, max and
        // step all change how the same canonical value reads or validates —
        // none of them need a new shadow tree.
        if (name !== "size" && name !== "variant" && name !== "label-position") {
            if (name === "precision" || name === "currency")
                this._value = this._normalize(this._value);
            this._updateDisplay();
            this._updateValidationState();
            return;
        }

        this.render();
    }

    formResetCallback() {
        this._setValue(this._defaultValue || "");
        this._updateDisplay();
        this._updateValidationState();
    }

    // -------------------------------------------------------------------------
    // Getters / Setters
    // -------------------------------------------------------------------------

    /** @type {boolean} Whether a leading minus is accepted (default false). */
    get allowNegative() {
        return this.hasAttribute("allow-negative");
    }
    set allowNegative(val) {
        if (val) this.setAttribute("allow-negative", "");
        else this.removeAttribute("allow-negative");
    }

    /** @type {string} ISO 4217 currency code (default "USD"). */
    get currency() {
        return this.getAttribute("currency") || DEFAULT_CURRENCY;
    }
    set currency(val) {
        this.setAttribute("currency", val);
    }

    /** @type {boolean} Whether the field is disabled. */
    get disabled() {
        return this.hasAttribute("disabled");
    }
    set disabled(val) {
        if (val) this.setAttribute("disabled", "");
        else this.removeAttribute("disabled");
    }

    /**
     * @type {"symbol"|"code"|"name"|"none"} How the currency reads in the idle
     * display: `$1,234.56`, `USD 1,234.56`, `1,234.56 US dollars`, or a bare
     * `1,234.56`.
     */
    get display() {
        const val = this.getAttribute("display");
        return CURRENCY_DISPLAYS.includes(val) ? val : "symbol";
    }
    set display(val) {
        this.setAttribute("display", val);
    }

    /**
     * @type {string} Validation message shown below the field. A non-empty
     * value also puts the field in the invalid state and becomes its accessible
     * description.
     */
    get errorText() {
        return this.getAttribute("error-text") || "";
    }
    set errorText(val) {
        if (val == null || val === "") this.removeAttribute("error-text");
        else this.setAttribute("error-text", val);
    }

    /** @type {string} The idle display string for the current value. */
    get formattedValue() {
        return this._value === "" ? "" : this._format(this._value);
    }

    /** @type {boolean} Whether the field is forced into the invalid state. */
    get invalid() {
        return this.hasAttribute("invalid");
    }
    set invalid(val) {
        if (val) this.setAttribute("invalid", "");
        else this.removeAttribute("invalid");
    }

    /** @type {string} Label position: "top" | "bottom" (default "top"). */
    get labelPosition() {
        return this.getAttribute("label-position") || "top";
    }
    set labelPosition(val) {
        this.setAttribute("label-position", val);
    }

    /** @type {string|undefined} BCP 47 tag; undefined means the browser locale. */
    get locale() {
        return this.getAttribute("locale") || undefined;
    }
    set locale(val) {
        if (val == null || val === "") this.removeAttribute("locale");
        else this.setAttribute("locale", val);
    }

    /** @type {string} Decimal-string upper bound, or "" for none. */
    get max() {
        return this.getAttribute("max") || "";
    }
    set max(val) {
        if (val == null || val === "") this.removeAttribute("max");
        else this.setAttribute("max", val);
    }

    /** @type {string} Decimal-string lower bound, or "" for none. */
    get min() {
        return this.getAttribute("min") || "";
    }
    set min(val) {
        if (val == null || val === "") this.removeAttribute("min");
        else this.setAttribute("min", val);
    }

    /** @type {string} The form field name. */
    get name() {
        return this.getAttribute("name") || "";
    }
    set name(val) {
        this.setAttribute("name", val);
    }

    /**
     * @type {"minus"|"parentheses"} Idle rendering of negatives: `-$5.00` or
     * `($5.00)`. Editing always uses a minus.
     */
    get negativeStyle() {
        return this.getAttribute("negative-style") === "parentheses"
            ? "parentheses"
            : "minus";
    }
    set negativeStyle(val) {
        this.setAttribute(
            "negative-style",
            val === "parentheses" ? "parentheses" : "minus",
        );
    }

    /** @type {string} Hint text shown when the field is empty. */
    get placeholder() {
        return this.getAttribute("placeholder") || "";
    }
    set placeholder(val) {
        if (val == null || val === "") this.removeAttribute("placeholder");
        else this.setAttribute("placeholder", val);
    }

    /** @type {number} Decimal places; defaults to the currency's exponent. */
    get precision() {
        return this._resolvedPrecision();
    }
    set precision(val) {
        if (val == null || val === "") this.removeAttribute("precision");
        else this.setAttribute("precision", String(val));
    }

    /** @type {boolean} Whether an empty value fails validation. */
    get required() {
        return this.hasAttribute("required");
    }
    set required(val) {
        if (val) this.setAttribute("required", "");
        else this.removeAttribute("required");
    }

    /** @type {string} Field size: "small" | "medium" | "large" (default "medium"). */
    get size() {
        return this.getAttribute("size") || "medium";
    }
    set size(val) {
        this.setAttribute("size", val);
    }

    /** @type {string} Arrow-key increment as a decimal string (default "1"). */
    get step() {
        return this.getAttribute("step") || "1";
    }
    set step(val) {
        if (val == null || val === "") this.removeAttribute("step");
        else this.setAttribute("step", String(val));
    }

    /** @type {string} The current validation message, or "" when valid. */
    get validationMessage() {
        return this._internals.validationMessage;
    }

    /** @type {ValidityState} The field's validity state. */
    get validity() {
        return this._internals.validity;
    }

    /**
     * @type {string} Canonical decimal string — always `.` as the decimal
     * separator, no grouping, e.g. `"1234.56"`. Empty string means no value,
     * which is distinct from `"0"`.
     */
    get value() {
        return this._value;
    }
    set value(val) {
        this._setValue(this._normalize(val == null ? "" : String(val)));
        this._updateDisplay();
        this._updateValidationState();
    }

    /**
     * @type {number} The value in integer minor units (`1234.56` → `123456`),
     * derived with integer math rather than float multiplication. `NaN` when
     * the field is empty.
     */
    get valueAsMinorUnits() {
        if (this._value === "") return NaN;
        return Number(
            decimalToMinorUnits(this._value, this._resolvedPrecision()),
        );
    }

    /** @type {number} The value as a float, or `NaN` when the field is empty. */
    get valueAsNumber() {
        return this._value === "" ? NaN : Number(this._value);
    }

    /**
     * @type {"default"|"underline"} Field style. `"default"` is a full border;
     * `"underline"` shows only a bottom border with square bottom corners.
     */
    get variant() {
        return this.getAttribute("variant") === "underline"
            ? "underline"
            : "default";
    }
    set variant(val) {
        this.setAttribute(
            "variant",
            val === "underline" ? "underline" : "default",
        );
    }

    // -------------------------------------------------------------------------
    // Public
    // -------------------------------------------------------------------------

    /**
     * Checks the field's validity without surfacing a message.
     * @returns {boolean} Whether the field is valid.
     */
    checkValidity() {
        return this._internals.checkValidity();
    }

    render() {
        const size = this.getAttribute("size") || "medium";
        const labelPosition = this.getAttribute("label-position") || "top";
        const isDisabled = this.hasAttribute("disabled");
        const isLabelTop = labelPosition === "top";

        const paddingVar = this._getPaddingVar(size);
        const minHeightVar = this._getMinHeightVar(size);

        this.shadowRoot.adoptedStyleSheets = [
            this._buildStyleSheet(paddingVar, minHeightVar),
        ];
        this.shadowRoot.replaceChildren(
            this._buildTree(isLabelTop, isDisabled),
        );

        this.input = this.shadowRoot.querySelector("input");
        this.inputContainer = this.shadowRoot.querySelector(".input-container");
        this.labelWrapper = this.shadowRoot.querySelector(".label-wrapper");
        this.errorElement = this.shadowRoot.querySelector(".error-text");

        manageLabelVisibility(this.labelWrapper);
        forwardControlAttributes(this, this.input);
        this._updateErrorText();
        this._bindListeners();
        this._updateDisplay();
        this._updateValidationState();
    }

    /**
     * Checks validity and, when invalid, surfaces the message to the user.
     * @returns {boolean} Whether the field is valid.
     */
    reportValidity() {
        return this._internals.reportValidity();
    }

    /**
     * Decrements the value by `step`, clamped to `min` / `max`.
     * @param {number} [multiplier=1] — number of steps to apply.
     */
    stepDown(multiplier = 1) {
        this._step(-multiplier);
    }

    /**
     * Increments the value by `step`, clamped to `min` / `max`.
     * @param {number} [multiplier=1] — number of steps to apply.
     */
    stepUp(multiplier = 1) {
        this._step(multiplier);
    }

    // -------------------------------------------------------------------------
    // Private
    // -------------------------------------------------------------------------

    _bindListeners() {
        this.inputContainer.addEventListener("mousedown", (e) => {
            if (e.target !== this.input) {
                e.preventDefault();
                this.input.focus();
            }
        });

        this.input.addEventListener("focus", () => {
            this._focused = true;
            this._valueAtFocus = this._value;
            this._updateDisplay();
        });

        this.input.addEventListener("blur", () => {
            this._focused = false;
            this._commit();
        });

        this.input.addEventListener("input", (e) => {
            const raw = this.input.value;
            const fromPaste = e.inputType === "insertFromPaste";
            const clean = this._filterEditing(raw, fromPaste);

            // Rewriting the field drops the caret to the end, so re-place it
            // after however many accepted characters preceded it.
            if (clean !== raw) {
                const caret = this.input.selectionStart ?? raw.length;
                const kept = this._filterEditing(
                    raw.slice(0, caret),
                    fromPaste,
                ).length;
                this.input.value = clean;
                this.input.setSelectionRange(kept, kept);
            }

            this._setValue(this._canonicalFromEditing(clean));
            this._updateValidationState();
            this._emit("input");
        });

        this.input.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                this._step(1);
                return;
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                this._step(-1);
                return;
            }
            if (e.key === "Enter") this._commit();
        });
    }

    _buildStyleSheet(paddingVar, minHeightVar) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(`
            :host([hidden]) {
                display: none;
            }

            :host {
                display: block;
                font-family: var(--font-family-body);
                color: var(--component-input-color);
                opacity: 1;
                pointer-events: auto;
            }

            /* Expressed as a selector, not interpolated, so toggling disabled
               never has to rebuild the shadow tree. */
            :host([disabled]) {
                opacity: 0.75;
                pointer-events: none;
            }

            .input-wrapper {
                position: relative;
                display: flex;
                flex-direction: column;
                height: 100%;
            }

            .label-wrapper {
                display: none;
                margin-bottom: var(--spacing-2x-small, 4px);
            }

            .input-container {
                flex: 1;
                display: flex;
                align-items: center;
                gap: var(--spacing-x-small);
                background: var(--component-input-background);
                /* Style + color via the shorthand (fixed, always-valid 1px
                   width); real width as a longhand so
                   --component-inputs-border-width accepts a 1–4 value pattern
                   for per-side widths. */
                border: 1px solid var(--component-input-border-color);
                border-width: var(--component-inputs-border-width, 1px);
                border-radius: var(--component-inputs-border-radius-outer);
                padding: var(${paddingVar});
                min-height: ${minHeightVar};
                box-sizing: border-box;
                transition: border-color 0.2s ease-in-out;
            }

            :host([disabled]) .input-container {
                background: var(--component-input-background-disabled);
            }

            :host([variant="underline"]) .input-container {
                border-style: none;
                border-bottom-style: solid;
                border-radius: var(--component-inputs-border-radius-outer) var(--component-inputs-border-radius-outer) 0 0;
            }

            .input-container.is-invalid {
                border-color: var(--component-input-error-border-color);
                background: var(--component-input-error-background);
            }

            .input-container.is-invalid input {
                color: var(--component-input-error-color);
            }

            .input-container.is-invalid:hover,
            .input-container.is-invalid:focus-within {
                border-color: var(--component-input-error-color);
            }

            .input-container.is-invalid:focus-within input {
                color: var(--component-input-color);
            }

            input {
                all: unset;
                flex: 1;
                font-family: inherit;
                font-size: 1em;
                font-variant-numeric: tabular-nums;
                color: inherit;
                min-width: 0;
                min-height: 20px;
            }

            input::placeholder {
                color: var(--component-input-placeholder-color);
                opacity: 1;
            }

            /* Negatives read in the accounting color while idle. The editing
               view stays in the normal text color so a typed minus does not
               recolor the field mid-keystroke. */
            .input-container.is-negative:not(:focus-within) input {
                color: var(--component-money-negative-color, var(--error-content));
            }

            .input-container:hover {
                border-color: var(--component-input-color);
                transition: border-color 0.2s ease-in-out;
            }

            .input-container:focus-within {
                border-color: var(--component-input-accent);
            }

            .label-wrapper.is-invalid ::slotted([slot="label"]) {
                color: var(--component-input-error-color);
            }

            .error-text {
                margin-top: var(--spacing-2x-small, 4px);
                font-size: 0.8em;
                color: var(--component-input-error-color);
            }

            .error-text[hidden] {
                display: none;
            }

            ::slotted([slot="label"]) {
                font-weight: 500;
                font-size: 0.875em;
                color: var(--component-input-label-color);
            }

            ::slotted([slot="left-icon"]),
            ::slotted([slot="right-icon"]) {
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--component-input-icon-color);
            }
        `);
        return sheet;
    }

    _buildTree(isLabelTop, isDisabled) {
        const buildLabelSlot = () =>
            _el("div", { class: "label-wrapper" }, [
                _el("slot", { name: "label" }),
            ]);

        const input = _el("input", {
            part: "input",
            type: "text",
            inputmode: "decimal",
            autocomplete: "off",
            spellcheck: "false",
            disabled: isDisabled || null,
        });
        const placeholder = this.getAttribute("placeholder");
        if (placeholder != null) input.setAttribute("placeholder", placeholder);

        const container = _el("div", { class: "input-container" }, [
            _el("slot", { name: "left-icon" }),
            input,
            _el("slot", { name: "right-icon" }),
        ]);

        const error = _el("div", {
            class: "error-text",
            part: "error-text",
            id: "error-text",
            "aria-live": "polite",
            hidden: true,
        });

        const children = [];
        if (isLabelTop) children.push(buildLabelSlot());
        children.push(container);
        if (!isLabelTop) children.push(buildLabelSlot());
        children.push(error);

        return _el("div", { class: "input-wrapper" }, children);
    }

    /**
     * Convert the visible editing text into the canonical decimal string.
     * Partial entries ("-", "12.") collapse to something a form can carry.
     */
    _canonicalFromEditing(text) {
        const { decimal } = this._separators();
        const canonical = text.split(decimal).join(".");

        if (!/\d/.test(canonical)) return "";
        if (canonical.startsWith(".")) return `0${canonical}`;
        if (canonical.startsWith("-.")) return `-0${canonical.slice(1)}`;
        return canonical;
    }

    /**
     * Round to `precision` and repaint. Fires `change` when the value differs
     * from what it was when the field took focus, matching native semantics.
     */
    _commit() {
        const rounded =
            this._value === ""
                ? ""
                : roundDecimal(this._value, this._resolvedPrecision());
        if (rounded !== this._value) this._setValue(rounded);

        this._updateDisplay();
        this._updateValidationState();

        if (this._value !== this._valueAtFocus) {
            this._valueAtFocus = this._value;
            this._emit("change");
        }
    }

    /**
     * Compare two decimal strings exactly, via integer minor units.
     * @returns {number} -1, 0, or 1.
     */
    _compare(a, b) {
        const precision = this._resolvedPrecision();
        const av = BigInt(decimalToMinorUnits(a, precision));
        const bv = BigInt(decimalToMinorUnits(b, precision));
        return av < bv ? -1 : av > bv ? 1 : 0;
    }

    _editingFromCanonical(dec) {
        const { decimal } = this._separators();
        return dec.split(".").join(decimal);
    }

    _emit(type) {
        this.dispatchEvent(
            new CustomEvent(type, {
                detail: {
                    value: this._value,
                    valueAsNumber: this.valueAsNumber,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    /**
     * Reduce arbitrary text to something valid to have in the field mid-edit:
     * an optional leading minus, digits, and at most one decimal separator
     * followed by no more than `precision` digits.
     *
     * Group separators are always dropped. A `.` typed on a numeric keypad is
     * accepted as the decimal separator unless the locale uses `.` for
     * grouping, where it would be ambiguous.
     */
    _filterEditing(str, fromPaste = false) {
        const { decimal, group } = this._separators();
        const precision = this._resolvedPrecision();
        const periodIsDecimal = decimal === "." || group !== ".";

        let body = str.replace(/[\s\u00a0\u202f]/g, "");
        const negative = this.allowNegative && body.startsWith("-");
        body = body.replace(/^-/, "");
        if (fromPaste && group) body = body.split(group).join("");

        let out = "";
        let seenDecimal = false;
        let fractionDigits = 0;

        for (const ch of body) {
            if (ch >= "0" && ch <= "9") {
                if (seenDecimal) {
                    if (fractionDigits >= precision) continue;
                    fractionDigits++;
                }
                out += ch;
                continue;
            }

            const isDecimalChar =
                ch === decimal || (ch === "." && periodIsDecimal);
            if (isDecimalChar && !seenDecimal && precision > 0) {
                seenDecimal = true;
                out += decimal;
            }
        }

        return (negative ? "-" : "") + out;
    }

    /**
     * Filter for programmatic values, which arrive canonical rather than
     * locale-formatted, so `.` is always the decimal separator here. The sign
     * is preserved whatever `allow-negative` says — `_normalize` decides what
     * to do with it.
     *
     * One digit past `precision` is kept so half-up rounding still has the
     * digit it needs to inspect.
     */
    _filterEditingLoose(str) {
        const { decimal } = this._separators();
        const precision = this._resolvedPrecision();
        const negative = str.trim().startsWith("-");

        let out = "";
        let seenDecimal = false;
        let fractionDigits = 0;

        for (const ch of str.replace(/^\s*-/, "")) {
            if (ch >= "0" && ch <= "9") {
                if (seenDecimal) {
                    if (fractionDigits >= precision + 1) continue;
                    fractionDigits++;
                }
                out += ch;
                continue;
            }
            if (ch === "." && !seenDecimal && precision > 0) {
                seenDecimal = true;
                out += decimal;
            }
        }

        return (negative ? "-" : "") + out;
    }

    /**
     * Render a canonical decimal for the idle display. The decimal string is
     * handed to Intl directly rather than via `Number`, so large amounts keep
     * every digit.
     */
    _format(dec) {
        const precision = this._resolvedPrecision();
        return formatMoney(decimalToMinorUnits(dec, precision), {
            currency: this._resolvedCurrency(),
            locale: this.locale,
            display: this.display,
            sign: this.negativeStyle === "parentheses" ? "parentheses" : "auto",
            precision,
        });
    }

    _getMinHeightVar(size) {
        const map = {
            small: "var(--component-control-height-small, var(--sizing-small, 32px))",
            medium: "var(--component-control-height-medium, var(--sizing-medium, 40px))",
            large: "var(--component-control-height-large, var(--sizing-large, 56px))",
        };
        return map[size] || map.medium;
    }

    _getPaddingVar(size) {
        const map = {
            small: "--component-inputs-padding-small",
            medium: "--component-inputs-padding-medium",
            large: "--component-inputs-padding-large",
        };
        return map[size] || map.medium;
    }

    /** Canonicalize arbitrary input and round it to `precision`. */
    _normalize(val) {
        const canonical = this._canonicalFromEditing(
            this._filterEditingLoose(String(val)),
        );
        if (canonical === "") return "";

        const precision = this._resolvedPrecision();
        const rounded = roundDecimal(canonical, precision);

        // A negative assigned to a field that does not take them clamps to
        // zero rather than silently flipping sign.
        if (!this.allowNegative && rounded.startsWith("-"))
            return roundDecimal("0", precision);
        return rounded;
    }

    _resolvedCurrency() {
        const code = this.currency;
        try {
            new Intl.NumberFormat(this.locale, {
                style: "currency",
                currency: code,
            });
            return code;
        } catch {
            // Formatting runs on every repaint, so warn once per bad code
            // rather than once per keystroke.
            if (this._warnedCurrency !== code) {
                this._warnedCurrency = code;
                console.warn(
                    `<y-money>: unknown currency "${code}", falling back to ${DEFAULT_CURRENCY}.`,
                );
            }
            return DEFAULT_CURRENCY;
        }
    }

    _resolvedPrecision() {
        const attr = this.getAttribute("precision");
        if (attr != null && attr !== "") {
            const parsed = Number.parseInt(attr, 10);
            if (Number.isFinite(parsed) && parsed >= 0)
                return Math.min(parsed, MAX_PRECISION);
        }

        return currencyPrecision(this.currency, this.locale);
    }

    _separators() {
        const cacheKey = `${this.locale || ""}`;
        if (this._separatorCache?.key === cacheKey)
            return this._separatorCache.value;

        let decimal = ".";
        let group = ",";
        try {
            const parts = new Intl.NumberFormat(this.locale, {
                minimumFractionDigits: 1,
            }).formatToParts(11111.1);
            decimal = parts.find((p) => p.type === "decimal")?.value || ".";
            group = parts.find((p) => p.type === "group")?.value || "";
        } catch {
            /* fall through to the en-US defaults */
        }

        const value = { decimal, group };
        this._separatorCache = { key: cacheKey, value };
        return value;
    }

    _setValue(dec) {
        this._value = dec;
        this._internals.setFormValue(dec, this.getAttribute("name"));

        this._reflecting = true;
        if (dec === "") this.removeAttribute("value");
        else this.setAttribute("value", dec);
        this._reflecting = false;
    }

    _step(multiplier) {
        if (this.disabled || !Number.isFinite(multiplier)) return;

        const precision = this._resolvedPrecision();
        const stepMinor = BigInt(
            decimalToMinorUnits(this._normalize(this.step) || "0", precision),
        );
        if (stepMinor === 0n) return;

        const base = this._value === "" ? "0" : this._value;
        let next =
            BigInt(decimalToMinorUnits(base, precision)) +
            stepMinor * BigInt(Math.trunc(multiplier));

        if (!this.allowNegative && next < 0n) next = 0n;
        if (this.min !== "") {
            const floor = BigInt(decimalToMinorUnits(this.min, precision));
            if (next < floor) next = floor;
        }
        if (this.max !== "") {
            const ceiling = BigInt(decimalToMinorUnits(this.max, precision));
            if (next > ceiling) next = ceiling;
        }

        const before = this._value;
        this._setValue(minorUnitsToDecimal(next.toString(), precision));
        if (this._value === before) return;

        this._updateDisplay();
        this._updateValidationState();
        this._emit("input");
        this._emit("change");
    }

    _updateDisplay() {
        if (!this.input) return;

        this.input.value = this._focused
            ? this._editingFromCanonical(this._value)
            : this.formattedValue;

        this.inputContainer?.classList.toggle(
            "is-negative",
            this._value.startsWith("-"),
        );
    }

    _updateErrorText() {
        applyControlError(this.input, this.errorElement, this.errorText);
        this._updateValidationState();
    }

    _updateValidationState() {
        const isManuallyInvalid =
            this.hasAttribute("invalid") || this.errorText !== "";
        const flags = {};
        let message = "";

        if (this.required && this._value === "") {
            flags.valueMissing = true;
            message = "Please enter an amount.";
        } else if (this._value !== "") {
            if (this.min !== "" && this._compare(this._value, this.min) < 0) {
                flags.rangeUnderflow = true;
                message = `Value must be ${this._format(this.min)} or more.`;
            } else if (
                this.max !== "" &&
                this._compare(this._value, this.max) > 0
            ) {
                flags.rangeOverflow = true;
                message = `Value must be ${this._format(this.max)} or less.`;
            }
        }

        if (isManuallyInvalid) {
            flags.customError = true;
            message = this.errorText || message || "Invalid amount.";
        }

        const isValid = Object.keys(flags).length === 0;
        this._internals.setValidity(
            isValid ? {} : flags,
            isValid ? "" : message,
            this.input || undefined,
        );

        // A pristine empty `required` field is not painted as an error — that
        // only lands once something asks for it (a form submit setting
        // `error-text`/`invalid`). Range violations show as soon as they exist.
        const isInvalid =
            isManuallyInvalid || !!(flags.rangeUnderflow || flags.rangeOverflow);

        this.inputContainer?.classList.toggle("is-invalid", isInvalid);
        this.labelWrapper?.classList.toggle("is-invalid", isInvalid);
    }

}

if (!customElements.get("y-money")) {
    customElements.define("y-money", YumeMoney);
}
