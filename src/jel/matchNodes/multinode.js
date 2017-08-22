'use strict';

const MatchNode = require('./matchnode.js');

class MultiNode extends MatchNode {

	constructor() {
		super();
		this.tokenMap = null;        // Map: token (string) -> next nod
		this.templateNodes = null; // Array: list of template nodes to check
		this.noMatchOption = null; // if not null, this node is  optional. If not, the next node.
	}
	
	addTokenMatch(token, nextNode) {
		if (!this.tokenMap)
			this.tokenMap = new Map();
		this.tokenMap.set(token, nextNode);
		return this;
	}

	addTemplateMatch(templateNode) {
		if (!this.templateNodes)
			this.templateNodes = [templateNode];
		else
			this.templateNodes.push(templateNode);
		return this;
	}

	// override
	match(ctx, tokens, idx, args, metaFilter, incompleteMatch) {
		const token = tokens[idx];
		if (this.tokenMap) {
			const tr = this.tokenMap.get(token);
			if (tr)
				return tr.match(ctx, tokens, idx+1, args, metaFilter, incompleteMatch);
		}
		if (this.templateNodes) {
			for (const t of this.templateNodes)  {
				const tn = t.match(ctx, tokens, idx, args, metaFilter, incompleteMatch);
				if (tn)
					return tn;
			}
		}
		return undefined;		
	}
	
	// override
	append(next) {
		if (this.tokenMap)
			for (const k of this.tokenMap.keys()) {
				const v = this.tokenMap.get(k);
				if (v)
					v.append(next);
				else
					this.tokenMap.set(k, next);
			}

		if (this.templateNodes)
			this.templateNodes.forEach(n=>n ? n.append(next) : (n.next = next));

		return this;
	}
		
	// override
	collectArgumentNames(dest) {
		if (this.tokenMap)
			for (const v of this.tokenMap.values()) 
				if (v)
					v.collectArgumentNames(dest);
				
		if (this.templateNodes)
			this.templateNodes = this.templateNodes.forEach(n=>n.collectArgumentNames(dest));

		return this;
	}
	
	toString() {
		return `MultiNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.templateNodes||[]).map(s=>s.toString()).join(',\n')}])`;
	}
}

module.exports = MultiNode;