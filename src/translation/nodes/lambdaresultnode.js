'use strict';

const TranslationNode = require('./translationnode.js');

class LambdaResultNode extends TranslationNode {

	constructor(callable, modifiers = []) {
		super();
		this.callable = callable;
		this.modifiers = []; // a list of strings
	}
	
	// override
	clone() {
		return new LambdaResultNode(this.callable);
	}
	
	// override
	match(ctx, tokens, idx, args, modifiers = []) {
		if (this.modifiers.length) {
			for (let i = 0; i < modifiers.length; i++) {
				let found = false;
				for (let j = 0; j < this.modifiers.length; j++) {
					if (modifiers[i] === modifiers[j]) {
						found = true;
						break;
					}
				}
				if (!found)
					return;
			}
		}
		
		return this.callable.invokeWithObject([], args, ctx);
	}
	
	// override
	toString() {
		return `LambdaResultNode(...)`;
	}
}

module.exports = LambdaResultNode;