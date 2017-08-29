'use strict';

const MultiNode = require('./multinode.js');
const TranslatorNode = require('./translatornode.js');

/**
 * A multi-node for Patterns. noMatchOption is an additional property that can either point to a result, or to another PatternNode.
 */
class PatternNode extends MultiNode {

	constructor() {
		super();
		this.noMatchOption = null; // if not null, this node is  optional. If not, the next node.
	}

	// override
	match(ctx, tokens, idx, metaFilter, incompleteMatch) {
		const r = super.match(ctx, tokens, idx, metaFilter, incompleteMatch);
		if (this.noMatchOption && (r === undefined || incompleteMatch))
			return this.noMatchOption.match(ctx, tokens, idx, metaFilter, incompleteMatch);
		return r;
	}
	
	makeOptional(next) {
		this.noMatchOption = next;
		return this.append(next);
	}

	merge(translatorNode, resultNode) {
		if (this.tokenMap) {
			if (!translatorNode.tokenMap)
				translatorNode.tokenMap = new Map();
			for (const k of this.tokenMap.keys()) { 
				const thisV = this.tokenMap.get(k);
				const otherV = translatorNode.tokenMap.get(k);
				if (!otherV) {
					const newTn = new TranslatorNode();
					translatorNode.tokenMap.set(k, newTn);
					thisV.merge(newTn, resultNode);
				}
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
				const otherT = translatorNode.templateNodes.find(x=>x.equals(t));
				if (!otherT)
					translatorNode.templateNodes.push(t.merge(resultNode));
				else if (t.next && t.next.result === true)
					otherT.next.noMatchOption = resultNode;
				else
					t.next.merge(otherT.next, resultNode);
			});
		}

		if (this.noMatchOption && this.noMatchOption.result === true)  {
			translatorNode.addResult(resultNode);
		}
		else if (this.noMatchOption)
			this.noMatchOption.merge(translatorNode, resultNode);
			
		return this;
	}
	
	toString() {
		return `PatterNode(tokens={${Array.from((this.tokenMap||new Map()).entries()).map(([k,v])=>k+': '+(v||'undefined').toString()).join(',\n')}} templates=[${(this.templateNodes||[]).map(s=>s.toString()).join(',\n')}] option=${(this.noMatchOption||'undefined').toString()})`;
	}
}

module.exports = PatternNode;