import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';
import Callable from './Callable';
import JelObject from './JelObject';

const emptyMap = new Map();

/**
 * A JS implementation of a function that can be called in JEL.
 */
export default class FunctionCallable extends Callable {
	argMapper: Map<string,number>;
	
	constructor(public f: Function, argMapper?: Array<string>|Map<string,number>|Object, public self?: JelObject, public name?: string) {
		super();
		this.argMapper = this.convertArgMapper(argMapper);  // map argName -> index. Null if named-argument-methods
	}
	
  rebind(self: JelObject): FunctionCallable {
    return Object.is(this.self, self) ? this : new FunctionCallable(this.f, this.argMapper, self, this.name);
  }
  
  bindParentContext(parentContext: Context): Callable {
    return this;
  }
 
  static invoke(ctx: Context, name: string|undefined, self: JelObject|undefined, f: Function, args: (JelObject|null)[], argObj: Map<string,JelObject|null>|undefined, argMapper: Map<string,number>):  JelObject|null|Promise<JelObject|null> {
    const allArgs = ([ctx] as any[]).concat(args);
    if (argObj)
      for (const argName of argObj.keys()) {
        const idx = argMapper.get(argName);
        if (idx == null)
          throw new Error(`Unknown argument name '${argName}' can not be mapped for function '${name || 'anonymous'}'.`);
        allArgs[idx] = argObj.get(argName);
      }
    return BaseTypeRegistry.mapNativeTypes(f.apply(self||null, allArgs));
  }
  
	invokeWithObject(ctx: Context, self: JelObject|undefined, args: (JelObject|null)[], argObj?: Map<string,JelObject|null>): JelObject|null|Promise<JelObject|null> {
    return FunctionCallable.invoke(ctx, this.name, self || this.self, this.f, args, argObj, this.argMapper);
	}
	
	invoke(ctx: Context, self: JelObject|undefined, ...args: (JelObject|null)[]): JelObject|null|Promise<JelObject|null> {
    return FunctionCallable.invoke(ctx, this.name, self || this.self, this.f, args, undefined, this.argMapper);
	}
	
  getArguments(): any[]|undefined {
    return undefined;
  }
  
  getReturnType(): any {
    return undefined;
  }

  
	// converts argmapper from array to object, if needed
	convertArgMapper(argMapper?: any): Map<string,number> {
		if (argMapper instanceof Array) {
			const o: any = new Map<string,number>();
			argMapper.forEach((name,idx)=>o.set(name, idx + 1));
			return o;
		}
    else if (argMapper == null )
  		return emptyMap;
    else if (argMapper instanceof Map)
      return argMapper;
    
    const m = new Map<string,number>();
    for (const name in argMapper)
      m.set(name, argMapper[name]);
    return m;
	}
}

