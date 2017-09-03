'use strict';

const JelType = require('../type.js');

/**
 * Represents a node in a JEL expression.
 */
class JelNode extends JelType {
	// Returns either a value or a Promise for a value!
	execute(ctx) {
		throw new Error(`execute() not implemented in ${this.constructor.name}`);
	}
	
	equals(other) {
		throw new Error(`equals() not implemented in ${this.constructor.name}`);
	}
	
	// Returns always Promise for a value!
	executePromise(ctx) {
		const r = this.execute(ctx);
		if (r instanceof Promise)
			return r;
		else
			return Promise.resolve(r);
	}

}

module.exports = JelNode;
