'use strict';

const MultiNode = require('./multinode.js');

/**
 * A multi-node for Translators. They can have multiple LambdaResultNodes.
 */
class TranslatorNode extends MultiNode {

	constructor() {
		super();
		this.results = null; // null or array of LambdaResultNodes
	}

	// override
	clone(resultNode) {
		const c = new TranslatorNode();
		c.results = this.results;
		return MultiNode.copy(this, c, resultNode);
	}

	// override
	match(ctx, tokens, idx, args, modifiers) {
		const m = super.match(ctx, tokens, idx, args, modifiers);
		if (!m && this.results && !tokens[idx])
			return this.results.map(r=>r.match(ctx, tokens, idx, args, modifiers)).filter(r=>!!r);
		return m;
	}
	
	addResult(result) {
		this.results.push(result);
		return this;
	}

	
	toString() {
		return `TranslatorNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.templateNodes||[]).map(s=>s.toString()).join(',\n')}] results=[${(this.results||[]).join(', ')})`;
	}
}

module.exports = TranslatorNode;