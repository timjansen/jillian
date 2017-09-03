'use strict';

class MatchNode {

	constructor() {
	}

	// returns the either the result or a list of results. Results or list members can be Promises!
	// ctx is the context for evaluating expressions. It also contains a template dictionary.
	// tokens is an array of tokens.
	// idx is the position in the token array.
	// metaFilter is a optional list of strings to narrow down results. Matches must have all these results.
	// incompleteMatch is true if the input tokens do no have to match till the end of the token array
	match(ctx, tokens, idx, metaFilter, incompleteMatch) {
	}
	
	// appends a node or value to the end of the tree
	append(next) {
		return this;
	}
	
	toString() {
		return `MatchNode() => ${this.next}`;
	}
}

module.exports = MatchNode;