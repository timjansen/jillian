'use strict';

const JelType = require('./type.js');
const Callable = require('./callable.js');
const MatchNode = require('./matchNodes/matchnode.js');
const LambdaResultNode = require('./matchNodes/lambdaresultnode.js');
const StaticResultNode = require('./matchNodes/staticresultnode.js');


class Translator extends JelType {
	constructor() {
		super();
		this.tree = null;
	}

	addPattern(pattern, value, metaMap) {
		const resultNode = value instanceof Callable ? new LambdaResultNode(value) : new StaticResultNode(value);
		if (this.tree) {
			pattern.tree.merge(this.tree, resultNode);
		}
		else {
			this.tree = pattern.tree.clone(resultNode);
		}
	}
}

module.exports = Translator;

