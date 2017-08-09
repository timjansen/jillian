'use strict';

const MatchNode = require('./matchnode.js');

class LambdaResultNode extends MatchNode {

	constructor(callable, meta) {
		super();
		this.callable = callable;
		this.meta = meta; // a Map, optional
	}
	
	// override
	clone() {
		return new LambdaResultNode(this.callable);
	}
	
	// override
	match(ctx, tokens, idx, args, meta) {
		if (meta && meta.size) {
			if (!this.meta || meta.size > this.meta.size)
				return undefined;
			for (const key of meta.keys)
				if (!this.meta.get(key))
					return undefined;
		}
		
		return this.callable.invokeWithObject([], args, ctx);
	}
	
	// override
	toString() {
		return `LambdaResultNode(...)`;
	}
}

module.exports = LambdaResultNode;