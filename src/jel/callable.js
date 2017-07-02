'use strict';

const NAMED_ARGUMENT_METHOD = 'named';

/**
 * A type that can be called.
 */
class Callable {
	constructor(f, argMapper, self, name, injectContext) {
		this.f = f;
		this.argMapper = this.convertArgMapper(argMapper);  // map argName -> index. Null if named-argument-methods
		this.self = self;
		this.name = name;
		this.injectContext = !!injectContext;
	}
	
	invokeWithObject(args, argObj, ctx) {
		if (this.argMapper) {
			const allArgs = this.injectContext ? [ctx].concat(args) : Array.prototype.slice.call(args);
			if (argObj)
				for (let name in argObj) {
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
	
	invoke(...args) {
		return this.invokeWithObject(args);
	}
	
	invokeWithContext(ctx, ...args) {
		return this.invokeWithObject(args, null, ctx);
	}
	
	// converts argmapper from array to object, if needed
	convertArgMapper(argMapper) {
		const offset = this.injectContext ? 1 : 0;
		if (argMapper === NAMED_ARGUMENT_METHOD)
			return null;
		else if (argMapper instanceof Array) {
			const o = {};
			argMapper.forEach((name,idx)=>o[name] = idx + offset);
			return o;
		}
		else
			return argMapper || {};
	}
}

module.exports = Callable;
