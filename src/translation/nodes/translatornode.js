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
		const r = super.match(ctx, tokens, idx, args, modifiers);
		if (r === undefined && this.results) {
			for (const r of this.results) {
				const m = r.match(ctx, tokens, idx, args, modifiers);
				if (m !== undefined)
					return m;
			}
		}
		return r;
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