'use strict';

const PatternNode = require('./patternnode.js');

class MultiOptionsNode extends PatternNode {

	constructor(options) {
		super(null);
		this.options = options;
	}
	
	addFollower(next) {
		this.options.forEach(f=>f.addFollower(next));
		return this;
	}
	
	match(ctx, tokens, idx) {
		return !!this.options.find(o=>o.match(ctx, tokens, idx));
	}
	
	static findBest(option) {
		return new MultiOptionsNode(option); // Todo: optimized node type for matching plain words 
	}
	
	toString() {
		return `MultiOptionsNode(\n    options=[${this.options.map(o=>o.toString()).join(",\n    ")}])`;
	}

}

module.exports = MultiOptionsNode;

