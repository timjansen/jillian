'use strict';

const JelType = require('./type.js');
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
	}
	
	toString() {
		return `Translator(${this.tree})`;
	}
}

module.exports = Translator;

