'use strict';

class PatternNode {

	constructor() {
	}

	// returns the result value, or undefined if no match.
	// args is optional map. If set, TemplateNodes write their values in there
	match(ctx, tokens, idx, args) {
	}
	
	// clones the node
	clone(resultNode) {
	}
	
	// appends a node or value to the end of the tree
	append(next) {
		return this;
	}
	
	// recursively writes the names of arguments in the array dest
	collectArgumentNames(dest) {
	}
	
	// merges this node into the target node. Target must not use 'true' as node.
	merge(target, resultNode) {
		// TODO
	}

	toString() {
		return `PatternNode() => ${this.next}`;
	}



	
}

module.exports = PatternNode;