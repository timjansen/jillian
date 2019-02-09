import JelObject from '../JelObject';
import TypeChecker from './TypeChecker';
import Class from './Class';
import NativeJelObject from './NativeJelObject';
import Runtime from '../Runtime';
import Context from '../Context';
import BaseTypeRegistry from '../BaseTypeRegistry';
import SerializablePrimitive from '../SerializablePrimitive';
import Util from '../../util/Util';

/**
 * Represents a boolean type that has, beside clear true and false, also a notion of 'barely true' and 'barely false'.
 */
export default class JelBoolean extends NativeJelObject implements SerializablePrimitive {
  state_jel_property: boolean;
	state: number;

  static clazz: Class|undefined;
	
	static FALSE_VALUE_jel_property = true;
  static FALSE_VALUE = 0;
	static BARELY_FALSE_VALUE_jel_property = true;
  static BARELY_FALSE_VALUE = 0.25;
	static HALF_TRUE_VALUE_jel_property = true;
  static HALF_TRUE_VALUE = 0.5;
	static BARELY_TRUE_VALUE_jel_property = true;
  static BARELY_TRUE_VALUE = 0.75;
	static TRUE_VALUE_jel_property = true;
  static TRUE_VALUE = 1;

	static FALSE_jel_property = true;
  static FALSE = new JelBoolean(JelBoolean.FALSE_VALUE);
	static BARELY_FALSE_jel_property = true;
  static BARELY_FALSE = new JelBoolean(JelBoolean.BARELY_FALSE_VALUE);
	static HALF_TRUE_jel_property = true;
  static HALF_TRUE = new JelBoolean(JelBoolean.HALF_TRUE_VALUE);
	static BARELY_TRUE_jel_property = true;
  static BARELY_TRUE = new JelBoolean(JelBoolean.BARELY_TRUE_VALUE);
	static TRUE_jel_property = true;
  static TRUE = new JelBoolean(JelBoolean.TRUE_VALUE);

	static PREDEFINED: Map<any, JelBoolean> = new Map();
	static NEGATE: Map<any, JelBoolean> = new Map();
	
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

	static jelName = 'Boolean';
  
	constructor(state: any) { // state can be number | boolean | Float. Any to avoid circular deps
		super('Boolean');
		if (typeof state == 'boolean')
			this.state = state ? JelBoolean.TRUE_VALUE : JelBoolean.FALSE_VALUE;
		else if (typeof state == 'number')
			this.state = state;
		else
			this.state = state.value; // a value 0 - 1
	}
  
  get clazz(): Class {
    return JelBoolean.clazz!;
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
					const jn = BaseTypeRegistry.get('Float');
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

	negate_jel_mapping: boolean;
	negate():JelBoolean {
		return JelBoolean.NEGATE.get(this.state) || new JelBoolean(JelBoolean.TRUE_VALUE - this.state);
	}
		
	getSerializationProperties(): any[] {
		return [this.state];
	}
	
 	toBoolean_jel_mapping: boolean;
	toBoolean(): JelBoolean {
		return this;
	}

	toAbsoluteBoolean_jel_mapping: boolean;
	toAbsoluteBoolean(): JelBoolean {
		return JelBoolean.valueOf(this.state >= JelBoolean.HALF_TRUE_VALUE);
	}
	
	toRealBoolean(): boolean {
		return this.state >= JelBoolean.HALF_TRUE_VALUE;
	}
	
	static toRealBoolean(obj: boolean|JelObject|null|undefined): boolean {
		if (typeof obj == 'boolean')
			return obj;
		else if (obj != null) {
			const x = (obj as JelObject).toBoolean();
			if (x instanceof JelBoolean)
				return x.toRealBoolean();
			else
				return x;
		}
		return false;
	}

 	static toBoolean_jel_mapping = true;
	static toBoolean(ctx: Context, obj: JelObject|null): any {
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
	
	static fourWay_jel_mapping = true;
	static fourWay(ctx: Context, mainValue0: any, clearly0: any): JelBoolean {
		const mainValue = TypeChecker.realBoolean(mainValue0, 'mainValue');
		const clearly = TypeChecker.realBoolean(clearly0, 'clearly');
		return mainValue ? (clearly ? JelBoolean.TRUE : JelBoolean.BARELY_TRUE) :
			(clearly ? JelBoolean.FALSE : JelBoolean.BARELY_FALSE);
	}

	static twoPrecision_jel_mapping = true;
	static twoPrecision(ctx: Context, lowPrecision0: boolean, highPrecision0: boolean): JelBoolean {
		const lowPrecision = TypeChecker.realBoolean(lowPrecision0, 'lowPrecision');
		const highPrecision = TypeChecker.realBoolean(highPrecision0, 'highPrecision');
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
		return JelBoolean.andJs(this, TypeChecker.boolean(a, 'a'));
	}

	or_jel_mapping: Object;
	or(ctx: Context, a: JelBoolean): JelBoolean {
		return JelBoolean.orJs(this, TypeChecker.boolean(a, 'a'));
	}
	
	static and_jel_mapping = true;
	static and(ctx: Context, args: any): JelBoolean {
    return JelBoolean.andJs(...args.elements);
  }

  static andJs(...args: any[]): JelBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (TypeChecker.realBoolean(r, 'args'))
				r = args[pos++];
			else
				return r;
		return r;	
	}

	static or_jel_mapping = true;
	static or(ctx: Context, args: any): JelBoolean {
    return JelBoolean.orJs(...args.elements);
  }

  static orJs(...args: any[]): JelBoolean {
		let pos = 1;
		let r = args[0];
		while (pos < args.length)
			if (TypeChecker.realBoolean(r, 'args'))
				return r;
			else
				r = args[pos++];
		return r;
	}

	static truest_jel_mapping = true;
	static truest(ctx: Context, a0: any, b0: any): JelBoolean {
		const a = TypeChecker.boolean(a0, 'a'), b = TypeChecker.boolean(b0, 'b');
		return a.state > b.state ? a : b;
	}

	static falsest_jel_mapping = true;
	static falsest(ctx: Context, a0: any, b0: any): JelBoolean {
		const a = TypeChecker.boolean(a0, 'a'), b = TypeChecker.boolean(b0, 'b');
		return a.state < b.state ? a : b;
	}

	static falsestWithPromises(ctx: Context, a: JelBoolean | Promise<JelBoolean>, b: JelBoolean | Promise<JelBoolean>): JelBoolean | Promise<JelBoolean> {
		if (a instanceof Promise || b instanceof Promise)
			return Util.resolveValues(JelBoolean.falsest, ctx, a, b);
		else
			return JelBoolean.falsest(ctx, a, b);
	}

	static andWithPromises(...args: (JelBoolean | Promise<JelBoolean>)[]): JelBoolean | Promise<JelBoolean> {
			return Util.resolveArray(args, args=>JelBoolean.andJs(...args));
	}

	static orWithPromises(...args: (JelBoolean | Promise<JelBoolean>)[]): JelBoolean | Promise<JelBoolean> {
			return Util.resolveArray(args, args=>JelBoolean.orJs(...args));
	}

	serializeToString(pretty: boolean, indent: number, spaces: string) : string {
		return this.state == 0 ? 'false' : this.state == 1 ? 'true' : `Boolean(${this.state})`;
	}

	toString(): string {
		return this.serializeToString(true, 0, '');
	}
	
	static create_jel_mapping = {state: 1};
	static create(ctx: Context, ...args: any[]): JelBoolean {
		const state = TypeChecker.realNumber(args[0], 'state');
		return JelBoolean.PREDEFINED.get(state) || new JelBoolean(state);
	}
}

JelBoolean.init();
JelBoolean.prototype.toBoolean_jel_mapping = true;
JelBoolean.prototype.toAbsoluteBoolean_jel_mapping = true;
JelBoolean.prototype.or_jel_mapping = true;
JelBoolean.prototype.and_jel_mapping = true;
JelBoolean.prototype.negate_jel_mapping = true;
JelBoolean.prototype.state_jel_property = true;

BaseTypeRegistry.register('Boolean', JelBoolean);

