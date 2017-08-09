'use strict';

const MultiNode = require('./multinode.js');

/**
 * A multi-node for Patterns. noMatchOption is an additional property that can either point to a result, or to another PatternNode.
 */
class PatternNode extends MultiNode {

	constructor() {
		super();
		this.noMatchOption = null; // if not null, this node is  optional. If not, the next node.
	}

	// override
	clone(resultNode) {
		const c = new PatternNode();
		c.noMatchOption = this.noMatchOption ? this.noMatchOption.clone(resultNode) : null;
		return MultiNode.copy(this, c, resultNode);
	}

	// override
	match(ctx, tokens, idx, args, modifiers) {
		const r = super.match(ctx, tokens, idx, args, modifiers);
		if (r === undefined && this.noMatchOption)
			return this.noMatchOption.match(ctx, tokens, idx, args, modifiers);
		return r;
	}
	
	makeOptional(next) {
		this.noMatchOption = next;
		return this.append(next);
	}

	
	// override
	collectArgumentNames(dest) {
		if (this.noMatchOption)
				this.noMatchOption.collectArgumentNames(dest);
			
		return super.collectArgumentNames(dest);
	}
	
	
	merge(translatorNode, resultNode) {
		if (this.tokenMap) {
			if (!translatorNode.tokenMap)
				translatorNode.tokenMap = new Map();
			for (const k of this.tokenMap.keys()) { 
				const thisV = this.tokenMap.get(k);
				const otherV = translatorNode.tokenMap.get(k);
				if (!otherV)
					translatorNode.tokenMap.set(k, PatternNode.clone(thisV, resultNode));
				else if (thisV && thisV.result === true)
					otherV.noMatchOption = resultNode;
				else
					thisV.merge(otherV, resultNode);
			}
		}
				
		if (this.templateNodes) {
			if (!translatorNode.templateNodes)
				translatorNode.templateNodes = [];
			this.templateNodes.forEach(t=>{
				const otherT = this.templateNodes.find(x=>x.equals(t));
				if (!otherT)
					translatorNode.templateNodes.push(t.clone(resultNode));
				else if (t.next && t.next.result === true)
					otherT.next.noMatchOption = resultNode;
				else
					t.next.merge(otherT.next, resultNode);
			});
		}

		if (this.noMatchOption && this.noMatchOption.result === true) 
			translatorNode.addResult(resultNode);
		else if (this.noMatchOption)
			this.noMatchOption.merge(translatorNode, resultNode);
			
		return this;
	}
	
	static clone(v, resultNode) {
		if (v)
			return v.clone();
		else 
			return v;
	}
	
	toString() {
		return `PatterNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.templateNodes||[]).map(s=>s.toString()).join(',\n')}] option=${(this.noMatchOption||'undefined').toString()})`;
	}
}

module.exports = PatternNode;