'use strict';

const PatternNode = require('./patternnode.js');

class StaticResultNode extends PatternNode {

	constructor(result) {
		super();
		this.result = result;
	}
	
	// override
	clone(newResult) {
		if (newResult)
			return newResult;
		if (this.result === true) 
			return StaticResultNode.TRUE;
		return new StaticResultNode(this.result);
	}
	
	// override
	match(ctx, tokens, idx, args) {
		if (!tokens[idx])
			return this.result;
	}
	
	// override
	toString() {
		if (this.result === true)
			return `StaticResultNode(true)`;
		return `StaticResultNode(...)`;
	}

	
	
}

StaticResultNode.TRUE = new StaticResultNode(true);

module.exports = StaticResultNode;