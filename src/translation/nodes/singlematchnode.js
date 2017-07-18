'use strict';

const PatternNode = require('./patternnode.js');

class SingleMatchNode extends PatternNode {

	constructor(word, next) {
		super(next);
		this.word = word;
	}
	
	clone() {
		return new SingleMatchNode(this.word, this.next && this.next.clone());
	}
	
	match(ctx, tokens, idx, args) {
		if (this.word != tokens[idx])
			return undefined;
		
		return this.matchNext(ctx, tokens, idx+1, args);
	}
	
	toString() {
		return `SingleMatchNode(word=${JSON.stringify(this.word)}) => ${this.next}`;
	}

}

module.exports = SingleMatchNode;