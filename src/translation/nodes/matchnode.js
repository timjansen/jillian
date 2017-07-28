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
	clone(resultNode) {
		const c = new MatchNode();
		c.tokenMap = this.tokenMap && new Map();
		if (c.tokenMap)
			for (const k of this.tokenMap.keys())
				c.tokenMap.set(k, MatchNode.clone(this.tokenMap.get(k), resultNode));
		
		c.templateNodes = this.templateNodes && this.templateNodes.map(t=>MatchNode.clone(t, resultNode));
		c.noMatchOption = MatchNode.clone(this.noMatchOption, resultNode);
		return c;
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
		if (this.tokenMap) {
			if (!otherNode.tokenMap)
				otherNode.tokenMap = new Map();
			for (const k of this.tokenMap.keys()) { 
				const thisV = this.tokenMap.get(k);
				const otherV = otherNode.tokenMap.get(k);
				if (!otherV)
					otherNode.tokenMap.set(k, MatchNode.clone(thisV, resultNode));
				else if (thisV === true)
					otherV.noMatchOption = resultNode;
				else
					thisV.merge(otherV, resultNode);
			}
		}
				
		if (this.templateNodes) {
			if (!otherNode.templateNodes)
				otherNode.templateNodes = [];
			this.templateNodes.forEach(t=>{
				const otherT = this.templateNodes.find(x=>x.equals(t));
				if (!otherT)
					otherNode.templateNodes.push(t.clone(resultNode));
				else if (t.next === true)
					otherT.next.noMatchOption = resultNode;
				else
					t.next.merge(otherT.next, resultNode);
			});
		}

		if (this.noMatchOption === true) 
			otherNode.noMatchOption = MatchNode.clone(true, resultNode);
		else if (this.noMatchOption)
			this.noMatchOption.merge(otherNode, resultNode);
			
		return this;
	}
	
	static clone(v, resultNode) {
		if (v === true)
			return new MatchNode().makeOptional(resultNode);
		else if (v)
			return v.clone();
		else 
			return v;
	}
	
	toString() {
		return `MatchNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.templateNodes||[]).map(s=>s.toString()).join(',\n')}] option=${(this.noMatchOption||'undefined').toString()})`;
	}
}

module.exports = MatchNode;