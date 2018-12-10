import Float from './Float';

export default interface Numeric {
	negate(): Numeric;
	abs(): Numeric;
	toNumber(): Float;
	toRealNumber(): number;
	toBoolean(): boolean;
}
