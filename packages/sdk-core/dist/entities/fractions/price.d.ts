import { BigintIsh, Rounding } from "../../constants";
import { Currency } from "../currency";
import CurrencyAmount from "./currencyAmount";
import Fraction from "./fraction";
export default class Price extends Fraction {
    readonly baseCurrency: Currency;
    readonly quoteCurrency: Currency;
    readonly scalar: Fraction;
    constructor(baseCurrency: Currency, quoteCurrency: Currency, denominator: BigintIsh, numerator: BigintIsh);
    get raw(): Fraction;
    get adjusted(): Fraction;
    invert(): Price;
    multiply(other: Price): Price;
    quote(currencyAmount: CurrencyAmount): CurrencyAmount;
    toSignificant(significantDigits?: number, format?: object, rounding?: Rounding): string;
    toFixed(decimalPlaces?: number, format?: object, rounding?: Rounding): string;
}
