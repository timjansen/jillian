import BaseTypeRegistry from './BaseTypeRegistry';
import FunctionCallable from './FunctionCallable';
import JelObject from './JelObject';
import Context from './Context';
import Callable from './Callable';
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

const instanceFunctionCache = new Map<string, Map<string, Callable>>(); // type name -> function name -> Callable

/**
 * Implements operators and other functions required in JEL at runtime.
 */
export default class Runtime {
	static readonly STRICT_OPS: any = {'==': '===', '!=': '!==', '<': '<<', '>': '>>', '<=': '<<=', '>=': '>>='};
	static readonly LENIENT_OPS: any = {'===': '==', '!==': '!=', '<<': '<', '>>': '>', '<<=': '<=', '>>=': '>='};
	
	/**
	 * Executes the given operator on any non-promise type.
	 */
	static op(ctx: Context, operator: string, left: any, right: any): JelObject|Promise<JelObject> {
		if (left == null || right == null) {
			if (operator == '==' || operator == '===')
				return BaseTypeRegistry.get('Boolean').valueOf(left === right);
			else if (operator == '!=' || operator == '!==')
				return BaseTypeRegistry.get('Boolean').valueOf(left !== right);
			else if (operator in RELATIONAL_OPS)
				return BaseTypeRegistry.get('Boolean').FALSE;
			else
				throw new Error(`Operator ${operator} does not support null values.`);
		}
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

  // checks whether left is assignable to right
	static isClassCompatible(ctx: Context, left: any, className: string): boolean {
    if (left.className == className)
      return true;
    else if (left.superType)
      return Runtime.isClassCompatible(ctx, left.superType, className);
    else
      return false;
  }
  
	static instanceOf(ctx: Context, left: JelObject|null, right: JelObject|string|null): boolean {
		if (!right || !left)
			return false;
    
    let rightName: string;
    if (typeof right == 'string')
      rightName = right; 
    else if (right.getJelType() == 'Class') 
      rightName = (right as any).className;
    else if (right.getJelType() == 'NativeClass')
      rightName = (right as any).className;
		else if ((right as any).isIDBRef)
      rightName = (right as any).distinctName; 
    else if (right.getJelType() == 'String')
      rightName = (right as any).value;
    else
      return false;
    
    if (left instanceof BaseTypeRegistry.get('GenericJelObject'))
      return Runtime.isClassCompatible(ctx, (left as any).clazz, rightName);      
    else 
      return left.getJelType() == rightName;
	}
  
  static getNativeMethod(rebind: boolean, obj: JelObject, name: string) {
    let functionMap = instanceFunctionCache.get(obj.getJelType());
    if (functionMap) {
      const cachedImpl = functionMap.get(name);
      if (cachedImpl)
        return rebind ? cachedImpl.rebind(obj) : cachedImpl;
    }
    else {
      functionMap = new Map<string,Callable>();
      instanceFunctionCache.set(obj.getJelType(), functionMap);
    }
    
		const argMapper = (obj as any)[`${name}_jel_mapping`];
		if (argMapper) {
			const newCallable = new FunctionCallable((obj as any)[name], argMapper, obj, name);
      functionMap.set(name, newCallable);
			return newCallable;
		}

		if (name in obj) { 
			if (typeof (obj as any)[name] == 'function')
				throw new Error(`Method ${name} is not callable in JEL. It would need a _jel_mapping.`);
			else
				throw new Error(`Property ${name} is not accessible. It would need to be defined in JEL_PROPERTIES.`);
		}
		else
			throw new Error(`Can not find member or method ${name} in ${obj.getJelType()}.`);
  } 


 	static callMethod(ctx: Context, obj: JelObject|null, name: string, args: any[], argObj?: any): JelObject|null|Promise<JelObject|null> {
    if (!obj)
      throw new Error("Can't call method on null."); 
    const value = obj.member(ctx, name);
    if (value)
     return Util.resolveValue(value, resolvedValue=>{
        if (!(resolvedValue instanceof Callable))
          throw new Error(`Can not call method ${name}, not a Callable member. Value: ${resolvedValue}`);
        return resolvedValue.invokeWithObject(ctx, obj, args, argObj);
      });
    else
      return Runtime.getNativeMethod(false, obj, name).invokeWithObject(ctx, obj, args, argObj);
	}

  
	static member(ctx: Context, obj: JelObject|null, name: string, parameters?: Map<string, JelObject|null>): JelObject|null|Promise<JelObject|null> {
    if (!obj)
      throw new Error(`Can't get member ${name} of null.`);
    
    const value = obj.member(ctx, name, parameters);
    if (value !== undefined)
      return value instanceof Callable ? value.rebind(obj) : value;
    else
      return Runtime.getNativeMethod(true, obj, name);
	}

	
}

