import Runtime from '../Runtime';
import JelObject from '../JelObject';
import Context from '../Context';
import {IDbRef} from '../IDatabase';
import JelString from './JelString';
import JelNumber from './JelNumber';
import Numeric from './Numeric';
import JelBoolean from './JelBoolean';
import Fraction from './Fraction';
import ApproximateNumber from './ApproximateNumber';
import Unit from './Unit';
import UnitValue from './UnitValue';
import TypeChecker from './TypeChecker';



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
	
	
	
	private static restoreUnit(original: Numeric, n: number): JelNumber | UnitValue {
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
	static acos(ctx: Context, x: any, unit?: IDbRef | JelString): JelNumber | UnitValue {
		const r = Math.acos(TypeChecker.realNumber(x, 'x'));
		return unit ? JelMath.convertAngle(r, unit instanceof JelString ? unit.value : unit.distinctName) : JelNumber.valueOf(r);
	}
	static asin_jel_mapping = {x: 1, unit: 2};
	static asin(ctx: Context, x: any, unit?: IDbRef | JelString): JelNumber | UnitValue {
		const r = Math.asin(TypeChecker.realNumber(x, 'x'));
		return unit ? JelMath.convertAngle(r, unit instanceof JelString ? unit.value : unit.distinctName) : JelNumber.valueOf(r);
	}
	static atan_jel_mapping = {x: 1, unit: 2};
	static atan(ctx: Context, x: any, unit?: IDbRef | JelString): JelNumber | UnitValue {
		const r = Math.atan(TypeChecker.realNumber(x, 'x'));
		return unit ? JelMath.convertAngle(r, unit instanceof JelString ? unit.value : unit.distinctName) : JelNumber.valueOf(r);
	}
	static atan2_jel_mapping = {x: 1, y: 2, unit: 3};
	static atan2(ctx: Context, x: any, y: any, unit?: IDbRef | JelString): JelNumber | UnitValue {
		const r = Math.atan2(TypeChecker.realNumber(x, 'x'), TypeChecker.realNumber(y, 'y'));
		return unit ? JelMath.convertAngle(r, unit instanceof JelString ? unit.value : unit.distinctName) : JelNumber.valueOf(r);
	}

	static cbrt_jel_mapping = {x: 1};
	static cbrt(ctx: Context, x: any): number {
		return Math.cbrt(TypeChecker.realNumber(x, 'x'));
	}

	static ceil_jel_mapping = {x: 1};
	static ceil(ctx: Context, x: any): JelNumber | UnitValue {
			return JelMath.restoreUnit(x, Math.ceil(TypeChecker.realNumber(x, 'x')));
	}

	private static trigo(f: (x: number)=>number, ctx: Context, x: Numeric): number {
		if (x instanceof UnitValue) {
			if (!x.unit.isSimple())
				throw new Error('Supports only Radians, Degree, Turn and Gradian as unit, but no complex unit types. Given: ' + x.unit.toString());
			const	st = x.unit.toSimpleType(ctx).distinctName;
			if (!(st in JelMath.unitFactors))
				throw new Error('Supports only Radians, Degree, Turn and Gradian as unit, but not ' + st);
			return f(JelNumber.toRealNumber(x.value) / JelMath.unitFactors[st]);
		}
		return f(JelNumber.toRealNumber(x));
	}

	static cos_jel_mapping = {x: 1};
	static cos(ctx: Context, x: any): number {
		return JelMath.trigo(Math.cos, ctx, TypeChecker.numeric(x, 'x'));
	}
	static sin_jel_mapping = {x: 1};
	static sin(ctx: Context, x: any): number {
		return JelMath.trigo(Math.sin, ctx, TypeChecker.numeric(x, 'x'));
	}
	static tan_jel_mapping = {x: 1};
	static tan(ctx: Context, x: any): number {
		return JelMath.trigo(Math.tan, ctx, TypeChecker.numeric(x, 'x'));
	}

	static exp_jel_mapping = {x: 1};
	static exp(ctx: Context, x: any): number {
		return Math.exp(TypeChecker.realNumber(x, 'x'));
	}
	static expm1_jel_mapping = {x: 1};
	static expm1(ctx: Context, x: any): number {
		return Math.expm1(TypeChecker.realNumber(x, 'x'));
	}
	
	static floor_jel_mapping = {x: 1};
	static floor(ctx: Context, x: any): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.floor(TypeChecker.realNumber(x, 'x')));
	}

	static hypot_jel_mapping = {};
	static hypot(ctx: Context, ...a: any[]): number {
		return Math.hypot(...a.map(x=>TypeChecker.realNumber(x, 'x')));
	}

	static delta_jel_mapping = {x: 1, y: 2};
	static delta(ctx: Context, x: any, y: any): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.abs(TypeChecker.realNumber(x, 'x') - TypeChecker.realNumber(y, 'y')));
	}
	
	static log_jel_mapping = {x: 1};
	static log(ctx: Context, x: any): number {
		return Math.log(TypeChecker.realNumber(x, 'x'));
	}
	static log1p_jel_mapping = {x: 1};
	static log1p(ctx: Context, x: any): number {
		return Math.log1p(TypeChecker.realNumber(x, 'x'));
	}
	static log10_jel_mapping = {x: 1};
	static log10(ctx: Context, x: any): number {
		return Math.log10(TypeChecker.realNumber(x, 'x'));
	}
	static log2_jel_mapping = {x: 1};
	static log2(ctx: Context, x: any): number {
		return Math.log2(TypeChecker.realNumber(x, 'x'));
	}

	private static best(op: string, ctx: Context, a: any[]): Numeric | Promise<Numeric> {
		if (!a.length)
			return JelNumber.valueOf(0);
		let f = a[0];
		for (let i = 1; i < a.length; i++) {
			const cf = f;
			const n = TypeChecker.numeric(a[i], 'a');
			const r = Runtime.op(ctx, op, cf, n);
			if (r instanceof JelBoolean)
				f = r.toRealBoolean() ? n : cf;
			else if (r instanceof Promise) {
				if (i == a.length -1)
					return r.then(pr=>(pr as JelBoolean).toRealBoolean() ? n : cf);
				else
					return r.then(pr=>JelMath.best(op, ctx, [(pr as JelBoolean).toRealBoolean() ? n : cf].concat(a.slice(i+1))));
			}
		}
		return f;
	}
	
	static min_jel_mapping = {};
	static min(ctx: Context, ...a: any[]): Numeric | Promise<Numeric> {
		return JelMath.best('>', ctx, a);
	}
	
	static max_jel_mapping = {};
	static max(ctx: Context, ...a: any[]): Numeric | Promise<Numeric> {
		return JelMath.best('<', ctx, a);
	}
	
	static pow_jel_mapping = {x: 1, y: 2};
	static pow(ctx: Context, x: any, y: any): Numeric {
		return JelNumber.valueOf(Math.pow(TypeChecker.realNumber(x, 'x'), TypeChecker.realNumber(y, 'y')));
	}

	static random_jel_mapping = {min: 1, max: 2, unit: 3};
	static random(ctx: Context, min: any, max: any,	unit?: any): JelNumber | UnitValue {
		const min0 = TypeChecker.realNumber(min, 'min', 0);
		const r = Math.random() *  (TypeChecker.realNumber(max, 'max', 1)-min0) + min0;
		if (unit || min instanceof UnitValue || max instanceof UnitValue)
			return new UnitValue(JelNumber.valueOf(r), TypeChecker.optionalTypes(['JelString', 'Unit', 'DbRef'], unit, 'unit') || (min instanceof UnitValue ? min.unit : (max as UnitValue).unit));
		else
			return JelNumber.valueOf(r);
	}
	
	static round_jel_mapping = {x: 1};
	static round(ctx: Context, x: any): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.round(TypeChecker.realNumber(x, 'x')));
	}

	static sign_jel_mapping = {x: 1};
	static sign(ctx: Context, x: any): number {
		return Math.sign(TypeChecker.realNumber(x, 'x'));
	}
	
	static sqrt_jel_mapping = {x: 1};
	static sqrt(ctx: Context, x: any): number {
		return Math.sqrt(TypeChecker.realNumber(x, 'x'));
	}
	
	static trunc_jel_mapping = {x: 1};
	static trunc(ctx: Context, x: any): JelNumber | UnitValue {
		return JelMath.restoreUnit(x, Math.trunc(TypeChecker.realNumber(x, 'x')));
	}
}



