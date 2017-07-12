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
		const noOptionMatch = this.matchNext(ctx, tokens, idx);
		if (noOptionMatch === true)
			return noOptionMatch;
		
		const optionMatch = this.matchOptions(ctx, tokens, idx);
		if (optionMatch === true || (noOptionMatch === false && optionMatch === false))
			return optionMatch;

		return Promise.all([noOptionMatch, optionMatch]).then(o=>o[0] || o[1]);
	}
	
	static findBest(option) {
		return new OptionalOptionsNode(option); // Todo: optimized node type for matching plain words 
	}
	
	toString() {
		return `OptionalOptionsNode(options=[\n    ${this.options.map(o=>o.toString()).join(",\n    ")}]) =>${this.next}`;
	}

}

module.exports = OptionalOptionsNode;
