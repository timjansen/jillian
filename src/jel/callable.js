'use strict';

const JelType = require('./type.js');

/**
 * A type that can be called.
 */
class Callable extends JelType {
	constructor(f, argMapper, self) {
		super();
		this.f = f;
		this.argMapper = argMapper;  // map argName -> index
		this.self = self;		
	}
	
	invoke(args, argObj) {
		const a = Array.prototype.slice.call(args);
		for (let name in argObj) {
			const idx = this.argMapper[name];
			if (idx == null)
				throw new Error(`Unknown argument name '${name}' can not be mapped.`);
			a[idx] = argObj[name];
		}
		return this.f.apply(this.self, a);
	}
}

module.exports = Callable;
