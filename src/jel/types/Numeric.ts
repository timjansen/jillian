import Float from './Float';
import Context from '../Context';

export default interface Numeric {
	negate(): Numeric;
	abs(): Numeric;
	toFloat(): Float;
	toRealNumber(): number;
	toBoolean(): boolean;
  round(ctx: Context): Numeric;
  trunc(): Numeric;
}
