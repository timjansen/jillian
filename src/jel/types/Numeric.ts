import JelNumber from './JelNumber';

export default interface Numeric {
	negate(): Numeric;
	abs(): Numeric;
	toNumber(): JelNumber;
	toRealNumber(): number;
	toBoolean(): boolean;
}
