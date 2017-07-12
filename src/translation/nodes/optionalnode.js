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
		const noOptionMatch = this.matchNext(ctx, tokens, idx);
		if (noOptionMatch === true)
			return noOptionMatch;
		
		const optionMatch = this.option.match(ctx, tokens, idx);
		if (optionMatch === true || (noOptionMatch === false && optionMatch === false))
			return optionMatch;

		return Promise.all([noOptionMatch, optionMatch]).then(o=>o[0] || o[1]);
	}

	static findBest(option) {
		return new OptionalNode(option); // Todo: optimized node type for matching plain words 
	}

	toString() {
		return `OptionalNode(option=${this.option}) => ${this.next}`;
	}

}

module.exports = OptionalNode;