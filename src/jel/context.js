'use strict';
/**
 * Manages the context containing all variables.
 */
class Context {

	constructor(frame = {}, parent = null, database = null) {
		this.frame = frame;
		this.parent = parent;
		this.database = database || (parent && parent.database);
	}
	
	get(name) {
		if (this.frame.hasOwnProperty(name))
				return this.frame[name];
		if (this.parent)
			return this.parent.get(name);
		throw new Error(`Unknown variable ${name}.`);
	}
}

module.exports = Context;