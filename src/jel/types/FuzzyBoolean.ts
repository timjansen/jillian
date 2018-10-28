import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Util from '../../util/Util';

/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 */
export default class FuzzyBoolean extends JelObject implements SerializablePrimitive {
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

	
	constructor(state: any) { // state can be number | boolean | JelNumber. Any to avoid circular deps
		super();
		if (typeof state == 'boolean')
			this.state = state ? FuzzyBoolean.TRUE_VALUE : FuzzyBoolean.FALSE_VALUE;
		else if (typeof state == 'number')
			this.state = state;
		else
			this.state = state.value; // a value 0 - 1
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof FuzzyBoolean) {
			switch (operator) {
				case '==': 
					return FuzzyBoolean.valueOf(this.toAbsoluteBoolean() == right.toAbsoluteBoolean());
				case '!=':
					return FuzzyBoolean.valueOf(this.toRealBoolean() != right.toRealBoolean());
				case '===':
					return FuzzyBoolean.valueOf(this.state === right.state);
				case '!==':
					return FuzzyBoolean.valueOf(this.state !== right.state);
				case '>':
				case '<':
				case '<=':
				case '>=':
				case '>>':
				case '<<':
				case '<<=':
				case '>>=':
					const jn = BaseTypeRegistry.get('JelNumber');
					return jn.valueOf(this.state).op(ctx, operator, jn.valueOf(right.state));
			}
		}
		return super.op(ctx, operator, right);
	}
	
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		if (operator == '!') {
			return this.negate();
		}
		else
			return super.singleOp(ctx, operator);
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
		return FuzzyBoolean.valueOf(this.state >= FuzzyBoolean.HALF_TRUE_VALUE);
	}
	
	toRealBoolean(): boolean {
		return this.state >= FuzzyBoolean.HALF_TRUE_VALUE;
	}
	
	static toRealBoolean(obj: boolean|JelObject|null): boolean {
		if (typeof obj == 'boolean')
			return obj;
		else if (obj != null)
			return (obj as JelObject).toBoolean().toRealBoolean();
		else
			return false;
	}

	static toBoolean(obj: JelObject|null): any {
		if (obj)
			return obj.toBoolean();
		else
			return FuzzyBoolean.FALSE;
	}
	
	isClearlyTrue(): boolean {
		return this.state == FuzzyBoolean.TRUE_VALUE;
	}
	
	isClearlyFalse(): boolean {
		return this.state == FuzzyBoolean.FALSE_VALUE;
	}
	
	static fourWay_jel_mapping = {mainValue: 1, clearly: 2};
	static fourWay(ctx: Context, mainValue: boolean, clearly: boolean): FuzzyBoolean {
		return mainValue ? (clearly ? FuzzyBoolean.TRUE : FuzzyBoolean.BARELY_TRUE) :
			(clearly ? FuzzyBoolean.FALSE : FuzzyBoolean.BARELY_FALSE);
	}

	static twoPrecision_jel_mapping = {lowPrecision: 1, highPrecision: 2};
	static twoPrecision(ctx: Context, lowPrecision: boolean, highPrecision: boolean): FuzzyBoolean {
		return lowPrecision ? (highPrecision ? FuzzyBoolean.TRUE : FuzzyBoolean.BARELY_TRUE) :
			(highPrecision ? FuzzyBoolean.BARELY_FALSE : FuzzyBoolean.FALSE);
	}

	static valueOf(a: boolean): FuzzyBoolean {
		return a ? FuzzyBoolean.TRUE : FuzzyBoolean.FALSE;
	}

	static negate(a: any): FuzzyBoolean {
		if (a instanceof FuzzyBoolean)
			return a.negate();
		else
			return FuzzyBoolean.valueOf(!a);
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
	static and(ctx: Context, ...args: any[]): FuzzyBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (FuzzyBoolean.toRealBoolean(r))
				r = args[pos++];
			else
				return r;
		return r;	
	}

	static or_jel_mapping = {};
	static or(ctx: Context, ...args: any[]): FuzzyBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (FuzzyBoolean.toRealBoolean(r))
				return r;
			else
				r = args[pos++];
		return r;
	}

	static truest_jel_mapping = {a: 1, b: 2};
	static truest(ctx: Context, a0: any, b0: any): FuzzyBoolean {
		const a = FuzzyBoolean.toBoolean(a0), b = FuzzyBoolean.toBoolean(b0);
		return a.state > b.state ? a0 : b0;
	}

	static falsest_jel_mapping = {a: 1, b: 2};
	static falsest(ctx: Context, a0: any, b0: any): FuzzyBoolean {
		const a = FuzzyBoolean.toBoolean(a0), b = FuzzyBoolean.toBoolean(b0);
		return a.state < b.state ? a0 : b0;
	}

	static falsestWithPromises(ctx: Context, a: FuzzyBoolean | Promise<FuzzyBoolean>, b: FuzzyBoolean | Promise<FuzzyBoolean>): FuzzyBoolean | Promise<FuzzyBoolean> {
		if (a instanceof Promise || b instanceof Promise)
			return Util.resolveValues(FuzzyBoolean.falsest, ctx, a, b);
		else
			return FuzzyBoolean.falsest(ctx, a, b);
	}

	static andWithPromises(...args: (FuzzyBoolean | Promise<FuzzyBoolean>)[]): FuzzyBoolean | Promise<FuzzyBoolean> {
			return Util.resolveArray(args, args=>FuzzyBoolean.and(new Context(), ...args));
	}

	static orWithPromises(...args: (FuzzyBoolean | Promise<FuzzyBoolean>)[]): FuzzyBoolean | Promise<FuzzyBoolean> {
			return Util.resolveArray(args, args=>FuzzyBoolean.or(new Context(), ...args));
	}

	serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return this.state == 0 ? 'false' : this.state == 1 ? 'true' : `FuzzyBoolean(${this.state})`;
	}

	toString(): string {
		return this.serializeToString(true, 0, '');
	}
	
	static create_jel_mapping = {state: 1};
	static create(ctx: Context, ...args: any[]): FuzzyBoolean {
		const state = BaseTypeRegistry.get('JelNumber').toRealNumber(args[0]);
		return FuzzyBoolean.PREDEFINED.get(state) || new FuzzyBoolean(state);
	}
}

FuzzyBoolean.init();
FuzzyBoolean.prototype.toAbsoluteBoolean_jel_mapping = {};
FuzzyBoolean.prototype.or_jel_mapping = {a: 1};
FuzzyBoolean.prototype.and_jel_mapping = {a: 1};

BaseTypeRegistry.register('FuzzyBoolean', FuzzyBoolean);

