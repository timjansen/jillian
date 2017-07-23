'use strict';

class PatternNode {

	constructor() {
	}

	// returns the result value, or undefined if no match.
	// args is optional map. If set, TemplateNodes write their values in there
	match(ctx, tokens, idx, args) {
	}
	
	// clones the node
	clone() {
	}
	
	// appends a node or value to the end of the tree
	append(next) {
		return this;
	}
	
	// recursively writes the names of arguments in the array dest
	collectArgumentNames(dest) {
	}
	
	merge(otherNode, resultNode) {
		// TODO
	}

	toString() {
		return `PatternNode() => ${this.next}`;
	}

	static clone(v) {
		if (v === true)
			return v;
		else if (v)
			return v.clone();
		else 
			return v;
	}

	
}

module.exports = PatternNode;