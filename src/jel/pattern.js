'use strict';

const JelType = require('../jel/type.js');
const TokenReader = require('./tokenreader.js');
const SingleMatchNode = require('../translation/nodes/singlematchnode.js');
const TemplateNode = require('../translation/nodes/templatenode.js');
const MultiOptionsNode = require('../translation/nodes/multioptionsnode.js');
const OptionalOptionsNode = require('../translation/nodes/optionaloptionsnode.js');
const OptionalNode = require('../translation/nodes/optionalnode.js');

class Pattern extends JelType {
	
	constructor(tree) {
		super();
		this.tree = tree
	}
	
	// can return value or Promise!!
	match(ctx, inputOrTokens) {
		if (typeof inputOrTokens == 'string') {
			const trimmed = inputOrTokens.trim();
			if (!this.tree)
				return !trimmed;
			return this.tree.match(ctx, trimmed.split(/\s+/g), 0);
		}
		if (!this.tree)
			return !inputOrTokens.length;
		return this.tree.match(ctx, inputOrTokens, 0);
	}
	
}

module.exports = Pattern;