import JelType from '../JelType';
import Context from '../Context';
import Util from '../../util/Util';

/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 */
export default class FuzzyBoolean extends JelType {
	state: number;

	JEL_PROPERTIES: Object = {state:1};
	
	static FALSE_VALUE = 0;
	static BARELY_FALSE_VALUE = 0.25;
	static HALF_TRUE_VALUE = 0.5;
	static BARELY_TRUE_VALUE = 0.75;
	static TRUE_VALUE = 1;

	static FALSE = new FuzzyBoolean(FuzzyBoolean.FALSE_VALUE);
	static BARELY_FALSE = new FuzzyBoolean(FuzzyBoolean.BARELY_FALSE_VALUE);
	static HALF_TRUE = new FuzzyBoolean(FuzzyBoolean.HALF_TRUE_VALUE);
	static BARELY_TRUE = new FuzzyBoolean(FuzzyBoolean.BARELY_TRUE_VALUE);
	static TRUE = new FuzzyBoolean(FuzzyBoolean.TRUE_VALUE);

	static PREDEFINED: Map<any, FuzzyBoolean> = new Map();
	static NEGATE: Map<any, FuzzyBoolean> = new Map();
	
	static JEL_PROPERTIES: Object = {FALSE_VALUE: 1, BARELY_FALSE_VALUE:1, HALF_TRUE_VALUE:1, BARELY_TRUE_VALUE:1, TRUE_VALUE:1,
																	FALSE:1, BARELY_FALSE:1, HALF_TRUE:1, BARELY_TRUE:1, TRUE:1};
	
	static init() {
		JelType.setFuzzyBoolean(FuzzyBoolean);
		FuzzyBoolean.PREDEFINED.set(FuzzyBoolean.TRUE_VALUE, FuzzyBoolean.TRUE);
		FuzzyBoolean.PREDEFINED.set(FuzzyBoolean.BARELY_TRUE_VALUE, FuzzyBoolean.BARELY_TRUE);
		FuzzyBoolean.PREDEFINED.set(FuzzyBoolean.HALF_TRUE_VALUE, FuzzyBoolean.HALF_TRUE);
		FuzzyBoolean.PREDEFINED.set(FuzzyBoolean.BARELY_FALSE_VALUE, FuzzyBoolean.BARELY_FALSE);
		FuzzyBoolean.PREDEFINED.set(FuzzyBoolean.FALSE_VALUE, FuzzyBoolean.FALSE);
		FuzzyBoolean.PREDEFINED.set(true, FuzzyBoolean.TRUE);
		FuzzyBoolean.PREDEFINED.set(false, FuzzyBoolean.FALSE);

		FuzzyBoolean.NEGATE.set(FuzzyBoolean.FALSE_VALUE, FuzzyBoolean.TRUE);
		FuzzyBoolean.NEGATE.set(FuzzyBoolean.BARELY_FALSE_VALUE, FuzzyBoolean.BARELY_TRUE);
		FuzzyBoolean.NEGATE.set(FuzzyBoolean.HALF_TRUE_VALUE, FuzzyBoolean.HALF_TRUE);
		FuzzyBoolean.NEGATE.set(FuzzyBoolean.BARELY_TRUE_VALUE, FuzzyBoolean.BARELY_FALSE);
		FuzzyBoolean.NEGATE.set(FuzzyBoolean.TRUE_VALUE, FuzzyBoolean.FALSE);
	}

	
	constructor(state: number | boolean) {
		super();
		if (typeof state == 'boolean')
			this.state = state ? FuzzyBoolean.TRUE_VALUE : FuzzyBoolean.FALSE_VALUE;
		else
			this.state = state; // a value 0 - 1
	}
	
	op(ctx: Context, operator: string, right: any): any {
		if (right instanceof FuzzyBoolean) {
			switch (operator) {
				case '==': 
					return FuzzyBoolean.toFuzzyBoolean(this.toAbsoluteBoolean() == right.toAbsoluteBoolean());
				case '!=':
					return FuzzyBoolean.toFuzzyBoolean(this.toRealBoolean() != right.toRealBoolean());
				case '===':
					return FuzzyBoolean.toFuzzyBoolean(this.state === right.state);
				case '!==':
					return FuzzyBoolean.toFuzzyBoolean(this.state !== right.state);
				case '>':
				case '<':
				case '<=':
				case '>=':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					return JelType.op(ctx, operator, this.state, right.state);
			}
		}
		else if (typeof right == 'number')
			return JelType.op(ctx, operator, this.state, right);
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): any {
		if (operator == '!') {
			return this.negate();
		}
		else
			return JelType.singleOp(ctx, operator, this);
	}

	negate():FuzzyBoolean {
		return FuzzyBoolean.NEGATE.get(this.state) || new FuzzyBoolean(FuzzyBoolean.TRUE_VALUE - this.state);
	}
		
	getSerializationProperties(): any[] {
		return [this.state];
	}
	
	toBoolean(): FuzzyBoolean {
		return this;
	}

	toAbsoluteBoolean_jel_mapping: Object;
	toAbsoluteBoolean(): FuzzyBoolean {
		return FuzzyBoolean.toFuzzyBoolean(this.state >= FuzzyBoolean.HALF_TRUE_VALUE);
	}
	
	toRealBoolean(): boolean {
		return this.state >= FuzzyBoolean.HALF_TRUE_VALUE;
	}
	
	isClearlyTrue(): boolean {
		return this.state == FuzzyBoolean.TRUE_VALUE;
	}
	
	isClearlyFalse(): boolean {
		return this.state == FuzzyBoolean.FALSE_VALUE;
	}
	
	static fourWay_jel_mapping = {mainValue: 0, clearly: 1};
	static fourWay(mainValue: boolean, clearly: boolean): FuzzyBoolean {
		return mainValue ? (clearly ? FuzzyBoolean.TRUE : FuzzyBoolean.BARELY_TRUE) :
			(clearly ? FuzzyBoolean.FALSE : FuzzyBoolean.BARELY_FALSE);
	}

	static twoPrecision_jel_mapping = {lowPrecision: 0, highPrecision: 1};
	static twoPrecision(lowPrecision: boolean, highPrecision: boolean): FuzzyBoolean {
		return lowPrecision ? (highPrecision ? FuzzyBoolean.TRUE : FuzzyBoolean.BARELY_TRUE) :
			(highPrecision ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.FALSE);
	}

	static toFuzzyBoolean(a: boolean): FuzzyBoolean {
		return a ? FuzzyBoolean.TRUE : FuzzyBoolean.FALSE;
	}

	static toRealBoolean(a: boolean|FuzzyBoolean): boolean {
		if (typeof a == 'boolean')
			return a;
		else
			return a.toRealBoolean();
	}

	static negate(a: any): FuzzyBoolean {
		if (a instanceof FuzzyBoolean)
			return a.negate();
		else
			return FuzzyBoolean.toFuzzyBoolean(!a);
	}

	and_jel_mapping: Object;
	and(ctx: Context, a: FuzzyBoolean): FuzzyBoolean {
		return FuzzyBoolean.and(ctx, this, a);
	}

	or_jel_mapping: Object;
	or(ctx: Context, a: FuzzyBoolean): FuzzyBoolean {
		return FuzzyBoolean.or(ctx, this, a);
	}
	
	static and_jel_mapping = {};
	static and(ctx: Context, ...args: FuzzyBoolean[]): FuzzyBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (r.toRealBoolean())
				r = args[pos++];
			else
				return r;
		return r;	
	}

	static or_jel_mapping = {};
	static or(ctx: Context, ...args: FuzzyBoolean[]): FuzzyBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (r.toRealBoolean())
				return r;
			else
				r = args[pos++];
		return r;
	}

	static truest_jel_mapping = {a: 1, b: 2};
	static truest(ctx: Context, a: FuzzyBoolean, b: FuzzyBoolean): FuzzyBoolean {
		return a.state > b.state ? a : b;
	}

	static falsest_jel_mapping = {a: 1, b: 2};
	static falsest(ctx: Context, a: FuzzyBoolean, b: FuzzyBoolean): FuzzyBoolean {
		return a.state < b.state ? a : b;
	}

	static falsestWithPromises(ctx: Context, a: FuzzyBoolean | Promise<FuzzyBoolean>, b: FuzzyBoolean | Promise<FuzzyBoolean>): FuzzyBoolean | Promise<FuzzyBoolean> {
		if (a instanceof Promise || b instanceof Promise)
			return Util.resolveValues(FuzzyBoolean.falsest, ctx, a, b);
		else
			return FuzzyBoolean.falsest(ctx, a, b);
	}

	static andWithPromises(...args: (FuzzyBoolean | Promise<FuzzyBoolean>)[]): FuzzyBoolean | Promise<FuzzyBoolean> {
			return Util.resolveArray(args=>FuzzyBoolean.and(new Context(), ...args), args);
	}

	static orWithPromises(...args: (FuzzyBoolean | Promise<FuzzyBoolean>)[]): FuzzyBoolean | Promise<FuzzyBoolean> {
			return Util.resolveArray(args=>FuzzyBoolean.or(new Context(), ...args), args);
	}

	
	static create_jel_mapping = {state: 1};
	static create(ctx: Context, ...args: any[]): FuzzyBoolean {
		return FuzzyBoolean.PREDEFINED.get(args[0]) || new FuzzyBoolean(args[0]);
	}
}

FuzzyBoolean.init();
FuzzyBoolean.prototype.toAbsoluteBoolean_jel_mapping = {};
FuzzyBoolean.prototype.or_jel_mapping = {a: 1};
FuzzyBoolean.prototype.and_jel_mapping = {a: 1};


