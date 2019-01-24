import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';
import Serializer from './Serializer';
import {IDbRef, isDbRef} from './IDatabase';

/**
 * This is the base class for all objects that can be accessed by JEL. It implements operators and other functions required in JEL.
 */
export default class JelObject {
	reverseOps: Object;
	JEL_PROPERTIES: Object;

	// ops that can swap the left and right operands
	static readonly SWAP_OPS: any = {
		'+': '+',
		'*': '*',
		'==': '==',
		'!=': '!=',
		'===': '===',
		'!==': '!==',
		'>': '<',
		'>>': '<<',
		'<': '>',
		'<<': '>>',
		'>=': '<=',
		'>>=': '<<=',
		'<=': '>=',
		'<<=': '>>='
	};
	
	// ops that can be inverted and thus do not need to be implemented
	static readonly INVERTIBLE_OPS: any = {
		'!=': '==',
		'!==': '===',
		'>=': '<',
		'<=': '>',
		'>>=': '<<',
		'<<=': '>>'
	};

	
	constructor(public className: string) {
	}
 
 
	/*
	 * Ops that may be implemented:
	 * '+', '-', '*', '/', '%': arithmetic
	 * '==', '===', '!=', '!==', '<', '<<', '<=', '<<=', '>', '>>', '>=', '>>=': Comparisons
	 * 
	 * Note that when you override this method, but still call it for unsupported operators, 
	 * you only need to implement '==', '===', '>' and '>>' for a complete set of comparisons.
	 */
	op_jel_mapping: Object;
	op(ctx: Context, operator: string, right: JelObject|null): JelObject|Promise<JelObject> {
		if (right != null) {
			if (right.reverseOps && operator in right.reverseOps && right.className != this.className)
				return right.opReversed(ctx, operator, this);
			if (operator in JelObject.INVERTIBLE_OPS)
				return BaseTypeRegistry.get('Boolean').negate(this.op(ctx, JelObject.INVERTIBLE_OPS[operator], right));
			if (operator == '<')
				return BaseTypeRegistry.get('Boolean').truest(ctx, this.op(ctx, '>', right), this.op(ctx, '==', right)).negate();
			if (operator == '<<')
				return BaseTypeRegistry.get('Boolean').truest(ctx, this.op(ctx, '>>', right), this.op(ctx, '===', right)).negate();
		}
		throw new Error(`Operator "${operator}" is not supported for type "${this.className}" as left operand and right operand "${right == null ? 'null' : right.className}"`);
	}
	
	// To be used if the right-hand side is this type, and the left-hand side is a type unaware of this type.
	// You must also define the supported operators in the field reverseOps!
	// Usually this is used for the operators '-' and '/', and possibly comparisons as well.
	// For all others, the default is to loop the operator up in SWAP_OPS to find out whether it can swap operands.
	opReversed_jel_mapping: Object;
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (this.reverseOps && operator in this.reverseOps && operator in JelObject.SWAP_OPS)
			return this.op(ctx, JelObject.SWAP_OPS[operator], left);
		throw new Error(`Operator "${operator}" is not supported for type "${this.className}" (in reversed operation)`);
	}

	
	/*
	 * Ops that may be implemented: '+', '-', '!'
	 */
	singleOp_jel_mapping: Object;
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		throw new Error(`Operator "${operator}" is not supported for type "${this.className}"`);
	}

	/**
	 * Returns the value of the member, or undefined if there is no member of this name in the object.
	 */ 
	member_jel_mapping: Object;
	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
    // TODO: cleanup this method after converting everything to JEL Class!!
    const c: any = (this as any).clazz;
    if (c && c.allMethods) {
      const m = c.allMethods.elements.get(name) as any;
      if (m)
        return m.callable;
    }
		if ((name in this.JEL_PROPERTIES) || (this as any)[name+'_jel_mapping']===true)        // JEL_PROPERTIES are deprecated, remove when new native is everywhere
			return BaseTypeRegistry.mapNativeTypes((this as any)[name]);
		return undefined;
	}
  
	withMember<T>(ctx: Context, name: string, f: (value: any)=>T): T | Promise<T> {
		const v = this.member(ctx, name);
		if (isDbRef(v))
			return (v as any).with(ctx, f);
		else if (v instanceof Promise)
			return v.then(val=>isDbRef(v) ? (val as any).with(ctx, f) : f(val));
		else
			return f(v);
	}
  
	toBoolean_jel_mapping: Object;
	toBoolean(): any { // this is any to avoid the circular dep in TypeScript, but would be FuzzyB
		throw new Error(`Boolean conversion not supported for type "${this.className}"`);
	}
	
	getJelType_jel_mapping: Object;
	getJelType(): string {
		return this.className;
	}

	toString(): string {
		return Serializer.serialize(this, true);
	}
	
	getSerializationProperties(): Object|any[] {
		throw new Error(`getSerializationProperties() not implemented in ${this.className}`);
	}
	
}

JelObject.prototype.JEL_PROPERTIES = {};
JelObject.prototype.reverseOps = {};

JelObject.prototype.op_jel_mapping = ['operator', 'right'];
JelObject.prototype.opReversed_jel_mapping = ['operator', 'left'];
JelObject.prototype.singleOp_jel_mapping = ['operator'];
JelObject.prototype.toBoolean_jel_mapping = [];
JelObject.prototype.getJelType_jel_mapping = [];

