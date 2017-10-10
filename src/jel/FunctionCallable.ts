import Context from './Context';
import Callable from './Callable';
import JelType from './JelType';

/**
 * A type that can be called.
 */
export default class FunctionCallable extends Callable {
	argMapper: any;
	
	constructor(public f: Function, argMapper?: Array<string>|Object|string, public self?: any, public name?: string, public injectContext = false) {
		super();
		this.argMapper = this.convertArgMapper(argMapper);  // map argName -> index. Null if named-argument-methods
	}
	
	invokeWithObject(args: any[], argObj?: any, ctx?: Context): any {
		if (this.argMapper) {
			const allArgs = this.injectContext ? [ctx].concat(args) : Array.prototype.slice.call(args);
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
			return this.f.apply(this.self, this.injectContext ? [ctx, argObj || {}] : [argObj || {}]);
		}
	}
	
	invoke(...args: any[]): any {
		return this.invokeWithObject(args);
	}
	
	invokeWithContext(ctx: Context, ...args: any[]): any {
		return this.invokeWithObject(args, null, ctx);
	}
	
	// converts argmapper from array to object, if needed
	convertArgMapper(argMapper?: Object|Array<string>|string): Object|null {
		const offset = this.injectContext ? 1 : 0;
		if (argMapper === JelType.NAMED_ARGUMENT_METHOD)
			return null;
		else if (argMapper instanceof Array) {
			const o: any = {};
			argMapper.forEach((name,idx)=>o[name] = idx + offset);
			return o;
		}
		else
			return argMapper || {};
	}
}

