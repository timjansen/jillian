import Context from './Context';
import Callable from './Callable';
import JelType from './JelType';

/**
 * A type that can be called.
 */
export default class FunctionCallable extends Callable {
	argMapper: any;
	
	constructor(public f: Function, argMapper?: Array<string>|Object|string, public self?: any, public name?: string) {
		super();
		this.argMapper = this.convertArgMapper(argMapper);  // map argName -> index. Null if named-argument-methods
	}
	
	invokeWithObject(ctx: Context, args: any[], argObj?: any, ): any {
		if (this.argMapper) {
			const allArgs = [ctx].concat(args);
			if (argObj)
				for (const name in argObj) {
					const idx = this.argMapper[name];
					if (idx == null){
						throw new Error(`Unknown argument name '${name}' can not be mapped for function '${this.name || 'anonymous'}'.`);
					}
					allArgs[idx] = argObj[name];
				}
			return this.f.apply(this.self, allArgs);
		}
		else {
			if (args.length)
				throw new Error(`Method only supports named arguments, but got ${args.length} anonymous argument(s).`);
			return this.f.apply(this.self, [ctx, argObj || {}]);
		}
	}
	
	invoke(ctx: Context, ...args: any[]): any {
		return this.invokeWithObject(ctx, args, null);
	}
	
	// converts argmapper from array to object, if needed
	convertArgMapper(argMapper?: Object|Array<string>|string): Object|null {
		if (argMapper === JelType.NAMED_ARGUMENT_METHOD)
			return null;
		else if (argMapper instanceof Array) {
			const o: any = {};
			argMapper.forEach((name,idx)=>o[name] = idx + 1);
			return o;
		}
		else
			return argMapper || {};
	}
}

