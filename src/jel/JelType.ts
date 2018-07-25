
import FunctionCallable from './FunctionCallable';

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

const NATIVE_OPS: any = {
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
	'!=': (l: any,r: any): any =>l!=r,
	'!==': (l: any,r: any): any =>l!==r,
	'<': (l: any,r: any): any =>l<r,
	'<<': (l: any,r: any): any =>l<r,
	'<=': (l: any,r: any): any =>l<=r,
	'<<=': (l: any,r: any): any =>l<=r,
	'>': (l: any,r: any): any =>l>r,
	'>>': (l: any,r: any): any =>l>r,
	'>=': (l: any,r: any): any =>l>=r,
	'>>=': (l: any,r: any): any =>l>=r
};

const SINGLE_NATIVE_OPS: any = {
	'!': (l: any): any=>!l,
	'-': (l: any): any=>-l,
	'+': (l: any): any=>+l,
	'abs': (l: any): any=>Math.abs(l)
}

const NATIVE_PROPERTIES: any = {
	string: {length: true}
};

const NATIVE_METHODS: any = {
	string: {trim: {}}
};

/**
 * This is the base class for all objects that can be accessed by JEL. It implements operators and other functions required in JEL.
 */
export default class JelType {
	reverseOps: Object;
	JEL_PROPERTIES: Object;
	static readonly NAMED_ARGUMENT_METHOD = 'named';
	static readonly STRICT_OPS: any = {'==': '===', '!=': '!==', '<': '<<', '>': '>>', '<=': '<<=', '>=': '>>='};
	static readonly LENIENT_OPS: any = {'===': '==', '!==': '!=', '<<': '<', '>>': '>', '<<=': '<=', '>>=': '>='};

	/**
	 * Executes the given operator on any non-promise type.
	 */
	static op(operator: string, left: any, right: any): any {
		if (left == null || right == null) {
			if (operator == '==' || operator == '===')
				return left === right;
			else if (operator == '!=' || operator == '!==')
				return left !== right;
			else 
				return left == null ? left : right;
		}
		else if (left instanceof JelType)
			return left.op(operator, right);
		else if (right instanceof JelType) {
			if (operator in REVERSIBLE_OPS) 
				return JelType.op(REVERSIBLE_OPS[operator], right, left);
			else if (operator in right.reverseOps) 
				return right.opReversed(operator, left);
		}
		else if (operator in NATIVE_OPS)
			return NATIVE_OPS[operator](left, right);
		throw new Error(`Operator "${operator}" is not supported for primitive types`);
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
	
	static member(obj: any, name: string, parameters?: Map<string, any>): any {
		const isClass = JelType.isPrototypeOf(obj);
		if (isClass || obj instanceof JelType) { 
			if (isClass) {
				if (obj.JEL_PROPERTIES && name in obj.JEL_PROPERTIES)
					return obj[name];
			}
			else {
				const value = obj.member(name, parameters);
				if (value !== undefined)
					return value;
			}

			const callableCacheKey = isClass ? `${name}_${obj.name}_jel_callable` : `${name}_jel_callable`;
			const callable = obj[callableCacheKey];
			if (callable)
					return callable;

			const argMapper = obj[`${name}_jel_mapping`];
			if (argMapper) {
				const newCallable = new FunctionCallable(obj[name], argMapper, obj, name, argMapper['>ctx'] != null);
				obj[callableCacheKey] = newCallable;
				return newCallable;
			}
			
			if (name in obj) { 
				if (typeof obj[name] == 'function')
					throw new Error(`Method ${name} is not callable in JEL. It would need a _jel_mapping.`);
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
	
	/*
	 * Ops that may be implemented:
	 * '+', '-', '*', '/', '%': arithmetic
	 * '==', '===', '!=', '!==', '<', '<<', '<=', '<<=', '>', '>>', '>=', '>>=': Comparisons
	 * 
	 * Note that when yoiu override this method, but still call it for unsupported operators, 
	 * you only need to implement '==', '===', '>' and '>>' for a complete set of comparisons.
	 */
	op_jel_mapping: Object;
	op(operator: string, right: any): any {
		if (operator in INVERTIBLE_OPS)
			return !this.op(INVERTIBLE_OPS[operator], right);
		if (operator == '<')
			return !this.op('>', right) && !!this.op('==', right);
		if (operator == '<<')
			return !this.op('>>', right) && !!this.op('===', right);
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	// To be used if the right-hand side is this type, and the left-hand side is a primitive.
	// Left is guaranteed to be a non-null primitive.
	// You must also define the supported operators in the field reverseOps!
	// Usually this is used for the operators '-' and '/', and possibly comparisons as well.
	opReversed_jel_mapping: Object;
	opReversed(operator: string, left: any): any {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	
	/*
	 * Ops that may be implemented: '+', '-', '!', 'abs'
	 */
	singleOp_jel_mapping: Object;
	singleOp(operator: string): any {
		throw new Error(`Operator "${operator}" is not supported for this type`);
	}

	member(name: string, parameters?: Map<string, any>): any {
		if (this.JEL_PROPERTIES && name in this.JEL_PROPERTIES)
			return (this as any)[name];
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
