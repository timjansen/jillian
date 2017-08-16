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
	match(ctx, tokens, idx, args, metaFilter) {
		const m = super.match(ctx, tokens, idx, args, metaFilter);
		if (!m && this.results && !tokens[idx])
			return this.results.map(r=>r.match(ctx, tokens, idx, args, metaFilter)).filter(r=>!!r);
		return m;
	}
	
	addResult(result) {
		if (!this.results)
			this.results = [result];
		else
			this.results.push(result);
		return this;
	}

	
	toString() {
		const v = [];
		if (this.tokenMap)
			v.push(`tokens={${Array.from(this.tokenMap.entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}}`);
		if (this.templateNodes)
			v.push(`templates=[${this.templateNodes.map(s=>s.toString()).join(',\n')}]`);
		if (this.results)
			v.push(`results=[${this.results.join(', ')}]`);
		return `TranslatorNode(${v.join(' ')})`;
	}
}

module.exports = TranslatorNode;