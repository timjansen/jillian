'use strict';

class MatchNode {

	constructor() {
	}

	// returns the result value, or undefined if no match.
	// args is optional map. If set, TemplateNodes write their values in there
	// modifiers is  a list of strings to narrow down results. Matches must have all these results.
	match(ctx, tokens, idx, args, modifiers) {
	}
	
	// appends a node or value to the end of the tree
	append(next) {
		return this;
	}
	
	// recursively writes the names of arguments in the array dest
	collectArgumentNames(dest) {
	}
	
	toString() {
		return `MatchNode() => ${this.next}`;
	}



	
}

module.exports = MatchNode;