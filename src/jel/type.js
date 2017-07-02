'use strict';

const Callable = require('./callable.js');

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
	'%': (l,r)=>((l%r)+r)%r,
	'&&': (l,r)=>l&&r,
	'||': (l,r)=>l||r,
	'.': (l,r)=>l[r],
	'==': (l,r)=>l===r,
	'===': (l,r)=>l===r,
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

const NATIVE_PROPERTIES = {
	string: {length: true}
};

const NATIVE_METHODS = {
	string: {trim: {}}
};

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
		else if (operator == '!=')
				return !this.op('==', right);
		else if (operator == '!==')
				return !this.op('===', right);

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
	
	static member(obj, name) {
		const isClass = JelType.isPrototypeOf(obj);
		if (isClass || obj instanceof JelType) { 
			const callableCacheKey = isClass ? `${name}_${obj.name}_jel_callable` : `${name}_jel_callable`;
			const callable = obj[callableCacheKey];
			if (callable)
					return callable;
			if (obj.JEL_PROPERTIES && name in obj.JEL_PROPERTIES)
				return obj[name];

			const argMapper = obj[`${name}_jel_mapping`];
			if (argMapper) {
				const newCallable = new Callable(obj[name], argMapper, obj, name, !!argMapper['>ctx']);
				obj[callableCacheKey] = newCallable;
				return newCallable;
			}
			
			if (name in obj) { 
				if (typeof obj[name] == 'function')
					throw new Error(`Method ${name} is callable in JEL. It would need a _jel_mapping.`);
				else
					throw new Error(`Property ${name} is not accessible. It would need to be defined in JEL_PROPERTIES.`);
			}
			else
				throw new Error(`Unknown property ${name}.`);
		}
		
		const nativeType = typeof obj;
		if (NATIVE_PROPERTIES[nativeType] && NATIVE_PROPERTIES[nativeType][name])
			return obj[name];
		
		const nativeMethodMapping = NATIVE_METHODS[nativeType] && NATIVE_METHODS[nativeType][name];
		if (nativeMethodMapping) 
			return new Callable(obj[name], nativeMethodMapping, obj);

		return undefined;
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

JelType.prototype.op_jel_mapping = {operator:0,right:1};
JelType.prototype.singleOp_jel_mapping = {operator:0};
JelType.prototype.toBoolean_jel_mapping = {};

module.exports = JelType;