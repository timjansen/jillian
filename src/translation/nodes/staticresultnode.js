'use strict';

const PatternNode = require('./patternnode.js');

class StaticResultNode extends PatternNode {

	constructor(result) {
		super();
		this.result = result;
	}
	
	clone() {
		return new StaticResultNode(this.result);
	}
	
	match(ctx, tokens, idx, args) {
		return this.result;
	}
	
	toString() {
		return `StaticResultNode(...)`;
	}

}

module.exports = StaticResultNode;