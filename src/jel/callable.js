'use strict';

/**
 * A type that can be called.
 */
class Callable {
	constructor(f, argMapper, self) {
		this.f = f;
		this.argMapper = this.convertArgMapper(argMapper);  // map argName -> index
		this.self = self;		
	}
	
	invoke(args, argObj) {
		const allArgs = Array.prototype.slice.call(args);
		for (let name in argObj) {
			const idx = this.argMapper[name];
			if (idx == null)
				throw new Error(`Unknown argument name '${name}' can not be mapped.`);
			allArgs[idx] = argObj[name];
		}
		return this.f.apply(this.self, allArgs);
	}
	
	invokeDirect(...args) {
		return this.invoke(args);
	}
	
	// converts argmapper from array to object, if needed
	convertArgMapper(argMapper) {
		if (argMapper instanceof Array) {
			const o = {};
			argMapper.forEach((name,idx)=>o[name]=idx);
			return o;
		}
		else
			return argMapper;
	}
}

module.exports = Callable;
