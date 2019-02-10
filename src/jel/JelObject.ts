import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';
import Callable from './Callable';
import Serializer from './Serializer';
import {IDbRef, isDbRef} from './IDatabase';

/**
 * This is the base class for all objects that can be accessed by JEL. It implements operators and other functions required in JEL.
 */
export default abstract class JelObject {
	reverseOps: Object;

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
 
   abstract get clazz(): any;

	/*
	 * Ops that may be implemented:
	 * '+', '-', '*', '/', '%': arithmetic
	 * '==', '===', '!=', '!==', '<', '<<', '<=', '<<=', '>', '>>', '>=', '>>=': Comparisons
	 * 
	 * Note that when you override this method, but still call it for unsupported operators, 
	 * you only need to implement '==', '===', '>' and '>>' for a complete set of comparisons.
	 */
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
	opReversed_jel_mapping: boolean;
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (this.reverseOps && operator in this.reverseOps && operator in JelObject.SWAP_OPS)
			return this.op(ctx, JelObject.SWAP_OPS[operator], left);
		throw new Error(`Operator "${operator}" is not supported for type "${this.className}" (in reversed operation)`);
	}

	
	/*
	 * Ops that may be implemented: '+', '-', '!'
	 */
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		throw new Error(`Operator "${operator}" is not supported for type "${this.className}"`);
	}

	/**
	 * Returns the value of the member, or undefined if there is no member of this name in the object.
	 */ 
	abstract member(ctx: Context, name: string): JelObject|null|Promise<JelObject|null>|undefined;

 	/**
	 * Returns the value of the method, or undefined if there is no method of this name in the object.
   * The returned method won't be bound to the object (use member() if you want that).
	 */ 
  method(ctx: Context, name: string): Callable|undefined {
    const method = this.clazz.allMethods.elements.get(name);
    if (method)
      return (method as any).callable;
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
  
	// JEL
	toBoolean(): any { // this is any to avoid the circular dep in TypeScript, but would be FuzzyB
		throw new Error(`Boolean conversion not supported for type "${this.className}"`);
	}

	toString(): string {
		return Serializer.serialize(this, true);
	}
	
	getSerializationProperties(): any {
		throw new Error(`getSerializationProperties() not implemented in ${this.className}`);
	}
	
}
JelObject.prototype.reverseOps = {};

const p: any = JelObject.prototype;
p.className_jel_property = true;
p.op_jel_mapping = true;
p.opReversed_jel_mapping = true;
p.singleOp_jel_mapping = true;
p.toBoolean_jel_mapping = true;

