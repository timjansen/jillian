'use strict';

const PatternNode = require('./patternnode.js');

class OptionalOptionsNode extends PatternNode {

	constructor(options, next) {
		super(next);
		this.options = options;
	}
	
	addFollower(next) {
		super.addFollower(next);
		this.options.forEach(f=>f.addFollower(next));
		return this;
	}
	
	match(ctx, tokens, idx) {
		return super.match(ctx, tokens, idx) || !!this.options.find(o=>o.match(ctx, tokens, idx));
	}
	
	static findBest(option) {
		return new OptionalOptionsNode(option); // Todo: optimized node type for matching plain words 
	}
	
	toString() {
		return `OptionalOptionsNode(options=[\n    ${this.options.map(o=>o.toString()).join(",\n    ")}]) =>${this.next}`;
	}

}

module.exports = OptionalOptionsNode;
