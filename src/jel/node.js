'use strict';

const JelType = require('./type.js');

/**
 * Represents a node in a JEL expression.
 */
class JelNode extends JelType {
	execute(ctx) {
		throw new Error(`execute() not implemented in ${this.constructor.name}`);
	}
}

module.exports = JelNode;
