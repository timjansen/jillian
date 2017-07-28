'use strict';

const JelType = require('../jel/type.js');
const TokenReader = require('./tokenreader.js');

class Pattern extends JelType {
	
	constructor(tree, patternText) {
		super();
		this.tree = tree; // the PatternNode
		this.patternText = patternText;
	}
	
	// can return value or Promise!!
	match(ctx, inputOrTokens) {
		if (typeof inputOrTokens == 'string') {
			const trimmed = inputOrTokens.trim();
			return !!this.tree.match(ctx, trimmed ? trimmed.split(/\s+/g) : [], 0);
		}
		return !!this.tree.match(ctx, inputOrTokens, 0);
	}
	
	toString() {
		return `Pattern(text=\`${this.patternText}\`)`;
	}
	
}

module.exports = Pattern;