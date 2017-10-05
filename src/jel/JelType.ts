
import FunctionCallable from './FunctionCallable';

// ops that can swap the left and right operands
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
	'>=': '<=',
	'>>=': '<<=',
	'<=': '>=',
	'<<=': '>>='
};

const NATIVE_OPS = {
	'+': (l: any,r: any): any =>l+r,
	'-': (l: any,r: any): any =>l-r,
	'*': (l: any,r: any): any =>l*r,
	'/': (l: any,r: any): any =>l/r,
	'%': (l: any,r: any): any =>((l%r)+r)%r,
	'&&': (l: any,r: any): any =>l&&r,
	'||': (l: any,r: any): any =>l||r,
	'.': (l: any,r: any): any =>l[r],
	'==': (l: any,r: any): any =>l===r,
	'===': (l: any,r: any): any =>l===r,
	'<': (l: any,r: any): any =>l<r,
	'<<': (l: any,r: any): any =>l<r,
	'<=': (l: any,r: any): any =>l<=r,
	'<<=': (l: any,r: any): any =>l<=r,
	'>': (l: any,r: any): any =>l>r,
	'>>': (l: any,r: any): any =>l>r,
	'>=': (l: any,r: any): any =>l>=r,
	'>>=': (l: any,r: any): any =>l>=r
};

const SINGLE_NATIVE_OPS = {
	'!': (l: any): any=>!l,
	'-': (l: any): any=>-l,
	'+': (l: any): any=>+l
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
export default class JelType {
	reverseOps: Object;
	static readonly NAMED_ARGUMENT_METHOD = 'named';

	
	static op(operator: string, left: any, right: any): any {
		if (left instanceof JelType)
			return left.op(operator, right);
		else if (left == null)
			return left; 
		else if (right == null)
			return right;
		else if (right instanceof JelType && operator in REVERSIBLE_OPS) 
			return JelType.op(REVERSIBLE_OPS[operator], right, left);
		else if (right instanceof JelType && operator in right.reverseOps) 
			return right.opReversed(operator, left);
		else if (operator == '!=')
				return !JelType.op('==', left, right);
		else if (operator == '!==')
				return !JelType.op('===', left, right);
		else if (operator == '>=')
				return !JelType.op('<', left, right);
		else if (operator == '>')
				return !JelType.op('<', left, right) && !JelType.op('==', left, right);

		const nativeOp = NATIVE_OPS[operator];
		if (!nativeOp)
			throw new Error(`Operator "${operator}" is not supported for primitive types`);
		return nativeOp(left, right);
	}
	
	static singleOp(operator: string, left: any): any {
		if (left instanceof JelType)
			return left.singleOp(operator);
		else if (left == null)
			return left; 

		const nativeOp = SINGLE_NATIVE_OPS[operator];
		if (!nativeOp)
			throw new Error(`Operator "${operator}" is not supported for primitive types`);
		return nativeOp(left);
	}
	
	static toBoolean(obj: any): boolean {
		if (obj instanceof JelType)
			return obj.toBoolean();
		else
			return !!obj;
	}
	
	static member(obj: any, name: string): any {
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
				const newCallable = new FunctionCallable(obj[name], argMapper, obj, name, argMapper['>ctx'] != null);
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
			return new FunctionCallable(obj[name], nativeMethodMapping, obj);

		return undefined;
	}
	
	op_jel_mapping: Object;
	op(operator: string, right: any): any {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	// To be used if the right-hand side is this type, and the left-hand side is a primitive.
	// Left is guaranteed to be a non-null primitive.
	// You must also define the supported operators in reverseOps!
	opReversed_jel_mapping: Object;
	opReversed(operator: string, left: any): any {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	
	singleOp_jel_mapping: Object;
	singleOp(operator: string): any {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	toBoolean_jel_mapping: Object;
	toBoolean(): boolean {
		throw new Error(`Boolean conversion not supported for this type`);
	}
	
	getSerializationProperties(): Object|any[] {
		throw new Error(`getSerializationProperties() not implemented in ${this.constructor.name}`);
	}
}

JelType.prototype.reverseOps = {};

JelType.prototype.op_jel_mapping = {operator:0,right:1};
JelType.prototype.opReversed_jel_mapping = {operator:0,left:1};
JelType.prototype.singleOp_jel_mapping = {operator:0};
JelType.prototype.toBoolean_jel_mapping = {};
