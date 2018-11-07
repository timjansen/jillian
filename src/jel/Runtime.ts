import BaseTypeRegistry from './BaseTypeRegistry';
import FunctionCallable from './FunctionCallable';
import JelObject from './JelObject';
import Context from './Context';
import Util from '../util/Util';


const RELATIONAL_OPS: any = {
	'>': 1,
	'>>': 1,
	'<': 1,
	'<<': 1,
	'>=': 1,
	'>>=': 1,
	'<=': 1,
	'<<=': 1
};

/**
 * Implements operators and other functions required in JEL at runtime.
 */
export default class Runtime {
	static readonly NAMED_ARGUMENT_METHOD = 'named';
	static readonly STRICT_OPS: any = {'==': '===', '!=': '!==', '<': '<<', '>': '>>', '<=': '<<=', '>=': '>>='};
	static readonly LENIENT_OPS: any = {'===': '==', '!==': '!=', '<<': '<', '>>': '>', '<<=': '<=', '>>=': '>='};
	
	/**
	 * Executes the given operator on any non-promise type.
	 */
	static op(ctx: Context, operator: string, left: any, right: any): JelObject|Promise<JelObject> {
		if (left == null || right == null) {
			if (operator == '==' || operator == '===')
				return BaseTypeRegistry.get('JelBoolean').valueOf(left === right);
			else if (operator == '!=' || operator == '!==')
				return BaseTypeRegistry.get('JelBoolean').valueOf(left !== right);
			else if (operator == 'instanceof' || operator in RELATIONAL_OPS)
				return BaseTypeRegistry.get('JelBoolean').FALSE;
			else
				throw new Error(`Operator ${operator} does not support null values.`);
		}
		else if (operator == 'instanceof') 
			return BaseTypeRegistry.get('JelBoolean').valueOf(Runtime.instanceOf(ctx, left, right));
		else 
			return left.op(ctx, operator, right);
	}
	
	// op version with promises to simplify calculations
	static opWithPromises(ctx: Context, operator: string, left: JelObject | Promise<JelObject>, right: JelObject | Promise<JelObject>): JelObject | Promise<JelObject> {
		return Util.resolveValues((left: any, right: any)=>Runtime.op(ctx, operator, left, right), left, right);
	}

	
	static singleOp(ctx: Context, operator: string, left: any): JelObject|Promise<JelObject> {
		if (left instanceof JelObject)
			return left.singleOp(ctx, operator);
		else if (left == null)
			return left; 
		throw new Error(`Operator "${operator}" is not supported for primitive types`);
	}

	static singleOpWithPromise(ctx: Context, operator: string, left: JelObject | Promise<JelObject>): JelObject | Promise<JelObject> {
		return Util.resolveValue(left, (left: any)=>Runtime.singleOp(ctx, operator, left));
	}
	
	static instanceOf(ctx: Context, left: JelObject|null, right: JelObject|null): boolean {
		if (!right || !(right as any).isDBRef)
			return false;
		
		if (left)
			return left.getJelType().replace(/^Jel/, '') == (right as any).distinctName;
		else
			return false;
	}

	static member(ctx: Context, obj: any, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null> {
		const isClass = JelObject.isPrototypeOf(obj);
		if (isClass) {
			if (obj.JEL_PROPERTIES && name in obj.JEL_PROPERTIES)
				return BaseTypeRegistry.mapNativeTypes(obj[name] as any);
		}
		else {
			const value = obj.member(ctx, name, parameters);
			if (value !== undefined)
				return value;
		}

		const callableCacheKey = isClass ? `${name}_${obj.name}_jel_callable` : `${name}_jel_callable`;
		const callable = obj[callableCacheKey];
		if (callable)
				return callable;

		const argMapper = obj[`${name}_jel_mapping`];
		if (argMapper) {
			const newCallable = new FunctionCallable(obj[name], argMapper, obj, name);
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

	
}

