'use strict';

const PatternNode = require('./patternnode.js');

class OptionalNode extends PatternNode {

	constructor(option, next) {
		super(next);
		this.option = option;
	}

	clone() {
		return new OptionalNode(this.option && this.option.clone(), this.next && this.next.clone());
	}

	addFollower(next) {
		super.addFollower(next);
		this.option.addFollower(next);
		return this;
	}

	match(ctx, tokens, idx, args) {
		const noOptionMatch = this.matchNext(ctx, tokens, idx, args);
		if (noOptionMatch !== undefined)
			return noOptionMatch;
		
		const optionMatch = this.option.match(ctx, tokens, idx, args);
		if (optionMatch !== undefined || (noOptionMatch === undefined && optionMatch === undefined))
			return optionMatch;

		return Promise.all([noOptionMatch, optionMatch]).then(o=>o[0]!==undefined ? o[0] : o[1]);
	}

	static findBest(option) {
		return new OptionalNode(option); // Todo: optimized node type for matching plain words 
	}

	toString() {
		return `OptionalNode(option=${this.option}) => ${this.next}`;
	}

}

module.exports = OptionalNode;