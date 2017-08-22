'use strict';

const MatchNode = require('./matchnode.js');
const JelType = require('../type.js');

const EMPTY_MAP = new Map();

class Match extends JelType {
	constructor(value, index, meta) {
		super();
		this.value = value;
		this.index = index;
		this.meta = meta || EMPTY_MAP;
	}
}

Match.prototype.JEL_PROPERTIES = {value: true, meta: true};

class LambdaResultNode extends MatchNode {

	constructor(callable, meta) {
		super();
		this.callable = callable;
		this.meta = meta; // a Map, optional
	}
	
	// override
	match(ctx, tokens, idx, args, metaFilter, incompleteMatch) {
		if (metaFilter && metaFilter.size) {
			if (!this.meta || metaFilter.size > this.meta.size)
				return undefined;
			for (const key of metaFilter.values())
				if (!this.meta.has(key))
					return undefined;
		}
		
		return new Match(this.callable.invokeWithObject([], args, ctx), idx, this.meta);
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