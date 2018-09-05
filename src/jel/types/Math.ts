import JelType from '../JelType';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import FuzzyBoolean from './FuzzyBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import Unit from './Unit';
import UnitValue from './UnitValue';


/**
 * Collection of static method for math.
 */
export default class JelMath extends JelType {
	static readonly JEL_PROPERTIES = {PI: true, E: true, LN2: true, LN10: true, LOG2E: true, LOG10E: true, SQRT1_2: true, SQRT2: true};

	static readonly PI = Math.PI;
	static readonly E = Math.E;
	static readonly LN2 = Math.LN2;
	static readonly LN10 = Math.LN10;
	static readonly LOG2E = Math.LOG2E;
	static readonly LOG10E = Math.LOG10E;
	static readonly SQRT1_2 = Math.SQRT1_2;
	static readonly SQRT2 = Math.SQRT2;
	
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
	
	

	static toNumber(x: number | Fraction | UnitValue | ApproximateNumber): number {
		return JelType.toNumber(x);
	}
	
	static convertAngle(radians: number, unit: string): UnitValue {
		const o: Unit = JelMath.units[unit];
		if (!o)
			throw new Error("Unsupported angle unit: @"+unit);
		return new UnitValue(radians * JelMath.unitFactors[unit], o);
	}
	
	// Returns either number in radians, or converts to the given unit. Must be @Degree, @Radian, @Gradian or @Turn. Defaults to @Radian
	static acos_jel_mapping = {x: 1, unit: 2};
	static acos(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): number | UnitValue {
		const r = Math.acos(JelType.toNumber(x));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : r;
	}
	static asin_jel_mapping = {x: 1, unit: 2};
	static asin(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): number | UnitValue {
		const r = Math.asin(JelType.toNumber(x));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : r;
	}
	static atan_jel_mapping = {x: 1, unit: 2};
	static atan(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): number | UnitValue {
		const r = Math.atan(JelType.toNumber(x));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : r;
	}
	static atan2_jel_mapping = {x: 1, y: 2, unit: 3};
	static atan2(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber, y: number | Fraction | UnitValue | ApproximateNumber, unit?: IDbRef | string): number | UnitValue {
		const r = Math.atan2(JelType.toNumber(x), JelType.toNumber(y));
		return unit ? JelMath.convertAngle(r, typeof unit == 'string' ? unit : unit.distinctName) : r;
	}

	static cbrt_jel_mapping = {x: 1};
	static cbrt(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.cbrt(JelType.toNumber(x));
	}

	static ceil_jel_mapping = {x: 1};
	static ceil(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
			return Math.cbrt(JelType.toNumber(x));
	}

	private static trigo(f: (x: number)=>number, ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		if (x instanceof UnitValue) {
			if (!x.unit.isSimple())
				throw new Error('Supports only Radians, Degree, Turn and Gradian as unit, but no complex unit types');
			const	st = x.unit.toSimpleType(ctx).distinctName;
			if (!(st in JelMath.unitFactors))
				throw new Error('Supports only Radians, Degree, Turn and Gradian as unit, but not ' + st);
			return f(JelType.toNumber(x.value) / JelMath.unitFactors[st]);
		}
		return f(JelType.toNumber(x));
	}

	static cos_jel_mapping = {x: 1};
	static cos(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return JelMath.trigo(Math.cos, ctx, x);
	}
	static sin_jel_mapping = {x: 1};
	static sin(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return JelMath.trigo(Math.sin, ctx, x);
	}
	static tan_jel_mapping = {x: 1};
	static tan(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return JelMath.trigo(Math.tan, ctx, x);
	}

	static exp_jel_mapping = {x: 1};
	static exp(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.exp(JelType.toNumber(x));
	}
	static expm1_jel_mapping = {x: 1};
	static expm1(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.expm1(JelType.toNumber(x));
	}
	
	static floor_jel_mapping = {x: 1};
	static floor(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.floor(JelType.toNumber(x));
	}

	static hypot_jel_mapping = {};
	static hypot_exp(ctx: Context, ...a: any[]): number {
		return Math.hypot(...a.map(x=>JelType.toNumber(x)));
	}

	static log_jel_mapping = {x: 1};
	static log(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.log(JelType.toNumber(x));
	}
	static log1p_jel_mapping = {x: 1};
	static log1p(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.log1p(JelType.toNumber(x));
	}
	static log10_jel_mapping = {x: 1};
	static log10(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.log10(JelType.toNumber(x));
	}
	static log2_jel_mapping = {x: 1};
	static log2(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.log2(JelType.toNumber(x));
	}

	private static best(op: string, ctx: Context, a: any[]): number | Fraction | UnitValue | ApproximateNumber | Promise<number|Fraction|UnitValue|ApproximateNumber> {
		if (!a.length)
			return 0;
		let f = a[0];
		for (let i = 1; i < a.length; i++) {
			const cf = f;
			const n = a[i];
			const r = JelType.op(ctx, op, cf, n);
			if (r instanceof FuzzyBoolean)
				f = r.toRealBoolean() ? n : cf;
			else if (r instanceof Promise) {
				if (i == a.length -1)
					return r.then(pr=>pr.toRealBoolean() ? n : cf);
				else
					return r.then(pr=>JelMath.best(op, ctx, [pr.toRealBoolean() ? n : cf].concat(a.slice(i+1))));
			}
		}
		return f;
	}
	
	static min_jel_mapping = {};
	static min_exp(ctx: Context, ...a: any[]): number | Fraction | UnitValue | ApproximateNumber | Promise<number|Fraction|UnitValue|ApproximateNumber> {
		return JelMath.best('>', ctx, a);
	}
	
	static max_jel_mapping = {};
	static max_exp(ctx: Context, ...a: any[]): any | Promise<any> {
		return JelMath.best('<', ctx, a);
	}
	
	static pow_jel_mapping = {x: 1, y: 2};
	static pow(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber, y: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.pow(JelType.toNumber(x), JelType.toNumber(y));
	}

	static random_jel_mapping = {min: 1, max: 2};
	static random(ctx: Context, min: number | Fraction | UnitValue | ApproximateNumber = 0, max: number | Fraction | UnitValue | ApproximateNumber = 1): number {
		return Math.random() *  JelType.toNumber(max) + JelType.toNumber(min);
	}
	
	static round_jel_mapping = {x: 1};
	static round(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.round(JelType.toNumber(x));
	}

	static sign_jel_mapping = {x: 1};
	static sign(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.sign(JelType.toNumber(x));
	}
	
	static sqrt_jel_mapping = {x: 1};
	static sqrt(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.sqrt(JelType.toNumber(x));
	}
	
	static trunc_jel_mapping = {x: 1};
	static trunc(ctx: Context, x: number | Fraction | UnitValue | ApproximateNumber): number {
		return Math.trunc(JelType.toNumber(x));
	}
}



