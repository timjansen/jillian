'use strict';

const JelType = require('./type.js');
const List = require('./list.js');
const Callable = require('./callable.js');
const TranslatorNode = require('./matchNodes/translatornode.js');
const LambdaResultNode = require('./matchNodes/lambdaresultnode.js');
const StaticResultNode = require('./matchNodes/staticresultnode.js');

class Translator extends JelType {
	constructor() {
		super();
		this.tree = new TranslatorNode();
	}

	addPattern(pattern, value, metaMap) {
		pattern.tree.merge(this.tree, new LambdaResultNode(value, metaMap));
		return this;
	}
	
	// Returns Array of Matches with properties 'value' and 'meta'
	// metaFilter is an optional set of meta values that must be present in the results
	matchAsArray(ctx, input, metaFilter) {
		if (typeof input == 'string') {
			const trimmed = input.trim();
			return this.matchAsArray(ctx, trimmed ? trimmed.split(/\s+/g) : [], metaFilter);
		}
		return this.tree.match(ctx, input, 0, {}, metaFilter) || [];
	}

	match(ctx, input, metaFilter) {
		return new List(this.matchAsArray(ctx, input, metaFilter));
	}
	
	toString() {
		return `Translator(${this.tree})`;
	}
}

Translator.prototype.match_jel_mapping = {'>ctx': true, input: 1, metaFilter: 2};


module.exports = Translator;

