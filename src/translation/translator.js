'use strict';

const Callable = require('../jel/callable.js');
const LambdaResultNode = require('./nodes/lambdaresultnode.js');
const StaticResultNode = require('./nodes/staticresultnode.js');


class Translator {
	constructor(dict) {
		super();
		this.tree = null;
		this.addDictionary(dict);
	}
	
	addDictionary(dict) {
		if (dict)
			dict.forEach((k,v)=>this.addPattern(k,v));
	}
	
	addPattern(pattern, value) {
		const resultNode = value instanceof Callable ? new LambdaResultNode(value) : new StaticResultNode(value);
		if (this.tree) {
			this.tree = this.tree.merge(pattern.tree, resultNode);
		}
		else {
			this.tree = pattern.tree.clone();
			this.tree.addFollower(resultNode);
		}
	}
}

module.exports = Translator;

