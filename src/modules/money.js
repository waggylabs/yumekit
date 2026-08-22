/**
 * Currency parsing, rounding and formatting.
 *
 * The rule the module exists to enforce: an amount is an integer number of minor
 * units plus a currency code, never a float. `12.34` has already lost the cent a
 * balance is supposed to reconcile, so a non-integer amount is rejected rather
 * than rounded into a plausible-looking wrong number.
 *
 * Every amount reaches `Intl` as a decimal string rather than a `Number`, which
 * is what keeps a balance past 2^53 exact. Rounding is half-away-from-zero over
 * digits — going through a float is what turns 1.005 into 1.00.
 *
 * `y-money` is the first consumer, not the owner: a component that displays an
 * amount without collecting one needs the same rules, and an input is the wrong
 * shape for a ledger row.
 */

/** Currency used when none is given, or when the given one is unusable. */
export const DEFAULT_CURRENCY = "USD";

/** What `currencyDisplay` accepts; anything else falls back to the symbol. */
const CURRENCY_DISPLAYS = ["symbol", "narrowSymbol", "code", "name"];

/** `Intl` rejects a fraction-digit count outside this range. */
const MAX_PRECISION = 20;

const INTEGER = /^[+-]?\d+$/;

/**
 * Resolved minor-unit precision per `currency|locale`. Building an
 * `Intl.NumberFormat` only to read `resolvedOptions()` is not free, and a ledger
 * asks the same question once per row.
 */
const precisionCache = new Map();

/**
 * The currency's minor-unit exponent — USD 2, JPY 0, KWD 3 — read off `Intl`
 * rather than a table this package would have to maintain against ISO 4217. An
 * unknown or malformed code resolves to 2 rather than throwing.
 * @param {string} [currency] — ISO 4217 code
 * @param {string} [locale] — BCP 47 tag; the platform default when omitted
 * @returns {number}
 */
export function currencyPrecision(currency = DEFAULT_CURRENCY, locale) {
    const key = `${currency}|${locale ?? ""}`;

    const cached = precisionCache.get(key);
    if (cached !== undefined) return cached;

    let digits;
    try {
        digits = new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
        }).resolvedOptions().maximumFractionDigits;
    } catch {
        digits = 2;
    }

    precisionCache.set(key, digits);
    return digits;
}

/**
 * A decimal string as exact integer minor units — `("1234.56", 2)` is
 * `"123456"`. The input is rounded to `precision` first, so a longer fraction
 * loses its tail to the rounding rule rather than to truncation.
 * @param {string|number} dec
 * @param {number} precision
 * @returns {string}
 */
export function decimalToMinorUnits(dec, precision) {
    const rounded = roundDecimal(dec || "0", precision);
    const negative = rounded.startsWith("-");
    const magnitude = negative ? rounded.slice(1) : rounded;

    const [int = "0", frac = ""] = magnitude.split(".");
    const digits =
        (int + frac.padEnd(precision, "0")).replace(/^0+(?=\d)/, "") || "0";

    return (negative ? "-" : "") + digits;
}

/**
 * An amount as its localized string — `formatMoney(-1234, { currency: "USD" })`
 * is `"-$12.34"`.
 *
 * `sign` picks how a debit reads: `"auto"` lets the locale place its own minus,
 * `"always"` marks credits too (as `exceptZero` — a zero amount with a `+` in
 * front of it reads as a credit that never happened), `"never"` drops the sign,
 * `"accounting"` hands the parentheses to `Intl`, which knows where the locale
 * puts them, and `"parentheses"` wraps the whole figure.
 *
 * @param {number|string|bigint} value — integer minor units, signed
 * @param {{
 *     currency?: string,
 *     locale?: string,
 *     display?: "symbol"|"narrowSymbol"|"code"|"name"|"none",
 *     sign?: "auto"|"always"|"never"|"accounting"|"parentheses",
 *     precision?: number,
 * }} [options]
 * @returns {string} — empty string for anything that isn't integer minor units
 */
export function formatMoney(value, options = {}) {
    const {
        currency = DEFAULT_CURRENCY,
        locale,
        display = "symbol",
        sign = "auto",
        precision,
    } = options;

    const minor = toMinorUnits(value);
    if (minor === null) return "";

    const digits =
        Number.isInteger(precision) && precision >= 0
            ? Math.min(precision, MAX_PRECISION)
            : currencyPrecision(currency, locale);

    const parenthesize = sign === "parentheses" && minor.startsWith("-");
    const decimal = minorUnitsToDecimal(
        parenthesize ? minor.slice(1) : minor,
        digits,
    );

    const format = {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
        signDisplay:
            sign === "always"
                ? "exceptZero"
                : sign === "never"
                  ? "never"
                  : "auto",
    };
    if (sign === "accounting") format.currencySign = "accounting";

    const out = formatDecimal(decimal, locale, format, display, currency);
    return parenthesize ? `(${out})` : out;
}

/**
 * Sign of an amount: `-1` debit, `1` credit, `0` zero, `null` when it isn't
 * integer minor units at all. Zero is its own answer on purpose — it is neither
 * direction, and a component that paints it as a credit is asserting something.
 * @param {number|string|bigint} value
 * @returns {-1|0|1|null}
 */
export function minorUnitsSign(value) {
    const minor = toMinorUnits(value);
    if (minor === null) return null;
    if (minor === "0") return 0;
    return minor.startsWith("-") ? -1 : 1;
}

/**
 * Canonical minor units as a canonical decimal string — `("-1234", 2)` is
 * `"-12.34"`. Digit arithmetic, so an amount wider than a float stays exact.
 * @param {string} minor — as returned by `toMinorUnits`
 * @param {number} precision
 * @returns {string}
 */
export function minorUnitsToDecimal(minor, precision) {
    const negative = minor.startsWith("-");
    const digits = (negative ? minor.slice(1) : minor).padStart(
        precision + 1,
        "0",
    );

    if (precision === 0) return (negative ? "-" : "") + digits;

    const int = digits.slice(0, digits.length - precision);
    const frac = digits.slice(digits.length - precision);
    return `${negative ? "-" : ""}${int}.${frac}`;
}

/**
 * An integer number of minor units times a whole quantity, as canonical minor
 * units — `("6500", 2)` is `"13000"`, and `null` when either side isn't one.
 * Exact at any width, and there is no rounding rule in it to get wrong.
 * @param {number|string|bigint} value — integer minor units, signed
 * @param {number} quantity — a whole count
 * @returns {string|null}
 */
export function multiplyMinorUnits(value, quantity) {
    const minor = toMinorUnits(value);
    if (minor === null) return null;

    const count = Number(quantity);
    if (!Number.isSafeInteger(count)) return null;

    return (BigInt(minor) * BigInt(count)).toString();
}

/**
 * Round a decimal string half-away-from-zero using digit arithmetic. Going
 * through a float here is what turns 1.005 into 1.00.
 *
 * Total by construction: `min`, `max` and `step` arrive as raw author strings
 * and must never reach `BigInt` with a stray separator still in them.
 * @param {string|number} dec
 * @param {number} precision
 * @returns {string}
 */
export function roundDecimal(dec, precision) {
    const raw = String(dec ?? "").trim();
    const negative = raw.startsWith("-");
    const magnitude = raw.replace(/^[+-]/, "").replace(/[^0-9.]/g, "");
    const dot = magnitude.indexOf(".");
    const rawInt = (dot === -1 ? magnitude : magnitude.slice(0, dot)) || "0";
    const rawFrac =
        dot === -1 ? "" : magnitude.slice(dot + 1).replace(/\./g, "");
    const int = rawInt.replace(/^0+(?=\d)/, "") || "0";

    let digits;
    if (rawFrac.length <= precision) {
        digits = int + rawFrac.padEnd(precision, "0");
    } else {
        digits = (int + rawFrac.slice(0, precision)).split("");
        if (Number(rawFrac[precision]) >= 5) {
            let i = digits.length - 1;
            while (i >= 0 && digits[i] === "9") {
                digits[i] = "0";
                i--;
            }
            if (i < 0) digits.unshift("1");
            else digits[i] = String(Number(digits[i]) + 1);
        }
        digits = digits.join("");
    }

    const out = minorUnitsToDecimal(digits, precision);
    // -0.00 is not a number anyone wants to see in a form.
    return negative && /[1-9]/.test(out) ? `-${out}` : out;
}

/**
 * An amount as a canonical integer string, or `null` when it is not one.
 *
 * Strings and `BigInt`s are the wide path — a balance past
 * `Number.MAX_SAFE_INTEGER` has to arrive as one of those, because a `Number`
 * that large has already lost digits before this function sees it. A `Number` is
 * therefore accepted only while it is a safe integer.
 *
 * `12.34` returns `null`. That is the point: a float amount is major units
 * wearing a minor-unit parameter's name, and the only two honest options are to
 * reject it or to render `$0.12`. Rejecting says so.
 * @param {number|string|bigint} value
 * @returns {string|null}
 */
export function toMinorUnits(value) {
    if (typeof value === "bigint") return value.toString();

    if (typeof value === "number")
        return Number.isSafeInteger(value) ? String(value) : null;

    if (typeof value !== "string") return null;

    const text = value.trim();
    if (!INTEGER.test(text)) return null;

    // Canonical form: no leading `+`, no leading zeros, and one spelling of
    // zero — "-0" and "0" are the same amount and must render as one.
    const negative = text.startsWith("-");
    const digits = text.replace(/^[+-]/, "").replace(/^0+(?=\d)/, "");

    return digits === "0" ? "0" : `${negative ? "-" : ""}${digits}`;
}

/**
 * Run a canonical decimal through `Intl`, falling back a step at a time: a
 * malformed currency code drops the affix rather than the figure, and a locale
 * `Intl` cannot build at all leaves the canonical decimal as the last resort.
 */
function formatDecimal(decimal, locale, format, display, currency) {
    if (display !== "none") {
        try {
            return new Intl.NumberFormat(locale, {
                ...format,
                style: "currency",
                currency,
                currencyDisplay: CURRENCY_DISPLAYS.includes(display)
                    ? display
                    : "symbol",
            }).format(decimal);
        } catch {
            /* fall through to the un-affixed figure */
        }
    }

    try {
        return new Intl.NumberFormat(locale, format).format(decimal);
    } catch {
        return decimal;
    }
}
