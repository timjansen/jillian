'use strict';

const PatternNode = require('./patternnode.js');

class OptionalOptionsNode extends PatternNode {

	constructor(options, next) {
		super(next);
		this.options = options;
	}
	
	clone() {
		return new OptionalOptionsNode(this.options.map(n=>n.clone()), this.next && this.next.clone());
	}
	
	addFollower(next) {
		super.addFollower(next);
		this.options.forEach(f=>f.addFollower(next));
		return this;
	}
	
	match(ctx, tokens, idx, args) {
		const noOptionMatch = this.matchNext(ctx, tokens, idx, args);
		if (noOptionMatch !== undefined)
			return noOptionMatch;
		
		const optionMatch = this.matchOptions(ctx, tokens, idx, args);
		if (optionMatch !== undefined || (noOptionMatch === undefined && optionMatch === undefined))
			return optionMatch;

		return Promise.all([noOptionMatch, optionMatch]).then(o=>o[0] !== undefined ? o[0] : o[1]);
	}
	
	static findBest(option) {
		return new OptionalOptionsNode(option); // Todo: optimized node type for matching plain words 
	}
	
	toString() {
		return `OptionalOptionsNode(options=[\n    ${this.options.map(o=>o.toString()).join(",\n    ")}]) =>${this.next}`;
	}

}

module.exports = OptionalOptionsNode;
