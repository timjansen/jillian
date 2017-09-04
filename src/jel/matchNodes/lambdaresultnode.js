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

	constructor(expression, meta) {
		super();
		this.expression = expression;
		this.meta = meta; // a Map, optional
	}
	
	createMatch(result, idx) {
		if (result instanceof Promise)
			return result.then(r=>this.createMatch(r, idx));
		else
			return new Match(result, idx, this.meta);
	}
	
	// override
	match(ctx, tokens, idx, metaFilter, incompleteMatch) {
		if (metaFilter && metaFilter.size) {
			if (!this.meta || metaFilter.size > this.meta.size)
				return undefined;
			for (const key of metaFilter.values())
				if (!this.meta.has(key))
					return undefined;
		}
		return this.createMatch(this.expression.execute(ctx), idx);
	}
	
	// override
	toString() {
		if (this.meta && this.meta.size) {
			return `LambdaResultNode(${this.expression}, meta={${Array.from(this.meta.keys()).map(k=>`${k}=${this.meta.get(k)}`).join(', ')}})`;
		}
		else
			return `LambdaResultNode(${this.expression})`;
	}
}

module.exports = LambdaResultNode;