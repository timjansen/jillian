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
			return this.match(ctx, trimmed ? trimmed.split(/\s+/g) : []);
		}
		return !!this.tree.match(ctx, inputOrTokens, 0);
	}
	
	getArgumentNames() {
		const args = [];
		this.tree.collectArgumentNames(args);
		return args;
	}
	
	toString() {
		return `Pattern(text=\`${this.patternText}\`)`;
	}
	
}

Pattern.prototype.match_jel_mapping = {'>ctx': true, input: 1};


module.exports = Pattern;