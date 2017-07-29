'use strict';

const TranslationNode = require('./translationnode.js');

class LambdaResultNode extends TranslationNode {

	constructor(callable) {
		super();
		this.callable = callable;
	}
	
	// override
	clone() {
		return new LambdaResultNode(this.callable);
	}
	
	// override
	match(ctx, tokens, idx, args) {
		return this.callable.invokeWithObject([], args, ctx);
	}
	
	// override
	toString() {
		return `LambdaResultNode(...)`;
	}
}

module.exports = LambdaResultNode;