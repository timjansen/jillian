'use strict';

const JelType = require('../jel/type.js');
const TokenReader = require('./tokenreader.js');

class Pattern extends JelType {
	
	constructor(tree, patternText) {
		super();
		this.tree = tree; // the node, or 'true' if it should match the empty string.
		this.patternText = patternText;
	}
	
	// can return value or Promise!!
	match(ctx, inputOrTokens) {
		if (typeof inputOrTokens == 'string') {
			const trimmed = inputOrTokens.trim();
			if (this.tree === true)
				return !trimmed;
			return !!this.tree.match(ctx, trimmed ? trimmed.split(/\s+/g) : [], 0);
		}
		if (this.tree === true)
			return !inputOrTokens.length;
		return !!this.tree.match(ctx, inputOrTokens, 0);
	}
	
	toString() {
		return `Pattern(text=\`${this.patternText}\`)`;
	}
	
}

module.exports = Pattern;