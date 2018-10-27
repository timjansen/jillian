import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import JelNumber from './JelNumber';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import Unit from './Unit';
import UnitValue from './UnitValue';



function toNumber(n: JelNumber | Fraction | UnitValue | ApproximateNumber): number {
	return (n && n.toNumber) ? n.toNumber().value : NaN;
}

/**
 * Collection of static method for math.
 */
export default class JelMath extends JelObject {
	static readonly JEL_PROPERTIES = {PI: true, E: true, LN2: true, LN10: true, LOG2E: true, LOG10E: true, SQRT1_2: true, SQRT2: true};

	static readonly PI = JelNumber.valueOf(Math.PI);
	static readonly E = JelNumber.valueOf(Math.E);
	static readonly LN2 = JelNumber.valueOf(Math.LN2);
	static readonly LN10 = JelNumber.valueOf(Math.LN10);
	static readonly LOG2E = JelNumber.valueOf(Math.LOG2E);
	static readonly LOG10E = JelNumber.valueOf(Math.LOG10E);
	static readonly SQRT1_2 = JelNumber.valueOf(Math.SQRT1_2);
	static readonly SQRT2 = JelNumber.valueOf(Math.SQRT2);
	
	private static units: any = {
		Turn: new Unit('Turn'),
		Radian: new Unit('Radian'),
		Gradian: new Unit('Gradian'),
		Degree: new Unit('Degree')
	}
	private static unitFactors: any = {
		Turn: 1/(2*Math.PI),
		Radian: 1,
		Gradian: 400/(2*Math.PI),
		Degree: 360/(2*Math.PI)
	};
	
	
	
	private static restoreUnit(original: JelNumber | Fraction | UnitValue | ApproximateNumber, n: number): JelNumber | UnitValue {
		if (original instanceof UnitValue)
			return new UnitValue(JelNumber.valueOf(n), original.unit);
		else
			return JelNumber.valueOf(n);
	}
	
	private static convertAngle(radians: number, unit: string): UnitValue {
		const o: Unit = JelMath.units[unit];
		if (!o)
			throw new Error("Unsupported angle unit: @"+unit);
		return new UnitValue(JelNumber.valueOf(radians * JelMath.unitFactors[unit]), o);
	}
	
	// Returns either number in radians, or converts to the given unit. Must be @Degree, @Radian, @Gradian or @Turn. Defaults to @Radian as plain number.
	static acos_jel_mapping = {x: 1, unit: 2};
	static acos(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): JelNumber | UnitValue {
		const r = Math.acos(JelNumber.toRealNumber(x));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : JelNumber.valueOf(r);
	}
	static asin_jel_mapping = {x: 1, unit: 2};
	static asin(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): JelNumber | UnitValue {
		const r = Math.asin(JelNumber.toRealNumber(x));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : JelNumber.valueOf(r);
	}
	static atan_jel_mapping = {x: 1, unit: 2};
	static atan(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): JelNumber | UnitValue {
		const r = Math.atan(JelNumber.toRealNumber(x));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : JelNumber.valueOf(r);
	}
	static atan2_jel_mapping = {x: 1, y: 2, unit: 3};
	static atan2(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber, y: JelNumber | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): JelNumber | UnitValue {
		const r = Math.atan2(JelNumber.toRealNumber(x), JelNumber.toRealNumber(y));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : JelNumber.valueOf(r);
	}

	static cbrt_jel_mapping = {x: 1};
	static cbrt(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.cbrt(JelNumber.toRealNumber(x)));
	}

	static ceil_jel_mapping = {x: 1};
	static ceil(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber | UnitValue {
			return JelMath.restoreUnit(x, Math.ceil(JelNumber.toRealNumber(x)));
	}

	private static trigo(f: (x: number)=>number, ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		if (x instanceof UnitValue) {
			if (!FuzzyBoolean.toRealBoolean(x.unit.isSimple()))
				throw new Error('Supports only Radians, Degree, Turn and Gradian as unit, but no complex unit types. Given: ' + x.unit.toString());
			const	st = x.unit.toSimpleType(ctx).distinctName;
			if (!(st in JelMath.unitFactors))
				throw new Error('Supports only Radians, Degree, Turn and Gradian as unit, but not ' + st);
			return JelNumber.valueOf(f(JelNumber.toRealNumber(x.value) / JelMath.unitFactors[st]));
		}
		return JelNumber.valueOf(f(JelNumber.toRealNumber(x)));
	}

	static cos_jel_mapping = {x: 1};
	static cos(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelMath.trigo(Math.cos, ctx, x);
	}
	static sin_jel_mapping = {x: 1};
	static sin(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelMath.trigo(Math.sin, ctx, x);
	}
	static tan_jel_mapping = {x: 1};
	static tan(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelMath.trigo(Math.tan, ctx, x);
	}

	static exp_jel_mapping = {x: 1};
	static exp(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.exp(JelNumber.toRealNumber(x)));
	}
	static expm1_jel_mapping = {x: 1};
	static expm1(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.expm1(JelNumber.toRealNumber(x)));
	}
	
	static floor_jel_mapping = {x: 1};
	static floor(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.floor(JelNumber.toRealNumber(x)));
	}

	static hypot_jel_mapping = {};
	static hypot(ctx: Context, ...a: any[]): JelNumber {
		return JelNumber.valueOf(Math.hypot(...a.map(x=>JelNumber.toRealNumber(x))));
	}

	static delta_jel_mapping = {x: 1, y: 2};
	static delta(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber, y: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.abs(JelNumber.toRealNumber(x) - JelNumber.toRealNumber(y)));
	}
	
	static log_jel_mapping = {x: 1};
	static log(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.log(JelNumber.toRealNumber(x)));
	}
	static log1p_jel_mapping = {x: 1};
	static log1p(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.log1p(JelNumber.toRealNumber(x)));
	}
	static log10_jel_mapping = {x: 1};
	static log10(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.log10(JelNumber.toRealNumber(x)));
	}
	static log2_jel_mapping = {x: 1};
	static log2(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.log2(JelNumber.toRealNumber(x)));
	}

	private static best(op: string, ctx: Context, a: any[]): JelNumber | Fraction | UnitValue | ApproximateNumber | Promise<JelNumber|Fraction|UnitValue|ApproximateNumber> {
		if (!a.length)
			return JelNumber.valueOf(0);
		let f = a[0];
		for (let i = 1; i < a.length; i++) {
			const cf = f;
			const n = a[i];
			const r = Runtime.op(ctx, op, cf, n);
			if (r instanceof FuzzyBoolean)
				f = r.toRealBoolean() ? n : cf;
			else if (r instanceof Promise) {
				if (i == a.length -1)
					return r.then(pr=>(pr as FuzzyBoolean).toRealBoolean() ? n : cf);
				else
					return r.then(pr=>JelMath.best(op, ctx, [(pr as FuzzyBoolean).toRealBoolean() ? n : cf].concat(a.slice(i+1))));
			}
		}
		return f;
	}
	
	static min_jel_mapping = {};
	static min(ctx: Context, ...a: any[]): JelNumber | Fraction | UnitValue | ApproximateNumber | Promise<JelNumber|Fraction|UnitValue|ApproximateNumber> {
		return JelMath.best('>', ctx, a);
	}
	
	static max_jel_mapping = {};
	static max(ctx: Context, ...a: any[]): JelNumber | Fraction | UnitValue | ApproximateNumber | Promise<JelNumber|Fraction|UnitValue|ApproximateNumber> {
		return JelMath.best('<', ctx, a);
	}
	
	static pow_jel_mapping = {x: 1, y: 2};
	static pow(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber, y: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.pow(JelNumber.toRealNumber(x), JelNumber.toRealNumber(y)));
	}

	static random_jel_mapping = {min: 1, max: 2, unit: 3};
	static random(ctx: Context, min: JelNumber | Fraction | UnitValue | ApproximateNumber = JelNumber.valueOf(0), max: JelNumber | Fraction | UnitValue | ApproximateNumber = JelNumber.valueOf(1),
								unit?: Unit | IDbRef | string): JelNumber | UnitValue {
		const min0 = JelNumber.toRealNumber(min);
		const r = Math.random() *  (JelNumber.toRealNumber(max)-min0) + min0;
		if (unit || min instanceof UnitValue || max instanceof UnitValue)
			return new UnitValue(JelNumber.valueOf(r), unit || (min instanceof UnitValue ? min.unit : (max as UnitValue).unit));
		else
			return JelNumber.valueOf(r);
	}
	
	static round_jel_mapping = {x: 1};
	static round(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.round(JelNumber.toRealNumber(x)));
	}

	static sign_jel_mapping = {x: 1};
	static sign(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.sign(JelNumber.toRealNumber(x)));
	}
	
	static sqrt_jel_mapping = {x: 1};
	static sqrt(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber {
		return JelNumber.valueOf(Math.sqrt(JelNumber.toRealNumber(x)));
	}
	
	static trunc_jel_mapping = {x: 1};
	static trunc(ctx: Context, x: JelNumber | Fraction | UnitValue | ApproximateNumber): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.trunc(JelNumber.toRealNumber(x)));
	}
}



