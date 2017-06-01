'use strict';

const REVERSIBLE_OPS = {
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
	'>=': '>=',
	'>>=': '<<=',
	'<=': '>=',
	'<<=': '>>='
};

const NATIVE_OPS = {
	'+': (l,r)=>l+r,
	'-': (l,r)=>l-r,
	'*': (l,r)=>l*r,
	'/': (l,r)=>l/r,
	'&&': (l,r)=>l&&r,
	'||': (l,r)=>l||r,
	'==': (l,r)=>l===r,
	'===': (l,r)=>l===r,
	'!=': (l,r)=>l!==r,
	'!==': (l,r)=>l!==r,
	'<': (l,r)=>l<r,
	'<<': (l,r)=>l<r,
	'<=': (l,r)=>l<=r,
	'<<=': (l,r)=>l<=r,
	'>': (l,r)=>l>r,
	'>>': (l,r)=>l>r,
	'>=': (l,r)=>l>=r,
	'>>=': (l,r)=>l>=r
};

const SINGLE_NATIVE_OPS = {
	'!': (l)=>!l,
	'-': (l)=>-l,
	'+': (l)=>+l
}

/**
 * This is the base class for all objects that can be accessed by JEL. It implements operators and other functions required in JEL.
 */
class JelType {
	static op(operator, left, right) {
		if (left instanceof JelType)
			return left.op(operator, right);
		else if (operator in REVERSIBLE_OPS && right instanceof JelType) 
			return JelType.op(REVERSIBLE_OPS[operator], right, left);
		else if (left == null)
			return left; 
		else if (right == null)
			return right;

		const nativeOp = NATIVE_OPS[operator];
		if (!nativeOp)
			throw new Error(`Operator "${operator}" is not supported for primitive types`);
		return nativeOp(left, right);
	}
	
	static singleOp(operator, left) {
		if (left instanceof JelType)
			return left.singleOp(operator);
		else if (left == null)
			return left; 

		const nativeOp = SINGLE_NATIVE_OPS[operator];
		if (!nativeOp)
			throw new Error(`Operator "${operator}" is not supported for primitive types`);
		return nativeOp(left);
	}
	
	static toBoolean(obj) {
		if (obj instanceof JelType)
			return obj.toBoolean();
		else
			return !!obj;
	}
	
	op(operator, right) {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	singleOp(operator) {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	toBoolean() {
		throw new Error(`Boolean conversion not supported for this type`);
	}
	
	getSerializationProperties() {
		throw new Error(`getSerializationProperties() not implemented in ${this.constructor.name}`);
	}

}

module.exports = JelType;