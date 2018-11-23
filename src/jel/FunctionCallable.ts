import BaseTypeRegistry from './BaseTypeRegistry';
import Context from './Context';
import Callable from './Callable';
import JelObject from './JelObject';

/**
 * A type that can be called.
 */
export default class FunctionCallable extends Callable {
	argMapper: any;
	
	constructor(public f: Function, argMapper?: Array<string>|Object|string, public self?: any, public name?: string) {
		super();
		this.argMapper = this.convertArgMapper(argMapper);  // map argName -> index. Null if named-argument-methods
	}
	
  rebind(self: any): FunctionCallable {
    return Object.is(this.self, self) ? this : new FunctionCallable(this.f, this.argMapper, self, this.name);
  }
 
  static invoke(ctx: Context, name: string|undefined, self: any, f: Function, args: any[], argObj?: any, argMapper?: any):  JelObject|null|Promise<JelObject|null> {
		if (argMapper) {
			const allArgs = [ctx].concat(args);
			if (argObj)
				for (const argName in argObj) {
					const idx = argMapper[argName];
					if (idx == null) {
						throw new Error(`Unknown argument name '${argName}' can not be mapped for function '${name || 'anonymous'}'.`);
					}
					allArgs[idx] = argObj[argName];
				}
			return BaseTypeRegistry.mapNativeTypes(f.apply(self, allArgs));
		}
		else {
			if (args.length)
				throw new Error(`Method only supports named arguments, but got ${args.length} anonymous argument(s).`);
			return BaseTypeRegistry.mapNativeTypes(f.apply(self, [ctx, argObj || {}]));
		}
  }
  
	invokeWithObject(ctx: Context, self: any, args: any[], argObj?: any): JelObject|null|Promise<JelObject|null> {
    return FunctionCallable.invoke(ctx, this.name, self || this.self, this.f, args, argObj, this.argMapper);
	}
	
	invoke(ctx: Context, self: any, ...args: any[]): JelObject|null|Promise<JelObject|null> {
    return FunctionCallable.invoke(ctx, this.name, self || this.self, this.f, args, null, this.argMapper);
	}
	
	// converts argmapper from array to object, if needed
	convertArgMapper(argMapper?: Object|Array<string>|string): Object|undefined {
		if (argMapper === 'named') // same as Runtime.NAMED_ARGUMENT_METHOD.
			return undefined;
		else if (argMapper instanceof Array) {
			const o: any = {};
			argMapper.forEach((name,idx)=>o[name] = idx + 1);
			return o;
		}
		else
			return argMapper || {};
	}
}

