'use strict';

const JelType = require('../jel/type.js');
const Tokenizer = require('./tokenizer.js');
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
	
	match(ctx, inputOrTokens) {
		const tokens = (typeof inputOrTokens == 'string') ? inputOrTokens.remove(/^\s+|\s+$/g).split(/\s+\g/) : inputOrTokens;
		return this.tree ? this.tree.match(ctx, tokens, 0) : tokens.length === 0;
	}

	
}

module.exports = Pattern;