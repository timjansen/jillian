import BaseTypeRegistry from './BaseTypeRegistry';
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
    else if (operator == '!')
      return BaseTypeRegistry.get('Boolean').TRUE;
    throw new Error(`Operator "${operator}" can not be used with null values`);
	}

	static singleOpWithPromise(ctx: Context, operator: string, left: JelObject | Promise<JelObject>): JelObject | Promise<JelObject> {
		return Util.resolveValue(left, (left: any)=>Runtime.singleOp(ctx, operator, left));
	}

  // checks whether the class 'left' is assignable to right
	static isClassCompatible(ctx: Context, left: any, className: string): boolean {
    if (left.name == className)
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
    else if ((right as any).iClass) 
      rightName = (right as any).name;
    else if ((right as any).isIDBRef)
      rightName = (right as any).distinctName;
    else
      return false;
    
    if (!(left as any).clazz)              // This can happen if class is not fully initialized yet
      return left.className == rightName;
    
    return Runtime.isClassCompatible(ctx, (left as any).clazz, rightName);      
	}
  
  static callMethod(ctx: Context, obj: JelObject|null, name: string, args: any[], argObj?: any, forgiving = false): JelObject|null|Promise<JelObject|null> {
    if (!obj) {
      if (forgiving)
        return null;
      throw new Error("Can't call method on null."); 
    }
    
    const m = obj.method(ctx, name);
    if (m)
      return m.invokeWithObject(obj, args, argObj);

    return Util.resolveValue(Runtime.member(ctx, obj, name), m=>{
      if (m instanceof Callable)
        return m.invokeWithObject(obj, args, argObj);
      else if (m)
        throw new Error(`'${name}' in ${obj.className} is not a method that can be called, but appears to be a different type of property.`);
      else if (name in obj) 
        throw new Error(`Can not find method ${name}() in ${obj.className}. Not mapped in native class.`);
      else 
        throw new Error(`Can not find method ${name}() in ${obj.className} ${(obj as any).isIDBRef ? '@' : ''}${(obj as any).distinctName || ''}.`);
    });
  }

  
	static member(ctx: Context, obj: JelObject|null, name: string, forgiving = false): JelObject|null|Promise<JelObject|null> {
    if (!obj) {
      if (forgiving)
        return null;
      throw new Error(`Can't get member '${name}' of null.`);
    }
    if (!obj.member)
      throw new Error(`Internal error: non-null object has no member function. Type: ${typeof obj} Ctor: ${obj.constructor.name} Object: ${obj.toString()}`);
    
    const value = obj.member(ctx, name);
    if (value !== undefined)
      return value;
    else if (name in obj) 
      throw new Error(`Can not find member '${name}' in ${obj.className}. Not mapped in native class.`);
    else 
      throw new Error(`Can not find member '${name}' in ${obj.className} ${(obj as any).isIDBRef ? '@' : ''}${(obj as any).distinctName || ''}.`);
	}
	
}

