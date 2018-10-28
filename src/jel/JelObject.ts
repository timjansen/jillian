import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';

// ops that can swap the left and right operands
const REVERSIBLE_OPS: any = {
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
const INVERTIBLE_OPS: any = {
	'!=': '==',
	'!==': '===',
	'>=': '<',
	'<=': '>',
	'>>=': '<<',
	'<<=': '>>'
};


/**
 * This is the base class for all objects that can be accessed by JEL. It implements operators and other functions required in JEL.
 */
export default class JelObject {
	reverseOps: Object;
	JEL_PROPERTIES: Object;

	constructor() {
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
			if (operator in INVERTIBLE_OPS)
				return BaseTypeRegistry.get('FuzzyBoolean').negate(this.op(ctx, INVERTIBLE_OPS[operator], right));
			if (operator == '<')
				return BaseTypeRegistry.get('FuzzyBoolean').truest(ctx, this.op(ctx, '>', right), this.op(ctx, '==', right)).negate();
			if (operator == '<<')
				return BaseTypeRegistry.get('FuzzyBoolean').truest(ctx, this.op(ctx, '>>', right), this.op(ctx, '===', right)).negate();
			if (right.reverseOps && operator in right.reverseOps)
				return right.opReversed(ctx, operator, this);
		}
		throw new Error(`Operator "${operator}" is not supported for type "${this.constructor.name}" as left operand and right operand "${right == null ? 'null' : right.constructor.name}"`);
	}
	
	// To be used if the right-hand side is this type, and the left-hand side is a primitive.
	// Left is guaranteed to be a non-null primitive.
	// You must also define the supported operators in the field reverseOps!
	// Usually this is used for the operators '-' and '/', and possibly comparisons as well.
	opReversed_jel_mapping: Object;
	opReversed(ctx: Context, operator: string, left: JelObject): JelObject|Promise<JelObject> {
		if (this.reverseOps && operator in this.reverseOps && operator in REVERSIBLE_OPS)
			return this.op(ctx, REVERSIBLE_OPS[operator], left);
		throw new Error(`Operator "${operator}" is not supported for type "${this.constructor.name}" (in reversed operation)`);
	}

	
	/*
	 * Ops that may be implemented: '+', '-', '!', 'abs'
	 */
	singleOp_jel_mapping: Object;
	singleOp(ctx: Context, operator: string): JelObject|Promise<JelObject> {
		throw new Error(`Operator "${operator}" is not supported for type "${this.constructor.name}"`);
	}

	/**
	 * Returns the value of the member, or undefined if there is no member of this name in the object.
	 */ 
	member_jel_mapping: Object;
	member(ctx: Context, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null>|undefined {
		if (this.JEL_PROPERTIES && name in this.JEL_PROPERTIES)
			return BaseTypeRegistry.mapNativeTypes((this as any)[name]);
		return undefined;
	}
	
	toBoolean_jel_mapping: Object;
	toBoolean(): any { // this is any to avoid the circular dep in TypeScript, but would be FuzzyB
		throw new Error(`Boolean conversion not supported for type "${this.constructor.name}"`);
	}
	
	getSerializationProperties(): Object|any[] {
		throw new Error(`getSerializationProperties() not implemented in ${this.constructor.name}`);
	}
	
}

JelObject.prototype.reverseOps = {};

JelObject.prototype.op_jel_mapping = {operator:1, right:2};
JelObject.prototype.opReversed_jel_mapping = {operator:1, left:2};
JelObject.prototype.singleOp_jel_mapping = {operator: 1};
JelObject.prototype.toBoolean_jel_mapping = {};
