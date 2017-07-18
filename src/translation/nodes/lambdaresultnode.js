'use strict';

const PatternNode = require('./patternnode.js');

class LambdaResultNode extends PatternNode {

	constructor(callable) {
		super();
		this.callable = callable;
	}
	
	clone() {
		return new LambdaResultNode(this.callable);
	}
	
	match(ctx, tokens, idx, args) {
		return this.callable.invokeWithObject([], args, ctx);
	}
	
	toString() {
		return `LambdaResultNode(...)`;
	}
}

module.exports = LambdaResultNode;