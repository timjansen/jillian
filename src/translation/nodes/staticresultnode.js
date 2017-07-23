'use strict';

const PatternNode = require('./patternnode.js');

class StaticResultNode extends PatternNode {

	constructor(result) {
		super();
		this.result = result;
	}
	
	// override
	clone() {
		return new StaticResultNode(this.result);
	}
	
	// override
	match(ctx, tokens, idx, args) {
		return this.result;
	}
	
	// override
	toString() {
		return `StaticResultNode(...)`;
	}

}

module.exports = StaticResultNode;