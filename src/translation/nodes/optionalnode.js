'use strict';

const PatternNode = require('./patternnode.js');

class OptionalNode extends PatternNode {

	constructor(option, next) {
		super(next);
		this.option = option;
	}
	
	addFollower(next) {
		super.addFollower(next);
		this.option.addFollower(next);
		return this;
	}
	
	match(ctx, tokens, idx) {
		return super.match(ctx, tokens, idx) || this.option.match(ctx, tokens, idx);
	}
	
	static findBest(option) {
		return new OptionalNode(option); // Todo: optimized node type for matching plain words 
	}
	
	toString() {
		return `OptionalNode(option=${this.option}) => ${this.next}`;
	}

}

module.exports = OptionalNode;

