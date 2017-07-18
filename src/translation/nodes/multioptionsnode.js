'use strict';

const PatternNode = require('./patternnode.js');

class MultiOptionsNode extends PatternNode {

	constructor(options) {
		super(null);
		this.options = options;
	}
	
	clone() {
		return new MultiOptionsNode(this.options.map(n=>n.clone()));
	}

	
	addFollower(next) {
		this.endOfOptions = next; // unlike this.next, this is not used for matching, only for copying
		this.options.forEach(f=>f.addFollower(next));
		return this;
	}
	
	match(ctx, tokens, idx, args) {
		return this.matchOptions(ctx, tokens, idx, args);
	}
	
	static findBest(option) {
		return new MultiOptionsNode(option); // Todo: optimized node type for matching plain words 
	}
	
	toString() {
		return `MultiOptionsNode(\n    options=[${this.options.map(o=>o.toString()).join(",\n    ")}])`;
	}

}

module.exports = MultiOptionsNode;

