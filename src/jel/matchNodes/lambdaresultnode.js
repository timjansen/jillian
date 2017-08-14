'use strict';

const MatchNode = require('./matchnode.js');

class LambdaResultNode extends MatchNode {

	constructor(callable, meta) {
		super();
		this.callable = callable;
		this.meta = meta; // a Map, optional
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
		if (this.meta && this.meta.size) {
			return `LambdaResultNode(${this.callable.toString()}, meta={${Array.from(this.meta.keys()).map(k=>`${k}=${this.meta.get(k)}`).join(', ')}})`;
		}
		else
			return `LambdaResultNode(${this.callable.toString()})`;
	}
}

module.exports = LambdaResultNode;