'use strict';

const PatternNode = require('./patternnode.js');

class MatchNode extends PatternNode {

	constructor() {
		super();
		this.tokenMap = null;        // Map: token (string) -> next node or 'true' ('true' only in Patterns)
		this.templateNodes = null; // Array: list of template nodes to check
		this.noMatchOption = null; // if not null, this node is  optional. If not, the next node.
	}

	// override
	clone() {
		const c = new MatchNode();
		c.tokenMap = this.tokenMap && new Map();
		if (c.tokenMap)
			for (const k of this.tokenMap.keys())
				c.tokenMap.set(k, PatternNode.clone(this.tokenMap.get(k)));
		
		c.templateNodes = this.templateNodes && this.templateNodes.map(t=>PatternNode.clone(t));
		c.noMatchOption = PatternNode.clone(this.noMatchOption);
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
	match(ctx, tokens, idx, args) {
		const token = tokens[idx];
		if (this.tokenMap) {
			const tr = this.tokenMap.get(token);
			if (tr !== undefined)
				return tr === true ? (tokens[idx+1] === undefined || undefined) : tr.match(ctx, tokens, idx+1, args);
		}
		if (this.templateNodes) {
			for (const t of this.templateNodes)  {
				const tn = t.match(ctx, tokens, idx, args);
				if (tn !== undefined)
					return tn;
			}
		}
		if (this.noMatchOption === true)
			return (token === undefined && tokens[idx+1] === undefined) || undefined;
		else if (this.noMatchOption)
			return this.noMatchOption.match(ctx, tokens, idx, args);

		return undefined;		
	}
	
	// override
	append(next) {
		if (this.tokenMap)
			for (const k of this.tokenMap.keys()) {
				const v = this.tokenMap.get(k);
				if (v === true)
					this.tokenMap.set(k, next);
				else
					v.append(next);
			}

		if (this.templateNodes)
			this.templateNodes = this.templateNodes.map(n=>n === true ? next : n.append(next));

		return this;
	}
		
	makeOptional(next) {
		this.noMatchOption = next;
		return this.append(next);
	}

	
	// override
	collectArgumentNames(dest) {
		if (this.tokenMap)
			for (const v of this.tokenMap.values()) 
				if (v !== true)
					v.collectArgumentNames(dest);
				
		if (this.templateNodes)
			this.templateNodes = this.templateNodes.forEach(n=> { if (n !== true) n.collectArgumentNames(dest)});

		if (this.noMatchOption && this.noMatchOption !== true)
				this.noMatchOption.collectArgumentNames(dest);
			
		return this;
	}
	
	// override
	merge(otherNode, resultNode) {
		// TODO
	}
	
	toString() {
		return `MatchNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.templateNodes||[]).map(s=>s.toString()).join(',\n')}] option=${(this.noMatchOption||'undefined').toString()})`;
	}
}

module.exports = MatchNode;