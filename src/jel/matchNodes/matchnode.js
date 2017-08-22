'use strict';

class MatchNode {

	constructor() {
	}

	// returns the result value, or undefined if no match.
	// ctx is the context for evaluating expressions. It also contains a template dictionary.
	// tokens is an array of tokens.
	// idx is the position in the token array.
	// args is optional object map. If set, TemplateNodes write their values in there
	// metaFilter is a optional list of strings to narrow down results. Matches must have all these results.
	// incompleteMatch is true if the input tokens do no have to match till the end of the token array
	match(ctx, tokens, idx, args, metaFilter, incompleteMatch) {
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