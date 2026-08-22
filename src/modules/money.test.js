import { expect } from "@open-wc/testing";
import {
    DEFAULT_CURRENCY,
    currencyPrecision,
    decimalToMinorUnits,
    formatMoney,
    minorUnitsSign,
    minorUnitsToDecimal,
    multiplyMinorUnits,
    roundDecimal,
    toMinorUnits,
} from "./money.js";

describe("money", () => {
    describe("currencyPrecision", () => {
        it("reads the minor-unit exponent off the currency", () => {
            expect(currencyPrecision("USD", "en-US")).to.equal(2);
            expect(currencyPrecision("JPY", "en-US")).to.equal(0);
            expect(currencyPrecision("KWD", "en-US")).to.equal(3);
        });

        it("falls back to 2 for a code Intl cannot resolve", () => {
            expect(currencyPrecision("NOTACODE", "en-US")).to.equal(2);
        });

        it("defaults to the default currency", () => {
            expect(currencyPrecision()).to.equal(
                currencyPrecision(DEFAULT_CURRENCY),
            );
        });

        it("answers the same question twice from cache", () => {
            expect(currencyPrecision("KWD", "en-US")).to.equal(3);
            expect(currencyPrecision("KWD", "en-US")).to.equal(3);
        });
    });

    describe("toMinorUnits", () => {
        it("canonicalizes integers, signs and leading zeros", () => {
            expect(toMinorUnits(1234)).to.equal("1234");
            expect(toMinorUnits("+007")).to.equal("7");
            expect(toMinorUnits("-0012")).to.equal("-12");
            expect(toMinorUnits("  42  ")).to.equal("42");
        });

        it("has one spelling of zero", () => {
            expect(toMinorUnits("-0")).to.equal("0");
            expect(toMinorUnits(0)).to.equal("0");
        });

        it("takes a BigInt and a wide string past 2^53", () => {
            expect(toMinorUnits(90071992547409911n)).to.equal(
                "90071992547409911",
            );
            expect(toMinorUnits("90071992547409911")).to.equal(
                "90071992547409911",
            );
        });

        it("rejects anything that is not integer minor units", () => {
            expect(toMinorUnits("12.34")).to.equal(null);
            expect(toMinorUnits(12.34)).to.equal(null);
            expect(toMinorUnits(2 ** 53)).to.equal(null);
            expect(toMinorUnits("")).to.equal(null);
            expect(toMinorUnits(null)).to.equal(null);
            expect(toMinorUnits(undefined)).to.equal(null);
            expect(toMinorUnits(NaN)).to.equal(null);
            expect(toMinorUnits("1,234")).to.equal(null);
        });
    });

    describe("minorUnitsToDecimal", () => {
        it("places the decimal point by precision", () => {
            expect(minorUnitsToDecimal("123456", 2)).to.equal("1234.56");
            expect(minorUnitsToDecimal("-1234", 2)).to.equal("-12.34");
            expect(minorUnitsToDecimal("1234", 0)).to.equal("1234");
            expect(minorUnitsToDecimal("1234", 3)).to.equal("1.234");
        });

        it("pads an amount narrower than its precision", () => {
            expect(minorUnitsToDecimal("5", 2)).to.equal("0.05");
            expect(minorUnitsToDecimal("-5", 3)).to.equal("-0.005");
            expect(minorUnitsToDecimal("0", 2)).to.equal("0.00");
        });

        it("keeps every digit past 2^53", () => {
            expect(minorUnitsToDecimal("90071992547409911", 2)).to.equal(
                "900719925474099.11",
            );
        });
    });

    describe("decimalToMinorUnits", () => {
        it("scales a decimal string to minor units", () => {
            expect(decimalToMinorUnits("1234.56", 2)).to.equal("123456");
            expect(decimalToMinorUnits("-12.34", 2)).to.equal("-1234");
            expect(decimalToMinorUnits("1234", 0)).to.equal("1234");
            expect(decimalToMinorUnits("1.234", 3)).to.equal("1234");
        });

        it("rounds a longer fraction rather than truncating it", () => {
            expect(decimalToMinorUnits("1.005", 2)).to.equal("101");
            expect(decimalToMinorUnits("1.004", 2)).to.equal("100");
        });

        it("treats an empty amount as zero", () => {
            expect(decimalToMinorUnits("", 2)).to.equal("0");
        });

        it("round-trips through minorUnitsToDecimal", () => {
            const decimal = "900719925474099.11";
            expect(minorUnitsToDecimal(decimalToMinorUnits(decimal, 2), 2)).to.equal(
                decimal,
            );
        });
    });

    describe("roundDecimal", () => {
        it("rounds half away from zero on digits, not floats", () => {
            expect(roundDecimal("1.005", 2)).to.equal("1.01");
            expect(roundDecimal("-1.005", 2)).to.equal("-1.01");
            expect(roundDecimal("2.675", 2)).to.equal("2.68");
        });

        it("carries through a run of nines", () => {
            expect(roundDecimal("9.999", 2)).to.equal("10.00");
            expect(roundDecimal("0.999", 0)).to.equal("1");
        });

        it("pads a short fraction out to precision", () => {
            expect(roundDecimal("1.5", 3)).to.equal("1.500");
            expect(roundDecimal("7", 2)).to.equal("7.00");
        });

        it("never produces negative zero", () => {
            expect(roundDecimal("-0.001", 2)).to.equal("0.00");
        });

        it("scrubs separators out of a raw author string", () => {
            expect(roundDecimal("1,234.56", 2)).to.equal("1234.56");
            expect(roundDecimal(" $12.30 ", 2)).to.equal("12.30");
        });

        it("takes an empty or nullish amount as zero", () => {
            expect(roundDecimal("", 2)).to.equal("0.00");
            expect(roundDecimal(null, 2)).to.equal("0.00");
        });
    });

    describe("minorUnitsSign", () => {
        it("separates debits, credits and zero", () => {
            expect(minorUnitsSign(-1)).to.equal(-1);
            expect(minorUnitsSign("1234")).to.equal(1);
            expect(minorUnitsSign("-0")).to.equal(0);
            expect(minorUnitsSign(0)).to.equal(0);
        });

        it("is null for anything that is not integer minor units", () => {
            expect(minorUnitsSign("12.34")).to.equal(null);
            expect(minorUnitsSign(undefined)).to.equal(null);
        });
    });

    describe("multiplyMinorUnits", () => {
        it("multiplies by a whole count", () => {
            expect(multiplyMinorUnits("6500", 2)).to.equal("13000");
            expect(multiplyMinorUnits(-500, 3)).to.equal("-1500");
            expect(multiplyMinorUnits("6500", 0)).to.equal("0");
        });

        it("stays exact past 2^53", () => {
            expect(multiplyMinorUnits("90071992547409911", 10)).to.equal(
                "900719925474099110",
            );
        });

        it("is null when either side is not whole", () => {
            expect(multiplyMinorUnits("12.34", 2)).to.equal(null);
            expect(multiplyMinorUnits("6500", 1.5)).to.equal(null);
            expect(multiplyMinorUnits("6500", NaN)).to.equal(null);
        });
    });

    describe("formatMoney", () => {
        it("formats minor units at the currency's precision", () => {
            expect(formatMoney(123456, { locale: "en-US" })).to.equal(
                "$1,234.56",
            );
            expect(
                formatMoney(1234, { currency: "JPY", locale: "en-US" }),
            ).to.equal("¥1,234");
            expect(
                formatMoney(1234, { currency: "KWD", locale: "en-US" }),
            ).to.contain("1.234");
        });

        it("honours an explicit precision over the currency's", () => {
            expect(
                formatMoney(1234, {
                    currency: "USD",
                    locale: "en-US",
                    precision: 0,
                }),
            ).to.equal("$1,234");
        });

        it("follows the locale for separators and symbol placement", () => {
            expect(
                formatMoney(123456, { currency: "EUR", locale: "de-DE" }),
            ).to.contain("1.234,56");
        });

        it("takes each display mode", () => {
            expect(
                formatMoney(500, { display: "code", locale: "en-US" }),
            ).to.contain("USD");
            expect(
                formatMoney(500, { display: "name", locale: "en-US" }),
            ).to.contain("dollar");
            expect(
                formatMoney(500, { display: "none", locale: "en-US" }),
            ).to.equal("5.00");
        });

        it("falls back to the symbol for an unknown display mode", () => {
            expect(
                formatMoney(500, { display: "sigil", locale: "en-US" }),
            ).to.equal("$5.00");
        });

        it("takes each sign mode", () => {
            const options = { locale: "en-US" };
            expect(formatMoney(-500, options)).to.equal("-$5.00");
            expect(formatMoney(500, { ...options, sign: "always" })).to.equal(
                "+$5.00",
            );
            expect(formatMoney(0, { ...options, sign: "always" })).to.equal(
                "$0.00",
            );
            expect(formatMoney(-500, { ...options, sign: "never" })).to.equal(
                "$5.00",
            );
            expect(
                formatMoney(-500, { ...options, sign: "accounting" }),
            ).to.equal("($5.00)");
            expect(
                formatMoney(-500, { ...options, sign: "parentheses" }),
            ).to.equal("($5.00)");
            expect(
                formatMoney(500, { ...options, sign: "parentheses" }),
            ).to.equal("$5.00");
        });

        it("keeps every digit of an amount past 2^53", () => {
            expect(
                formatMoney("90071992547409911", { locale: "en-US" }),
            ).to.equal("$900,719,925,474,099.11");
        });

        it("drops the affix rather than the figure for an unusable code", () => {
            expect(
                formatMoney(123456, { currency: "NOTACODE", locale: "en-US" }),
            ).to.equal("1,234.56");
        });

        it("is empty for anything that is not integer minor units", () => {
            expect(formatMoney("12.34", { locale: "en-US" })).to.equal("");
            expect(formatMoney("", { locale: "en-US" })).to.equal("");
            expect(formatMoney(null, { locale: "en-US" })).to.equal("");
            expect(formatMoney(NaN, { locale: "en-US" })).to.equal("");
        });

        it("formats with no options at all", () => {
            expect(formatMoney(500)).to.be.a("string").that.is.not.empty;
        });
    });
});
