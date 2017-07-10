'use strict';

const PatternNode = require('./patternnode.js');

class SingleMatchNode extends PatternNode {

	constructor(word, next) {
		super(next);
		this.word = word;
	}
	
	match(ctx, tokens, idx) {
		if (this.word !== tokens[idx])
			return false;
	
		return super.match(ctx, tokens, idx);
	}
	
	toString() {
		return `SingleMatchNode(word=${JSON.stringify(this.word)}) => ${this.next}`;
	}

}

module.exports = SingleMatchNode;