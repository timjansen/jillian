import JelObject from '../JelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Util from '../../util/Util';

/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 */
export default class JelBoolean extends JelObject implements SerializablePrimitive {
	state: number;

	JEL_PROPERTIES: Object = {state:1};
	
	static FALSE_VALUE = 0;
	static BARELY_FALSE_VALUE = 0.25;
	static HALF_TRUE_VALUE = 0.5;
	static BARELY_TRUE_VALUE = 0.75;
	static TRUE_VALUE = 1;

	static FALSE = new JelBoolean(JelBoolean.FALSE_VALUE);
	static BARELY_FALSE = new JelBoolean(JelBoolean.BARELY_FALSE_VALUE);
	static HALF_TRUE = new JelBoolean(JelBoolean.HALF_TRUE_VALUE);
	static BARELY_TRUE = new JelBoolean(JelBoolean.BARELY_TRUE_VALUE);
	static TRUE = new JelBoolean(JelBoolean.TRUE_VALUE);

	static PREDEFINED: Map<any, JelBoolean> = new Map();
	static NEGATE: Map<any, JelBoolean> = new Map();
	
	static JEL_PROPERTIES: Object = {FALSE_VALUE: 1, BARELY_FALSE_VALUE:1, HALF_TRUE_VALUE:1, BARELY_TRUE_VALUE:1, TRUE_VALUE:1,
																	FALSE:1, BARELY_FALSE:1, HALF_TRUE:1, BARELY_TRUE:1, TRUE:1};
	
	static init() {
		JelBoolean.PREDEFINED.set(JelBoolean.TRUE_VALUE, JelBoolean.TRUE);
		JelBoolean.PREDEFINED.set(JelBoolean.BARELY_TRUE_VALUE, JelBoolean.BARELY_TRUE);
		JelBoolean.PREDEFINED.set(JelBoolean.HALF_TRUE_VALUE, JelBoolean.HALF_TRUE);
		JelBoolean.PREDEFINED.set(JelBoolean.BARELY_FALSE_VALUE, JelBoolean.BARELY_FALSE);
		JelBoolean.PREDEFINED.set(JelBoolean.FALSE_VALUE, JelBoolean.FALSE);
		JelBoolean.PREDEFINED.set(true, JelBoolean.TRUE);
		JelBoolean.PREDEFINED.set(false, JelBoolean.FALSE);

		JelBoolean.NEGATE.set(JelBoolean.FALSE_VALUE, JelBoolean.TRUE);
		JelBoolean.NEGATE.set(JelBoolean.BARELY_FALSE_VALUE, JelBoolean.BARELY_TRUE);
		JelBoolean.NEGATE.set(JelBoolean.HALF_TRUE_VALUE, JelBoolean.HALF_TRUE);
		JelBoolean.NEGATE.set(JelBoolean.BARELY_TRUE_VALUE, JelBoolean.BARELY_FALSE);
		JelBoolean.NEGATE.set(JelBoolean.TRUE_VALUE, JelBoolean.FALSE);
	}

	
	constructor(state: any) { // state can be number | boolean | JelNumber. Any to avoid circular deps
		super();
		if (typeof state == 'boolean')
			this.state = state ? JelBoolean.TRUE_VALUE : JelBoolean.FALSE_VALUE;
		else if (typeof state == 'number')
			this.state = state;
		else
			this.state = state.value; // a value 0 - 1
	}
	
	op(ctx: Context, operator: string, right: JelObject): JelObject|Promise<JelObject> {
		if (right instanceof JelBoolean) {
			switch (operator) {
				case '==': 
					return JelBoolean.valueOf(this.toAbsoluteBoolean() == right.toAbsoluteBoolean());
				case '!=':
					return JelBoolean.valueOf(this.toRealBoolean() != right.toRealBoolean());
				case '===':
					return JelBoolean.valueOf(this.state === right.state);
				case '!==':
					return JelBoolean.valueOf(this.state !== right.state);
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

	negate():JelBoolean {
		return JelBoolean.NEGATE.get(this.state) || new JelBoolean(JelBoolean.TRUE_VALUE - this.state);
	}
		
	getSerializationProperties(): any[] {
		return [this.state];
	}
	
	toBoolean(): JelBoolean {
		return this;
	}

	toAbsoluteBoolean_jel_mapping: Object;
	toAbsoluteBoolean(): JelBoolean {
		return JelBoolean.valueOf(this.state >= JelBoolean.HALF_TRUE_VALUE);
	}
	
	toRealBoolean(): boolean {
		return this.state >= JelBoolean.HALF_TRUE_VALUE;
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
			return JelBoolean.FALSE;
	}
	
	isClearlyTrue(): boolean {
		return this.state == JelBoolean.TRUE_VALUE;
	}
	
	isClearlyFalse(): boolean {
		return this.state == JelBoolean.FALSE_VALUE;
	}
	
	static fourWay_jel_mapping = {mainValue: 1, clearly: 2};
	static fourWay(ctx: Context, mainValue: boolean, clearly: boolean): JelBoolean {
		return mainValue ? (clearly ? JelBoolean.TRUE : JelBoolean.BARELY_TRUE) :
			(clearly ? JelBoolean.FALSE : JelBoolean.BARELY_FALSE);
	}

	static twoPrecision_jel_mapping = {lowPrecision: 1, highPrecision: 2};
	static twoPrecision(ctx: Context, lowPrecision: boolean, highPrecision: boolean): JelBoolean {
		return lowPrecision ? (highPrecision ? JelBoolean.TRUE : JelBoolean.BARELY_TRUE) :
			(highPrecision ? JelBoolean.BARELY_FALSE : JelBoolean.FALSE);
	}

	static valueOf(a: boolean): JelBoolean {
		return a ? JelBoolean.TRUE : JelBoolean.FALSE;
	}

	static negate(a: any): JelBoolean {
		if (a instanceof JelBoolean)
			return a.negate();
		else
			return JelBoolean.valueOf(!a);
	}

	and_jel_mapping: Object;
	and(ctx: Context, a: JelBoolean): JelBoolean {
		return JelBoolean.and(ctx, this, a);
	}

	or_jel_mapping: Object;
	or(ctx: Context, a: JelBoolean): JelBoolean {
		return JelBoolean.or(ctx, this, a);
	}
	
	static and_jel_mapping = {};
	static and(ctx: Context, ...args: any[]): JelBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (JelBoolean.toRealBoolean(r))
				r = args[pos++];
			else
				return r;
		return r;	
	}

	static or_jel_mapping = {};
	static or(ctx: Context, ...args: any[]): JelBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (JelBoolean.toRealBoolean(r))
				return r;
			else
				r = args[pos++];
		return r;
	}

	static truest_jel_mapping = {a: 1, b: 2};
	static truest(ctx: Context, a0: any, b0: any): JelBoolean {
		const a = JelBoolean.toBoolean(a0), b = JelBoolean.toBoolean(b0);
		return a.state > b.state ? a0 : b0;
	}

	static falsest_jel_mapping = {a: 1, b: 2};
	static falsest(ctx: Context, a0: any, b0: any): JelBoolean {
		const a = JelBoolean.toBoolean(a0), b = JelBoolean.toBoolean(b0);
		return a.state < b.state ? a0 : b0;
	}

	static falsestWithPromises(ctx: Context, a: JelBoolean | Promise<JelBoolean>, b: JelBoolean | Promise<JelBoolean>): JelBoolean | Promise<JelBoolean> {
		if (a instanceof Promise || b instanceof Promise)
			return Util.resolveValues(JelBoolean.falsest, ctx, a, b);
		else
			return JelBoolean.falsest(ctx, a, b);
	}

	static andWithPromises(...args: (JelBoolean | Promise<JelBoolean>)[]): JelBoolean | Promise<JelBoolean> {
			return Util.resolveArray(args, args=>JelBoolean.and(new Context(), ...args));
	}

	static orWithPromises(...args: (JelBoolean | Promise<JelBoolean>)[]): JelBoolean | Promise<JelBoolean> {
			return Util.resolveArray(args, args=>JelBoolean.or(new Context(), ...args));
	}

	serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return this.state == 0 ? 'false' : this.state == 1 ? 'true' : `JelBoolean(${this.state})`;
	}

	toString(): string {
		return this.serializeToString(true, 0, '');
	}
	
	static create_jel_mapping = {state: 1};
	static create(ctx: Context, ...args: any[]): JelBoolean {
		const state = BaseTypeRegistry.get('JelNumber').toRealNumber(args[0]);
		return JelBoolean.PREDEFINED.get(state) || new JelBoolean(state);
	}
}

JelBoolean.init();
JelBoolean.prototype.toAbsoluteBoolean_jel_mapping = {};
JelBoolean.prototype.or_jel_mapping = {a: 1};
JelBoolean.prototype.and_jel_mapping = {a: 1};

BaseTypeRegistry.register('JelBoolean', JelBoolean);

