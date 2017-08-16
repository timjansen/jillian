'use strict';

const MatchNode = require('./matchnode.js');

class StaticResultNode extends MatchNode {

	constructor(result) {
		super();
		this.result = result;
	}
	
	// override
	match(ctx, tokens, idx, args, metaFilter) {
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