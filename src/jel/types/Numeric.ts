import Float from './Float';

export default interface Numeric {
	negate(): Numeric;
	abs(): Numeric;
	toFloat(): Float;
	toRealNumber(): number;
	toBoolean(): boolean;
}
